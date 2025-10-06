const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = 'gemini-1.5-flash';
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  // Extract topics from syllabus text using Gemini AI
  async extractTopics(syllabusText) {
    try {
      const prompt = `Analyze this syllabus and extract all topics with their subtopics.
Return ONLY a valid JSON array with this structure:
[
  {
    "name": "Topic Name",
    "subtopics": ["Subtopic 1", "Subtopic 2"],
    "priority": "high",
    "estimatedHours": 4
  }
]

Guidelines:
- Priority: "high" for core concepts, "medium" for important, "low" for additional
- estimatedHours: Based on topic complexity (2-8 hours)
- Extract maximum 30 topics
- Return ONLY the JSON array, no markdown, no explanations

Syllabus:
${syllabusText.slice(0, 3000)}`;

      const response = await axios.post(
        `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract text from Gemini response
      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      console.log('🤖 Gemini raw response:', generatedText.slice(0, 200));

      // Parse JSON from response (handle markdown code blocks)
      let jsonText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const topics = JSON.parse(jsonText);

      // Validate structure
      if (!Array.isArray(topics)) {
        throw new Error('Invalid response format');
      }

      console.log(`✅ Gemini extracted ${topics.length} topics`);
      return topics;

    } catch (err) {
      console.error('AI Topic Extraction Error:', err.response?.data || err.message);
      throw new Error('Failed to extract topics with AI');
    }
  }

  // Generate study roadmap using Gemini AI
  async generateRoadmap(topics, examDate, startDate = new Date()) {
    try {
      const daysAvailable = Math.ceil((new Date(examDate) - startDate) / (1000 * 60 * 60 * 24));
      
      const prompt = `Create a day-by-day study roadmap for exam preparation.

Topics to cover:
${JSON.stringify(topics, null, 2)}

Available days: ${daysAvailable}
Exam date: ${examDate}

Return ONLY a valid JSON array with this structure:
[
  {
    "day": 1,
    "date": "2025-10-04",
    "topics": ["Topic 1", "Topic 2"],
    "subtopics": ["Subtopic 1", "Subtopic 2"],
    "duration": "4-5 hours",
    "focus": "Understanding fundamentals",
    "priority": "high",
    "completed": false
  }
]

Guidelines:
- Distribute topics across ${daysAvailable - 7} study days
- Reserve last 7 days for revision
- High priority topics first
- 2-3 topics per day maximum
- Balance workload evenly
- Return ONLY the JSON array, no markdown`;

      const response = await axios.post(
        `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      // Parse JSON
      let jsonText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const roadmapDays = JSON.parse(jsonText);

      console.log(`✅ Gemini generated ${roadmapDays.length} day roadmap`);
      return roadmapDays;

    } catch (err) {
      console.error('AI Roadmap Generation Error:', err.response?.data || err.message);
      throw new Error('Failed to generate roadmap with AI');
    }
  }

  // Generate MCQ questions using Gemini AI
  async generateMCQs(topics, count = 10) {
    try {
      const topicNames = topics.map(t => t.name || t).join(', ');
      
      const prompt = `Generate ${count} multiple choice questions (MCQs) covering these topics: ${topicNames}

Return ONLY a valid JSON array with this structure:
[
  {
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 2,
    "explanation": "Brief explanation",
    "difficulty": "medium",
    "topic": "Topic Name"
  }
]

Guidelines:
- Mix of easy, medium, hard difficulty
- 4 options per question
- correct: index of correct answer (0-3)
- Return ONLY the JSON array, no markdown`;

      const response = await axios.post(
        `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      // Parse JSON
      let jsonText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const mcqs = JSON.parse(jsonText);

      console.log(`✅ Gemini generated ${mcqs.length} MCQs`);
      return mcqs;

    } catch (err) {
      console.error('AI MCQ Generation Error:', err.response?.data || err.message);
      throw new Error('Failed to generate MCQs with AI');
    }
  }
// Add to existing aiService class

async generateWithPrompt(prompt) {
  try {
    if (this.provider === 'openai') {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 3000
      });
      return response.choices[0].message.content;
    } else {
      // Gemini
      const result = await this.gemini.generateContent(prompt);
      return result.response.text();
    }
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

  // AI Mentor - Answer questions using Gemini
  async answerQuestion(question, context = '') {
    try {
      const prompt = `You are a helpful study mentor. Answer this question clearly and concisely.

${context ? `Context: ${context}` : ''}

Question: ${question}

Provide a helpful answer in 2-3 paragraphs.`;

      const response = await axios.post(
        `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const answer = response.data.candidates[0].content.parts[0].text;

      console.log('✅ Gemini answered question');
      return answer;

    } catch (err) {
      console.error('AI Question Error:', err.response?.data || err.message);
      throw new Error('Failed to answer question with AI');
    }
  }
}

module.exports = new AIService();