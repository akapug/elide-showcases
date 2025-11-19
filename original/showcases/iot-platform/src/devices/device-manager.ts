/**
 * Elide IoT Platform - Device Manager
 *
 * Manages IoT device lifecycle, registration, communication, and health monitoring.
 * Supports multiple protocols: MQTT, CoAP, HTTP, WebSocket
 */

import {
  Device,
  DeviceId,
  DeviceType,
  DeviceStatus,
  DeviceMetadata,
  ProtocolType,
  MQTTConfig,
  CoAPConfig,
  WebSocketConfig,
  SecurityConfig,
  Event,
  EventType,
  EventSeverity,
  TenantId,
  DeviceCapabilities
} from '../types';

// ============================================================================
// Device Manager Configuration
// ============================================================================

export interface DeviceManagerConfig {
  maxDevices: number;
  protocols: ProtocolType[];
  authentication: 'certificate' | 'token' | 'psk' | 'none';
  healthCheckInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  enableShadow: boolean;
  enableFirmwareUpdate: boolean;
}

export interface DeviceRegistration {
  deviceId: DeviceId;
  type: DeviceType;
  protocol: ProtocolType;
  metadata: DeviceMetadata;
  capabilities?: DeviceCapabilities;
  security?: SecurityConfig;
}

// ============================================================================
// Device Manager Implementation
// ============================================================================

export class DeviceManager {
  private devices: Map<DeviceId, Device> = new Map();
  private devicesByTenant: Map<TenantId, Set<DeviceId>> = new Map();
  private protocolHandlers: Map<ProtocolType, ProtocolHandler> = new Map();
  private healthCheckTimers: Map<DeviceId, NodeJS.Timer> = new Map();
  private eventListeners: Map<EventType, Set<EventListener>> = new Map();
  private deviceShadows: Map<DeviceId, DeviceShadow> = new Map();

  constructor(private config: DeviceManagerConfig) {
    this.initializeProtocolHandlers();
    this.startHealthCheckScheduler();
  }

  // ========================================================================
  // Device Registration & Management
  // ========================================================================

  async registerDevice(registration: DeviceRegistration): Promise<Device> {
    if (this.devices.size >= this.config.maxDevices) {
      throw new Error(`Maximum device limit reached: ${this.config.maxDevices}`);
    }

    if (this.devices.has(registration.deviceId)) {
      throw new Error(`Device already registered: ${registration.deviceId}`);
    }

    const device: Device = {
      id: registration.deviceId,
      tenantId: registration.metadata.customProperties?.tenantId || 'default',
      name: registration.metadata.customProperties?.name || registration.deviceId,
      type: registration.type,
      protocol: registration.protocol,
      status: DeviceStatus.OFFLINE,
      metadata: registration.metadata,
      capabilities: registration.capabilities || this.getDefaultCapabilities(registration.type),
      security: registration.security || this.getDefaultSecurity(),
      lastSeen: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Store device
    this.devices.set(device.id, device);

    // Index by tenant
    if (!this.devicesByTenant.has(device.tenantId)) {
      this.devicesByTenant.set(device.tenantId, new Set());
    }
    this.devicesByTenant.get(device.tenantId)!.add(device.id);

    // Initialize device shadow
    if (this.config.enableShadow) {
      this.initializeDeviceShadow(device.id);
    }

    // Setup protocol handler
    await this.setupDeviceProtocol(device);

    // Start health monitoring
    this.startHealthMonitoring(device.id);

    // Emit registration event
    this.emitEvent({
      id: this.generateEventId(),
      type: EventType.DEVICE_REGISTERED,
      deviceId: device.id,
      tenantId: device.tenantId,
      timestamp: Date.now(),
      data: { device },
      severity: EventSeverity.INFO
    });

    return device;
  }

  async unregisterDevice(deviceId: DeviceId): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    // Stop health monitoring
    this.stopHealthMonitoring(deviceId);

    // Disconnect device
    await this.disconnectDevice(deviceId);

    // Remove from tenant index
    this.devicesByTenant.get(device.tenantId)?.delete(deviceId);

    // Remove device shadow
    this.deviceShadows.delete(deviceId);

    // Remove device
    this.devices.delete(deviceId);

    // Emit event
    this.emitEvent({
      id: this.generateEventId(),
      type: EventType.DEVICE_DISCONNECTED,
      deviceId: device.id,
      tenantId: device.tenantId,
      timestamp: Date.now(),
      data: { reason: 'unregistered' },
      severity: EventSeverity.INFO
    });
  }

  async updateDevice(deviceId: DeviceId, updates: Partial<Device>): Promise<Device> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const updatedDevice: Device = {
      ...device,
      ...updates,
      updatedAt: Date.now()
    };

    this.devices.set(deviceId, updatedDevice);

    // Update device shadow
    if (this.config.enableShadow) {
      await this.updateDeviceShadow(deviceId, updates);
    }

    // Emit event
    this.emitEvent({
      id: this.generateEventId(),
      type: EventType.DEVICE_UPDATED,
      deviceId: device.id,
      tenantId: device.tenantId,
      timestamp: Date.now(),
      data: { updates },
      severity: EventSeverity.INFO
    });

    return updatedDevice;
  }

  getDevice(deviceId: DeviceId): Device | undefined {
    return this.devices.get(deviceId);
  }

  getDevicesByTenant(tenantId: TenantId): Device[] {
    const deviceIds = this.devicesByTenant.get(tenantId);
    if (!deviceIds) return [];

    return Array.from(deviceIds)
      .map(id => this.devices.get(id))
      .filter((d): d is Device => d !== undefined);
  }

  getDevicesByStatus(status: DeviceStatus): Device[] {
    return Array.from(this.devices.values())
      .filter(d => d.status === status);
  }

  getDevicesByType(type: DeviceType): Device[] {
    return Array.from(this.devices.values())
      .filter(d => d.type === type);
  }

  getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getDeviceCount(): number {
    return this.devices.size;
  }

  // ========================================================================
  // Device Connection & Communication
  // ========================================================================

  async connectDevice(deviceId: DeviceId): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const handler = this.protocolHandlers.get(device.protocol);
    if (!handler) {
      throw new Error(`Protocol handler not found: ${device.protocol}`);
    }

    await handler.connect(device);

    await this.updateDeviceStatus(deviceId, DeviceStatus.ONLINE);

    this.emitEvent({
      id: this.generateEventId(),
      type: EventType.DEVICE_CONNECTED,
      deviceId: device.id,
      tenantId: device.tenantId,
      timestamp: Date.now(),
      data: { protocol: device.protocol },
      severity: EventSeverity.INFO
    });
  }

  async disconnectDevice(deviceId: DeviceId): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;

    const handler = this.protocolHandlers.get(device.protocol);
    if (handler) {
      await handler.disconnect(device);
    }

    await this.updateDeviceStatus(deviceId, DeviceStatus.OFFLINE);

    this.emitEvent({
      id: this.generateEventId(),
      type: EventType.DEVICE_DISCONNECTED,
      deviceId: device.id,
      tenantId: device.tenantId,
      timestamp: Date.now(),
      data: { protocol: device.protocol },
      severity: EventSeverity.INFO
    });
  }

  async sendCommand(deviceId: DeviceId, command: DeviceCommand): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    if (device.status !== DeviceStatus.ONLINE) {
      throw new Error(`Device not online: ${deviceId}`);
    }

    const handler = this.protocolHandlers.get(device.protocol);
    if (!handler) {
      throw new Error(`Protocol handler not found: ${device.protocol}`);
    }

    await handler.sendCommand(device, command);
  }

  async sendDataToDevice(deviceId: DeviceId, data: any): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const handler = this.protocolHandlers.get(device.protocol);
    if (!handler) {
      throw new Error(`Protocol handler not found: ${device.protocol}`);
    }

    await handler.send(device, data);
  }

  // ========================================================================
  // Device Shadow (State Synchronization)
  // ========================================================================

  private initializeDeviceShadow(deviceId: DeviceId): void {
    this.deviceShadows.set(deviceId, {
      deviceId,
      desired: {},
      reported: {},
      metadata: {
        desired: {},
        reported: {}
      },
      version: 1,
      timestamp: Date.now()
    });
  }

  async updateDeviceShadow(deviceId: DeviceId, state: any): Promise<void> {
    const shadow = this.deviceShadows.get(deviceId);
    if (!shadow) return;

    shadow.desired = {
      ...shadow.desired,
      ...state
    };
    shadow.version++;
    shadow.timestamp = Date.now();

    // Send shadow update to device
    await this.sendCommand(deviceId, {
      type: 'shadow-update',
      data: shadow.desired
    });
  }

  async reportDeviceState(deviceId: DeviceId, state: any): Promise<void> {
    const shadow = this.deviceShadows.get(deviceId);
    if (!shadow) return;

    shadow.reported = {
      ...shadow.reported,
      ...state
    };
    shadow.version++;
    shadow.timestamp = Date.now();

    // Check for delta (desired vs reported)
    const delta = this.calculateShadowDelta(shadow);
    if (Object.keys(delta).length > 0) {
      // Send delta to device
      await this.sendCommand(deviceId, {
        type: 'shadow-delta',
        data: delta
      });
    }
  }

  private calculateShadowDelta(shadow: DeviceShadow): any {
    const delta: any = {};

    for (const key in shadow.desired) {
      if (shadow.desired[key] !== shadow.reported[key]) {
        delta[key] = shadow.desired[key];
      }
    }

    return delta;
  }

  // ========================================================================
  // Firmware Update Management
  // ========================================================================

  async updateFirmware(deviceId: DeviceId, firmwareUrl: string, version: string): Promise<void> {
    if (!this.config.enableFirmwareUpdate) {
      throw new Error('Firmware update not enabled');
    }

    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    // Put device in maintenance mode
    await this.updateDeviceStatus(deviceId, DeviceStatus.MAINTENANCE);

    try {
      // Send firmware update command
      await this.sendCommand(deviceId, {
        type: 'firmware-update',
        data: {
          url: firmwareUrl,
          version,
          checksum: await this.calculateChecksum(firmwareUrl)
        }
      });

      // Monitor update progress
      await this.monitorFirmwareUpdate(deviceId, version);

      // Update device metadata
      device.metadata.firmwareVersion = version;
      device.updatedAt = Date.now();
      this.devices.set(deviceId, device);

      // Restore device status
      await this.updateDeviceStatus(deviceId, DeviceStatus.ONLINE);
    } catch (error) {
      await this.updateDeviceStatus(deviceId, DeviceStatus.ERROR);
      throw error;
    }
  }

  private async monitorFirmwareUpdate(deviceId: DeviceId, version: string): Promise<void> {
    // Poll device for update status
    const timeout = 300000; // 5 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const device = this.devices.get(deviceId);
      if (device?.metadata.firmwareVersion === version) {
        return;
      }

      await this.sleep(5000); // Poll every 5 seconds
    }

    throw new Error('Firmware update timeout');
  }

  private async calculateChecksum(url: string): Promise<string> {
    // In production, fetch and calculate SHA-256
    return 'sha256-checksum-placeholder';
  }

  // ========================================================================
  // Health Monitoring
  // ========================================================================

  private startHealthCheckScheduler(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private startHealthMonitoring(deviceId: DeviceId): void {
    const timer = setInterval(() => {
      this.checkDeviceHealth(deviceId);
    }, this.config.healthCheckInterval);

    this.healthCheckTimers.set(deviceId, timer);
  }

  private stopHealthMonitoring(deviceId: DeviceId): void {
    const timer = this.healthCheckTimers.get(deviceId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(deviceId);
    }
  }

  private async performHealthChecks(): Promise<void> {
    const devices = Array.from(this.devices.values());

    for (const device of devices) {
      await this.checkDeviceHealth(device.id);
    }
  }

  private async checkDeviceHealth(deviceId: DeviceId): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;

    const timeSinceLastSeen = Date.now() - device.lastSeen;
    const healthCheckThreshold = this.config.healthCheckInterval * 3;

    if (timeSinceLastSeen > healthCheckThreshold) {
      if (device.status === DeviceStatus.ONLINE) {
        // Device went offline
        await this.updateDeviceStatus(deviceId, DeviceStatus.OFFLINE);

        this.emitEvent({
          id: this.generateEventId(),
          type: EventType.DEVICE_DISCONNECTED,
          deviceId: device.id,
          tenantId: device.tenantId,
          timestamp: Date.now(),
          data: { reason: 'health-check-failed' },
          severity: EventSeverity.HIGH
        });

        // Attempt reconnection
        await this.attemptReconnection(deviceId);
      }
    }
  }

  private async attemptReconnection(deviceId: DeviceId): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;

    for (let attempt = 1; attempt <= this.config.reconnectAttempts; attempt++) {
      try {
        await this.sleep(this.config.reconnectDelay * attempt);
        await this.connectDevice(deviceId);
        return; // Success
      } catch (error) {
        if (attempt === this.config.reconnectAttempts) {
          // All attempts failed
          this.emitEvent({
            id: this.generateEventId(),
            type: EventType.DEVICE_ERROR,
            deviceId: device.id,
            tenantId: device.tenantId,
            timestamp: Date.now(),
            data: { error: 'reconnection-failed', attempts: attempt },
            severity: EventSeverity.CRITICAL
          });
        }
      }
    }
  }

  async updateDeviceStatus(deviceId: DeviceId, status: DeviceStatus): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;

    device.status = status;
    device.updatedAt = Date.now();

    if (status === DeviceStatus.ONLINE) {
      device.lastSeen = Date.now();
    }

    this.devices.set(deviceId, device);
  }

  // ========================================================================
  // Protocol Handlers
  // ========================================================================

  private initializeProtocolHandlers(): void {
    if (this.config.protocols.includes(ProtocolType.MQTT)) {
      this.protocolHandlers.set(ProtocolType.MQTT, new MQTTProtocolHandler());
    }

    if (this.config.protocols.includes(ProtocolType.COAP)) {
      this.protocolHandlers.set(ProtocolType.COAP, new CoAPProtocolHandler());
    }

    if (this.config.protocols.includes(ProtocolType.HTTP)) {
      this.protocolHandlers.set(ProtocolType.HTTP, new HTTPProtocolHandler());
    }

    if (this.config.protocols.includes(ProtocolType.WEBSOCKET)) {
      this.protocolHandlers.set(ProtocolType.WEBSOCKET, new WebSocketProtocolHandler());
    }
  }

  private async setupDeviceProtocol(device: Device): Promise<void> {
    const handler = this.protocolHandlers.get(device.protocol);
    if (!handler) {
      throw new Error(`Unsupported protocol: ${device.protocol}`);
    }

    await handler.setup(device);
  }

  // ========================================================================
  // Event System
  // ========================================================================

  on(eventType: EventType, listener: EventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  off(eventType: EventType, listener: EventListener): void {
    this.eventListeners.get(eventType)?.delete(listener);
  }

  private emitEvent(event: Event): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      }
    }

    // Also emit to wildcard listeners
    const wildcardListeners = this.eventListeners.get('*' as EventType);
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in wildcard event listener:', error);
        }
      }
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  private getDefaultCapabilities(type: DeviceType): DeviceCapabilities {
    return {
      sensors: [],
      actuators: [],
      protocols: [ProtocolType.MQTT],
      maxSampleRate: 1000,
      bufferSize: 10000,
      processingPower: 'low' as any,
      storage: {
        type: 'volatile',
        capacity: 1024 * 1024, // 1MB
        writeSpeed: 1000,
        readSpeed: 1000
      }
    };
  }

  private getDefaultSecurity(): SecurityConfig {
    return {
      authentication: {
        method: 'token' as any,
        tokenExpiry: 3600000 // 1 hour
      },
      encryption: {
        enabled: true,
        algorithm: 'aes-256-gcm'
      },
      authorization: {
        roles: ['device'],
        permissions: ['read' as any, 'write' as any]
      }
    };
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown(): Promise<void> {
    // Stop all health monitoring
    for (const deviceId of this.devices.keys()) {
      this.stopHealthMonitoring(deviceId);
    }

    // Disconnect all devices
    for (const deviceId of this.devices.keys()) {
      await this.disconnectDevice(deviceId);
    }

    // Cleanup protocol handlers
    for (const handler of this.protocolHandlers.values()) {
      await handler.cleanup();
    }
  }
}

// ============================================================================
// Protocol Handler Interfaces
// ============================================================================

interface ProtocolHandler {
  setup(device: Device): Promise<void>;
  connect(device: Device): Promise<void>;
  disconnect(device: Device): Promise<void>;
  send(device: Device, data: any): Promise<void>;
  sendCommand(device: Device, command: DeviceCommand): Promise<void>;
  cleanup(): Promise<void>;
}

interface DeviceCommand {
  type: string;
  data: any;
  timeout?: number;
}

interface DeviceShadow {
  deviceId: DeviceId;
  desired: any;
  reported: any;
  metadata: {
    desired: Record<string, any>;
    reported: Record<string, any>;
  };
  version: number;
  timestamp: number;
}

type EventListener = (event: Event) => void;

// ============================================================================
// MQTT Protocol Handler
// ============================================================================

class MQTTProtocolHandler implements ProtocolHandler {
  private connections: Map<DeviceId, any> = new Map();

  async setup(device: Device): Promise<void> {
    // Setup MQTT topics for device
    const topics = {
      telemetry: `devices/${device.id}/telemetry`,
      commands: `devices/${device.id}/commands`,
      status: `devices/${device.id}/status`,
      shadow: `devices/${device.id}/shadow`
    };

    this.connections.set(device.id, { topics });
  }

  async connect(device: Device): Promise<void> {
    // Simulate MQTT connection
    const connection = this.connections.get(device.id);
    if (connection) {
      connection.connected = true;
    }
  }

  async disconnect(device: Device): Promise<void> {
    const connection = this.connections.get(device.id);
    if (connection) {
      connection.connected = false;
    }
  }

  async send(device: Device, data: any): Promise<void> {
    const connection = this.connections.get(device.id);
    if (!connection?.connected) {
      throw new Error('Device not connected');
    }

    // Simulate MQTT publish
    // In production: mqttClient.publish(connection.topics.telemetry, data)
  }

  async sendCommand(device: Device, command: DeviceCommand): Promise<void> {
    const connection = this.connections.get(device.id);
    if (!connection?.connected) {
      throw new Error('Device not connected');
    }

    // Simulate MQTT command
    // In production: mqttClient.publish(connection.topics.commands, command)
  }

  async cleanup(): Promise<void> {
    this.connections.clear();
  }
}

// ============================================================================
// CoAP Protocol Handler
// ============================================================================

class CoAPProtocolHandler implements ProtocolHandler {
  private endpoints: Map<DeviceId, string> = new Map();

  async setup(device: Device): Promise<void> {
    const endpoint = `coap://${device.metadata.customProperties?.ip || 'localhost'}:5683`;
    this.endpoints.set(device.id, endpoint);
  }

  async connect(device: Device): Promise<void> {
    // CoAP is connectionless, just verify endpoint
    const endpoint = this.endpoints.get(device.id);
    if (!endpoint) {
      throw new Error('Endpoint not configured');
    }
  }

  async disconnect(device: Device): Promise<void> {
    // CoAP is connectionless, nothing to disconnect
  }

  async send(device: Device, data: any): Promise<void> {
    const endpoint = this.endpoints.get(device.id);
    if (!endpoint) {
      throw new Error('Endpoint not configured');
    }

    // Simulate CoAP request
    // In production: coap.request({ host, port, method: 'POST', pathname: '/data' })
  }

  async sendCommand(device: Device, command: DeviceCommand): Promise<void> {
    await this.send(device, command);
  }

  async cleanup(): Promise<void> {
    this.endpoints.clear();
  }
}

// ============================================================================
// HTTP Protocol Handler
// ============================================================================

class HTTPProtocolHandler implements ProtocolHandler {
  private endpoints: Map<DeviceId, string> = new Map();

  async setup(device: Device): Promise<void> {
    const endpoint = device.metadata.customProperties?.endpoint ||
                     `http://localhost:8080/devices/${device.id}`;
    this.endpoints.set(device.id, endpoint);
  }

  async connect(device: Device): Promise<void> {
    // HTTP is stateless, just verify endpoint
    const endpoint = this.endpoints.get(device.id);
    if (!endpoint) {
      throw new Error('Endpoint not configured');
    }
  }

  async disconnect(device: Device): Promise<void> {
    // HTTP is stateless, nothing to disconnect
  }

  async send(device: Device, data: any): Promise<void> {
    const endpoint = this.endpoints.get(device.id);
    if (!endpoint) {
      throw new Error('Endpoint not configured');
    }

    // Simulate HTTP POST
    // In production: fetch(endpoint, { method: 'POST', body: JSON.stringify(data) })
  }

  async sendCommand(device: Device, command: DeviceCommand): Promise<void> {
    await this.send(device, command);
  }

  async cleanup(): Promise<void> {
    this.endpoints.clear();
  }
}

// ============================================================================
// WebSocket Protocol Handler
// ============================================================================

class WebSocketProtocolHandler implements ProtocolHandler {
  private connections: Map<DeviceId, any> = new Map();

  async setup(device: Device): Promise<void> {
    const wsUrl = device.metadata.customProperties?.wsUrl ||
                  `ws://localhost:8080/devices/${device.id}`;
    this.connections.set(device.id, { url: wsUrl, connected: false });
  }

  async connect(device: Device): Promise<void> {
    const connection = this.connections.get(device.id);
    if (!connection) {
      throw new Error('Connection not configured');
    }

    // Simulate WebSocket connection
    connection.connected = true;
  }

  async disconnect(device: Device): Promise<void> {
    const connection = this.connections.get(device.id);
    if (connection) {
      connection.connected = false;
    }
  }

  async send(device: Device, data: any): Promise<void> {
    const connection = this.connections.get(device.id);
    if (!connection?.connected) {
      throw new Error('Device not connected');
    }

    // Simulate WebSocket send
    // In production: ws.send(JSON.stringify(data))
  }

  async sendCommand(device: Device, command: DeviceCommand): Promise<void> {
    await this.send(device, command);
  }

  async cleanup(): Promise<void> {
    for (const connection of this.connections.values()) {
      connection.connected = false;
    }
    this.connections.clear();
  }
}
