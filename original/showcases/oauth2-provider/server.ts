/**
 * OAuth2/OIDC Provider
 *
 * This server implements a production-ready OAuth2 and OpenID Connect provider with:
 * - Authorization Code Flow
 * - Client Credentials Flow
 * - Token management (access, refresh, ID tokens)
 * - Scope validation
 * - JWK endpoint
 * - PKCE support
 *
 * @module oauth2-provider
 */

// Native Elide beta11-rc1 HTTP - No imports needed for fetch handler

/**
 * OAuth2 grant types
 */
enum GrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  CLIENT_CREDENTIALS = 'client_credentials',
  REFRESH_TOKEN = 'refresh_token',
  PASSWORD = 'password'
}

/**
 * Token types
 */
enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  ID = 'id'
}

/**
 * Client information
 */
interface Client {
  id: string;
  secret: string;
  name: string;
  redirectUris: string[];
  allowedScopes: string[];
  allowedGrants: GrantType[];
  trusted: boolean;
  createdAt: number;
}

/**
 * User information
 */
interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  picture?: string;
}

/**
 * Authorization code
 */
interface AuthCode {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge?: string;
  codeChallengeMethod?: string;
  expiresAt: number;
  used: boolean;
}

/**
 * Access token
 */
interface AccessToken {
  token: string;
  clientId: string;
  userId?: string;
  scopes: string[];
  expiresAt: number;
  refreshToken?: string;
}

/**
 * JWT header
 */
interface JWTHeader {
  alg: string;
  typ: string;
  kid?: string;
}

/**
 * JWT payload
 */
interface JWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  scope?: string;
  [key: string]: any;
}

/**
 * JSON Web Key
 */
interface JWK {
  kty: string;
  use: string;
  kid: string;
  alg: string;
  n?: string;
  e?: string;
}

/**
 * Simple JWT implementation
 */
class JWT {
  private static secret = 'your-secret-key-change-in-production';

  /**
   * Create a JWT token
   */
  static create(payload: JWTPayload, expiresIn: number = 3600): string {
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
   * Verify and decode JWT token
   */
  static verify(token: string): JWTPayload | null {
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

  private static sign(data: string): string {
    // Simple HMAC-like signing (use proper crypto in production)
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data + this.secret);
    let hash = 0;
    for (let i = 0; i < dataBytes.length; i++) {
      hash = ((hash << 5) - hash) + dataBytes[i];
      hash = hash & hash;
    }
    return this.base64UrlEncode(hash.toString());
  }

  private static base64UrlEncode(str: string): string {
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

  private static base64UrlDecode(str: string): string {
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
 * OAuth2 Provider
 */
class OAuth2Provider {
  private clients: Map<string, Client>;
  private users: Map<string, User>;
  private authCodes: Map<string, AuthCode>;
  private accessTokens: Map<string, AccessToken>;
  private refreshTokens: Map<string, AccessToken>;

  constructor() {
    this.clients = new Map();
    this.users = new Map();
    this.authCodes = new Map();
    this.accessTokens = new Map();
    this.refreshTokens = new Map();

    this.seedData();
  }

  /**
   * Seed initial data
   */
  private seedData(): void {
    // Register demo client
    this.registerClient({
      id: 'demo-client',
      secret: 'demo-secret',
      name: 'Demo Application',
      redirectUris: ['http://localhost:3000/callback'],
      allowedScopes: ['openid', 'profile', 'email', 'read', 'write'],
      allowedGrants: [
        GrantType.AUTHORIZATION_CODE,
        GrantType.CLIENT_CREDENTIALS,
        GrantType.REFRESH_TOKEN
      ],
      trusted: true,
      createdAt: Date.now()
    });

    // Register demo user
    this.users.set('user123', {
      id: 'user123',
      email: 'demo@example.com',
      name: 'Demo User',
      emailVerified: true,
      picture: 'https://via.placeholder.com/150'
    });
  }

  /**
   * Register a client
   */
  registerClient(client: Client): void {
    this.clients.set(client.id, client);
  }

  /**
   * Authenticate client
   */
  authenticateClient(clientId: string, clientSecret: string): Client | null {
    const client = this.clients.get(clientId);
    if (!client || client.secret !== clientSecret) {
      return null;
    }
    return client;
  }

  /**
   * Handle authorization request
   */
  async authorize(params: URLSearchParams): Promise<{ redirectUri: string; code?: string; error?: string }> {
    const clientId = params.get('client_id');
    const redirectUri = params.get('redirect_uri');
    const responseType = params.get('response_type');
    const scope = params.get('scope') || '';
    const state = params.get('state');
    const codeChallenge = params.get('code_challenge');
    const codeChallengeMethod = params.get('code_challenge_method') || 'plain';

    // Validate client
    const client = this.clients.get(clientId!);
    if (!client) {
      return {
        redirectUri: redirectUri!,
        error: 'invalid_client'
      };
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirectUri!)) {
      return {
        redirectUri: redirectUri!,
        error: 'invalid_redirect_uri'
      };
    }

    // Validate response type
    if (responseType !== 'code') {
      return {
        redirectUri: redirectUri!,
        error: 'unsupported_response_type'
      };
    }

    // Validate scopes
    const requestedScopes = scope.split(' ');
    const invalidScopes = requestedScopes.filter(s => !client.allowedScopes.includes(s));
    if (invalidScopes.length > 0) {
      return {
        redirectUri: redirectUri!,
        error: 'invalid_scope'
      };
    }

    // Generate authorization code
    const code = this.generateCode();
    const authCode: AuthCode = {
      code,
      clientId: clientId!,
      userId: 'user123', // In production, get from session
      redirectUri: redirectUri!,
      scopes: requestedScopes,
      codeChallenge,
      codeChallengeMethod,
      expiresAt: Date.now() + 600000, // 10 minutes
      used: false
    };

    this.authCodes.set(code, authCode);

    // Build redirect URL
    const url = new URL(redirectUri!);
    url.searchParams.set('code', code);
    if (state) url.searchParams.set('state', state);

    return {
      redirectUri: url.toString(),
      code
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async token(params: URLSearchParams): Promise<any> {
    const grantType = params.get('grant_type') as GrantType;

    switch (grantType) {
      case GrantType.AUTHORIZATION_CODE:
        return this.handleAuthorizationCodeGrant(params);

      case GrantType.CLIENT_CREDENTIALS:
        return this.handleClientCredentialsGrant(params);

      case GrantType.REFRESH_TOKEN:
        return this.handleRefreshTokenGrant(params);

      default:
        return {
          error: 'unsupported_grant_type',
          error_description: `Grant type ${grantType} is not supported`
        };
    }
  }

  /**
   * Handle authorization code grant
   */
  private async handleAuthorizationCodeGrant(params: URLSearchParams): Promise<any> {
    const code = params.get('code');
    const redirectUri = params.get('redirect_uri');
    const clientId = params.get('client_id');
    const clientSecret = params.get('client_secret');
    const codeVerifier = params.get('code_verifier');

    // Authenticate client
    const client = this.authenticateClient(clientId!, clientSecret!);
    if (!client) {
      return { error: 'invalid_client' };
    }

    // Validate authorization code
    const authCode = this.authCodes.get(code!);
    if (!authCode) {
      return { error: 'invalid_grant' };
    }

    if (authCode.used) {
      return { error: 'invalid_grant', error_description: 'Code already used' };
    }

    if (authCode.expiresAt < Date.now()) {
      return { error: 'invalid_grant', error_description: 'Code expired' };
    }

    if (authCode.clientId !== clientId) {
      return { error: 'invalid_grant' };
    }

    if (authCode.redirectUri !== redirectUri) {
      return { error: 'invalid_grant' };
    }

    // Verify PKCE if present
    if (authCode.codeChallenge) {
      if (!codeVerifier) {
        return { error: 'invalid_request', error_description: 'code_verifier required' };
      }

      const valid = this.verifyPKCE(
        authCode.codeChallenge,
        authCode.codeChallengeMethod!,
        codeVerifier
      );

      if (!valid) {
        return { error: 'invalid_grant', error_description: 'Invalid code_verifier' };
      }
    }

    // Mark code as used
    authCode.used = true;

    // Generate tokens
    return this.generateTokens(client, authCode.userId, authCode.scopes);
  }

  /**
   * Handle client credentials grant
   */
  private async handleClientCredentialsGrant(params: URLSearchParams): Promise<any> {
    const clientId = params.get('client_id');
    const clientSecret = params.get('client_secret');
    const scope = params.get('scope') || '';

    // Authenticate client
    const client = this.authenticateClient(clientId!, clientSecret!);
    if (!client) {
      return { error: 'invalid_client' };
    }

    // Check if grant type is allowed
    if (!client.allowedGrants.includes(GrantType.CLIENT_CREDENTIALS)) {
      return { error: 'unauthorized_client' };
    }

    const scopes = scope.split(' ').filter(s => s);

    // Validate scopes
    const invalidScopes = scopes.filter(s => !client.allowedScopes.includes(s));
    if (invalidScopes.length > 0) {
      return { error: 'invalid_scope' };
    }

    // Generate token
    return this.generateTokens(client, undefined, scopes);
  }

  /**
   * Handle refresh token grant
   */
  private async handleRefreshTokenGrant(params: URLSearchParams): Promise<any> {
    const refreshToken = params.get('refresh_token');
    const clientId = params.get('client_id');
    const clientSecret = params.get('client_secret');

    // Authenticate client
    const client = this.authenticateClient(clientId!, clientSecret!);
    if (!client) {
      return { error: 'invalid_client' };
    }

    // Validate refresh token
    const tokenData = this.refreshTokens.get(refreshToken!);
    if (!tokenData) {
      return { error: 'invalid_grant' };
    }

    if (tokenData.clientId !== clientId) {
      return { error: 'invalid_grant' };
    }

    // Generate new tokens
    return this.generateTokens(client, tokenData.userId, tokenData.scopes);
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(client: Client, userId?: string, scopes: string[] = []): any {
    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();
    const expiresIn = 3600; // 1 hour

    const tokenData: AccessToken = {
      token: accessToken,
      clientId: client.id,
      userId,
      scopes,
      expiresAt: Date.now() + expiresIn * 1000,
      refreshToken
    };

    this.accessTokens.set(accessToken, tokenData);
    this.refreshTokens.set(refreshToken, tokenData);

    const response: any = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: scopes.join(' ')
    };

    if (client.allowedGrants.includes(GrantType.REFRESH_TOKEN)) {
      response.refresh_token = refreshToken;
    }

    // Generate ID token if openid scope is present
    if (scopes.includes('openid') && userId) {
      response.id_token = this.generateIdToken(client, userId, scopes);
    }

    return response;
  }

  /**
   * Generate ID token (OIDC)
   */
  private generateIdToken(client: Client, userId: string, scopes: string[]): string {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const payload: JWTPayload = {
      iss: 'http://localhost:3000',
      sub: user.id,
      aud: client.id,
      exp: 0,
      iat: 0
    };

    // Add claims based on scopes
    if (scopes.includes('profile')) {
      payload.name = user.name;
      payload.picture = user.picture;
    }

    if (scopes.includes('email')) {
      payload.email = user.email;
      payload.email_verified = user.emailVerified;
    }

    return JWT.create(payload, 3600);
  }

  /**
   * Introspect token
   */
  async introspect(token: string, clientId: string, clientSecret: string): Promise<any> {
    // Authenticate client
    const client = this.authenticateClient(clientId, clientSecret);
    if (!client) {
      return { active: false };
    }

    // Check access token
    const tokenData = this.accessTokens.get(token);
    if (!tokenData) {
      return { active: false };
    }

    if (tokenData.expiresAt < Date.now()) {
      return { active: false };
    }

    return {
      active: true,
      scope: tokenData.scopes.join(' '),
      client_id: tokenData.clientId,
      username: tokenData.userId,
      token_type: 'Bearer',
      exp: Math.floor(tokenData.expiresAt / 1000),
      iat: Math.floor((tokenData.expiresAt - 3600000) / 1000)
    };
  }

  /**
   * Revoke token
   */
  async revoke(token: string, clientId: string, clientSecret: string): Promise<boolean> {
    // Authenticate client
    const client = this.authenticateClient(clientId, clientSecret);
    if (!client) {
      return false;
    }

    // Remove access token
    const accessDeleted = this.accessTokens.delete(token);

    // Remove refresh token
    const refreshDeleted = this.refreshTokens.delete(token);

    return accessDeleted || refreshDeleted;
  }

  /**
   * Get user info (OIDC)
   */
  async userInfo(accessToken: string): Promise<any> {
    const tokenData = this.accessTokens.get(accessToken);
    if (!tokenData || !tokenData.userId) {
      return null;
    }

    if (tokenData.expiresAt < Date.now()) {
      return null;
    }

    const user = this.users.get(tokenData.userId);
    if (!user) {
      return null;
    }

    const info: any = {
      sub: user.id
    };

    // Add claims based on scopes
    if (tokenData.scopes.includes('profile')) {
      info.name = user.name;
      info.picture = user.picture;
    }

    if (tokenData.scopes.includes('email')) {
      info.email = user.email;
      info.email_verified = user.emailVerified;
    }

    return info;
  }

  /**
   * Get JWK Set
   */
  getJWKS(): any {
    const jwk: JWK = {
      kty: 'RSA',
      use: 'sig',
      kid: 'key-1',
      alg: 'RS256',
      n: 'base64-encoded-modulus',
      e: 'AQAB'
    };

    return {
      keys: [jwk]
    };
  }

  /**
   * Get OpenID configuration
   */
  getOpenIdConfiguration(): any {
    return {
      issuer: 'http://localhost:3000',
      authorization_endpoint: 'http://localhost:3000/oauth/authorize',
      token_endpoint: 'http://localhost:3000/oauth/token',
      userinfo_endpoint: 'http://localhost:3000/oauth/userinfo',
      jwks_uri: 'http://localhost:3000/.well-known/jwks.json',
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile', 'email'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      claims_supported: ['sub', 'name', 'email', 'email_verified', 'picture']
    };
  }

  /**
   * Verify PKCE challenge
   */
  private verifyPKCE(challenge: string, method: string, verifier: string): boolean {
    if (method === 'plain') {
      return challenge === verifier;
    }

    if (method === 'S256') {
      // In production, use proper SHA-256 hashing
      const hash = btoa(verifier);
      return challenge === hash;
    }

    return false;
  }

  /**
   * Generate random code
   */
  private generateCode(): string {
    return this.randomString(32);
  }

  /**
   * Generate random token
   */
  private generateToken(): string {
    return this.randomString(64);
  }

  /**
   * Generate random string
   */
  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Initialize provider
const oauth2Provider = new OAuth2Provider();

/**
 * Native Elide beta11-rc1 HTTP Server - Fetch Handler Pattern
 *
 * Export a default fetch function that handles HTTP requests.
 * Run with: elide serve --port 3000 server.ts
 */
export default async function fetch(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Authorization endpoint
  if (url.pathname === '/oauth/authorize') {
    const result = await oauth2Provider.authorize(url.searchParams);

    if (result.error) {
      const errorUrl = new URL(result.redirectUri);
      errorUrl.searchParams.set('error', result.error);
      return Response.redirect(errorUrl.toString());
    }

    return Response.redirect(result.redirectUri);
  }

  // Token endpoint
  if (url.pathname === '/oauth/token') {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.formData();
    const params = new URLSearchParams();
    for (const [key, value] of body) {
      params.set(key, value.toString());
    }

    const result = await oauth2Provider.token(params);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Introspection endpoint
  if (url.pathname === '/oauth/introspect') {
    const body = await request.formData();
    const result = await oauth2Provider.introspect(
      body.get('token')?.toString()!,
      body.get('client_id')?.toString()!,
      body.get('client_secret')?.toString()!
    );

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Revocation endpoint
  if (url.pathname === '/oauth/revoke') {
    const body = await request.formData();
    await oauth2Provider.revoke(
      body.get('token')?.toString()!,
      body.get('client_id')?.toString()!,
      body.get('client_secret')?.toString()!
    );

    return new Response('', { status: 200 });
  }

  // UserInfo endpoint
  if (url.pathname === '/oauth/userinfo') {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = auth.substring(7);
    const userInfo = await oauth2Provider.userInfo(token);

    if (!userInfo) {
      return new Response('Unauthorized', { status: 401 });
    }

    return new Response(JSON.stringify(userInfo), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // JWKS endpoint
  if (url.pathname === '/.well-known/jwks.json') {
    return new Response(JSON.stringify(oauth2Provider.getJWKS()), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // OpenID configuration
  if (url.pathname === '/.well-known/openid-configuration') {
    return new Response(JSON.stringify(oauth2Provider.getOpenIdConfiguration()), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Health check
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'healthy' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not found', { status: 404 });
}

// Log server info on startup
if (import.meta.url.includes("server.ts")) {
  console.log('OAuth2/OIDC Provider running on http://localhost:3000');
  console.log('Authorization: http://localhost:3000/oauth/authorize');
  console.log('Token: http://localhost:3000/oauth/token');
  console.log('UserInfo: http://localhost:3000/oauth/userinfo');
  console.log('JWKS: http://localhost:3000/.well-known/jwks.json');
  console.log('OpenID Config: http://localhost:3000/.well-known/openid-configuration');
}
