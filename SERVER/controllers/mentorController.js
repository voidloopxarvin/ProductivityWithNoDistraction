const MentorChat = require('../models/Mentor');

exports.getContext = async (req, res) => {
  try {
    res.json({
      success: true,
      context: {
        currentDay: 1,
        totalDays: 30,
        todayTopicsCount: 3,
        todayTopics: ['React Basics', 'State Management', 'Hooks'],
        progressPercent: 10,
        averageScore: 75,
        weakTopics: ['Redux', 'Context API']
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.askMentor = async (req, res) => {
  try {
    const { question, context } = req.body;
    const userId = req.userId;

    console.log('🤖 Question:', question);

    const mockResponse = `Great question about "${question}"! 

Based on your progress (Day ${context?.currentDay || 1}), here's my advice:

Focus on understanding the core concepts first. Break down complex topics into smaller parts and practice regularly. You're doing well - keep up the momentum!

Remember to review your weak topics: ${context?.weakTopics?.join(', ') || 'None yet'}.`;

    let chat = await MentorChat.findOne({ userId });
    if (!chat) {
      chat = new MentorChat({ userId, messages: [] });
    }

    chat.messages.push(
      { role: 'user', content: question },
      { 
        role: 'assistant', 
        content: mockResponse,
        relatedDay: context?.currentDay,
        relatedTopics: context?.todayTopics || []
      }
    );

    await chat.save();

    res.json({
      success: true,
      answer: mockResponse,
      relatedDay: context?.currentDay,
      relatedTopics: (context?.todayTopics || []).slice(0, 3)
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const chat = await MentorChat.findOne({ userId: req.userId });
    res.json({ success: true, messages: chat?.messages || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.clearHistory = async (req, res) => {
  try {
    await MentorChat.deleteOne({ userId: req.userId });
    res.json({ success: true, message: 'History cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
