import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../utils/constants';

class SocketService {
  socket = null;

  async connect(userId) {
    const token = await AsyncStorage.getItem('authToken');
    
    this.socket = io(API_CONFIG.BASE_URL.replace('/api', ''), {
      auth: { token }
    });

    this.socket.emit('join', userId);

    // Listen for focus mode events
    this.socket.on('focus_started', (data) => {
      console.log('Focus mode started from another device!', data);
      // Update local state, start blocking
    });

    this.socket.on('focus_stopped', () => {
      console.log('Focus mode stopped from another device!');
      // Stop blocking
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketService();
