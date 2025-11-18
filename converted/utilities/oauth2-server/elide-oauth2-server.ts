/**
 * OAuth 2.0 Server for Elide
 *
 * Core OAuth2 server features:
 * - Authorization endpoint
 * - Token endpoint
 * - Multiple grant types (authorization_code, password, client_credentials, refresh_token)
 * - Token generation and validation
 * - Client authentication
 * - Scope management
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 2M+ downloads/week
 */

export interface Client {
  id: string;
  secret?: string;
  grants: string[];
  redirectUris?: string[];
  accessTokenLifetime?: number;
  refreshTokenLifetime?: number;
}

export interface User {
  id: string | number;
  [key: string]: any;
}

export interface Token {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  scope?: string[];
  client: Client;
  user?: User;
}

export interface AuthorizationCode {
  code: string;
  expiresAt: Date;
  redirectUri: string;
  scope?: string[];
  client: Client;
  user: User;
}

export interface TokenModel {
  getAccessToken(accessToken: string): Promise<Token | null>;
  getRefreshToken(refreshToken: string): Promise<Token | null>;
  getAuthorizationCode(code: string): Promise<AuthorizationCode | null>;
  getClient(clientId: string, clientSecret?: string): Promise<Client | null>;
  getUser(username: string, password: string): Promise<User | null>;
  saveToken(token: Token, client: Client, user: User): Promise<Token>;
  saveAuthorizationCode(code: AuthorizationCode, client: Client, user: User): Promise<AuthorizationCode>;
  revokeToken(token: Token): Promise<boolean>;
  revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean>;
  validateScope?(user: User, client: Client, scope: string[]): Promise<boolean>;
}

export interface OAuth2ServerOptions {
  model: TokenModel;
  accessTokenLifetime?: number;
  refreshTokenLifetime?: number;
  authorizationCodeLifetime?: number;
  allowBearerTokensInQueryString?: boolean;
  allowExtendedTokenAttributes?: boolean;
}

export class OAuth2Server {
  private model: TokenModel;
  private accessTokenLifetime: number;
  private refreshTokenLifetime: number;
  private authorizationCodeLifetime: number;
  private allowBearerTokensInQueryString: boolean;
  private allowExtendedTokenAttributes: boolean;

  constructor(options: OAuth2ServerOptions) {
    this.model = options.model;
    this.accessTokenLifetime = options.accessTokenLifetime || 3600;
    this.refreshTokenLifetime = options.refreshTokenLifetime || 1209600;
    this.authorizationCodeLifetime = options.authorizationCodeLifetime || 300;
    this.allowBearerTokensInQueryString = options.allowBearerTokensInQueryString || false;
    this.allowExtendedTokenAttributes = options.allowExtendedTokenAttributes || false;
  }

  /**
   * Generate random token
   */
  private generateToken(): string {
    return Math.random().toString(36).substring(2) +
           Math.random().toString(36).substring(2) +
           Date.now().toString(36);
  }

  /**
   * Handle authorization request (authorization_code grant)
   */
  async authorize(request: any, response: any, options?: {
    authenticateHandler?: any;
    authorizationCodeLifetime?: number;
    allowEmptyState?: boolean;
  }): Promise<AuthorizationCode> {
    const clientId = request.query?.client_id || request.body?.client_id;
    const redirectUri = request.query?.redirect_uri || request.body?.redirect_uri;
    const state = request.query?.state || request.body?.state;
    const scope = request.query?.scope || request.body?.scope;

    if (!clientId) {
      throw new Error('Missing parameter: client_id');
    }

    const client = await this.model.getClient(clientId);
    if (!client) {
      throw new Error('Invalid client: client is invalid');
    }

    if (!client.grants.includes('authorization_code')) {
      throw new Error('Unauthorized client: grant type is unauthorized');
    }

    if (redirectUri && client.redirectUris && !client.redirectUris.includes(redirectUri)) {
      throw new Error('Invalid redirect_uri');
    }

    // Get authenticated user (from session or authenticateHandler)
    const user = options?.authenticateHandler ?
      await options.authenticateHandler(request, response) :
      request.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const code = this.generateToken();
    const expiresAt = new Date(Date.now() + (options?.authorizationCodeLifetime || this.authorizationCodeLifetime) * 1000);
    const scopes = scope ? scope.split(' ') : undefined;

    const authCode: AuthorizationCode = {
      code,
      expiresAt,
      redirectUri: redirectUri || client.redirectUris?.[0] || '',
      scope: scopes,
      client,
      user
    };

    const savedCode = await this.model.saveAuthorizationCode(authCode, client, user);

    return savedCode;
  }

  /**
   * Handle token request
   */
  async token(request: any, response: any): Promise<Token> {
    const grantType = request.body?.grant_type;

    if (!grantType) {
      throw new Error('Missing parameter: grant_type');
    }

    switch (grantType) {
      case 'authorization_code':
        return this.handleAuthorizationCodeGrant(request);
      case 'password':
        return this.handlePasswordGrant(request);
      case 'client_credentials':
        return this.handleClientCredentialsGrant(request);
      case 'refresh_token':
        return this.handleRefreshTokenGrant(request);
      default:
        throw new Error(`Unsupported grant type: ${grantType}`);
    }
  }

  /**
   * Authorization code grant
   */
  private async handleAuthorizationCodeGrant(request: any): Promise<Token> {
    const code = request.body?.code;
    const redirectUri = request.body?.redirect_uri;
    const clientId = request.body?.client_id;
    const clientSecret = request.body?.client_secret;

    if (!code) {
      throw new Error('Missing parameter: code');
    }

    const authCode = await this.model.getAuthorizationCode(code);
    if (!authCode) {
      throw new Error('Invalid grant: authorization code is invalid');
    }

    if (authCode.expiresAt < new Date()) {
      throw new Error('Invalid grant: authorization code has expired');
    }

    if (redirectUri && authCode.redirectUri !== redirectUri) {
      throw new Error('Invalid grant: redirect_uri does not match');
    }

    const client = await this.model.getClient(clientId, clientSecret);
    if (!client) {
      throw new Error('Invalid client: client credentials are invalid');
    }

    if (client.id !== authCode.client.id) {
      throw new Error('Invalid grant: authorization code was issued to another client');
    }

    await this.model.revokeAuthorizationCode(authCode);

    return this.generateAccessToken(client, authCode.user, authCode.scope);
  }

  /**
   * Password grant
   */
  private async handlePasswordGrant(request: any): Promise<Token> {
    const username = request.body?.username;
    const password = request.body?.password;
    const clientId = request.body?.client_id;
    const clientSecret = request.body?.client_secret;
    const scope = request.body?.scope;

    if (!username || !password) {
      throw new Error('Missing parameter: username or password');
    }

    const client = await this.model.getClient(clientId, clientSecret);
    if (!client) {
      throw new Error('Invalid client: client credentials are invalid');
    }

    if (!client.grants.includes('password')) {
      throw new Error('Unauthorized client: grant type is unauthorized');
    }

    const user = await this.model.getUser(username, password);
    if (!user) {
      throw new Error('Invalid grant: user credentials are invalid');
    }

    const scopes = scope ? scope.split(' ') : undefined;

    return this.generateAccessToken(client, user, scopes);
  }

  /**
   * Client credentials grant
   */
  private async handleClientCredentialsGrant(request: any): Promise<Token> {
    const clientId = request.body?.client_id;
    const clientSecret = request.body?.client_secret;
    const scope = request.body?.scope;

    const client = await this.model.getClient(clientId, clientSecret);
    if (!client) {
      throw new Error('Invalid client: client credentials are invalid');
    }

    if (!client.grants.includes('client_credentials')) {
      throw new Error('Unauthorized client: grant type is unauthorized');
    }

    const scopes = scope ? scope.split(' ') : undefined;

    return this.generateAccessToken(client, undefined, scopes);
  }

  /**
   * Refresh token grant
   */
  private async handleRefreshTokenGrant(request: any): Promise<Token> {
    const refreshToken = request.body?.refresh_token;
    const clientId = request.body?.client_id;
    const clientSecret = request.body?.client_secret;

    if (!refreshToken) {
      throw new Error('Missing parameter: refresh_token');
    }

    const token = await this.model.getRefreshToken(refreshToken);
    if (!token) {
      throw new Error('Invalid grant: refresh token is invalid');
    }

    if (token.refreshTokenExpiresAt && token.refreshTokenExpiresAt < new Date()) {
      throw new Error('Invalid grant: refresh token has expired');
    }

    const client = await this.model.getClient(clientId, clientSecret);
    if (!client) {
      throw new Error('Invalid client: client credentials are invalid');
    }

    if (client.id !== token.client.id) {
      throw new Error('Invalid grant: refresh token was issued to another client');
    }

    await this.model.revokeToken(token);

    return this.generateAccessToken(client, token.user, token.scope);
  }

  /**
   * Generate access token
   */
  private async generateAccessToken(client: Client, user?: User, scope?: string[]): Promise<Token> {
    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();
    const accessTokenExpiresAt = new Date(Date.now() + this.accessTokenLifetime * 1000);
    const refreshTokenExpiresAt = new Date(Date.now() + this.refreshTokenLifetime * 1000);

    const token: Token = {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope,
      client,
      user
    };

    const savedToken = await this.model.saveToken(token, client, user!);

    return savedToken;
  }

  /**
   * Authenticate request
   */
  async authenticate(request: any, response: any, options?: {
    scope?: string | string[];
    allowBearerTokensInQueryString?: boolean;
  }): Promise<Token> {
    let accessToken = this.getTokenFromRequest(request, options?.allowBearerTokensInQueryString);

    if (!accessToken) {
      throw new Error('Unauthorized: no access token provided');
    }

    const token = await this.model.getAccessToken(accessToken);
    if (!token) {
      throw new Error('Unauthorized: access token is invalid');
    }

    if (token.accessTokenExpiresAt < new Date()) {
      throw new Error('Unauthorized: access token has expired');
    }

    if (options?.scope) {
      const requiredScopes = Array.isArray(options.scope) ? options.scope : [options.scope];
      const tokenScopes = token.scope || [];

      const hasScope = requiredScopes.every(scope => tokenScopes.includes(scope));
      if (!hasScope) {
        throw new Error('Forbidden: insufficient scope');
      }
    }

    return token;
  }

  /**
   * Extract token from request
   */
  private getTokenFromRequest(request: any, allowQueryString?: boolean): string | null {
    // Authorization header
    const authHeader = request.headers?.authorization || request.headers?.Authorization;
    if (authHeader) {
      const matches = authHeader.match(/Bearer\s+(\S+)/);
      if (matches) {
        return matches[1];
      }
    }

    // Query string (if allowed)
    if (allowQueryString || this.allowBearerTokensInQueryString) {
      if (request.query?.access_token) {
        return request.query.access_token;
      }
    }

    // Request body
    if (request.body?.access_token) {
      return request.body.access_token;
    }

    return null;
  }
}

// CLI Demo
if (import.meta.url.includes("oauth2-server")) {
  console.log("🔐 OAuth2 Server for Elide - OAuth 2.0 Authorization Framework\n");

  console.log("=== In-Memory Model Example ===");

  // Simple in-memory store
  const clients = new Map<string, Client>();
  const users = new Map<string, User>();
  const tokens = new Map<string, Token>();
  const authCodes = new Map<string, AuthorizationCode>();

  // Add demo client
  clients.set('demo-client', {
    id: 'demo-client',
    secret: 'demo-secret',
    grants: ['authorization_code', 'password', 'client_credentials', 'refresh_token'],
    redirectUris: ['http://localhost:3000/callback'],
    accessTokenLifetime: 3600,
    refreshTokenLifetime: 86400
  });

  // Add demo user
  users.set('demo', {
    id: 1,
    username: 'demo',
    password: 'password'
  });

  const model: TokenModel = {
    async getClient(clientId: string, clientSecret?: string) {
      const client = clients.get(clientId);
      if (!client) return null;
      if (clientSecret && client.secret !== clientSecret) return null;
      return client;
    },
    async getUser(username: string, password: string) {
      const user = users.get(username);
      if (!user || user.password !== password) return null;
      return user;
    },
    async saveToken(token: Token, client: Client, user: User) {
      tokens.set(token.accessToken, token);
      if (token.refreshToken) {
        tokens.set(token.refreshToken, token);
      }
      return token;
    },
    async getAccessToken(accessToken: string) {
      return tokens.get(accessToken) || null;
    },
    async getRefreshToken(refreshToken: string) {
      return tokens.get(refreshToken) || null;
    },
    async saveAuthorizationCode(code: AuthorizationCode, client: Client, user: User) {
      authCodes.set(code.code, code);
      return code;
    },
    async getAuthorizationCode(code: string) {
      return authCodes.get(code) || null;
    },
    async revokeToken(token: Token) {
      tokens.delete(token.accessToken);
      if (token.refreshToken) tokens.delete(token.refreshToken);
      return true;
    },
    async revokeAuthorizationCode(code: AuthorizationCode) {
      authCodes.delete(code.code);
      return true;
    }
  };

  const oauth = new OAuth2Server({ model });

  console.log("✓ OAuth2 server initialized with in-memory model\n");

  console.log("=== Password Grant Example ===");
  const tokenRequest = {
    body: {
      grant_type: 'password',
      username: 'demo',
      password: 'password',
      client_id: 'demo-client',
      client_secret: 'demo-secret'
    }
  };

  oauth.token(tokenRequest, {}).then(token => {
    console.log("✓ Token issued:");
    console.log(`  Access Token: ${token.accessToken.substring(0, 20)}...`);
    console.log(`  Refresh Token: ${token.refreshToken?.substring(0, 20)}...`);
    console.log(`  Expires: ${token.accessTokenExpiresAt.toISOString()}`);
    console.log();

    console.log("=== Authenticate Request Example ===");
    const authRequest = {
      headers: {
        authorization: `Bearer ${token.accessToken}`
      }
    };

    return oauth.authenticate(authRequest, {});
  }).then(authenticated => {
    console.log("✓ Request authenticated:");
    console.log(`  User ID: ${authenticated.user?.id}`);
    console.log(`  Client ID: ${authenticated.client.id}`);
    console.log();

    console.log("✅ Use Cases:");
    console.log("- OAuth 2.0 authorization server");
    console.log("- API access control");
    console.log("- Third-party app authorization");
    console.log("- Mobile app authentication");
    console.log("- Service-to-service authentication");
    console.log();

    console.log("🚀 Polyglot Benefits:");
    console.log("- 2M+ npm downloads/week");
    console.log("- Zero dependencies");
    console.log("- Works in TypeScript, Python, Ruby, Java");
    console.log("- Instant startup on Elide");
  }).catch(err => {
    console.error("Error:", err.message);
  });
}

export default OAuth2Server;
