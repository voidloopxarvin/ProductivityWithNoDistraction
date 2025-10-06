const fs = require('fs');
const pdfParse = require('pdf-parse');

class PDFProcessor {
  // Extract text from PDF
  async extractText(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } catch (err) {
      throw new Error('Failed to parse PDF: ' + err.message);
    }
  }

  extractTopics(text) {
    console.log('📋 Starting enhanced topic extraction...');
    console.log('Text length:', text.length);
    console.log('First 500 chars:', text.slice(0, 500));

    const topics = [];
    const seenTopics = new Set();

    // Strategy 1: Split by "Module" keyword - Extract FULL module content
    const modulePattern = /Module\s+\d+:\s*([^\[]+)/gi;
    let match;

    while ((match = modulePattern.exec(text)) !== null) {
      const moduleContent = match[1].trim();

      // Split by sentences to get subtopics
      const sentences = moduleContent.split(/[.;]/);

      // Extract main topic (first sentence)
      const mainTopic = sentences[0]
        .replace(/\d+\s*hrs?/gi, '')
        .replace(/\(CO\d+\)/gi, '')
        .trim();

      // Extract subtopics (remaining sentences)
      const subtopics = sentences
        .slice(1)
        .map(s => s.trim())
        .filter(s => s.length > 10 && s.length < 150)
        .map(s => s.replace(/\d+\s*hrs?/gi, '').replace(/\(CO\d+\)/gi, '').trim());

      if (mainTopic.length > 5 && !seenTopics.has(mainTopic.toLowerCase())) {
        seenTopics.add(mainTopic.toLowerCase());
        const hours = this.extractHours(match[0]) || 4;

        topics.push({
          name: mainTopic,
          subtopics: subtopics.slice(0, 10),
          priority: topics.length < 2 ? 'high' : 'medium',
          estimatedHours: hours
        });

        console.log(`✅ ${mainTopic}`);
        console.log(`   Subtopics: ${subtopics.length}`);
        console.log(`   Hours: ${hours}`);
      }
    }

    console.log(`\n📚 Total topics extracted: ${topics.length}\n`);

    // Fallback
    if (topics.length === 0) {
      console.log('⚠️ Fallback extraction...');
      return this.createFallbackTopics(text);
    }

    return topics;
  }

  // Extract subtopics from module text
  extractSubtopics(moduleText) {
    const subtopics = [];

    // Look for comma-separated items
    const parts = moduleText.split(/[,;]/);

    parts.forEach(part => {
      const cleaned = part
        .trim()
        .replace(/\d+\s*hrs?/gi, '')
        .replace(/\(CO\d+\)/gi, '')
        .replace(/and their complexity analysis/gi, '')
        .trim();

      if (cleaned.length > 10 && cleaned.length < 80) {
        subtopics.push(cleaned);
      }
    });

    return subtopics.slice(0, 8); // Max 8 subtopics per topic
  }

  // Extract hours from text
  extractHours(text) {
    const hourMatch = text.match(/(\d+)\s*hrs?/i);
    return hourMatch ? parseInt(hourMatch[1]) : null;
  }

  // Check for topic keywords
  containsTopicKeywords(text) {
    const keywords = [
      'algorithm', 'data structure', 'array', 'linked list', 'tree', 'graph',
      'stack', 'queue', 'sorting', 'searching', 'hashing', 'recursion',
      'dynamic programming', 'greedy', 'database', 'sql', 'complexity',
      'analysis', 'traversal', 'insertion', 'deletion', 'heap', 'priority',
      'terminologies', 'operations', 'adt', 'applications'
    ];

    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  // Create fallback topics from text
  createFallbackTopics(text) {
    const topics = [];

    // Extract sentences with key terms
    const sentences = text.match(/[^.;]+[.;]/g) || [];

    sentences.forEach(sentence => {
      if (this.containsTopicKeywords(sentence) && topics.length < 10) {
        const cleaned = sentence
          .trim()
          .replace(/\d+\s*hrs?/gi, '')
          .replace(/\(CO\d+\)/gi, '')
          .slice(0, 100);

        if (cleaned.length > 15) {
          topics.push({
            name: cleaned,
            subtopics: [],
            priority: 'medium',
            estimatedHours: 3
          });
        }
      }
    });

    // If still nothing, just split text into chunks
    if (topics.length === 0) {
      const words = text.split(' ');
      const chunkSize = 50;

      for (let i = 0; i < Math.min(5, Math.floor(words.length / chunkSize)); i++) {
        const chunk = words.slice(i * chunkSize, (i + 1) * chunkSize).join(' ');
        topics.push({
          name: `Study Section ${i + 1}`,
          subtopics: [chunk.slice(0, 100)],
          priority: 'medium',
          estimatedHours: 4
        });
      }
    }

    return topics;
  }

  // Clean text
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = new PDFProcessor();
