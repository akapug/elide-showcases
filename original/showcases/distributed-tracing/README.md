# Distributed Tracing System

A production-ready distributed tracing implementation for tracking requests across microservices using Elide.

## Features

- **Trace Collection**: Capture and store traces across distributed services
- **Span Tracking**: Track individual operations within a trace
- **Correlation IDs**: Link related requests across service boundaries
- **Visualization API**: Generate trace visualizations and dependency graphs
- **Performance Analysis**: Identify bottlenecks and optimize critical paths
- **Query Interface**: Search and filter traces by multiple criteria

## Architecture

Distributed tracing follows the OpenTelemetry model:

```
Request → Trace
  ├── Root Span (Service A)
  │   ├── Child Span (Service B call)
  │   │   └── Child Span (Database query)
  │   └── Child Span (Service C call)
  └── Summary & Metrics
```

### Key Concepts

- **Trace**: Complete journey of a request through the system
- **Span**: Individual unit of work (function call, HTTP request, DB query)
- **Correlation ID**: Unique identifier linking all spans in a trace
- **Tags**: Key-value metadata attached to spans
- **Logs**: Timestamped events within spans

## API Endpoints

### Starting a Trace

#### POST /traces/start
Create a new trace for a request.

```bash
curl -X POST http://localhost:3000/traces/start \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "api-gateway",
    "operationName": "handleUserRequest"
  }'
```

Response:
```json
{
  "traceId": "trace-abc-123",
  "spanId": "span-root-001"
}
```

### Adding Spans

#### POST /traces/span
Add a child span to an existing trace.

```bash
curl -X POST http://localhost:3000/traces/span \
  -H "Content-Type: application/json" \
  -d '{
    "traceId": "trace-abc-123",
    "parentSpanId": "span-root-001",
    "serviceName": "user-service",
    "operationName": "getUserById",
    "tags": {
      "userId": "user-456",
      "cache": "miss"
    },
    "duration": 45,
    "status": "success"
  }'
```

Response:
```json
{
  "spanId": "span-child-002"
}
```

#### POST /traces/span/finish
Mark a span as completed.

```bash
curl -X POST http://localhost:3000/traces/span/finish \
  -H "Content-Type: application/json" \
  -d '{
    "spanId": "span-child-002",
    "status": "success"
  }'
```

### Querying Traces

#### GET /traces/{traceId}
Get complete trace information.

```bash
curl http://localhost:3000/traces/trace-abc-123
```

Response:
```json
{
  "traceId": "trace-abc-123",
  "rootSpan": {
    "spanId": "span-root-001",
    "serviceName": "api-gateway",
    "operationName": "handleUserRequest",
    "startTime": 1234567890,
    "duration": 123,
    "status": "success",
    "tags": {}
  },
  "spans": [
    {
      "spanId": "span-child-002",
      "parentSpanId": "span-root-001",
      "serviceName": "user-service",
      "operationName": "getUserById",
      "duration": 45,
      "tags": {
        "userId": "user-456"
      }
    }
  ],
  "serviceCalls": 3,
  "duration": 123,
  "status": "completed"
}
```

#### GET /traces/query
Search traces by criteria.

```bash
# Find all traces from user-service
curl "http://localhost:3000/traces/query?serviceName=user-service&limit=10"

# Find slow traces (>1000ms)
curl "http://localhost:3000/traces/query?minDuration=1000"

# Find failed traces
curl "http://localhost:3000/traces/query?status=failed"

# Find specific operation
curl "http://localhost:3000/traces/query?operationName=getUserById"
```

### Visualization

#### GET /traces/{traceId}/visualize
Get trace visualization data.

```bash
curl http://localhost:3000/traces/trace-abc-123/visualize
```

Response:
```json
{
  "traceId": "trace-abc-123",
  "duration": 123,
  "serviceCalls": 3,
  "tree": {
    "spanId": "span-root-001",
    "serviceName": "api-gateway",
    "operationName": "handleUserRequest",
    "duration": 123,
    "children": [
      {
        "spanId": "span-child-002",
        "serviceName": "user-service",
        "operationName": "getUserById",
        "duration": 45,
        "children": [
          {
            "spanId": "span-child-003",
            "serviceName": "database",
            "operationName": "query",
            "duration": 23,
            "children": []
          }
        ]
      }
    ]
  }
}
```

### Performance Analysis

#### GET /traces/{traceId}/analyze
Analyze trace performance and identify bottlenecks.

```bash
curl http://localhost:3000/traces/trace-abc-123/analyze
```

Response:
```json
{
  "traceId": "trace-abc-123",
  "totalDuration": 523,
  "serviceCalls": 5,
  "bottlenecks": [
    {
      "span": "database:complexQuery",
      "duration": 234,
      "percentage": 44.74
    },
    {
      "span": "external-api:fetchData",
      "duration": 156,
      "percentage": 29.83
    }
  ],
  "serviceBreakdown": {
    "api-gateway": 15,
    "user-service": 45,
    "database": 234,
    "external-api": 156
  },
  "criticalPath": [
    "api-gateway:handleRequest",
    "user-service:getUserById",
    "database:complexQuery"
  ]
}
```

### Statistics

#### GET /stats
Get overall tracing statistics.

```bash
curl http://localhost:3000/stats
```

Response:
```json
{
  "totalTraces": 1247,
  "activeTraces": 23,
  "completedTraces": 1198,
  "failedTraces": 26,
  "avgDuration": 234,
  "slowestTraces": [
    {
      "traceId": "trace-slow-001",
      "duration": 2345
    }
  ],
  "serviceStats": {
    "api-gateway": {
      "count": 1247,
      "avgDuration": 15
    },
    "user-service": {
      "count": 1089,
      "avgDuration": 45
    }
  }
}
```

## Example Workflows

### 1. Complete Request Trace

```bash
# Start trace in API Gateway
TRACE=$(curl -s -X POST http://localhost:3000/traces/start \
  -H "Content-Type: application/json" \
  -d '{"serviceName":"api-gateway","operationName":"processOrder"}' \
  | jq -r '.traceId')

ROOT_SPAN=$(curl -s -X POST http://localhost:3000/traces/start \
  -H "Content-Type: application/json" \
  -d '{"serviceName":"api-gateway","operationName":"processOrder"}' \
  | jq -r '.spanId')

# Add span for user service call
curl -X POST http://localhost:3000/traces/span \
  -H "Content-Type: application/json" \
  -d "{
    \"traceId\":\"$TRACE\",
    \"parentSpanId\":\"$ROOT_SPAN\",
    \"serviceName\":\"user-service\",
    \"operationName\":\"validateUser\",
    \"tags\":{\"userId\":\"user-123\"},
    \"duration\":45,
    \"status\":\"success\"
  }"

# Add span for database query
curl -X POST http://localhost:3000/traces/span \
  -H "Content-Type: application/json" \
  -d "{
    \"traceId\":\"$TRACE\",
    \"parentSpanId\":\"$ROOT_SPAN\",
    \"serviceName\":\"database\",
    \"operationName\":\"insertOrder\",
    \"tags\":{\"table\":\"orders\"},
    \"duration\":23,
    \"status\":\"success\"
  }"

# View complete trace
curl http://localhost:3000/traces/$TRACE | jq

# Visualize trace
curl http://localhost:3000/traces/$TRACE/visualize | jq

# Analyze performance
curl http://localhost:3000/traces/$TRACE/analyze | jq
```

### 2. Finding Slow Requests

```bash
# Query for slow traces (>500ms)
curl "http://localhost:3000/traces/query?minDuration=500&limit=20" | jq

# Analyze each slow trace
for trace in $(curl -s "http://localhost:3000/traces/query?minDuration=500" \
  | jq -r '.[].traceId'); do
  echo "Analyzing $trace:"
  curl -s "http://localhost:3000/traces/$trace/analyze" | jq '.bottlenecks'
done
```

### 3. Service Health Monitoring

```bash
# Get statistics
curl http://localhost:3000/stats | jq

# Check service performance
curl http://localhost:3000/stats | jq '.serviceStats'

# Find failed traces
curl "http://localhost:3000/traces/query?status=failed" | jq
```

## Integration Example

### Instrumenting Your Service

```typescript
// Start trace for incoming request
const response = await fetch('http://tracing:3000/traces/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceName: 'my-service',
    operationName: 'handleRequest'
  })
});

const { traceId, spanId } = await response.json();

// Pass traceId to downstream services
const userResponse = await fetch('http://user-service/api/users/123', {
  headers: {
    'X-Trace-ID': traceId,
    'X-Parent-Span-ID': spanId
  }
});

// Record downstream span
await fetch('http://tracing:3000/traces/span', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    traceId,
    parentSpanId: spanId,
    serviceName: 'user-service',
    operationName: 'getUser',
    duration: 45,
    tags: { userId: '123', cache: 'hit' }
  })
});

// Finish root span
await fetch('http://tracing:3000/traces/span/finish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    spanId,
    status: 'success'
  })
});
```

## Span Tags

Use tags to add metadata to spans:

```typescript
{
  "tags": {
    "http.method": "GET",
    "http.url": "/api/users/123",
    "http.status_code": 200,
    "db.type": "postgresql",
    "db.statement": "SELECT * FROM users WHERE id = $1",
    "cache.hit": true,
    "user.id": "user-123",
    "error": false
  }
}
```

## Performance Analysis

### Bottleneck Detection

The system automatically identifies spans that consume >10% of total trace time.

### Critical Path Analysis

Shows the longest execution path through the span tree.

### Service Breakdown

Aggregates time spent in each service for capacity planning.

## Enterprise Use Cases

- **Microservices Debugging**: Trace requests across service boundaries
- **Performance Optimization**: Identify slow operations and bottlenecks
- **Root Cause Analysis**: Find sources of errors in distributed systems
- **SLA Monitoring**: Track request latencies and success rates
- **Capacity Planning**: Understand service dependencies and load
- **Audit Trails**: Complete request journey for compliance

## Running the System

```bash
elide serve server.ts
```

The distributed tracing system will start on `http://localhost:3000`.

## Best Practices

### 1. Trace Everything
Instrument all service boundaries and significant operations.

### 2. Use Semantic Tags
Follow OpenTelemetry semantic conventions for tags.

### 3. Propagate Context
Always pass trace context to downstream services.

### 4. Set Timeouts
Finish spans even if operations fail or timeout.

### 5. Sample Strategically
Sample high-volume endpoints while tracing 100% of errors.

## Production Considerations

- **Storage**: Use time-series databases (InfluxDB, TimescaleDB)
- **Sampling**: Implement adaptive sampling for high traffic
- **Retention**: Archive old traces to cold storage
- **Aggregation**: Pre-aggregate statistics for dashboards
- **Privacy**: Sanitize sensitive data in tags and logs
- **Performance**: Use async processing for trace ingestion

## Comparison to Tools

This implementation demonstrates concepts similar to:

- **Jaeger**: OpenTracing-compatible distributed tracing
- **Zipkin**: Twitter's distributed tracing system
- **OpenTelemetry**: Vendor-neutral observability framework
- **AWS X-Ray**: AWS distributed tracing service
- **Datadog APM**: Commercial APM with tracing

## Why Elide?

This showcase demonstrates Elide's observability capabilities:

- **High Performance**: Low-overhead tracing collection
- **Type Safety**: TypeScript for reliable instrumentation
- **Simplicity**: Easy integration without heavy dependencies
- **Standards**: Compatible with OpenTelemetry concepts
- **Production Ready**: Built for real-world distributed systems

## Further Reading

- OpenTelemetry Specification
- Google Dapper Paper
- Distributed Tracing in Practice
- Observability Engineering (O'Reilly)
