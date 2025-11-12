/**
 * Elide Full-Stack Framework - Test Suite
 *
 * Comprehensive tests for all framework components.
 */

// Test utilities
class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => Promise<void>): void {
    this.tests.push({ name, fn });
  }

  async run(): Promise<void> {
    console.log("\n🧪 Running Tests...\n");

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✅ ${test.name}`);
      } catch (error: any) {
        this.failed++;
        console.error(`❌ ${test.name}`);
        console.error(`   ${error.message}`);
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals(actual: any, expected: any, message?: string): void {
  const msg = message || `Expected ${expected}, got ${actual}`;
  assert(actual === expected, msg);
}

const runner = new TestRunner();

// Router Tests
runner.test("Router: Static route matching", async () => {
  const { createRouter } = await import("./router.ts");
  const router = createRouter();

  // Register test route
  router.registry.register({
    path: "/hello",
    method: "GET",
    handler: async () => new Response("Hello"),
  });

  const { route } = router.registry.find("/hello", "GET");
  assert(route !== null, "Route should be found");
  assertEquals(route?.path, "/hello");
});

runner.test("Router: Dynamic route matching", async () => {
  const { createRouter } = await import("./router.ts");
  const router = createRouter();

  // Register dynamic route
  router.registry.register({
    path: "/users/[id]",
    method: "GET",
    handler: async () => new Response("User"),
  });

  const { route, params } = router.registry.find("/users/123", "GET");
  assert(route !== null, "Route should be found");
  assertEquals(params.id, "123", "ID param should be extracted");
});

runner.test("Router: Catch-all route matching", async () => {
  const { createRouter } = await import("./router.ts");
  const router = createRouter();

  // Register catch-all route
  router.registry.register({
    path: "/docs/[...slug]",
    method: "GET",
    handler: async () => new Response("Docs"),
  });

  const { route, params } = router.registry.find("/docs/api/users/create", "GET");
  assert(route !== null, "Route should be found");
  assertEquals(params.slug, "api/users/create", "Slug should capture all segments");
});

// Data Layer Tests
runner.test("DataLayer: Create record", async () => {
  const { createDataLayer } = await import("./data-layer.ts");

  const schema = {
    users: {
      id: { type: "number", primary: true, autoIncrement: true },
      email: { type: "string", unique: true, required: true },
      name: { type: "string", required: true },
    },
  };

  const db = createDataLayer(":memory:", schema);
  await db.migrate();

  const user = await db.model("users").create({
    email: "test@example.com",
    name: "Test User",
  });

  assert(user.id !== undefined, "User ID should be set");
  assertEquals(user.email, "test@example.com");
  assertEquals(user.name, "Test User");

  db.close();
});

runner.test("DataLayer: Find records", async () => {
  const { createDataLayer } = await import("./data-layer.ts");

  const schema = {
    users: {
      id: { type: "number", primary: true, autoIncrement: true },
      email: { type: "string", required: true },
      name: { type: "string", required: true },
    },
  };

  const db = createDataLayer(":memory:", schema);
  await db.migrate();

  await db.model("users").create({ email: "user1@example.com", name: "User 1" });
  await db.model("users").create({ email: "user2@example.com", name: "User 2" });

  const users = await db.model("users").findMany({
    where: { email: { contains: "@example.com" } },
  });

  assertEquals(users.length, 2, "Should find 2 users");

  db.close();
});

runner.test("DataLayer: Update record", async () => {
  const { createDataLayer } = await import("./data-layer.ts");

  const schema = {
    users: {
      id: { type: "number", primary: true, autoIncrement: true },
      email: { type: "string", required: true },
      name: { type: "string", required: true },
    },
  };

  const db = createDataLayer(":memory:", schema);
  await db.migrate();

  const user = await db.model("users").create({
    email: "test@example.com",
    name: "Original Name",
  });

  const updated = await db.model("users").update(
    { id: user.id },
    { name: "Updated Name" }
  );

  assertEquals(updated?.name, "Updated Name");

  db.close();
});

runner.test("DataLayer: Delete record", async () => {
  const { createDataLayer } = await import("./data-layer.ts");

  const schema = {
    users: {
      id: { type: "number", primary: true, autoIncrement: true },
      email: { type: "string", required: true },
      name: { type: "string", required: true },
    },
  };

  const db = createDataLayer(":memory:", schema);
  await db.migrate();

  const user = await db.model("users").create({
    email: "test@example.com",
    name: "Test User",
  });

  await db.model("users").delete({ id: user.id });

  const found = await db.model("users").findUnique({ id: user.id });
  assertEquals(found, null, "User should be deleted");

  db.close();
});

// Authentication Tests
runner.test("Auth: Password hashing", async () => {
  const { PasswordHasher } = await import("./auth.ts");

  const password = "mySecurePassword123";
  const hashed = await PasswordHasher.hashPassword(password);

  assert(hashed !== password, "Password should be hashed");
  assert(hashed.includes(":"), "Hash should include salt");

  const valid = await PasswordHasher.verifyPassword(password, hashed);
  assert(valid, "Password should verify correctly");

  const invalid = await PasswordHasher.verifyPassword("wrongPassword", hashed);
  assert(!invalid, "Wrong password should not verify");
});

runner.test("Auth: JWT token creation and verification", async () => {
  const { JWT } = await import("./auth.ts");

  const jwt = new JWT("test-secret");

  const token = await jwt.sign(
    {
      userId: 1,
      email: "test@example.com",
      roles: ["user"],
    },
    3600
  );

  assert(typeof token === "string", "Token should be a string");
  assert(token.split(".").length === 3, "Token should have 3 parts");

  const payload = await jwt.verify(token);
  assert(payload !== null, "Token should verify");
  assertEquals(payload?.userId, 1);
  assertEquals(payload?.email, "test@example.com");
});

runner.test("Auth: Registration flow", async () => {
  const { createAuthSystem } = await import("./auth.ts");
  const { createDataLayer } = await import("./data-layer.ts");

  const schema = {
    users: {
      id: { type: "number", primary: true, autoIncrement: true },
      email: { type: "string", unique: true, required: true },
      password: { type: "string", required: true },
      name: { type: "string", required: true },
      emailVerified: { type: "boolean", default: false },
    },
    sessions: {
      id: { type: "number", primary: true, autoIncrement: true },
      userId: { type: "number", required: true },
      token: { type: "string", required: true, unique: true },
      expiresAt: { type: "date", required: true },
      createdAt: { type: "date" },
    },
    password_resets: {
      id: { type: "number", primary: true, autoIncrement: true },
      userId: { type: "number", required: true },
      token: { type: "string", required: true, unique: true },
      expiresAt: { type: "date", required: true },
      createdAt: { type: "date" },
    },
  };

  const db = createDataLayer(":memory:", schema);
  await db.migrate();

  const auth = createAuthSystem(db, {
    jwtSecret: "test-secret",
    passwordMinLength: 8,
  });

  const user = await auth.register("test@example.com", "password123", "Test User");

  assert(user.id !== undefined, "User should have ID");
  assertEquals(user.email, "test@example.com");
  assert(user.password === undefined, "Password should not be returned");

  db.close();
});

// Job Queue Tests
runner.test("Jobs: Add and process job", async () => {
  const { createJobManager } = await import("./jobs.ts");
  const { createDataLayer } = await import("./data-layer.ts");

  const schema = {
    jobs: {
      id: { type: "string", primary: true },
      queue: { type: "string", required: true },
      name: { type: "string", required: true },
      status: { type: "string", required: true },
      data: { type: "json" },
      result: { type: "json" },
      priority: { type: "number", default: 5 },
      attempts: { type: "number", default: 0 },
      maxAttempts: { type: "number", default: 3 },
      createdAt: { type: "date" },
    },
  };

  const db = createDataLayer(":memory:", schema);
  await db.migrate();

  const jobs = createJobManager(db);
  const testQueue = jobs.queue("test");

  let processed = false;

  testQueue.handle("test-job", async (data) => {
    processed = true;
    return { result: data.value * 2 };
  });

  const job = await testQueue.add("test-job", { value: 21 });

  assert(job.id !== undefined, "Job should have ID");
  assertEquals(job.name, "test-job");

  db.close();
});

// Server Components Tests
runner.test("ServerComponents: Render simple component", async () => {
  const { ServerRenderer } = await import("./server-components.ts");

  const renderer = new ServerRenderer();

  const Component = () => ({
    type: "div",
    props: {
      children: "Hello World",
    },
  });

  const response = await renderer.render(Component, {});
  const html = await response.text();

  assert(html.includes("Hello World"), "Should render component text");
  assert(html.includes("<!DOCTYPE html>"), "Should include doctype");
});

// Run all tests
if (import.meta.main) {
  await runner.run();
}

export { runner, assert, assertEquals };
