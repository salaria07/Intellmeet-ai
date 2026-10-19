import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database storage directory and file path on disk
export const DB_DIR = path.resolve(__dirname, '../../database');
export const DB_FILE = path.join(DB_DIR, 'intellmeet_db.json');

// Ensure database directory exists on disk
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Debounced disk writer to prevent excessive I/O while ensuring persistence
let saveTimer = null;
export const saveDatabase = () => {
  try {
    const rawData = {
      users: rawStore.users,
      teams: rawStore.teams,
      meetings: rawStore.meetings,
      transcripts: rawStore.transcripts,
      summaries: rawStore.summaries,
      tasks: rawStore.tasks,
      notifications: rawStore.notifications,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(rawData, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Failed to write database to disk:', err.message);
  }
};

const triggerAutoSave = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDatabase, 50);
};

// Raw array data containers
const rawStore = {
  users: [],
  teams: [],
  meetings: [],
  transcripts: [],
  summaries: [],
  tasks: [],
  notifications: [],
};

// Auto-save Array Proxy wrapper
const createAutoSavingArray = (collectionName) => {
  return new Proxy(rawStore[collectionName], {
    set(target, prop, value) {
      target[prop] = value;
      triggerAutoSave();
      return true;
    },
    deleteProperty(target, prop) {
      const res = delete target[prop];
      triggerAutoSave();
      return res;
    },
  });
};

// Thread-safe in-memory collections synchronized to disk
export const memoryStore = {
  get users() {
    return rawStore.users;
  },
  set users(val) {
    rawStore.users = val;
    triggerAutoSave();
  },

  get teams() {
    return rawStore.teams;
  },
  set teams(val) {
    rawStore.teams = val;
    triggerAutoSave();
  },

  get meetings() {
    return rawStore.meetings;
  },
  set meetings(val) {
    rawStore.meetings = val;
    triggerAutoSave();
  },

  get transcripts() {
    return rawStore.transcripts;
  },
  set transcripts(val) {
    rawStore.transcripts = val;
    triggerAutoSave();
  },

  get summaries() {
    return rawStore.summaries;
  },
  set summaries(val) {
    rawStore.summaries = val;
    triggerAutoSave();
  },

  get tasks() {
    return rawStore.tasks;
  },
  set tasks(val) {
    rawStore.tasks = val;
    triggerAutoSave();
  },

  get notifications() {
    return rawStore.notifications;
  },
  set notifications(val) {
    rawStore.notifications = val;
    triggerAutoSave();
  },
};

// Generate mock ObjectId
export const generateId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomHex = Math.random().toString(16).substring(2, 18).padEnd(16, '0');
  return (timestamp + randomHex).substring(0, 24);
};

// Load database collections from disk if file exists
export const loadDatabase = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        rawStore.users = parsed.users || [];
        rawStore.teams = parsed.teams || [];
        rawStore.meetings = parsed.meetings || [];
        rawStore.transcripts = parsed.transcripts || [];
        rawStore.summaries = parsed.summaries || [];
        rawStore.tasks = parsed.tasks || [];
        rawStore.notifications = parsed.notifications || [];
        return true;
      }
    }
  } catch (err) {
    console.warn('[Database] Could not read existing DB file:', err.message);
  }
  return false;
};

// Seed demo users and initial data if database is empty
export const seedInitialData = async () => {
  // First attempt to load existing database from disk
  const loaded = loadDatabase();
  if (loaded && rawStore.users.length > 0) {
    console.log(`====================================================`);
    console.log(`💾 IntellMeet Persistent Database LOADED FROM DISK`);
    console.log(`📁 File Location: ${DB_FILE}`);
    console.log(`📊 Records: ${rawStore.users.length} Users, ${rawStore.meetings.length} Meetings, ${rawStore.tasks.length} Tasks, ${rawStore.summaries.length} AI Summaries`);
    console.log(`====================================================`);
    return;
  }

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const demoUser = {
    _id: '65a000000000000000000001',
    name: 'Alex Morgan',
    email: 'alex@intellmeet.ai',
    password: passwordHash,
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
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  };

  const member1 = {
    _id: '65a000000000000000000002',
    name: 'David Chen',
    email: 'david.chen@intellmeet.ai',
    password: passwordHash,
    role: 'Manager',
    jobTitle: 'Lead AI Architect',
    department: 'Machine Learning',
    status: 'In Meeting',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  };

  const member2 = {
    _id: '65a000000000000000000003',
    name: 'Sarah Jenkins',
    email: 'sarah.j@intellmeet.ai',
    password: passwordHash,
    role: 'Member',
    jobTitle: 'Senior Full Stack Engineer',
    department: 'Product & Engineering',
    status: 'Online',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  };

  const member3 = {
    _id: '65a000000000000000000004',
    name: 'Marcus Vance',
    email: 'marcus.v@intellmeet.ai',
    password: passwordHash,
    role: 'Member',
    jobTitle: 'Security & Infrastructure Lead',
    department: 'Cloud Ops',
    status: 'Away',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  };

  rawStore.users.push(demoUser, member1, member2, member3);

  // Seed Team
  const teamId = '65b000000000000000000001';
  rawStore.teams.push({
    _id: teamId,
    name: 'Core Platform & AI Systems',
    description: 'Enterprise intelligence and real-time collaboration engineering team.',
    owner: demoUser._id,
    department: 'Engineering & AI',
    members: [
      { user: demoUser._id, role: 'Admin', joinedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
      { user: member1._id, role: 'Manager', joinedAt: new Date(Date.now() - 25 * 86400000).toISOString() },
      { user: member2._id, role: 'Member', joinedAt: new Date(Date.now() - 20 * 86400000).toISOString() },
      { user: member3._id, role: 'Member', joinedAt: new Date(Date.now() - 15 * 86400000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  });

  // Seed Meetings
  const meetingLiveId = '65c000000000000000000001';
  const meetingUpcomingId = '65c000000000000000000002';
  const meetingPastId = '65c000000000000000000003';

  rawStore.meetings.push(
    {
      _id: meetingLiveId,
      title: 'AI Strategy & Q4 Model Deployment Sync',
      description: 'Reviewing fine-tuning performance, latency benchmarks, and enterprise token throughput.',
      meetingCode: 'mtg-q4-deploy',
      host: demoUser._id,
      team: teamId,
      status: 'live',
      scheduledStartTime: new Date(Date.now() - 15 * 60000).toISOString(),
      scheduledEndTime: new Date(Date.now() + 45 * 60000).toISOString(),
      actualStartTime: new Date(Date.now() - 15 * 60000).toISOString(),
      durationMinutes: 60,
      isInstant: false,
      participants: [
        { _id: generateId(), user: demoUser._id, name: demoUser.name, avatar: demoUser.avatar, role: 'host', joinedAt: new Date(Date.now() - 15 * 60000).toISOString() },
        { _id: generateId(), user: member1._id, name: member1.name, avatar: member1.avatar, role: 'co-host', joinedAt: new Date(Date.now() - 12 * 60000).toISOString() },
      ],
      hasSummary: false,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      _id: meetingUpcomingId,
      title: 'Security Compliance & WebRTC STUN/TURN Audit',
      description: 'End-to-end encryption review and enterprise ICE candidate negotiation tests.',
      meetingCode: 'mtg-sec-audit',
      host: demoUser._id,
      team: teamId,
      status: 'scheduled',
      scheduledStartTime: new Date(Date.now() + 3 * 3600000).toISOString(),
      scheduledEndTime: new Date(Date.now() + 4 * 3600000).toISOString(),
      durationMinutes: 60,
      isInstant: false,
      participants: [
        { _id: generateId(), user: demoUser._id, name: demoUser.name, avatar: demoUser.avatar, role: 'host', joinedAt: new Date().toISOString() },
        { _id: generateId(), user: member3._id, name: member3.name, avatar: member3.avatar, role: 'participant', joinedAt: new Date().toISOString() },
      ],
      hasSummary: false,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      _id: meetingPastId,
      title: 'Weekly Engineering All-Hands & Sprint Planning',
      description: 'Sprint retrospectives, velocity tracking, and automated transcript workflow approvals.',
      meetingCode: 'mtg-eng-sync',
      host: demoUser._id,
      team: teamId,
      status: 'ended',
      scheduledStartTime: new Date(Date.now() - 26 * 3600000).toISOString(),
      scheduledEndTime: new Date(Date.now() - 25 * 3600000).toISOString(),
      actualStartTime: new Date(Date.now() - 26 * 3600000).toISOString(),
      actualEndTime: new Date(Date.now() - 25 * 3600000 + 10 * 60000).toISOString(),
      durationMinutes: 70,
      isInstant: false,
      participants: [
        { _id: generateId(), user: demoUser._id, name: demoUser.name, avatar: demoUser.avatar, role: 'host', joinedAt: new Date(Date.now() - 26 * 3600000).toISOString() },
        { _id: generateId(), user: member1._id, name: member1.name, avatar: member1.avatar, role: 'participant', joinedAt: new Date(Date.now() - 26 * 3600000).toISOString() },
        { _id: generateId(), user: member2._id, name: member2.name, avatar: member2.avatar, role: 'participant', joinedAt: new Date(Date.now() - 26 * 3600000).toISOString() },
      ],
      hasSummary: true,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    }
  );

  // Seed Transcript for the past meeting
  const transcriptId = '65d000000000000000000001';
  rawStore.transcripts.push({
    _id: transcriptId,
    meeting: meetingPastId,
    meetingCode: 'mtg-eng-sync',
    segments: [
      {
        _id: generateId(),
        speaker: 'Alex Morgan',
        text: 'Good morning everyone. Today we are locking in the Q4 architecture milestones and our WebRTC low-latency audio pipelines.',
        timestamp: new Date(Date.now() - 26 * 3600000).toISOString(),
        offsetSeconds: 0,
      },
      {
        _id: generateId(),
        speaker: 'David Chen',
        text: 'On the AI front, we reduced OpenAI token processing latency by 35% through chunked streaming and structured JSON response schemas.',
        timestamp: new Date(Date.now() - 26 * 3600000 + 45000).toISOString(),
        offsetSeconds: 45,
      },
      {
        _id: generateId(),
        speaker: 'Sarah Jenkins',
        text: 'The glassmorphic dashboard components are tested across desktop and mobile. All six core navigation tabs are responsive.',
        timestamp: new Date(Date.now() - 26 * 3600000 + 90000).toISOString(),
        offsetSeconds: 90,
      },
      {
        _id: generateId(),
        speaker: 'Marcus Vance',
        text: 'I have finalized the STUN/TURN fallback server matrix and verified token expiration on web socket reconnections.',
        timestamp: new Date(Date.now() - 26 * 3600000 + 150000).toISOString(),
        offsetSeconds: 150,
      },
      {
        _id: generateId(),
        speaker: 'Alex Morgan',
        text: 'Terrific. Let us ensure the action items are assigned to David and Sarah with completion target by Friday.',
        timestamp: new Date(Date.now() - 26 * 3600000 + 210000).toISOString(),
        offsetSeconds: 210,
      },
    ],
    rawText: 'Alex Morgan: Good morning everyone. Today we are locking in the Q4 architecture milestones... David Chen: On the AI front, we reduced OpenAI token processing latency by 35%...',
    language: 'en',
    isLive: false,
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
  });

  // Seed Meeting Summary
  rawStore.summaries.push({
    _id: '65e000000000000000000001',
    meeting: meetingPastId,
    meetingCode: 'mtg-eng-sync',
    overview: 'The team aligned on Q4 architecture milestones, WebRTC optimization benchmarks, and structured AI summary extraction pipelines.',
    discussionPoints: [
      'WebRTC signaling latency reduced to sub-80ms with regional ICE candidate gathering.',
      'OpenAI API token throughput streamlined with streaming chunk buffers.',
      'Dashboard UI completed with glassmorphic dark-mode palette and all 6 core navigation tabs.',
      'STUN/TURN fallback verified for strict corporate firewalls.',
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
        _id: generateId(),
        title: 'Benchmark multi-stream video mesh on mobile Safari',
        description: 'Test WebRTC packet loss and frame rate stability under 3G/4G throttling.',
        assigneeName: 'Sarah Jenkins',
        assigneeUser: member2._id,
        dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
        priority: 'High',
        convertedToTask: true,
      },
      {
        _id: generateId(),
        title: 'Configure automated STUN/TURN failover metrics',
        description: 'Set up real-time telemetry alerts if TURN relay usage spikes over 20%.',
        assigneeName: 'Marcus Vance',
        assigneeUser: member3._id,
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        priority: 'Critical',
        convertedToTask: true,
      },
      {
        _id: generateId(),
        title: 'Finalize OpenAI prompt templates for action item categorization',
        description: 'Ensure accurate priority ranking and deadline extraction from spoken context.',
        assigneeName: 'David Chen',
        assigneeUser: member1._id,
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        priority: 'Medium',
        convertedToTask: false,
      },
    ],
    isAIGenerated: true,
    isDemoMode: false,
    modelUsed: 'gpt-4o-mini',
    createdAt: new Date(Date.now() - 25 * 3600000).toISOString(),
  });

  // Seed Tasks
  rawStore.tasks.push(
    {
      _id: '65f000000000000000000001',
      title: 'Benchmark multi-stream video mesh on mobile Safari',
      description: 'Test WebRTC packet loss and frame rate stability under 3G/4G throttling.',
      assignee: member2._id,
      assigneeName: 'Sarah Jenkins',
      creator: demoUser._id,
      sourceMeeting: meetingPastId,
      sourceMeetingTitle: 'Weekly Engineering All-Hands & Sprint Planning',
      sourceMeetingCode: 'mtg-eng-sync',
      priority: 'High',
      status: 'In Progress',
      dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    {
      _id: '65f000000000000000000002',
      title: 'Configure automated STUN/TURN failover metrics',
      description: 'Set up real-time telemetry alerts if TURN relay usage spikes over 20%.',
      assignee: member3._id,
      assigneeName: 'Marcus Vance',
      creator: demoUser._id,
      sourceMeeting: meetingPastId,
      sourceMeetingTitle: 'Weekly Engineering All-Hands & Sprint Planning',
      sourceMeetingCode: 'mtg-eng-sync',
      priority: 'Critical',
      status: 'To Do',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    {
      _id: '65f000000000000000000003',
      title: 'Upgrade JWT cookie expiration to strict SameSite spec',
      description: 'Ensure CSRF immunity and production HTTPS cookie attributes.',
      assignee: demoUser._id,
      assigneeName: 'Alex Morgan',
      creator: demoUser._id,
      priority: 'Medium',
      status: 'Completed',
      dueDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      _id: '65f000000000000000000004',
      title: 'Refactor Recharts analytics data aggregation endpoint',
      description: 'Calculate average meeting duration and weekly participation velocity.',
      assignee: member1._id,
      assigneeName: 'David Chen',
      creator: demoUser._id,
      priority: 'Low',
      status: 'Completed',
      dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    }
  );

  // Seed Notifications
  rawStore.notifications.push(
    {
      _id: '659000000000000000000001',
      recipient: demoUser._id,
      title: 'AI Summary Generated',
      message: 'Weekly Engineering All-Hands summary & 3 action items are ready.',
      type: 'ai',
      read: false,
      link: `/meetings?code=mtg-eng-sync`,
      createdAt: new Date(Date.now() - 25 * 3600000).toISOString(),
    },
    {
      _id: '659000000000000000000002',
      recipient: demoUser._id,
      title: 'Upcoming Meeting in 3 hours',
      message: 'Security Compliance & WebRTC STUN/TURN Audit starts at 4:00 PM.',
      type: 'meeting',
      read: false,
      link: `/meetings?code=mtg-sec-audit`,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    }
  );

  // Commit immediately to disk
  saveDatabase();
  console.log(`====================================================`);
  console.log(`💾 IntellMeet Persistent Database CREATED ON DISK`);
  console.log(`📁 File Location: ${DB_FILE}`);
  console.log(`📊 Seeded 4 Users, 3 Meetings, 4 Tasks, 1 AI Summary`);
  console.log(`====================================================`);
};
