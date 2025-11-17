#!/usr/bin/env elide
/**
 * CLI Tool: Generate API Documentation
 * Generates API documentation from content types
 */

import { contentTypeBuilder } from '../content-types/builder.js';
import { loadConfig } from '../config/loader.js';
import { initializeDatabase } from '../database/connection.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('Elide CMS - API Documentation Generator\n');

  const config = await loadConfig();
  await initializeDatabase(config.database);

  const contentTypes = await contentTypeBuilder.findAll();
  const filteredTypes = contentTypes.filter(ct => ct.kind !== 'component');

  console.log(`Found ${filteredTypes.length} content types\n`);

  // Generate OpenAPI/Swagger documentation
  const openAPI = generateOpenAPISpec(filteredTypes, config);

  // Write to file
  const outputPath = join(process.cwd(), 'docs', 'api-spec.json');
  writeFileSync(outputPath, JSON.stringify(openAPI, null, 2));

  console.log(`✓ API documentation generated: ${outputPath}`);

  // Generate markdown documentation
  const markdown = generateMarkdownDocs(filteredTypes, config);
  const mdPath = join(process.cwd(), 'docs', 'API.md');
  writeFileSync(mdPath, markdown);

  console.log(`✓ Markdown documentation generated: ${mdPath}`);
}

function generateOpenAPISpec(contentTypes, config) {
  const paths = {};

  for (const ct of contentTypes) {
    const pluralPath = `/${ct.pluralName}`;
    const singlePath = `/${ct.pluralName}/{id}`;

    paths[`/api${pluralPath}`] = {
      get: {
        summary: `Get all ${ct.pluralName}`,
        tags: [ct.displayName],
        parameters: [
          { name: 'filters', in: 'query', schema: { type: 'object' } },
          { name: 'sort', in: 'query', schema: { type: 'array' } },
          { name: 'pagination', in: 'query', schema: { type: 'object' } },
        ],
        responses: {
          200: { description: 'Success' },
        },
      },
      post: {
        summary: `Create ${ct.singularName}`,
        tags: [ct.displayName],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${ct.singularName}` },
            },
          },
        },
        responses: {
          201: { description: 'Created' },
        },
      },
    };

    paths[`/api${singlePath}`] = {
      get: {
        summary: `Get ${ct.singularName} by ID`,
        tags: [ct.displayName],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Success' },
          404: { description: 'Not found' },
        },
      },
      put: {
        summary: `Update ${ct.singularName}`,
        tags: [ct.displayName],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Updated' },
        },
      },
      delete: {
        summary: `Delete ${ct.singularName}`,
        tags: [ct.displayName],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Deleted' },
        },
      },
    };
  }

  return {
    openapi: '3.0.0',
    info: {
      title: 'Elide CMS API',
      version: '1.0.0',
      description: 'Auto-generated API documentation',
    },
    servers: [
      { url: `http://localhost:${config.server.port}`, description: 'Development' },
    ],
    paths,
    components: {
      schemas: generateSchemas(contentTypes),
    },
  };
}

function generateSchemas(contentTypes) {
  const schemas = {};

  for (const ct of contentTypes) {
    const properties = {};

    for (const [name, attr] of Object.entries(ct.attributes)) {
      properties[name] = {
        type: getOpenAPIType(attr.type),
        description: attr.description || '',
      };
    }

    schemas[ct.singularName] = {
      type: 'object',
      properties,
    };
  }

  return schemas;
}

function getOpenAPIType(type) {
  const typeMap = {
    string: 'string',
    text: 'string',
    richtext: 'string',
    email: 'string',
    password: 'string',
    integer: 'integer',
    biginteger: 'integer',
    float: 'number',
    decimal: 'number',
    boolean: 'boolean',
    date: 'string',
    datetime: 'string',
    timestamp: 'string',
    json: 'object',
  };

  return typeMap[type] || 'string';
}

function generateMarkdownDocs(contentTypes, config) {
  let md = `# API Documentation\n\n`;
  md += `Auto-generated API documentation for Elide CMS.\n\n`;
  md += `Base URL: \`http://localhost:${config.server.port}/api\`\n\n`;

  for (const ct of contentTypes) {
    md += `## ${ct.displayName}\n\n`;
    md += `### Get all ${ct.pluralName}\n\n`;
    md += `\`GET /api/${ct.pluralName}\`\n\n`;
    md += `Query parameters:\n`;
    md += `- \`filters\`: Filter results\n`;
    md += `- \`sort\`: Sort results\n`;
    md += `- \`pagination\`: Pagination options\n\n`;

    md += `### Get single ${ct.singularName}\n\n`;
    md += `\`GET /api/${ct.pluralName}/:id\`\n\n`;

    md += `### Create ${ct.singularName}\n\n`;
    md += `\`POST /api/${ct.pluralName}\`\n\n`;

    md += `### Update ${ct.singularName}\n\n`;
    md += `\`PUT /api/${ct.pluralName}/:id\`\n\n`;

    md += `### Delete ${ct.singularName}\n\n`;
    md += `\`DELETE /api/${ct.pluralName}/:id\`\n\n`;

    md += `### Attributes\n\n`;
    for (const [name, attr] of Object.entries(ct.attributes)) {
      md += `- **${name}** (\`${attr.type}\`)${attr.required ? ' *required*' : ''}\n`;
    }
    md += `\n`;
  }

  return md;
}

main();
