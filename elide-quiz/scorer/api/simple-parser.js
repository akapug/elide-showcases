/**
 * Ultra-simple parser - no AI needed!
 * Accepts JSON or plain text format
 */

/**
 * Parse submission in JSON format
 * Expected format:
 * {
 *   "answers": { "1": "B", "2": "A,C,D", ... },
 *   "survey": {
 *     "tools": "web search, CLI help",
 *     "timeMinutes": 5,
 *     "strategy": "Used docs",
 *     "modelName": "GPT-5 Pro",
 *     "modelVersion": "2025-01-15",
 *     "temperature": 0.7,
 *     "maxTokens": 4096
 *   }
 * }
 */
function parseJSON(text) {
  try {
    const data = JSON.parse(text);
    return {
      answers: data.answers || {},
      metadata: data.survey || data.metadata || {}
    };
  } catch (e) {
    return null;
  }
}

/**
 * Parse submission in plain text format
 * Format:
 * 1. B
 * 2. A,C,D
 * ...
 * 500. D
 * 
 * S1. web search, CLI help
 * S2. 5
 * S3. Used docs
 * S4. GPT-5 Pro
 * S5. 2025-01-15
 * S6. 0.7
 * S7. 4096
 */
function parsePlainText(text) {
  const answers = {};
  const metadata = {};
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Answer format: "123. B" or "123) B" or "Q123: B"
    const answerMatch = trimmed.match(/^(?:Q)?(\d+)[\.\):\s]+([A-D,\s]+)/i);
    if (answerMatch) {
      const num = answerMatch[1];
      const answer = answerMatch[2].replace(/\s/g, '').toUpperCase();
      answers[num] = answer;
      continue;
    }
    
    // Survey format: "S1. answer" or "S1: answer"
    const surveyMatch = trimmed.match(/^S(\d+)[\.\:\s]+(.+)$/i);
    if (surveyMatch) {
      const surveyNum = surveyMatch[1];
      const value = surveyMatch[2].trim();
      
      switch (surveyNum) {
        case '1': metadata.tools = value; break;
        case '2': metadata.timeMinutes = parseFloat(value) || 0; break;
        case '3': metadata.strategy = value; break;
        case '4': metadata.modelName = value; break;
        case '5': metadata.modelVersion = value; break;
        case '6': metadata.temperature = parseFloat(value) || 0; break;
        case '7': metadata.maxTokens = parseInt(value) || 0; break;
      }
    }
  }
  
  return { answers, metadata };
}

/**
 * Main parser - tries JSON first, falls back to plain text
 */
export function parseSubmission(text) {
  // Try JSON first
  const jsonResult = parseJSON(text);
  if (jsonResult) {
    return jsonResult;
  }
  
  // Fall back to plain text
  return parsePlainText(text);
}

/**
 * Score answers against answer key
 */
export function scoreAnswers(userAnswers, answerKey) {
  let correct = 0;
  let incorrect = 0;
  let missing = 0;
  let totalPoints = 0;
  let earnedPoints = 0;
  
  const results = {};
  
  for (const [num, expected] of Object.entries(answerKey)) {
    const points = 1; // All questions worth 1 point now
    totalPoints += points;
    
    const userAnswer = userAnswers[num];
    
    if (!userAnswer) {
      missing++;
      results[num] = { correct: false, expected: expected.answer, got: null, points: 0 };
      continue;
    }
    
    // Normalize answers for comparison
    const normalizedUser = userAnswer.replace(/\s/g, '').toUpperCase();
    const normalizedExpected = expected.answer.replace(/\s/g, '').toUpperCase();
    
    if (normalizedUser === normalizedExpected) {
      correct++;
      earnedPoints += points;
      results[num] = { correct: true, expected: expected.answer, got: userAnswer, points };
    } else {
      incorrect++;
      results[num] = { correct: false, expected: expected.answer, got: userAnswer, points: 0 };
    }
  }
  
  return {
    correct,
    incorrect,
    missing,
    totalPoints,
    earnedPoints,
    percentage: totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0,
    results
  };
}

