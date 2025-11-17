# Zod API Reference

Complete API reference for Zod on Elide.

## Table of Contents

- [Primitives](#primitives)
- [Objects](#objects)
- [Arrays & Tuples](#arrays--tuples)
- [Unions & Intersections](#unions--intersections)
- [Modifiers](#modifiers)
- [Custom Validation](#custom-validation)
- [Parsing Methods](#parsing-methods)
- [Error Handling](#error-handling)
- [Type Inference](#type-inference)
- [Polyglot Exports](#polyglot-exports)

## Primitives

### String

```typescript
z.string()
```

Methods:
- `.min(n: number, message?: string)` - Minimum length
- `.max(n: number, message?: string)` - Maximum length
- `.length(n: number, message?: string)` - Exact length
- `.email(message?: string)` - Email validation
- `.url(message?: string)` - URL validation
- `.uuid(message?: string)` - UUID validation
- `.regex(pattern: RegExp, message?: string)` - Custom pattern

Example:
```typescript
const schema = z.string()
  .min(3, "Too short")
  .max(50, "Too long")
  .email("Invalid email");
```

### Number

```typescript
z.number()
```

Methods:
- `.min(n: number, message?: string)` - Minimum value (inclusive)
- `.max(n: number, message?: string)` - Maximum value (inclusive)
- `.gt(n: number, message?: string)` - Greater than
- `.gte(n: number, message?: string)` - Greater than or equal
- `.lt(n: number, message?: string)` - Less than
- `.lte(n: number, message?: string)` - Less than or equal
- `.int(message?: string)` - Integer validation
- `.positive(message?: string)` - Positive number
- `.nonnegative(message?: string)` - Non-negative number
- `.negative(message?: string)` - Negative number
- `.nonpositive(message?: string)` - Non-positive number
- `.multipleOf(n: number, message?: string)` - Divisible by n
- `.finite(message?: string)` - Finite number

Example:
```typescript
const schema = z.number()
  .int()
  .min(0)
  .max(100)
  .multipleOf(5);
```

### Boolean

```typescript
z.boolean()
```

Example:
```typescript
const schema = z.boolean();
schema.parse(true); // ✓
```

### Date

```typescript
z.date()
```

Methods:
- `.min(date: Date, message?: string)` - Minimum date
- `.max(date: Date, message?: string)` - Maximum date

Example:
```typescript
const schema = z.date()
  .min(new Date("2020-01-01"))
  .max(new Date("2030-12-31"));
```

### Literal

```typescript
z.literal(value)
```

Example:
```typescript
const schema = z.literal("admin");
schema.parse("admin"); // ✓
schema.parse("user");  // ✗
```

### Enum

```typescript
z.enum([value1, value2, ...])
```

Example:
```typescript
const schema = z.enum(["red", "green", "blue"]);
schema.parse("red"); // ✓

// Access enum values
schema.options; // ["red", "green", "blue"]
schema.enum; // { red: "red", green: "green", blue: "blue" }
```

### Native Enum

```typescript
z.nativeEnum(enumObject)
```

Example:
```typescript
enum Colors {
  Red = "red",
  Green = "green",
  Blue = "blue",
}

const schema = z.nativeEnum(Colors);
schema.parse(Colors.Red); // ✓
```

### Other Primitives

```typescript
z.null()        // null
z.undefined()   // undefined
z.void()        // void (undefined)
z.any()         // any type
z.unknown()     // unknown type
z.never()       // never type
```

## Objects

### Basic Object

```typescript
z.object(shape)
```

Example:
```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

type User = z.infer<typeof schema>;
```

### Object Methods

#### `.shape`

Access the object's shape:
```typescript
const schema = z.object({ name: z.string() });
schema.shape.name; // ZodString
```

#### `.partial()`

Make all fields optional:
```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
}).partial();

// Equivalent to:
// { name?: string; age?: number }
```

#### `.required()`

Make all fields required:
```typescript
const schema = z.object({
  name: z.string().optional(),
  age: z.number().optional(),
}).required();
```

#### `.pick()`

Select specific fields:
```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string(),
}).pick({ name: true, email: true });

// Only includes name and email
```

#### `.omit()`

Remove specific fields:
```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
  password: z.string(),
}).omit({ password: true });

// Excludes password
```

#### `.extend()`

Add new fields:
```typescript
const baseSchema = z.object({
  name: z.string(),
});

const extendedSchema = baseSchema.extend({
  age: z.number(),
});
```

#### `.merge()`

Merge two object schemas:
```typescript
const schema1 = z.object({ name: z.string() });
const schema2 = z.object({ age: z.number() });
const merged = schema1.merge(schema2);
```

#### `.passthrough()`

Allow unknown keys:
```typescript
const schema = z.object({
  name: z.string(),
}).passthrough();

schema.parse({ name: "John", extra: "allowed" }); // ✓
```

#### `.strict()`

Reject unknown keys:
```typescript
const schema = z.object({
  name: z.string(),
}).strict();

schema.parse({ name: "John", extra: "not allowed" }); // ✗
```

#### `.strip()`

Strip unknown keys (default):
```typescript
const schema = z.object({
  name: z.string(),
}).strip();

schema.parse({ name: "John", extra: "removed" });
// Result: { name: "John" }
```

#### `.keyof()`

Get keys as enum:
```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
});

const keySchema = schema.keyof();
// z.enum(["name", "age"])
```

## Arrays & Tuples

### Array

```typescript
z.array(elementSchema)
```

Methods:
- `.min(n: number, message?: string)` - Minimum length
- `.max(n: number, message?: string)` - Maximum length
- `.length(n: number, message?: string)` - Exact length
- `.nonempty(message?: string)` - Require at least one element

Example:
```typescript
const schema = z.array(z.string())
  .min(1)
  .max(10);

const stringArray = schema.parse(["a", "b", "c"]);
```

### Tuple

```typescript
z.tuple([schema1, schema2, ...])
```

Example:
```typescript
const schema = z.tuple([
  z.string(),
  z.number(),
  z.boolean(),
]);

schema.parse(["hello", 42, true]); // ✓
```

With rest elements:
```typescript
const schema = z.tuple([z.string(), z.number()])
  .rest(z.boolean());

schema.parse(["hello", 42, true, false, true]); // ✓
```

### Record

```typescript
z.record(keySchema, valueSchema)
```

Example:
```typescript
const schema = z.record(
  z.string(),
  z.number()
);

schema.parse({
  "key1": 123,
  "key2": 456,
}); // ✓
```

## Unions & Intersections

### Union

```typescript
z.union([schema1, schema2, ...])
```

Example:
```typescript
const schema = z.union([
  z.string(),
  z.number(),
]);

schema.parse("hello"); // ✓
schema.parse(42); // ✓
```

### Discriminated Union

```typescript
z.discriminatedUnion(discriminatorKey, [schema1, schema2, ...])
```

Example:
```typescript
const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("success"), data: z.string() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

schema.parse({ type: "success", data: "result" }); // ✓
```

### Intersection

```typescript
z.intersection(schema1, schema2)
```

Example:
```typescript
const schema = z.intersection(
  z.object({ name: z.string() }),
  z.object({ age: z.number() })
);

schema.parse({ name: "John", age: 30 }); // ✓
```

## Modifiers

### Optional

```typescript
schema.optional()
```

Example:
```typescript
const schema = z.string().optional();
schema.parse("hello"); // ✓
schema.parse(undefined); // ✓
```

### Nullable

```typescript
schema.nullable()
```

Example:
```typescript
const schema = z.string().nullable();
schema.parse("hello"); // ✓
schema.parse(null); // ✓
```

### Nullish

```typescript
schema.nullish()
```

Example:
```typescript
const schema = z.string().nullish();
schema.parse("hello"); // ✓
schema.parse(null); // ✓
schema.parse(undefined); // ✓
```

### Default

```typescript
schema.default(value)
```

Example:
```typescript
const schema = z.number().default(0);
schema.parse(42); // 42
schema.parse(undefined); // 0
```

### Catch

```typescript
schema.catch(value)
```

Example:
```typescript
const schema = z.number().catch(0);
schema.parse(42); // 42
schema.parse("invalid"); // 0 (fallback on error)
```

## Custom Validation

### Refine

```typescript
schema.refine(checkFn, message)
```

Example:
```typescript
const schema = z.number().refine(
  (val) => val % 2 === 0,
  "Must be even"
);

schema.parse(4); // ✓
schema.parse(3); // ✗
```

With object validation:
```typescript
const schema = z.object({
  password: z.string(),
  confirm: z.string(),
}).refine(
  (data) => data.password === data.confirm,
  { message: "Passwords must match" }
);
```

### Transform

```typescript
schema.transform(transformFn)
```

Example:
```typescript
const schema = z.string().transform((val) => val.toUpperCase());
schema.parse("hello"); // "HELLO"
```

### Preprocess

```typescript
z.preprocess(preprocessFn, schema)
```

Example:
```typescript
const schema = z.preprocess(
  (val) => String(val),
  z.string()
);

schema.parse(123); // "123"
```

### Coerce

```typescript
z.coerce.string()
z.coerce.number()
z.coerce.boolean()
z.coerce.date()
```

Example:
```typescript
const schema = z.coerce.number();
schema.parse("123"); // 123 (number)
```

## Parsing Methods

### parse()

Parse and validate, throwing on error:
```typescript
const schema = z.string();
const result = schema.parse("hello"); // "hello"
schema.parse(123); // throws ZodError
```

### safeParse()

Parse and validate, returning result object:
```typescript
const schema = z.string();

const result1 = schema.safeParse("hello");
if (result1.success) {
  console.log(result1.data); // "hello"
}

const result2 = schema.safeParse(123);
if (!result2.success) {
  console.log(result2.error); // ZodError
}
```

### parseAsync()

Async parsing (for async refinements):
```typescript
const schema = z.string();
const result = await schema.parseAsync("hello");
```

## Error Handling

### ZodError

Structure:
```typescript
class ZodError extends Error {
  issues: ZodIssue[];
  format(): Record<string, any>;
}
```

Example:
```typescript
try {
  schema.parse(invalidData);
} catch (error) {
  if (error instanceof ZodError) {
    console.log(error.issues);
    console.log(error.format());
  }
}
```

### ZodIssue

```typescript
type ZodIssue = {
  code: string;
  path: (string | number)[];
  message: string;
  expected?: string;
  received?: string;
};
```

### Error Formatting

```typescript
const error = new ZodError([
  { code: "invalid_type", path: ["email"], message: "Invalid email" },
  { code: "too_small", path: ["age"], message: "Must be 18+" },
]);

error.format();
// {
//   email: ["Invalid email"],
//   age: ["Must be 18+"]
// }
```

## Type Inference

### infer

Extract TypeScript type from schema:
```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
});

type User = z.infer<typeof schema>;
// { name: string; age: number }
```

### input

Get input type (before transformations):
```typescript
const schema = z.string().transform((val) => val.length);

type Input = z.input<typeof schema>;  // string
type Output = z.output<typeof schema>; // number
```

### output

Get output type (after transformations):
```typescript
type Output = z.output<typeof schema>;
```

## Polyglot Exports

### Export for Python

```typescript
import { exportForPython } from "./bridges/python-bridge.ts";

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

const pythonCode = exportForPython("User", schema);
// Generates Python validation code
```

### Export for Ruby

```typescript
import { exportForRuby } from "./bridges/ruby-bridge.ts";

const rubyCode = exportForRuby("User", schema);
// Generates Ruby validation code
```

### Export for Java

```typescript
import { exportForJava } from "./bridges/java-bridge.ts";

const javaCode = exportForJava("User", schema);
// Generates Java validation code
```

### Serialize Schema

```typescript
import { serializeSchema } from "./bridges/python-bridge.ts";

const serialized = serializeSchema(schema);
// Returns JSON-serializable schema definition
```

## Advanced Patterns

### Recursive Types

```typescript
const categorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    subcategories: z.array(categorySchema),
  })
);
```

### Conditional Types

```typescript
const schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("user"),
    username: z.string(),
  }),
  z.object({
    type: z.literal("guest"),
    guestId: z.string(),
  }),
]);
```

### Schema Composition

```typescript
const timestampSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
}).merge(timestampSchema);
```

### Pipeline Validation

```typescript
const schema = z.string()
  .trim()
  .toLowerCase()
  .refine((val) => val.length > 0)
  .transform((val) => val.split(","))
  .refine((arr) => arr.length <= 5);
```

---

For more examples, see the [examples](./examples/) directory and [POLYGLOT_GUIDE.md](./POLYGLOT_GUIDE.md).
