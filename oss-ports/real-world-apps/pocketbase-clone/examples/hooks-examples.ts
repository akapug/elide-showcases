/**
 * Hooks Examples
 * Comprehensive examples of using the hooks system
 */

import { HooksManager, HookContext, CustomEndpoint } from '../src/hooks/manager.js';
import { createServer } from '../src/index.js';

/**
 * Example 1: Auto-generate slug from title
 */
export function autoSlugHook() {
  return async (context: HookContext) => {
    if (context.data && context.data.title && !context.data.slug) {
      context.data.slug = context.data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Ensure uniqueness by appending timestamp if needed
      const existing = await checkSlugExists(context.collection.name, context.data.slug);
      if (existing) {
        context.data.slug = `${context.data.slug}-${Date.now()}`;
      }
    }
    return context;
  };
}

/**
 * Example 2: Send email notification on new comment
 */
export function emailNotificationHook() {
  return async (context: HookContext) => {
    if (context.collection.name === 'comments' && context.record) {
      // Get the post author
      const postId = context.record.post;
      const post = await getRecord('posts', postId);

      if (post && post.author !== context.auth?.id) {
        // Send email to post author
        await sendEmail({
          to: post.authorEmail,
          subject: 'New comment on your post',
          body: `Someone commented on your post: ${context.record.content}`,
        });
      }
    }
    return context;
  };
}

/**
 * Example 3: Audit log for sensitive collections
 */
export function auditLogHook() {
  return async (context: HookContext) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: context.auth?.id || 'anonymous',
      collection: context.collection.name,
      recordId: context.record?.id || 'new',
      action: context.record ? 'update' : 'create',
      changes: context.data,
      ip: context.request?.headers['x-forwarded-for'] || context.request?.connection?.remoteAddress,
    };

    // Store audit log
    await createRecord('audit_logs', auditLog);

    return context;
  };
}

/**
 * Example 4: Image optimization
 */
export function imageOptimizationHook() {
  return async (context: HookContext) => {
    if (context.data?.image) {
      // Optimize image before saving
      const optimizedImage = await optimizeImage(context.data.image, {
        quality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp',
      });

      context.data.image = optimizedImage;
      context.data.imageOptimized = true;
    }
    return context;
  };
}

/**
 * Example 5: Content moderation
 */
export function contentModerationHook() {
  return async (context: HookContext) => {
    if (context.data?.content) {
      const moderationResult = await moderateContent(context.data.content);

      if (moderationResult.inappropriate) {
        throw new Error('Content violates community guidelines');
      }

      if (moderationResult.needsReview) {
        context.data.moderationStatus = 'pending';
        context.data.published = false;
      }
    }
    return context;
  };
}

/**
 * Example 6: Cache invalidation
 */
export function cacheInvalidationHook() {
  const cache = new Map();

  return async (context: HookContext) => {
    const cacheKeys = [
      `${context.collection.name}:list`,
      `${context.collection.name}:${context.record?.id}`,
    ];

    for (const key of cacheKeys) {
      cache.delete(key);
    }

    console.log('Cache invalidated:', cacheKeys);
    return context;
  };
}

/**
 * Example 7: Webhook trigger
 */
export function webhookTriggerHook(webhookUrl: string) {
  return async (context: HookContext) => {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: `${context.collection.name}.${context.record ? 'update' : 'create'}`,
          timestamp: new Date().toISOString(),
          record: context.record,
          data: context.data,
          user: context.auth,
        }),
      });
    } catch (error) {
      console.error('Webhook failed:', error);
      // Don't throw - webhook failures shouldn't block the operation
    }
    return context;
  };
}

/**
 * Example 8: Rate limiting per user
 */
export function rateLimitHook(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();

  return async (context: HookContext) => {
    if (!context.auth) return context;

    const userId = context.auth.id;
    const now = Date.now();
    const userRequests = requests.get(userId) || [];

    // Clean old requests
    const validRequests = userRequests.filter((time) => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    return context;
  };
}

/**
 * Example 9: Auto-increment order number
 */
export function autoIncrementHook(field: string = 'orderNumber') {
  let counter = 1000;

  return async (context: HookContext) => {
    if (!context.data?.[field]) {
      context.data[field] = ++counter;
    }
    return context;
  };
}

/**
 * Example 10: Full-text search indexing
 */
export function searchIndexHook() {
  const searchIndex = new Map();

  return async (context: HookContext) => {
    if (context.record) {
      const searchableContent = [
        context.record.title,
        context.record.content,
        context.record.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      searchIndex.set(context.record.id, searchableContent);
    }
    return context;
  };
}

/**
 * Example 11: Relationship validation
 */
export function relationshipValidationHook() {
  return async (context: HookContext) => {
    // Validate that referenced records exist
    for (const field of context.collection.schema) {
      if (field.type === 'relation' && context.data?.[field.name]) {
        const relatedIds = Array.isArray(context.data[field.name])
          ? context.data[field.name]
          : [context.data[field.name]];

        for (const id of relatedIds) {
          const exists = await checkRecordExists(field.options?.collectionId || '', id);
          if (!exists) {
            throw new Error(`Related record ${id} not found in ${field.options?.collectionId}`);
          }
        }
      }
    }
    return context;
  };
}

/**
 * Example 12: Analytics tracking
 */
export function analyticsHook() {
  return async (context: HookContext) => {
    const event = {
      timestamp: new Date().toISOString(),
      collection: context.collection.name,
      action: context.record ? 'update' : 'create',
      userId: context.auth?.id || 'anonymous',
      metadata: {
        recordId: context.record?.id,
        fields: Object.keys(context.data || {}),
      },
    };

    // Send to analytics service
    console.log('Analytics event:', event);

    return context;
  };
}

/**
 * Custom Endpoint Examples
 */

/**
 * Example 1: Health check endpoint
 */
export const healthCheckEndpoint: CustomEndpoint = {
  method: 'GET',
  path: '/custom/health',
  handler: async (request, response) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  },
};

/**
 * Example 2: Statistics endpoint
 */
export const statisticsEndpoint: CustomEndpoint = {
  method: 'GET',
  path: '/custom/stats',
  requireAuth: true,
  handler: async (request, response) => {
    const stats = {
      totalPosts: await countRecords('posts'),
      totalUsers: await countRecords('users'),
      totalComments: await countRecords('comments'),
      recentPosts: await getRecentRecords('posts', 5),
    };
    return stats;
  },
};

/**
 * Example 3: Bulk import endpoint
 */
export const bulkImportEndpoint: CustomEndpoint = {
  method: 'POST',
  path: '/custom/import',
  requireAdmin: true,
  handler: async (request, response) => {
    const { collection, records } = request.body;

    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const record of records) {
      try {
        await createRecord(collection, record);
        results.imported++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(error.message);
      }
    }

    return results;
  },
};

/**
 * Example 4: Export data endpoint
 */
export const exportEndpoint: CustomEndpoint = {
  method: 'GET',
  path: '/custom/export/:collection',
  requireAuth: true,
  handler: async (request, response) => {
    const { collection } = request.params;
    const records = await getAllRecords(collection);

    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', `attachment; filename="${collection}.csv"`);

    // Convert to CSV
    const csv = convertToCSV(records);
    response.send(csv);
  },
};

/**
 * Example 5: Search endpoint
 */
export const searchEndpoint: CustomEndpoint = {
  method: 'GET',
  path: '/custom/search',
  handler: async (request, response) => {
    const { q, collections } = request.query;

    const results = await Promise.all(
      collections.split(',').map(async (collection: string) => {
        const records = await searchRecords(collection, q);
        return { collection, records };
      })
    );

    return results;
  },
};

/**
 * Complete Hooks Configuration Example
 */
export const completeHooksConfig = {
  hooks: {
    'before-create': {
      posts: autoSlugHook(),
      orders: autoIncrementHook('orderNumber'),
      '*': rateLimitHook(100, 60000), // 100 requests per minute
    },
    'after-create': {
      comments: emailNotificationHook(),
      posts: webhookTriggerHook('https://example.com/webhook'),
      '*': analyticsHook(),
    },
    'before-update': {
      '*': relationshipValidationHook(),
    },
    'after-update': {
      '*': cacheInvalidationHook(),
    },
    'after-delete': {
      '*': cacheInvalidationHook(),
    },
  },
  endpoints: [
    healthCheckEndpoint,
    statisticsEndpoint,
    bulkImportEndpoint,
    exportEndpoint,
    searchEndpoint,
  ],
};

/**
 * Register hooks with server
 */
export async function registerHooks() {
  const server = await createServer({
    port: 8093,
    dbPath: './examples/hooks-data.db',
    storagePath: './examples/hooks-storage',
  });

  const hooks = server.hooks;

  // Register individual hooks
  hooks.on('before-create', 'posts', autoSlugHook());
  hooks.on('after-create', 'comments', emailNotificationHook());
  hooks.on('before-create', 'posts', contentModerationHook());

  // Register custom endpoints
  hooks.registerEndpoint(healthCheckEndpoint);
  hooks.registerEndpoint(statisticsEndpoint);
  hooks.registerEndpoint(bulkImportEndpoint);

  console.log('Hooks and endpoints registered successfully!');
  console.log(`Server running at http://localhost:8093`);

  return server;
}

// Helper functions (mock implementations)
async function checkSlugExists(collection: string, slug: string): Promise<boolean> {
  return false; // Mock implementation
}

async function getRecord(collection: string, id: string): Promise<any> {
  return null; // Mock implementation
}

async function createRecord(collection: string, data: any): Promise<any> {
  return null; // Mock implementation
}

async function sendEmail(options: any): Promise<void> {
  console.log('Email sent:', options);
}

async function optimizeImage(image: any, options: any): Promise<any> {
  return image; // Mock implementation
}

async function moderateContent(content: string): Promise<any> {
  return { inappropriate: false, needsReview: false };
}

async function checkRecordExists(collection: string, id: string): Promise<boolean> {
  return true; // Mock implementation
}

async function countRecords(collection: string): Promise<number> {
  return 0; // Mock implementation
}

async function getRecentRecords(collection: string, limit: number): Promise<any[]> {
  return []; // Mock implementation
}

async function getAllRecords(collection: string): Promise<any[]> {
  return []; // Mock implementation
}

async function searchRecords(collection: string, query: string): Promise<any[]> {
  return []; // Mock implementation
}

function convertToCSV(records: any[]): string {
  if (records.length === 0) return '';

  const headers = Object.keys(records[0]).join(',');
  const rows = records.map((record) => Object.values(record).join(','));

  return [headers, ...rows].join('\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  registerHooks().catch(console.error);
}
