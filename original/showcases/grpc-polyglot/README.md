# gRPC Polyglot Showcase

Demonstrates building high-performance gRPC services with implementations in multiple languages using Elide's polyglot runtime.

## Overview

This showcase implements four gRPC services in different languages:

- **TypeScript**: User management service with streaming support
- **Python**: Data processing service with batch operations
- **Go**: High-performance metrics collection and streaming
- **Java**: Legacy system integration and data migration

## Key Features

### 1. Protocol Buffers
- Strongly-typed service definitions
- Language-agnostic contracts
- Automatic code generation
- Backward compatibility

### 2. Multiple RPC Patterns
- **Unary RPC**: Single request, single response
- **Server Streaming**: Single request, stream of responses
- **Client Streaming**: Stream of requests, single response
- **Bidirectional Streaming**: Stream both ways

### 3. Language-Specific Implementations
- TypeScript: Modern async/await patterns
- Python: NumPy/Pandas integration
- Go: High-performance concurrent processing
- Java: Enterprise-grade reliability

## Running the Showcase

```bash
# Run the gRPC server
elide run server.ts

# Run individual services
elide run user-service.ts
elide run data-service.py
elide run metrics-service.go
elide run legacy-service.java
```

## Service Definitions

### UserService (TypeScript)
```protobuf
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (UserList);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc UpdateUser(UpdateUserRequest) returns (User);
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
  rpc StreamUsers(StreamUsersRequest) returns (stream User);
}
```

### DataService (Python)
```protobuf
service DataService {
  rpc ProcessData(DataRequest) returns (DataResponse);
  rpc BatchProcess(stream DataRequest) returns (BatchResponse);
  rpc StreamProcess(stream DataRequest) returns (stream DataResponse);
  rpc Aggregate(AggregateRequest) returns (AggregateResponse);
}
```

### MetricsService (Go)
```protobuf
service MetricsService {
  rpc RecordMetric(Metric) returns (RecordResponse);
  rpc GetMetrics(MetricsQuery) returns (MetricsList);
  rpc StreamMetrics(MetricsQuery) returns (stream Metric);
  rpc SubscribeMetrics(SubscribeRequest) returns (stream Metric);
}
```

### LegacyService (Java)
```protobuf
service LegacyService {
  rpc SyncData(SyncRequest) returns (SyncResponse);
  rpc GetLegacyUser(LegacyUserRequest) returns (LegacyUser);
  rpc MigrateLegacyData(MigrationRequest) returns (stream MigrationStatus);
}
```

## Benefits

### Performance
- Binary protocol (more efficient than JSON)
- HTTP/2 multiplexing
- Header compression
- Connection reuse

### Type Safety
- Compile-time checks
- Auto-generated code
- Schema validation
- Version compatibility

### Polyglot Support
- One .proto file
- Multiple language implementations
- Consistent behavior
- Type-safe cross-language calls

## Learn More

- [gRPC Official Documentation](https://grpc.io/docs/)
- [Protocol Buffers Guide](https://protobuf.dev/)
- [Elide gRPC Support](https://elide.dev/docs/grpc)
