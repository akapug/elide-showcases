/**
 * Elide IoT Platform - MQTT Handler
 *
 * MQTT protocol handling for IoT device communication.
 * Supports pub/sub patterns, QoS levels, and message routing.
 */

import { MQTTConfig, DeviceId, Event, EventType, EventSeverity } from '../types';

// ============================================================================
// MQTT Handler Implementation
// ============================================================================

export class MQTTHandler {
  private subscriptions: Map<string, Set<MessageCallback>> = new Map();
  private connected: boolean = false;
  private messageQueue: QueuedMessage[] = [];
  private stats: MQTTStats = {
    messagesSent: 0,
    messagesReceived: 0,
    bytesTransferred: 0,
    errors: 0
  };

  constructor(private config: MQTTConfig) {}

  async connect(): Promise<void> {
    // Simulate MQTT connection
    this.connected = true;
    console.log(`Connected to MQTT broker: ${this.config.broker}`);
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.subscriptions.clear();
  }

  async subscribe(
    topic: string,
    callback: MessageCallback,
    qos?: 0 | 1 | 2
  ): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to MQTT broker');
    }

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }

    this.subscriptions.get(topic)!.add(callback);
  }

  async unsubscribe(topic: string, callback?: MessageCallback): Promise<void> {
    if (callback) {
      this.subscriptions.get(topic)?.delete(callback);
    } else {
      this.subscriptions.delete(topic);
    }
  }

  async publish(
    topic: string,
    message: any,
    options?: PublishOptions
  ): Promise<void> {
    if (!this.connected && options?.qos !== 0) {
      // Queue message for later delivery
      this.queueMessage(topic, message, options);
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    const size = Buffer.byteLength(payload);

    // Update stats
    this.stats.messagesSent++;
    this.stats.bytesTransferred += size;

    // Simulate message delivery to subscribers
    await this.deliverMessage(topic, payload);
  }

  private async deliverMessage(topic: string, message: string): Promise<void> {
    // Find matching subscribers (including wildcards)
    const callbacks = this.findMatchingSubscribers(topic);

    for (const callback of callbacks) {
      try {
        await callback(topic, Buffer.from(message));
        this.stats.messagesReceived++;
      } catch (error) {
        this.stats.errors++;
        console.error('Error in message callback:', error);
      }
    }
  }

  private findMatchingSubscribers(topic: string): Set<MessageCallback> {
    const matches = new Set<MessageCallback>();

    for (const [pattern, callbacks] of this.subscriptions) {
      if (this.topicMatches(topic, pattern)) {
        callbacks.forEach(cb => matches.add(cb));
      }
    }

    return matches;
  }

  private topicMatches(topic: string, pattern: string): boolean {
    // Handle MQTT wildcards: + (single level), # (multi-level)
    const topicParts = topic.split('/');
    const patternParts = pattern.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];

      if (patternPart === '#') {
        return true; // Multi-level wildcard matches rest
      }

      if (i >= topicParts.length) {
        return false; // Pattern longer than topic
      }

      if (patternPart !== '+' && patternPart !== topicParts[i]) {
        return false; // No match
      }
    }

    return topicParts.length === patternParts.length;
  }

  private queueMessage(topic: string, message: any, options?: PublishOptions): void {
    this.messageQueue.push({
      topic,
      message,
      options: options || {},
      queuedAt: Date.now()
    });

    // Limit queue size
    if (this.messageQueue.length > 10000) {
      this.messageQueue.shift();
    }
  }

  async processQueue(): Promise<void> {
    if (!this.connected || this.messageQueue.length === 0) {
      return;
    }

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const queued of messages) {
      await this.publish(queued.topic, queued.message, queued.options);
    }
  }

  // ========================================================================
  // Topic Management
  // ========================================================================

  async createDeviceTopics(deviceId: DeviceId): Promise<DeviceTopics> {
    return {
      telemetry: `devices/${deviceId}/telemetry`,
      commands: `devices/${deviceId}/commands`,
      status: `devices/${deviceId}/status`,
      shadow: `devices/${deviceId}/shadow`,
      events: `devices/${deviceId}/events`
    };
  }

  async subscribeToDevice(
    deviceId: DeviceId,
    handlers: DeviceHandlers
  ): Promise<void> {
    const topics = await this.createDeviceTopics(deviceId);

    if (handlers.onTelemetry) {
      await this.subscribe(topics.telemetry, async (topic, message) => {
        const data = JSON.parse(message.toString());
        await handlers.onTelemetry!(data);
      });
    }

    if (handlers.onStatus) {
      await this.subscribe(topics.status, async (topic, message) => {
        const status = JSON.parse(message.toString());
        await handlers.onStatus!(status);
      });
    }

    if (handlers.onEvent) {
      await this.subscribe(topics.events, async (topic, message) => {
        const event = JSON.parse(message.toString());
        await handlers.onEvent!(event);
      });
    }
  }

  async publishDeviceCommand(
    deviceId: DeviceId,
    command: any
  ): Promise<void> {
    const topics = await this.createDeviceTopics(deviceId);
    await this.publish(topics.commands, command, { qos: 1 });
  }

  async publishDeviceEvent(
    deviceId: DeviceId,
    event: Event
  ): Promise<void> {
    const topics = await this.createDeviceTopics(deviceId);
    await this.publish(topics.events, event, { qos: 0 });
  }

  // ========================================================================
  // Pattern: Request-Response
  // ========================================================================

  async request(topic: string, message: any, timeout: number = 5000): Promise<any> {
    const responseTopic = `${topic}/response/${Date.now()}`;
    let responseReceived = false;
    let response: any;

    // Subscribe to response topic
    const callback = async (t: string, msg: Buffer) => {
      response = JSON.parse(msg.toString());
      responseReceived = true;
    };

    await this.subscribe(responseTopic, callback);

    // Publish request
    await this.publish(topic, {
      ...message,
      responseTopic
    });

    // Wait for response
    const startTime = Date.now();
    while (!responseReceived && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Cleanup
    await this.unsubscribe(responseTopic, callback);

    if (!responseReceived) {
      throw new Error('Request timeout');
    }

    return response;
  }

  // ========================================================================
  // Statistics
  // ========================================================================

  getStats(): MQTTStats {
    return { ...this.stats };
  }

  getThroughput(): number {
    // Messages per second (simplified)
    return this.stats.messagesSent + this.stats.messagesReceived;
  }

  resetStats(): void {
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      errors: 0
    };
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

type MessageCallback = (topic: string, message: Buffer) => Promise<void> | void;

interface PublishOptions {
  qos?: 0 | 1 | 2;
  retain?: boolean;
}

interface QueuedMessage {
  topic: string;
  message: any;
  options: PublishOptions;
  queuedAt: number;
}

interface MQTTStats {
  messagesSent: number;
  messagesReceived: number;
  bytesTransferred: number;
  errors: number;
}

interface DeviceTopics {
  telemetry: string;
  commands: string;
  status: string;
  shadow: string;
  events: string;
}

interface DeviceHandlers {
  onTelemetry?: (data: any) => Promise<void> | void;
  onStatus?: (status: any) => Promise<void> | void;
  onEvent?: (event: Event) => Promise<void> | void;
}
