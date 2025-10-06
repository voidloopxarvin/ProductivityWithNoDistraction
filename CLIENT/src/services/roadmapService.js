import api from './api';

const roadmapService = {
  // Generate roadmap from syllabus
  generate: async (syllabusId) => {
    return await api.post('/syllabus/generate-roadmap', { syllabusId });
  },

  // Get all user's roadmaps
  getAll: async () => {
    return await api.get('/roadmap');
  },

  // Get roadmap by syllabus ID
  getBySyllabusId: async (syllabusId) => {
    return await api.get(`/roadmap/syllabus/${syllabusId}`);
  },

  // Get specific roadmap by roadmap ID
  getById: async (id) => {
    return await api.get(`/roadmap/${id}`);
  },

  // Mark day as completed
  completeDay: async (roadmapId, dayNumber) => {
    return await api.put('/roadmap/day/complete', { roadmapId, dayNumber });
  },

  // Get today's tasks
  getTodayTasks: async () => {
    return await api.get('/roadmap/today/tasks');
  }
};

export default roadmapService;
