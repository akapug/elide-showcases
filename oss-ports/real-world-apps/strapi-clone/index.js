#!/usr/bin/env elide
/**
 * Elide Headless CMS - Main Entry Point
 * Production-ready headless CMS inspired by Strapi
 */

import { createServer } from './core/server.js';
import { loadConfig } from './config/loader.js';
import { initializeDatabase } from './database/connection.js';
import { registerPlugins } from './plugins/registry.js';
import { setupAdminPanel } from './admin/setup.js';
import { generateAPIs } from './api/generator.js';
import { logger } from './core/logger.js';

async function bootstrap() {
  try {
    logger.info('Starting Elide Headless CMS...');

    // Load configuration
    const config = await loadConfig();
    logger.info(`Environment: ${config.environment}`);

    // Initialize database
    await initializeDatabase(config.database);
    logger.info('Database connected successfully');

    // Register plugins
    await registerPlugins(config.plugins);
    logger.info(`Registered ${config.plugins.length} plugins`);

    // Setup admin panel
    await setupAdminPanel(config.admin);
    logger.info('Admin panel ready');

    // Generate APIs
    await generateAPIs(config.contentTypes);
    logger.info('APIs generated successfully');

    // Create and start server
    const server = await createServer(config);
    const port = config.server.port || 1337;

    await server.listen(port, config.server.host || '0.0.0.0');

    logger.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║          Elide Headless CMS is running!              ║
║                                                       ║
║  Admin Panel:    http://localhost:${port}/admin        ║
║  REST API:       http://localhost:${port}/api          ║
║  GraphQL API:    http://localhost:${port}/graphql      ║
║  Documentation:  http://localhost:${port}/docs         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);

  } catch (error) {
    logger.error('Failed to start CMS:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

// Start the application
bootstrap();
