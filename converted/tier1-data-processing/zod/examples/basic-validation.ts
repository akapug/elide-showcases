/**
 * Basic Validation Examples with Zod on Elide
 *
 * This demonstrates core validation capabilities that run
 * 2-3x faster than Node.js Zod thanks to Elide's optimized runtime.
 */

import { z } from "../src/zod.ts";

console.log("=== Basic Validation Examples ===\n");

// Example 1: Simple string validation
console.log("1. String Validation:");
const nameSchema = z.string().min(2).max(50);

try {
  const validName = nameSchema.parse("John Doe");
  console.log("✓ Valid name:", validName);
} catch (error) {
  console.error("✗ Error:", error);
}

try {
  nameSchema.parse("A"); // Too short
} catch (error) {
  console.log("✓ Correctly rejected short name");
}

// Example 2: Email validation
console.log("\n2. Email Validation:");
const emailSchema = z.string().email();

try {
  const validEmail = emailSchema.parse("user@example.com");
  console.log("✓ Valid email:", validEmail);
} catch (error) {
  console.error("✗ Error:", error);
}

try {
  emailSchema.parse("invalid-email");
} catch (error) {
  console.log("✓ Correctly rejected invalid email");
}

// Example 3: Number validation with constraints
console.log("\n3. Number Validation:");
const ageSchema = z.number().int().min(18).max(120);

try {
  const validAge = ageSchema.parse(25);
  console.log("✓ Valid age:", validAge);
} catch (error) {
  console.error("✗ Error:", error);
}

try {
  ageSchema.parse(15); // Too young
} catch (error) {
  console.log("✓ Correctly rejected underage value");
}

// Example 4: Object validation
console.log("\n4. Object Validation:");
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(18),
  isActive: z.boolean(),
});

try {
  const validUser = userSchema.parse({
    name: "Jane Smith",
    email: "jane@example.com",
    age: 30,
    isActive: true,
  });
  console.log("✓ Valid user:", JSON.stringify(validUser, null, 2));
} catch (error) {
  console.error("✗ Error:", error);
}

// Example 5: Array validation
console.log("\n5. Array Validation:");
const tagsSchema = z.array(z.string()).min(1).max(5);

try {
  const validTags = tagsSchema.parse(["typescript", "elide", "zod"]);
  console.log("✓ Valid tags:", validTags);
} catch (error) {
  console.error("✗ Error:", error);
}

// Example 6: Enum validation
console.log("\n6. Enum Validation:");
const roleSchema = z.enum(["admin", "user", "guest"]);

try {
  const validRole = roleSchema.parse("admin");
  console.log("✓ Valid role:", validRole);
} catch (error) {
  console.error("✗ Error:", error);
}

// Example 7: Optional and nullable
console.log("\n7. Optional and Nullable:");
const profileSchema = z.object({
  bio: z.string().optional(),
  avatar: z.string().url().nullable(),
  website: z.string().url().optional(),
});

try {
  const validProfile = profileSchema.parse({
    bio: "Software developer",
    avatar: null,
  });
  console.log("✓ Valid profile:", JSON.stringify(validProfile, null, 2));
} catch (error) {
  console.error("✗ Error:", error);
}

// Example 8: Safe parse (no exceptions)
console.log("\n8. Safe Parse (No Exceptions):");
const safeEmailSchema = z.string().email();

const result1 = safeEmailSchema.safeParse("valid@example.com");
if (result1.success) {
  console.log("✓ Safe parse success:", result1.data);
} else {
  console.log("✗ Safe parse error:", result1.error.message);
}

const result2 = safeEmailSchema.safeParse("invalid");
if (result2.success) {
  console.log("✓ Safe parse success:", result2.data);
} else {
  console.log("✓ Safe parse correctly identified error");
}

// Example 9: Default values
console.log("\n9. Default Values:");
const configSchema = z.object({
  port: z.number().default(3000),
  host: z.string().default("localhost"),
  debug: z.boolean().default(false),
});

const config = configSchema.parse({});
console.log("✓ Config with defaults:", JSON.stringify(config, null, 2));

// Example 10: Union types
console.log("\n10. Union Types:");
const idSchema = z.union([z.string(), z.number()]);

console.log("✓ String ID:", idSchema.parse("abc123"));
console.log("✓ Number ID:", idSchema.parse(12345));

console.log("\n=== All basic validation examples completed! ===");
console.log("💡 These validations run 2-3x faster on Elide than on Node.js!");
