#!/usr/bin/env node

/**
 * OpenRouter Automation Script
 * 
 * Automatically tests all relevant OpenRouter models on the Elide Expert Quiz
 * and populates the leaderboard with results.
 * 
 * Usage: node openrouter-automation.js [--dry-run] [--limit=N] [--filter=pattern]
 */

import { readFileSync } from 'fs';
import { answerKey } from './api/answers-data.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const QUIZ_URL = process.env.QUIZ_URL || 'https://elide.top';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '999');
const FILTER = process.argv.find(arg => arg.startsWith('--filter='))?.split('=')[1];

// Model categories to test
const MODEL_CATEGORIES = {
  // Top-tier SOTA models
  sota: [
    'anthropic/claude-opus-4-20250514',
    'anthropic/claude-sonnet-4-20250514',
    'anthropic/claude-haiku-4.5',
    'openai/gpt-5.1',
    'openai/gpt-5',
    'openai/gpt-4.5-turbo',
    'google/gemini-2.0-flash-thinking-exp',
    'google/gemini-2.0-pro-exp',
    'x-ai/grok-4-fast',
    'x-ai/grok-3',
  ],
  
  // Strong open-source models
  oss: [
    'meta-llama/llama-3.3-70b-instruct',
    'meta-llama/llama-3.1-405b-instruct',
    'qwen/qwen-2.5-72b-instruct',
    'deepseek/deepseek-chat',
    'mistralai/mistral-large-2411',
    'cohere/command-r-plus',
  ],
  
  // Free tier models (for testing)
  free: [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
  ],
};

// Get all questions from answer key
const questions = Object.keys(answerKey).map(num => {
  const q = answerKey[num];
  return {
    number: num,
    topic: q.topic,
    difficulty: q.difficulty,
    points: q.points
  };
});

// Load questions text
const questionsText = readFileSync('./questions.md', 'utf-8');

// Create quiz prompt
function createQuizPrompt() {
  const totalQuestions = questions.length;
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return `You are taking the Elide Expert Quiz - a comprehensive test of knowledge about Elide v1.0.0-beta11-rc1, a polyglot runtime built on GraalVM.

This quiz has ${totalQuestions} multiple choice questions (1 point each = ${totalQuestions} total points).

${questionsText}

IMPORTANT INSTRUCTIONS:
- Answer ALL ${totalQuestions} questions
- All questions are multiple choice
- Format: One answer per line, question number followed by answer
- Single answer: Letter only (A, B, C, or D)
  Example: 1. B
- Multiple answers: Comma-separated letters with NO SPACES
  Example: 2. A,C,D

SURVEY (Required after your ${totalQuestions} answers):
S1. [Tools available] (e.g., "web search, codebase search")
S2. [Time in minutes] (e.g., "5")
S3. [Research strategy] (e.g., "Used CLI help")
S4. [Model name] (leave blank, will be filled automatically)
S5. [Model version] (leave blank, will be filled automatically)
S6. [Temperature] (e.g., "0.7")
S7. [Max tokens] (e.g., "4096")

Example submission format:
1. B
2. A,C,D
3. B
...
${totalQuestions}. D

S1. web search, codebase search
S2. 5
S3. Used CLI help
S4. (auto-filled)
S5. (auto-filled)
S6. 0.7
S7. 4096

Begin your answers now:`;
}

// Fetch available models from OpenRouter
async function fetchAvailableModels() {
  console.log('📡 Fetching available models from OpenRouter...');
  
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
}

// Filter models based on criteria
function filterModels(allModels) {
  const targetModels = [
    ...MODEL_CATEGORIES.sota,
    ...MODEL_CATEGORIES.oss,
    ...MODEL_CATEGORIES.free,
  ];
  
  let filtered = allModels.filter(model => {
    // Check if model is in our target list
    const isTarget = targetModels.some(target => model.id === target || model.id.includes(target));
    
    // Apply user filter if provided
    if (FILTER && !model.id.includes(FILTER) && !model.name.includes(FILTER)) {
      return false;
    }
    
    return isTarget;
  });
  
  // Apply limit
  if (LIMIT < filtered.length) {
    filtered = filtered.slice(0, LIMIT);
  }
  
  return filtered;
}

// Test a single model
async function testModel(model) {
  console.log(`\n🤖 Testing ${model.name} (${model.id})...`);
  
  if (DRY_RUN) {
    console.log('   [DRY RUN] Skipping actual API call');
    return null;
  }
  
  const prompt = createQuizPrompt();
  
  try {
    // Call OpenRouter API
    const startTime = Date.now();
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': QUIZ_URL,
        'X-Title': 'Elide Expert Quiz Automation',
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 50000,
      }),
    });
    
    const thinkingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`   ❌ API Error: ${response.status} ${response.statusText}`);
      console.error(`   ${error}`);
      return null;
    }
    
    const data = await response.json();
    const rawAnswers = data.choices[0].message.content;

    console.log(`   ✅ Got response (${thinkingTime}s, ${rawAnswers.split('\n').length} lines)`);

    // Submit raw text to quiz (AI will parse it)
    const submitResponse = await fetch(`${QUIZ_URL}/api/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: model.name,
        answers: rawAnswers, // Send raw text, not pre-parsed
        version: 'full',
        metadata: {
          model: model.id,
          provider: model.id.split('/')[0],
          automationRun: true,
        },
      }),
    });
    
    if (!submitResponse.ok) {
      console.error(`   ❌ Submit Error: ${submitResponse.statusText}`);
      return null;
    }
    
    const result = await submitResponse.json();
    console.log(`   📊 Score: ${result.results.percentage}% (${result.results.earnedPoints}/${result.results.totalPoints} pts)`);
    console.log(`   ✓ ${result.results.correct} correct, ✗ ${result.results.incorrect} incorrect, ∅ ${result.results.missing} missing`);
    
    return result;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 Elide Expert Quiz - OpenRouter Automation\n');
  console.log(`   Quiz URL: ${QUIZ_URL}`);
  console.log(`   Dry Run: ${DRY_RUN}`);
  console.log(`   Limit: ${LIMIT}`);
  console.log(`   Filter: ${FILTER || 'none'}\n`);
  
  // Fetch available models
  const allModels = await fetchAvailableModels();
  console.log(`   Found ${allModels.length} total models on OpenRouter`);
  
  // Filter to target models
  const targetModels = filterModels(allModels);
  console.log(`   Selected ${targetModels.length} models to test\n`);
  
  if (targetModels.length === 0) {
    console.log('❌ No models match the criteria');
    return;
  }
  
  // Test each model
  const results = [];
  for (const model of targetModels) {
    const result = await testModel(model);
    if (result) {
      results.push({ model: model.name, ...result.results });
    }
    
    // Rate limiting: wait 2 seconds between requests
    if (!DRY_RUN) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY\n');
  console.log(`Tested ${results.length} models successfully\n`);
  
  if (results.length > 0) {
    results.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
    
    console.log('Top Performers:');
    results.slice(0, 10).forEach((r, i) => {
      console.log(`${i + 1}. ${r.model}: ${r.percentage}% (${r.earnedPoints}/${r.totalPoints} pts)`);
    });
  }
  
  console.log('\n✅ Automation complete!');
}

main().catch(console.error);

