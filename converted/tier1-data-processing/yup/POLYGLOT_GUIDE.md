# Polyglot Validation Guide

Learn how to share Yup validation schemas across TypeScript, Python, and Ruby services.

## Overview

Yup on Elide enables true polyglot validation:

- **Define once**: Write schemas in TypeScript
- **Use everywhere**: Validate in TypeScript, Python, and Ruby
- **Stay consistent**: Same validation logic across all services
- **Zero duplication**: Single source of truth for data validation

## Quick Start

### 1. Define Schema (TypeScript)

```typescript
// schemas/user.ts
import * as yup from '@elide/yup';

export const userSchema = yup.object({
  username: yup.string().min(3).max(20).required(),
  email: yup.string().email().required(),
  age: yup.number().positive().integer().min(18),
});
```

### 2. Use in Python

```python
# api/validate.py
from yup import object, string, number

# Same schema, Python syntax
user_schema = object({
    'username': string().min(3).max(20).required(),
    'email': string().email().required(),
    'age': number().positive().integer().min(18)
})

def validate_user(data):
    return user_schema.validate_sync(data)
```

### 3. Use in Ruby

```ruby
# admin/validate.rb
require 'yup'

# Same schema, Ruby syntax
user_schema = Yup.object({
  username: Yup.string.min(3).max(20).required,
  email: Yup.string.email.required,
  age: Yup.number.positive.integer.min(18)
})

def validate_user(data)
  user_schema.validate_sync(data)
end
```

## Architecture Patterns

### Pattern 1: Microservices Validation

```
┌─────────────────┐
│   TypeScript    │  Define schemas
│   Schema Layer  │  (Single source of truth)
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Frontend│ │Python│ │ Ruby │ │ Go   │
│  (TS)  │ │ API  │ │Admin │ │ CLI  │
└────────┘ └──────┘ └──────┘ └──────┘
```

All services use the same validation logic!

### Pattern 2: API Gateway + Microservices

```typescript
// gateway/schemas.ts - Shared schemas
export const requestSchemas = {
  createUser: yup.object({ /* ... */ }),
  updateUser: yup.object({ /* ... */ }),
  createOrder: yup.object({ /* ... */ }),
};
```

```python
# services/users/api.py
from gateway.schemas import request_schemas

@app.post('/users')
def create_user(data):
    # Validate using shared schema
    user = request_schemas['createUser'].validate_sync(data)
    return save_user(user)
```

```ruby
# services/orders/api.rb
require 'gateway/schemas'

post '/orders' do
  # Validate using shared schema
  order = request_schemas.create_order.validate_sync(params)
  save_order(order)
end
```

### Pattern 3: Monorepo with Shared Validation

```
my-app/
├── packages/
│   ├── schemas/          # Shared schemas
│   │   ├── user.ts
│   │   ├── order.ts
│   │   └── product.ts
│   ├── frontend/         # TypeScript
│   ├── api/             # Python
│   └── admin/           # Ruby
```

## Language-Specific Guides

### TypeScript

#### Installation

```bash
npm install @elide/yup
```

#### Basic Usage

```typescript
import * as yup from '@elide/yup';

const schema = yup.object({
  name: yup.string().required(),
  email: yup.string().email(),
});

// Async validation
const user = await schema.validate(data);

// Sync validation
const user = schema.validateSync(data);

// Check validity
const isValid = await schema.isValid(data);
```

#### Type Inference

```typescript
const schema = yup.object({
  name: yup.string().required(),
  age: yup.number().required(),
});

type User = yup.InferType<typeof schema>;
// User = { name: string; age: number }
```

### Python

#### Installation

```python
# Included with @elide/yup
from yup import object, string, number, array, boolean
```

#### Basic Usage

```python
from yup import object, string, number

schema = object({
    'name': string().required(),
    'email': string().email(),
    'age': number().positive().integer()
})

# Validate
try:
    user = schema.validate_sync(data)
    print(f"Valid user: {user}")
except Exception as err:
    print(f"Validation error: {err}")

# Check validity
if schema.is_valid(data):
    print("Data is valid")
```

#### Advanced Features

```python
# Array validation
tags_schema = array(string().min(2)).min(1).max(5)

# Conditional validation
form_schema = object({
    'type': string().one_of(['personal', 'business']),
    'company': string().when('type', {
        'is': 'business',
        'then': lambda s: s.required(),
        'otherwise': lambda s: s.optional()
    })
})

# Custom error messages
email_schema = string().email('Invalid email format')
```

### Ruby

#### Installation

```ruby
# Included with @elide/yup
require 'yup'
```

#### Basic Usage

```ruby
require 'yup'

schema = Yup.object({
  name: Yup.string.required,
  email: Yup.string.email,
  age: Yup.number.positive.integer
})

# Validate
begin
  user = schema.validate_sync(data)
  puts "Valid user: #{user}"
rescue => err
  puts "Validation error: #{err.message}"
end

# Check validity
if schema.valid?(data)
  puts "Data is valid"
end
```

#### Advanced Features

```ruby
# Array validation
tags_schema = Yup.array(Yup.string.min(2)).min(1).max(5)

# Conditional validation
form_schema = Yup.object({
  type: Yup.string.one_of(['personal', 'business']),
  company: Yup.string.when('type', {
    is: 'business',
    then: ->(s) { s.required },
    otherwise: ->(s) { s.optional }
  })
})

# Custom error messages
email_schema = Yup.string.email('Invalid email format')
```

## Real-World Examples

### Example 1: User Registration (All Languages)

#### Schema Definition

```typescript
// schemas/registration.ts
export const registrationSchema = yup.object({
  username: yup.string().min(3).max(20).required(),
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match'),
  terms: yup.boolean().oneOf([true], 'Must accept terms'),
});
```

#### TypeScript Frontend

```typescript
// frontend/register.ts
import { registrationSchema } from '../schemas/registration';

async function handleSubmit(formData: FormData) {
  try {
    const user = await registrationSchema.validate(formData);
    await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  } catch (err) {
    showErrors(err.errors);
  }
}
```

#### Python Backend

```python
# backend/api.py
from schemas.registration import registration_schema

@app.post('/api/register')
def register(data):
    try:
        user = registration_schema.validate_sync(data)
        save_user(user)
        return {'success': True}
    except Exception as err:
        return {'error': str(err)}, 400
```

#### Ruby Admin Panel

```ruby
# admin/users.rb
require 'schemas/registration'

post '/admin/users' do
  begin
    user = registration_schema.validate_sync(params)
    save_user(user)
    redirect '/admin/users'
  rescue => err
    flash[:error] = err.message
    redirect back
  end
end
```

### Example 2: E-Commerce Order

#### Shared Schema

```typescript
// schemas/order.ts
export const orderSchema = yup.object({
  items: yup.array(
    yup.object({
      productId: yup.string().required(),
      quantity: yup.number().positive().integer().required(),
      price: yup.number().positive().required(),
    })
  ).min(1).required(),

  shipping: yup.object({
    address: yup.string().required(),
    city: yup.string().required(),
    country: yup.string().required(),
  }),

  payment: yup.object({
    method: yup.string().oneOf(['card', 'paypal']).required(),
    total: yup.number().positive().required(),
  }),
});
```

#### Usage Across Services

```typescript
// TypeScript checkout
const order = await orderSchema.validate(checkoutData);
```

```python
# Python order processing
order = order_schema.validate_sync(request_data)
```

```ruby
# Ruby fulfillment
order = order_schema.validate_sync(fulfillment_data)
```

## Best Practices

### 1. Centralize Schema Definitions

```
schemas/
├── user.ts          # User-related schemas
├── product.ts       # Product schemas
├── order.ts         # Order schemas
└── index.ts         # Export all schemas
```

### 2. Use Descriptive Error Messages

```typescript
const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),

  age: yup
    .number()
    .min(18, 'Must be at least 18 years old')
    .required('Age is required'),
});
```

### 3. Version Your Schemas

```typescript
// schemas/v1/user.ts
export const userSchemaV1 = yup.object({ /* ... */ });

// schemas/v2/user.ts
export const userSchemaV2 = yup.object({ /* ... */ });

// Use appropriate version
import { userSchemaV2 } from './schemas/v2/user';
```

### 4. Test Across All Languages

```typescript
// TypeScript test
test('validates user in TypeScript', async () => {
  await expect(schema.validate(validData)).resolves.toBeDefined();
});
```

```python
# Python test
def test_validates_user_in_python():
    result = schema.validate_sync(valid_data)
    assert result is not None
```

```ruby
# Ruby test
it 'validates user in Ruby' do
  result = schema.validate_sync(valid_data)
  expect(result).not_to be_nil
end
```

## Performance Considerations

### Caching Schemas

```typescript
// Good: Create schema once
const userSchema = yup.object({ /* ... */ });

export function validateUser(data: any) {
  return userSchema.validate(data);
}

// Bad: Creating schema every time
export function validateUser(data: any) {
  const schema = yup.object({ /* ... */ }); // ✗ Wasteful
  return schema.validate(data);
}
```

### Sync vs Async

```typescript
// Use sync when possible (faster)
const result = schema.validateSync(data);

// Use async for async tests
const result = await schema.validate(data);
```

### Batch Validation

```python
# Efficient batch validation
results = []
for record in records:
    try:
        validated = schema.validate_sync(record)
        results.append(validated)
    except Exception as err:
        log_error(record, err)
```

## Troubleshooting

### Issue: Schema Not Found in Python

```python
# ✗ Wrong
from schemas import user_schema

# ✓ Correct
from yup import object, string
user_schema = object({'name': string().required()})
```

### Issue: Type Mismatch in Ruby

```ruby
# ✗ Wrong (Python-style)
schema = Yup.object({'name' => Yup.string})

# ✓ Correct (Ruby-style)
schema = Yup.object({name: Yup.string})
```

### Issue: Validation Not Working

```typescript
// Make sure Elide polyglot runtime is configured
// Check elide.yaml:
runtime:
  polyglot:
    enabled: true
    languages: [javascript, python, ruby]
```

## Next Steps

1. ✅ Set up polyglot runtime
2. ✅ Define shared schemas
3. ✅ Implement in each language
4. ✅ Write tests for all languages
5. ✅ Deploy and monitor

## Resources

- [API Reference](./API_REFERENCE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Examples](./examples/polyglot-forms.ts)
- [Elide Polyglot Docs](https://docs.elide.dev/polyglot)
