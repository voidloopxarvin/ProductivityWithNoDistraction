// ============================================
// STORAGE UTILITY FUNCTIONS
// Handles all Chrome storage operations
// ============================================

const StorageHelper = {
  
  // ==================== TODOS ====================
  
  /**
   * Get all todos for today
   */
  async getTodos() {
    const data = await chrome.storage.local.get(['todos']);
    return data.todos || [];
  },
  
  /**
   * Save todos to storage
   */
  async saveTodos(todos) {
    await chrome.storage.local.set({ todos });
  },
  
  /**
   * Add a new todo
   */
  async addTodo(text) {
    const todos = await this.getTodos();
    const newTodo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    await this.saveTodos(todos);
    return newTodo;
  },
  
  /**
   * Toggle todo completion status
   */
  async toggleTodo(id) {
    const todos = await this.getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      await this.saveTodos(todos);
      
      // Check if all todos are completed
      const allCompleted = todos.every(t => t.completed);
      if (allCompleted && todos.length > 0) {
        await this.markDayCompleted();
      }
    }
    return todos;
  },
  
  /**
   * Delete a todo
   */
  async deleteTodo(id) {
    const todos = await this.getTodos();
    const filtered = todos.filter(t => t.id !== id);
    await this.saveTodos(filtered);
    return filtered;
  },
  
  /**
   * Check if all todos are completed
   */
  async areAllTodosCompleted() {
    const todos = await this.getTodos();
    if (todos.length === 0) return false;
    return todos.every(t => t.completed);
  },
  
  /**
   * Reset todos (called daily at midnight)
   */
  async resetTodos() {
    const todos = await this.getTodos();
    const allCompleted = todos.length > 0 && todos.every(t => t.completed);
    
    if (!allCompleted && todos.length > 0) {
      // Missed a day - reset streak
      await this.resetStreak();
    }
    
    // Archive old todos for history (optional)
    const data = await chrome.storage.local.get(['history']);
    const history = data.history || [];
    if (todos.length > 0) {
      history.push({
        date: new Date().toISOString(),
        todos: todos,
        completed: allCompleted
      });
      // Keep only last 30 days
      if (history.length > 30) {
        history.shift();
      }
      await chrome.storage.local.set({ history });
    }
    
    // Clear current todos
    await this.saveTodos([]);
  },
  
  // ==================== BLOCKED URLS ====================
  
  /**
   * Get blocked URLs list
   */
  async getBlockedUrls() {
    const data = await chrome.storage.local.get(['blockedUrls']);
    return data.blockedUrls || [
      'youtube.com',
      'instagram.com',
      'facebook.com',
      'twitter.com',
      'reddit.com'
    ];
  },
  
  /**
   * Save blocked URLs
   */
  async saveBlockedUrls(urls) {
    await chrome.storage.local.set({ blockedUrls: urls });
  },
  
  /**
   * Add a URL to blocklist
   */
  async addBlockedUrl(url) {
    const urls = await this.getBlockedUrls();
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
    if (!urls.includes(cleanUrl)) {
      urls.push(cleanUrl);
      await this.saveBlockedUrls(urls);
    }
    return urls;
  },
  
  /**
   * Remove a URL from blocklist
   */
  async removeBlockedUrl(url) {
    const urls = await this.getBlockedUrls();
    const filtered = urls.filter(u => u !== url);
    await this.saveBlockedUrls(filtered);
    return filtered;
  },
  
  /**
   * Check if a URL is blocked
   */
  async isUrlBlocked(url) {
    const blockedUrls = await this.getBlockedUrls();
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    return blockedUrls.some(blockedUrl => {
      // Exact match or subdomain match
      return cleanUrl.includes(blockedUrl) || cleanUrl === blockedUrl;
    });
  },
  
  // ==================== STATS & STREAKS ====================
  
  /**
   * Get current stats
   */
  async getStats() {
    const data = await chrome.storage.local.get(['stats']);
    return data.stats || {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletedDays: 0,
      lastCompletedDate: null,
      todayCompleted: false
    };
  },
  
  /**
   * Save stats
   */
  async saveStats(stats) {
    await chrome.storage.local.set({ stats });
  },
  
  /**
   * Mark today as completed and update streak
   */
  async markDayCompleted() {
    const stats = await this.getStats();
    const today = new Date().toDateString();
    
    // Prevent multiple completions in same day
    if (stats.lastCompletedDate === today) {
      return stats;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    // Update streak
    if (stats.lastCompletedDate === yesterdayStr) {
      // Continuing streak
      stats.currentStreak += 1;
    } else {
      // Starting new streak
      stats.currentStreak = 1;
    }
    
    // Update longest streak
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }
    
    stats.totalCompletedDays += 1;
    stats.lastCompletedDate = today;
    stats.todayCompleted = true;
    
    await this.saveStats(stats);
    return stats;
  },
  
  /**
   * Reset streak (called when user misses a day)
   */
  async resetStreak() {
    const stats = await this.getStats();
    stats.currentStreak = 0;
    stats.todayCompleted = false;
    await this.saveStats(stats);
  },
  
  /**
   * Check if today's goals were completed
   */
  async isTodayCompleted() {
    const stats = await this.getStats();
    const today = new Date().toDateString();
    return stats.lastCompletedDate === today && stats.todayCompleted;
  },
  
  // ==================== SETTINGS ====================
  
  /**
   * Get settings
   */
  async getSettings() {
    const data = await chrome.storage.local.get(['settings']);
    return data.settings || {
      enableSounds: true,
      strictMode: false,
      dailyResetTime: '00:00'
    };
  },
  
  /**
   * Save settings
   */
  async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  },
  
  // ==================== UTILITIES ====================
  
  /**
   * Clear all data (reset extension)
   */
  async clearAllData() {
    await chrome.storage.local.clear();
  },
  
  /**
   * Get last reset date
   */
  async getLastResetDate() {
    const data = await chrome.storage.local.get(['lastResetDate']);
    return data.lastResetDate || null;
  },
  
  /**
   * Set last reset date
   */
  async setLastResetDate(date) {
    await chrome.storage.local.set({ lastResetDate: date });
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageHelper;
}