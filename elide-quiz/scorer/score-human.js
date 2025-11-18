/**
 * Elide Quiz Scorer - Human Edition (50 questions)
 */

// Answer key for human edition (50 questions, 75 points)
export const ANSWER_KEY_HUMAN = {
  // Runtime & Core (10)
  1: { answer: 'A,B,C', points: 1, topic: 'Runtime' },
  2: { answer: 'B', points: 1, topic: 'Runtime' },
  3: { answer: 'B', points: 1, topic: 'Runtime' },
  4: { answer: 'C', points: 1, topic: 'Runtime' },
  5: { answer: 'C', points: 1, topic: 'Runtime' },
  6: { answer: 'B', points: 2, topic: 'Runtime' },
  7: { answer: 'C', points: 2, topic: 'Runtime' },
  8: { answer: 'B', points: 3, topic: 'Runtime' },
  9: { answer: 'B', points: 3, topic: 'Runtime' },
  10: { answer: 'A', points: 1, topic: 'Runtime' },
  
  // CLI Commands (10)
  11: { answer: 'B', points: 1, topic: 'CLI' },
  12: { answer: 'B', points: 1, topic: 'CLI' },
  13: { answer: 'B', points: 1, topic: 'CLI' },
  14: { answer: 'B', points: 2, topic: 'CLI' },
  15: { answer: 'B', points: 2, topic: 'CLI' },
  16: { answer: 'B', points: 3, topic: 'CLI' },
  17: { answer: 'B', points: 3, topic: 'CLI' },
  18: { answer: 'B', points: 1, topic: 'CLI' },
  19: { answer: 'B', points: 2, topic: 'CLI' },
  20: { answer: 'C', points: 1, topic: 'CLI' },
  
  // HTTP & Servers (10)
  21: { answer: 'B', points: 1, topic: 'HTTP' },
  22: { answer: 'B', points: 1, topic: 'HTTP' },
  23: { answer: 'B', points: 1, topic: 'HTTP' },
  24: { 
    answer: 'export default { async fetch(request: Request): Promise<Response> { return new Response("Hello!"); } }',
    keywords: ['export default', 'fetch', 'Request', 'Response'],
    points: 2,
    topic: 'HTTP'
  },
  25: { 
    answer: 'Response.json({ key: "value" })',
    keywords: ['Response.json', 'json'],
    points: 2,
    topic: 'HTTP'
  },
  26: { answer: 'B', points: 1, topic: 'HTTP' },
  27: { answer: 'A', points: 1, topic: 'HTTP' },
  28: { answer: 'B', points: 1, topic: 'HTTP' },
  29: { answer: 'A', points: 1, topic: 'HTTP' },
  30: { 
    answer: 'elide run --wsgi app.py',
    keywords: ['elide', 'wsgi', 'app.py'],
    points: 2,
    topic: 'HTTP'
  },
  
  // Projects & Dependencies (5)
  31: { answer: 'B', points: 1, topic: 'Projects' },
  32: { answer: 'C', points: 1, topic: 'Projects' },
  33: { answer: 'B', points: 1, topic: 'Projects' },
  34: { 
    answer: 'dependencies { npm { packages { "react@18" } } }',
    keywords: ['dependencies', 'npm', 'packages', 'react@18'],
    points: 2,
    topic: 'Projects'
  },
  35: { answer: 'B', points: 1, topic: 'Projects' },
  
  // Polyglot (5)
  36: { answer: 'C', points: 1, topic: 'Polyglot' },
  37: { answer: 'B', points: 1, topic: 'Polyglot' },
  38: { 
    answer: 'import math from "./math.py"',
    keywords: ['import', 'math', '.py'],
    points: 2,
    topic: 'Polyglot'
  },
  39: { answer: 'B', points: 2, topic: 'Polyglot' },
  40: { answer: 'A,B,C,D', points: 1, topic: 'Polyglot' },
  
  // Testing & Build (5)
  41: { answer: 'B', points: 1, topic: 'Testing' },
  42: { answer: 'B', points: 1, topic: 'Testing' },
  43: { answer: 'A', points: 3, topic: 'Testing' },
  44: { answer: 'C', points: 1, topic: 'Testing' },
  45: { answer: 'A', points: 1, topic: 'Testing' },
  
  // Beta11 Features (3)
  46: { answer: 'A', points: 1, topic: 'Beta11' },
  47: { answer: 'C', points: 1, topic: 'Beta11' },
  48: { 
    answer: 'No shims needed, faster startup, lower memory overhead, native performance',
    keywords: ['shim', 'performance', 'memory', 'native', 'faster'],
    points: 2,
    topic: 'Beta11'
  },
  
  // Advanced Topics (2)
  49: { answer: 'C', points: 1, topic: 'Advanced' },
  50: { answer: 'B', points: 1, topic: 'Advanced' },
};

// Fuzzy matching for short answer questions
function fuzzyMatch(userAnswer, correctAnswer, keywords) {
  if (!userAnswer) return false;
  
  const normalized = userAnswer.toLowerCase().trim();
  
  // If keywords provided, check if most are present
  if (keywords && keywords.length > 0) {
    const matchedKeywords = keywords.filter(kw => 
      normalized.includes(kw.toLowerCase())
    );
    return matchedKeywords.length >= Math.ceil(keywords.length * 0.6); // 60% match
  }
  
  // Otherwise, check for exact match or high similarity
  const correctNormalized = correctAnswer.toLowerCase().trim();
  if (normalized === correctNormalized) return true;
  
  // Check if user answer contains most of the correct answer
  const correctWords = correctNormalized.split(/\s+/);
  const matchedWords = correctWords.filter(word => normalized.includes(word));
  return matchedWords.length >= Math.ceil(correctWords.length * 0.7); // 70% match
}

// Score user answers
export function scoreAnswersHuman(userAnswers) {
  const results = {
    totalQuestions: 50,
    totalPoints: 75,
    points: 0,
    correct: 0,
    incorrect: 0,
    missing: 0,
    percentage: 0,
    grade: 'Fail',
    byTopic: {}
  };
  
  for (let i = 1; i <= 50; i++) {
    const key = ANSWER_KEY_HUMAN[i];
    if (!key) continue;
    
    const userAnswer = userAnswers[i];
    const topic = key.topic;
    
    // Initialize topic stats
    if (!results.byTopic[topic]) {
      results.byTopic[topic] = { correct: 0, total: 0, points: 0, maxPoints: 0 };
    }
    
    results.byTopic[topic].total++;
    results.byTopic[topic].maxPoints += key.points;
    
    if (!userAnswer) {
      results.missing++;
      continue;
    }
    
    // Check answer
    let isCorrect = false;
    
    if (key.keywords) {
      // Short answer with fuzzy matching
      isCorrect = fuzzyMatch(userAnswer, key.answer, key.keywords);
    } else {
      // Multiple choice/select - normalize and compare
      const normalizedUser = userAnswer.toString().toUpperCase().replace(/\s/g, '');
      const normalizedCorrect = key.answer.toString().toUpperCase().replace(/\s/g, '');
      isCorrect = normalizedUser === normalizedCorrect;
    }
    
    if (isCorrect) {
      results.correct++;
      results.points += key.points;
      results.byTopic[topic].correct++;
      results.byTopic[topic].points += key.points;
    } else {
      results.incorrect++;
    }
  }
  
  // Calculate percentage and grade
  results.percentage = (results.points / results.totalPoints) * 100;
  
  if (results.percentage >= 95) {
    results.grade = 'Master';
  } else if (results.percentage >= 85) {
    results.grade = 'Expert';
  } else if (results.percentage >= 70) {
    results.grade = 'Pass';
  } else {
    results.grade = 'Fail';
  }
  
  return results;
}

