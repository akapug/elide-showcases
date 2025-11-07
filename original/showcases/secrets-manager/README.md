# Secrets Manager

A production-ready secrets management service with AES-256-GCM encryption at rest, automatic key rotation, granular access policies, comprehensive audit logging, and full version control.

## Overview

This showcase demonstrates a complete secrets management system that:
- Encrypts secrets at rest using AES-256-GCM
- Supports automatic and manual key rotation
- Maintains full version history for all secrets
- Enforces granular access control policies
- Logs all operations for compliance auditing
- Provides secret rotation with configurable policies
- Offers path-based organization

## Architecture

### Components

1. **Encryption Service**
   - AES-256-GCM encryption algorithm
   - Key generation and versioning
   - Key rotation with automatic deprecation
   - Decryption with key version support

2. **Secret Storage**
   - Encrypted value storage
   - Path-based organization
   - Metadata and tags support
   - Fast lookups by ID or path

3. **Version Control**
   - Maintains up to 10 previous versions
   - Version retrieval and restoration
   - Deprecation marking
   - Automatic cleanup of old versions

4. **Access Control**
   - Resource-based policies
   - Principal (user/service) authentication
   - Action-level permissions (read, write, delete, list, rotate)
   - Wildcard pattern matching
   - Explicit deny support

5. **Audit Logger**
   - Records all access attempts
   - Success/denied/error tracking
   - Queryable log storage
   - IP address recording
   - Metadata capture

6. **Rotation Manager**
   - Scheduled automatic rotation
   - Manual rotation trigger
   - Policy-based intervals
   - Re-encryption with latest keys

## Secret Structure

```typescript
{
  "id": "secret-1",
  "name": "Database Password",
  "path": "/prod/database/password",
  "description": "Production database credentials",
  "encryptedValue": "[ENCRYPTED]",
  "keyVersion": 2,
  "version": 3,
  "metadata": {
    "environment": "production",
    "owner": "platform-team"
  },
  "tags": ["database", "critical"],
  "createdAt": "2025-01-01T00:00:00Z",
  "createdBy": "admin",
  "updatedAt": "2025-01-15T00:00:00Z",
  "updatedBy": "admin",
  "rotationPolicy": {
    "enabled": true,
    "intervalDays": 30,
    "lastRotation": "2025-01-15T00:00:00Z",
    "nextRotation": "2025-02-14T00:00:00Z"
  }
}
```

## API Endpoints

### Health & Info
- `GET /` - Service information
- `GET /health` - Health check

### Secret Operations
- `POST /secrets` - Create secret
- `GET /secrets?prefix={path}` - List secrets
- `GET /secrets/{id}` - Get secret (decrypted)
- `PUT /secrets/{id}` - Update secret
- `DELETE /secrets/{id}` - Delete secret

### Version Management
- `GET /secrets/{id}/versions` - List all versions
- `GET /secrets/{id}/versions/{version}` - Get specific version

### Rotation
- `POST /secrets/{id}/rotate` - Manually rotate secret

### Access Control
- `POST /policies` - Create access policy
- `GET /policies?principal={user}` - List policies

### Audit
- `GET /audit?principal={user}&action={action}&result={result}` - Query audit logs

### Key Management
- `GET /keys` - List encryption key versions
- `POST /keys/rotate` - Rotate encryption keys

## Usage

### Starting the Service

```bash
# Default port 3003
npm start

# Custom port
PORT=8080 npm start
```

### Creating a Secret

```bash
curl -X POST http://localhost:3003/secrets \
  -H "Content-Type: application/json" \
  -H "X-Principal: admin" \
  -d '{
    "name": "API Key",
    "path": "/prod/api/key",
    "value": "super-secret-api-key-12345",
    "description": "Production API key",
    "metadata": {
      "service": "payment-gateway",
      "environment": "production"
    },
    "tags": ["api", "production"],
    "rotationPolicy": {
      "enabled": true,
      "intervalDays": 90
    }
  }'
```

### Getting a Secret

```bash
curl http://localhost:3003/secrets/secret-1 \
  -H "X-Principal: admin"
```

Response:
```json
{
  "id": "secret-1",
  "name": "API Key",
  "path": "/prod/api/key",
  "value": "super-secret-api-key-12345",
  "version": 1,
  "metadata": {
    "service": "payment-gateway"
  },
  "tags": ["api", "production"]
}
```

### Updating a Secret

```bash
curl -X PUT http://localhost:3003/secrets/secret-1 \
  -H "Content-Type: application/json" \
  -H "X-Principal: admin" \
  -d '{
    "value": "new-secret-value-67890",
    "metadata": {
      "service": "payment-gateway",
      "updated": "true"
    }
  }'
```

### Listing Secrets

```bash
# List all secrets
curl http://localhost:3003/secrets \
  -H "X-Principal: admin"

# List secrets with path prefix
curl http://localhost:3003/secrets?prefix=/prod/ \
  -H "X-Principal: admin"
```

### Rotating a Secret

```bash
curl -X POST http://localhost:3003/secrets/secret-1/rotate \
  -H "X-Principal: admin"
```

### Viewing Version History

```bash
# List all versions
curl http://localhost:3003/secrets/secret-1/versions \
  -H "X-Principal: admin"

# Get specific version
curl http://localhost:3003/secrets/secret-1/versions/2 \
  -H "X-Principal: admin"
```

### Deleting a Secret

```bash
curl -X DELETE http://localhost:3003/secrets/secret-1 \
  -H "X-Principal: admin"
```

## Encryption

### Algorithm

- **Cipher**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes)
- **Authentication**: Built-in with GCM mode

### Key Management

1. **Key Generation**: Random 256-bit keys generated using Node.js crypto
2. **Key Versioning**: Each key has a unique version number
3. **Key Rotation**: New keys generated, old keys deprecated (not destroyed)
4. **Backward Compatibility**: Old keys retained for decrypting existing secrets

### Encryption Flow

```
Plaintext → AES-256-GCM Encrypt → Ciphertext + IV + Key Version → Storage
```

### Decryption Flow

```
Storage → Retrieve by Key Version → AES-256-GCM Decrypt → Plaintext
```

## Key Rotation

### Manual Rotation

```bash
# Rotate encryption keys
curl -X POST http://localhost:3003/keys/rotate

# View key versions
curl http://localhost:3003/keys
```

### Automatic Secret Rotation

Secrets with rotation policies are automatically rotated:

```typescript
{
  "rotationPolicy": {
    "enabled": true,
    "intervalDays": 30  // Rotate every 30 days
  }
}
```

The rotation manager checks every minute for secrets due for rotation.

### Re-encryption

When keys are rotated, secrets can be re-encrypted:

```bash
# This re-encrypts the secret with the latest key
curl -X POST http://localhost:3003/secrets/secret-1/rotate
```

## Access Control

### Policy Structure

```typescript
{
  "principal": "developer",
  "resource": "/prod/*",
  "actions": ["read", "list"],
  "effect": "allow",
  "conditions": {
    "ipRange": "10.0.0.0/8"
  }
}
```

### Creating Policies

```bash
# Allow developer to read production secrets
curl -X POST http://localhost:3003/policies \
  -H "Content-Type: application/json" \
  -d '{
    "principal": "developer",
    "resource": "/prod/*",
    "actions": ["read", "list"],
    "effect": "allow"
  }'

# Deny access to sensitive secrets
curl -X POST http://localhost:3003/policies \
  -H "Content-Type: application/json" \
  -d '{
    "principal": "contractor",
    "resource": "/prod/database/*",
    "actions": ["read", "write", "delete"],
    "effect": "deny"
  }'
```

### Permission Types

- **read**: View secret values
- **write**: Create and update secrets
- **delete**: Remove secrets
- **list**: List secrets in a path
- **rotate**: Trigger secret rotation

### Resource Patterns

- Exact match: `/prod/database/password`
- Wildcard: `/prod/*` (matches all under /prod)
- All resources: `*`

### Evaluation Order

1. **Explicit Deny**: Always takes precedence
2. **Allow**: Granted if no deny exists
3. **Default**: Denied if no matching policy

## Audit Logging

### Log Structure

```typescript
{
  "id": "log-123",
  "timestamp": "2025-01-01T12:00:00Z",
  "principal": "admin",
  "action": "read_secret",
  "resource": "/prod/api/key",
  "result": "success",
  "metadata": {
    "version": 3
  },
  "ip": "192.168.1.100"
}
```

### Querying Logs

```bash
# All logs for a user
curl 'http://localhost:3003/audit?principal=admin'

# Failed access attempts
curl 'http://localhost:3003/audit?result=denied'

# Specific action
curl 'http://localhost:3003/audit?action=delete_secret'

# Time range
curl 'http://localhost:3003/audit?startTime=2025-01-01T00:00:00Z&endTime=2025-01-31T23:59:59Z'

# Combined filters with limit
curl 'http://localhost:3003/audit?principal=admin&action=read_secret&limit=50'
```

### Audit Events

- **create_secret**: Secret created
- **read_secret**: Secret value accessed
- **update_secret**: Secret updated
- **delete_secret**: Secret deleted
- **list_secrets**: Secrets listed
- **rotate_secret**: Secret rotated
- **read_version**: Historical version accessed

### Compliance

Audit logs support compliance requirements:
- **SOC 2**: Access logging and monitoring
- **PCI DSS**: Key and secret access tracking
- **HIPAA**: PHI access auditing
- **GDPR**: Data access records

## Version Control

### Versioning

- Each secret update creates a new version
- Up to 10 versions retained (configurable)
- Versions include complete encryption metadata
- Old versions can be retrieved or restored

### Version Lifecycle

```
Create (v1) → Update (v2) → Update (v3) → ... → Update (v11)
                                                   ↓
                                            v1 deleted (oldest)
```

### Restoring Versions

```bash
# Get old version
OLD_VALUE=$(curl http://localhost:3003/secrets/secret-1/versions/2 | jq -r '.value')

# Update to old value (creates new version)
curl -X PUT http://localhost:3003/secrets/secret-1 \
  -H "Content-Type: application/json" \
  -d "{\"value\": \"$OLD_VALUE\"}"
```

## Production Features

### Security
- AES-256-GCM encryption (FIPS 140-2 compliant)
- Unique IV per encryption operation
- Key versioning prevents re-encryption delays
- Access control with deny precedence
- Comprehensive audit logging
- IP address tracking

### Reliability
- Atomic updates
- Version rollback capability
- Key retention for backward compatibility
- Error handling and logging
- Health check endpoint

### Scalability
- In-memory caching for fast access
- Path-based indexing
- Efficient policy evaluation
- Configurable log retention
- Horizontal scaling ready

### Compliance
- Encryption at rest
- Access audit trails
- Key rotation policies
- Version retention
- Principal attribution

## Extending the Service

### Add Database Backend

```typescript
// PostgreSQL for metadata
class PostgresSecretStorage {
  async store(secret: Secret) {
    await db.query(
      'INSERT INTO secrets (id, path, encrypted_value, ...) VALUES ($1, $2, $3, ...)',
      [secret.id, secret.path, secret.encryptedValue, ...]
    );
  }
}

// Redis for caching
class RedisCache {
  async get(key: string) {
    return await redis.get(key);
  }
}
```

### Add External KMS

```typescript
// AWS KMS integration
class KMSEncryptionService {
  async encrypt(plaintext: string) {
    const result = await kms.encrypt({
      KeyId: keyId,
      Plaintext: plaintext
    });
    return result.CiphertextBlob;
  }
}
```

### Add Notifications

```typescript
// Notify on secret access
class NotificationService {
  async notifyAccess(secret: Secret, principal: string) {
    await slack.send({
      text: `Secret ${secret.path} accessed by ${principal}`
    });
  }
}
```

### Add Secret Generation

```typescript
// Auto-generate secure secrets
class SecretGenerator {
  generatePassword(length: number): string {
    return randomBytes(length).toString('base64');
  }

  generateAPIKey(): string {
    return `sk_${randomBytes(32).toString('hex')}`;
  }
}
```

## Testing

### Basic Workflow

```bash
# Start service
npm start

# Create secret
SECRET_ID=$(curl -X POST http://localhost:3003/secrets \
  -H "Content-Type: application/json" \
  -H "X-Principal: admin" \
  -d '{"name":"test","path":"/test/secret","value":"secret123"}' \
  | jq -r '.id')

# Get secret
curl http://localhost:3003/secrets/$SECRET_ID \
  -H "X-Principal: admin" | jq '.value'

# Update secret
curl -X PUT http://localhost:3003/secrets/$SECRET_ID \
  -H "Content-Type: application/json" \
  -H "X-Principal: admin" \
  -d '{"value":"newsecret456"}'

# View versions
curl http://localhost:3003/secrets/$SECRET_ID/versions \
  -H "X-Principal: admin"

# Rotate secret
curl -X POST http://localhost:3003/secrets/$SECRET_ID/rotate \
  -H "X-Principal: admin"

# Check audit logs
curl 'http://localhost:3003/audit?resource=/test/secret'

# Delete secret
curl -X DELETE http://localhost:3003/secrets/$SECRET_ID \
  -H "X-Principal: admin"
```

### Test Access Control

```bash
# Create restrictive policy
curl -X POST http://localhost:3003/policies \
  -H "Content-Type: application/json" \
  -d '{
    "principal": "readonly-user",
    "resource": "*",
    "actions": ["read", "list"],
    "effect": "allow"
  }'

# Try to create (should succeed with admin)
curl -X POST http://localhost:3003/secrets \
  -H "X-Principal: admin" \
  -d '{"name":"test","path":"/test","value":"val"}'

# Try to delete (should fail with readonly-user)
curl -X DELETE http://localhost:3003/secrets/secret-1 \
  -H "X-Principal: readonly-user"
```

## Resources

- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [HashiCorp Vault](https://www.vaultproject.io/)
- [Azure Key Vault](https://azure.microsoft.com/en-us/services/key-vault/)
- [Google Secret Manager](https://cloud.google.com/secret-manager)
- [NIST AES Specification](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf)
