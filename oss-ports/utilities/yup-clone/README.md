# Yup Clone for Elide

Dead simple object schema validation with TypeScript support.

## Features

- **Schema Composition**: Build complex schemas from simple ones
- **Async Validation**: Support for asynchronous validation
- **Custom Validators**: Define custom validation rules
- **Error Messages**: Detailed, customizable error messages
- **Type-Safe**: Full TypeScript inference
- **Transformations**: Clean and normalize data
- **Conditional Schema**: Dynamic schema based on values

## Installation

```bash
elide install yup-clone
```

## Quick Start

```typescript
import * as yup from './yup-clone.ts'

// Define schema
const userSchema = yup.object({
  name: yup.string().required(),
  age: yup.number().positive().integer(),
  email: yup.string().email(),
  website: yup.string().url().nullable(),
  createdOn: yup.date().default(() => new Date()),
})

// Validate
await userSchema.validate({
  name: 'John',
  age: 30,
  email: 'john@example.com',
  website: null,
})

// Type inference
type User = yup.InferType<typeof userSchema>
```

## Schema Types

### String

```typescript
yup.string()
  .required()
  .min(5)
  .max(255)
  .email()
  .url()
  .matches(/^[a-z]+$/)
  .lowercase()
  .uppercase()
  .trim()
```

### Number

```typescript
yup.number()
  .required()
  .min(0)
  .max(100)
  .positive()
  .negative()
  .integer()
  .lessThan(10)
  .moreThan(5)
```

### Boolean

```typescript
yup.boolean()
  .required()
  .isTrue()
  .isFalse()
```

### Date

```typescript
yup.date()
  .required()
  .min(new Date('2020-01-01'))
  .max(new Date('2030-12-31'))
```

### Array

```typescript
yup.array()
  .of(yup.string())
  .required()
  .min(1)
  .max(10)
  .length(5)
```

### Object

```typescript
yup.object({
  name: yup.string().required(),
  age: yup.number(),
})
  .required()
  .shape({
    email: yup.string().email(),
  })
  .noUnknown()
```

### Mixed (Any)

```typescript
yup.mixed()
  .oneOf(['a', 'b', 'c'])
  .notOneOf(['x', 'y'])
```

## Composition

```typescript
// Reuse schemas
const emailSchema = yup.string().email().required()

const userSchema = yup.object({
  email: emailSchema,
  confirmEmail: emailSchema,
})

// Concatenate schemas
const baseSchema = yup.object({
  name: yup.string(),
})

const extendedSchema = baseSchema.shape({
  age: yup.number(),
})

// Conditional schemas
yup.object({
  isBusiness: yup.boolean(),
  businessName: yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.optional(),
  }),
})
```

## Validation

```typescript
// Validate (throws on error)
await schema.validate(data)

// Validate and return data
const validData = await schema.validate(data)

// Validate without throwing
const result = await schema.isValid(data)  // boolean

// Get validation errors
try {
  await schema.validate(data)
} catch (err) {
  if (err instanceof yup.ValidationError) {
    console.log(err.errors)  // Array of error messages
    console.log(err.inner)   // Array of inner errors
  }
}
```

## Transformations

```typescript
yup.string()
  .trim()
  .lowercase()
  .transform((value) => value.replace(/\s+/g, '-'))

yup.number()
  .transform((value, originalValue) => {
    return typeof originalValue === 'string'
      ? parseFloat(originalValue)
      : value
  })
```

## Custom Validation

```typescript
// Test method
yup.string().test('is-cat', 'Must be cat', (value) => {
  return value === 'cat'
})

// Custom async validation
yup.string().test('unique-username', 'Username taken', async (value) => {
  return await checkUsernameAvailability(value)
})

// Custom error messages
yup.string()
  .required('Name is required')
  .min(3, 'Name must be at least 3 characters')
```

## Defaults & Casting

```typescript
yup.object({
  role: yup.string().default('user'),
  createdAt: yup.date().default(() => new Date()),
})

// Cast values
schema.cast({ name: '  John  ' })  // { name: 'John' }
```

## Nullable & Optional

```typescript
yup.string().nullable()     // string | null
yup.string().optional()     // string | undefined
yup.string().notRequired()  // string | undefined
```

## Error Messages

```typescript
// Custom messages
yup.string().required('This field is required')

// Interpolation
yup.string().min(3, 'Must be at least ${min} characters')

// Function messages
yup.string().test('custom', (value) => {
  return value === 'test' || new yup.ValidationError('Must be "test"')
})
```

## API Reference

### Validation Methods

- `validate(value, options?)` - Validate value (throws)
- `validateSync(value, options?)` - Synchronous validate (throws)
- `isValid(value, options?)` - Check if valid (returns boolean)
- `cast(value, options?)` - Cast value to schema type

### Schema Methods

- `required(message?)` - Mark as required
- `optional()` - Mark as optional
- `nullable()` - Allow null
- `default(value)` - Set default value
- `test(name, message, fn)` - Custom validation
- `transform(fn)` - Transform value
- `when(keys, builder)` - Conditional schema

### Object Methods

- `shape(schema)` - Add/override fields
- `pick(keys)` - Pick specific fields
- `omit(keys)` - Omit specific fields
- `noUnknown(message?)` - Disallow unknown keys

## License

MIT - Based on the original Yup library
