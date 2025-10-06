import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../utils/constants';
import api from '../services/api';

const FocusModeScreen = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [blockedApps, setBlockedApps] = useState([]);
  const [newAppName, setNewAppName] = useState('');
  const [newAppPackage, setNewAppPackage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Poll every 10 seconds to sync with web/extension
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading focus data...');
      
      // Try to get active session (might not exist in backend yet)
      try {
        const sessionResponse = await api.getDashboardStats(); // Use existing endpoint
        console.log('✅ Session response:', sessionResponse);
        
        // Mock active session data for demo
        const mockSession = {
          id: 'demo_session_123',
          platform: 'web',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 25 min from now
          blockedApps: ['instagram', 'youtube', 'tiktok'],
          isActive: Math.random() > 0.7 // 30% chance of active session for demo
        };
        
        setActiveSession(mockSession.isActive ? mockSession : null);
        setIsActive(mockSession.isActive);
      } catch (sessionError) {
        console.log('ℹ️  No active session found');
        setActiveSession(null);
        setIsActive(false);
      }

      // Load blocked apps with fallback data
      setBlockedApps([
        { 
          name: 'Instagram', 
          packageName: 'com.instagram.android', 
          addedFrom: 'web',
          id: 'app_1'
        },
        { 
          name: 'YouTube', 
          packageName: 'com.google.android.youtube', 
          addedFrom: 'extension',
          id: 'app_2'
        },
        { 
          name: 'TikTok', 
          packageName: 'com.zhiliaoapp.musically', 
          addedFrom: 'mobile',
          id: 'app_3'
        }
      ]);

      console.log('✅ Focus data loaded successfully');
    } catch (error) {
      console.error('❌ Load error:', error);
      Alert.alert('Connection Error', 'Using offline mode with demo data');
      
      // Set demo data on error
      setActiveSession(null);
      setIsActive(false);
      setBlockedApps([
        { 
          name: 'Instagram', 
          packageName: 'com.instagram.android', 
          addedFrom: 'demo',
          id: 'demo_1'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startFocusMode = async (duration) => {
    try {
      console.log(`🎯 Starting focus mode for ${duration} minutes`);
      
      // Create mock session
      const newSession = {
        id: `session_${Date.now()}`,
        platform: 'mobile',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + duration * 60 * 1000).toISOString(),
        blockedApps: blockedApps.map(app => app.packageName),
        duration: duration
      };
      
      setActiveSession(newSession);
      setIsActive(true);
      
      Alert.alert(
        'Focus Mode Started! 🔒', 
        `Focus session active for ${duration} minutes.\nBlocking ${blockedApps.length} apps.`
      );
      
      console.log('✅ Focus mode started:', newSession);
    } catch (error) {
      console.error('❌ Start focus error:', error);
      Alert.alert('Error', 'Failed to start focus mode. Try again.');
    }
  };

  const stopFocusMode = async () => {
    try {
      console.log('⏹️ Stopping focus mode');
      
      setActiveSession(null);
      setIsActive(false);
      
      Alert.alert('Focus Mode Stopped', 'You can now access all apps again.');
      
      console.log('✅ Focus mode stopped');
    } catch (error) {
      console.error('❌ Stop focus error:', error);
      Alert.alert('Error', 'Failed to stop focus mode.');
    }
  };

  const addBlockedApp = async () => {
    if (!newAppName.trim() || !newAppPackage.trim()) {
      Alert.alert('Missing Information', 'Please fill in both app name and package name.');
      return;
    }

    try {
      const newApp = {
        id: `app_${Date.now()}`,
        name: newAppName.trim(),
        packageName: newAppPackage.trim(),
        addedFrom: 'mobile'
      };

      setBlockedApps(prev => [...prev, newApp]);
      setNewAppName('');
      setNewAppPackage('');
      
      Alert.alert('App Added! ✅', `${newAppName} has been added to the block list.`);
      
      console.log('✅ App added:', newApp);
    } catch (error) {
      console.error('❌ Add app error:', error);
      Alert.alert('Error', 'Failed to add app to block list.');
    }
  };

  const removeBlockedApp = async (appId) => {
    try {
      const appToRemove = blockedApps.find(app => (app.id || app.packageName) === appId);
      
      setBlockedApps(prev => prev.filter(app => (app.id || app.packageName) !== appId));
      
      Alert.alert('App Removed', `${appToRemove?.name || 'App'} removed from block list.`);
      
      console.log('✅ App removed:', appId);
    } catch (error) {
      console.error('❌ Remove app error:', error);
      Alert.alert('Error', 'Failed to remove app.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Focus Mode...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>🎯 Focus Mode</Text>

      {/* Active Session Display */}
      {activeSession && (
        <View style={styles.activeSession}>
          <Text style={styles.activeTitle}>🔒 Focus Mode Active</Text>
          <Text style={styles.activeText}>
            Platform: {activeSession.platform || 'Unknown'}
          </Text>
          <Text style={styles.activeText}>
            Started: {new Date(activeSession.startTime).toLocaleTimeString()}
          </Text>
          <Text style={styles.activeText}>
            Ends: {new Date(activeSession.endTime).toLocaleTimeString()}
          </Text>
          <Text style={styles.activeText}>
            Blocking: {activeSession.blockedApps?.length || 0} apps
          </Text>
          <TouchableOpacity style={styles.stopBtn} onPress={stopFocusMode}>
            <Text style={styles.stopBtnText}>⏹️ Stop Focus Mode</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Focus Mode Controls */}
      {!activeSession && (
        <View style={styles.controls}>
          <Text style={styles.controlsTitle}>Start Focus Session</Text>
          <View style={styles.focusButtons}>
            <TouchableOpacity 
              style={styles.focusBtn} 
              onPress={() => startFocusMode(25)}
            >
              <Text style={styles.focusBtnText}>🍅 25 min</Text>
              <Text style={styles.focusBtnSubtext}>Pomodoro</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.focusBtn} 
              onPress={() => startFocusMode(50)}
            >
              <Text style={styles.focusBtnText}>📚 50 min</Text>
              <Text style={styles.focusBtnSubtext}>Study Block</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add New App Form */}
      <View style={styles.addForm}>
        <Text style={styles.formTitle}>➕ Add App to Block List</Text>
        <TextInput
          style={styles.input}
          placeholder="App Name (e.g., Instagram)"
          placeholderTextColor={COLORS.textMuted}
          value={newAppName}
          onChangeText={setNewAppName}
        />
        <TextInput
          style={styles.input}
          placeholder="Package Name (e.g., com.instagram.android)"
          placeholderTextColor={COLORS.textMuted}
          value={newAppPackage}
          onChangeText={setNewAppPackage}
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={[
            styles.addBtn, 
            (!newAppName.trim() || !newAppPackage.trim()) && styles.addBtnDisabled
          ]} 
          onPress={addBlockedApp}
          disabled={!newAppName.trim() || !newAppPackage.trim()}
        >
          <Text style={styles.addBtnText}>Add App</Text>
        </TouchableOpacity>
      </View>

      {/* Blocked Apps List */}
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>
          🚫 Blocked Apps ({blockedApps.length})
        </Text>
        
        {blockedApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No blocked apps yet</Text>
            <Text style={styles.emptySubtext}>Add apps to get started</Text>
          </View>
        ) : (
          <FlatList
            data={blockedApps}
            keyExtractor={(item, index) => item.id || item.packageName || `app_${index}`}
            renderItem={({ item }) => (
              <View style={styles.appItem}>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{item.name}</Text>
                  <Text style={styles.appPackage}>{item.packageName}</Text>
                  <Text style={styles.appSource}>
                    📍 Added from: {item.addedFrom}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => removeBlockedApp(item.id || item.packageName)}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  activeSession: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  activeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  activeText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    opacity: 0.9,
  },
  stopBtn: {
    backgroundColor: COLORS.danger,
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  stopBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  controls: {
    marginBottom: 20,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  focusButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  focusBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  focusBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  focusBtnSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  addForm: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    marginBottom: 10,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: COLORS.success,
    padding: 12,
    borderRadius: 8,
  },
  addBtnDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },
  addBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  listSection: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  appItem: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  appPackage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  appSource: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  removeBtn: {
    backgroundColor: COLORS.danger,
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 16,
  },
});

export default FocusModeScreen;
