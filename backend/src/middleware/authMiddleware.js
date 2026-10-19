import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { memoryStore } from '../utils/memoryStore.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Try to get token from HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Or from Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Please sign in.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'intellmeet_super_secret_enterprise_jwt_key_2026_xyz';
    const decoded = jwt.verify(token, secret);

    // Look up user from database or memoryStore
    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id).select('-password');
    } else {
      user = memoryStore.users.find((u) => u._id.toString() === decoded.id.toString());
      if (user) {
        const { password, ...safeUser } = user;
        user = safeUser;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Token invalid or expired.',
      error: err.message,
    });
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'Guest'}' is not authorized to perform this action. Required: [${roles.join(', ')}]`,
      });
    }
    next();
  };
};
