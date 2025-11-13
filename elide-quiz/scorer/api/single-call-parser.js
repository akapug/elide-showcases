/**
 * Single AI Call Parser
 * 
 * Uses ONE AI call to:
 * 1. Parse the entire submission (extract answers from free-form text)
 * 2. Extract metadata (tools used, thinking time, research strategy, etc.)
 * 3. Score all answers against the answer key
 * 
 * This is much faster and cheaper than 500 individual AI calls.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const PARSER_MODEL = 'anthropic/claude-haiku-4.5'; // Fast and cheap for parsing

/**
 * Parse submission with a single AI call
 * @param {string} submissionText - Raw submission text from user/LLM
 * @param {object} answerKey - Answer key with correct answers
 * @returns {Promise<{answers: object, metadata: object, rawText: string}>}
 */
export async function parseSubmissionWithAI(submissionText, answerKey) {
  const totalQuestions = Object.keys(answerKey).length;
  const totalPoints = Object.values(answerKey).reduce((sum, q) => sum + (q.points || 1), 0);
  
  const prompt = `You are parsing a quiz submission for the Elide Expert Quiz (${totalQuestions} questions, ${totalPoints} points total).

TASK: Extract answers and metadata from the submission below.

ANSWER FORMATS TO RECOGNIZE:
- Multiple choice (single): "1. B" or "1) B" or "Question 1: B" → Extract "B"
- Multiple choice (multi): "2. A,C,D" or "2) A, C, D" → Extract "A,C,D" (no spaces)
- Short answer: "3. export default async function fetch(req)" → Extract the text after the number
- Natural language: "For question 4, I believe the answer is elide serve" → Extract "elide serve"

METADATA TO EXTRACT (if mentioned):
- Tools/APIs available (e.g., "I had access to codebase search and web search")
- Time spent thinking/researching (e.g., "I spent 5 minutes researching")
- Research strategy (e.g., "I used the CLI help docs and migration guide")
- Model name (if mentioned, e.g., "Claude Sonnet 4.5")
- Any other relevant context

OUTPUT FORMAT (JSON only, no markdown):
{
  "answers": {
    "1": "B",
    "2": "A,C,D",
    "3": "export default async function fetch(req: Request): Promise<Response>",
    ...
  },
  "metadata": {
    "toolsAvailable": "codebase search, web search, CLI help",
    "thinkingTime": "5 minutes",
    "researchStrategy": "Used CLI help docs and migration guide",
    "modelName": "Claude Sonnet 4.5",
    "otherNotes": "Any other relevant info"
  }
}

SUBMISSION TEXT:
${submissionText}

Parse the submission and return ONLY the JSON object (no markdown, no explanation):`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://elide.top',
        'X-Title': 'Elide Expert Quiz Parser',
      },
      body: JSON.stringify({
        model: PARSER_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 100000,
      }),
    });

    if (!response.ok) {
      console.error(`Parser API error: ${response.status} ${response.statusText}`);
      // Fallback to regex parsing
      return fallbackParse(submissionText);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
    }
    
    const parsed = JSON.parse(jsonText);
    
    return {
      answers: parsed.answers || {},
      metadata: parsed.metadata || {},
      rawText: submissionText
    };
    
  } catch (error) {
    console.error('AI parsing failed:', error.message);
    // Fallback to regex parsing
    return fallbackParse(submissionText);
  }
}

/**
 * Fallback regex-based parser (no AI)
 */
function fallbackParse(submissionText) {
  const answers = {};
  const lines = submissionText.split('\n');
  
  for (const line of lines) {
    // Match patterns like:
    // "1. B" or "1) B" or "Question 1: B" or "1 - B"
    const match = line.match(/^(?:Question\s+)?(\d+)[\.\)\:\-\s]+(.+)$/i);
    if (match) {
      const questionNum = match[1];
      let answer = match[2].trim();
      
      // Clean up answer
      answer = answer.replace(/^Answer:\s*/i, '');
      answer = answer.replace(/^\*\*Answer\*\*:?\s*/i, '');
      
      answers[questionNum] = answer;
    }
  }
  
  return {
    answers,
    metadata: {
      parsingMethod: 'regex-fallback',
      note: 'AI parsing failed, used regex fallback'
    },
    rawText: submissionText
  };
}

/**
 * Score parsed answers against answer key
 * @param {object} parsedAnswers - Answers extracted by AI
 * @param {object} answerKey - Correct answers
 * @returns {object} Scoring results
 */
export function scoreAnswers(parsedAnswers, answerKey) {
  const results = {
    correct: 0,
    incorrect: 0,
    missing: 0,
    earnedPoints: 0,
    totalPoints: 0,
    byTopic: {},
    details: []
  };

  // Calculate total points
  for (const [qNum, data] of Object.entries(answerKey)) {
    results.totalPoints += data.points || 1;
  }

  // Score each question
  for (const [qNum, data] of Object.entries(answerKey)) {
    const questionNum = parseInt(qNum);
    const userAnswer = parsedAnswers[qNum];
    const correctAnswer = data.answer;
    
    if (!userAnswer || userAnswer.trim() === '') {
      results.missing++;
      results.details.push({
        question: questionNum,
        userAnswer: '',
        correctAnswer: correctAnswer,
        isCorrect: false,
        points: 0,
        maxPoints: data.points || 1
      });
      continue;
    }

    // Check if answer is correct
    const isCorrect = compareAnswers(userAnswer, correctAnswer);
    const points = isCorrect ? (data.points || 1) : 0;
    
    if (isCorrect) {
      results.correct++;
      results.earnedPoints += points;
    } else {
      results.incorrect++;
    }

    // Track by topic
    const topic = data.topic || 'Other';
    if (!results.byTopic[topic]) {
      results.byTopic[topic] = { correct: 0, total: 0, points: 0, maxPoints: 0 };
    }
    results.byTopic[topic].total++;
    results.byTopic[topic].maxPoints += data.points || 1;
    if (isCorrect) {
      results.byTopic[topic].correct++;
      results.byTopic[topic].points += points;
    }

    results.details.push({
      question: questionNum,
      userAnswer: userAnswer,
      correctAnswer: correctAnswer,
      isCorrect: isCorrect,
      points: points,
      maxPoints: data.points || 1
    });
  }

  // Calculate percentage and grade
  results.percentage = results.totalPoints > 0 
    ? ((results.earnedPoints / results.totalPoints) * 100).toFixed(2)
    : '0.00';
  
  results.grade = getGrade(parseFloat(results.percentage));

  return results;
}

/**
 * Compare user answer with correct answer
 */
function compareAnswers(userAnswer, correctAnswer) {
  const normalized1 = normalizeAnswer(userAnswer);
  const normalized2 = normalizeAnswer(correctAnswer);
  
  // Exact match
  if (normalized1 === normalized2) {
    return true;
  }
  
  // For multiple choice, check if all letters match (order independent)
  if (/^[A-D,\s]+$/i.test(normalized1) && /^[A-D,\s]+$/i.test(normalized2)) {
    const letters1 = normalized1.replace(/[^A-D]/gi, '').toUpperCase().split('').sort().join('');
    const letters2 = normalized2.replace(/[^A-D]/gi, '').toUpperCase().split('').sort().join('');
    return letters1 === letters2;
  }
  
  // For short answers, check if key terms match
  const words1 = normalized1.toLowerCase().split(/\s+/);
  const words2 = normalized2.toLowerCase().split(/\s+/);
  
  // If correct answer has 3 or fewer words, all must be in user answer
  if (words2.length <= 3) {
    return words2.every(word => words1.includes(word));
  }
  
  // Otherwise, check if at least 70% of key words match
  const matchCount = words2.filter(word => words1.includes(word)).length;
  return matchCount / words2.length >= 0.7;
}

/**
 * Normalize answer for comparison
 */
function normalizeAnswer(answer) {
  return answer
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/["""'']/g, '"')
    .replace(/[–—]/g, '-');
}

/**
 * Get letter grade from percentage
 */
function getGrade(percentage) {
  if (percentage >= 95) return 'Master';
  if (percentage >= 85) return 'Expert';
  if (percentage >= 70) return 'Pass';
  return 'Fail';
}

