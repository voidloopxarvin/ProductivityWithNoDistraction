const mongoose = require('mongoose');

const mockTestSchema = new mongoose.Schema({
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
  topics: [{
    type: String
  }],
  questions: [{
    question: {
      type: String,
      required: true
    },
    options: [{
      type: String
    }],
    correctAnswer: {
      type: Number, // Index: 0-3
      required: true
    },
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    topic: String
  }],
  duration: {
    type: Number, // minutes
    default: 30
  },
  totalQuestions: {
    type: Number,
    default: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MockTest', mockTestSchema);
