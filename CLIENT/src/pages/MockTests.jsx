import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import authService from '../services/authService';
import mockTestService from '../services/mockTestService';
import syllabusService from '../services/syllabusService';
// import Particles from '../components/Particles';
import LightRays from '../components/LightRays';
const MockTests = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mockTests, setMockTests] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  // Dual mode states
  const [generationMode, setGenerationMode] = useState('existing'); // 'existing' or 'new'
  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [newPdfFile, setNewPdfFile] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = authService.getStoredUser();
      setUser(currentUser);

      const [testsData, syllabusData] = await Promise.all([
        mockTestService.getAll(),
        syllabusService.getAll()
      ]);

      setMockTests(testsData.mockTests || []);
      setSyllabi(syllabusData.syllabus || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTest = async () => {
    // Validation based on mode
    if (generationMode === 'existing' && !selectedSyllabus) {
      alert('Please select a syllabus');
      return;
    }
    
    if (generationMode === 'new' && !newPdfFile) {
      alert('Please upload a PDF file');
      return;
    }

    if (!questionCount || questionCount < 5 || questionCount > 50) {
      alert('Please enter a valid number of questions (5-50)');
      return;
    }

    setGenerating(true);
    try {
      let response;
      
      if (generationMode === 'new') {
        // Generate from new PDF
        response = await mockTestService.generateFromNewPdf(newPdfFile, questionCount);
      } else {
        // Generate from existing syllabus
        response = await mockTestService.generate(selectedSyllabus, questionCount);
      }

      if (response.success) {
        alert('✅ Mock test generated successfully!');
        setShowGenerateModal(false);
        setGenerationMode('existing');
        setNewPdfFile(null);
        setSelectedSyllabus('');
        setQuestionCount(10);
        await loadData();
      }
    } catch (err) {
      console.error('Generate error:', err);
      alert('Failed to generate mock test: ' + err.message);
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

  const handleDeleteTest = async (testId) => {
    if (!confirm('Delete this mock test?')) return;

    try {
      await mockTestService.delete(testId);
      await loadData();
      alert('✅ Mock test deleted');
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleQuestionCountChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setQuestionCount(10);
    } else {
      const num = parseInt(value);
      setQuestionCount(isNaN(num) ? 10 : num);
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
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Particles Background
      <Particles 
        particleCount={130}
        particleSpread={9}
        speed={0.06}
        particleColors={['#3b82f6', '#10b981', '#8b5cf6']}
        alphaParticles={true}
        particleBaseSize={85}
        sizeRandomness={0.9}
        cameraDistance={20}
        className="fixed inset-0"
      /> */}

      <Navbar user={user} />
 <div className="fixed inset-0 pointer-events-none z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#3b82f6"
          raysSpeed={1.5}
          lightSpread={1.2}
          rayLength={2}
          followMouse={true}
          mouseInfluence={0.2}
          noiseAmount={0.08}
          distortion={0.05}
          fadeDistance={0.9}
          saturation={1}
        />
      </div>
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🎯 Mock Tests</h1>
            <p className="text-gray-400">Test your knowledge with AI-generated questions</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition border-2 border-blue-500"
          >
            + Generate New Test
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/70 backdrop-blur-sm border-2 border-blue-500 rounded-xl p-6">
            <div className="text-4xl mb-2">📝</div>
            <div className="text-3xl font-bold text-blue-500">{mockTests.length}</div>
            <div className="text-gray-400 text-sm">Total Tests</div>
          </div>
          <div className="bg-black/70 backdrop-blur-sm border-2 border-green-500 rounded-xl p-6">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold text-green-500">
              {mockTests.filter(t => t.attempts?.length > 0).length}
            </div>
            <div className="text-gray-400 text-sm">Attempted</div>
          </div>
          <div className="bg-black/70 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6">
            <div className="text-4xl mb-2">📚</div>
            <div className="text-3xl font-bold text-purple-500">{syllabi.length}</div>
            <div className="text-gray-400 text-sm">Available Syllabi</div>
          </div>
        </div>

        {/* Mock Tests List */}
        <div className="bg-black/70 backdrop-blur-sm border-2 border-gray-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Your Mock Tests</h2>

          {mockTests.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-400 text-lg mb-4">No mock tests yet</p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                Generate Your First Test
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mockTests.map(test => (
                <div
                  key={test._id}
                  className="bg-gray-900/80 backdrop-blur-sm border-2 border-gray-700 rounded-xl p-6 hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{test.title}</h3>
                      <div className="flex gap-6 text-sm text-gray-400 mb-3">
                        <span>📝 {test.totalQuestions} Questions</span>
                        <span>⏱️ {test.duration} minutes</span>
                        <span>📚 {test.topics?.length || 0} Topics</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {test.topics?.slice(0, 5).map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                        {test.topics?.length > 5 && (
                          <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs">
                            +{test.topics.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/mock-test/${test._id}`)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                      >
                        Start Test →
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test._id)}
                        className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ENHANCED Generate Modal with DUAL OPTIONS */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 backdrop-blur-md border-2 border-blue-500 rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-white">🎯 Generate Mock Test</h2>

            {/* Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3 text-gray-400">
                CHOOSE SOURCE
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setGenerationMode('existing');
                    setNewPdfFile(null);
                  }}
                  className={`p-4 rounded-lg border-2 transition ${
                    generationMode === 'existing'
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="text-3xl mb-2">📚</div>
                  <div className="font-bold text-white mb-1">Existing Syllabus</div>
                  <div className="text-xs text-gray-400">Use already uploaded PDF</div>
                </button>

                <button
                  onClick={() => {
                    setGenerationMode('new');
                    setSelectedSyllabus('');
                  }}
                  className={`p-4 rounded-lg border-2 transition ${
                    generationMode === 'new'
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="text-3xl mb-2">📄</div>
                  <div className="font-bold text-white mb-1">Upload New PDF</div>
                  <div className="text-xs text-gray-400">Generate from fresh PDF</div>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* Existing Syllabus Option */}
              {generationMode === 'existing' && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-400">
                    SELECT SYLLABUS *
                  </label>
                  <select
                    value={selectedSyllabus}
                    onChange={(e) => setSelectedSyllabus(e.target.value)}
                    className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="">Choose syllabus...</option>
                    {syllabi.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.title} ({s.topics?.length || 0} topics)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* New PDF Upload Option */}
              {generationMode === 'new' && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-400">
                    UPLOAD PDF FILE *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
                    />
                  </div>
                  {newPdfFile && (
                    <div className="mt-2 text-sm text-green-400">
                      ✓ Selected: {newPdfFile.name}
                    </div>
                  )}
                </div>
              )}

              {/* Question Count */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  NUMBER OF QUESTIONS
                </label>
                <input
                  type="number"
                  value={questionCount}
                  onChange={handleQuestionCountChange}
                  onBlur={() => {
                    if (!questionCount || questionCount < 5) setQuestionCount(5);
                    if (questionCount > 50) setQuestionCount(50);
                  }}
                  min="5"
                  max="50"
                  className="w-full bg-black border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  ℹ️ AI will generate {questionCount} high-quality MCQs {generationMode === 'existing' ? 'from the selected syllabus' : 'from your uploaded PDF'}.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGenerateTest}
                  disabled={generating}
                  className="flex-1 bg-blue-600 border-2 border-blue-500 py-3 rounded-lg font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {generating ? '⚙️ Generating...' : '🚀 Generate Test'}
                </button>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setGenerationMode('existing');
                    setNewPdfFile(null);
                    setSelectedSyllabus('');
                    setQuestionCount(10);
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

export default MockTests;