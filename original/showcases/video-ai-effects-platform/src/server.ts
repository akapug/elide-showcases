/**
 * Video AI Effects Platform - Main Server
 *
 * High-performance video processing server with WebSocket streaming,
 * Python ML integration, and real-time effect processing.
 */

import { EventEmitter } from 'events';
import { Server as WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage } from 'http';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Import effect modules
import { FilterEngine } from './effects/filter-engine';
import { FaceDetector } from './effects/face-detection';
import { ObjectTracker } from './effects/object-tracking';
import { StyleTransfer } from './effects/style-transfer';

/**
 * Video processor configuration
 */
interface VideoProcessorConfig {
  width: number;
  height: number;
  fps: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  backend?: 'cpu' | 'cuda' | 'opencl';
  threads?: number;
  bufferSize?: number;
  enableGPU?: boolean;
}

/**
 * Effect configuration
 */
interface EffectConfig {
  name: string;
  params: Record<string, any>;
  priority?: number;
  enabled?: boolean;
}

/**
 * Frame data structure
 */
interface FrameData {
  data: Buffer;
  width: number;
  height: number;
  timestamp: number;
  format: string;
  metadata?: Record<string, any>;
}

/**
 * Processing statistics
 */
interface ProcessingStats {
  framesProcessed: number;
  averageFps: number;
  averageLatency: number;
  droppedFrames: number;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage?: number;
}

/**
 * Client connection information
 */
interface ClientConnection {
  id: string;
  socket: WebSocket;
  connectedAt: number;
  framesReceived: number;
  framesSent: number;
  effects: EffectConfig[];
}

/**
 * Main video processor class
 */
export class VideoProcessor extends EventEmitter {
  private config: VideoProcessorConfig;
  private filterEngine: FilterEngine;
  private faceDetector: FaceDetector;
  private objectTracker: ObjectTracker;
  private styleTransfer: StyleTransfer;
  private pythonProcess: ChildProcess | null = null;
  private frameBuffer: FrameData[] = [];
  private processingQueue: FrameData[] = [];
  private effects: EffectConfig[] = [];
  private stats: ProcessingStats;
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(config: VideoProcessorConfig) {
    super();

    // Validate configuration
    this.validateConfig(config);

    this.config = {
      threads: 4,
      bufferSize: 30,
      enableGPU: false,
      backend: 'cpu',
      ...config
    };

    // Initialize effect modules
    this.filterEngine = new FilterEngine({
      width: config.width,
      height: config.height
    });

    this.faceDetector = new FaceDetector({
      minConfidence: 0.7,
      modelPath: './models/face_detection'
    });

    this.objectTracker = new ObjectTracker({
      algorithm: 'kcf',
      maxObjects: 10
    });

    this.styleTransfer = new StyleTransfer({
      modelPath: './models/style_transfer',
      quality: config.quality
    });

    // Initialize statistics
    this.stats = {
      framesProcessed: 0,
      averageFps: 0,
      averageLatency: 0,
      droppedFrames: 0,
      cpuUsage: 0,
      memoryUsage: 0
    };

    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Validate processor configuration
   */
  private validateConfig(config: VideoProcessorConfig): void {
    if (!config.width || !config.height) {
      throw new Error('Width and height are required');
    }

    if (config.width < 320 || config.height < 240) {
      throw new Error('Minimum resolution is 320x240');
    }

    if (config.fps < 1 || config.fps > 120) {
      throw new Error('FPS must be between 1 and 120');
    }

    const validQualities = ['low', 'medium', 'high', 'ultra'];
    if (!validQualities.includes(config.quality)) {
      throw new Error(`Quality must be one of: ${validQualities.join(', ')}`);
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.filterEngine.on('error', (error) => {
      this.handleError('FilterEngine', error);
    });

    this.faceDetector.on('faces-detected', (faces) => {
      this.emit('faces-detected', faces);
    });

    this.objectTracker.on('tracking-updated', (objects) => {
      this.emit('tracking-updated', objects);
    });

    this.styleTransfer.on('transfer-complete', (result) => {
      this.emit('style-transfer-complete', result);
    });
  }

  /**
   * Start video processor
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Processor is already running');
    }

    console.log('Starting video processor...');

    try {
      // Initialize Python backend
      await this.initializePythonBackend();

      // Start processing loop
      this.startProcessingLoop();

      // Start statistics collection
      this.startStatsCollection();

      this.isRunning = true;
      this.emit('started');

      console.log('Video processor started successfully');
    } catch (error) {
      this.handleError('Start', error);
      throw error;
    }
  }

  /**
   * Stop video processor
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping video processor...');

    // Stop processing loop
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Stop statistics collection
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Terminate Python process
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }

    // Clear buffers
    this.frameBuffer = [];
    this.processingQueue = [];

    this.isRunning = false;
    this.emit('stopped');

    console.log('Video processor stopped');
  }

  /**
   * Initialize Python backend
   */
  private async initializePythonBackend(): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '../python/cv_processor.py');

      // Check if Python script exists
      if (!fs.existsSync(pythonScript)) {
        reject(new Error(`Python script not found: ${pythonScript}`));
        return;
      }

      // Spawn Python process
      this.pythonProcess = spawn('python3', [
        pythonScript,
        '--width', String(this.config.width),
        '--height', String(this.config.height),
        '--fps', String(this.config.fps),
        '--backend', this.config.backend || 'cpu'
      ]);

      // Handle stdout
      this.pythonProcess.stdout?.on('data', (data) => {
        const message = data.toString().trim();

        if (message === 'READY') {
          resolve();
        } else {
          this.handlePythonMessage(message);
        }
      });

      // Handle stderr
      this.pythonProcess.stderr?.on('data', (data) => {
        console.error('Python error:', data.toString());
      });

      // Handle process exit
      this.pythonProcess.on('exit', (code) => {
        console.log(`Python process exited with code ${code}`);
        this.pythonProcess = null;

        if (this.isRunning) {
          this.emit('python-crashed', code);
        }
      });

      // Timeout if not ready in 10 seconds
      setTimeout(() => {
        if (this.pythonProcess) {
          reject(new Error('Python backend initialization timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Handle messages from Python backend
   */
  private handlePythonMessage(message: string): void {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'frame-processed':
          this.handleProcessedFrame(data);
          break;
        case 'error':
          this.handleError('Python', new Error(data.message));
          break;
        case 'stats':
          this.updateStats(data.stats);
          break;
        default:
          console.log('Unknown Python message:', data);
      }
    } catch (error) {
      // Not JSON, treat as log message
      console.log('Python:', message);
    }
  }

  /**
   * Start processing loop
   */
  private startProcessingLoop(): void {
    const frameTime = 1000 / this.config.fps;

    this.processingInterval = setInterval(() => {
      this.processNextFrame();
    }, frameTime);
  }

  /**
   * Process next frame from queue
   */
  private async processNextFrame(): Promise<void> {
    if (this.processingQueue.length === 0) {
      return;
    }

    const frame = this.processingQueue.shift()!;
    const startTime = Date.now();

    try {
      // Apply TypeScript effects first
      let processedFrame = frame;

      for (const effect of this.effects) {
        if (!effect.enabled) continue;

        processedFrame = await this.applyEffect(processedFrame, effect);
      }

      // Send to Python for ML processing if needed
      if (this.needsPythonProcessing()) {
        processedFrame = await this.sendToPython(processedFrame);
      }

      // Add to frame buffer
      this.addToBuffer(processedFrame);

      // Update statistics
      const latency = Date.now() - startTime;
      this.updateProcessingStats(latency);

      this.emit('frame-processed', processedFrame);
    } catch (error) {
      this.handleError('ProcessFrame', error);
      this.stats.droppedFrames++;
    }
  }

  /**
   * Apply effect to frame
   */
  private async applyEffect(frame: FrameData, effect: EffectConfig): Promise<FrameData> {
    const startTime = Date.now();

    try {
      let result = frame;

      switch (effect.name) {
        case 'filter':
          result = await this.filterEngine.apply(frame, effect.params);
          break;
        case 'face-detection':
          result = await this.faceDetector.detect(frame, effect.params);
          break;
        case 'object-tracking':
          result = await this.objectTracker.track(frame, effect.params);
          break;
        case 'style-transfer':
          result = await this.styleTransfer.apply(frame, effect.params);
          break;
        default:
          console.warn(`Unknown effect: ${effect.name}`);
      }

      const processingTime = Date.now() - startTime;

      this.emit('effect-applied', {
        effect: effect.name,
        processingTime,
        frameTimestamp: frame.timestamp
      });

      return result;
    } catch (error) {
      this.handleError(`Effect: ${effect.name}`, error);
      return frame; // Return original frame on error
    }
  }

  /**
   * Check if frame needs Python processing
   */
  private needsPythonProcessing(): boolean {
    return this.effects.some(effect =>
      effect.enabled &&
      ['background-removal', 'ml-filter', 'segmentation'].includes(effect.name)
    );
  }

  /**
   * Send frame to Python for processing
   */
  private async sendToPython(frame: FrameData): Promise<FrameData> {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess) {
        reject(new Error('Python process not available'));
        return;
      }

      const requestId = Date.now();
      const timeout = setTimeout(() => {
        reject(new Error('Python processing timeout'));
      }, 5000);

      // Setup response handler
      const responseHandler = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());

          if (response.requestId === requestId) {
            clearTimeout(timeout);
            this.pythonProcess?.stdout?.removeListener('data', responseHandler);

            resolve({
              ...frame,
              data: Buffer.from(response.data, 'base64'),
              metadata: response.metadata
            });
          }
        } catch (error) {
          // Ignore parse errors, might be other messages
        }
      };

      this.pythonProcess.stdout?.on('data', responseHandler);

      // Send frame to Python
      const request = {
        type: 'process-frame',
        requestId,
        frame: {
          data: frame.data.toString('base64'),
          width: frame.width,
          height: frame.height,
          timestamp: frame.timestamp,
          format: frame.format
        },
        effects: this.effects.filter(e => e.enabled)
      };

      this.pythonProcess.stdin?.write(JSON.stringify(request) + '\n');
    });
  }

  /**
   * Add frame to buffer
   */
  private addToBuffer(frame: FrameData): void {
    this.frameBuffer.push(frame);

    // Maintain buffer size
    const maxSize = this.config.bufferSize || 30;
    if (this.frameBuffer.length > maxSize) {
      this.frameBuffer.shift();
    }
  }

  /**
   * Process incoming frame
   */
  processFrame(frameData: Buffer, metadata?: Record<string, any>): void {
    const frame: FrameData = {
      data: frameData,
      width: this.config.width,
      height: this.config.height,
      timestamp: Date.now(),
      format: 'rgb24',
      metadata
    };

    // Add to processing queue
    this.processingQueue.push(frame);

    // Drop old frames if queue is too large
    const maxQueueSize = this.config.fps * 2;
    if (this.processingQueue.length > maxQueueSize) {
      const dropped = this.processingQueue.shift();
      this.stats.droppedFrames++;
      this.emit('frame-dropped', dropped);
    }
  }

  /**
   * Apply effect configuration
   */
  applyEffect(name: string, params: Record<string, any>): void {
    const existingIndex = this.effects.findIndex(e => e.name === name);

    const effectConfig: EffectConfig = {
      name,
      params,
      enabled: true,
      priority: params.priority || 0
    };

    if (existingIndex >= 0) {
      this.effects[existingIndex] = effectConfig;
    } else {
      this.effects.push(effectConfig);
    }

    // Sort by priority
    this.effects.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    this.emit('effect-configured', effectConfig);
  }

  /**
   * Remove effect
   */
  removeEffect(name: string): void {
    this.effects = this.effects.filter(e => e.name !== name);
    this.emit('effect-removed', name);
  }

  /**
   * Get current statistics
   */
  getStats(): ProcessingStats {
    return { ...this.stats };
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(latency: number): void {
    this.stats.framesProcessed++;

    // Update average latency
    const alpha = 0.1; // Smoothing factor
    this.stats.averageLatency =
      this.stats.averageLatency * (1 - alpha) + latency * alpha;

    // Update average FPS
    this.stats.averageFps = 1000 / this.stats.averageLatency;
  }

  /**
   * Update statistics from various sources
   */
  private updateStats(newStats: Partial<ProcessingStats>): void {
    Object.assign(this.stats, newStats);
    this.emit('stats-updated', this.stats);
  }

  /**
   * Start statistics collection
   */
  private startStatsCollection(): void {
    this.statsInterval = setInterval(() => {
      this.collectSystemStats();
    }, 1000);
  }

  /**
   * Collect system statistics
   */
  private collectSystemStats(): void {
    const memUsage = process.memoryUsage();

    this.stats.memoryUsage = memUsage.heapUsed / 1024 / 1024; // MB
    this.stats.cpuUsage = process.cpuUsage().user / 1000000; // seconds

    this.emit('stats-updated', this.stats);
  }

  /**
   * Handle processed frame from Python
   */
  private handleProcessedFrame(data: any): void {
    const frame: FrameData = {
      data: Buffer.from(data.frame, 'base64'),
      width: data.width,
      height: data.height,
      timestamp: data.timestamp,
      format: data.format,
      metadata: data.metadata
    };

    this.emit('python-frame-processed', frame);
  }

  /**
   * Handle errors
   */
  private handleError(source: string, error: any): void {
    console.error(`[${source}] Error:`, error);
    this.emit('error', { source, error });
  }

  /**
   * Set backend (CPU/GPU)
   */
  setBackend(backend: 'cpu' | 'cuda' | 'opencl'): void {
    this.config.backend = backend;

    if (this.pythonProcess) {
      this.pythonProcess.stdin?.write(JSON.stringify({
        type: 'set-backend',
        backend
      }) + '\n');
    }
  }

  /**
   * Configure GPU settings
   */
  configureGPU(settings: any): void {
    if (this.pythonProcess) {
      this.pythonProcess.stdin?.write(JSON.stringify({
        type: 'configure-gpu',
        settings
      }) + '\n');
    }
  }

  /**
   * Set number of threads
   */
  setThreads(threads: number): void {
    this.config.threads = threads;
  }

  /**
   * Set buffer size
   */
  setBuffer(config: { size: number; strategy?: string }): void {
    this.config.bufferSize = config.size;
  }

  /**
   * Chain multiple effects
   */
  chainEffects(effects: EffectConfig[]): void {
    this.effects = effects.map((effect, index) => ({
      ...effect,
      priority: effect.priority || (effects.length - index),
      enabled: effect.enabled !== false
    }));

    this.effects.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Get latest frame from buffer
   */
  getLatestFrame(): FrameData | null {
    return this.frameBuffer[this.frameBuffer.length - 1] || null;
  }

  /**
   * Get frame buffer
   */
  getFrameBuffer(): FrameData[] {
    return [...this.frameBuffer];
  }

  /**
   * Clear frame buffer
   */
  clearBuffer(): void {
    this.frameBuffer = [];
  }
}

/**
 * WebSocket streaming server
 */
export class VideoStreamServer extends EventEmitter {
  private httpServer: any;
  private wsServer: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private processor: VideoProcessor;
  private port: number;
  private maxConnections: number;

  constructor(config: {
    port: number;
    maxConnections?: number;
    processorConfig: VideoProcessorConfig;
  }) {
    super();

    this.port = config.port;
    this.maxConnections = config.maxConnections || 100;

    // Create HTTP server
    this.httpServer = createServer(this.handleHttpRequest.bind(this));

    // Create WebSocket server
    this.wsServer = new WebSocketServer({ server: this.httpServer });

    // Initialize video processor
    this.processor = new VideoProcessor(config.processorConfig);

    // Setup handlers
    this.setupWebSocketHandlers();
    this.setupProcessorHandlers();
  }

  /**
   * Handle HTTP requests
   */
  private handleHttpRequest(req: IncomingMessage, res: any): void {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        clients: this.clients.size,
        stats: this.processor.getStats()
      }));
    } else if (req.url === '/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.processor.getStats()));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocketHandlers(): void {
    this.wsServer.on('connection', (socket: WebSocket, request) => {
      this.handleConnection(socket, request);
    });
  }

  /**
   * Setup processor event handlers
   */
  private setupProcessorHandlers(): void {
    this.processor.on('frame-processed', (frame) => {
      this.broadcastFrame(frame);
    });

    this.processor.on('error', (error) => {
      this.broadcastError(error);
    });

    this.processor.on('stats-updated', (stats) => {
      this.broadcastStats(stats);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: WebSocket, request: any): void {
    // Check max connections
    if (this.clients.size >= this.maxConnections) {
      socket.close(1008, 'Server at maximum capacity');
      return;
    }

    const clientId = this.generateClientId();
    const client: ClientConnection = {
      id: clientId,
      socket,
      connectedAt: Date.now(),
      framesReceived: 0,
      framesSent: 0,
      effects: []
    };

    this.clients.set(clientId, client);

    console.log(`Client connected: ${clientId} (${this.clients.size} total)`);

    // Send welcome message
    this.sendToClient(client, {
      type: 'connected',
      clientId,
      serverInfo: {
        maxConnections: this.maxConnections,
        processorConfig: this.processor.getStats()
      }
    });

    // Setup message handler
    socket.on('message', (data) => {
      this.handleClientMessage(client, data);
    });

    // Setup close handler
    socket.on('close', () => {
      this.handleDisconnection(client);
    });

    // Setup error handler
    socket.on('error', (error) => {
      console.error(`Client ${clientId} error:`, error);
    });

    this.emit('connection', client);
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(client: ClientConnection): void {
    this.clients.delete(client.id);
    console.log(`Client disconnected: ${client.id} (${this.clients.size} remaining)`);
    this.emit('disconnection', client);
  }

  /**
   * Handle client message
   */
  private handleClientMessage(client: ClientConnection, data: any): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'process-frame':
          this.handleProcessFrameRequest(client, message);
          break;
        case 'apply-effect':
          this.handleApplyEffect(client, message);
          break;
        case 'remove-effect':
          this.handleRemoveEffect(client, message);
          break;
        case 'get-stats':
          this.sendToClient(client, {
            type: 'stats',
            stats: this.processor.getStats()
          });
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling client message:', error);
    }
  }

  /**
   * Handle process frame request
   */
  private handleProcessFrameRequest(client: ClientConnection, message: any): void {
    try {
      const frameData = Buffer.from(message.frame, 'base64');

      client.framesReceived++;
      this.processor.processFrame(frameData, message.metadata);

      this.emit('frame-received', { client, frame: message });
    } catch (error) {
      this.sendToClient(client, {
        type: 'error',
        message: 'Failed to process frame'
      });
    }
  }

  /**
   * Handle apply effect request
   */
  private handleApplyEffect(client: ClientConnection, message: any): void {
    this.processor.applyEffect(message.effect, message.params);

    client.effects.push({
      name: message.effect,
      params: message.params,
      enabled: true
    });

    this.sendToClient(client, {
      type: 'effect-applied',
      effect: message.effect
    });
  }

  /**
   * Handle remove effect request
   */
  private handleRemoveEffect(client: ClientConnection, message: any): void {
    this.processor.removeEffect(message.effect);

    client.effects = client.effects.filter(e => e.name !== message.effect);

    this.sendToClient(client, {
      type: 'effect-removed',
      effect: message.effect
    });
  }

  /**
   * Broadcast frame to all clients
   */
  private broadcastFrame(frame: FrameData): void {
    const message = {
      type: 'frame',
      data: frame.data.toString('base64'),
      width: frame.width,
      height: frame.height,
      timestamp: frame.timestamp,
      metadata: frame.metadata
    };

    this.clients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
        client.framesSent++;
      }
    });
  }

  /**
   * Broadcast error to all clients
   */
  private broadcastError(error: any): void {
    const message = {
      type: 'error',
      error: error.message || 'Unknown error'
    };

    this.clients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }

  /**
   * Broadcast statistics to all clients
   */
  private broadcastStats(stats: ProcessingStats): void {
    const message = {
      type: 'stats',
      stats
    };

    this.clients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: ClientConnection, message: any): void {
    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Failed to send to client ${client.id}:`, error);
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start server
   */
  async start(): Promise<void> {
    await this.processor.start();

    return new Promise((resolve) => {
      this.httpServer.listen(this.port, () => {
        console.log(`Video stream server listening on port ${this.port}`);
        this.emit('started');
        resolve();
      });
    });
  }

  /**
   * Stop server
   */
  async stop(): Promise<void> {
    // Close all client connections
    this.clients.forEach(client => {
      client.socket.close();
    });
    this.clients.clear();

    // Stop processor
    await this.processor.stop();

    // Close servers
    return new Promise((resolve) => {
      this.httpServer.close(() => {
        console.log('Video stream server stopped');
        this.emit('stopped');
        resolve();
      });
    });
  }

  /**
   * Get server statistics
   */
  getServerStats() {
    return {
      clients: this.clients.size,
      maxConnections: this.maxConnections,
      processor: this.processor.getStats(),
      clientDetails: Array.from(this.clients.values()).map(c => ({
        id: c.id,
        connectedAt: c.connectedAt,
        framesReceived: c.framesReceived,
        framesSent: c.framesSent,
        effects: c.effects.length
      }))
    };
  }
}
