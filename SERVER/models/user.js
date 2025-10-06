// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  // examDate: {
  //   type: Date,
  //   required: true
  // },
  
  // Extension-related fields
  streak: {
    type: Number,
    default: 0
  },
  lastCompletedDate: {
    type: String, // Store as string for easy comparison
    default: null
  },
  blockedSites: {
    type: [String],
    default: [
      'youtube.com',
      'instagram.com',
      'facebook.com',
      'twitter.com',
      'reddit.com',
      'netflix.com',
      'tiktok.com'
    ]
  },
  strictMode: {
    type: Boolean,
    default: false
  },
  enableSounds: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
