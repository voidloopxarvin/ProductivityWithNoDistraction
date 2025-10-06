import { NativeModules, AppState, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const { AppBlocker } = NativeModules;

class AppBlockerService {
  constructor() {
    this.isMonitoring = false;
    this.blockedApps = [];
    this.checkInterval = null;
  }

  // Check if usage permission is granted
  async checkPermission() {
    try {
      return await AppBlocker.checkUsagePermission();
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  // Request usage stats permission
  requestPermission() {
    AppBlocker.requestUsagePermission();
  }

  // Get list of installed apps
  async getInstalledApps() {
    try {
      return await AppBlocker.getInstalledApps();
    } catch (error) {
      console.error('Get installed apps error:', error);
      return [];
    }
  }

  // Fetch blocked apps from server
  async fetchBlockedApps() {
    try {
      const response = await api.get('/roadmap/active');
      if (response.success && response.roadmap) {
        // Get incomplete tasks
        const incompleteTasks = response.roadmap.days
          .flatMap(day => day.tasks)
          .filter(task => !task.completed);
        
        // If tasks incomplete, get blocked apps from settings
        if (incompleteTasks.length > 0) {
          const blockedResponse = await api.get('/settings/blocked-apps');
          if (blockedResponse.success) {
            this.blockedApps = blockedResponse.blockedApps || [];
            await AsyncStorage.setItem('blockedApps', JSON.stringify(this.blockedApps));
          }
        } else {
          this.blockedApps = [];
        }
      }
      return this.blockedApps;
    } catch (error) {
      console.error('Fetch blocked apps error:', error);
      // Load from cache
      const cached = await AsyncStorage.getItem('blockedApps');
      this.blockedApps = cached ? JSON.parse(cached) : [];
      return this.blockedApps;
    }
  }

  // Start monitoring foreground app
  async startMonitoring() {
    if (this.isMonitoring) return;
    
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      this.requestPermission();
      return;
    }

    this.isMonitoring = true;
    await this.fetchBlockedApps();

    // Check every 2 seconds
    this.checkInterval = setInterval(async () => {
      try {
        const currentApp = await AppBlocker.getForegroundApp();
        
        if (this.blockedApps.includes(currentApp)) {
          console.log(`🔒 Blocking app: ${currentApp}`);
          AppBlocker.blockApp(currentApp);
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 2000);

    console.log('✅ App monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('❌ App monitoring stopped');
  }

  // Add app to blocked list
  async addBlockedApp(packageName) {
    if (!this.blockedApps.includes(packageName)) {
      this.blockedApps.push(packageName);
      await this.syncBlockedApps();
    }
  }

  // Remove app from blocked list
  async removeBlockedApp(packageName) {
    this.blockedApps = this.blockedApps.filter(app => app !== packageName);
    await this.syncBlockedApps();
  }

  // Sync with server
  async syncBlockedApps() {
    try {
      await api.post('/settings/blocked-apps', {
        blockedApps: this.blockedApps
      });
      await AsyncStorage.setItem('blockedApps', JSON.stringify(this.blockedApps));
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
}

export default new AppBlockerService();
