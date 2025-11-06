/**
 * Templates Route
 *
 * Handles template listing and retrieval
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { Cache } from '../utils/cache';

export async function handleTemplates(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  cache: Cache
): Promise<void> {
  try {
    // Check cache
    const cacheKey = 'templates:list';
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for templates list');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...cached, cached: true }));
      return;
    }

    // Load templates
    const templatesDir = path.join(__dirname, '../../templates');
    const templates = await loadTemplates(templatesDir);

    const response = {
      templates,
      total: templates.length,
      timestamp: new Date().toISOString(),
    };

    // Cache for 1 hour
    cache.set(cacheKey, response, 3600000);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } catch (error) {
    logger.error('Templates error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Failed to load templates',
      message: (error as Error).message,
    }));
  }
}

/**
 * Load templates from directory
 */
async function loadTemplates(dir: string): Promise<any[]> {
  const templates: any[] = [];

  try {
    const categories = fs.readdirSync(dir);

    for (const category of categories) {
      const categoryPath = path.join(dir, category);
      const stat = fs.statSync(categoryPath);

      if (stat.isDirectory()) {
        const templateFiles = fs.readdirSync(categoryPath);

        for (const file of templateFiles) {
          if (file.endsWith('.json')) {
            const templatePath = path.join(categoryPath, file);
            const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
            templates.push({
              ...template,
              category,
            });
          }
        }
      }
    }
  } catch (error) {
    logger.warn('Could not load templates:', error);
  }

  return templates;
}
