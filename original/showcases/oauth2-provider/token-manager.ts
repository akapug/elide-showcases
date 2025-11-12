/**
 * Token Manager
 *
 * Manages the complete lifecycle of OAuth2 tokens:
 * - Token generation and signing
 * - Token validation and verification
 * - Token revocation
 * - Token rotation
 * - Token introspection
 *
 * @module token-manager
 */

export interface TokenMetadata {
  token: string;
  tokenType: 'access' | 'refresh' | 'id';
  clientId: string;
  userId?: string;
  scopes: string[];
  expiresAt: number;
  issuedAt: number;
  revoked: boolean;
  refreshToken?: string;
  accessToken?: string; // For refresh tokens, link to access token
}

export interface TokenGenerationOptions {
  clientId: string;
  userId?: string;
  scopes: string[];
  expiresIn?: number;
  includeRefreshToken?: boolean;
  customClaims?: Record<string, any>;
}

export interface TokenValidationResult {
  valid: boolean;
  metadata?: TokenMetadata;
  error?: string;
}

export interface JWTHeader {
  alg: string;
  typ: string;
  kid?: string;
}

export interface JWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  jti?: string;
  scope?: string;
  [key: string]: any;
}

/**
 * Token Manager Class
 */
export class TokenManager {
  private tokens: Map<string, TokenMetadata> = new Map();
  private revokedTokens: Set<string> = new Set();
  private tokensByUser: Map<string, Set<string>> = new Map();
  private tokensByClient: Map<string, Set<string>> = new Map();

  private issuer: string;
  private signingKey: string;
  private defaultAccessTokenLifetime: number = 3600; // 1 hour
  private defaultRefreshTokenLifetime: number = 2592000; // 30 days
  private defaultIdTokenLifetime: number = 3600; // 1 hour

  constructor(issuer: string = 'http://localhost:3000', signingKey?: string) {
    this.issuer = issuer;
    this.signingKey = signingKey || 'change-this-secret-key-in-production';
  }

  /**
   * Generate access token
   */
  generateAccessToken(options: TokenGenerationOptions): string {
    const expiresIn = options.expiresIn || this.defaultAccessTokenLifetime;
    const token = this.createJWT({
      iss: this.issuer,
      sub: options.userId || options.clientId,
      aud: options.clientId,
      exp: 0,
      iat: 0,
      jti: this.generateJTI(),
      scope: options.scopes.join(' '),
      ...options.customClaims
    }, expiresIn);

    // Store metadata
    const metadata: TokenMetadata = {
      token,
      tokenType: 'access',
      clientId: options.clientId,
      userId: options.userId,
      scopes: options.scopes,
      expiresAt: Date.now() + expiresIn * 1000,
      issuedAt: Date.now(),
      revoked: false
    };

    this.storeToken(token, metadata);
    return token;
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(options: TokenGenerationOptions, accessToken: string): string {
    const expiresIn = this.defaultRefreshTokenLifetime;
    const token = this.randomToken(64);

    // Store metadata
    const metadata: TokenMetadata = {
      token,
      tokenType: 'refresh',
      clientId: options.clientId,
      userId: options.userId,
      scopes: options.scopes,
      expiresAt: Date.now() + expiresIn * 1000,
      issuedAt: Date.now(),
      revoked: false,
      accessToken
    };

    this.storeToken(token, metadata);
    return token;
  }

  /**
   * Generate ID token (OIDC)
   */
  generateIdToken(
    userId: string,
    clientId: string,
    scopes: string[],
    userClaims: Record<string, any>,
    nonce?: string
  ): string {
    const payload: JWTPayload = {
      iss: this.issuer,
      sub: userId,
      aud: clientId,
      exp: 0,
      iat: 0,
      ...userClaims
    };

    if (nonce) {
      payload.nonce = nonce;
    }

    return this.createJWT(payload, this.defaultIdTokenLifetime);
  }

  /**
   * Generate complete token response
   */
  generateTokenResponse(options: TokenGenerationOptions): any {
    const accessToken = this.generateAccessToken(options);

    const response: any = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: options.expiresIn || this.defaultAccessTokenLifetime,
      scope: options.scopes.join(' ')
    };

    // Add refresh token if requested
    if (options.includeRefreshToken) {
      const refreshToken = this.generateRefreshToken(options, accessToken);
      response.refresh_token = refreshToken;

      // Update access token metadata with refresh token
      const metadata = this.tokens.get(accessToken);
      if (metadata) {
        metadata.refreshToken = refreshToken;
      }
    }

    return response;
  }

  /**
   * Validate token
   */
  validateToken(token: string): TokenValidationResult {
    // Check if revoked
    if (this.revokedTokens.has(token)) {
      return { valid: false, error: 'Token has been revoked' };
    }

    // Get metadata
    const metadata = this.tokens.get(token);
    if (!metadata) {
      return { valid: false, error: 'Token not found' };
    }

    // Check expiration
    if (metadata.expiresAt < Date.now()) {
      return { valid: false, error: 'Token expired' };
    }

    // Verify JWT signature (for JWT tokens)
    if (this.isJWT(token)) {
      const payload = this.verifyJWT(token);
      if (!payload) {
        return { valid: false, error: 'Invalid token signature' };
      }
    }

    return { valid: true, metadata };
  }

  /**
   * Revoke token
   */
  revokeToken(token: string): boolean {
    const metadata = this.tokens.get(token);
    if (!metadata) {
      return false;
    }

    // Mark as revoked
    metadata.revoked = true;
    this.revokedTokens.add(token);

    // If revoking refresh token, also revoke associated access token
    if (metadata.tokenType === 'refresh' && metadata.accessToken) {
      this.revokeToken(metadata.accessToken);
    }

    // If revoking access token, also revoke associated refresh token
    if (metadata.tokenType === 'access' && metadata.refreshToken) {
      this.revokeToken(metadata.refreshToken);
    }

    return true;
  }

  /**
   * Revoke all tokens for user
   */
  revokeAllUserTokens(userId: string): number {
    const userTokens = this.tokensByUser.get(userId);
    if (!userTokens) {
      return 0;
    }

    let count = 0;
    for (const token of userTokens) {
      if (this.revokeToken(token)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Revoke all tokens for client
   */
  revokeAllClientTokens(clientId: string): number {
    const clientTokens = this.tokensByClient.get(clientId);
    if (!clientTokens) {
      return 0;
    }

    let count = 0;
    for (const token of clientTokens) {
      if (this.revokeToken(token)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Introspect token (RFC 7662)
   */
  introspectToken(token: string): any {
    const validation = this.validateToken(token);

    if (!validation.valid || !validation.metadata) {
      return { active: false };
    }

    const metadata = validation.metadata;

    return {
      active: true,
      scope: metadata.scopes.join(' '),
      client_id: metadata.clientId,
      username: metadata.userId,
      token_type: 'Bearer',
      exp: Math.floor(metadata.expiresAt / 1000),
      iat: Math.floor(metadata.issuedAt / 1000),
      sub: metadata.userId,
      aud: metadata.clientId,
      iss: this.issuer
    };
  }

  /**
   * Rotate refresh token
   */
  rotateRefreshToken(oldRefreshToken: string): { success: boolean; newRefreshToken?: string; error?: string } {
    const validation = this.validateToken(oldRefreshToken);

    if (!validation.valid || !validation.metadata) {
      return { success: false, error: 'Invalid refresh token' };
    }

    const metadata = validation.metadata;

    if (metadata.tokenType !== 'refresh') {
      return { success: false, error: 'Not a refresh token' };
    }

    // Revoke old refresh token
    this.revokeToken(oldRefreshToken);

    // Generate new refresh token
    const newRefreshToken = this.generateRefreshToken(
      {
        clientId: metadata.clientId,
        userId: metadata.userId,
        scopes: metadata.scopes
      },
      metadata.accessToken || ''
    );

    return { success: true, newRefreshToken };
  }

  /**
   * Clean expired tokens
   */
  cleanExpiredTokens(): number {
    const now = Date.now();
    let count = 0;

    for (const [token, metadata] of this.tokens.entries()) {
      if (metadata.expiresAt < now || metadata.revoked) {
        this.removeToken(token);
        count++;
      }
    }

    return count;
  }

  /**
   * Get token statistics
   */
  getStatistics(): any {
    const now = Date.now();
    let activeTokens = 0;
    let expiredTokens = 0;
    let revokedTokens = 0;

    for (const metadata of this.tokens.values()) {
      if (metadata.revoked) {
        revokedTokens++;
      } else if (metadata.expiresAt < now) {
        expiredTokens++;
      } else {
        activeTokens++;
      }
    }

    return {
      total: this.tokens.size,
      active: activeTokens,
      expired: expiredTokens,
      revoked: revokedTokens,
      users: this.tokensByUser.size,
      clients: this.tokensByClient.size
    };
  }

  /**
   * Store token metadata
   */
  private storeToken(token: string, metadata: TokenMetadata): void {
    this.tokens.set(token, metadata);

    // Index by user
    if (metadata.userId) {
      if (!this.tokensByUser.has(metadata.userId)) {
        this.tokensByUser.set(metadata.userId, new Set());
      }
      this.tokensByUser.get(metadata.userId)!.add(token);
    }

    // Index by client
    if (!this.tokensByClient.has(metadata.clientId)) {
      this.tokensByClient.set(metadata.clientId, new Set());
    }
    this.tokensByClient.get(metadata.clientId)!.add(token);
  }

  /**
   * Remove token from storage
   */
  private removeToken(token: string): void {
    const metadata = this.tokens.get(token);
    if (!metadata) {
      return;
    }

    this.tokens.delete(token);
    this.revokedTokens.delete(token);

    // Remove from user index
    if (metadata.userId) {
      const userTokens = this.tokensByUser.get(metadata.userId);
      if (userTokens) {
        userTokens.delete(token);
        if (userTokens.size === 0) {
          this.tokensByUser.delete(metadata.userId);
        }
      }
    }

    // Remove from client index
    const clientTokens = this.tokensByClient.get(metadata.clientId);
    if (clientTokens) {
      clientTokens.delete(token);
      if (clientTokens.size === 0) {
        this.tokensByClient.delete(metadata.clientId);
      }
    }
  }

  /**
   * Create JWT token
   */
  private createJWT(payload: JWTPayload, expiresIn: number): string {
    const header: JWTHeader = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify JWT token
   */
  private verifyJWT(token: string): JWTPayload | null {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');

      // Verify signature
      const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`);
      if (signature !== expectedSignature) {
        return null;
      }

      const payload: JWTPayload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is JWT format
   */
  private isJWT(token: string): boolean {
    return token.split('.').length === 3;
  }

  /**
   * Sign data with secret key
   */
  private sign(data: string): string {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data + this.signingKey);
    let hash = 0;
    for (let i = 0; i < dataBytes.length; i++) {
      hash = ((hash << 5) - hash) + dataBytes[i];
      hash = hash & hash;
    }
    return this.base64UrlEncode(hash.toString());
  }

  /**
   * Generate unique token identifier
   */
  private generateJTI(): string {
    return this.randomToken(16);
  }

  /**
   * Generate random token
   */
  private randomToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(str: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
}

/**
 * Create token manager instance
 */
export function createTokenManager(issuer?: string, signingKey?: string): TokenManager {
  return new TokenManager(issuer, signingKey);
}
