// client/src/pages/ExtensionAuth.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const ExtensionAuth = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, error, not-logged-in
  const [message, setMessage] = useState('');

  useEffect(() => {
    connectExtension();
  }, []);

  const connectExtension = async () => {
    try {
      // Check if user is logged in
      const token = authService.getToken();
      const user = authService.getStoredUser();

      if (!token || !user) {
        setStatus('not-logged-in');
        setMessage('Please login first to connect your extension');
        return;
      }

      // Send token to extension
      const sent = await sendTokenToExtension(token);

      if (sent) {
        setStatus('success');
        setMessage('Extension connected successfully! You can close this tab.');
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Failed to connect extension. Make sure the extension is installed.');
      }

    } catch (err) {
      console.error('Extension auth error:', err);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  const sendTokenToExtension = async (token) => {
    return new Promise((resolve) => {
      // Try to send message to extension
      // Extension ID will be set in manifest
      try {
        // Method 1: Using postMessage (if extension content script is listening)
        window.postMessage({
          type: 'PREPLOCK_AUTH',
          token: token
        }, '*');

        // Method 2: Store in localStorage for extension to read
        localStorage.setItem('preplock_extension_token', token);
        localStorage.setItem('preplock_extension_auth_time', Date.now().toString());

        setTimeout(() => resolve(true), 500);
      } catch (err) {
        console.error('Failed to send token:', err);
        resolve(false);
      }
    });
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        
        {/* Status Icon */}
        <div className="text-center mb-6">
          {status === 'checking' && (
            <div className="text-6xl mb-4">⏳</div>
          )}
          {status === 'success' && (
            <div className="text-6xl mb-4">✅</div>
          )}
          {status === 'error' && (
            <div className="text-6xl mb-4">❌</div>
          )}
          {status === 'not-logged-in' && (
            <div className="text-6xl mb-4">🔐</div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
          {status === 'checking' && 'Connecting Extension...'}
          {status === 'success' && 'Connected!'}
          {status === 'error' && 'Connection Failed'}
          {status === 'not-logged-in' && 'Login Required'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {status === 'not-logged-in' && (
            <button
              onClick={handleLoginRedirect}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Go to Login
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={connectExtension}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          )}

          {status === 'success' && (
            <button
              onClick={() => window.close()}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Close Tab
            </button>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Make sure the PrepLock extension is installed</li>
            <li>Click the extension icon in Chrome</li>
            <li>Click "Connect to PrepLock"</li>
            <li>Your tasks will sync automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ExtensionAuth;