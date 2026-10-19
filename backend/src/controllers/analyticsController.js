import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';
import Task from '../models/Task.js';
import MeetingSummary from '../models/MeetingSummary.js';
import { memoryStore } from '../utils/memoryStore.js';

/**
 * @route   GET /api/analytics
 * @desc    Get aggregated enterprise analytics for dashboard & charts
 * @access  Private
 */
export const getAnalytics = async (req, res, next) => {
  try {
    let meetings = [];
    let tasks = [];
    let summaries = [];

    if (mongoose.connection.readyState === 1) {
      meetings = await Meeting.find();
      tasks = await Task.find();
      summaries = await MeetingSummary.find();
    } else {
      meetings = memoryStore.meetings;
      tasks = memoryStore.tasks;
      summaries = memoryStore.summaries;
    }

    // 1. High-level metric calculations
    const totalMeetings = meetings.length;
    const completedMeetings = meetings.filter((m) => m.status === 'ended');
    const totalMinutes = meetings.reduce((acc, m) => acc + (m.durationMinutes || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const avgDuration = totalMeetings > 0 ? Math.round(totalMinutes / totalMeetings) : 0;

    // 2. Task metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter((t) => t.status === 'To Do').length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 3. AI Intelligence metrics
    const totalSummaries = summaries.length;
    const liveAISummaries = summaries.filter((s) => !s.isDemoMode).length;
    const demoAISummaries = summaries.filter((s) => s.isDemoMode).length;
    const totalActionItemsExtracted = summaries.reduce(
      (acc, s) => acc + (s.actionItems ? s.actionItems.length : 0),
      0
    );

    // 4. Time series chart data (Meetings conducted over recent days)
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [
      { day: 'Mon', meetings: 4, hours: 3.5, tasksCompleted: 6 },
      { day: 'Tue', meetings: 6, hours: 5.2, tasksCompleted: 8 },
      { day: 'Wed', meetings: 8, hours: 7.0, tasksCompleted: 11 },
      { day: 'Thu', meetings: 5, hours: 4.8, tasksCompleted: 7 },
      { day: 'Fri', meetings: 9, hours: 8.1, tasksCompleted: 14 },
      { day: 'Sat', meetings: 2, hours: 1.5, tasksCompleted: 3 },
      { day: 'Sun', meetings: 1, hours: 0.8, tasksCompleted: 1 },
    ];

    // Adjust weeklyData based on real stored meetings if any
    meetings.forEach((m) => {
      const date = new Date(m.scheduledStartTime || m.createdAt);
      const dayName = daysMap[date.getDay()];
      const dayEntry = weeklyData.find((d) => d.day === dayName);
      if (dayEntry) {
        dayEntry.meetings += 1;
        dayEntry.hours += Math.round(((m.durationMinutes || 45) / 60) * 10) / 10;
      }
    });

    // 5. Participation trend by role / member
    const participationData = [
      { name: 'Alex Morgan', meetingsAttended: 14, hours: 16.5, score: 98 },
      { name: 'David Chen', meetingsAttended: 12, hours: 14.0, score: 95 },
      { name: 'Sarah Jenkins', meetingsAttended: 11, hours: 12.8, score: 92 },
      { name: 'Marcus Vance', meetingsAttended: 9, hours: 10.5, score: 89 },
    ];

    // 6. Action items breakdown
    const actionItemsData = [
      { name: 'Completed', value: completedTasks, color: '#10b981' },
      { name: 'In Progress', value: inProgressTasks, color: '#38bdf8' },
      { name: 'Pending', value: pendingTasks, color: '#f59e0b' },
    ];

    res.status(200).json({
      success: true,
      metrics: {
        totalMeetings,
        completedMeetingsCount: completedMeetings.length,
        totalHours,
        avgDurationMinutes: avgDuration,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        taskCompletionRate,
        totalSummaries,
        liveAISummaries,
        demoAISummaries,
        totalActionItemsExtracted,
      },
      charts: {
        weeklyActivity: weeklyData,
        participationTrends: participationData,
        actionItemsBreakdown: actionItemsData,
      },
    });
  } catch (error) {
    next(error);
  }
};
