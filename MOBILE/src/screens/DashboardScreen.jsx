import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext); // ← Move to TOP (before any conditions)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activeDays: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/roadmap/active');
      
      console.log('📊 Roadmap Response:', response);
      
      if (response.success && response.roadmap) {
        setRoadmap(response.roadmap);
        
        const allTasks = response.roadmap.days.flatMap(day => day.tasks);
        const completed = allTasks.filter(task => task.completed).length;
        
        setStats({
          totalTasks: allTasks.length,
          completedTasks: completed,
          activeDays: response.roadmap.days.length,
        });
      } else {
        setStats({
          totalTasks: 0,
          completedTasks: 0,
          activeDays: 0,
        });
      }
    } catch (error) {
      console.error('❌ Dashboard Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const toggleTaskCompletion = async (dayIndex, taskIndex) => {
    if (!roadmap) return;
    
    try {
      const task = roadmap.days[dayIndex].tasks[taskIndex];
      
      const response = await api.put(`/roadmap/${roadmap._id}/task`, {
        dayIndex,
        taskIndex,
        completed: !task.completed,
      });

      if (response.success) {
        const updatedRoadmap = { ...roadmap };
        updatedRoadmap.days[dayIndex].tasks[taskIndex].completed = !task.completed;
        setRoadmap(updatedRoadmap);
        
        const allTasks = updatedRoadmap.days.flatMap(day => day.tasks);
        const completed = allTasks.filter(t => t.completed).length;
        setStats({
          ...stats,
          completedTasks: completed,
        });
      }
    } catch (error) {
      console.error('❌ Toggle Task Error:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const getProgressPercentage = () => {
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  const getTodaysTasks = () => {
    if (!roadmap || !roadmap.days || roadmap.days.length === 0) return [];
    
    const incompleteDay = roadmap.days.find(day => 
      day.tasks.some(task => !task.completed)
    );
    
    return incompleteDay ? incompleteDay.tasks : roadmap.days[0].tasks;
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </View>
    );
  }

  const todaysTasks = getTodaysTasks();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor="#2563eb" 
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'Student'}! 👋</Text>
        <Text style={styles.subGreeting}>Let's crush those tasks today!</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTasks}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>
        
        <View style={[styles.statCard, styles.statCardActive]}>
          <Text style={styles.statValue}>{stats.completedTasks}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeDays}</Text>
          <Text style={styles.statLabel}>Active Days</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Overall Progress</Text>
          <Text style={styles.progressPercentage}>{getProgressPercentage()}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${getProgressPercentage()}%` },
            ]}
          />
        </View>
      </View>

      {/* Today's Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Today's Tasks</Text>
          {roadmap && (
            <TouchableOpacity onPress={() => navigation.navigate('Roadmap')}>
              <Text style={styles.viewAllButton}>View All →</Text>
            </TouchableOpacity>
          )}
        </View>

        {todaysTasks.length > 0 ? (
          todaysTasks.map((task, index) => {
            const dayIndex = roadmap.days.findIndex(day =>
              day.tasks.some(t => t.title === task.title)
            );
            const taskIndex = roadmap.days[dayIndex]?.tasks.findIndex(
              t => t.title === task.title
            );

            return (
              <TouchableOpacity
                key={`${dayIndex}-${taskIndex}-${index}`}
                style={styles.taskCard}
                onPress={() => toggleTaskCompletion(dayIndex, taskIndex)}
              >
                <View style={styles.taskCheckbox}>
                  {task.completed ? (
                    <View style={styles.taskCheckboxChecked}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  ) : (
                    <View style={styles.taskCheckboxEmpty} />
                  )}
                </View>
                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.completed && styles.taskTitleCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎯</Text>
            <Text style={styles.emptyStateText}>No tasks yet!</Text>
            <Text style={styles.emptyStateSubtext}>
              Upload your syllabus to get started
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => navigation.navigate('Syllabus')}
            >
              <Text style={styles.uploadButtonText}>Upload Syllabus</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Syllabus')}
          >
            <Text style={styles.quickActionIcon}>📚</Text>
            <Text style={styles.quickActionText}>Syllabus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Roadmap')}
          >
            <Text style={styles.quickActionIcon}>🗺️</Text>
            <Text style={styles.quickActionText}>Roadmap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Flashcards')}
          >
            <Text style={styles.quickActionIcon}>🎴</Text>
            <Text style={styles.quickActionText}>Flashcards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('FocusMode')}
          >
            <Text style={styles.quickActionIcon}>🎯</Text>
            <Text style={styles.quickActionText}>Focus Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subGreeting: {
    fontSize: 16,
    color: '#888',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statCardActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllButton: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  taskCheckboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
  },
  taskCheckboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  taskDescription: {
    fontSize: 14,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    marginRight: '2%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default DashboardScreen;
