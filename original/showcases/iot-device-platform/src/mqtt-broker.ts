/**
 * MQTT Broker Integration
 *
 * High-performance MQTT broker using Aedes:
 * - QoS 0, 1, and 2 support
 * - Authentication and authorization
 * - Topic-based routing
 * - Message persistence
 * - WebSocket support
 * - Rate limiting
 */

import aedes, { Aedes, Client, AuthenticateError, AuthorizePublishError } from 'aedes';
import { createServer, Server as NetServer } from 'net';
import { createServer as createHttpServer, Server as HttpServer } from 'http';
import ws from 'ws';
import { Logger } from 'pino';
import { DeviceManager } from './device-manager';
import { TelemetryProcessor } from './telemetry-processor';
import { EventEmitter } from 'events';

interface MQTTConfig {
  port: number;
  wsPort: number;
}

interface ClientSession {
  deviceId: string;
  connectedAt: number;
  messageCount: number;
  lastActivity: number;
}

/**
 * MQTT Broker for IoT device communication
 */
export class MQTTBroker extends EventEmitter {
  private broker: Aedes;
  private tcpServer: NetServer | null = null;
  private httpServer: HttpServer | null = null;
  private wsServer: ws.Server | null = null;
  private config: MQTTConfig;
  private deviceManager: DeviceManager;
  private telemetryProcessor: TelemetryProcessor;
  private logger: Logger;
  private running = false;
  private clients = new Map<string, ClientSession>();
  private rateLimiters = new Map<string, { count: number; resetAt: number }>();

  // Rate limiting configuration
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly RATE_LIMIT_MAX_MESSAGES = 1000; // per device per minute

  constructor(
    config: MQTTConfig,
    deviceManager: DeviceManager,
    telemetryProcessor: TelemetryProcessor,
    logger: Logger
  ) {
    super();
    this.config = config;
    this.deviceManager = deviceManager;
    this.telemetryProcessor = telemetryProcessor;
    this.logger = logger;

    this.broker = aedes({
      id: `iot-broker-${process.pid}`,
      authenticate: this.authenticate.bind(this),
      authorizePublish: this.authorizePublish.bind(this),
      authorizeSubscribe: this.authorizeSubscribe.bind(this),
    });

    this.setupBrokerHandlers();
  }

  /**
   * Setup broker event handlers
   */
  private setupBrokerHandlers(): void {
    // Client connection
    this.broker.on('client', (client: Client) => {
      this.logger.info(
        { clientId: client.id },
        'MQTT client connected'
      );

      const session: ClientSession = {
        deviceId: client.id,
        connectedAt: Date.now(),
        messageCount: 0,
        lastActivity: Date.now(),
      };

      this.clients.set(client.id, session);

      // Update device status
      this.deviceManager
        .updateConnectionStatus(client.id, true)
        .catch(err => this.logger.error({ err, clientId: client.id }, 'Failed to update status'));

      this.emit('client:connected', { clientId: client.id });
    });

    // Client disconnection
    this.broker.on('clientDisconnect', (client: Client) => {
      this.logger.info(
        { clientId: client.id },
        'MQTT client disconnected'
      );

      const session = this.clients.get(client.id);
      if (session) {
        const duration = Date.now() - session.connectedAt;
        this.logger.info(
          { clientId: client.id, duration, messages: session.messageCount },
          'Client session ended'
        );
        this.clients.delete(client.id);
      }

      // Update device status
      this.deviceManager
        .updateConnectionStatus(client.id, false)
        .catch(err => this.logger.error({ err, clientId: client.id }, 'Failed to update status'));

      this.emit('client:disconnected', { clientId: client.id });
    });

    // Message publishing
    this.broker.on('publish', async (packet, client) => {
      if (!client) {
        return; // System message
      }

      const session = this.clients.get(client.id);
      if (session) {
        session.messageCount++;
        session.lastActivity = Date.now();
      }

      // Parse topic and route message
      await this.routeMessage(client.id, packet.topic, packet.payload);
    });

    // Subscription
    this.broker.on('subscribe', (subscriptions, client) => {
      this.logger.debug(
        { clientId: client.id, subscriptions },
        'Client subscribed'
      );
    });

    // Unsubscription
    this.broker.on('unsubscribe', (unsubscriptions, client) => {
      this.logger.debug(
        { clientId: client.id, unsubscriptions },
        'Client unsubscribed'
      );
    });

    // Error handling
    this.broker.on('clientError', (client, err) => {
      this.logger.error(
        { clientId: client?.id, err },
        'MQTT client error'
      );
    });

    this.broker.on('connectionError', (client, err) => {
      this.logger.error(
        { clientId: client?.id, err },
        'MQTT connection error'
      );
    });
  }

  /**
   * Authenticate client
   */
  private async authenticate(
    client: Client,
    username: string | undefined,
    password: Buffer | undefined,
    callback: (error: AuthenticateError | null, success: boolean) => void
  ): Promise<void> {
    if (!username || !password) {
      this.logger.warn({ clientId: client.id }, 'Authentication failed: missing credentials');
      return callback(null, false);
    }

    try {
      const deviceId = username;
      const pwd = password.toString();

      // Authenticate with device manager
      const authenticated = await this.deviceManager.authenticateDevice(deviceId, pwd);

      if (authenticated) {
        client.id = deviceId; // Set client ID to device ID
        this.logger.info({ deviceId }, 'Device authenticated');
        callback(null, true);
      } else {
        this.logger.warn({ deviceId }, 'Authentication failed: invalid credentials');
        callback(null, false);
      }
    } catch (error) {
      this.logger.error({ error, clientId: client.id }, 'Authentication error');
      callback(null, false);
    }
  }

  /**
   * Authorize publish
   */
  private async authorizePublish(
    client: Client | null,
    packet: any,
    callback: (error?: AuthorizePublishError | null) => void
  ): Promise<void> {
    if (!client) {
      return callback(null); // Allow system messages
    }

    // Check rate limiting
    if (!this.checkRateLimit(client.id)) {
      this.logger.warn({ clientId: client.id }, 'Rate limit exceeded');
      return callback(new Error('Rate limit exceeded') as any);
    }

    // Validate topic pattern
    const topic = packet.topic;
    const deviceId = client.id;

    // Devices can only publish to their own topics
    const allowedPrefixes = [
      `devices/${deviceId}/`,
      `$SYS/`,
    ];

    const allowed = allowedPrefixes.some(prefix => topic.startsWith(prefix));

    if (!allowed) {
      this.logger.warn(
        { clientId: client.id, topic },
        'Publish unauthorized: invalid topic'
      );
      return callback(new Error('Unauthorized topic') as any);
    }

    callback(null);
  }

  /**
   * Authorize subscribe
   */
  private async authorizeSubscribe(
    client: Client | null,
    subscription: any,
    callback: (error: Error | null, subscription?: any) => void
  ): Promise<void> {
    if (!client) {
      return callback(null, subscription);
    }

    const topic = subscription.topic;
    const deviceId = client.id;

    // Devices can subscribe to their own topics and commands
    const allowedPrefixes = [
      `devices/${deviceId}/`,
      `commands/${deviceId}/`,
      `shadow/${deviceId}/`,
    ];

    const allowed = allowedPrefixes.some(prefix => topic.startsWith(prefix));

    if (!allowed) {
      this.logger.warn(
        { clientId: client.id, topic },
        'Subscribe unauthorized: invalid topic'
      );
      return callback(new Error('Unauthorized topic'), null);
    }

    callback(null, subscription);
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    let limiter = this.rateLimiters.get(clientId);

    if (!limiter || now > limiter.resetAt) {
      limiter = {
        count: 0,
        resetAt: now + this.RATE_LIMIT_WINDOW,
      };
      this.rateLimiters.set(clientId, limiter);
    }

    limiter.count++;

    if (limiter.count > this.RATE_LIMIT_MAX_MESSAGES) {
      return false;
    }

    return true;
  }

  /**
   * Route message based on topic
   */
  private async routeMessage(
    clientId: string,
    topic: string,
    payload: Buffer
  ): Promise<void> {
    try {
      const parts = topic.split('/');

      // devices/{deviceId}/telemetry
      if (parts[0] === 'devices' && parts[2] === 'telemetry') {
        await this.handleTelemetry(clientId, payload);
      }
      // devices/{deviceId}/events
      else if (parts[0] === 'devices' && parts[2] === 'events') {
        await this.handleEvent(clientId, payload);
      }
      // devices/{deviceId}/shadow/update
      else if (parts[0] === 'devices' && parts[2] === 'shadow' && parts[3] === 'update') {
        await this.handleShadowUpdate(clientId, payload);
      }
      // devices/{deviceId}/logs
      else if (parts[0] === 'devices' && parts[2] === 'logs') {
        await this.handleLog(clientId, payload);
      }
      else {
        this.logger.debug({ topic, clientId }, 'Unhandled topic');
      }
    } catch (error) {
      this.logger.error({ error, topic, clientId }, 'Failed to route message');
    }
  }

  /**
   * Handle telemetry data
   */
  private async handleTelemetry(deviceId: string, payload: Buffer): Promise<void> {
    try {
      const data = JSON.parse(payload.toString());

      await this.telemetryProcessor.processTelemetry({
        deviceId,
        timestamp: data.timestamp || Date.now(),
        metrics: data.metrics || data,
      });

      // Update device statistics
      await this.deviceManager.updateStatistics(deviceId, { messagesReceived: 1 });

      this.emit('telemetry:received', { deviceId, data });
    } catch (error) {
      this.logger.error({ error, deviceId }, 'Failed to handle telemetry');
    }
  }

  /**
   * Handle device events
   */
  private async handleEvent(deviceId: string, payload: Buffer): Promise<void> {
    try {
      const event = JSON.parse(payload.toString());

      this.logger.info({ deviceId, event }, 'Device event received');
      this.emit('device:event', { deviceId, event });
    } catch (error) {
      this.logger.error({ error, deviceId }, 'Failed to handle event');
    }
  }

  /**
   * Handle shadow update
   */
  private async handleShadowUpdate(deviceId: string, payload: Buffer): Promise<void> {
    try {
      const update = JSON.parse(payload.toString());

      await this.deviceManager.updateShadowReported(deviceId, update.state || update);

      // Publish shadow delta
      const shadow = await this.deviceManager.getShadow(deviceId);
      if (shadow) {
        const delta = this.calculateShadowDelta(shadow.reported, shadow.desired);
        if (Object.keys(delta).length > 0) {
          this.publishToDevice(deviceId, 'shadow/delta', delta);
        }
      }

      this.emit('shadow:updated', { deviceId, update });
    } catch (error) {
      this.logger.error({ error, deviceId }, 'Failed to handle shadow update');
    }
  }

  /**
   * Handle device logs
   */
  private async handleLog(deviceId: string, payload: Buffer): Promise<void> {
    try {
      const log = JSON.parse(payload.toString());

      this.logger.info({ deviceId, log }, 'Device log received');
      this.emit('device:log', { deviceId, log });
    } catch (error) {
      this.logger.error({ error, deviceId }, 'Failed to handle log');
    }
  }

  /**
   * Calculate shadow delta (desired - reported)
   */
  private calculateShadowDelta(
    reported: Record<string, any>,
    desired: Record<string, any>
  ): Record<string, any> {
    const delta: Record<string, any> = {};

    for (const key in desired) {
      if (desired[key] !== reported[key]) {
        delta[key] = desired[key];
      }
    }

    return delta;
  }

  /**
   * Publish message to device
   */
  publishToDevice(deviceId: string, subtopic: string, payload: any): void {
    const topic = `devices/${deviceId}/${subtopic}`;
    const message = {
      topic,
      payload: JSON.stringify(payload),
      qos: 1,
      retain: false,
    };

    this.broker.publish(message as any, (err) => {
      if (err) {
        this.logger.error({ err, deviceId, topic }, 'Failed to publish message');
      } else {
        this.logger.debug({ deviceId, topic }, 'Message published');
      }
    });
  }

  /**
   * Send command to device
   */
  sendCommand(deviceId: string, command: string, params: any): void {
    this.publishToDevice(deviceId, 'commands', {
      command,
      params,
      timestamp: Date.now(),
    });

    this.emit('command:sent', { deviceId, command, params });
  }

  /**
   * Update device shadow (desired state)
   */
  async updateDeviceShadow(deviceId: string, desired: Record<string, any>): Promise<void> {
    await this.deviceManager.updateShadowDesired(deviceId, desired);

    // Notify device
    this.publishToDevice(deviceId, 'shadow/update', {
      state: { desired },
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast message to all devices
   */
  broadcast(subtopic: string, payload: any): void {
    const topic = `broadcast/${subtopic}`;
    const message = {
      topic,
      payload: JSON.stringify(payload),
      qos: 0,
      retain: false,
    };

    this.broker.publish(message as any, (err) => {
      if (err) {
        this.logger.error({ err, topic }, 'Failed to broadcast message');
      }
    });
  }

  /**
   * Start MQTT broker
   */
  async start(): Promise<void> {
    if (this.running) {
      this.logger.warn('MQTT broker already running');
      return;
    }

    // Start TCP server
    this.tcpServer = createServer(this.broker.handle);
    await new Promise<void>((resolve) => {
      this.tcpServer!.listen(this.config.port, () => {
        this.logger.info({ port: this.config.port }, 'MQTT TCP server started');
        resolve();
      });
    });

    // Start WebSocket server
    this.httpServer = createHttpServer();
    this.wsServer = new ws.Server({ server: this.httpServer });

    this.wsServer.on('connection', (socket) => {
      const stream = ws.createWebSocketStream(socket);
      this.broker.handle(stream as any);
    });

    await new Promise<void>((resolve) => {
      this.httpServer!.listen(this.config.wsPort, () => {
        this.logger.info({ port: this.config.wsPort }, 'MQTT WebSocket server started');
        resolve();
      });
    });

    this.running = true;

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Stop MQTT broker
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.logger.info('Stopping MQTT broker...');

    // Close servers
    if (this.tcpServer) {
      this.tcpServer.close();
    }

    if (this.httpServer) {
      this.httpServer.close();
    }

    if (this.wsServer) {
      this.wsServer.close();
    }

    // Close broker
    await new Promise<void>((resolve) => {
      this.broker.close(() => {
        this.logger.info('MQTT broker stopped');
        resolve();
      });
    });

    this.running = false;
  }

  /**
   * Check if broker is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get active connection count
   */
  getConnectionCount(): number {
    return this.clients.size;
  }

  /**
   * Get client sessions
   */
  getClients(): ClientSession[] {
    return Array.from(this.clients.values());
  }

  /**
   * Start cleanup interval for rate limiters
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [clientId, limiter] of this.rateLimiters.entries()) {
        if (now > limiter.resetAt) {
          this.rateLimiters.delete(clientId);
        }
      }
    }, this.RATE_LIMIT_WINDOW);
  }
}
