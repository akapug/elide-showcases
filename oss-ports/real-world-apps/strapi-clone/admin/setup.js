/**
 * Admin Panel Setup
 * Configures admin interface and APIs
 */

import { logger } from '../core/logger.js';

export async function setupAdminPanel(config) {
  const adminLogger = logger.child('Admin');

  try {
    // Initialize admin configuration
    const adminConfig = {
      ...config,
      path: config.path || '/admin',
      serveAdminPanel: config.serveAdminPanel !== false,
    };

    adminLogger.info('Admin panel configured', {
      path: adminConfig.path,
      serveAdminPanel: adminConfig.serveAdminPanel,
    });

    return adminConfig;
  } catch (error) {
    adminLogger.error('Failed to setup admin panel:', error);
    throw error;
  }
}

/**
 * Admin Panel Builder
 * Generates admin interface configuration
 */
export class AdminPanelBuilder {
  constructor() {
    this.sections = [];
    this.customRoutes = [];
    this.menuItems = [];
  }

  /**
   * Add admin section
   */
  addSection(section) {
    this.sections.push(section);
    return this;
  }

  /**
   * Add custom admin route
   */
  addRoute(route) {
    this.customRoutes.push(route);
    return this;
  }

  /**
   * Add menu item
   */
  addMenuItem(item) {
    this.menuItems.push(item);
    return this;
  }

  /**
   * Build admin configuration
   */
  build() {
    return {
      sections: this.sections,
      routes: this.customRoutes,
      menu: this.buildMenu(),
    };
  }

  /**
   * Build admin menu structure
   */
  buildMenu() {
    const defaultMenu = [
      {
        name: 'Content Manager',
        icon: 'document',
        to: '/admin/content-manager',
      },
      {
        name: 'Content-Type Builder',
        icon: 'puzzle',
        to: '/admin/content-type-builder',
      },
      {
        name: 'Media Library',
        icon: 'folder',
        to: '/admin/media-library',
      },
      {
        name: 'Plugins',
        icon: 'plug',
        to: '/admin/plugins',
      },
      {
        name: 'Settings',
        icon: 'cog',
        children: [
          {
            name: 'Users & Permissions',
            to: '/admin/settings/users-permissions',
          },
          {
            name: 'Roles',
            to: '/admin/settings/roles',
          },
          {
            name: 'API Tokens',
            to: '/admin/settings/api-tokens',
          },
          {
            name: 'Webhooks',
            to: '/admin/settings/webhooks',
          },
          {
            name: 'Internationalization',
            to: '/admin/settings/i18n',
          },
        ],
      },
    ];

    return [...defaultMenu, ...this.menuItems];
  }
}

/**
 * Admin Services
 * Provides admin-specific functionality
 */
export class AdminService {
  /**
   * Get admin overview
   */
  async getOverview() {
    const { contentTypeBuilder } = await import('../content-types/builder.js');
    const { getDatabase } = await import('../database/connection.js');

    const db = getDatabase();

    // Count content types
    const contentTypes = await contentTypeBuilder.findAll();

    // Count entries per content type
    const entryCounts = {};
    for (const ct of contentTypes) {
      if (ct.kind !== 'component') {
        const tableName = `ct_${ct.singularName.toLowerCase()}`;
        const result = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        entryCounts[ct.uid] = result[0].count;
      }
    }

    // Count users
    const userResult = await db.query('SELECT COUNT(*) as count FROM cms_users');

    // Count media
    const mediaResult = await db.query('SELECT COUNT(*) as count FROM cms_media');

    return {
      contentTypes: {
        total: contentTypes.filter(ct => ct.kind !== 'component').length,
        components: contentTypes.filter(ct => ct.kind === 'component').length,
        entries: entryCounts,
      },
      users: userResult[0].count,
      media: mediaResult[0].count,
      version: '1.0.0',
    };
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    return {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
