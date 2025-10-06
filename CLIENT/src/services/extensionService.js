import api from './api';

const extensionService = {
  // ==================== TASKS ====================
  
  getTasks: async (filter = 'all') => {
    const params = filter !== 'all' ? { status: filter } : {};
    return await api.get('/extension/tasks', { params });
  },

  getTodayTasks: async () => {
    return await api.get('/extension/tasks/today');
  },

  createTask: async (taskData) => {
    return await api.post('/extension/tasks', taskData);
  },

  updateTask: async (taskId, updates) => {
    return await api.put(`/extension/tasks/${taskId}`, updates);
  },

  deleteTask: async (taskId) => {
    return await api.delete(`/extension/tasks/${taskId}`);
  },

  // ==================== TIME TRACKING ====================

  startTimer: async (taskId) => {
    return await api.post('/extension/time/start', { extensionTaskId: taskId });
  },

  stopTimer: async () => {
    return await api.post('/extension/time/stop');
  },

  getActiveSession: async () => {
    return await api.get('/extension/time/active');
  },

  getTimeHistory: async (days = 7) => {
    return await api.get('/extension/time/history', { params: { days } });
  },

  // ==================== ANALYTICS ====================

  getAnalytics: async (period = 'week') => {
    return await api.get('/extension/analytics', { params: { period } });
  }
};

export default extensionService;
