# Compliance Monitoring Service

Enterprise compliance monitoring system with policy enforcement, audit trails, compliance reporting, risk assessment, and automated remediation tracking.

## Features

### Policy Enforcement
- Multi-framework support (SOC 2, HIPAA, GDPR, PCI-DSS, ISO 27001, NIST)
- Rule-based policy engine with conditional evaluation
- Automatic violation detection
- Policy versioning and lifecycle management
- Customizable compliance rules per framework

### Audit Trails
- Comprehensive event logging
- User action tracking
- Resource access monitoring
- Compliance impact assessment
- Immutable audit records

### Compliance Reporting
- Multiple report types (summary, detailed, executive, audit)
- Time-period based reporting
- Framework-specific reports
- Violation analysis and trending
- Remediation status tracking

### Risk Assessment
- Real-time compliance scoring (0-100 scale)
- Risk level categorization (low, medium, high, critical)
- Category-based risk analysis
- Automated recommendations
- Trend analysis and forecasting

### Remediation Tracking
- Automated task creation for violations
- Priority-based assignment
- SLA tracking with due dates
- Progress monitoring
- Resolution documentation

## Supported Frameworks

- **SOC 2** - Security, availability, and confidentiality controls
- **HIPAA** - Protected Health Information (PHI) security
- **GDPR** - EU General Data Protection Regulation
- **PCI-DSS** - Payment Card Industry Data Security Standard
- **ISO 27001** - Information Security Management
- **NIST** - National Institute of Standards and Technology

## API Endpoints

### GET /api/policies
Retrieve compliance policies with optional filtering.

**Query Parameters:**
- `framework`: Filter by framework (SOC2, HIPAA, GDPR, etc.)
- `status`: Filter by status (active, draft, deprecated, archived)

**Response:**
```json
{
  "policies": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "SOC 2 Type II Controls",
      "description": "Security, availability, and confidentiality controls",
      "framework": "SOC2",
      "controls": ["CC6.1", "CC6.2", "CC7.1", "CC7.2"],
      "rules": [...],
      "status": "active",
      "version": "1.0",
      "createdAt": "2025-11-01T00:00:00.000Z",
      "updatedAt": "2025-11-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### POST /api/evaluate
Evaluate resource compliance against active policies.

**Request:**
```json
{
  "resource": {
    "id": "user-123",
    "mfaEnabled": false,
    "encrypted": true
  },
  "resourceType": "user"
}
```

**Response:**
```json
{
  "violations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "policyId": "...",
      "policyName": "SOC 2 Type II Controls",
      "ruleId": "soc2-mfa",
      "ruleName": "Multi-Factor Authentication Required",
      "severity": "high",
      "detectedAt": "2025-11-07T10:30:00.000Z",
      "resource": "user-123",
      "resourceType": "user",
      "description": "All users must have MFA enabled",
      "remediationStatus": "pending",
      "remediationDueDate": "2025-11-14T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### GET /api/violations
Retrieve compliance violations with filtering.

**Query Parameters:**
- `severity`: Filter by severity (low, medium, high, critical)
- `status`: Filter by remediation status (pending, in_progress, completed, failed, deferred)

**Response:**
```json
{
  "violations": [...],
  "count": 10
}
```

### PATCH /api/violations/:id
Update violation remediation status.

**Request:**
```json
{
  "status": "in_progress",
  "notes": "Assigned to security team, MFA enforcement in progress"
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/audit
Log audit event for compliance tracking.

**Request:**
```json
{
  "userId": "user-123",
  "action": "access_phi",
  "resource": "patient-record-456",
  "resourceType": "medical_record",
  "details": {
    "operation": "read",
    "fields": ["name", "diagnosis"]
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "result": "success",
  "complianceImpact": ["HIPAA"]
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/risk
Perform risk assessment for a specific framework.

**Query Parameters:**
- `framework`: Required - Framework to assess (SOC2, HIPAA, GDPR, etc.)

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "framework": "GDPR",
  "assessmentDate": "2025-11-07T10:30:00.000Z",
  "overallRisk": "medium",
  "totalPolicies": 5,
  "violationCount": 12,
  "openViolations": 8,
  "criticalViolations": 2,
  "complianceScore": 78,
  "categories": [
    {
      "name": "Data Protection",
      "score": 85,
      "riskLevel": "low",
      "violations": 2,
      "controls": 8
    }
  ],
  "recommendations": [
    "Address 2 critical violations immediately",
    "3 violations are past due for remediation",
    "Conduct regular compliance training for all staff"
  ]
}
```

### POST /api/reports
Generate compliance report for specified time period.

**Request:**
```json
{
  "framework": "SOC2",
  "reportType": "detailed",
  "periodStart": "2025-10-01T00:00:00.000Z",
  "periodEnd": "2025-10-31T23:59:59.999Z"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "framework": "SOC2",
  "reportType": "detailed",
  "generatedAt": "2025-11-07T10:30:00.000Z",
  "period": {
    "start": "2025-10-01T00:00:00.000Z",
    "end": "2025-10-31T23:59:59.999Z"
  },
  "data": {
    "complianceScore": 85,
    "totalPolicies": 3,
    "violations": {
      "total": 15,
      "bySeverity": {
        "critical": 2,
        "high": 5,
        "medium": 6,
        "low": 2
      },
      "byStatus": {
        "pending": 5,
        "in_progress": 4,
        "completed": 6,
        "failed": 0,
        "deferred": 0
      }
    },
    "auditEvents": 1250,
    "remediationStatus": {
      "total": 15,
      "completed": 6,
      "inProgress": 4,
      "overdue": 2,
      "averageTimeToResolve": 48.5
    }
  }
}
```

## Usage

### Starting the Service

```bash
bun run server.ts
```

The service will start on `http://localhost:3001`.

### Evaluating Compliance

```bash
curl -X POST http://localhost:3001/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "resource": {
      "id": "db-server-01",
      "encrypted": false,
      "backupEnabled": true
    },
    "resourceType": "database"
  }'
```

### Viewing Violations

```bash
# All critical violations
curl "http://localhost:3001/api/violations?severity=critical"

# Pending violations
curl "http://localhost:3001/api/violations?status=pending"
```

### Risk Assessment

```bash
curl "http://localhost:3001/api/risk?framework=GDPR"
```

### Generating Reports

```bash
curl -X POST http://localhost:3001/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "framework": "HIPAA",
    "reportType": "executive",
    "periodStart": "2025-10-01T00:00:00.000Z",
    "periodEnd": "2025-10-31T23:59:59.999Z"
  }'
```

## Architecture

### Components

1. **Policy Engine**: Evaluates resources against compliance policies
2. **Violation Detection**: Identifies non-compliant resources
3. **Audit Logger**: Records all compliance-relevant events
4. **Risk Assessor**: Calculates compliance scores and risk levels
5. **Remediation Tracker**: Manages violation remediation lifecycle
6. **Report Generator**: Creates compliance reports for various stakeholders

### Compliance Scoring

Compliance score is calculated as:
- Base score: 100
- Deduct 2 points per open violation
- Deduct additional 5 points per critical violation
- Minimum score: 0

Risk levels are determined by compliance score:
- **Low**: 90-100
- **Medium**: 70-89
- **High**: 50-69
- **Critical**: 0-49

## Production Considerations

- Implement persistent storage (PostgreSQL with audit tables)
- Add authentication and role-based access control
- Enable encryption for audit logs and sensitive data
- Implement report scheduling and automated delivery
- Add integration with ticketing systems (Jira, ServiceNow)
- Configure alerting for critical violations
- Implement data retention policies per framework requirements
- Add support for custom policy definitions
- Integrate with security tools and SIEM platforms
- Enable multi-tenancy for enterprise deployments

## Compliance Best Practices

1. **Regular Assessments**: Conduct compliance checks at least monthly
2. **Continuous Monitoring**: Enable real-time violation detection
3. **Timely Remediation**: Address critical violations within 24-48 hours
4. **Audit Trail Integrity**: Never delete or modify audit logs
5. **Policy Updates**: Review and update policies quarterly
6. **Training**: Ensure all personnel understand compliance requirements
7. **Documentation**: Maintain comprehensive records for audits

## License

MIT
