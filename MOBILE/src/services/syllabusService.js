import api from './api';

class SyllabusService {
  async getAll() {
    return await api.get('/syllabus');
  }

  async getById(id) {
    return await api.get(`/syllabus/${id}`);
  }

  async delete(id) {
    return await api.delete(`/syllabus/${id}`);
  }
}

export default new SyllabusService();
