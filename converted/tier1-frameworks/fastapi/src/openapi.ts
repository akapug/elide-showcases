/**
 * FastAPI OpenAPI Documentation Generator
 *
 * Generates OpenAPI 3.0 specification from route definitions.
 */

import { RouteDefinition } from './routing';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description?: string;
    version: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  tags?: Array<{
    name: string;
    description?: string;
  }>;
}

/**
 * OpenAPIGenerator class
 *
 * Generates OpenAPI specification from FastAPI application routes.
 */
export class OpenAPIGenerator {
  private app: any;

  constructor(app: any) {
    this.app = app;
  }

  /**
   * Generate complete OpenAPI specification
   */
  public generate(routes: Map<string, Map<string, RouteDefinition>>): OpenAPISpec {
    const spec: OpenAPISpec = {
      openapi: '3.0.2',
      info: {
        title: this.app.title,
        description: this.app.description,
        version: this.app.version,
      },
      paths: {},
      components: {
        schemas: {},
      },
      tags: [],
    };

    // Collect all tags
    const tagsSet = new Set<string>();

    // Generate paths
    for (const [path, methods] of routes) {
      spec.paths[path] = {};

      for (const [method, route] of methods) {
        // Skip if not included in schema
        if (route.include_in_schema === false) {
          continue;
        }

        // Collect tags
        if (route.tags) {
          route.tags.forEach(tag => tagsSet.add(tag));
        }

        // Generate operation
        spec.paths[path][method.toLowerCase()] = this.generateOperation(route);
      }
    }

    // Add tags
    spec.tags = Array.from(tagsSet).map(tag => ({ name: tag }));

    return spec;
  }

  /**
   * Generate operation specification
   */
  private generateOperation(route: RouteDefinition): any {
    const operation: any = {
      summary: route.summary || '',
      description: route.description || '',
      operationId: route.operation_id || this.generateOperationId(route),
      tags: route.tags || [],
      parameters: [],
      responses: {},
    };

    // Add path parameters
    const pathParams = this.extractPathParameters(route.path);
    pathParams.forEach(param => {
      operation.parameters.push({
        name: param,
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      });
    });

    // Add responses
    const statusCode = route.status_code || 200;
    operation.responses[statusCode] = {
      description: 'Successful Response',
      content: {
        'application/json': {
          schema: route.response_model
            ? this.generateModelSchema(route.response_model)
            : {},
        },
      },
    };

    // Add validation error response
    operation.responses[422] = {
      description: 'Validation Error',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/HTTPValidationError',
          },
        },
      },
    };

    // Add custom responses
    if (route.responses) {
      for (const [code, response] of Object.entries(route.responses)) {
        operation.responses[code] = response;
      }
    }

    // Mark as deprecated if needed
    if (route.deprecated) {
      operation.deprecated = true;
    }

    return operation;
  }

  /**
   * Extract path parameters from path template
   */
  private extractPathParameters(path: string): string[] {
    const matches = path.match(/\{(\w+)\}/g);
    if (!matches) return [];
    return matches.map(m => m.slice(1, -1));
  }

  /**
   * Generate operation ID
   */
  private generateOperationId(route: RouteDefinition): string {
    const path = route.path.replace(/\{|\}/g, '').replace(/\//g, '_');
    return `${route.method.toLowerCase()}${path}`;
  }

  /**
   * Generate model schema
   */
  private generateModelSchema(model: any): any {
    if (model && typeof model.schema === 'function') {
      return model.schema();
    }

    // Default schema
    return {
      type: 'object',
    };
  }

  /**
   * Add default schemas to components
   */
  public static getDefaultSchemas(): Record<string, any> {
    return {
      HTTPValidationError: {
        title: 'HTTPValidationError',
        type: 'object',
        properties: {
          detail: {
            title: 'Detail',
            type: 'array',
            items: {
              $ref: '#/components/schemas/ValidationError',
            },
          },
        },
      },
      ValidationError: {
        title: 'ValidationError',
        required: ['loc', 'msg', 'type'],
        type: 'object',
        properties: {
          loc: {
            title: 'Location',
            type: 'array',
            items: {
              anyOf: [
                { type: 'string' },
                { type: 'integer' },
              ],
            },
          },
          msg: {
            title: 'Message',
            type: 'string',
          },
          type: {
            title: 'Error Type',
            type: 'string',
          },
        },
      },
    };
  }
}

/**
 * OpenAPI tag metadata
 */
export interface Tag {
  name: string;
  description?: string;
  externalDocs?: {
    description?: string;
    url: string;
  };
}

/**
 * Response specification
 */
export function Response(status_code: number, description: string, model?: any): any {
  return {
    description,
    content: {
      'application/json': {
        schema: model ? (typeof model.schema === 'function' ? model.schema() : {}) : {},
      },
    },
  };
}

export default OpenAPIGenerator;
