import { io } from '../../../frontend/node_modules/socket.io-client/build/esm/index.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const BACKEND_URL = 'http://localhost:5000';

function connectClient(name) {
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      forceNew: true,
      autoConnect: false,
    });
    const timer = setTimeout(() => reject(new Error(`${name} failed to connect within 5s`)), 5000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.connect();
  });
}

async function runTests() {
  console.log('🧪 Starting IntellMeet WebRTC & Screen Sharing Real-Time Signaling Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 0. Connect to MongoDB and create valid test meetings
  await mongoose.connect(process.env.MONGODB_URI);
  const meetingsCol = mongoose.connection.db.collection('meetings');
  const usersCol = mongoose.connection.db.collection('users');

  const adminUser = await usersCol.findOne({ email: 'alex@intellmeet.ai' });
  const testMeetingCode1 = `test-screen-${Date.now().toString(36)}`;
  const testMeetingCode2 = `test-screen-iso-${Date.now().toString(36)}`;

  await meetingsCol.insertOne({
    title: 'Automated Screen Sharing Test Meeting 1',
    meetingCode: testMeetingCode1,
    host: adminUser._id,
    status: 'scheduled',
    scheduledStartTime: new Date(),
    durationMinutes: 30,
    isInstant: false,
    participants: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await meetingsCol.insertOne({
    title: 'Automated Screen Sharing Test Meeting 2 (Isolated)',
    meetingCode: testMeetingCode2,
    host: adminUser._id,
    status: 'scheduled',
    scheduledStartTime: new Date(),
    durationMinutes: 30,
    isInstant: false,
    participants: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log(`Created test meetings: ${testMeetingCode1} & ${testMeetingCode2}\n`);

  try {
    // TEST 1: Two participants join same room
    console.log('--- TEST 1: Room Join & Participant Discovery ---');
    const clientA = await connectClient('Client A');
    const clientB = await connectClient('Client B');

    clientA.emit('join-room', {
      meetingCode: testMeetingCode1,
      user: { id: 'user-A-111', name: 'Alice Walker', avatar: 'https://example.com/alice.png' }
    });

    await new Promise(r => setTimeout(r, 150));

    const bJoinedPromise = new Promise((resolve) => {
      clientA.on('user-joined', (data) => {
        assert(data.user?.id === 'user-B-222', 'Client A notified that Client B joined');
        assert(data.user?.name === 'Bob Smith', 'Client B name received correctly');
        resolve();
      });
    });

    const bExistingPromise = new Promise((resolve) => {
      clientB.on('existing-participants', (data) => {
        assert(Array.isArray(data.peers), 'Client B received existing peers array');
        assert(data.peers.some(p => p.user?.id === 'user-A-111'), 'Client A is in existing peers list');
        assert(data.activeScreenSharer === null, 'Initially no active screen sharer in room');
        resolve();
      });
    });

    clientB.emit('join-room', {
      meetingCode: testMeetingCode1,
      user: { id: 'user-B-222', name: 'Bob Smith', avatar: 'https://example.com/bob.png' }
    });

    await Promise.all([bJoinedPromise, bExistingPromise]);

    // TEST 2: Bidirectional Screen Sharing - Client A starts sharing
    console.log('\n--- TEST 2: Screen Sharing Start by Participant A ---');
    const screenStartPromise = new Promise((resolve) => {
      clientB.once('screen-share-started', (data) => {
        assert(data.user?.id === 'user-A-111', 'Client B received screen-share-started with Client A userId');
        assert(data.user?.name === 'Alice Walker', 'Client B received correct sharer name');
        resolve();
      });
    });

    clientA.emit('start-screen-share', {
      meetingCode: testMeetingCode1
    });
    await screenStartPromise;

    // TEST 3: Conflict Prevention - Client B attempts to share simultaneously
    console.log('\n--- TEST 3: Simultaneous Screen Share Prevention ---');
    const conflictPromise = new Promise((resolve) => {
      clientB.once('screen-share-rejected', (data) => {
        assert(data.currentSharer?.name === 'Alice Walker', 'Rejection mentions current sharer Alice Walker');
        assert(data.message.includes('Alice Walker is currently sharing'), 'Rejection message explains someone is already sharing');
        resolve();
      });
    });

    clientB.emit('start-screen-share', {
      meetingCode: testMeetingCode1
    });
    await conflictPromise;

    // TEST 4: Client A stops screen sharing
    console.log('\n--- TEST 4: Screen Sharing Stop by Participant A ---');
    const stopPromise = new Promise((resolve) => {
      clientB.once('screen-share-stopped', (data) => {
        assert(data.user?.id === 'user-A-111', 'Client B received screen-share-stopped for Client A');
        resolve();
      });
    });

    clientA.emit('stop-screen-share', {
      meetingCode: testMeetingCode1
    });
    await stopPromise;

    // TEST 5: Client B starts screen sharing now that A stopped
    console.log('\n--- TEST 5: Screen Sharing Started by Participant B ---');
    const bSharePromise = new Promise((resolve) => {
      clientA.once('screen-share-started', (data) => {
        assert(data.user?.id === 'user-B-222', 'Client A received screen-share-started with Client B userId');
        assert(data.user?.name === 'Bob Smith', 'Client A received Bob Smith as sharer');
        resolve();
      });
    });

    clientB.emit('start-screen-share', {
      meetingCode: testMeetingCode1
    });
    await bSharePromise;

    // TEST 6: WebRTC Signaling Routing (Offer, Answer, ICE)
    console.log('\n--- TEST 6: WebRTC Signaling Routing (Offer, Answer, ICE) ---');
    const offerPromise = new Promise((resolve) => {
      clientB.on('signal-offer', (data) => {
        assert(data.fromUser?.id === 'user-A-111', 'Client B received signal-offer from Client A');
        assert(data.offer?.type === 'offer', 'Offer payload preserved');
        resolve();
      });
    });

    clientA.emit('signal-offer', {
      meetingCode: testMeetingCode1,
      toSocketId: clientB.id,
      offer: { type: 'offer', sdp: 'v=0...' },
      fromUser: { id: 'user-A-111', name: 'Alice Walker' }
    });
    await offerPromise;

    const answerPromise = new Promise((resolve) => {
      clientA.on('signal-answer', (data) => {
        assert(data.fromSocketId === clientB.id, 'Client A received signal-answer from Client B');
        assert(data.answer?.type === 'answer', 'Answer payload preserved');
        resolve();
      });
    });

    clientB.emit('signal-answer', {
      meetingCode: testMeetingCode1,
      toSocketId: clientA.id,
      answer: { type: 'answer', sdp: 'v=0...' }
    });
    await answerPromise;

    const icePromise = new Promise((resolve) => {
      clientB.on('signal-ice', (data) => {
        assert(data.candidate?.candidate === 'candidate:123', 'Client B received candidate from Client A');
        resolve();
      });
    });

    clientA.emit('signal-ice', {
      meetingCode: testMeetingCode1,
      toSocketId: clientB.id,
      candidate: { candidate: 'candidate:123', sdpMid: '0', sdpMLineIndex: 0 }
    });
    await icePromise;

    // TEST 7: Room Isolation
    console.log('\n--- TEST 7: Room Isolation for Screen Sharing & Signaling ---');
    const clientC = await connectClient('Client C');
    let room1ReceivedRoom2Event = false;

    clientA.on('screen-share-started', (data) => {
      if (data.user?.id === 'user-C-333') room1ReceivedRoom2Event = true;
    });

    clientC.emit('join-room', {
      meetingCode: testMeetingCode2,
      user: { id: 'user-C-333', name: 'Charlie Dave' }
    });
    await new Promise(r => setTimeout(r, 150));

    clientC.emit('start-screen-share', {
      meetingCode: testMeetingCode2
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    assert(!room1ReceivedRoom2Event, 'Room 1 received zero screen-share events from isolated Room 2');

    // TEST 8: Disconnect cleanup while screen sharing
    console.log('\n--- TEST 8: Sharer Disconnection Cleanup ---');
    const disconnectCleanupPromise = new Promise((resolve) => {
      clientA.on('screen-share-stopped', (data) => {
        assert(data.user?.id === 'user-B-222', 'Client A received screen-share-stopped when Bob disconnected');
        resolve();
      });
    });
    clientB.disconnect();
    await disconnectCleanupPromise;

    // Clean up remaining clients
    clientA.disconnect();
    clientC.disconnect();

  } finally {
    // Cleanup test meetings from MongoDB
    await meetingsCol.deleteMany({ meetingCode: { $in: [testMeetingCode1, testMeetingCode2] } });
    await mongoose.disconnect();
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
