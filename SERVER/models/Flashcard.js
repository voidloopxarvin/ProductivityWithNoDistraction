const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  syllabusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Syllabus'
  },
  title: {
    type: String,
    required: true
  },
  cards: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    category: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    mastered: {
      type: Boolean,
      default: false
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    lastReviewed: Date
  }],
  totalCards: {
    type: Number,
    default: 0
  },
  masteredCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Flashcard', flashcardSchema);
