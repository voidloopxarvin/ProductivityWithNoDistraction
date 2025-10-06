const aiService = require('./aiservice');

class FlashcardGenerator {
  async generateFlashcards(topics, pdfContent, count = 20) {
    try {
      console.log('🎴 Generating flashcards...');
      console.log('Topics count:', topics.length);
      console.log('Content length:', pdfContent?.length || 0);

      // Use PDF content if available, otherwise use topics
      const contentSnippet = pdfContent 
        ? pdfContent.substring(0, 5000) 
        : topics.join('. ');

      const prompt = `You are an expert educator creating study flashcards for students.

CONTENT:
${contentSnippet}

TOPICS TO COVER:
${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Generate ${count} high-quality flashcard Q&A pairs.

REQUIREMENTS:
1. Questions should be CLEAR and test KEY CONCEPTS
2. Answers should be COMPLETE (3-5 sentences)
3. Cover definitions, concepts, processes, and comparisons
4. Mix difficulty: easy (40%), medium (40%), hard (20%)
5. Use "What", "Why", "How", "Define", "Explain" formats

GOOD EXAMPLE:
{
  "question": "What is database normalization and why is it important?",
  "answer": "Database normalization is the process of organizing data to reduce redundancy and improve data integrity. It divides larger tables into smaller ones and defines relationships between them. This is important because it eliminates data anomalies, ensures consistency, and makes databases more efficient and maintainable.",
  "category": "Database Design",
  "difficulty": "medium"
}

Output MUST be a valid JSON array with ${count} flashcards.
Format: [{"question":"...","answer":"...","category":"...","difficulty":"easy|medium|hard"}]

Generate NOW:`;

      const response = await aiService.generateWithPrompt(prompt);

      let flashcards = [];
      try {
        // Clean response - FIX APPLIED HERE
        let cleanedResponse = response.trim();
        cleanedResponse = cleanedResponse.replace(/```json\n?/gi, '');
        cleanedResponse = cleanedResponse.replace(/```\n?/gi, '');

        // Extract JSON array
        const jsonStart = cleanedResponse.indexOf('[');
        const jsonEnd = cleanedResponse.lastIndexOf(']');

        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
          flashcards = JSON.parse(cleanedResponse);

          // Validate and filter
          flashcards = flashcards.filter(card =>
            card.question &&
            card.question.length > 10 &&
            card.answer &&
            card.answer.length > 30 &&
            card.category
          );

          console.log(`✅ AI generated ${flashcards.length} flashcards`);
        }
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError.message);
        console.log('Falling back to template generation...');
        flashcards = this.generateFallbackFlashcards(topics, count);
      }

      // Ensure minimum count
      if (flashcards.length < count) {
        console.log(`⚠️ Only ${flashcards.length}/${count} cards. Generating more...`);
        const needed = count - flashcards.length;
        const fallback = this.generateFallbackFlashcards(topics, needed);
        flashcards = [...flashcards, ...fallback];
      }

      return flashcards.slice(0, count);

    } catch (error) {
      console.error('❌ Flashcard generation error:', error);
      return this.generateFallbackFlashcards(topics, count);
    }
  }

  generateFallbackFlashcards(topics, count) {
    console.log('⚠️ Using fallback flashcard templates');
    const flashcards = [];

    const templates = [
      {
        q: (topic) => `What are the main concepts of ${topic}?`,
        a: (topic) => `${topic} encompasses several important concepts that form the foundation of understanding. It includes fundamental principles, core components, and practical applications. Understanding these concepts is crucial for mastering ${topic} and applying it effectively in real-world scenarios. Each concept builds upon the others to create a comprehensive knowledge framework.`,
        difficulty: 'medium'
      },
      {
        q: (topic) => `Define ${topic} and explain its significance.`,
        a: (topic) => `${topic} is a fundamental concept in this field of study. Its significance lies in providing structure and methodology for solving complex problems. By understanding ${topic}, one can develop better solutions and make informed decisions. This concept serves as a building block for more advanced topics.`,
        difficulty: 'easy'
      },
      {
        q: (topic) => `How is ${topic} applied in practice?`,
        a: (topic) => `In practice, ${topic} is implemented through systematic approaches and proven methodologies. The application involves careful planning, step-by-step execution, and continuous evaluation. Real-world implementations demonstrate how ${topic} solves practical problems. Success depends on understanding both theoretical foundations and practical considerations.`,
        difficulty: 'hard'
      },
      {
        q: (topic) => `What are the key benefits of understanding ${topic}?`,
        a: (topic) => `Understanding ${topic} provides numerous benefits including improved problem-solving capabilities, better decision-making skills, and enhanced efficiency. It enables professionals to tackle complex challenges with confidence. Moreover, this knowledge facilitates communication with peers and contributes to overall expertise in the field.`,
        difficulty: 'medium'
      },
      {
        q: (topic) => `Explain the relationship between ${topic} and related concepts.`,
        a: (topic) => `${topic} is interconnected with various related concepts forming a comprehensive knowledge network. These relationships are crucial for deep understanding and effective application. Each connection enhances comprehension and reveals new insights. Grasping these relationships enables holistic thinking and innovative problem-solving approaches.`,
        difficulty: 'medium'
      }
    ];

    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length];
      const template = templates[i % templates.length];

      flashcards.push({
        question: template.q(topic),
        answer: template.a(topic),
        category: topic,
        difficulty: template.difficulty
      });
    }

    return flashcards;
  }
}

module.exports = new FlashcardGenerator();