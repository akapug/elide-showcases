/**
 * AI Art Gallery Platform - Main Server
 *
 * Revolutionary multi-model AI art generation server powered by Elide's polyglot runtime.
 * Orchestrates Python AI models (Stable Diffusion, GANs, Style Transfer) directly from
 * TypeScript with zero overhead - impossible with traditional architectures.
 *
 * Features:
 * - Real-time art generation via WebSocket
 * - Multi-model orchestration in single process
 * - Intelligent request queue management
 * - GPU resource optimization
 * - Comprehensive caching layer
 * - Admin dashboard and monitoring
 *
 * @module server
 */

import * as express from 'express';
import * as WebSocket from 'ws';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Direct Python imports - the magic of Elide's polyglot runtime!
import { StableDiffusion } from '../python/stable_diffusion.py';
import { StyleTransfer } from '../python/style_transfer.py';
import { GANGenerator } from '../python/gan_generator.py';
import { ImageEnhancement } from '../python/image_enhancement.py';
import { ArtAnalyzer } from '../python/art_analyzer.py';

// TypeScript modules
import { CollectionManager } from './gallery/collection-manager';
import { StyleMixer } from './gallery/style-mixer';
import { PromptEngine } from './generation/prompt-engine';
import { Upscaler } from './generation/upscaler';

/**
 * Server configuration interface
 */
interface ServerConfig {
  port: number;
  host: string;
  gpu: number;
  cache: {
    enabled: boolean;
    maxSize: string;
    ttl: number;
  };
  queue: {
    maxConcurrent: number;
    maxQueued: number;
    timeout: number;
  };
  models: {
    preload: string[];
    precision: 'fp16' | 'fp32';
  };
}

/**
 * Generation request interface
 */
interface GenerationRequest {
  id: string;
  type: 'text-to-image' | 'image-to-image' | 'style-transfer' | 'enhance';
  prompt?: string;
  image?: Buffer;
  model: string;
  params: Record<string, any>;
  priority: number;
  timestamp: number;
  userId?: string;
}

/**
 * Generation result interface
 */
interface GenerationResult {
  id: string;
  image: Buffer;
  metadata: {
    model: string;
    params: Record<string, any>;
    generationTime: number;
    seed: number;
    dimensions: { width: number; height: number };
  };
  analysis?: {
    style: string;
    aesthetic: number;
    composition: Record<string, any>;
  };
}

/**
 * Cache entry interface
 */
interface CacheEntry {
  key: string;
  value: Buffer;
  metadata: Record<string, any>;
  size: number;
  timestamp: number;
  hits: number;
}

/**
 * Queue statistics interface
 */
interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTime: number;
  totalProcessed: number;
}

/**
 * Main AI Art Gallery Server
 */
export class ArtGalleryServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocket.Server;
  private config: ServerConfig;

  // AI Models (Python instances running in the same process!)
  private stableDiffusion: any;
  private styleTransfer: any;
  private ganGenerator: any;
  private imageEnhancement: any;
  private artAnalyzer: any;

  // TypeScript components
  private collectionManager: CollectionManager;
  private styleMixer: StyleMixer;
  private promptEngine: PromptEngine;
  private upscaler: Upscaler;

  // Queue and cache
  private requestQueue: GenerationRequest[] = [];
  private processingRequests: Map<string, GenerationRequest> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private cacheSize: number = 0;

  // Statistics
  private stats: QueueStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    avgProcessingTime: 0,
    totalProcessed: 0
  };

  // WebSocket connections
  private wsConnections: Map<string, WebSocket> = new Map();

  /**
   * Initialize the Art Gallery Server
   */
  constructor(config: Partial<ServerConfig> = {}) {
    this.config = {
      port: config.port || 8080,
      host: config.host || '0.0.0.0',
      gpu: config.gpu || 0,
      cache: {
        enabled: config.cache?.enabled ?? true,
        maxSize: config.cache?.maxSize || '10GB',
        ttl: config.cache?.ttl || 3600
      },
      queue: {
        maxConcurrent: config.queue?.maxConcurrent || 4,
        maxQueued: config.queue?.maxQueued || 100,
        timeout: config.queue?.timeout || 300000
      },
      models: {
        preload: config.models?.preload || ['stable-diffusion'],
        precision: config.models?.precision || 'fp16'
      }
    };

    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Initialize all AI models and components
   */
  async initialize(): Promise<void> {
    console.log('🎨 AI Art Gallery Platform');
    console.log('━'.repeat(60));
    console.log('');

    try {
      // Initialize Python AI models
      console.log('Loading AI models...');

      // Stable Diffusion
      if (this.config.models.preload.includes('stable-diffusion')) {
        console.log('  ⏳ Loading Stable Diffusion...');
        this.stableDiffusion = new StableDiffusion({
          model: 'stabilityai/stable-diffusion-2-1',
          device: `cuda:${this.config.gpu}`,
          precision: this.config.models.precision
        });
        await this.stableDiffusion.load();
        console.log('  ✓ Stable Diffusion loaded (v2.1)');
      }

      // Style Transfer
      console.log('  ⏳ Loading Style Transfer models...');
      this.styleTransfer = new StyleTransfer({
        device: `cuda:${this.config.gpu}`,
        models: ['vgg19', 'adain']
      });
      await this.styleTransfer.load();
      console.log('  ✓ Style Transfer models loaded (VGG19, AdaIN)');

      // GAN Generator
      if (this.config.models.preload.includes('stylegan2')) {
        console.log('  ⏳ Loading StyleGAN2...');
        this.ganGenerator = new GANGenerator({
          model: 'stylegan2-ffhq',
          device: `cuda:${this.config.gpu}`,
          resolution: 1024
        });
        await this.ganGenerator.load();
        console.log('  ✓ StyleGAN2 loaded (1024x1024)');
      }

      // Image Enhancement
      console.log('  ⏳ Loading Enhancement models...');
      this.imageEnhancement = new ImageEnhancement({
        device: `cuda:${this.config.gpu}`,
        models: ['esrgan', 'deoldify']
      });
      await this.imageEnhancement.load();
      console.log('  ✓ Enhancement models loaded (ESRGAN, DeOldify)');

      // Art Analyzer
      console.log('  ⏳ Loading Analysis models...');
      this.artAnalyzer = new ArtAnalyzer({
        device: `cuda:${this.config.gpu}`
      });
      await this.artAnalyzer.load();
      console.log('  ✓ Analysis models loaded (AestheticPredictor)');

      console.log('');

      // Initialize TypeScript components
      console.log('Initializing gallery components...');

      this.collectionManager = new CollectionManager({
        storageDir: './storage/collections',
        analyzer: this.artAnalyzer
      });
      await this.collectionManager.initialize();

      this.styleMixer = new StyleMixer({
        styleTransfer: this.styleTransfer,
        analyzer: this.artAnalyzer
      });

      this.promptEngine = new PromptEngine({
        modelType: 'gpt-style'
      });

      this.upscaler = new Upscaler({
        enhancement: this.imageEnhancement
      });

      console.log('✓ Gallery components initialized');
      console.log('');

      // Start queue processor
      this.startQueueProcessor();

      // Start cache cleaner
      if (this.config.cache.enabled) {
        this.startCacheCleaner();
      }

      console.log('🌐 Server: http://localhost:' + this.config.port);
      console.log('📊 Admin: http://localhost:' + this.config.port + '/admin');
      console.log('🎨 Gallery: http://localhost:' + this.config.port + '/gallery');
      console.log('');
      console.log('Ready for art generation!');
      console.log('');

    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });
      next();
    });

    // Static files
    this.app.use('/static', express.static('public'));
    this.app.use('/gallery', express.static('storage/gallery'));
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        models: {
          stableDiffusion: !!this.stableDiffusion,
          styleTransfer: !!this.styleTransfer,
          ganGenerator: !!this.ganGenerator,
          imageEnhancement: !!this.imageEnhancement,
          artAnalyzer: !!this.artAnalyzer
        }
      });
    });

    // Generate artwork
    this.app.post('/api/generate', async (req, res) => {
      try {
        const { prompt, model, style, width, height, steps, guidance, seed } = req.body;

        if (!prompt) {
          return res.status(400).json({ error: 'Prompt is required' });
        }

        const requestId = crypto.randomBytes(16).toString('hex');
        const request: GenerationRequest = {
          id: requestId,
          type: 'text-to-image',
          prompt,
          model: model || 'stable-diffusion',
          params: {
            style,
            width: width || 512,
            height: height || 512,
            steps: steps || 50,
            guidance: guidance || 7.5,
            seed: seed || Math.floor(Math.random() * 1000000)
          },
          priority: 5,
          timestamp: Date.now(),
          userId: req.headers['x-user-id'] as string
        };

        // Check cache
        if (this.config.cache.enabled) {
          const cached = this.checkCache(request);
          if (cached) {
            return res.json({
              id: requestId,
              cached: true,
              image: cached.value.toString('base64'),
              metadata: cached.metadata
            });
          }
        }

        // Add to queue
        this.enqueueRequest(request);

        res.json({
          id: requestId,
          status: 'queued',
          position: this.requestQueue.length
        });

      } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Style transfer
    this.app.post('/api/style-transfer', async (req, res) => {
      try {
        const { image, style, intensity } = req.body;

        if (!image || !style) {
          return res.status(400).json({ error: 'Image and style are required' });
        }

        const requestId = crypto.randomBytes(16).toString('hex');
        const imageBuffer = Buffer.from(image, 'base64');

        const request: GenerationRequest = {
          id: requestId,
          type: 'style-transfer',
          image: imageBuffer,
          model: 'style-transfer',
          params: {
            style,
            intensity: intensity || 1.0
          },
          priority: 5,
          timestamp: Date.now()
        };

        this.enqueueRequest(request);

        res.json({
          id: requestId,
          status: 'queued',
          position: this.requestQueue.length
        });

      } catch (error) {
        console.error('Style transfer error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Image enhancement
    this.app.post('/api/enhance', async (req, res) => {
      try {
        const { image, upscale, denoise, sharpen, colorize } = req.body;

        if (!image) {
          return res.status(400).json({ error: 'Image is required' });
        }

        const requestId = crypto.randomBytes(16).toString('hex');
        const imageBuffer = Buffer.from(image, 'base64');

        const request: GenerationRequest = {
          id: requestId,
          type: 'enhance',
          image: imageBuffer,
          model: 'enhancement',
          params: {
            upscale: upscale || 1,
            denoise: denoise || false,
            sharpen: sharpen || 0,
            colorize: colorize || false
          },
          priority: 5,
          timestamp: Date.now()
        };

        this.enqueueRequest(request);

        res.json({
          id: requestId,
          status: 'queued',
          position: this.requestQueue.length
        });

      } catch (error) {
        console.error('Enhancement error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get result
    this.app.get('/api/result/:id', async (req, res) => {
      try {
        const { id } = req.params;

        // Check if still processing
        if (this.processingRequests.has(id)) {
          return res.json({
            status: 'processing',
            message: 'Generation in progress'
          });
        }

        // Check if in queue
        const queued = this.requestQueue.find(r => r.id === id);
        if (queued) {
          const position = this.requestQueue.indexOf(queued);
          return res.json({
            status: 'queued',
            position: position + 1
          });
        }

        // Check storage
        const resultPath = path.join('./storage/results', `${id}.json`);
        if (fs.existsSync(resultPath)) {
          const result = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
          const imagePath = path.join('./storage/results', `${id}.png`);
          const imageBuffer = fs.readFileSync(imagePath);

          return res.json({
            status: 'completed',
            image: imageBuffer.toString('base64'),
            metadata: result.metadata,
            analysis: result.analysis
          });
        }

        res.status(404).json({ error: 'Result not found' });

      } catch (error) {
        console.error('Result retrieval error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Collections API
    this.app.post('/api/collections', async (req, res) => {
      try {
        const collection = await this.collectionManager.create(req.body);
        res.json(collection);
      } catch (error) {
        console.error('Collection creation error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/collections/:id', async (req, res) => {
      try {
        const collection = await this.collectionManager.get(req.params.id);
        res.json(collection);
      } catch (error) {
        console.error('Collection retrieval error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/collections/:id/curate', async (req, res) => {
      try {
        const collection = await this.collectionManager.get(req.params.id);
        const curated = await this.collectionManager.curate(collection, req.body);
        res.json(curated);
      } catch (error) {
        console.error('Curation error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Queue statistics
    this.app.get('/api/stats', (req, res) => {
      res.json({
        queue: this.stats,
        cache: {
          entries: this.cache.size,
          size: this.formatBytes(this.cacheSize),
          hitRate: this.calculateCacheHitRate()
        },
        models: this.getModelStats()
      });
    });

    // Admin dashboard
    this.app.get('/admin', (req, res) => {
      res.send(this.generateAdminDashboard());
    });

    // Gallery view
    this.app.get('/gallery', async (req, res) => {
      const collections = await this.collectionManager.listAll();
      res.send(this.generateGalleryView(collections));
    });
  }

  /**
   * Setup WebSocket for real-time updates
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      const connectionId = crypto.randomBytes(16).toString('hex');
      this.wsConnections.set(connectionId, ws);

      console.log(`WebSocket connected: ${connectionId}`);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);

          if (data.type === 'generate') {
            const requestId = crypto.randomBytes(16).toString('hex');
            const request: GenerationRequest = {
              id: requestId,
              type: 'text-to-image',
              prompt: data.payload.prompt,
              model: data.payload.model || 'stable-diffusion',
              params: data.payload.params || {},
              priority: 10, // Higher priority for WebSocket requests
              timestamp: Date.now()
            };

            // Send initial response
            ws.send(JSON.stringify({
              type: 'queued',
              requestId,
              position: this.requestQueue.length + 1
            }));

            // Process with progress updates
            this.processWithProgress(request, (progress) => {
              ws.send(JSON.stringify({
                type: 'progress',
                requestId,
                progress
              }));
            }).then(result => {
              ws.send(JSON.stringify({
                type: 'complete',
                requestId,
                image: result.image.toString('base64'),
                metadata: result.metadata,
                analysis: result.analysis
              }));
            }).catch(error => {
              ws.send(JSON.stringify({
                type: 'error',
                requestId,
                error: error.message
              }));
            });
          }

        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });

      ws.on('close', () => {
        this.wsConnections.delete(connectionId);
        console.log(`WebSocket disconnected: ${connectionId}`);
      });
    });
  }

  /**
   * Enqueue generation request
   */
  private enqueueRequest(request: GenerationRequest): void {
    if (this.requestQueue.length >= this.config.queue.maxQueued) {
      throw new Error('Queue is full');
    }

    // Insert based on priority
    const index = this.requestQueue.findIndex(r => r.priority < request.priority);
    if (index === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(index, 0, request);
    }

    this.stats.pending = this.requestQueue.length;
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.requestQueue.length === 0) return;
      if (this.processingRequests.size >= this.config.queue.maxConcurrent) return;

      const request = this.requestQueue.shift();
      if (!request) return;

      this.stats.pending = this.requestQueue.length;
      this.stats.processing = this.processingRequests.size + 1;

      this.processingRequests.set(request.id, request);

      try {
        const result = await this.processRequest(request);
        await this.saveResult(request.id, result);
        this.stats.completed++;
        this.stats.totalProcessed++;
      } catch (error) {
        console.error(`Request ${request.id} failed:`, error);
        this.stats.failed++;
      } finally {
        this.processingRequests.delete(request.id);
        this.stats.processing = this.processingRequests.size;
      }
    }, 100);
  }

  /**
   * Process generation request
   */
  private async processRequest(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    let image: Buffer;
    let metadata: any = {
      model: request.model,
      params: request.params
    };

    switch (request.type) {
      case 'text-to-image':
        image = await this.generateImage(request);
        break;

      case 'style-transfer':
        image = await this.applyStyleTransfer(request);
        break;

      case 'enhance':
        image = await this.enhanceImage(request);
        break;

      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }

    // Analyze result
    const analysis = await this.artAnalyzer.analyze(image, {
      includeStyle: true,
      includeAesthetic: true,
      includeComposition: true
    });

    const generationTime = Date.now() - startTime;

    // Update statistics
    this.updateAvgProcessingTime(generationTime);

    const result: GenerationResult = {
      id: request.id,
      image,
      metadata: {
        ...metadata,
        generationTime,
        seed: request.params.seed || 0,
        dimensions: {
          width: request.params.width || 512,
          height: request.params.height || 512
        }
      },
      analysis: {
        style: analysis.style.primary,
        aesthetic: analysis.aesthetic.score,
        composition: analysis.composition
      }
    };

    // Cache result
    if (this.config.cache.enabled) {
      this.cacheResult(request, result);
    }

    return result;
  }

  /**
   * Generate image using Stable Diffusion
   */
  private async generateImage(request: GenerationRequest): Promise<Buffer> {
    const { prompt, width, height, steps, guidance, seed } = request.params;

    // Optimize prompt if needed
    const optimizedPrompt = await this.promptEngine.optimize(prompt, {
      style: request.params.style,
      quality: 'high'
    });

    // Generate with Stable Diffusion
    const image = await this.stableDiffusion.generate({
      prompt: optimizedPrompt,
      width,
      height,
      num_inference_steps: steps,
      guidance_scale: guidance,
      seed
    });

    // Apply style if specified
    if (request.params.style) {
      return await this.styleTransfer.apply(image, request.params.style, {
        intensity: 0.7
      });
    }

    return image;
  }

  /**
   * Apply style transfer
   */
  private async applyStyleTransfer(request: GenerationRequest): Promise<Buffer> {
    const { style, intensity } = request.params;

    return await this.styleTransfer.apply(request.image!, style, {
      intensity: intensity || 1.0,
      method: 'adain'
    });
  }

  /**
   * Enhance image
   */
  private async enhanceImage(request: GenerationRequest): Promise<Buffer> {
    let image = request.image!;

    // Upscale
    if (request.params.upscale > 1) {
      image = await this.upscaler.upscale(image, {
        factor: request.params.upscale,
        method: 'esrgan'
      });
    }

    // Denoise
    if (request.params.denoise) {
      image = await this.imageEnhancement.denoise(image);
    }

    // Sharpen
    if (request.params.sharpen > 0) {
      image = await this.imageEnhancement.sharpen(image, request.params.sharpen);
    }

    // Colorize
    if (request.params.colorize) {
      image = await this.imageEnhancement.colorize(image);
    }

    return image;
  }

  /**
   * Process request with progress callbacks
   */
  private async processWithProgress(
    request: GenerationRequest,
    onProgress: (progress: number) => void
  ): Promise<GenerationResult> {
    // Simulate progress updates (in real implementation, models would report progress)
    const progressInterval = setInterval(() => {
      const progress = Math.min(
        90,
        (Date.now() - request.timestamp) / (request.params.steps || 50) * 2
      );
      onProgress(progress);
    }, 500);

    try {
      const result = await this.processRequest(request);
      onProgress(100);
      return result;
    } finally {
      clearInterval(progressInterval);
    }
  }

  /**
   * Check cache for request
   */
  private checkCache(request: GenerationRequest): CacheEntry | null {
    const key = this.generateCacheKey(request);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.cache.ttl * 1000) {
      this.cache.delete(key);
      this.cacheSize -= entry.size;
      return null;
    }

    entry.hits++;
    return entry;
  }

  /**
   * Cache generation result
   */
  private cacheResult(request: GenerationRequest, result: GenerationResult): void {
    const key = this.generateCacheKey(request);
    const size = result.image.length;

    // Check if we need to evict entries
    const maxSize = this.parseSize(this.config.cache.maxSize);
    while (this.cacheSize + size > maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      key,
      value: result.image,
      metadata: result.metadata,
      size,
      timestamp: Date.now(),
      hits: 0
    };

    this.cache.set(key, entry);
    this.cacheSize += size;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: GenerationRequest): string {
    const data = JSON.stringify({
      type: request.type,
      prompt: request.prompt,
      params: request.params
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Evict least recently used cache entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      const score = entry.timestamp - (entry.hits * 60000); // Favor frequently accessed
      if (score < oldestTime) {
        oldestTime = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.cacheSize -= entry.size;
    }
  }

  /**
   * Start cache cleaner
   */
  private startCacheCleaner(): void {
    setInterval(() => {
      const now = Date.now();
      const ttl = this.config.cache.ttl * 1000;

      for (const [key, entry] of this.cache) {
        if (now - entry.timestamp > ttl) {
          this.cache.delete(key);
          this.cacheSize -= entry.size;
        }
      }
    }, 60000); // Clean every minute
  }

  /**
   * Save generation result
   */
  private async saveResult(id: string, result: GenerationResult): Promise<void> {
    const resultsDir = './storage/results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Save image
    const imagePath = path.join(resultsDir, `${id}.png`);
    fs.writeFileSync(imagePath, result.image);

    // Save metadata
    const metadataPath = path.join(resultsDir, `${id}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify({
      metadata: result.metadata,
      analysis: result.analysis
    }, null, 2));
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    let totalHits = 0;
    let totalAccess = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalAccess += entry.hits + 1;
    }

    return totalAccess > 0 ? (totalHits / totalAccess) * 100 : 0;
  }

  /**
   * Get model statistics
   */
  private getModelStats(): Record<string, any> {
    return {
      stableDiffusion: {
        loaded: !!this.stableDiffusion,
        model: 'stable-diffusion-2-1'
      },
      styleTransfer: {
        loaded: !!this.styleTransfer,
        models: ['vgg19', 'adain']
      },
      ganGenerator: {
        loaded: !!this.ganGenerator,
        model: 'stylegan2-ffhq'
      },
      imageEnhancement: {
        loaded: !!this.imageEnhancement,
        models: ['esrgan', 'deoldify']
      },
      artAnalyzer: {
        loaded: !!this.artAnalyzer
      }
    };
  }

  /**
   * Update average processing time
   */
  private updateAvgProcessingTime(time: number): void {
    const total = this.stats.avgProcessingTime * (this.stats.totalProcessed - 1);
    this.stats.avgProcessingTime = (total + time) / this.stats.totalProcessed;
  }

  /**
   * Parse size string to bytes
   */
  private parseSize(size: string): number {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = size.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
    if (!match) throw new Error(`Invalid size format: ${size}`);

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    return value * (units[unit] || 1);
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }

  /**
   * Generate admin dashboard HTML
   */
  private generateAdminDashboard(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>AI Art Gallery - Admin</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat { display: inline-block; margin: 10px 20px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #333; }
    .stat-label { font-size: 14px; color: #666; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 AI Art Gallery - Admin Dashboard</h1>

    <div class="card">
      <h2>Queue Statistics</h2>
      <div class="stat">
        <div class="stat-value">${this.stats.pending}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat">
        <div class="stat-value">${this.stats.processing}</div>
        <div class="stat-label">Processing</div>
      </div>
      <div class="stat">
        <div class="stat-value">${this.stats.completed}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat">
        <div class="stat-value">${this.stats.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value">${(this.stats.avgProcessingTime / 1000).toFixed(2)}s</div>
        <div class="stat-label">Avg Time</div>
      </div>
    </div>

    <div class="card">
      <h2>Cache Statistics</h2>
      <div class="stat">
        <div class="stat-value">${this.cache.size}</div>
        <div class="stat-label">Entries</div>
      </div>
      <div class="stat">
        <div class="stat-value">${this.formatBytes(this.cacheSize)}</div>
        <div class="stat-label">Size</div>
      </div>
      <div class="stat">
        <div class="stat-value">${this.calculateCacheHitRate().toFixed(1)}%</div>
        <div class="stat-label">Hit Rate</div>
      </div>
    </div>

    <div class="card">
      <h2>Loaded Models</h2>
      <ul>
        ${this.stableDiffusion ? '<li>✓ Stable Diffusion v2.1</li>' : ''}
        ${this.styleTransfer ? '<li>✓ Style Transfer (VGG19, AdaIN)</li>' : ''}
        ${this.ganGenerator ? '<li>✓ StyleGAN2 (1024x1024)</li>' : ''}
        ${this.imageEnhancement ? '<li>✓ Image Enhancement (ESRGAN, DeOldify)</li>' : ''}
        ${this.artAnalyzer ? '<li>✓ Art Analyzer</li>' : ''}
      </ul>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate gallery view HTML
   */
  private generateGalleryView(collections: any[]): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>AI Art Gallery</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #000; color: #fff; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .item { background: #111; padding: 10px; border-radius: 8px; }
    .item img { width: 100%; border-radius: 4px; }
    .item h3 { margin: 10px 0; }
    h1 { text-align: center; }
  </style>
</head>
<body>
  <h1>🎨 AI Art Gallery</h1>
  <div class="gallery">
    ${collections.map(c => `
      <div class="item">
        <h3>${c.name}</h3>
        <p>${c.count} artworks</p>
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    await this.initialize();

    this.server.listen(this.config.port, this.config.host, () => {
      console.log(`Server listening on ${this.config.host}:${this.config.port}`);
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    console.log('Shutting down server...');

    // Close WebSocket connections
    for (const ws of this.wsConnections.values()) {
      ws.close();
    }

    // Close server
    await new Promise<void>((resolve) => {
      this.server.close(() => resolve());
    });

    console.log('Server stopped');
  }
}

/**
 * Main entry point
 */
if (require.main === module) {
  const server = new ArtGalleryServer({
    port: parseInt(process.env.PORT || '8080'),
    gpu: parseInt(process.env.GPU || '0')
  });

  server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });
}

export default ArtGalleryServer;
