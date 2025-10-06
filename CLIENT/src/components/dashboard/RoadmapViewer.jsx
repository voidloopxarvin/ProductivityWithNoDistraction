import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import roadmapService from '../../services/roadmapService';
import gsap from 'gsap';

const RoadmapViewer = ({ roadmap, onClose, onProgressUpdate }) => {
  const mermaidRef = useRef(null);
  const containerRef = useRef(null);
  const daysRef = useRef([]);
  const [localRoadmap, setLocalRoadmap] = useState(roadmap);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    setLocalRoadmap(roadmap);
  }, [roadmap]);

  useEffect(() => {
    if (localRoadmap && mermaidRef.current) {
      renderMermaidDiagram();
    }

    // Entrance animation
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 50, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [localRoadmap]);

  useEffect(() => {
    // Animate day cards
    if (daysRef.current.length > 0) {
      gsap.fromTo(daysRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
      );
    }
  }, [localRoadmap?.days]);

  const handleDayComplete = async (dayNumber) => {
    try {
      const response = await roadmapService.completeDay(localRoadmap._id, dayNumber);
      if (response.success) {
        setLocalRoadmap(response.roadmap);
        onProgressUpdate && onProgressUpdate(response.roadmap);
        
        // Success animation
        const dayCard = daysRef.current[dayNumber - 1];
        if (dayCard) {
          gsap.to(dayCard, {
            scale: 1.05,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
          });
        }
        
        alert(`✅ Day ${dayNumber} marked as complete!`);
      }
    } catch (err) {
      alert('Failed to update progress');
    }
  };

  const renderMermaidDiagram = async () => {
    if (!localRoadmap || !mermaidRef.current) return;

    try {
      const mermaidCode = generateMermaidCode(localRoadmap);
      mermaidRef.current.innerHTML = '';
      const id = `mermaid-${Date.now()}`;
      const { svg } = await mermaid.render(id, mermaidCode);
      mermaidRef.current.innerHTML = svg;

      // Animate mermaid diagram
      gsap.fromTo(mermaidRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
      );
    } catch (err) {
      console.error('Mermaid render error:', err);
    }
  };

  const generateMermaidCode = (roadmap) => {
    if (!roadmap || !roadmap.days || roadmap.days.length === 0) {
      return 'graph TD\n A[No roadmap data]';
    }

    let code = 'graph TD\n';
    code += ` Start([📚 ${roadmap.title}])\n`;
    code += ` Start --> Day1\n`;

    const days = roadmap.days.slice(0, 20);

    days.forEach((day, index) => {
      const dayId = `Day${day.day}`;
      const nextDayId = index < days.length - 1 ? `Day${days[index + 1].day}` : 'End';
      const topicsText = day.topics.slice(0, 2).join(', ');
      const truncatedText = topicsText.length > 30 ? topicsText.slice(0, 30) + '...' : topicsText;

      let nodeStyle = day.completed ? '✅' :
        day.priority === 'high' ? '🔴' :
        day.priority === 'medium' ? '🟡' : '🟢';

      code += ` ${dayId}["${nodeStyle} Day ${day.day}<br/>${truncatedText}<br/>⏱️ ${day.duration}"]\n`;

      if (index < days.length - 1) {
        code += ` ${dayId} --> ${nextDayId}\n`;
      } else {
        code += ` ${dayId} --> End\n`;
      }

      if (day.completed) {
        code += ` style ${dayId} fill:#1e3a2e,stroke:#10b981,stroke-width:3px\n`;
      } else if (day.priority === 'high') {
        code += ` style ${dayId} fill:#3a1e1e,stroke:#ef4444,stroke-width:3px\n`;
      } else {
        code += ` style ${dayId} fill:#1e2a3a,stroke:#3b82f6,stroke-width:3px\n`;
      }
    });

    code += ` End([🎯 Exam Day])\n`;
    code += ` style Start fill:#3a2e1e,stroke:#f59e0b,stroke-width:4px\n`;
    code += ` style End fill:#1e3a3a,stroke:#06b6d4,stroke-width:4px\n`;

    return code;
  };

  if (!localRoadmap) return null;

  const completedDays = localRoadmap.days.filter(d => d.completed).length;
  const totalDays = localRoadmap.days.length;
  const progressPercentage = Math.round((completedDays / totalDays) * 100);

  return (
    <div ref={containerRef} className="mb-12 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-4xl">🗺️</span>
                {localRoadmap.title}
              </h2>
              <p className="text-blue-100 text-lg">
                {completedDays} of {totalDays} days completed • {progressPercentage}% done
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg p-3 transition-all transform hover:scale-110 active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-black/30 border-b border-gray-800">
          {[
            { label: 'Total Days', value: totalDays, icon: '📅', color: 'blue' },
            { label: 'Completed', value: completedDays, icon: '✅', color: 'green' },
            { label: 'Progress', value: `${progressPercentage}%`, icon: '📊', color: 'purple' },
            { label: 'Exam Date', value: new Date(localRoadmap.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), icon: '🎯', color: 'indigo' }
          ].map((stat, index) => (
            <div key={index} className={`bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5 border border-${stat.color}-500/20 rounded-xl p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{stat.icon}</span>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Mermaid Diagram */}
        <div className="p-8 bg-gradient-to-br from-gray-900/50 to-black/50 border-b border-gray-800">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Visual Study Path
          </h3>
          <div 
            ref={mermaidRef} 
            className="bg-gray-950 rounded-xl p-6 overflow-auto max-h-[600px] border border-gray-800 shadow-inner"
            style={{ 
              filter: 'brightness(0.9) contrast(1.1)',
              scrollbarWidth: 'thin',
              scrollbarColor: '#3b82f6 #1f2937'
            }}
          />
        </div>

        {/* Daily Schedule */}
        <div className="p-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">📚</span>
            Daily Study Schedule
          </h3>
          
          <div className="space-y-4">
            {localRoadmap.days.map((day, index) => (
              <div
                key={day.day}
                ref={el => daysRef.current[index] = el}
                className={`bg-gradient-to-br ${
                  day.completed 
                    ? 'from-green-900/30 to-green-950/30 border-green-500/30' 
                    : 'from-gray-900 to-black border-gray-800'
                } border rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group hover:border-blue-500/30`}
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`text-4xl ${day.completed ? 'scale-110' : ''}`}>
                          {day.completed ? '✅' : 
                           day.priority === 'high' ? '🔴' : 
                           day.priority === 'medium' ? '🟡' : '🟢'}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                            Day {day.day}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            {day.topics.slice(0, 2).join(', ')}
                            {day.topics.length > 2 && ` +${day.topics.length - 2} more`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-2 text-gray-400">
                          <span className="text-lg">⏱️</span>
                          {day.duration}
                        </span>
                        <span className="flex items-center gap-2 text-gray-400">
                          <span className="text-lg">📅</span>
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {day.focus && (
                          <span className="flex items-center gap-2 text-gray-400">
                            <span className="text-lg">🎯</span>
                            Focus: {day.focus}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!day.completed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDayComplete(day.day);
                          }}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-lg">✓</span>
                            Mark Complete
                          </span>
                        </button>
                      )}
                      <svg 
                        className={`w-6 h-6 text-gray-400 transition-transform ${expandedDay === day.day ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedDay === day.day && (
                  <div className="px-6 pb-6 border-t border-gray-800 pt-6 space-y-4 animate-fadeIn">
                    {day.completed && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 flex items-center gap-3">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <p className="text-green-400 font-semibold">Completed</p>
                          <p className="text-gray-400 text-sm">
                            ✅ Completed on {new Date(day.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <span className="text-xl">📖</span>
                        Topics to Cover
                      </h5>
                      <ul className="space-y-2">
                        {day.topics.map((topic, i) => (
                          <li key={i} className="flex items-start gap-3 text-gray-300 bg-gray-900/50 rounded-lg px-4 py-3 border border-gray-800">
                            <span className="text-blue-400 font-bold">{i + 1}.</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {day.notes && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
                        <p className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                          <span className="text-xl">📝</span>
                          Notes
                        </p>
                        <p className="text-gray-300">{day.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapViewer;
