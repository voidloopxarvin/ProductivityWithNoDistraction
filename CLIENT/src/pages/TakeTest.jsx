import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import authService from '../services/authService';
import mockTestService from '../services/mockTestService';

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [mockTest, setMockTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTest();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && mockTest) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, mockTest]);

  const loadTest = async () => {
    try {
      const currentUser = authService.getStoredUser();
      setUser(currentUser);

      const response = await mockTestService.getById(id);
      const test = response.mockTest;
      
      setMockTest(test);
      setTimeLeft(test.duration * 60); // Convert minutes to seconds

      // Initialize answers array
      const initialAnswers = Array(test.totalQuestions || test.questions.length)
        .fill(null)
        .map((_, idx) => ({
          questionIndex: idx,
          selectedAnswer: null,
          timeTaken: 0
        }));
      
      setAnswers(initialAnswers);

    } catch (err) {
      console.error('Load test error:', err);
      alert('Failed to load test');
      navigate('/mock-tests');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion].selectedAnswer = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < mockTest.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    alert('⏰ Time is up! Auto-submitting your test...');
    await handleSubmit(true);
  };

  const handleSubmit = async (auto = false) => {
    if (!auto && !confirm('Submit test? You cannot change answers after submission.')) {
      return;
    }

    setSubmitting(true);
    try {
      const totalTime = mockTest.duration * 60;
      const timeSpent = totalTime - timeLeft;

      // Filter out unanswered questions
      const validAnswers = answers.filter(a => a.selectedAnswer !== null);

      const response = await mockTestService.submit(id, validAnswers, timeSpent);

      if (response.success) {
        // Navigate to results page with data
        navigate(`/test-result/${id}`, { 
          state: { 
            attempt: response.attempt,
            analysis: response.analysis,
            correctAnswers: response.correctAnswers,
            mockTest: mockTest
          }
        });
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit test: ' + err.message);
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return answers.filter(a => a.selectedAnswer !== null).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading test...</div>
      </div>
    );
  }

  if (!mockTest) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Test not found</div>
      </div>
    );
  }

  const question = mockTest.questions[currentQuestion];
  const answeredCount = getAnsweredCount();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Timer */}
        <div className="bg-black border-2 border-blue-500 rounded-xl p-6 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">{mockTest.title}</h1>
            <p className="text-gray-400">
              Question {currentQuestion + 1} of {mockTest.questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold font-mono ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-gray-400 text-sm mt-1">Time Remaining</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="bg-black border-2 border-gray-700 rounded-xl p-8">
              {/* Question Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm font-semibold">
                    {question.difficulty?.toUpperCase() || 'MEDIUM'}
                  </span>
                  {question.topic && (
                    <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-sm">
                      📚 {question.topic}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold leading-relaxed text-white">
                  {question.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      answers[currentQuestion].selectedAnswer === idx
                        ? 'border-blue-500 bg-blue-900/40 text-white shadow-lg shadow-blue-500/20'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white font-bold mr-4">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-lg">{option}</span>
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-6 border-t-2 border-gray-800">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>
                
                <button
                  onClick={() => setCurrentQuestion(Math.min(currentQuestion + 1, mockTest.questions.length - 1))}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition"
                >
                  Skip
                </button>

                {currentQuestion < mockTest.questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {submitting ? '⚙️ Submitting...' : '✓ Submit Test'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-black border-2 border-gray-700 rounded-xl p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-3">Questions</h3>
              
              <div className="mb-4 pb-4 border-b border-gray-800">
                <div className="text-sm text-gray-400">Progress</div>
                <div className="text-2xl font-bold text-blue-500">
                  {answeredCount}/{mockTest.questions.length}
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(answeredCount / mockTest.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {mockTest.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`aspect-square rounded-lg font-bold text-sm transition-all ${
                      currentQuestion === idx
                        ? 'bg-blue-600 text-white scale-110 shadow-lg'
                        : answers[idx].selectedAnswer !== null
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-gray-400">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-gray-400">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-800 rounded"></div>
                  <span className="text-gray-400">Not Answered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TakeTest;
