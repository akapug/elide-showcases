/**
 * Configuration Loader
 * Loads and validates CMS configuration
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadConfig() {
  const environment = process.env.NODE_ENV || 'development';
  const configPath = process.env.CONFIG_PATH || join(__dirname, `../config`);

  // Load base configuration
  const baseConfig = loadConfigFile(join(configPath, 'default.json'));

  // Load environment-specific configuration
  const envConfig = loadConfigFile(join(configPath, `${environment}.json`));

  // Merge configurations
  const config = mergeDeep(baseConfig, envConfig);

  // Load environment variables
  applyEnvironmentVariables(config);

  // Validate configuration
  validateConfig(config);

  config.environment = environment;
  config.configPath = configPath;

  return config;
}

function loadConfigFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load config file ${path}:`, error.message);
    return {};
  }
}

function mergeDeep(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function applyEnvironmentVariables(config) {
  // Database
  if (process.env.DATABASE_URL) {
    config.database = config.database || {};
    config.database.url = process.env.DATABASE_URL;
  }

  if (process.env.DATABASE_CLIENT) {
    config.database = config.database || {};
    config.database.client = process.env.DATABASE_CLIENT;
  }

  // Server
  if (process.env.PORT) {
    config.server = config.server || {};
    config.server.port = parseInt(process.env.PORT, 10);
  }

  if (process.env.HOST) {
    config.server = config.server || {};
    config.server.host = process.env.HOST;
  }

  // JWT
  if (process.env.JWT_SECRET) {
    config.auth = config.auth || {};
    config.auth.jwtSecret = process.env.JWT_SECRET;
  }

  // Admin
  if (process.env.ADMIN_JWT_SECRET) {
    config.admin = config.admin || {};
    config.admin.jwtSecret = process.env.ADMIN_JWT_SECRET;
  }

  // API Tokens
  if (process.env.API_TOKEN_SALT) {
    config.auth = config.auth || {};
    config.auth.apiTokenSalt = process.env.API_TOKEN_SALT;
  }
}

function validateConfig(config) {
  const required = ['database', 'server'];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }

  // Validate database config
  if (!config.database.client && !config.database.url) {
    throw new Error('Database configuration must include either "client" or "url"');
  }

  // Validate server config
  if (!config.server.port) {
    config.server.port = 1337; // Default port
  }

  // Validate auth config
  if (!config.auth?.jwtSecret) {
    console.warn('WARNING: No JWT secret configured. Using default (insecure for production)');
    config.auth = config.auth || {};
    config.auth.jwtSecret = 'default-secret-change-in-production';
  }
}

export function getConfig(key, defaultValue = null) {
  const config = globalThis.__CMS_CONFIG__;
  if (!config) return defaultValue;

  const keys = key.split('.');
  let value = config;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }

  return value;
}

export function setConfig(config) {
  globalThis.__CMS_CONFIG__ = config;
}
