import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import authService from '../services/authService';
import flashcardService from '../services/flashcardService';

const StudyFlashcards = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unmastered, mastered
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlashcards();
  }, [id]);

  const loadFlashcards = async () => {
    try {
      const currentUser = authService.getStoredUser();
      setUser(currentUser);

      const response = await flashcardService.getById(id);
      setFlashcardSet(response.flashcardSet);
    } catch (err) {
      console.error('Load error:', err);
      alert('Failed to load flashcards');
      navigate('/flashcards');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCards = () => {
    if (!flashcardSet) return [];
    
    switch (filter) {
      case 'unmastered':
        return flashcardSet.cards.filter(card => !card.mastered);
      case 'mastered':
        return flashcardSet.cards.filter(card => card.mastered);
      default:
        return flashcardSet.cards;
    }
  };

  const filteredCards = getFilteredCards();
  const currentCard = filteredCards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = async () => {
    setIsFlipped(false);
    
    // Mark as reviewed
    if (currentCard) {
      await flashcardService.markReviewed(id, flashcardSet.cards.indexOf(currentCard));
    }

    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Loop back
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(filteredCards.length - 1);
    }
  };

  const handleMastered = async () => {
    if (!currentCard) return;

    try {
      const cardIndex = flashcardSet.cards.indexOf(currentCard);
      await flashcardService.markMastered(id, cardIndex);
      await loadFlashcards();
      
      // Auto-advance to next card
      setTimeout(() => {
        handleNext();
      }, 500);
    } catch (err) {
      alert('Failed to mark as mastered');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === ' ') {
      e.preventDefault();
      handleFlip();
    }
    if (e.key === 'm' || e.key === 'M') handleMastered();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isFlipped]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading flashcards...</div>
      </div>
    );
  }

  if (!flashcardSet || filteredCards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar user={user} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">🎴</div>
            <p className="text-white text-xl mb-4">No cards to study</p>
            <button
              onClick={() => navigate('/flashcards')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              ← Back to Flashcards
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / filteredCards.length) * 100);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-black border-2 border-blue-500 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{flashcardSet.title}</h1>
              <p className="text-gray-400">
                Card {currentIndex + 1} of {filteredCards.length}
              </p>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className="bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-2 text-white font-semibold"
              >
                <option value="all">All Cards</option>
                <option value="unmastered">Not Mastered</option>
                <option value="mastered">Mastered</option>
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="mb-8 perspective-1000">
          <div
            className={`flashcard-container ${isFlipped ? 'flipped' : ''}`}
            onClick={handleFlip}
          >
            {/* Front (Question) */}
            <div className="flashcard flashcard-front">
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <div className="text-sm font-bold text-blue-400 mb-4 uppercase">
                    {currentCard.category}
                  </div>
                  <div className="text-3xl font-bold leading-relaxed mb-4">
                    {currentCard.question}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Click to reveal answer
                  </div>
                  {currentCard.difficulty && (
                    <div className={`mt-4 inline-block px-4 py-1 rounded-full text-xs font-bold ${
                      currentCard.difficulty === 'easy' ? 'bg-green-900/30 text-green-400' :
                      currentCard.difficulty === 'hard' ? 'bg-red-900/30 text-red-400' :
                      'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {currentCard.difficulty.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Back (Answer) */}
            <div className="flashcard flashcard-back">
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <div className="text-sm font-bold text-green-400 mb-4 uppercase">
                    Answer
                  </div>
                  <div className="text-2xl leading-relaxed mb-4">
                    {currentCard.answer}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Click to see question
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black border-2 border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={handlePrevious}
              className="flex-1 px-6 py-4 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition border-2 border-gray-700"
            >
              ← Previous
            </button>
            
            <button
              onClick={handleFlip}
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition border-2 border-blue-500"
            >
              🔄 Flip Card
            </button>
            
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-4 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition border-2 border-gray-700"
            >
              Next →
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleMastered}
              disabled={currentCard.mastered}
              className={`flex-1 px-6 py-4 rounded-lg font-bold transition border-2 ${
                currentCard.mastered
                  ? 'bg-green-900/30 text-green-400 border-green-500 cursor-not-allowed'
                  : 'bg-green-600 text-white border-green-500 hover:bg-green-700'
              }`}
            >
              {currentCard.mastered ? '✓ Mastered' : '✓ Mark as Mastered'}
            </button>
            
            <button
              onClick={() => navigate('/flashcards')}
              className="px-6 py-4 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition border-2 border-gray-700"
            >
              Exit Study
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-sm font-bold text-blue-400 mb-3">⌨️ KEYBOARD SHORTCUTS</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">←</span> <span className="text-white">Previous</span>
            </div>
            <div>
              <span className="text-gray-400">→</span> <span className="text-white">Next</span>
            </div>
            <div>
              <span className="text-gray-400">Space</span> <span className="text-white">Flip</span>
            </div>
            <div>
              <span className="text-gray-400">M</span> <span className="text-white">Mastered</span>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        .flashcard-container {
          position: relative;
          width: 100%;
          height: 400px;
          transform-style: preserve-3d;
          transition: transform 0.6s;
          cursor: pointer;
        }

        .flashcard-container.flipped {
          transform: rotateY(180deg);
        }

        .flashcard {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 1rem;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .flashcard-front {
          background: linear-gradient(135deg, #1a1a1a 0%, #2563eb 100%);
          border-color: #2563eb;
        }

        .flashcard-back {
          background: linear-gradient(135deg, #1a1a1a 0%, #059669 100%);
          border-color: #059669;
          transform: rotateY(180deg);
        }

        .flashcard:hover {
          box-shadow: 0 20px 60px rgba(37, 99, 235, 0.3);
        }
      `}</style>
    </div>
  );
};

export default StudyFlashcards;
