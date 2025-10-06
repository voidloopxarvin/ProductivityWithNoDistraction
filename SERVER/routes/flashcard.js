const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');
const Syllabus = require('../models/Syllabus');
const authMiddleware = require('../middleware/authMiddleware');
const flashcardGenerator = require('../services/flashcardGenerator');
const pdfProcessor = require('../services/pdfProcessor');
const upload = require('../middleware/uploadMiddleware');

// Generate flashcards from existing syllabus
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { syllabusId, count = 20 } = req.body;

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

    console.log('🎴 Generating flashcards from syllabus...');
    
    // FIX: Use 'rawText' instead of 'extractedText'
    const topics = syllabus.topics.map(t => t.name || t);
    const pdfContent = syllabus.rawText || '';

    console.log('📚 Topics:', topics);
    console.log('📄 Content length:', pdfContent.length);

    const cards = await flashcardGenerator.generateFlashcards(topics, pdfContent, count);

    console.log('✅ Generated cards:', cards.length);

    const flashcardSet = await Flashcard.create({
      userId: req.userId,
      syllabusId,
      title: `Flashcards - ${syllabus.title}`,
      cards: cards.map(card => ({
        question: card.question,
        answer: card.answer,
        category: card.category || 'General',
        difficulty: card.difficulty || 'medium',
        mastered: false,
        reviewCount: 0
      })),
      totalCards: cards.length,
      masteredCount: 0
    });

    console.log('✅ Flashcard set created:', flashcardSet._id);

    res.json({
      success: true,
      flashcardSet
    });

  } catch (err) {
    console.error('❌ Generate flashcards error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Generate flashcards from new PDF
router.post('/generate-from-pdf', authMiddleware, upload.single('pdf'), async (req, res) => {
  try {
    const { count = 20 } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    console.log('🎴 Generating flashcards from new PDF...');

    // Extract text from PDF
    const pdfContent = await pdfProcessor.extractText(req.file.path);
    console.log('📄 Extracted text length:', pdfContent.length);

    // Extract topics (improved keyword extraction)
    const lines = pdfContent.split('\n').filter(line => line.trim());
    const topics = lines
      .filter(line => line.length > 10 && line.length < 100)
      .filter(line => !line.match(/^\d+$|^page|^chapter/i))
      .slice(0, 15);

    console.log('📚 Extracted topics:', topics);

    const cards = await flashcardGenerator.generateFlashcards(topics, pdfContent, count);

    const flashcardSet = await Flashcard.create({
      userId: req.userId,
      title: `Flashcards - ${req.file.originalname.replace('.pdf', '')}`,
      cards: cards.map(card => ({
        question: card.question,
        answer: card.answer,
        category: card.category || 'General',
        difficulty: card.difficulty || 'medium',
        mastered: false,
        reviewCount: 0
      })),
      totalCards: cards.length,
      masteredCount: 0
    });

    console.log('✅ Flashcard set created from PDF:', flashcardSet._id);

    res.json({
      success: true,
      flashcardSet
    });

  } catch (err) {
    console.error('❌ Generate flashcards from PDF error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get all flashcard sets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ userId: req.userId })
      .populate('syllabusId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      flashcards
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get specific flashcard set
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard set not found'
      });
    }

    res.json({
      success: true,
      flashcardSet
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Mark card as mastered
router.put('/:id/card/:cardIndex/master', authMiddleware, async (req, res) => {
  try {
    const { id, cardIndex } = req.params;

    const flashcardSet = await Flashcard.findOne({
      _id: id,
      userId: req.userId
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard set not found'
      });
    }

    const index = parseInt(cardIndex);
    const card = flashcardSet.cards[index];

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    card.mastered = true;
    card.lastReviewed = new Date();
    card.reviewCount += 1;

    // Update mastered count
    flashcardSet.masteredCount = flashcardSet.cards.filter(c => c.mastered).length;

    await flashcardSet.save();

    res.json({
      success: true,
      flashcardSet
    });
  } catch (err) {
    console.error('Mark mastered error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Mark card as reviewed
router.put('/:id/card/:cardIndex/review', authMiddleware, async (req, res) => {
  try {
    const { id, cardIndex } = req.params;

    const flashcardSet = await Flashcard.findOne({
      _id: id,
      userId: req.userId
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard set not found'
      });
    }

    const index = parseInt(cardIndex);
    const card = flashcardSet.cards[index];

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    card.lastReviewed = new Date();
    card.reviewCount += 1;

    await flashcardSet.save();

    res.json({
      success: true,
      flashcardSet
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Delete flashcard set
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Flashcard.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    res.json({
      success: true,
      message: 'Flashcard set deleted'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
