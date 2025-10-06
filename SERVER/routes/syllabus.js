const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes are protected
router.use(authMiddleware);

// Upload syllabus
router.post('/upload', upload.single('syllabus'), syllabusController.uploadSyllabus);

// Generate roadmap from syllabus
router.post('/generate-roadmap', syllabusController.generateRoadmap);

// Get all syllabi
router.get('/', syllabusController.getSyllabus);

// Get single syllabus
router.get('/:id', syllabusController.getSyllabusById);

// Delete syllabus
router.delete('/:id', syllabusController.deleteSyllabus);

module.exports = router;
