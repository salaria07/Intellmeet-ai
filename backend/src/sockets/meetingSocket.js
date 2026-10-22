import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';
import { memoryStore } from '../utils/memoryStore.js';

/**
 * Real-time Socket.io signaling and collaborative events for IntellMeet AI
 */
export const configureMeetingSockets = (io) => {
  // Map of canonicalMeetingCode -> Map of socketId -> participant info
  const roomParticipants = new Map();
  // Map of canonicalMeetingCode -> { socketId, user }
  const roomScreenSharers = new Map();

  io.on('connection', (socket) => {
    let currentMeetingCode = null;
    let currentUser = null;

    // 1. Join Meeting Room with server-side validation
    socket.on('join-room', async ({ meetingCode, user }) => {
      try {
        if (!meetingCode) {
          socket.emit('meeting-error', { message: 'Missing meeting room identifier.' });
          return;
        }

        let meeting = null;
        if (mongoose.connection.readyState === 1) {
          meeting = await Meeting.findOne({
            $or: [{ meetingCode }, { _id: mongoose.isValidObjectId(meetingCode) ? meetingCode : null }],
          });
        } else {
          meeting = memoryStore.meetings.find(
            (m) => m.meetingCode === meetingCode || m._id.toString() === meetingCode
          );
        }

        if (!meeting) {
          socket.emit('meeting-error', { message: 'Meeting room not found or link is invalid.' });
          return;
        }

        if (meeting.status === 'ended' || meeting.status === 'cancelled') {
          socket.emit('meeting-error', {
            message: 'This meeting has ended or is no longer accessible.',
            status: meeting.status,
          });
          return;
        }

        // Use canonical meetingCode across everything
        const canonicalCode = meeting.meetingCode;
        currentMeetingCode = canonicalCode;
        currentUser = user || { id: socket.id, name: 'Guest User', avatar: '', role: 'Participant' };

        socket.join(`meeting:${canonicalCode}`);

        if (!roomParticipants.has(canonicalCode)) {
          roomParticipants.set(canonicalCode, new Map());
        }

        const participantsInRoom = roomParticipants.get(canonicalCode);

        // Deduplicate: If this user was previously registered on another socket (e.g., reconnect/refresh), remove old socket
        for (const [sId, p] of participantsInRoom.entries()) {
          if (
            sId !== socket.id &&
            p.user?.id &&
            currentUser?.id &&
            p.user.id.toString() === currentUser.id.toString()
          ) {
            participantsInRoom.delete(sId);
          }
        }

        // Notify new user about existing peers in this exact room
        const existingPeers = Array.from(participantsInRoom.entries())
          .filter(([sId]) => sId !== socket.id)
          .map(([id, p]) => ({
            socketId: id,
            user: p.user,
            mediaStatus: p.mediaStatus || { audio: true, video: true, screen: false },
          }));

        const activeSharer = roomScreenSharers.get(canonicalCode) || null;

        // Send existing participants along with active screen sharer info
        socket.emit('existing-participants', {
          peers: existingPeers,
          activeScreenSharer: activeSharer,
        });

        // Register current socket participant in the room
        participantsInRoom.set(socket.id, {
          socketId: socket.id,
          user: currentUser,
          mediaStatus: { audio: true, video: true, screen: false },
          joinedAt: new Date(),
        });

        // Notify other peers in this room
        socket.to(`meeting:${canonicalCode}`).emit('user-joined', {
          socketId: socket.id,
          user: currentUser,
          mediaStatus: { audio: true, video: true, screen: false },
        });

        console.log(
          `[Socket] ${currentUser.name} (${socket.id}) joined room "${canonicalCode}". Active peers: ${participantsInRoom.size}`
        );
      } catch (err) {
        console.error('[Socket] join-room validation error:', err);
        socket.emit('meeting-error', { message: 'Failed to join meeting room.' });
      }
    });

    // 2. WebRTC Signaling: Offer (scoped to room & verified peers)
    socket.on('signal-offer', ({ meetingCode, toSocketId, offer, fromUser }) => {
      const code = meetingCode || currentMeetingCode;
      if (!code || !roomParticipants.has(code)) return;

      const room = roomParticipants.get(code);
      if (!room.has(socket.id) || !room.has(toSocketId)) return;

      io.to(toSocketId).emit('signal-offer', {
        meetingCode: code,
        fromSocketId: socket.id,
        offer,
        fromUser: fromUser || currentUser,
      });
    });

    // 3. WebRTC Signaling: Answer (scoped to room & verified peers)
    socket.on('signal-answer', ({ meetingCode, toSocketId, answer }) => {
      const code = meetingCode || currentMeetingCode;
      if (!code || !roomParticipants.has(code)) return;

      const room = roomParticipants.get(code);
      if (!room.has(socket.id) || !room.has(toSocketId)) return;

      io.to(toSocketId).emit('signal-answer', {
        meetingCode: code,
        fromSocketId: socket.id,
        answer,
      });
    });

    // 4. WebRTC Signaling: ICE Candidate (scoped to room & verified peers)
    socket.on('signal-ice', ({ meetingCode, toSocketId, candidate }) => {
      const code = meetingCode || currentMeetingCode;
      if (!code || !roomParticipants.has(code)) return;

      const room = roomParticipants.get(code);
      if (!room.has(socket.id) || !room.has(toSocketId)) return;

      io.to(toSocketId).emit('signal-ice', {
        meetingCode: code,
        fromSocketId: socket.id,
        candidate,
      });
    });

    // 5. Screen Sharing Coordination
    socket.on('start-screen-share', ({ meetingCode }) => {
      const code = meetingCode || currentMeetingCode;
      if (!code) return;

      const currentSharer = roomScreenSharers.get(code);
      if (currentSharer && currentSharer.socketId !== socket.id) {
        socket.emit('screen-share-rejected', {
          message: `${currentSharer.user?.name || 'Another participant'} is currently sharing their screen.`,
          currentSharer: currentSharer.user,
        });
        return;
      }

      roomScreenSharers.set(code, {
        socketId: socket.id,
        user: currentUser,
      });

      io.to(`meeting:${code}`).emit('screen-share-started', {
        socketId: socket.id,
        user: currentUser,
      });

      console.log(`[Socket] ${currentUser?.name || socket.id} started screen sharing in "${code}".`);
    });

    socket.on('stop-screen-share', ({ meetingCode }) => {
      const code = meetingCode || currentMeetingCode;
      if (!code) return;

      const currentSharer = roomScreenSharers.get(code);
      if (currentSharer && currentSharer.socketId === socket.id) {
        roomScreenSharers.delete(code);
        io.to(`meeting:${code}`).emit('screen-share-stopped', {
          socketId: socket.id,
          user: currentUser,
        });
        console.log(`[Socket] ${currentUser?.name || socket.id} stopped screen sharing in "${code}".`);
      }
    });

    // 6. In-Meeting Real-time Chat
    socket.on('send-chat', ({ meetingCode, message }) => {
      const code = meetingCode || currentMeetingCode;
      if (!code) return;

      const chatItem = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        sender: currentUser || { name: 'Participant' },
        message,
        timestamp: new Date().toISOString(),
      };

      io.to(`meeting:${code}`).emit('new-chat', chatItem);
    });

    // 7. Media status toggle (Mute, Camera, Screen Share)
    socket.on('toggle-media', ({ meetingCode, mediaType, enabled }) => {
      const code = meetingCode || currentMeetingCode;
      if (code && roomParticipants.has(code)) {
        const participant = roomParticipants.get(code).get(socket.id);
        if (participant && participant.mediaStatus) {
          participant.mediaStatus[mediaType] = enabled;
        }
      }

      if (code) {
        socket.to(`meeting:${code}`).emit('media-status-changed', {
          socketId: socket.id,
          mediaType,
          enabled,
        });
      }
    });

    // 8. Live speech transcription caption broadcast
    socket.on('live-transcript-chunk', ({ meetingCode, segment }) => {
      const code = meetingCode || currentMeetingCode;
      if (code) {
        socket.to(`meeting:${code}`).emit('live-transcript-broadcast', segment);
      }
    });

    // 9. Explicit Leave Room
    socket.on('leave-room', ({ meetingCode }) => {
      const code = meetingCode || currentMeetingCode;
      if (code && roomParticipants.has(code)) {
        const room = roomParticipants.get(code);
        room.delete(socket.id);

        // Check if this socket was sharing screen
        const currentSharer = roomScreenSharers.get(code);
        if (currentSharer && currentSharer.socketId === socket.id) {
          roomScreenSharers.delete(code);
          socket.to(`meeting:${code}`).emit('screen-share-stopped', {
            socketId: socket.id,
            user: currentUser,
          });
        }

        socket.to(`meeting:${code}`).emit('user-left', {
          socketId: socket.id,
          user: currentUser,
        });

        socket.leave(`meeting:${code}`);

        if (room.size === 0) {
          roomParticipants.delete(code);
          roomScreenSharers.delete(code);
        }

        console.log(`[Socket] ${currentUser?.name || socket.id} explicitly left meeting "${code}".`);
      }
      currentMeetingCode = null;
    });

    // 10. User Disconnect
    socket.on('disconnect', () => {
      if (currentMeetingCode && roomParticipants.has(currentMeetingCode)) {
        const room = roomParticipants.get(currentMeetingCode);
        room.delete(socket.id);

        // Check if this socket was sharing screen
        const currentSharer = roomScreenSharers.get(currentMeetingCode);
        if (currentSharer && currentSharer.socketId === socket.id) {
          roomScreenSharers.delete(currentMeetingCode);
          socket.to(`meeting:${currentMeetingCode}`).emit('screen-share-stopped', {
            socketId: socket.id,
            user: currentUser,
          });
        }

        if (room.size === 0) {
          roomParticipants.delete(currentMeetingCode);
          roomScreenSharers.delete(currentMeetingCode);
        } else {
          socket.to(`meeting:${currentMeetingCode}`).emit('user-left', {
            socketId: socket.id,
            user: currentUser,
          });
        }

        console.log(`[Socket] ${currentUser?.name || socket.id} disconnected from meeting "${currentMeetingCode}".`);
      }
    });
  });
};
