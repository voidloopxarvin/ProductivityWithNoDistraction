const mongoose = require('mongoose');

const blockedAppSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  websites: [{
    url: String,
    addedFrom: String // 'web', 'mobile', 'extension'
  }],
  apps: [{
    packageName: String,
    name: String,
    addedFrom: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('BlockedApp', blockedAppSchema);
