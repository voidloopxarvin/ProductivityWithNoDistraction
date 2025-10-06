import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FocusControl = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [blockedApps, setBlockedApps] = useState([]);
  const [newApp, setNewApp] = useState('');

  useEffect(() => {
    fetchActiveSession();
    fetchBlockedApps();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchActiveSession, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSession = async () => {
    const res = await axios.get('/api/focus/active');
    setActiveSession(res.data.session);
  };

  const fetchBlockedApps = async () => {
    const res = await axios.get('/api/focus/blocked-apps');
    setBlockedApps(res.data.blockedApps);
  };

  const startFocusMode = async (duration) => {
    await axios.post('/api/focus/start', {
      duration,
      platform: 'web',
      blockedApps: blockedApps.apps.map(a => a.packageName)
    });
    fetchActiveSession();
  };

  const addBlockedApp = async () => {
    const updatedApps = [...blockedApps.apps, {
      packageName: newApp,
      name: newApp,
      addedFrom: 'web'
    }];
    
    await axios.post('/api/focus/blocked-apps', {
      apps: updatedApps
    });
    
    setNewApp('');
    fetchBlockedApps();
  };

  return (
    <div className="focus-control">
      <h2>Focus Mode Control</h2>
      
      {/* Active Session Display */}
      {activeSession && (
        <div className="active-session">
          <h3>🔒 Focus Mode Active</h3>
          <p>Platform: {activeSession.platform}</p>
          <p>Ends at: {new Date(activeSession.endTime).toLocaleTimeString()}</p>
          <p>Blocking {activeSession.blockedApps.length} apps</p>
        </div>
      )}

      {/* Start Focus Mode */}
      <div className="focus-controls">
        <button onClick={() => startFocusMode(25)}>25 min Focus</button>
        <button onClick={() => startFocusMode(50)}>50 min Focus</button>
      </div>

      {/* Blocked Apps Manager */}
      <div className="blocked-apps">
        <h3>Blocked Apps (Synced across all devices)</h3>
        <input 
          value={newApp}
          onChange={(e) => setNewApp(e.target.value)}
          placeholder="com.instagram.android"
        />
        <button onClick={addBlockedApp}>Add App</button>
        
        <ul>
          {blockedApps?.apps?.map(app => (
            <li key={app.packageName}>
              {app.name} 
              <small>Added from: {app.addedFrom}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FocusControl;
