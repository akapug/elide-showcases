/**
 * AI-Powered Answer Scoring using OpenRouter
 *
 * Uses google/gemini-2.0-flash-exp:free as primary model
 * Falls back to anthropic/claude-haiku-4.5 if rate limited
 * Falls back to x-ai/grok-4-fast if both fail
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PRIMARY_MODEL = 'google/gemini-2.0-flash-exp:free';
const BACKUP_MODEL = 'anthropic/claude-haiku-4.5';
const TERTIARY_MODEL = 'x-ai/grok-4-fast';

/**
 * Score a single answer using AI
 * @param {number} questionNum - Question number
 * @param {string} userAnswer - User's answer (may be natural language)
 * @param {string} correctAnswer - Correct answer from answer key
 * @param {string} explanation - Explanation for the correct answer
 * @param {string} questionType - 'multiple-choice' or 'short-answer'
 * @returns {Promise<{isCorrect: boolean, extractedAnswer: string, confidence: number}>}
 */
export async function scoreAnswerWithAI(questionNum, userAnswer, correctAnswer, explanation, questionType = 'multiple-choice') {
  if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not set, falling back to exact match');
    return fallbackScoring(userAnswer, correctAnswer);
  }

  console.log(`[Q${questionNum}] Scoring with AI: "${userAnswer.substring(0, 50)}..." vs "${correctAnswer}"`);
  const prompt = buildScoringPrompt(questionNum, userAnswer, correctAnswer, explanation, questionType);

  try {
    // Try primary model first
    console.log(`[Q${questionNum}] Calling ${PRIMARY_MODEL}...`);
    const result = await callOpenRouter(prompt, PRIMARY_MODEL);
    console.log(`[Q${questionNum}] AI result: ${result.isCorrect ? '✓' : '✗'} (extracted: "${result.extractedAnswer}")`);
    return result;
  } catch (error) {
    console.error(`[Q${questionNum}] Primary model error:`, error.message);
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      console.log(`[Q${questionNum}] Rate limited on ${PRIMARY_MODEL}, trying ${BACKUP_MODEL}`);
      try {
        const result = await callOpenRouter(prompt, BACKUP_MODEL);
        console.log(`[Q${questionNum}] Backup AI result: ${result.isCorrect ? '✓' : '✗'}`);
        return result;
      } catch (backupError) {
        console.error(`[Q${questionNum}] Backup model error:`, backupError.message);
        if (backupError.message.includes('rate limit') || backupError.message.includes('429')) {
          console.log(`[Q${questionNum}] Rate limited on ${BACKUP_MODEL}, trying ${TERTIARY_MODEL}`);
          try {
            const result = await callOpenRouter(prompt, TERTIARY_MODEL);
            console.log(`[Q${questionNum}] Tertiary AI result: ${result.isCorrect ? '✓' : '✗'}`);
            return result;
          } catch (tertiaryError) {
            console.error(`[Q${questionNum}] All models failed, falling back to exact match:`, tertiaryError.message);
            return fallbackScoring(userAnswer, correctAnswer);
          }
        } else {
          console.error(`[Q${questionNum}] Backup failed, falling back to exact match:`, backupError.message);
          return fallbackScoring(userAnswer, correctAnswer);
        }
      }
    } else {
      console.error(`[Q${questionNum}] AI scoring failed, falling back to exact match:`, error.message);
      return fallbackScoring(userAnswer, correctAnswer);
    }
  }
}

/**
 * Build the scoring prompt for the AI
 */
function buildScoringPrompt(questionNum, userAnswer, correctAnswer, explanation, questionType) {
  return `You are scoring a quiz answer. Extract the answer from the user's response and determine if it matches the correct answer.

Question #${questionNum}
Question Type: ${questionType}
Correct Answer: ${correctAnswer}
Explanation: ${explanation}

User's Response:
${userAnswer}

Instructions:
1. Extract the actual answer from the user's response (ignore preamble, explanations, etc.)
2. For multiple choice: Extract just the letter(s) (A, B, C, D) or comma-separated letters (A,B,C)
3. For short answer: Extract the key answer phrase
4. Compare the extracted answer to the correct answer
5. For multiple choice with multiple answers, order doesn't matter (A,B,C = C,B,A)
6. Be lenient with formatting but strict with content

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "extractedAnswer": "the answer you extracted from user's response",
  "isCorrect": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(prompt, model) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://elide.top',
      'X-Title': 'Elide Expert Quiz'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent scoring
      max_tokens: 200
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Parse JSON response (handle markdown code blocks if present)
  let jsonStr = content;
  if (content.startsWith('```')) {
    jsonStr = content.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
  }
  
  try {
    const result = JSON.parse(jsonStr);
    return {
      isCorrect: result.isCorrect,
      extractedAnswer: result.extractedAnswer,
      confidence: result.confidence || 0.5
    };
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Invalid JSON response from AI');
  }
}

/**
 * Fallback scoring when AI is unavailable
 */
function fallbackScoring(userAnswer, correctAnswer) {
  const normalized1 = normalizeAnswer(userAnswer);
  const normalized2 = normalizeAnswer(correctAnswer);
  
  return {
    isCorrect: normalized1 === normalized2,
    extractedAnswer: userAnswer,
    confidence: normalized1 === normalized2 ? 1.0 : 0.0
  };
}

/**
 * Normalize answer for comparison
 */
function normalizeAnswer(answer) {
  if (!answer) return '';
  
  // Convert to string and normalize
  let normalized = String(answer).trim().toUpperCase();
  
  // For multiple choice: sort letters (A,C,B -> A,B,C)
  if (/^[A-D](,[A-D])*$/.test(normalized)) {
    const letters = normalized.split(',').sort();
    return letters.join(',');
  }
  
  // For short answers: remove extra whitespace
  return normalized.replace(/\s+/g, ' ');
}

/**
 * Batch score multiple answers with AI
 * @param {Object} userAnswers - { questionNum: answer, ... }
 * @param {Object} answerKey - { questionNum: { answer, explanation, ... }, ... }
 * @returns {Promise<Object>} - Scoring results
 */
export async function batchScoreWithAI(userAnswers, answerKey) {
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

  // Score each question with intelligent batching
  const BATCH_SIZE = 20; // Process 20 questions at a time to avoid rate limits
  const questionsToScore = [];

  for (const [qNum, data] of Object.entries(answerKey)) {
    const questionNum = parseInt(qNum);
    const userAnswer = userAnswers[questionNum];

    if (!userAnswer || userAnswer.trim() === '') {
      results.missing++;
      results.details.push({
        question: questionNum,
        userAnswer: '',
        correctAnswer: data.answer,
        isCorrect: false,
        points: 0,
        maxPoints: data.points || 1
      });
      continue;
    }

    // Check for exact match first (skip AI for obvious matches)
    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(data.answer);

    if (normalizedUser === normalizedCorrect) {
      // Exact match - no AI needed
      const points = data.points || 1;
      results.correct++;
      results.earnedPoints += points;

      const topic = data.topic || 'Other';
      if (!results.byTopic[topic]) {
        results.byTopic[topic] = { correct: 0, total: 0, points: 0, maxPoints: 0 };
      }
      results.byTopic[topic].total++;
      results.byTopic[topic].maxPoints += data.points || 1;
      results.byTopic[topic].correct++;
      results.byTopic[topic].points += points;

      results.details.push({
        question: questionNum,
        userAnswer: userAnswer,
        extractedAnswer: normalizedUser,
        correctAnswer: data.answer,
        isCorrect: true,
        confidence: 1.0,
        points: points,
        maxPoints: data.points || 1
      });
    } else {
      // Needs AI scoring
      questionsToScore.push({ questionNum, userAnswer, data });
    }
  }

  console.log(`Exact matches: ${results.correct}, Need AI scoring: ${questionsToScore.length}`);

  // Score remaining questions with AI in batches
  for (let i = 0; i < questionsToScore.length; i += BATCH_SIZE) {
    const batch = questionsToScore.slice(i, i + BATCH_SIZE);
    console.log(`Scoring batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(questionsToScore.length / BATCH_SIZE)} (${batch.length} questions)...`);

    const batchPromises = batch.map(({ questionNum, userAnswer, data }) =>
      scoreAnswerWithAI(
        questionNum,
        userAnswer,
        data.answer,
        data.explanation || '',
        data.type || 'multiple-choice'
      ).then(aiResult => {
        const points = aiResult.isCorrect ? (data.points || 1) : 0;

        if (aiResult.isCorrect) {
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
        if (aiResult.isCorrect) {
          results.byTopic[topic].correct++;
          results.byTopic[topic].points += points;
        }

        results.details.push({
          question: questionNum,
          userAnswer: userAnswer,
          extractedAnswer: aiResult.extractedAnswer,
          correctAnswer: data.answer,
          isCorrect: aiResult.isCorrect,
          confidence: aiResult.confidence,
          points: points,
          maxPoints: data.points || 1
        });
      })
    );

    // Wait for this batch to complete before starting next batch
    await Promise.all(batchPromises);

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < questionsToScore.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Calculate percentage and grade
  results.percentage = results.totalPoints > 0 
    ? ((results.earnedPoints / results.totalPoints) * 100).toFixed(2)
    : '0.00';
  
  results.grade = getGrade(parseFloat(results.percentage));

  return results;
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

