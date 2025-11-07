/**
 * Webhook Manager
 *
 * Handles database webhooks and triggers
 * Calls HTTP endpoints or edge functions on database events
 */

import { DatabaseManager } from '../database/manager';
import { EdgeFunctionRunner } from './edge-functions';
import { WebhookConfig, Webhook, WebhookEvent, WebhookPayload } from '../types';
import { Logger } from '../utils/logger';

/**
 * Webhook delivery attempt
 */
interface DeliveryAttempt {
  webhookId: string;
  payload: WebhookPayload;
  attempt: number;
  success: boolean;
  response?: any;
  error?: string;
  timestamp: Date;
}

/**
 * Webhook manager
 */
export class WebhookManager {
  private config: WebhookConfig;
  private database: DatabaseManager;
  private functions: EdgeFunctionRunner;
  private logger: Logger;
  private webhooks: Map<string, Webhook[]> = new Map(); // table -> webhooks
  private queue: WebhookPayload[] = [];
  private processing: boolean = false;
  private stats = {
    delivered: 0,
    failed: 0,
    retries: 0
  };

  constructor(
    config: WebhookConfig,
    database: DatabaseManager,
    functions: EdgeFunctionRunner,
    logger: Logger
  ) {
    this.config = config;
    this.database = database;
    this.functions = functions;
    this.logger = logger;
  }

  /**
   * Initialize webhook manager
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('Webhooks disabled');
      return;
    }

    this.logger.info('Initializing webhook manager...');

    // Load webhooks from database
    await this.loadWebhooks();

    this.logger.info(`Loaded ${this.getWebhookCount()} webhook(s)`);
  }

  /**
   * Start processing webhook queue
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.processing = true;
    this.processQueue();

    this.logger.info('Webhook manager started');
  }

  /**
   * Stop processing webhook queue
   */
  async stop(): Promise<void> {
    this.processing = false;
    this.logger.info('Webhook manager stopped');
  }

  /**
   * Load webhooks from database
   */
  private async loadWebhooks(): Promise<void> {
    const result = await this.database.select({
      table: 'webhooks',
      filter: [{ column: 'enabled', operator: 'eq', value: 1 }]
    });

    this.webhooks.clear();

    for (const data of result.data) {
      const webhook: Webhook = {
        id: data.id,
        name: data.name,
        table: data.table_name,
        events: JSON.parse(data.events),
        url: data.url,
        functionId: data.function_id,
        headers: data.headers ? JSON.parse(data.headers) : undefined,
        enabled: Boolean(data.enabled),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Group by table
      if (!this.webhooks.has(webhook.table)) {
        this.webhooks.set(webhook.table, []);
      }
      this.webhooks.get(webhook.table)!.push(webhook);
    }
  }

  /**
   * Register a new webhook
   */
  async register(
    name: string,
    table: string,
    events: WebhookEvent[],
    url?: string,
    functionId?: string,
    headers?: Record<string, string>
  ): Promise<Webhook> {
    if (!url && !functionId) {
      throw new Error('Either url or functionId must be provided');
    }

    const webhookId = this.generateId();
    const now = new Date().toISOString();

    const data = {
      id: webhookId,
      name,
      table_name: table,
      events: JSON.stringify(events),
      url,
      function_id: functionId,
      headers: headers ? JSON.stringify(headers) : null,
      enabled: 1,
      created_at: now,
      updated_at: now
    };

    await this.database.insert('webhooks', data);

    const webhook: Webhook = {
      id: webhookId,
      name,
      table,
      events,
      url,
      functionId,
      headers,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to in-memory map
    if (!this.webhooks.has(table)) {
      this.webhooks.set(table, []);
    }
    this.webhooks.get(table)!.push(webhook);

    this.logger.info(`Webhook registered: ${name} for table ${table}`);

    return webhook;
  }

  /**
   * Trigger webhooks for a database event
   */
  async trigger(
    table: string,
    event: WebhookEvent,
    oldRow?: Record<string, any>,
    newRow?: Record<string, any>
  ): Promise<void> {
    const webhooks = this.webhooks.get(table) || [];
    const matchingWebhooks = webhooks.filter(w =>
      w.enabled && w.events.includes(event)
    );

    if (matchingWebhooks.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      event,
      table,
      schema: 'public',
      old: oldRow,
      new: newRow,
      timestamp: new Date()
    };

    // Add to queue for each matching webhook
    for (const webhook of matchingWebhooks) {
      this.queue.push({ ...payload, webhookId: webhook.id } as any);
    }

    this.logger.debug(
      `Queued ${matchingWebhooks.length} webhook(s) for ${event} on ${table}`
    );
  }

  /**
   * Process webhook queue
   */
  private async processQueue(): Promise<void> {
    while (this.processing) {
      if (this.queue.length > 0) {
        const payload = this.queue.shift()!;
        await this.deliver(payload);
      } else {
        // Wait a bit before checking again
        await this.sleep(100);
      }
    }
  }

  /**
   * Deliver a webhook
   */
  private async deliver(payload: WebhookPayload & { webhookId?: string }): Promise<void> {
    if (!payload.webhookId) {
      this.logger.error('Webhook payload missing webhookId');
      return;
    }

    const webhook = this.findWebhookById(payload.webhookId);
    if (!webhook) {
      this.logger.warn(`Webhook not found: ${payload.webhookId}`);
      return;
    }

    let attempt = 0;
    let success = false;

    while (attempt < this.config.retries && !success) {
      attempt++;

      try {
        if (webhook.url) {
          // HTTP webhook
          await this.deliverHTTP(webhook, payload);
        } else if (webhook.functionId) {
          // Function webhook
          await this.deliverFunction(webhook, payload);
        }

        success = true;
        this.stats.delivered++;

        this.logger.debug(
          `Webhook delivered: ${webhook.name} (attempt ${attempt})`
        );
      } catch (error) {
        this.logger.error(
          `Webhook delivery failed: ${webhook.name} (attempt ${attempt})`,
          error
        );

        if (attempt < this.config.retries) {
          this.stats.retries++;
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 1000);
        } else {
          this.stats.failed++;
        }
      }
    }

    // Record delivery attempt
    await this.recordDelivery({
      webhookId: webhook.id,
      payload,
      attempt,
      success,
      timestamp: new Date()
    });
  }

  /**
   * Deliver webhook via HTTP
   */
  private async deliverHTTP(webhook: Webhook, payload: WebhookPayload): Promise<void> {
    if (!webhook.url) {
      throw new Error('Webhook URL not configured');
    }

    // In real implementation, would make HTTP request:
    // const response = await fetch(webhook.url, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-Webhook-Signature': this.generateSignature(payload),
    //     ...webhook.headers
    //   },
    //   body: JSON.stringify(payload),
    //   timeout: this.config.timeout
    // });
    //
    // if (!response.ok) {
    //   throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    // }

    this.logger.debug(`HTTP webhook delivered to ${webhook.url}`);
  }

  /**
   * Deliver webhook via edge function
   */
  private async deliverFunction(webhook: Webhook, payload: WebhookPayload): Promise<void> {
    if (!webhook.functionId) {
      throw new Error('Webhook function not configured');
    }

    // Get function name from database
    const result = await this.database.select({
      table: 'edge_functions',
      filter: [{ column: 'id', operator: 'eq', value: webhook.functionId }]
    });

    if (result.data.length === 0) {
      throw new Error('Webhook function not found');
    }

    const functionName = result.data[0].name;

    // Invoke function
    await this.functions.invoke(functionName, payload);

    this.logger.debug(`Function webhook delivered to ${functionName}`);
  }

  /**
   * Delete a webhook
   */
  async delete(id: string): Promise<void> {
    await this.database.delete('webhooks', id);

    // Remove from in-memory map
    for (const [table, webhooks] of this.webhooks.entries()) {
      const filtered = webhooks.filter(w => w.id !== id);
      if (filtered.length > 0) {
        this.webhooks.set(table, filtered);
      } else {
        this.webhooks.delete(table);
      }
    }

    this.logger.info(`Webhook deleted: ${id}`);
  }

  /**
   * List all webhooks
   */
  async list(): Promise<Webhook[]> {
    const allWebhooks: Webhook[] = [];
    for (const webhooks of this.webhooks.values()) {
      allWebhooks.push(...webhooks);
    }
    return allWebhooks;
  }

  /**
   * Find webhook by ID
   */
  private findWebhookById(id: string): Webhook | null {
    for (const webhooks of this.webhooks.values()) {
      const webhook = webhooks.find(w => w.id === id);
      if (webhook) {
        return webhook;
      }
    }
    return null;
  }

  /**
   * Record delivery attempt
   */
  private async recordDelivery(delivery: DeliveryAttempt): Promise<void> {
    // In real implementation, would store delivery logs in database
    this.logger.debug('Webhook delivery recorded:', delivery);
  }

  /**
   * Generate webhook signature for security
   */
  private generateSignature(payload: WebhookPayload): string {
    // In real implementation, would use HMAC:
    // const crypto = require('crypto');
    // const hmac = crypto.createHmac('sha256', secret);
    // hmac.update(JSON.stringify(payload));
    // return hmac.digest('hex');

    return 'mock_signature';
  }

  /**
   * Get total webhook count
   */
  private getWebhookCount(): number {
    let count = 0;
    for (const webhooks of this.webhooks.values()) {
      count += webhooks.length;
    }
    return count;
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<any> {
    return {
      status: this.config.enabled ? 'healthy' : 'disabled',
      webhooks: this.getWebhookCount(),
      queueSize: this.queue.length,
      processing: this.processing
    };
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<any> {
    return {
      delivered: this.stats.delivered,
      failed: this.stats.failed,
      retries: this.stats.retries,
      successRate: this.stats.delivered + this.stats.failed > 0
        ? this.stats.delivered / (this.stats.delivered + this.stats.failed)
        : 0,
      queueSize: this.queue.length
    };
  }

  /**
   * Sleep for milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
