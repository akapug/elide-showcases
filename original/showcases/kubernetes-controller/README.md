# Production Kubernetes Operator

A complete production-ready Kubernetes operator built with Elide, featuring all essential operator patterns and best practices for building cloud-native controllers.

## Overview

This showcase demonstrates a **production-grade Kubernetes operator** implementation with:

### Core Features
- **Custom Resource Definitions (CRDs)** with schema validation and versioning
- **Advanced Reconciliation** with finalizers, work queues, and exponential backoff
- **Admission Webhooks** for validating and mutating resources
- **Leader Election** for high availability deployments
- **Prometheus Metrics** export for observability
- **Event Management** with aggregation and filtering
- **Multi-namespace Support** with cluster-wide operations
- **Health & Readiness Probes** for Kubernetes integration
- **RBAC Integration** ready for production deployments

### Architecture Components

1. **CRD Manager** (`crd-manager.ts`)
   - Schema validation with OpenAPI v3
   - Multi-version support
   - Printer columns and categories
   - Status subresources

2. **Reconciler** (`reconciler.ts`)
   - Work queue with rate limiting
   - Exponential backoff for retries
   - Finalizer support for cleanup
   - Status conditions management

3. **Event Handler** (`event-handler.ts`)
   - Event aggregation and deduplication
   - Severity levels (Info, Warning, Error, Critical)
   - Query and filtering capabilities
   - Metrics integration

4. **Webhook Server** (`webhook-server.ts`)
   - Validating admission control
   - Mutating admission control
   - Security policy enforcement
   - Resource defaulting

5. **Leader Elector** (`leader-elector.ts`)
   - Lease-based leader election
   - Automatic failover
   - Graceful leadership transition
   - Health monitoring

6. **Metrics Exporter** (`metrics-exporter.ts`)
   - Prometheus-compatible metrics
   - Controller performance tracking
   - Resource state metrics
   - Queue depth monitoring

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

### Health & Status
- `GET /` - Operator information, features, and available endpoints
- `GET /healthz` - Liveness probe (always returns healthy)
- `GET /readyz` - Readiness probe (checks leader election status)
- `GET /leader` - Leader election status and lease information

### CRD Management
- `GET /crd` - Get Application CRD definition
- `GET /crds` - List all registered CRDs

### Admission Webhooks
- `POST /validate` - Validating admission webhook endpoint
- `POST /mutate` - Mutating admission webhook endpoint

### Resource Operations
- `GET /apis/cloudnative.elide.dev/v1/applications` - List all resources (cluster-wide)
- `GET /apis/cloudnative.elide.dev/v1/namespaces/{ns}/applications` - List resources in namespace
- `GET /apis/cloudnative.elide.dev/v1/namespaces/{ns}/applications/{name}` - Get specific resource
- `POST /apis/cloudnative.elide.dev/v1/namespaces/{ns}/applications` - Create resource (with validation)
- `PUT /apis/cloudnative.elide.dev/v1/namespaces/{ns}/applications/{name}` - Update resource (with validation)
- `DELETE /apis/cloudnative.elide.dev/v1/namespaces/{ns}/applications/{name}` - Delete resource (with finalizers)

### Monitoring & Observability
- `GET /metrics` - Prometheus metrics endpoint
- `GET /watch` - Watch resources in real-time (Server-Sent Events)
- `GET /events` - Query events with filtering

## Usage

### Starting the Operator

```bash
# Run with default settings (port 3000, leader election enabled)
npm start

# Custom configuration
PORT=8080 npm start

# Disable leader election (for single-instance deployments)
ENABLE_LEADER_ELECTION=false npm start

# Set custom pod name for leader election
POD_NAME=operator-1 npm start
```

### Environment Variables

- `PORT` - HTTP server port (default: 3000)
- `ENABLE_LEADER_ELECTION` - Enable leader election (default: true)
- `POD_NAME` - Pod name for leader election identity (optional)

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
# Watch all resource changes in real-time
curl -N http://localhost:3000/watch
```

### Querying Events

```bash
# Get all events
curl http://localhost:3000/events

# Events are automatically recorded for:
# - Resource creation, updates, deletion
# - Reconciliation actions
# - Validation failures
# - Cleanup operations
```

### Checking Operator Status

```bash
# Check health
curl http://localhost:3000/healthz

# Check readiness (includes leader election status)
curl http://localhost:3000/readyz

# Get leader election information
curl http://localhost:3000/leader
```

### Viewing Prometheus Metrics

```bash
# Get all metrics
curl http://localhost:3000/metrics

# Metrics include:
# - controller_reconcile_total
# - controller_reconcile_duration_seconds
# - resource_count
# - event_total
# - webhook_requests_total
# - leader_election_status
# - workqueue_depth
```

### Deleting a Resource

```bash
# Delete triggers finalizer-based cleanup
curl -X DELETE http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/default/applications/my-app
```

## Production Operator Features

### Admission Webhooks

The operator includes validating and mutating webhooks:

**Validating Webhooks:**
- Validate replicas range (0-100)
- Require image specification
- Enforce security policies (blocked base images, registry restrictions)
- Provide warnings for best practices

**Mutating Webhooks:**
- Set default deployment strategy
- Add managed-by labels
- Inject annotations for tracking

**Testing Webhooks:**
```bash
# Create a test admission review
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "admission.k8s.io/v1",
    "kind": "AdmissionReview",
    "request": {
      "uid": "test-123",
      "kind": {"group": "cloudnative.elide.dev", "version": "v1", "kind": "Application"},
      "resource": {"group": "cloudnative.elide.dev", "version": "v1", "resource": "applications"},
      "operation": "CREATE",
      "userInfo": {"username": "admin"},
      "object": {
        "apiVersion": "cloudnative.elide.dev/v1",
        "kind": "Application",
        "metadata": {"name": "test"},
        "spec": {"replicas": 3, "image": "nginx:latest"}
      }
    }
  }'
```

### Leader Election

Leader election ensures only one active controller in HA deployments:

- **Lease-based**: Uses in-memory lease (would use K8s Lease in production)
- **Automatic failover**: New leader elected within seconds
- **Graceful transitions**: Clean handoff between leaders
- **Status tracking**: Monitor via `/leader` endpoint

**HA Deployment:**
```bash
# Run multiple instances with leader election
POD_NAME=operator-1 PORT=3001 npm start &
POD_NAME=operator-2 PORT=3002 npm start &

# Check which instance is leader
curl http://localhost:3001/leader
curl http://localhost:3002/leader
```

### Metrics & Observability

**Prometheus Integration:**
```yaml
# ServiceMonitor for Prometheus Operator
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: operator-metrics
spec:
  selector:
    matchLabels:
      app: elide-operator
  endpoints:
    - port: metrics
      path: /metrics
```

**Key Metrics:**
- `controller_reconcile_total` - Total reconciliations by result
- `controller_reconcile_duration_seconds` - Reconciliation latency histogram
- `resource_count` - Resources by kind and namespace
- `event_total` - Events by type and severity
- `webhook_requests_total` - Webhook admission requests
- `leader_election_status` - Leader status (1=leader, 0=follower)
- `workqueue_depth` - Work queue depth

### Event Management

Events provide audit trail and troubleshooting:

**Event Types:**
- `Normal` - Regular operations (create, update, reconcile)
- `Warning` - Non-critical issues
- `Error` - Failures requiring attention

**Event Features:**
- Automatic aggregation (deduplicates similar events)
- Severity levels (Info, Warning, Error, Critical)
- Query filtering by namespace, kind, type, severity
- Time-based filtering
- Metrics integration

## Reconciliation Loop

The advanced reconciliation loop includes:

1. **Event Received** - Resource added/modified/deleted
2. **Cache Updated** - Local cache synchronized
3. **Work Queue** - Request added with deduplication
4. **Leader Check** - Only active leader processes reconciliations
5. **Finalizer Check** - Add finalizer if missing
6. **Deletion Handling** - Run cleanup if deletionTimestamp set
7. **Reconciliation** - Compare spec vs status
   - Check observedGeneration vs generation
   - Apply desired state changes
   - Update status with conditions
   - Record events
8. **Retry Logic** - Exponential backoff on failures (max 5 retries)
9. **Metrics** - Record duration and outcome

### Status Conditions

- **Ready**: All replicas are ready and running
- **Progressing**: Resource is being updated

### Resource Phases

- **Pending**: Resource created, waiting for reconciliation
- **Running**: All replicas running successfully
- **Failed**: Reconciliation failed
- **Succeeded**: One-time operation completed

## Production Deployment

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elide-operator
  namespace: elide-system
spec:
  replicas: 3  # HA with leader election
  selector:
    matchLabels:
      app: elide-operator
  template:
    metadata:
      labels:
        app: elide-operator
    spec:
      serviceAccountName: elide-operator
      containers:
      - name: operator
        image: elide-operator:latest
        ports:
        - name: http
          containerPort: 3000
        - name: metrics
          containerPort: 3000
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: ENABLE_LEADER_ELECTION
          value: "true"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /readyz
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: elide-operator
  namespace: elide-system
  labels:
    app: elide-operator
spec:
  selector:
    app: elide-operator
  ports:
  - name: http
    port: 80
    targetPort: 3000
  - name: metrics
    port: 8080
    targetPort: 3000
```

### RBAC Configuration

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: elide-operator
  namespace: elide-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: elide-operator
rules:
- apiGroups: ["cloudnative.elide.dev"]
  resources: ["applications"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["cloudnative.elide.dev"]
  resources: ["applications/status"]
  verbs: ["get", "update", "patch"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["create", "patch"]
- apiGroups: ["coordination.k8s.io"]
  resources: ["leases"]
  verbs: ["get", "create", "update"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: elide-operator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: elide-operator
subjects:
- kind: ServiceAccount
  name: elide-operator
  namespace: elide-system
```

### Webhook Configuration

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: elide-operator-validating
webhooks:
- name: applications.cloudnative.elide.dev
  clientConfig:
    service:
      name: elide-operator
      namespace: elide-system
      path: /validate
  rules:
  - operations: ["CREATE", "UPDATE"]
    apiGroups: ["cloudnative.elide.dev"]
    apiVersions: ["v1"]
    resources: ["applications"]
  admissionReviewVersions: ["v1"]
  sideEffects: None
---
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: elide-operator-mutating
webhooks:
- name: applications.cloudnative.elide.dev
  clientConfig:
    service:
      name: elide-operator
      namespace: elide-system
      path: /mutate
  rules:
  - operations: ["CREATE", "UPDATE"]
    apiGroups: ["cloudnative.elide.dev"]
    apiVersions: ["v1"]
    resources: ["applications"]
  admissionReviewVersions: ["v1"]
  sideEffects: None
```

## Production Features

### Resource Management
- Automatic UID and resourceVersion generation
- Generation tracking for spec changes
- Namespace isolation with cluster-wide support
- Metadata labels and annotations support
- Finalizer-based cleanup

### Reconciliation
- Work queue with rate limiting and deduplication
- Exponential backoff for retries (1s → 16s)
- Single reconciliation per resource
- Leader election ensures only one active controller
- Error handling with retry limits

### Observability
- Prometheus metrics export
- Event recording with aggregation
- Real-time resource watching (SSE)
- Health and readiness probes
- Structured logging with context

### Performance
- In-memory caching for fast reads
- Efficient namespace filtering
- Non-blocking watch streams
- Resource version tracking
- Optimized queue processing

## Error Handling

The operator handles various error scenarios:
- **Validation Errors** (400) - CRD schema validation failures
- **Not Found** (404) - Resource doesn't exist
- **Reconciliation Failures** - Exponential backoff retry
- **Webhook Failures** - Proper admission response
- **Leader Loss** - Automatic failover to new leader
- **Watch Disconnects** - Automatic cleanup

## Security Considerations

Production security features:
- **Admission Webhooks** - Validate and mutate resources
- **RBAC Integration** - Fine-grained permissions
- **Security Policies** - Enforce image restrictions
- **TLS Support** - Add via reverse proxy (nginx/envoy)
- **Network Policies** - Restrict pod communication
- **ServiceAccount Tokens** - Kubernetes authentication

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

### Local Development

```bash
# Start the operator
npm start

# In another terminal, run tests
# Create a test resource
curl -X POST http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/test/applications \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "cloudnative.elide.dev/v1",
    "kind": "Application",
    "metadata": {"name": "test-app"},
    "spec": {
      "replicas": 3,
      "image": "nginx:1.21",
      "strategy": "RollingUpdate"
    }
  }'

# Watch events in real-time
curl -N http://localhost:3000/watch

# Check resource status
curl http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/test/applications/test-app

# View all events
curl http://localhost:3000/events

# Check metrics
curl http://localhost:3000/metrics | grep controller_reconcile

# Test leader election (run multiple instances)
POD_NAME=operator-1 PORT=3001 npm start &
POD_NAME=operator-2 PORT=3002 npm start &
curl http://localhost:3001/leader
```

### Validation Testing

```bash
# Test validation - should fail (replicas > 100)
curl -X POST http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/test/applications \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "cloudnative.elide.dev/v1",
    "kind": "Application",
    "metadata": {"name": "invalid"},
    "spec": {"replicas": 150, "image": "nginx:latest"}
  }'

# Test validation - should fail (missing image)
curl -X POST http://localhost:3000/apis/cloudnative.elide.dev/v1/namespaces/test/applications \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "cloudnative.elide.dev/v1",
    "kind": "Application",
    "metadata": {"name": "invalid"},
    "spec": {"replicas": 3}
  }'
```

## Why Elide for Kubernetes Operators?

This showcase demonstrates why **Elide is an excellent choice** for building Kubernetes operators:

### 1. Performance
- **Fast startup time** - Critical for operator pods
- **Low memory footprint** - Run multiple replicas efficiently
- **Native HTTP support** - No external dependencies for server
- **Efficient event loops** - Handle many resources without blocking

### 2. Developer Experience
- **TypeScript native** - Full type safety for Kubernetes resources
- **Simple deployment** - Single binary, no runtime dependencies
- **Fast development cycle** - Quick iteration on operator logic
- **Familiar patterns** - Standard K8s controller patterns

### 3. Production Ready
- **Leader election** - Built-in HA support
- **Metrics export** - Native Prometheus integration
- **Health checks** - Standard K8s probe support
- **Error handling** - Robust retry and backoff logic

### 4. Cloud Native
- **Container friendly** - Small image size, fast startup
- **Resource efficient** - Low CPU/memory usage
- **Scalable** - Multiple replicas with leader election
- **Observable** - Metrics, events, and logging

### 5. Full Featured
This operator includes **all production patterns**:
- ✅ CRD validation and versioning
- ✅ Reconciliation with finalizers
- ✅ Admission webhooks (validating & mutating)
- ✅ Leader election for HA
- ✅ Prometheus metrics
- ✅ Event management
- ✅ Work queues with backoff
- ✅ Health & readiness probes
- ✅ RBAC integration
- ✅ Multi-namespace support

### Real-World Use Cases

This operator pattern can be adapted for:
- **Application deployment controllers** - Manage custom deployment strategies
- **Database operators** - Provision and manage databases
- **Backup controllers** - Automate backup and restore
- **Certificate managers** - Issue and renew certificates
- **Configuration managers** - Distribute configs across clusters
- **Multi-cluster operators** - Coordinate resources across clusters

## Project Structure

```
kubernetes-controller/
├── server.ts              # Main operator with all integrations
├── crd-manager.ts         # CRD handling and validation
├── reconciler.ts          # Advanced reconciliation logic
├── event-handler.ts       # Event processing and aggregation
├── webhook-server.ts      # Admission control webhooks
├── leader-elector.ts      # High availability leader election
├── metrics-exporter.ts    # Prometheus metrics export
└── README.md             # This file
```

## Resources

- [Kubernetes Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [Custom Resource Definitions](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
- [Admission Webhooks](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)
- [Controller Best Practices](https://kubernetes.io/docs/concepts/architecture/controller/)
- [Leader Election](https://kubernetes.io/docs/concepts/architecture/leases/)
- [Prometheus Metrics](https://prometheus.io/docs/instrumenting/writing_exporters/)

## License

This showcase is part of the Elide framework examples.
