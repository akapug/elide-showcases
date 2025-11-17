/**
 * Lifecycle Hooks
 * Content type lifecycle events (beforeCreate, afterUpdate, etc.)
 */

import { webhookEmitter } from './emitter.js';
import { logger } from '../core/logger.js';

class LifecycleHooks {
  constructor() {
    this.hooks = new Map();
    this.logger = logger.child('Lifecycle');
  }

  /**
   * Register lifecycle hook
   */
  register(contentType, event, handler) {
    const key = `${contentType}:${event}`;

    if (!this.hooks.has(key)) {
      this.hooks.set(key, []);
    }

    this.hooks.get(key).push(handler);
    this.logger.debug(`Registered hook: ${key}`);
  }

  /**
   * Trigger lifecycle event
   */
  async trigger(event, context) {
    const { contentType, data } = context;

    if (!contentType) {
      return;
    }

    const contentTypeUID = contentType.uid || contentType;
    const key = `${contentTypeUID}:${event}`;

    // Execute registered hooks
    const hooks = this.hooks.get(key) || [];

    for (const hook of hooks) {
      try {
        await hook(context);
      } catch (error) {
        this.logger.error(`Hook ${key} failed:`, error);
        throw error;
      }
    }

    // Emit webhook event
    const webhookEvent = this.getWebhookEvent(contentTypeUID, event);
    if (webhookEvent) {
      await webhookEmitter.emit(webhookEvent, {
        model: contentTypeUID,
        entry: data,
      });
    }

    this.logger.debug(`Triggered lifecycle event: ${key}`);
  }

  /**
   * Get webhook event name from lifecycle event
   */
  getWebhookEvent(contentType, lifecycleEvent) {
    const eventMap = {
      beforeCreate: `entry.beforeCreate`,
      afterCreate: `entry.create`,
      beforeUpdate: `entry.beforeUpdate`,
      afterUpdate: `entry.update`,
      beforeDelete: `entry.beforeDelete`,
      afterDelete: `entry.delete`,
      beforePublish: `entry.beforePublish`,
      afterPublish: `entry.publish`,
      beforeUnpublish: `entry.beforeUnpublish`,
      afterUnpublish: `entry.unpublish`,
    };

    return eventMap[lifecycleEvent];
  }

  /**
   * Remove all hooks for content type
   */
  unregister(contentType) {
    for (const key of this.hooks.keys()) {
      if (key.startsWith(`${contentType}:`)) {
        this.hooks.delete(key);
      }
    }
  }

  /**
   * Get all registered hooks
   */
  getHooks(contentType = null) {
    if (contentType) {
      const hooks = {};
      for (const [key, handlers] of this.hooks.entries()) {
        if (key.startsWith(`${contentType}:`)) {
          hooks[key] = handlers;
        }
      }
      return hooks;
    }

    return Object.fromEntries(this.hooks.entries());
  }
}

export const lifecycleHooks = new LifecycleHooks();

/**
 * Built-in lifecycle hooks
 */

// Auto-update timestamps
lifecycleHooks.register('*', 'beforeCreate', async (context) => {
  if (context.data) {
    context.data.createdAt = new Date();
    context.data.updatedAt = new Date();
  }
});

lifecycleHooks.register('*', 'beforeUpdate', async (context) => {
  if (context.data) {
    context.data.updatedAt = new Date();
  }
});

/**
 * Lifecycle Decorator
 * Decorator to add lifecycle hooks to models
 */
export function withLifecycle(contentType) {
  return {
    async beforeCreate(data) {
      await lifecycleHooks.trigger('beforeCreate', { contentType, data });
    },

    async afterCreate(data) {
      await lifecycleHooks.trigger('afterCreate', { contentType, data });
    },

    async beforeUpdate(data, where) {
      await lifecycleHooks.trigger('beforeUpdate', { contentType, data, where });
    },

    async afterUpdate(data) {
      await lifecycleHooks.trigger('afterUpdate', { contentType, data });
    },

    async beforeDelete(where) {
      await lifecycleHooks.trigger('beforeDelete', { contentType, where });
    },

    async afterDelete(data) {
      await lifecycleHooks.trigger('afterDelete', { contentType, data });
    },

    async beforePublish(data) {
      await lifecycleHooks.trigger('beforePublish', { contentType, data });
    },

    async afterPublish(data) {
      await lifecycleHooks.trigger('afterPublish', { contentType, data });
    },

    async beforeUnpublish(data) {
      await lifecycleHooks.trigger('beforeUnpublish', { contentType, data });
    },

    async afterUnpublish(data) {
      await lifecycleHooks.trigger('afterUnpublish', { contentType, data });
    },
  };
}
