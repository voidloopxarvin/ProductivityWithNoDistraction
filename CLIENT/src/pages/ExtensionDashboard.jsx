import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import extensionService from '../services/extensionService';
import LightRays from '../components/LightRays';
const ExtensionDashboard = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // New task form state
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
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [filter]);

  const loadData = async () => {
    try {
      const currentUser = authService.getStoredUser();
      setUser(currentUser);

      // Load tasks
      const tasksData = await extensionService.getTasks(filter);
      setTasks(tasksData.tasks || []);

      // Load stats
      const statsData = await extensionService.getAnalytics('week');
      setStats(statsData.stats);

      // Load active session
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
      loadData();
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await extensionService.updateTask(taskId, updates);
      loadData();
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await extensionService.deleteTask(taskId);
      loadData();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const handleStartTimer = async (taskId) => {
    try {
      await extensionService.startTimer(taskId);
      loadData();
    } catch (err) {
      alert('Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await extensionService.stopTimer();
      loadData();
    } catch (err) {
      alert('Failed to stop timer');
    }
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
      {/* Header */}
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold">⏱️ Extension Analytics</h1>
              <nav className="flex gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  📚 Roadmap
                </button>
                <button
                  className="px-4 py-2 text-blue-500 border-b-2 border-blue-500"
                >
                  ⏱️ Extension
                </button>
              </nav>
            </div>
             <LightRays
                      raysOrigin="top-center"
                      raysColor="#3b82f6"
                      raysSpeed={1.5}
                      lightSpread={1.2}
                      rayLength={2}
                      followMouse={true}
                      mouseInfluence={0.2}
                      noiseAmount={0.08}
                      distortion={0.05}
                      fadeDistance={0.9}
                      saturation={1}
                    />
             <div className="fixed inset-0 pointer-events-none z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#3b82f6"
          raysSpeed={1.5}
          lightSpread={1.2}
          rayLength={2}
          followMouse={true}
          mouseInfluence={0.2}
          noiseAmount={0.08}
          distortion={0.05}
          fadeDistance={0.9}
          saturation={1}
        />
      </div>
            <div className="flex gap-3">
              <span className="text-gray-400">Welcome, {user?.name}</span>
              <button
                onClick={() => {
                  authService.logout();
                  navigate('/login');
                }}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Tasks</span>
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-3xl font-bold text-blue-500">
              {stats?.tasks.total || 0}
            </div>
          </div>

          <div className="bg-black border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Completed</span>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-3xl font-bold text-green-500">
              {stats?.tasks.completed || 0}
            </div>
          </div>

          <div className="bg-black border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Time Spent</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="text-3xl font-bold text-purple-500">
              {stats?.time.totalHours || 0}h
            </div>
          </div>

          <div className="bg-black border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Completion Rate</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-yellow-500">
              {stats?.tasks.completionRate || 0}%
            </div>
          </div>
        </div>

        {/* Active Timer */}
        {activeSession && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-100 mb-1">Currently Working On</div>
                <div className="text-2xl font-bold">
                  {activeSession.taskId?.title || 'Untitled Task'}
                </div>
                <div className="text-blue-100 mt-2">
                  Started: {new Date(activeSession.startTime).toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={handleStopTimer}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100"
              >
                ⏹️ Stop Timer
              </button>
            </div>
          </div>
        )}

        {/* Task Management */}
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">📝 Tasks</h2>
            <div className="flex gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={() => setShowTaskModal(true)}
                className="px-6 py-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-700"
              >
                + Add Task
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📭</div>
                <p>No tasks yet. Create one to get started!</p>
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
    low: 'border-blue-500',
    medium: 'border-yellow-500',
    high: 'border-red-500'
  };

  const statusColors = {
    pending: 'bg-gray-800',
    'in-progress': 'bg-blue-900',
    completed: 'bg-green-900'
  };

  return (
    <div className={`bg-gray-900 border-l-4 ${priorityColors[task.priority]} rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold">{task.title}</h3>
            <span className={`px-2 py-1 text-xs rounded ${statusColors[task.status]}`}>
              {task.status}
            </span>
            <span className="px-2 py-1 text-xs rounded bg-gray-800">
              {task.priority.toUpperCase()}
            </span>
          </div>
          {task.description && (
            <p className="text-gray-400 text-sm mb-3">{task.description}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-400">
            <span>⏱️ Est: {task.estimatedTime}min</span>
            <span>⏰ Spent: {task.actualTimeSpent}min</span>
            {task.dueDate && (
              <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {task.status !== 'completed' && !activeSession && (
            <button
              onClick={() => onStartTimer(task._id)}
              className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
            >
              ▶️ Start
            </button>
          )}
          {task.status !== 'completed' && (
            <button
              onClick={() => onUpdate(task._id, { status: 'completed' })}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              ✓ Complete
            </button>
          )}
          <button
            onClick={() => onDelete(task._id)}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl border border-gray-800">
        <h2 className="text-2xl font-bold mb-6">✏️ Create New Task</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Task Title *</label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => onChange({ ...task, title: e.target.value })}
              required
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
              placeholder="e.g., Complete React project"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={task.description}
              onChange={(e) => onChange({ ...task, description: e.target.value })}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:border-blue-500 outline-none h-24"
              placeholder="Add details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => onChange({ ...task, priority: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Est. Time (min)</label>
              <input
                type="number"
                value={task.estimatedTime}
                onChange={(e) => onChange({ ...task, estimatedTime: parseInt(e.target.value) })}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                min="5"
                step="5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Due Date</label>
            <input
              type="date"
              value={task.dueDate}
              onChange={(e) => onChange({ ...task, dueDate: e.target.value })}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-700"
            >
              Create Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-800 rounded-lg font-bold hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtensionDashboard;
