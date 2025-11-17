/**
 * Analytics Service
 *
 * Tracks page views, API calls, and provides analytics data.
 */

export class AnalyticsService {
  constructor(db) {
    this.db = db;
  }

  async track(event) {
    try {
      await this.db.create('analytics_events', {
        type: event.type,
        path: event.path,
        post_id: event.post_id || null,
        user_agent: event.userAgent || null,
        ip: event.ip || null,
        referer: event.referer || null,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        created_at: event.timestamp,
      });
    } catch (error) {
      // Don't fail requests due to analytics errors
      console.error('Analytics tracking error:', error.message);
    }
  }

  async getDashboard(req, res) {
    const { days = 30 } = req.query;

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    // Total views
    const totalViews = await this.db.queryOne(
      `
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE type = 'page_view'
        AND created_at >= ?
      `,
      [since.toISOString()]
    );

    // Unique visitors (by IP)
    const uniqueVisitors = await this.db.queryOne(
      `
      SELECT COUNT(DISTINCT ip) as count
      FROM analytics_events
      WHERE type = 'page_view'
        AND created_at >= ?
      `,
      [since.toISOString()]
    );

    // Top posts
    const topPosts = await this.db.query(
      `
      SELECT p.id, p.title, p.slug,
        COUNT(ae.id) as views
      FROM posts p
      INNER JOIN analytics_events ae ON p.id = ae.post_id
      WHERE ae.type = 'page_view'
        AND ae.created_at >= ?
      GROUP BY p.id
      ORDER BY views DESC
      LIMIT 10
      `,
      [since.toISOString()]
    );

    // Views over time
    const viewsOverTime = await this.db.query(
      `
      SELECT DATE(created_at) as date,
        COUNT(*) as views
      FROM analytics_events
      WHERE type = 'page_view'
        AND created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date
      `,
      [since.toISOString()]
    );

    // Referrers
    const topReferrers = await this.db.query(
      `
      SELECT referer,
        COUNT(*) as views
      FROM analytics_events
      WHERE type = 'page_view'
        AND created_at >= ?
        AND referer IS NOT NULL
        AND referer != ''
      GROUP BY referer
      ORDER BY views DESC
      LIMIT 10
      `,
      [since.toISOString()]
    );

    return {
      summary: {
        totalViews: totalViews.count,
        uniqueVisitors: uniqueVisitors.count,
        period: `${days} days`,
      },
      topPosts,
      viewsOverTime,
      topReferrers,
    };
  }

  async getPostAnalytics(req, res) {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    // Total views
    const totalViews = await this.db.queryOne(
      `
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE type = 'page_view'
        AND post_id = ?
        AND created_at >= ?
      `,
      [id, since.toISOString()]
    );

    // Unique visitors
    const uniqueVisitors = await this.db.queryOne(
      `
      SELECT COUNT(DISTINCT ip) as count
      FROM analytics_events
      WHERE type = 'page_view'
        AND post_id = ?
        AND created_at >= ?
      `,
      [id, since.toISOString()]
    );

    // Views over time
    const viewsOverTime = await this.db.query(
      `
      SELECT DATE(created_at) as date,
        COUNT(*) as views
      FROM analytics_events
      WHERE type = 'page_view'
        AND post_id = ?
        AND created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date
      `,
      [id, since.toISOString()]
    );

    return {
      summary: {
        totalViews: totalViews.count,
        uniqueVisitors: uniqueVisitors.count,
        period: `${days} days`,
      },
      viewsOverTime,
    };
  }

  async cleanup(retentionDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await this.db.execute(
      'DELETE FROM analytics_events WHERE created_at < ?',
      [cutoff.toISOString()]
    );

    console.log(`🗑️  Cleaned up ${result.changes} old analytics events`);

    return result.changes;
  }
}
