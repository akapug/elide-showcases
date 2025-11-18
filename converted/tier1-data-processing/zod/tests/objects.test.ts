/**
 * Tests for Zod object, array, and tuple types
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

// Object tests
test("z.object() validates object shape", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const result = schema.parse({ name: "John", age: 30 });
  assertEquals(result, { name: "John", age: 30 });
});

test("z.object() rejects invalid object shape", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  assertThrows(() => schema.parse({ name: "John", age: "30" }));
  assertThrows(() => schema.parse({ name: 123, age: 30 }));
  assertThrows(() => schema.parse({ name: "John" })); // missing age
});

test("z.object() strips unknown keys by default", () => {
  const schema = z.object({
    name: z.string(),
  });

  const result = schema.parse({ name: "John", extra: "field" });
  assertEquals(result, { name: "John" });
});

test("z.object().strict() rejects unknown keys", () => {
  const schema = z.object({
    name: z.string(),
  }).strict();

  assertThrows(() => schema.parse({ name: "John", extra: "field" }));
});

test("z.object().passthrough() keeps unknown keys", () => {
  const schema = z.object({
    name: z.string(),
  }).passthrough();

  const result = schema.parse({ name: "John", extra: "field" });
  assertEquals(result, { name: "John", extra: "field" });
});

test("z.object().partial() makes all fields optional", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  }).partial();

  assertEquals(schema.parse({ name: "John" }), { name: "John" });
  assertEquals(schema.parse({ age: 30 }), { age: 30 });
  assertEquals(schema.parse({}), {});
});

test("z.object().pick() selects specific fields", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    email: z.string(),
  }).pick({ name: true, email: true });

  const result = schema.parse({ name: "John", email: "john@example.com" });
  assertEquals(result, { name: "John", email: "john@example.com" });
});

test("z.object().omit() removes specific fields", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    password: z.string(),
  }).omit({ password: true });

  const result = schema.parse({ name: "John", age: 30 });
  assertEquals(result, { name: "John", age: 30 });
});

test("z.object().extend() adds new fields", () => {
  const baseSchema = z.object({
    name: z.string(),
  });

  const extendedSchema = baseSchema.extend({
    age: z.number(),
  });

  const result = extendedSchema.parse({ name: "John", age: 30 });
  assertEquals(result, { name: "John", age: 30 });
});

test("z.object().merge() merges two object schemas", () => {
  const schema1 = z.object({
    name: z.string(),
  });

  const schema2 = z.object({
    age: z.number(),
  });

  const merged = schema1.merge(schema2);
  const result = merged.parse({ name: "John", age: 30 });
  assertEquals(result, { name: "John", age: 30 });
});

// Array tests
test("z.array() validates array of elements", () => {
  const schema = z.array(z.number());
  assertEquals(schema.parse([1, 2, 3]), [1, 2, 3]);
  assertEquals(schema.parse([]), []);
});

test("z.array() rejects invalid array elements", () => {
  const schema = z.array(z.number());
  assertThrows(() => schema.parse([1, "2", 3]));
  assertThrows(() => schema.parse([1, 2, true]));
});

test("z.array().min() validates minimum length", () => {
  const schema = z.array(z.number()).min(2);
  assertEquals(schema.parse([1, 2]), [1, 2]);
  assertEquals(schema.parse([1, 2, 3]), [1, 2, 3]);
  assertThrows(() => schema.parse([1]));
  assertThrows(() => schema.parse([]));
});

test("z.array().max() validates maximum length", () => {
  const schema = z.array(z.number()).max(3);
  assertEquals(schema.parse([1, 2, 3]), [1, 2, 3]);
  assertEquals(schema.parse([1]), [1]);
  assertThrows(() => schema.parse([1, 2, 3, 4]));
});

test("z.array().length() validates exact length", () => {
  const schema = z.array(z.number()).length(3);
  assertEquals(schema.parse([1, 2, 3]), [1, 2, 3]);
  assertThrows(() => schema.parse([1, 2]));
  assertThrows(() => schema.parse([1, 2, 3, 4]));
});

test("z.array().nonempty() requires at least one element", () => {
  const schema = z.array(z.string()).nonempty();
  assertEquals(schema.parse(["hello"]), ["hello"]);
  assertThrows(() => schema.parse([]));
});

// Tuple tests
test("z.tuple() validates fixed-length arrays", () => {
  const schema = z.tuple([z.string(), z.number(), z.boolean()]);
  assertEquals(schema.parse(["hello", 42, true]), ["hello", 42, true]);
});

test("z.tuple() rejects incorrect types", () => {
  const schema = z.tuple([z.string(), z.number()]);
  assertThrows(() => schema.parse([42, "hello"])); // wrong order
  assertThrows(() => schema.parse(["hello", "world"])); // wrong type
});

test("z.tuple() rejects incorrect length", () => {
  const schema = z.tuple([z.string(), z.number()]);
  assertThrows(() => schema.parse(["hello"])); // too short
  assertThrows(() => schema.parse(["hello", 42, true])); // too long
});

// Nested structures
test("nested objects and arrays work correctly", () => {
  const schema = z.object({
    name: z.string(),
    tags: z.array(z.string()),
    metadata: z.object({
      created: z.date(),
      updated: z.date(),
    }),
  });

  const now = new Date();
  const result = schema.parse({
    name: "Item",
    tags: ["tag1", "tag2"],
    metadata: {
      created: now,
      updated: now,
    },
  });

  assertEquals(result.name, "Item");
  assertEquals(result.tags, ["tag1", "tag2"]);
});

test("deeply nested structures validate correctly", () => {
  const schema = z.object({
    level1: z.object({
      level2: z.object({
        level3: z.array(z.number()),
      }),
    }),
  });

  const result = schema.parse({
    level1: {
      level2: {
        level3: [1, 2, 3],
      },
    },
  });

  assertEquals(result.level1.level2.level3, [1, 2, 3]);
});

console.log("\n✅ All object/array/tuple tests passed!");
