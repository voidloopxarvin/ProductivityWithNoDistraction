// extension/utils/sync.js
// Handles all communication with PrepLock backend

const API_BASE_URL = 'http://localhost:5000/api'; // Change in production

const SyncService = {
  
  // ==================== AUTH ====================
  
  /**
   * Get stored auth token
   */
  async getToken() {
    const data = await chrome.storage.sync.get(['authToken']);
    return data.authToken || null;
  },
  
  /**
   * Save auth token
   */
  async saveToken(token) {
    await chrome.storage.sync.set({ authToken: token });
  },
  
  /**
   * Clear auth token
   */
  async clearToken() {
    await chrome.storage.sync.remove(['authToken']);
  },
  
  /**
   * Check if user is logged in
   */
  async isLoggedIn() {
    const token = await this.getToken();
    return !!token;
  },
  
  // ==================== API CALLS ====================
  
  /**
   * Make authenticated API request
   */
  async apiRequest(endpoint, method = 'GET', body = null) {
    const token = await this.getToken();
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
      
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  },
  
  // ==================== TASK SYNCING ====================
  
  /**
   * Fetch today's tasks from backend
   */
  async syncTasks() {
    try {
      const isLoggedIn = await this.isLoggedIn();
      if (!isLoggedIn) {
        console.log('Not logged in, skipping task sync');
        return { synced: false, source: 'local' };
      }
      
      const data = await this.apiRequest('/extension/tasks');
      
      if (data.success) {
        // Merge with local todos
        await this.mergeTasks(data.tasks);
        
        return {
          synced: true,
          source: 'backend',
          totalTasks: data.totalTasks,
          completedTasks: data.completedTasks,
          pendingTasks: data.pendingTasks
        };
      }
      
    } catch (err) {
      console.error('Task sync failed:', err);
      return { synced: false, source: 'local', error: err.message };
    }
  },
  
  /**
   * Merge backend tasks with local todos
   * Backend tasks take priority
   */
  async mergeTasks(backendTasks) {
    // Get local todos
    const localData = await chrome.storage.local.get(['todos']);
    const localTodos = localData.todos || [];
    
    // Convert backend tasks to local format
    const syncedTodos = backendTasks.map(task => ({
      id: task.id,
      text: task.text,
      description: task.description || '',
      completed: task.completed,
      priority: task.priority,
      duration: task.duration,
      createdAt: task.createdAt,
      syncedFromBackend: true
    }));
    
    // Keep local-only todos (not synced)
    const localOnlyTodos = localTodos.filter(t => !t.syncedFromBackend);
    
    // Combine: backend tasks + local-only todos
    const mergedTodos = [...syncedTodos, ...localOnlyTodos];
    
    await chrome.storage.local.set({ 
      todos: mergedTodos,
      lastSyncTime: new Date().toISOString()
    });
    
    return mergedTodos;
  },
  
  /**
   * Send task completion to backend
   */
  async completeTask(taskId, completed = true) {
    try {
      const isLoggedIn = await this.isLoggedIn();
      if (!isLoggedIn) {
        console.log('Not logged in, only updating locally');
        return { success: true, local: true };
      }
      
      const data = await this.apiRequest('/extension/tasks/complete', 'POST', {
        taskId,
        completed
      });
      
      return data;
      
    } catch (err) {
      console.error('Failed to sync task completion:', err);
      return { success: false, error: err.message };
    }
  },
  
  // ==================== LOGGING ====================
  
  /**
   * Log blocked site to backend
   */
  async logBlockedSite(url) {
    try {
      const isLoggedIn = await this.isLoggedIn();
      if (!isLoggedIn) return;
      
      await this.apiRequest('/extension/logs/blocked', 'POST', {
        url,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('Failed to log blocked site:', err);
    }
  },
  
  /**
   * Log focus session
   */
  async logFocusSession(minutes, startTime, endTime) {
    try {
      const isLoggedIn = await this.isLoggedIn();
      if (!isLoggedIn) return;
      
      await this.apiRequest('/extension/logs/focus', 'POST', {
        minutes,
        startTime,
        endTime
      });
      
    } catch (err) {
      console.error('Failed to log focus session:', err);
    }
  },
  
  /**
   * Get stats from backend
   */
  async getStats(days = 7) {
    try {
      const isLoggedIn = await this.isLoggedIn();
      if (!isLoggedIn) return null;
      
      const data = await this.apiRequest(`/extension/stats?days=${days}`);
      return data.stats;
      
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      return null;
    }
  },
  
  /**
   * Get extension config from backend
   */
  async getConfig() {
    try {
      const isLoggedIn = await this.isLoggedIn();
      if (!isLoggedIn) return null;
      
      const data = await this.apiRequest('/extension/config');
      return data.config;
      
    } catch (err) {
      console.error('Failed to fetch config:', err);
      return null;
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyncService;
}