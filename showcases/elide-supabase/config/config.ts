/**
 * Configuration Management
 *
 * Loads and manages ElideSupabase configuration
 */

import {
  DatabaseConfig,
  APIConfig,
  RealtimeConfig,
  AuthConfig,
  StorageConfig,
  FunctionConfig,
  WebhookConfig,
  DashboardConfig,
  LogConfig
} from '../types';

/**
 * Complete configuration
 */
export interface Config {
  database: DatabaseConfig;
  api: APIConfig;
  realtime: RealtimeConfig;
  graphql?: {
    enabled: boolean;
    host: string;
    port: number;
    playground?: boolean;
    introspection?: boolean;
  };
  auth: AuthConfig;
  storage: StorageConfig;
  functions: FunctionConfig;
  webhooks: WebhookConfig;
  dashboard?: DashboardConfig;
  logging: LogConfig;
}

/**
 * Default configuration
 */
const defaultConfig: Config = {
  database: {
    type: 'sqlite',
    database: './data/elide-supabase.db',
    poolSize: 10,
    migrations: {
      enabled: true,
      autoRun: true,
      directory: './migrations'
    }
  },

  api: {
    host: '0.0.0.0',
    port: 3000,
    cors: {
      enabled: true,
      origins: ['*'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      credentials: true
    },
    rateLimit: {
      enabled: true,
      windowMs: 60000,
      maxRequests: 100,
      skipSuccessfulRequests: false
    },
    maxRequestSize: 10 * 1024 * 1024 // 10MB
  },

  realtime: {
    host: '0.0.0.0',
    port: 3001,
    maxConnections: 1000,
    heartbeatInterval: 30000
  },

  graphql: {
    enabled: true,
    host: '0.0.0.0',
    port: 3002,
    playground: true,
    introspection: true
  },

  auth: {
    jwt: {
      secret: 'your-secret-key-change-in-production',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
      algorithm: 'HS256'
    },
    providers: {
      email: {
        enabled: true,
        requireEmailVerification: false,
        verificationTokenExpiry: 3600
      },
      magicLink: {
        enabled: true,
        tokenExpiry: 600
      },
      google: {
        enabled: false,
        clientId: '',
        clientSecret: '',
        redirectUri: 'http://localhost:3000/auth/google/callback',
        scopes: ['openid', 'email', 'profile']
      },
      github: {
        enabled: false,
        clientId: '',
        clientSecret: '',
        redirectUri: 'http://localhost:3000/auth/github/callback',
        scopes: ['user:email']
      }
    },
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    },
    sessionDuration: 3600
  },

  storage: {
    provider: 'local',
    basePath: './data/storage',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: undefined, // Allow all by default
    cdn: {
      enabled: true,
      host: '0.0.0.0',
      port: 3003,
      cacheControl: 'public, max-age=3600',
      compression: true
    },
    transformations: {
      enabled: true,
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 85,
      formats: ['jpeg', 'png', 'webp']
    }
  },

  functions: {
    directory: './functions',
    timeout: 30000,
    memoryLimit: 128,
    concurrency: 10,
    languages: ['typescript', 'python', 'ruby', 'java', 'kotlin']
  },

  webhooks: {
    enabled: true,
    retries: 3,
    timeout: 10000
  },

  dashboard: {
    enabled: true,
    host: '0.0.0.0',
    port: 3004,
    adminEmail: 'admin@example.com'
  },

  logging: {
    level: 'info',
    format: 'text',
    output: 'console'
  }
};

/**
 * Load configuration from file or use defaults
 */
export function loadConfig(configPath?: string): Config {
  if (configPath) {
    try {
      // In real implementation, would load from file:
      // const fs = require('fs');
      // const yaml = require('yaml');
      // const content = fs.readFileSync(configPath, 'utf8');
      // const fileConfig = yaml.parse(content);
      // return mergeConfig(defaultConfig, fileConfig);

      console.log(`Loading configuration from: ${configPath}`);
    } catch (error) {
      console.error('Failed to load config file, using defaults:', error);
    }
  }

  // Check environment variables
  const config = { ...defaultConfig };

  // Database
  if (process.env.DATABASE_TYPE) {
    config.database.type = process.env.DATABASE_TYPE as any;
  }
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    config.database.host = url.hostname;
    config.database.port = parseInt(url.port);
    config.database.database = url.pathname.slice(1);
    config.database.username = url.username;
    config.database.password = url.password;
  }

  // API
  if (process.env.API_PORT) {
    config.api.port = parseInt(process.env.API_PORT);
  }

  // Auth
  if (process.env.JWT_SECRET) {
    config.auth.jwt.secret = process.env.JWT_SECRET;
  }

  // Storage
  if (process.env.STORAGE_PROVIDER) {
    config.storage.provider = process.env.STORAGE_PROVIDER as any;
  }

  return config;
}

/**
 * Merge configurations
 */
function mergeConfig(defaults: Config, overrides: Partial<Config>): Config {
  return {
    ...defaults,
    ...overrides,
    database: { ...defaults.database, ...overrides.database },
    api: { ...defaults.api, ...overrides.api },
    realtime: { ...defaults.realtime, ...overrides.realtime },
    auth: { ...defaults.auth, ...overrides.auth },
    storage: { ...defaults.storage, ...overrides.storage },
    functions: { ...defaults.functions, ...overrides.functions },
    webhooks: { ...defaults.webhooks, ...overrides.webhooks },
    dashboard: { ...defaults.dashboard, ...overrides.dashboard },
    logging: { ...defaults.logging, ...overrides.logging }
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Config): void {
  // Validate required fields
  if (!config.database.database) {
    throw new Error('Database path/name is required');
  }

  if (!config.auth.jwt.secret || config.auth.jwt.secret === 'your-secret-key-change-in-production') {
    console.warn('WARNING: Using default JWT secret - change this in production!');
  }

  // Validate ports
  const ports = [
    config.api.port,
    config.realtime.port,
    config.graphql?.port,
    config.storage.cdn?.port,
    config.dashboard?.port
  ].filter(Boolean);

  const uniquePorts = new Set(ports);
  if (uniquePorts.size !== ports.length) {
    throw new Error('Duplicate port numbers in configuration');
  }
}

/**
 * Print configuration summary
 */
export function printConfig(config: Config): void {
  console.log('\nElideSupabase Configuration:');
  console.log('============================');
  console.log(`Database: ${config.database.type} (${config.database.database})`);
  console.log(`API: http://${config.api.host}:${config.api.port}`);
  console.log(`Real-time: ws://${config.realtime.host}:${config.realtime.port}`);

  if (config.graphql?.enabled) {
    console.log(`GraphQL: http://${config.graphql.host}:${config.graphql.port}/graphql`);
  }

  if (config.storage.cdn?.enabled) {
    console.log(`CDN: http://${config.storage.cdn.host}:${config.storage.cdn.port}`);
  }

  if (config.dashboard?.enabled) {
    console.log(`Dashboard: http://${config.dashboard.host}:${config.dashboard.port}`);
  }

  console.log('\nAuth Providers:');
  console.log(`- Email/Password: ${config.auth.providers.email?.enabled ? 'enabled' : 'disabled'}`);
  console.log(`- Magic Links: ${config.auth.providers.magicLink?.enabled ? 'enabled' : 'disabled'}`);
  console.log(`- Google OAuth: ${config.auth.providers.google?.enabled ? 'enabled' : 'disabled'}`);
  console.log(`- GitHub OAuth: ${config.auth.providers.github?.enabled ? 'enabled' : 'disabled'}`);

  console.log(`\nStorage: ${config.storage.provider}`);
  console.log(`Functions: ${config.functions.languages.join(', ')}`);
  console.log(`Webhooks: ${config.webhooks.enabled ? 'enabled' : 'disabled'}`);
  console.log('============================\n');
}
