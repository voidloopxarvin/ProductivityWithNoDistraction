import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LightRays from '../components/LightRays';
import authService from '../services/authService';
import mentorService from '../services/mentorService';

const AIMentor = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const currentUser = authService.getStoredUser();
    setUser(currentUser);
    
    loadContext();
    
    setMessages([
      {
        role: 'assistant',
        content: '👋 Hi! I\'m your AI Study Mentor. I can help you with:\n\n• Explaining difficult topics from your syllabus\n• Suggesting study strategies\n• Answering questions about your roadmap\n• Providing motivation and tips\n\nWhat would you like to know?',
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadContext = async () => {
    try {
      const contextData = await mentorService.getContext();
      setContext(contextData);
    } catch (err) {
      console.error('Context load error:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await mentorService.ask(inputMessage, context);

      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        relatedDay: response.relatedDay,
        relatedTopics: response.relatedTopics,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  const quickQuestions = [
    "What should I study today?",
    "Explain normalization in DBMS",
    "How to prepare for my upcoming exam?",
    "What are my weak topics?",
    "Give me study motivation"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white relative overflow-hidden">
      {/* LightRays Background */}
      <div className="fixed inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#3b82f6"
          raysSpeed={1.0}
          lightSpread={0.7}
          rayLength={1.8}
          followMouse={true}
          mouseInfluence={0.12}
          noiseAmount={0.08}
          distortion={0.04}
          fadeDistance={0.9}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar user={user} />

        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
              🤖 AI Study Mentor
            </h1>
            <p className="text-gray-400 text-lg">
              Your personal AI tutor, available 24/7
            </p>
          </div>

          {/* Context Cards */}
          {context && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 shadow-xl">
                <div className="text-sm text-blue-300">📅 Current Day</div>
                <div className="text-2xl font-bold text-white">Day {context.currentDay}</div>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 shadow-xl">
                <div className="text-sm text-blue-300">📚 Topics Today</div>
                <div className="text-2xl font-bold text-white">{context.todayTopicsCount}</div>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 shadow-xl">
                <div className="text-sm text-blue-300">✅ Progress</div>
                <div className="text-2xl font-bold text-white">{context.progressPercent}%</div>
              </div>
            </div>
          )}

          {/* Chat Container */}
          <div className="bg-black/50 backdrop-blur-xl border-2 border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden">
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/80 backdrop-blur text-gray-100 border border-gray-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.relatedDay && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="text-xs text-blue-300">
                          📍 Related to Day {message.relatedDay} of your roadmap
                        </div>
                      </div>
                    )}
                    
                    {message.relatedTopics && message.relatedTopics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.relatedTopics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-4 border border-gray-700">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            <div className="px-6 py-3 bg-gray-900/50 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Quick Questions:</div>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-xs hover:bg-blue-900/50 transition"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-6 bg-black/30 border-t border-gray-700">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything about your studies..."
                  className="flex-1 bg-gray-800/50 border-2 border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={isTyping || !inputMessage.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTyping ? '⏳' : '📤 Send'}
                </button>
              </div>
            </form>
          </div>

          {/* Tips */}
          <div className="mt-8 bg-blue-900/20 backdrop-blur-xl border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-3 text-white">💡 Tips for better answers:</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Be specific in your questions</li>
              <li>• Mention the topic or subject if relevant</li>
              <li>• Ask for examples or explanations</li>
              <li>• Request study strategies for difficult topics</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIMentor;
