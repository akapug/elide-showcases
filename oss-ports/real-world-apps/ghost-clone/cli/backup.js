#!/usr/bin/env elide

/**
 * Database Backup CLI Tool
 */

import { readFile, writeFile, mkdir, exists } from 'elide:fs';
import { join } from 'elide:path';
import { Config } from '../config/index.js';

async function main() {
  console.log('💾 Ghost Clone - Database Backup Tool\n');

  const config = await Config.load();
  const dbPath = config.database.path;
  const backupDir = config.database.backup;

  try {
    // Ensure backup directory exists
    if (!await exists(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `ghost-backup-${timestamp}.db`;
    const backupPath = join(backupDir, backupFilename);

    console.log(`📂 Source: ${dbPath}`);
    console.log(`📂 Backup: ${backupPath}`);

    // Copy database file
    const data = await readFile(dbPath);
    await writeFile(backupPath, data);

    const sizeMB = (data.length / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Backup created successfully!`);
    console.log(`   Size: ${sizeMB} MB`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
