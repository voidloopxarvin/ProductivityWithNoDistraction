const express = require('express');
const router = express.Router();
const Roadmap = require('../models/Roadmap');
const authMiddleware = require('../middleware/authMiddleware');

// Get roadmap by syllabus ID
router.get('/syllabus/:syllabusId', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Fetching roadmap for syllabus:', req.params.syllabusId);
    
    const roadmap = await Roadmap.findOne({
      syllabusId: req.params.syllabusId,
      userId: req.userId
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found for this syllabus'
      });
    }

    console.log('✅ Roadmap found');
    res.json({
      success: true,
      roadmap
    });
  } catch (err) {
    console.error('Get roadmap error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get all user's roadmaps
router.get('/', authMiddleware, async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.userId })
      .populate('syllabusId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      roadmaps
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Mark day as complete
router.put('/day/complete', authMiddleware, async (req, res) => {
  try {
    const { roadmapId, dayNumber } = req.body;

    console.log('📝 Marking day complete:', { roadmapId, dayNumber });

    const roadmap = await Roadmap.findOne({
      _id: roadmapId,
      userId: req.userId
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Find the specific day
    const day = roadmap.days.find(d => d.day === dayNumber);
    
    if (!day) {
      return res.status(404).json({
        success: false,
        message: 'Day not found'
      });
    }

    // Mark as completed
    day.completed = true;
    day.completedAt = new Date();

    // Recalculate progress
    const completedDays = roadmap.days.filter(d => d.completed).length;
    const totalDays = roadmap.days.length;
    
    roadmap.progress = {
      completed: completedDays,
      total: totalDays,
      percentage: Math.round((completedDays / totalDays) * 100)
    };

    // Update status if all completed
    if (completedDays === totalDays) {
      roadmap.status = 'completed';
    }

    await roadmap.save();

    console.log('✅ Day marked complete. Progress:', roadmap.progress);

    res.json({
      success: true,
      message: 'Day marked as complete',
      roadmap
    });
  } catch (err) {
    console.error('Complete day error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get today's tasks
router.get('/today/tasks', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const roadmaps = await Roadmap.find({ userId: req.userId });
    
    let todayTasks = [];
    
    roadmaps.forEach(roadmap => {
      roadmap.days.forEach(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        
        if (dayDate >= today && dayDate < tomorrow && !day.completed) {
          todayTasks.push({
            _id: day._id,
            title: `Day ${day.day} - ${roadmap.title}`,
            description: day.topics.join(', '),
            duration: day.duration,
            priority: day.priority,
            completed: day.completed
          });
        }
      });
    });

    res.json({
      success: true,
      tasks: todayTasks
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
