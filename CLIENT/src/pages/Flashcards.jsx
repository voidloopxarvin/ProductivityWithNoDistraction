import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LightRays from '../components/LightRays';
import authService from '../services/authService';
import flashcardService from '../services/flashcardService';
import syllabusService from '../services/syllabusService';

const Flashcards = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  const [generationMode, setGenerationMode] = useState('existing');
  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [newPdfFile, setNewPdfFile] = useState(null);
  const [cardCount, setCardCount] = useState(20);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = authService.getStoredUser();
      setUser(currentUser);

      const [flashcardsData, syllabusData] = await Promise.all([
        flashcardService.getAll(),
        syllabusService.getAll()
      ]);

      setFlashcardSets(flashcardsData.flashcards || []);
      setSyllabi(syllabusData.syllabus || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (generationMode === 'existing' && !selectedSyllabus) {
      alert('Please select a syllabus');
      return;
    }
    
    if (generationMode === 'new' && !newPdfFile) {
      alert('Please upload a PDF file');
      return;
    }

    setGenerating(true);
    try {
      let response;
      
      if (generationMode === 'new') {
        response = await flashcardService.generateFromPdf(newPdfFile, cardCount);
      } else {
        response = await flashcardService.generateFromSyllabus(selectedSyllabus, cardCount);
      }

      if (response.success) {
        alert('✅ Flashcards generated successfully!');
        setShowGenerateModal(false);
        setGenerationMode('existing');
        setNewPdfFile(null);
        setSelectedSyllabus('');
        await loadData();
      }
    } catch (err) {
      alert('Failed to generate flashcards: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setNewPdfFile(file);
    } else {
      alert('Please select a PDF file');
      e.target.value = '';
    }
  };

  const handleDelete = async (setId) => {
    if (!confirm('Delete this flashcard set?')) return;

    try {
      await flashcardService.delete(setId);
      await loadData();
      alert('✅ Flashcard set deleted');
    } catch (err) {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white relative overflow-hidden">
      {/* LightRays Background */}
      <div className="fixed inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#3b82f6"
          raysSpeed={0.9}
          lightSpread={0.8}
          rayLength={1.6}
          followMouse={true}
          mouseInfluence={0.15}
          noiseAmount={0.06}
          distortion={0.05}
          fadeDistance={0.85}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar user={user} />

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
                🎴 Flashcards
              </h1>
              <p className="text-gray-400 text-lg">Study with AI-generated Q&A flashcards</p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition border-2 border-blue-500 shadow-lg"
            >
              + Generate Flashcards
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-black/40 backdrop-blur-xl border-2 border-blue-500/30 rounded-xl p-6 shadow-xl hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-2">📚</div>
              <div className="text-3xl font-bold text-blue-400">{flashcardSets.length}</div>
              <div className="text-gray-400 text-sm">Flashcard Sets</div>
            </div>
            <div className="bg-black/40 backdrop-blur-xl border-2 border-blue-500/30 rounded-xl p-6 shadow-xl hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-white">
                {flashcardSets.reduce((sum, set) => sum + (set.masteredCount || 0), 0)}
              </div>
              <div className="text-gray-400 text-sm">Cards Mastered</div>
            </div>
            <div className="bg-black/40 backdrop-blur-xl border-2 border-blue-500/30 rounded-xl p-6 shadow-xl hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-3xl font-bold text-white">
                {flashcardSets.reduce((sum, set) => sum + (set.totalCards || 0), 0)}
              </div>
              <div className="text-gray-400 text-sm">Total Cards</div>
            </div>
          </div>

          {/* Flashcard Sets List */}
          <div className="bg-black/40 backdrop-blur-xl border-2 border-gray-700/50 rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">Your Flashcard Sets</h2>

            {flashcardSets.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎴</div>
                <p className="text-gray-400 text-lg mb-4">No flashcards yet</p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Generate Your First Set
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {flashcardSets.map(set => {
                  const progressPercent = Math.round(((set.masteredCount || 0) / (set.totalCards || 1)) * 100);
                  
                  return (
                    <div
                      key={set._id}
                      className="bg-gray-900/60 backdrop-blur border-2 border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 cursor-pointer shadow-xl hover:scale-[1.02]"
                      onClick={() => navigate(`/flashcard/${set._id}`)}
                    >
                      <h3 className="text-xl font-bold text-white mb-3">{set.title}</h3>
                      
                      <div className="flex gap-4 text-sm text-gray-400 mb-4">
                        <span>📝 {set.totalCards} cards</span>
                        <span>✅ {set.masteredCount || 0} mastered</span>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-blue-400 font-bold">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/flashcard/${set._id}`);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                          Study Now →
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(set._id);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-blue-500 rounded-xl p-8 w-full max-w-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">🎴 Generate Flashcards</h2>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-3 text-gray-400">CHOOSE SOURCE</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGenerationMode('existing')}
                  className={`p-4 rounded-lg border-2 transition ${
                    generationMode === 'existing'
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="text-3xl mb-2">📚</div>
                  <div className="font-bold text-white mb-1">Existing Syllabus</div>
                  <div className="text-xs text-gray-400">Use uploaded PDF</div>
                </button>

                <button
                  onClick={() => setGenerationMode('new')}
                  className={`p-4 rounded-lg border-2 transition ${
                    generationMode === 'new'
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="text-3xl mb-2">📄</div>
                  <div className="font-bold text-white mb-1">Upload New PDF</div>
                  <div className="text-xs text-gray-400">Generate fresh cards</div>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {generationMode === 'existing' && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-400">SELECT SYLLABUS *</label>
                  <select
                    value={selectedSyllabus}
                    onChange={(e) => setSelectedSyllabus(e.target.value)}
                    className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="">Choose syllabus...</option>
                    {syllabi.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {generationMode === 'new' && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-400">UPLOAD PDF *</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
                  />
                  {newPdfFile && (
                    <div className="mt-2 text-sm text-green-400">✓ {newPdfFile.name}</div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">NUMBER OF CARDS</label>
                <input
                  type="number"
                  value={cardCount}
                  onChange={(e) => setCardCount(parseInt(e.target.value) || 20)}
                  min="5"
                  max="100"
                  className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  ℹ️ AI will generate {cardCount} Q&A flashcards for effective revision.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 bg-blue-600 border-2 border-blue-500 py-3 rounded-lg font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {generating ? '⚙️ Generating...' : '🚀 Generate'}
                </button>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setGenerationMode('existing');
                    setNewPdfFile(null);
                  }}
                  disabled={generating}
                  className="px-6 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg font-bold text-white hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
