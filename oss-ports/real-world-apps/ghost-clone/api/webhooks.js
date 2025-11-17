/**
 * Webhook Manager
 *
 * Manages webhooks for various events (post published, user created, etc.)
 * Triggers HTTP requests to configured endpoints.
 */

import { fetch } from 'elide:http';
import { createHmac } from 'crypto';

export class WebhookManager {
  constructor(db) {
    this.db = db;
    this.events = [
      'post.published',
      'post.unpublished',
      'post.deleted',
      'page.published',
      'page.deleted',
      'user.created',
      'user.deleted',
    ];
  }

  async initialize() {
    console.log('🔔 Webhook manager initialized');
  }

  async list(req, res) {
    const webhooks = await this.db.query(
      'SELECT * FROM webhooks ORDER BY created_at DESC'
    );

    return { webhooks };
  }

  async create(req, res) {
    const data = await req.json();

    if (!data.event || !this.events.includes(data.event)) {
      throw {
        status: 400,
        code: 'INVALID_EVENT',
        message: `Event must be one of: ${this.events.join(', ')}`,
      };
    }

    if (!data.target_url) {
      throw {
        status: 400,
        code: 'MISSING_URL',
        message: 'Target URL is required',
      };
    }

    // Generate secret for signature verification
    if (!data.secret) {
      data.secret = this.generateSecret();
    }

    const now = new Date().toISOString();
    data.created_at = now;
    data.updated_at = now;
    data.status = 'active';

    const webhookId = await this.db.create('webhooks', data);
    const webhook = await this.db.findById('webhooks', webhookId);

    return { webhook };
  }

  async delete(req, res) {
    const { id } = req.params;

    const webhook = await this.db.findById('webhooks', id);

    if (!webhook) {
      throw {
        status: 404,
        code: 'WEBHOOK_NOT_FOUND',
        message: 'Webhook not found',
      };
    }

    await this.db.delete('webhooks', id);

    return { success: true };
  }

  async trigger(event, data) {
    // Get active webhooks for this event
    const webhooks = await this.db.query(
      'SELECT * FROM webhooks WHERE event = ? AND status = ?',
      [event, 'active']
    );

    if (webhooks.length === 0) {
      return;
    }

    console.log(`🔔 Triggering ${webhooks.length} webhook(s) for event: ${event}`);

    // Trigger webhooks in parallel
    const promises = webhooks.map(webhook => this.triggerWebhook(webhook, event, data));

    await Promise.allSettled(promises);
  }

  async triggerWebhook(webhook, event, data) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const payloadString = JSON.stringify(payload);

    // Generate signature
    const signature = createHmac('sha256', webhook.secret)
      .update(payloadString)
      .digest('hex');

    try {
      const response = await fetch(webhook.target_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': signature,
          'User-Agent': 'Ghost-Clone-Webhooks/1.0',
        },
        body: payloadString,
        timeout: 10000, // 10 seconds
      });

      const status = response.ok ? 'success' : 'failed';

      await this.db.update('webhooks', webhook.id, {
        last_triggered_at: new Date().toISOString(),
        last_triggered_status: status,
        last_triggered_error: response.ok ? null : await response.text(),
      });

      console.log(`  ✓ Webhook ${webhook.id} → ${status}`);
    } catch (error) {
      await this.db.update('webhooks', webhook.id, {
        last_triggered_at: new Date().toISOString(),
        last_triggered_status: 'error',
        last_triggered_error: error.message,
      });

      console.error(`  ✗ Webhook ${webhook.id} → error:`, error.message);
    }
  }

  generateSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
