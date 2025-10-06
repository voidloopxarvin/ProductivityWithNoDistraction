const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const MockTest = require('../models/MockTest');
const TestAttempt = require('../models/TestAttempt');
const Syllabus = require('../models/Syllabus');
const authMiddleware = require('../middleware/authMiddleware');
const mockTestGenerator = require('../services/mockTestGenerator');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// ==================== GENERATE FROM NEW PDF ====================
router.post('/generate-from-pdf', authMiddleware, upload.single('pdf'), async (req, res) => {
  try {
    const { questionCount = 10 } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    console.log('📄 Processing PDF:', req.file.originalname);

    // Parse PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim().length < 100) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'PDF appears to be empty or unreadable'
      });
    }

    console.log('📝 Extracted text length:', pdfText.length);

    // Extract topics from PDF content (take meaningful lines as topics)
    const lines = pdfText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10 && line.length < 100)
      .filter(line => !line.match(/^\d+$|^page \d+/i));

    const topics = [...new Set(lines.slice(0, 30))].slice(0, 10);

    if (topics.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Could not extract topics from PDF'
      });
    }

    console.log('📚 Extracted topics:', topics);

    // Generate questions with PDF content
    const questions = await mockTestGenerator.generateMockTest(
      topics,
      parseInt(questionCount),
      'mixed',
      pdfText
    );

    if (questions.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate questions from PDF'
      });
    }

    // Create mock test
    const mockTest = await MockTest.create({
      userId: req.userId,
      title: `Mock Test - ${req.file.originalname.replace('.pdf', '')}`,
      topics: topics,
      questions,
      totalQuestions: questions.length,
      duration: Math.max(questions.length * 2, 15)
    });

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    console.log('✅ Mock test created from PDF:', mockTest._id);

    res.json({
      success: true,
      mockTest
    });

  } catch (err) {
    console.error('❌ Generate from PDF error:', err);
    
    // Cleanup file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ==================== GENERATE FROM EXISTING SYLLABUS ====================
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { syllabusId, questionCount = 10, difficulty = 'mixed' } = req.body;

    console.log('🔍 Generate request:', { syllabusId, questionCount, difficulty });

    // Get syllabus with PDF content
    const syllabus = await Syllabus.findOne({
      _id: syllabusId,
      userId: req.userId
    });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    // Extract topics
    const topics = syllabus.topics.map(t => t.name || t);
    
    if (topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No topics found in syllabus'
      });
    }

    console.log('📚 Topics:', topics);

    // Pass PDF content to generator for better context
    const pdfContent = syllabus.pdfText || syllabus.content || null;

    // Generate questions using AI with PDF context
    const questions = await mockTestGenerator.generateMockTest(
      topics,
      questionCount,
      difficulty,
      pdfContent
    );

    if (questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate quality questions. Please try again.'
      });
    }

    // Create mock test
    const mockTest = await MockTest.create({
      userId: req.userId,
      syllabusId,
      title: `Mock Test - ${syllabus.title}`,
      topics,
      questions,
      totalQuestions: questions.length,
      duration: Math.max(questions.length * 2, 15)
    });

    console.log('✅ Mock test created:', mockTest._id);

    res.json({
      success: true,
      mockTest
    });

  } catch (err) {
    console.error('❌ Generate mock test error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ==================== GET ALL MOCK TESTS ====================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const mockTests = await MockTest.find({ userId: req.userId })
      .populate('syllabusId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      mockTests
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ==================== GET SPECIFIC MOCK TEST ====================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const mockTest = await MockTest.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!mockTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    // Don't send correct answers initially
    const testForUser = {
      ...mockTest.toObject(),
      questions: mockTest.questions.map(q => ({
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
        topic: q.topic
      }))
    };

    res.json({
      success: true,
      mockTest: testForUser
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ==================== SUBMIT TEST ====================
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;

    const mockTest = await MockTest.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!mockTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    // Grade answers
    const gradedAnswers = answers.map(answer => ({
      questionIndex: answer.questionIndex,
      selectedAnswer: answer.selectedAnswer,
      isCorrect: mockTest.questions[answer.questionIndex].correctAnswer === answer.selectedAnswer,
      timeTaken: answer.timeTaken || 0
    }));

    // Analyze results
    const analysis = mockTestGenerator.analyzeTestResults(gradedAnswers, mockTest);

    // Create test attempt
    const attempt = await TestAttempt.create({
      userId: req.userId,
      mockTestId: mockTest._id,
      answers: gradedAnswers,
      score: analysis.score,
      totalQuestions: analysis.totalQuestions,
      percentage: analysis.percentage,
      weakTopics: analysis.weakTopics,
      completedAt: new Date(),
      timeSpent: timeSpent || 0
    });

    res.json({
      success: true,
      attempt,
      analysis,
      correctAnswers: mockTest.questions.map((q, idx) => ({
        questionIndex: idx,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }))
    });

  } catch (err) {
    console.error('❌ Submit test error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ==================== GET TEST ATTEMPTS ====================
router.get('/:id/attempts', authMiddleware, async (req, res) => {
  try {
    const attempts = await TestAttempt.find({
      mockTestId: req.params.id,
      userId: req.userId
    }).sort({ completedAt: -1 });

    res.json({
      success: true,
      attempts
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ==================== DELETE MOCK TEST ====================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await MockTest.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    await TestAttempt.deleteMany({
      mockTestId: req.params.id,
      userId: req.userId
    });

    res.json({
      success: true,
      message: 'Mock test deleted'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;