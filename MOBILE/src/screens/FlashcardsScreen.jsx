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
  Animated,
} from 'react-native';
import api from '../services/api';

const FlashcardsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/flashcards');
      
      console.log('🎴 Flashcards Response:', response);
      
      if (response.success) {
        setFlashcardSets(response.flashcards || []);
      }
    } catch (error) {
      console.error('❌ Fetch Flashcards Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFlashcards();
  };

  const generateFlashcards = async (syllabusId) => {
    try {
      Alert.alert(
        'Generate Flashcards',
        'This will create flashcards from your syllabus. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            onPress: async () => {
              setLoading(true);
              const response = await api.post(`/flashcards/generate/${syllabusId}`);
              
              if (response.success) {
                Alert.alert('Success', 'Flashcards generated!');
                fetchFlashcards();
              }
              setLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Generate Flashcards Error:', error);
      Alert.alert('Error', 'Failed to generate flashcards');
      setLoading(false);
    }
  };

  const openSet = (set) => {
    setActiveSet(set);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const closeSet = () => {
    setActiveSet(null);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: showAnswer ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setShowAnswer(!showAnswer);
  };

  const nextCard = () => {
    if (currentCardIndex < activeSet.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
      flipAnim.setValue(0);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
      flipAnim.setValue(0);
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading flashcards...</Text>
        </View>
      </View>
    );
  }

  // Card View Mode
  if (activeSet) {
    const currentCard = activeSet.cards[currentCardIndex];
    
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={closeSet}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{activeSet.title}</Text>
          <Text style={styles.cardCounter}>
            {currentCardIndex + 1} / {activeSet.cards.length}
          </Text>
        </View>

        {/* Card */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={flipCard}
            style={styles.cardTouchable}
          >
            <Animated.View
              style={[
                styles.card,
                styles.cardFront,
                { transform: [{ rotateY: frontInterpolate }] },
                showAnswer && styles.cardHidden,
              ]}
            >
              <Text style={styles.cardLabel}>Question</Text>
              <Text style={styles.cardText}>{currentCard.question}</Text>
              <Text style={styles.tapHint}>Tap to flip</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                styles.cardBack,
                { transform: [{ rotateY: backInterpolate }] },
                !showAnswer && styles.cardHidden,
              ]}
            >
              <Text style={styles.cardLabel}>Answer</Text>
              <Text style={styles.cardText}>{currentCard.answer}</Text>
              <Text style={styles.tapHint}>Tap to flip</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentCardIndex === 0 && styles.navButtonDisabled]}
            onPress={prevCard}
            disabled={currentCardIndex === 0}
          >
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              currentCardIndex === activeSet.cards.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={nextCard}
            disabled={currentCardIndex === activeSet.cards.length - 1}
          >
            <Text style={styles.navButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentCardIndex + 1) / activeSet.cards.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  }

  // List View Mode
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎴 Flashcards</Text>
        <Text style={styles.headerSubtitle}>Study with AI-generated cards</Text>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {flashcardSets.length > 0 ? (
          flashcardSets.map((set, index) => (
            <TouchableOpacity
              key={set._id || index}
              style={styles.setCard}
              onPress={() => openSet(set)}
            >
              <View style={styles.setIcon}>
                <Text style={styles.setIconText}>🎴</Text>
              </View>
              
              <View style={styles.setContent}>
                <Text style={styles.setTitle}>{set.title || 'Untitled Set'}</Text>
                <Text style={styles.setInfo}>{set.cards.length} cards</Text>
                <Text style={styles.setDate}>
                  Created: {new Date(set.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.arrowIcon}>
                <Text style={styles.arrowIconText}>→</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎴</Text>
            <Text style={styles.emptyStateText}>No flashcards yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Upload a syllabus and generate flashcards to study
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
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 10,
  },
  cardCounter: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  setCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  setIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  setIconText: {
    fontSize: 24,
  },
  setContent: {
    flex: 1,
  },
  setTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  setInfo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  setDate: {
    fontSize: 12,
    color: '#666',
  },
  arrowIcon: {
    marginLeft: 10,
  },
  arrowIconText: {
    fontSize: 20,
    color: '#666',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardTouchable: {
    width: '100%',
    height: 400,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#333',
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    borderColor: '#2563eb',
  },
  cardBack: {
    borderColor: '#22c55e',
  },
  cardHidden: {
    opacity: 0,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  cardText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 32,
  },
  tapHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 120,
  },
  navButtonDisabled: {
    backgroundColor: '#1a1a1a',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
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

export default FlashcardsScreen;
