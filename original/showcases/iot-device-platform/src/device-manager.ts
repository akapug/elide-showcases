/**
 * Device Manager - Complete Device Lifecycle Management
 *
 * Handles:
 * - Device registration and provisioning
 * - Authentication and authorization
 * - Device state management (shadow)
 * - Firmware updates
 * - Device grouping and tagging
 * - Batch operations
 */

import { Pool, PoolClient } from 'pg';
import Redis from 'ioredis';
import { Logger } from 'pino';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface Device {
  id: string;
  deviceId: string;
  type: string;
  status: 'online' | 'offline' | 'inactive' | 'maintenance';
  metadata: Record<string, any>;
  tags: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    name?: string;
  };
  firmware?: {
    version: string;
    updateAvailable?: boolean;
    lastUpdate?: Date;
  };
  credentials: {
    username: string;
    passwordHash: string;
    apiKey: string;
    certificate?: string;
  };
  statistics: {
    messagesReceived: number;
    messagesSent: number;
    lastSeen: Date | null;
    uptime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceShadow {
  deviceId: string;
  reported: Record<string, any>;
  desired: Record<string, any>;
  metadata: {
    reported: Record<string, { timestamp: number }>;
    desired: Record<string, { timestamp: number }>;
  };
  version: number;
  timestamp: Date;
}

export interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  deviceFilter: {
    types?: string[];
    tags?: string[];
    location?: string;
  };
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchOperation {
  id: string;
  operation: string;
  filter: Record<string, any>;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  results: Array<{
    deviceId: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Device Manager handles all device lifecycle operations
 */
export class DeviceManager extends EventEmitter {
  private postgres: Pool;
  private redis: Redis;
  private logger: Logger;
  private initialized = false;

  constructor(postgres: Pool, redis: Redis, logger: Logger) {
    super();
    this.postgres = postgres;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Initialize the device manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.info('Initializing Device Manager...');

    try {
      await this.createTables();
      this.initialized = true;
      this.logger.info('Device Manager initialized');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize Device Manager');
      throw error;
    }
  }

  /**
   * Create database tables if they don't exist
   */
  private async createTables(): Promise<void> {
    const client = await this.postgres.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS devices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id VARCHAR(255) UNIQUE NOT NULL,
          type VARCHAR(100) NOT NULL,
          status VARCHAR(50) DEFAULT 'offline',
          metadata JSONB DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          location JSONB,
          firmware JSONB,
          credentials JSONB NOT NULL,
          statistics JSONB DEFAULT '{"messagesReceived": 0, "messagesSent": 0, "lastSeen": null, "uptime": 0}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
        CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
        CREATE INDEX IF NOT EXISTS idx_devices_tags ON devices USING GIN(tags);
        CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at);

        CREATE TABLE IF NOT EXISTS device_groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          device_filter JSONB DEFAULT '{}',
          config JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS batch_operations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          operation VARCHAR(100) NOT NULL,
          filter JSONB NOT NULL,
          params JSONB DEFAULT '{}',
          status VARCHAR(50) DEFAULT 'pending',
          progress JSONB DEFAULT '{"total": 0, "completed": 0, "failed": 0}',
          results JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_batch_operations_status ON batch_operations(status);
      `);

      this.logger.info('Database tables created/verified');
    } finally {
      client.release();
    }
  }

  /**
   * Register a new device
   */
  async registerDevice(data: {
    deviceId: string;
    type: string;
    metadata?: Record<string, any>;
    tags?: string[];
    location?: { latitude?: number; longitude?: number; name?: string };
  }): Promise<Device> {
    this.logger.info({ deviceId: data.deviceId }, 'Registering new device');

    // Check if device already exists
    const existing = await this.getDevice(data.deviceId);
    if (existing) {
      throw new Error(`Device ${data.deviceId} already exists`);
    }

    // Generate credentials
    const password = nanoid(32);
    const apiKey = nanoid(64);
    const credentials = {
      username: data.deviceId,
      passwordHash: this.hashPassword(password),
      apiKey: apiKey,
    };

    const client = await this.postgres.connect();
    try {
      const result = await client.query(
        `INSERT INTO devices (device_id, type, metadata, tags, location, credentials)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.deviceId,
          data.type,
          JSON.stringify(data.metadata || {}),
          data.tags || [],
          data.location ? JSON.stringify(data.location) : null,
          JSON.stringify(credentials),
        ]
      );

      const device = this.mapRowToDevice(result.rows[0]);

      // Initialize device shadow
      await this.initializeShadow(data.deviceId);

      // Cache device in Redis
      await this.cacheDevice(device);

      this.emit('device:registered', { device, password, apiKey });
      this.logger.info({ deviceId: data.deviceId }, 'Device registered successfully');

      return device;
    } finally {
      client.release();
    }
  }

  /**
   * Get device by ID
   */
  async getDevice(deviceId: string): Promise<Device | null> {
    // Try cache first
    const cached = await this.redis.get(`device:${deviceId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    const result = await this.postgres.query(
      'SELECT * FROM devices WHERE device_id = $1',
      [deviceId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const device = this.mapRowToDevice(result.rows[0]);
    await this.cacheDevice(device);
    return device;
  }

  /**
   * List devices with filtering
   */
  async listDevices(options: {
    type?: string;
    status?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ devices: Device[]; total: number }> {
    let query = 'SELECT * FROM devices WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(options.type);
    }

    if (options.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(options.status);
    }

    if (options.tags && options.tags.length > 0) {
      query += ` AND tags && $${paramIndex++}`;
      params.push(options.tags);
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
    const devices = result.rows.map(row => this.mapRowToDevice(row));

    return { devices, total };
  }

  /**
   * Update device
   */
  async updateDevice(
    deviceId: string,
    updates: Partial<Device>
  ): Promise<Device | null> {
    const device = await this.getDevice(deviceId);
    if (!device) {
      return null;
    }

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.type !== undefined) {
      updateFields.push(`type = $${paramIndex++}`);
      params.push(updates.type);
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }

    if (updates.metadata !== undefined) {
      updateFields.push(`metadata = $${paramIndex++}`);
      params.push(JSON.stringify(updates.metadata));
    }

    if (updates.tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`);
      params.push(updates.tags);
    }

    if (updates.location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      params.push(JSON.stringify(updates.location));
    }

    if (updates.firmware !== undefined) {
      updateFields.push(`firmware = $${paramIndex++}`);
      params.push(JSON.stringify(updates.firmware));
    }

    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 1) {
      return device; // Only updated_at, no changes
    }

    const query = `
      UPDATE devices
      SET ${updateFields.join(', ')}
      WHERE device_id = $${paramIndex}
      RETURNING *
    `;
    params.push(deviceId);

    const result = await this.postgres.query(query, params);
    const updated = this.mapRowToDevice(result.rows[0]);

    // Update cache
    await this.cacheDevice(updated);

    this.emit('device:updated', updated);
    this.logger.info({ deviceId }, 'Device updated');

    return updated;
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId: string): Promise<void> {
    await this.postgres.query('DELETE FROM devices WHERE device_id = $1', [deviceId]);
    await this.redis.del(`device:${deviceId}`);
    await this.redis.del(`shadow:${deviceId}`);

    this.emit('device:deleted', { deviceId });
    this.logger.info({ deviceId }, 'Device deleted');
  }

  /**
   * Authenticate device
   */
  async authenticateDevice(
    deviceId: string,
    password: string
  ): Promise<boolean> {
    const device = await this.getDevice(deviceId);
    if (!device) {
      return false;
    }

    const passwordHash = this.hashPassword(password);
    return device.credentials.passwordHash === passwordHash;
  }

  /**
   * Verify API key
   */
  async verifyApiKey(apiKey: string): Promise<Device | null> {
    const result = await this.postgres.query(
      `SELECT * FROM devices WHERE credentials->>'apiKey' = $1`,
      [apiKey]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToDevice(result.rows[0]);
  }

  /**
   * Update device connection status
   */
  async updateConnectionStatus(
    deviceId: string,
    connected: boolean
  ): Promise<void> {
    const status = connected ? 'online' : 'offline';

    await this.postgres.query(
      `UPDATE devices
       SET status = $1,
           statistics = jsonb_set(statistics, '{lastSeen}', to_jsonb(NOW())),
           updated_at = NOW()
       WHERE device_id = $2`,
      [status, deviceId]
    );

    // Update cache
    await this.redis.del(`device:${deviceId}`);

    this.emit('device:connection', { deviceId, connected });
  }

  /**
   * Update device statistics
   */
  async updateStatistics(
    deviceId: string,
    stats: { messagesReceived?: number; messagesSent?: number }
  ): Promise<void> {
    const updates: string[] = [];

    if (stats.messagesReceived !== undefined) {
      updates.push(
        `statistics = jsonb_set(statistics, '{messagesReceived}',
         (COALESCE((statistics->>'messagesReceived')::int, 0) + ${stats.messagesReceived})::text::jsonb)`
      );
    }

    if (stats.messagesSent !== undefined) {
      updates.push(
        `statistics = jsonb_set(statistics, '{messagesSent}',
         (COALESCE((statistics->>'messagesSent')::int, 0) + ${stats.messagesSent})::text::jsonb)`
      );
    }

    if (updates.length > 0) {
      await this.postgres.query(
        `UPDATE devices SET ${updates.join(', ')}, updated_at = NOW() WHERE device_id = $1`,
        [deviceId]
      );

      // Clear cache
      await this.redis.del(`device:${deviceId}`);
    }
  }

  /**
   * Get device shadow
   */
  async getShadow(deviceId: string): Promise<DeviceShadow | null> {
    const cached = await this.redis.get(`shadow:${deviceId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  /**
   * Update device shadow (reported state)
   */
  async updateShadowReported(
    deviceId: string,
    reported: Record<string, any>
  ): Promise<DeviceShadow> {
    const shadow = await this.getShadow(deviceId) || {
      deviceId,
      reported: {},
      desired: {},
      metadata: { reported: {}, desired: {} },
      version: 0,
      timestamp: new Date(),
    };

    const timestamp = Date.now();

    // Update reported state
    shadow.reported = { ...shadow.reported, ...reported };

    // Update metadata
    Object.keys(reported).forEach(key => {
      shadow.metadata.reported[key] = { timestamp };
    });

    shadow.version++;
    shadow.timestamp = new Date();

    await this.redis.setex(
      `shadow:${deviceId}`,
      3600,
      JSON.stringify(shadow)
    );

    this.emit('shadow:updated', { deviceId, shadow });
    return shadow;
  }

  /**
   * Update device shadow (desired state)
   */
  async updateShadowDesired(
    deviceId: string,
    desired: Record<string, any>
  ): Promise<DeviceShadow> {
    const shadow = await this.getShadow(deviceId) || {
      deviceId,
      reported: {},
      desired: {},
      metadata: { reported: {}, desired: {} },
      version: 0,
      timestamp: new Date(),
    };

    const timestamp = Date.now();

    // Update desired state
    shadow.desired = { ...shadow.desired, ...desired };

    // Update metadata
    Object.keys(desired).forEach(key => {
      shadow.metadata.desired[key] = { timestamp };
    });

    shadow.version++;
    shadow.timestamp = new Date();

    await this.redis.setex(
      `shadow:${deviceId}`,
      3600,
      JSON.stringify(shadow)
    );

    this.emit('shadow:desired', { deviceId, shadow });
    return shadow;
  }

  /**
   * Initialize device shadow
   */
  private async initializeShadow(deviceId: string): Promise<void> {
    const shadow: DeviceShadow = {
      deviceId,
      reported: {},
      desired: {},
      metadata: { reported: {}, desired: {} },
      version: 0,
      timestamp: new Date(),
    };

    await this.redis.setex(
      `shadow:${deviceId}`,
      3600,
      JSON.stringify(shadow)
    );
  }

  /**
   * Batch operation on devices
   */
  async batchOperation(operation: {
    operation: string;
    filter: Record<string, any>;
    params?: Record<string, any>;
  }): Promise<string> {
    const client = await this.postgres.connect();
    try {
      const result = await client.query(
        `INSERT INTO batch_operations (operation, filter, params)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          operation.operation,
          JSON.stringify(operation.filter),
          JSON.stringify(operation.params || {}),
        ]
      );

      const jobId = result.rows[0].id;

      // Process batch operation asynchronously
      setImmediate(() => this.processBatchOperation(jobId));

      return jobId;
    } finally {
      client.release();
    }
  }

  /**
   * Process batch operation
   */
  private async processBatchOperation(jobId: string): Promise<void> {
    this.logger.info({ jobId }, 'Processing batch operation');

    try {
      // Get operation details
      const opResult = await this.postgres.query(
        'SELECT * FROM batch_operations WHERE id = $1',
        [jobId]
      );

      if (opResult.rows.length === 0) {
        return;
      }

      const operation = opResult.rows[0];

      // Update status to running
      await this.postgres.query(
        'UPDATE batch_operations SET status = $1 WHERE id = $2',
        ['running', jobId]
      );

      // Get matching devices
      const devices = await this.findDevicesByFilter(operation.filter);
      const total = devices.length;
      const results: any[] = [];

      // Process each device
      for (const device of devices) {
        try {
          await this.executeBatchOperation(
            operation.operation,
            device.deviceId,
            operation.params
          );
          results.push({ deviceId: device.deviceId, status: 'success' });
        } catch (error: any) {
          results.push({
            deviceId: device.deviceId,
            status: 'failed',
            error: error.message,
          });
        }

        // Update progress
        await this.postgres.query(
          `UPDATE batch_operations
           SET progress = jsonb_set(progress, '{completed}', $1::text::jsonb)
           WHERE id = $2`,
          [results.length, jobId]
        );
      }

      // Mark as completed
      await this.postgres.query(
        `UPDATE batch_operations
         SET status = $1,
             results = $2,
             progress = $3,
             completed_at = NOW()
         WHERE id = $4`,
        [
          'completed',
          JSON.stringify(results),
          JSON.stringify({
            total,
            completed: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'failed').length,
          }),
          jobId,
        ]
      );

      this.logger.info({ jobId, total, results: results.length }, 'Batch operation completed');
    } catch (error) {
      this.logger.error({ error, jobId }, 'Batch operation failed');
      await this.postgres.query(
        'UPDATE batch_operations SET status = $1 WHERE id = $2',
        ['failed', jobId]
      );
    }
  }

  /**
   * Find devices by filter
   */
  private async findDevicesByFilter(filter: any): Promise<Device[]> {
    let query = 'SELECT * FROM devices WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filter.type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(filter.type);
    }

    if (filter.tags && filter.tags.length > 0) {
      query += ` AND tags && $${paramIndex++}`;
      params.push(filter.tags);
    }

    if (filter.location) {
      query += ` AND location->>'name' = $${paramIndex++}`;
      params.push(filter.location);
    }

    const result = await this.postgres.query(query, params);
    return result.rows.map(row => this.mapRowToDevice(row));
  }

  /**
   * Execute batch operation on a single device
   */
  private async executeBatchOperation(
    operation: string,
    deviceId: string,
    params: any
  ): Promise<void> {
    switch (operation) {
      case 'update_firmware':
        await this.updateDevice(deviceId, {
          firmware: {
            version: params.version,
            updateAvailable: true,
          },
        } as any);
        break;

      case 'update_config':
        await this.updateShadowDesired(deviceId, params.config);
        break;

      case 'restart':
        // Publish restart command via MQTT (handled by MQTT broker)
        this.emit('device:command', {
          deviceId,
          command: 'restart',
          params,
        });
        break;

      case 'delete':
        await this.deleteDevice(deviceId);
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Get device count
   */
  async getDeviceCount(): Promise<number> {
    const result = await this.postgres.query('SELECT COUNT(*) FROM devices');
    return parseInt(result.rows[0].count);
  }

  /**
   * Update device statistics (background job)
   */
  async updateDeviceStatistics(): Promise<void> {
    // This would typically calculate aggregated statistics
    // For now, just log
    this.logger.debug('Updating device statistics');
  }

  /**
   * Cache device in Redis
   */
  private async cacheDevice(device: Device): Promise<void> {
    await this.redis.setex(
      `device:${device.deviceId}`,
      300, // 5 minutes
      JSON.stringify(device)
    );
  }

  /**
   * Hash password
   */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Map database row to Device object
   */
  private mapRowToDevice(row: any): Device {
    return {
      id: row.id,
      deviceId: row.device_id,
      type: row.type,
      status: row.status,
      metadata: row.metadata,
      tags: row.tags,
      location: row.location,
      firmware: row.firmware,
      credentials: row.credentials,
      statistics: row.statistics,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
