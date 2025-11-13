#!/usr/bin/env node
/**
 * Generate missing answers (261-500) for Elide Expert Quiz
 * Uses local Elide CLI, documentation, and AI to create accurate answers
 */

import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const OPENROUTER_API_KEY = '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';
const MODEL = 'anthropic/claude-haiku-4.5';
const ELIDE_PATH = '/home/pug/elide/elide';

// Load existing questions
const questionsPath = resolve('elide-quiz/scorer/questions.md');
const questionsContent = readFileSync(questionsPath, 'utf-8');

// Load existing answers to see the format
const answersPath = resolve('elide-quiz/scorer/answers.md');
const existingAnswers = readFileSync(answersPath, 'utf-8');

// Load documentation
const migrationGuide = readFileSync(resolve('BETA11_MIGRATION_GUIDE.md'), 'utf-8');

// Get CLI help for all topics
const helpTopics = ['projects', 'jvm', 'lockfiles', 'nodeapi', 'polyglot', 'servers', 'typescript'];
const cliHelp = {};
for (const topic of helpTopics) {
  try {
    cliHelp[topic] = execSync(`${ELIDE_PATH} help ${topic}`, { encoding: 'utf-8' });
  } catch (error) {
    console.error(`Failed to get help for ${topic}:`, error.message);
  }
}

/**
 * Extract questions from a range
 */
function extractQuestions(startNum, endNum) {
  const lines = questionsContent.split('\n');
  const questions = [];
  let currentQuestion = null;
  
  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s+(.+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (num >= startNum && num <= endNum) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          number: num,
          text: match[2],
          options: []
        };
      } else if (currentQuestion && num > endNum) {
        questions.push(currentQuestion);
        break;
      }
    } else if (currentQuestion && line.trim().match(/^[A-D]\./)) {
      currentQuestion.options.push(line.trim());
    }
  }
  
  if (currentQuestion) {
    questions.push(currentQuestion);
  }
  
  return questions;
}

/**
 * Generate answer using AI with context
 */
async function generateAnswer(question, context) {
  const prompt = `You are an expert on Elide v1.0.0-beta11-rc1, a polyglot runtime built on GraalVM v25.0.0.

QUESTION #${question.number}:
${question.text}
${question.options.length > 0 ? '\nOptions:\n' + question.options.join('\n') : ''}

CONTEXT (Elide Documentation):
${context}

Based on the documentation provided, generate the correct answer in this EXACT format:

${question.number}. **[ANSWER]** - [Brief explanation with source reference]

For multiple choice:
- Use letter(s) only: A, B, C, D, or combinations like A,B,C
- For True/False questions, use A for True, B for False

For short answer:
- Provide the concise correct answer

IMPORTANT:
- Base your answer ONLY on the provided documentation
- Include source reference (e.g., "Source: elide help projects", "Source: BETA11_MIGRATION_GUIDE.md")
- Be accurate and concise
- Match the format of existing answers exactly

Generate the answer now:`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://elide.top',
      'X-Title': 'Elide Expert Quiz Answer Generator'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Build context for a question based on its topic
 */
function buildContext(question) {
  const text = question.text.toLowerCase();
  let context = '';
  
  // Add relevant CLI help
  if (text.includes('project') || text.includes('elide.pkl') || text.includes('dependencies')) {
    context += '\n\n=== ELIDE HELP: PROJECTS ===\n' + cliHelp.projects;
  }
  if (text.includes('java') || text.includes('kotlin') || text.includes('jvm') || text.includes('maven')) {
    context += '\n\n=== ELIDE HELP: JVM ===\n' + cliHelp.jvm;
  }
  if (text.includes('lockfile') || text.includes('lock')) {
    context += '\n\n=== ELIDE HELP: LOCKFILES ===\n' + cliHelp.lockfiles;
  }
  if (text.includes('node') || text.includes('npm')) {
    context += '\n\n=== ELIDE HELP: NODE API ===\n' + cliHelp.nodeapi;
  }
  if (text.includes('polyglot') || text.includes('cross-language') || text.includes('interop')) {
    context += '\n\n=== ELIDE HELP: POLYGLOT ===\n' + cliHelp.polyglot;
  }
  if (text.includes('server') || text.includes('http') || text.includes('fetch')) {
    context += '\n\n=== ELIDE HELP: SERVERS ===\n' + cliHelp.servers;
  }
  if (text.includes('typescript') || text.includes('tsx') || text.includes('jsx')) {
    context += '\n\n=== ELIDE HELP: TYPESCRIPT ===\n' + cliHelp.typescript;
  }
  
  // Add migration guide for beta11 questions
  if (text.includes('beta11') || text.includes('native') || text.includes('shim')) {
    context += '\n\n=== BETA11 MIGRATION GUIDE ===\n' + migrationGuide.substring(0, 3000);
  }
  
  // If no specific context, add general info
  if (!context) {
    context = cliHelp.projects + '\n\n' + cliHelp.polyglot;
  }
  
  return context;
}

/**
 * Main function
 */
async function main() {
  console.log('Generating missing answers (261-500)...\n');
  
  // Extract questions 261-500
  const questions = extractQuestions(261, 500);
  console.log(`Found ${questions.length} questions to answer\n`);
  
  const answers = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`[${i + 1}/${questions.length}] Generating answer for Q${question.number}...`);
    
    try {
      const context = buildContext(question);
      const answer = await generateAnswer(question, context);
      answers.push(answer);
      console.log(`✓ ${answer.substring(0, 80)}...`);
      
      // Rate limiting: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`✗ Failed: ${error.message}`);
      // Add placeholder
      answers.push(`${question.number}. **[NEEDS REVIEW]** - Answer generation failed`);
    }
  }
  
  // Append to answers.md
  console.log('\nAppending answers to answers.md...');
  const newContent = '\n\n' + answers.join('\n\n') + '\n';
  appendFileSync(answersPath, newContent);
  
  console.log(`\n✓ Generated ${answers.length} answers!`);
  console.log('✓ Appended to elide-quiz/scorer/answers.md');
  console.log('\nNext steps:');
  console.log('1. Review the generated answers for accuracy');
  console.log('2. Run: node elide-quiz/scorer/generate-answer-data.js');
  console.log('3. Test the quiz with the new answers');
}

main().catch(console.error);

