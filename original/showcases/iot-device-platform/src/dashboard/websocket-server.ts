/**
 * Real-time Dashboard WebSocket Server
 *
 * Provides real-time updates to dashboard clients:
 * - Device status updates
 * - Live telemetry streams
 * - Alert notifications
 * - Platform statistics
 * - Connection management
 * - Message broadcasting
 */

import WebSocket, { WebSocketServer } from 'ws';
import { createServer, Server as HttpServer } from 'http';
import Redis from 'ioredis';
import { Logger } from 'pino';
import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';

interface DashboardClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  connectedAt: number;
  lastActivity: number;
  metadata: Record<string, any>;
}

interface DashboardMessage {
  type: string;
  channel?: string;
  payload: any;
  timestamp: number;
}

/**
 * WebSocket Dashboard Server for real-time updates
 */
export class WebSocketDashboard extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private httpServer: HttpServer | null = null;
  private clients = new Map<string, DashboardClient>();
  private redis: Redis;
  private logger: Logger;
  private port: number;
  private running = false;

  // Statistics
  private stats = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    bytesTransferred: 0,
  };

  // Heartbeat interval
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  constructor(port: number, redis: Redis, logger: Logger) {
    super();
    this.port = port;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Start the WebSocket server
   */
  async start(): Promise<void> {
    if (this.running) {
      this.logger.warn('WebSocket Dashboard already running');
      return;
    }

    this.logger.info({ port: this.port }, 'Starting WebSocket Dashboard...');

    // Create HTTP server
    this.httpServer = createServer((req, res) => {
      // Health check endpoint
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          clients: this.clients.size,
          stats: this.stats,
        }));
        return;
      }

      // Return dashboard stats
      if (req.url === '/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.stats));
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
    });

    // Create WebSocket server
    this.wss = new WebSocketServer({ server: this.httpServer });

    this.setupWebSocketHandlers();

    // Start HTTP server
    await new Promise<void>((resolve) => {
      this.httpServer!.listen(this.port, () => {
        this.logger.info({ port: this.port }, 'WebSocket Dashboard started');
        resolve();
      });
    });

    // Start heartbeat
    this.startHeartbeat();

    // Subscribe to Redis pub/sub for system events
    this.subscribeToSystemEvents();

    this.running = true;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss!.on('connection', (ws: WebSocket, req) => {
      const clientId = nanoid();

      this.logger.info({ clientId, ip: req.socket.remoteAddress }, 'Client connected');

      const client: DashboardClient = {
        id: clientId,
        ws,
        subscriptions: new Set(),
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        metadata: {},
      };

      this.clients.set(clientId, client);
      this.stats.totalConnections++;
      this.stats.activeConnections++;

      // Send welcome message
      this.sendToClient(client, {
        type: 'welcome',
        payload: {
          clientId,
          serverTime: Date.now(),
          version: '1.0.0',
        },
        timestamp: Date.now(),
      });

      // Setup message handler
      ws.on('message', (data: Buffer) => {
        this.handleClientMessage(client, data);
      });

      // Setup close handler
      ws.on('close', () => {
        this.handleClientDisconnect(client);
      });

      // Setup error handler
      ws.on('error', (error) => {
        this.logger.error({ error, clientId }, 'WebSocket error');
      });

      // Setup pong handler
      ws.on('pong', () => {
        client.lastActivity = Date.now();
      });

      this.emit('client:connected', { clientId });
    });

    this.wss!.on('error', (error) => {
      this.logger.error({ error }, 'WebSocket Server error');
    });
  }

  /**
   * Handle incoming client messages
   */
  private handleClientMessage(client: DashboardClient, data: Buffer): void {
    try {
      const message: DashboardMessage = JSON.parse(data.toString());
      client.lastActivity = Date.now();
      this.stats.messagesReceived++;

      this.logger.debug({ clientId: client.id, type: message.type }, 'Message received');

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(client, message);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(client, message);
          break;

        case 'ping':
          this.sendToClient(client, {
            type: 'pong',
            payload: { timestamp: Date.now() },
            timestamp: Date.now(),
          });
          break;

        case 'get_stats':
          this.sendStats(client);
          break;

        case 'get_devices':
          this.sendDeviceList(client);
          break;

        case 'get_alerts':
          this.sendAlerts(client);
          break;

        default:
          this.logger.warn({ type: message.type }, 'Unknown message type');
      }
    } catch (error) {
      this.logger.error({ error, clientId: client.id }, 'Failed to handle message');
    }
  }

  /**
   * Handle subscription requests
   */
  private handleSubscribe(client: DashboardClient, message: DashboardMessage): void {
    const channel = message.channel || message.payload?.channel;

    if (!channel) {
      this.sendError(client, 'Missing channel parameter');
      return;
    }

    client.subscriptions.add(channel);

    this.sendToClient(client, {
      type: 'subscribed',
      payload: { channel },
      timestamp: Date.now(),
    });

    this.logger.info({ clientId: client.id, channel }, 'Client subscribed');
  }

  /**
   * Handle unsubscription requests
   */
  private handleUnsubscribe(client: DashboardClient, message: DashboardMessage): void {
    const channel = message.channel || message.payload?.channel;

    if (!channel) {
      this.sendError(client, 'Missing channel parameter');
      return;
    }

    client.subscriptions.delete(channel);

    this.sendToClient(client, {
      type: 'unsubscribed',
      payload: { channel },
      timestamp: Date.now(),
    });

    this.logger.info({ clientId: client.id, channel }, 'Client unsubscribed');
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(client: DashboardClient): void {
    this.logger.info({ clientId: client.id }, 'Client disconnected');

    this.clients.delete(client.id);
    this.stats.activeConnections--;

    this.emit('client:disconnected', { clientId: client.id });
  }

  /**
   * Send message to a specific client
   */
  private sendToClient(client: DashboardClient, message: DashboardMessage): void {
    if (client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const data = JSON.stringify(message);
      client.ws.send(data);

      this.stats.messagesSent++;
      this.stats.bytesTransferred += data.length;
    } catch (error) {
      this.logger.error({ error, clientId: client.id }, 'Failed to send message');
    }
  }

  /**
   * Send error message to client
   */
  private sendError(client: DashboardClient, error: string): void {
    this.sendToClient(client, {
      type: 'error',
      payload: { error },
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast message to all clients or specific channel subscribers
   */
  broadcast(channel: string, payload: any): void {
    const message: DashboardMessage = {
      type: 'broadcast',
      channel,
      payload,
      timestamp: Date.now(),
    };

    let sentCount = 0;

    for (const client of this.clients.values()) {
      // Send to clients subscribed to this channel or to 'all'
      if (
        client.subscriptions.has(channel) ||
        client.subscriptions.has('all')
      ) {
        this.sendToClient(client, message);
        sentCount++;
      }
    }

    this.logger.debug({ channel, clients: sentCount }, 'Broadcast sent');
  }

  /**
   * Send platform statistics to client
   */
  private async sendStats(client: DashboardClient): Promise<void> {
    try {
      // Get stats from Redis
      const deviceCount = await this.redis.get('stats:device_count') || '0';
      const telemetryRate = await this.redis.get('stats:telemetry_rate') || '0';
      const alertCount = await this.redis.get('stats:alert_count') || '0';

      this.sendToClient(client, {
        type: 'stats',
        payload: {
          devices: {
            total: parseInt(deviceCount),
            active: this.clients.size,
          },
          telemetry: {
            rate: parseFloat(telemetryRate),
          },
          alerts: {
            count: parseInt(alertCount),
          },
          dashboard: this.stats,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error({ error }, 'Failed to send stats');
      this.sendError(client, 'Failed to retrieve stats');
    }
  }

  /**
   * Send device list to client
   */
  private async sendDeviceList(client: DashboardClient): Promise<void> {
    try {
      // Get device list from Redis
      const deviceKeys = await this.redis.keys('device:*');
      const devices = [];

      for (const key of deviceKeys.slice(0, 100)) {
        // Limit to 100 devices
        const deviceData = await this.redis.get(key);
        if (deviceData) {
          devices.push(JSON.parse(deviceData));
        }
      }

      this.sendToClient(client, {
        type: 'devices',
        payload: { devices, total: deviceKeys.length },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error({ error }, 'Failed to send device list');
      this.sendError(client, 'Failed to retrieve devices');
    }
  }

  /**
   * Send alerts to client
   */
  private async sendAlerts(client: DashboardClient): Promise<void> {
    try {
      // Get recent alerts from Redis
      const alertKeys = await this.redis.keys('alert:*');
      const alerts = [];

      for (const key of alertKeys.slice(0, 50)) {
        // Limit to 50 alerts
        const alertData = await this.redis.get(key);
        if (alertData) {
          alerts.push(JSON.parse(alertData));
        }
      }

      this.sendToClient(client, {
        type: 'alerts',
        payload: { alerts, total: alertKeys.length },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error({ error }, 'Failed to send alerts');
      this.sendError(client, 'Failed to retrieve alerts');
    }
  }

  /**
   * Subscribe to Redis pub/sub for system events
   */
  private subscribeToSystemEvents(): void {
    const subscriber = this.redis.duplicate();

    subscriber.subscribe('system:events', (err, count) => {
      if (err) {
        this.logger.error({ err }, 'Failed to subscribe to system events');
        return;
      }
      this.logger.info({ channels: count }, 'Subscribed to system events');
    });

    subscriber.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message);
        this.broadcast('system', event);
      } catch (error) {
        this.logger.error({ error }, 'Failed to handle system event');
      }
    });
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds

      for (const client of this.clients.values()) {
        // Check if client is still alive
        if (now - client.lastActivity > timeout) {
          this.logger.warn({ clientId: client.id }, 'Client timeout, closing connection');
          client.ws.terminate();
          this.clients.delete(client.id);
          this.stats.activeConnections--;
          continue;
        }

        // Send ping
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.logger.info('Stopping WebSocket Dashboard...');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      this.sendToClient(client, {
        type: 'shutdown',
        payload: { reason: 'Server shutting down' },
        timestamp: Date.now(),
      });
      client.ws.close();
    }

    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => {
          this.logger.info('WebSocket server closed');
          resolve();
        });
      });
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          this.logger.info('HTTP server closed');
          resolve();
        });
      });
    }

    this.running = false;
    this.logger.info('WebSocket Dashboard stopped');
  }

  /**
   * Get current statistics
   */
  getStats(): any {
    return {
      ...this.stats,
      activeClients: this.clients.size,
    };
  }

  /**
   * Get connected clients
   */
  getClients(): DashboardClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
