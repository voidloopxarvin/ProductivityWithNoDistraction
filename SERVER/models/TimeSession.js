const mongoose = require('mongoose');

const timeSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    default: 'work'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TimeSession', timeSessionSchema);
