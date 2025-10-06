import { useState, useRef, useEffect } from 'react';
import syllabusService from '../../services/syllabusService';
import roadmapService from '../../services/roadmapService';
import gsap from 'gsap';

const SyllabusList = ({ syllabi, roadmaps, onViewRoadmap, onDelete, onGenerate }) => {
  const [generating, setGenerating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const listRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (cardsRef.current.length > 0 && syllabi.length > 0) {
      gsap.fromTo(cardsRef.current,
        { 
          opacity: 0, 
          x: -30,
          scale: 0.95
        },
        { 
          opacity: 1, 
          x: 0,
          scale: 1,
          duration: 0.5, 
          stagger: 0.08, 
          ease: "power2.out" 
        }
      );
    }
  }, [syllabi]);

  const handleGenerate = async (syllabusId) => {
    setGenerating(syllabusId);
    await onGenerate(syllabusId);
    setGenerating(null);
  };

  const handleDelete = async (syllabusId, title) => {
    const confirmed = window.confirm(`Delete "${title}"?`);
    if (!confirmed) return;
    
    // Find the card and animate it out
    const cardIndex = syllabi.findIndex(s => s._id === syllabusId);
    if (cardsRef.current[cardIndex]) {
      gsap.to(cardsRef.current[cardIndex], {
        opacity: 0,
        scale: 0.8,
        x: -50,
        duration: 0.3,
        ease: "power2.in"
      });
    }
    
    setDeleting(syllabusId);
    await onDelete(syllabusId);
    setDeleting(null);
  };

  if (syllabi.length === 0) {
    return (
      <div className="text-center py-20 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl">
        <div className="text-8xl mb-6 animate-bounce">📚</div>
        <h3 className="text-3xl font-bold text-white mb-3">No Syllabi Yet</h3>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Upload your first syllabus to get started with intelligent study planning and AI-powered roadmaps
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span className="text-sm font-medium">Scroll up to upload</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-4xl">📋</span>
          Your Syllabus
        </h2>
        <div className="flex items-center gap-4">
          <span className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 font-bold px-5 py-2 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
            {syllabi.length} {syllabi.length === 1 ? 'Syllabus' : 'Syllabi'}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div ref={listRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {syllabi.map((syllabus, index) => {
          const hasRoadmap = roadmaps[syllabus._id];
          const isGenerating = generating === syllabus._id;
          const isDeleting = deleting === syllabus._id;

          return (
            <div
              key={syllabus._id}
              ref={el => cardsRef.current[index] = el}
              className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300 group overflow-hidden"
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {syllabus.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-2 text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700">
                        <span className="text-lg">📌</span>
                        <span className="font-medium">{syllabus.topics?.length || 0} topics</span>
                      </span>
                      <span className="flex items-center gap-2 text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700">
                        <span className="text-lg">📅</span>
                        <span className="font-medium">{new Date(syllabus.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </span>
                    </div>
                  </div>
                  
                  {hasRoadmap && (
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-bold border border-green-500/30 shadow-lg shadow-green-500/10 flex items-center gap-2">
                      <span className="text-base">✅</span>
                      Ready
                    </div>
                  )}
                </div>

                {/* Upload Date */}
                <div className="mb-5 text-xs text-gray-500 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Uploaded {new Date(syllabus.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {hasRoadmap ? (
                    <button
                      onClick={() => onViewRoadmap(syllabus._id)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-xl">🗺️</span>
                        View Roadmap
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenerate(syllabus._id)}
                      disabled={isGenerating}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    >
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Generating...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span className="text-xl">🤖</span>
                          Generate Roadmap
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(syllabus._id, syllabus.title)}
                    disabled={isDeleting}
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 font-bold px-6 py-3.5 rounded-xl transition-all transform hover:scale-105 active:scale-95"
                    title="Delete syllabus"
                  >
                    {isDeleting ? (
                      <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-xl">🗑️</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SyllabusList;
