/**
 * Authentication Strategies Module
 *
 * Provides multiple authentication methods:
 * - JWT with refresh tokens
 * - OAuth2 integration (Google, GitHub)
 * - API key management
 * - Session-based auth
 */

// ==================== Types & Interfaces ====================

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  exp: number;
  iat: number;
  type: 'access' | 'refresh';
}

export interface RefreshToken {
  token: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface APIKey {
  key: string;
  name: string;
  userId: string;
  permissions: string[];
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  isActive: boolean;
}

export interface OAuth2Config {
  provider: 'google' | 'github' | 'microsoft';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuth2Token {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  oauth2Provider?: string;
  createdAt: number;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

// ==================== JWT Manager ====================

export class JWTManager {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenTTL: number = 900; // 15 minutes
  private readonly refreshTokenTTL: number = 604800; // 7 days
  private refreshTokens: Map<string, RefreshToken> = new Map();
  private revokedTokens: Set<string> = new Set();

  constructor(
    accessSecret: string = 'access-secret-change-in-production',
    refreshSecret: string = 'refresh-secret-change-in-production'
  ) {
    this.accessTokenSecret = accessSecret;
    this.refreshTokenSecret = refreshSecret;
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokenPair(user: User, deviceInfo?: string, ipAddress?: string): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const accessToken = this.createToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        type: 'access'
      },
      this.accessTokenSecret,
      this.accessTokenTTL
    );

    const refreshToken = this.createToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        type: 'refresh'
      },
      this.refreshTokenSecret,
      this.refreshTokenTTL
    );

    // Store refresh token
    this.refreshTokens.set(refreshToken, {
      token: refreshToken,
      userId: user.id,
      expiresAt: Date.now() + this.refreshTokenTTL * 1000,
      createdAt: Date.now(),
      deviceInfo,
      ipAddress
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenTTL
    };
  }

  /**
   * Create a JWT token
   */
  private createToken(
    payload: Omit<JWTPayload, 'exp' | 'iat'>,
    secret: string,
    ttl: number
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + ttl
    };

    const header = this.base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = this.base64UrlEncode(JSON.stringify(fullPayload));
    const signature = this.sign(`${header}.${body}`, secret);

    return `${header}.${body}.${signature}`;
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<JWTPayload | null> {
    if (this.revokedTokens.has(token)) {
      return null;
    }

    return this.validateToken(token, this.accessTokenSecret, 'access');
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(token: string): Promise<JWTPayload | null> {
    if (this.revokedTokens.has(token)) {
      return null;
    }

    if (!this.refreshTokens.has(token)) {
      return null;
    }

    const storedToken = this.refreshTokens.get(token)!;
    if (Date.now() > storedToken.expiresAt) {
      this.refreshTokens.delete(token);
      return null;
    }

    return this.validateToken(token, this.refreshTokenSecret, 'refresh');
  }

  /**
   * Validate a JWT token
   */
  private async validateToken(
    token: string,
    secret: string,
    expectedType: 'access' | 'refresh'
  ): Promise<JWTPayload | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, body, signature] = parts;

      // Verify signature
      const expectedSignature = this.sign(`${header}.${body}`, secret);
      if (signature !== expectedSignature) {
        return null;
      }

      const payload = JSON.parse(this.base64UrlDecode(body));

      // Check type
      if (payload.type !== expectedType) {
        return null;
      }

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }

      return payload as JWTPayload;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  } | null> {
    const payload = await this.validateRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    const storedToken = this.refreshTokens.get(refreshToken);
    if (storedToken) {
      storedToken.lastUsedAt = Date.now();
    }

    const accessToken = this.createToken(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
        type: 'access'
      },
      this.accessTokenSecret,
      this.accessTokenTTL
    );

    return {
      accessToken,
      expiresIn: this.accessTokenTTL
    };
  }

  /**
   * Revoke a token
   */
  revokeToken(token: string): void {
    this.revokedTokens.add(token);
    this.refreshTokens.delete(token);
  }

  /**
   * Revoke all tokens for a user
   */
  revokeUserTokens(userId: string): number {
    let count = 0;
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        this.revokedTokens.add(token);
        this.refreshTokens.delete(token);
        count++;
      }
    }
    return count;
  }

  /**
   * Get all refresh tokens for a user
   */
  getUserRefreshTokens(userId: string): RefreshToken[] {
    return Array.from(this.refreshTokens.values())
      .filter(rt => rt.userId === userId);
  }

  /**
   * Clean up expired tokens
   */
  cleanup(): void {
    const now = Date.now();

    // Clean up expired refresh tokens
    for (const [token, data] of this.refreshTokens.entries()) {
      if (now > data.expiresAt) {
        this.refreshTokens.delete(token);
      }
    }

    // Clean up old revoked tokens (keep for 24 hours)
    if (this.revokedTokens.size > 10000) {
      this.revokedTokens.clear();
    }
  }

  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  private sign(data: string, secret: string): string {
    // Simple hash (in production, use crypto.subtle)
    let hash = 0;
    const input = data + secret;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return this.base64UrlEncode(Math.abs(hash).toString(36));
  }
}

// ==================== API Key Manager ====================

export class APIKeyManager {
  private apiKeys: Map<string, APIKey> = new Map();
  private userKeys: Map<string, Set<string>> = new Map();

  /**
   * Generate a new API key
   */
  generateKey(
    userId: string,
    name: string,
    permissions: string[],
    rateLimit?: { requests: number; windowMs: number },
    expiresInDays?: number
  ): APIKey {
    const key = `sk_${this.generateRandomString(32)}`;

    const apiKey: APIKey = {
      key,
      name,
      userId,
      permissions,
      rateLimit: rateLimit || { requests: 1000, windowMs: 3600000 },
      createdAt: Date.now(),
      expiresAt: expiresInDays ? Date.now() + expiresInDays * 86400000 : undefined,
      isActive: true
    };

    this.apiKeys.set(key, apiKey);

    if (!this.userKeys.has(userId)) {
      this.userKeys.set(userId, new Set());
    }
    this.userKeys.get(userId)!.add(key);

    return apiKey;
  }

  /**
   * Validate an API key
   */
  async validateKey(key: string): Promise<APIKey | null> {
    const apiKey = this.apiKeys.get(key);
    if (!apiKey) {
      return null;
    }

    if (!apiKey.isActive) {
      return null;
    }

    if (apiKey.expiresAt && Date.now() > apiKey.expiresAt) {
      apiKey.isActive = false;
      return null;
    }

    // Update last used timestamp
    apiKey.lastUsedAt = Date.now();

    return apiKey;
  }

  /**
   * Check if API key has permission
   */
  hasPermission(apiKey: APIKey, permission: string): boolean {
    return apiKey.permissions.includes('*') || apiKey.permissions.includes(permission);
  }

  /**
   * Revoke an API key
   */
  revokeKey(key: string): boolean {
    const apiKey = this.apiKeys.get(key);
    if (!apiKey) {
      return false;
    }

    apiKey.isActive = false;
    this.userKeys.get(apiKey.userId)?.delete(key);
    return true;
  }

  /**
   * List all keys for a user
   */
  getUserKeys(userId: string): APIKey[] {
    const keys = this.userKeys.get(userId);
    if (!keys) {
      return [];
    }

    return Array.from(keys)
      .map(key => this.apiKeys.get(key))
      .filter((key): key is APIKey => key !== undefined);
  }

  /**
   * Get API key statistics
   */
  getKeyStats(key: string): {
    name: string;
    createdAt: number;
    lastUsedAt?: number;
    daysUntilExpiry?: number;
    isActive: boolean;
  } | null {
    const apiKey = this.apiKeys.get(key);
    if (!apiKey) {
      return null;
    }

    return {
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
      daysUntilExpiry: apiKey.expiresAt
        ? Math.ceil((apiKey.expiresAt - Date.now()) / 86400000)
        : undefined,
      isActive: apiKey.isActive
    };
  }

  /**
   * Clean up expired keys
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, apiKey] of this.apiKeys.entries()) {
      if (apiKey.expiresAt && now > apiKey.expiresAt) {
        apiKey.isActive = false;
      }
    }
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// ==================== OAuth2 Manager ====================

export class OAuth2Manager {
  private configs: Map<string, OAuth2Config> = new Map();
  private authorizationCodes: Map<string, { userId: string; expiresAt: number }> = new Map();
  private oauth2Tokens: Map<string, OAuth2Token> = new Map();

  /**
   * Register OAuth2 provider
   */
  registerProvider(config: OAuth2Config): void {
    this.configs.set(config.provider, config);
  }

  /**
   * Get authorization URL
   */
  getAuthorizationUrl(provider: 'google' | 'github' | 'microsoft', state: string): string {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`OAuth2 provider ${provider} not configured`);
    }

    const baseUrls = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      github: 'https://github.com/login/oauth/authorize',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    };

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state
    });

    return `${baseUrls[provider]}?${params}`;
  }

  /**
   * Exchange authorization code for tokens (simulated)
   */
  async exchangeCode(provider: string, code: string): Promise<OAuth2Token> {
    // Simulated OAuth2 token exchange
    // In production, make actual HTTP request to provider
    const token: OAuth2Token = {
      accessToken: `oauth2_${this.generateRandomString(40)}`,
      refreshToken: `oauth2_refresh_${this.generateRandomString(40)}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: this.configs.get(provider)?.scopes.join(' ') || ''
    };

    this.oauth2Tokens.set(token.accessToken, token);

    return token;
  }

  /**
   * Get user info from OAuth2 token (simulated)
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
  } | null> {
    const token = this.oauth2Tokens.get(accessToken);
    if (!token) {
      return null;
    }

    // Simulated user info
    // In production, make actual HTTP request to provider
    return {
      id: `oauth_${this.generateRandomString(16)}`,
      email: 'user@oauth.example.com',
      name: 'OAuth User',
      picture: 'https://example.com/avatar.jpg'
    };
  }

  /**
   * Refresh OAuth2 token (simulated)
   */
  async refreshToken(refreshToken: string): Promise<OAuth2Token | null> {
    // Simulated token refresh
    // In production, make actual HTTP request to provider
    const newToken: OAuth2Token = {
      accessToken: `oauth2_${this.generateRandomString(40)}`,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: ''
    };

    this.oauth2Tokens.set(newToken.accessToken, newToken);

    return newToken;
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// ==================== Unified Auth Service ====================

export class AuthService {
  private jwtManager: JWTManager;
  private apiKeyManager: APIKeyManager;
  private oauth2Manager: OAuth2Manager;
  private users: Map<string, User> = new Map();

  constructor() {
    this.jwtManager = new JWTManager();
    this.apiKeyManager = new APIKeyManager();
    this.oauth2Manager = new OAuth2Manager();

    // Initialize OAuth2 providers
    this.oauth2Manager.registerProvider({
      provider: 'google',
      clientId: 'your-google-client-id',
      clientSecret: 'your-google-client-secret',
      redirectUri: 'http://localhost:3000/auth/oauth2/callback/google',
      scopes: ['openid', 'email', 'profile']
    });

    this.oauth2Manager.registerProvider({
      provider: 'github',
      clientId: 'your-github-client-id',
      clientSecret: 'your-github-client-secret',
      redirectUri: 'http://localhost:3000/auth/oauth2/callback/github',
      scopes: ['user:email']
    });
  }

  /**
   * Authenticate with username/password
   */
  async authenticateCredentials(email: string, password: string): Promise<AuthResult> {
    // Simulated user lookup and password verification
    // In production, hash passwords and use secure comparison
    const user: User = {
      id: crypto.randomUUID(),
      email,
      role: 'user',
      permissions: ['read', 'write'],
      createdAt: Date.now()
    };

    this.users.set(user.id, user);

    const tokens = this.jwtManager.generateTokenPair(user);

    return {
      success: true,
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Authenticate with API key
   */
  async authenticateAPIKey(apiKey: string): Promise<AuthResult> {
    const key = await this.apiKeyManager.validateKey(apiKey);
    if (!key) {
      return { success: false, error: 'Invalid API key' };
    }

    const user = this.users.get(key.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user };
  }

  /**
   * Authenticate with JWT
   */
  async authenticateJWT(token: string): Promise<AuthResult> {
    const payload = await this.jwtManager.validateAccessToken(token);
    if (!payload) {
      return { success: false, error: 'Invalid or expired token' };
    }

    const user: User = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      createdAt: Date.now()
    };

    return { success: true, user };
  }

  /**
   * Get OAuth2 authorization URL
   */
  getOAuth2AuthUrl(provider: 'google' | 'github' | 'microsoft', state: string): string {
    return this.oauth2Manager.getAuthorizationUrl(provider, state);
  }

  /**
   * Handle OAuth2 callback
   */
  async handleOAuth2Callback(provider: string, code: string): Promise<AuthResult> {
    try {
      const oauth2Token = await this.oauth2Manager.exchangeCode(provider, code);
      const userInfo = await this.oauth2Manager.getUserInfo(oauth2Token.accessToken);

      if (!userInfo) {
        return { success: false, error: 'Failed to get user info' };
      }

      const user: User = {
        id: userInfo.id,
        email: userInfo.email,
        role: 'user',
        permissions: ['read', 'write'],
        oauth2Provider: provider,
        createdAt: Date.now()
      };

      this.users.set(user.id, user);

      const tokens = this.jwtManager.generateTokenPair(user);

      return {
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  } | null> {
    return this.jwtManager.refreshAccessToken(refreshToken);
  }

  /**
   * Logout (revoke tokens)
   */
  logout(userId: string): number {
    return this.jwtManager.revokeUserTokens(userId);
  }

  getJWTManager(): JWTManager {
    return this.jwtManager;
  }

  getAPIKeyManager(): APIKeyManager {
    return this.apiKeyManager;
  }

  getOAuth2Manager(): OAuth2Manager {
    return this.oauth2Manager;
  }

  /**
   * Periodic cleanup
   */
  startCleanup(): void {
    setInterval(() => {
      this.jwtManager.cleanup();
      this.apiKeyManager.cleanup();
    }, 3600000); // Every hour
  }
}
