import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  try {
    // In Vercel, use process.cwd() to get project root
    // questions.md is in the scorer directory
    const questionsPath = join(process.cwd(), 'questions.md');
    const questions = readFileSync(questionsPath, 'utf-8');

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(questions);
  } catch (error) {
    console.error('Error reading questions:', error);
    res.status(500).json({ error: 'Failed to load questions', details: error.message });
  }
}

