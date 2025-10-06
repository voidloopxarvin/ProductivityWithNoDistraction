const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  examDate: {
    type: Date,
    required: true
  },
  rawText: {
    type: String,
    required: true
  },
  topics: [{
    name: String,
    subtopics: [String],
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    estimatedHours: Number
  }],
  fileUrl: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Syllabus', syllabusSchema);
