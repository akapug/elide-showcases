/**
 * GraphQL Schema Builder
 * Generates GraphQL schema from content types
 */

import { getDatabase } from '../database/connection.js';
import { logger } from '../core/logger.js';

export class GraphQLSchema {
  constructor(contentTypes) {
    this.contentTypes = contentTypes.filter(ct => ct.kind !== 'component');
    this.components = contentTypes.filter(ct => ct.kind === 'component');
    this.logger = logger.child('GraphQLSchema');
  }

  build() {
    const typeDefs = this.generateTypeDefs();
    const resolvers = this.generateResolvers();

    return {
      typeDefs,
      resolvers,
    };
  }

  generateTypeDefs() {
    let typeDefs = `
      scalar DateTime
      scalar JSON

      type Query {
        ${this.generateQueries()}
      }

      type Mutation {
        ${this.generateMutations()}
      }

      ${this.generateTypes()}

      type ResponseCollectionMeta {
        pagination: Pagination!
      }

      type Pagination {
        total: Int!
        page: Int!
        pageSize: Int!
        pageCount: Int!
      }
    `;

    return typeDefs;
  }

  generateQueries() {
    const queries = [];

    for (const contentType of this.contentTypes) {
      const typeName = this.getTypeName(contentType);
      const pluralName = contentType.pluralName;
      const singularName = contentType.singularName;

      if (contentType.kind === 'collectionType') {
        queries.push(`${pluralName}(filters: ${typeName}FiltersInput, pagination: PaginationArg, sort: [String]): ${typeName}EntityResponseCollection`);
        queries.push(`${singularName}(id: ID!): ${typeName}EntityResponse`);
      } else if (contentType.kind === 'singleType') {
        queries.push(`${singularName}: ${typeName}EntityResponse`);
      }
    }

    return queries.join('\n        ');
  }

  generateMutations() {
    const mutations = [];

    for (const contentType of this.contentTypes) {
      const typeName = this.getTypeName(contentType);
      const singularName = contentType.singularName;

      if (contentType.kind === 'collectionType') {
        mutations.push(`create${typeName}(data: ${typeName}Input!): ${typeName}EntityResponse`);
        mutations.push(`update${typeName}(id: ID!, data: ${typeName}Input!): ${typeName}EntityResponse`);
        mutations.push(`delete${typeName}(id: ID!): ${typeName}EntityResponse`);
      } else if (contentType.kind === 'singleType') {
        mutations.push(`update${typeName}(data: ${typeName}Input!): ${typeName}EntityResponse`);
        mutations.push(`delete${typeName}: ${typeName}EntityResponse`);
      }
    }

    return mutations.join('\n        ');
  }

  generateTypes() {
    const types = [];

    for (const contentType of this.contentTypes) {
      const typeName = this.getTypeName(contentType);

      // Main type
      types.push(`
      type ${typeName} {
        id: ID!
        ${this.generateFields(contentType)}
        createdAt: DateTime
        updatedAt: DateTime
        ${contentType.draftAndPublish ? 'publishedAt: DateTime' : ''}
      }
      `);

      // Input type
      types.push(`
      input ${typeName}Input {
        ${this.generateInputFields(contentType)}
      }
      `);

      // Filters input
      types.push(`
      input ${typeName}FiltersInput {
        ${this.generateFilterFields(contentType)}
        and: [${typeName}FiltersInput]
        or: [${typeName}FiltersInput]
        not: ${typeName}FiltersInput
      }
      `);

      // Response types
      types.push(`
      type ${typeName}Entity {
        id: ID
        attributes: ${typeName}
      }
      `);

      types.push(`
      type ${typeName}EntityResponse {
        data: ${typeName}Entity
      }
      `);

      if (contentType.kind === 'collectionType') {
        types.push(`
        type ${typeName}EntityResponseCollection {
          data: [${typeName}Entity!]!
          meta: ResponseCollectionMeta!
        }
        `);
      }
    }

    // Pagination input
    types.push(`
      input PaginationArg {
        page: Int
        pageSize: Int
        start: Int
        limit: Int
      }
    `);

    return types.join('\n');
  }

  generateFields(contentType) {
    const fields = [];

    for (const [name, attribute] of Object.entries(contentType.attributes)) {
      const fieldType = this.getGraphQLType(attribute);
      if (fieldType) {
        fields.push(`${name}: ${fieldType}`);
      }
    }

    return fields.join('\n        ');
  }

  generateInputFields(contentType) {
    const fields = [];

    for (const [name, attribute] of Object.entries(contentType.attributes)) {
      const fieldType = this.getGraphQLInputType(attribute);
      if (fieldType) {
        const required = attribute.required ? '!' : '';
        fields.push(`${name}: ${fieldType}${required}`);
      }
    }

    return fields.join('\n        ');
  }

  generateFilterFields(contentType) {
    const fields = [];

    for (const [name, attribute] of Object.entries(contentType.attributes)) {
      const filterType = this.getGraphQLFilterType(attribute);
      if (filterType) {
        fields.push(`${name}: ${filterType}`);
      }
    }

    return fields.join('\n        ');
  }

  getGraphQLType(attribute) {
    switch (attribute.type) {
      case 'string':
      case 'text':
      case 'richtext':
      case 'email':
      case 'password':
      case 'uid':
        return 'String';

      case 'integer':
      case 'biginteger':
        return 'Int';

      case 'float':
      case 'decimal':
        return 'Float';

      case 'boolean':
        return 'Boolean';

      case 'date':
      case 'time':
      case 'datetime':
      case 'timestamp':
        return 'DateTime';

      case 'json':
        return 'JSON';

      case 'enumeration':
        return 'String'; // Could generate enum type

      case 'media':
        return attribute.multiple ? '[String]' : 'String';

      case 'relation':
        const targetType = this.getTypeNameFromUID(attribute.target);
        if (attribute.relation === 'oneToMany' || attribute.relation === 'manyToMany') {
          return `[${targetType}]`;
        }
        return targetType;

      case 'component':
        return 'JSON'; // Simplified

      case 'dynamiczone':
        return 'JSON'; // Simplified

      default:
        return null;
    }
  }

  getGraphQLInputType(attribute) {
    switch (attribute.type) {
      case 'relation':
      case 'media':
        return 'ID'; // Relations use IDs in input

      default:
        return this.getGraphQLType(attribute);
    }
  }

  getGraphQLFilterType(attribute) {
    const baseType = this.getGraphQLType(attribute);
    if (!baseType) return null;

    // Return simple filter for now
    return baseType;
  }

  getTypeName(contentType) {
    // Convert singular name to PascalCase
    return contentType.singularName.charAt(0).toUpperCase() + contentType.singularName.slice(1);
  }

  getTypeNameFromUID(uid) {
    const parts = uid.split('.');
    const name = parts[parts.length - 1];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  generateResolvers() {
    const resolvers = {
      Query: {},
      Mutation: {},
    };

    for (const contentType of this.contentTypes) {
      this.generateQueryResolvers(contentType, resolvers.Query);
      this.generateMutationResolvers(contentType, resolvers.Mutation);
    }

    return resolvers;
  }

  generateQueryResolvers(contentType, queryResolvers) {
    const tableName = `ct_${contentType.singularName.toLowerCase()}`;
    const singularName = contentType.singularName;
    const pluralName = contentType.pluralName;

    if (contentType.kind === 'collectionType') {
      // Find many
      queryResolvers[pluralName] = async (parent, args, context) => {
        const db = getDatabase();
        const { filters, pagination, sort } = args;

        // Build query
        let sql = `SELECT * FROM ${tableName}`;
        const params = [];

        // Apply filters (simplified)
        if (filters) {
          const whereConditions = [];
          for (const [key, value] of Object.entries(filters)) {
            if (key !== 'and' && key !== 'or' && key !== 'not') {
              whereConditions.push(`${key} = ?`);
              params.push(value);
            }
          }
          if (whereConditions.length > 0) {
            sql += ` WHERE ${whereConditions.join(' AND ')}`;
          }
        }

        // Apply sorting
        if (sort && sort.length > 0) {
          const sortClauses = sort.map(s => {
            if (s.startsWith('-')) {
              return `${s.slice(1)} DESC`;
            }
            return `${s} ASC`;
          });
          sql += ` ORDER BY ${sortClauses.join(', ')}`;
        }

        // Count total
        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
        const countResult = await db.query(countSql, params);
        const total = countResult[0].count;

        // Apply pagination
        const page = pagination?.page || 1;
        const pageSize = pagination?.pageSize || 25;
        const offset = (page - 1) * pageSize;

        sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

        const results = await db.query(sql, params);

        return {
          data: results.map(r => ({ id: r.id, attributes: r })),
          meta: {
            pagination: {
              total,
              page,
              pageSize,
              pageCount: Math.ceil(total / pageSize),
            },
          },
        };
      };

      // Find one
      queryResolvers[singularName] = async (parent, args, context) => {
        const db = getDatabase();
        const { id } = args;

        const results = await db.query(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [id]
        );

        if (results.length === 0) {
          return { data: null };
        }

        return {
          data: {
            id: results[0].id,
            attributes: results[0],
          },
        };
      };
    } else if (contentType.kind === 'singleType') {
      queryResolvers[singularName] = async (parent, args, context) => {
        const db = getDatabase();

        const results = await db.query(`SELECT * FROM ${tableName} LIMIT 1`);

        if (results.length === 0) {
          return { data: null };
        }

        return {
          data: {
            id: results[0].id,
            attributes: results[0],
          },
        };
      };
    }
  }

  generateMutationResolvers(contentType, mutationResolvers) {
    const tableName = `ct_${contentType.singularName.toLowerCase()}`;
    const typeName = this.getTypeName(contentType);

    if (contentType.kind === 'collectionType') {
      // Create
      mutationResolvers[`create${typeName}`] = async (parent, args, context) => {
        const db = getDatabase();
        const { data } = args;

        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(', ');

        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        const result = await db.execute(sql, values);

        const created = await db.query(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [result.lastInsertRowid || result.insertId]
        );

        return {
          data: {
            id: created[0].id,
            attributes: created[0],
          },
        };
      };

      // Update
      mutationResolvers[`update${typeName}`] = async (parent, args, context) => {
        const db = getDatabase();
        const { id, data } = args;

        const columns = Object.keys(data);
        const values = Object.values(data);
        const sets = columns.map(col => `${col} = ?`).join(', ');

        const sql = `UPDATE ${tableName} SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        await db.execute(sql, [...values, id]);

        const updated = await db.query(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [id]
        );

        return {
          data: {
            id: updated[0].id,
            attributes: updated[0],
          },
        };
      };

      // Delete
      mutationResolvers[`delete${typeName}`] = async (parent, args, context) => {
        const db = getDatabase();
        const { id } = args;

        const existing = await db.query(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [id]
        );

        await db.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);

        return {
          data: existing.length > 0 ? {
            id: existing[0].id,
            attributes: existing[0],
          } : null,
        };
      };
    }
  }
}
