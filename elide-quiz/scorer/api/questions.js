export const config = { runtime: 'nodejs' };

function sendText(res, status, text) {
  if (res.status) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    return res.status(status).send(text);
  }
  // Node HTTP fallback
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(text);
}

function sendJSON(res, status, data) {
  if (res.status) {
    if (!res.headersSent) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    return res.status(status).json(data);
  }
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

async function fetchGitHubQuestions(version) {
  const filename = version === 'human' ? 'questions-human.md' : 'questions.md';
  const url = `https://raw.githubusercontent.com/akapug/elide-showcases/master/elide-quiz/scorer/${filename}`;
  const gh = await fetch(url);
  if (!gh.ok) throw new Error(`GitHub fetch failed: ${gh.status}`);
  return await gh.text();
}

export default async function handler(req, res) {
  try {
    // CORS
    if (!res.headersSent) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
    }
    if (req.method === 'OPTIONS') return sendText(res, 200, '');

    const version = (req.query?.version || 'full').toString();
    if (req.query?.ping === '1') return sendText(res, 200, 'pong');

    const hasDB = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
    if (!hasDB) {
      // No DB configured: serve from GitHub
      const qs = await fetchGitHubQuestions(version);
      return sendText(res, 200, qs);
    }

    // Lazy import to avoid bundling issues
    const { createClient } = await import('@libsql/client');
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    // Ensure table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS quiz_content (
        version TEXT PRIMARY KEY,
        questions_md TEXT NOT NULL,
        answers_json TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Refresh path: force fetch from GitHub and upsert
    if (req.method === 'GET' && req.query?.refresh === '1') {
      const qs = await fetchGitHubQuestions(version);
      await db.execute({
        sql: `INSERT OR REPLACE INTO quiz_content (version, questions_md, updated_at) VALUES (?, ?, datetime('now'))`,
        args: [version, qs]
      });
      return sendText(res, 200, qs);
    }

    if (req.method === 'GET') {
      // Try DB first
      const result = await db.execute({
        sql: 'SELECT questions_md FROM quiz_content WHERE version = ?',
        args: [version]
      });
      if (result.rows.length > 0) {
        return sendText(res, 200, result.rows[0].questions_md);
      }

      // Seed from GitHub, persist, return
      const qs = await fetchGitHubQuestions(version);
      await db.execute({
        sql: `INSERT OR REPLACE INTO quiz_content (version, questions_md, updated_at) VALUES (?, ?, datetime('now'))`,
        args: [version, qs]
      });
      return sendText(res, 200, qs);
    }

    if (req.method === 'POST') {
      const adminToken = req.headers['x-admin-token'] || req.headers['X-Admin-Token'];
      if (process.env.QUIZ_ADMIN_TOKEN && adminToken !== process.env.QUIZ_ADMIN_TOKEN) {
        return sendJSON(res, 401, { success: false, error: 'Unauthorized' });
      }
      const { version: bodyVersion, questions_md, answers_json } = req.body || {};
      const v = (bodyVersion || version).toString();
      if (!questions_md || typeof questions_md !== 'string') {
        return sendJSON(res, 400, { success: false, error: 'questions_md (string) required' });
      }
      await db.execute({
        sql: `INSERT OR REPLACE INTO quiz_content (version, questions_md, answers_json, updated_at) VALUES (?, ?, ?, datetime('now'))`,
        args: [v, questions_md, answers_json ? JSON.stringify(answers_json) : null]
      });
      return sendJSON(res, 200, { success: true });
    }

    return sendJSON(res, 405, { success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/questions:', error);
    try {
      return sendJSON(res, 500, { success: false, error: 'FUNCTION_FAILED', message: error.message });
    } catch {
      // last resort
      res.statusCode = 500;
      res.end('Internal Error');
    }
  }
}
