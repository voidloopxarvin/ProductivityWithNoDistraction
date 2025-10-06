import api from './api';

const mentorService = {
  // Get context for AI (current roadmap, progress, etc.)
  getContext: async () => {
    return await api.get('/mentor/context');
  },

  // Ask AI mentor a question
  ask: async (question, context = null) => {
    return await api.post('/mentor/ask', {
      question,
      context
    });
  },

  // Get chat history
  getHistory: async () => {
    return await api.get('/mentor/history');
  },

  // Clear chat history
  clearHistory: async () => {
    return await api.delete('/mentor/history');
  }
};

export default mentorService;
