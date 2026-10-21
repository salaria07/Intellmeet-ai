import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  Users,
  Sparkles,
  Settings,
  Shield,
  Copy,
  Check,
  Send,
  Radio,
  FileText,
  Volume2,
  Maximize2,
  Minimize2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Public STUN servers for WebRTC ICE candidate discovery
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const MeetingRoomPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Media states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [meetingDuration, setMeetingDuration] = useState(0);

  // Sidebars
  const [activeSidebar, setActiveSidebar] = useState(null); // 'chat' | 'participants' | 'ai' | null
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Live Transcription & AI
  const [liveTranscript, setLiveTranscript] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState(null);

  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const recognitionRef = useRef(null);

  // Initialize meeting room, socket, media, and WebRTC
  useEffect(() => {
    let timerInterval;

    const setupMeeting = async () => {
      try {
        // 1. Join room on backend
        const joinRes = await api.post(`/meetings/${code}/join`);
        if (joinRes.data?.success && joinRes.data?.meeting) {
          setMeetingDetails(joinRes.data.meeting);
        }

        // 2. Request user media (Audio & Video)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (mediaErr) {
          console.warn('Could not access real camera/mic:', mediaErr.message);
          setIsVideoOff(true);
        }

        // 3. Connect Socket.io
        const socketServerUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
        const socket = io(socketServerUrl, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnectionStatus('Connected (WebRTC & Socket)');
          // Emit join-room
          socket.emit('join-room', {
            meetingCode: code,
            user: {
              id: user?._id || socket.id,
              name: user?.name || 'Guest User',
              avatar: user?.avatar || '',
              role: user?.role || 'Member',
            },
          });
        });

        // 4. Handle existing participants in room
        socket.on('existing-participants', (existingList) => {
          setParticipants(existingList.map((p) => p.user));

          // Initiate WebRTC offer to each existing peer
          existingList.forEach(({ socketId }) => {
            initiatePeerConnection(socketId, true);
          });
        });

        // 5. Handle new user joined
        socket.on('user-joined', ({ socketId, user: newUser }) => {
          setParticipants((prev) => [...prev.filter((p) => p.id !== newUser.id), newUser]);
          initiatePeerConnection(socketId, false);
        });

        // 6. Handle user left
        socket.on('user-left', ({ socketId, user: leftUser }) => {
          setParticipants((prev) => prev.filter((p) => p.id !== leftUser?.id));
          if (peerConnectionsRef.current.has(socketId)) {
            peerConnectionsRef.current.get(socketId).close();
            peerConnectionsRef.current.delete(socketId);
          }
        });

        // 7. WebRTC Signaling: Offer received
        socket.on('signal-offer', async ({ fromSocketId, offer, fromUser }) => {
          let pc = peerConnectionsRef.current.get(fromSocketId);
          if (!pc) {
            pc = createPeerConnection(fromSocketId);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('signal-answer', {
            toSocketId: fromSocketId,
            answer,
          });
        });

        // 8. WebRTC Signaling: Answer received
        socket.on('signal-answer', async ({ fromSocketId, answer }) => {
          const pc = peerConnectionsRef.current.get(fromSocketId);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        // 9. WebRTC Signaling: ICE Candidate received
        socket.on('signal-ice', async ({ fromSocketId, candidate }) => {
          const pc = peerConnectionsRef.current.get(fromSocketId);
          if (pc && candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn('Error adding received ICE candidate:', err);
            }
          }
        });

        // 10. Live Chat
        socket.on('new-chat', (chatItem) => {
          setChatMessages((prev) => [...prev, chatItem]);
        });

        // 11. Live Speech Captions Broadcast
        socket.on('live-transcript-broadcast', (segment) => {
          setLiveTranscript(`${segment.speaker}: ${segment.text}`);
          setTranscriptHistory((prev) => [...prev, segment]);
        });

        // 12. Setup Browser Speech Recognition if supported
        setupSpeechRecognition();

        // Start timer
        timerInterval = setInterval(() => {
          setMeetingDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Meeting room initialization failed:', err);
        setConnectionStatus('Connection Error');
      }
    };

    setupMeeting();

    return () => {
      clearInterval(timerInterval);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [code]);

  // Setup Web Speech Recognition for live captions
  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const result = event.results[event.results.length - 1];
          const text = result[0].transcript;

          if (result.isFinal) {
            const segment = {
              speaker: user?.name || 'Speaker',
              text: text.trim(),
              timestamp: new Date().toISOString(),
            };

            setLiveTranscript(`${segment.speaker}: ${segment.text}`);
            setTranscriptHistory((prev) => [...prev, segment]);

            // Broadcast to other peers
            if (socketRef.current) {
              socketRef.current.emit('live-transcript-chunk', {
                meetingCode: code,
                segment,
              });
            }

            // Persist to backend
            api.post(`/meetings/${code}/transcript`, segment).catch(() => {});
          } else {
            setLiveTranscript(`${user?.name || 'Speaker'} (speaking...): ${text}`);
          }
        };

        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition not available:', err);
      }
    }
  };

  const createPeerConnection = (targetSocketId) => {
    const pc = new RTCPeerConnection(rtcConfig);

    // Send local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal-ice', {
          toSocketId: targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    peerConnectionsRef.current.set(targetSocketId, pc);
    return pc;
  };

  const initiatePeerConnection = async (targetSocketId, isOffer) => {
    const pc = createPeerConnection(targetSocketId);
    if (isOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socketRef.current) {
        socketRef.current.emit('signal-offer', {
          toSocketId: targetSocketId,
          offer,
          fromUser: {
            id: user?._id,
            name: user?.name,
            avatar: user?.avatar,
          },
        });
      }
    }
  };

  // Toggle Microphone
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);

        if (socketRef.current) {
          socketRef.current.emit('toggle-media', {
            meetingCode: code,
            mediaType: 'audio',
            enabled: audioTrack.enabled,
          });
        }
      }
    } else {
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);

        if (socketRef.current) {
          socketRef.current.emit('toggle-media', {
            meetingCode: code,
            mediaType: 'video',
            enabled: videoTrack.enabled,
          });
        }
      }
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;

        // Replace track in peer connections
        const screenTrack = stream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
      });
    }
    setIsScreenSharing(false);
  };

  // Send Chat message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit('send-chat', {
      meetingCode: code,
      message: chatInput.trim(),
    });

    setChatInput('');
  };

  // Leave / End Meeting
  const handleLeaveMeeting = async () => {
    try {
      await api.put(`/meetings/${code}/end`);
    } catch (e) {
      // Ignore leave error
    }
    navigate('/meetings');
  };

  // Process AI Summary
  const handleProcessAISummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await api.post(`/meetings/${code}/summary`);
      if (res.data?.success && res.data?.summary) {
        setGeneratedSummary(res.data.summary);
        setActiveSidebar('ai');
      }
    } catch (err) {
      alert('Error generating summary: ' + err.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Copy meeting link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Format seconds to mm:ss
  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Meeting Control Bar */}
      <header className="h-16 px-6 bg-navy-900/90 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center shadow-glow-blue">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
              Intell<span className="text-brand-electric">Meet</span> AI
            </span>
          </Link>

          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white truncate max-w-xs sm:max-w-md">
                {meetingDetails?.title || 'Live Collaboration Session'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-blue/20 text-brand-electric border border-brand-blue/30 hidden md:inline">
                {code}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {connectionStatus}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-300">{formatDuration(meetingDuration)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Meeting Link */}
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedCode ? 'Link Copied' : 'Invite'}</span>
          </button>

          {/* Process AI Summary Button */}
          <button
            onClick={handleProcessAISummary}
            disabled={isGeneratingSummary}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-glow-gold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {isGeneratingSummary ? 'Processing AI...' : 'Process AI Summary'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Video Grid & Sidebar Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center: Video Conference Stage */}
        <div className="flex-1 flex flex-col p-4 relative overflow-hidden bg-navy-950">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[calc(100vh-140px)]">
            {/* Local Stream Window */}
            <div className="rounded-3xl bg-navy-900 border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-2xl group">
              {isVideoOff ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <img
                    src={
                      user?.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        user?.name || 'You'
                      )}`
                    }
                    alt={user?.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-brand-blue/40 shadow-glow-blue"
                  />
                  <div className="text-center">
                    <p className="font-bold text-white text-base">{user?.name} (You)</p>
                    <p className="text-xs text-slate-400">Camera is muted</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-3xl -scale-x-100"
                />
              )}

              {/* Status pill bottom left */}
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-2">
                <span>{user?.name} (You)</span>
                {isAudioMuted && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </div>

            {/* Peer / Collaborative Video Window */}
            <div className="rounded-3xl bg-navy-900 border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-2xl">
              <div className="flex flex-col items-center gap-3 text-slate-400 p-6 text-center">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80"
                    alt="David Chen"
                    className="w-24 h-24 rounded-full object-cover border-2 border-brand-indigo/40 shadow-glow-indigo"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-navy-900" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">David Chen</h4>
                  <p className="text-xs text-slate-400">AI Architect • Core Team</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-brand-blue/15 text-brand-electric border border-brand-blue/30">
                  WebRTC Peer Active
                </span>
              </div>

              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-2">
                <span>David Chen</span>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Live Speech Captions Bar (Bottom of Video Stage) */}
          {liveTranscript && (
            <div className="mt-3 p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-brand-blue/30 text-xs text-slate-200 flex items-center gap-3 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-brand-electric animate-pulse flex-shrink-0" />
              <p className="font-medium truncate">{liveTranscript}</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Chat, Participants, or AI Summary */}
        {activeSidebar && (
          <aside className="w-80 md:w-96 bg-navy-900 border-l border-slate-800 flex flex-col justify-between h-full z-20">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white capitalize flex items-center gap-2">
                {activeSidebar === 'chat' && <MessageSquare className="w-4 h-4 text-brand-electric" />}
                {activeSidebar === 'participants' && <Users className="w-4 h-4 text-brand-blue" />}
                {activeSidebar === 'ai' && <Sparkles className="w-4 h-4 text-brand-gold" />}
                <span>
                  {activeSidebar === 'chat'
                    ? 'In-Meeting Chat'
                    : activeSidebar === 'participants'
                    ? `Participants (${participants.length + 1})`
                    : 'Live AI Summary'}
                </span>
              </h3>
              <button
                onClick={() => setActiveSidebar(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Sidebar Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeSidebar === 'chat' && (
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-8">
                      No messages yet. Send a chat message to everyone in the room.
                    </p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold text-brand-electric">{msg.sender.name}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-200">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSidebar === 'participants' && (
                <div className="space-y-2">
                  {/* Current User */}
                  <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'You')}`}
                        alt={user?.name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-bold text-white">{user?.name} (You)</p>
                        <p className="text-[10px] text-slate-400">{user?.role || 'Host'}</p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>

                  {/* Connected Peers */}
                  <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80"
                        alt="David Chen"
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-bold text-white">David Chen</p>
                        <p className="text-[10px] text-slate-400">Co-Host</p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>
              )}

              {activeSidebar === 'ai' && (
                <div className="space-y-4">
                  {generatedSummary ? (
                    <div className="space-y-3">
                      {generatedSummary.demoNotice && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                          {generatedSummary.demoNotice}
                        </div>
                      )}

                      <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Meeting Overview
                        </h4>
                        <p className="text-xs text-slate-200 leading-relaxed bg-navy-950 p-3 rounded-xl border border-slate-800">
                          {generatedSummary.overview}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-bold text-brand-electric uppercase tracking-wider mb-1">
                          Extracted Action Items
                        </h4>
                        <div className="space-y-1.5">
                          {(generatedSummary.actionItems || []).map((item, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs">
                              <p className="font-semibold text-white">{item.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Assignee: {item.assigneeName}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <Sparkles className="w-8 h-8 text-brand-gold mx-auto" />
                      <p className="text-xs text-slate-300">Click below to synthesize speech transcripts and extract action items.</p>
                      <button
                        onClick={handleProcessAISummary}
                        disabled={isGeneratingSummary}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-gold text-slate-950 hover:bg-amber-400 transition-colors"
                      >
                        {isGeneratingSummary ? 'Analyzing...' : 'Generate Now'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input Footer */}
            {activeSidebar === 'chat' && (
              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl glass-input text-xs"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Meeting Controls Bar */}
      <footer className="h-20 bg-navy-900 border-t border-slate-800/80 px-6 flex items-center justify-between z-20 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Encrypted WebRTC Channel</span>
        </div>

        {/* Center Media Controls */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          {/* Mute Mic */}
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isAudioMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/10'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Camera Toggle */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isVideoOff
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/10'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-brand-blue text-white shadow-glow-blue'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="Share Screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Leave Call */}
          <button
            onClick={handleLeaveMeeting}
            className="px-6 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        {/* Right Action Icons (Chat, Participants, AI) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
            className={`p-3 rounded-2xl border transition-all ${
              activeSidebar === 'chat'
                ? 'bg-brand-blue text-white border-brand-blue shadow-glow-blue'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
            className={`p-3 rounded-2xl border transition-all ${
              activeSidebar === 'participants'
                ? 'bg-brand-blue text-white border-brand-blue shadow-glow-blue'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Participants"
          >
            <Users className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveSidebar(activeSidebar === 'ai' ? null : 'ai')}
            className={`p-3 rounded-2xl border transition-all ${
              activeSidebar === 'ai'
                ? 'bg-brand-gold text-slate-950 border-brand-gold shadow-glow-gold'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-brand-gold border-amber-500/30'
            }`}
            title="Toggle AI Intelligence"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MeetingRoomPage;
