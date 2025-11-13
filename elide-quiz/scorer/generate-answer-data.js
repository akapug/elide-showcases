#!/usr/bin/env node
/**
 * Generate answers-data.js and answers-human-data.js from answers.md and answers-human.md
 * Adds points and topic metadata for AI scoring
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Point values by difficulty
const POINTS = {
  'Easy': 1,
  'Medium': 2,
  'Hard': 3,
  'Expert': 5
};

/**
 * Parse answers.md and extract structured data
 */
function parseAnswersFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const answerKey = {};
  let currentTopic = 'Other';
  let currentDifficulty = 'Easy';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect topic headers (## Topic Name)
    if (line.startsWith('## ')) {
      currentTopic = line.replace('## ', '').split('(')[0].trim();
      continue;
    }
    
    // Detect difficulty headers (### Easy, ### Medium, etc.)
    if (line.startsWith('### ')) {
      const diffMatch = line.match(/### (Easy|Medium|Hard|Expert)/);
      if (diffMatch) {
        currentDifficulty = diffMatch[1];
      }
      continue;
    }
    
    // Parse answer lines (format: "1. **B** - Explanation")
    const answerMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s+-\s+(.+)$/);
    if (answerMatch) {
      const questionNum = answerMatch[1];
      const answer = answerMatch[2].trim();
      const explanation = answerMatch[3].trim();
      
      answerKey[questionNum] = {
        answer: answer,
        explanation: explanation,
        points: POINTS[currentDifficulty] || 1,
        topic: currentTopic,
        difficulty: currentDifficulty
      };
    }
  }
  
  return answerKey;
}

/**
 * Generate JavaScript module file
 */
function generateJSModule(answerKey, outputPath) {
  const lines = [
    '// Auto-generated from answers.md - DO NOT EDIT',
    '// This file is server-side only and not exposed to web crawlers',
    '',
    'export const answerKey = {'
  ];
  
  // Sort by question number
  const sortedKeys = Object.keys(answerKey).map(k => parseInt(k)).sort((a, b) => a - b);
  
  for (const qNum of sortedKeys) {
    const data = answerKey[qNum];
    lines.push(`  "${qNum}": {`);
    lines.push(`    "answer": "${data.answer}",`);
    lines.push(`    "explanation": "${data.explanation.replace(/"/g, '\\"')}",`);
    lines.push(`    "points": ${data.points},`);
    lines.push(`    "topic": "${data.topic}",`);
    lines.push(`    "difficulty": "${data.difficulty}"`);
    lines.push(`  },`);
  }
  
  // Remove trailing comma from last entry
  if (lines[lines.length - 1].endsWith(',')) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
  }
  
  lines.push('};');
  lines.push('');
  
  writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  console.log(`✓ Generated ${outputPath} with ${sortedKeys.length} answers`);
}

// Main execution
try {
  // Generate full quiz answers
  const fullAnswersPath = resolve(__dirname, 'answers.md');
  const fullOutputPath = resolve(__dirname, 'api/answers-data.js');
  const fullAnswerKey = parseAnswersFile(fullAnswersPath);
  generateJSModule(fullAnswerKey, fullOutputPath);
  
  // Generate human edition answers
  const humanAnswersPath = resolve(__dirname, 'answers-human.md');
  const humanOutputPath = resolve(__dirname, 'api/answers-human-data.js');
  const humanAnswerKey = parseAnswersFile(humanAnswersPath);
  generateJSModule(humanAnswerKey, humanOutputPath);
  
  console.log('\n✓ All answer data files generated successfully!');
  
} catch (error) {
  console.error('Error generating answer data:', error);
  process.exit(1);
}

