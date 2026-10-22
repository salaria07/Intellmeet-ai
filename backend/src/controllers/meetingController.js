import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';
import Transcript from '../models/Transcript.js';
import MeetingSummary from '../models/MeetingSummary.js';
import aiService from '../services/ai/openaiService.js';
import { memoryStore, generateId } from '../utils/memoryStore.js';

// Helper to generate readable meeting code
const generateMeetingCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const segment2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const segment3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `mtg-${segment1}-${segment2}-${segment3}`;
};

/**
 * @route   GET /api/meetings
 * @desc    Get user meetings (optional ?status=upcoming|live|past|all)
 * @access  Private
 */
export const getMeetings = async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;
    const userId = req.user._id.toString();

    if (mongoose.connection.readyState === 1) {
      let filter = {
        $or: [
          { host: userId },
          { 'participants.user': userId },
          { invitedEmails: req.user.email },
        ],
      };

      if (status === 'upcoming' || status === 'scheduled') {
        filter.status = 'scheduled';
      } else if (status === 'live') {
        filter.status = 'live';
      } else if (status === 'past' || status === 'ended') {
        filter.status = { $in: ['ended', 'cancelled'] };
      }

      const meetings = await Meeting.find(filter)
        .populate('host', 'name email avatar role')
        .sort({ scheduledStartTime: -1 })
        .limit(Number(limit));

      return res.status(200).json({ success: true, count: meetings.length, meetings });
    } else {
      let filtered = memoryStore.meetings.filter((m) => {
        const isHost = m.host.toString() === userId;
        const isParticipant = (m.participants || []).some(
          (p) => p.user && p.user.toString() === userId
        );
        return isHost || isParticipant || true; // allow visibility in demo mode
      });

      if (status === 'upcoming' || status === 'scheduled') {
        filtered = filtered.filter((m) => m.status === 'scheduled');
      } else if (status === 'live') {
        filtered = filtered.filter((m) => m.status === 'live');
      } else if (status === 'past' || status === 'ended') {
        filtered = filtered.filter((m) => m.status === 'ended' || m.status === 'cancelled');
      }

      // Sort by scheduledStartTime descending
      filtered.sort((a, b) => new Date(b.scheduledStartTime) - new Date(a.scheduledStartTime));

      return res.status(200).json({ success: true, count: filtered.length, meetings: filtered });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/meetings/:code
 * @desc    Get meeting details by code or ID
 * @access  Private
 */
export const getMeetingByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    let meeting;
    let transcript = null;
    let summary = null;

    if (mongoose.connection.readyState === 1) {
      meeting = await Meeting.findOne({
        $or: [{ meetingCode: code }, { _id: mongoose.isValidObjectId(code) ? code : null }],
      }).populate('host', 'name email avatar role jobTitle');

      if (!meeting) {
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }

      transcript = await Transcript.findOne({ meeting: meeting._id });
      summary = await MeetingSummary.findOne({ meeting: meeting._id });
    } else {
      meeting = memoryStore.meetings.find(
        (m) => m.meetingCode === code || m._id.toString() === code
      );

      if (!meeting) {
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }

      transcript = memoryStore.transcripts.find(
        (t) => t.meeting.toString() === meeting._id.toString() || t.meetingCode === meeting.meetingCode
      );
      summary = memoryStore.summaries.find(
        (s) => s.meeting.toString() === meeting._id.toString() || s.meetingCode === meeting.meetingCode
      );
    }

    res.status(200).json({
      success: true,
      meeting,
      transcript,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/meetings/instant
 * @desc    Create an instant meeting
 * @access  Private
 */
export const createInstantMeeting = async (req, res, next) => {
  try {
    const { title = 'Quick Sync' } = req.body;
    const meetingCode = generateMeetingCode();
    const hostUser = req.user;

    const newMeetingData = {
      title,
      description: 'Instant ad-hoc collaboration room created by ' + hostUser.name,
      meetingCode,
      host: hostUser._id,
      status: 'live',
      scheduledStartTime: new Date(),
      actualStartTime: new Date(),
      durationMinutes: 45,
      isInstant: true,
      participants: [
        {
          _id: generateId(),
          user: hostUser._id,
          name: hostUser.name,
          email: hostUser.email,
          avatar: hostUser.avatar,
          role: 'host',
          joinedAt: new Date(),
        },
      ],
      hasSummary: false,
    };

    let createdMeeting;
    if (mongoose.connection.readyState === 1) {
      createdMeeting = await Meeting.create(newMeetingData);
      await createdMeeting.populate('host', 'name email avatar role');
    } else {
      createdMeeting = {
        _id: generateId(),
        ...newMeetingData,
        createdAt: new Date(),
      };
      memoryStore.meetings.unshift(createdMeeting);
    }

    res.status(201).json({
      success: true,
      message: 'Instant meeting room created successfully.',
      meeting: createdMeeting,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/meetings/schedule
 * @desc    Schedule a future meeting
 * @access  Private
 */
export const scheduleMeeting = async (req, res, next) => {
  try {
    const { title, description, scheduledStartTime, scheduledEndTime, durationMinutes = 45, invitedEmails = [] } = req.body;

    if (!title || !scheduledStartTime) {
      return res.status(400).json({ success: false, message: 'Please provide meeting title and scheduled start time.' });
    }

    const meetingCode = generateMeetingCode();
    const hostUser = req.user;

    const meetingData = {
      title,
      description: description || '',
      meetingCode,
      host: hostUser._id,
      status: 'scheduled',
      scheduledStartTime: new Date(scheduledStartTime),
      scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : new Date(new Date(scheduledStartTime).getTime() + durationMinutes * 60000),
      durationMinutes: Number(durationMinutes),
      isInstant: false,
      invitedEmails: Array.isArray(invitedEmails) ? invitedEmails : [],
      participants: [
        {
          _id: generateId(),
          user: hostUser._id,
          name: hostUser.name,
          email: hostUser.email,
          avatar: hostUser.avatar,
          role: 'host',
          joinedAt: new Date(),
        },
      ],
      hasSummary: false,
    };

    let scheduled;
    if (mongoose.connection.readyState === 1) {
      scheduled = await Meeting.create(meetingData);
      await scheduled.populate('host', 'name email avatar role');
    } else {
      scheduled = {
        _id: generateId(),
        ...meetingData,
        createdAt: new Date(),
      };
      memoryStore.meetings.unshift(scheduled);
    }

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully.',
      meeting: scheduled,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/meetings/:code/join
 * @desc    Join a meeting room
 * @access  Private
 */
export const joinMeeting = async (req, res, next) => {
  try {
    const { code } = req.params;
    const user = req.user;

    let meeting;
    if (mongoose.connection.readyState === 1) {
      meeting = await Meeting.findOne({
        $or: [{ meetingCode: code }, { _id: mongoose.isValidObjectId(code) ? code : null }],
      }).populate('host', 'name email avatar role');

      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });

      // Reject joins if meeting has ended or was cancelled
      if (meeting.status === 'ended' || meeting.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'This meeting has ended or is no longer accessible.',
          status: meeting.status,
        });
      }

      // Check if user already in participants
      const existing = meeting.participants.find(
        (p) => p.user && p.user.toString() === user._id.toString()
      );

      if (!existing) {
        meeting.participants.push({
          user: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: meeting.host._id.toString() === user._id.toString() ? 'host' : 'participant',
          joinedAt: new Date(),
          leftAt: null,
        });
      } else {
        existing.leftAt = null; // Re-joining
        existing.name = user.name;
        existing.avatar = user.avatar;
      }

      if (meeting.status === 'scheduled') {
        meeting.status = 'live';
        meeting.actualStartTime = meeting.actualStartTime || new Date();
      }

      await meeting.save();
    } else {
      meeting = memoryStore.meetings.find(
        (m) => m.meetingCode === code || m._id.toString() === code
      );

      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });

      // Reject joins if meeting has ended or was cancelled
      if (meeting.status === 'ended' || meeting.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'This meeting has ended or is no longer accessible.',
          status: meeting.status,
        });
      }

      const existing = (meeting.participants || []).find(
        (p) => p.user && p.user.toString() === user._id.toString()
      );

      if (!existing) {
        meeting.participants = meeting.participants || [];
        meeting.participants.push({
          _id: generateId(),
          user: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: meeting.host.toString() === user._id.toString() ? 'host' : 'participant',
          joinedAt: new Date(),
          leftAt: null,
        });
      } else {
        existing.leftAt = null;
        existing.name = user.name;
        existing.avatar = user.avatar;
      }

      if (meeting.status === 'scheduled') {
        meeting.status = 'live';
        meeting.actualStartTime = meeting.actualStartTime || new Date();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Joined meeting room successfully.',
      meeting,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/meetings/:code/leave
 * @desc    Leave a meeting room without ending it for others
 * @access  Private
 */
export const leaveMeeting = async (req, res, next) => {
  try {
    const { code } = req.params;
    const user = req.user;

    let meeting;
    if (mongoose.connection.readyState === 1) {
      meeting = await Meeting.findOne({
        $or: [{ meetingCode: code }, { _id: mongoose.isValidObjectId(code) ? code : null }],
      });

      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      const participant = meeting.participants.find(
        (p) => p.user && p.user.toString() === user._id.toString()
      );
      if (participant) {
        participant.leftAt = new Date();
      }
      await meeting.save();
    } else {
      meeting = memoryStore.meetings.find(
        (m) => m.meetingCode === code || m._id.toString() === code
      );

      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      const participant = (meeting.participants || []).find(
        (p) => p.user && p.user.toString() === user._id.toString()
      );
      if (participant) {
        participant.leftAt = new Date();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Left meeting successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/meetings/:code/end
 * @desc    End a live meeting (Authorized host or Admin only)
 * @access  Private
 */
export const endMeeting = async (req, res, next) => {
  try {
    const { code } = req.params;

    let meeting;
    if (mongoose.connection.readyState === 1) {
      meeting = await Meeting.findOne({
        $or: [{ meetingCode: code }, { _id: mongoose.isValidObjectId(code) ? code : null }],
      });

      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      const isHost = meeting.host.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'Admin';
      if (!isHost && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the meeting host or an administrator can end the meeting for everyone.',
        });
      }

      meeting.status = 'ended';
      meeting.actualEndTime = new Date();
      if (meeting.actualStartTime) {
        meeting.durationMinutes = Math.max(
          1,
          Math.round((meeting.actualEndTime - meeting.actualStartTime) / 60000)
        );
      }
      await meeting.save();
    } else {
      meeting = memoryStore.meetings.find(
        (m) => m.meetingCode === code || m._id.toString() === code
      );

      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      const isHost = meeting.host.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'Admin';
      if (!isHost && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the meeting host or an administrator can end the meeting for everyone.',
        });
      }

      meeting.status = 'ended';
      meeting.actualEndTime = new Date();
      if (meeting.actualStartTime) {
        meeting.durationMinutes = Math.max(
          1,
          Math.round((new Date(meeting.actualEndTime) - new Date(meeting.actualStartTime)) / 60000)
        );
      }
    }

    // Broadcast meeting-ended event to all connected sockets in this room
    const io = req.app?.get('io');
    if (io) {
      io.to(`meeting:${meeting.meetingCode}`).emit('meeting-ended', {
        meetingCode: meeting.meetingCode,
        message: 'The host has ended this meeting.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting ended successfully.',
      meeting,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/meetings/:id
 * @desc    Cancel scheduled meeting
 * @access  Private
 */
export const cancelMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const meeting = await Meeting.findById(id);
      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      // Permission check: only host or Admin can cancel
      if (meeting.host.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to cancel this meeting.' });
      }

      meeting.status = 'cancelled';
      await meeting.save();
      return res.status(200).json({ success: true, message: 'Meeting cancelled.', meeting });
    } else {
      const meeting = memoryStore.meetings.find((m) => m._id.toString() === id || m.meetingCode === id);
      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      meeting.status = 'cancelled';
      return res.status(200).json({ success: true, message: 'Meeting cancelled.', meeting });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/meetings/:code/transcript
 * @desc    Append real-time transcript segment
 * @access  Private
 */
export const addTranscriptSegment = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { speaker, text, offsetSeconds = 0 } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Segment text is required' });
    }

    const speakerName = speaker || req.user.name;

    if (mongoose.connection.readyState === 1) {
      const meeting = await Meeting.findOne({ meetingCode: code });
      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      let transcript = await Transcript.findOne({ meeting: meeting._id });
      if (!transcript) {
        transcript = new Transcript({
          meeting: meeting._id,
          meetingCode: code,
          segments: [],
          rawText: '',
          isLive: true,
        });
      }

      const segment = {
        speaker: speakerName,
        text,
        timestamp: new Date(),
        offsetSeconds,
      };

      transcript.segments.push(segment);
      transcript.rawText = (transcript.rawText ? transcript.rawText + '\n' : '') + `${speakerName}: ${text}`;
      await transcript.save();

      return res.status(201).json({ success: true, segment, transcript });
    } else {
      let transcript = memoryStore.transcripts.find((t) => t.meetingCode === code);
      if (!transcript) {
        transcript = {
          _id: generateId(),
          meeting: code,
          meetingCode: code,
          segments: [],
          rawText: '',
          isLive: true,
          createdAt: new Date(),
        };
        memoryStore.transcripts.push(transcript);
      }

      const segment = {
        _id: generateId(),
        speaker: speakerName,
        text,
        timestamp: new Date(),
        offsetSeconds,
      };

      transcript.segments.push(segment);
      transcript.rawText = (transcript.rawText ? transcript.rawText + '\n' : '') + `${speakerName}: ${text}`;

      return res.status(201).json({ success: true, segment, transcript });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/meetings/:code/summary
 * @desc    Generate AI meeting summary and extract action items
 * @access  Private
 */
export const generateSummary = async (req, res, next) => {
  try {
    const { code } = req.params;

    let meeting;
    let transcript;

    if (mongoose.connection.readyState === 1) {
      meeting = await Meeting.findOne({ meetingCode: code });
      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      transcript = await Transcript.findOne({ meeting: meeting._id });
    } else {
      meeting = memoryStore.meetings.find((m) => m.meetingCode === code || m._id.toString() === code);
      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      transcript = memoryStore.transcripts.find(
        (t) => t.meetingCode === code || t.meeting.toString() === meeting._id.toString()
      );
    }

    const transcriptText = transcript?.rawText || (transcript?.segments || []).map((s) => `${s.speaker}: ${s.text}`).join('\n') || '';

    // Invoke AI Service
    const aiResult = await aiService.generateMeetingSummary({
      meetingTitle: meeting.title,
      transcriptText,
      participants: meeting.participants || [],
    });

    const summaryPayload = {
      meeting: meeting._id,
      meetingCode: meeting.meetingCode,
      overview: aiResult.overview,
      discussionPoints: aiResult.discussionPoints || [],
      decisions: aiResult.decisions || [],
      takeaways: aiResult.takeaways || [],
      unresolvedQuestions: aiResult.unresolvedQuestions || [],
      nextSteps: aiResult.nextSteps || [],
      actionItems: (aiResult.actionItems || []).map((item) => ({
        ...item,
        _id: generateId(),
        convertedToTask: false,
      })),
      isAIGenerated: aiResult.isAIGenerated,
      isDemoMode: aiResult.isDemoMode,
      modelUsed: aiResult.modelUsed,
      demoNotice: aiResult.demoNotice,
    };

    let savedSummary;
    if (mongoose.connection.readyState === 1) {
      // Remove any prior summary for this meeting to update fresh
      await MeetingSummary.deleteMany({ meeting: meeting._id });
      savedSummary = await MeetingSummary.create(summaryPayload);
      meeting.hasSummary = true;
      await meeting.save();
    } else {
      memoryStore.summaries = memoryStore.summaries.filter(
        (s) => s.meeting.toString() !== meeting._id.toString() && s.meetingCode !== meeting.meetingCode
      );
      savedSummary = {
        _id: generateId(),
        ...summaryPayload,
        createdAt: new Date(),
      };
      memoryStore.summaries.push(savedSummary);
      meeting.hasSummary = true;
    }

    res.status(200).json({
      success: true,
      message: savedSummary.isDemoMode
        ? 'AI summary generated in Demo Mode.'
        : 'AI meeting summary generated successfully via OpenAI.',
      summary: savedSummary,
    });
  } catch (error) {
    next(error);
  }
};
