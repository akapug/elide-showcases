# @elide/bcrypt

Production-ready password hashing library for Elide. Secure bcrypt implementation with async and sync APIs.

## Features

- **Secure Password Hashing**: Industry-standard bcrypt algorithm
- **Async and Sync APIs**: Choose based on your needs
- **Configurable Cost Factor**: Adjust security vs performance
- **Timing-Safe Comparisons**: Prevent timing attacks
- **Password Strength Validation**: Built-in password policy enforcement
- **TypeScript First**: Full TypeScript support
- **Zero Dependencies**: Lightweight implementation

## Installation

```bash
npm install @elide/bcrypt
```

## Quick Start

```typescript
import bcrypt from '@elide/bcrypt';

// Hash a password
const hash = await bcrypt.hash('myPassword123', 10);
console.log(hash);
// $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

// Verify a password
const isValid = await bcrypt.compare('myPassword123', hash);
console.log(isValid); // true
```

## API Reference

### hash(password, rounds)

Hash a password asynchronously.

```typescript
const hash = await bcrypt.hash('password', 10);
```

### hashSync(password, rounds)

Hash a password synchronously.

```typescript
const hash = bcrypt.hashSync('password', 10);
```

### compare(password, hash)

Compare password with hash asynchronously.

```typescript
const isValid = await bcrypt.compare('password', hash);
```

### compareSync(password, hash)

Compare password with hash synchronously.

```typescript
const isValid = bcrypt.compareSync('password', hash);
```

### genSalt(rounds)

Generate a salt asynchronously.

```typescript
const salt = await bcrypt.genSalt(10);
```

### getRounds(hash)

Get the number of rounds used in a hash.

```typescript
const rounds = bcrypt.getRounds(hash); // 10
```

## Security Best Practices

### 1. Use Appropriate Cost Factor

```typescript
// Development: 10 rounds (fast)
const devHash = await bcrypt.hash(password, 10);

// Production: 12 rounds (more secure)
const prodHash = await bcrypt.hash(password, 12);

// High security: 14+ rounds (slower but very secure)
const highSecHash = await bcrypt.hash(password, 14);
```

### 2. Never Store Plain Passwords

```typescript
// ❌ Bad
await db.users.create({ password: plainPassword });

// ✅ Good
const hash = await bcrypt.hash(plainPassword, 12);
await db.users.create({ password: hash });
```

## License

MIT
