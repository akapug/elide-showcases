#!/usr/bin/env elide

/**
 * Import Content CLI Tool
 *
 * Imports content from JSON export format.
 */

import { readFile } from 'elide:fs';
import { DatabaseManager } from '../database/manager.js';
import { Config } from '../config/index.js';

async function main() {
  const importFile = process.argv[2];

  if (!importFile) {
    console.error('Usage: elide run cli/import.js <export-file.json>');
    process.exit(1);
  }

  console.log('📥 Ghost Clone - Content Import Tool\n');

  const config = await Config.load();
  const db = new DatabaseManager(config.database.path);

  try {
    await db.initialize();

    console.log(`Reading: ${importFile}`);

    const content = await readFile(importFile, 'utf8');
    const data = JSON.parse(content);

    console.log(`Export version: ${data.version}`);
    console.log(`Exported at: ${data.exported_at}`);
    console.log('\nImporting content...');

    // Import in transaction
    await db.transaction(async (db) => {
      // Clear existing data (optional - could be configurable)
      console.log('  Clearing existing data...');
      await db.execute('DELETE FROM posts_tags');
      await db.execute('DELETE FROM posts');
      await db.execute('DELETE FROM pages');
      await db.execute('DELETE FROM tags');

      // Import tags
      console.log(`  Importing ${data.data.tags.length} tags...`);
      for (const tag of data.data.tags) {
        await db.create('tags', tag);
      }

      // Import posts
      console.log(`  Importing ${data.data.posts.length} posts...`);
      for (const post of data.data.posts) {
        await db.create('posts', post);
      }

      // Import pages
      console.log(`  Importing ${data.data.pages.length} pages...`);
      for (const page of data.data.pages) {
        await db.create('pages', page);
      }

      // Import post-tag relationships
      console.log(`  Importing ${data.data.posts_tags.length} post-tag relationships...`);
      for (const pt of data.data.posts_tags) {
        await db.create('posts_tags', pt);
      }

      // Import settings (merge with existing)
      console.log(`  Importing ${data.data.settings.length} settings...`);
      for (const setting of data.data.settings) {
        const existing = await db.findOne('settings', { key: setting.key });

        if (existing) {
          await db.update('settings', existing.id, {
            value: setting.value,
            type: setting.type,
            updated_at: new Date().toISOString(),
          });
        } else {
          await db.create('settings', setting);
        }
      }
    });

    console.log(`\n✅ Content imported successfully!`);

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);

    await db.close();
    process.exit(1);
  }
}

main();
