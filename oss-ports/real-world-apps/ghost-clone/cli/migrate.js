#!/usr/bin/env elide

/**
 * Database Migration CLI Tool
 */

import { DatabaseManager } from '../database/manager.js';
import { Config } from '../config/index.js';

async function main() {
  console.log('🔧 Ghost Clone - Database Migration Tool\n');

  const config = await Config.load();
  const db = new DatabaseManager(config.database.path);

  try {
    await db.initialize();
    await db.runMigrations();

    console.log('\n✅ Migration complete!');

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);

    await db.close();
    process.exit(1);
  }
}

main();
