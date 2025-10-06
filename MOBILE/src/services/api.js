import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// ⚠️ YOUR PC'S IP ADDRESS
// ==========================================
const YOUR_PC_IP = '192.168.242.41'; // ✅ Your IP is correct
const BASE_URL = `http://${YOUR_PC_IP}:5000/api`;

console.log('🔗 API Base URL:', BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds token to all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`📡 API Request: ${config.method.toUpperCase()} ${config.url}`);
    } catch (error) {
      console.error('❌ Token error:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles responses and errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.data);
    return response.data;
  },
  async (error) => {
    // Better error logging
    if (error.response) {
      // Server responded with error
      console.error('❌ API Error Response:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response (network error)
      console.error('❌ API Network Error: Cannot connect to server');
      console.error('Check: 1) Backend is running 2) IP is correct 3) Port 5000 is open');
    } else {
      // Something else happened
      console.error('❌ API Error:', error.message);
    }
    
    // If unauthorized, clear token
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    
    return Promise.reject(error.response?.data || { error: error.message || 'Network Error' });
  }
);

export default api;
