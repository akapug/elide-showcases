#!/usr/bin/env elide

/**
 * Database Restore CLI Tool
 */

import { readFile, writeFile, readdir } from 'elide:fs';
import { join } from 'elide:path';
import { Config } from '../config/index.js';

async function main() {
  const backupFile = process.argv[2];

  console.log('🔄 Ghost Clone - Database Restore Tool\n');

  const config = await Config.load();
  const dbPath = config.database.path;
  const backupDir = config.database.backup;

  try {
    let backupPath;

    if (backupFile) {
      // Restore specific backup
      backupPath = join(backupDir, backupFile);
      console.log(`📂 Restoring from: ${backupFile}`);
    } else {
      // Find latest backup
      const files = await readdir(backupDir);
      const backups = files
        .filter(f => f.startsWith('ghost-backup-') && f.endsWith('.db'))
        .sort()
        .reverse();

      if (backups.length === 0) {
        console.error('❌ No backups found');
        process.exit(1);
      }

      backupPath = join(backupDir, backups[0]);
      console.log(`📂 Restoring latest backup: ${backups[0]}`);
    }

    console.log(`📂 Target: ${dbPath}`);

    // Read backup
    const data = await readFile(backupPath);

    // Create backup of current database
    console.log('\n⚠️  Creating safety backup of current database...');
    const safetyBackup = await readFile(dbPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await writeFile(join(backupDir, `ghost-pre-restore-${timestamp}.db`), safetyBackup);

    // Restore
    await writeFile(dbPath, data);

    const sizeMB = (data.length / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Database restored successfully!`);
    console.log(`   Size: ${sizeMB} MB`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Restore failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
