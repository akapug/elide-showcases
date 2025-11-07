# Threat Detection Service

A comprehensive security threat detection system that analyzes logs, detects patterns, identifies anomalies, integrates with SIEM systems, and manages security alerts.

## Features

### Log Analysis
- Real-time log ingestion and processing
- Support for multiple log sources
- Automatic log rotation (keeps last 10,000 logs in memory)
- Severity classification (low, medium, high, critical)
- Rich metadata support

### Pattern Matching
- Pre-configured threat patterns:
  - SQL Injection detection
  - Cross-Site Scripting (XSS) detection
  - Brute force attack detection
  - Path traversal attempts
  - Privilege escalation attempts
- Regex-based pattern matching
- Extensible pattern library

### Anomaly Detection
- Statistical anomaly detection using Z-scores
- Behavioral analysis for IPs and users
- Threshold-based detection
- Rolling baseline calculation
- Automatic alert generation for high-score anomalies

### SIEM Integration
- Export alerts in multiple formats (JSON, CSV, Syslog)
- Event forwarding to external SIEM systems
- Compatible with Splunk, ELK, QRadar, etc.

### Alert Management
- Automatic alert creation from patterns and anomalies
- Alert status tracking (new, investigating, resolved, false_positive)
- Alert assignment to security analysts
- Severity-based prioritization
- Alert filtering and searching

## API Endpoints

### POST /api/logs
Ingest security logs for analysis.

**Request:**
```json
{
  "source": "web-server",
  "severity": "high",
  "message": "Failed login attempt for user admin",
  "metadata": {
    "endpoint": "/login",
    "method": "POST"
  },
  "ip": "192.168.1.100",
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Log ingested"
}
```

### GET /api/alerts
Retrieve security alerts with optional filtering.

**Query Parameters:**
- `status`: Filter by status (new, investigating, resolved, false_positive)
- `severity`: Filter by severity (low, medium, high, critical)

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert-1699...",
      "timestamp": "2025-11-07T10:30:00.000Z",
      "type": "pattern_match",
      "severity": "critical",
      "title": "SQL Injection Attempt",
      "description": "Detects potential SQL injection patterns: union select * from users",
      "source": "web-server",
      "status": "new",
      "metadata": {...}
    }
  ],
  "count": 1
}
```

### PATCH /api/alerts/:id
Update alert status and assignee.

**Request:**
```json
{
  "status": "investigating",
  "assignee": "security-analyst-1"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/anomalies
Retrieve detected anomalies sorted by score.

**Response:**
```json
{
  "anomalies": [
    {
      "id": "anomaly-1699...",
      "timestamp": "2025-11-07T10:30:00.000Z",
      "type": "threshold",
      "description": "Unusual request rate from IP 192.168.1.100",
      "score": 0.85,
      "baseline": 20,
      "current": 150,
      "affectedEntities": ["192.168.1.100"]
    }
  ],
  "count": 1
}
```

### GET /api/stats
Get system statistics and metrics.

**Response:**
```json
{
  "totalLogs": 5000,
  "totalAlerts": 42,
  "totalAnomalies": 8,
  "alertsByStatus": {
    "new": 15,
    "investigating": 10,
    "resolved": 15,
    "false_positive": 2
  },
  "alertsBySeverity": {
    "critical": 5,
    "high": 12,
    "medium": 18,
    "low": 7
  }
}
```

### GET /api/export
Export alerts in various formats.

**Query Parameters:**
- `format`: Export format (json, csv, syslog)

**Response:** Alert data in requested format

## Usage

### Starting the Service

```bash
bun run server.ts
```

The service will start on `http://localhost:3000`.

### Ingesting Logs

```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "source": "web-server",
    "severity": "high",
    "message": "SELECT * FROM users WHERE id = 1 OR 1=1",
    "ip": "10.0.0.50"
  }'
```

### Viewing Alerts

```bash
# All alerts
curl http://localhost:3000/api/alerts

# New critical alerts only
curl "http://localhost:3000/api/alerts?status=new&severity=critical"
```

### Exporting to SIEM

```bash
# JSON format
curl http://localhost:3000/api/export?format=json > alerts.json

# CSV format
curl http://localhost:3000/api/export?format=csv > alerts.csv

# Syslog format
curl http://localhost:3000/api/export?format=syslog > alerts.log
```

## Architecture

### Components

1. **ThreatDetectionEngine**: Core engine for log analysis and threat detection
2. **Pattern Matching**: Regex-based detection of known attack patterns
3. **Anomaly Detection**: Statistical analysis to identify unusual behavior
4. **Alert Management**: Alert lifecycle management and tracking
5. **SIEM Integration**: Export and integration with enterprise SIEM systems

### Detection Methods

- **Pattern Matching**: Uses regex patterns to identify known attack signatures
- **Statistical Analysis**: Z-score based anomaly detection with rolling baselines
- **Behavioral Analysis**: IP and user behavior tracking
- **Correlation**: Cross-reference multiple signals for threat identification

## Production Considerations

- Implement persistent storage for logs and alerts (PostgreSQL, Elasticsearch)
- Add authentication and authorization
- Scale with message queues (Kafka, RabbitMQ) for high-volume log ingestion
- Implement alert deduplication and correlation
- Add machine learning models for advanced threat detection
- Integrate with incident response platforms
- Configure alert notifications (email, Slack, PagerDuty)
- Implement data retention policies

## License

MIT
