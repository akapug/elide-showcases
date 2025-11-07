/**
 * Multi-Channel Notification Hub
 *
 * A production-ready notification service with support for Email, SMS, Push notifications,
 * template management, scheduling, delivery tracking, and rate limiting.
 *
 * Features:
 * - Multi-channel delivery (Email, SMS, Push, Webhook)
 * - Template management with variable substitution
 * - Scheduling and delayed delivery
 * - Delivery tracking and analytics
 * - Rate limiting and throttling
 * - Retry logic with exponential backoff
 * - Batch notifications
 * - User preferences and opt-out management
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'webhook';
  enabled: boolean;
  config: any;
  rateLimits?: RateLimit;
}

interface RateLimit {
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
}

interface Template {
  id: string;
  name: string;
  channel: NotificationChannel['type'];
  subject?: string;
  body: string;
  variables: string[];
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationRequest {
  id: string;
  userId: string;
  channel: NotificationChannel['type'];
  templateId?: string;
  subject?: string;
  message: string;
  variables?: Record<string, string>;
  metadata?: Record<string, any>;
  scheduledFor?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date;
}

interface NotificationDelivery {
  id: string;
  notificationId: string;
  userId: string;
  channel: NotificationChannel['type'];
  status: 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  error?: string;
  providerResponse?: any;
}

interface UserPreferences {
  userId: string;
  channels: {
    email?: { enabled: boolean; address?: string };
    sms?: { enabled: boolean; phoneNumber?: string };
    push?: { enabled: boolean; deviceTokens?: string[] };
  };
  optOuts: string[]; // Template IDs or categories
  quietHours?: { start: string; end: string; timezone: string };
  frequency?: 'instant' | 'digest_hourly' | 'digest_daily' | 'digest_weekly';
  updatedAt: Date;
}

interface BatchRequest {
  id: string;
  userIds: string[];
  channel: NotificationChannel['type'];
  templateId: string;
  variables?: Record<string, Record<string, string>>; // userId -> variables
  scheduledFor?: Date;
  createdAt: Date;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
}

interface DeliveryStats {
  total: number;
  queued: number;
  sent: number;
  failed: number;
  cancelled: number;
  successRate: number;
  avgDeliveryTime: number;
}

// ============================================================================
// Template Engine
// ============================================================================

class TemplateEngine {
  private templates: Map<string, Template> = new Map();

  createTemplate(
    name: string,
    channel: NotificationChannel['type'],
    body: string,
    subject?: string,
    locale: string = 'en'
  ): Template {
    // Extract variables from template ({{variableName}})
    const variables = this.extractVariables(body);
    if (subject) {
      variables.push(...this.extractVariables(subject));
    }

    const template: Template = {
      id: randomUUID(),
      name,
      channel,
      subject,
      body,
      variables: Array.from(new Set(variables)),
      locale,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(template.id, template);
    return template;
  }

  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(channel?: NotificationChannel['type']): Template[] {
    const templates = Array.from(this.templates.values());
    return channel ? templates.filter(t => t.channel === channel) : templates;
  }

  render(templateId: string, variables: Record<string, string>): { subject?: string; body: string } {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const body = this.substitute(template.body, variables);
    const subject = template.subject ? this.substitute(template.subject, variables) : undefined;

    return { subject, body };
  }

  private substitute(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  private extractVariables(text: string): string[] {
    const matches = text.matchAll(/\{\{(\w+)\}\}/g);
    return Array.from(matches, m => m[1]);
  }

  updateTemplate(id: string, updates: Partial<Template>): Template | undefined {
    const template = this.templates.get(id);
    if (!template) return undefined;

    Object.assign(template, updates, { updatedAt: new Date() });

    if (updates.body || updates.subject) {
      const variables = this.extractVariables(updates.body || template.body);
      if (updates.subject || template.subject) {
        variables.push(...this.extractVariables(updates.subject || template.subject!));
      }
      template.variables = Array.from(new Set(variables));
    }

    return template;
  }
}

// ============================================================================
// Channel Providers
// ============================================================================

class EmailProvider {
  async send(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // In production, integrate with SendGrid, AWS SES, Mailgun, etc.
    console.log(`[Email] Sending to ${to}: ${subject}`);

    // Simulate delivery
    const success = Math.random() > 0.05; // 95% success rate

    return success
      ? { success: true, messageId: `email_${randomUUID()}` }
      : { success: false, error: 'Failed to send email' };
  }
}

class SMSProvider {
  async send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // In production, integrate with Twilio, AWS SNS, Nexmo, etc.
    console.log(`[SMS] Sending to ${to}: ${message}`);

    // Simulate delivery
    const success = Math.random() > 0.05; // 95% success rate

    return success
      ? { success: true, messageId: `sms_${randomUUID()}` }
      : { success: false, error: 'Failed to send SMS' };
  }
}

class PushProvider {
  async send(deviceTokens: string[], title: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // In production, integrate with FCM, APNs, OneSignal, etc.
    console.log(`[Push] Sending to ${deviceTokens.length} devices: ${title}`);

    // Simulate delivery
    const success = Math.random() > 0.05; // 95% success rate

    return success
      ? { success: true, messageId: `push_${randomUUID()}` }
      : { success: false, error: 'Failed to send push notification' };
  }
}

class WebhookProvider {
  async send(url: string, payload: any): Promise<{ success: boolean; response?: any; error?: string }> {
    // In production, make actual HTTP request
    console.log(`[Webhook] Sending to ${url}`);

    // Simulate delivery
    const success = Math.random() > 0.1; // 90% success rate

    return success
      ? { success: true, response: { status: 'received' } }
      : { success: false, error: 'Webhook delivery failed' };
  }
}

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private counters: Map<string, { minute: number[]; hour: number[]; day: number[] }> = new Map();

  canSend(key: string, limits: RateLimit): boolean {
    const now = Date.now();
    const counter = this.counters.get(key) || { minute: [], hour: [], day: [] };

    // Clean old timestamps
    counter.minute = counter.minute.filter(t => now - t < 60 * 1000);
    counter.hour = counter.hour.filter(t => now - t < 60 * 60 * 1000);
    counter.day = counter.day.filter(t => now - t < 24 * 60 * 60 * 1000);

    // Check limits
    if (counter.minute.length >= limits.maxPerMinute) return false;
    if (counter.hour.length >= limits.maxPerHour) return false;
    if (counter.day.length >= limits.maxPerDay) return false;

    // Record send
    counter.minute.push(now);
    counter.hour.push(now);
    counter.day.push(now);

    this.counters.set(key, counter);
    return true;
  }

  reset(key: string): void {
    this.counters.delete(key);
  }

  getStats(key: string): { minute: number; hour: number; day: number } {
    const now = Date.now();
    const counter = this.counters.get(key) || { minute: [], hour: [], day: [] };

    return {
      minute: counter.minute.filter(t => now - t < 60 * 1000).length,
      hour: counter.hour.filter(t => now - t < 60 * 60 * 1000).length,
      day: counter.day.filter(t => now - t < 24 * 60 * 60 * 1000).length,
    };
  }
}

// ============================================================================
// Notification Queue
// ============================================================================

class NotificationQueue extends EventEmitter {
  private queue: NotificationRequest[] = [];
  private processing: boolean = false;
  private maxConcurrent: number = 10;
  private activeJobs: number = 0;

  enqueue(request: NotificationRequest): void {
    this.queue.push(request);
    this.queue.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.emit('enqueued', request);
    this.process();
  }

  private async process(): Promise<void> {
    if (this.processing && this.activeJobs >= this.maxConcurrent) return;

    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs < this.maxConcurrent) {
      const request = this.queue.shift();
      if (!request) continue;

      // Check if scheduled for future
      if (request.scheduledFor && request.scheduledFor.getTime() > Date.now()) {
        // Re-queue for later
        setTimeout(() => this.enqueue(request), request.scheduledFor.getTime() - Date.now());
        continue;
      }

      this.activeJobs++;
      this.emit('processing', request);

      // Process in background
      this.processRequest(request).finally(() => {
        this.activeJobs--;
        this.process();
      });
    }

    if (this.queue.length === 0 && this.activeJobs === 0) {
      this.processing = false;
    }
  }

  private async processRequest(request: NotificationRequest): Promise<void> {
    // Emit for external processing
    this.emit('process', request);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getActiveJobs(): number {
    return this.activeJobs;
  }
}

// ============================================================================
// Notification Hub
// ============================================================================

class NotificationHub extends EventEmitter {
  private templateEngine: TemplateEngine;
  private emailProvider: EmailProvider;
  private smsProvider: SMSProvider;
  private pushProvider: PushProvider;
  private webhookProvider: WebhookProvider;
  private rateLimiter: RateLimiter;
  private queue: NotificationQueue;

  private requests: Map<string, NotificationRequest> = new Map();
  private deliveries: Map<string, NotificationDelivery> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();
  private batches: Map<string, BatchRequest> = new Map();

  private channels: Map<NotificationChannel['type'], NotificationChannel> = new Map();

  constructor() {
    super();
    this.templateEngine = new TemplateEngine();
    this.emailProvider = new EmailProvider();
    this.smsProvider = new SMSProvider();
    this.pushProvider = new PushProvider();
    this.webhookProvider = new WebhookProvider();
    this.rateLimiter = new RateLimiter();
    this.queue = new NotificationQueue();

    this.setupChannels();
    this.setupQueueProcessing();
  }

  private setupChannels(): void {
    this.channels.set('email', {
      type: 'email',
      enabled: true,
      config: {},
      rateLimits: { maxPerMinute: 100, maxPerHour: 1000, maxPerDay: 10000 },
    });

    this.channels.set('sms', {
      type: 'sms',
      enabled: true,
      config: {},
      rateLimits: { maxPerMinute: 50, maxPerHour: 500, maxPerDay: 5000 },
    });

    this.channels.set('push', {
      type: 'push',
      enabled: true,
      config: {},
      rateLimits: { maxPerMinute: 500, maxPerHour: 5000, maxPerDay: 50000 },
    });

    this.channels.set('webhook', {
      type: 'webhook',
      enabled: true,
      config: {},
      rateLimits: { maxPerMinute: 100, maxPerHour: 1000, maxPerDay: 10000 },
    });
  }

  private setupQueueProcessing(): void {
    this.queue.on('process', async (request: NotificationRequest) => {
      await this.processNotification(request);
    });
  }

  async send(
    userId: string,
    channel: NotificationChannel['type'],
    message: string,
    options: {
      templateId?: string;
      variables?: Record<string, string>;
      subject?: string;
      scheduledFor?: Date;
      priority?: NotificationRequest['priority'];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<NotificationRequest> {
    // Check user preferences
    const prefs = this.userPreferences.get(userId);
    if (prefs) {
      if (!this.checkUserPreferences(prefs, channel, options.templateId)) {
        throw new Error('User has opted out of this notification');
      }
    }

    const request: NotificationRequest = {
      id: randomUUID(),
      userId,
      channel,
      templateId: options.templateId,
      subject: options.subject,
      message,
      variables: options.variables,
      metadata: options.metadata,
      scheduledFor: options.scheduledFor,
      priority: options.priority || 'normal',
      createdAt: new Date(),
    };

    this.requests.set(request.id, request);
    this.queue.enqueue(request);

    return request;
  }

  async sendBatch(
    userIds: string[],
    channel: NotificationChannel['type'],
    templateId: string,
    variables?: Record<string, Record<string, string>>,
    scheduledFor?: Date
  ): Promise<BatchRequest> {
    const batch: BatchRequest = {
      id: randomUUID(),
      userIds,
      channel,
      templateId,
      variables,
      scheduledFor,
      createdAt: new Date(),
      status: 'queued',
      progress: 0,
    };

    this.batches.set(batch.id, batch);
    this.processBatch(batch);

    return batch;
  }

  private async processBatch(batch: BatchRequest): Promise<void> {
    batch.status = 'processing';

    for (let i = 0; i < batch.userIds.length; i++) {
      const userId = batch.userIds[i];
      const userVariables = batch.variables?.[userId] || {};

      try {
        await this.send(userId, batch.channel, '', {
          templateId: batch.templateId,
          variables: userVariables,
          scheduledFor: batch.scheduledFor,
          priority: 'normal',
        });

        batch.progress = Math.round(((i + 1) / batch.userIds.length) * 100);
      } catch (error) {
        console.error(`Failed to send to user ${userId}:`, error);
      }
    }

    batch.status = 'completed';
    batch.progress = 100;
  }

  private async processNotification(request: NotificationRequest): Promise<void> {
    const delivery: NotificationDelivery = {
      id: randomUUID(),
      notificationId: request.id,
      userId: request.userId,
      channel: request.channel,
      status: 'queued',
      attempts: 0,
    };

    this.deliveries.set(delivery.id, delivery);

    // Check rate limits
    const channelConfig = this.channels.get(request.channel);
    if (channelConfig?.rateLimits) {
      const canSend = this.rateLimiter.canSend(
        `${request.userId}:${request.channel}`,
        channelConfig.rateLimits
      );

      if (!canSend) {
        delivery.status = 'failed';
        delivery.error = 'Rate limit exceeded';
        delivery.failedAt = new Date();
        return;
      }
    }

    // Render template if needed
    let subject = request.subject;
    let message = request.message;

    if (request.templateId) {
      const rendered = this.templateEngine.render(request.templateId, request.variables || {});
      subject = rendered.subject;
      message = rendered.body;
    }

    // Send via appropriate provider
    delivery.status = 'sending';
    delivery.attempts++;

    try {
      let result;

      switch (request.channel) {
        case 'email':
          const prefs = this.userPreferences.get(request.userId);
          const email = prefs?.channels.email?.address || 'user@example.com';
          result = await this.emailProvider.send(email, subject || 'Notification', message);
          break;

        case 'sms':
          const smsPrefs = this.userPreferences.get(request.userId);
          const phone = smsPrefs?.channels.sms?.phoneNumber || '+1234567890';
          result = await this.smsProvider.send(phone, message);
          break;

        case 'push':
          const pushPrefs = this.userPreferences.get(request.userId);
          const tokens = pushPrefs?.channels.push?.deviceTokens || [];
          result = await this.pushProvider.send(tokens, subject || 'Notification', message);
          break;

        case 'webhook':
          const webhookUrl = request.metadata?.webhookUrl || 'https://example.com/webhook';
          result = await this.webhookProvider.send(webhookUrl, {
            userId: request.userId,
            message,
            metadata: request.metadata,
          });
          break;
      }

      if (result.success) {
        delivery.status = 'sent';
        delivery.sentAt = new Date();
        delivery.deliveredAt = new Date();
        delivery.providerResponse = result;
        this.emit('notificationSent', delivery);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      delivery.status = 'failed';
      delivery.error = error.message;
      delivery.failedAt = new Date();
      this.emit('notificationFailed', delivery);

      // Retry logic
      if (delivery.attempts < 3) {
        const delay = Math.pow(2, delivery.attempts) * 1000;
        setTimeout(() => this.processNotification(request), delay);
      }
    }
  }

  private checkUserPreferences(
    prefs: UserPreferences,
    channel: NotificationChannel['type'],
    templateId?: string
  ): boolean {
    // Check if channel is enabled
    const channelPrefs = prefs.channels[channel];
    if (channelPrefs && !channelPrefs.enabled) {
      return false;
    }

    // Check opt-outs
    if (templateId && prefs.optOuts.includes(templateId)) {
      return false;
    }

    // Check quiet hours
    if (prefs.quietHours) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (currentTime >= prefs.quietHours.start && currentTime <= prefs.quietHours.end) {
        return false;
      }
    }

    return true;
  }

  setUserPreferences(userId: string, preferences: Partial<UserPreferences>): UserPreferences {
    const existing = this.userPreferences.get(userId) || {
      userId,
      channels: {},
      optOuts: [],
      updatedAt: new Date(),
    };

    const updated = {
      ...existing,
      ...preferences,
      userId,
      updatedAt: new Date(),
    };

    this.userPreferences.set(userId, updated);
    return updated;
  }

  getDeliveryStats(channel?: NotificationChannel['type']): DeliveryStats {
    let deliveries = Array.from(this.deliveries.values());

    if (channel) {
      deliveries = deliveries.filter(d => d.channel === channel);
    }

    const total = deliveries.length;
    const queued = deliveries.filter(d => d.status === 'queued').length;
    const sent = deliveries.filter(d => d.status === 'sent').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;
    const cancelled = deliveries.filter(d => d.status === 'cancelled').length;

    const successRate = total > 0 ? (sent / total) * 100 : 0;

    const deliveryTimes = deliveries
      .filter(d => d.sentAt && d.deliveredAt)
      .map(d => d.deliveredAt!.getTime() - d.sentAt!.getTime());

    const avgDeliveryTime =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0;

    return {
      total,
      queued,
      sent,
      failed,
      cancelled,
      successRate,
      avgDeliveryTime,
    };
  }

  getTemplateEngine(): TemplateEngine {
    return this.templateEngine;
  }

  getDelivery(id: string): NotificationDelivery | undefined {
    return this.deliveries.get(id);
  }

  getUserDeliveries(userId: string): NotificationDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(d => d.userId === userId)
      .sort((a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0));
  }
}

// ============================================================================
// HTTP Server
// ============================================================================

class NotificationServer {
  private hub: NotificationHub;
  private httpServer: any;

  constructor() {
    this.hub = new NotificationHub();
    this.httpServer = createServer((req, res) => this.handleRequest(req, res));
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    try {
      if (req.method === 'POST' && url.pathname === '/notifications') {
        await this.handleSendNotification(req, res);
      } else if (req.method === 'POST' && url.pathname === '/notifications/batch') {
        await this.handleSendBatch(req, res);
      } else if (req.method === 'POST' && url.pathname === '/templates') {
        await this.handleCreateTemplate(req, res);
      } else if (req.method === 'GET' && url.pathname === '/templates') {
        await this.handleGetTemplates(req, res);
      } else if (req.method === 'POST' && url.pathname.includes('/preferences')) {
        await this.handleSetPreferences(req, res);
      } else if (req.method === 'GET' && url.pathname === '/stats') {
        await this.handleGetStats(req, res);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error: any) {
      console.error('Request error:', error);
      res.writeHead(400);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  private async handleSendNotification(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const data = JSON.parse(body);
    const request = await this.hub.send(
      data.userId,
      data.channel,
      data.message,
      data.options || {}
    );

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(request));
  }

  private async handleSendBatch(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { userIds, channel, templateId, variables, scheduledFor } = JSON.parse(body);
    const batch = await this.hub.sendBatch(userIds, channel, templateId, variables, scheduledFor);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(batch));
  }

  private async handleCreateTemplate(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { name, channel, body: templateBody, subject, locale } = JSON.parse(body);
    const template = this.hub.getTemplateEngine().createTemplate(
      name,
      channel,
      templateBody,
      subject,
      locale
    );

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(template));
  }

  private async handleGetTemplates(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const templates = this.hub.getTemplateEngine().getAllTemplates();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(templates));
  }

  private async handleSetPreferences(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const data = JSON.parse(body);
    const preferences = this.hub.setUserPreferences(data.userId, data.preferences);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(preferences));
  }

  private async handleGetStats(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const stats = this.hub.getDeliveryStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  }

  start(port: number = 3004): void {
    this.httpServer.listen(port, () => {
      console.log(`Notification Hub running on port ${port}`);
    });
  }
}

// ============================================================================
// Bootstrap
// ============================================================================

if (require.main === module) {
  const server = new NotificationServer();
  server.start(3004);
}

export { NotificationServer, NotificationHub, TemplateEngine, RateLimiter };
