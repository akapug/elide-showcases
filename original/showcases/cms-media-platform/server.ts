/**
 * Production-Grade CMS with Media Processing Platform
 *
 * Enterprise content management system featuring:
 * - REST API for content CRUD (articles, pages, media)
 * - Advanced media processing (images, videos)
 * - Multi-layer caching with CDN simulation
 * - Content versioning and collaboration
 * - Full-text search engine
 * - Rate limiting and authentication
 * - Performance optimized for 1000+ RPS
 *
 * Built with Elide beta11-rc1 native HTTP
 */

import { ContentAPI } from './content-api.ts';
import { MediaProcessor } from './media-processor.ts';
import { CDNManager } from './cdn-manager.ts';
import { SearchEngine } from './search-engine.ts';
import { CacheLayer } from './cache-layer.ts';
import { AuthManager } from './auth-manager.ts';

interface ServerStats {
  requestCount: number;
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
  activeUsers: number;
  mediaProcessed: number;
  contentItems: number;
}

class CMSPlatform {
  private contentAPI: ContentAPI;
  private mediaProcessor: MediaProcessor;
  private cdnManager: CDNManager;
  private searchEngine: SearchEngine;
  private cacheLayer: CacheLayer;
  private authManager: AuthManager;
  private stats: ServerStats;
  private requestTimes: number[] = [];

  constructor() {
    this.contentAPI = new ContentAPI();
    this.mediaProcessor = new MediaProcessor();
    this.cdnManager = new CDNManager();
    this.searchEngine = new SearchEngine();
    this.cacheLayer = new CacheLayer();
    this.authManager = new AuthManager();

    this.stats = {
      requestCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTime: 0,
      activeUsers: 0,
      mediaProcessed: 0,
      contentItems: 0
    };

    this.initializeSystem();
  }

  private initializeSystem(): void {
    // Seed initial content
    this.seedContent();

    // Start background jobs
    this.startBackgroundJobs();

    console.log('✅ CMS Platform initialized');
  }

  private seedContent(): void {
    // Create sample articles
    const sampleArticles = [
      {
        title: 'Getting Started with Modern CMS',
        content: 'A comprehensive guide to content management systems...',
        author: 'admin',
        tags: ['cms', 'tutorial', 'guide'],
        status: 'published'
      },
      {
        title: 'Media Processing Best Practices',
        content: 'Learn how to optimize images and videos for web delivery...',
        author: 'admin',
        tags: ['media', 'optimization', 'performance'],
        status: 'published'
      }
    ];

    for (const article of sampleArticles) {
      this.contentAPI.createContent('article', article);
      this.stats.contentItems++;
    }
  }

  private startBackgroundJobs(): void {
    // Cache cleanup every 5 minutes
    setInterval(() => {
      this.cacheLayer.cleanup();
      console.log('🧹 Cache cleanup completed');
    }, 300000);

    // Stats aggregation every minute
    setInterval(() => {
      this.aggregateStats();
    }, 60000);

    // CDN sync every 10 minutes
    setInterval(() => {
      this.cdnManager.syncContent();
      console.log('🔄 CDN sync completed');
    }, 600000);
  }

  private aggregateStats(): void {
    if (this.requestTimes.length > 0) {
      const sum = this.requestTimes.reduce((a, b) => a + b, 0);
      this.stats.avgResponseTime = Math.round(sum / this.requestTimes.length);

      // Keep only last 1000 requests
      if (this.requestTimes.length > 1000) {
        this.requestTimes = this.requestTimes.slice(-1000);
      }
    }
  }

  private trackRequest(startTime: number): void {
    const duration = Date.now() - startTime;
    this.requestTimes.push(duration);
    this.stats.requestCount++;
  }

  private async authenticate(request: Request): Promise<{ user: any; error?: string } | null> {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'Missing authentication token' };
    }

    const token = authHeader.substring(7);
    const user = await this.authManager.validateToken(token);

    if (!user) {
      return { user: null, error: 'Invalid or expired token' };
    }

    return { user };
  }

  private checkRateLimit(request: Request, user: any): { allowed: boolean; headers: Record<string, string> } {
    const identifier = user?.id || request.headers.get('X-Forwarded-For') || 'anonymous';
    const result = this.authManager.checkRateLimit(identifier);

    return {
      allowed: result.allowed,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetAt).toISOString()
      }
    };
  }

  async handleRequest(request: Request): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check
      if (path === '/health') {
        return this.jsonResponse({ status: 'healthy', uptime: process.uptime?.() || 0 });
      }

      // Stats endpoint
      if (path === '/stats') {
        const stats = {
          ...this.stats,
          cache: this.cacheLayer.getStats(),
          search: this.searchEngine.getStats(),
          cdn: this.cdnManager.getStats()
        };
        return this.jsonResponse(stats);
      }

      // Public endpoints that don't require auth
      const publicEndpoints = ['/auth/login', '/auth/register', '/content/public'];
      const isPublic = publicEndpoints.some(ep => path.startsWith(ep));

      // Authentication for non-public endpoints
      let user = null;
      if (!isPublic) {
        const authResult = await this.authenticate(request);
        if (authResult?.error) {
          return this.errorResponse(authResult.error, 401);
        }
        user = authResult?.user;
      }

      // Rate limiting
      const rateLimit = this.checkRateLimit(request, user);
      if (!rateLimit.allowed) {
        return this.errorResponse('Rate limit exceeded', 429, rateLimit.headers);
      }

      // Route handling with caching
      let response: Response;

      // Content API routes
      if (path.startsWith('/api/content')) {
        response = await this.handleContentAPI(request, user);
      }
      // Media API routes
      else if (path.startsWith('/api/media')) {
        response = await this.handleMediaAPI(request, user);
      }
      // Search routes
      else if (path.startsWith('/api/search')) {
        response = await this.handleSearchAPI(request, user);
      }
      // CDN routes
      else if (path.startsWith('/cdn')) {
        response = await this.handleCDN(request);
      }
      // Auth routes
      else if (path.startsWith('/auth')) {
        response = await this.handleAuth(request);
      }
      // Admin routes
      else if (path.startsWith('/admin')) {
        if (!user || user.role !== 'admin') {
          return this.errorResponse('Unauthorized', 403);
        }
        response = await this.handleAdmin(request, user);
      }
      else {
        response = this.errorResponse('Not found', 404);
      }

      // Add rate limit headers
      for (const [key, value] of Object.entries(rateLimit.headers)) {
        response.headers.set(key, value);
      }

      // Track request
      this.trackRequest(startTime);

      return response;
    } catch (error) {
      console.error('Request error:', error);
      this.trackRequest(startTime);
      return this.errorResponse((error as Error).message, 500);
    }
  }

  private async handleContentAPI(request: Request, user: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // GET /api/content - List all content
    if (path === '/api/content' && method === 'GET') {
      const type = url.searchParams.get('type');
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const cacheKey = `content:list:${type}:${status}:${page}:${limit}`;
      const cached = this.cacheLayer.get(cacheKey);

      if (cached) {
        this.stats.cacheHits++;
        return this.jsonResponse(cached, { 'X-Cache': 'HIT' });
      }

      this.stats.cacheMisses++;
      const content = this.contentAPI.listContent({ type, status, page, limit });
      this.cacheLayer.set(cacheKey, content, 60000); // 1 minute cache

      return this.jsonResponse(content, { 'X-Cache': 'MISS' });
    }

    // GET /api/content/:id - Get specific content
    if (path.match(/^\/api\/content\/[^/]+$/) && method === 'GET') {
      const id = path.split('/').pop()!;
      const cacheKey = `content:${id}`;
      const cached = this.cacheLayer.get(cacheKey);

      if (cached) {
        this.stats.cacheHits++;
        return this.jsonResponse(cached, { 'X-Cache': 'HIT' });
      }

      this.stats.cacheMisses++;
      const content = this.contentAPI.getContent(id);

      if (!content) {
        return this.errorResponse('Content not found', 404);
      }

      this.cacheLayer.set(cacheKey, content, 300000); // 5 minutes cache
      return this.jsonResponse(content, { 'X-Cache': 'MISS' });
    }

    // POST /api/content - Create new content
    if (path === '/api/content' && method === 'POST') {
      const body = await request.json();

      if (!body.title || !body.content || !body.type) {
        return this.errorResponse('Missing required fields', 400);
      }

      const content = this.contentAPI.createContent(body.type, {
        ...body,
        author: user.id,
        authorName: user.name
      });

      // Update search index
      this.searchEngine.indexContent(content);

      // Invalidate list cache
      this.cacheLayer.invalidate('content:list:');

      this.stats.contentItems++;

      return this.jsonResponse(content, {}, 201);
    }

    // PUT /api/content/:id - Update content
    if (path.match(/^\/api\/content\/[^/]+$/) && method === 'PUT') {
      const id = path.split('/').pop()!;
      const body = await request.json();

      const updated = this.contentAPI.updateContent(id, body, user.id);

      if (!updated) {
        return this.errorResponse('Content not found or unauthorized', 404);
      }

      // Update search index
      this.searchEngine.indexContent(updated);

      // Invalidate caches
      this.cacheLayer.invalidate(`content:${id}`);
      this.cacheLayer.invalidate('content:list:');

      return this.jsonResponse(updated);
    }

    // DELETE /api/content/:id - Delete content
    if (path.match(/^\/api\/content\/[^/]+$/) && method === 'DELETE') {
      const id = path.split('/').pop()!;
      const deleted = this.contentAPI.deleteContent(id, user.id);

      if (!deleted) {
        return this.errorResponse('Content not found or unauthorized', 404);
      }

      // Remove from search index
      this.searchEngine.removeContent(id);

      // Invalidate caches
      this.cacheLayer.invalidate(`content:${id}`);
      this.cacheLayer.invalidate('content:list:');

      this.stats.contentItems--;

      return this.jsonResponse({ success: true });
    }

    // GET /api/content/:id/versions - Get version history
    if (path.match(/^\/api\/content\/[^/]+\/versions$/) && method === 'GET') {
      const id = path.split('/')[3];
      const versions = this.contentAPI.getVersionHistory(id);
      return this.jsonResponse(versions);
    }

    return this.errorResponse('Not found', 404);
  }

  private async handleMediaAPI(request: Request, user: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // POST /api/media/upload - Upload media
    if (path === '/api/media/upload' && method === 'POST') {
      const body = await request.json();

      if (!body.filename || !body.data || !body.type) {
        return this.errorResponse('Missing required fields', 400);
      }

      const media = await this.mediaProcessor.processUpload({
        filename: body.filename,
        data: body.data,
        type: body.type,
        userId: user.id
      });

      // Upload to CDN
      await this.cdnManager.uploadAsset(media);

      this.stats.mediaProcessed++;

      return this.jsonResponse(media, {}, 201);
    }

    // POST /api/media/:id/process - Process media (resize, convert, etc)
    if (path.match(/^\/api\/media\/[^/]+\/process$/) && method === 'POST') {
      const id = path.split('/')[3];
      const body = await request.json();

      const processed = await this.mediaProcessor.processMedia(id, body.operations);

      if (!processed) {
        return this.errorResponse('Media not found', 404);
      }

      // Upload processed versions to CDN
      await this.cdnManager.uploadAsset(processed);

      return this.jsonResponse(processed);
    }

    // GET /api/media/:id - Get media info
    if (path.match(/^\/api\/media\/[^/]+$/) && method === 'GET') {
      const id = path.split('/').pop()!;
      const media = this.mediaProcessor.getMedia(id);

      if (!media) {
        return this.errorResponse('Media not found', 404);
      }

      return this.jsonResponse(media);
    }

    // GET /api/media - List media
    if (path === '/api/media' && method === 'GET') {
      const type = url.searchParams.get('type');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const media = this.mediaProcessor.listMedia({ type, page, limit });
      return this.jsonResponse(media);
    }

    return this.errorResponse('Not found', 404);
  }

  private async handleSearchAPI(request: Request, user: any): Promise<Response> {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query) {
      return this.errorResponse('Missing query parameter', 400);
    }

    const filters = {
      type: url.searchParams.get('type'),
      author: url.searchParams.get('author'),
      tags: url.searchParams.getAll('tags')
    };

    const results = this.searchEngine.search(query, filters);
    return this.jsonResponse(results);
  }

  private async handleCDN(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /cdn/:asset - Serve asset from CDN
    const assetPath = path.replace('/cdn/', '');
    const asset = this.cdnManager.getAsset(assetPath);

    if (!asset) {
      return this.errorResponse('Asset not found', 404);
    }

    return new Response(asset.data, {
      headers: {
        'Content-Type': asset.contentType,
        'Cache-Control': 'public, max-age=31536000',
        'X-CDN-Cache': 'HIT',
        'ETag': asset.etag
      }
    });
  }

  private async handleAuth(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // POST /auth/register
    if (path === '/auth/register' && request.method === 'POST') {
      const body = await request.json();

      if (!body.email || !body.password || !body.name) {
        return this.errorResponse('Missing required fields', 400);
      }

      const result = this.authManager.register(body.email, body.password, body.name);

      if (!result.success) {
        return this.errorResponse(result.error!, 400);
      }

      this.stats.activeUsers++;

      return this.jsonResponse({
        user: result.user,
        token: result.token
      }, {}, 201);
    }

    // POST /auth/login
    if (path === '/auth/login' && request.method === 'POST') {
      const body = await request.json();

      if (!body.email || !body.password) {
        return this.errorResponse('Missing credentials', 400);
      }

      const result = this.authManager.login(body.email, body.password);

      if (!result.success) {
        return this.errorResponse(result.error!, 401);
      }

      return this.jsonResponse({
        user: result.user,
        token: result.token
      });
    }

    return this.errorResponse('Not found', 404);
  }

  private async handleAdmin(request: Request, user: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /admin/stats - Detailed system stats
    if (path === '/admin/stats') {
      const stats = {
        server: this.stats,
        cache: this.cacheLayer.getStats(),
        search: this.searchEngine.getStats(),
        cdn: this.cdnManager.getStats(),
        content: this.contentAPI.getStats()
      };
      return this.jsonResponse(stats);
    }

    // POST /admin/cache/clear - Clear cache
    if (path === '/admin/cache/clear' && request.method === 'POST') {
      const body = await request.json();
      this.cacheLayer.invalidate(body.pattern);
      return this.jsonResponse({ success: true });
    }

    // POST /admin/reindex - Reindex all content
    if (path === '/admin/reindex' && request.method === 'POST') {
      const allContent = this.contentAPI.listContent({ page: 1, limit: 10000 });
      for (const content of allContent.items) {
        this.searchEngine.indexContent(content);
      }
      return this.jsonResponse({ success: true, indexed: allContent.items.length });
    }

    return this.errorResponse('Not found', 404);
  }

  private jsonResponse(data: any, headers: Record<string, string> = {}, status = 200): Response {
    return new Response(JSON.stringify(data, null, 2), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Powered-By': 'Elide CMS',
        ...headers
      }
    });
  }

  private errorResponse(message: string, status = 400, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify({
      error: message,
      status,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
  }
}

// Create platform instance
const platform = new CMSPlatform();

/**
 * Native Elide beta11-rc1 HTTP Server - Fetch Handler Pattern
 * Run with: elide serve --port 3000 server.ts
 */
export default async function fetch(request: Request): Promise<Response> {
  return await platform.handleRequest(request);
}

if (import.meta.url.includes("server.ts")) {
  console.log('🚀 CMS Media Platform ready on port 3000');
  console.log('Features: Content Management | Media Processing | CDN | Search | Auth | Caching');
  console.log('Target: 1000+ RPS for content delivery');
}
