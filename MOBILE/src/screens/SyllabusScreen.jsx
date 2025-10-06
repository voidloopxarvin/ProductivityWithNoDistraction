import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import api from '../services/api';

const SyllabusScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syllabusList, setSyllabusList] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [syllabusTitle, setSyllabusTitle] = useState('');
  const [syllabusSubject, setSyllabusSubject] = useState('');

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/syllabus');
      
      console.log('📚 Syllabus Response:', response);
      
      if (response.success) {
        setSyllabusList(response.syllabi || []);
      }
    } catch (error) {
      console.error('❌ Fetch Syllabus Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSyllabus();
  };

  const createManualSyllabus = async () => {
    if (!syllabusTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      const response = await api.post('/syllabus/create', {
        title: syllabusTitle,
        subject: syllabusSubject || 'General',
        content: 'Manual syllabus entry',
      });

      if (response.success) {
        Alert.alert('Success', 'Syllabus created successfully!');
        setSyllabusTitle('');
        setSyllabusSubject('');
        setShowUploadModal(false);
        fetchSyllabus();
      }
    } catch (error) {
      console.error('❌ Create Syllabus Error:', error);
      Alert.alert('Error', 'Failed to create syllabus');
    }
  };

  const generateRoadmap = async (syllabusId) => {
    try {
      Alert.alert(
        'Generate Roadmap',
        'This will create a personalized study plan. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            onPress: async () => {
              setLoading(true);
              const response = await api.post(`/roadmap/generate/${syllabusId}`);
              
              if (response.success) {
                Alert.alert('Success', 'Roadmap generated successfully!');
                navigation.navigate('Roadmap');
              }
              setLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Generate Roadmap Error:', error);
      Alert.alert('Error', 'Failed to generate roadmap');
      setLoading(false);
    }
  };

  const deleteSyllabus = async (syllabusId) => {
    Alert.alert('Delete Syllabus', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/syllabus/${syllabusId}`);
            Alert.alert('Success', 'Syllabus deleted');
            fetchSyllabus();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete syllabus');
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
          <Text style={styles.loadingText}>Loading syllabus...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 My Syllabus</Text>
        <Text style={styles.headerSubtitle}>Manage your study materials</Text>
      </View>

      {/* Create Button */}
      <View style={styles.uploadSection}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setShowUploadModal(!showUploadModal)}
        >
          <Text style={styles.uploadIcon}>➕</Text>
          <Text style={styles.uploadButtonText}>Create Syllabus</Text>
        </TouchableOpacity>
      </View>

      {/* Create Form */}
      {showUploadModal && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Syllabus Title (e.g., Data Structures)"
            placeholderTextColor="#666"
            value={syllabusTitle}
            onChangeText={setSyllabusTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Subject (Optional)"
            placeholderTextColor="#666"
            value={syllabusSubject}
            onChangeText={setSyllabusSubject}
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={createManualSyllabus}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowUploadModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Syllabus List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {syllabusList.length > 0 ? (
          syllabusList.map((syllabus, index) => (
            <View key={syllabus._id || index} style={styles.syllabusCard}>
              <View style={styles.syllabusIcon}>
                <Text style={styles.syllabusIconText}>📚</Text>
              </View>
              
              <View style={styles.syllabusContent}>
                <Text style={styles.syllabusTitle}>{syllabus.title || 'Untitled'}</Text>
                <Text style={styles.syllabusSubject}>{syllabus.subject || 'No subject'}</Text>
                <Text style={styles.syllabusDate}>
                  Created: {new Date(syllabus.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.syllabusActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => generateRoadmap(syllabus._id)}
                >
                  <Text style={styles.actionButtonText}>🗺️ Generate</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteSyllabus(syllabus._id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📚</Text>
            <Text style={styles.emptyStateText}>No syllabus created yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create a syllabus to get started with your study plan
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
  uploadSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  syllabusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  syllabusIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  syllabusIconText: {
    fontSize: 24,
  },
  syllabusContent: {
    flex: 1,
  },
  syllabusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  syllabusSubject: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  syllabusDate: {
    fontSize: 12,
    color: '#666',
  },
  syllabusActions: {
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

export default SyllabusScreen;
