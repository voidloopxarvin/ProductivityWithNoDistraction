const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('✅ Created uploads directory');
}

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'http://localhost:3000',
    'chrome-extension://*' // Allow Chrome extension requests
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/preplock', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// Socket.IO Connection Handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Import routes
const authRoutes = require('./routes/auth');
const syllabusRoutes = require('./routes/syllabus');
const roadmapRoutes = require('./routes/roadmap');
const flashcardRoutes = require('./routes/flashcard');
const focusRoutes = require('./routes/focus');
const extensionRoutes = require('./routes/extension');
const mockTestRoutes = require('./routes/mockTest');
const mentorRoutes = require('./routes/mentor');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/flashcard', flashcardRoutes);
app.use('/api/flashcards', flashcardRoutes); // Alias for consistency
app.use('/api/focus', focusRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/mocktest', mockTestRoutes);
app.use('/api/mentor', mentorRoutes); // ✅ Add this

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'PrepLock API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      syllabus: '/api/syllabus/*',
      roadmap: '/api/roadmap/*',
      flashcards: '/api/flashcards/*',
      focus: '/api/focus/*',
      extension: '/api/extension/*',
      mocktest: '/api/mocktest/*'
    }
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PrepLock API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    socketio: 'active'
  });
});

// Legacy health check (for backwards compatibility)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PrepLock API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`   PrepLock Backend Server`);
  console.log('   ================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📱 Mobile API: http://192.168.8.28:${PORT}/api`);
  console.log(`🌐 Web Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO: Active`);
  console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('💤 HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('💤 MongoDB connection closed');
      process.exit(0);
    });
  });
});
