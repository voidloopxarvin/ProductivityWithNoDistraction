import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import authService from '../services/authService';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const navItems = [
    { path: '/dashboard', label: 'Roadmap', icon: '📚' },
    { path: '/mock-tests', label: 'Mock Tests', icon: '🎯' },
    { path: '/flashcards', label: 'Flashcards', icon: '🎴' },
    { path: '/ai-mentor', label: 'AI Mentor', icon: '🤖' },
    { path: '/extension-analytics', label: 'Extension', icon: '⏱️' }
  ];

  return (
    <header className="bg-black/80 backdrop-blur-xl border-b-2 border-blue-500/50 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/dashboard')}
          >
            <div className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
              📚
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
              PrepLock
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm flex items-center gap-2 group ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span className="text-lg group-hover:scale-125 transition-transform duration-300">
                  {item.icon}
                </span>
                <span>{item.label}</span>
                
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {/* User Info with Avatar */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800/50 transition group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs text-gray-500">Welcome back</div>
                  <div className="text-sm text-white font-semibold">{user?.name}</div>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-900 border-2 border-blue-500/30 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
                  <div className="p-4 border-b border-gray-800">
                    <div className="text-sm text-gray-400">Signed in as</div>
                    <div className="text-white font-bold">{user?.email}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition flex items-center gap-3"
                  >
                    <span className="text-lg">⚙️</span>
                    Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/dashboard');
                    }}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition flex items-center gap-3"
                  >
                    <span className="text-lg">📊</span>
                    Dashboard
                  </button>
                  
                  <div className="border-t border-gray-800">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/20 hover:text-red-300 transition flex items-center gap-3 font-semibold"
                    >
                      <span className="text-lg">🚪</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg font-semibold transition-all duration-300 text-xs flex items-center gap-2 ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Glassmorphism effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
    </header>
  );
};

export default Navbar;
