/**
 * IoT Integration System
 *
 * Real-time sensor data collection, processing, and integration
 * with manufacturing equipment using industrial IoT protocols.
 */

import type {
  Sensor,
  SensorReading,
  SensorDataBatch,
  SensorStatistics,
  IoTDevice,
  IoTProtocol,
  DeviceStatus,
  SensorType,
  AlarmLevel,
  DataQuality,
  Equipment
} from '../types.js';

// ============================================================================
// IoT Integration Engine
// ============================================================================

export class IoTIntegrationEngine {
  private devices: Map<string, IoTDevice> = new Map();
  private sensors: Map<string, Sensor> = new Map();
  private sensorData: Map<string, SensorReading[]> = new Map();
  private config: IoTConfig;
  private dataHandlers: Map<string, DataHandler> = new Map();

  constructor(config: IoTConfig) {
    this.config = config;
  }

  /**
   * Register IoT device
   */
  async registerDevice(device: IoTDevice): Promise<void> {
    console.log(`Registering IoT device: ${device.name} (${device.type})`);

    this.devices.set(device.id, device);

    // Register all sensors from the device
    for (const sensor of device.sensors) {
      this.registerSensor(sensor);
    }

    // Initialize connection based on protocol
    await this.initializeConnection(device);

    console.log(`Device ${device.name} registered successfully with ${device.sensors.length} sensors`);
  }

  /**
   * Register sensor
   */
  registerSensor(sensor: Sensor): void {
    this.sensors.set(sensor.id, sensor);
    this.sensorData.set(sensor.id, []);

    console.log(`Registered sensor: ${sensor.name} (${sensor.type}) - ${sensor.unit}`);
  }

  /**
   * Initialize connection to IoT device
   */
  private async initializeConnection(device: IoTDevice): Promise<void> {
    switch (device.status) {
      case 'ONLINE':
        await this.connectDevice(device);
        break;
      case 'OFFLINE':
        console.warn(`Device ${device.id} is offline`);
        break;
      case 'ERROR':
        console.error(`Device ${device.id} is in error state`);
        break;
    }
  }

  /**
   * Connect to IoT device
   */
  private async connectDevice(device: IoTDevice): Promise<void> {
    // Implementation would vary based on protocol
    console.log(`Connecting to ${device.id} via ${device.sensors[0]?.protocol || 'MQTT'}`);

    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`Connected to device ${device.id}`);
  }

  /**
   * Collect sensor reading
   */
  async collectReading(
    sensorId: string,
    value: number,
    timestamp: Date = new Date()
  ): Promise<SensorReading> {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) {
      throw new Error(`Sensor ${sensorId} not found`);
    }

    // Validate reading
    const quality = this.validateReading(sensor, value);

    // Check for alarms
    const alarm = this.checkAlarms(sensor, value);

    const reading: SensorReading = {
      sensorId,
      timestamp,
      value,
      quality,
      alarm
    };

    // Store reading
    if (!this.sensorData.has(sensorId)) {
      this.sensorData.set(sensorId, []);
    }
    this.sensorData.get(sensorId)!.push(reading);

    // Apply retention policy
    this.applyRetentionPolicy(sensorId);

    // Trigger handlers if alarm
    if (alarm) {
      await this.handleAlarm(sensor, reading);
    }

    return reading;
  }

  /**
   * Collect batch of sensor readings
   */
  async collectBatch(readings: Array<{ sensorId: string; value: number; timestamp: Date }>): Promise<SensorReading[]> {
    const results: SensorReading[] = [];

    for (const { sensorId, value, timestamp } of readings) {
      try {
        const reading = await this.collectReading(sensorId, value, timestamp);
        results.push(reading);
      } catch (error) {
        console.error(`Failed to collect reading for sensor ${sensorId}:`, error);
      }
    }

    return results;
  }

  /**
   * Validate sensor reading
   */
  private validateReading(sensor: Sensor, value: number): DataQuality {
    // Check if value is within reasonable range
    if (isNaN(value) || !isFinite(value)) {
      return 'BAD';
    }

    // Check if value is within normal range
    const [min, max] = sensor.normalRange;
    if (value < min * 0.5 || value > max * 2) {
      return 'BAD';
    }

    if (value < min * 0.8 || value > max * 1.2) {
      return 'UNCERTAIN';
    }

    return 'GOOD';
  }

  /**
   * Check alarm thresholds
   */
  private checkAlarms(sensor: Sensor, value: number): AlarmLevel | undefined {
    const thresholds = sensor.alarmThresholds;
    if (!thresholds || thresholds.length === 0) {
      return undefined;
    }

    // Sort thresholds by level priority
    const sortedThresholds = [...thresholds].sort((a, b) => {
      const order = { CRITICAL: 3, ALARM: 2, WARNING: 1 };
      return order[b.level] - order[a.level];
    });

    // Check each threshold
    for (const threshold of sortedThresholds) {
      if (value >= threshold.value) {
        return threshold.level;
      }
    }

    return undefined;
  }

  /**
   * Handle alarm condition
   */
  private async handleAlarm(sensor: Sensor, reading: SensorReading): Promise<void> {
    console.warn(`ALARM: Sensor ${sensor.name} - ${reading.value} ${sensor.unit} (Level: ${reading.alarm})`);

    // Trigger registered handlers
    const handler = this.dataHandlers.get(sensor.id);
    if (handler) {
      await handler.onAlarm(sensor, reading);
    }

    // Additional alarm handling logic
    if (reading.alarm === 'CRITICAL') {
      await this.handleCriticalAlarm(sensor, reading);
    }
  }

  /**
   * Handle critical alarm
   */
  private async handleCriticalAlarm(sensor: Sensor, reading: SensorReading): Promise<void> {
    console.error(`CRITICAL ALARM: Sensor ${sensor.name} - Equipment ${sensor.equipmentId} may need immediate attention`);

    // In real implementation, would trigger:
    // - Equipment shutdown
    // - Emergency notifications
    // - Automatic work order creation
  }

  /**
   * Apply data retention policy
   */
  private applyRetentionPolicy(sensorId: string): void {
    const data = this.sensorData.get(sensorId);
    if (!data) return;

    const retentionPeriod = this.config.dataRetentionDays * 24 * 3600 * 1000; // Convert to ms
    const cutoffTime = Date.now() - retentionPeriod;

    const filteredData = data.filter(reading => reading.timestamp.getTime() >= cutoffTime);
    this.sensorData.set(sensorId, filteredData);
  }

  /**
   * Get sensor readings for period
   */
  getSensorReadings(
    sensorId: string,
    period?: { start: Date; end: Date }
  ): SensorReading[] {
    const data = this.sensorData.get(sensorId) || [];

    if (!period) {
      return data;
    }

    return data.filter(
      reading => reading.timestamp >= period.start && reading.timestamp <= period.end
    );
  }

  /**
   * Get sensor data batch with statistics
   */
  getSensorDataBatch(
    sensorId: string,
    period: { start: Date; end: Date }
  ): SensorDataBatch {
    const readings = this.getSensorReadings(sensorId, period);
    const statistics = this.calculateSensorStatistics(readings);

    return {
      sensorId,
      readings,
      statistics
    };
  }

  /**
   * Calculate sensor statistics
   */
  private calculateSensorStatistics(readings: SensorReading[]): SensorStatistics {
    if (readings.length === 0) {
      return {
        mean: 0,
        median: 0,
        std: 0,
        min: 0,
        max: 0,
        trend: 0
      };
    }

    const values = readings.map(r => r.value);

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend (simple linear regression slope)
    const trend = this.calculateTrend(values);

    return {
      mean,
      median,
      std,
      min,
      max,
      trend
    };
  }

  /**
   * Calculate trend (linear regression slope)
   */
  private calculateTrend(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;

    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Aggregate sensor data
   */
  aggregateSensorData(
    sensorId: string,
    period: { start: Date; end: Date },
    intervalMinutes: number
  ): AggregatedData[] {
    const readings = this.getSensorReadings(sensorId, period);
    const aggregated: AggregatedData[] = [];

    // Group readings by interval
    const intervals = new Map<number, SensorReading[]>();

    for (const reading of readings) {
      const intervalKey = Math.floor(reading.timestamp.getTime() / (intervalMinutes * 60000));
      if (!intervals.has(intervalKey)) {
        intervals.set(intervalKey, []);
      }
      intervals.get(intervalKey)!.push(reading);
    }

    // Calculate statistics for each interval
    for (const [intervalKey, intervalReadings] of intervals) {
      const timestamp = new Date(intervalKey * intervalMinutes * 60000);
      const statistics = this.calculateSensorStatistics(intervalReadings);

      aggregated.push({
        timestamp,
        count: intervalReadings.length,
        ...statistics
      });
    }

    return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Register data handler
   */
  registerDataHandler(sensorId: string, handler: DataHandler): void {
    this.dataHandlers.set(sensorId, handler);
  }

  /**
   * Get device status
   */
  getDeviceStatus(deviceId: string): DeviceStatus | undefined {
    const device = this.devices.get(deviceId);
    return device?.status;
  }

  /**
   * Update device heartbeat
   */
  updateHeartbeat(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastHeartbeat = new Date();
      device.status = 'ONLINE';
    }
  }

  /**
   * Monitor device health
   */
  async monitorDeviceHealth(): Promise<DeviceHealthReport[]> {
    const reports: DeviceHealthReport[] = [];
    const now = Date.now();

    for (const [deviceId, device] of this.devices) {
      const timeSinceHeartbeat = now - device.lastHeartbeat.getTime();
      const isHealthy = timeSinceHeartbeat < this.config.heartbeatTimeoutMs;

      reports.push({
        deviceId,
        deviceName: device.name,
        status: isHealthy ? device.status : 'OFFLINE',
        lastHeartbeat: device.lastHeartbeat,
        timeSinceHeartbeat,
        isHealthy,
        activeSensors: device.sensors.length
      });

      // Update status if device appears offline
      if (!isHealthy && device.status !== 'OFFLINE') {
        device.status = 'OFFLINE';
        console.warn(`Device ${device.name} appears offline - last heartbeat ${timeSinceHeartbeat}ms ago`);
      }
    }

    return reports;
  }

  /**
   * Get IoT system statistics
   */
  getSystemStatistics(): IoTSystemStatistics {
    const totalDevices = this.devices.size;
    const onlineDevices = Array.from(this.devices.values()).filter(d => d.status === 'ONLINE').length;
    const totalSensors = this.sensors.size;

    let totalReadings = 0;
    let goodReadings = 0;
    let alarmReadings = 0;

    for (const readings of this.sensorData.values()) {
      totalReadings += readings.length;
      goodReadings += readings.filter(r => r.quality === 'GOOD').length;
      alarmReadings += readings.filter(r => r.alarm !== undefined).length;
    }

    const dataQualityPercentage = totalReadings > 0 ? (goodReadings / totalReadings) * 100 : 0;
    const alarmRate = totalReadings > 0 ? (alarmReadings / totalReadings) * 100 : 0;

    return {
      totalDevices,
      onlineDevices,
      offlineDevices: totalDevices - onlineDevices,
      totalSensors,
      totalReadings,
      dataQualityPercentage,
      alarmRate
    };
  }
}

// ============================================================================
// MQTT Client (Simulated)
// ============================================================================

export class MQTTClient {
  private broker: string;
  private port: number;
  private connected: boolean = false;
  private subscriptions: Map<string, SubscriptionHandler> = new Map();

  constructor(broker: string, port: number = 1883) {
    this.broker = broker;
    this.port = port;
  }

  async connect(): Promise<void> {
    console.log(`Connecting to MQTT broker at ${this.broker}:${this.port}`);
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    console.log('Connected to MQTT broker');
  }

  async subscribe(topic: string, handler: SubscriptionHandler): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to MQTT broker');
    }

    this.subscriptions.set(topic, handler);
    console.log(`Subscribed to topic: ${topic}`);
  }

  async publish(topic: string, message: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to MQTT broker');
    }

    console.log(`Publishing to ${topic}: ${message}`);
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.subscriptions.clear();
    console.log('Disconnected from MQTT broker');
  }
}

// ============================================================================
// OPC UA Client (Simulated)
// ============================================================================

export class OPCUAClient {
  private endpoint: string;
  private connected: boolean = false;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async connect(): Promise<void> {
    console.log(`Connecting to OPC UA server at ${this.endpoint}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    console.log('Connected to OPC UA server');
  }

  async readNode(nodeId: string): Promise<number> {
    if (!this.connected) {
      throw new Error('Not connected to OPC UA server');
    }

    // Simulate reading
    return Math.random() * 100;
  }

  async writeNode(nodeId: string, value: number): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to OPC UA server');
    }

    console.log(`Writing to node ${nodeId}: ${value}`);
  }

  async subscribe(nodeId: string, callback: (value: number) => void): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to OPC UA server');
    }

    console.log(`Subscribed to node: ${nodeId}`);
    // In real implementation, would set up subscription
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('Disconnected from OPC UA server');
  }
}

// ============================================================================
// Types
// ============================================================================

export interface IoTConfig {
  dataRetentionDays: number;
  aggregationIntervalSeconds: number;
  heartbeatTimeoutMs: number;
  maxReadingsPerSensor: number;
}

export interface DataHandler {
  onReading?: (sensor: Sensor, reading: SensorReading) => void | Promise<void>;
  onAlarm?: (sensor: Sensor, reading: SensorReading) => void | Promise<void>;
  onBatch?: (sensor: Sensor, batch: SensorDataBatch) => void | Promise<void>;
}

export interface AggregatedData extends SensorStatistics {
  timestamp: Date;
  count: number;
}

export interface DeviceHealthReport {
  deviceId: string;
  deviceName: string;
  status: DeviceStatus;
  lastHeartbeat: Date;
  timeSinceHeartbeat: number;
  isHealthy: boolean;
  activeSensors: number;
}

export interface IoTSystemStatistics {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalSensors: number;
  totalReadings: number;
  dataQualityPercentage: number;
  alarmRate: number;
}

export type SubscriptionHandler = (topic: string, message: string) => void;

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_IOT_CONFIG: IoTConfig = {
  dataRetentionDays: 30,
  aggregationIntervalSeconds: 60,
  heartbeatTimeoutMs: 30000, // 30 seconds
  maxReadingsPerSensor: 10000
};
