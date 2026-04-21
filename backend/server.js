require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { initializeDatabase } = require('./src/db/migrations');
const { initializeAI } = require('./src/services/aiService');
const { startCronJobs } = require('./src/services/cronService');
const { setupSocket } = require('./src/socket/index');

// Routes
const authRoutes = require('./src/routes/auth');
const progressRoutes = require('./src/routes/progress');
const tasksRoutes = require('./src/routes/tasks');
const commitsRoutes = require('./src/routes/commits');
const notesRoutes = require('./src/routes/notes');
const statsRoutes = require('./src/routes/stats');
const notificationsRoutes = require('./src/routes/notifications');
const topicsRoutes = require('./src/routes/topics');
const plannerRoutes = require('./src/routes/planner');
const aiRoutes = require('./src/routes/ai');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/commits', commitsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Initialize
initializeDatabase();
initializeAI();
setupSocket(io);
startCronJobs();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('\n🚀 Zeron & Careon Backend Started!');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`📦 Database: SQLite (${process.env.DB_PATH})`);
  console.log('\n👤 Default Users:');
  console.log('   Zeron → username: zeron | password: zeron123');
  console.log('   Careon → username: careon | password: careon123\n');
});

module.exports = { app, io };
