// ============================================
// BLOCKED PAGE JAVASCRIPT
// Shows blocked site and remaining tasks
// ============================================

console.log('🔒 Blocked page loaded');

const motivationalQuotes = [
  "Stay focused! Complete your goals first.",
  "Your future self will thank you for staying disciplined today.",
  "Success is the sum of small efforts repeated daily.",
  "Focus on goals, not distractions.",
  "You're stronger than your urges. Keep going!",
  "Every goal completed is a step toward your dreams.",
  "Discipline is choosing what you want most over what you want now.",
  "Your goals are waiting. Let's finish them!",
  "Great things never come from comfort zones.",
  "You've got this! Just a few more tasks to go."
];

// ==================== INITIALIZATION ==================== 
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📋 Initializing blocked page...');
  await loadBlockedInfo();
  await loadRemainingTasks();
  setupEventListeners();
});

// ==================== LOAD BLOCKED INFO ====================
async function loadBlockedInfo() {
  try {
    // Get blocked URL from query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const blockedUrl = urlParams.get('url') || urlParams.get('blocked') || 'this website';
    
    console.log('🚫 Blocked URL:', blockedUrl);
    
    // Display blocked URL
    const blockedUrlElement = document.getElementById('blocked-url');
    if (blockedUrlElement) {
      blockedUrlElement.textContent = decodeURIComponent(blockedUrl);
    }
    
    // Random motivational quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    const motivationElement = document.querySelector('.motivation-text');
    if (motivationElement) {
      motivationElement.textContent = randomQuote;
    }
  } catch (error) {
    console.error('❌ Error loading blocked info:', error);
  }
}

// ==================== LOAD REMAINING TASKS ====================
async function loadRemainingTasks() {
  try {
    console.log('📋 Loading remaining tasks...');
    
    // Try to get active roadmap first
    const result = await chrome.storage.local.get(['activeRoadmap', 'todos']);
    console.log('Storage data:', result);
    
    let tasks = [];
    
    // Check if we have an active roadmap
    if (result.activeRoadmap && result.activeRoadmap.days) {
      const roadmap = result.activeRoadmap;
      const today = new Date();
      const startDate = new Date(roadmap.createdAt || Date.now());
      const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      const currentDayIndex = Math.min(daysPassed, roadmap.days.length - 1);
      
      const todaysTasks = roadmap.days[currentDayIndex]?.tasks || [];
      tasks = todaysTasks.filter(task => !task.completed);
      console.log('📅 Today\'s incomplete tasks from roadmap:', tasks);
    }
    // Fallback to todos if no roadmap
    else if (result.todos && result.todos.length > 0) {
      tasks = result.todos.filter(todo => !todo.completed);
      console.log('📝 Incomplete todos:', tasks);
    }
    
    // Display tasks or fallback message
    if (tasks.length === 0) {
      displayNoTasks();
    } else {
      displayTasks(tasks);
      updateProgress(tasks);
    }
    
  } catch (error) {
    console.error('❌ Error loading tasks:', error);
    displayNoTasks();
  }
}

function displayTasks(tasks) {
  const tasksContainer = document.getElementById('tasks-list');
  if (!tasksContainer) return;
  
  tasksContainer.innerHTML = '';
  
  tasks.forEach((task, index) => {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.style.animationDelay = `${index * 0.1}s`;
    
    taskItem.innerHTML = `
      <div class="task-bullet"></div>
      <div class="task-text">${task.title || task.description || task.text || 'Task'}</div>
    `;
    
    tasksContainer.appendChild(taskItem);
  });
}

function displayNoTasks() {
  const tasksContainer = document.getElementById('tasks-list');
  if (!tasksContainer) return;
  
  tasksContainer.innerHTML = `
    <div class="task-item">
      <div class="task-bullet"></div>
      <div class="task-text">Review your study materials</div>
    </div>
    <div class="task-item">
      <div class="task-bullet"></div>
      <div class="task-text">Practice flashcards</div>
    </div>
    <div class="task-item">
      <div class="task-bullet"></div>
      <div class="task-text">Complete mock tests</div>
    </div>
  `;
  
  // Update progress
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  if (progressBar) progressBar.style.width = '0%';
  if (progressText) progressText.textContent = 'No active tasks';
}

function updateProgress(tasks) {
  // Calculate progress (this shows remaining, so we show inverse)
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  if (!progressBar || !progressText) return;
  
  const remainingCount = tasks.length;
  progressBar.style.width = '30%'; // Show some progress to motivate
  progressText.textContent = `${remainingCount} task${remainingCount !== 1 ? 's' : ''} remaining`;
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Dashboard button
  const dashboardBtn = document.getElementById('btn-dashboard');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openDashboard' });
    });
  }
  
  // End session button
  const endSessionBtn = document.getElementById('btn-end-session');
  if (endSessionBtn) {
    endSessionBtn.addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to end your focus session?');
      if (confirmed) {
        try {
          const result = await chrome.storage.local.get(['authToken']);
          const token = result.authToken;
          
          if (token) {
            await fetch('http://localhost:5000/api/focus/stop', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          }
          
          await chrome.storage.local.remove(['focusSession', 'blockedSites']);
          window.location.href = 'https://www.google.com';
        } catch (error) {
          console.error('Error ending session:', error);
          alert('Failed to end session. Please try again.');
        }
      }
    });
  }
}

// Reload tasks every 30 seconds
setInterval(loadRemainingTasks, 30000);
