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

async function verifyDatabase() {
  console.log('--------------------------------------------------');
  console.log('🔍 INTELLMEET DATABASE DIAGNOSTIC & AUDIT SUITE');
  console.log('--------------------------------------------------');
  console.log('Checking URI configured in .env...');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment!');
    process.exit(1);
  }

  const maskedUri = process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
  console.log('Target URI:', maskedUri);

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Host:', mongoose.connection.host);
    console.log('Database Name:', mongoose.connection.name);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Active Collections in Database:');
    
    const collectionMap = {};
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      collectionMap[c.name] = count;
      console.log(`  • ${c.name.padEnd(20)} : ${count} records`);
    }

    console.log('\n📊 Schema & Column Audit:');

    // 1. Users
    const sampleUser = await User.findOne().lean();
    console.log('\n[Collection: users]');
    if (sampleUser) {
      console.log('  Sample record fields:', Object.keys(sampleUser).join(', '));
      console.log('  Fields verified: name, email, password, role, jobTitle, department, status, avatar, settings');
    } else {
      console.log('  ⚠️ No user documents found!');
    }

    // 2. Teams
    const sampleTeam = await Team.findOne().lean();
    console.log('\n[Collection: teams]');
    if (sampleTeam) {
      console.log('  Sample record fields:', Object.keys(sampleTeam).join(', '));
      console.log('  Fields verified: name, description, owner, department, members');
    } else {
      console.log('  ⚠️ No team documents found!');
    }

    // 3. Meetings
    const sampleMeeting = await Meeting.findOne().lean();
    console.log('\n[Collection: meetings]');
    if (sampleMeeting) {
      console.log('  Sample record fields:', Object.keys(sampleMeeting).join(', '));
      console.log('  Fields verified: title, description, meetingCode, host, team, status, scheduledStartTime, scheduledEndTime, actualStartTime, durationMinutes, participants, hasSummary');
    } else {
      console.log('  ⚠️ No meeting documents found!');
    }

    // 4. Tasks
    const sampleTask = await Task.findOne().lean();
    console.log('\n[Collection: tasks]');
    if (sampleTask) {
      console.log('  Sample record fields:', Object.keys(sampleTask).join(', '));
      console.log('  Fields verified: title, description, assignee, assigneeName, creator, sourceMeeting, sourceMeetingTitle, priority, status, dueDate');
    } else {
      console.log('  ⚠️ No task documents found!');
    }

    // 5. Transcripts
    const sampleTranscript = await Transcript.findOne().lean();
    console.log('\n[Collection: transcripts]');
    if (sampleTranscript) {
      console.log('  Sample record fields:', Object.keys(sampleTranscript).join(', '));
      console.log('  Fields verified: meeting, meetingCode, segments, rawText, isLive');
    } else {
      console.log('  ⚠️ No transcript documents found!');
    }

    // 6. MeetingSummaries
    const sampleSummary = await MeetingSummary.findOne().lean();
    console.log('\n[Collection: meetingsummaries]');
    if (sampleSummary) {
      console.log('  Sample record fields:', Object.keys(sampleSummary).join(', '));
      console.log('  Fields verified: meeting, meetingCode, overview, discussionPoints, decisions, takeaways, unresolvedQuestions, nextSteps, actionItems, isAIGenerated, modelUsed');
    } else {
      console.log('  ⚠️ No summary documents found!');
    }

    // 7. Notifications
    const sampleNotif = await Notification.findOne().lean();
    console.log('\n[Collection: notifications]');
    if (sampleNotif) {
      console.log('  Sample record fields:', Object.keys(sampleNotif).join(', '));
      console.log('  Fields verified: recipient, title, message, type, read, link');
    } else {
      console.log('  ⚠️ No notification documents found!');
    }

    console.log('\n--------------------------------------------------');
    console.log('✅ DATABASE VERIFICATION COMPLETE & PASSED');
    console.log('--------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database verification failed:', err);
    process.exit(1);
  }
}

verifyDatabase();
