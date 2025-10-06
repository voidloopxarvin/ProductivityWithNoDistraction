// background.js - Updated with backend sync
// Import sync service (inline since service workers don't support ES6 imports)

const API_BASE_URL = 'http://localhost:5000/api';

// Simplified sync service for background
const BackendSync = {
  async getToken() {
    const data = await chrome.storage.sync.get(['authToken']);
    return data.authToken || null;
  },
  
  async apiRequest(endpoint, method = 'GET', body = null) {
    const token = await this.getToken();
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      return null;
    }
  },
  
  async syncTasks() {
    const data = await this.apiRequest('/extension/tasks');
    if (data?.success) {
      const syncedTodos = data.tasks.map(task => ({
        id: task.id,
        text: task.text,
        completed: task.completed,
        priority: task.priority,
        syncedFromBackend: true,
        createdAt: task.createdAt
      }));
      
      await chrome.storage.local.set({ 
        todos: syncedTodos,
        lastSyncTime: new Date().toISOString()
      });
      
      return syncedTodos;
    }
    return null;
  },
  
  async completeTask(taskId, completed) {
    return await this.apiRequest('/extension/tasks/complete', 'POST', { taskId, completed });
  },
  
  async logBlockedSite(url) {
    await this.apiRequest('/extension/logs/blocked', 'POST', { url, timestamp: new Date().toISOString() });
  }
};

// Storage Helper
const StorageHelper = {
  async getTodos() {
    const data = await chrome.storage.local.get(['todos']);
    return data.todos || [];
  },
  
  async saveTodos(todos) {
    await chrome.storage.local.set({ todos });
  },
  
  async areAllTodosCompleted() {
    const todos = await this.getTodos();
    if (todos.length === 0) return false;
    return todos.every(t => t.completed);
  },
  
  async getBlockedUrls() {
    const data = await chrome.storage.local.get(['blockedUrls']);
    return data.blockedUrls || ['youtube.com', 'instagram.com', 'facebook.com', 'twitter.com', 'reddit.com'];
  },
  
  async isUrlBlocked(url) {
    const blockedUrls = await this.getBlockedUrls();
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    return blockedUrls.some(blockedUrl => cleanUrl.includes(blockedUrl));
  }
};

// ==================== INSTALLATION ====================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('PrepLock Extension installed/updated');
  
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      todos: [],
      blockedUrls: ['youtube.com', 'instagram.com', 'facebook.com', 'twitter.com', 'reddit.com'],
      lastSyncTime: null
    });
  }
  
  // Set up sync alarm (every 5 minutes)
  chrome.alarms.create('syncTasks', {
    periodInMinutes: 5
  });
  
  // Set up daily reset alarm
  chrome.alarms.create('dailyReset', {
    when: getNextMidnight(),
    periodInMinutes: 1440
  });
  
  // Initial sync
  const token = await BackendSync.getToken();
  if (token) {
    await BackendSync.syncTasks();
  }
});

// ==================== URL BLOCKING ====================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    await checkAndBlockUrl(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    await checkAndBlockUrl(activeInfo.tabId, tab.url);
  }
});

async function checkAndBlockUrl(tabId, url) {
  try {
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return;
    }
    
    if (url.includes('blocked.html')) {
      return;
    }
    
    const allCompleted = await StorageHelper.areAllTodosCompleted();
    
    if (allCompleted) {
      return;
    }
    
    const isBlocked = await StorageHelper.isUrlBlocked(url);
    
    if (isBlocked) {
      // Log to backend
      await BackendSync.logBlockedSite(url);
      
      // Redirect to blocked page
      const blockedPageUrl = chrome.runtime.getURL('blocked/blocked.html') + 
                            `?blocked=${encodeURIComponent(url)}`;
      chrome.tabs.update(tabId, { url: blockedPageUrl });
      
      console.log(`Blocked: ${url}`);
    }
  } catch (error) {
    console.error('Error in checkAndBlockUrl:', error);
  }
}

// ==================== ALARMS ====================

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncTasks') {
    const token = await BackendSync.getToken();
    if (token) {
      console.log('Syncing tasks from backend...');
      await BackendSync.syncTasks();
    }
  }
  
  if (alarm.name === 'dailyReset') {
    console.log('Daily reset triggered');
    // Daily reset logic can stay local or sync with backend
  }
});
// MOBILLLLLLLLLLLLEEEEEEEEEEEEEEEEEE
// Add to existing background.js

// Sync with backend every 10 seconds
setInterval(async () => {
  try {
    const token = await chrome.storage.local.get(['authToken']);
    if (!token.authToken) return;

    // Check active session from backend
    const response = await fetch('http://localhost:5000/api/focus/active', {
      headers: {
        'Authorization': `Bearer ${token.authToken}`
      }
    });

    const data = await response.json();
    
    if (data.session && data.session.status === 'active') {
      // Session active - block websites
      const blockedWebsites = data.session.blockedApps || [];
      await chrome.storage.local.set({ 
        focusMode: true,
        blockedWebsites 
      });
    } else {
      // No active session
      await chrome.storage.local.set({ focusMode: false });
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}, 10000); // Every 10 seconds

// Listen for focus mode start from web/mobile
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_FOCUS_MODE') {
    syncFocusMode();
  }
});

async function syncFocusMode() {
  const token = await chrome.storage.local.get(['authToken']);
  if (!token.authToken) return;

  const response = await fetch('http://localhost:5000/api/focus/active', {
    headers: {
      'Authorization': `Bearer ${token.authToken}`
    }
  });

  const data = await response.json();
  
  if (data.session) {
    await chrome.storage.local.set({
      focusMode: true,
      blockedWebsites: data.session.blockedApps
    });
  }
}

// ==================== MESSAGE HANDLING ====================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkBlocking') {
    StorageHelper.areAllTodosCompleted().then(completed => {
      sendResponse({ blockingActive: !completed });
    });
    return true;
  }
  
  if (message.action === 'syncNow') {
    BackendSync.syncTasks().then(todos => {
      sendResponse({ success: true, todos });
    });
    return true;
  }
  
  if (message.action === 'completeTask') {
    const { taskId, completed } = message;
    BackendSync.completeTask(taskId, completed).then(result => {
      sendResponse({ success: true, result });
    });
    return true;
  }
  
  if (message.action === 'login') {
    chrome.storage.sync.set({ authToken: message.token }).then(() => {
      BackendSync.syncTasks().then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (message.action === 'logout') {
    chrome.storage.sync.remove(['authToken']).then(() => {
      chrome.storage.local.set({ todos: [] }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

function getNextMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

console.log('PrepLock background service worker loaded');