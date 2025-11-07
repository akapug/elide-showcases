# gRPC Service Mesh

A production-ready gRPC service implementation with full Protocol Buffer support, streaming capabilities, health checks, and server reflection API.

## Features

- **Protocol Buffers**: Full protobuf encoding/decoding implementation
- **Streaming Support**: Unary, server streaming, client streaming, and bidirectional streaming
- **Load Balancing**: Client-side load balancing support
- **Health Checks**: Standard gRPC health checking protocol
- **Reflection API**: Server reflection for dynamic client discovery
- **Metadata Propagation**: Request/response metadata handling
- **Deadline Propagation**: Timeout and deadline management
- **Interceptors**: Middleware support for cross-cutting concerns

## Architecture

```
┌──────────────┐
│   Clients    │
└──────┬───────┘
       │ gRPC
       ▼
┌──────────────────┐
│  Load Balancer   │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Service │ │Service │
│Node 1  │ │Node 2  │
└────────┘ └────────┘
```

## Protocol Buffers

### Wire Format

gRPC uses Protocol Buffers for serialization:

```
Message Frame:
┌──────────┬──────────────┬─────────────┐
│Compressed│ Length (4B)  │   Message   │
│  (1B)    │              │   Payload   │
└──────────┴──────────────┴─────────────┘
```

### Field Encoding

```protobuf
message User {
  string id = 1;      // Varint tag + length-delimited string
  string name = 2;    // Varint tag + length-delimited string
  string email = 3;   // Varint tag + length-delimited string
}
```

Wire format:
```
Tag (field_number << 3 | wire_type)
Value (depends on wire type)
```

## Service Definition

### Proto Schema

```protobuf
syntax = "proto3";

package user;

service UserService {
  rpc GetUser(GetUserRequest) returns (User) {}
  rpc CreateUser(CreateUserRequest) returns (User) {}
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse) {}
  rpc UpdateUser(UpdateUserRequest) returns (User) {}
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse) {}
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}

message GetUserRequest {
  string id = 1;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
}

message UpdateUserRequest {
  string id = 1;
  string name = 2;
  string email = 3;
}

message DeleteUserRequest {
  string id = 1;
}

message DeleteUserResponse {
  bool success = 1;
}

message ListUsersRequest {}

message ListUsersResponse {
  repeated User users = 1;
}
```

## Streaming Patterns

### Server Streaming

Server sends multiple responses:

```typescript
async *listUsersStream(request: any): AsyncGenerator<any> {
  for (const user of this.users.values()) {
    yield { user };
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

### Client Streaming

Client sends multiple requests:

```typescript
async createUsers(
  requests: AsyncIterable<any>
): Promise<any> {
  const created = [];
  for await (const request of requests) {
    const user = await this.createUser(request);
    created.push(user);
  }
  return { users: created };
}
```

### Bidirectional Streaming

Both client and server stream:

```typescript
async *chat(
  messages: AsyncIterable<any>
): AsyncGenerator<any> {
  for await (const message of messages) {
    const response = await this.processMessage(message);
    yield response;
  }
}
```

## Metadata

### Request Metadata

```typescript
const metadata = new Metadata();
metadata.add('authorization', 'Bearer token123');
metadata.add('request-id', 'abc-123');
metadata.add('grpc-timeout', '5S'); // 5 second timeout
```

### Response Metadata

```typescript
// Initial metadata (sent before response)
context.sendInitialMetadata({
  'server-version': '1.0.0'
});

// Trailing metadata (sent after response)
context.sendTrailingMetadata({
  'response-time': '150ms'
});
```

## Interceptors

### Logging Interceptor

```typescript
grpcServer.use(async (context, next) => {
  const start = Date.now();
  console.log(`Request: ${context.peer}`);

  try {
    const result = await next();
    console.log(`Success: ${Date.now() - start}ms`);
    return result;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
});
```

### Authentication Interceptor

```typescript
grpcServer.use(async (context, next) => {
  const token = context.metadata.getFirst('authorization');

  if (!token) {
    throw new Error('Unauthenticated');
  }

  const user = await verifyToken(token);
  context.user = user;

  return next();
});
```

### Rate Limiting Interceptor

```typescript
const rateLimiter = new RateLimiter();

grpcServer.use(async (context, next) => {
  const allowed = await rateLimiter.checkLimit(context.peer);

  if (!allowed) {
    throw new Error('Rate limit exceeded');
  }

  return next();
});
```

## Health Checking

### Health Check Protocol

```protobuf
service Health {
  rpc Check(HealthCheckRequest) returns (HealthCheckResponse);
  rpc Watch(HealthCheckRequest) returns (stream HealthCheckResponse);
}

message HealthCheckRequest {
  string service = 1;
}

message HealthCheckResponse {
  enum ServingStatus {
    UNKNOWN = 0;
    SERVING = 1;
    NOT_SERVING = 2;
    SERVICE_UNKNOWN = 3;
  }
  ServingStatus status = 1;
}
```

### Implementation

```typescript
class HealthService {
  private serviceStatuses = new Map<string, string>();

  async check(request: any): Promise<any> {
    const status = this.serviceStatuses.get(request.service);
    return {
      status: status || 'SERVING'
    };
  }

  async *watch(request: any): AsyncGenerator<any> {
    while (true) {
      yield {
        status: this.serviceStatuses.get(request.service) || 'SERVING'
      };
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

## Server Reflection

Server reflection enables clients to discover service definitions:

```typescript
class ReflectionService {
  async serverReflectionInfo(request: any): Promise<any> {
    if (request.listServices) {
      return {
        listServicesResponse: {
          services: this.server.getServiceDescriptors()
        }
      };
    }

    if (request.fileByFilename) {
      return {
        fileDescriptorResponse: {
          fileDescriptorProto: this.getFileDescriptor(request.fileByFilename)
        }
      };
    }
  }
}
```

## Load Balancing

### Client-Side Load Balancing

```typescript
class LoadBalancer {
  private endpoints: string[];
  private currentIndex: number = 0;

  constructor(endpoints: string[]) {
    this.endpoints = endpoints;
  }

  // Round-robin
  getNext(): string {
    const endpoint = this.endpoints[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
    return endpoint;
  }

  // Least connections
  getLeastConnected(): string {
    // Track connections per endpoint
    return this.endpoints[0];
  }
}
```

## Error Handling

### gRPC Status Codes

```typescript
enum StatusCode {
  OK = 0,
  CANCELLED = 1,
  UNKNOWN = 2,
  INVALID_ARGUMENT = 3,
  DEADLINE_EXCEEDED = 4,
  NOT_FOUND = 5,
  ALREADY_EXISTS = 6,
  PERMISSION_DENIED = 7,
  RESOURCE_EXHAUSTED = 8,
  FAILED_PRECONDITION = 9,
  ABORTED = 10,
  OUT_OF_RANGE = 11,
  UNIMPLEMENTED = 12,
  INTERNAL = 13,
  UNAVAILABLE = 14,
  DATA_LOSS = 15,
  UNAUTHENTICATED = 16
}
```

### Error Response

```typescript
throw {
  code: StatusCode.NOT_FOUND,
  message: 'User not found',
  details: {
    userId: request.id
  }
};
```

## Deadlines and Timeouts

### Setting Deadline

```typescript
// Client sets timeout
const metadata = new Metadata();
metadata.add('grpc-timeout', '5S'); // 5 seconds

// Server checks deadline
if (context.deadline && Date.now() > context.deadline.getTime()) {
  throw {
    code: StatusCode.DEADLINE_EXCEEDED,
    message: 'Request timeout'
  };
}
```

## Performance

### Connection Pooling

```typescript
class ConnectionPool {
  private connections: Connection[] = [];
  private maxSize: number = 10;

  async getConnection(): Promise<Connection> {
    if (this.connections.length > 0) {
      return this.connections.pop()!;
    }
    return this.createConnection();
  }

  releaseConnection(conn: Connection): void {
    if (this.connections.length < this.maxSize) {
      this.connections.push(conn);
    } else {
      conn.close();
    }
  }
}
```

### Message Compression

```typescript
// Enable compression
const compressed = await compress(messageData);

// Frame header with compression flag
const frame = new Uint8Array(5 + compressed.length);
frame[0] = 1; // Compressed flag
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 50051
CMD ["elide", "run", "server.ts"]
```

### Kubernetes

```yaml
apiVersion: v1
kind: Service
metadata:
  name: grpc-service
spec:
  type: ClusterIP
  ports:
  - port: 50051
    protocol: TCP
    name: grpc
  selector:
    app: grpc-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grpc-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grpc-service
  template:
    metadata:
      labels:
        app: grpc-service
    spec:
      containers:
      - name: grpc-service
        image: grpc-service:latest
        ports:
        - containerPort: 50051
          protocol: TCP
```

## Testing

### grpcurl

```bash
# List services
grpcurl -plaintext localhost:50051 list

# Describe service
grpcurl -plaintext localhost:50051 describe UserService

# Call method
grpcurl -plaintext -d '{"id": "1"}' \
  localhost:50051 UserService/GetUser

# Health check
grpcurl -plaintext localhost:50051 \
  grpc.health.v1.Health/Check
```

### Unit Tests

```typescript
describe('UserService', () => {
  it('should get user by id', async () => {
    const service = new UserService();
    const context = createMockContext();

    const result = await service.getUser({ id: '1' }, context);

    expect(result.id).toBe('1');
    expect(result.name).toBe('Alice');
  });
});
```

## Running the Server

```bash
# Start server
elide run server.ts

# Server runs on port 50051
```

## Best Practices

1. **Use Proper Error Codes**: Return appropriate gRPC status codes
2. **Implement Health Checks**: Always implement health checking
3. **Enable Reflection**: Enable reflection for development
4. **Set Deadlines**: Always set request deadlines
5. **Use Interceptors**: Implement cross-cutting concerns with interceptors
6. **Connection Pooling**: Reuse connections for better performance
7. **Monitor Metrics**: Track request latency, error rates, and throughput
8. **Implement Retry Logic**: Handle transient failures with retries

## Monitoring

Track these metrics:
- Request rate (requests/second)
- Error rate by status code
- Request latency (p50, p95, p99)
- Connection count
- Message size distribution
- Stream duration

## Further Reading

- [gRPC Protocol Specification](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md)
- [Protocol Buffers](https://developers.google.com/protocol-buffers)
- [gRPC Health Checking](https://github.com/grpc/grpc/blob/master/doc/health-checking.md)
- [Server Reflection](https://github.com/grpc/grpc/blob/master/doc/server-reflection.md)
