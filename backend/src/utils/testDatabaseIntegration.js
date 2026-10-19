import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Meeting from '../models/Meeting.js';
import Transcript from '../models/Transcript.js';
import MeetingSummary from '../models/MeetingSummary.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

async function testDatabaseIntegration() {
  console.log('====================================================');
  console.log('🧪 INTELLMEET AI - END-TO-END DATABASE INTEGRATION TEST');
  console.log('====================================================\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas cluster.');

    // 1. Test User Queries & Authentication
    console.log('\n[1/7] Testing User Collection & Password Validation...');
    const adminUser = await User.findOne({ email: 'alex@intellmeet.ai' }).select('+password');
    if (!adminUser) {
      throw new Error('Seed admin user (alex@intellmeet.ai) not found in Atlas!');
    }
    const isPasswordValid = await adminUser.comparePassword('Password123!');
    console.log(`  • Found Admin: ${adminUser.name} (${adminUser.email})`);
    console.log(`  • Role: ${adminUser.role}, Status: ${adminUser.status}`);
    console.log(`  • Password Validation against bcrypt hash: ${isPasswordValid ? '✅ PASS' : '❌ FAIL'}`);
    if (!isPasswordValid) throw new Error('Password validation failed!');

    // 2. Test Team Collection
    console.log('\n[2/7] Testing Team Collection & Members...');
    const team = await Team.findOne().populate('members.user', 'name email role');
    if (!team) {
      throw new Error('Default team not found in Atlas!');
    }
    console.log(`  • Team Name: "${team.name}"`);
    console.log(`  • Total Members: ${team.members.length}`);
    team.members.forEach((m, idx) => {
      console.log(`    ${idx + 1}. ${m.user?.name || 'Unknown'} - ${m.role}`);
    });

    // 3. Test Meeting Creation & Query
    console.log('\n[3/7] Testing Meeting Creation & Queries...');
    const testMeetingCode = `test-sync-${Date.now().toString(36)}`;
    const newMeeting = await Meeting.create({
      title: 'Automated Atlas Cluster Health Sync',
      description: 'System verification meeting testing persistence in Atlas.',
      meetingCode: testMeetingCode,
      host: adminUser._id,
      team: team._id,
      status: 'scheduled',
      scheduledStartTime: new Date(),
      durationMinutes: 30,
      isInstant: false,
      participants: [
        {
          user: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: 'host',
          joinedAt: new Date(),
        },
      ],
    });
    console.log(`  • Created test meeting: "${newMeeting.title}"`);
    console.log(`  • Generated code: ${newMeeting.meetingCode} (ID: ${newMeeting._id})`);

    const fetchedMeeting = await Meeting.findOne({ meetingCode: testMeetingCode }).populate('host', 'name email');
    console.log(`  • Queried back meeting: Host is ${fetchedMeeting.host.name}`);

    // 4. Test Transcript
    console.log('\n[4/7] Testing Transcript Persistence...');
    const transcript = await Transcript.create({
      meeting: newMeeting._id,
      meetingCode: testMeetingCode,
      segments: [
        { speaker: 'Alex Morgan', text: 'Initiating end-to-end database diagnostic test for IntellMeet AI.', offsetSeconds: 0 },
        { speaker: 'David Chen', text: 'Atlas cluster latency is under 40ms, indexing confirmed.', offsetSeconds: 15 },
      ],
      rawText: 'Alex Morgan: Initiating end-to-end database diagnostic... David Chen: Atlas latency under 40ms...',
      isLive: false,
    });
    console.log(`  • Created Transcript with ${transcript.segments.length} segments`);

    // 5. Test MeetingSummary
    console.log('\n[5/7] Testing Meeting AI Summary Persistence...');
    const summary = await MeetingSummary.create({
      meeting: newMeeting._id,
      meetingCode: testMeetingCode,
      overview: 'Cluster health diagnostic completed successfully across all 7 MongoDB Atlas schemas.',
      discussionPoints: ['Schemas aligned with frontend views', 'Bcrypt password hashing validated'],
      decisions: ['Approve deployment staging'],
      takeaways: ['MongoDB Atlas is production-ready'],
      unresolvedQuestions: [],
      nextSteps: ['Run final smoke tests'],
      actionItems: [
        {
          title: 'Finalize Vercel and Render deployment configurations',
          description: 'Set production env variables for Atlas connection string.',
          assigneeName: 'Alex Morgan',
          assigneeUser: adminUser._id,
          priority: 'High',
          convertedToTask: false,
        },
      ],
      isAIGenerated: true,
      modelUsed: 'gpt-4o-mini',
    });
    console.log(`  • Created AI Summary: Overview length = ${summary.overview.length} chars`);
    console.log(`  • Action items extracted: ${summary.actionItems.length}`);

    // Update meeting hasSummary flag
    await Meeting.findByIdAndUpdate(newMeeting._id, { hasSummary: true, status: 'ended' });

    // 6. Test Task Creation & Conversion from Summary
    console.log('\n[6/7] Testing Task Collection & Kanban Mapping...');
    const actionItem = summary.actionItems[0];
    const createdTask = await Task.create({
      title: actionItem.title,
      description: actionItem.description,
      assignee: actionItem.assigneeUser,
      assigneeName: actionItem.assigneeName,
      creator: adminUser._id,
      sourceMeeting: newMeeting._id,
      sourceMeetingTitle: newMeeting.title,
      sourceMeetingCode: newMeeting.meetingCode,
      priority: actionItem.priority,
      status: 'To Do',
      dueDate: new Date(Date.now() + 3 * 86400000),
    });
    console.log(`  • Created Task from Summary Action Item: "${createdTask.title}"`);
    console.log(`  • Priority: ${createdTask.priority}, Status: ${createdTask.status}`);

    // Test updating task status (Kanban movement)
    createdTask.status = 'In Progress';
    await createdTask.save();
    console.log(`  • Updated Task status to: "${createdTask.status}"`);

    // 7. Test Notifications
    console.log('\n[7/7] Testing Notification Collection...');
    const notification = await Notification.create({
      recipient: adminUser._id,
      title: 'Diagnostic Test Passed',
      message: 'All 7 MongoDB Atlas collections and columns validated successfully.',
      type: 'system',
      read: false,
      link: '/dashboard',
    });
    console.log(`  • Created Notification for ${adminUser.name}: "${notification.title}"`);

    // Clean up temporary test meeting & related records so DB stays clean
    await Transcript.findByIdAndDelete(transcript._id);
    await MeetingSummary.findByIdAndDelete(summary._id);
    await Task.findByIdAndDelete(createdTask._id);
    await Notification.findByIdAndDelete(notification._id);
    await Meeting.findByIdAndDelete(newMeeting._id);
    console.log('\n🧹 Temporary test records cleaned up cleanly.');

    console.log('\n====================================================');
    console.log('🎉 ALL DATABASE OPERATIONS VERIFIED 100% OPERATIONAL!');
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Integration Test Error:', err);
    process.exit(1);
  }
}

testDatabaseIntegration();
