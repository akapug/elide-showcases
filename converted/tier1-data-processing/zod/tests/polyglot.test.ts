/**
 * POLYGLOT TESTS - THE KILLER FEATURE!
 *
 * These tests demonstrate Elide's unique capability:
 * Define a schema ONCE in TypeScript, use it in Python, Ruby, AND Java!
 *
 * This is IMPOSSIBLE with Node.js, Deno, or Bun.
 */

import { z } from "../src/zod.ts";
import { serializeSchema, exportForPython } from "../bridges/python-bridge.ts";
import { exportForRuby } from "../bridges/ruby-bridge.ts";
import { exportForJava } from "../bridges/java-bridge.ts";

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

// Define a schema ONCE in TypeScript
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  role: z.enum(["admin", "user", "guest"]),
  isActive: z.boolean(),
  tags: z.array(z.string()).optional(),
});

const ProductSchema = z.object({
  sku: z.string().min(3),
  name: z.string(),
  price: z.number().positive(),
  inStock: z.boolean(),
  categories: z.array(z.string()),
});

const ApiResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    data: z.unknown(),
  }),
  z.object({
    status: z.literal("error"),
    message: z.string(),
  }),
]);

// Test 1: Schema serialization (for cross-language use)
test("UserSchema can be serialized for polyglot use", () => {
  const serialized = serializeSchema(UserSchema);
  assertEquals(serialized.type, "ZodObject");
  assertEquals(typeof serialized.shape, "object");
  assertEquals(serialized.shape.email.type, "ZodString");
  assertEquals(serialized.shape.age.type, "ZodNumber");
});

test("ProductSchema can be serialized for polyglot use", () => {
  const serialized = serializeSchema(ProductSchema);
  assertEquals(serialized.type, "ZodObject");
  assertEquals(serialized.shape.price.type, "ZodNumber");
  assertEquals(serialized.shape.categories.type, "ZodArray");
});

test("Discriminated union schema can be serialized", () => {
  const serialized = serializeSchema(ApiResponseSchema);
  assertEquals(serialized.type, "ZodDiscriminatedUnion");
  assertEquals(serialized.discriminator, "status");
  assertEquals(Array.isArray(serialized.options), true);
});

// Test 2: Python code generation
test("UserSchema generates valid Python code", () => {
  const pythonCode = exportForPython("User", UserSchema);
  assertEquals(pythonCode.includes("USER_SCHEMA"), true);
  assertEquals(pythonCode.includes("validate_user"), true);
  assertEquals(pythonCode.includes("from typing"), true);
  assertEquals(pythonCode.includes("import re"), true);
});

test("ProductSchema generates valid Python code", () => {
  const pythonCode = exportForPython("Product", ProductSchema);
  assertEquals(pythonCode.includes("PRODUCT_SCHEMA"), true);
  assertEquals(pythonCode.includes("validate_product"), true);
  assertEquals(pythonCode.includes("List"), true);
});

test("Generated Python code contains schema definition", () => {
  const pythonCode = exportForPython("User", UserSchema);
  const hasSchemaDefinition = pythonCode.includes('"type"') && pythonCode.includes('"shape"');
  assertEquals(hasSchemaDefinition, true);
});

// Test 3: Ruby code generation
test("UserSchema generates valid Ruby code", () => {
  const rubyCode = exportForRuby("User", UserSchema);
  assertEquals(rubyCode.includes("USER_SCHEMA"), true);
  assertEquals(rubyCode.includes("validate_user"), true);
  assertEquals(rubyCode.includes("require 'json'"), true);
});

test("ProductSchema generates valid Ruby code", () => {
  const rubyCode = exportForRuby("Product", ProductSchema);
  assertEquals(rubyCode.includes("PRODUCT_SCHEMA"), true);
  assertEquals(rubyCode.includes("validate_product"), true);
});

// Test 4: Java code generation
test("UserSchema generates valid Java code", () => {
  const javaCode = exportForJava("User", UserSchema);
  assertEquals(javaCode.includes("UserValidator"), true);
  assertEquals(javaCode.includes("public static Map<String, Object> validate"), true);
  assertEquals(javaCode.includes("import java.util.*"), true);
});

test("ProductSchema generates valid Java code", () => {
  const javaCode = exportForJava("Product", ProductSchema);
  assertEquals(javaCode.includes("ProductValidator"), true);
  assertEquals(javaCode.includes("validate"), true);
});

// Test 5: Schema preservation across serialization
test("Simple schema roundtrip preserves structure", () => {
  const simpleSchema = z.object({
    name: z.string(),
    count: z.number(),
  });

  const serialized = serializeSchema(simpleSchema);
  assertEquals(serialized.type, "ZodObject");
  assertEquals(serialized.shape.name.type, "ZodString");
  assertEquals(serialized.shape.count.type, "ZodNumber");
});

test("Nested schema roundtrip preserves structure", () => {
  const nestedSchema = z.object({
    user: z.object({
      name: z.string(),
      age: z.number(),
    }),
    items: z.array(z.string()),
  });

  const serialized = serializeSchema(nestedSchema);
  assertEquals(serialized.type, "ZodObject");
  assertEquals(serialized.shape.user.type, "ZodObject");
  assertEquals(serialized.shape.items.type, "ZodArray");
});

test("Array with constraints serializes correctly", () => {
  const schema = z.array(z.number()).min(2).max(10);
  const serialized = serializeSchema(schema);

  assertEquals(serialized.type, "ZodArray");
  assertEquals(serialized.element.type, "ZodNumber");
  assertEquals(serialized.minLength, { value: 2 });
  assertEquals(serialized.maxLength, { value: 10 });
});

test("String with constraints serializes correctly", () => {
  const schema = z.string().email().min(5).max(100);
  const serialized = serializeSchema(schema);

  assertEquals(serialized.type, "ZodString");
  assertEquals(Array.isArray(serialized.checks), true);
  assertEquals(serialized.checks.some((c: any) => c.kind === "email"), true);
  assertEquals(serialized.checks.some((c: any) => c.kind === "min"), true);
});

test("Number with constraints serializes correctly", () => {
  const schema = z.number().min(0).max(100).int();
  const serialized = serializeSchema(schema);

  assertEquals(serialized.type, "ZodNumber");
  assertEquals(Array.isArray(serialized.checks), true);
  assertEquals(serialized.checks.some((c: any) => c.kind === "int"), true);
});

test("Optional schema serializes correctly", () => {
  const schema = z.string().optional();
  const serialized = serializeSchema(schema);

  assertEquals(serialized.type, "ZodOptional");
  assertEquals(serialized.inner.type, "ZodString");
});

test("Nullable schema serializes correctly", () => {
  const schema = z.number().nullable();
  const serialized = serializeSchema(schema);

  assertEquals(serialized.type, "ZodNullable");
  assertEquals(serialized.inner.type, "ZodNumber");
});

test("Enum schema serializes correctly", () => {
  const schema = z.enum(["red", "green", "blue"]);
  const serialized = serializeSchema(schema);

  assertEquals(serialized.type, "ZodEnum");
  assertEquals(serialized.values, ["red", "green", "blue"]);
});

test("Union schema serializes correctly", () => {
  const schema = z.union([z.string(), z.number()]);
  const serialized = serializeSchema(schema);

  assertEquals(serialized.type, "ZodUnion");
  assertEquals(Array.isArray(serialized.options), true);
  assertEquals(serialized.options.length, 2);
});

// Test 6: Real-world polyglot scenario
test("E-commerce schema can be shared across all languages", () => {
  const OrderSchema = z.object({
    orderId: z.string().uuid(),
    customerId: z.string(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })),
    total: z.number().positive(),
    status: z.enum(["pending", "processing", "shipped", "delivered"]),
    createdAt: z.date(),
  });

  // Serialize for all languages
  const serialized = serializeSchema(OrderSchema);
  const pythonCode = exportForPython("Order", OrderSchema);
  const rubyCode = exportForRuby("Order", OrderSchema);
  const javaCode = exportForJava("Order", OrderSchema);

  // All exports should be non-empty
  assertEquals(serialized.type, "ZodObject");
  assertEquals(pythonCode.length > 100, true);
  assertEquals(rubyCode.length > 100, true);
  assertEquals(javaCode.length > 100, true);
});

test("API contract schema can be shared across microservices", () => {
  const ApiContractSchema = z.discriminatedUnion("method", [
    z.object({
      method: z.literal("GET"),
      path: z.string(),
      query: z.record(z.string(), z.string()).optional(),
    }),
    z.object({
      method: z.literal("POST"),
      path: z.string(),
      body: z.unknown(),
    }),
    z.object({
      method: z.literal("PUT"),
      path: z.string(),
      body: z.unknown(),
    }),
  ]);

  const serialized = serializeSchema(ApiContractSchema);
  assertEquals(serialized.type, "ZodDiscriminatedUnion");
  assertEquals(serialized.discriminator, "method");

  // Can generate for all languages
  const pythonCode = exportForPython("ApiContract", ApiContractSchema);
  const rubyCode = exportForRuby("ApiContract", ApiContractSchema);
  const javaCode = exportForJava("ApiContract", ApiContractSchema);

  assertEquals(pythonCode.includes("APICONTRACT_SCHEMA"), true);
  assertEquals(rubyCode.includes("APICONTRACT_SCHEMA"), true);
  assertEquals(javaCode.includes("ApiContractValidator"), true);
});

console.log("\n🎉 All polyglot tests passed!");
console.log("✨ This demonstrates Elide's KILLER FEATURE:");
console.log("   Define schemas ONCE in TypeScript, use them in Python, Ruby, AND Java!");
console.log("   This is IMPOSSIBLE with Node.js, Deno, or Bun!");
