import mongoose from 'mongoose';
import Task from '../models/Task.js';
import MeetingSummary from '../models/MeetingSummary.js';
import User from '../models/User.js';
import { memoryStore, generateId } from '../utils/memoryStore.js';

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with optional filters (status, priority, assignee, search)
 * @access  Private
 */
export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      let filter = {};

      if (status && status !== 'all') {
        filter.status = status;
      }
      if (priority && priority !== 'all') {
        filter.priority = priority;
      }
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { assigneeName: { $regex: search, $options: 'i' } },
        ];
      }

      const tasks = await Task.find(filter)
        .populate('assignee', 'name email avatar')
        .populate('creator', 'name email')
        .sort({ dueDate: 1, createdAt: -1 });

      return res.status(200).json({ success: true, count: tasks.length, tasks });
    } else {
      let filtered = [...memoryStore.tasks];

      if (status && status !== 'all') {
        filtered = filtered.filter((t) => t.status === status);
      }
      if (priority && priority !== 'all') {
        filtered = filtered.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            (t.assigneeName && t.assigneeName.toLowerCase().includes(q))
        );
      }

      filtered.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

      return res.status(200).json({ success: true, count: filtered.length, tasks: filtered });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
export const createTask = async (req, res, next) => {
  try {
    const { title, description, assigneeId, assigneeName, priority = 'Medium', dueDate, sourceMeetingId, sourceMeetingTitle, sourceMeetingCode } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please provide task title.' });
    }

    const taskData = {
      title,
      description: description || '',
      assignee: assigneeId || null,
      assigneeName: assigneeName || 'Unassigned',
      creator: req.user._id,
      sourceMeeting: sourceMeetingId || null,
      sourceMeetingTitle: sourceMeetingTitle || '',
      sourceMeetingCode: sourceMeetingCode || '',
      priority,
      status: 'To Do',
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    let newTask;
    if (mongoose.connection.readyState === 1) {
      newTask = await Task.create(taskData);
      await newTask.populate('assignee', 'name email avatar');
    } else {
      newTask = {
        _id: generateId(),
        ...taskData,
        createdAt: new Date(),
      };
      memoryStore.tasks.unshift(newTask);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: newTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task details or status
 * @access  Private
 */
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assigneeId, assigneeName } = req.body;

    if (mongoose.connection.readyState === 1) {
      const task = await Task.findById(id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) {
        task.status = status;
        if (status === 'Completed') {
          task.completedAt = new Date();
        } else {
          task.completedAt = null;
        }
      }
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
      if (assigneeId !== undefined) task.assignee = assigneeId;
      if (assigneeName !== undefined) task.assigneeName = assigneeName;

      await task.save();
      await task.populate('assignee', 'name email avatar');

      return res.status(200).json({ success: true, message: 'Task updated.', task });
    } else {
      const task = memoryStore.tasks.find((t) => t._id.toString() === id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) {
        task.status = status;
        if (status === 'Completed') {
          task.completedAt = new Date();
        } else {
          task.completedAt = null;
        }
      }
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
      if (assigneeId !== undefined) task.assignee = assigneeId;
      if (assigneeName !== undefined) task.assigneeName = assigneeName;

      return res.status(200).json({ success: true, message: 'Task updated.', task });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const task = await Task.findByIdAndDelete(id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    } else {
      const index = memoryStore.tasks.findIndex((t) => t._id.toString() === id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Task not found' });
      memoryStore.tasks.splice(index, 1);
    }

    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tasks/convert-action-item
 * @desc    Convert an AI summary action item into a persistent task
 * @access  Private
 */
export const convertActionItemToTask = async (req, res, next) => {
  try {
    const { summaryId, actionItemId, title, description, assigneeName, priority, dueDate, sourceMeetingCode, sourceMeetingTitle } = req.body;

    const taskPayload = {
      title,
      description: description || 'Action item extracted from meeting intelligence.',
      assigneeName: assigneeName || 'Unassigned',
      creator: req.user._id,
      sourceMeetingTitle: sourceMeetingTitle || 'IntellMeet Session',
      sourceMeetingCode: sourceMeetingCode || '',
      priority: priority || 'Medium',
      status: 'To Do',
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    let createdTask;
    if (mongoose.connection.readyState === 1) {
      createdTask = await Task.create(taskPayload);

      // Mark action item as converted in summary if summaryId provided
      if (summaryId && actionItemId) {
        await MeetingSummary.updateOne(
          { _id: summaryId, 'actionItems._id': actionItemId },
          { $set: { 'actionItems.$.convertedToTask': true, 'actionItems.$.taskId': createdTask._id } }
        );
      }
    } else {
      createdTask = {
        _id: generateId(),
        ...taskPayload,
        createdAt: new Date(),
      };
      memoryStore.tasks.unshift(createdTask);

      if (summaryId && actionItemId) {
        const summary = memoryStore.summaries.find((s) => s._id.toString() === summaryId);
        if (summary) {
          const item = (summary.actionItems || []).find((a) => a._id.toString() === actionItemId);
          if (item) {
            item.convertedToTask = true;
            item.taskId = createdTask._id;
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'AI action item converted to formal workspace task.',
      task: createdTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tasks/stats
 * @desc    Get summary statistics for tasks
 * @access  Private
 */
export const getTaskStats = async (req, res, next) => {
  try {
    let tasks = [];
    if (mongoose.connection.readyState === 1) {
      tasks = await Task.find();
    } else {
      tasks = memoryStore.tasks;
    }

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const toDo = tasks.filter((t) => t.status === 'To Do').length;
    const overdue = tasks.filter(
      (t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.status(200).json({
      success: true,
      stats: {
        total,
        completed,
        inProgress,
        toDo,
        overdue,
        completionRate,
      },
    });
  } catch (error) {
    next(error);
  }
};
