/**
 * Plugin Registry
 * Manages CMS plugins
 */

import { logger } from '../core/logger.js';

class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.logger = logger.child('PluginRegistry');
  }

  /**
   * Register plugin
   */
  async register(name, plugin) {
    try {
      // Validate plugin structure
      this.validatePlugin(plugin);

      // Initialize plugin
      if (plugin.initialize) {
        await plugin.initialize();
      }

      // Store plugin
      this.plugins.set(name, plugin);

      this.logger.info(`Plugin registered: ${name}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to register plugin ${name}:`, error);
      throw error;
    }
  }

  /**
   * Unregister plugin
   */
  async unregister(name) {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    // Destroy plugin
    if (plugin.destroy) {
      await plugin.destroy();
    }

    this.plugins.delete(name);
    this.logger.info(`Plugin unregistered: ${name}`);

    return true;
  }

  /**
   * Get plugin
   */
  get(name) {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  getAll() {
    return Array.from(this.plugins.entries()).map(([name, plugin]) => ({
      name,
      ...plugin.getInfo?.() || {},
    }));
  }

  /**
   * Validate plugin structure
   */
  validatePlugin(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Plugin must be an object');
    }

    // Required properties
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    if (!plugin.version) {
      throw new Error('Plugin must have a version');
    }

    return true;
  }

  /**
   * Execute plugin hook
   */
  async executeHook(hookName, context) {
    for (const [name, plugin] of this.plugins) {
      if (plugin.hooks && plugin.hooks[hookName]) {
        try {
          await plugin.hooks[hookName](context);
        } catch (error) {
          this.logger.error(`Plugin ${name} hook ${hookName} failed:`, error);
        }
      }
    }
  }
}

export const pluginRegistry = new PluginRegistry();

/**
 * Register plugins from configuration
 */
export async function registerPlugins(pluginConfigs) {
  for (const config of pluginConfigs || []) {
    try {
      const plugin = await loadPlugin(config);
      await pluginRegistry.register(config.name, plugin);
    } catch (error) {
      logger.error(`Failed to load plugin ${config.name}:`, error);
    }
  }
}

/**
 * Load plugin module
 */
async function loadPlugin(config) {
  // In production, dynamically import plugin module
  // For now, return a mock plugin
  return {
    name: config.name,
    version: config.version || '1.0.0',
    description: config.description || '',

    async initialize() {
      logger.info(`Initializing plugin: ${config.name}`);
    },

    async destroy() {
      logger.info(`Destroying plugin: ${config.name}`);
    },

    getInfo() {
      return {
        name: config.name,
        version: config.version,
        description: config.description,
        enabled: config.enabled !== false,
      };
    },

    hooks: config.hooks || {},
  };
}

/**
 * Base Plugin Class
 * Extend this to create custom plugins
 */
export class Plugin {
  constructor(name, version, description) {
    this.name = name;
    this.version = version;
    this.description = description;
    this.enabled = true;
  }

  async initialize() {
    // Override in subclass
  }

  async destroy() {
    // Override in subclass
  }

  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      enabled: this.enabled,
    };
  }

  // Plugin hooks
  async beforeStart(context) {}
  async afterStart(context) {}
  async beforeStop(context) {}
  async afterStop(context) {}

  // Content type hooks
  async extendContentType(contentType) {
    return contentType;
  }

  // Route hooks
  async extendRoutes(routes) {
    return routes;
  }

  // Admin hooks
  async extendAdmin(admin) {
    return admin;
  }
}
