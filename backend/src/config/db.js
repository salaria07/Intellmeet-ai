import mongoose from 'mongoose';
import { DB_FILE } from '../utils/memoryStore.js';

let isConnected = false;
let isDiskFallback = false;
let mongoHost = '';
let mongoDbName = '';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellmeet';

  try {
    // Attempt Mongoose connection with a short initial timeout for responsive startup
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    isConnected = true;
    isDiskFallback = false;
    mongoHost = conn.connection.host;
    mongoDbName = conn.connection.name;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return true;
  } catch (error) {
    console.warn(`[MongoDB] Notice: No external/local MongoDB daemon detected at "${uri}".`);
    console.info(`[Database] Activating Persistent Local Database at:`);
    console.info(`[Database] 📁 ${DB_FILE}`);
    console.info(`[Database] All registrations, meetings, tasks, and summaries will persist directly to this disk file.`);
    console.info(`[Database] To connect to MongoDB Atlas, add your connection string to MONGODB_URI in backend/.env.`);

    isConnected = false;
    isDiskFallback = true;
    return false;
  }
};

export const getDBStatus = () => {
  if (isConnected) {
    return {
      activeDatabase: 'MongoDB Atlas / Local MongoDB',
      type: 'MongoDB',
      host: mongoHost,
      name: mongoDbName,
      status: 'Connected',
    };
  }

  return {
    activeDatabase: 'IntellMeet Local Persistent Disk Database',
    type: 'Disk-Backed JSON Database Engine',
    filePath: DB_FILE,
    storageLocation: 'backend/database/intellmeet_db.json',
    status: 'Active (Persisting to Disk)',
    note: 'To switch to MongoDB Atlas, provide MONGODB_URI in backend/.env',
  };
};
