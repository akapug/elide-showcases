/**
 * Elide AMQPLIB Clone - Confirm Channel Implementation
 * Publisher confirms for reliable message delivery
 */

import { ChannelImpl } from './channel';
import { ConfirmChannel, PublishOptions, AMQPChannelError } from './types';
import type { ConnectionImpl } from './connection';

export class ConfirmChannelImpl extends ChannelImpl implements ConfirmChannel {
  private confirmEnabled = false;
  private nextPublishSeqNo = 1;
  private pendingConfirms: Map<number, PendingConfirm> = new Map();

  constructor(channelId: number, connection: ConnectionImpl) {
    super(channelId, connection);
  }

  /**
   * Enable publisher confirms on this channel
   */
  async enableConfirms(): Promise<void> {
    this.ensureOpen();

    console.log('Enabling publisher confirms');

    await new Promise(resolve => setTimeout(resolve, 10));

    this.confirmEnabled = true;
  }

  /**
   * Publish with confirmation callback
   */
  publish(
    exchange: string,
    routingKey: string,
    content: Buffer,
    options: PublishOptions = {},
    callback?: (err: Error | null, ok: boolean) => void
  ): boolean {
    this.ensureOpen();

    if (!this.confirmEnabled) {
      throw new AMQPChannelError('Publisher confirms are not enabled on this channel');
    }

    // Call parent publish
    const result = super.publish(exchange, routingKey, content, options);

    // Track confirmation
    const seqNo = this.nextPublishSeqNo++;

    if (callback) {
      this.pendingConfirms.set(seqNo, {
        seqNo,
        callback,
        timestamp: Date.now(),
      });

      // Simulate async confirmation
      setImmediate(() => this.confirmPublish(seqNo));
    }

    return result;
  }

  /**
   * Send to queue with confirmation callback
   */
  sendToQueue(
    queue: string,
    content: Buffer,
    options: PublishOptions = {},
    callback?: (err: Error | null, ok: boolean) => void
  ): boolean {
    this.ensureOpen();

    if (!this.confirmEnabled) {
      throw new AMQPChannelError('Publisher confirms are not enabled on this channel');
    }

    // Call parent sendToQueue
    const result = super.sendToQueue(queue, content, options);

    // Track confirmation
    const seqNo = this.nextPublishSeqNo++;

    if (callback) {
      this.pendingConfirms.set(seqNo, {
        seqNo,
        callback,
        timestamp: Date.now(),
      });

      // Simulate async confirmation
      setImmediate(() => this.confirmPublish(seqNo));
    }

    return result;
  }

  /**
   * Wait for all pending confirms
   */
  async waitForConfirms(): Promise<void> {
    this.ensureOpen();

    if (!this.confirmEnabled) {
      throw new AMQPChannelError('Publisher confirms are not enabled on this channel');
    }

    if (this.pendingConfirms.size === 0) {
      return;
    }

    console.log(`Waiting for ${this.pendingConfirms.size} confirmations...`);

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.pendingConfirms.size === 0) {
          clearInterval(checkInterval);
          resolve();
        }

        // Check for timeouts
        const now = Date.now();
        for (const [seqNo, pending] of this.pendingConfirms) {
          if (now - pending.timestamp > 30000) {
            clearInterval(checkInterval);
            this.pendingConfirms.clear();
            reject(new AMQPChannelError('Confirmation timeout'));
            return;
          }
        }
      }, 100);
    });
  }

  /**
   * Close channel and wait for confirms
   */
  async close(): Promise<void> {
    if (this.confirmEnabled && this.pendingConfirms.size > 0) {
      try {
        await this.waitForConfirms();
      } catch (error) {
        console.error('Error waiting for confirms during close:', error);
      }
    }

    await super.close();
  }

  // Internal methods

  private confirmPublish(seqNo: number): void {
    const pending = this.pendingConfirms.get(seqNo);

    if (!pending) {
      return;
    }

    // Simulate confirmation (always successful in this implementation)
    pending.callback(null, true);

    this.pendingConfirms.delete(seqNo);
  }
}

interface PendingConfirm {
  seqNo: number;
  callback: (err: Error | null, ok: boolean) => void;
  timestamp: number;
}
