#!/usr/bin/env elide
/**
 * Database Migration Script
 * Runs all pending migrations
 */

import { loadConfig } from '../config/loader.js';
import { initializeDatabase } from './connection.js';
import { logger } from '../core/logger.js';

async function runMigrations() {
  console.log('Elide CMS - Database Migration Tool\n');

  try {
    // Load configuration
    const config = await loadConfig();
    console.log(`Environment: ${config.environment}`);
    console.log(`Database: ${config.database.client}\n`);

    // Initialize database (this runs migrations)
    await initializeDatabase(config.database);

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
