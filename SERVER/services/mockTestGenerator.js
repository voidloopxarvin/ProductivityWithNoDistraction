const aiService = require('./aiservice');

class MockTestGenerator {
  
  async generateMockTest(topics, count = 10, difficulty = 'mixed', pdfContent = null) {
    try {
      console.log('🎯 Generating', count, 'MCQs for:', topics);

      const prompt = `You are an expert exam question creator. Generate ${count} challenging multiple-choice questions.

${pdfContent ? `BASE YOUR QUESTIONS ON THIS CONTENT:\n${pdfContent.substring(0, 4000)}\n\n` : ''}

TOPICS TO COVER:
${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

CRITICAL RULES:
1. Each question MUST have EXACTLY 4 options
2. ALL 4 options must be plausible - NO obvious wrong answers
3. NEVER use phrases like "correct answer", "wrong answer", "all of the above", "none of the above"
4. Options should be similar in length and structure
5. Test DEEP UNDERSTANDING, not memorization
6. Make distractors (wrong answers) believable and realistic
7. Each option should sound professional and academic

DIFFICULTY MIX:
- 30% Easy (basic concepts, definitions)
- 50% Medium (application, analysis)
- 20% Hard (synthesis, evaluation)

EXAMPLE OF GOOD QUESTION:
{
  "question": "In a relational database, what is the primary advantage of using foreign keys?",
  "options": [
    "They automatically create indexes on referenced columns",
    "They enforce referential integrity between related tables",
    "They improve query performance by caching relationships",
    "They reduce storage space by eliminating duplicate data"
  ],
  "correctAnswer": 1,
  "explanation": "Foreign keys enforce referential integrity, ensuring that relationships between tables remain consistent. While they may have secondary effects on performance, their primary purpose is maintaining data consistency.",
  "difficulty": "medium",
  "topic": "Database Design"
}

OUTPUT FORMAT (ONLY JSON, NO MARKDOWN):
[
  {
    "question": "Clear, specific question?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0,
    "explanation": "Brief but clear explanation",
    "difficulty": "easy/medium/hard",
    "topic": "Topic name"
  }
]

Generate ${count} questions NOW. Make them challenging and realistic:`;

      const response = await aiService.generateWithPrompt(prompt);
      
      let questions = [];
      try {
        let cleanedResponse = response.trim();
        
        // Remove markdown code blocks
        cleanedResponse = cleanedResponse.replace(/```json\n?/gi, '');
        cleanedResponse = cleanedResponse.replace(/```\n?/gi, '');
        cleanedResponse = cleanedResponse.trim();
        
        // Extract JSON array
        const jsonStart = cleanedResponse.indexOf('[');
        const jsonEnd = cleanedResponse.lastIndexOf(']');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        }
        
        questions = JSON.parse(cleanedResponse);
        
        // STRICT QUALITY VALIDATION
        questions = questions.filter(q => {
          // Basic structure check
          if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
            console.log('❌ Invalid structure:', q.question?.substring(0, 30));
            return false;
          }

          // Check for obvious bad patterns
          const combinedText = q.question + ' ' + q.options.join(' ');
          const badPatterns = [
            /correct answer/i,
            /wrong answer/i,
            /incorrect/i,
            /option [a-d]/i,
            /all of the above/i,
            /none of the above/i,
            /\bcorrect\b/i
          ];

          for (const pattern of badPatterns) {
            if (pattern.test(combinedText)) {
              console.log('❌ Contains bad pattern:', pattern, q.question.substring(0, 30));
              return false;
            }
          }

          // Ensure minimum quality
          const valid = 
            q.question.length > 30 &&
            q.options.every(opt => opt && opt.length > 10 && opt.length < 200) &&
            typeof q.correctAnswer === 'number' &&
            q.correctAnswer >= 0 && 
            q.correctAnswer <= 3 &&
            q.explanation &&
            q.explanation.length > 30;
          
          if (!valid) {
            console.log('❌ Quality check failed:', q.question?.substring(0, 30));
          }
          
          return valid;
        });

        console.log(`✅ Generated ${questions.length} high-quality questions`);

      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError.message);
        console.log('Raw response:', response.substring(0, 500));
        questions = [];
      }

      // If we don't have enough quality questions, generate more
      if (questions.length < count) {
        const additionalNeeded = count - questions.length;
        console.log(`⚠️ Need ${additionalNeeded} more questions. Generating fallback...`);
        const fallback = this.generateImprovedFallbackQuestions(topics, additionalNeeded);
        questions = [...questions, ...fallback];
      }

      return questions.slice(0, count);

    } catch (error) {
      console.error('❌ Mock test generation error:', error);
      return this.generateImprovedFallbackQuestions(topics, count);
    }
  }

  generateImprovedFallbackQuestions(topics, count) {
    console.log('⚠️ Using improved fallback questions');
    
    const questions = [];
    const difficulties = ['easy', 'medium', 'hard'];
    
    // Better templates with realistic distractors
    const questionTemplates = [
      {
        question: (topic) => `What is the most significant benefit of implementing ${topic} in a production environment?`,
        options: (topic) => [
          `Enhanced system performance through optimized resource allocation`,
          `Reduced operational costs via automated management`,
          `Improved scalability and flexibility in handling varying workloads`,
          `Simplified maintenance through standardized procedures`
        ],
        correctAnswer: 2
      },
      {
        question: (topic) => `When designing a system that incorporates ${topic}, which factor should be prioritized?`,
        options: (topic) => [
          `Initial development speed to meet tight deadlines`,
          `Long-term maintainability and extensibility`,
          `Minimizing hardware resource requirements`,
          `Maximum feature count for competitive advantage`
        ],
        correctAnswer: 1
      },
      {
        question: (topic) => `In the context of ${topic}, what distinguishes a robust implementation from a basic one?`,
        options: (topic) => [
          `Comprehensive error handling and recovery mechanisms`,
          `Use of the latest technology stack and frameworks`,
          `Extensive documentation and inline comments`,
          `Support for multiple programming paradigms`
        ],
        correctAnswer: 0
      },
      {
        question: (topic) => `Which challenge is most commonly encountered when working with ${topic}?`,
        options: (topic) => [
          `Lack of available third-party libraries and tools`,
          `Difficulty in balancing performance with flexibility`,
          `Limited community support and documentation`,
          `Incompatibility with existing legacy systems`
        ],
        correctAnswer: 1
      },
      {
        question: (topic) => `What principle should guide decision-making when implementing ${topic}?`,
        options: (topic) => [
          `Following industry trends and popular practices`,
          `Prioritizing code simplicity over feature completeness`,
          `Aligning technical choices with business requirements`,
          `Maximizing code reusability across all components`
        ],
        correctAnswer: 2
      }
    ];
    
    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length];
      const template = questionTemplates[i % questionTemplates.length];
      const difficulty = difficulties[i % 3];
      
      questions.push({
        question: template.question(topic),
        options: template.options(topic),
        correctAnswer: template.correctAnswer,
        explanation: `This question assesses understanding of ${topic} principles. The correct option represents best practices in the field, while other options represent common misconceptions or less optimal approaches.`,
        difficulty: difficulty,
        topic: topic
      });
    }

    return questions;
  }

  analyzeTestResults(answers, mockTest) {
    let correctCount = 0;
    const topicStats = {};

    answers.forEach(answer => {
      const question = mockTest.questions[answer.questionIndex];
      const topic = question.topic || 'General';
      
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      
      topicStats[topic].total++;
      
      if (answer.isCorrect) {
        correctCount++;
        topicStats[topic].correct++;
      }
    });

    const weakTopics = Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        correctCount: stats.correct,
        totalCount: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100)
      }))
      .filter(t => t.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage);

    return {
      score: correctCount,
      totalQuestions: answers.length,
      percentage: Math.round((correctCount / answers.length) * 100),
      weakTopics,
      topicStats: Object.entries(topicStats).map(([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100)
      }))
    };
  }
}

module.exports = new MockTestGenerator();