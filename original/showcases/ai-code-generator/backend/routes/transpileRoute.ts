/**
 * Transpile Route
 *
 * Handles code transpilation between languages
 */

import * as http from 'http';
import { Transpiler } from '../transpiler/Transpiler';
import { validateTranspileRequest } from '../utils/validators';
import { logger } from '../utils/logger';
import { Cache } from '../utils/cache';

const transpiler = new Transpiler();

export async function handleTranspile(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  body: any,
  cache: Cache
): Promise<void> {
  try {
    // Validate request
    const validation = validateTranspileRequest(body);
    if (!validation.valid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Validation failed',
        errors: validation.errors,
      }));
      return;
    }

    const { code, from, to, options } = body;

    // Generate cache key
    const cacheKey = `transpile:${from}:${to}:${code.substring(0, 100)}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for transpilation request');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...cached, cached: true }));
      return;
    }

    // Transpile code
    const startTime = Date.now();
    const result = await transpiler.transpile(code, from, to, options);
    const duration = Date.now() - startTime;

    const response = {
      code: result.code,
      sourceMap: result.sourceMap,
      warnings: result.warnings || [],
      metadata: {
        duration,
        timestamp: new Date().toISOString(),
        cached: false,
        from,
        to,
      },
    };

    // Cache the result
    cache.set(cacheKey, response, 3600000); // 1 hour

    logger.info(`Transpilation completed in ${duration}ms`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } catch (error) {
    logger.error('Transpilation error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Transpilation failed',
      message: (error as Error).message,
    }));
  }
}
