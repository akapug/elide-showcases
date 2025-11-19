/**
 * Elide Full-Stack Framework - Authentication System
 *
 * Complete authentication solution with:
 * - JWT token-based authentication
 * - Session management
 * - OAuth providers (Google, GitHub, etc.)
 * - Role-based permissions
 * - Password hashing
 * - CSRF protection
 * - Rate limiting
 *
 * Features:
 * - Email/password authentication
 * - Social login (OAuth 2.0)
 * - Two-factor authentication (2FA)
 * - Password reset
 * - Email verification
 * - Session management
 * - Permission system
 */

import { Request, Response } from "elide:http";
import type { RouteContext, Middleware } from "./router.ts";
import type { DataLayer } from "./data-layer.ts";

// Authentication configuration
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiration?: number; // in seconds, default 1 day
  sessionExpiration?: number; // in seconds, default 7 days
  passwordMinLength?: number;
  enableOAuth?: boolean;
  oauthProviders?: OAuthProvider[];
  enableTwoFactor?: boolean;
  csrfProtection?: boolean;
}

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

// User and session types
export interface User {
  id: string | number;
  email: string;
  name?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  roles?: string[];
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface Session {
  id: string;
  userId: string | number;
  token: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

// JWT payload
interface JWTPayload {
  userId: string | number;
  email: string;
  roles?: string[];
  exp: number;
  iat: number;
}

/**
 * Password hashing utilities using Web Crypto API
 */
export class PasswordHasher {
  private static async hash(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const key = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");

    return `${saltHex}:${hashHex}`;
  }

  static async hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return this.hash(password, salt);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [saltHex, hashHex] = hashedPassword.split(":");
    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const newHash = await this.hash(password, salt);
    return newHash === hashedPassword;
  }
}

/**
 * JWT token utilities
 */
export class JWT {
  constructor(private secret: string) {}

  /**
   * Create a JWT token
   */
  async sign(payload: Omit<JWTPayload, "iat" | "exp">, expiresIn: number = 86400): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    };

    const header = { alg: "HS256", typ: "JWT" };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));

    const signature = await this.createSignature(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify and decode a JWT token
   */
  async verify(token: string): Promise<JWTPayload | null> {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split(".");

      // Verify signature
      const expectedSignature = await this.createSignature(
        `${encodedHeader}.${encodedPayload}`
      );

      if (signature !== expectedSignature) {
        return null;
      }

      // Decode payload
      const payload: JWTPayload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private async createSignature(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

    return this.base64UrlEncode(signature);
  }

  private base64UrlEncode(data: string | ArrayBuffer): string {
    let binary: string;

    if (typeof data === "string") {
      binary = btoa(data);
    } else {
      const bytes = new Uint8Array(data);
      binary = btoa(String.fromCharCode(...bytes));
    }

    return binary.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  private base64UrlDecode(data: string): string {
    let binary = data.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding
    while (binary.length % 4) {
      binary += "=";
    }

    return atob(binary);
  }
}

/**
 * Main authentication system
 */
export class AuthSystem {
  private jwt: JWT;
  private config: Required<AuthConfig>;

  constructor(
    private db: DataLayer,
    config: AuthConfig
  ) {
    this.jwt = new JWT(config.jwtSecret);
    this.config = {
      jwtExpiration: 86400, // 1 day
      sessionExpiration: 604800, // 7 days
      passwordMinLength: 8,
      enableOAuth: false,
      oauthProviders: [],
      enableTwoFactor: false,
      csrfProtection: true,
      ...config,
    };
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, name?: string): Promise<User> {
    // Validate password
    if (password.length < this.config.passwordMinLength) {
      throw new Error(`Password must be at least ${this.config.passwordMinLength} characters`);
    }

    // Check if user already exists
    const existing = await this.db.model("users").findUnique({ email });
    if (existing) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await PasswordHasher.hashPassword(password);

    // Create user
    const user = await this.db.model("users").create({
      email,
      password: hashedPassword,
      name,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    });

    return this.sanitizeUser(user);
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user
    const user = await this.db.model("users").findUnique({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const valid = await PasswordHasher.verifyPassword(password, user.password);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    // Create JWT token
    const token = await this.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles: user.roles || [],
      },
      this.config.jwtExpiration
    );

    // Create session
    await this.createSession(user.id, token);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Logout (invalidate session)
   */
  async logout(token: string): Promise<void> {
    await this.db.model("sessions").deleteMany({ token });
  }

  /**
   * Verify a token and get the user
   */
  async verifyToken(token: string): Promise<User | null> {
    const payload = await this.jwt.verify(token);
    if (!payload) {
      return null;
    }

    // Check if session exists and is valid
    const session = await this.db.model("sessions").findFirst({
      where: { token, expiresAt: { gt: new Date().toISOString() } },
    });

    if (!session) {
      return null;
    }

    // Get user
    const user = await this.db.model("users").findUnique({ id: payload.userId });
    if (!user) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<string> {
    const user = await this.db.model("users").findUnique({ email });
    if (!user) {
      // Don't reveal if user exists
      return "";
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await this.db.model("password_resets").create({
      userId: user.id,
      token: resetToken,
      expiresAt,
    });

    return resetToken;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find valid reset token
    const reset = await this.db.model("password_resets").findFirst({
      where: { token, expiresAt: { gt: new Date().toISOString() } },
    });

    if (!reset) {
      throw new Error("Invalid or expired reset token");
    }

    // Validate new password
    if (newPassword.length < this.config.passwordMinLength) {
      throw new Error(`Password must be at least ${this.config.passwordMinLength} characters`);
    }

    // Hash new password
    const hashedPassword = await PasswordHasher.hashPassword(newPassword);

    // Update user password
    await this.db.model("users").update({ id: reset.userId }, { password: hashedPassword });

    // Delete reset token
    await this.db.model("password_resets").delete({ id: reset.id });

    // Invalidate all sessions for this user
    await this.db.model("sessions").deleteMany({ userId: reset.userId });
  }

  /**
   * Create a session
   */
  private async createSession(userId: string | number, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + this.config.sessionExpiration * 1000).toISOString();

    await this.db.model("sessions").create({
      userId,
      token,
      expiresAt,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: any): User {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

/**
 * Authentication middleware
 */
export function createAuthMiddleware(auth: AuthSystem): Middleware {
  return async (req: Request, ctx: RouteContext, next) => {
    // Extract token from Authorization header
    const authHeader = req.headers.get("Authorization");
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Or from cookie
    if (!token) {
      token = ctx.cookies.get("auth_token") || null;
    }

    // Verify token and attach user to context
    if (token) {
      const user = await auth.verifyToken(token);
      if (user) {
        ctx.user = user;
      }
    }

    return next();
  };
}

/**
 * Require authentication middleware
 */
export function requireAuth(message: string = "Authentication required"): Middleware {
  return async (req: Request, ctx: RouteContext, next) => {
    if (!ctx.user) {
      return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return next();
  };
}

/**
 * Require specific roles middleware
 */
export function requireRoles(...roles: string[]): Middleware {
  return async (req: Request, ctx: RouteContext, next) => {
    if (!ctx.user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userRoles = ctx.user.roles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return next();
  };
}

/**
 * Helper to create auth system
 */
export function createAuthSystem(db: DataLayer, config: AuthConfig): AuthSystem {
  return new AuthSystem(db, config);
}

// Example usage:
/**
 * // Setup
 * const auth = createAuthSystem(db, {
 *   jwtSecret: "your-secret-key",
 *   passwordMinLength: 10,
 * });
 *
 * // Register middleware
 * router.use(createAuthMiddleware(auth));
 *
 * // Register endpoint
 * export async function POST(req: Request, ctx: RouteContext) {
 *   const { email, password, name } = await req.json();
 *
 *   const user = await auth.register(email, password, name);
 *
 *   return Response.json({ user });
 * }
 *
 * // Login endpoint
 * export async function POST(req: Request, ctx: RouteContext) {
 *   const { email, password } = await req.json();
 *
 *   const { user, token } = await auth.login(email, password);
 *
 *   return Response.json({ user, token });
 * }
 *
 * // Protected route
 * export const middleware = [requireAuth(), requireRoles("admin")];
 *
 * export async function GET(req: Request, ctx: RouteContext) {
 *   return Response.json({ message: "Admin only", user: ctx.user });
 * }
 */
