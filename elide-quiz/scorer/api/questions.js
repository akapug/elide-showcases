/**
 * Serve questions from database (no external cache dependencies)
 *
 * GET  /api/questions?version=full|human  -> returns plain text questions
 * POST /api/questions  { version, questions_md, answers_json? } (admin) -> upsert
 */
import { createClient } from '@libsql/client';

function getDB() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) return null;
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

async function initDB(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS quiz_content (
      version TEXT PRIMARY KEY,
      questions_md TEXT NOT NULL,
      answers_json TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

function ok(res, text) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(text);
}

function json(res, status, data) {
  if (res.status) return res.status(status).json(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const version = (req.query.version || 'full').toString();

  try {
    const db = getDB();
    if (!db) throw new Error('Database not available');
    await initDB(db);
    // Optional refresh from local file when requested
    if (req.method === 'GET' && req.query.refresh === '1') {
      const filename = version === 'human' ? 'questions-human.md' : 'questions.md';
      let qs = '';
      try {
        const { readFileSync } = await import('node:fs');
        const { fileURLToPath } = await import('node:url');
        const { dirname, join } = await import('node:path');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const filePath = join(__dirname, '..', filename);
        qs = readFileSync(filePath, 'utf8');
        await db.execute({
          sql: 'INSERT OR REPLACE INTO quiz_content (version, questions_md, updated_at) VALUES (?, ?, datetime(''now''))',
          args: [version, qs]
        });
        return ok(res, qs);
      } catch (e) {
        console.warn('Local refresh failed, continuing to normal flow:', e.message);
      }
    }


    if (req.method === 'GET') {
      // Try DB first
      const result = await db.execute({ sql: 'SELECT questions_md FROM quiz_content WHERE version = ?', args: [version] });
      if (result.rows.length > 0) return ok(res, result.rows[0].questions_md);

      // Seed once from local file if available, else GitHub fallback, then persist to DB
      const filename = version === 'human' ? 'questions-human.md' : 'questions.md';
      let qs = '';
      try {
        const { readFileSync } = await import('node:fs');
        const { fileURLToPath } = await import('node:url');
        const { dirname, join } = await import('node:path');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        // ../questions.md relative to this file
        const filePath = join(__dirname, '..', filename);
        qs = readFileSync(filePath, 'utf8');
      } catch (e) {
        // Fallback to GitHub one-time seed
        const url = `https://raw.githubusercontent.com/akapug/elide-showcases/master/elide-quiz/scorer/${filename}`;
        const gh = await fetch(url);
        if (!gh.ok) throw new Error(`Seed fetch failed: ${gh.status}`);
        qs = await gh.text();
      }
      await db.execute({
        sql: 'INSERT OR REPLACE INTO quiz_content (version, questions_md, updated_at) VALUES (?, ?, datetime(''now''))',
        args: [version, qs]
      });
      return ok(res, qs);
    }

    if (req.method === 'POST') {
      const adminToken = req.headers['x-admin-token'] || req.headers['X-Admin-Token'];
      // If an admin token is configured, require it; otherwise allow (dev)
      if (process.env.QUIZ_ADMIN_TOKEN && adminToken !== process.env.QUIZ_ADMIN_TOKEN) {
        return json(res, 401, { success: false, error: 'Unauthorized' });
      }
      const { questions_md, answers_json } = req.body || {};
      if (!questions_md || typeof questions_md !== 'string') {
        return json(res, 400, { success: false, error: 'questions_md (string) required' });
      }
      await db.execute({
        sql: 'INSERT OR REPLACE INTO quiz_content (version, questions_md, answers_json, updated_at) VALUES (?, ?, ?, datetime(''now''))',
        args: [version, questions_md, answers_json ? JSON.stringify(answers_json) : null]
      });
      return json(res, 200, { success: true });
    }

    return json(res, 405, { success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/questions:', error);
    return json(res, 500, { success: false, error: 'Failed to load questions', message: error.message });
  }
}
