import { useState, useEffect } from 'react';
import roadmapService from '../services/roadmapService';
import syllabusService from '../services/syllabusService';

const Roadmap = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try to load existing roadmap
      try {
        const roadmapData = await roadmapService.getActive();
        setRoadmap(roadmapData.roadmap);
      } catch (err) {
        // No active roadmap, load syllabi for generation
        const syllabusData = await syllabusService.getAll();
        setSyllabi(syllabusData.syllabus || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!selectedSyllabus) {
      setError('Please select a syllabus');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      await roadmapService.generate(selectedSyllabus);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteDay = async (dayNumber) => {
    try {
      await roadmapService.completeDay(roadmap._id, dayNumber);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getDayStatus = (day) => {
    if (day.completed) return 'completed';
    
    const dayDate = new Date(day.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dayDate.toDateString() === today.toDateString()) return 'today';
    if (dayDate < today) return 'overdue';
    return 'upcoming';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-500 text-green-800';
      case 'today': return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'overdue': return 'bg-red-100 border-red-500 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading roadmap...</div>
      </div>
    );
  }

  // Show generation UI if no roadmap exists
  if (!roadmap) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Generate Your Study Roadmap</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {syllabi.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                No Syllabus Found
              </h2>
              <p className="text-gray-600 mb-6">
                Upload a syllabus first to generate your personalized study roadmap
              </p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Upload Syllabus
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Select Syllabus
              </h2>
              
              <select
                value={selectedSyllabus}
                onChange={(e) => setSelectedSyllabus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Choose a syllabus...</option>
                {syllabi.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title} - {new Date(s.examDate).toLocaleDateString()}
                  </option>
                ))}
              </select>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>AI-Powered Generation:</strong> Our AI will analyze your syllabus 
                  and create a personalized day-by-day study plan optimized for your exam date.
                </p>
              </div>

              <button
                onClick={handleGenerateRoadmap}
                disabled={generating || !selectedSyllabus}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating Roadmap... (This may take 30-60 seconds)' : 'Generate Roadmap with AI'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show roadmap timeline
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{roadmap.title}</h1>
          <p className="text-gray-600 mt-2">
            Exam Date: {new Date(roadmap.examDate).toLocaleDateString()} • 
            {' '}{roadmap.totalDays} days plan
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Overall Progress</h2>
            <span className="text-2xl font-bold text-indigo-600">
              {roadmap.progress.percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${roadmap.progress.percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {roadmap.progress.completed} of {roadmap.progress.total} days completed
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          {roadmap.days.map((day, index) => {
            const status = getDayStatus(day);
            const statusColor = getStatusColor(status);

            return (
              <div
                key={day.day}
                className={`bg-white rounded-xl shadow-md border-l-4 ${statusColor} p-6 transition-all hover:shadow-lg`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-indigo-600">
                        Day {day.day}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                      {status === 'today' && (
                        <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full animate-pulse">
                          Today
                        </span>
                      )}
                      {day.completed && (
                        <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                          ✓ Completed
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {day.topics.join(' • ')}
                    </h3>

                    {day.subtopics && day.subtopics.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Subtopics:</p>
                        <div className="flex flex-wrap gap-2">
                          {day.subtopics.map((subtopic, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
                            >
                              {subtopic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-gray-600 mb-3">{day.focus}</p>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        ⏱️ {day.duration}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        day.priority === 'high' ? 'bg-red-100 text-red-700' :
                        day.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {day.priority.toUpperCase()} Priority
                      </span>
                    </div>
                  </div>

                  {!day.completed && status !== 'upcoming' && (
                    <button
                      onClick={() => handleCompleteDay(day.day)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition ml-4"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;