const express = require('express');
const router = express.Router();
const ExtensionTask = require('../models/ExtensionTask');
const TimeSession = require('../models/TimeSession');
const authMiddleware = require('../middleware/authMiddleware');

// ==================== EXTENSION TASKS ====================

// Get all extension tasks
router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tasks = await ExtensionTask.find(filter)
      .sort({ createdAt: -1, priority: -1 });

    res.json({
      success: true,
      tasks
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get today's extension tasks
router.get('/tasks/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await ExtensionTask.find({
      userId: req.userId,
      $or: [
        { dueDate: { $gte: today, $lt: tomorrow } },
        { status: 'in-progress' },
        { isActive: true }
      ]
    }).sort({ priority: -1, createdAt: -1 });

    res.json({
      success: true,
      tasks
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Create extension task
router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, dueDate, estimatedTime, category, tags, blockedSites } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    const task = await ExtensionTask.create({
      userId: req.userId,
      title,
      description,
      priority: priority || 'medium',
      dueDate,
      estimatedTime: estimatedTime || 30,
      category: category || 'general',
      tags: tags || [],
      blockedSites: blockedSites || []
    });

    console.log('✅ Extension task created:', task.title);

    res.status(201).json({
      success: true,
      task
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Update extension task
router.put('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const task = await ExtensionTask.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const updates = req.body;
    
    // If marking as completed
    if (updates.status === 'completed' && task.status !== 'completed') {
      updates.completedAt = new Date();
      updates.isActive = false;
    }

    // If starting task
    if (updates.status === 'in-progress' && task.status === 'pending') {
      updates.startedAt = new Date();
      updates.isActive = true;
    }

    Object.assign(task, updates);
    await task.save();

    console.log('✅ Task updated:', task.title, '→', task.status);

    res.json({
      success: true,
      task
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Delete extension task
router.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const task = await ExtensionTask.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    console.log('🗑️ Task deleted:', task.title);

    res.json({
      success: true,
      message: 'Task deleted'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ==================== TIME TRACKING ====================

// Start time session
router.post('/time/start', authMiddleware, async (req, res) => {
  try {
    const { extensionTaskId, category } = req.body;

    console.log('⏱️ Starting timer for task:', extensionTaskId);

    // End any active sessions first
    const activeSessions = await TimeSession.find({
      userId: req.userId,
      isActive: true
    });

    for (let session of activeSessions) {
      session.endTime = new Date();
      session.duration = Math.round((session.endTime - session.startTime) / 60000);
      session.isActive = false;
      await session.save();

      // Update task time
      if (session.extensionTaskId) {
        await ExtensionTask.findByIdAndUpdate(session.extensionTaskId, {
          $inc: { actualTimeSpent: session.duration },
          isActive: false
        });
      }
    }

    // Create new session
    const newSession = await TimeSession.create({
      userId: req.userId,
      extensionTaskId,
      startTime: new Date(),
      category: category || 'work',
      isActive: true
    });

    // Mark task as active
    if (extensionTaskId) {
      await ExtensionTask.findByIdAndUpdate(extensionTaskId, {
        status: 'in-progress',
        isActive: true
      });
    }

    console.log('✅ Timer started');

    res.json({
      success: true,
      session: newSession
    });
  } catch (err) {
    console.error('Start timer error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Stop time session
router.post('/time/stop', authMiddleware, async (req, res) => {
  try {
    const session = await TimeSession.findOne({
      userId: req.userId,
      isActive: true
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session'
      });
    }

    console.log('⏹️ Stopping timer');

    session.endTime = new Date();
    session.duration = Math.round((session.endTime - session.startTime) / 60000);
    session.isActive = false;
    await session.save();

    // Update task time spent
    if (session.extensionTaskId) {
      await ExtensionTask.findByIdAndUpdate(session.extensionTaskId, {
        $inc: { actualTimeSpent: session.duration },
        isActive: false
      });
    }

    console.log(`✅ Timer stopped: ${session.duration} minutes`);

    res.json({
      success: true,
      session
    });
  } catch (err) {
    console.error('Stop timer error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get active session
router.get('/time/active', authMiddleware, async (req, res) => {
  try {
    const session = await TimeSession.findOne({
      userId: req.userId,
      isActive: true
    }).populate('extensionTaskId');

    res.json({
      success: true,
      session
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get time history
router.get('/time/history', authMiddleware, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const sessions = await TimeSession.find({
      userId: req.userId,
      startTime: { $gte: startDate },
      isActive: false
    })
    .populate('extensionTaskId')
    .sort({ startTime: -1 });

    res.json({
      success: true,
      sessions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ==================== ANALYTICS ====================

// Get analytics/stats
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(0); // All time
    }

    console.log('📊 Generating analytics for period:', period);

    // Task stats
    const totalTasks = await ExtensionTask.countDocuments({ userId: req.userId });
    const completedTasks = await ExtensionTask.countDocuments({ 
      userId: req.userId, 
      status: 'completed',
      completedAt: { $gte: startDate }
    });
    const pendingTasks = await ExtensionTask.countDocuments({ 
      userId: req.userId, 
      status: 'pending' 
    });
    const inProgressTasks = await ExtensionTask.countDocuments({ 
      userId: req.userId, 
      status: 'in-progress' 
    });

    // Time tracking stats
    const sessions = await TimeSession.find({
      userId: req.userId,
      startTime: { $gte: startDate },
      isActive: false
    });

    const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    // Tasks by priority
    const tasksByPriority = await ExtensionTask.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Tasks by category
    const tasksByCategory = await ExtensionTask.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Daily breakdown
    const dailyStats = await TimeSession.aggregate([
      {
        $match: {
          userId: req.userId,
          startTime: { $gte: startDate },
          isActive: false
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
          totalMinutes: { $sum: "$duration" },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        time: {
          totalMinutes: totalTimeSpent,
          totalHours: Math.round(totalTimeSpent / 60 * 10) / 10,
          averagePerDay: dailyStats.length > 0 ? Math.round(totalTimeSpent / dailyStats.length) : 0,
          averagePerTask: completedTasks > 0 ? Math.round(totalTimeSpent / completedTasks) : 0
        },
        breakdown: {
          byPriority: tasksByPriority,
          byCategory: tasksByCategory,
          daily: dailyStats
        }
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
