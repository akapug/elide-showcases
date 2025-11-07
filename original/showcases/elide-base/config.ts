/**
 * ElideBase - Configuration
 *
 * Centralized configuration for ElideBase server.
 */

import { OAuthConfig } from './auth/oauth';

export interface DatabaseConfig {
  filename: string;
  wal?: boolean;
  timeout?: number;
}

export interface ServerConfig {
  host: string;
  port: number;
}

export interface APIConfig {
  basePath: string;
  cors?: {
    enabled: boolean;
    origins: string[];
  };
}

export interface AuthConfig {
  secret: string;
  sessionDuration: number; // in seconds
  oauth?: OAuthConfig;
}

export interface StorageConfig {
  baseDir: string;
  maxFileSize: number;
  allowedMimeTypes?: string[];
}

export interface AdminConfig {
  enabled: boolean;
  path: string;
}

export interface MigrationsConfig {
  dir: string;
  autoRun?: boolean;
}

export interface HooksConfig {
  enabled: boolean;
  python?: {
    enabled: boolean;
    executable: string;
  };
  ruby?: {
    enabled: boolean;
    executable: string;
  };
  java?: {
    enabled: boolean;
    executable: string;
  };
}

export class ElideBaseConfig {
  database: DatabaseConfig;
  server: ServerConfig;
  api: APIConfig;
  auth: AuthConfig;
  storage: StorageConfig;
  admin: AdminConfig;
  migrations: MigrationsConfig;
  hooks: HooksConfig;
  debug: boolean;

  constructor() {
    this.database = {
      filename: process.env.EB_DATABASE || './elidebase.db',
      wal: true,
      timeout: 5000
    };

    this.server = {
      host: process.env.EB_HOST || '0.0.0.0',
      port: parseInt(process.env.EB_PORT || '8090')
    };

    this.api = {
      basePath: process.env.EB_API_BASE_PATH || '/api',
      cors: {
        enabled: true,
        origins: ['*']
      }
    };

    this.auth = {
      secret: process.env.EB_AUTH_SECRET || this.generateSecret(),
      sessionDuration: parseInt(process.env.EB_SESSION_DURATION || '86400'), // 24 hours
      oauth: this.loadOAuthConfig()
    };

    this.storage = {
      baseDir: process.env.EB_STORAGE_DIR || './storage',
      maxFileSize: parseInt(process.env.EB_MAX_FILE_SIZE || String(10 * 1024 * 1024)), // 10MB
      allowedMimeTypes: this.loadAllowedMimeTypes()
    };

    this.admin = {
      enabled: process.env.EB_ADMIN_ENABLED !== 'false',
      path: process.env.EB_ADMIN_PATH || '/admin'
    };

    this.migrations = {
      dir: process.env.EB_MIGRATIONS_DIR || './migrations',
      autoRun: process.env.EB_AUTO_MIGRATE === 'true'
    };

    this.hooks = {
      enabled: process.env.EB_HOOKS_ENABLED !== 'false',
      python: {
        enabled: true,
        executable: process.env.EB_PYTHON_EXECUTABLE || 'python3'
      },
      ruby: {
        enabled: true,
        executable: process.env.EB_RUBY_EXECUTABLE || 'ruby'
      },
      java: {
        enabled: true,
        executable: process.env.EB_JAVA_EXECUTABLE || 'java'
      }
    };

    this.debug = process.env.EB_DEBUG === 'true';
  }

  /**
   * Generate a random secret
   */
  private generateSecret(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Load OAuth configuration from environment
   */
  private loadOAuthConfig(): OAuthConfig | undefined {
    const providers: any = {};

    // Google OAuth
    if (process.env.EB_OAUTH_GOOGLE_CLIENT_ID) {
      providers.google = {
        name: 'google',
        clientId: process.env.EB_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.EB_OAUTH_GOOGLE_CLIENT_SECRET || '',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: ['openid', 'email', 'profile']
      };
    }

    // GitHub OAuth
    if (process.env.EB_OAUTH_GITHUB_CLIENT_ID) {
      providers.github = {
        name: 'github',
        clientId: process.env.EB_OAUTH_GITHUB_CLIENT_ID,
        clientSecret: process.env.EB_OAUTH_GITHUB_CLIENT_SECRET || '',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        scopes: ['read:user', 'user:email']
      };
    }

    if (Object.keys(providers).length === 0) {
      return undefined;
    }

    return {
      providers,
      callbackBaseUrl: process.env.EB_OAUTH_CALLBACK_BASE_URL || 'http://localhost:8090'
    };
  }

  /**
   * Load allowed MIME types from environment
   */
  private loadAllowedMimeTypes(): string[] | undefined {
    const mimeTypes = process.env.EB_ALLOWED_MIME_TYPES;

    if (!mimeTypes) {
      return undefined; // Allow all by default
    }

    return mimeTypes.split(',').map(t => t.trim());
  }

  /**
   * Load config from file
   */
  static fromFile(filepath: string): ElideBaseConfig {
    const config = new ElideBaseConfig();

    try {
      const fs = require('fs');
      const configData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

      // Merge file config with defaults
      Object.assign(config, configData);
    } catch (error) {
      console.warn(`Failed to load config from ${filepath}:`, error);
    }

    return config;
  }

  /**
   * Save config to file
   */
  toFile(filepath: string): void {
    const fs = require('fs');
    fs.writeFileSync(filepath, JSON.stringify(this, null, 2));
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.database.filename) {
      errors.push('Database filename is required');
    }

    if (!this.auth.secret) {
      errors.push('Auth secret is required');
    }

    if (this.server.port < 1 || this.server.port > 65535) {
      errors.push('Server port must be between 1 and 65535');
    }

    if (this.storage.maxFileSize < 1024) {
      errors.push('Max file size must be at least 1KB');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get config as JSON
   */
  toJSON(): any {
    return {
      database: this.database,
      server: this.server,
      api: this.api,
      auth: {
        ...this.auth,
        secret: '***' // Hide secret in JSON output
      },
      storage: this.storage,
      admin: this.admin,
      migrations: this.migrations,
      hooks: this.hooks,
      debug: this.debug
    };
  }
}
