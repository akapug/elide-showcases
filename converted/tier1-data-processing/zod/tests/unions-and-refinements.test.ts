/**
 * Tests for Zod unions, refinements, and transformations
 */

import { z, ZodError } from "../src/zod.ts";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}:`, error);
    throw error;
  }
}

function assertEquals(actual: any, expected: any): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertThrows(fn: () => any): void {
  try {
    fn();
    throw new Error("Expected function to throw");
  } catch (error) {
    if (!(error instanceof ZodError)) {
      throw new Error(`Expected ZodError, got ${error}`);
    }
  }
}

// Union tests
test("z.union() validates multiple types", () => {
  const schema = z.union([z.string(), z.number()]);
  assertEquals(schema.parse("hello"), "hello");
  assertEquals(schema.parse(42), 42);
  assertThrows(() => schema.parse(true));
  assertThrows(() => schema.parse(null));
});

test("z.union() works with objects", () => {
  const schema = z.union([
    z.object({ type: z.literal("a"), value: z.string() }),
    z.object({ type: z.literal("b"), value: z.number() }),
  ]);

  assertEquals(schema.parse({ type: "a", value: "hello" }), { type: "a", value: "hello" });
  assertEquals(schema.parse({ type: "b", value: 42 }), { type: "b", value: 42 });
  assertThrows(() => schema.parse({ type: "c", value: "test" }));
});

test("z.discriminatedUnion() efficiently validates discriminated unions", () => {
  const schema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("success"), data: z.string() }),
    z.object({ type: z.literal("error"), error: z.string() }),
  ]);

  assertEquals(schema.parse({ type: "success", data: "result" }), { type: "success", data: "result" });
  assertEquals(schema.parse({ type: "error", error: "failed" }), { type: "error", error: "failed" });
  assertThrows(() => schema.parse({ type: "unknown", data: "test" }));
});

// Intersection tests
test("z.intersection() combines two schemas", () => {
  const schema = z.intersection(
    z.object({ name: z.string() }),
    z.object({ age: z.number() })
  );

  const result = schema.parse({ name: "John", age: 30 });
  assertEquals(result, { name: "John", age: 30 });
});

// Refinement tests
test("refine() adds custom validation", () => {
  const schema = z.number().refine((val) => val % 2 === 0, "Must be even");
  assertEquals(schema.parse(2), 2);
  assertEquals(schema.parse(4), 4);
  assertThrows(() => schema.parse(3));
  assertThrows(() => schema.parse(5));
});

test("refine() works with objects", () => {
  const schema = z.object({
    password: z.string(),
    confirm: z.string(),
  }).refine((data) => data.password === data.confirm, "Passwords must match");

  assertEquals(schema.parse({ password: "abc", confirm: "abc" }), { password: "abc", confirm: "abc" });
  assertThrows(() => schema.parse({ password: "abc", confirm: "def" }));
});

test("refine() can validate relationships between fields", () => {
  const schema = z.object({
    start: z.number(),
    end: z.number(),
  }).refine((data) => data.end > data.start, "End must be after start");

  assertEquals(schema.parse({ start: 1, end: 10 }), { start: 1, end: 10 });
  assertThrows(() => schema.parse({ start: 10, end: 1 }));
});

// Transformation tests
test("transform() transforms validated data", () => {
  const schema = z.string().transform((val) => val.toUpperCase());
  assertEquals(schema.parse("hello"), "HELLO");
  assertEquals(schema.parse("world"), "WORLD");
});

test("transform() works with numbers", () => {
  const schema = z.number().transform((val) => val * 2);
  assertEquals(schema.parse(5), 10);
  assertEquals(schema.parse(10), 20);
});

test("transform() can change types", () => {
  const schema = z.string().transform((val) => val.split(","));
  assertEquals(schema.parse("a,b,c"), ["a", "b", "c"]);
  assertEquals(schema.parse("x,y"), ["x", "y"]);
});

test("transform() and refine() can be chained", () => {
  const schema = z.string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Must not be empty after trimming");

  assertEquals(schema.parse("  hello  "), "hello");
  assertThrows(() => schema.parse("   "));
});

// Default values
test("default() provides default values", () => {
  const schema = z.string().default("default");
  assertEquals(schema.parse(undefined), "default");
  assertEquals(schema.parse("custom"), "custom");
});

test("default() works with objects", () => {
  const schema = z.object({
    name: z.string(),
    role: z.string().default("user"),
  });

  assertEquals(schema.parse({ name: "John" }), { name: "John", role: "user" });
  assertEquals(schema.parse({ name: "John", role: "admin" }), { name: "John", role: "admin" });
});

// Catch (error handling)
test("catch() provides fallback on error", () => {
  const schema = z.number().catch(0);
  assertEquals(schema.parse(42), 42);
  assertEquals(schema.parse("invalid"), 0);
  assertEquals(schema.parse(null), 0);
});

// Safe parse
test("safeParse() returns success result", () => {
  const schema = z.string();
  const result = schema.safeParse("hello");
  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.data, "hello");
  }
});

test("safeParse() returns error result", () => {
  const schema = z.string();
  const result = schema.safeParse(123);
  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(result.error instanceof ZodError, true);
  }
});

// Error messages and formatting
test("ZodError contains detailed issues", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().min(18),
  });

  try {
    schema.parse({ name: "John", age: 15 });
    throw new Error("Should have thrown");
  } catch (error) {
    if (error instanceof ZodError) {
      assertEquals(error.issues.length > 0, true);
      assertEquals(error.issues[0].path[0], "age");
    }
  }
});

test("ZodError.format() structures errors", () => {
  const schema = z.object({
    user: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  });

  try {
    schema.parse({ user: { name: "John", email: "invalid" } });
    throw new Error("Should have thrown");
  } catch (error) {
    if (error instanceof ZodError) {
      const formatted = error.format();
      assertEquals(typeof formatted, "object");
    }
  }
});

// Complex real-world scenarios
test("complex user schema validation", () => {
  const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    age: z.number().min(18).max(120),
    role: z.enum(["admin", "user", "guest"]),
    metadata: z.object({
      createdAt: z.date(),
      tags: z.array(z.string()).optional(),
    }),
  });

  const validUser = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "user@example.com",
    age: 25,
    role: "user" as const,
    metadata: {
      createdAt: new Date(),
      tags: ["active", "verified"],
    },
  };

  const result = UserSchema.parse(validUser);
  assertEquals(result.email, "user@example.com");
  assertEquals(result.role, "user");
});

test("API response validation schema", () => {
  const ApiResponse = z.discriminatedUnion("status", [
    z.object({
      status: z.literal("success"),
      data: z.unknown(),
      timestamp: z.date(),
    }),
    z.object({
      status: z.literal("error"),
      error: z.object({
        code: z.string(),
        message: z.string(),
      }),
      timestamp: z.date(),
    }),
  ]);

  const now = new Date();
  const successResponse = ApiResponse.parse({
    status: "success",
    data: { result: "test" },
    timestamp: now,
  });

  assertEquals(successResponse.status, "success");
});

console.log("\n✅ All union/refinement/transformation tests passed!");
