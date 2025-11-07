# Smart Contract Monitor

A production-grade smart contract monitoring service with real-time event listening, state change tracking, intelligent alert system, comprehensive audit logging, and ML-powered anomaly detection.

## Features

- **Event Listening**: Real-time monitoring of contract events
- **State Change Tracking**: Monitor variable changes with historical tracking
- **Alert System**: Configurable alerts with severity levels and acknowledgment
- **Audit Logging**: Complete audit trail of all contract interactions
- **Anomaly Detection**: AI-powered detection of unusual patterns and behaviors
- **Rule Engine**: Flexible rules for custom monitoring scenarios
- **Multi-Contract**: Monitor multiple contracts simultaneously
- **Real-Time Updates**: Event-driven architecture with WebSocket support

## Architecture

### Components

1. **SmartContractMonitor**: Core monitoring engine
   - Event listener and processor
   - State change detector
   - Rule evaluation engine
   - Alert generator
   - Anomaly detection system
   - Audit logger

2. **MonitorAPI**: RESTful HTTP interface
   - Contract management
   - Event and state queries
   - Alert management
   - Rule configuration
   - Audit log access
   - Statistics endpoints

## API Endpoints

### Contract Management

#### List Contracts
```
GET /api/contracts
```

Response:
```json
{
  "count": 1,
  "contracts": [
    {
      "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "name": "Uniswap Token",
      "chain": "ethereum",
      "deployedAt": 1629000000000,
      "owner": "0x1a9C8182C09F50C8318d769245beA52c32BE35BC",
      "verified": true,
      "monitored": true
    }
  ]
}
```

#### Add Contract
```
POST /api/contract/add
```
Body:
```json
{
  "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  "name": "My Contract",
  "chain": "ethereum",
  "abi": [...],
  "deployedAt": 1629000000000,
  "owner": "0x...",
  "verified": true,
  "monitored": false
}
```

#### Start Monitoring
```
POST /api/contract/{address}/start
```

#### Stop Monitoring
```
POST /api/contract/{address}/stop
```

### Event Monitoring

#### Get Events
```
GET /api/events?contract={address}
```

Response:
```json
{
  "count": 150,
  "events": [
    {
      "id": "evt123",
      "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "eventName": "Transfer",
      "blockNumber": 18000500,
      "transactionHash": "0xabc...",
      "logIndex": 3,
      "args": {
        "from": "0x...",
        "to": "0x...",
        "value": "1000000000000000000"
      },
      "timestamp": 1699200000000,
      "processed": true
    }
  ]
}
```

### State Change Tracking

#### Get State Changes
```
GET /api/state-changes?contract={address}
```

Response:
```json
{
  "count": 45,
  "stateChanges": [
    {
      "id": "sc456",
      "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "variable": "totalSupply",
      "oldValue": "1000000000000000000000000",
      "newValue": "1001000000000000000000000",
      "blockNumber": 18000500,
      "transactionHash": "0xdef...",
      "timestamp": 1699200000000
    }
  ]
}
```

### Alert Management

#### Get Alerts
```
GET /api/alerts?contract={addr}&severity={info|warning|critical}&acknowledged={true|false}
```

Response:
```json
{
  "count": 12,
  "alerts": [
    {
      "id": "alert789",
      "severity": "critical",
      "type": "anomaly",
      "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "title": "Anomaly Detected",
      "description": "Large value change detected in totalSupply: 85%",
      "data": {...},
      "timestamp": 1699200000000,
      "acknowledged": false
    }
  ]
}
```

#### Acknowledge Alert
```
POST /api/alert/{id}/acknowledge
```
Body:
```json
{
  "acknowledgedBy": "admin@example.com"
}
```

### Monitoring Rules

#### List Rules
```
GET /api/rules?contract={address}
```

Response:
```json
{
  "count": 3,
  "rules": [
    {
      "id": "rule123",
      "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "type": "event",
      "condition": {
        "eventName": "Transfer"
      },
      "alert": {
        "severity": "info",
        "title": "Transfer Event Detected",
        "notify": ["admin@example.com"]
      },
      "enabled": true
    }
  ]
}
```

#### Add Rule
```
POST /api/rule/add
```
Body:
```json
{
  "id": "rule456",
  "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  "type": "threshold",
  "condition": {
    "variable": "totalSupply",
    "operator": "gt",
    "threshold": "1000000000000000000000000000"
  },
  "alert": {
    "severity": "critical",
    "title": "Supply Threshold Exceeded",
    "notify": ["security@example.com"]
  },
  "enabled": true
}
```

### Audit Logging

#### Get Audit Logs
```
GET /api/audit-logs?contract={addr}&actor={addr}&action={name}&fromBlock={n}&toBlock={n}
```

Response:
```json
{
  "count": 1250,
  "auditLogs": [
    {
      "id": "audit890",
      "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "action": "Transfer",
      "actor": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      "transactionHash": "0xghi...",
      "blockNumber": 18000500,
      "data": {...},
      "gasUsed": "45230",
      "timestamp": 1699200000000
    }
  ]
}
```

### Anomaly Detection

#### Get Anomalies
```
GET /api/anomalies?contract={address}
```

Response:
```json
{
  "count": 8,
  "anomalies": [
    {
      "id": "anom234",
      "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "type": "high_frequency",
      "description": "Unusually high event frequency detected: 45 events in the last minute",
      "confidence": 0.92,
      "severity": "medium",
      "data": {
        "eventCount": 45,
        "timeWindow": 60000
      },
      "timestamp": 1699200000000
    }
  ]
}
```

### Statistics

#### Get Monitoring Stats
```
GET /api/stats?contract={address}
```

Response:
```json
{
  "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  "totalEvents": 1580,
  "totalStateChanges": 245,
  "totalAlerts": 23,
  "activeAlerts": 5,
  "totalAudits": 1580,
  "totalAnomalies": 12,
  "uptime": 3600000,
  "lastBlock": 18000750
}
```

## Anomaly Detection

The system uses multiple detection algorithms:

### High Frequency Detection
Detects unusual spikes in event frequency
- Threshold: >20 events per minute
- Confidence: 85%
- Severity: medium-high

### Large Value Changes
Identifies significant state variable changes
- Threshold: >50% change
- Confidence: 90%
- Severity: high

### Unusual Gas Patterns
Monitors for abnormal gas consumption
- Baseline comparison
- Confidence: 75%
- Severity: medium

### Suspicious Actors
Identifies potentially malicious addresses
- Pattern recognition
- Confidence: 80%
- Severity: high

### New Patterns
Detects previously unseen interaction patterns
- ML-based classification
- Confidence: 70%
- Severity: low-medium

## Alert Severity Levels

- **info**: Informational events, no action required
- **warning**: Potential issues requiring attention
- **critical**: Urgent issues requiring immediate action

## Rule Types

### Event Rules
Trigger on specific contract events
```json
{
  "type": "event",
  "condition": {
    "eventName": "Transfer"
  }
}
```

### State Rules
Monitor state variable changes
```json
{
  "type": "state",
  "condition": {
    "variable": "paused",
    "operator": "eq",
    "threshold": true
  }
}
```

### Threshold Rules
Alert when values exceed thresholds
```json
{
  "type": "threshold",
  "condition": {
    "variable": "totalSupply",
    "operator": "gt",
    "threshold": "1000000000000000000000000000"
  }
}
```

### Pattern Rules
Detect specific event patterns
```json
{
  "type": "pattern",
  "condition": {
    "pattern": "Transfer->Approval->TransferFrom"
  }
}
```

## Usage Examples

### Start Monitoring a Contract
```bash
# Add contract
curl -X POST http://localhost:3000/api/contract/add \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "name": "Uniswap Token",
    "chain": "ethereum",
    "abi": [],
    "verified": true,
    "monitored": false
  }'

# Start monitoring
curl -X POST http://localhost:3000/api/contract/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/start
```

### View Recent Events
```bash
curl "http://localhost:3000/api/events?contract=0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
```

### Check for Alerts
```bash
curl "http://localhost:3000/api/alerts?severity=critical&acknowledged=false"
```

### Add Monitoring Rule
```bash
curl -X POST http://localhost:3000/api/rule/add \
  -H "Content-Type: application/json" \
  -d '{
    "id": "rule-large-transfer",
    "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "type": "event",
    "condition": {
      "eventName": "Transfer"
    },
    "alert": {
      "severity": "warning",
      "title": "Large Transfer Detected",
      "notify": ["security@example.com"]
    },
    "enabled": true
  }'
```

### Review Audit Trail
```bash
curl "http://localhost:3000/api/audit-logs?contract=0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&action=Transfer"
```

## Configuration

Environment variables:
- `PORT`: Server port (default: 3000)

## Production Considerations

1. **Blockchain Connection**: Connect to actual RPC nodes via WebSocket
2. **Database**: Use PostgreSQL with TimescaleDB for time-series data
3. **Message Queue**: Add RabbitMQ/Kafka for event processing
4. **Caching**: Implement Redis for real-time data
5. **Notifications**: Integrate email, Slack, PagerDuty, etc.
6. **ML Models**: Train custom anomaly detection models
7. **Scaling**: Deploy multiple monitor instances with load balancing
8. **Retention**: Implement data archival strategies
9. **Security**: Add authentication and authorization
10. **Monitoring**: Add health checks and performance metrics

## Use Cases

- Security monitoring and threat detection
- Compliance and regulatory reporting
- DeFi protocol monitoring
- DAO governance tracking
- NFT marketplace monitoring
- Gaming asset tracking
- Treasury management
- Incident response and forensics

## License

MIT
