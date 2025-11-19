# Testing Strategies for Elide Applications

**Comprehensive guide to testing TypeScript, Python, Ruby, and Java code on Elide**

Learn how to write unit tests, integration tests, and end-to-end tests for your polyglot Elide applications.

---

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [HTTP Server Testing](#http-server-testing)
- [Polyglot Testing](#polyglot-testing)
- [Mocking and Stubs](#mocking-and-stubs)
- [Test Automation](#test-automation)
- [Best Practices](#best-practices)

---

## Testing Philosophy

### Test Pyramid

```
       /\
      /  \      E2E Tests (Few)
     /────\
    /      \    Integration Tests (Some)
   /────────\
  /          \  Unit Tests (Many)
 /____________\
```

**Elide Testing Strategy:**
1. **Many unit tests**: Fast, isolated, test individual functions
2. **Some integration tests**: Test component interactions
3. **Few E2E tests**: Test complete user flows

---

## Unit Testing

### Simple Test Framework

```typescript
// test-framework.ts
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
  private results: TestResult[] = [];

  test(name: string, fn: () => Promise<void> | void) {
    this.tests.push({ name, fn });
  }

  async run(): Promise<void> {
    console.log(`\nRunning ${this.tests.length} tests...\n`);

    for (const test of this.tests) {
      const start = performance.now();
      let passed = true;
      let error: string | undefined;

      try {
        await test.fn();
      } catch (e) {
        passed = false;
        error = e instanceof Error ? e.message : String(e);
      }

      const duration = performance.now() - start;
      this.results.push({ name: test.name, passed, error, duration });

      if (passed) {
        console.log(`✓ ${test.name} (${duration.toFixed(2)}ms)`);
      } else {
        console.log(`✗ ${test.name} (${duration.toFixed(2)}ms)`);
        if (error) {
          console.log(`  Error: ${error}`);
        }
      }
    }

    this.printSummary();
  }

  private printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const duration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n${"=".repeat(50)}`);
    console.log(`Tests: ${passed} passed, ${failed} failed, ${total} total`);
    console.log(`Time: ${duration.toFixed(2)}ms`);
    console.log(`${"=".repeat(50)}\n`);

    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Assertion helpers
export function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, but got ${actual}`
    );
  }
}

export function assertDeepEquals<T>(actual: T, expected: T, message?: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
    );
  }
}

export function assertThrows(fn: () => void, message?: string): void {
  try {
    fn();
    throw new Error(message || "Expected function to throw");
  } catch (e) {
    // Expected
  }
}

export async function assertRejects(
  fn: () => Promise<void>,
  message?: string
): Promise<void> {
  try {
    await fn();
    throw new Error(message || "Expected promise to reject");
  } catch (e) {
    // Expected
  }
}
```

### Example Unit Tests

```typescript
// utils.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
```

```typescript
// utils.test.ts
import { TestRunner, assert, assertEquals, assertThrows } from "./test-framework.ts";
import { add, multiply, divide, validateEmail, formatCurrency } from "./utils.ts";

const runner = new TestRunner();

// Math tests
runner.test("add() should add two numbers", () => {
  assertEquals(add(2, 3), 5);
  assertEquals(add(-1, 1), 0);
  assertEquals(add(0, 0), 0);
});

runner.test("multiply() should multiply two numbers", () => {
  assertEquals(multiply(2, 3), 6);
  assertEquals(multiply(-2, 3), -6);
  assertEquals(multiply(0, 5), 0);
});

runner.test("divide() should divide two numbers", () => {
  assertEquals(divide(6, 2), 3);
  assertEquals(divide(10, 4), 2.5);
});

runner.test("divide() should throw on division by zero", () => {
  assertThrows(() => divide(5, 0));
});

// Validation tests
runner.test("validateEmail() should validate email format", () => {
  assert(validateEmail("test@example.com"));
  assert(validateEmail("user+tag@domain.co.uk"));
  assert(!validateEmail("invalid"));
  assert(!validateEmail("@example.com"));
  assert(!validateEmail("user@"));
});

// Formatting tests
runner.test("formatCurrency() should format numbers as currency", () => {
  assertEquals(formatCurrency(10), "$10.00");
  assertEquals(formatCurrency(10.5), "$10.50");
  assertEquals(formatCurrency(0), "$0.00");
});

// Run tests
runner.run();
```

Run tests:
```bash
elide run utils.test.ts
```

---

## Integration Testing

### Testing HTTP Handlers

```typescript
// handlers.ts
export async function handleGetUser(userId: string): Promise<any> {
  // Simulate database lookup
  if (userId === "1") {
    return { id: "1", name: "Alice", email: "alice@example.com" };
  }
  return null;
}

export async function handleCreateUser(data: any): Promise<any> {
  if (!data.name || !data.email) {
    throw new Error("Missing required fields");
  }

  return {
    id: Date.now().toString(),
    ...data
  };
}
```

```typescript
// handlers.test.ts
import { TestRunner, assertEquals, assertRejects } from "./test-framework.ts";
import { handleGetUser, handleCreateUser } from "./handlers.ts";

const runner = new TestRunner();

runner.test("handleGetUser() should return user when found", async () => {
  const user = await handleGetUser("1");
  assertEquals(user.id, "1");
  assertEquals(user.name, "Alice");
});

runner.test("handleGetUser() should return null when not found", async () => {
  const user = await handleGetUser("999");
  assertEquals(user, null);
});

runner.test("handleCreateUser() should create user with valid data", async () => {
  const data = { name: "Bob", email: "bob@example.com" };
  const user = await handleCreateUser(data);

  assertEquals(user.name, "Bob");
  assertEquals(user.email, "bob@example.com");
  assert(user.id);
});

runner.test("handleCreateUser() should reject invalid data", async () => {
  await assertRejects(async () => {
    await handleCreateUser({ name: "Bob" });  // Missing email
  });
});

runner.run();
```

---

## HTTP Server Testing

### Testing Fetch Handlers

```typescript
// server.ts
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "healthy" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (url.pathname === "/api/users") {
    if (req.method === "GET") {
      return new Response(JSON.stringify([
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" }
      ]), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (req.method === "POST") {
      const data = await req.json();
      return new Response(JSON.stringify({
        id: "3",
        ...data
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response("Not Found", { status: 404 });
}
```

```typescript
// server.test.ts
import { TestRunner, assertEquals, assertDeepEquals } from "./test-framework.ts";
import handler from "./server.ts";

const runner = new TestRunner();

runner.test("GET /health should return healthy status", async () => {
  const req = new Request("http://localhost:3000/health");
  const res = await handler(req);

  assertEquals(res.status, 200);

  const data = await res.json();
  assertEquals(data.status, "healthy");
});

runner.test("GET /api/users should return users list", async () => {
  const req = new Request("http://localhost:3000/api/users");
  const res = await handler(req);

  assertEquals(res.status, 200);

  const data = await res.json();
  assertEquals(data.length, 2);
  assertEquals(data[0].name, "Alice");
});

runner.test("POST /api/users should create user", async () => {
  const req = new Request("http://localhost:3000/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Charlie", email: "charlie@example.com" })
  });

  const res = await handler(req);

  assertEquals(res.status, 201);

  const data = await res.json();
  assertEquals(data.name, "Charlie");
  assertEquals(data.email, "charlie@example.com");
});

runner.test("GET /unknown should return 404", async () => {
  const req = new Request("http://localhost:3000/unknown");
  const res = await handler(req);

  assertEquals(res.status, 404);
});

runner.run();
```

### Testing with Mock Fetch

```typescript
// mock-fetch.ts
export class MockFetchClient {
  private responses: Map<string, Response> = new Map();

  mockResponse(url: string, response: Response): void {
    this.responses.set(url, response);
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const mockResponse = this.responses.get(url);

    if (mockResponse) {
      return mockResponse;
    }

    throw new Error(`No mock response for ${url}`);
  }

  clear(): void {
    this.responses.clear();
  }
}

// Usage in tests
const mockFetch = new MockFetchClient();

mockFetch.mockResponse("https://api.example.com/data", new Response(
  JSON.stringify({ data: "mocked" }),
  {
    status: 200,
    headers: { "Content-Type": "application/json" }
  }
));

const response = await mockFetch.fetch("https://api.example.com/data");
const data = await response.json();
console.log(data);  // { data: "mocked" }
```

---

## Polyglot Testing

### Testing TypeScript + Python Integration

**Python module** (`calculator.py`):
```python
def add(a, b):
    return a + b

def multiply(a, b):
    return a * b
```

**Test** (`integration.test.ts`):
```typescript
import { TestRunner, assertEquals } from "./test-framework.ts";
import { add, multiply } from "./calculator.py";

const runner = new TestRunner();

runner.test("Python add() should work from TypeScript", () => {
  assertEquals(add(2, 3), 5);
  assertEquals(add(-1, 1), 0);
});

runner.test("Python multiply() should work from TypeScript", () => {
  assertEquals(multiply(2, 3), 6);
  assertEquals(multiply(-2, 3), -6);
});

runner.run();
```

### Testing Cross-Language Data

```typescript
runner.test("Python should handle TypeScript objects", () => {
  const data = { numbers: [1, 2, 3], name: "test" };
  const result = pythonProcessData(data);

  assert(result.processed);
  assertEquals(result.count, 3);
});

runner.test("TypeScript should handle Python dictionaries", () => {
  const result = pythonGetData();

  assertEquals(result.status, "success");
  assert(Array.isArray(result.items));
});
```

---

## Mocking and Stubs

### Mock Database

```typescript
// mock-db.ts
export class MockDatabase {
  private data: Map<string, any> = new Map();

  async find(table: string, query?: any): Promise<any[]> {
    const allData = Array.from(this.data.values())
      .filter(item => item._table === table);

    if (!query) {
      return allData;
    }

    return allData.filter(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  async findById(table: string, id: string): Promise<any> {
    return this.data.get(`${table}:${id}`) || null;
  }

  async insert(table: string, data: any): Promise<any> {
    const id = data.id || Date.now().toString();
    const record = { ...data, id, _table: table };
    this.data.set(`${table}:${id}`, record);
    return record;
  }

  async update(table: string, id: string, data: any): Promise<any> {
    const record = this.data.get(`${table}:${id}`);
    if (!record) return null;

    const updated = { ...record, ...data };
    this.data.set(`${table}:${id}`, updated);
    return updated;
  }

  async delete(table: string, id: string): Promise<boolean> {
    return this.data.delete(`${table}:${id}`);
  }

  clear(): void {
    this.data.clear();
  }

  seed(table: string, records: any[]): void {
    for (const record of records) {
      this.insert(table, record);
    }
  }
}

// Usage in tests
const mockDb = new MockDatabase();

// Seed test data
mockDb.seed("users", [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" }
]);

// Use in tests
runner.test("should find users", async () => {
  const users = await mockDb.find("users");
  assertEquals(users.length, 2);
});
```

### Stub External APIs

```typescript
// stub-api.ts
export class APIStub {
  private handlers: Map<string, (req: Request) => Promise<Response>> = new Map();

  on(pattern: string, handler: (req: Request) => Promise<Response>): void {
    this.handlers.set(pattern, handler);
  }

  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);

    for (const [pattern, handler] of this.handlers.entries()) {
      if (url.pathname.includes(pattern)) {
        return handler(req);
      }
    }

    return new Response("Not Found", { status: 404 });
  }
}

// Usage
const apiStub = new APIStub();

apiStub.on("/api/users", async (req) => {
  return new Response(JSON.stringify([
    { id: "1", name: "Alice" }
  ]), {
    headers: { "Content-Type": "application/json" }
  });
});

// In tests
const req = new Request("http://api.example.com/api/users");
const res = await apiStub.handle(req);
const data = await res.json();
```

---

## Test Automation

### Test Script

```bash
#!/bin/bash
# test.sh

echo "Running Elide Tests..."

# Unit tests
echo "\n=== Unit Tests ==="
elide run tests/utils.test.ts
elide run tests/handlers.test.ts

# Integration tests
echo "\n=== Integration Tests ==="
elide run tests/integration.test.ts

# Server tests
echo "\n=== Server Tests ==="
elide run tests/server.test.ts

echo "\n✓ All tests completed"
```

Make executable and run:
```bash
chmod +x test.sh
./test.sh
```

### Watch Mode

```typescript
// watch-tests.ts
import { watch } from "fs";

function runTests() {
  console.clear();
  console.log("Running tests...\n");

  // Run test files
  const testFiles = ["utils.test.ts", "handlers.test.ts", "server.test.ts"];

  for (const file of testFiles) {
    try {
      // In practice, you'd spawn a process
      console.log(`Running ${file}...`);
    } catch (error) {
      console.error(`Error in ${file}:`, error);
    }
  }
}

// Watch for changes
watch(".", { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith(".ts")) {
    console.log(`\nFile changed: ${filename}`);
    runTests();
  }
});

console.log("Watching for changes...");
runTests();
```

---

## Best Practices

### 1. Test Structure

Use **AAA pattern**: Arrange, Act, Assert

```typescript
runner.test("should calculate total price", () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ];

  // Act
  const total = calculateTotal(items);

  // Assert
  assertEquals(total, 35);
});
```

### 2. Test Naming

Use descriptive names:

```typescript
// ✅ Good
runner.test("should return 404 when user not found", async () => {});
runner.test("should validate email format correctly", () => {});

// ❌ Bad
runner.test("test1", () => {});
runner.test("user test", () => {});
```

### 3. Test Independence

Each test should be independent:

```typescript
// ✅ Good - Each test sets up own data
runner.test("test 1", () => {
  const data = [1, 2, 3];
  const result = process(data);
  assertEquals(result, expected);
});

runner.test("test 2", () => {
  const data = [4, 5, 6];
  const result = process(data);
  assertEquals(result, expected);
});

// ❌ Bad - Tests share state
let sharedData = [1, 2, 3];

runner.test("test 1", () => {
  sharedData.push(4);  // Modifies shared state!
});

runner.test("test 2", () => {
  // Depends on test 1's modifications
  assertEquals(sharedData.length, 4);
});
```

### 4. Test Coverage

Aim for high coverage of critical paths:

```typescript
// Test happy path
runner.test("should process valid data", () => {
  const result = processData({ valid: true });
  assert(result.success);
});

// Test error cases
runner.test("should reject invalid data", () => {
  assertThrows(() => processData({ valid: false }));
});

// Test edge cases
runner.test("should handle empty input", () => {
  const result = processData({});
  assertEquals(result, defaultValue);
});
```

### 5. Fast Tests

Keep tests fast:

```typescript
// ✅ Good - Fast unit test
runner.test("should add numbers", () => {
  assertEquals(add(2, 3), 5);
});

// ⚠️ Slower - Integration test
runner.test("should fetch from API", async () => {
  const data = await fetchFromAPI();
  assert(data);
});
```

---

## Next Steps

- **[Debugging](./debugging.md)** - Debug test failures
- **[Profiling](./profiling.md)** - Profile test performance
- **[Deployment](./deployment.md)** - Deploy with CI/CD testing
- **[HTTP Servers](./http-servers.md)** - Test HTTP endpoints

---

## Summary

**Testing in Elide:**

- ✅ **Unit tests**: Test individual functions
- ✅ **Integration tests**: Test component interactions
- ✅ **HTTP tests**: Test fetch handlers and servers
- ✅ **Polyglot tests**: Test cross-language calls
- ✅ **Mocking**: Mock databases and APIs
- ✅ **Automation**: Run tests automatically

**Testing Strategy:**
1. Write many fast unit tests
2. Some integration tests for critical paths
3. Few E2E tests for user flows
4. Mock external dependencies
5. Automate test execution
6. Maintain high coverage

🚀 **Build confidence with comprehensive testing!**
