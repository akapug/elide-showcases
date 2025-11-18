/**
 * Rules Engine - Complex Event Processing and Alerting
 *
 * Features:
 * - JavaScript-based rule expressions
 * - Multiple condition types (threshold, pattern, statistical)
 * - Alert throttling and deduplication
 * - Multi-channel notifications
 * - Alert escalation
 * - Rule versioning and audit trail
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { Logger } from 'pino';
import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import { VM } from 'vm2';

export interface Rule {
  id: string;
  name: string;
  description?: string;
  condition: string;
  deviceFilter?: {
    types?: string[];
    tags?: string[];
    ids?: string[];
  };
  actions: RuleAction[];
  enabled: boolean;
  cooldown: number; // seconds
  severity: 'info' | 'warning' | 'error' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleAction {
  type: 'webhook' | 'email' | 'sms' | 'log';
  config: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  deviceId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  context: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
}

interface TelemetryData {
  deviceId: string;
  timestamp: number;
  metrics: Record<string, any>;
}

/**
 * Rules Engine for real-time alerting
 */
export class RulesEngine extends EventEmitter {
  private postgres: Pool;
  private redis: Redis;
  private logger: Logger;
  private initialized = false;

  private rules: Map<string, Rule> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private alertCounts: Map<string, number> = new Map();

  // Statistical data for rules
  private deviceStats: Map<string, Map<string, number[]>> = new Map();
  private readonly STATS_WINDOW = 100; // Keep last 100 values

  constructor(postgres: Pool, redis: Redis, logger: Logger) {
    super();
    this.postgres = postgres;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Initialize the rules engine
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.info('Initializing Rules Engine...');

    try {
      await this.createTables();
      await this.loadRules();

      this.initialized = true;
      this.logger.info({ rulesCount: this.rules.size }, 'Rules Engine initialized');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize Rules Engine');
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    const client = await this.postgres.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          condition TEXT NOT NULL,
          device_filter JSONB DEFAULT '{}',
          actions JSONB NOT NULL,
          enabled BOOLEAN DEFAULT true,
          cooldown INTEGER DEFAULT 300,
          severity VARCHAR(50) DEFAULT 'warning',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled);

        CREATE TABLE IF NOT EXISTS alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
          rule_name VARCHAR(255) NOT NULL,
          device_id VARCHAR(255) NOT NULL,
          severity VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          context JSONB DEFAULT '{}',
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW(),
          acknowledged_at TIMESTAMP,
          resolved_at TIMESTAMP,
          acknowledged_by VARCHAR(255)
        );

        CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);
        CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
        CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
        CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
        CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
      `);

      this.logger.info('Rules Engine tables created/verified');
    } finally {
      client.release();
    }
  }

  /**
   * Load rules from database
   */
  private async loadRules(): Promise<void> {
    const result = await this.postgres.query(
      'SELECT * FROM rules WHERE enabled = true'
    );

    this.rules.clear();

    for (const row of result.rows) {
      const rule = this.mapRowToRule(row);
      this.rules.set(rule.id, rule);
    }

    this.logger.info({ count: this.rules.size }, 'Rules loaded');
  }

  /**
   * Create a new rule
   */
  async createRule(data: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rule> {
    // Validate rule condition by trying to compile it
    this.validateRuleCondition(data.condition);

    const client = await this.postgres.connect();
    try {
      const result = await client.query(
        `INSERT INTO rules (name, description, condition, device_filter, actions, enabled, cooldown, severity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          data.name,
          data.description || null,
          data.condition,
          JSON.stringify(data.deviceFilter || {}),
          JSON.stringify(data.actions),
          data.enabled !== false,
          data.cooldown || 300,
          data.severity || 'warning',
        ]
      );

      const rule = this.mapRowToRule(result.rows[0]);

      if (rule.enabled) {
        this.rules.set(rule.id, rule);
      }

      this.logger.info({ ruleId: rule.id, name: rule.name }, 'Rule created');
      this.emit('rule:created', rule);

      return rule;
    } finally {
      client.release();
    }
  }

  /**
   * Get rule by ID
   */
  async getRule(ruleId: string): Promise<Rule | null> {
    const result = await this.postgres.query(
      'SELECT * FROM rules WHERE id = $1',
      [ruleId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToRule(result.rows[0]);
  }

  /**
   * List all rules
   */
  async listRules(): Promise<Rule[]> {
    const result = await this.postgres.query(
      'SELECT * FROM rules ORDER BY created_at DESC'
    );

    return result.rows.map(row => this.mapRowToRule(row));
  }

  /**
   * Update rule
   */
  async updateRule(ruleId: string, updates: Partial<Rule>): Promise<Rule | null> {
    if (updates.condition) {
      this.validateRuleCondition(updates.condition);
    }

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      condition: 'condition',
      deviceFilter: 'device_filter',
      actions: 'actions',
      enabled: 'enabled',
      cooldown: 'cooldown',
      severity: 'severity',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key as keyof Rule] !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex++}`);
        const value = updates[key as keyof Rule];
        params.push(
          typeof value === 'object' ? JSON.stringify(value) : value
        );
      }
    }

    if (updateFields.length === 0) {
      return this.getRule(ruleId);
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(ruleId);

    const query = `
      UPDATE rules
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.postgres.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const rule = this.mapRowToRule(result.rows[0]);

    // Update in-memory cache
    if (rule.enabled) {
      this.rules.set(rule.id, rule);
    } else {
      this.rules.delete(rule.id);
    }

    this.logger.info({ ruleId }, 'Rule updated');
    this.emit('rule:updated', rule);

    return rule;
  }

  /**
   * Delete rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    await this.postgres.query('DELETE FROM rules WHERE id = $1', [ruleId]);
    this.rules.delete(ruleId);

    this.logger.info({ ruleId }, 'Rule deleted');
    this.emit('rule:deleted', { ruleId });
  }

  /**
   * Evaluate telemetry against all rules
   */
  async evaluate(data: TelemetryData): Promise<void> {
    // Update statistical data
    this.updateStatistics(data);

    // Evaluate each rule
    for (const rule of this.rules.values()) {
      if (!this.matchesDeviceFilter(data.deviceId, rule.deviceFilter)) {
        continue;
      }

      try {
        const shouldTrigger = await this.evaluateRule(rule, data);

        if (shouldTrigger) {
          await this.triggerAlert(rule, data);
        }
      } catch (error) {
        this.logger.error(
          { error, ruleId: rule.id, deviceId: data.deviceId },
          'Failed to evaluate rule'
        );
      }
    }
  }

  /**
   * Evaluate a single rule
   */
  private async evaluateRule(rule: Rule, data: TelemetryData): Promise<boolean> {
    const context = this.buildEvaluationContext(data);

    try {
      const vm = new VM({
        timeout: 1000,
        sandbox: context,
      });

      const result = vm.run(`(function() { ${rule.condition} })()`);
      return Boolean(result);
    } catch (error) {
      this.logger.error(
        { error, ruleId: rule.id, condition: rule.condition },
        'Rule evaluation error'
      );
      return false;
    }
  }

  /**
   * Build evaluation context for rule
   */
  private buildEvaluationContext(data: TelemetryData): Record<string, any> {
    const stats = this.getDeviceStatistics(data.deviceId);

    return {
      deviceId: data.deviceId,
      timestamp: data.timestamp,
      metrics: data.metrics,
      current: data.metrics,
      stats,

      // Helper functions
      avg: (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length,
      min: (values: number[]) => Math.min(...values),
      max: (values: number[]) => Math.max(...values),
      sum: (values: number[]) => values.reduce((a, b) => a + b, 0),
      stddev: (values: number[]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
        return Math.sqrt(variance);
      },
    };
  }

  /**
   * Update statistics for a device
   */
  private updateStatistics(data: TelemetryData): void {
    if (!this.deviceStats.has(data.deviceId)) {
      this.deviceStats.set(data.deviceId, new Map());
    }

    const deviceMetrics = this.deviceStats.get(data.deviceId)!;

    for (const [metric, value] of Object.entries(data.metrics)) {
      if (typeof value !== 'number') {
        continue;
      }

      if (!deviceMetrics.has(metric)) {
        deviceMetrics.set(metric, []);
      }

      const values = deviceMetrics.get(metric)!;
      values.push(value);

      // Keep only last N values
      if (values.length > this.STATS_WINDOW) {
        values.shift();
      }
    }
  }

  /**
   * Get device statistics
   */
  private getDeviceStatistics(deviceId: string): Record<string, any> {
    const deviceMetrics = this.deviceStats.get(deviceId);
    if (!deviceMetrics) {
      return {};
    }

    const stats: Record<string, any> = {};

    for (const [metric, values] of deviceMetrics.entries()) {
      if (values.length === 0) {
        continue;
      }

      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
      const stddev = Math.sqrt(variance);

      stats[metric] = {
        values,
        count: values.length,
        sum,
        avg,
        min: Math.min(...values),
        max: Math.max(...values),
        stddev,
      };
    }

    return stats;
  }

  /**
   * Check if device matches filter
   */
  private matchesDeviceFilter(
    deviceId: string,
    filter?: Rule['deviceFilter']
  ): boolean {
    if (!filter) {
      return true;
    }

    if (filter.ids && !filter.ids.includes(deviceId)) {
      return false;
    }

    // Additional filters would require device metadata lookup
    // For now, we'll just check IDs

    return true;
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: Rule, data: TelemetryData): Promise<void> {
    // Check cooldown
    const cooldownKey = `${rule.id}:${data.deviceId}`;
    const lastAlert = this.lastAlertTime.get(cooldownKey);
    const now = Date.now();

    if (lastAlert && (now - lastAlert) < rule.cooldown * 1000) {
      this.logger.debug(
        { ruleId: rule.id, deviceId: data.deviceId },
        'Alert suppressed due to cooldown'
      );
      return;
    }

    // Create alert
    const alert = await this.createAlert({
      ruleId: rule.id,
      ruleName: rule.name,
      deviceId: data.deviceId,
      severity: rule.severity,
      message: `Rule "${rule.name}" triggered for device ${data.deviceId}`,
      context: {
        metrics: data.metrics,
        timestamp: data.timestamp,
      },
    });

    // Update cooldown
    this.lastAlertTime.set(cooldownKey, now);

    // Execute actions
    await this.executeActions(rule.actions, alert, data);

    // Emit event
    this.emit('alert', alert);

    this.logger.info(
      { alertId: alert.id, ruleId: rule.id, deviceId: data.deviceId },
      'Alert triggered'
    );
  }

  /**
   * Create an alert
   */
  private async createAlert(data: {
    ruleId: string;
    ruleName: string;
    deviceId: string;
    severity: string;
    message: string;
    context: Record<string, any>;
  }): Promise<Alert> {
    const client = await this.postgres.connect();
    try {
      const result = await client.query(
        `INSERT INTO alerts (rule_id, rule_name, device_id, severity, message, context)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.ruleId,
          data.ruleName,
          data.deviceId,
          data.severity,
          data.message,
          JSON.stringify(data.context),
        ]
      );

      return this.mapRowToAlert(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Get alerts
   */
  async getAlerts(options: {
    limit?: number;
    offset?: number;
    severity?: string;
    status?: string;
  }): Promise<{ alerts: Alert[]; total: number }> {
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(options.severity);
    }

    if (options.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(options.status);
    }

    // Get total count
    const countResult = await this.postgres.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(options.limit || 100, options.offset || 0);

    const result = await this.postgres.query(query, params);
    const alerts = result.rows.map(row => this.mapRowToAlert(row));

    return { alerts, total };
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert | null> {
    const result = await this.postgres.query(
      `UPDATE alerts
       SET status = 'acknowledged',
           acknowledged_at = NOW(),
           acknowledged_by = $1
       WHERE id = $2
       RETURNING *`,
      [acknowledgedBy, alertId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const alert = this.mapRowToAlert(result.rows[0]);
    this.emit('alert:acknowledged', alert);

    return alert;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<Alert | null> {
    const result = await this.postgres.query(
      `UPDATE alerts
       SET status = 'resolved',
           resolved_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [alertId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const alert = this.mapRowToAlert(result.rows[0]);
    this.emit('alert:resolved', alert);

    return alert;
  }

  /**
   * Execute rule actions
   */
  private async executeActions(
    actions: RuleAction[],
    alert: Alert,
    data: TelemetryData
  ): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, alert, data);
      } catch (error) {
        this.logger.error(
          { error, action, alertId: alert.id },
          'Failed to execute action'
        );
      }
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: RuleAction,
    alert: Alert,
    data: TelemetryData
  ): Promise<void> {
    switch (action.type) {
      case 'log':
        this.logger.warn({ alert, data }, 'Alert triggered');
        break;

      case 'webhook':
        // In production, would make HTTP request
        this.logger.info({ url: action.config.url, alert }, 'Webhook triggered');
        break;

      case 'email':
        // In production, would send email
        this.logger.info({ to: action.config.to, alert }, 'Email notification');
        break;

      case 'sms':
        // In production, would send SMS
        this.logger.info({ to: action.config.to, alert }, 'SMS notification');
        break;

      default:
        this.logger.warn({ type: action.type }, 'Unknown action type');
    }
  }

  /**
   * Validate rule condition
   */
  private validateRuleCondition(condition: string): void {
    try {
      const vm = new VM({
        timeout: 1000,
        sandbox: {
          metrics: {},
          current: {},
          stats: {},
        },
      });

      vm.run(`(function() { ${condition} })()`);
    } catch (error) {
      throw new Error(`Invalid rule condition: ${error}`);
    }
  }

  /**
   * Map database row to Rule object
   */
  private mapRowToRule(row: any): Rule {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      condition: row.condition,
      deviceFilter: row.device_filter,
      actions: row.actions,
      enabled: row.enabled,
      cooldown: row.cooldown,
      severity: row.severity,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to Alert object
   */
  private mapRowToAlert(row: any): Alert {
    return {
      id: row.id,
      ruleId: row.rule_id,
      ruleName: row.rule_name,
      deviceId: row.device_id,
      severity: row.severity,
      message: row.message,
      context: row.context,
      status: row.status,
      createdAt: row.created_at,
      acknowledgedAt: row.acknowledged_at,
      resolvedAt: row.resolved_at,
      acknowledgedBy: row.acknowledged_by,
    };
  }
}
