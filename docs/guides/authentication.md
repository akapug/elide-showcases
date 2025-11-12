# Authentication Patterns with Elide

**Complete guide to implementing authentication and authorization**

Learn how to secure your Elide applications with JWT, sessions, OAuth2, and API keys across all supported languages.

---

## Table of Contents

- [Authentication Strategies](#authentication-strategies)
- [JWT Authentication](#jwt-authentication)
- [Session Management](#session-management)
- [API Keys](#api-keys)
- [OAuth2 Integration](#oauth2-integration)
- [Password Hashing](#password-hashing)
- [Authorization Patterns](#authorization-patterns)
- [Security Best Practices](#security-best-practices)

---

## Authentication Strategies

### Comparison of Auth Methods

| Method | Use Case | Security | Complexity | Stateless |
|--------|----------|----------|------------|-----------|
| **JWT** | APIs, mobile apps | High | Medium | Yes |
| **Sessions** | Web apps | High | Low | No |
| **API Keys** | Service-to-service | Medium | Low | Yes |
| **OAuth2** | Third-party integration | High | High | Yes |
| **Basic Auth** | Simple APIs | Low | Very Low | Yes |

---

## JWT Authentication

### JWT Implementation

```typescript
// jwt.ts
import { createHmac } from "crypto";

interface JWTPayload {
  sub: string;  // Subject (user ID)
  iat: number;  // Issued at
  exp: number;  // Expiration
  [key: string]: any;
}

export class JWT {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Create JWT token
   */
  sign(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number = 3600): string {
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };

    // Create header
    const header = {
      alg: "HS256",
      typ: "JWT"
    };

    // Base64 encode
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));

    // Create signature
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify and decode JWT token
   */
  verify(token: string): JWTPayload | null {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split(".");

      // Verify signature
      const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
      if (signature !== expectedSignature) {
        return null;
      }

      // Decode payload
      const payload: JWTPayload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) {
      str += "=";
    }
    return Buffer.from(str, "base64").toString("utf-8");
  }

  private createSignature(data: string): string {
    const hmac = createHmac("sha256", this.secret);
    hmac.update(data);
    return this.base64UrlEncode(hmac.digest("base64"));
  }
}

// Usage
const jwt = new JWT("your-secret-key");

// Sign token
const token = jwt.sign({
  sub: "user123",
  email: "alice@example.com",
  role: "admin"
}, 3600);  // 1 hour

// Verify token
const payload = jwt.verify(token);
if (payload) {
  console.log("Valid token:", payload);
} else {
  console.log("Invalid or expired token");
}
```

### JWT Authentication Middleware

```typescript
// auth-middleware.ts
import { JWT } from "./jwt.ts";

const jwt = new JWT(process.env.JWT_SECRET || "your-secret-key");

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function authenticate(req: Request): Promise<Response | null> {
  // Get token from header
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({
      error: "Missing or invalid authorization header"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = authHeader.substring(7);  // Remove "Bearer "

  // Verify token
  const payload = jwt.verify(token);

  if (!payload) {
    return new Response(JSON.stringify({
      error: "Invalid or expired token"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Attach user to request (conceptual - would need custom Request type)
  (req as any).user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role
  };

  return null;  // Continue to handler
}

// Usage in server
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Public routes
  if (url.pathname === "/login") {
    return handleLogin(req);
  }

  // Protected routes
  const authError = await authenticate(req);
  if (authError) {
    return authError;
  }

  // User is authenticated
  const user = (req as any).user;

  if (url.pathname === "/api/profile") {
    return new Response(JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}

async function handleLogin(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const data = await req.json();
  const { email, password } = data;

  // Validate credentials (implementation depends on your user store)
  const user = await validateCredentials(email, password);

  if (!user) {
    return new Response(JSON.stringify({
      error: "Invalid credentials"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Generate JWT
  const token = jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role
  }, 3600 * 24);  // 24 hours

  return new Response(JSON.stringify({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  }), {
    headers: { "Content-Type": "application/json" }
  });
}

async function validateCredentials(email: string, password: string): Promise<any> {
  // Implementation depends on your database
  // This is a placeholder
  if (email === "alice@example.com" && password === "password123") {
    return {
      id: "user123",
      email: "alice@example.com",
      role: "admin"
    };
  }
  return null;
}
```

---

## Session Management

### In-Memory Session Store

```typescript
// session-store.ts
export interface Session {
  id: string;
  userId: string;
  data: Record<string, any>;
  createdAt: number;
  expiresAt: number;
}

export class SessionStore {
  private sessions: Map<string, Session> = new Map();

  create(userId: string, expiresIn: number = 3600000): Session {
    const id = this.generateId();
    const now = Date.now();

    const session: Session = {
      id,
      userId,
      data: {},
      createdAt: now,
      expiresAt: now + expiresIn
    };

    this.sessions.set(id, session);
    return session;
  }

  get(id: string): Session | null {
    const session = this.sessions.get(id);

    if (!session) {
      return null;
    }

    // Check expiration
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(id);
      return null;
    }

    return session;
  }

  update(id: string, data: Record<string, any>): Session | null {
    const session = this.get(id);

    if (!session) {
      return null;
    }

    session.data = { ...session.data, ...data };
    this.sessions.set(id, session);

    return session;
  }

  destroy(id: string): boolean {
    return this.sessions.delete(id);
  }

  cleanup(): void {
    const now = Date.now();

    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
      }
    }
  }

  private generateId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }
}

// Periodic cleanup
const sessionStore = new SessionStore();

setInterval(() => {
  sessionStore.cleanup();
}, 60000);  // Every minute
```

### Session-Based Auth

```typescript
// server.ts
import { SessionStore } from "./session-store.ts";

const sessions = new SessionStore();

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Login
  if (url.pathname === "/login" && req.method === "POST") {
    const data = await req.json();
    const user = await validateCredentials(data.email, data.password);

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Create session
    const session = sessions.create(user.id, 3600000);  // 1 hour

    return new Response(JSON.stringify({
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email
      }
    }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `sessionId=${session.id}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
      }
    });
  }

  // Protected route
  if (url.pathname === "/api/profile") {
    // Get session ID from cookie
    const cookies = req.headers.get("Cookie") || "";
    const sessionId = cookies.split(";")
      .find(c => c.trim().startsWith("sessionId="))
      ?.split("=")[1];

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate session
    const session = sessions.get(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get user data
    const user = await getUserById(session.userId);

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Logout
  if (url.pathname === "/logout") {
    const cookies = req.headers.get("Cookie") || "";
    const sessionId = cookies.split(";")
      .find(c => c.trim().startsWith("sessionId="))
      ?.split("=")[1];

    if (sessionId) {
      sessions.destroy(sessionId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "sessionId=; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
      }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## API Keys

### API Key Authentication

```typescript
// api-key-auth.ts
export class APIKeyManager {
  private keys: Map<string, {
    userId: string;
    permissions: string[];
    createdAt: number;
  }> = new Map();

  generate(userId: string, permissions: string[] = []): string {
    // Generate secure random key
    const key = `ek_${this.randomString(32)}`;

    this.keys.set(key, {
      userId,
      permissions,
      createdAt: Date.now()
    });

    return key;
  }

  validate(key: string): { userId: string; permissions: string[] } | null {
    const data = this.keys.get(key);

    if (!data) {
      return null;
    }

    return {
      userId: data.userId,
      permissions: data.permissions
    };
  }

  revoke(key: string): boolean {
    return this.keys.delete(key);
  }

  private randomString(length: number): string {
    return Array.from({ length }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join("");
  }
}

const apiKeys = new APIKeyManager();

// Middleware
export async function validateAPIKey(req: Request): Promise<Response | null> {
  const apiKey = req.headers.get("X-API-Key");

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: "Missing API key"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const keyData = apiKeys.validate(apiKey);

  if (!keyData) {
    return new Response(JSON.stringify({
      error: "Invalid API key"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Attach to request
  (req as any).apiKey = keyData;

  return null;
}

// Usage
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // API key protected route
  if (url.pathname.startsWith("/api/")) {
    const authError = await validateAPIKey(req);
    if (authError) {
      return authError;
    }

    // Process request
    const keyData = (req as any).apiKey;
    console.log(`Request from user ${keyData.userId}`);

    return new Response(JSON.stringify({ data: "protected" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## Password Hashing

### Secure Password Hashing

```typescript
// password.ts
import { createHash, randomBytes, pbkdf2 } from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(pbkdf2);

export class PasswordManager {
  private iterations = 100000;
  private keyLength = 64;
  private digest = "sha512";

  /**
   * Hash password with salt
   */
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const hash = await pbkdf2Async(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest
    );

    return `${salt}:${hash.toString("hex")}`;
  }

  /**
   * Verify password against hash
   */
  async verify(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, hash] = hashedPassword.split(":");

    const verifyHash = await pbkdf2Async(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest
    );

    return hash === verifyHash.toString("hex");
  }

  /**
   * Quick hash (for API keys, etc.)
   */
  quickHash(input: string): string {
    return createHash("sha256").update(input).digest("hex");
  }
}

// Usage
const passwordManager = new PasswordManager();

// Hash password
const hashedPassword = await passwordManager.hash("user-password");
// Output: "salt:hash"

// Verify password
const isValid = await passwordManager.verify("user-password", hashedPassword);
console.log(isValid);  // true
```

### User Registration

```typescript
// registration.ts
import { PasswordManager } from "./password.ts";

const passwordManager = new PasswordManager();

interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

const users: Map<string, User> = new Map();

export async function registerUser(email: string, password: string): Promise<User | null> {
  // Validate email
  if (!email.includes("@")) {
    return null;
  }

  // Validate password strength
  if (password.length < 8) {
    return null;
  }

  // Check if user exists
  for (const user of users.values()) {
    if (user.email === email) {
      return null;  // User already exists
    }
  }

  // Hash password
  const passwordHash = await passwordManager.hash(password);

  // Create user
  const user: User = {
    id: generateId(),
    email,
    passwordHash,
    createdAt: Date.now()
  };

  users.set(user.id, user);

  return user;
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  // Find user by email
  let foundUser: User | null = null;
  for (const user of users.values()) {
    if (user.email === email) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    return null;
  }

  // Verify password
  const isValid = await passwordManager.verify(password, foundUser.passwordHash);

  if (!isValid) {
    return null;
  }

  return foundUser;
}

function generateId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}
```

---

## Authorization Patterns

### Role-Based Access Control (RBAC)

```typescript
// rbac.ts
export type Role = "admin" | "editor" | "viewer";

export type Permission = "read" | "write" | "delete" | "admin";

const rolePermissions: Record<Role, Permission[]> = {
  admin: ["read", "write", "delete", "admin"],
  editor: ["read", "write"],
  viewer: ["read"]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function requirePermission(permission: Permission) {
  return async (req: Request): Promise<Response | null> => {
    const user = (req as any).user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!hasPermission(user.role, permission)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    return null;
  };
}

// Usage
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Authenticate
  const authError = await authenticate(req);
  if (authError) return authError;

  // Delete endpoint requires delete permission
  if (url.pathname.startsWith("/api/users/") && req.method === "DELETE") {
    const permError = await requirePermission("delete")(req);
    if (permError) return permError;

    // Process delete
    return new Response(JSON.stringify({ deleted: true }));
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## Security Best Practices

### 1. Secure Headers

```typescript
function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'"
  };
}
```

### 2. Rate Limiting

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private window: number;

  constructor(limit: number = 100, window: number = 60000) {
    this.limit = limit;
    this.window = window;
  }

  check(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Remove old requests
    const validRequests = requests.filter(time => now - time < this.window);

    if (validRequests.length >= this.limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }
}

const rateLimiter = new RateLimiter(100, 60000);  // 100 requests per minute

export async function checkRateLimit(req: Request): Promise<Response | null> {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  if (!rateLimiter.check(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }

  return null;
}
```

### 3. Input Validation

```typescript
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
```

---

## Next Steps

- **[Security Guide](./security.md)** - Comprehensive security practices
- **[Testing](./testing.md)** - Test authentication flows
- **[Deployment](./deployment.md)** - Deploy secure applications
- **[HTTP Servers](./http-servers.md)** - Build secure APIs

---

## Summary

**Authentication in Elide:**

- ✅ **JWT**: Stateless token-based auth
- ✅ **Sessions**: Traditional session management
- ✅ **API Keys**: Service-to-service auth
- ✅ **RBAC**: Role-based access control
- ✅ **Password Hashing**: Secure password storage
- ✅ **Security**: Rate limiting, validation, secure headers

**Best Practices:**
1. Use JWT for APIs
2. Use sessions for web apps
3. Always hash passwords (PBKDF2, bcrypt, argon2)
4. Implement rate limiting
5. Validate all inputs
6. Use security headers
7. Implement RBAC for permissions

🚀 **Build secure authentication into your Elide applications!**
