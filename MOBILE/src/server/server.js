const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// ============================================
// HARDCODED CONSTANTS (Mobile App)
// ============================================

const MONGODB_URI = 'mongodb+srv://arvinwsingh_db_user:C0VwYYwTpe5wbjPW@cluster0.valop5a.mongodb.net/preplock';
const JWT_SECRET = 'preplock_super_secret_jwt_key_for_mobile_2024_hackathon';
const PORT = 5001; // Different port for mobile backend

// ============================================
// MIDDLEWARE SETUP
// ============================================

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// MONGODB CONNECTION
// ============================================

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected to PrepLock Mobile Database');
  console.log('🔗 Database:', MONGODB_URI.split('/').pop());
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// ============================================
// MONGOOSE SCHEMAS
// ============================================

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

// Flashcard Schema
const FlashcardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  subject: { type: String, default: 'General' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  mastered: { type: Boolean, default: false },
  reviewCount: { type: Number, default: 0 },
  lastReviewed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Study Session Schema
const StudySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  duration: { type: Number, default: 0 }, // in minutes
  cardsReviewed: { type: Number, default: 0 },
  cardsCorrect: { type: Number, default: 0 },
  sessionDate: { type: Date, default: Date.now }
});

// Roadmap Schema
const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  totalDays: { type: Number, required: true },
  dailyTasks: [{
    day: Number,
    title: String,
    description: String,
    completed: { type: Boolean, default: false }
  }],
  progress: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', UserSchema);
const Flashcard = mongoose.model('Flashcard', FlashcardSchema);
const StudySession = mongoose.model('StudySession', StudySessionSchema);
const Roadmap = mongoose.model('Roadmap', RoadmapSchema);

// ============================================
// JWT MIDDLEWARE
// ============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// SOCKET.IO CONNECTION
// ============================================

io.on('connection', (socket) => {
  console.log('🔌 Mobile Client Connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`📱 Mobile User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Mobile Client Disconnected:', socket.id);
  });
});

app.set('io', io);

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

    console.log('✅ New mobile user registered:', email);
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

    console.log('✅ Mobile user logged in:', email);
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// FLASHCARD ROUTES
// ============================================

// Get All Flashcards
app.get('/api/flashcards', authenticateToken, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({
      flashcards,
      total: flashcards.length,
      mastered: flashcards.filter(f => f.mastered).length
    });
  } catch (error) {
    console.error('❌ Get flashcards error:', error.message);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

// Create Flashcard
app.post('/api/flashcards', authenticateToken, async (req, res) => {
  try {
    const { question, answer, subject, difficulty } = req.body;

    const flashcard = new Flashcard({
      userId: req.user.userId,
      question,
      answer,
      subject,
      difficulty
    });

    await flashcard.save();

    res.status(201).json({
      message: 'Flashcard created successfully',
      flashcard
    });

    console.log('✅ Flashcard created by user:', req.user.userId);
  } catch (error) {
    console.error('❌ Create flashcard error:', error.message);
    res.status(500).json({ error: 'Failed to create flashcard' });
  }
});

// Update Flashcard (Mark as Mastered)
app.put('/api/flashcards/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mastered, reviewCount } = req.body;

    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { 
        mastered, 
        reviewCount: reviewCount || 0,
        lastReviewed: new Date()
      },
      { new: true }
    );

    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json({
      message: 'Flashcard updated successfully',
      flashcard
    });
  } catch (error) {
    console.error('❌ Update flashcard error:', error.message);
    res.status(500).json({ error: 'Failed to update flashcard' });
  }
});

// ============================================
// DASHBOARD ROUTES
// ============================================

// Get Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get flashcard stats
    const totalFlashcards = await Flashcard.countDocuments({ userId });
    const masteredFlashcards = await Flashcard.countDocuments({ userId, mastered: true });

    // Get recent study sessions
    const recentSessions = await StudySession.find({ userId })
      .sort({ sessionDate: -1 })
      .limit(7);

    // Get roadmap progress
    const roadmaps = await Roadmap.find({ userId });
    const totalTasks = roadmaps.reduce((sum, roadmap) => sum + roadmap.dailyTasks.length, 0);
    const completedTasks = roadmaps.reduce((sum, roadmap) => 
      sum + roadmap.dailyTasks.filter(task => task.completed).length, 0
    );

    // Calculate study streak (mock data for demo)
    const studyStreak = Math.floor(Math.random() * 15) + 1;

    res.json({
      flashcards: {
        total: totalFlashcards,
        mastered: masteredFlashcards,
        remaining: totalFlashcards - masteredFlashcards
      },
      roadmaps: {
        total: roadmaps.length,
        totalTasks,
        completedTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      studyStats: {
        streak: studyStreak,
        totalSessions: recentSessions.length,
        avgSessionTime: recentSessions.length > 0 ? 
          Math.round(recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length) : 0
      }
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ============================================
// HEALTH CHECK & TEST ROUTES
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PrepLock Mobile API is running',
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// Test route to seed some demo data
app.post('/api/demo/seed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Create demo flashcards
    const demoFlashcards = [
      {
        userId,
        question: "What is React Native?",
        answer: "A framework for building native mobile apps using React",
        subject: "Mobile Development",
        difficulty: "Easy"
      },
      {
        userId,
        question: "What is MongoDB?",
        answer: "A NoSQL document database that stores data in JSON-like documents",
        subject: "Database",
        difficulty: "Medium"
      },
      {
        userId,
        question: "What is JWT?",
        answer: "JSON Web Token - a compact way to securely transmit information between parties",
        subject: "Authentication",
        difficulty: "Medium"
      }
    ];

    await Flashcard.insertMany(demoFlashcards);

    res.json({
      message: 'Demo data seeded successfully',
      flashcardsCreated: demoFlashcards.length
    });

    console.log('✅ Demo data seeded for user:', userId);
  } catch (error) {
    console.error('❌ Seed demo data error:', error.message);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

// ============================================
// SERVER START
// ============================================

server.listen(PORT, () => {
  console.log(`🚀 PrepLock Mobile Server running on port ${PORT}`);
  console.log(`📱 Mobile API Base URL: http://localhost:${PORT}`);
  console.log(`🔗 Database: MongoDB Atlas`);
  console.log(`✅ CORS enabled for all origins`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ Server shut down gracefully');
      process.exit(0);
    });
  });
});

module.exports = app;
