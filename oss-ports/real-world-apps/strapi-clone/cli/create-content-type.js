#!/usr/bin/env elide
/**
 * CLI Tool: Create Content Type
 * Interactive content type creation
 */

import { contentTypeBuilder } from '../content-types/builder.js';
import { loadConfig } from '../config/loader.js';
import { initializeDatabase } from '../database/connection.js';
import { logger } from '../core/logger.js';

async function main() {
  console.log('Elide CMS - Content Type Generator\n');

  // Load configuration
  const config = await loadConfig();
  await initializeDatabase(config.database);

  // Get content type details from arguments or interactive prompt
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: elide run cli/create-content-type.js <name> [options]');
    console.log('\nOptions:');
    console.log('  --plural <name>      Plural name');
    console.log('  --display <name>     Display name');
    console.log('  --single-type        Create single type instead of collection');
    console.log('  --draft-publish      Enable draft & publish');
    console.log('\nExample:');
    console.log('  elide run cli/create-content-type.js article --plural articles --display "Article"');
    process.exit(1);
  }

  const singularName = args[0];
  const options = parseOptions(args.slice(1));

  const contentType = {
    singularName,
    pluralName: options.plural || `${singularName}s`,
    displayName: options.display || capitalize(singularName),
    kind: options.singleType ? 'singleType' : 'collectionType',
    draftAndPublish: options.draftPublish !== false,
    attributes: {
      title: {
        type: 'string',
        required: true,
      },
      content: {
        type: 'richtext',
      },
    },
  };

  try {
    const created = await contentTypeBuilder.createContentType(contentType);
    console.log(`\n✓ Content type created successfully!`);
    console.log(`  UID: ${created.uid}`);
    console.log(`  Table: ct_${singularName}`);
    console.log(`\nAPI Endpoints:`);
    console.log(`  GET    /api/${contentType.pluralName}`);
    console.log(`  GET    /api/${contentType.pluralName}/:id`);
    console.log(`  POST   /api/${contentType.pluralName}`);
    console.log(`  PUT    /api/${contentType.pluralName}/:id`);
    console.log(`  DELETE /api/${contentType.pluralName}/:id`);
  } catch (error) {
    console.error('\n✗ Failed to create content type:', error.message);
    process.exit(1);
  }
}

function parseOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plural') {
      options.plural = args[++i];
    } else if (args[i] === '--display') {
      options.display = args[++i];
    } else if (args[i] === '--single-type') {
      options.singleType = true;
    } else if (args[i] === '--draft-publish') {
      options.draftPublish = true;
    }
  }
  return options;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

main();
