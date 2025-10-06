const mongoose = require('mongoose');

const mentorChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    relatedDay: Number,
    relatedTopics: [String],
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MentorChat', mentorChatSchema);
