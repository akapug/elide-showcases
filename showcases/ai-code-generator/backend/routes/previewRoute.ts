/**
 * Preview Route
 *
 * Handles live preview generation for code
 */

import * as http from 'http';
import * as crypto from 'crypto';
import { validatePreviewRequest } from '../utils/validators';
import { logger } from '../utils/logger';
import { Cache } from '../utils/cache';
import { Bundler } from '../bundler/Bundler';

const bundler = new Bundler();

// Store previews in memory (in production, use Redis or similar)
const previews = new Map<string, any>();

export async function handlePreview(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  body: any,
  cache: Cache
): Promise<void> {
  try {
    // Validate request
    const validation = validatePreviewRequest(body);
    if (!validation.valid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Validation failed',
        errors: validation.errors,
      }));
      return;
    }

    const { code, files, language, framework } = body;

    // Generate preview ID
    const previewId = crypto.randomBytes(16).toString('hex');

    // Bundle code for preview
    const startTime = Date.now();
    const bundled = await bundler.bundle({
      code,
      files: files || [],
      language: language || 'javascript',
      framework: framework || 'react',
    });
    const duration = Date.now() - startTime;

    // Store preview
    previews.set(previewId, {
      code: bundled.code,
      files: bundled.files,
      sourceMap: bundled.sourceMap,
      created: Date.now(),
    });

    // Clean up old previews (older than 1 hour)
    cleanupOldPreviews();

    logger.info(`Preview generated in ${duration}ms`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      previewId,
      previewUrl: `/preview/${previewId}`,
      bundledCode: bundled.code,
      sourceMap: bundled.sourceMap,
      metadata: {
        duration,
        timestamp: new Date().toISOString(),
      },
    }));
  } catch (error) {
    logger.error('Preview error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Preview generation failed',
      message: (error as Error).message,
    }));
  }
}

/**
 * Clean up old previews
 */
function cleanupOldPreviews(): void {
  const oneHourAgo = Date.now() - 3600000;
  for (const [id, preview] of previews.entries()) {
    if (preview.created < oneHourAgo) {
      previews.delete(id);
    }
  }
}

/**
 * Get preview by ID
 */
export function getPreview(previewId: string): any | null {
  return previews.get(previewId) || null;
}
