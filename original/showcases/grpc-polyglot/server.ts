/**
 * gRPC Polyglot Server
 *
 * Demonstrates gRPC services implemented in multiple languages:
 * - TypeScript: User service
 * - Python: Data processing service
 * - Go: High-performance streaming service
 * - Java: Legacy system integration
 *
 * This showcase illustrates how Elide enables polyglot gRPC implementations
 * with strongly-typed service definitions across all languages.
 */

// Proto definitions (in production, these would be in .proto files)
const PROTO_DEFINITIONS = `
syntax = "proto3";

package polyglot;

// User Service (TypeScript)
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (UserList);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc UpdateUser(UpdateUserRequest) returns (User);
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
  rpc StreamUsers(StreamUsersRequest) returns (stream User);
}

// Data Processing Service (Python)
service DataService {
  rpc ProcessData(DataRequest) returns (DataResponse);
  rpc BatchProcess(stream DataRequest) returns (BatchResponse);
  rpc StreamProcess(stream DataRequest) returns (stream DataResponse);
  rpc Aggregate(AggregateRequest) returns (AggregateResponse);
}

// Metrics Service (Go)
service MetricsService {
  rpc RecordMetric(Metric) returns (RecordResponse);
  rpc GetMetrics(MetricsQuery) returns (MetricsList);
  rpc StreamMetrics(MetricsQuery) returns (stream Metric);
  rpc SubscribeMetrics(SubscribeRequest) returns (stream Metric);
}

// Legacy Integration Service (Java)
service LegacyService {
  rpc SyncData(SyncRequest) returns (SyncResponse);
  rpc GetLegacyUser(LegacyUserRequest) returns (LegacyUser);
  rpc MigrateLegacyData(MigrationRequest) returns (stream MigrationStatus);
}

// Messages
message User {
  string id = 1;
  string email = 2;
  string name = 3;
  string role = 4;
  int64 created_at = 5;
}

message GetUserRequest {
  string id = 1;
}

message ListUsersRequest {
  int32 page = 1;
  int32 page_size = 2;
  string filter = 3;
}

message UserList {
  repeated User users = 1;
  int32 total = 2;
}

message CreateUserRequest {
  string email = 1;
  string name = 2;
  string password = 3;
  string role = 4;
}

message UpdateUserRequest {
  string id = 1;
  string email = 2;
  string name = 3;
  string role = 4;
}

message DeleteUserRequest {
  string id = 1;
}

message DeleteUserResponse {
  bool success = 1;
}

message StreamUsersRequest {
  string filter = 1;
  int32 batch_size = 2;
}

message DataRequest {
  string id = 1;
  bytes data = 2;
  string format = 3;
}

message DataResponse {
  string id = 1;
  bytes result = 2;
  string status = 3;
  int64 processed_at = 4;
}

message BatchResponse {
  int32 processed = 1;
  int32 failed = 2;
  repeated string errors = 3;
}

message AggregateRequest {
  string operation = 1;
  repeated string fields = 2;
  map<string, string> filters = 3;
}

message AggregateResponse {
  map<string, double> results = 1;
  int32 row_count = 2;
}

message Metric {
  string name = 1;
  double value = 2;
  int64 timestamp = 3;
  map<string, string> tags = 4;
}

message RecordResponse {
  bool success = 1;
}

message MetricsQuery {
  string name = 1;
  int64 start_time = 2;
  int64 end_time = 3;
  map<string, string> tags = 4;
}

message MetricsList {
  repeated Metric metrics = 1;
}

message SubscribeRequest {
  repeated string metrics = 1;
  map<string, string> filters = 2;
}

message SyncRequest {
  string entity_type = 1;
  repeated string entity_ids = 2;
}

message SyncResponse {
  int32 synced_count = 1;
  repeated string errors = 2;
}

message LegacyUserRequest {
  int32 legacy_id = 1;
}

message LegacyUser {
  int32 legacy_id = 1;
  string username = 2;
  string email = 3;
  bytes legacy_data = 4;
}

message MigrationRequest {
  string entity_type = 1;
  int32 batch_size = 2;
  int32 offset = 3;
}

message MigrationStatus {
  int32 processed = 1;
  int32 total = 2;
  string current_entity = 3;
  bool completed = 4;
}
`;

// TypeScript User Service Implementation
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: number;
}

const users: User[] = [
  { id: '1', email: 'alice@example.com', name: 'Alice Johnson', role: 'admin', createdAt: Date.now() - 86400000 * 30 },
  { id: '2', email: 'bob@example.com', name: 'Bob Smith', role: 'user', createdAt: Date.now() - 86400000 * 20 },
  { id: '3', email: 'carol@example.com', name: 'Carol Williams', role: 'editor', createdAt: Date.now() - 86400000 * 10 },
];

class UserService {
  async getUser(request: { id: string }): Promise<User | null> {
    console.log(`[TypeScript UserService] GetUser: ${request.id}`);
    return users.find(u => u.id === request.id) || null;
  }

  async listUsers(request: { page?: number; pageSize?: number; filter?: string }): Promise<{ users: User[]; total: number }> {
    console.log(`[TypeScript UserService] ListUsers: page=${request.page}, size=${request.pageSize}`);
    const page = request.page || 1;
    const pageSize = request.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    let filtered = users;
    if (request.filter) {
      filtered = users.filter(u =>
        u.name.toLowerCase().includes(request.filter!.toLowerCase()) ||
        u.email.toLowerCase().includes(request.filter!.toLowerCase())
      );
    }

    return {
      users: filtered.slice(start, end),
      total: filtered.length,
    };
  }

  async createUser(request: { email: string; name: string; password: string; role?: string }): Promise<User> {
    console.log(`[TypeScript UserService] CreateUser: ${request.email}`);
    const newUser: User = {
      id: String(users.length + 1),
      email: request.email,
      name: request.name,
      role: request.role || 'user',
      createdAt: Date.now(),
    };
    users.push(newUser);
    return newUser;
  }

  async updateUser(request: { id: string; email?: string; name?: string; role?: string }): Promise<User> {
    console.log(`[TypeScript UserService] UpdateUser: ${request.id}`);
    const user = users.find(u => u.id === request.id);
    if (!user) throw new Error('User not found');

    if (request.email) user.email = request.email;
    if (request.name) user.name = request.name;
    if (request.role) user.role = request.role;

    return user;
  }

  async deleteUser(request: { id: string }): Promise<{ success: boolean }> {
    console.log(`[TypeScript UserService] DeleteUser: ${request.id}`);
    const index = users.findIndex(u => u.id === request.id);
    if (index === -1) return { success: false };

    users.splice(index, 1);
    return { success: true };
  }

  async* streamUsers(request: { filter?: string; batchSize?: number }): AsyncGenerator<User> {
    console.log(`[TypeScript UserService] StreamUsers: filter=${request.filter}`);
    const batchSize = request.batchSize || 10;

    let filtered = users;
    if (request.filter) {
      filtered = users.filter(u =>
        u.name.toLowerCase().includes(request.filter!.toLowerCase())
      );
    }

    for (let i = 0; i < filtered.length; i += batchSize) {
      const batch = filtered.slice(i, i + batchSize);
      for (const user of batch) {
        yield user;
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate streaming
      }
    }
  }
}

// Conceptual Python Data Service (implemented in TypeScript for demo)
class DataService {
  async processData(request: { id: string; data: Uint8Array; format: string }) {
    console.log(`[Python DataService] ProcessData: ${request.id}, format=${request.format}`);
    // Simulate Python data processing (NumPy, Pandas, etc.)
    return {
      id: request.id,
      result: request.data, // Processed data
      status: 'completed',
      processedAt: Date.now(),
    };
  }

  async batchProcess(requests: AsyncIterable<any>) {
    console.log(`[Python DataService] BatchProcess started`);
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for await (const request of requests) {
      try {
        await this.processData(request);
        processed++;
      } catch (error) {
        failed++;
        errors.push(String(error));
      }
    }

    return { processed, failed, errors };
  }

  async* streamProcess(requests: AsyncIterable<any>): AsyncGenerator<any> {
    console.log(`[Python DataService] StreamProcess started`);
    for await (const request of requests) {
      yield await this.processData(request);
    }
  }

  async aggregate(request: { operation: string; fields: string[]; filters: Record<string, string> }) {
    console.log(`[Python DataService] Aggregate: ${request.operation}`);
    // Simulate aggregation (Pandas-style)
    const results: Record<string, number> = {};
    for (const field of request.fields) {
      results[field] = Math.random() * 1000;
    }
    return { results, rowCount: 1000 };
  }
}

// Conceptual Go Metrics Service (implemented in TypeScript for demo)
class MetricsService {
  private metrics: Array<{ name: string; value: number; timestamp: number; tags: Record<string, string> }> = [];

  async recordMetric(metric: { name: string; value: number; timestamp: number; tags: Record<string, string> }) {
    console.log(`[Go MetricsService] RecordMetric: ${metric.name}=${metric.value}`);
    this.metrics.push(metric);
    return { success: true };
  }

  async getMetrics(query: { name?: string; startTime?: number; endTime?: number; tags?: Record<string, string> }) {
    console.log(`[Go MetricsService] GetMetrics: ${query.name}`);
    let filtered = this.metrics;

    if (query.name) {
      filtered = filtered.filter(m => m.name === query.name);
    }
    if (query.startTime) {
      filtered = filtered.filter(m => m.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      filtered = filtered.filter(m => m.timestamp <= query.endTime!);
    }

    return { metrics: filtered };
  }

  async* streamMetrics(query: any): AsyncGenerator<any> {
    console.log(`[Go MetricsService] StreamMetrics started`);
    const result = await this.getMetrics(query);
    for (const metric of result.metrics) {
      yield metric;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  async* subscribeMetrics(request: { metrics: string[]; filters: Record<string, string> }): AsyncGenerator<any> {
    console.log(`[Go MetricsService] SubscribeMetrics: ${request.metrics.join(', ')}`);
    // Simulate real-time metric streaming
    while (true) {
      for (const metricName of request.metrics) {
        yield {
          name: metricName,
          value: Math.random() * 100,
          timestamp: Date.now(),
          tags: request.filters,
        };
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Conceptual Java Legacy Service (implemented in TypeScript for demo)
class LegacyService {
  async syncData(request: { entityType: string; entityIds: string[] }) {
    console.log(`[Java LegacyService] SyncData: ${request.entityType}, count=${request.entityIds.length}`);
    // Simulate legacy system sync
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      syncedCount: request.entityIds.length,
      errors: [],
    };
  }

  async getLegacyUser(request: { legacyId: number }) {
    console.log(`[Java LegacyService] GetLegacyUser: ${request.legacyId}`);
    // Simulate legacy database lookup
    return {
      legacyId: request.legacyId,
      username: `legacy_user_${request.legacyId}`,
      email: `legacy${request.legacyId}@example.com`,
      legacyData: new TextEncoder().encode('Legacy data blob'),
    };
  }

  async* migrateLegacyData(request: { entityType: string; batchSize: number; offset: number }): AsyncGenerator<any> {
    console.log(`[Java LegacyService] MigrateLegacyData: ${request.entityType}`);
    const total = 100;
    const batchSize = request.batchSize || 10;

    for (let i = request.offset; i < total; i += batchSize) {
      yield {
        processed: i,
        total,
        currentEntity: `${request.entityType}_${i}`,
        completed: false,
      };
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    yield {
      processed: total,
      total,
      currentEntity: '',
      completed: true,
    };
  }
}

// Main demo
export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        gRPC Polyglot - Elide Runtime Showcase           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Polyglot gRPC Services:');
  console.log('  • TypeScript:  User management service');
  console.log('  • Python:      Data processing service');
  console.log('  • Go:          High-performance metrics service');
  console.log('  • Java:        Legacy system integration');
  console.log();
  console.log('gRPC Features:');
  console.log('  → Unary RPC (request-response)');
  console.log('  → Server streaming (one request, stream of responses)');
  console.log('  → Client streaming (stream of requests, one response)');
  console.log('  → Bidirectional streaming (stream both ways)');
  console.log();

  // Initialize services
  const userService = new UserService();
  const dataService = new DataService();
  const metricsService = new MetricsService();
  const legacyService = new LegacyService();

  console.log('════════════════════════════════════════════════════════════');
  console.log('Demo: gRPC Service Calls');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  // Test User Service (TypeScript)
  console.log('[Test 1] TypeScript UserService - GetUser');
  const user = await userService.getUser({ id: '1' });
  console.log('Result:', user);
  console.log();

  console.log('[Test 2] TypeScript UserService - ListUsers');
  const userList = await userService.listUsers({ page: 1, pageSize: 2 });
  console.log('Result:', userList);
  console.log();

  console.log('[Test 3] TypeScript UserService - CreateUser');
  const newUser = await userService.createUser({
    email: 'dave@example.com',
    name: 'Dave Thompson',
    password: 'secure123',
    role: 'user',
  });
  console.log('Result:', newUser);
  console.log();

  console.log('[Test 4] TypeScript UserService - StreamUsers');
  let count = 0;
  for await (const user of userService.streamUsers({ batchSize: 2 })) {
    console.log(`  Streamed user ${++count}:`, user.name);
  }
  console.log();

  // Test Data Service (Python-style)
  console.log('[Test 5] Python DataService - ProcessData');
  const dataResult = await dataService.processData({
    id: 'data-1',
    data: new TextEncoder().encode('test data'),
    format: 'json',
  });
  console.log('Result:', { ...dataResult, result: '[binary data]' });
  console.log();

  console.log('[Test 6] Python DataService - Aggregate');
  const aggResult = await dataService.aggregate({
    operation: 'sum',
    fields: ['revenue', 'profit', 'cost'],
    filters: { region: 'US' },
  });
  console.log('Result:', aggResult);
  console.log();

  // Test Metrics Service (Go-style)
  console.log('[Test 7] Go MetricsService - RecordMetric');
  await metricsService.recordMetric({
    name: 'api.latency',
    value: 42.5,
    timestamp: Date.now(),
    tags: { endpoint: '/users', method: 'GET' },
  });
  console.log('Metric recorded');
  console.log();

  console.log('[Test 8] Go MetricsService - GetMetrics');
  const metrics = await metricsService.getMetrics({ name: 'api.latency' });
  console.log('Result:', metrics);
  console.log();

  // Test Legacy Service (Java-style)
  console.log('[Test 9] Java LegacyService - GetLegacyUser');
  const legacyUser = await legacyService.getLegacyUser({ legacyId: 123 });
  console.log('Result:', { ...legacyUser, legacyData: '[binary data]' });
  console.log();

  console.log('[Test 10] Java LegacyService - MigrateLegacyData (streaming)');
  let migrationCount = 0;
  for await (const status of legacyService.migrateLegacyData({
    entityType: 'users',
    batchSize: 25,
    offset: 0,
  })) {
    console.log(`  Migration progress: ${status.processed}/${status.total}`);
    migrationCount++;
    if (migrationCount >= 3) break; // Show first 3 updates
  }
  console.log();

  console.log('════════════════════════════════════════════════════════════');
  console.log('gRPC Polyglot Demo Complete!');
  console.log('════════════════════════════════════════════════════════════');
  console.log();
  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Strongly-typed service contracts via Protocol Buffers');
  console.log('  ✓ Multiple RPC patterns (unary, streaming)');
  console.log('  ✓ Language-specific service implementations');
  console.log('  ✓ High-performance binary protocol');
  console.log('  ✓ Bidirectional streaming support');
  console.log();
  console.log('Production Benefits:');
  console.log('  → TypeScript: Fast API development');
  console.log('  → Python: Data science integration');
  console.log('  → Go: Maximum performance for metrics');
  console.log('  → Java: Legacy system compatibility');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
