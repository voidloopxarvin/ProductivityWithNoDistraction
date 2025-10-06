const express = require('express');
const router = express.Router();
const FocusSession = require('../models/FocusSession');
const BlockedApp = require('../models/BlockedApp');
const auth = require('../middleware/authMiddleware');

// Start focus session
router.post('/start', auth, async (req, res) => {
  try {
    const { duration, platform, blockedApps } = req.body;
    
    // End any existing active sessions
    await FocusSession.updateMany(
      { userId: req.user._id, status: 'active' },
      { status: 'cancelled' }
    );
    
    const session = await FocusSession.create({
      userId: req.user._id,
      duration,
      platform,
      startTime: new Date(),
      endTime: new Date(Date.now() + duration * 60000),
      blockedApps: blockedApps || [],
      status: 'active'
    });
    
    // Emit to all user devices via Socket.IO
    const io = req.app.get('io');
    io.to(`user_${req.user._id}`).emit('focus_started', {
      session,
      blockedApps: session.blockedApps
    });
    
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop focus session
router.post('/stop', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOneAndUpdate(
      { userId: req.user._id, status: 'active' },
      { status: 'completed', actualEndTime: new Date() },
      { new: true }
    );
    
    // Emit to all user devices
    const io = req.app.get('io');
    io.to(`user_${req.user._id}`).emit('focus_stopped');
    
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active session
router.get('/active', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      userId: req.user._id,
      status: 'active',
      endTime: { $gt: new Date() }
    });
    
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all sessions (history)
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await FocusSession.find({ userId: req.user._id })
      .sort({ startTime: -1 })
      .limit(50);
    
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get/Update blocked apps
router.get('/blocked-apps', auth, async (req, res) => {
  try {
    let blockedApps = await BlockedApp.findOne({ userId: req.user._id });
    
    if (!blockedApps) {
      blockedApps = await BlockedApp.create({
        userId: req.user._id,
        websites: [],
        apps: []
      });
    }
    
    res.json({ success: true, blockedApps });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/blocked-apps', auth, async (req, res) => {
  try {
    const { websites, apps } = req.body;
    
    const blockedApps = await BlockedApp.findOneAndUpdate(
      { userId: req.user._id },
      { 
        websites: websites || [],
        apps: apps || []
      },
      { upsert: true, new: true }
    );
    
    // Emit to all user devices
    const io = req.app.get('io');
    io.to(`user_${req.user._id}`).emit('blocked_apps_updated', blockedApps);
    
    res.json({ success: true, blockedApps });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
