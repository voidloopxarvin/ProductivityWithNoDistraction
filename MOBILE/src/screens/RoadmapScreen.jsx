import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import api from '../services/api';

const RoadmapScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roadmap, setRoadmap] = useState(null);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roadmap/active');
      
      console.log('🗺️ Roadmap Response:', response);
      
      if (response.success && response.roadmap) {
        setRoadmap(response.roadmap);
      } else {
        setRoadmap(null);
      }
    } catch (error) {
      console.error('❌ Fetch Roadmap Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoadmap();
  };

  const toggleTask = async (dayIndex, taskIndex) => {
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
      }
    } catch (error) {
      console.error('❌ Toggle Task Error:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const getProgressPercentage = () => {
    if (!roadmap) return 0;
    const allTasks = roadmap.days.flatMap(day => day.tasks);
    const completed = allTasks.filter(task => task.completed).length;
    return Math.round((completed / allTasks.length) * 100);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading roadmap...</Text>
        </View>
      </View>
    );
  }

  if (!roadmap) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🗺️ Study Roadmap</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🗺️</Text>
          <Text style={styles.emptyStateText}>No roadmap generated yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Upload a syllabus and generate a roadmap to get started
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Study Roadmap</Text>
        <Text style={styles.headerSubtitle}>{roadmap.title || 'Your Study Plan'}</Text>
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

      {/* Days List */}
      <ScrollView
        style={styles.daysContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {roadmap.days.map((day, dayIndex) => {
          const completedTasks = day.tasks.filter(t => t.completed).length;
          const totalTasks = day.tasks.length;
          const dayProgress = Math.round((completedTasks / totalTasks) * 100);

          return (
            <View key={dayIndex} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>Day {day.day}</Text>
                <View style={styles.dayProgress}>
                  <Text style={styles.dayProgressText}>
                    {completedTasks}/{totalTasks}
                  </Text>
                </View>
              </View>

              {day.tasks.map((task, taskIndex) => (
                <TouchableOpacity
                  key={taskIndex}
                  style={styles.taskItem}
                  onPress={() => toggleTask(dayIndex, taskIndex)}
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
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
  daysContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dayCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  dayProgress: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayProgressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  taskDescription: {
    fontSize: 13,
    color: '#888',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
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
    textAlign: 'center',
  },
});

export default RoadmapScreen;
