import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedInitialData } from './utils/memoryStore.js';
import { seedMongoDatabase } from './utils/seedMongo.js';
import { configureMeetingSockets } from './sockets/meetingSocket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database (MongoDB Atlas)
  const isMongoConnected = await connectDB();
  if (isMongoConnected) {
    await seedMongoDatabase();
  } else {
    await seedInitialData();
  }

  const server = http.createServer(app);

  const clientUrls = (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    ...clientUrls,
  ];

  // Attach Socket.io for WebRTC signaling and real-time meeting events
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  app.set('io', io);

  configureMeetingSockets(io);

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 IntellMeet AI Enterprise Server running on port ${PORT}`);
    console.log(`🌐 API Endpoint: http://localhost:${PORT}/api/health`);
    console.log(`📡 Socket.io Real-time Signaling: ACTIVE`);
    console.log(`====================================================`);
  });
};

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
