/**
 * Generate Route
 *
 * Handles code generation from natural language prompts
 */

import * as http from 'http';
import { AIEngine } from '../ai/AIEngine';
import { validateGenerateRequest } from '../utils/validators';
import { logger } from '../utils/logger';
import { Cache } from '../utils/cache';

const aiEngine = new AIEngine();

export async function handleGenerate(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  body: any,
  cache: Cache
): Promise<void> {
  try {
    // Validate request
    const validation = validateGenerateRequest(body);
    if (!validation.valid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Validation failed',
        errors: validation.errors,
      }));
      return;
    }

    const { prompt, language, framework, context } = body;

    // Generate cache key
    const cacheKey = `gen:${JSON.stringify({ prompt, language, framework })}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for generation request');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...cached, cached: true }));
      return;
    }

    // Generate code
    const startTime = Date.now();
    const result = await aiEngine.generateCode({
      prompt,
      language: language || 'typescript',
      framework: framework || 'react',
      context,
    });
    const duration = Date.now() - startTime;

    // Add metadata
    const response = {
      ...result,
      metadata: {
        duration,
        timestamp: new Date().toISOString(),
        cached: false,
      },
    };

    // Cache the result
    cache.set(cacheKey, response, 3600000); // 1 hour

    logger.info(`Code generation completed in ${duration}ms`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } catch (error) {
    logger.error('Generation error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Code generation failed',
      message: (error as Error).message,
    }));
  }
}
