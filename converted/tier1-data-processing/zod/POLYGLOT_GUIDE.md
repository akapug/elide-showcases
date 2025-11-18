# Polyglot Guide: Using Zod Across Languages

## The Revolutionary Approach

Traditional microservices require duplicating validation logic across languages:

```
❌ Traditional (Painful):
   TypeScript → Zod
   Python → Pydantic (duplicate!)
   Ruby → dry-validation (duplicate!)
   Java → Bean Validation (duplicate!)
```

Elide enables a revolutionary approach:

```
✅ Elide (Revolutionary):
   TypeScript → Define schema once
   Python → Use SAME schema
   Ruby → Use SAME schema
   Java → Use SAME schema
```

## Quick Start: Polyglot in 3 Steps

### Step 1: Define Schema in TypeScript

```typescript
import { z } from "./src/zod.ts";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().min(18),
  role: z.enum(["admin", "user", "guest"]),
  isActive: z.boolean(),
  tags: z.array(z.string()).optional(),
});

export type User = z.infer<typeof UserSchema>;
```

### Step 2: Export for Target Languages

```typescript
import { exportForPython } from "./bridges/python-bridge.ts";
import { exportForRuby } from "./bridges/ruby-bridge.ts";
import { exportForJava } from "./bridges/java-bridge.ts";

// Generate Python code
const pythonCode = exportForPython("User", UserSchema);
Deno.writeTextFileSync("user_schema.py", pythonCode);

// Generate Ruby code
const rubyCode = exportForRuby("User", UserSchema);
Deno.writeTextFileSync("user_schema.rb", rubyCode);

// Generate Java code
const javaCode = exportForJava("User", UserSchema);
Deno.writeTextFileSync("UserSchema.java", javaCode);
```

### Step 3: Use in Target Languages

```python
# Python
from user_schema import validate_user

user = validate_user({
    'id': '123e4567-e89b-12d3-a456-426614174000',
    'email': 'user@example.com',
    'name': 'John Doe',
    'age': 25,
    'role': 'user',
    'isActive': True
})
```

```ruby
# Ruby
require './user_schema'

user = validate_user({
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'John Doe',
  age: 25,
  role: 'user',
  isActive: true
})
```

```java
// Java
Map<String, Object> userData = new HashMap<>();
userData.put("id", "123e4567-e89b-12d3-a456-426614174000");
userData.put("email", "user@example.com");
userData.put("name", "John Doe");
userData.put("age", 25);
userData.put("role", "user");
userData.put("isActive", true);

Map<String, Object> user = UserValidator.validate(userData);
```

## Detailed Language Support

### TypeScript (Native)

TypeScript is the primary language for schema definition. All Zod features work natively:

```typescript
// Define complex schemas
const PostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  author: UserSchema,  // Reuse schemas
  tags: z.array(z.string()).max(10),
  status: z.enum(["draft", "published", "archived"]),
  metadata: z.object({
    views: z.number().int().nonnegative(),
    likes: z.number().int().nonnegative(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

// Type inference works perfectly
type Post = z.infer<typeof PostSchema>;

// Validation
const post = PostSchema.parse(data);
```

### Python Integration

Python code is generated that mimics Zod's API:

#### Generated Code

```python
from typing import Any, Dict, List, Optional
from zod import z, ZodError

# Schema definition (auto-generated)
UserSchema = z.object({
    'id': z.string().uuid(),
    'email': z.string().email(),
    'name': z.string().min(1),
    'age': z.number().min(18),
    'role': z.enum(['admin', 'user', 'guest']),
    'isActive': z.boolean(),
    'tags': z.array(z.string()).optional(),
})
```

#### Usage in Python Services

```python
from schemas import UserSchema

# Validate data
try:
    user = UserSchema.parse(request_data)
    print(f"Valid user: {user['name']}")
except ZodError as e:
    print(f"Validation error: {e}")
    print(f"Issues: {e.format()}")

# Safe parse (no exceptions)
result = UserSchema.safe_parse(request_data)
if result['success']:
    user = result['data']
else:
    error = result['error']
```

#### Python-Specific Features

```python
# Chain validations
PasswordSchema = z.string() \
    .min(8) \
    .refine(lambda v: any(c.isupper() for c in v), 'Must contain uppercase')

# Custom refinements
AgeSchema = z.object({
    'birthdate': z.date(),
    'currentDate': z.date(),
}).refine(
    lambda data: (data['currentDate'] - data['birthdate']).days >= 18 * 365,
    'Must be 18 or older'
)
```

### Ruby Integration

Ruby code follows Ruby conventions while maintaining Zod's API:

#### Generated Code

```ruby
require 'zod'

# Schema definition (auto-generated)
UserSchema = Z.object({
  id: Z.string.uuid,
  email: Z.string.email,
  name: Z.string.min(1),
  age: Z.number.min(18),
  role: Z.enum(['admin', 'user', 'guest']),
  isActive: Z.boolean,
  tags: Z.array(Z.string).optional,
})
```

#### Usage in Ruby Services

```ruby
require 'schemas'

# Validate data
begin
  user = UserSchema.parse(request_data)
  puts "Valid user: #{user[:name]}"
rescue ZodError => e
  puts "Validation error: #{e.message}"
  puts "Issues: #{e.format}"
end

# Safe parse (no exceptions)
result = UserSchema.safe_parse(request_data)
if result[:success]
  user = result[:data]
else
  error = result[:error]
end
```

#### Ruby-Specific Features

```ruby
# Refinements with blocks
PasswordSchema = Z.string
  .min(8)
  .refine('Must contain uppercase') { |v| v =~ /[A-Z]/ }

# Object validation
PersonSchema = Z.object({
  first_name: Z.string,
  last_name: Z.string,
  email: Z.string.email,
}).refine('Email must match name') do |data|
  email_prefix = data[:email].split('@').first
  email_prefix.include?(data[:first_name].downcase)
end
```

### Java Integration

Java code provides type-safe validation with proper exception handling:

#### Generated Code

```java
public class UserValidator {
    private static final String SCHEMA_JSON = "...";
    private static final ObjectMapper mapper = new ObjectMapper();
    private static JsonNode schema;

    static {
        try {
            schema = mapper.readTree(SCHEMA_JSON);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load schema", e);
        }
    }

    public static Map<String, Object> validate(Map<String, Object> data)
        throws ValidationException {
        return ZodValidator.validateWithSchema(data, schema);
    }
}
```

#### Usage in Java Services

```java
import java.util.*;

// Validate data
try {
    Map<String, Object> user = UserValidator.validate(requestData);
    System.out.println("Valid user: " + user.get("name"));
} catch (ValidationException e) {
    System.err.println("Validation error: " + e.getMessage());
    Map<String, Object> formatted = e.format();
    System.err.println("Issues: " + formatted);
}
```

#### Java-Specific Features

```java
// Using with Spring Boot
@RestController
public class UserController {
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> data) {
        try {
            Map<String, Object> validatedUser = UserValidator.validate(data);
            // Process validated user...
            return ResponseEntity.ok(validatedUser);
        } catch (ValidationException e) {
            return ResponseEntity
                .badRequest()
                .body(e.format());
        }
    }
}
```

## Real-World Polyglot Architecture

### Microservices Example

```
┌─────────────────────────────────────────────────────────────────┐
│                      shared-schemas.ts                          │
│  (ONE source of truth for ALL services)                        │
│                                                                  │
│  - UserSchema                                                   │
│  - ProductSchema                                                │
│  - OrderSchema                                                  │
│  - PaymentSchema                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┬────────────┐
                 │            │            │            │
                 ▼            ▼            ▼            ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
         │   API    │  │   User   │  │ Payment  │  │Inventory │
         │ Gateway  │  │ Service  │  │ Service  │  │ Service  │
         │TypeScript│  │  Python  │  │   Ruby   │  │   Java   │
         └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### Implementation

#### 1. Define Shared Schemas

```typescript
// shared-schemas.ts
export const UserSchema = z.object({ /* ... */ });
export const OrderSchema = z.object({ /* ... */ });
export const PaymentSchema = z.object({ /* ... */ });
export const ProductSchema = z.object({ /* ... */ });

// Export for each language
exportForPython("User", UserSchema);
exportForRuby("Payment", PaymentSchema);
exportForJava("Product", ProductSchema);
```

#### 2. API Gateway (TypeScript)

```typescript
import { UserSchema, OrderSchema } from './shared-schemas.ts';

app.post('/users', (req, res) => {
  try {
    const user = UserSchema.parse(req.body);
    // Forward to Python User Service...
  } catch (error) {
    res.status(400).json({ error: error.format() });
  }
});
```

#### 3. User Service (Python)

```python
from schemas import UserSchema

@app.route('/users', methods=['POST'])
def create_user():
    try:
        user = UserSchema.parse(request.json)
        # Process user...
        return jsonify(user)
    except ZodError as e:
        return jsonify({'error': e.format()}), 400
```

#### 4. Payment Service (Ruby)

```ruby
require 'schemas'

post '/payments' do
  begin
    payment = PaymentSchema.parse(JSON.parse(request.body.read))
    # Process payment...
    json payment
  rescue ZodError => e
    status 400
    json error: e.format
  end
end
```

#### 5. Inventory Service (Java)

```java
@PostMapping("/products")
public ResponseEntity<?> updateProduct(@RequestBody Map<String, Object> data) {
    try {
        Map<String, Object> product = ProductValidator.validate(data);
        // Process product...
        return ResponseEntity.ok(product);
    } catch (ValidationException e) {
        return ResponseEntity.badRequest().body(e.format());
    }
}
```

## Benefits of Polyglot Validation

### 1. Single Source of Truth

```typescript
// Define ONCE
const ApiResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.unknown() }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);

// Use EVERYWHERE
// - TypeScript API Gateway
// - Python ML Service
// - Ruby Analytics Service
// - Java Legacy System
```

### 2. Consistent Error Messages

All services return the same error format:

```json
{
  "email": ["Invalid email"],
  "age": ["Number must be at least 18"]
}
```

### 3. Type Safety Across Services

```typescript
// TypeScript
type User = z.infer<typeof UserSchema>;

// Python (via type hints)
# user: Dict[str, Any]  # Validated against UserSchema

// Ruby (via YARD)
# @param [Hash] user Validated user data

// Java
// Map<String, Object> user  // Validated by UserValidator
```

### 4. Automatic Updates

```typescript
// Update schema once
const UserSchema = z.object({
  // ... existing fields ...
  phoneNumber: z.string().regex(/^\+\d{10,15}$/),  // NEW!
});

// Regenerate
exportForPython("User", UserSchema);
exportForRuby("User", UserSchema);
exportForJava("User", UserSchema);

// All services now validate phone numbers!
```

## Schema Translation Details

### Primitive Types

| Zod | TypeScript | Python | Ruby | Java |
|-----|------------|--------|------|------|
| `z.string()` | `string` | `str` | `String` | `String` |
| `z.number()` | `number` | `float` | `Numeric` | `Double` |
| `z.number().int()` | `number` | `int` | `Integer` | `Integer` |
| `z.boolean()` | `boolean` | `bool` | `Boolean` | `Boolean` |
| `z.date()` | `Date` | `datetime` | `Date` | `Date` |
| `z.array(T)` | `T[]` | `List[T]` | `Array<T>` | `List<T>` |
| `z.object({...})` | `{...}` | `Dict[str, ...]` | `Hash` | `Map<String, Object>` |

### Constraints

| Zod Constraint | All Languages |
|----------------|---------------|
| `.min(n)` | Minimum value/length |
| `.max(n)` | Maximum value/length |
| `.email()` | Email format validation |
| `.url()` | URL format validation |
| `.uuid()` | UUID format validation |
| `.regex(r)` | Custom pattern matching |
| `.optional()` | Allow undefined/null |
| `.refine(fn, msg)` | Custom validation |

## Best Practices

### 1. Centralize Schema Definitions

```typescript
// schemas/index.ts - ONE file for ALL schemas
export const UserSchema = z.object({ /* ... */ });
export const ProductSchema = z.object({ /* ... */ });
export const OrderSchema = z.object({ /* ... */ });

// Generate all at once
Object.entries({ User: UserSchema, Product: ProductSchema })
  .forEach(([name, schema]) => {
    Deno.writeTextFileSync(`${name}.py`, exportForPython(name, schema));
    Deno.writeTextFileSync(`${name}.rb`, exportForRuby(name, schema));
    Deno.writeTextFileSync(`${name}.java`, exportForJava(name, schema));
  });
```

### 2. Version Your Schemas

```typescript
// schemas/v1/user.ts
export const UserSchemaV1 = z.object({ /* ... */ });

// schemas/v2/user.ts
export const UserSchemaV2 = UserSchemaV1.extend({
  phoneNumber: z.string().regex(/^\+\d{10,15}$/),
});
```

### 3. Use Discriminated Unions for APIs

```typescript
const ApiResponseSchema = z.discriminatedUnion("status", [
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
```

### 4. Document Schemas

```typescript
/**
 * User schema for authentication and profile management.
 * Used by: API Gateway, User Service, Auth Service
 */
export const UserSchema = z.object({
  /** Unique user identifier (UUID v4) */
  id: z.string().uuid(),

  /** User email (must be unique) */
  email: z.string().email(),

  /** Full name */
  name: z.string().min(1).max(100),

  /** User role for authorization */
  role: z.enum(["admin", "user", "guest"]),
});
```

## Troubleshooting

### Schema Not Validating in Python

**Problem**: Generated Python code not validating correctly

**Solution**: Ensure `zod.py` is in the same directory or Python path

```python
# Add to PYTHONPATH or copy zod.py
import sys
sys.path.append('./bridges')
from zod import z
```

### Type Mismatch in Java

**Problem**: Java complains about types

**Solution**: Ensure proper type mapping in generated code

```java
// Cast as needed
String email = (String) user.get("email");
Integer age = (Integer) user.get("age");
```

### Error Messages Not Matching

**Problem**: Different error formats across languages

**Solution**: Use `.format()` method consistently

```typescript
// TypeScript
error.format()

// Python
error.format()

// Ruby
error.format

// Java
error.format()
```

## Limitations

1. **Refinements**: Complex refinements may need language-specific implementations
2. **Transformations**: Only simple transformations translate automatically
3. **Async Validation**: Not supported in generated code (TypeScript only)
4. **Custom Types**: Require manual implementation in target languages

## Future Enhancements

- [ ] Async validation support
- [ ] More complex transformation support
- [ ] Additional language targets (Go, Rust, C#)
- [ ] GraphQL schema generation
- [ ] OpenAPI schema generation

---

**The polyglot future is here.** Define once, validate everywhere.
