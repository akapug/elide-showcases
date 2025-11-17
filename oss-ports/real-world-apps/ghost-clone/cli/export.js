#!/usr/bin/env elide

/**
 * Export Content CLI Tool
 *
 * Exports all content to JSON format for migration/backup.
 */

import { writeFile } from 'elide:fs';
import { DatabaseManager } from '../database/manager.js';
import { Config } from '../config/index.js';

async function main() {
  console.log('📤 Ghost Clone - Content Export Tool\n');

  const config = await Config.load();
  const db = new DatabaseManager(config.database.path);

  try {
    await db.initialize();

    console.log('Exporting content...');

    const data = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      data: {
        users: await db.query('SELECT * FROM users'),
        posts: await db.query('SELECT * FROM posts'),
        pages: await db.query('SELECT * FROM pages'),
        tags: await db.query('SELECT * FROM tags'),
        posts_tags: await db.query('SELECT * FROM posts_tags'),
        settings: await db.query('SELECT * FROM settings'),
      },
    };

    // Remove passwords
    data.data.users.forEach(u => delete u.password);

    // Write to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ghost-export-${timestamp}.json`;

    await writeFile(filename, JSON.stringify(data, null, 2));

    console.log(`\n✅ Content exported to: ${filename}`);
    console.log(`   Users: ${data.data.users.length}`);
    console.log(`   Posts: ${data.data.posts.length}`);
    console.log(`   Pages: ${data.data.pages.length}`);
    console.log(`   Tags: ${data.data.tags.length}`);

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    console.error(error.stack);

    await db.close();
    process.exit(1);
  }
}

main();
