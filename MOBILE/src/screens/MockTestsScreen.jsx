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

const MockTestsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mockTests, setMockTests] = useState([]);

  useEffect(() => {
    fetchMockTests();
  }, []);

  const fetchMockTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mocktest');
      
      console.log('📝 Mock Tests Response:', response);
      
      if (response.success) {
        setMockTests(response.mockTests || []);
      }
    } catch (error) {
      console.error('❌ Fetch Mock Tests Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMockTests();
  };

  const startTest = (testId) => {
    navigation.navigate('TakeTest', { testId });
  };

  const viewResults = (test) => {
    Alert.alert(
      'Test Results',
      `Score: ${test.score}/${test.totalQuestions}\nPercentage: ${Math.round((test.score / test.totalQuestions) * 100)}%`,
      [{ text: 'OK' }]
    );
  };

  const deleteTest = async (testId) => {
    Alert.alert('Delete Test', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/mocktest/${testId}`);
            Alert.alert('Success', 'Test deleted');
            fetchMockTests();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete test');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading mock tests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📝 Mock Tests</Text>
        <Text style={styles.headerSubtitle}>Practice and test your knowledge</Text>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {mockTests.length > 0 ? (
          mockTests.map((test, index) => (
            <View key={test._id || index} style={styles.testCard}>
              <View style={styles.testIcon}>
                <Text style={styles.testIconText}>
                  {test.completed ? '✅' : '📝'}
                </Text>
              </View>
              
              <View style={styles.testContent}>
                <Text style={styles.testTitle}>{test.title || 'Untitled Test'}</Text>
                <Text style={styles.testInfo}>
                  {test.questions.length} questions • {test.duration} minutes
                </Text>
                {test.completed && (
                  <Text style={styles.testScore}>
                    Score: {test.score}/{test.totalQuestions} ({Math.round((test.score / test.totalQuestions) * 100)}%)
                  </Text>
                )}
              </View>

              <View style={styles.testActions}>
                {test.completed ? (
                  <>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => viewResults(test)}
                    >
                      <Text style={styles.actionButtonText}>📊 Results</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteTest(test._id)}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => startTest(test._id)}
                    >
                      <Text style={styles.actionButtonText}>▶️ Start</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteTest(test._id)}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateText}>No mock tests available</Text>
            <Text style={styles.emptyStateSubtext}>
              Mock tests created from the extension will appear here
            </Text>
          </View>
        )}
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
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  testCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  testIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  testIconText: {
    fontSize: 24,
  },
  testContent: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  testInfo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  testScore: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  testActions: {
    flexDirection: 'column',
  },
  actionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  deleteButtonText: {
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
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

export default MockTestsScreen;
