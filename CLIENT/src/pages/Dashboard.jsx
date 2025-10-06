import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import syllabusService from '../services/syllabusService';
import roadmapService from '../services/roadmapService';
import mermaid from 'mermaid';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Navbar from '../components/Navbar';
import LightRays from '../components/LightRays';

// Components
import StatsCards from '../components/dashboard/StatsCards';
import RoadmapViewer from '../components/dashboard/RoadmapViewer';
import SyllabusUpload from '../components/dashboard/SyllabusUpload';
import SyllabusList from '../components/dashboard/SyllabusList';

gsap.registerPlugin(ScrollToPlugin);

const Dashboard = () => {
  const navigate = useNavigate();
  const roadmapRef = useRef(null);
  const containerRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [syllabi, setSyllabi] = useState([]);
  const [roadmaps, setRoadmaps] = useState({});
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose'
    });
    loadDashboardData();

    // GSAP entrance animations
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { 
          opacity: 0, 
          y: 50,
          scale: 0.95
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          delay: 0.2
        }
      );
    }
  }, []);

  useEffect(() => {
    if (activeRoadmap && roadmapRef.current) {
      gsap.to(window, {
        duration: 1.2,
        scrollTo: { y: roadmapRef.current, offsetY: 80 },
        ease: "power3.inOut"
      });
    }
  }, [activeRoadmap]);

  const loadDashboardData = async () => {
    try {
      const currentUser = authService.getStoredUser();
      setUser(currentUser);
      
      const syllabusData = await syllabusService.getAll();
      const syllabusArray = syllabusData.syllabus || [];
      setSyllabi(syllabusArray);

      // Load all roadmaps
      const roadmapMap = {};
      for (const syllabus of syllabusArray) {
        try {
          const roadmapData = await roadmapService.getBySyllabusId(syllabus._id);
          if (roadmapData.success && roadmapData.roadmap) {
            roadmapMap[syllabus._id] = roadmapData.roadmap;
          }
        } catch (err) {
          console.log(`No roadmap for ${syllabus.title}`);
        }
      }
      setRoadmaps(roadmapMap);

    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRoadmap = async (syllabusId) => {
    const roadmap = roadmaps[syllabusId];
    if (roadmap) {
      setActiveRoadmap(roadmap);
      
      // Animate roadmap appearance
      gsap.fromTo(roadmapRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    } else {
      alert('Roadmap not found. Please generate it first.');
    }
  };

  const handleGenerate = async (syllabusId) => {
    try {
      const response = await roadmapService.generate(syllabusId);
      if (response.success) {
        setRoadmaps(prev => ({ ...prev, [syllabusId]: response.roadmap }));
        setActiveRoadmap(response.roadmap);
        alert('✅ Roadmap generated!');
      }
    } catch (err) {
      alert('Failed to generate roadmap');
    }
  };

  const handleDelete = async (syllabusId) => {
    try {
      await syllabusService.delete(syllabusId);
      if (activeRoadmap?.syllabusId === syllabusId) {
        setActiveRoadmap(null);
      }
      await loadDashboardData();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const getDaysUntilExam = () => {
    if (syllabi.length === 0) return 0;
    const dates = syllabi
      .map(s => new Date(s.examDate))
      .filter(d => d > new Date())
      .sort((a, b) => a - b);
    if (dates.length === 0) return 0;
    const diff = Math.ceil((dates[0] - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="mt-4 text-lg text-white font-medium">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Gradient Orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      {/* Light Rays */}
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

      {/* Header */}
      <Navbar user={user} />

      <main ref={containerRef} className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 border-l-4 border-blue-500 pl-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, <span className="text-blue-400">{user?.name || 'User'}</span>
          </h1>
          <p className="text-gray-400 text-lg">Track your study progress and manage your exam preparation</p>
        </div>

        <StatsCards 
          syllabi={syllabi} 
          roadmaps={roadmaps} 
          getDaysUntilExam={getDaysUntilExam} 
        />
        
        <div ref={roadmapRef}>
          {activeRoadmap && (
            <RoadmapViewer 
              roadmap={activeRoadmap} 
              onClose={() => setActiveRoadmap(null)} 
            />
          )}
        </div>

        <SyllabusUpload onUploadSuccess={loadDashboardData} />
        
        <SyllabusList 
          syllabi={syllabi}
          roadmaps={roadmaps}
          onViewRoadmap={handleViewRoadmap}
          onDelete={handleDelete}
          onGenerate={handleGenerate}
        />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>PrepLock © 2025 - Your Smart Study Companion</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
