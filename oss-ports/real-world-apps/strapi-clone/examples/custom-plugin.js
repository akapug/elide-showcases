/**
 * Example: Custom Plugin for Analytics
 * Demonstrates how to create a full-featured plugin
 */

import { Plugin } from '../plugins/registry.js';
import { getDatabase } from '../database/connection.js';
import { lifecycleHooks } from '../webhooks/lifecycle.js';
import { logger } from '../core/logger.js';

export class AnalyticsPlugin extends Plugin {
  constructor() {
    super('analytics', '1.0.0', 'Content analytics and tracking plugin');
    this.logger = logger.child('AnalyticsPlugin');
  }

  /**
   * Initialize plugin
   */
  async initialize() {
    this.logger.info('Initializing analytics plugin');

    // Create analytics table
    await this.createAnalyticsTable();

    // Register lifecycle hooks
    this.registerLifecycleHooks();

    // Register custom routes
    this.routes = [
      {
        method: 'GET',
        path: '/api/analytics/stats',
        handler: this.getStats.bind(this),
      },
      {
        method: 'GET',
        path: '/api/analytics/popular',
        handler: this.getPopularContent.bind(this),
      },
      {
        method: 'POST',
        path: '/api/analytics/track',
        handler: this.trackEvent.bind(this),
      },
    ];

    this.logger.info('Analytics plugin initialized');
  }

  /**
   * Create analytics database table
   */
  async createAnalyticsTable() {
    const db = getDatabase();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS plugin_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type VARCHAR(50) NOT NULL,
        content_type VARCHAR(255),
        content_id INTEGER,
        user_id INTEGER,
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_analytics_content
      ON plugin_analytics(content_type, content_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_analytics_event
      ON plugin_analytics(event_type, created_at)
    `);

    this.logger.info('Analytics table created');
  }

  /**
   * Register lifecycle hooks
   */
  registerLifecycleHooks() {
    // Track content views
    lifecycleHooks.register('*', 'afterFind', async (context) => {
      const { contentType, data } = context;

      if (data && data.id) {
        await this.trackEvent({
          eventType: 'view',
          contentType: contentType.uid,
          contentId: data.id,
        });
      }
    });

    // Track content creation
    lifecycleHooks.register('*', 'afterCreate', async (context) => {
      const { contentType, data } = context;

      await this.trackEvent({
        eventType: 'create',
        contentType: contentType.uid,
        contentId: data.id,
        userId: context.user?.id,
      });
    });

    // Track content updates
    lifecycleHooks.register('*', 'afterUpdate', async (context) => {
      const { contentType, data } = context;

      await this.trackEvent({
        eventType: 'update',
        contentType: contentType.uid,
        contentId: data.id,
        userId: context.user?.id,
      });
    });

    // Track content deletion
    lifecycleHooks.register('*', 'afterDelete', async (context) => {
      const { contentType, data } = context;

      await this.trackEvent({
        eventType: 'delete',
        contentType: contentType.uid,
        contentId: data.id,
        userId: context.user?.id,
      });
    });

    this.logger.info('Lifecycle hooks registered');
  }

  /**
   * Track analytics event
   */
  async trackEvent(eventData) {
    try {
      const db = getDatabase();

      await db.execute(
        `INSERT INTO plugin_analytics
         (event_type, content_type, content_id, user_id, ip_address, user_agent, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          eventData.eventType,
          eventData.contentType || null,
          eventData.contentId || null,
          eventData.userId || null,
          eventData.ipAddress || null,
          eventData.userAgent || null,
          eventData.metadata ? JSON.stringify(eventData.metadata) : null,
        ]
      );
    } catch (error) {
      this.logger.error('Failed to track event:', error);
    }
  }

  /**
   * Get analytics stats
   */
  async getStats(req, res) {
    try {
      const db = getDatabase();
      const { startDate, endDate, contentType } = req.query;

      let sql = `
        SELECT
          event_type,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM plugin_analytics
        WHERE 1=1
      `;
      const params = [];

      if (startDate) {
        sql += ` AND created_at >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        sql += ` AND created_at <= ?`;
        params.push(endDate);
      }

      if (contentType) {
        sql += ` AND content_type = ?`;
        params.push(contentType);
      }

      sql += ` GROUP BY event_type, DATE(created_at) ORDER BY date DESC`;

      const results = await db.query(sql, params);

      // Get totals
      const totalsSql = `
        SELECT
          COUNT(*) as total_events,
          COUNT(DISTINCT content_id) as unique_content,
          COUNT(DISTINCT user_id) as unique_users
        FROM plugin_analytics
        WHERE created_at >= ?
      `;
      const totals = await db.query(totalsSql, [startDate || '2000-01-01']);

      res.json({
        stats: results,
        totals: totals[0],
      });
    } catch (error) {
      this.logger.error('Failed to get stats:', error);
      res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
  }

  /**
   * Get popular content
   */
  async getPopularContent(req, res) {
    try {
      const db = getDatabase();
      const { contentType, limit = 10, period = 7 } = req.query;

      const sql = `
        SELECT
          content_type,
          content_id,
          COUNT(*) as views
        FROM plugin_analytics
        WHERE event_type = 'view'
          AND created_at >= datetime('now', '-${period} days')
          ${contentType ? `AND content_type = '${contentType}'` : ''}
        GROUP BY content_type, content_id
        ORDER BY views DESC
        LIMIT ${limit}
      `;

      const results = await db.query(sql);

      res.json({
        popular: results,
        period: `${period} days`,
      });
    } catch (error) {
      this.logger.error('Failed to get popular content:', error);
      res.status(500).json({ error: 'Failed to retrieve popular content' });
    }
  }

  /**
   * Track custom event (API endpoint)
   */
  async trackEventEndpoint(req, res) {
    try {
      const { eventType, contentType, contentId, metadata } = req.body;

      await this.trackEvent({
        eventType,
        contentType,
        contentId,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata,
      });

      res.json({ success: true });
    } catch (error) {
      this.logger.error('Failed to track event:', error);
      res.status(500).json({ error: 'Failed to track event' });
    }
  }

  /**
   * Extend content types with analytics data
   */
  async extendContentType(contentType) {
    // Add analytics fields to all content types
    contentType.attributes.viewCount = {
      type: 'integer',
      default: 0,
    };

    contentType.attributes.lastViewedAt = {
      type: 'datetime',
    };

    return contentType;
  }

  /**
   * Extend routes
   */
  async extendRoutes(routes) {
    return [...routes, ...this.routes];
  }

  /**
   * Get plugin info
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      enabled: this.enabled,
      features: [
        'View tracking',
        'Content analytics',
        'Popular content',
        'Custom event tracking',
        'User analytics',
      ],
      routes: this.routes.map(r => `${r.method} ${r.path}`),
    };
  }

  /**
   * Destroy plugin
   */
  async destroy() {
    this.logger.info('Destroying analytics plugin');
    // Cleanup if needed
  }
}

// Export plugin instance
export default new AnalyticsPlugin();

/**
 * Usage Example:
 *
 * // Register plugin
 * import analyticsPlugin from './examples/custom-plugin.js';
 * import { pluginRegistry } from './plugins/registry.js';
 *
 * await pluginRegistry.register('analytics', analyticsPlugin);
 *
 * // Track custom event
 * await analyticsPlugin.trackEvent({
 *   eventType: 'purchase',
 *   contentType: 'api::product.product',
 *   contentId: 123,
 *   metadata: {
 *     amount: 99.99,
 *     currency: 'USD'
 *   }
 * });
 *
 * // Get analytics
 * const stats = await fetch('/api/analytics/stats?startDate=2024-01-01');
 * const popular = await fetch('/api/analytics/popular?contentType=api::article.article&limit=5');
 */
