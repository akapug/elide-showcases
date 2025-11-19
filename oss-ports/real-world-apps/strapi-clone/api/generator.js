/**
 * API Generator
 * Automatically generates REST and GraphQL APIs from content types
 */

import { contentTypeBuilder } from '../content-types/builder.js';
import { logger } from '../core/logger.js';
import { RESTController } from './rest-controller.js';
import { GraphQLSchema } from './graphql-schema.js';

export async function generateAPIs(contentTypes) {
  const apiLogger = logger.child('APIGenerator');

  try {
    // Load all content types from database
    const allContentTypes = await contentTypeBuilder.findAll();

    const apis = {
      rest: {},
      graphql: null,
    };

    // Generate REST APIs
    for (const contentType of allContentTypes) {
      if (contentType.kind === 'collectionType' || contentType.kind === 'singleType') {
        apis.rest[contentType.uid] = new RESTController(contentType);
        apiLogger.info(`Generated REST API for ${contentType.uid}`);
      }
    }

    // Generate GraphQL API
    if (allContentTypes.length > 0) {
      apis.graphql = new GraphQLSchema(allContentTypes);
      apiLogger.info('Generated GraphQL API');
    }

    return apis;
  } catch (error) {
    apiLogger.error('Failed to generate APIs:', error);
    throw error;
  }
}

/**
 * API Route Builder
 * Builds route definitions from content types
 */
export class APIRouteBuilder {
  constructor() {
    this.routes = new Map();
  }

  buildRoutes(contentType) {
    const basePath = this.getBasePath(contentType);
    const routes = [];

    if (contentType.kind === 'collectionType') {
      routes.push(
        { method: 'GET', path: basePath, handler: 'find', description: 'Find all entries' },
        { method: 'GET', path: `${basePath}/count`, handler: 'count', description: 'Count entries' },
        { method: 'GET', path: `${basePath}/:id`, handler: 'findOne', description: 'Find one entry' },
        { method: 'POST', path: basePath, handler: 'create', description: 'Create entry' },
        { method: 'PUT', path: `${basePath}/:id`, handler: 'update', description: 'Update entry' },
        { method: 'DELETE', path: `${basePath}/:id`, handler: 'delete', description: 'Delete entry' },
      );

      if (contentType.draftAndPublish) {
        routes.push(
          { method: 'POST', path: `${basePath}/:id/publish`, handler: 'publish', description: 'Publish entry' },
          { method: 'POST', path: `${basePath}/:id/unpublish`, handler: 'unpublish', description: 'Unpublish entry' },
        );
      }
    } else if (contentType.kind === 'singleType') {
      routes.push(
        { method: 'GET', path: basePath, handler: 'find', description: 'Get single type' },
        { method: 'PUT', path: basePath, handler: 'update', description: 'Update single type' },
        { method: 'DELETE', path: basePath, handler: 'delete', description: 'Delete single type' },
      );
    }

    this.routes.set(contentType.uid, routes);
    return routes;
  }

  getBasePath(contentType) {
    // Extract API name from UID like "api::article.article"
    const parts = contentType.uid.split('::');
    if (parts.length === 2) {
      const [, apiPath] = parts;
      return `/${apiPath.split('.')[0]}`;
    }
    return `/${contentType.pluralName}`;
  }

  getAllRoutes() {
    const allRoutes = [];
    for (const routes of this.routes.values()) {
      allRoutes.push(...routes);
    }
    return allRoutes;
  }
}

/**
 * Query Parser
 * Parses and validates API query parameters
 */
export class QueryParser {
  constructor() {
    this.operators = {
      eq: '=',
      ne: '!=',
      lt: '<',
      lte: '<=',
      gt: '>',
      gte: '>=',
      in: 'IN',
      notIn: 'NOT IN',
      contains: 'LIKE',
      notContains: 'NOT LIKE',
      containsi: 'LIKE',
      notContainsi: 'NOT LIKE',
      null: 'IS NULL',
      notNull: 'IS NOT NULL',
      between: 'BETWEEN',
      startsWith: 'LIKE',
      endsWith: 'LIKE',
    };
  }

  parse(query, contentType) {
    const parsed = {
      filters: this.parseFilters(query.filters, contentType),
      sort: this.parseSort(query.sort),
      pagination: this.parsePagination(query.pagination),
      fields: this.parseFields(query.fields),
      populate: this.parsePopulate(query.populate),
    };

    return parsed;
  }

  parseFilters(filters, contentType) {
    if (!filters) return {};

    const parsed = {};

    for (const [field, condition] of Object.entries(filters)) {
      if (typeof condition === 'object') {
        // Complex filter: { age: { $gt: 18 } }
        for (const [operator, value] of Object.entries(condition)) {
          const op = operator.replace('$', '');
          if (this.operators[op]) {
            parsed[field] = { operator: this.operators[op], value };
          }
        }
      } else {
        // Simple filter: { name: 'John' }
        parsed[field] = { operator: '=', value: condition };
      }
    }

    return parsed;
  }

  parseSort(sort) {
    if (!sort) return [];

    if (Array.isArray(sort)) {
      return sort.map(s => this.parseSortField(s));
    }

    if (typeof sort === 'string') {
      return [this.parseSortField(sort)];
    }

    if (typeof sort === 'object') {
      return Object.entries(sort).map(([field, direction]) => ({
        field,
        direction: direction.toUpperCase(),
      }));
    }

    return [];
  }

  parseSortField(sortString) {
    if (sortString.startsWith('-')) {
      return { field: sortString.slice(1), direction: 'DESC' };
    }
    return { field: sortString, direction: 'ASC' };
  }

  parsePagination(pagination) {
    const defaults = {
      page: 1,
      pageSize: 25,
      withCount: true,
    };

    if (!pagination) return defaults;

    return {
      page: parseInt(pagination.page) || defaults.page,
      pageSize: Math.min(parseInt(pagination.pageSize) || defaults.pageSize, 100),
      withCount: pagination.withCount !== false,
      start: parseInt(pagination.start),
      limit: parseInt(pagination.limit),
    };
  }

  parseFields(fields) {
    if (!fields) return ['*'];

    if (Array.isArray(fields)) {
      return fields;
    }

    if (typeof fields === 'string') {
      return fields.split(',').map(f => f.trim());
    }

    return ['*'];
  }

  parsePopulate(populate) {
    if (!populate) return [];

    if (populate === '*') {
      return ['*'];
    }

    if (Array.isArray(populate)) {
      return populate;
    }

    if (typeof populate === 'string') {
      return populate.split(',').map(p => p.trim());
    }

    if (typeof populate === 'object') {
      return Object.keys(populate);
    }

    return [];
  }
}

export const queryParser = new QueryParser();
