/**
 * Webhook Emitter
 * Sends webhooks for CMS events
 */

import { getDatabase } from '../database/connection.js';
import { logger } from '../core/logger.js';

class WebhookEmitter {
  constructor() {
    this.logger = logger.child('Webhooks');
    this.queue = [];
    this.processing = false;
  }

  /**
   * Emit webhook event
   */
  async emit(event, data) {
    try {
      // Load webhooks subscribed to this event
      const webhooks = await this.getWebhooksForEvent(event);

      if (webhooks.length === 0) {
        return;
      }

      // Queue webhook deliveries
      for (const webhook of webhooks) {
        this.queue.push({
          webhook,
          event,
          data,
          attempts: 0,
          createdAt: Date.now(),
        });
      }

      // Process queue
      this.processQueue();
    } catch (error) {
      this.logger.error('Failed to emit webhook:', error);
    }
  }

  /**
   * Get webhooks for event
   */
  async getWebhooksForEvent(event) {
    const db = getDatabase();

    const webhooks = await db.query(
      'SELECT * FROM cms_webhooks WHERE enabled = true'
    );

    // Filter by event
    return webhooks.filter(w => {
      const events = JSON.parse(w.events || '[]');
      return events.includes(event) || events.includes('*');
    });
  }

  /**
   * Process webhook queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const delivery = this.queue.shift();

      try {
        await this.deliverWebhook(delivery);
      } catch (error) {
        this.logger.error('Webhook delivery failed:', error);

        // Retry logic
        if (delivery.attempts < 3) {
          delivery.attempts++;
          this.queue.push(delivery);
        } else {
          this.logger.error(`Webhook ${delivery.webhook.id} failed after 3 attempts`);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Deliver single webhook
   */
  async deliverWebhook(delivery) {
    const { webhook, event, data } = delivery;

    const payload = {
      event,
      data,
      createdAt: new Date(delivery.createdAt).toISOString(),
    };

    // Parse headers
    const headers = webhook.headers ? JSON.parse(webhook.headers) : {};

    this.logger.info(`Sending webhook to ${webhook.url}`, {
      event,
      webhookId: webhook.id,
    });

    // In production, use actual HTTP client
    // For now, simulate the request
    const response = await this.simulateHTTPRequest(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Elide-CMS-Webhooks/1.0',
        ...headers,
      },
      body: JSON.stringify(payload),
      timeout: 5000,
    });

    if (response.status >= 200 && response.status < 300) {
      this.logger.info(`Webhook delivered successfully`, {
        webhookId: webhook.id,
        status: response.status,
      });
    } else {
      throw new Error(`Webhook delivery failed with status ${response.status}`);
    }
  }

  /**
   * Simulate HTTP request
   * In production, use actual HTTP client like fetch or axios
   */
  async simulateHTTPRequest(url, options) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    this.logger.debug(`[Simulated] POST ${url}`, {
      body: options.body,
      headers: options.headers,
    });

    return {
      status: 200,
      data: { success: true },
    };
  }
}

export const webhookEmitter = new WebhookEmitter();

/**
 * Webhook Management Service
 */
export class WebhookService {
  /**
   * Create webhook
   */
  async createWebhook(data) {
    const db = getDatabase();

    await db.execute(
      `INSERT INTO cms_webhooks
       (name, url, headers, events, enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.name,
        data.url,
        data.headers ? JSON.stringify(data.headers) : null,
        JSON.stringify(data.events),
        data.enabled !== false,
      ]
    );

    logger.info(`Webhook created: ${data.name}`);
    return true;
  }

  /**
   * Update webhook
   */
  async updateWebhook(id, data) {
    const db = getDatabase();

    await db.execute(
      `UPDATE cms_webhooks
       SET name = ?, url = ?, headers = ?, events = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.name,
        data.url,
        data.headers ? JSON.stringify(data.headers) : null,
        JSON.stringify(data.events),
        data.enabled !== false,
        id,
      ]
    );

    logger.info(`Webhook updated: ${id}`);
    return true;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id) {
    const db = getDatabase();
    await db.execute('DELETE FROM cms_webhooks WHERE id = ?', [id]);
    logger.info(`Webhook deleted: ${id}`);
    return true;
  }

  /**
   * Get all webhooks
   */
  async getAllWebhooks() {
    const db = getDatabase();
    const webhooks = await db.query('SELECT * FROM cms_webhooks ORDER BY name');

    return webhooks.map(w => ({
      ...w,
      headers: w.headers ? JSON.parse(w.headers) : null,
      events: w.events ? JSON.parse(w.events) : [],
    }));
  }

  /**
   * Test webhook
   */
  async testWebhook(id) {
    const db = getDatabase();
    const webhooks = await db.query('SELECT * FROM cms_webhooks WHERE id = ?', [id]);

    if (webhooks.length === 0) {
      throw new Error('Webhook not found');
    }

    await webhookEmitter.emit('test', {
      message: 'Test webhook delivery',
      timestamp: new Date().toISOString(),
    });

    return true;
  }
}
