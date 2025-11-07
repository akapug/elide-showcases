/**
 * IoT Device Management Platform
 *
 * A production-ready IoT device management system with device registration,
 * telemetry ingestion, command/control, firmware updates, and fleet management.
 *
 * Features:
 * - Device registration and authentication
 * - Real-time telemetry ingestion and processing
 * - Remote command and control
 * - Over-the-air (OTA) firmware updates
 * - Fleet management and organization
 * - Device health monitoring
 * - Alert and anomaly detection
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Device {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  hardwareVersion: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen: Date;
  registeredAt: Date;
  metadata: Record<string, any>;
  tags: string[];
  location?: GeoLocation;
  fleetId?: string;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

interface TelemetryData {
  deviceId: string;
  timestamp: Date;
  metrics: Record<string, number>;
  events?: DeviceEvent[];
}

interface DeviceEvent {
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface Command {
  id: string;
  deviceId: string;
  type: string;
  payload: any;
  status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'failed';
  createdAt: Date;
  sentAt?: Date;
  completedAt?: Date;
  error?: string;
  response?: any;
}

interface FirmwareUpdate {
  id: string;
  version: string;
  deviceTypes: string[];
  url: string;
  checksum: string;
  size: number;
  releaseNotes: string;
  isMandatory: boolean;
  releasedAt: Date;
}

interface UpdateJob {
  id: string;
  deviceId: string;
  firmwareId: string;
  status: 'pending' | 'downloading' | 'installing' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

interface Fleet {
  id: string;
  name: string;
  description: string;
  deviceIds: string[];
  policies: FleetPolicy[];
  createdAt: Date;
}

interface FleetPolicy {
  type: 'update' | 'config' | 'schedule';
  enabled: boolean;
  config: any;
}

interface Alert {
  id: string;
  deviceId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

// ============================================================================
// Device Registry
// ============================================================================

class DeviceRegistry extends EventEmitter {
  private devices: Map<string, Device> = new Map();
  private deviceTokens: Map<string, string> = new Map();

  registerDevice(device: Omit<Device, 'id' | 'registeredAt' | 'lastSeen' | 'status'>): Device {
    const newDevice: Device = {
      ...device,
      id: randomUUID(),
      status: 'offline',
      registeredAt: new Date(),
      lastSeen: new Date(),
    };

    this.devices.set(newDevice.id, newDevice);

    // Generate authentication token
    const token = this.generateDeviceToken(newDevice.id);
    this.deviceTokens.set(newDevice.id, token);

    this.emit('deviceRegistered', newDevice);
    return newDevice;
  }

  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  getAllDevices(filters?: {
    status?: string;
    type?: string;
    fleetId?: string;
    tags?: string[];
  }): Device[] {
    let devices = Array.from(this.devices.values());

    if (filters?.status) {
      devices = devices.filter(d => d.status === filters.status);
    }
    if (filters?.type) {
      devices = devices.filter(d => d.type === filters.type);
    }
    if (filters?.fleetId) {
      devices = devices.filter(d => d.fleetId === filters.fleetId);
    }
    if (filters?.tags && filters.tags.length > 0) {
      devices = devices.filter(d => filters.tags!.some(tag => d.tags.includes(tag)));
    }

    return devices;
  }

  updateDeviceStatus(deviceId: string, status: Device['status']): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = status;
      device.lastSeen = new Date();
      this.emit('deviceStatusChanged', { deviceId, status });
    }
  }

  updateDeviceMetadata(deviceId: string, metadata: Record<string, any>): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.metadata = { ...device.metadata, ...metadata };
      this.emit('deviceMetadataUpdated', { deviceId, metadata });
    }
  }

  authenticateDevice(deviceId: string, token: string): boolean {
    const storedToken = this.deviceTokens.get(deviceId);
    return storedToken === token;
  }

  private generateDeviceToken(deviceId: string): string {
    const secret = 'your-secret-key'; // In production, use env variable
    return createHash('sha256')
      .update(deviceId + secret + Date.now())
      .digest('hex');
  }
}

// ============================================================================
// Telemetry Processor
// ============================================================================

class TelemetryProcessor extends EventEmitter {
  private telemetryHistory: Map<string, TelemetryData[]> = new Map();
  private readonly maxHistorySize = 1000;
  private aggregationIntervals: Map<string, NodeJS.Timeout> = new Map();

  ingestTelemetry(data: TelemetryData): void {
    const history = this.telemetryHistory.get(data.deviceId) || [];
    history.push(data);

    // Keep only recent data
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    this.telemetryHistory.set(data.deviceId, history);
    this.emit('telemetryReceived', data);

    // Check for anomalies
    this.detectAnomalies(data);
  }

  getTelemetry(deviceId: string, timeRange?: { start: Date; end: Date }): TelemetryData[] {
    const history = this.telemetryHistory.get(deviceId) || [];

    if (timeRange) {
      return history.filter(
        t =>
          t.timestamp >= timeRange.start &&
          t.timestamp <= timeRange.end
      );
    }

    return history;
  }

  getAggregatedMetrics(
    deviceId: string,
    metric: string,
    aggregation: 'avg' | 'min' | 'max' | 'sum',
    interval: '1m' | '5m' | '1h' | '1d'
  ): { timestamp: Date; value: number }[] {
    const history = this.getTelemetry(deviceId);
    const intervalMs = this.parseInterval(interval);
    const buckets: Map<number, number[]> = new Map();

    // Group data into time buckets
    for (const data of history) {
      const bucketTime = Math.floor(data.timestamp.getTime() / intervalMs) * intervalMs;
      const values = buckets.get(bucketTime) || [];

      if (data.metrics[metric] !== undefined) {
        values.push(data.metrics[metric]);
      }

      buckets.set(bucketTime, values);
    }

    // Aggregate each bucket
    const results: { timestamp: Date; value: number }[] = [];
    for (const [bucketTime, values] of buckets.entries()) {
      let aggregatedValue: number;

      switch (aggregation) {
        case 'avg':
          aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        case 'sum':
          aggregatedValue = values.reduce((a, b) => a + b, 0);
          break;
      }

      results.push({
        timestamp: new Date(bucketTime),
        value: aggregatedValue,
      });
    }

    return results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private parseInterval(interval: string): number {
    const intervals: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    return intervals[interval] || 60 * 1000;
  }

  private detectAnomalies(data: TelemetryData): void {
    // Simple anomaly detection - in production, use ML models
    for (const [metric, value] of Object.entries(data.metrics)) {
      // Temperature check
      if (metric === 'temperature' && value > 80) {
        this.emit('anomalyDetected', {
          deviceId: data.deviceId,
          type: 'high_temperature',
          severity: 'critical',
          message: `Temperature ${value}°C exceeds safe threshold`,
          metric,
          value,
        });
      }

      // Battery check
      if (metric === 'battery' && value < 10) {
        this.emit('anomalyDetected', {
          deviceId: data.deviceId,
          type: 'low_battery',
          severity: 'warning',
          message: `Battery level ${value}% is critically low`,
          metric,
          value,
        });
      }

      // Memory check
      if (metric === 'memory_usage' && value > 90) {
        this.emit('anomalyDetected', {
          deviceId: data.deviceId,
          type: 'high_memory',
          severity: 'high',
          message: `Memory usage ${value}% is critically high`,
          metric,
          value,
        });
      }
    }
  }
}

// ============================================================================
// Command Controller
// ============================================================================

class CommandController extends EventEmitter {
  private commands: Map<string, Command> = new Map();
  private deviceCommands: Map<string, string[]> = new Map();

  sendCommand(deviceId: string, type: string, payload: any): Command {
    const command: Command = {
      id: randomUUID(),
      deviceId,
      type,
      payload,
      status: 'pending',
      createdAt: new Date(),
    };

    this.commands.set(command.id, command);

    const deviceCmds = this.deviceCommands.get(deviceId) || [];
    deviceCmds.push(command.id);
    this.deviceCommands.set(deviceId, deviceCmds);

    this.emit('commandCreated', command);
    return command;
  }

  acknowledgeCommand(commandId: string): void {
    const command = this.commands.get(commandId);
    if (command && command.status === 'sent') {
      command.status = 'acknowledged';
      this.emit('commandAcknowledged', command);
    }
  }

  completeCommand(commandId: string, response?: any, error?: string): void {
    const command = this.commands.get(commandId);
    if (!command) return;

    if (error) {
      command.status = 'failed';
      command.error = error;
    } else {
      command.status = 'completed';
      command.response = response;
    }

    command.completedAt = new Date();
    this.emit('commandCompleted', command);
  }

  getCommand(commandId: string): Command | undefined {
    return this.commands.get(commandId);
  }

  getDeviceCommands(deviceId: string): Command[] {
    const commandIds = this.deviceCommands.get(deviceId) || [];
    return commandIds.map(id => this.commands.get(id)!).filter(Boolean);
  }

  getPendingCommands(deviceId: string): Command[] {
    return this.getDeviceCommands(deviceId).filter(
      cmd => cmd.status === 'pending' || cmd.status === 'sent'
    );
  }
}

// ============================================================================
// Firmware Manager
// ============================================================================

class FirmwareManager extends EventEmitter {
  private firmwares: Map<string, FirmwareUpdate> = new Map();
  private updateJobs: Map<string, UpdateJob> = new Map();

  addFirmware(firmware: Omit<FirmwareUpdate, 'id' | 'releasedAt'>): FirmwareUpdate {
    const newFirmware: FirmwareUpdate = {
      ...firmware,
      id: randomUUID(),
      releasedAt: new Date(),
    };

    this.firmwares.set(newFirmware.id, newFirmware);
    this.emit('firmwareAdded', newFirmware);
    return newFirmware;
  }

  getLatestFirmware(deviceType: string): FirmwareUpdate | undefined {
    const compatible = Array.from(this.firmwares.values())
      .filter(fw => fw.deviceTypes.includes(deviceType))
      .sort((a, b) => b.releasedAt.getTime() - a.releasedAt.getTime());

    return compatible[0];
  }

  scheduleUpdate(deviceId: string, firmwareId: string): UpdateJob {
    const job: UpdateJob = {
      id: randomUUID(),
      deviceId,
      firmwareId,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    };

    this.updateJobs.set(job.id, job);
    this.emit('updateScheduled', job);
    return job;
  }

  updateProgress(jobId: string, progress: number, status?: UpdateJob['status']): void {
    const job = this.updateJobs.get(jobId);
    if (!job) return;

    job.progress = progress;
    if (status) {
      job.status = status;
    }

    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date();
    }

    this.emit('updateProgress', job);
  }

  getUpdateJob(jobId: string): UpdateJob | undefined {
    return this.updateJobs.get(jobId);
  }

  getDeviceUpdates(deviceId: string): UpdateJob[] {
    return Array.from(this.updateJobs.values()).filter(job => job.deviceId === deviceId);
  }
}

// ============================================================================
// Fleet Manager
// ============================================================================

class FleetManager extends EventEmitter {
  private fleets: Map<string, Fleet> = new Map();

  createFleet(name: string, description: string): Fleet {
    const fleet: Fleet = {
      id: randomUUID(),
      name,
      description,
      deviceIds: [],
      policies: [],
      createdAt: new Date(),
    };

    this.fleets.set(fleet.id, fleet);
    this.emit('fleetCreated', fleet);
    return fleet;
  }

  addDeviceToFleet(fleetId: string, deviceId: string): void {
    const fleet = this.fleets.get(fleetId);
    if (fleet && !fleet.deviceIds.includes(deviceId)) {
      fleet.deviceIds.push(deviceId);
      this.emit('deviceAddedToFleet', { fleetId, deviceId });
    }
  }

  removeDeviceFromFleet(fleetId: string, deviceId: string): void {
    const fleet = this.fleets.get(fleetId);
    if (fleet) {
      fleet.deviceIds = fleet.deviceIds.filter(id => id !== deviceId);
      this.emit('deviceRemovedFromFleet', { fleetId, deviceId });
    }
  }

  addPolicy(fleetId: string, policy: FleetPolicy): void {
    const fleet = this.fleets.get(fleetId);
    if (fleet) {
      fleet.policies.push(policy);
      this.emit('policyAdded', { fleetId, policy });
    }
  }

  getFleet(fleetId: string): Fleet | undefined {
    return this.fleets.get(fleetId);
  }

  getAllFleets(): Fleet[] {
    return Array.from(this.fleets.values());
  }
}

// ============================================================================
// Alert Manager
// ============================================================================

class AlertManager extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();

  createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: randomUUID(),
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.set(newAlert.id, newAlert);
    this.emit('alertCreated', newAlert);
    return newAlert;
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.emit('alertResolved', alert);
    }
  }

  getAlerts(filters?: {
    deviceId?: string;
    severity?: string;
    acknowledged?: boolean;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filters?.deviceId) {
      alerts = alerts.filter(a => a.deviceId === filters.deviceId);
    }
    if (filters?.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    if (filters?.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === filters.acknowledged);
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// ============================================================================
// IoT Platform Server
// ============================================================================

class IoTPlatformServer {
  private httpServer: any;
  private wss: WebSocketServer;
  private deviceRegistry: DeviceRegistry;
  private telemetryProcessor: TelemetryProcessor;
  private commandController: CommandController;
  private firmwareManager: FirmwareManager;
  private fleetManager: FleetManager;
  private alertManager: AlertManager;
  private deviceConnections: Map<string, WebSocket> = new Map();

  constructor() {
    this.httpServer = createServer((req, res) => this.handleHttpRequest(req, res));
    this.wss = new WebSocketServer({ server: this.httpServer });
    this.deviceRegistry = new DeviceRegistry();
    this.telemetryProcessor = new TelemetryProcessor();
    this.commandController = new CommandController();
    this.firmwareManager = new FirmwareManager();
    this.fleetManager = new FleetManager();
    this.alertManager = new AlertManager();

    this.setupWebSocket();
    this.setupEventListeners();
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      const deviceId = url.searchParams.get('deviceId');
      const token = url.searchParams.get('token');

      if (!deviceId || !token) {
        ws.close(1008, 'Missing deviceId or token');
        return;
      }

      if (!this.deviceRegistry.authenticateDevice(deviceId, token)) {
        ws.close(1008, 'Invalid token');
        return;
      }

      this.deviceConnections.set(deviceId, ws);
      this.deviceRegistry.updateDeviceStatus(deviceId, 'online');

      ws.on('message', (data: string) => {
        this.handleDeviceMessage(deviceId, data);
      });

      ws.on('close', () => {
        this.deviceConnections.delete(deviceId);
        this.deviceRegistry.updateDeviceStatus(deviceId, 'offline');
      });

      // Send pending commands
      this.sendPendingCommands(deviceId, ws);
    });
  }

  private setupEventListeners(): void {
    this.commandController.on('commandCreated', (command: Command) => {
      const ws = this.deviceConnections.get(command.deviceId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'command', payload: command }));
        command.status = 'sent';
        command.sentAt = new Date();
      }
    });

    this.telemetryProcessor.on('anomalyDetected', (anomaly: any) => {
      this.alertManager.createAlert({
        deviceId: anomaly.deviceId,
        type: anomaly.type,
        severity: anomaly.severity,
        message: anomaly.message,
      });
    });

    this.firmwareManager.on('updateScheduled', (job: UpdateJob) => {
      const firmware = this.firmwareManager.getUpdateJob(job.id);
      const ws = this.deviceConnections.get(job.deviceId);

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'firmware_update', payload: { jobId: job.id, firmware } }));
      }
    });
  }

  private handleDeviceMessage(deviceId: string, data: string): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'telemetry':
          this.telemetryProcessor.ingestTelemetry({
            deviceId,
            timestamp: new Date(),
            metrics: message.payload.metrics,
            events: message.payload.events,
          });
          break;

        case 'command_ack':
          this.commandController.acknowledgeCommand(message.payload.commandId);
          break;

        case 'command_result':
          this.commandController.completeCommand(
            message.payload.commandId,
            message.payload.response,
            message.payload.error
          );
          break;

        case 'update_progress':
          this.firmwareManager.updateProgress(
            message.payload.jobId,
            message.payload.progress,
            message.payload.status
          );
          break;
      }
    } catch (error) {
      console.error('Error parsing device message:', error);
    }
  }

  private sendPendingCommands(deviceId: string, ws: WebSocket): void {
    const pending = this.commandController.getPendingCommands(deviceId);
    for (const command of pending) {
      ws.send(JSON.stringify({ type: 'command', payload: command }));
      command.status = 'sent';
      command.sentAt = new Date();
    }
  }

  private async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    try {
      if (req.method === 'POST' && url.pathname === '/devices') {
        await this.handleRegisterDevice(req, res);
      } else if (req.method === 'GET' && url.pathname === '/devices') {
        await this.handleGetDevices(req, res);
      } else if (req.method === 'POST' && url.pathname.includes('/commands')) {
        await this.handleSendCommand(req, res);
      } else if (req.method === 'GET' && url.pathname.includes('/telemetry')) {
        await this.handleGetTelemetry(req, res);
      } else if (req.method === 'POST' && url.pathname.includes('/firmware')) {
        await this.handleAddFirmware(req, res);
      } else if (req.method === 'GET' && url.pathname === '/alerts') {
        await this.handleGetAlerts(req, res);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error: any) {
      console.error('Request error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  private async handleRegisterDevice(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const deviceData = JSON.parse(body);
    const device = this.deviceRegistry.registerDevice(deviceData);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ device, token: this.deviceRegistry['deviceTokens'].get(device.id) }));
  }

  private async handleGetDevices(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const devices = this.deviceRegistry.getAllDevices();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(devices));
  }

  private async handleSendCommand(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { deviceId, type, payload } = JSON.parse(body);
    const command = this.commandController.sendCommand(deviceId, type, payload);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(command));
  }

  private async handleGetTelemetry(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const deviceId = req.url?.split('/')[2];
    const telemetry = this.telemetryProcessor.getTelemetry(deviceId || '');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(telemetry));
  }

  private async handleAddFirmware(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const firmwareData = JSON.parse(body);
    const firmware = this.firmwareManager.addFirmware(firmwareData);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(firmware));
  }

  private async handleGetAlerts(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const alerts = this.alertManager.getAlerts();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(alerts));
  }

  start(port: number = 3002): void {
    this.httpServer.listen(port, () => {
      console.log(`IoT Platform Server running on port ${port}`);
      console.log(`WebSocket endpoint: ws://localhost:${port}/?deviceId=<id>&token=<token>`);
    });
  }
}

// ============================================================================
// Bootstrap
// ============================================================================

if (require.main === module) {
  const server = new IoTPlatformServer();
  server.start(3002);
}

export {
  IoTPlatformServer,
  DeviceRegistry,
  TelemetryProcessor,
  CommandController,
  FirmwareManager,
  FleetManager,
  AlertManager,
};
