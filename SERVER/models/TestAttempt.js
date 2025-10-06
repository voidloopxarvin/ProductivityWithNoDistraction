const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mockTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest',
    required: true
  },
  answers: [{
    questionIndex: Number,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeTaken: Number // seconds per question
  }],
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: Number,
  percentage: Number,
  weakTopics: [{
    topic: String,
    correctCount: Number,
    totalCount: Number,
    percentage: Number
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  timeSpent: Number // total seconds
}, {
  timestamps: true
});

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
