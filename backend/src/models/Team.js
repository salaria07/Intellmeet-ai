import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'Member'],
      default: 'Member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a team name'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: 'Intelligent collaboration workspace for modern distributed teams.',
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [teamMemberSchema],
    department: {
      type: String,
      default: 'Engineering & AI',
    },
    avatar: {
      type: String,
      default: '',
    },
    invitations: [
      {
        email: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
        role: {
          type: String,
          enum: ['Admin', 'Manager', 'Member'],
          default: 'Member',
        },
        status: {
          type: String,
          enum: ['Pending', 'Accepted', 'Declined'],
          default: 'Pending',
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);
export default Team;
