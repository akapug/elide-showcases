# IoT Device Management Platform

A production-ready IoT device management system built with TypeScript that provides comprehensive device registration, telemetry processing, remote command/control, firmware updates, and fleet management capabilities.

## Features

### 📱 Device Registration & Authentication
- Secure device registration with unique tokens
- Token-based authentication for WebSocket connections
- Device metadata and tagging
- Hardware and firmware version tracking
- Geolocation support
- Device lifecycle management

### 📊 Telemetry Ingestion & Processing
- Real-time telemetry data ingestion
- Metric aggregation (avg, min, max, sum)
- Time-series data storage
- Configurable time intervals (1m, 5m, 1h, 1d)
- Historical data retention
- Event logging

### 🎮 Command & Control
- Remote command execution
- Command acknowledgment and status tracking
- Asynchronous response handling
- Pending command queue
- Command history and audit trail
- Bulk command execution

### 🔄 Firmware Updates (OTA)
- Over-the-air firmware updates
- Version management
- Update scheduling and progress tracking
- Checksum verification
- Rollback capabilities
- Mandatory vs. optional updates
- Device-type compatibility checking

### 🚢 Fleet Management
- Device grouping into fleets
- Fleet-wide policies
- Bulk operations
- Fleet-level analytics
- Policy enforcement
- Configuration management

### 🚨 Alert & Monitoring
- Anomaly detection
- Threshold-based alerts
- Multi-severity levels (low, medium, high, critical)
- Alert acknowledgment and resolution
- Device health monitoring
- Real-time status tracking

## Architecture

```
┌──────────────────────────────────────────┐
│         IoT Devices (Sensors, etc.)      │
└────────────┬─────────────────────────────┘
             │ WebSocket
             │
┌────────────▼─────────────────────────────┐
│         Device Connection Layer          │
│      (Authentication & WebSocket)        │
└────────────┬─────────────────────────────┘
             │
     ┌───────┼───────┬────────┬────────┐
     │       │       │        │        │
┌────▼───┐ ┌▼────┐ ┌▼─────┐ ┌▼────┐ ┌▼────┐
│Registry│ │Telem│ │Cmds  │ │Firm │ │Fleet│
│        │ │etry │ │      │ │ware │ │     │
└────────┘ └─────┘ └──────┘ └─────┘ └─────┘
```

## API Reference

### HTTP Endpoints

#### Register Device
```http
POST /devices
Content-Type: application/json

{
  "name": "Temperature Sensor #1",
  "type": "temperature_sensor",
  "manufacturer": "SensorCorp",
  "model": "TS-100",
  "firmwareVersion": "1.0.0",
  "hardwareVersion": "1.0",
  "serialNumber": "SN123456",
  "metadata": {
    "room": "Server Room",
    "floor": 3
  },
  "tags": ["production", "critical"]
}

Response:
{
  "device": {
    "id": "device-uuid",
    "status": "offline",
    "registeredAt": "2025-01-01T00:00:00Z",
    ...
  },
  "token": "authentication-token"
}
```

#### List Devices
```http
GET /devices?status=online&type=temperature_sensor

Response:
[
  {
    "id": "device-uuid",
    "name": "Temperature Sensor #1",
    "status": "online",
    "lastSeen": "2025-01-01T00:00:00Z",
    ...
  }
]
```

#### Send Command
```http
POST /devices/:deviceId/commands
Content-Type: application/json

{
  "deviceId": "device-uuid",
  "type": "reboot",
  "payload": {
    "delay": 30
  }
}

Response:
{
  "id": "command-uuid",
  "deviceId": "device-uuid",
  "type": "reboot",
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Get Telemetry
```http
GET /devices/:deviceId/telemetry

Response:
[
  {
    "deviceId": "device-uuid",
    "timestamp": "2025-01-01T00:00:00Z",
    "metrics": {
      "temperature": 72.5,
      "humidity": 45.2,
      "battery": 87
    }
  }
]
```

#### Add Firmware
```http
POST /firmware
Content-Type: application/json

{
  "version": "2.0.0",
  "deviceTypes": ["temperature_sensor", "humidity_sensor"],
  "url": "https://firmware.example.com/v2.0.0.bin",
  "checksum": "sha256:abc123...",
  "size": 2048576,
  "releaseNotes": "Bug fixes and performance improvements",
  "isMandatory": false
}

Response:
{
  "id": "firmware-uuid",
  "version": "2.0.0",
  "releasedAt": "2025-01-01T00:00:00Z",
  ...
}
```

#### Get Alerts
```http
GET /alerts?severity=critical&acknowledged=false

Response:
[
  {
    "id": "alert-uuid",
    "deviceId": "device-uuid",
    "type": "high_temperature",
    "severity": "critical",
    "message": "Temperature 85°C exceeds safe threshold",
    "timestamp": "2025-01-01T00:00:00Z",
    "acknowledged": false
  }
]
```

### WebSocket Protocol

#### Connection
```javascript
const ws = new WebSocket('ws://localhost:3002/?deviceId=device-uuid&token=auth-token');
```

#### Device → Server Messages

**Telemetry Data**
```json
{
  "type": "telemetry",
  "payload": {
    "metrics": {
      "temperature": 72.5,
      "humidity": 45.2,
      "battery": 87,
      "cpu_usage": 45,
      "memory_usage": 62
    },
    "events": [
      {
        "type": "sensor_reading",
        "severity": "info",
        "message": "Temperature within normal range",
        "timestamp": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

**Command Acknowledgment**
```json
{
  "type": "command_ack",
  "payload": {
    "commandId": "command-uuid"
  }
}
```

**Command Result**
```json
{
  "type": "command_result",
  "payload": {
    "commandId": "command-uuid",
    "response": {
      "status": "success",
      "message": "Rebooted successfully"
    },
    "error": null
  }
}
```

**Firmware Update Progress**
```json
{
  "type": "update_progress",
  "payload": {
    "jobId": "job-uuid",
    "progress": 75,
    "status": "downloading"
  }
}
```

#### Server → Device Messages

**Command**
```json
{
  "type": "command",
  "payload": {
    "id": "command-uuid",
    "type": "reboot",
    "payload": {
      "delay": 30
    }
  }
}
```

**Firmware Update**
```json
{
  "type": "firmware_update",
  "payload": {
    "jobId": "job-uuid",
    "firmware": {
      "version": "2.0.0",
      "url": "https://firmware.example.com/v2.0.0.bin",
      "checksum": "sha256:abc123...",
      "size": 2048576
    }
  }
}
```

## Usage

### Installation
```bash
npm install
npm install ws @types/ws
```

### Running the Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Device Client Example

```typescript
import WebSocket from 'ws';

class IoTDevice {
  private ws: WebSocket;
  private deviceId: string;
  private token: string;

  constructor(deviceId: string, token: string) {
    this.deviceId = deviceId;
    this.token = token;
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(
      `ws://localhost:3002/?deviceId=${this.deviceId}&token=${this.token}`
    );

    this.ws.on('open', () => {
      console.log('Connected to IoT Platform');
      this.startTelemetry();
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(message);
    });

    this.ws.on('close', () => {
      console.log('Disconnected, reconnecting...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'command':
        this.handleCommand(message.payload);
        break;
      case 'firmware_update':
        this.handleFirmwareUpdate(message.payload);
        break;
    }
  }

  private handleCommand(command: any) {
    console.log('Received command:', command);

    // Acknowledge command
    this.ws.send(JSON.stringify({
      type: 'command_ack',
      payload: { commandId: command.id }
    }));

    // Execute command
    setTimeout(() => {
      this.ws.send(JSON.stringify({
        type: 'command_result',
        payload: {
          commandId: command.id,
          response: { status: 'success' },
          error: null
        }
      }));
    }, 1000);
  }

  private handleFirmwareUpdate(update: any) {
    console.log('Firmware update available:', update.firmware.version);

    // Simulate download and installation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;

      this.ws.send(JSON.stringify({
        type: 'update_progress',
        payload: {
          jobId: update.jobId,
          progress,
          status: progress < 50 ? 'downloading' : 'installing'
        }
      }));

      if (progress >= 100) {
        clearInterval(interval);
        this.ws.send(JSON.stringify({
          type: 'update_progress',
          payload: {
            jobId: update.jobId,
            progress: 100,
            status: 'completed'
          }
        }));
      }
    }, 1000);
  }

  private startTelemetry() {
    setInterval(() => {
      this.sendTelemetry({
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 20,
        battery: 80 + Math.random() * 20,
        cpu_usage: 30 + Math.random() * 40,
        memory_usage: 50 + Math.random() * 30,
      });
    }, 5000);
  }

  private sendTelemetry(metrics: Record<string, number>) {
    this.ws.send(JSON.stringify({
      type: 'telemetry',
      payload: { metrics }
    }));
  }
}

// Usage
const device = new IoTDevice('device-uuid', 'auth-token');
```

## Configuration

### Environment Variables
```env
PORT=3002
MAX_TELEMETRY_HISTORY=1000
PRESENCE_TIMEOUT=30000
WEBSOCKET_PING_INTERVAL=30000

# Alert thresholds
TEMP_THRESHOLD_CRITICAL=80
BATTERY_THRESHOLD_LOW=10
MEMORY_THRESHOLD_HIGH=90

# Firmware
FIRMWARE_STORAGE_URL=https://firmware.example.com
FIRMWARE_MAX_SIZE=10485760

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost/iot
REDIS_URL=redis://localhost:6379
```

## Production Deployment

### Database Schema
```sql
-- Devices
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(100),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  firmware_version VARCHAR(50),
  hardware_version VARCHAR(50),
  serial_number VARCHAR(100) UNIQUE,
  status VARCHAR(20),
  last_seen TIMESTAMP,
  registered_at TIMESTAMP,
  metadata JSONB,
  tags TEXT[],
  location JSONB,
  fleet_id UUID
);

-- Telemetry
CREATE TABLE telemetry (
  id BIGSERIAL PRIMARY KEY,
  device_id UUID REFERENCES devices(id),
  timestamp TIMESTAMP,
  metrics JSONB,
  events JSONB
);
CREATE INDEX idx_telemetry_device_time ON telemetry(device_id, timestamp DESC);

-- Commands
CREATE TABLE commands (
  id UUID PRIMARY KEY,
  device_id UUID REFERENCES devices(id),
  type VARCHAR(100),
  payload JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP,
  sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT,
  response JSONB
);

-- Firmware
CREATE TABLE firmware (
  id UUID PRIMARY KEY,
  version VARCHAR(50),
  device_types TEXT[],
  url VARCHAR(500),
  checksum VARCHAR(100),
  size BIGINT,
  release_notes TEXT,
  is_mandatory BOOLEAN,
  released_at TIMESTAMP
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  device_id UUID REFERENCES devices(id),
  type VARCHAR(100),
  severity VARCHAR(20),
  message TEXT,
  timestamp TIMESTAMP,
  acknowledged BOOLEAN,
  resolved_at TIMESTAMP
);
CREATE INDEX idx_alerts_device ON alerts(device_id);
CREATE INDEX idx_alerts_severity ON alerts(severity) WHERE NOT acknowledged;
```

### Time-Series Database (TimescaleDB)
```sql
-- Convert telemetry table to hypertable
SELECT create_hypertable('telemetry', 'timestamp');

-- Add retention policy (keep 90 days)
SELECT add_retention_policy('telemetry', INTERVAL '90 days');

-- Create continuous aggregates
CREATE MATERIALIZED VIEW telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT device_id,
       time_bucket('1 hour', timestamp) AS bucket,
       avg((metrics->>'temperature')::float) AS avg_temperature,
       avg((metrics->>'humidity')::float) AS avg_humidity,
       avg((metrics->>'battery')::float) AS avg_battery
FROM telemetry
GROUP BY device_id, bucket;
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iot-platform
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: server
        image: iot-platform:latest
        ports:
        - containerPort: 3002
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          value: redis://redis-service:6379
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

## Security

### Best Practices
1. **Device Authentication**: Rotate device tokens periodically
2. **TLS/SSL**: Use WSS (WebSocket Secure) in production
3. **Rate Limiting**: Prevent telemetry flooding
4. **Input Validation**: Sanitize all device inputs
5. **Firmware Signing**: Verify firmware signatures before OTA
6. **Access Control**: Implement role-based access for API
7. **Audit Logging**: Track all device operations
8. **Network Isolation**: Separate device network from management

## Monitoring

### Key Metrics
- Active device count
- Telemetry ingestion rate
- Command success rate
- Firmware update success rate
- Average device latency
- Alert frequency by severity
- WebSocket connection health

### Example Prometheus Metrics
```typescript
// Track telemetry ingestion
telemetry_ingestion_total.inc();
telemetry_ingestion_rate.observe(rate);

// Track device status
devices_by_status.set({ status: 'online' }, count);

// Track command latency
command_duration_seconds.observe(duration);
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact support@example.com.
