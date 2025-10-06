import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const syllabusService = {
  // Upload syllabus
  upload: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/syllabus/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Get all syllabi
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/syllabus`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Get single syllabus
  getById: async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/syllabus/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Delete syllabus
  delete: async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/syllabus/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  }
};

export default syllabusService;