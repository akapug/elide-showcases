/**
 * Basic Validation Examples
 * Getting started with Yup on Elide
 */

import * as yup from '../src/yup';

// Simple string validation
async function validateEmail() {
  const schema = yup.string().email().required();

  try {
    const valid = await schema.validate('user@example.com');
    console.log('✓ Valid email:', valid);
  } catch (err: any) {
    console.error('✗ Invalid:', err.message);
  }
}

// Number validation
async function validateAge() {
  const schema = yup.number().positive().integer().min(18).max(120);

  const tests = [25, 17, 150, -5];

  for (const age of tests) {
    try {
      await schema.validate(age);
      console.log(`✓ Age ${age} is valid`);
    } catch (err: any) {
      console.log(`✗ Age ${age} is invalid: ${err.message}`);
    }
  }
}

// Object validation
async function validateUser() {
  const userSchema = yup.object({
    name: yup.string().required(),
    email: yup.string().email().required(),
    age: yup.number().positive().integer(),
    website: yup.string().url().optional(),
  });

  const validUser = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    website: 'https://johndoe.com',
  };

  const invalidUser = {
    name: 'Jane',
    email: 'not-an-email',
    age: -5,
  };

  try {
    const result = await userSchema.validate(validUser);
    console.log('✓ Valid user:', result);
  } catch (err: any) {
    console.error('✗ Invalid user:', err.message);
  }

  try {
    await userSchema.validate(invalidUser);
  } catch (err: any) {
    console.log('✗ Expected validation error:', err.message);
  }
}

// Array validation
async function validateTags() {
  const tagSchema = yup.array(yup.string().min(2).max(20)).min(1).max(5);

  const validTags = ['javascript', 'typescript', 'validation'];
  const invalidTags = ['a', 'valid', 'too-many', 'tags', 'here', 'six'];

  try {
    await tagSchema.validate(validTags);
    console.log('✓ Valid tags:', validTags);
  } catch (err: any) {
    console.error('✗ Invalid tags:', err.message);
  }

  try {
    await tagSchema.validate(invalidTags);
  } catch (err: any) {
    console.log('✗ Expected validation error:', err.message);
  }
}

// Synchronous validation
function syncValidation() {
  const schema = yup.string().min(5).max(20);

  console.log('Sync validation:');
  console.log('isValid("hello"):', schema.isValidSync('hello')); // true
  console.log('isValid("hi"):', schema.isValidSync('hi')); // false
  console.log('isValid("very-long-string-here"):', schema.isValidSync('very-long-string-here')); // false
}

// Type coercion
function typeCoercion() {
  const numberSchema = yup.number();
  const booleanSchema = yup.boolean();
  const stringSchema = yup.string();

  console.log('\nType coercion:');
  console.log('Cast "42" to number:', numberSchema.cast('42')); // 42
  console.log('Cast "true" to boolean:', booleanSchema.cast('true')); // true
  console.log('Cast 123 to string:', stringSchema.cast(123)); // "123"
}

// Default values
function defaultValues() {
  const schema = yup.object({
    name: yup.string().default('Anonymous'),
    role: yup.string().default('user'),
    active: yup.boolean().default(true),
  });

  console.log('\nDefault values:');
  console.log('Empty object:', schema.cast({}));
  // { name: 'Anonymous', role: 'user', active: true }

  console.log('Partial object:', schema.cast({ name: 'John' }));
  // { name: 'John', role: 'user', active: true }
}

// Nullable and optional
async function nullableOptional() {
  const requiredSchema = yup.string().required();
  const nullableSchema = yup.string().nullable();
  const optionalSchema = yup.string().optional();

  console.log('\nNullable and optional:');

  try {
    await requiredSchema.validate(null);
  } catch (err: any) {
    console.log('✗ Required schema rejects null');
  }

  try {
    await nullableSchema.validate(null);
    console.log('✓ Nullable schema accepts null');
  } catch (err: any) {
    console.error('✗ Error:', err.message);
  }

  try {
    await optionalSchema.validate(undefined);
    console.log('✓ Optional schema accepts undefined');
  } catch (err: any) {
    console.error('✗ Error:', err.message);
  }
}

// Transformations
function transformations() {
  const schema = yup
    .string()
    .trim()
    .lowercase()
    .transform((value) => value.replace(/\s+/g, '-'));

  console.log('\nTransformations:');
  console.log('Transform "  Hello World  ":', schema.cast('  Hello World  '));
  // "hello-world"
}

// Run all examples
async function main() {
  console.log('=== Basic Validation Examples ===\n');

  await validateEmail();
  console.log();

  await validateAge();
  console.log();

  await validateUser();
  console.log();

  await validateTags();
  console.log();

  syncValidation();
  typeCoercion();
  defaultValues();
  await nullableOptional();
  transformations();

  console.log('\n=== Examples Complete ===');
}

main().catch(console.error);
