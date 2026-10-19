import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [160, 'Title cannot exceed 160 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    assigneeName: {
      type: String,
      default: 'Unassigned',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sourceMeeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: false,
    },
    sourceMeetingTitle: {
      type: String,
      default: '',
    },
    sourceMeetingCode: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Review', 'Completed'],
      default: 'To Do',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    dueDate: {
      type: Date,
      required: false,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task;
