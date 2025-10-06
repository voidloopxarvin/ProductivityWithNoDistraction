import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import authService from '../services/authService';

const TestResult = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const { attempt, analysis, correctAnswers, mockTest } = location.state || {};

  useEffect(() => {
    const currentUser = authService.getStoredUser();
    setUser(currentUser);

    if (!attempt || !analysis) {
      alert('No results found');
      navigate('/mock-tests');
    }
  }, []);

  if (!attempt || !analysis || !mockTest) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    );
  }

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-500', emoji: '🌟' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-400', emoji: '🎉' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-500', emoji: '👍' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-500', emoji: '😊' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-500', emoji: '📚' };
    return { grade: 'F', color: 'text-red-500', emoji: '💪' };
  };

  const gradeInfo = getGrade(analysis.percentage);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Result Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-center">
          <div className="text-6xl mb-4">{gradeInfo.emoji}</div>
          <h1 className="text-4xl font-bold mb-2">Test Completed!</h1>
          <p className="text-blue-100 text-lg">{mockTest.title}</p>
        </div>

        {/* Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black border-2 border-green-500 rounded-xl p-6 text-center">
            <div className="text-5xl font-bold text-green-500 mb-2">
              {analysis.score}/{analysis.totalQuestions}
            </div>
            <div className="text-gray-400">Questions Correct</div>
          </div>

          <div className="bg-black border-2 border-blue-500 rounded-xl p-6 text-center">
            <div className={`text-5xl font-bold mb-2 ${gradeInfo.color}`}>
              {analysis.percentage}%
            </div>
            <div className="text-gray-400">Your Score</div>
          </div>

          <div className="bg-black border-2 border-purple-500 rounded-xl p-6 text-center">
            <div className={`text-5xl font-bold mb-2 ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </div>
            <div className="text-gray-400">Grade</div>
          </div>
        </div>

        {/* Weak Topics */}
        {analysis.weakTopics && analysis.weakTopics.length > 0 && (
          <div className="bg-black border-2 border-red-500 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>⚠️</span> Topics to Revise
            </h2>
            <div className="space-y-3">
              {analysis.weakTopics.map((topic, idx) => (
                <div key={idx} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{topic.topic}</span>
                    <span className="text-red-400 font-bold">
                      {topic.correctCount}/{topic.totalCount} ({topic.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${topic.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic-wise Performance */}
        {analysis.topicStats && (
          <div className="bg-black border-2 border-gray-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">📊 Topic-wise Performance</h2>
            <div className="space-y-3">
              {analysis.topicStats.map((stat, idx) => (
                <div key={idx} className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{stat.topic}</span>
                    <span className={`font-bold ${stat.percentage >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.correct}/{stat.total} ({stat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${stat.percentage >= 60 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/mock-tests')}
            className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
          >
            ← Back to Mock Tests
          </button>
          <button
            onClick={() => navigate(`/mock-test/${id}`)}
            className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
          >
            🔄 Retake Test
          </button>
        </div>
      </main>
    </div>
  );
};

export default TestResult;
