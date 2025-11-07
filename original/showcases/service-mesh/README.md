# Service Mesh Implementation

A production-ready service mesh implementation showcasing enterprise microservices patterns using Elide.

## Features

- **Service Registry & Discovery**: Automatic service registration and discovery with health tracking
- **Intelligent Load Balancing**: Round-robin and least-connections strategies
- **Circuit Breaker Pattern**: Automatic failure detection and recovery with state management
- **Retry Logic**: Exponential backoff retry mechanism for resilient service calls
- **Metrics Collection**: Comprehensive metrics for monitoring and observability
- **Health Checks**: Automated health monitoring of service instances

## Architecture

The service mesh acts as an infrastructure layer that handles:

1. **Service Registration**: Services register themselves with metadata
2. **Load Distribution**: Requests are distributed across healthy instances
3. **Failure Handling**: Circuit breakers prevent cascading failures
4. **Observability**: All service interactions are tracked and measured

## API Endpoints

### POST /register
Register a new service instance in the mesh.

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user-service-1",
    "name": "user-service",
    "host": "localhost",
    "port": 4001,
    "healthCheckUrl": "http://localhost:4001/health",
    "metadata": {
      "version": "1.0.0",
      "region": "us-east-1"
    },
    "healthy": true,
    "failureCount": 0,
    "requestCount": 0,
    "avgResponseTime": 0,
    "lastHealthCheck": 0
  }'
```

### POST /invoke
Invoke a service through the mesh with automatic retries and circuit breaking.

```bash
curl -X POST http://localhost:3000/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "user-service",
    "endpoint": "/api/users/123",
    "method": "GET"
  }'
```

### GET /metrics
View comprehensive metrics about the service mesh.

```bash
curl http://localhost:3000/metrics
```

Response:
```json
{
  "totalRequests": 1523,
  "successfulRequests": 1487,
  "failedRequests": 36,
  "successRate": "97.64%",
  "averageLatency": "45ms",
  "circuitBreakers": {
    "user-service": {
      "status": "CLOSED",
      "failureCount": 0,
      "successCount": 0
    }
  },
  "serviceHealth": {
    "user-service:user-service-1": true,
    "user-service:user-service-2": true
  }
}
```

### GET /services
List all registered services and their instances.

```bash
curl http://localhost:3000/services
```

### GET /health
Service mesh health check endpoint.

```bash
curl http://localhost:3000/health
```

## Circuit Breaker States

The circuit breaker has three states:

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Too many failures detected, requests are rejected immediately
- **HALF_OPEN**: Testing if service has recovered, limited requests allowed

### Configuration

- Failure Threshold: 5 failures trigger OPEN state
- Success Threshold: 2 successes in HALF_OPEN state close the circuit
- Timeout: 60 seconds before retry from OPEN state

## Load Balancing Strategies

### Round Robin (Default)
Distributes requests evenly across all healthy instances.

### Least Connections
Routes requests to the instance with the fewest active connections.

## Retry Mechanism

- Maximum retries: 3 attempts
- Exponential backoff: 100ms, 200ms, 400ms
- Automatic retry on transient failures
- Preserves request context across retries

## Running the Service

```bash
elide run server.ts
```

The service mesh will start on `http://localhost:3000` with automated health checks every 10 seconds.

## Example: Complete Service Integration

```typescript
// Register multiple instances of a service
await fetch('http://localhost:3000/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'payment-service-1',
    name: 'payment-service',
    host: 'localhost',
    port: 4002,
    healthCheckUrl: 'http://localhost:4002/health',
    metadata: { version: '2.0.0', region: 'us-east-1' },
    healthy: true,
    failureCount: 0,
    requestCount: 0,
    avgResponseTime: 0,
    lastHealthCheck: 0
  })
});

// Invoke the service through the mesh
const response = await fetch('http://localhost:3000/invoke', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceName: 'payment-service',
    endpoint: '/api/process-payment',
    method: 'POST',
    body: JSON.stringify({ amount: 100, currency: 'USD' })
  })
});

const result = await response.json();
console.log(result);
```

## Enterprise Use Cases

- **Microservices Architecture**: Manage communication between distributed services
- **High Availability**: Automatic failover to healthy instances
- **Traffic Management**: Control and route traffic with advanced policies
- **Observability**: Monitor service health and performance in real-time
- **Resilience**: Prevent cascading failures with circuit breakers

## Monitoring

The metrics endpoint provides real-time insights:

- Request success/failure rates
- Average response latencies
- Circuit breaker states
- Service health status
- Load distribution across instances

## Production Considerations

- Configure health check intervals based on your SLA
- Adjust circuit breaker thresholds for your traffic patterns
- Monitor metrics for capacity planning
- Implement distributed tracing for complex request flows
- Add authentication/authorization for production deployment

## Why Elide?

This showcase demonstrates Elide's strengths for enterprise backend:

- **High Performance**: Fast request routing and minimal overhead
- **Type Safety**: Full TypeScript support for enterprise reliability
- **Simplicity**: Clean APIs without framework complexity
- **Standards Compliant**: Uses standard Web APIs (fetch, Request, Response)
- **Production Ready**: Built-in features for real-world deployments
