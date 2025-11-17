#!/usr/bin/env elide
/**
 * CLI Tool: Create Plugin
 * Generates plugin boilerplate
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

function main() {
  console.log('Elide CMS - Plugin Generator\n');

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: elide run cli/create-plugin.js <name>');
    console.log('\nExample:');
    console.log('  elide run cli/create-plugin.js my-plugin');
    process.exit(1);
  }

  const pluginName = args[0];
  const pluginDir = join(process.cwd(), 'plugins', pluginName);

  try {
    // Create plugin directory
    mkdirSync(pluginDir, { recursive: true });

    // Create plugin files
    createPluginFiles(pluginDir, pluginName);

    console.log(`\n✓ Plugin created successfully!`);
    console.log(`  Location: ${pluginDir}`);
    console.log(`\nNext steps:`);
    console.log(`  1. Edit ${join(pluginDir, 'index.js')} to add your plugin logic`);
    console.log(`  2. Register plugin in config/default.json`);
    console.log(`  3. Restart the CMS`);
  } catch (error) {
    console.error('\n✗ Failed to create plugin:', error.message);
    process.exit(1);
  }
}

function createPluginFiles(dir, name) {
  // Create index.js
  const indexContent = `/**
 * ${name} Plugin
 */

import { Plugin } from '../../plugins/registry.js';

export class ${pascalCase(name)}Plugin extends Plugin {
  constructor() {
    super('${name}', '1.0.0', 'Custom plugin');
  }

  async initialize() {
    console.log('${name} plugin initialized');
  }

  async destroy() {
    console.log('${name} plugin destroyed');
  }

  // Extend content types
  async extendContentType(contentType) {
    // Add custom fields or modify existing ones
    return contentType;
  }

  // Extend routes
  async extendRoutes(routes) {
    // Add custom routes
    routes.push({
      method: 'GET',
      path: '/api/${name}/custom',
      handler: async (req, res) => {
        res.json({ message: 'Custom route from ${name} plugin' });
      },
    });
    return routes;
  }
}

export default new ${pascalCase(name)}Plugin();
`;

  writeFileSync(join(dir, 'index.js'), indexContent);

  // Create package.json
  const packageContent = JSON.stringify({
    name: `@elide-cms/plugin-${name}`,
    version: '1.0.0',
    description: `${name} plugin for Elide CMS`,
    main: 'index.js',
    keywords: ['elide-cms', 'plugin'],
    author: '',
    license: 'MIT',
  }, null, 2);

  writeFileSync(join(dir, 'package.json'), packageContent);

  // Create README.md
  const readmeContent = `# ${name} Plugin

Custom plugin for Elide CMS.

## Installation

1. Plugin is already created in \`plugins/${name}\`
2. Register in \`config/default.json\`:

\`\`\`json
{
  "plugins": [
    {
      "name": "${name}",
      "enabled": true
    }
  ]
}
\`\`\`

3. Restart CMS

## Usage

Add your custom logic in \`index.js\`.

## API

This plugin adds the following endpoints:

- \`GET /api/${name}/custom\` - Custom endpoint
`;

  writeFileSync(join(dir, 'README.md'), readmeContent);
}

function pascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

main();
