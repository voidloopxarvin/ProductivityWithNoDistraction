// server/controllers/extensionController.js
const Task = require('../models/task');
const ExtensionLog = require('../models/ExtensionLog');
const User = require('../models/user');

// Get today's tasks for the extension
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's tasks
    const tasks = await Task.find({
      userId,
      scheduledDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).sort({ priority: -1, createdAt: 1 });

    // Format for extension
    const formattedTasks = tasks.map(task => ({
      id: task._id.toString(),
      text: task.title,
      description: task.description,
      completed: task.completed,
      priority: task.priority,
      duration: task.duration,
      createdAt: task.createdAt
    }));

    res.json({
      success: true,
      tasks: formattedTasks,
      totalTasks: formattedTasks.length,
      completedTasks: formattedTasks.filter(t => t.completed).length,
      pendingTasks: formattedTasks.filter(t => !t.completed).length
    });

  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: err.message
    });
  }
};

// Mark a task as complete from extension
exports.completeTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId, completed } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    // Find and update task
    const task = await Task.findOne({
      _id: taskId,
      userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.completed = completed !== undefined ? completed : true;
    task.completedAt = completed ? new Date() : null;
    await task.save();

    // Log the completion
    await ExtensionLog.create({
      userId,
      type: 'task_completed',
      taskId: task._id,
      metadata: {
        taskTitle: task.title,
        priority: task.priority
      }
    });

    // Check if all tasks are completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allTasks = await Task.find({
      userId,
      scheduledDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    const allCompleted = allTasks.length > 0 && allTasks.every(t => t.completed);

    // Update user streak if all completed
    if (allCompleted) {
      const user = await User.findById(userId);
      if (user) {
        const todayStr = today.toDateString();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (user.lastCompletedDate !== todayStr) {
          if (user.lastCompletedDate === yesterdayStr) {
            user.streak = (user.streak || 0) + 1;
          } else {
            user.streak = 1;
          }
          user.lastCompletedDate = todayStr;
          await user.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: {
        id: task._id,
        completed: task.completed
      },
      allCompleted,
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.completed).length
    });

  } catch (err) {
    console.error('Error completing task:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: err.message
    });
  }
};

// Log blocked site attempt
exports.logBlockedSite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { url, timestamp } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    await ExtensionLog.create({
      userId,
      type: 'site_blocked',
      blockedUrl: url,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      metadata: {
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Blocked site logged'
    });

  } catch (err) {
    console.error('Error logging blocked site:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to log blocked site',
      error: err.message
    });
  }
};

// Log focus session
exports.logFocusSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { minutes, startTime, endTime } = req.body;

    if (!minutes || minutes < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid focus duration is required'
      });
    }

    await ExtensionLog.create({
      userId,
      type: 'focus_session',
      focusMinutes: minutes,
      metadata: {
        startTime,
        endTime
      }
    });

    res.json({
      success: true,
      message: 'Focus session logged'
    });

  } catch (err) {
    console.error('Error logging focus session:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to log focus session',
      error: err.message
    });
  }
};

// Get extension analytics/stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Get logs for the period
    const logs = await ExtensionLog.find({
      userId,
      timestamp: { $gte: startDate }
    });

    // Calculate stats
    const blockedSites = logs.filter(l => l.type === 'site_blocked');
    const completedTasks = logs.filter(l => l.type === 'task_completed');
    const focusSessions = logs.filter(l => l.type === 'focus_session');
    
    const totalFocusMinutes = focusSessions.reduce((sum, log) => sum + (log.focusMinutes || 0), 0);
    
    // Get most blocked sites
    const siteCount = {};
    blockedSites.forEach(log => {
      const url = log.blockedUrl;
      siteCount[url] = (siteCount[url] || 0) + 1;
    });
    
    const topBlockedSites = Object.entries(siteCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, count]) => ({ url, count }));

    // Daily breakdown
    const dailyStats = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          blocked: 0,
          completed: 0,
          focusMinutes: 0
        };
      }
      
      if (log.type === 'site_blocked') dailyStats[date].blocked++;
      if (log.type === 'task_completed') dailyStats[date].completed++;
      if (log.type === 'focus_session') dailyStats[date].focusMinutes += log.focusMinutes || 0;
    });

    res.json({
      success: true,
      stats: {
        period: `${days} days`,
        totalBlocked: blockedSites.length,
        totalTasksCompleted: completedTasks.length,
        totalFocusMinutes,
        totalFocusHours: Math.round(totalFocusMinutes / 60 * 10) / 10,
        topBlockedSites,
        dailyBreakdown: Object.values(dailyStats).sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )
      }
    });

  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: err.message
    });
  }
};

// Get extension configuration (blocked URLs from user settings)
exports.getConfig = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Default blocked sites
    const defaultBlockedSites = [
      'youtube.com',
      'instagram.com',
      'facebook.com',
      'twitter.com',
      'reddit.com',
      'netflix.com',
      'tiktok.com'
    ];

    res.json({
      success: true,
      config: {
        blockedSites: user.blockedSites || defaultBlockedSites,
        strictMode: user.strictMode || false,
        enableSounds: user.enableSounds !== false
      }
    });

  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch config',
      error: err.message
    });
  }
};