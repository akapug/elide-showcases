import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function handler(req, res) {
  try {
    // Read questions.md from parent directory
    const questionsPath = join(__dirname, '../questions.md');
    const questions = readFileSync(questionsPath, 'utf-8');
    
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(questions);
  } catch (error) {
    console.error('Error reading questions:', error);
    res.status(500).json({ error: 'Failed to load questions' });
  }
}

