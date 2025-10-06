const Roadmap = require('../models/roadmap');
const Syllabus = require('../models/Syllabus');
const Task = require('../models/task');
const aiService = require('../services/aiservice');

// @route   POST /api/roadmap/generate
// @desc    Generate AI roadmap from syllabus
exports.generateRoadmap = async (req, res) => {
  try {
    const { syllabusId } = req.body;

    // Get syllabus
    const syllabus = await Syllabus.findOne({
      _id: syllabusId,
      userId: req.userId
    });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    // Check if roadmap already exists
    const existingRoadmap = await Roadmap.findOne({
      userId: req.userId,
      syllabusId,
      status: 'active'
    });

    if (existingRoadmap) {
      return res.status(400).json({
        success: false,
        message: 'Active roadmap already exists for this syllabus'
      });
    }

    // Extract topics with AI (if not already done)
    let topics = syllabus.topics;
    if (!topics || topics.length === 0) {
      topics = await aiService.extractTopics(syllabus.rawText);
      syllabus.topics = topics;
      await syllabus.save();
    }

    // Generate roadmap with AI
    const roadmapDays = await aiService.generateRoadmap(
      topics,
      syllabus.examDate,
      new Date()
    );

    // Create roadmap
    const roadmap = await Roadmap.create({
      userId: req.userId,
      syllabusId,
      title: `${syllabus.title} - Study Plan`,
      examDate: syllabus.examDate,
      startDate: new Date(),
      totalDays: roadmapDays.length,
      days: roadmapDays,
      progress: {
        completed: 0,
        total: roadmapDays.length,
        percentage: 0
      }
    });

    // Create tasks for first 7 days
    const tasksToCreate = roadmapDays.slice(0, 7).map(day => ({
      userId: req.userId,
      roadmapId: roadmap._id,
      roadmapDay: day.day,
      title: `Day ${day.day}: ${day.topics.join(', ')}`,
      description: day.focus,
      topics: day.topics,
      duration: day.duration,
      priority: day.priority,
      scheduledDate: new Date(day.date),
      type: 'study'
    }));

    await Task.insertMany(tasksToCreate);

    res.status(201).json({
      success: true,
      message: 'Roadmap generated successfully',
      roadmap: {
        id: roadmap._id,
        title: roadmap.title,
        totalDays: roadmap.totalDays,
        daysPreview: roadmapDays.slice(0, 5)
      }
    });

  } catch (err) {
    console.error('Roadmap Generation Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate roadmap'
    });
  }
};

// @route   GET /api/roadmap
// @desc    Get user's active roadmap
exports.getRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      userId: req.userId,
      status: 'active'
    })
    .populate('syllabusId', 'title')
    .sort({ createdAt: -1 });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'No active roadmap found'
      });
    }

    res.json({
      success: true,
      roadmap
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @route   GET /api/roadmap/:id
// @desc    Get specific roadmap by ID
exports.getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('syllabusId', 'title examDate');

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    res.json({
      success: true,
      roadmap
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @route   PUT /api/roadmap/day/:dayId/complete
// @desc    Mark a day as completed
exports.completeDay = async (req, res) => {
  try {
    const { roadmapId, dayNumber } = req.body;

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

    // Find and update the day
    const day = roadmap.days.find(d => d.day === dayNumber);
    if (!day) {
      return res.status(404).json({
        success: false,
        message: 'Day not found'
      });
    }

    day.completed = true;
    day.completedAt = new Date();

    // Update progress
    const completed = roadmap.days.filter(d => d.completed).length;
    roadmap.progress = {
      completed,
      total: roadmap.days.length,
      percentage: Math.round((completed / roadmap.days.length) * 100)
    };

    await roadmap.save();

    // Mark associated tasks as completed
    await Task.updateMany(
      {
        userId: req.userId,
        roadmapId: roadmap._id,
        roadmapDay: dayNumber
      },
      {
        completed: true,
        completedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Day marked as completed',
      progress: roadmap.progress
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @route   GET /api/roadmap/today
// @desc    Get today's tasks
exports.getTodayTasks = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await Task.find({
      userId: req.userId,
      scheduledDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('roadmapId', 'title');

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};