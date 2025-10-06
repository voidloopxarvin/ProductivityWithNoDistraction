import api from './api';

class FlashcardService {
  async getAll() {
    return await api.get('/flashcards');
  }

  async getById(id) {
    return await api.get(`/flashcards/${id}`);
  }

  async generateFromSyllabus(syllabusId, count = 20) {
    return await api.post('/flashcards/generate', { syllabusId, count });
  }

  async markMastered(setId, cardIndex) {
    return await api.put(`/flashcards/${setId}/card/${cardIndex}/master`);
  }
}

export default new FlashcardService();
