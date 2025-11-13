/**
 * Serve questions as plain text
 * Reads from GitHub raw URL since Vercel doesn't include .md files in deployment
 */
export default async function handler(req, res) {
  try {
    const version = req.query.version || 'full';
    const filename = version === 'human' ? 'questions-human.md' : 'questions.md';

    // Fetch from GitHub with cache-busting (always up-to-date)
    const cacheBust = Date.now();
    const url = `https://raw.githubusercontent.com/akapug/elide-showcases/master/elide-quiz/scorer/${filename}?cb=${cacheBust}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`GitHub fetch failed: ${response.status}`);
    }

    const questions = await response.text();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(questions);
  } catch (error) {
    console.error('Error reading questions:', error);
    res.status(500).json({ error: 'Failed to load questions', details: error.message });
  }
}

