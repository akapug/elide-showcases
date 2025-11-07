/**
 * Authentication Module for API Gateway
 *
 * Handles JWT authentication, API key validation, and authorization.
 * Uses shared utilities (base64, uuid, validator) for consistent auth across services.
 */

import { encode, decode, urlEncode, urlDecode } from '../shared/base64.ts';
import { v4 as uuidv4, validate as validateUuid } from '../shared/uuid.ts';
import { isEmail, isAlphanumeric, isLength } from '../shared/validator.ts';
import { TIMEOUTS } from '../shared/ms.ts';

/**
 * JWT payload interface
 */
export interface JWTPayload {
  sub: string;        // Subject (user ID)
  email: string;
  role: string;
  iat: number;        // Issued at
  exp: number;        // Expiration
  jti: string;        // JWT ID
}

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  apiKey?: string;
}

/**
 * Mock user database
 */
const USERS: Map<string, User> = new Map([
  ['user-123', { id: 'user-123', email: 'admin@example.com', role: 'admin', apiKey: 'api_key_admin123456789012345678' }],
  ['user-456', { id: 'user-456', email: 'user@example.com', role: 'user', apiKey: 'api_key_user1234567890123456789' }],
  ['user-789', { id: 'user-789', email: 'guest@example.com', role: 'guest' }],
]);

/**
 * Secret key for JWT signing (in production, use proper secret management)
 */
const JWT_SECRET = 'your-256-bit-secret-key-here-change-in-production';

/**
 * Create a JWT token for a user
 */
export function createToken(user: User): string {
  const now = Date.now();
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + TIMEOUTS.AUTH_TOKEN,
    jti: uuidv4(),
  };

  // Simple JWT: header.payload.signature (simplified, no real crypto)
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = urlEncode(JSON.stringify(header));
  const encodedPayload = urlEncode(JSON.stringify(payload));

  // In production, sign with proper HMAC
  const signature = urlEncode(simpleHash(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`));

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;

    // Verify signature (simplified)
    const expectedSignature = urlEncode(simpleHash(`${headerPart}.${payloadPart}.${JWT_SECRET}`));
    if (signaturePart !== expectedSignature) {
      console.log('Invalid signature');
      return null;
    }

    // Decode payload
    const payloadJson = urlDecode(payloadPart);
    const payload: JWTPayload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp < Date.now()) {
      console.log('Token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Simple hash function (replace with proper crypto in production)
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Authenticate request with JWT
 */
export function authenticateJWT(authHeader: string | undefined): User | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer '
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  // Get user from database
  const user = USERS.get(payload.sub);
  return user || null;
}

/**
 * Authenticate request with API key
 */
export function authenticateApiKey(apiKey: string | undefined): User | null {
  if (!apiKey) {
    return null;
  }

  // Validate API key format
  if (!isLength(apiKey, { min: 32, max: 64 }) || !isAlphanumeric(apiKey.replace('api_key_', ''))) {
    return null;
  }

  // Find user by API key
  for (const user of USERS.values()) {
    if (user.apiKey === apiKey) {
      return user;
    }
  }

  return null;
}

/**
 * Authenticate request (tries both JWT and API key)
 */
export function authenticate(authHeader: string | undefined, apiKey: string | undefined): User | null {
  // Try JWT first
  let user = authenticateJWT(authHeader);
  if (user) return user;

  // Try API key
  user = authenticateApiKey(apiKey);
  if (user) return user;

  return null;
}

/**
 * Check if user has required role
 */
export function authorize(user: User, requiredRole: 'admin' | 'user' | 'guest'): boolean {
  const roleHierarchy = { admin: 3, user: 2, guest: 1 };
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Login with email and password
 */
export function login(email: string, password: string): { token: string; user: User } | null {
  // Validate email
  if (!isEmail(email)) {
    return null;
  }

  // Find user by email (simplified, in production use password hashing)
  for (const user of USERS.values()) {
    if (user.email === email) {
      // In production, verify password hash
      const token = createToken(user);
      return { token, user };
    }
  }

  return null;
}

/**
 * Register new user
 */
export function register(email: string, password: string): { token: string; user: User } | null {
  // Validate email
  if (!isEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password (at least 8 chars)
  if (!isLength(password, { min: 8 })) {
    throw new Error('Password must be at least 8 characters');
  }

  // Check if user already exists
  for (const user of USERS.values()) {
    if (user.email === email) {
      throw new Error('User already exists');
    }
  }

  // Create new user
  const userId = `user-${uuidv4()}`;
  const newUser: User = {
    id: userId,
    email,
    role: 'user',
    apiKey: `api_key_${uuidv4().replace(/-/g, '')}`,
  };

  USERS.set(userId, newUser);

  // Create token
  const token = createToken(newUser);
  return { token, user: newUser };
}

/**
 * Generate API key for user
 */
export function generateApiKey(userId: string): string | null {
  const user = USERS.get(userId);
  if (!user) return null;

  const apiKey = `api_key_${uuidv4().replace(/-/g, '')}`;
  user.apiKey = apiKey;
  USERS.set(userId, user);

  return apiKey;
}

/**
 * Revoke API key
 */
export function revokeApiKey(userId: string): boolean {
  const user = USERS.get(userId);
  if (!user) return false;

  delete user.apiKey;
  USERS.set(userId, user);
  return true;
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): User | null {
  return USERS.get(userId) || null;
}

/**
 * List all users (admin only)
 */
export function listUsers(): User[] {
  return Array.from(USERS.values());
}
