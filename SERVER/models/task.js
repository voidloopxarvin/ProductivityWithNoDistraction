const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true
  },
  roadmapDay: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  topics: [{
    type: String
  }],
  duration: {
    type: String,
    default: '1 hour'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['study', 'practice', 'revision', 'mock-test'],
    default: 'study'
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  scheduledDate: {
    type: Date,
    required: true
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  notes: String
}, { timestamps: true });

// Index for faster queries
taskSchema.index({ userId: 1, scheduledDate: 1 });
taskSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);
