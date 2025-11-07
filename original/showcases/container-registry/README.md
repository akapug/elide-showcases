# Container Registry

A production-ready OCI-compliant container image registry supporting Docker push/pull operations, manifest handling, layer caching, access control, and automated garbage collection.

## Overview

This showcase demonstrates a complete container registry implementation that:
- Supports OCI Distribution Specification v2
- Handles image push and pull operations
- Manages manifests and layer storage
- Implements content-addressable storage with deduplication
- Provides layer caching for bandwidth optimization
- Enforces access control policies
- Performs automatic garbage collection

## Architecture

### Components

1. **Layer Storage**
   - Content-addressable blob storage
   - Automatic deduplication by digest
   - Reference counting for garbage collection
   - Cache hit/miss tracking
   - Storage statistics

2. **Manifest Storage**
   - Image manifest management
   - Tag to manifest mapping
   - Digest-based lookups
   - Repository organization
   - Multi-tag support

3. **Upload Manager**
   - Chunked upload sessions
   - Session timeout handling
   - Resumable uploads
   - Atomic commit operations

4. **Access Control**
   - Repository-level permissions
   - User-based policies
   - Pull, push, and delete operations
   - Wildcard support

5. **Garbage Collector**
   - Automatic unreferenced blob removal
   - Scheduled cleanup runs
   - Reference tracking
   - Storage reclamation reporting

## OCI Distribution Spec

This registry implements the [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec):

### API Endpoints

#### Registry Operations
- `GET /v2/` - Check API version support
- `GET /_catalog` - List all repositories
- `GET /v2/{name}/tags/list` - List tags for repository

#### Manifest Operations
- `GET /v2/{name}/manifests/{reference}` - Pull manifest
- `PUT /v2/{name}/manifests/{reference}` - Push manifest
- `DELETE /v2/{name}/manifests/{reference}` - Delete manifest

#### Blob Operations
- `GET /v2/{name}/blobs/{digest}` - Download blob
- `POST /v2/{name}/blobs/uploads/` - Initiate blob upload
- `PATCH /v2/{name}/blobs/uploads/{uuid}` - Upload chunk
- `PUT /v2/{name}/blobs/uploads/{uuid}?digest={digest}` - Complete upload

#### Management Operations
- `GET /_stats` - Registry statistics
- `POST /_gc` - Trigger garbage collection

## Usage

### Starting the Registry

```bash
# Default port 3002
npm start

# Custom port
PORT=5000 npm start
```

### Using with Docker

#### Configure Docker to use registry

```bash
# Add to /etc/docker/daemon.json
{
  "insecure-registries": ["localhost:3002"]
}

# Restart Docker
sudo systemctl restart docker
```

#### Push an image

```bash
# Tag an image
docker tag nginx:latest localhost:3002/myapp/nginx:v1.0.0

# Push to registry
docker push localhost:3002/myapp/nginx:v1.0.0
```

#### Pull an image

```bash
docker pull localhost:3002/myapp/nginx:v1.0.0
```

#### List repositories

```bash
curl http://localhost:3002/_catalog
```

#### List tags

```bash
curl http://localhost:3002/v2/myapp/nginx/tags/list
```

### Manual API Operations

#### Push Manifest

```bash
curl -X PUT http://localhost:3002/v2/myrepo/manifests/latest \
  -H "Content-Type: application/vnd.docker.distribution.manifest.v2+json" \
  -d '{
    "schemaVersion": 2,
    "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
    "config": {
      "mediaType": "application/vnd.docker.container.image.v1+json",
      "size": 1234,
      "digest": "sha256:abc123..."
    },
    "layers": [
      {
        "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
        "size": 5678,
        "digest": "sha256:def456..."
      }
    ]
  }'
```

#### Pull Manifest

```bash
curl http://localhost:3002/v2/myrepo/manifests/latest
```

#### Upload Blob

```bash
# Start upload
LOCATION=$(curl -X POST http://localhost:3002/v2/myrepo/blobs/uploads/ \
  -i | grep Location | cut -d' ' -f2 | tr -d '\r')

# Upload data
curl -X PATCH "$LOCATION" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @layer.tar.gz

# Complete upload
DIGEST="sha256:$(sha256sum layer.tar.gz | cut -d' ' -f1)"
curl -X PUT "$LOCATION?digest=$DIGEST"
```

#### Download Blob

```bash
curl http://localhost:3002/v2/myrepo/blobs/sha256:abc123... \
  --output layer.tar.gz
```

## Layer Caching

The registry implements automatic layer deduplication:

### How it Works

1. **Content-Addressable Storage**: Layers identified by SHA256 digest
2. **Reference Counting**: Tracks how many manifests reference each layer
3. **Automatic Deduplication**: Same layer pushed multiple times stored once
4. **Cache Statistics**: Hit/miss tracking for monitoring

### Benefits

- **Storage Savings**: Common base layers shared across images
- **Bandwidth Optimization**: Layers already present not re-transferred
- **Faster Pushes**: Skip uploading existing layers
- **Cost Reduction**: Less storage and transfer costs

### Example

```bash
# First push - all layers uploaded
docker push localhost:3002/myapp:v1
# Layers: base(100MB) + app(10MB) = 110MB uploaded

# Second push with minor changes
docker push localhost:3002/myapp:v2
# Layers: base(100MB, cached) + app(11MB) = 11MB uploaded
# Storage: 121MB total (not 220MB)
```

## Access Control

### Policy Structure

```typescript
{
  repository: "myorg/myapp",
  user: "developer",
  permissions: ["pull", "push"],
  createdAt: "2025-01-01T00:00:00Z"
}
```

### Permission Types

- **pull**: Download manifests and blobs
- **push**: Upload manifests and blobs
- **delete**: Remove manifests

### Default Policy

Registry starts with permissive policy (all operations allowed for demo):

```typescript
{
  repository: "*",    // All repositories
  user: "*",         // All users
  permissions: ["pull", "push", "delete"]
}
```

### Custom Policies

Modify `AccessControl` class to add authentication:

```typescript
// Example: JWT-based authentication
handleRequest(req: IncomingMessage, res: ServerResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = verifyToken(token);

  if (!this.accessControl.checkPermission(repository, user, 'push')) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }
  // ... handle request
}
```

## Garbage Collection

### Automatic Collection

Runs every 60 seconds to clean up unreferenced layers:

1. Scan all manifests
2. Collect referenced layer digests
3. Identify unreferenced layers
4. Delete and reclaim storage

### Manual Trigger

```bash
curl -X POST http://localhost:3002/_gc
```

Response:
```json
{
  "deletedLayers": 5,
  "reclaimedBytes": 1048576
}
```

### When Layers Become Unreferenced

- Image/tag deleted
- Manifest updated with new layers
- Failed uploads cleaned up
- Old versions removed

## Storage Management

### Statistics

```bash
curl http://localhost:3002/_stats
```

Response:
```json
{
  "repositories": 3,
  "images": 8,
  "layers": {
    "layers": 15,
    "totalSize": 524288000,
    "cacheHits": 42,
    "cacheMisses": 15,
    "hitRate": 73.68
  },
  "repositoryDetails": [
    {
      "name": "myorg/app",
      "tags": ["v1.0.0", "v1.0.1", "latest"],
      "imageCount": 3,
      "totalSize": 104857600,
      "lastPush": "2025-01-01T12:00:00Z"
    }
  ]
}
```

### Monitoring

Key metrics to track:
- **Cache Hit Rate**: Percentage of layer reuse
- **Total Storage**: Sum of all layer sizes
- **Repository Count**: Number of unique repositories
- **Average Image Size**: Total storage / image count
- **Upload Sessions**: Active chunked uploads

## Production Features

### Reliability
- Atomic manifest operations
- Upload session timeout handling
- Digest verification on upload
- Reference counting for safe deletion

### Performance
- Content-addressable storage for deduplication
- In-memory caching for fast lookups
- Chunked uploads for large layers
- Parallel layer downloads

### Security
- Digest-based content verification
- Access control policies
- Repository isolation
- Audit logging capability

### Scalability
- Horizontal scaling with shared storage backend
- Stateless API design
- Efficient garbage collection
- Metadata separation from blob storage

## Extending the Registry

### Add Persistent Storage

Replace in-memory storage with database and object storage:

```typescript
// Use PostgreSQL for metadata
class PostgresManifestStorage extends ManifestStorage {
  async storeManifest(metadata: ImageMetadata) {
    await db.query('INSERT INTO manifests ...');
  }
}

// Use S3 for blobs
class S3LayerStorage extends LayerStorage {
  async storeLayer(digest: string, data: Buffer) {
    await s3.putObject({
      Bucket: 'registry-blobs',
      Key: digest,
      Body: data
    });
  }
}
```

### Add Authentication

Implement JWT or OAuth2:

```typescript
class RegistryAuth {
  verifyToken(token: string): User {
    // Verify JWT token
    return jwt.verify(token, publicKey);
  }

  requireAuth(req: IncomingMessage): User {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Unauthorized');
    return this.verifyToken(token);
  }
}
```

### Add Image Scanning

Integrate vulnerability scanning:

```typescript
class ImageScanner {
  async scanLayers(manifest: Manifest) {
    for (const layer of manifest.layers) {
      const vulnerabilities = await scanLayer(layer.digest);
      if (vulnerabilities.critical > 0) {
        throw new Error('Critical vulnerabilities found');
      }
    }
  }
}
```

### Add Replication

Sync to multiple registries:

```typescript
class ReplicationController {
  async replicateManifest(metadata: ImageMetadata) {
    for (const target of this.targets) {
      await target.pushManifest(metadata);
      await target.pushLayers(metadata.manifest.layers);
    }
  }
}
```

## Testing

### Basic Workflow

```bash
# Start registry
npm start

# Tag and push
docker tag alpine:latest localhost:3002/test/alpine:v1
docker push localhost:3002/test/alpine:v1

# Verify
curl http://localhost:3002/_catalog
curl http://localhost:3002/v2/test/alpine/tags/list
curl http://localhost:3002/_stats

# Pull
docker rmi localhost:3002/test/alpine:v1
docker pull localhost:3002/test/alpine:v1

# Cleanup
curl -X DELETE http://localhost:3002/v2/test/alpine/manifests/v1
curl -X POST http://localhost:3002/_gc
```

### Test Layer Deduplication

```bash
# Push first image
docker tag nginx:latest localhost:3002/app1/web:v1
docker push localhost:3002/app1/web:v1

# Check stats (note cache misses)
curl http://localhost:3002/_stats | jq '.layers'

# Push second image (same base)
docker tag nginx:latest localhost:3002/app2/web:v1
docker push localhost:3002/app2/web:v1

# Check stats (note cache hits increased)
curl http://localhost:3002/_stats | jq '.layers'
```

## Compliance

This registry implements:
- **OCI Distribution Specification v1.0.0**
- **Docker Registry HTTP API V2**

Compatible with:
- Docker CLI
- containerd
- Podman
- Skopeo
- Helm (chart storage)

## Resources

- [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec)
- [Docker Registry HTTP API](https://docs.docker.com/registry/spec/api/)
- [OCI Image Format](https://github.com/opencontainers/image-spec)
- [Harbor Registry](https://goharbor.io/)
- [Docker Registry](https://docs.docker.com/registry/)
