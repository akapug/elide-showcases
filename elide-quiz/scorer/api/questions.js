import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  try {
    const version = req.query.version || 'full';
    const filename = version === 'human' ? 'questions-human.md' : 'questions.md';
    const questionsPath = join(process.cwd(), filename);
    const questions = readFileSync(questionsPath, 'utf-8');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(questions);
  } catch (error) {
    console.error('Error reading questions:', error);
    res.status(500).json({ error: 'Failed to load questions', details: error.message });
  }
}

