const Syllabus = require('../models/Syllabus');
const Roadmap = require('../models/Roadmap');
const pdfProcessor = require('../services/pdfProcessor');
const aiService = require('../services/aiservice');
const roadmapGenerator = require('../services/roadmapGenerator');
const fs = require('fs');

// @route POST /api/syllabus/upload
// @desc Upload and parse syllabus with AI
exports.uploadSyllabus = async (req, res) => {
  try {
    console.log('📤 Upload started');
    console.log('File received:', req.file);
    console.log('Body:', req.body);
    console.log('User ID:', req.userId);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const { title, examDate, useAI } = req.body;
    const filePath = req.file.path;

    console.log('🔍 Extracting PDF text...');

    // Extract text from PDF
    const rawText = await pdfProcessor.extractText(filePath);
    const cleanedText = pdfProcessor.cleanText(rawText);

    console.log(`✅ Extracted ${cleanedText.length} characters`);

    let topics = [];

    // Use AI extraction if enabled
    if (useAI === 'true') {
      try {
        console.log('🤖 Using AI extraction...');
        topics = await aiService.extractTopics(cleanedText);
        console.log(`✅ AI found ${topics.length} topics`);
      } catch (aiErr) {
        console.log('⚠️ AI extraction failed:', aiErr.message);
        console.log('📋 Using basic extraction...');
        topics = pdfProcessor.extractTopics(cleanedText);
      }
    } else {
      console.log('📋 Using basic extraction (AI disabled)');
      topics = pdfProcessor.extractTopics(cleanedText);
    }

    console.log(`📚 Total topics: ${topics.length}`);

    // Create syllabus document
    const syllabus = await Syllabus.create({
      userId: req.userId,
      title: title || 'My Syllabus',
      examDate,
      rawText: cleanedText,
      topics,
      fileUrl: filePath
    });

    console.log('✅ Syllabus saved to DB');

    res.status(201).json({
      success: true,
      message: 'Syllabus uploaded successfully',
      syllabus: {
        id: syllabus._id,
        title: syllabus.title,
        examDate: syllabus.examDate,
        topicsCount: topics.length,
        topics: topics.slice(0, 10) // Send first 10 topics
      }
    });

  } catch (err) {
    console.error('❌ Upload Error:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);

    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Deleted uploaded file due to error');
    }

    res.status(500).json({
      success: false,
      message: err.message || 'Upload failed'
    });
  }
};

// @route POST /api/syllabus/generate-roadmap
// @desc Generate AI roadmap from syllabus
exports.generateRoadmap = async (req, res) => {
  try {
    console.log('🗺️ Roadmap generation started');
    const { syllabusId } = req.body;

    if (!syllabusId) {
      return res.status(400).json({
        success: false,
        message: 'Syllabus ID is required'
      });
    }

    console.log('Fetching syllabus:', syllabusId);

    // Get the syllabus
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

    console.log('✅ Syllabus found:', syllabus.title);

    // Check if roadmap already exists for this syllabus
    const existingRoadmap = await Roadmap.findOne({
      syllabusId,
      userId: req.userId
    });

    if (existingRoadmap) {
      console.log('⚠️ Roadmap already exists');
      return res.status(400).json({
        success: false,
        message: 'Roadmap already exists for this syllabus',
        roadmap: existingRoadmap
      });
    }

    console.log('📊 Generating roadmap...');

    // Generate roadmap
    const roadmap = await roadmapGenerator.generateRoadmap(
      req.userId,
      syllabusId,
      syllabus.topics,
      syllabus.examDate,
      syllabus.title
    );

    console.log('✅ Roadmap generated successfully');

    res.status(201).json({
      success: true,
      message: 'Roadmap generated successfully',
      roadmap
    });

  } catch (err) {
    console.error('❌ Roadmap generation error:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);

    res.status(500).json({
      success: false,
      message: err.message || 'Roadmap generation failed'
    });
  }
};

// @route GET /api/syllabus
// @desc Get user's syllabus
exports.getSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.find({ userId: req.userId })
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: syllabus.length,
      syllabus
    });
  } catch (err) {
    console.error('Get Syllabus Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @route GET /api/syllabus/:id
// @desc Get single syllabus by ID
exports.getSyllabusById = async (req, res) => {
  try {
    const syllabus = await Syllabus.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    res.json({
      success: true,
      syllabus
    });
  } catch (err) {
    console.error('Get Syllabus By ID Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @route DELETE /api/syllabus/:id
// @desc Delete syllabus
exports.deleteSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    // Delete file
    if (syllabus.fileUrl && fs.existsSync(syllabus.fileUrl)) {
      fs.unlinkSync(syllabus.fileUrl);
      console.log('🗑️ Deleted file:', syllabus.fileUrl);
    }

    await Syllabus.deleteOne({ _id: req.params.id });

    console.log('✅ Syllabus deleted');

    res.json({
      success: true,
      message: 'Syllabus deleted successfully'
    });
  } catch (err) {
    console.error('Delete Syllabus Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
