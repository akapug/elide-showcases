/**
 * Configuration Management
 */

import { readFile, exists } from 'elide:fs';
import { join } from 'elide:path';

export class Config {
  static async load() {
    const env = process.env.NODE_ENV || 'development';
    const configPath = join(process.cwd(), 'config', `${env}.json`);

    let config = this.getDefaults();

    // Load config file if it exists
    if (await exists(configPath)) {
      const fileConfig = JSON.parse(await readFile(configPath, 'utf8'));
      config = this.merge(config, fileConfig);
    }

    // Override with environment variables
    config = this.applyEnvironment(config);

    return config;
  }

  static getDefaults() {
    return {
      env: process.env.NODE_ENV || 'development',
      dev: process.env.NODE_ENV !== 'production',

      server: {
        host: '0.0.0.0',
        port: 3000,
        allowOrigin: '*',
      },

      database: {
        path: './data/ghost.db',
        backup: './data/backups',
      },

      auth: {
        secret: process.env.JWT_SECRET || 'change-me-in-production',
        expiresIn: '7d',
        refreshExpiresIn: '30d',
        passwordMinLength: 10,
      },

      media: {
        uploadPath: './content/images',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        imageProcessing: {
          enabled: true,
          sizes: {
            thumbnail: { width: 150, height: 150 },
            small: { width: 400, height: 400 },
            medium: { width: 800, height: 800 },
            large: { width: 1200, height: 1200 },
          },
        },
      },

      themes: {
        active: 'casper',
        path: './themes',
      },

      cache: {
        enabled: true,
        ttl: 300, // 5 minutes
        maxSize: 100, // MB
      },

      seo: {
        titleSuffix: ' - My Ghost Blog',
        description: 'A modern publishing platform',
        twitterCard: 'summary_large_image',
        ogType: 'website',
      },

      email: {
        enabled: false,
        from: 'noreply@example.com',
        transport: 'smtp',
        smtp: {
          host: 'localhost',
          port: 25,
        },
      },

      features: {
        amp: true,
        comments: true,
        socialSharing: true,
        search: true,
        rss: true,
        webhooks: true,
      },

      cdn: {
        enabled: false,
        url: '',
      },

      analytics: {
        enabled: true,
        retention: 90, // days
      },
    };
  }

  static merge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.merge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  static applyEnvironment(config) {
    // Server
    if (process.env.HOST) config.server.host = process.env.HOST;
    if (process.env.PORT) config.server.port = parseInt(process.env.PORT);

    // Database
    if (process.env.DATABASE_PATH) config.database.path = process.env.DATABASE_PATH;

    // Auth
    if (process.env.JWT_SECRET) config.auth.secret = process.env.JWT_SECRET;

    // Media
    if (process.env.UPLOAD_PATH) config.media.uploadPath = process.env.UPLOAD_PATH;
    if (process.env.MAX_FILE_SIZE) {
      config.media.maxFileSize = parseInt(process.env.MAX_FILE_SIZE);
    }

    // CDN
    if (process.env.CDN_URL) {
      config.cdn.enabled = true;
      config.cdn.url = process.env.CDN_URL;
    }

    return config;
  }
}
