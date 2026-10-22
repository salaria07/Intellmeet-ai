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
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getMeetingInviteUrl } from '../utils/meetingUtils';

// Standard STUN servers for WebRTC ICE candidate discovery
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

  // Meeting verification & error state
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [meetingError, setMeetingError] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [canonicalCode, setCanonicalCode] = useState(code);

  // Media states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [meetingDuration, setMeetingDuration] = useState(0);

  // Host leave confirmation modal
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  // Sidebars
  const [activeSidebar, setActiveSidebar] = useState(null); // 'chat' | 'participants' | 'ai' | null
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Remote WebRTC Peers: socketId -> { user, mediaStatus, connectionState }
  const [remotePeers, setRemotePeers] = useState({});
  // Remote Streams: socketId -> MediaStream
  const [remoteStreams, setRemoteStreams] = useState({});

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
  const iceCandidatesQueueRef = useRef(new Map()); // socketId -> candidate[]
  const recognitionRef = useRef(null);

  // 1. Join room on backend, request media, and establish Socket.io & WebRTC
  useEffect(() => {
    let timerInterval;
    let isCancelled = false;

    const setupMeeting = async () => {
      try {
        setConnectionStatus('Validating room...');

        // 1. Join room on backend with authorization check
        const joinRes = await api.post(`/meetings/${code}/join`);
        if (!joinRes.data?.success || !joinRes.data?.meeting) {
          throw new Error(joinRes.data?.message || 'Could not validate meeting session.');
        }

        const mtg = joinRes.data.meeting;
        setMeetingDetails(mtg);

        const realCode = mtg.meetingCode;
        setCanonicalCode(realCode);

        // Check if current user is the host
        const hostId = typeof mtg.host === 'object' ? mtg.host._id : mtg.host;
        const currentUserId = user?._id?.toString();
        const userIsHost = hostId && currentUserId && hostId.toString() === currentUserId;
        setIsHost(Boolean(userIsHost));

        // If accessed by MongoDB ObjectId, update route quietly to canonical code
        if (code !== realCode) {
          navigate(`/meeting/${realCode}`, { replace: true });
        }

        // 2. Request user media (Audio & Video)
        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        } catch (mediaErr) {
          console.warn('Camera+Mic access failed, attempting audio-only:', mediaErr.message);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setIsVideoOff(true);
          } catch (audioErr) {
            console.warn('Audio/video unavailable or permission denied:', audioErr.message);
            setIsVideoOff(true);
            setIsAudioMuted(true);
          }
        }

        if (isCancelled) return;

        localStreamRef.current = stream;
        if (localVideoRef.current && stream) {
          localVideoRef.current.srcObject = stream;
        }

        // 3. Connect Socket.io
        const socketServerUrl =
          import.meta.env.VITE_SOCKET_URL ||
          (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

        const socket = io(socketServerUrl, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnectionStatus('Connected to Session');
          // Join room using canonical meeting code
          socket.emit('join-room', {
            meetingCode: realCode,
            user: {
              id: user?._id || socket.id,
              name: user?.name || 'Guest User',
              avatar: user?.avatar || '',
              role: userIsHost ? 'Host' : user?.role || 'Participant',
            },
          });
        });

        // Backend room error (e.g., meeting ended, invalid)
        socket.on('meeting-error', ({ message }) => {
          setMeetingError(message || 'Meeting session is no longer accessible.');
          setConnectionStatus('Session Error');
        });

        // Meeting ended by host broadcast
        socket.on('meeting-ended', ({ message }) => {
          alert(message || 'The host has ended this meeting.');
          navigate('/meetings');
        });

        // 4. Handle existing peers in room
        socket.on('existing-participants', (existingList) => {
          const peerMap = {};
          existingList.forEach(({ socketId, user: peerUser, mediaStatus }) => {
            peerMap[socketId] = {
              user: peerUser,
              mediaStatus: mediaStatus || { audio: true, video: true, screen: false },
              connectionState: 'connecting',
            };
          });
          setRemotePeers(peerMap);

          // Initiate WebRTC offer to each existing peer
          existingList.forEach(({ socketId, user: peerUser }) => {
            initiatePeerConnection(socketId, true, peerUser, realCode);
          });
        });

        // 5. Handle new user joined room
        socket.on('user-joined', ({ socketId, user: newUser, mediaStatus }) => {
          setRemotePeers((prev) => ({
            ...prev,
            [socketId]: {
              user: newUser,
              mediaStatus: mediaStatus || { audio: true, video: true, screen: false },
              connectionState: 'connecting',
            },
          }));

          // Prepare to receive their offer
          initiatePeerConnection(socketId, false, newUser, realCode);
        });

        // 6. Handle user left room
        socket.on('user-left', ({ socketId }) => {
          setRemotePeers((prev) => {
            const copy = { ...prev };
            delete copy[socketId];
            return copy;
          });

          setRemoteStreams((prev) => {
            const copy = { ...prev };
            delete copy[socketId];
            return copy;
          });

          if (peerConnectionsRef.current.has(socketId)) {
            peerConnectionsRef.current.get(socketId).close();
            peerConnectionsRef.current.delete(socketId);
          }
          iceCandidatesQueueRef.current.delete(socketId);
        });

        // 7. WebRTC Signaling: Offer received
        socket.on('signal-offer', async ({ fromSocketId, offer, fromUser }) => {
          let pc = peerConnectionsRef.current.get(fromSocketId);
          if (!pc) {
            pc = createPeerConnection(fromSocketId, fromUser, realCode);
          }

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Process any queued ICE candidates that arrived before remoteDescription
            const queued = iceCandidatesQueueRef.current.get(fromSocketId) || [];
            for (const candidate of queued) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            iceCandidatesQueueRef.current.delete(fromSocketId);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('signal-answer', {
              meetingCode: realCode,
              toSocketId: fromSocketId,
              answer,
            });
          } catch (err) {
            console.error('Error handling WebRTC offer:', err);
          }
        });

        // 8. WebRTC Signaling: Answer received
        socket.on('signal-answer', async ({ fromSocketId, answer }) => {
          const pc = peerConnectionsRef.current.get(fromSocketId);
          if (pc) {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));

              // Process any queued ICE candidates
              const queued = iceCandidatesQueueRef.current.get(fromSocketId) || [];
              for (const candidate of queued) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              iceCandidatesQueueRef.current.delete(fromSocketId);
            } catch (err) {
              console.error('Error handling WebRTC answer:', err);
            }
          }
        });

        // 9. WebRTC Signaling: ICE Candidate received
        socket.on('signal-ice', async ({ fromSocketId, candidate }) => {
          const pc = peerConnectionsRef.current.get(fromSocketId);
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn('Error adding received ICE candidate:', err);
            }
          } else {
            // Queue candidate until remote description is set
            if (!iceCandidatesQueueRef.current.has(fromSocketId)) {
              iceCandidatesQueueRef.current.set(fromSocketId, []);
            }
            iceCandidatesQueueRef.current.get(fromSocketId).push(candidate);
          }
        });

        // 10. Peer media status toggle
        socket.on('media-status-changed', ({ socketId, mediaType, enabled }) => {
          setRemotePeers((prev) => {
            if (!prev[socketId]) return prev;
            return {
              ...prev,
              [socketId]: {
                ...prev[socketId],
                mediaStatus: {
                  ...prev[socketId].mediaStatus,
                  [mediaType]: enabled,
                },
              },
            };
          });
        });

        // 11. Live Chat
        socket.on('new-chat', (chatItem) => {
          setChatMessages((prev) => [...prev, chatItem]);
        });

        // 12. Live Speech Captions Broadcast
        socket.on('live-transcript-broadcast', (segment) => {
          setLiveTranscript(`${segment.speaker}: ${segment.text}`);
          setTranscriptHistory((prev) => [...prev, segment]);
        });

        // 13. Setup Browser Speech Recognition if supported
        setupSpeechRecognition(realCode);

        // Meeting duration timer
        timerInterval = setInterval(() => {
          setMeetingDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Meeting room initialization failed:', err);
        setMeetingError(err.message || 'Unable to join meeting session.');
        setConnectionStatus('Error');
      }
    };

    setupMeeting();

    return () => {
      isCancelled = true;
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
        socketRef.current.emit('leave-room', { meetingCode: canonicalCode });
        socketRef.current.disconnect();
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      iceCandidatesQueueRef.current.clear();
    };
  }, [code]);

  // Setup Web Speech Recognition for live captions
  const setupSpeechRecognition = (activeCode) => {
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
                meetingCode: activeCode,
                segment,
              });
            }

            // Persist to backend
            api.post(`/meetings/${activeCode}/transcript`, segment).catch(() => {});
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

  // Create real RTCPeerConnection for a target peer
  const createPeerConnection = (targetSocketId, targetUser, activeCode) => {
    const pc = new RTCPeerConnection(rtcConfig);

    // Send local audio & video tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Capture remote audio & video tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetSocketId]: event.streams[0],
        }));
      }
    };

    // Track real connection state
    pc.onconnectionstatechange = () => {
      setRemotePeers((prev) => {
        if (!prev[targetSocketId]) return prev;
        return {
          ...prev,
          [targetSocketId]: {
            ...prev[targetSocketId],
            connectionState: pc.connectionState,
          },
        };
      });
    };

    // Send local ICE candidates to target peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal-ice', {
          meetingCode: activeCode || canonicalCode,
          toSocketId: targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    peerConnectionsRef.current.set(targetSocketId, pc);
    return pc;
  };

  const initiatePeerConnection = async (targetSocketId, isOffer, targetUser, activeCode) => {
    const pc = createPeerConnection(targetSocketId, targetUser, activeCode);
    if (isOffer) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (socketRef.current) {
          socketRef.current.emit('signal-offer', {
            meetingCode: activeCode || canonicalCode,
            toSocketId: targetSocketId,
            offer,
            fromUser: {
              id: user?._id,
              name: user?.name,
              avatar: user?.avatar,
              role: isHost ? 'Host' : user?.role || 'Participant',
            },
          });
        }
      } catch (err) {
        console.error('Failed to create/send WebRTC offer:', err);
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
            meetingCode: canonicalCode,
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
            meetingCode: canonicalCode,
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
      meetingCode: canonicalCode,
      message: chatInput.trim(),
    });

    setChatInput('');
  };

  // Leave Meeting (regular participant leaves without ending)
  const handleRegularLeave = async () => {
    try {
      await api.post(`/meetings/${canonicalCode}/leave`);
    } catch (e) {
      // Ignore leave error
    }
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { meetingCode: canonicalCode });
      socketRef.current.disconnect();
    }
    navigate('/meetings');
  };

  // Host Ends Meeting for All
  const handleEndMeetingForAll = async () => {
    try {
      await api.put(`/meetings/${canonicalCode}/end`);
    } catch (err) {
      alert('Could not end meeting: ' + err.message);
      return;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/meetings');
  };

  // Leave button click dispatcher
  const onLeaveClick = () => {
    if (isHost) {
      setIsLeaveConfirmOpen(true);
    } else {
      handleRegularLeave();
    }
  };

  // Process AI Summary
  const handleProcessAISummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await api.post(`/meetings/${canonicalCode}/summary`);
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

  // Copy canonical meeting invite URL
  const handleCopyLink = () => {
    const inviteUrl = getMeetingInviteUrl(canonicalCode);
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Format seconds to mm:ss
  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remotePeerEntries = Object.entries(remotePeers);
  const totalParticipantCount = 1 + remotePeerEntries.length;

  // Render error screen if meeting does not exist or has ended
  if (meetingError) {
    return (
      <div className="fixed inset-0 z-50 bg-navy-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/10">
          <AlertCircle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Meeting Not Accessible</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          {meetingError}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/meetings')}
            className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-xs transition-colors shadow-glow-blue cursor-pointer"
          >
            Back to Meetings
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
                {canonicalCode}
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
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
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
          <div
            className={`flex-1 grid gap-4 h-full max-h-[calc(100vh-140px)] ${
              remotePeerEntries.length === 0
                ? 'grid-cols-1 md:grid-cols-2'
                : remotePeerEntries.length === 1
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
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
                {isHost && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                    Host
                  </span>
                )}
                {isAudioMuted && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </div>

            {/* If no other peers have connected yet, show waiting card */}
            {remotePeerEntries.length === 0 ? (
              <div className="rounded-3xl bg-navy-900/50 border border-slate-800/80 border-dashed relative overflow-hidden flex flex-col items-center justify-center p-8 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center mb-4 relative">
                  <Users className="w-8 h-8 text-brand-electric" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h4 className="font-bold text-white text-base mb-1">
                  Waiting for teammates to join...
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
                  Share the invitation link with others. As soon as they enter, their WebRTC video stream will connect automatically.
                </p>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-blue hover:bg-blue-600 text-white shadow-glow-blue transition-all flex items-center gap-2 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Invitation Link Copied!' : 'Copy Meeting Invite Link'}</span>
                </button>
              </div>
            ) : (
              // Connected Peer Video Tiles (Real WebRTC Streams)
              remotePeerEntries.map(([peerSocketId, peer]) => {
                const stream = remoteStreams[peerSocketId];
                const hasVideo = stream && stream.getVideoTracks().length > 0 && peer.mediaStatus?.video !== false;

                return (
                  <div
                    key={peerSocketId}
                    className="rounded-3xl bg-navy-900 border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-2xl"
                  >
                    {/* Remote Video Stream if active */}
                    {hasVideo ? (
                      <video
                        autoPlay
                        playsInline
                        ref={(el) => {
                          if (el && el.srcObject !== stream) {
                            el.srcObject = stream;
                          }
                        }}
                        className="w-full h-full object-cover rounded-3xl"
                      />
                    ) : (
                      // Avatar fallback when camera is off
                      <div className="flex flex-col items-center gap-3 text-slate-400 p-6 text-center">
                        <div className="relative">
                          <img
                            src={
                              peer.user?.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                peer.user?.name || 'Peer'
                              )}`
                            }
                            alt={peer.user?.name}
                            className="w-24 h-24 rounded-full object-cover border-2 border-brand-indigo/40 shadow-glow-indigo"
                          />
                          <span
                            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-4 ring-navy-900 ${
                              peer.connectionState === 'connected'
                                ? 'bg-emerald-400'
                                : 'bg-amber-400 animate-pulse'
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base">
                            {peer.user?.name || 'Participant'}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {peer.user?.role || 'Team Member'}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            peer.connectionState === 'connected'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : peer.connectionState === 'failed'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {peer.connectionState === 'connected'
                            ? 'WebRTC Peer Connected'
                            : peer.connectionState === 'failed'
                            ? 'Connection Failed'
                            : 'Connecting WebRTC...'}
                        </span>
                      </div>
                    )}

                    {/* Hidden audio element to guarantee remote voice playback when video is off */}
                    {!hasVideo && stream && (
                      <audio
                        autoPlay
                        ref={(el) => {
                          if (el && el.srcObject !== stream) {
                            el.srcObject = stream;
                          }
                        }}
                      />
                    )}

                    {/* Status pill bottom left */}
                    <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-2">
                      <span>{peer.user?.name || 'Participant'}</span>
                      {peer.mediaStatus?.audio === false ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
          <aside className="w-80 md:w-96 bg-navy-900 border-l border-slate-800 flex flex-col justify-between h-full z-20 animate-fadeIn">
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
                    ? `Participants (${totalParticipantCount})`
                    : 'Live AI Summary'}
                </span>
              </h3>
              <button
                onClick={() => setActiveSidebar(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
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
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
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
                        src={
                          user?.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            user?.name || 'You'
                          )}`
                        }
                        alt={user?.name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-bold text-white">{user?.name} (You)</p>
                        <p className="text-[10px] text-slate-400">
                          {isHost ? 'Host' : user?.role || 'Member'}
                        </p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active" />
                  </div>

                  {/* Connected Peers (Only Genuine Connected Peers) */}
                  {remotePeerEntries.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No other participants yet. Share the invitation link to collaborate.
                    </div>
                  ) : (
                    remotePeerEntries.map(([peerSocketId, peer]) => (
                      <div
                        key={peerSocketId}
                        className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              peer.user?.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                peer.user?.name || 'Peer'
                              )}`
                            }
                            alt={peer.user?.name}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-bold text-white">{peer.user?.name || 'Participant'}</p>
                            <p className="text-[10px] text-slate-400">
                              {peer.user?.role || 'Participant'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            peer.connectionState === 'connected'
                              ? 'bg-emerald-400'
                              : 'bg-amber-400 animate-pulse'
                          }`}
                          title={
                            peer.connectionState === 'connected'
                              ? 'Connected via WebRTC'
                              : 'Connecting...'
                          }
                        />
                      </div>
                    ))
                  )}
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
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Assignee: {item.assigneeName}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <Sparkles className="w-8 h-8 text-brand-gold mx-auto" />
                      <p className="text-xs text-slate-300">
                        Synthesize real-time transcripts and extract action items.
                      </p>
                      <button
                        onClick={handleProcessAISummary}
                        disabled={isGeneratingSummary}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-gold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
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
                  className="p-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white transition-colors cursor-pointer"
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
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
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
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
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
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-brand-blue text-white shadow-glow-blue'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="Share Screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Leave Call Button */}
          <button
            onClick={onLeaveClick}
            className="px-6 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">{isHost ? 'End / Leave' : 'Leave'}</span>
          </button>
        </div>

        {/* Right Action Icons (Chat, Participants, AI) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
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
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
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
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
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

      {/* Host Leave Confirmation Modal */}
      {isLeaveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setIsLeaveConfirmOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <PhoneOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Leave or End Meeting?</h3>
                <p className="text-xs text-slate-400">You are the host of this session</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              You can end this meeting for all participants, or leave the room while allowing others to continue collaborating.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleEndMeetingForAll}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>End Meeting for Everyone</span>
              </button>

              <button
                onClick={handleRegularLeave}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Leave Room (Keep Session Open)</span>
              </button>

              <button
                onClick={() => setIsLeaveConfirmOpen(false)}
                className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRoomPage;
