import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Meeting from '../models/Meeting.js';
import Transcript from '../models/Transcript.js';
import MeetingSummary from '../models/MeetingSummary.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

export const seedMongoDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[MongoDB Atlas] Database already contains ${userCount} users. Ready!`);
      return;
    }

    console.log('[MongoDB Atlas] Seeding initial enterprise data into MongoDB Atlas...');

    const defaultPassword = 'Password123!';

    const demoUser = await User.create({
      name: 'Alex Morgan',
      email: 'alex@intellmeet.ai',
      password: defaultPassword,
      role: 'Admin',
      jobTitle: 'VP of Product',
      department: 'Executive Engineering',
      status: 'Online',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      settings: {
        theme: 'dark',
        cameraDefault: true,
        micDefault: true,
        emailNotifications: true,
        meetingReminders: true,
        soundEnabled: true,
      },
    });

    const member1 = await User.create({
      name: 'David Chen',
      email: 'david.chen@intellmeet.ai',
      password: defaultPassword,
      role: 'Manager',
      jobTitle: 'Lead AI Architect',
      department: 'Machine Learning',
      status: 'In Meeting',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    });

    const member2 = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah.j@intellmeet.ai',
      password: defaultPassword,
      role: 'Member',
      jobTitle: 'Senior Full Stack Engineer',
      department: 'Product & Engineering',
      status: 'Online',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    });

    const member3 = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.v@intellmeet.ai',
      password: defaultPassword,
      role: 'Member',
      jobTitle: 'Security & Infrastructure Lead',
      department: 'Cloud Ops',
      status: 'Away',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    });

    // Team
    const team = await Team.create({
      name: 'Core Platform & AI Systems',
      description: 'Enterprise intelligence and real-time collaboration engineering team.',
      owner: demoUser._id,
      department: 'Engineering & AI',
      members: [
        { user: demoUser._id, role: 'Admin', joinedAt: new Date(Date.now() - 30 * 86400000) },
        { user: member1._id, role: 'Manager', joinedAt: new Date(Date.now() - 25 * 86400000) },
        { user: member2._id, role: 'Member', joinedAt: new Date(Date.now() - 20 * 86400000) },
        { user: member3._id, role: 'Member', joinedAt: new Date(Date.now() - 15 * 86400000) },
      ],
    });

    // Meetings
    const liveMeeting = await Meeting.create({
      title: 'AI Strategy & Q4 Model Deployment Sync',
      description: 'Reviewing fine-tuning performance, latency benchmarks, and enterprise token throughput.',
      meetingCode: 'mtg-q4-deploy',
      host: demoUser._id,
      team: team._id,
      status: 'live',
      scheduledStartTime: new Date(Date.now() - 15 * 60000),
      scheduledEndTime: new Date(Date.now() + 45 * 60000),
      actualStartTime: new Date(Date.now() - 15 * 60000),
      durationMinutes: 60,
      isInstant: false,
      participants: [
        { user: demoUser._id, name: demoUser.name, avatar: demoUser.avatar, role: 'host', joinedAt: new Date() },
        { user: member1._id, name: member1.name, avatar: member1.avatar, role: 'co-host', joinedAt: new Date() },
      ],
      hasSummary: false,
    });

    const scheduledMeeting = await Meeting.create({
      title: 'Security Compliance & WebRTC STUN/TURN Audit',
      description: 'End-to-end encryption review and enterprise ICE candidate negotiation tests.',
      meetingCode: 'mtg-sec-audit',
      host: demoUser._id,
      team: team._id,
      status: 'scheduled',
      scheduledStartTime: new Date(Date.now() + 3 * 3600000),
      scheduledEndTime: new Date(Date.now() + 4 * 3600000),
      durationMinutes: 60,
      isInstant: false,
      participants: [
        { user: demoUser._id, name: demoUser.name, avatar: demoUser.avatar, role: 'host', joinedAt: new Date() },
        { user: member3._id, name: member3.name, avatar: member3.avatar, role: 'participant', joinedAt: new Date() },
      ],
      hasSummary: false,
    });

    const pastMeeting = await Meeting.create({
      title: 'Weekly Engineering All-Hands & Sprint Planning',
      description: 'Sprint retrospectives, velocity tracking, and automated transcript workflow approvals.',
      meetingCode: 'mtg-eng-sync',
      host: demoUser._id,
      team: team._id,
      status: 'ended',
      scheduledStartTime: new Date(Date.now() - 26 * 3600000),
      scheduledEndTime: new Date(Date.now() - 25 * 3600000),
      actualStartTime: new Date(Date.now() - 26 * 3600000),
      actualEndTime: new Date(Date.now() - 25 * 3600000 + 10 * 60000),
      durationMinutes: 70,
      isInstant: false,
      participants: [
        { user: demoUser._id, name: demoUser.name, avatar: demoUser.avatar, role: 'host', joinedAt: new Date() },
        { user: member1._id, name: member1.name, avatar: member1.avatar, role: 'participant', joinedAt: new Date() },
        { user: member2._id, name: member2.name, avatar: member2.avatar, role: 'participant', joinedAt: new Date() },
      ],
      hasSummary: true,
    });

    // Transcript
    await Transcript.create({
      meeting: pastMeeting._id,
      meetingCode: 'mtg-eng-sync',
      segments: [
        { speaker: 'Alex Morgan', text: 'Good morning everyone. Today we are locking in the Q4 architecture milestones and our WebRTC low-latency audio pipelines.', offsetSeconds: 0 },
        { speaker: 'David Chen', text: 'On the AI front, we reduced OpenAI token processing latency by 35% through chunked streaming and structured JSON response schemas.', offsetSeconds: 45 },
        { speaker: 'Sarah Jenkins', text: 'The glassmorphic dashboard components are tested across desktop and mobile. All six core navigation tabs are responsive.', offsetSeconds: 90 },
      ],
      rawText: 'Alex Morgan: Good morning everyone... David Chen: On the AI front, we reduced OpenAI latency by 35%...',
      isLive: false,
    });

    // Summary
    await MeetingSummary.create({
      meeting: pastMeeting._id,
      meetingCode: 'mtg-eng-sync',
      overview: 'The team aligned on Q4 architecture milestones, WebRTC optimization benchmarks, and structured AI summary extraction pipelines.',
      discussionPoints: [
        'WebRTC signaling latency reduced to sub-80ms with regional ICE candidate gathering.',
        'OpenAI API token throughput streamlined with streaming chunk buffers.',
        'Dashboard UI completed with glassmorphic dark-mode palette and all 6 core navigation tabs.',
      ],
      decisions: [
        'Deploy v1.4 streaming inference to production staging by Thursday.',
        'Enforce role-based permission checks at the backend controller level for all meeting mutations.',
      ],
      takeaways: [
        'All team members completed sprint commitments ahead of schedule.',
        'User feedback on the blue-and-gold glassmorphism interface was overwhelmingly positive.',
      ],
      unresolvedQuestions: [
        'Need to benchmark mobile Safari video frame rates when multi-stream peer mesh exceeds 6 participants.',
      ],
      nextSteps: [
        'Schedule end-to-end load test on staging cluster with 50 concurrent simulated rooms.',
        'Review task completion metrics ahead of executive sync.',
      ],
      actionItems: [
        {
          title: 'Benchmark multi-stream video mesh on mobile Safari',
          description: 'Test WebRTC packet loss and frame rate stability under 3G/4G throttling.',
          assigneeName: 'Sarah Jenkins',
          assigneeUser: member2._id,
          priority: 'High',
          convertedToTask: true,
        },
        {
          title: 'Configure automated STUN/TURN failover metrics',
          description: 'Set up real-time telemetry alerts if TURN relay usage spikes over 20%.',
          assigneeName: 'Marcus Vance',
          assigneeUser: member3._id,
          priority: 'Critical',
          convertedToTask: true,
        },
      ],
      isAIGenerated: true,
      isDemoMode: false,
      modelUsed: 'gpt-4o-mini',
    });

    // Tasks
    await Task.create([
      {
        title: 'Benchmark multi-stream video mesh on mobile Safari',
        description: 'Test WebRTC packet loss and frame rate stability under 3G/4G throttling.',
        assignee: member2._id,
        assigneeName: 'Sarah Jenkins',
        creator: demoUser._id,
        sourceMeeting: pastMeeting._id,
        sourceMeetingTitle: 'Weekly Engineering All-Hands & Sprint Planning',
        sourceMeetingCode: 'mtg-eng-sync',
        priority: 'High',
        status: 'In Progress',
        dueDate: new Date(Date.now() + 4 * 86400000),
      },
      {
        title: 'Configure automated STUN/TURN failover metrics',
        description: 'Set up real-time telemetry alerts if TURN relay usage spikes over 20%.',
        assignee: member3._id,
        assigneeName: 'Marcus Vance',
        creator: demoUser._id,
        sourceMeeting: pastMeeting._id,
        sourceMeetingTitle: 'Weekly Engineering All-Hands & Sprint Planning',
        sourceMeetingCode: 'mtg-eng-sync',
        priority: 'Critical',
        status: 'To Do',
        dueDate: new Date(Date.now() + 5 * 86400000),
      },
      {
        title: 'Upgrade JWT cookie expiration to strict SameSite spec',
        description: 'Ensure CSRF immunity and production HTTPS cookie attributes.',
        assignee: demoUser._id,
        assigneeName: 'Alex Morgan',
        creator: demoUser._id,
        priority: 'Medium',
        status: 'Completed',
        dueDate: new Date(Date.now() - 2 * 86400000),
        completedAt: new Date(Date.now() - 2 * 86400000),
      },
    ]);

    // Notifications
    await Notification.create([
      {
        recipient: demoUser._id,
        title: 'AI Summary Generated',
        message: 'Weekly Engineering All-Hands summary & action items are ready.',
        type: 'ai',
        read: false,
        link: `/meetings?code=mtg-eng-sync`,
      },
      {
        recipient: demoUser._id,
        title: 'Upcoming Meeting in 3 hours',
        message: 'Security Compliance & WebRTC STUN/TURN Audit starts at 4:00 PM.',
        type: 'meeting',
        read: false,
        link: `/meetings?code=mtg-sec-audit`,
      },
    ]);

    console.log('[MongoDB Atlas] ✅ Initial enterprise collections successfully seeded in Atlas!');
  } catch (err) {
    console.error('[MongoDB Atlas] Seeding error:', err.message);
  }
};
