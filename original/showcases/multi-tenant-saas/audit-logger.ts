/**
 * Audit Logger - Comprehensive audit trail and compliance logging
 *
 * Features:
 * - Action logging
 * - User activity tracking
 * - Data change tracking
 * - Security events
 * - Compliance reporting
 * - Log retention policies
 * - Search and filtering
 * - Export capabilities
 *
 * @module audit-logger
 */

export enum AuditEventType {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  PASSWORD_CHANGED = 'auth.password_changed',
  PASSWORD_RESET = 'auth.password_reset',
  MFA_ENABLED = 'auth.mfa_enabled',
  MFA_DISABLED = 'auth.mfa_disabled',

  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_INVITED = 'user.invited',
  USER_ROLE_CHANGED = 'user.role_changed',

  // Tenant Management
  TENANT_CREATED = 'tenant.created',
  TENANT_UPDATED = 'tenant.updated',
  TENANT_DELETED = 'tenant.deleted',
  TENANT_SUSPENDED = 'tenant.suspended',
  TENANT_ACTIVATED = 'tenant.activated',

  // Data Operations
  DATA_CREATED = 'data.created',
  DATA_UPDATED = 'data.updated',
  DATA_DELETED = 'data.deleted',
  DATA_EXPORTED = 'data.exported',
  DATA_IMPORTED = 'data.imported',

  // Billing
  SUBSCRIPTION_CREATED = 'billing.subscription_created',
  SUBSCRIPTION_UPDATED = 'billing.subscription_updated',
  SUBSCRIPTION_CANCELED = 'billing.subscription_canceled',
  PAYMENT_PROCESSED = 'billing.payment_processed',
  PAYMENT_FAILED = 'billing.payment_failed',
  INVOICE_GENERATED = 'billing.invoice_generated',

  // Security
  PERMISSION_GRANTED = 'security.permission_granted',
  PERMISSION_REVOKED = 'security.permission_revoked',
  ACCESS_DENIED = 'security.access_denied',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  DATA_BREACH_DETECTED = 'security.data_breach_detected',

  // Configuration
  CONFIG_CHANGED = 'config.changed',
  FEATURE_TOGGLED = 'config.feature_toggled',
  INTEGRATION_CONFIGURED = 'config.integration_configured',

  // Compliance
  GDPR_REQUEST = 'compliance.gdpr_request',
  DATA_RETENTION_APPLIED = 'compliance.data_retention_applied',
  BACKUP_CREATED = 'compliance.backup_created',
  BACKUP_RESTORED = 'compliance.backup_restored'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  action: string;
  resource?: {
    type: string;
    id: string;
    name?: string;
  };
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  timestamp: number;
  expiresAt?: number; // For retention policy
}

export interface AuditFilters {
  tenantId?: string;
  userId?: string;
  eventTypes?: AuditEventType[];
  severity?: AuditSeverity[];
  startDate?: number;
  endDate?: number;
  resource?: {
    type?: string;
    id?: string;
  };
  search?: string;
}

export interface AuditReport {
  period: {
    start: number;
    end: number;
  };
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  topUsers: { userId: string; count: number }[];
  topActions: { action: string; count: number }[];
  securityEvents: AuditLog[];
  complianceEvents: AuditLog[];
}

export interface RetentionPolicy {
  tenantId?: string; // Tenant-specific or global
  eventTypes: AuditEventType[] | '*';
  retentionDays: number;
  archiveBeforeDelete: boolean;
  archiveLocation?: string;
}

/**
 * Audit Logger
 * Comprehensive audit trail system for compliance and security
 */
export class AuditLogger {
  private logs: AuditLog[];
  private retentionPolicies: RetentionPolicy[];
  private readonly maxLogs: number = 100000;

  constructor() {
    this.logs = [];
    this.retentionPolicies = [];
    this.initializeDefaultPolicies();
  }

  /**
   * Log an audit event
   */
  log(data: {
    tenantId: string;
    userId?: string;
    eventType: AuditEventType;
    action: string;
    severity?: AuditSeverity;
    resource?: AuditLog['resource'];
    changes?: AuditLog['changes'];
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    location?: AuditLog['location'];
  }): AuditLog {
    const auditLog: AuditLog = {
      id: this.generateId(),
      tenantId: data.tenantId,
      userId: data.userId,
      eventType: data.eventType,
      severity: data.severity || this.inferSeverity(data.eventType),
      action: data.action,
      resource: data.resource,
      changes: data.changes,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      location: data.location,
      timestamp: Date.now()
    };

    // Apply retention policy
    const policy = this.getRetentionPolicy(data.tenantId, data.eventType);
    if (policy) {
      auditLog.expiresAt = Date.now() + policy.retentionDays * 24 * 60 * 60 * 1000;
    }

    this.logs.push(auditLog);

    // Cleanup old logs if needed
    if (this.logs.length > this.maxLogs) {
      this.cleanup();
    }

    // Trigger alerts for critical events
    if (auditLog.severity === AuditSeverity.CRITICAL) {
      this.triggerAlert(auditLog);
    }

    return auditLog;
  }

  /**
   * Log authentication event
   */
  logAuth(data: {
    tenantId: string;
    userId?: string;
    eventType: AuditEventType;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    location?: AuditLog['location'];
    metadata?: Record<string, any>;
  }): AuditLog {
    return this.log({
      tenantId: data.tenantId,
      userId: data.userId,
      eventType: data.eventType,
      action: `Authentication: ${data.eventType}`,
      severity: data.success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      location: data.location,
      metadata: { ...data.metadata, success: data.success }
    });
  }

  /**
   * Log data change
   */
  logDataChange(data: {
    tenantId: string;
    userId: string;
    eventType: AuditEventType;
    resource: AuditLog['resource'];
    changes: AuditLog['changes'];
    metadata?: Record<string, any>;
  }): AuditLog {
    return this.log({
      tenantId: data.tenantId,
      userId: data.userId,
      eventType: data.eventType,
      action: `Data modified: ${data.resource.type}`,
      resource: data.resource,
      changes: data.changes,
      metadata: data.metadata
    });
  }

  /**
   * Log security event
   */
  logSecurity(data: {
    tenantId: string;
    userId?: string;
    eventType: AuditEventType;
    severity: AuditSeverity;
    description: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
  }): AuditLog {
    return this.log({
      tenantId: data.tenantId,
      userId: data.userId,
      eventType: data.eventType,
      action: data.description,
      severity: data.severity,
      ipAddress: data.ipAddress,
      metadata: data.metadata
    });
  }

  /**
   * Query audit logs
   */
  query(filters: AuditFilters, options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'severity';
    sortOrder?: 'asc' | 'desc';
  }): {
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  } {
    let filtered = this.logs.filter(log => this.matchesFilters(log, filters));

    // Sort
    const sortBy = options?.sortBy || 'timestamp';
    const sortOrder = options?.sortOrder || 'desc';
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 'desc' ?
        (bVal as any) - (aVal as any) :
        (aVal as any) - (bVal as any);
    });

    const total = filtered.length;
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    const logs = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return { logs, total, hasMore };
  }

  /**
   * Get logs for tenant
   */
  getTenantLogs(
    tenantId: string,
    options?: {
      limit?: number;
      eventTypes?: AuditEventType[];
    }
  ): AuditLog[] {
    const filters: AuditFilters = {
      tenantId,
      eventTypes: options?.eventTypes
    };

    const result = this.query(filters, { limit: options?.limit });
    return result.logs;
  }

  /**
   * Get logs for user
   */
  getUserLogs(
    userId: string,
    options?: { limit?: number }
  ): AuditLog[] {
    const filters: AuditFilters = { userId };
    const result = this.query(filters, { limit: options?.limit });
    return result.logs;
  }

  /**
   * Get security events
   */
  getSecurityEvents(
    tenantId?: string,
    options?: { limit?: number; severity?: AuditSeverity[] }
  ): AuditLog[] {
    const securityEventTypes = [
      AuditEventType.LOGIN_FAILED,
      AuditEventType.ACCESS_DENIED,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.DATA_BREACH_DETECTED,
      AuditEventType.PERMISSION_GRANTED,
      AuditEventType.PERMISSION_REVOKED
    ];

    const filters: AuditFilters = {
      tenantId,
      eventTypes: securityEventTypes,
      severity: options?.severity
    };

    const result = this.query(filters, { limit: options?.limit });
    return result.logs;
  }

  /**
   * Generate audit report
   */
  generateReport(
    tenantId: string,
    startDate: number,
    endDate: number
  ): AuditReport {
    const filters: AuditFilters = {
      tenantId,
      startDate,
      endDate
    };

    const { logs } = this.query(filters, { limit: 999999 });

    // Count events by type
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    for (const log of logs) {
      eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;
      eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1;

      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }

      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    }

    // Top users
    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top actions
    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Security and compliance events
    const securityEvents = logs.filter(log =>
      log.severity === AuditSeverity.CRITICAL ||
      log.severity === AuditSeverity.ERROR
    );

    const complianceEvents = logs.filter(log =>
      log.eventType.startsWith('compliance.')
    );

    return {
      period: { start: startDate, end: endDate },
      totalEvents: logs.length,
      eventsByType: eventsByType as any,
      eventsBySeverity: eventsBySeverity as any,
      topUsers,
      topActions,
      securityEvents,
      complianceEvents
    };
  }

  /**
   * Export logs
   */
  export(
    filters: AuditFilters,
    format: 'json' | 'csv' = 'json'
  ): string {
    const { logs } = this.query(filters, { limit: 999999 });

    if (format === 'csv') {
      return this.convertToCSV(logs);
    } else {
      return JSON.stringify(logs, null, 2);
    }
  }

  /**
   * Set retention policy
   */
  setRetentionPolicy(policy: RetentionPolicy): void {
    // Remove existing policy for same tenant/event types
    this.retentionPolicies = this.retentionPolicies.filter(p =>
      p.tenantId !== policy.tenantId
    );

    this.retentionPolicies.push(policy);
  }

  /**
   * Get retention policy
   */
  getRetentionPolicy(
    tenantId: string,
    eventType: AuditEventType
  ): RetentionPolicy | undefined {
    // Tenant-specific policy
    let policy = this.retentionPolicies.find(p =>
      p.tenantId === tenantId &&
      (p.eventTypes === '*' || p.eventTypes.includes(eventType))
    );

    // Global policy
    if (!policy) {
      policy = this.retentionPolicies.find(p =>
        !p.tenantId &&
        (p.eventTypes === '*' || p.eventTypes.includes(eventType))
      );
    }

    return policy;
  }

  /**
   * Cleanup expired logs
   */
  cleanup(): void {
    const now = Date.now();

    // Archive expired logs if needed
    const expiredLogs = this.logs.filter(log =>
      log.expiresAt && log.expiresAt < now
    );

    for (const log of expiredLogs) {
      const policy = this.getRetentionPolicy(log.tenantId, log.eventType);
      if (policy?.archiveBeforeDelete) {
        this.archiveLog(log);
      }
    }

    // Remove expired logs
    this.logs = this.logs.filter(log =>
      !log.expiresAt || log.expiresAt >= now
    );

    // If still too many logs, remove oldest
    if (this.logs.length > this.maxLogs) {
      this.logs.sort((a, b) => b.timestamp - a.timestamp);
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  /**
   * Search logs (full-text search)
   */
  search(
    query: string,
    filters?: AuditFilters
  ): AuditLog[] {
    const searchTerms = query.toLowerCase().split(' ');

    let logs = this.logs;

    if (filters) {
      logs = logs.filter(log => this.matchesFilters(log, filters));
    }

    return logs.filter(log => {
      const searchableText = [
        log.action,
        log.eventType,
        log.userId,
        log.resource?.type,
        log.resource?.name,
        JSON.stringify(log.metadata)
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // Helper methods
  private matchesFilters(log: AuditLog, filters: AuditFilters): boolean {
    if (filters.tenantId && log.tenantId !== filters.tenantId) {
      return false;
    }

    if (filters.userId && log.userId !== filters.userId) {
      return false;
    }

    if (filters.eventTypes && !filters.eventTypes.includes(log.eventType)) {
      return false;
    }

    if (filters.severity && !filters.severity.includes(log.severity)) {
      return false;
    }

    if (filters.startDate && log.timestamp < filters.startDate) {
      return false;
    }

    if (filters.endDate && log.timestamp > filters.endDate) {
      return false;
    }

    if (filters.resource) {
      if (filters.resource.type && log.resource?.type !== filters.resource.type) {
        return false;
      }
      if (filters.resource.id && log.resource?.id !== filters.resource.id) {
        return false;
      }
    }

    if (filters.search) {
      const searchText = [
        log.action,
        log.eventType,
        JSON.stringify(log.metadata)
      ].join(' ').toLowerCase();

      if (!searchText.includes(filters.search.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  private inferSeverity(eventType: AuditEventType): AuditSeverity {
    if (eventType.includes('failed') || eventType.includes('denied')) {
      return AuditSeverity.WARNING;
    }

    if (eventType.includes('breach') || eventType.includes('suspicious')) {
      return AuditSeverity.CRITICAL;
    }

    if (eventType.includes('deleted') || eventType.includes('suspended')) {
      return AuditSeverity.WARNING;
    }

    return AuditSeverity.INFO;
  }

  private initializeDefaultPolicies(): void {
    // Default global policy: 90 days retention
    this.setRetentionPolicy({
      eventTypes: '*',
      retentionDays: 90,
      archiveBeforeDelete: true
    });

    // Security events: 365 days retention
    this.setRetentionPolicy({
      eventTypes: [
        AuditEventType.LOGIN_FAILED,
        AuditEventType.ACCESS_DENIED,
        AuditEventType.SUSPICIOUS_ACTIVITY,
        AuditEventType.DATA_BREACH_DETECTED
      ],
      retentionDays: 365,
      archiveBeforeDelete: true
    });

    // Compliance events: 7 years retention
    this.setRetentionPolicy({
      eventTypes: [
        AuditEventType.GDPR_REQUEST,
        AuditEventType.DATA_RETENTION_APPLIED,
        AuditEventType.BACKUP_CREATED
      ],
      retentionDays: 365 * 7,
      archiveBeforeDelete: true
    });
  }

  private archiveLog(log: AuditLog): void {
    console.log(`Archiving audit log: ${log.id}`);
    // Implementation would archive to cold storage
  }

  private triggerAlert(log: AuditLog): void {
    console.log(`CRITICAL AUDIT EVENT: ${log.eventType}`, log);
    // Implementation would send alerts via email/SMS/Slack
  }

  private convertToCSV(logs: AuditLog[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'id', 'tenantId', 'userId', 'eventType', 'severity',
      'action', 'resourceType', 'resourceId', 'ipAddress', 'timestamp'
    ];

    const rows = logs.map(log => [
      log.id,
      log.tenantId,
      log.userId || '',
      log.eventType,
      log.severity,
      log.action,
      log.resource?.type || '',
      log.resource?.id || '',
      log.ipAddress || '',
      new Date(log.timestamp).toISOString()
    ].map(v => `"${v}"`).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
