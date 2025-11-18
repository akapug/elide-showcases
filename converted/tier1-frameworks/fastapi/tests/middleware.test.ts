/**
 * FastAPI Middleware Tests
 * Tests for middleware functionality.
 */

import { describe, it, expect } from '@jest/globals';
import {
  CORSMiddleware,
  LoggingMiddleware,
  RateLimitMiddleware,
  RequestIDMiddleware,
  SecurityHeadersMiddleware,
  TimingMiddleware,
} from '../src/middleware';

describe('FastAPI Middleware', () => {
  it('should apply CORS middleware', async () => {
    const middleware = CORSMiddleware({
      allow_origins: ['https://example.com'],
    });

    const request = {
      method: 'GET',
      headers: {},
    };

    const next = async () => ({
      status_code: 200,
      content: { message: 'test' },
      headers: {},
    });

    const result = await middleware(request, next);

    expect(result.headers['Access-Control-Allow-Origin']).toBeDefined();
  });

  it('should handle CORS preflight', async () => {
    const middleware = CORSMiddleware();

    const request = {
      method: 'OPTIONS',
      headers: {},
    };

    const next = async () => ({});

    const result = await middleware(request, next);

    expect(result.status_code).toBe(200);
    expect(result.headers['Access-Control-Allow-Methods']).toBeDefined();
  });

  it('should apply logging middleware', async () => {
    const logs: string[] = [];
    const logger = (msg: string) => logs.push(msg);

    const middleware = LoggingMiddleware({ logger });

    const request = {
      method: 'GET',
      url: '/test',
    };

    const next = async () => ({
      status_code: 200,
      content: {},
      headers: {},
    });

    await middleware(request, next);

    expect(logs.length).toBeGreaterThan(0);
  });

  it('should apply rate limiting', async () => {
    const middleware = RateLimitMiddleware({
      requests_per_minute: 2,
      identifier: () => '127.0.0.1',
    });

    const request = {
      method: 'GET',
      headers: {},
      raw: { socket: { remoteAddress: '127.0.0.1' } },
    };

    const next = async () => ({
      status_code: 200,
      content: {},
      headers: {},
    });

    // First request - should succeed
    const result1 = await middleware(request, next);
    expect(result1.status_code).toBe(200);

    // Second request - should succeed
    const result2 = await middleware(request, next);
    expect(result2.status_code).toBe(200);

    // Third request - should be rate limited
    const result3 = await middleware(request, next);
    expect(result3.status_code).toBe(429);
  });

  it('should add request ID', async () => {
    const middleware = RequestIDMiddleware();

    const request = {
      method: 'GET',
      headers: {},
    };

    const next = async () => ({
      status_code: 200,
      content: {},
      headers: {},
    });

    const result = await middleware(request, next);

    expect(result.headers['X-Request-ID']).toBeDefined();
    expect(request.request_id).toBeDefined();
  });

  it('should add security headers', async () => {
    const middleware = SecurityHeadersMiddleware();

    const request = {};

    const next = async () => ({
      status_code: 200,
      content: {},
      headers: {},
    });

    const result = await middleware(request, next);

    expect(result.headers['Strict-Transport-Security']).toBeDefined();
    expect(result.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(result.headers['X-Frame-Options']).toBe('DENY');
  });

  it('should add timing header', async () => {
    const middleware = TimingMiddleware();

    const request = {};

    const next = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        status_code: 200,
        content: {},
        headers: {},
      };
    };

    const result = await middleware(request, next);

    expect(result.headers['X-Response-Time']).toBeDefined();
    expect(result.headers['X-Response-Time']).toMatch(/\d+ms/);
  });
});
