// server/models/ExtensionLog.js
const mongoose = require('mongoose');

const extensionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Activity type
  type: {
    type: String,
    enum: ['site_blocked', 'task_completed', 'focus_session', 'daily_reset'],
    required: true
  },
  
  // For blocked sites
  blockedUrl: {
    type: String
  },
  
  // For task completion
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  
  // For focus sessions
  focusMinutes: {
    type: Number,
    default: 0
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for efficient queries
extensionLogSchema.index({ userId: 1, timestamp: -1 });
extensionLogSchema.index({ userId: 1, type: 1, timestamp: -1 });

module.exports = mongoose.model('ExtensionLog', extensionLogSchema);