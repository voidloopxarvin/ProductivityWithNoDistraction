const mongoose = require('mongoose');

const roadmapDaySchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  topics: [{
    type: String
  }],
  subtopics: [{
    type: String
  }],
  duration: {
    type: String,
    default: '4 hours'
  },
  focus: String,
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  notes: String
});

const roadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  syllabusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Syllabus',
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
  startDate: {
    type: Date,
    default: Date.now
  },
  totalDays: {
    type: Number,
    required: true
  },
  days: [roadmapDaySchema],
  progress: {
    completed: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  }
}, { timestamps: true });

// Calculate progress before saving
roadmapSchema.pre('save', function(next) {
  if (this.days && this.days.length > 0) {
    const completed = this.days.filter(d => d.completed).length;
    const total = this.days.length;
    this.progress = {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }
  next();
});

// ✅ FIX: Check if model exists before creating it
module.exports = mongoose.models.Roadmap || mongoose.model('Roadmap', roadmapSchema);
