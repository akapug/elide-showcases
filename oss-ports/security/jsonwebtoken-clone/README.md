# @elide/jsonwebtoken

Production-ready JSON Web Token implementation for Elide. Complete JWT signing, verification, and decoding with support for multiple algorithms.

## Features

- **Multiple Algorithms**: HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES384, ES512
- **Complete Implementation**: Sign, verify, and decode JWTs
- **TypeScript First**: Full TypeScript support with comprehensive types
- **Standards Compliant**: Follows RFC 7519 JWT specification
- **Security Focused**: Timing-safe comparisons and best practices
- **Flexible**: Support for custom claims and validation
- **Zero Dependencies**: Lightweight implementation using Node.js crypto

## Installation

```bash
npm install @elide/jsonwebtoken
```

## Quick Start

### Signing a Token

```typescript
import { sign } from '@elide/jsonwebtoken';

const token = sign(
  { userId: '123', role: 'admin' },
  'your-secret-key',
  { expiresIn: '1h' }
);

console.log(token);
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Verifying a Token

```typescript
import { verify } from '@elide/jsonwebtoken';

try {
  const decoded = verify(token, 'your-secret-key');
  console.log(decoded);
  // { userId: '123', role: 'admin', iat: 1234567890, exp: 1234571490 }
} catch (error) {
  console.error('Invalid token:', error.message);
}
```

### Decoding Without Verification

```typescript
import { decode } from '@elide/jsonwebtoken';

const decoded = decode(token);
console.log(decoded);
// { userId: '123', role: 'admin', iat: 1234567890, exp: 1234571490 }
```

## API Reference

### sign(payload, secretOrPrivateKey, [options])

Creates and signs a JWT.

**Parameters:**
- `payload` (string | object | Buffer): Data to encode in the token
- `secretOrPrivateKey` (string | Buffer): Secret key or private key
- `options` (object): Sign options

**Options:**
- `algorithm` (string): Signing algorithm (default: 'HS256')
- `expiresIn` (string | number): Token expiration (e.g., '1h', '7d', 3600)
- `notBefore` (string | number): Token not valid before
- `audience` (string | string[]): Token audience
- `issuer` (string): Token issuer
- `subject` (string): Token subject
- `jwtid` (string): JWT ID
- `noTimestamp` (boolean): Disable automatic `iat` claim
- `header` (object): Additional header parameters
- `keyid` (string): Key ID

**Returns:** JWT token string

**Example:**

```typescript
const token = sign(
  { userId: '123', email: 'user@example.com' },
  'secret',
  {
    algorithm: 'HS256',
    expiresIn: '2h',
    issuer: 'my-app',
    audience: 'my-users'
  }
);
```

### verify(token, secretOrPublicKey, [options])

Verifies and decodes a JWT.

**Parameters:**
- `token` (string): JWT token to verify
- `secretOrPublicKey` (string | Buffer): Secret key or public key
- `options` (object): Verify options

**Options:**
- `algorithms` (string[]): Allowed algorithms
- `audience` (string | string[] | RegExp): Expected audience
- `issuer` (string | string[]): Expected issuer
- `subject` (string): Expected subject
- `jwtid` (string): Expected JWT ID
- `ignoreExpiration` (boolean): Ignore expiration check
- `ignoreNotBefore` (boolean): Ignore not-before check
- `clockTolerance` (number): Tolerance in seconds for time checks
- `maxAge` (string | number): Maximum age allowed
- `complete` (boolean): Return header and payload

**Returns:** Decoded payload or VerifyResult if `complete: true`

**Throws:**
- `TokenExpiredError`: Token has expired
- `NotBeforeError`: Token not yet valid
- `JsonWebTokenError`: Invalid token or signature

**Example:**

```typescript
try {
  const payload = verify(token, 'secret', {
    algorithms: ['HS256'],
    issuer: 'my-app',
    audience: 'my-users',
    maxAge: '2h'
  });
  console.log(payload);
} catch (error) {
  if (error instanceof TokenExpiredError) {
    console.log('Token expired at:', error.expiredAt);
  }
}
```

### decode(token, [options])

Decodes a JWT without verifying the signature.

**Parameters:**
- `token` (string): JWT token to decode
- `options` (object): Decode options

**Options:**
- `complete` (boolean): Return header, payload, and signature
- `json` (boolean): Parse payload as JSON

**Returns:** Decoded payload, JWT object if `complete: true`, or null if invalid

**Example:**

```typescript
// Simple decode
const payload = decode(token);

// Complete decode with header
const decoded = decode(token, { complete: true });
console.log(decoded.header);  // { alg: 'HS256', typ: 'JWT' }
console.log(decoded.payload); // { userId: '123', ... }
console.log(decoded.signature); // 'base64url-encoded-signature'
```

## Algorithm Support

### HMAC Algorithms (Symmetric)

```typescript
import { sign } from '@elide/jsonwebtoken';

// HS256 (HMAC with SHA-256)
const token = sign(payload, 'secret', { algorithm: 'HS256' });

// HS384 (HMAC with SHA-384)
const token = sign(payload, 'secret', { algorithm: 'HS384' });

// HS512 (HMAC with SHA-512)
const token = sign(payload, 'secret', { algorithm: 'HS512' });
```

### RSA Algorithms (Asymmetric)

```typescript
import * as fs from 'fs';

const privateKey = fs.readFileSync('private.pem');
const publicKey = fs.readFileSync('public.pem');

// RS256 (RSA with SHA-256)
const token = sign(payload, privateKey, { algorithm: 'RS256' });
const decoded = verify(token, publicKey, { algorithms: ['RS256'] });

// RS384, RS512 also supported
```

### ECDSA Algorithms (Asymmetric)

```typescript
const privateKey = fs.readFileSync('ec-private.pem');
const publicKey = fs.readFileSync('ec-public.pem');

// ES256 (ECDSA with P-256 and SHA-256)
const token = sign(payload, privateKey, { algorithm: 'ES256' });
const decoded = verify(token, publicKey, { algorithms: ['ES256'] });

// ES384, ES512 also supported
```

## Common Use Cases

### Access and Refresh Tokens

```typescript
// Generate access token (short-lived)
const accessToken = sign(
  { userId: user.id, role: user.role },
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: '15m' }
);

// Generate refresh token (long-lived)
const refreshToken = sign(
  { userId: user.id, tokenType: 'refresh' },
  process.env.REFRESH_TOKEN_SECRET,
  { expiresIn: '7d' }
);

// Verify access token
try {
  const payload = verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  // Token valid, proceed
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Use refresh token to get new access token
  }
}
```

### API Authentication

```typescript
import { sign, verify } from '@elide/jsonwebtoken';

// Generate API token
function generateApiToken(apiKey: string): string {
  return sign(
    {
      apiKeyId: apiKey.id,
      permissions: apiKey.permissions,
      type: 'api'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
      issuer: 'api.example.com',
      audience: 'api-clients'
    }
  );
}

// Verify API token
function verifyApiToken(token: string): any {
  return verify(token, process.env.JWT_SECRET, {
    issuer: 'api.example.com',
    audience: 'api-clients'
  });
}
```

### Email Verification Tokens

```typescript
// Generate email verification token
function generateEmailToken(email: string): string {
  return sign(
    { email, purpose: 'email-verification' },
    process.env.EMAIL_TOKEN_SECRET,
    { expiresIn: '24h' }
  );
}

// Verify email token
function verifyEmailToken(token: string): string {
  try {
    const payload = verify(token, process.env.EMAIL_TOKEN_SECRET, {
      maxAge: '24h'
    });

    if (payload.purpose !== 'email-verification') {
      throw new Error('Invalid token purpose');
    }

    return payload.email;
  } catch (error) {
    throw new Error('Invalid or expired email verification token');
  }
}
```

### Password Reset Tokens

```typescript
// Generate password reset token
function generateResetToken(userId: string): string {
  return sign(
    {
      userId,
      purpose: 'password-reset',
      nonce: crypto.randomBytes(16).toString('hex')
    },
    process.env.RESET_TOKEN_SECRET,
    { expiresIn: '1h' }
  );
}

// Verify reset token
function verifyResetToken(token: string): string {
  const payload = verify(token, process.env.RESET_TOKEN_SECRET, {
    maxAge: '1h'
  });

  if (payload.purpose !== 'password-reset') {
    throw new Error('Invalid token purpose');
  }

  return payload.userId;
}
```

## Utility Functions

### Check Token Expiration

```typescript
import { isTokenExpired, getTokenExpiration } from '@elide/jsonwebtoken';

if (isTokenExpired(token)) {
  console.log('Token has expired');
}

const expiresAt = getTokenExpiration(token);
console.log('Token expires at:', expiresAt);
```

### Extract Token Information

```typescript
import { getHeader, getPayload, getTokenIssuer, getTokenSubject } from '@elide/jsonwebtoken';

const header = getHeader(token);
console.log('Algorithm:', header.alg);

const payload = getPayload(token);
console.log('Payload:', payload);

const issuer = getTokenIssuer(token);
const subject = getTokenSubject(token);
```

### Time Parsing

```typescript
import { parseTimespan, formatTimespan } from '@elide/jsonwebtoken';

const seconds = parseTimespan('2h');  // 7200
const formatted = formatTimespan(7200); // "2 hours"
```

## Error Handling

```typescript
import {
  verify,
  TokenExpiredError,
  NotBeforeError,
  JsonWebTokenError
} from '@elide/jsonwebtoken';

try {
  const payload = verify(token, secret);
} catch (error) {
  if (error instanceof TokenExpiredError) {
    console.log('Token expired at:', error.expiredAt);
    // Refresh token or re-authenticate
  } else if (error instanceof NotBeforeError) {
    console.log('Token not yet valid, wait until:', error.date);
  } else if (error instanceof JsonWebTokenError) {
    console.log('Invalid token:', error.message);
    // Invalid signature, malformed token, etc.
  }
}
```

## Security Best Practices

### 1. Keep Secrets Secure

```typescript
// Use environment variables
const secret = process.env.JWT_SECRET;

// Never hardcode secrets
// ❌ const secret = 'my-secret-key';
```

### 2. Use Strong Secrets

```typescript
// Generate strong random secret
import * as crypto from 'crypto';

const secret = crypto.randomBytes(64).toString('hex');
```

### 3. Short Expiration Times

```typescript
// Access tokens: 15 minutes
const accessToken = sign(payload, secret, { expiresIn: '15m' });

// Refresh tokens: 7 days
const refreshToken = sign(payload, secret, { expiresIn: '7d' });
```

### 4. Validate All Claims

```typescript
const payload = verify(token, secret, {
  algorithms: ['HS256'],
  issuer: 'my-app',
  audience: 'my-users',
  maxAge: '1h'
});
```

### 5. Use Asymmetric Algorithms for Public APIs

```typescript
// Sign with private key
const token = sign(payload, privateKey, { algorithm: 'RS256' });

// Distribute public key for verification
const payload = verify(token, publicKey);
```

## Testing

```bash
npm test
```

## Examples

See the [examples directory](./examples/) for complete working examples.

## License

MIT

## Support

- Documentation: [docs.elide.dev/jsonwebtoken](https://docs.elide.dev/jsonwebtoken)
- Issues: [GitHub Issues](https://github.com/elide-dev/elide-showcases/issues)
