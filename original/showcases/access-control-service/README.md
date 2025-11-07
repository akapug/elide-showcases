# Access Control Service

Enterprise RBAC (Role-Based Access Control) and ABAC (Attribute-Based Access Control) service with comprehensive role management, real-time permission evaluation, flexible policy engine, detailed audit logging, and automated access reviews.

## Features

### Role Management
- Hierarchical role inheritance
- Dynamic role creation and modification
- Role assignment and revocation
- Permission bundling per role
- Role-based access matrix
- Default roles (Admin, Developer, Viewer, Analyst)

### Permission Evaluation
- Real-time access decisions
- Combined RBAC and ABAC evaluation
- Resource pattern matching (wildcards supported)
- Action-level granularity
- Conditional permissions
- Sub-millisecond evaluation time

### Policy Engine
- Attribute-based policies
- Priority-based policy ordering
- Context-aware decisions
- Time-based access control
- IP/network-based restrictions
- Data classification policies
- Allow/deny effects with explicit precedence

### Audit Logging
- Comprehensive access logging
- Decision tracking with reasoning
- User activity monitoring
- Compliance reporting
- Immutable audit trail
- Retention management

### Access Reviews
- Scheduled access reviews
- Automated finding detection
- Unused access identification
- Excessive permission detection
- Role mismatch analysis
- Remediation action tracking

## Architecture

### Access Control Models

**RBAC (Role-Based Access Control)**
- Users assigned to roles
- Roles contain permissions
- Roles can inherit from other roles
- Simple and efficient for common scenarios

**ABAC (Attribute-Based Access Control)**
- Context-aware policies
- User attributes (department, clearance level, etc.)
- Resource attributes (classification, owner, etc.)
- Environmental attributes (time, location, etc.)
- More flexible than RBAC

### Decision Flow

1. Receive access request (user, resource, action, context)
2. Load user profile and roles
3. Collect all permissions via role inheritance
4. Evaluate RBAC permissions
5. Evaluate ABAC policies
6. Combine decisions (deny takes precedence)
7. Log decision and reasoning
8. Return access decision

## API Endpoints

### POST /api/access/evaluate
Evaluate access request and return decision.

**Request:**
```json
{
  "userId": "user2",
  "resource": "api/production/deploy",
  "resourceType": "api",
  "action": "execute",
  "context": {
    "ipAddress": "10.0.0.50",
    "environment": "production",
    "time": {
      "hour": 14,
      "dayOfWeek": 2
    }
  }
}
```

**Response:**
```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "decision": "allow",
  "reason": "Access granted by policies",
  "matchedPolicies": ["perm-dev-api", "policy-business-hours"],
  "evaluationTime": 2.5
}
```

### GET /api/users
Retrieve all users with their roles and attributes.

**Response:**
```json
{
  "users": [
    {
      "id": "user1",
      "username": "alice",
      "email": "alice@example.com",
      "roles": ["admin"],
      "attributes": {
        "department": "engineering",
        "clearanceLevel": "top-secret",
        "employeeId": "E001"
      },
      "createdAt": "2025-11-01T00:00:00.000Z",
      "lastLoginAt": "2025-11-07T10:00:00.000Z"
    }
  ],
  "count": 3
}
```

### GET /api/roles
Retrieve all roles with their permissions.

**Response:**
```json
{
  "roles": [
    {
      "id": "developer",
      "name": "Developer",
      "description": "Development and deployment access",
      "permissions": [
        {
          "id": "perm-dev-api",
          "resource": "api/*",
          "resourceType": "api",
          "actions": ["read", "write", "execute"],
          "effect": "allow"
        }
      ],
      "inheritsFrom": ["viewer"],
      "createdAt": "2025-11-01T00:00:00.000Z",
      "updatedAt": "2025-11-01T00:00:00.000Z"
    }
  ],
  "count": 4
}
```

### POST /api/roles
Create a new role.

**Request:**
```json
{
  "name": "DevOps Engineer",
  "description": "Infrastructure and deployment access",
  "permissions": [
    {
      "id": "perm-devops-infra",
      "resource": "infrastructure/*",
      "resourceType": "service",
      "actions": ["read", "write", "execute", "admin"],
      "effect": "allow"
    }
  ],
  "inheritsFrom": ["developer"]
}
```

**Response:**
```json
{
  "role": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "DevOps Engineer",
    "description": "Infrastructure and deployment access",
    "permissions": [...],
    "inheritsFrom": ["developer"],
    "createdAt": "2025-11-07T10:30:00.000Z",
    "updatedAt": "2025-11-07T10:30:00.000Z"
  }
}
```

### POST /api/users/roles
Assign a role to a user.

**Request:**
```json
{
  "userId": "user3",
  "roleName": "analyst"
}
```

**Response:**
```json
{
  "success": true
}
```

### DELETE /api/users/roles
Revoke a role from a user.

**Request:**
```json
{
  "userId": "user3",
  "roleName": "viewer"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/policies
Retrieve all ABAC policies.

**Response:**
```json
{
  "policies": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Business Hours Access",
      "description": "Allow access only during business hours",
      "version": "1.0",
      "effect": "allow",
      "subjects": ["*"],
      "resources": ["api/production/*"],
      "actions": ["write", "delete"],
      "conditions": [
        {
          "attribute": "time.hour",
          "operator": "greater_than",
          "value": 9
        },
        {
          "attribute": "time.hour",
          "operator": "less_than",
          "value": 17
        }
      ],
      "priority": 100,
      "enabled": true,
      "createdAt": "2025-11-01T00:00:00.000Z"
    }
  ],
  "count": 3
}
```

### GET /api/audit
Retrieve audit logs with filtering.

**Query Parameters:**
- `userId`: Filter by user ID
- `decision`: Filter by decision (allow, deny, not_applicable)

**Response:**
```json
{
  "logs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2025-11-07T10:30:00.000Z",
      "userId": "user2",
      "username": "bob",
      "action": "execute",
      "resource": "api/production/deploy",
      "resourceType": "api",
      "decision": "deny",
      "reason": "Policy Business Hours Access requires time.hour > 9",
      "context": {
        "ipAddress": "10.0.0.50",
        "time": { "hour": 8 }
      },
      "ipAddress": "10.0.0.50"
    }
  ],
  "count": 1
}
```

### POST /api/reviews
Schedule an access review for a user.

**Request:**
```json
{
  "userId": "user3",
  "reviewerId": "user1"
}
```

**Response:**
```json
{
  "review": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user3",
    "reviewerId": "user1",
    "scheduledDate": "2025-11-07T10:30:00.000Z",
    "status": "pending",
    "findings": [
      {
        "type": "unused_access",
        "severity": "medium",
        "description": "User has permissions but no access in last 90 days",
        "affectedPermissions": ["perm-viewer-docs"]
      }
    ],
    "actions": []
  }
}
```

### GET /api/reviews
Retrieve access reviews.

**Query Parameters:**
- `status`: Filter by status (pending, in_progress, completed, overdue)

**Response:**
```json
{
  "reviews": [...],
  "count": 5
}
```

## Usage

### Starting the Service

```bash
bun run server.ts
```

The service will start on `http://localhost:3003`.

### Evaluating Access

```bash
curl -X POST http://localhost:3003/api/access/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user2",
    "resource": "database/dev",
    "resourceType": "database",
    "action": "write",
    "context": {
      "environment": "development",
      "ipAddress": "10.0.0.100"
    }
  }'
```

### Managing Roles

```bash
# View all roles
curl http://localhost:3003/api/roles

# Assign role to user
curl -X POST http://localhost:3003/api/users/roles \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user3",
    "roleName": "developer"
  }'

# Revoke role from user
curl -X DELETE http://localhost:3003/api/users/roles \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user3",
    "roleName": "viewer"
  }'
```

### Viewing Audit Logs

```bash
# All audit logs
curl http://localhost:3003/api/audit

# Denied access attempts
curl "http://localhost:3003/api/audit?decision=deny"

# Specific user's activity
curl "http://localhost:3003/api/audit?userId=user2"
```

### Access Reviews

```bash
# Schedule review
curl -X POST http://localhost:3003/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user3",
    "reviewerId": "user1"
  }'

# View pending reviews
curl "http://localhost:3003/api/reviews?status=pending"
```

## Integration Examples

### Middleware for Web Applications

```typescript
async function authorizationMiddleware(req, res, next) {
  const user = req.user; // From authentication
  const resource = req.path;
  const action = req.method === "GET" ? "read" : "write";

  const decision = await fetch("http://localhost:3003/api/access/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      resource,
      resourceType: "api",
      action,
      context: {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    }),
  }).then(r => r.json());

  if (decision.decision === "allow") {
    next();
  } else {
    res.status(403).json({ error: "Access denied", reason: decision.reason });
  }
}
```

### Database Query Authorization

```typescript
async function authorizeQuery(userId: string, table: string, operation: string) {
  const response = await fetch("http://localhost:3003/api/access/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      resource: `database/${table}`,
      resourceType: "database",
      action: operation,
      context: { timestamp: new Date() },
    }),
  }).then(r => r.json());

  if (response.decision !== "allow") {
    throw new Error(`Database access denied: ${response.reason}`);
  }
}
```

## Production Considerations

- Implement persistent storage for users, roles, and policies (PostgreSQL)
- Cache frequently accessed roles and policies (Redis)
- Implement rate limiting on evaluation endpoint
- Add authentication for administrative endpoints
- Enable encryption for audit logs
- Implement policy version control and rollback
- Add real-time alerts for suspicious access patterns
- Scale horizontally with load balancing
- Implement policy testing and simulation
- Add GraphQL API for complex queries
- Integrate with identity providers (LDAP, SAML, OAuth)

## Best Practices

1. **Principle of Least Privilege**: Grant minimum required permissions
2. **Regular Reviews**: Conduct quarterly access reviews
3. **Audit Everything**: Log all access decisions
4. **Deny by Default**: Require explicit allow policies
5. **Role Hygiene**: Regularly review and clean up unused roles
6. **Separation of Duties**: Prevent conflicts of interest with policies
7. **Time-Limited Access**: Use conditional policies for temporary access
8. **Context Awareness**: Leverage ABAC for sensitive operations

## Compliance

This service supports compliance with:
- SOC 2 (Access Control requirements)
- ISO 27001 (A.9 Access Control)
- GDPR (Article 32 - Access Control)
- HIPAA (164.308 Access Control)
- PCI-DSS (Requirement 7 - Restrict Access)

## License

MIT
