import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const StatsCards = ({ syllabi, roadmaps, getDaysUntilExam }) => {
  const cardsRef = useRef([]);
  const roadmapCount = Object.values(roadmaps).filter(r => r !== null).length;
  
  const stats = [
    {
      icon: '⏰',
      label: 'Days Until Exam',
      value: getDaysUntilExam() || '—',
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-500/30',
      glowColor: 'shadow-blue-500/20',
      bgGradient: 'from-blue-900/20 to-blue-950/20'
    },
    {
      icon: '📚',
      label: 'Total Syllabi',
      value: syllabi.length,
      color: 'from-blue-400 to-indigo-500',
      borderColor: 'border-indigo-500/30',
      glowColor: 'shadow-indigo-500/20',
      bgGradient: 'from-indigo-900/20 to-indigo-950/20'
    },
    {
      icon: '🗺️',
      label: 'Roadmaps',
      value: roadmapCount,
      color: 'from-indigo-500 to-purple-500',
      borderColor: 'border-purple-500/30',
      glowColor: 'shadow-purple-500/20',
      bgGradient: 'from-purple-900/20 to-purple-950/20'
    },
    {
      icon: '✅',
      label: 'Completion',
      value: `${roadmapCount > 0 ? Math.round((roadmapCount / syllabi.length) * 100) : 0}%`,
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-pink-500/30',
      glowColor: 'shadow-pink-500/20',
      bgGradient: 'from-pink-900/20 to-pink-950/20'
    }
  ];

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(cardsRef.current,
      { 
        opacity: 0, 
        y: 30,
        scale: 0.9
      },
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out"
      }
    );

    // Hover animations
    cardsRef.current.forEach((card, index) => {
      if (card) {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -10,
            scale: 1.03,
            duration: 0.3,
            ease: "power2.out"
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      }
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat, index) => (
        <div
          key={index}
          ref={el => cardsRef.current[index] = el}
          className={`relative bg-gradient-to-br from-gray-900 to-black border ${stat.borderColor} rounded-2xl p-6 shadow-2xl ${stat.glowColor} hover:shadow-2xl transition-shadow duration-300 overflow-hidden group cursor-pointer`}
        >
          {/* Animated background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
          
          {/* Shine effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-10 blur-xl`}></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Icon and decorative element */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg">
                {stat.icon}
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 transform group-hover:rotate-12`}>
              </div>
            </div>

            {/* Label */}
            <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 group-hover:text-gray-300 transition-colors">
              {stat.label}
            </p>

            {/* Value */}
            <div className="flex items-baseline gap-2">
              <p className="text-white text-4xl font-bold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                {stat.value}
              </p>
            </div>
          </div>

          {/* Corner decoration */}
          <div className={`absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-300`}></div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
