# Kubernetes Controller

A production-ready Kubernetes operator that manages custom resources with full reconciliation loop support, resource watching, and event handling.

## Overview

This showcase demonstrates a complete Kubernetes controller implementation that:
- Defines and manages Custom Resource Definitions (CRDs)
- Implements a reconciliation loop for desired state management
- Watches resources for changes in real-time
- Handles CRUD operations on custom resources
- Maintains status updates with conditions
- Records and exposes events for monitoring

## Architecture

### Components

1. **Custom Resource Definition (CRD)**
   - Defines the `Application` resource type
   - Schema validation with OpenAPI v3
   - Namespaced resources with status subresource

2. **Resource Cache**
   - In-memory cache for fast lookups
   - Namespace-aware key generation
   - List and filter operations

3. **Event Handler**
   - Records all resource events (ADDED, MODIFIED, DELETED)
   - Maintains event history with configurable limit
   - Provides event query API

4. **Reconciler**
   - Processes reconciliation requests asynchronously
   - Compares desired state (spec) vs actual state (status)
   - Updates status with conditions and phase
   - Supports requeue with backoff

5. **Resource Watcher**
   - Server-Sent Events (SSE) for real-time updates
   - Notifies connected clients of resource changes
   - Integrates with reconciler for automated processing

## Custom Resource Schema

```typescript
apiVersion: cloudnative.elide.dev/v1
kind: Application
metadata:
  name: my-app
  namespace: default
spec:
  replicas: 3
  image: myorg/myapp:v1.0.0
  strategy: RollingUpdate
  config:
    key: value
status:
  observedGeneration: 1
  replicas: 3
  readyReplicas: 3
  phase: Running
  conditions:
    - type: Ready
      status: "True"
      reason: ReconciliationSucceeded
```

## API Endpoints

### Health & Metadata
- `GET /` - Controller information and available endpoints
- `GET /healthz` - Health check endpoint
- `GET /crd` - Get Custom Resource Definition

### Resource Operations
- `GET /apis/cloudnative.elide.dev/v1/namespaces/{ns}/applications` - List resources
- `GET /apis/cloudnative.elide.dev/v1/namespaces/{ns}/applications/{name}` - Get resource
- `POST /apis/cloudnative.elide.dev/v1/namespaces/{ns}/applications` - Create resource
- `PUT /apis/cloudnative.elide.dev/v1/namespaces/{ns}/applications/{name}` - Update resource
- `DELETE /apis/cloudnative.elide.dev/v1/namespaces/{ns}/applications/{name}` - Delete resource

### Monitoring
- `GET /watch` - Watch resources (Server-Sent Events)
- `GET /events` - Get recent events

## Usage

### Starting the Controller

```bash
# Default port 3000
npm start

# Custom port
PORT=8080 npm start
```

### Creating a Resource

```bash
curl -X POST http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/default/applications \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "cloudnative.elide.dev/v1",
    "kind": "Application",
    "metadata": {
      "name": "my-app"
    },
    "spec": {
      "replicas": 3,
      "image": "nginx:latest",
      "strategy": "RollingUpdate"
    }
  }'
```

### Getting a Resource

```bash
curl http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/default/applications/my-app
```

### Updating a Resource

```bash
curl -X PUT http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/default/applications/my-app \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "cloudnative.elide.dev/v1",
    "kind": "Application",
    "metadata": {
      "name": "my-app",
      "namespace": "default"
    },
    "spec": {
      "replicas": 5,
      "image": "nginx:latest",
      "strategy": "RollingUpdate"
    }
  }'
```

### Watching Resources

```bash
curl -N http://localhost:3000/watch
```

### Deleting a Resource

```bash
curl -X DELETE http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/default/applications/my-app
```

## Reconciliation Loop

The reconciliation loop follows Kubernetes controller best practices:

1. **Event Received** - Resource added/modified/deleted
2. **Cache Updated** - Local cache synchronized
3. **Reconcile Queued** - Request added to reconciliation queue
4. **Reconciliation** - Compare spec vs status
   - Check observedGeneration vs generation
   - Apply desired state changes
   - Update status with conditions
5. **Requeue** - If needed, schedule another reconciliation

### Status Conditions

- **Ready**: All replicas are ready and running
- **Progressing**: Resource is being updated

### Resource Phases

- **Pending**: Resource created, waiting for reconciliation
- **Running**: All replicas running successfully
- **Failed**: Reconciliation failed
- **Succeeded**: One-time operation completed

## Production Features

### Resource Management
- Automatic UID and resourceVersion generation
- Generation tracking for spec changes
- Namespace isolation
- Metadata labels and annotations support

### Reconciliation
- Asynchronous processing with queue
- Single reconciliation at a time per resource
- Requeue support with configurable backoff
- Error handling and status reporting

### Observability
- Event recording with history
- Real-time resource watching
- Health check endpoint
- Structured logging

### Performance
- In-memory caching for fast reads
- Efficient namespace filtering
- Non-blocking watch streams
- Resource version tracking

## Error Handling

The controller handles various error scenarios:
- Invalid JSON payloads (400 Bad Request)
- Resource not found (404 Not Found)
- Reconciliation failures (logged and requeued)
- Watch connection drops (automatic cleanup)

## Security Considerations

In a production environment, add:
- Authentication (JWT, client certificates)
- Authorization (RBAC policies)
- TLS/SSL encryption
- Admission webhooks for validation
- Network policies

## Extending the Controller

### Adding Custom Logic

Modify the `Reconciler.reconcile()` method to:
- Deploy actual Kubernetes resources (Deployments, Services)
- Integrate with external APIs
- Implement custom validation logic
- Add finalizers for cleanup

### Custom Conditions

Add conditions to track specific states:
```typescript
{
  type: "DatabaseReady",
  status: "True",
  reason: "ConnectionEstablished",
  message: "Database connection successful"
}
```

## Testing

```bash
# Run the server
npm start

# In another terminal, create a test resource
curl -X POST http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/test/applications \
  -H "Content-Type: application/json" \
  -d '{"apiVersion":"cloudnative.elide.dev/v1","kind":"Application","metadata":{"name":"test-app"},"spec":{"replicas":1,"image":"test:latest","strategy":"RollingUpdate"}}'

# Watch for events
curl -N http://localhost:3000/watch

# Check status
curl http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/test/applications/test-app

# View events
curl http://localhost:3000/events
```

## Resources

- [Kubernetes Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [Custom Resource Definitions](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
- [Controller Best Practices](https://kubernetes.io/docs/concepts/architecture/controller/)
- [Reconciliation Loop](https://kubernetes.io/docs/concepts/architecture/controller/#control-loops)
