import mongoose from 'mongoose';

const actionItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    assigneeName: {
      type: String,
      default: 'Unassigned',
    },
    assigneeUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    dueDate: {
      type: Date,
      required: false,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    convertedToTask: {
      type: Boolean,
      default: false,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: false,
    },
  },
  { _id: true }
);

const meetingSummarySchema = new mongoose.Schema(
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
    },
    overview: {
      type: String,
      required: true,
    },
    discussionPoints: [
      {
        type: String,
      },
    ],
    decisions: [
      {
        type: String,
      },
    ],
    takeaways: [
      {
        type: String,
      },
    ],
    unresolvedQuestions: [
      {
        type: String,
      },
    ],
    nextSteps: [
      {
        type: String,
      },
    ],
    actionItems: [actionItemSchema],
    isAIGenerated: {
      type: Boolean,
      default: true,
    },
    isDemoMode: {
      type: Boolean,
      default: false,
    },
    modelUsed: {
      type: String,
      default: 'gpt-4o-mini',
    },
  },
  {
    timestamps: true,
  }
);

const MeetingSummary =
  mongoose.models.MeetingSummary ||
  mongoose.model('MeetingSummary', meetingSummarySchema);

export default MeetingSummary;
