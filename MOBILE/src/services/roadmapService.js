import api from './api';

class RoadmapService {
  async generate(syllabusId) {
    return await api.post('/roadmap/generate', { syllabusId });
  }

  async getActive() {
    return await api.get('/roadmap/active');
  }

  async getBySyllabusId(syllabusId) {
    return await api.get(`/roadmap/syllabus/${syllabusId}`);
  }

  async completeDay(roadmapId, dayNumber) {
    return await api.put(`/roadmap/${roadmapId}/day/${dayNumber}/complete`);
  }
}

export default new RoadmapService();
