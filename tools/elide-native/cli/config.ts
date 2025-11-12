/**
 * Elide CLI Builder - Configuration Management
 *
 * Handle configuration files for CLI tools.
 */

import { NativeBridge } from '../runtime/bridge';
import * as path from 'path';

export interface ConfigOptions {
  name: string;
  defaults?: any;
  schema?: ConfigSchema;
}

export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    default?: any;
    validate?: (value: any) => boolean | string;
  };
}

export class Config {
  private name: string;
  private defaults: any;
  private schema?: ConfigSchema;
  private config: any = {};
  private configPath: string;

  constructor(options: ConfigOptions) {
    this.name = options.name;
    this.defaults = options.defaults || {};
    this.schema = options.schema;

    // Determine config file location
    const homeDir = NativeBridge.getHomeDirgetHomeDir();
    const configDir = path.join(homeDir, '.config', this.name);
    this.configPath = path.join(configDir, 'config.json');

    this.load();
  }

  private load(): void {
    try {
      if (NativeBridge.fileExists(this.configPath)) {
        const content = NativeBridge.readFile(this.configPath, 'utf8');
        const loaded = JSON.parse(content);

        // Merge with defaults
        this.config = { ...this.defaults, ...loaded };

        // Validate if schema is provided
        if (this.schema) {
          this.validate();
        }
      } else {
        // Use defaults
        this.config = { ...this.defaults };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.config = { ...this.defaults };
    }
  }

  save(): void {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      if (!NativeBridge.fileExists(configDir)) {
        NativeBridge.mkdir(configDir);
      }

      // Write config file
      const content = JSON.stringify(this.config, null, 2);
      NativeBridge.writeFile(this.configPath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  get<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  set(key: string, value: any): void {
    const keys = key.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;

    // Validate if schema is provided
    if (this.schema) {
      const errors = this.validateKey(key, value);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
    }
  }

  has(key: string): boolean {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return false;
      }
    }

    return true;
  }

  delete(key: string): void {
    const keys = key.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        return;
      }
      current = current[k];
    }

    delete current[keys[keys.length - 1]];
  }

  clear(): void {
    this.config = { ...this.defaults };
  }

  getAll(): any {
    return { ...this.config };
  }

  private validate(): void {
    if (!this.schema) return;

    const errors: string[] = [];

    for (const [key, rules] of Object.entries(this.schema)) {
      const value = this.get(key);

      if (rules.required && value === undefined) {
        errors.push(`Required field "${key}" is missing`);
        continue;
      }

      if (value !== undefined) {
        const keyErrors = this.validateKey(key, value);
        errors.push(...keyErrors);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  private validateKey(key: string, value: any): string[] {
    if (!this.schema || !this.schema[key]) return [];

    const rules = this.schema[key];
    const errors: string[] = [];

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rules.type) {
      errors.push(`Field "${key}" should be ${rules.type}, got ${actualType}`);
    }

    // Custom validation
    if (rules.validate) {
      const result = rules.validate(value);
      if (typeof result === 'string') {
        errors.push(result);
      } else if (result === false) {
        errors.push(`Field "${key}" failed validation`);
      }
    }

    return errors;
  }

  getConfigPath(): string {
    return this.configPath;
  }
}

// Global configuration
const globalConfigs: Map<string, Config> = new Map();

export function getConfig(name: string, options?: Omit<ConfigOptions, 'name'>): Config {
  if (!globalConfigs.has(name)) {
    globalConfigs.set(name, new Config({ name, ...options }));
  }
  return globalConfigs.get(name)!;
}
