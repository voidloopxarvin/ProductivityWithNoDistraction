// ============================================
// OPTIONS PAGE JAVASCRIPT
// Manage settings, blocked URLs, and stats
// ============================================

// Storage Helper
const StorageHelper = {
  async getBlockedUrls() {
    const data = await chrome.storage.local.get(['blockedUrls']);
    return data.blockedUrls || [];
  },
  
  async saveBlockedUrls(urls) {
    await chrome.storage.local.set({ blockedUrls: urls });
  },
  
  async addBlockedUrl(url) {
    const urls = await this.getBlockedUrls();
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
    if (cleanUrl && !urls.includes(cleanUrl)) {
      urls.push(cleanUrl);
      await this.saveBlockedUrls(urls);
    }
    return urls;
  },
  
  async removeBlockedUrl(url) {
    const urls = await this.getBlockedUrls();
    const filtered = urls.filter(u => u !== url);
    await this.saveBlockedUrls(filtered);
    return filtered;
  },
  
  async getStats() {
    const data = await chrome.storage.local.get(['stats']);
    return data.stats || {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletedDays: 0
    };
  },
  
  async resetStats() {
    await chrome.storage.local.set({
      stats: {
        currentStreak: 0,
        longestStreak: 0,
        totalCompletedDays: 0,
        lastCompletedDate: null,
        todayCompleted: false
      }
    });
  },
  
  async getSettings() {
    const data = await chrome.storage.local.get(['settings']);
    return data.settings || {
      enableSounds: true,
      strictMode: false
    };
  },
  
  async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  },
  
  async clearHistory() {
    await chrome.storage.local.remove(['history']);
  },
  
  async resetAll() {
    await chrome.storage.local.clear();
    await chrome.storage.local.set({
      todos: [],
      blockedUrls: ['youtube.com', 'instagram.com', 'facebook.com', 'twitter.com', 'reddit.com'],
      stats: {
        currentStreak: 0,
        longestStreak: 0,
        totalCompletedDays: 0,
        lastCompletedDate: null,
        todayCompleted: false
      },
      settings: {
        enableSounds: true,
        strictMode: false
      }
    });
  }
};

// ==================== DOM ELEMENTS ====================

const urlInput = document.getElementById('urlInput');
const addUrlBtn = document.getElementById('addUrlBtn');
const urlList = document.getElementById('urlList');
const currentStreak = document.getElementById('currentStreak');
const longestStreak = document.getElementById('longestStreak');
const totalCompleted = document.getElementById('totalCompleted');
const enableSoundsToggle = document.getElementById('enableSounds');
const strictModeToggle = document.getElementById('strictMode');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const resetStatsBtn = document.getElementById('resetStatsBtn');
const resetAllBtn = document.getElementById('resetAllBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
  await loadBlockedUrls();
  await loadStats();
  await loadSettings();
  setupEventListeners();
});

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  // Add URL
  addUrlBtn.addEventListener('click', handleAddUrl);
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddUrl();
  });
  
  // Suggestion tags
  document.querySelectorAll('.suggestion-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const url = tag.dataset.url;
      urlInput.value = url;
      handleAddUrl();
    });
  });
  
  // Settings toggles
  enableSoundsToggle.addEventListener('change', handleSettingsChange);
  strictModeToggle.addEventListener('change', handleSettingsChange);
  
  // Danger zone buttons
  clearHistoryBtn.addEventListener('click', handleClearHistory);
  resetStatsBtn.addEventListener('click', handleResetStats);
  resetAllBtn.addEventListener('click', handleResetAll);
  
  // Footer links
  document.getElementById('feedbackLink').addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Feedback feature coming soon!');
  });
  
  document.getElementById('helpLink').addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Help documentation coming soon!');
  });
}

// ==================== BLOCKED URLS ====================

async function loadBlockedUrls() {
  const urls = await StorageHelper.getBlockedUrls();
  urlList.innerHTML = '';
  
  if (urls.length === 0) {
    urlList.innerHTML = `
      <div class="empty-urls">
        <span class="empty-urls-icon">🌐</span>
        <p>No blocked websites yet</p>
      </div>
    `;
    return;
  }
  
  urls.forEach(url => {
    const urlItem = document.createElement('div');
    urlItem.className = 'url-item';
    urlItem.innerHTML = `
      <span class="url-item-text">${escapeHtml(url)}</span>
      <button class="url-item-delete" data-url="${escapeHtml(url)}">Remove</button>
    `;
    
    urlItem.querySelector('.url-item-delete').addEventListener('click', async (e) => {
      const urlToRemove = e.target.dataset.url;
      await StorageHelper.removeBlockedUrl(urlToRemove);
      await loadBlockedUrls();
      showToast(`Removed ${urlToRemove}`);
    });
    
    urlList.appendChild(urlItem);
  });
}

async function handleAddUrl() {
  const url = urlInput.value.trim();
  
  if (!url) {
    urlInput.focus();
    return;
  }
  
  // Validate URL format
  const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  if (!cleanUrl.includes('.')) {
    showToast('Please enter a valid domain (e.g., youtube.com)', 'error');
    return;
  }
  
  // Check if already exists
  const urls = await StorageHelper.getBlockedUrls();
  if (urls.includes(cleanUrl)) {
    showToast(`${cleanUrl} is already blocked`, 'error');
    urlInput.value = '';
    return;
  }
  
  // Add URL
  await StorageHelper.addBlockedUrl(cleanUrl);
  await loadBlockedUrls();
  
  urlInput.value = '';
  showToast(`Added ${cleanUrl} to blocklist`);
}

// ==================== STATISTICS ====================

async function loadStats() {
  const stats = await StorageHelper.getStats();
  
  currentStreak.textContent = stats.currentStreak;
  longestStreak.textContent = stats.longestStreak;
  totalCompleted.textContent = stats.totalCompletedDays;
}

// ==================== SETTINGS ====================

async function loadSettings() {
  const settings = await StorageHelper.getSettings();
  
  enableSoundsToggle.checked = settings.enableSounds;
  strictModeToggle.checked = settings.strictMode;
}

async function handleSettingsChange() {
  const settings = {
    enableSounds: enableSoundsToggle.checked,
    strictMode: strictModeToggle.checked
  };
  
  await StorageHelper.saveSettings(settings);
  showToast('Settings saved');
}

// ==================== DANGER ZONE ====================

async function handleClearHistory() {
  if (confirm('Are you sure you want to clear your history? This cannot be undone.')) {
    await StorageHelper.clearHistory();
    showToast('History cleared');
  }
}

async function handleResetStats() {
  if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
    await StorageHelper.resetStats();
    await loadStats();
    showToast('Statistics reset');
  }
}

async function handleResetAll() {
  const confirmed = confirm(
    'WARNING: This will delete ALL data including:\n\n' +
    '• All blocked websites\n' +
    '• All statistics and streaks\n' +
    '• All settings\n' +
    '• All history\n\n' +
    'This action CANNOT be undone. Are you absolutely sure?'
  );
  
  if (confirmed) {
    const doubleCheck = confirm('Last chance! Really delete everything?');
    
    if (doubleCheck) {
      await StorageHelper.resetAll();
      await loadBlockedUrls();
      await loadStats();
      await loadSettings();
      showToast('All data has been reset');
    }
  }
}

// ==================== TOAST NOTIFICATION ====================

function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  toast.className = 'toast show';
  
  if (type === 'error') {
    toast.style.background = '#dc3545';
  } else {
    toast.style.background = '#28a745';
  }
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ==================== HELPER FUNCTIONS ====================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Listen for storage changes
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local') {
    if (changes.blockedUrls) await loadBlockedUrls();
    if (changes.stats) await loadStats();
    if (changes.settings) await loadSettings();
  }
});