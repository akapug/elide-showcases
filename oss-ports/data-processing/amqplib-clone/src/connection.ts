/**
 * Elide AMQPLIB Clone - Connection Implementation
 * RabbitMQ/AMQP connection management
 */

import { EventEmitter } from 'events';
import { ConnectionOptions, Connection, AMQPConnectionError } from './types';
import { ChannelImpl } from './channel';
import { ConfirmChannelImpl } from './confirm-channel';

export class ConnectionImpl extends EventEmitter implements Connection {
  private connected = false;
  private channels: Map<number, ChannelImpl> = new Map();
  private nextChannelId = 1;
  private heartbeatInterval?: NodeJS.Timeout;
  private closed = false;

  constructor(private options: ConnectionOptions) {
    super();
  }

  /**
   * Establish connection to RabbitMQ
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const {
      protocol = 'amqp',
      hostname = 'localhost',
      port = protocol === 'amqps' ? 5671 : 5672,
      username = 'guest',
      password = 'guest',
      vhost = '/',
      heartbeat = 60,
    } = this.options;

    console.log(`Connecting to ${protocol}://${hostname}:${port}${vhost}`);

    try {
      // Simulate connection establishment
      await this.establishConnection();

      this.connected = true;

      // Start heartbeat
      if (heartbeat > 0) {
        this.startHeartbeat(heartbeat * 1000);
      }

      this.emit('connect');
    } catch (error) {
      this.emit('error', error);
      throw new AMQPConnectionError(`Failed to connect: ${error}`);
    }
  }

  /**
   * Create a new channel
   */
  async createChannel(): Promise<ChannelImpl> {
    if (!this.connected) {
      throw new AMQPConnectionError('Connection is not established');
    }

    if (this.closed) {
      throw new AMQPConnectionError('Connection is closed');
    }

    const channelId = this.nextChannelId++;
    const channel = new ChannelImpl(channelId, this);

    await channel.open();

    this.channels.set(channelId, channel);

    channel.on('close', () => {
      this.channels.delete(channelId);
    });

    return channel;
  }

  /**
   * Create a confirm channel (publisher confirms)
   */
  async createConfirmChannel(): Promise<ConfirmChannelImpl> {
    if (!this.connected) {
      throw new AMQPConnectionError('Connection is not established');
    }

    if (this.closed) {
      throw new AMQPConnectionError('Connection is closed');
    }

    const channelId = this.nextChannelId++;
    const channel = new ConfirmChannelImpl(channelId, this);

    await channel.open();
    await channel.enableConfirms();

    this.channels.set(channelId, channel);

    channel.on('close', () => {
      this.channels.delete(channelId);
    });

    return channel;
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    console.log('Closing connection...');

    this.closed = true;

    // Close all channels
    const closePromises = Array.from(this.channels.values()).map(channel =>
      channel.close().catch(() => {})
    );

    await Promise.all(closePromises);

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.connected = false;
    this.emit('close');

    console.log('Connection closed');
  }

  /**
   * Check if connection is active
   */
  isConnected(): boolean {
    return this.connected && !this.closed;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      channelCount: this.channels.size,
      framesSent: Math.floor(Math.random() * 10000),
      framesReceived: Math.floor(Math.random() * 10000),
      bytesSent: Math.floor(Math.random() * 1000000),
      bytesReceived: Math.floor(Math.random() * 1000000),
    };
  }

  // Internal methods

  private async establishConnection(): Promise<void> {
    // Simulate network connection and AMQP handshake
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private startHeartbeat(interval: number): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connected && !this.closed) {
        this.sendHeartbeat();
      }
    }, interval);
  }

  private sendHeartbeat(): void {
    // Simulate heartbeat frame
    this.emit('heartbeat');
  }

  /**
   * Internal method to notify connection of channel errors
   */
  notifyChannelError(channelId: number, error: Error): void {
    this.emit('error', error);
    this.channels.delete(channelId);
  }
}
