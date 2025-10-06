import api from './api';

const mockTestService = {
  // Get all mock tests
  getAll: async () => {
    return await api.get('/mocktest');
  },

  // Get specific mock test
  getById: async (id) => {
    return await api.get(`/mocktest/${id}`);
  },

  // Generate from existing syllabus
  generate: async (syllabusId, questionCount = 10, difficulty = 'mixed') => {
    return await api.post('/mocktest/generate', {
      syllabusId,
      questionCount,
      difficulty
    });
  },

  // ✅ NEW: Generate from new PDF upload
  generateFromNewPdf: async (file, questionCount = 10) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('questionCount', questionCount);

    return await api.post('/mocktest/generate-from-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Submit test answers
  submit: async (testId, answers, timeSpent) => {
    return await api.post(`/mocktest/${testId}/submit`, {
      answers,
      timeSpent
    });
  },

  // Get test attempts
  getAttempts: async (testId) => {
    return await api.get(`/mocktest/${testId}/attempts`);
  },

  // Delete mock test
  delete: async (testId) => {
    return await api.delete(`/mocktest/${testId}`);
  }
};

export default mockTestService;
