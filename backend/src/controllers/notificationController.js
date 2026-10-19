import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { memoryStore } from '../utils/memoryStore.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    if (mongoose.connection.readyState === 1) {
      const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(20);
      return res.status(200).json({ success: true, count: notifications.length, notifications });
    } else {
      const list = memoryStore.notifications.filter(
        (n) => n.recipient.toString() === userId || true
      );
      return res.status(200).json({ success: true, count: list.length, notifications: list });
    }
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      await Notification.findByIdAndUpdate(id, { read: true });
    } else {
      const notif = memoryStore.notifications.find((n) => n._id.toString() === id);
      if (notif) notif.read = true;
    }

    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};
