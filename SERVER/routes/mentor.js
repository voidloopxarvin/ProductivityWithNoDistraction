const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController');
const authMiddleware = require('../middleware/authMiddleware');

// Get context
router.get('/context', authMiddleware, mentorController.getContext);

// Ask mentor
router.post('/ask', authMiddleware, mentorController.askMentor);

// Get chat history
router.get('/history', authMiddleware, mentorController.getChatHistory);

// Clear history
router.delete('/history', authMiddleware, mentorController.clearHistory);

module.exports = router;
