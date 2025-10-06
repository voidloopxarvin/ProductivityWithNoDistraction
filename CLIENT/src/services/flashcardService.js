import api from './api';

const flashcardService = {
  // Get all flashcard sets
  getAll: async () => {
    return await api.get('/flashcards');
  },

  // Get specific flashcard set
  getById: async (id) => {
    return await api.get(`/flashcards/${id}`);
  },

  // Generate from existing syllabus
  generateFromSyllabus: async (syllabusId, count = 20) => {
    return await api.post('/flashcards/generate', {
      syllabusId,
      count
    });
  },

  // Generate from new PDF
  generateFromPdf: async (file, count = 20) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('count', count);

    return await api.post('/flashcards/generate-from-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Mark card as mastered
  markMastered: async (setId, cardIndex) => {
    return await api.put(`/flashcards/${setId}/card/${cardIndex}/master`);
  },

  // Mark card as reviewed
  markReviewed: async (setId, cardIndex) => {
    return await api.put(`/flashcards/${setId}/card/${cardIndex}/review`);
  },

  // Delete flashcard set
  delete: async (setId) => {
    return await api.delete(`/flashcards/${setId}`);
  }
};

export default flashcardService;
