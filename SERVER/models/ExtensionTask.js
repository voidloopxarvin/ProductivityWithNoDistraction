const mongoose = require('mongoose');

const extensionTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  category: {
    type: String,
    default: 'general'
  },
  tags: [{
    type: String
  }],
  dueDate: {
    type: Date
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 30
  },
  actualTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  // For website blocking
  blockedSites: [{
    type: String
  }],
  // Extension-specific fields
  isActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
extensionTaskSchema.index({ userId: 1, status: 1 });
extensionTaskSchema.index({ userId: 1, dueDate: 1 });
extensionTaskSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('ExtensionTask', extensionTaskSchema);
