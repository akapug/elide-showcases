# JSON Web Token (JWT) - Elide Polyglot Showcase

> **One JWT library for ALL languages** - TypeScript, Python, Ruby, and Java

Secure token-based authentication with a single implementation that works across your entire polyglot stack.

## ✨ Features

- ✅ JWT sign and verify (HS256 algorithm)
- ✅ Custom claims and payload
- ✅ Expiration validation
- ✅ Issuer and audience validation
- ✅ Decode without verification
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ RFC 7519 compliant

## 🚀 Quick Start

### TypeScript

```typescript
import { sign, verify } from './elide-jsonwebtoken.ts';

// Create token
const token = await sign(
  { userId: '123', role: 'admin' },
  'mySecret',
  { expiresIn: '1h' }
);

// Verify token
const payload = await verify(token, 'mySecret');
console.log(payload.userId); // => '123'
```

### Python

```python
from elide import require
jwt = require('./elide-jsonwebtoken.ts')

# Create token
token = jwt.sign(
    {'userId': '123', 'role': 'admin'},
    'mySecret',
    {'expiresIn': '1h'}
)

# Verify token
payload = jwt.verify(token, 'mySecret')
print(payload['userId'])  # => '123'
```

### Ruby

```ruby
jwt = Elide.require('./elide-jsonwebtoken.ts')

# Create token
token = jwt.sign(
  { userId: '123', role: 'admin' },
  'mySecret',
  { expiresIn: '1h' }
)

# Verify token
payload = jwt.verify(token, 'mySecret')
puts payload['userId']  # => '123'
```

### Java

```java
Value jwt = context.eval("js", "require('./elide-jsonwebtoken.ts')");

// Create token
Value token = jwt.getMember("sign").execute(
    Map.of("userId", "123", "role", "admin"),
    "mySecret",
    Map.of("expiresIn", "1h")
);

// Verify token
Value payload = jwt.getMember("verify").execute(
    token.asString(),
    "mySecret"
);
```

## 📖 API Reference

### `sign(payload, secret, options?): Promise<string>`

Create and sign a JWT.

**Options:**
- `expiresIn` - Expiration time ("1h", "7d", or seconds)
- `issuer` - Token issuer
- `audience` - Token audience (string or array)
- `subject` - Subject (usually user ID)
- `jwtid` - JWT ID

### `verify(token, secret, options?): Promise<JWTPayload>`

Verify and decode a JWT.

**Options:**
- `issuer` - Expected issuer
- `audience` - Expected audience
- `clockTolerance` - Clock tolerance in seconds
- `ignoreExpiration` - Skip expiration check

### `decode(token): JWTPayload | null`

Decode JWT without verification (use with caution).

## 💡 Use Cases

### 1. User Authentication

```typescript
async function login(username: string, password: string) {
  const user = await authenticateUser(username, password);

  const token = await sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  return token;
}
```

### 2. API Authorization

```typescript
async function authenticateRequest(authHeader: string) {
  const token = authHeader.replace('Bearer ', '');

  const payload = await verify(token, process.env.JWT_SECRET!);

  return payload;
}
```

### 3. Access & Refresh Tokens

```typescript
async function createTokenPair(userId: string) {
  const accessToken = await sign(
    { userId },
    SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = await sign(
    { userId, type: 'refresh' },
    SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}
```

## 📝 Package Stats

- **npm downloads**: ~30M/week
- **Standard**: RFC 7519 (JSON Web Tokens)
- **Algorithm**: HMAC-SHA256 (HS256)
- **Use case**: Authentication and authorization
- **Elide advantage**: Polyglot, zero dependencies

---

**Built with ❤️ for the Elide Polyglot Runtime**
