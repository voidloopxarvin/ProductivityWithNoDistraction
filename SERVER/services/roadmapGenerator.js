const Roadmap = require('../models/Roadmap');
const aiService = require('./aiservice');

class RoadmapGenerator {
  
  async generateRoadmap(userId, syllabusId, topics, examDate, title = 'My Study Roadmap') {
    try {
      console.log('📊 Generating roadmap...');
      console.log('Topics:', topics.length);
      console.log('Exam Date:', examDate);
      
      const startDate = new Date();
      const examDateTime = new Date(examDate);
      
      // Calculate days available
      const daysAvailable = Math.ceil((examDateTime - startDate) / (1000 * 60 * 60 * 24));
      
      console.log('Days available:', daysAvailable);
      
      if (daysAvailable < 7) {
        throw new Error('Not enough time! Need at least 7 days for preparation.');
      }

      let roadmapDays = [];
      
      // Try AI generation first
      try {
        console.log('🤖 Attempting AI roadmap generation...');
        roadmapDays = await aiService.generateRoadmap(topics, examDate, startDate);
        console.log('✅ AI roadmap generated successfully');
      } catch (aiError) {
        console.log('⚠️ AI generation failed:', aiError.message);
        console.log('📋 Using fallback basic roadmap...');
        roadmapDays = this.generateBasicRoadmap(topics, examDate, startDate);
      }

      const totalDays = roadmapDays.length;

      // Create roadmap document
      const roadmap = await Roadmap.create({
        userId,
        syllabusId,
        title,
        examDate: examDateTime,
        startDate,
        totalDays,
        days: roadmapDays,
        progress: {
          completed: 0,
          total: totalDays,
          percentage: 0
        },
        status: 'active'
      });

      console.log('✅ Roadmap created with', totalDays, 'days');

      return roadmap;
    } catch (error) {
      console.error('❌ Roadmap Generation Error:', error.message);
      throw error;
    }
  }

  // Fallback: Generate basic roadmap without AI
  generateBasicRoadmap(topics, examDate, startDate = new Date()) {
    const start = new Date(startDate);
    const exam = new Date(examDate);
    const totalDays = Math.ceil((exam - start) / (1000 * 60 * 60 * 24));
    
    console.log('📋 Generating basic roadmap for', totalDays, 'days');
    
    // Reserve last 7 days for revision
    const studyDays = Math.max(totalDays - 7, Math.min(totalDays, 10));
    
    const roadmapDays = [];
    const topicsPerDay = Math.ceil(topics.length / studyDays);

    console.log('Topics per day:', topicsPerDay);

    let topicIndex = 0;

    // Study days
    for (let day = 1; day <= studyDays; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + day - 1);

      const dayTopics = topics.slice(topicIndex, topicIndex + topicsPerDay);
      topicIndex += topicsPerDay;

      const topicNames = dayTopics.map(t => t.name || t);
      const subtopics = dayTopics.flatMap(t => t.subtopics || []);

      roadmapDays.push({
        day,
        date: currentDate,
        topics: topicNames,
        subtopics: subtopics,
        duration: '4-5 hours',
        focus: topicNames[0] || 'Study',
        priority: day <= studyDays / 3 ? 'high' : day <= (studyDays * 2) / 3 ? 'medium' : 'low',
        completed: false
      });
    }

    // Revision days
    const revisionStart = studyDays + 1;
    const revisionEnd = totalDays;

    for (let day = revisionStart; day <= revisionEnd; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + day - 1);

      roadmapDays.push({
        day,
        date: currentDate,
        topics: ['Revision & Practice'],
        subtopics: ['Review all topics', 'Practice problems', 'Mock tests'],
        duration: '4-6 hours',
        focus: 'Revision & Practice',
        priority: 'high',
        completed: false
      });
    }

    console.log('✅ Basic roadmap generated:', roadmapDays.length, 'days');

    return roadmapDays;
  }
}

module.exports = new RoadmapGenerator();
