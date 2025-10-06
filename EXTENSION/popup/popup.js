const API_URL = 'http://localhost:5000/api';

let currentUser = null;
let token = null;
let autoSyncInterval = null;
let timerInterval = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  setupEventListeners();
});

// ==================== AUTH CHECK ====================
async function checkAuth() {
  const stored = await chrome.storage.sync.get(['authToken', 'user']);
  
  if (stored.authToken && stored.user) {
    token = stored.authToken;
    currentUser = stored.user;
    showDashboard();
    await syncWithBackend();
    startAutoSync();
  } else {
    showLogin();
  }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Login
  document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
  document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  // Add task
  document.getElementById('addTaskBtn')?.addEventListener('click', handleAddTask);
  document.getElementById('taskInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddTask();
  });

  // Actions
  document.getElementById('syncBtn')?.addEventListener('click', () => syncWithBackend());
  document.getElementById('openDashboardBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/extension-analytics' });
  });
  document.getElementById('stopTimerBtn')?.addEventListener('click', handleStopTimer);
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}

// ==================== LOGIN ====================
async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');

  errorDiv.textContent = '';

  if (!email || !password) {
    errorDiv.textContent = 'Please fill all fields';
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    token = data.token;
    currentUser = data.user;
    
    await chrome.storage.sync.set({ 
      authToken: data.token, 
      user: data.user 
    });

    showDashboard();
    await syncWithBackend();
    startAutoSync();

  } catch (error) {
    errorDiv.textContent = error.message;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

// ==================== ADD TASK ====================
async function handleAddTask() {
  const taskInput = document.getElementById('taskInput');
  const prioritySelect = document.getElementById('prioritySelect');
  
  const title = taskInput.value.trim();
  const priority = prioritySelect.value;

  if (!title) return;

  try {
    updateSyncStatus('syncing');

    const response = await fetch(`${API_URL}/extension/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        priority,
        estimatedTime: 30
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message);

    console.log('✅ Task created:', data.task);

    taskInput.value = '';
    prioritySelect.value = 'medium';

    await syncWithBackend();

  } catch (error) {
    console.error('Add task error:', error);
    alert('Failed to add task');
  }
}

// ==================== SYNC WITH BACKEND ====================
async function syncWithBackend() {
  if (!token) return;

  try {
    updateSyncStatus('syncing');

    // Fetch all tasks
    const tasksResponse = await fetch(`${API_URL}/extension/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const tasksData = await tasksResponse.json();
    const tasks = tasksData.tasks || [];

    // Fetch stats
    const statsResponse = await fetch(`${API_URL}/extension/analytics?period=week`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const statsData = await statsResponse.json();
    const stats = statsData.stats;

    // Fetch active session
    const sessionResponse = await fetch(`${API_URL}/extension/time/active`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const sessionData = await sessionResponse.json();
    const activeSession = sessionData.session;

    // Update UI
    displayTasks(tasks);
    updateStats(stats);
    updateActiveTimer(activeSession);

    updateSyncStatus('synced');

    console.log('✅ Synced:', tasks.length, 'tasks');

  } catch (error) {
    console.error('Sync error:', error);
    updateSyncStatus('error');
  }
}

// ==================== DISPLAY TASKS ====================
function displayTasks(tasks) {
  const tasksList = document.getElementById('tasksList');

  if (tasks.length === 0) {
    tasksList.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 48px; margin-bottom: 8px;">📭</div>
        <p>No tasks yet</p>
      </div>
    `;
    return;
  }

  tasksList.innerHTML = '';

  // Sort: pending first, then by priority
  const sortedTasks = tasks.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  sortedTasks.forEach(task => {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.priority} ${task.status === 'completed' ? 'completed' : ''}`;
    taskDiv.innerHTML = `
      <div class="task-content">
        <div class="task-title">${task.title}</div>
        <div class="task-meta">
          ${task.priority.toUpperCase()} • ${task.estimatedTime}min
        </div>
      </div>
      <div class="task-actions">
        ${task.status !== 'completed' ? `
          <button class="task-btn" onclick="startTask('${task._id}')">▶️</button>
          <button class="task-btn" onclick="completeTask('${task._id}')">✓</button>
        ` : ''}
        <button class="task-btn delete" onclick="deleteTask('${task._id}')">🗑️</button>
      </div>
    `;
    tasksList.appendChild(taskDiv);
  });
}

// ==================== TASK ACTIONS ====================
window.startTask = async function(taskId) {
  try {
    const response = await fetch(`${API_URL}/extension/time/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ extensionTaskId: taskId })
    });

    if (!response.ok) throw new Error('Failed to start timer');

    await syncWithBackend();
  } catch (error) {
    alert('Failed to start timer');
  }
};

window.completeTask = async function(taskId) {
  try {
    const response = await fetch(`${API_URL}/extension/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'completed' })
    });

    if (!response.ok) throw new Error('Failed to complete task');

    await syncWithBackend();
  } catch (error) {
    alert('Failed to complete task');
  }
};

window.deleteTask = async function(taskId) {
  if (!confirm('Delete this task?')) return;

  try {
    const response = await fetch(`${API_URL}/extension/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete task');

    await syncWithBackend();
  } catch (error) {
    alert('Failed to delete task');
  }
};

// ==================== UPDATE STATS ====================
function updateStats(stats) {
  if (!stats) return;

  document.getElementById('totalTasks').textContent = stats.tasks.total || 0;
  document.getElementById('completedTasks').textContent = stats.tasks.completed || 0;
  document.getElementById('timeSpent').textContent = `${stats.time.totalHours || 0}h`;
}

// ==================== ACTIVE TIMER ====================
function updateActiveTimer(session) {
  const timerDiv = document.getElementById('activeTimer');
  
  if (session) {
    timerDiv.style.display = 'flex';
    document.getElementById('timerTask').textContent = 
      session.extensionTaskId?.title || 'Untitled Task';
    
    // Start timer counter
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      const duration = Math.floor((new Date() - new Date(session.startTime)) / 1000);
      const hrs = Math.floor(duration / 3600).toString().padStart(2, '0');
      const mins = Math.floor((duration % 3600) / 60).toString().padStart(2, '0');
      const secs = (duration % 60).toString().padStart(2, '0');
      document.getElementById('timerDuration').textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
  } else {
    timerDiv.style.display = 'none';
    if (timerInterval) clearInterval(timerInterval);
  }
}

async function handleStopTimer() {
  try {
    const response = await fetch(`${API_URL}/extension/time/stop`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to stop timer');

    await syncWithBackend();
  } catch (error) {
    alert('Failed to stop timer');
  }
}

// ==================== AUTO-SYNC ====================
function startAutoSync() {
  if (autoSyncInterval) clearInterval(autoSyncInterval);
  autoSyncInterval = setInterval(() => syncWithBackend(), 60000); // Every 1 min
}

// ==================== UPDATE SYNC STATUS ====================
function updateSyncStatus(status) {
  const syncStatus = document.getElementById('syncStatus');
  
  switch (status) {
    case 'synced':
      syncStatus.textContent = '● Synced';
      syncStatus.className = 'sync-status synced';
      break;
    case 'syncing':
      syncStatus.textContent = '● Syncing...';
      syncStatus.className = 'sync-status';
      break;
    case 'error':
      syncStatus.textContent = '● Error';
      syncStatus.className = 'sync-status';
      break;
    default:
      syncStatus.textContent = '● Offline';
      syncStatus.className = 'sync-status';
  }
}

// ==================== LOGOUT ====================
async function handleLogout() {
  await chrome.storage.sync.clear();
  
  token = null;
  currentUser = null;
  
  if (autoSyncInterval) clearInterval(autoSyncInterval);
  if (timerInterval) clearInterval(timerInterval);
  
  showLogin();
}

// ==================== SHOW/HIDE SECTIONS ====================
function showLogin() {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
}
