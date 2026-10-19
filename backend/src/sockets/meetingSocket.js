/**
 * Real-time Socket.io signaling and collaborative events for IntellMeet AI
 */
export const configureMeetingSockets = (io) => {
  // Map of meetingCode -> Map of socketId -> participant info
  const roomParticipants = new Map();

  io.on('connection', (socket) => {
    let currentMeetingCode = null;
    let currentUser = null;

    // 1. Join Meeting Room
    socket.on('join-room', ({ meetingCode, user }) => {
      currentMeetingCode = meetingCode;
      currentUser = user || { id: socket.id, name: 'Guest', avatar: '' };

      socket.join(`meeting:${meetingCode}`);

      if (!roomParticipants.has(meetingCode)) {
        roomParticipants.set(meetingCode, new Map());
      }

      const participantsInRoom = roomParticipants.get(meetingCode);

      // Tell the new user about existing peers
      const existingPeers = Array.from(participantsInRoom.entries()).map(([id, p]) => ({
        socketId: id,
        user: p.user,
        mediaStatus: p.mediaStatus || { audio: true, video: true, screen: false },
      }));

      socket.emit('existing-participants', existingPeers);

      // Save participant in room
      participantsInRoom.set(socket.id, {
        socketId: socket.id,
        user: currentUser,
        mediaStatus: { audio: true, video: true, screen: false },
        joinedAt: new Date(),
      });

      // Notify other peers in this room
      socket.to(`meeting:${meetingCode}`).emit('user-joined', {
        socketId: socket.id,
        user: currentUser,
        mediaStatus: { audio: true, video: true, screen: false },
      });

      console.log(`[Socket] ${currentUser.name} (${socket.id}) joined meeting "${meetingCode}". Total: ${participantsInRoom.size}`);
    });

    // 2. WebRTC Signaling: Offer
    socket.on('signal-offer', ({ toSocketId, offer, fromUser }) => {
      io.to(toSocketId).emit('signal-offer', {
        fromSocketId: socket.id,
        offer,
        fromUser: fromUser || currentUser,
      });
    });

    // 3. WebRTC Signaling: Answer
    socket.on('signal-answer', ({ toSocketId, answer }) => {
      io.to(toSocketId).emit('signal-answer', {
        fromSocketId: socket.id,
        answer,
      });
    });

    // 4. WebRTC Signaling: ICE Candidate
    socket.on('signal-ice', ({ toSocketId, candidate }) => {
      io.to(toSocketId).emit('signal-ice', {
        fromSocketId: socket.id,
        candidate,
      });
    });

    // 5. In-Meeting Real-time Chat
    socket.on('send-chat', ({ meetingCode, message }) => {
      const chatItem = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        sender: currentUser || { name: 'Participant' },
        message,
        timestamp: new Date().toISOString(),
      };

      io.to(`meeting:${meetingCode}`).emit('new-chat', chatItem);
    });

    // 6. Media status toggle (Mute, Camera, Screen Share)
    socket.on('toggle-media', ({ meetingCode, mediaType, enabled }) => {
      if (meetingCode && roomParticipants.has(meetingCode)) {
        const participant = roomParticipants.get(meetingCode).get(socket.id);
        if (participant) {
          participant.mediaStatus[mediaType] = enabled;
        }
      }

      socket.to(`meeting:${meetingCode}`).emit('media-status-changed', {
        socketId: socket.id,
        mediaType,
        enabled,
      });
    });

    // 7. Live speech transcription caption broadcast
    socket.on('live-transcript-chunk', ({ meetingCode, segment }) => {
      socket.to(`meeting:${meetingCode}`).emit('live-transcript-broadcast', segment);
    });

    // 8. User Disconnect
    socket.on('disconnect', () => {
      if (currentMeetingCode && roomParticipants.has(currentMeetingCode)) {
        const participants = roomParticipants.get(currentMeetingCode);
        participants.delete(socket.id);

        if (participants.size === 0) {
          roomParticipants.delete(currentMeetingCode);
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
