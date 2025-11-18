/**
 * JSON Web Token (JWT) - Secure Token-Based Authentication for Elide
 *
 * Create and verify JSON Web Tokens for authentication, authorization, and
 * secure information exchange. Industry standard for stateless authentication.
 *
 * Features:
 * - JWT sign and verify (HS256 algorithm)
 * - Custom claims and payload
 * - Expiration validation
 * - Audience and issuer validation
 * - Decode without verification
 *
 * Polyglot Benefits:
 * - ONE JWT implementation for ALL languages
 * - Consistent token format across services
 * - Same security guarantees everywhere
 * - Simplified token validation
 *
 * Use cases:
 * - API authentication
 * - Single sign-on (SSO)
 * - Stateless sessions
 * - Microservice authorization
 * - Mobile app authentication
 *
 * Package has ~30M+ downloads/week on npm!
 */

interface JWTPayload {
  /** Subject (user ID) */
  sub?: string;
  /** Issued at (timestamp) */
  iat?: number;
  /** Expiration time (timestamp) */
  exp?: number;
  /** Issuer */
  iss?: string;
  /** Audience */
  aud?: string | string[];
  /** JWT ID */
  jti?: string;
  /** Custom claims */
  [key: string]: any;
}

interface SignOptions {
  /** Expiration time (seconds from now or date string) */
  expiresIn?: number | string;
  /** Issuer */
  issuer?: string;
  /** Audience */
  audience?: string | string[];
  /** Subject */
  subject?: string;
  /** JWT ID */
  jwtid?: string;
}

interface VerifyOptions {
  /** Expected issuer */
  issuer?: string;
  /** Expected audience */
  audience?: string | string[];
  /** Clock tolerance in seconds */
  clockTolerance?: number;
  /** Ignore expiration */
  ignoreExpiration?: boolean;
}

class JsonWebTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JsonWebTokenError';
  }
}

class TokenExpiredError extends JsonWebTokenError {
  expiredAt: Date;

  constructor(message: string, expiredAt: Date) {
    super(message);
    this.name = 'TokenExpiredError';
    this.expiredAt = expiredAt;
  }
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Parse expiration time
 */
function parseExpiration(expiresIn: number | string): number {
  if (typeof expiresIn === 'number') {
    return Math.floor(Date.now() / 1000) + expiresIn;
  }

  // Parse strings like "1h", "30m", "7d"
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expiresIn format');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
  };

  return Math.floor(Date.now() / 1000) + (value * multipliers[unit]);
}

/**
 * Sign a JWT
 */
async function sign(payload: any, secret: string, options: SignOptions = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const claims: JWTPayload = {
    ...payload,
    iat: now
  };

  if (options.expiresIn) {
    claims.exp = parseExpiration(options.expiresIn);
  }

  if (options.issuer) {
    claims.iss = options.issuer;
  }

  if (options.audience) {
    claims.aud = options.audience;
  }

  if (options.subject) {
    claims.sub = options.subject;
  }

  if (options.jwtid) {
    claims.jti = options.jwtid;
  }

  const header = { alg: 'HS256', typ: 'JWT' };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));

  const message = `${encodedHeader}.${encodedPayload}`;

  // Sign with HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );

  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${message}.${encodedSignature}`;
}

/**
 * Verify a JWT
 */
async function verify(token: string, secret: string, options: VerifyOptions = {}): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new JsonWebTokenError('Invalid token format');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  // Verify signature
  const message = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = Uint8Array.from(
    base64UrlDecode(encodedSignature),
    c => c.charCodeAt(0)
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    encoder.encode(message)
  );

  if (!isValid) {
    throw new JsonWebTokenError('Invalid signature');
  }

  // Decode payload
  const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));

  // Validate expiration
  if (!options.ignoreExpiration && payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    const clockTolerance = options.clockTolerance ?? 0;

    if (now > payload.exp + clockTolerance) {
      throw new TokenExpiredError(
        'JWT expired',
        new Date(payload.exp * 1000)
      );
    }
  }

  // Validate issuer
  if (options.issuer && payload.iss !== options.issuer) {
    throw new JsonWebTokenError(`Invalid issuer. Expected ${options.issuer}`);
  }

  // Validate audience
  if (options.audience) {
    const expectedAudiences = Array.isArray(options.audience)
      ? options.audience
      : [options.audience];

    const tokenAudiences = Array.isArray(payload.aud)
      ? payload.aud
      : [payload.aud];

    const hasMatch = expectedAudiences.some(exp =>
      tokenAudiences.includes(exp)
    );

    if (!hasMatch) {
      throw new JsonWebTokenError('Invalid audience');
    }
  }

  return payload;
}

/**
 * Decode JWT without verification
 */
function decode(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

// Exports
export default { sign, verify, decode };
export { sign, verify, decode, JsonWebTokenError, TokenExpiredError };
export type { JWTPayload, SignOptions, VerifyOptions };

// CLI Demo
if (import.meta.url.includes("elide-jsonwebtoken.ts")) {
  console.log("🔐 JSON Web Token (JWT) - Secure Authentication for Elide\n");

  const SECRET = "mySecretKey123!";

  console.log("=== Example 1: Basic JWT Signing ===");
  const token1 = await sign({ userId: "user123", role: "admin" }, SECRET);
  console.log("Token:", token1);
  console.log("Length:", token1.length, "chars");
  console.log();

  console.log("=== Example 2: JWT Verification ===");
  const payload1 = await verify(token1, SECRET);
  console.log("Payload:", payload1);
  console.log();

  console.log("=== Example 3: Token with Expiration ===");
  const token2 = await sign(
    { userId: "user456" },
    SECRET,
    { expiresIn: "1h" }
  );
  console.log("Token (expires in 1 hour):", token2.substring(0, 50), "...");

  const payload2 = await verify(token2, SECRET);
  console.log("Expires at:", new Date(payload2.exp! * 1000).toISOString());
  console.log();

  console.log("=== Example 4: Token with Claims ===");
  const token3 = await sign(
    { userId: "user789", email: "user@example.com" },
    SECRET,
    {
      expiresIn: "7d",
      issuer: "my-app",
      audience: "my-api",
      subject: "user789"
    }
  );
  console.log("Token with claims:", token3.substring(0, 50), "...");

  const payload3 = await verify(token3, SECRET, {
    issuer: "my-app",
    audience: "my-api"
  });
  console.log("Verified payload:", payload3);
  console.log();

  console.log("=== Example 5: Decode Without Verification ===");
  const decoded = decode(token1);
  console.log("Decoded (no verification):", decoded);
  console.log();

  console.log("=== Example 6: Invalid Signature ===");
  try {
    await verify(token1, "wrongSecret");
  } catch (error) {
    console.log("Error:", (error as Error).message);
  }
  console.log();

  console.log("=== Example 7: Expired Token ===");
  const expiredToken = await sign(
    { userId: "user999" },
    SECRET,
    { expiresIn: -60 } // Already expired
  );

  try {
    await verify(expiredToken, SECRET);
  } catch (error) {
    console.log("Error:", (error as Error).message);
    if (error instanceof TokenExpiredError) {
      console.log("Expired at:", error.expiredAt.toISOString());
    }
  }
  console.log();

  console.log("=== Example 8: User Authentication Flow ===");
  interface User {
    id: string;
    username: string;
    email: string;
    role: string;
  }

  function createAuthToken(user: User): Promise<string> {
    return sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      SECRET,
      {
        expiresIn: "24h",
        issuer: "auth-service",
        subject: user.id
      }
    );
  }

  const user: User = {
    id: "u123",
    username: "alice",
    email: "alice@example.com",
    role: "admin"
  };

  const authToken = await createAuthToken(user);
  console.log("Auth token created:", authToken.substring(0, 50), "...");

  const authPayload = await verify(authToken, SECRET, {
    issuer: "auth-service"
  });
  console.log("Authenticated user:", authPayload.username);
  console.log("Role:", authPayload.role);
  console.log();

  console.log("=== Example 9: API Access Tokens ===");
  function createAccessToken(userId: string, scopes: string[]): Promise<string> {
    return sign(
      { userId, scopes },
      SECRET,
      { expiresIn: "15m" }
    );
  }

  function createRefreshToken(userId: string): Promise<string> {
    return sign(
      { userId, type: "refresh" },
      SECRET,
      { expiresIn: "30d" }
    );
  }

  const accessToken = await createAccessToken("u456", ["read", "write"]);
  const refreshToken = await createRefreshToken("u456");

  console.log("Access token (15m):", accessToken.substring(0, 40), "...");
  console.log("Refresh token (30d):", refreshToken.substring(0, 40), "...");
  console.log();

  console.log("=== Example 10: Multi-Audience Tokens ===");
  const multiToken = await sign(
    { userId: "u789" },
    SECRET,
    {
      audience: ["api-gateway", "user-service", "billing-service"],
      expiresIn: "1h"
    }
  );

  console.log("Multi-audience token created");

  // Verify for different audiences
  for (const aud of ["api-gateway", "user-service", "billing-service"]) {
    const p = await verify(multiToken, SECRET, { audience: aud });
    console.log(`  ✓ Valid for ${aud}`);
  }
  console.log();

  console.log("✅ Use Cases:");
  console.log("- API authentication and authorization");
  console.log("- Single sign-on (SSO)");
  console.log("- Stateless session management");
  console.log("- Microservice authentication");
  console.log("- Mobile app authentication");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Polyglot: Works in TypeScript, Python, Ruby, Java");
  console.log("- Zero dependencies");
  console.log("- ~30M+ downloads/week on npm");
  console.log("- Industry standard (RFC 7519)");
  console.log();

  console.log("🔒 Security:");
  console.log("- HMAC-SHA256 signing");
  console.log("- Expiration validation");
  console.log("- Issuer and audience validation");
  console.log("- Signature verification");
  console.log("- Stateless authentication");
}
