import 'dotenv/config';
import express from 'express';
import os from 'os';
import { createServer } from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import topicRoutes from './routes/topics.js';
import messageRoutes from './routes/messages.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import { authenticateSocket } from './middleware/auth.js';
import { initCleanupJobs } from './jobs/cleanup.js';
import { initSocket, onlineUsers } from './socket.js';

// Helper function for timestamped logging
const log = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`, ...args);
};

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5000'];

// Dynamically add local network IP for mobile testing
const interfaces = os.networkInterfaces();
for (const devName in interfaces) {
  const iface = interfaces[devName];
  for (let i = 0; i < iface.length; i++) {
    const alias = iface[i];
    if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
      log('info', `Discovered local IP: ${alias.address}`);
      allowedOrigins.push(`http://${alias.address}:5173`);
      allowedOrigins.push(`http://${alias.address}:5000`);
    }
  }
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.includes(o.replace('http://', '').replace('https://', ''))) || origin.includes('replit') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Morgan HTTP request logging - before routes
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const io = initSocket(httpServer, allowedOrigins);

io.use(authenticateSocket);



io.on('connection', (socket) => {
  const userId = socket.user?.id;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    io.emit('user_online', { userId });
  }

  socket.on('join_topic', (topicId) => {
    socket.join(`topic:${topicId}`);
  });

  socket.on('leave_topic', (topicId) => {
    socket.leave(`topic:${topicId}`);
  });

  socket.on('join_global', () => {
    socket.join('global');
  });

  socket.on('new_message', (data) => {
    // Only broadcast to topic/global room if it's NOT a thread message
    // Thread messages should only go to the thread room via new_thread_message event
    if (!data.parentMessageId) {
      const room = data.topicId ? `topic:${data.topicId}` : 'global';
      socket.to(room).emit('message', data);
    }
  });

  socket.on('join_thread', (threadId) => {
    socket.join(`thread:${threadId}`);
  });

  socket.on('reaction', (data) => {
    const room = data.topicId ? `topic:${data.topicId}` : 'global';
    io.to(room).emit('reaction_update', data);
    if (data.threadId) {
      io.to(`thread:${data.threadId}`).emit('reaction_update', data);
    }
  });

  socket.on('disconnect', () => {
    if (userId) {
      onlineUsers.delete(userId);
      io.emit('user_offline', { userId });
    }
  });
});

export { onlineUsers };

mongoose.connect(MONGO_URI)
  .then(() => {
    log('info', 'Connected to MongoDB');
    initCleanupJobs();
    httpServer.listen(PORT, '0.0.0.0', () => {
      log('info', `Let's Talk server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    log('error', 'MongoDB connection error:', err);
    process.exit(1);
  });
