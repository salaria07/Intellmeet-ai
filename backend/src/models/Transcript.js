import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema(
  {
    speaker: {
      type: String,
      required: true,
      default: 'Speaker',
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    offsetSeconds: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const transcriptSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    meetingCode: {
      type: String,
      required: true,
      index: true,
    },
    segments: [segmentSchema],
    rawText: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'en',
    },
    isLive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Transcript = mongoose.models.Transcript || mongoose.model('Transcript', transcriptSchema);
export default Transcript;
