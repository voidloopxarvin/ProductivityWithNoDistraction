import { useState, useRef, useEffect } from 'react';
import syllabusService from '../../services/syllabusService';
import gsap from 'gsap';

const SyllabusUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [processingTime, setProcessingTime] = useState(0);
  
  const uploadRef = useRef(null);
  const fileDisplayRef = useRef(null);

  useEffect(() => {
    if (uploadRef.current) {
      gsap.fromTo(uploadRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.2 }
      );
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadError('');
      
      // Animate file selection
      if (fileDisplayRef.current) {
        gsap.fromTo(fileDisplayRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
        );
      }
    } else {
      setSelectedFile(null);
      setUploadError('Please select a PDF file');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !examDate) {
      setUploadError('Please select a file and exam date');
      return;
    }

    const startTime = performance.now();
    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('syllabus', selectedFile);
      formData.append('title', uploadTitle || selectedFile.name.replace('.pdf', ''));
      formData.append('examDate', examDate);
      formData.append('useAI', useAI);

      await syllabusService.upload(formData);
      
      const duration = (performance.now() - startTime) / 1000;
      setProcessingTime(duration);
      
      // Success animation
      gsap.to(uploadRef.current, {
        scale: 1.02,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
      
      // Reset form
      setSelectedFile(null);
      setUploadTitle('');
      setExamDate('');
      document.getElementById('file-input').value = '';
      
      setTimeout(() => {
        setProcessingTime(0);
        onUploadSuccess();
      }, 3000);
      
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div ref={uploadRef} className="mb-12">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">📤</span>
              Upload New Syllabus
            </h2>
            <p className="text-blue-100 mt-2 text-lg">Transform your syllabus into an intelligent study roadmap</p>
          </div>
        </div>

        {/* Notifications */}
        {uploadError && (
          <div className="mx-8 mt-6 bg-red-500/10 border-l-4 border-red-500 text-red-400 px-6 py-4 rounded-lg flex items-center gap-3 animate-shake">
            <span className="text-3xl">⚠️</span>
            <div>
              <p className="font-semibold">Upload Error</p>
              <p className="text-sm">{uploadError}</p>
            </div>
          </div>
        )}

        {processingTime > 0 && (
          <div className="mx-8 mt-6 bg-green-500/10 border-l-4 border-green-500 text-green-400 px-6 py-4 rounded-lg flex items-center gap-3 animate-slideIn">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">Processed in {processingTime.toFixed(2)} seconds</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUpload} className="p-8 space-y-6">
          {/* Title and Exam Date Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title Input */}
            <div>
              <label className="block text-gray-300 font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">📝</span>
                Syllabus Title
                <span className="text-gray-500 text-sm font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., Data Structures Mid-Term"
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-gray-500"
                disabled={uploading}
              />
            </div>

            {/* Exam Date */}
            <div>
              <label className="block text-gray-300 font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">📅</span>
                Exam Date
                <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={uploading}
              />
            </div>
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-gray-300 font-semibold mb-3 flex items-center gap-2">
              <span className="text-xl">📄</span>
              Upload PDF Syllabus
              <span className="text-red-400">*</span>
            </label>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="file-input"
              className={`flex items-center justify-center w-full px-6 py-10 border-2 border-dashed ${
                selectedFile ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 bg-gray-900/50'
              } rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-gray-900 transition-all group`}
            >
              <div className="text-center">
                <span className="text-6xl mb-4 block group-hover:scale-110 transition-transform">
                  {selectedFile ? '📄' : '📤'}
                </span>
                {selectedFile ? (
                  <div ref={fileDisplayRef}>
                    <span className="text-green-400 font-bold text-lg block mb-1">
                      {selectedFile.name}
                    </span>
                    <p className="text-gray-500 text-sm mb-2">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-blue-400 text-sm font-medium">Click to change file</p>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-300 font-semibold text-lg block mb-2">
                      Click to upload PDF file
                    </span>
                    <p className="text-gray-500 text-sm">or drag and drop</p>
                    <p className="text-gray-600 text-xs mt-2">Maximum file size: 10MB</p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* File Info Display */}
          {selectedFile && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl px-6 py-4 flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(selectedFile.size / 1024).toFixed(2)} KB • PDF Document
                </p>
              </div>
            </div>
          )}

          {/* AI Toggle */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl px-6 py-5 group hover:border-blue-500/50 transition-all">
            <input
              type="checkbox"
              id="use-ai"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="w-6 h-6 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              disabled={uploading}
            />
            <label htmlFor="use-ai" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <p className="text-white font-semibold">Use AI-Powered Topic Extraction</p>
                  <p className="text-gray-400 text-sm">Automatically identify and organize topics using artificial intelligence</p>
                </div>
              </div>
            </label>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              useAI ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700 text-gray-400'
            }`}>
              {useAI ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !selectedFile || !examDate}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-blue-500/30 disabled:shadow-none relative overflow-hidden group"
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            
            <span className="relative flex items-center justify-center gap-3">
              {uploading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Processing... {processingTime > 0 && `(${processingTime.toFixed(1)}s)`}</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">🚀</span>
                  <span className="text-lg">Upload & Process Syllabus</span>
                </>
              )}
            </span>
          </button>

          {/* Feature Tags */}
          <div className="flex flex-wrap gap-3 pt-2">
            {[
              { icon: '⚡', text: 'Fast Processing' },
              { icon: '🔒', text: 'Secure Upload' },
              { icon: '🤖', text: 'AI-Enhanced' }
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2">
                <span className="text-lg">{feature.icon}</span>
                <span className="text-gray-400 text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </form>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        .animate-slideIn {
          animation: slideIn 0.5s;
        }
      `}</style>
    </div>
  );
};

export default SyllabusUpload;
