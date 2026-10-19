import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['host', 'co-host', 'participant'],
      default: 'participant',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
    },
  },
  { _id: true }
);

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a meeting title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    meetingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: false,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    scheduledStartTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    scheduledEndTime: {
      type: Date,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    isInstant: {
      type: Boolean,
      default: false,
    },
    participants: [participantSchema],
    invitedEmails: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    recordingUrl: {
      type: String,
      default: '',
    },
    hasSummary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);
export default Meeting;
