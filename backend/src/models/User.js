import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'Member'],
      default: 'Member',
    },
    avatar: {
      type: String,
      default: '',
    },
    jobTitle: {
      type: String,
      default: 'Team Member',
      trim: true,
    },
    department: {
      type: String,
      default: 'Product & Engineering',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Online', 'Away', 'In Meeting', 'Offline'],
      default: 'Online',
    },
    settings: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      cameraDefault: { type: Boolean, default: true },
      micDefault: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      meetingReminders: { type: Boolean, default: true },
      soundEnabled: { type: Boolean, default: true },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
