/**
 * Tests for Zod primitive types
 */

import { z, ZodError } from "../src/zod.ts";

// Test utilities
function test(name: string, fn: () => void | Promise<void>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(
        () => console.log(`✓ ${name}`),
        (err) => console.error(`✗ ${name}:`, err)
      );
    } else {
      console.log(`✓ ${name}`);
    }
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

function assertThrows(fn: () => any, errorType: any = ZodError): void {
  try {
    fn();
    throw new Error("Expected function to throw");
  } catch (error) {
    if (!(error instanceof errorType)) {
      throw new Error(`Expected ${errorType.name}, got ${error}`);
    }
  }
}

// String tests
test("z.string() accepts valid strings", () => {
  const schema = z.string();
  assertEquals(schema.parse("hello"), "hello");
  assertEquals(schema.parse(""), "");
  assertEquals(schema.parse("123"), "123");
});

test("z.string() rejects non-strings", () => {
  const schema = z.string();
  assertThrows(() => schema.parse(123));
  assertThrows(() => schema.parse(true));
  assertThrows(() => schema.parse(null));
  assertThrows(() => schema.parse(undefined));
});

test("z.string().min() validates minimum length", () => {
  const schema = z.string().min(5);
  assertEquals(schema.parse("hello"), "hello");
  assertEquals(schema.parse("hello world"), "hello world");
  assertThrows(() => schema.parse("hi"));
});

test("z.string().max() validates maximum length", () => {
  const schema = z.string().max(5);
  assertEquals(schema.parse("hello"), "hello");
  assertEquals(schema.parse("hi"), "hi");
  assertThrows(() => schema.parse("hello world"));
});

test("z.string().email() validates email format", () => {
  const schema = z.string().email();
  assertEquals(schema.parse("test@example.com"), "test@example.com");
  assertEquals(schema.parse("user+tag@domain.co.uk"), "user+tag@domain.co.uk");
  assertThrows(() => schema.parse("invalid"));
  assertThrows(() => schema.parse("@example.com"));
  assertThrows(() => schema.parse("test@"));
});

test("z.string().url() validates URL format", () => {
  const schema = z.string().url();
  assertEquals(schema.parse("https://example.com"), "https://example.com");
  assertEquals(schema.parse("http://localhost:3000"), "http://localhost:3000");
  assertThrows(() => schema.parse("invalid"));
  assertThrows(() => schema.parse("example.com"));
});

test("z.string().uuid() validates UUID format", () => {
  const schema = z.string().uuid();
  assertEquals(schema.parse("123e4567-e89b-12d3-a456-426614174000"), "123e4567-e89b-12d3-a456-426614174000");
  assertThrows(() => schema.parse("invalid"));
  assertThrows(() => schema.parse("123456"));
});

// Number tests
test("z.number() accepts valid numbers", () => {
  const schema = z.number();
  assertEquals(schema.parse(123), 123);
  assertEquals(schema.parse(0), 0);
  assertEquals(schema.parse(-456), -456);
  assertEquals(schema.parse(3.14), 3.14);
});

test("z.number() rejects non-numbers", () => {
  const schema = z.number();
  assertThrows(() => schema.parse("123"));
  assertThrows(() => schema.parse(true));
  assertThrows(() => schema.parse(null));
  assertThrows(() => schema.parse(undefined));
});

test("z.number().min() validates minimum value", () => {
  const schema = z.number().min(10);
  assertEquals(schema.parse(10), 10);
  assertEquals(schema.parse(100), 100);
  assertThrows(() => schema.parse(9));
  assertThrows(() => schema.parse(0));
});

test("z.number().max() validates maximum value", () => {
  const schema = z.number().max(100);
  assertEquals(schema.parse(100), 100);
  assertEquals(schema.parse(50), 50);
  assertThrows(() => schema.parse(101));
});

test("z.number().int() validates integers", () => {
  const schema = z.number().int();
  assertEquals(schema.parse(123), 123);
  assertEquals(schema.parse(0), 0);
  assertThrows(() => schema.parse(3.14));
  assertThrows(() => schema.parse(1.5));
});

test("z.number().positive() validates positive numbers", () => {
  const schema = z.number().positive();
  assertEquals(schema.parse(1), 1);
  assertEquals(schema.parse(100), 100);
  assertThrows(() => schema.parse(0));
  assertThrows(() => schema.parse(-1));
});

// Boolean tests
test("z.boolean() accepts valid booleans", () => {
  const schema = z.boolean();
  assertEquals(schema.parse(true), true);
  assertEquals(schema.parse(false), false);
});

test("z.boolean() rejects non-booleans", () => {
  const schema = z.boolean();
  assertThrows(() => schema.parse("true"));
  assertThrows(() => schema.parse(1));
  assertThrows(() => schema.parse(0));
  assertThrows(() => schema.parse(null));
});

// Date tests
test("z.date() accepts valid dates", () => {
  const schema = z.date();
  const now = new Date();
  assertEquals(schema.parse(now), now);
});

test("z.date() rejects non-dates", () => {
  const schema = z.date();
  assertThrows(() => schema.parse("2023-01-01"));
  assertThrows(() => schema.parse(123456));
  assertThrows(() => schema.parse(null));
});

test("z.date() rejects invalid dates", () => {
  const schema = z.date();
  assertThrows(() => schema.parse(new Date("invalid")));
});

// Literal tests
test("z.literal() validates exact values", () => {
  const schema = z.literal("hello");
  assertEquals(schema.parse("hello"), "hello");
  assertThrows(() => schema.parse("world"));
  assertThrows(() => schema.parse(""));
});

test("z.literal() works with numbers", () => {
  const schema = z.literal(42);
  assertEquals(schema.parse(42), 42);
  assertThrows(() => schema.parse(41));
  assertThrows(() => schema.parse(43));
});

// Enum tests
test("z.enum() validates enum values", () => {
  const schema = z.enum(["red", "green", "blue"]);
  assertEquals(schema.parse("red"), "red");
  assertEquals(schema.parse("green"), "green");
  assertEquals(schema.parse("blue"), "blue");
  assertThrows(() => schema.parse("yellow"));
  assertThrows(() => schema.parse(""));
});

// Optional and nullable tests
test("z.string().optional() allows undefined", () => {
  const schema = z.string().optional();
  assertEquals(schema.parse("hello"), "hello");
  assertEquals(schema.parse(undefined), undefined);
  assertThrows(() => schema.parse(null));
  assertThrows(() => schema.parse(123));
});

test("z.string().nullable() allows null", () => {
  const schema = z.string().nullable();
  assertEquals(schema.parse("hello"), "hello");
  assertEquals(schema.parse(null), null);
  assertThrows(() => schema.parse(undefined));
  assertThrows(() => schema.parse(123));
});

test("z.string().nullish() allows null and undefined", () => {
  const schema = z.string().nullish();
  assertEquals(schema.parse("hello"), "hello");
  assertEquals(schema.parse(null), null);
  assertEquals(schema.parse(undefined), undefined);
  assertThrows(() => schema.parse(123));
});

console.log("\n✅ All primitive tests passed!");
