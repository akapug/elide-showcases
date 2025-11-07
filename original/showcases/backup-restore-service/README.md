# Backup & Restore Service

A production-ready backup and restore service featuring incremental backups, point-in-time recovery, gzip compression, AES-256 encryption, and comprehensive restore validation.

## Overview

This showcase demonstrates a complete backup and restore system that:
- Creates full and incremental backups with delta compression
- Provides point-in-time recovery from snapshots
- Compresses backups using gzip (typically 60-80% reduction)
- Encrypts backups with AES-256-CBC
- Validates restore operations with checksum verification
- Tracks restore operations with progress monitoring
- Manages retention policies automatically

## Architecture

### Components

1. **Backup Storage**
   - Stores backup data and metadata
   - Maintains resource snapshots for point-in-time recovery
   - Indexes backups by resource and type
   - Handles backup deletion and cleanup

2. **Compression Service**
   - Gzip compression (level 6)
   - Automatic decompression
   - Compression ratio calculation
   - Stream-based processing

3. **Encryption Service**
   - AES-256-CBC encryption
   - Random IV generation per backup
   - Secure key management
   - Decryption with IV verification

4. **Delta Engine**
   - Calculates changes between snapshots
   - Creates incremental deltas
   - Applies deltas to reconstruct data
   - Tracks additions, changes, and deletions

5. **Restore Manager**
   - Manages restore operations lifecycle
   - Tracks progress and status
   - Queues and processes restores
   - Records operation metadata

6. **Validator**
   - Checksum verification (SHA-256)
   - Structure validation
   - Data integrity checks
   - Expiration warnings

## Backup Types

### Full Backup

Complete snapshot of resource state:
- Contains all data
- Independent restore
- Larger size
- Baseline for incrementals

### Incremental Backup

Only changes since last backup:
- Stores delta (changes only)
- Requires base backup for restore
- Much smaller size
- Faster backup creation

### Differential Backup

Changes since last full backup:
- Not currently implemented
- Can be added by tracking last full backup
- Balanced size vs restore speed

## API Endpoints

### Health & Info
- `GET /` - Service information
- `GET /health` - Health check

### Backup Operations
- `POST /backups` - Create backup
- `GET /backups?resourceId={id}&type={type}` - List backups
- `GET /backups/{id}` - Get backup details
- `DELETE /backups/{id}` - Delete backup

### Restore Operations
- `POST /restore` - Restore from backup
- `POST /restore/point-in-time` - Point-in-time restore
- `GET /restore/operations` - List restore operations
- `GET /restore/operations/{id}` - Get operation status

## Usage

### Starting the Service

```bash
# Default port 3004
npm start

# Custom port
PORT=8080 npm start
```

### Creating a Full Backup

```bash
curl -X POST http://localhost:3004/backups \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "database-1",
    "resourceType": "postgresql",
    "type": "full",
    "data": {
      "tables": {
        "users": [{"id": 1, "name": "Alice"}],
        "products": [{"id": 1, "name": "Widget"}]
      },
      "schemas": ["public"],
      "version": "14.0"
    },
    "metadata": {
      "version": "1.0",
      "source": "automated",
      "tags": {"env": "production", "app": "ecommerce"},
      "retentionDays": 30
    },
    "encrypt": true
  }'
```

Response:
```json
{
  "id": "backup-1",
  "resourceId": "database-1",
  "resourceType": "postgresql",
  "type": "full",
  "status": "completed",
  "size": 2048,
  "compressedSize": 512,
  "compressionRatio": 75,
  "encrypted": true,
  "checksum": "sha256:abc123...",
  "data": "[REDACTED]",
  "createdAt": "2025-01-01T12:00:00Z",
  "completedAt": "2025-01-01T12:00:05Z",
  "expiresAt": "2025-01-31T12:00:00Z"
}
```

### Creating an Incremental Backup

```bash
curl -X POST http://localhost:3004/backups \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "database-1",
    "resourceType": "postgresql",
    "type": "incremental",
    "data": {
      "tables": {
        "users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}],
        "products": [{"id": 1, "name": "Widget"}]
      },
      "schemas": ["public"],
      "version": "14.0"
    },
    "metadata": {
      "version": "1.0",
      "source": "automated",
      "tags": {"env": "production"},
      "retentionDays": 7
    }
  }'
```

### Listing Backups

```bash
# All backups
curl http://localhost:3004/backups

# Filter by resource
curl http://localhost:3004/backups?resourceId=database-1

# Filter by type
curl http://localhost:3004/backups?type=full
```

### Restoring from Backup

```bash
curl -X POST http://localhost:3004/restore \
  -H "Content-Type: application/json" \
  -d '{
    "backupId": "backup-1",
    "targetResourceId": "database-1-restored",
    "createdBy": "admin",
    "validate": true
  }'
```

Response:
```json
{
  "operation": {
    "id": "restore-1",
    "backupId": "backup-1",
    "targetResourceId": "database-1-restored",
    "type": "full",
    "status": "completed",
    "validated": true,
    "validationErrors": [],
    "progress": 100,
    "createdAt": "2025-01-01T13:00:00Z",
    "completedAt": "2025-01-01T13:00:10Z",
    "createdBy": "admin"
  },
  "data": {
    "tables": {
      "users": [{"id": 1, "name": "Alice"}]
    }
  }
}
```

### Point-in-Time Restore

```bash
curl -X POST http://localhost:3004/restore/point-in-time \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "database-1",
    "timestamp": "2025-01-01T12:30:00Z",
    "targetResourceId": "database-1-pit",
    "createdBy": "admin"
  }'
```

### Checking Restore Operation

```bash
# List all operations
curl http://localhost:3004/restore/operations

# Get specific operation
curl http://localhost:3004/restore/operations/restore-1
```

### Deleting a Backup

```bash
curl -X DELETE http://localhost:3004/backups/backup-1
```

## Backup Workflow

### Full Backup Flow

```
1. Receive resource data
2. Serialize to JSON
3. Compress with gzip
4. Encrypt with AES-256
5. Calculate SHA-256 checksum
6. Store backup metadata
7. Save snapshot for incremental base
```

### Incremental Backup Flow

```
1. Receive current resource data
2. Retrieve latest snapshot
3. Calculate delta (changes only)
4. Serialize delta to JSON
5. Compress delta
6. Encrypt compressed delta
7. Calculate checksum
8. Store backup with base reference
9. Update snapshot
```

### Restore Flow

```
1. Create restore operation
2. Retrieve backup by ID
3. Decrypt backup data
4. Decompress data
5. Validate checksum
6. If incremental, restore base backup first
7. Apply delta to base data
8. Validate structure
9. Return restored data
10. Mark operation complete
```

## Compression

### Gzip Compression

- **Algorithm**: DEFLATE (RFC 1951)
- **Level**: 6 (balanced speed/ratio)
- **Typical Ratio**: 60-80% reduction
- **Best For**: Text, JSON, XML, logs
- **Streaming**: Yes, memory efficient

### Compression Statistics

```json
{
  "size": 10240,
  "compressedSize": 2048,
  "compressionRatio": 80
}
```

### When to Compress

- **Always**: Text-based formats (JSON, XML, CSV)
- **Usually**: Log files, configuration files
- **Sometimes**: Binary data (depends on content)
- **Never**: Already compressed (zip, jpg, video)

## Encryption

### AES-256-CBC

- **Algorithm**: Advanced Encryption Standard
- **Mode**: Cipher Block Chaining
- **Key Size**: 256 bits
- **IV Size**: 128 bits (random per backup)
- **Standard**: FIPS 197

### Encryption Flow

```
Plaintext → AES-256-CBC Encrypt → Ciphertext + IV
```

### Key Management

In production, integrate with:
- **AWS KMS**: Key Management Service
- **Azure Key Vault**: Centralized key storage
- **HashiCorp Vault**: Secrets management
- **Google Cloud KMS**: Cloud key management

### Disabling Encryption

```bash
# For development/testing only
curl -X POST http://localhost:3004/backups \
  -d '{"resourceId":"test","resourceType":"test","data":{},"encrypt":false}'
```

## Validation

### Checksum Verification

- **Algorithm**: SHA-256
- **Checked**: Before compression/encryption
- **Purpose**: Detect corruption or tampering
- **Failure**: Restore aborted

### Structure Validation

- **Check**: Valid JSON format
- **Purpose**: Ensure parseable data
- **Failure**: Restore aborted

### Data Integrity

- **Check**: Non-empty data
- **Purpose**: Detect truncation
- **Failure**: Restore aborted

### Example Validation Result

```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Backup expires in 5 days"],
  "checksumValid": true,
  "structureValid": true,
  "dataIntegrity": true
}
```

## Point-in-Time Recovery

### Snapshot Storage

- Snapshots stored for each backup
- Up to 100 snapshots per resource
- Automatic oldest snapshot removal
- Indexed by timestamp

### Recovery Process

```bash
# Create multiple backups over time
curl -X POST http://localhost:3004/backups -d '{...}' # 12:00
curl -X POST http://localhost:3004/backups -d '{...}' # 13:00
curl -X POST http://localhost:3004/backups -d '{...}' # 14:00

# Restore to 12:30 state
curl -X POST http://localhost:3004/restore/point-in-time \
  -d '{"resourceId":"db-1","timestamp":"2025-01-01T12:30:00Z"}'
```

### Use Cases

- **Accidental Deletion**: Restore before delete
- **Data Corruption**: Revert to known good state
- **Audit/Investigation**: View historical state
- **Testing**: Create test environments from production state

## Incremental Backup Strategy

### Delta Calculation

```typescript
// Base data (v1)
{
  "users": [{"id": 1, "name": "Alice"}],
  "settings": {"theme": "dark"}
}

// Current data (v2)
{
  "users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}],
  "settings": {"theme": "light"}
}

// Calculated delta
{
  "changes": [
    {"key": "settings", "oldValue": {"theme": "dark"}, "newValue": {"theme": "light"}}
  ],
  "additions": [
    {"key": "users[1]", "value": {"id": 2, "name": "Bob"}}
  ],
  "deletions": []
}
```

### Backup Chain

```
Full Backup (100MB)
  ├── Incremental 1 (5MB) - changes only
  ├── Incremental 2 (3MB) - changes only
  └── Incremental 3 (8MB) - changes only

Total Storage: 116MB vs 400MB for 4 full backups
```

### Restore Strategy

```
Restore Incremental 3:
1. Restore Full Backup → base state
2. Apply Incremental 1 delta
3. Apply Incremental 2 delta
4. Apply Incremental 3 delta
→ Final state
```

## Retention Policies

### Automatic Expiration

```typescript
{
  "retentionDays": 30,
  "expiresAt": "2025-02-01T00:00:00Z"
}
```

### Policy Examples

- **Daily Backups**: 7 days retention
- **Weekly Backups**: 4 weeks retention
- **Monthly Backups**: 12 months retention
- **Yearly Backups**: 7 years retention

### Implementation

```bash
# Create backup with 90-day retention
curl -X POST http://localhost:3004/backups \
  -d '{
    "resourceId": "prod-db",
    "data": {...},
    "metadata": {"retentionDays": 90}
  }'
```

### Cleanup Job

Implement periodic cleanup:
```typescript
setInterval(() => {
  const now = new Date();
  for (const backup of storage.list()) {
    if (backup.expiresAt && new Date(backup.expiresAt) < now) {
      storage.delete(backup.id);
    }
  }
}, 86400000); // Daily
```

## Production Features

### Reliability
- Atomic backup operations
- Checksum verification
- Automatic retry on failure
- Operation status tracking
- Validation before restore

### Performance
- Streaming compression
- Efficient delta calculation
- Parallel backup processing
- Fast lookup by index
- Minimal memory footprint

### Security
- AES-256 encryption
- Secure random IV generation
- Key version tracking
- Access control ready
- Audit logging support

### Scalability
- Incremental backups reduce storage
- Compression reduces bandwidth
- Stateless API design
- Horizontal scaling support
- Background processing

## Extending the Service

### Add Cloud Storage

```typescript
// S3 backend
class S3BackupStorage {
  async store(backup: Backup) {
    await s3.putObject({
      Bucket: 'backups',
      Key: backup.id,
      Body: backup.data
    });
  }
}
```

### Add Backup Scheduling

```typescript
class BackupScheduler {
  schedule(resourceId: string, cronExpression: string) {
    cron.schedule(cronExpression, async () => {
      await service.createBackup(resourceId, ...);
    });
  }
}
```

### Add Notifications

```typescript
class BackupNotifier {
  async onBackupComplete(backup: Backup) {
    await slack.send({
      text: `Backup ${backup.id} completed (${backup.compressionRatio}% compressed)`
    });
  }
}
```

### Add Metrics

```typescript
class BackupMetrics {
  recordBackup(backup: Backup) {
    prometheus.histogram('backup_size_bytes').observe(backup.size);
    prometheus.histogram('backup_duration_seconds').observe(duration);
    prometheus.counter('backups_total').inc({ type: backup.type });
  }
}
```

## Testing

### Complete Workflow

```bash
# Start service
npm start

# Create full backup
BACKUP_ID=$(curl -X POST http://localhost:3004/backups \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "test-db",
    "resourceType": "database",
    "type": "full",
    "data": {"users": [{"id": 1, "name": "Alice"}]},
    "metadata": {"version": "1.0", "source": "test", "tags": {}, "retentionDays": 7}
  }' | jq -r '.id')

echo "Created backup: $BACKUP_ID"

# Create incremental backup
INCR_BACKUP_ID=$(curl -X POST http://localhost:3004/backups \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "test-db",
    "resourceType": "database",
    "type": "incremental",
    "data": {"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]},
    "metadata": {"version": "1.0", "source": "test", "tags": {}, "retentionDays": 7}
  }' | jq -r '.id')

echo "Created incremental backup: $INCR_BACKUP_ID"

# List backups
curl http://localhost:3004/backups?resourceId=test-db

# Restore full backup
curl -X POST http://localhost:3004/restore \
  -H "Content-Type: application/json" \
  -d "{
    \"backupId\": \"$BACKUP_ID\",
    \"targetResourceId\": \"test-db-restored\",
    \"createdBy\": \"tester\"
  }" | jq '.data'

# Restore incremental backup
curl -X POST http://localhost:3004/restore \
  -H "Content-Type: application/json" \
  -d "{
    \"backupId\": \"$INCR_BACKUP_ID\",
    \"targetResourceId\": \"test-db-restored-2\",
    \"createdBy\": \"tester\"
  }" | jq '.data'

# Point-in-time restore
curl -X POST http://localhost:3004/restore/point-in-time \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "test-db",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "targetResourceId": "test-db-pit",
    "createdBy": "tester"
  }' | jq '.data'

# Check operations
curl http://localhost:3004/restore/operations

# Cleanup
curl -X DELETE http://localhost:3004/backups/$BACKUP_ID
curl -X DELETE http://localhost:3004/backups/$INCR_BACKUP_ID
```

## Resources

- [AWS Backup](https://aws.amazon.com/backup/)
- [Azure Backup](https://azure.microsoft.com/en-us/services/backup/)
- [Velero](https://velero.io/) - Kubernetes backup
- [Restic](https://restic.net/) - Fast backup program
- [Backup Best Practices](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)
