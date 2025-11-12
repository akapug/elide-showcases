# Security Best Practices for Elide

**Comprehensive security guide for building secure Elide applications**

Learn how to secure your applications against common vulnerabilities, implement defense-in-depth, and follow security best practices.

---

## Table of Contents

- [Security Principles](#security-principles)
- [Input Validation](#input-validation)
- [Authentication Security](#authentication-security)
- [Authorization](#authorization)
- [Data Protection](#data-protection)
- [HTTP Security Headers](#http-security-headers)
- [Rate Limiting](#rate-limiting)
- [Common Vulnerabilities](#common-vulnerabilities)
- [Security Checklist](#security-checklist)

---

## Security Principles

### Defense in Depth

Implement multiple layers of security:

1. **Network Layer**: Firewalls, TLS/SSL
2. **Application Layer**: Authentication, authorization
3. **Data Layer**: Encryption, access controls
4. **Monitoring**: Logging, intrusion detection

### Security by Design

- **Least Privilege**: Grant minimum necessary permissions
- **Fail Secure**: Default to deny access
- **Defense in Depth**: Multiple security layers
- **Separation of Concerns**: Isolate sensitive operations
- **Audit Trail**: Log security-relevant events

---

## Input Validation

### Validation Functions

```typescript
// validators.ts
export class Validator {
  /**
   * Validate email format
   */
  static email(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL
   */
  static url(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate UUID
   */
  static uuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate integer
   */
  static integer(value: any): boolean {
    return Number.isInteger(Number(value));
  }

  /**
   * Validate range
   */
  static range(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Validate length
   */
  static length(str: string, min: number, max: number): boolean {
    return str.length >= min && str.length <= max;
  }

  /**
   * Validate alphanumeric
   */
  static alphanumeric(str: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(str);
  }
}

// Usage
if (!Validator.email(email)) {
  throw new Error("Invalid email format");
}

if (!Validator.range(age, 0, 150)) {
  throw new Error("Invalid age");
}
```

### Sanitization

```typescript
// sanitizer.ts
export class Sanitizer {
  /**
   * Escape HTML to prevent XSS
   */
  static escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Remove HTML tags
   */
  static stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, "");
  }

  /**
   * Sanitize SQL input (use parameterized queries instead!)
   */
  static escapeSql(str: string): string {
    return str.replace(/'/g, "''");
  }

  /**
   * Sanitize file path
   */
  static sanitizePath(path: string): string {
    // Remove directory traversal attempts
    return path.replace(/\.\./g, "").replace(/\\/g, "/");
  }

  /**
   * Whitelist characters
   */
  static whitelist(str: string, allowed: string): string {
    const regex = new RegExp(`[^${allowed}]`, "g");
    return str.replace(regex, "");
  }
}

// Usage
const userInput = "<script>alert('XSS')</script>";
const safe = Sanitizer.escapeHtml(userInput);
// Output: "&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;&#x2F;script&gt;"
```

### Request Validation

```typescript
// request-validator.ts
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "email" | "url";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export class RequestValidator {
  validate(data: any, rules: ValidationRule[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = data[rule.field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip if optional and not provided
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case "email":
            if (!Validator.email(value)) {
              errors.push(`${rule.field} must be a valid email`);
            }
            break;
          case "url":
            if (!Validator.url(value)) {
              errors.push(`${rule.field} must be a valid URL`);
            }
            break;
          case "number":
            if (!Validator.integer(value)) {
              errors.push(`${rule.field} must be a number`);
            }
            break;
        }
      }

      // Length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
      }

      // Range validation
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${rule.field} must be at least ${rule.min}`);
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${rule.field} must be at most ${rule.max}`);
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${rule.field} format is invalid`);
      }

      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push(`${rule.field} validation failed`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Usage
const validator = new RequestValidator();

export default async function fetch(req: Request): Promise<Response> {
  if (req.method === "POST" && req.url.includes("/users")) {
    const data = await req.json();

    const validation = validator.validate(data, [
      { field: "email", required: true, type: "email" },
      { field: "name", required: true, minLength: 2, maxLength: 50 },
      { field: "age", type: "number", min: 0, max: 150 },
      { field: "username", required: true, pattern: /^[a-zA-Z0-9_]{3,20}$/ }
    ]);

    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: "Validation failed",
        details: validation.errors
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Process valid data
    return new Response(JSON.stringify({ success: true }));
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## Authentication Security

### Secure Password Hashing

```typescript
// password-security.ts
import { pbkdf2, randomBytes } from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(pbkdf2);

export class PasswordSecurity {
  private iterations = 100000;
  private keyLength = 64;
  private digest = "sha512";

  /**
   * Hash password securely
   */
  async hash(password: string): Promise<string> {
    // Generate salt
    const salt = randomBytes(16).toString("hex");

    // Hash password
    const hash = await pbkdf2Async(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest
    );

    // Return salt:hash
    return `${salt}:${hash.toString("hex")}`;
  }

  /**
   * Verify password
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

    // Constant-time comparison to prevent timing attacks
    return this.constantTimeCompare(hash, verifyHash.toString("hex"));
  }

  /**
   * Constant-time string comparison
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Validate password strength
   */
  validateStrength(password: string): { strong: boolean; issues: string[] } {
    const issues: string[] = [];

    if (password.length < 8) {
      issues.push("Password must be at least 8 characters");
    }

    if (!/[a-z]/.test(password)) {
      issues.push("Password must contain lowercase letters");
    }

    if (!/[A-Z]/.test(password)) {
      issues.push("Password must contain uppercase letters");
    }

    if (!/[0-9]/.test(password)) {
      issues.push("Password must contain numbers");
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      issues.push("Password must contain special characters");
    }

    return {
      strong: issues.length === 0,
      issues
    };
  }
}
```

### JWT Security

```typescript
// jwt-security.ts
import { createHmac, randomBytes } from "crypto";

export class SecureJWT {
  private secret: string;
  private algorithm = "HS256";

  constructor(secret?: string) {
    if (!secret || secret.length < 32) {
      throw new Error("JWT secret must be at least 32 characters");
    }
    this.secret = secret;
  }

  /**
   * Sign JWT with additional security
   */
  sign(payload: any, expiresIn: number = 3600): string {
    const now = Math.floor(Date.now() / 1000);

    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      jti: randomBytes(16).toString("hex")  // Unique token ID
    };

    const header = { alg: this.algorithm, typ: "JWT" };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));

    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify JWT with security checks
   */
  verify(token: string): any | null {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split(".");

      // Verify signature
      const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
      if (!this.constantTimeCompare(signature, expectedSignature)) {
        return null;
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null;
      }

      // Check not-before
      if (payload.nbf && payload.nbf > now) {
        return null;
      }

      return payload;

    } catch (error) {
      return null;
    }
  }

  private createSignature(data: string): string {
    const hmac = createHmac("sha256", this.secret);
    hmac.update(data);
    return this.base64UrlEncode(hmac.digest("base64"));
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

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}
```

---

## Authorization

### Role-Based Access Control (RBAC)

```typescript
// rbac-security.ts
export type Permission =
  | "users.read"
  | "users.write"
  | "users.delete"
  | "posts.read"
  | "posts.write"
  | "posts.delete"
  | "admin";

export type Role = "admin" | "moderator" | "user" | "guest";

const rolePermissions: Record<Role, Permission[]> = {
  admin: ["admin", "users.read", "users.write", "users.delete", "posts.read", "posts.write", "posts.delete"],
  moderator: ["users.read", "posts.read", "posts.write", "posts.delete"],
  user: ["users.read", "posts.read", "posts.write"],
  guest: ["posts.read"]
};

export class AccessControl {
  hasPermission(role: Role, permission: Permission): boolean {
    return rolePermissions[role].includes(permission);
  }

  requirePermission(permission: Permission) {
    return async (req: Request): Promise<Response | null> => {
      const user = (req as any).user;

      if (!user) {
        return new Response(JSON.stringify({
          error: "Authentication required"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (!this.hasPermission(user.role, permission)) {
        return new Response(JSON.stringify({
          error: "Insufficient permissions",
          required: permission
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      return null;
    };
  }

  requireAnyPermission(permissions: Permission[]) {
    return async (req: Request): Promise<Response | null> => {
      const user = (req as any).user;

      if (!user) {
        return new Response(JSON.stringify({
          error: "Authentication required"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const hasAny = permissions.some(p => this.hasPermission(user.role, p));

      if (!hasAny) {
        return new Response(JSON.stringify({
          error: "Insufficient permissions",
          required: permissions
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      return null;
    };
  }
}
```

---

## Data Protection

### Encryption

```typescript
// encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

export class Encryption {
  private algorithm = "aes-256-gcm";
  private keyLength = 32;

  /**
   * Derive encryption key from password
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return scryptSync(password, salt, this.keyLength);
  }

  /**
   * Encrypt data
   */
  encrypt(data: string, password: string): string {
    // Generate salt and IV
    const salt = randomBytes(16);
    const iv = randomBytes(16);

    // Derive key
    const key = this.deriveKey(password, salt);

    // Create cipher
    const cipher = createCipheriv(this.algorithm, key, iv);

    // Encrypt
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine salt + iv + authTag + encrypted
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, "hex")
    ]);

    return combined.toString("base64");
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: string, password: string): string {
    // Decode
    const combined = Buffer.from(encryptedData, "base64");

    // Extract components
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 32);
    const authTag = combined.slice(32, 48);
    const encrypted = combined.slice(48);

    // Derive key
    const key = this.deriveKey(password, salt);

    // Create decipher
    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  }
}
```

---

## HTTP Security Headers

### Security Headers Middleware

```typescript
// security-headers.ts
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  hsts?: boolean;
  hstsMaxAge?: number;
  frameOptions?: "DENY" | "SAMEORIGIN";
  xssProtection?: boolean;
  nosniff?: boolean;
  referrerPolicy?: string;
}

export function securityHeaders(config: SecurityHeadersConfig = {}) {
  const headers: Record<string, string> = {};

  // Content Security Policy
  if (config.contentSecurityPolicy !== false) {
    headers["Content-Security-Policy"] = config.contentSecurityPolicy || "default-src 'self'";
  }

  // HTTP Strict Transport Security
  if (config.hsts !== false) {
    const maxAge = config.hstsMaxAge || 31536000;  // 1 year
    headers["Strict-Transport-Security"] = `max-age=${maxAge}; includeSubDomains`;
  }

  // X-Frame-Options
  if (config.frameOptions !== undefined) {
    headers["X-Frame-Options"] = config.frameOptions;
  } else {
    headers["X-Frame-Options"] = "DENY";
  }

  // X-XSS-Protection
  if (config.xssProtection !== false) {
    headers["X-XSS-Protection"] = "1; mode=block";
  }

  // X-Content-Type-Options
  if (config.nosniff !== false) {
    headers["X-Content-Type-Options"] = "nosniff";
  }

  // Referrer-Policy
  if (config.referrerPolicy) {
    headers["Referrer-Policy"] = config.referrerPolicy;
  }

  return (response: Response): Response => {
    const newHeaders = new Headers(response.headers);

    for (const [key, value] of Object.entries(headers)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  };
}

// Usage
const addSecurityHeaders = securityHeaders({
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'",
  hsts: true,
  hstsMaxAge: 31536000,
  frameOptions: "DENY"
});

export default async function fetch(req: Request): Promise<Response> {
  const response = await handleRequest(req);
  return addSecurityHeaders(response);
}
```

---

## Rate Limiting

### Advanced Rate Limiter

```typescript
// rate-limiter.ts
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  check(req: Request): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(req)
      : this.getDefaultKey(req);

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests
    const requestTimes = this.requests.get(key) || [];

    // Remove old requests
    const validRequests = requestTimes.filter(time => time > windowStart);

    // Check limit
    const allowed = validRequests.length < this.config.maxRequests;

    if (allowed) {
      validRequests.push(now);
      this.requests.set(key, validRequests);
    }

    const remaining = Math.max(0, this.config.maxRequests - validRequests.length);
    const resetTime = validRequests.length > 0
      ? validRequests[0] + this.config.windowMs
      : now + this.config.windowMs;

    return { allowed, remaining, resetTime };
  }

  private getDefaultKey(req: Request): string {
    // Use IP address as key
    return req.headers.get("x-forwarded-for") ||
           req.headers.get("x-real-ip") ||
           "unknown";
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, times] of this.requests.entries()) {
      const validTimes = times.filter(t => t > windowStart);

      if (validTimes.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimes);
      }
    }
  }
}

// Usage
const rateLimiter = new RateLimiter({
  windowMs: 60000,  // 1 minute
  maxRequests: 100,
  keyGenerator: (req) => {
    // Custom key: IP + User ID if authenticated
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userId = (req as any).user?.id || "anonymous";
    return `${ip}:${userId}`;
  }
});

export default async function fetch(req: Request): Promise<Response> {
  const { allowed, remaining, resetTime } = rateLimiter.check(req);

  if (!allowed) {
    return new Response(JSON.stringify({
      error: "Rate limit exceeded",
      resetTime: new Date(resetTime).toISOString()
    }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(100),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(resetTime),
        "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000))
      }
    });
  }

  const response = await handleRequest(req);

  // Add rate limit headers
  const headers = new Headers(response.headers);
  headers.set("X-RateLimit-Limit", String(100));
  headers.set("X-RateLimit-Remaining", String(remaining));
  headers.set("X-RateLimit-Reset", String(resetTime));

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
```

---

## Common Vulnerabilities

### 1. SQL Injection (Prevention)

```typescript
// ❌ NEVER do this
const userId = req.query.get("id");
const sql = `SELECT * FROM users WHERE id = '${userId}'`;  // VULNERABLE!

// ✅ Use parameterized queries
const userId = req.query.get("id");
const result = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
```

### 2. XSS Prevention

```typescript
// ❌ Vulnerable to XSS
const userInput = await req.text();
return new Response(`<div>${userInput}</div>`);  // VULNERABLE!

// ✅ Escape HTML
const userInput = await req.text();
const safe = Sanitizer.escapeHtml(userInput);
return new Response(`<div>${safe}</div>`);
```

### 3. CSRF Protection

```typescript
// csrf-protection.ts
export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

export function validateCSRFToken(req: Request, expectedToken: string): boolean {
  const token = req.headers.get("X-CSRF-Token");
  return token === expectedToken;
}

// Usage in form
export default async function fetch(req: Request): Promise<Response> {
  if (req.method === "POST") {
    const csrfToken = req.headers.get("X-CSRF-Token");
    const sessionToken = (req as any).session?.csrfToken;

    if (!csrfToken || csrfToken !== sessionToken) {
      return new Response("Invalid CSRF token", { status: 403 });
    }

    // Process request
  }
}
```

---

## Security Checklist

### Application Security

- ✅ Input validation on all user input
- ✅ Output encoding/escaping
- ✅ Parameterized queries (no SQL injection)
- ✅ CSRF protection
- ✅ XSS prevention
- ✅ Secure password hashing (PBKDF2/bcrypt/argon2)
- ✅ JWT with strong secrets (>32 chars)
- ✅ Rate limiting
- ✅ Security headers
- ✅ HTTPS only (in production)

### Authentication

- ✅ Strong password policy
- ✅ Secure password storage
- ✅ Account lockout after failed attempts
- ✅ Multi-factor authentication (MFA)
- ✅ Secure session management
- ✅ Token expiration
- ✅ Secure password reset flow

### Authorization

- ✅ Principle of least privilege
- ✅ Role-based access control
- ✅ Resource-level permissions
- ✅ Authorization checks on every request
- ✅ Secure direct object references

### Data Protection

- ✅ Encryption at rest
- ✅ Encryption in transit (TLS)
- ✅ Secure key management
- ✅ Data minimization
- ✅ Secure backups

### Infrastructure

- ✅ Regular security updates
- ✅ Firewall configuration
- ✅ DDoS protection
- ✅ Intrusion detection
- ✅ Security monitoring
- ✅ Incident response plan

---

## Next Steps

- **[Authentication](./authentication.md)** - Implement auth securely
- **[Testing](./testing.md)** - Security testing
- **[Deployment](./deployment.md)** - Secure deployment
- **[Troubleshooting](./troubleshooting.md)** - Security issues

---

## Summary

**Security Essentials:**

- ✅ **Validate all inputs**: Never trust user data
- ✅ **Escape outputs**: Prevent XSS
- ✅ **Use HTTPS**: Encrypt in transit
- ✅ **Hash passwords**: PBKDF2/bcrypt/argon2
- ✅ **Rate limiting**: Prevent abuse
- ✅ **Security headers**: Defense in depth
- ✅ **Least privilege**: Minimal permissions
- ✅ **Regular updates**: Stay secure

**Remember:**
- Security is a process, not a product
- Assume breach - plan for it
- Defense in depth - multiple layers
- Security by design - not an afterthought

🔒 **Build secure applications from the ground up!**
