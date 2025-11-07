/**
 * ElideBase - OAuth Authentication
 *
 * Provides OAuth 2.0 authentication with support for popular providers
 * like Google, GitHub, Facebook, and custom OAuth providers.
 */

import { SQLiteDatabase } from '../database/sqlite';
import { UserManager } from './users';
import * as crypto from 'crypto';

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

export interface OAuthConfig {
  providers: Record<string, OAuthProvider>;
  callbackBaseUrl: string;
}

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export class OAuthManager {
  private db: SQLiteDatabase;
  private userManager: UserManager;
  private config: OAuthConfig;

  constructor(db: SQLiteDatabase, userManager: UserManager, config: OAuthConfig) {
    this.db = db;
    this.userManager = userManager;
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize OAuth accounts table
   */
  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS oauth_accounts (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider, provider_account_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_account_id);
    `);

    console.log('OAuth accounts table initialized');
  }

  /**
   * Get authorization URL for a provider
   */
  getAuthorizationUrl(providerName: string, state?: string): string {
    const provider = this.config.providers[providerName];
    if (!provider) {
      throw new Error(`OAuth provider ${providerName} not configured`);
    }

    const stateParam = state || crypto.randomBytes(16).toString('hex');
    const callbackUrl = `${this.config.callbackBaseUrl}/oauth/${providerName}/callback`;

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: provider.scopes.join(' '),
      state: stateParam
    });

    return `${provider.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCode(providerName: string, code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    const provider = this.config.providers[providerName];
    if (!provider) {
      throw new Error(`OAuth provider ${providerName} not configured`);
    }

    const callbackUrl = `${this.config.callbackBaseUrl}/oauth/${providerName}/callback`;

    // In a real implementation, this would make an HTTP request to the token URL
    // For demonstration, we'll simulate the response
    console.log(`Exchanging code for ${providerName} access token`);

    return {
      accessToken: crypto.randomBytes(32).toString('hex'),
      refreshToken: crypto.randomBytes(32).toString('hex'),
      expiresIn: 3600
    };
  }

  /**
   * Get user info from provider
   */
  async getUserInfo(providerName: string, accessToken: string): Promise<{
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  }> {
    const provider = this.config.providers[providerName];
    if (!provider) {
      throw new Error(`OAuth provider ${providerName} not configured`);
    }

    // In a real implementation, this would make an HTTP request to the user info URL
    // For demonstration, we'll simulate the response
    console.log(`Fetching user info from ${providerName}`);

    return {
      id: crypto.randomBytes(8).toString('hex'),
      email: `user@${providerName}.com`,
      name: `User from ${providerName}`,
      avatar: `https://avatars.${providerName}.com/u/default`
    };
  }

  /**
   * Link OAuth account to existing user
   */
  async linkAccount(
    userId: string,
    providerName: string,
    providerAccountId: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ): Promise<OAuthAccount> {
    // Check if account already linked
    const existing = this.db.queryOne(
      'SELECT id FROM oauth_accounts WHERE provider = ? AND provider_account_id = ?',
      [providerName, providerAccountId]
    );

    if (existing) {
      throw new Error('OAuth account already linked to another user');
    }

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const sql = `
      INSERT INTO oauth_accounts (user_id, provider, provider_account_id, access_token, refresh_token, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = this.db.execute(sql, [
      userId,
      providerName,
      providerAccountId,
      accessToken,
      refreshToken || null,
      expiresAt
    ]);

    const account = this.db.queryOne(
      'SELECT * FROM oauth_accounts WHERE id = ?',
      [result.lastInsertRowid]
    );

    console.log(`OAuth account linked: ${providerName} -> user ${userId}`);

    return this.mapAccount(account);
  }

  /**
   * Authenticate user with OAuth provider
   */
  async authenticate(
    providerName: string,
    code: string
  ): Promise<{ user: any; isNewUser: boolean }> {
    // Exchange code for access token
    const tokenData = await this.exchangeCode(providerName, code);

    // Get user info from provider
    const userInfo = await this.getUserInfo(providerName, tokenData.accessToken);

    // Check if OAuth account exists
    const existingAccount = this.db.queryOne(
      'SELECT * FROM oauth_accounts WHERE provider = ? AND provider_account_id = ?',
      [providerName, userInfo.id]
    );

    if (existingAccount) {
      // Update access token
      this.db.execute(
        'UPDATE oauth_accounts SET access_token = ?, refresh_token = ?, expires_at = ? WHERE id = ?',
        [
          tokenData.accessToken,
          tokenData.refreshToken || null,
          tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000).toISOString() : null,
          existingAccount.id
        ]
      );

      const user = this.userManager.getById(existingAccount.user_id);
      return { user, isNewUser: false };
    }

    // Check if user with this email exists
    let user = this.userManager.getByEmail(userInfo.email);
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await this.userManager.register({
        email: userInfo.email,
        password: crypto.randomBytes(32).toString('hex'), // Random password
        username: userInfo.name
      });

      // Auto-verify OAuth users
      await this.userManager.verify(user.id);

      isNewUser = true;
    }

    // Link OAuth account
    await this.linkAccount(
      user.id,
      providerName,
      userInfo.id,
      tokenData.accessToken,
      tokenData.refreshToken,
      tokenData.expiresIn
    );

    return { user, isNewUser };
  }

  /**
   * Unlink OAuth account
   */
  async unlinkAccount(userId: string, providerName: string): Promise<void> {
    this.db.execute(
      'DELETE FROM oauth_accounts WHERE user_id = ? AND provider = ?',
      [userId, providerName]
    );

    console.log(`OAuth account unlinked: ${providerName} from user ${userId}`);
  }

  /**
   * Get linked accounts for user
   */
  getLinkedAccounts(userId: string): OAuthAccount[] {
    const accounts = this.db.query(
      'SELECT * FROM oauth_accounts WHERE user_id = ?',
      [userId]
    ).rows;

    return accounts.map(a => this.mapAccount(a));
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(accountId: string): Promise<void> {
    const account = this.db.queryOne(
      'SELECT * FROM oauth_accounts WHERE id = ?',
      [accountId]
    );

    if (!account || !account.refresh_token) {
      throw new Error('Cannot refresh token');
    }

    const provider = this.config.providers[account.provider];
    if (!provider) {
      throw new Error(`OAuth provider ${account.provider} not configured`);
    }

    // In a real implementation, this would make an HTTP request to refresh the token
    console.log(`Refreshing access token for ${account.provider}`);

    const newAccessToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    this.db.execute(
      'UPDATE oauth_accounts SET access_token = ?, expires_at = ? WHERE id = ?',
      [newAccessToken, expiresAt, accountId]
    );
  }

  /**
   * Map database record to OAuthAccount object
   */
  private mapAccount(record: any): OAuthAccount {
    return {
      id: record.id,
      userId: record.user_id,
      provider: record.provider,
      providerAccountId: record.provider_account_id,
      accessToken: record.access_token,
      refreshToken: record.refresh_token,
      expiresAt: record.expires_at ? new Date(record.expires_at) : undefined,
      createdAt: new Date(record.created_at)
    };
  }
}

/**
 * Pre-configured OAuth providers
 */
export const OAUTH_PROVIDERS = {
  google: {
    name: 'google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['openid', 'email', 'profile']
  },
  github: {
    name: 'github',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email']
  },
  facebook: {
    name: 'facebook',
    authUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v12.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me',
    scopes: ['email', 'public_profile']
  }
};
