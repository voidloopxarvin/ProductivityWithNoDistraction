import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import extensionService from '../services/extensionService';
import Navbar from '../components/Navbar';

const ExtensionAnalytics = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [timerDuration, setTimerDuration] = useState(0);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    estimatedTime: 30,
    category: 'general'
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  // Timer counter
  useEffect(() => {
    let interval;
    if (activeSession) {
      interval = setInterval(() => {
        const duration = Math.floor((new Date() - new Date(activeSession.startTime)) / 1000);
        setTimerDuration(duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const loadData = async () => {
    try {
      const currentUser = authService.getStoredUser();
      setUser(currentUser);

      const tasksData = await extensionService.getTasks(filter);
      setTasks(tasksData.tasks || []);

      const statsData = await extensionService.getAnalytics('week');
      setStats(statsData.stats);

      const sessionData = await extensionService.getActiveSession();
      setActiveSession(sessionData.session);

    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await extensionService.createTask(newTask);
      setShowTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        estimatedTime: 30,
        category: 'general'
      });
      await loadData();
      alert('✅ Task created!');
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await extensionService.updateTask(taskId, updates);
      await loadData();
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await extensionService.deleteTask(taskId);
      await loadData();
      alert('🗑️ Task deleted!');
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const handleStartTimer = async (taskId) => {
    try {
      await extensionService.startTimer(taskId);
      await loadData();
    } catch (err) {
      alert('Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await extensionService.stopTimer();
      await loadData();
      alert('⏹️ Timer stopped!');
    } catch (err) {
      alert('Failed to stop timer');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black border-2 border-blue-500 rounded-xl p-6 hover:border-blue-400 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-semibold">TOTAL TASKS</span>
              <span className="text-3xl">📋</span>
            </div>
            <div className="text-4xl font-bold text-blue-500">
              {stats?.tasks.total || 0}
            </div>
          </div>

          <div className="bg-black border-2 border-green-500 rounded-xl p-6 hover:border-green-400 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-semibold">COMPLETED</span>
              <span className="text-3xl">✅</span>
            </div>
            <div className="text-4xl font-bold text-green-500">
              {stats?.tasks.completed || 0}
            </div>
          </div>

          <div className="bg-black border-2 border-purple-500 rounded-xl p-6 hover:border-purple-400 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-semibold">TIME SPENT</span>
              <span className="text-3xl">⏱️</span>
            </div>
            <div className="text-4xl font-bold text-purple-500">
              {stats?.time.totalHours || 0}h
            </div>
          </div>

          <div className="bg-black border-2 border-yellow-500 rounded-xl p-6 hover:border-yellow-400 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-semibold">SUCCESS RATE</span>
              <span className="text-3xl">📊</span>
            </div>
            <div className="text-4xl font-bold text-yellow-500">
              {stats?.tasks.completionRate || 0}%
            </div>
          </div>
        </div>

        {/* Active Timer */}
        {activeSession && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 border-2 border-blue-400 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-blue-100 font-semibold mb-2">🔴 CURRENTLY WORKING ON</div>
                <div className="text-2xl font-bold text-white mb-3">
                  {activeSession.extensionTaskId?.title || 'Untitled Task'}
                </div>
                <div className="flex gap-6 text-blue-100">
                  <span>Started: {new Date(activeSession.startTime).toLocaleTimeString()}</span>
                  <span className="font-mono text-2xl text-white">{formatTime(timerDuration)}</span>
                </div>
              </div>
              <button
                onClick={handleStopTimer}
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition text-lg"
              >
                ⏹️ Stop Timer
              </button>
            </div>
          </div>
        )}

        {/* Task Management */}
        <div className="bg-black border-2 border-gray-700 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">📝 Task Manager</h2>
            <div className="flex gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-2 text-white font-semibold"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={() => setShowTaskModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition border-2 border-blue-500"
              >
                + Add Task
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-400 text-lg">No tasks yet. Create one to get started!</p>
              </div>
            ) : (
              tasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  onStartTimer={handleStartTimer}
                  activeSession={activeSession}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={newTask}
          onChange={setNewTask}
          onSubmit={handleCreateTask}
          onClose={() => setShowTaskModal(false)}
        />
      )}
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, onUpdate, onDelete, onStartTimer, activeSession }) => {
  const priorityColors = {
    low: { border: 'border-blue-500', bg: 'bg-blue-900/20', text: 'text-blue-400' },
    medium: { border: 'border-yellow-500', bg: 'bg-yellow-900/20', text: 'text-yellow-400' },
    high: { border: 'border-red-500', bg: 'bg-red-900/20', text: 'text-red-400' }
  };

  const statusColors = {
    pending: { bg: 'bg-gray-800', text: 'text-gray-400' },
    'in-progress': { bg: 'bg-blue-900', text: 'text-blue-400' },
    completed: { bg: 'bg-green-900', text: 'text-green-400' }
  };

  const pc = priorityColors[task.priority];
  const sc = statusColors[task.status];

  return (
    <div className={`bg-gray-900 border-l-4 ${pc.border} rounded-lg p-5 hover:bg-gray-800 transition`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-white">{task.title}</h3>
            <span className={`px-3 py-1 text-xs font-bold rounded ${sc.bg} ${sc.text} uppercase`}>
              {task.status}
            </span>
            <span className={`px-3 py-1 text-xs font-bold rounded ${pc.bg} ${pc.text} uppercase`}>
              {task.priority}
            </span>
          </div>
          {task.description && (
            <p className="text-gray-400 mb-3">{task.description}</p>
          )}
          <div className="flex gap-6 text-sm">
            <span className="text-gray-400">⏱️ Est: <span className="text-white font-semibold">{task.estimatedTime}min</span></span>
            <span className="text-gray-400">⏰ Spent: <span className="text-white font-semibold">{task.actualTimeSpent}min</span></span>
            {task.dueDate && (
              <span className="text-gray-400">📅 <span className="text-white font-semibold">{new Date(task.dueDate).toLocaleDateString()}</span></span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {task.status !== 'completed' && !activeSession && (
            <button
              onClick={() => onStartTimer(task._id)}
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition border-2 border-green-500"
            >
              ▶️ Start
            </button>
          )}
          {task.status !== 'completed' && (
            <button
              onClick={() => onUpdate(task._id, { status: 'completed' })}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition border-2 border-blue-500"
            >
              ✓
            </button>
          )}
          <button
            onClick={() => onDelete(task._id)}
            className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition border-2 border-red-500"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

// Task Modal Component
const TaskModal = ({ task, onChange, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-blue-500 rounded-xl p-8 w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-6 text-white">✏️ Create New Task</h2>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-400">TASK TITLE *</label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => onChange({ ...task, title: e.target.value })}
              required
              className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
              placeholder="e.g., Complete React project"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-400">DESCRIPTION</label>
            <textarea
              value={task.description}
              onChange={(e) => onChange({ ...task, description: e.target.value })}
              className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none h-24"
              placeholder="Add details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">PRIORITY</label>
              <select
                value={task.priority}
                onChange={(e) => onChange({ ...task, priority: e.target.value })}
                className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">EST. TIME (MIN)</label>
              <input
                type="number"
                value={task.estimatedTime}
                onChange={(e) => onChange({ ...task, estimatedTime: parseInt(e.target.value) })}
                className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                min="5"
                step="5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-400">DUE DATE</label>
            <input
              type="date"
              value={task.dueDate}
              onChange={(e) => onChange({ ...task, dueDate: e.target.value })}
              className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 border-2 border-blue-500 py-3 rounded-lg font-bold text-white hover:bg-blue-700 transition"
            >
              Create Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg font-bold text-white hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtensionAnalytics;
