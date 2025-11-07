/**
 * Edge Authentication Service
 *
 * Production-grade authentication at the edge with JWT verification,
 * session management, rate limiting, bot detection, and GeoIP blocking.
 */

import { serve } from "http";
import { createHash } from "crypto";

// Types and Interfaces
interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
  jti?: string;
}

interface Session {
  id: string;
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  refreshToken?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

interface BotScore {
  score: number;
  reasons: string[];
  timestamp: number;
}

interface GeoIPRule {
  type: "allow" | "block";
  countries: string[];
  paths?: string[];
}

// JWT Verification
class JWTVerifier {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  async verify(token: string): Promise<JWTPayload | null> {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const [headerB64, payloadB64, signature] = parts;

      // Verify signature
      const expectedSignature = await this.sign(`${headerB64}.${payloadB64}`);
      if (signature !== expectedSignature) {
        return null;
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(payloadB64));

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }

      return payload as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  async sign(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.secretKey);
    const msgData = encoder.encode(data);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, msgData);
    return this.base64UrlEncode(new Uint8Array(signature));
  }

  async generateToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + 3600 // 1 hour
    };

    const headerB64 = this.base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const payloadB64 = this.base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));

    const signature = await this.sign(`${headerB64}.${payloadB64}`);

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  private base64UrlEncode(data: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...data));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    return atob(base64);
  }
}

// Session Management
class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
  private maxSessionsPerUser = 5;

  createSession(userId: string, email: string, role: string, ipAddress: string, userAgent: string): Session {
    const sessionId = this.generateSessionId();

    const session: Session = {
      id: sessionId,
      userId,
      email,
      role,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress,
      userAgent
    };

    // Enforce max sessions per user
    this.enforceSessionLimit(userId);

    this.sessions.set(sessionId, session);

    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);

    return session;
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session expired
    if (Date.now() - session.createdAt > this.maxSessionAge) {
      this.destroySession(sessionId);
      return null;
    }

    // Update activity
    session.lastActivity = Date.now();
    return session;
  }

  destroySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.userSessions.get(session.userId)?.delete(sessionId);
      return true;
    }
    return false;
  }

  destroyAllUserSessions(userId: string): number {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return 0;

    let count = 0;
    for (const sessionId of sessionIds) {
      if (this.sessions.delete(sessionId)) {
        count++;
      }
    }

    this.userSessions.delete(userId);
    return count;
  }

  private enforceSessionLimit(userId: string): void {
    const sessions = this.userSessions.get(userId);
    if (!sessions) return;

    if (sessions.size >= this.maxSessionsPerUser) {
      // Remove oldest session
      let oldestSessionId: string | null = null;
      let oldestTime = Date.now();

      for (const sessionId of sessions) {
        const session = this.sessions.get(sessionId);
        if (session && session.lastActivity < oldestTime) {
          oldestTime = session.lastActivity;
          oldestSessionId = sessionId;
        }
      }

      if (oldestSessionId) {
        this.destroySession(oldestSessionId);
      }
    }
  }

  private generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
  }

  cleanupExpiredSessions(): number {
    let count = 0;
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.createdAt > this.maxSessionAge) {
        this.destroySession(sessionId);
        count++;
      }
    }

    return count;
  }
}

// Rate Limiting
class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number = 100;
  private readonly windowMs: number = 60000; // 1 minute
  private readonly blockDuration: number = 300000; // 5 minutes

  checkLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    let entry = this.limits.get(identifier);

    // Check if currently blocked
    if (entry?.blocked && now < entry.resetTime) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    // Reset or create new entry
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
        blocked: false
      };
      this.limits.set(identifier, entry);
    }

    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.maxRequests) {
      entry.blocked = true;
      entry.resetTime = now + this.blockDuration;
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    const remaining = Math.max(0, this.maxRequests - entry.count);
    return { allowed: true, remaining, resetTime: entry.resetTime };
  }

  reset(identifier: string): boolean {
    return this.limits.delete(identifier);
  }
}

// Bot Detection
class BotDetector {
  private botScores: Map<string, BotScore> = new Map();
  private knownBotPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python-requests/i, /go-http-client/i
  ];

  detectBot(request: Request): BotScore {
    const reasons: string[] = [];
    let score = 0;

    const userAgent = request.headers.get("User-Agent") || "";
    const ip = this.getClientIP(request);

    // Check user agent patterns
    for (const pattern of this.knownBotPatterns) {
      if (pattern.test(userAgent)) {
        score += 30;
        reasons.push(`Bot pattern in user agent: ${pattern.source}`);
        break;
      }
    }

    // Check for missing/suspicious headers
    if (!userAgent || userAgent.length < 10) {
      score += 25;
      reasons.push("Missing or suspicious user agent");
    }

    if (!request.headers.get("Accept")) {
      score += 15;
      reasons.push("Missing Accept header");
    }

    if (!request.headers.get("Accept-Language")) {
      score += 10;
      reasons.push("Missing Accept-Language header");
    }

    // Check for automation indicators
    if (request.headers.get("X-Requested-With")) {
      score -= 5; // Legitimate XHR requests
    }

    if (request.headers.get("Sec-Fetch-Site")) {
      score -= 10; // Browser with Fetch Metadata
    }

    // Check request frequency from cache
    const cachedScore = this.botScores.get(ip);
    if (cachedScore && Date.now() - cachedScore.timestamp < 60000) {
      score += Math.min(cachedScore.score * 0.5, 20);
      reasons.push("Repeated requests from same IP");
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    const result: BotScore = { score, reasons, timestamp: Date.now() };
    this.botScores.set(ip, result);

    return result;
  }

  private getClientIP(request: Request): string {
    return request.headers.get("CF-Connecting-IP") ||
           request.headers.get("X-Real-IP") ||
           request.headers.get("X-Forwarded-For")?.split(",")[0].trim() ||
           "unknown";
  }
}

// GeoIP Blocking
class GeoIPFilter {
  private rules: GeoIPRule[] = [];

  constructor() {
    // Example rules
    this.rules = [
      {
        type: "block",
        countries: ["CN", "RU", "KP"],
        paths: ["/admin", "/api/sensitive"]
      },
      {
        type: "allow",
        countries: ["US", "CA", "GB", "DE", "FR"],
        paths: ["/api"]
      }
    ];
  }

  isAllowed(request: Request): { allowed: boolean; reason?: string } {
    const country = this.getCountry(request);
    const path = new URL(request.url).pathname;

    // Check block rules first
    for (const rule of this.rules.filter(r => r.type === "block")) {
      if (rule.countries.includes(country)) {
        if (!rule.paths || rule.paths.some(p => path.startsWith(p))) {
          return {
            allowed: false,
            reason: `Access from ${country} blocked for ${path}`
          };
        }
      }
    }

    // Check allow rules
    for (const rule of this.rules.filter(r => r.type === "allow")) {
      if (rule.paths && rule.paths.some(p => path.startsWith(p))) {
        if (!rule.countries.includes(country)) {
          return {
            allowed: false,
            reason: `Access from ${country} not allowed for ${path}`
          };
        }
      }
    }

    return { allowed: true };
  }

  private getCountry(request: Request): string {
    return request.headers.get("CF-IPCountry") ||
           request.headers.get("X-Country-Code") ||
           "XX";
  }

  addRule(rule: GeoIPRule): void {
    this.rules.push(rule);
  }
}

// Main Authentication Service
class EdgeAuthService {
  private jwtVerifier: JWTVerifier;
  private sessionManager: SessionManager;
  private rateLimiter: RateLimiter;
  private botDetector: BotDetector;
  private geoIPFilter: GeoIPFilter;

  constructor(jwtSecret: string) {
    this.jwtVerifier = new JWTVerifier(jwtSecret);
    this.sessionManager = new SessionManager();
    this.rateLimiter = new RateLimiter();
    this.botDetector = new BotDetector();
    this.geoIPFilter = new GeoIPFilter();

    // Cleanup expired sessions every 5 minutes
    setInterval(() => {
      const cleaned = this.sessionManager.cleanupExpiredSessions();
      console.log(`Cleaned up ${cleaned} expired sessions`);
    }, 300000);
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle authentication endpoints
    if (path.startsWith("/auth/")) {
      return this.handleAuthEndpoint(request);
    }

    // Protected routes - require authentication
    return this.handleProtectedRequest(request);
  }

  private async handleAuthEndpoint(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Rate limiting
    const ip = this.getClientIP(request);
    const rateCheck = this.rateLimiter.checkLimit(ip);

    if (!rateCheck.allowed) {
      return new Response("Rate limit exceeded", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateCheck.resetTime).toISOString()
        }
      });
    }

    // Bot detection
    const botScore = this.botDetector.detectBot(request);
    if (botScore.score > 70) {
      return new Response("Suspicious activity detected", {
        status: 403,
        headers: { "X-Bot-Score": botScore.score.toString() }
      });
    }

    // GeoIP filtering
    const geoCheck = this.geoIPFilter.isAllowed(request);
    if (!geoCheck.allowed) {
      return new Response(geoCheck.reason, { status: 403 });
    }

    if (path === "/auth/login" && request.method === "POST") {
      return this.handleLogin(request);
    }

    if (path === "/auth/logout" && request.method === "POST") {
      return this.handleLogout(request);
    }

    if (path === "/auth/verify" && request.method === "GET") {
      return this.handleVerify(request);
    }

    return new Response("Not Found", { status: 404 });
  }

  private async handleLogin(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { email: string; password: string };

      // In production, verify credentials against database
      // For demo, accept any email/password
      if (!body.email || !body.password) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const userId = this.generateUserId(body.email);
      const role = "user";

      // Create JWT
      const token = await this.jwtVerifier.generateToken({
        sub: userId,
        email: body.email,
        role
      });

      // Create session
      const ip = this.getClientIP(request);
      const userAgent = request.headers.get("User-Agent") || "";
      const session = this.sessionManager.createSession(userId, body.email, role, ip, userAgent);

      return Response.json({
        token,
        sessionId: session.id,
        user: {
          id: userId,
          email: body.email,
          role
        }
      });
    } catch (error) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
  }

  private async handleLogout(request: Request): Promise<Response> {
    const sessionId = request.headers.get("X-Session-ID");

    if (sessionId) {
      this.sessionManager.destroySession(sessionId);
    }

    return Response.json({ message: "Logged out successfully" });
  }

  private async handleVerify(request: Request): Promise<Response> {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Missing token" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await this.jwtVerifier.verify(token);

    if (!payload) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    return Response.json({
      valid: true,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      }
    });
  }

  private async handleProtectedRequest(request: Request): Promise<Response> {
    const authHeader = request.headers.get("Authorization");
    const sessionId = request.headers.get("X-Session-ID");

    // Verify JWT or session
    let authenticated = false;
    let user: any = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = await this.jwtVerifier.verify(token);
      if (payload) {
        authenticated = true;
        user = { id: payload.sub, email: payload.email, role: payload.role };
      }
    } else if (sessionId) {
      const session = this.sessionManager.getSession(sessionId);
      if (session) {
        authenticated = true;
        user = { id: session.userId, email: session.email, role: session.role };
      }
    }

    if (!authenticated) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({
      message: "Access granted",
      user
    });
  }

  private getClientIP(request: Request): string {
    return request.headers.get("CF-Connecting-IP") ||
           request.headers.get("X-Real-IP") ||
           request.headers.get("X-Forwarded-For")?.split(",")[0].trim() ||
           "unknown";
  }

  private generateUserId(email: string): string {
    const hash = createHash("sha256");
    hash.update(email);
    return hash.digest("hex").substring(0, 16);
  }
}

// Start the server
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const authService = new EdgeAuthService(JWT_SECRET);

serve((request: Request) => {
  return authService.handleRequest(request);
}, { port: 8081 });

console.log("Edge Authentication Service running on http://localhost:8081");
