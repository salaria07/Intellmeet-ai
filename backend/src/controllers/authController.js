import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/generateToken.js';
import { memoryStore, generateId, saveDatabase } from '../utils/memoryStore.js';

// Helper to find user by email
const findUserByEmail = async (email, includePassword = false) => {
  const normalizedEmail = email.toLowerCase().trim();
  if (mongoose.connection.readyState === 1) {
    const query = User.findOne({ email: normalizedEmail });
    if (includePassword) query.select('+password');
    return await query;
  } else {
    return memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  }
};

// Helper to find user by ID
const findUserById = async (id, includePassword = false) => {
  if (mongoose.connection.readyState === 1) {
    const query = User.findById(id);
    if (includePassword) query.select('+password');
    return await query;
  } else {
    return memoryStore.users.find((u) => u._id.toString() === id.toString());
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'Member', jobTitle, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    }

    let newUser;
    if (mongoose.connection.readyState === 1) {
      newUser = await User.create({
        name,
        email,
        password,
        role,
        jobTitle: jobTitle || 'Team Member',
        department: department || 'Engineering',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1e2e6b,2563eb,6366f1`,
      });
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      newUser = {
        _id: generateId(),
        name,
        email: email.toLowerCase().trim(),
        password: passwordHash,
        role,
        jobTitle: jobTitle || 'Team Member',
        department: department || 'Engineering',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1e2e6b,2563eb,6366f1`,
        status: 'Online',
        settings: {
          theme: 'dark',
          cameraDefault: true,
          micDefault: true,
          emailNotifications: true,
          meetingReminders: true,
          soundEnabled: true,
        },
        createdAt: new Date(),
      };
      memoryStore.users.push(newUser);
      saveDatabase();
    }

    const token = generateToken(newUser._id);
    setAuthCookie(res, token);

    const userObj = newUser.toObject ? newUser.toObject() : { ...newUser };
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user & set JWT cookie
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await findUserByEmail(email, true);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let isMatch = false;
    if (user.comparePassword) {
      isMatch = await user.comparePassword(password);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Welcome back to IntellMeet AI.',
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Log user out & clear cookie
 * @access  Private
 */
export const logout = async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, jobTitle, department, avatar, settings } = req.body;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (name) user.name = name;
      if (jobTitle) user.jobTitle = jobTitle;
      if (department) user.department = department;
      if (avatar) user.avatar = avatar;
      if (settings) {
        user.settings = { ...user.settings, ...settings };
      }

      await user.save();
      const updatedUser = user.toObject();
      delete updatedUser.password;

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: updatedUser,
      });
    } else {
      const userIndex = memoryStore.users.findIndex((u) => u._id.toString() === req.user._id.toString());
      if (userIndex === -1) return res.status(404).json({ success: false, message: 'User not found' });

      const user = memoryStore.users[userIndex];
      if (name) user.name = name;
      if (jobTitle) user.jobTitle = jobTitle;
      if (department) user.department = department;
      if (avatar) user.avatar = avatar;
      if (settings) {
        user.settings = { ...user.settings, ...settings };
      }
      saveDatabase();

      const { password, ...safeUser } = user;
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: safeUser,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = await findUserById(req.user._id, true);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let isMatch = false;
    if (user.comparePassword) {
      isMatch = await user.comparePassword(currentPassword);
    } else {
      isMatch = await bcrypt.compare(currentPassword, user.password);
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    if (mongoose.connection.readyState === 1) {
      user.password = newPassword;
      await user.save();
    } else {
      user.password = await bcrypt.hash(newPassword, 10);
      saveDatabase();
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset link/token
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Return 200 with vague message to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset token has been generated.',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    if (mongoose.connection.readyState === 1) {
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = resetPasswordExpire;
      await user.save();
    } else {
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = resetPasswordExpire;
    }

    res.status(200).json({
      success: true,
      message: 'Password reset token generated.',
      resetToken, // Included for development/demo ease
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const resetToken = req.params.token;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
    } else {
      user = memoryStore.users.find(
        (u) => u.resetPasswordToken === resetPasswordToken && u.resetPasswordExpire > Date.now()
      );
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    if (mongoose.connection.readyState === 1) {
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
    } else {
      user.password = await bcrypt.hash(password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.',
      token,
    });
  } catch (error) {
    next(error);
  }
};
