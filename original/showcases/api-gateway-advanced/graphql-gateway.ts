/**
 * GraphQL Gateway Module
 *
 * Provides GraphQL gateway functionality:
 * - GraphQL query/mutation routing
 * - Schema stitching
 * - Query batching
 * - Field-level caching
 * - Query complexity analysis
 * - GraphQL to REST translation
 */

// ==================== Types & Interfaces ====================

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse {
  data?: any;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, any>;
}

export interface GraphQLSchema {
  types: Map<string, GraphQLType>;
  queries: Map<string, GraphQLField>;
  mutations: Map<string, GraphQLField>;
}

export interface GraphQLType {
  name: string;
  kind: 'OBJECT' | 'SCALAR' | 'ENUM' | 'INPUT_OBJECT' | 'LIST' | 'NON_NULL';
  fields?: Map<string, GraphQLField>;
  values?: string[];
}

export interface GraphQLField {
  name: string;
  type: string;
  args?: Map<string, GraphQLArgument>;
  resolve?: (parent: any, args: any, context: any) => any;
  restEndpoint?: string;
}

export interface GraphQLArgument {
  name: string;
  type: string;
  defaultValue?: any;
}

export interface QueryComplexity {
  complexity: number;
  depth: number;
  fields: number;
}

// ==================== GraphQL Parser ====================

export class GraphQLParser {
  /**
   * Parse GraphQL query
   */
  parse(query: string): {
    operation: 'query' | 'mutation' | 'subscription';
    fields: string[];
    variables: string[];
  } {
    const trimmed = query.trim();

    // Detect operation type
    let operation: 'query' | 'mutation' | 'subscription' = 'query';
    if (trimmed.startsWith('mutation')) {
      operation = 'mutation';
    } else if (trimmed.startsWith('subscription')) {
      operation = 'subscription';
    }

    // Extract fields (simplified)
    const fields = this.extractFields(trimmed);

    // Extract variables
    const variables = this.extractVariables(trimmed);

    return { operation, fields, variables };
  }

  /**
   * Calculate query complexity
   */
  calculateComplexity(query: string): QueryComplexity {
    const parsed = this.parse(query);

    // Simple complexity calculation
    const depth = this.calculateDepth(query);
    const fields = parsed.fields.length;
    const complexity = fields * depth;

    return { complexity, depth, fields };
  }

  private extractFields(query: string): string[] {
    const fields: string[] = [];
    const fieldRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\(|{)/g;
    let match;

    while ((match = fieldRegex.exec(query)) !== null) {
      const field = match[1];
      if (!['query', 'mutation', 'subscription'].includes(field)) {
        fields.push(field);
      }
    }

    return fields;
  }

  private extractVariables(query: string): string[] {
    const variables: string[] = [];
    const varRegex = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;

    while ((match = varRegex.exec(query)) !== null) {
      variables.push(match[1]);
    }

    return [...new Set(variables)];
  }

  private calculateDepth(query: string, currentDepth: number = 0): number {
    const openBraces = (query.match(/{/g) || []).length;
    const closeBraces = (query.match(/}/g) || []).length;

    // Simplified depth calculation
    return Math.max(openBraces, closeBraces);
  }
}

// ==================== GraphQL Executor ====================

export class GraphQLExecutor {
  private schema: GraphQLSchema;
  private parser: GraphQLParser;

  constructor() {
    this.parser = new GraphQLParser();
    this.schema = {
      types: new Map(),
      queries: new Map(),
      mutations: new Map()
    };

    this.initializeSchema();
  }

  /**
   * Execute GraphQL request
   */
  async execute(request: GraphQLRequest, context?: any): Promise<GraphQLResponse> {
    try {
      const parsed = this.parser.parse(request.query);

      // Check complexity
      const complexity = this.parser.calculateComplexity(request.query);
      if (complexity.complexity > 1000) {
        return {
          errors: [{
            message: 'Query is too complex',
            extensions: { code: 'QUERY_TOO_COMPLEX', complexity: complexity.complexity }
          }]
        };
      }

      if (parsed.operation === 'query') {
        return await this.executeQuery(request, context);
      } else if (parsed.operation === 'mutation') {
        return await this.executeMutation(request, context);
      } else {
        return {
          errors: [{ message: 'Subscriptions not supported in gateway mode' }]
        };
      }
    } catch (error) {
      return {
        errors: [{
          message: (error as Error).message,
          extensions: { code: 'EXECUTION_ERROR' }
        }]
      };
    }
  }

  /**
   * Batch multiple GraphQL requests
   */
  async executeBatch(requests: GraphQLRequest[], context?: any): Promise<GraphQLResponse[]> {
    return Promise.all(requests.map(req => this.execute(req, context)));
  }

  /**
   * Register a query resolver
   */
  registerQuery(
    name: string,
    type: string,
    resolver: (args: any, context: any) => any,
    restEndpoint?: string
  ): void {
    this.schema.queries.set(name, {
      name,
      type,
      resolve: resolver,
      restEndpoint
    });
  }

  /**
   * Register a mutation resolver
   */
  registerMutation(
    name: string,
    type: string,
    resolver: (args: any, context: any) => any,
    restEndpoint?: string
  ): void {
    this.schema.mutations.set(name, {
      name,
      type,
      resolve: resolver,
      restEndpoint
    });
  }

  private async executeQuery(request: GraphQLRequest, context?: any): Promise<GraphQLResponse> {
    const parsed = this.parser.parse(request.query);

    // Simulate query execution
    const data: any = {};

    for (const fieldName of parsed.fields) {
      const field = this.schema.queries.get(fieldName);
      if (field) {
        if (field.resolve) {
          data[fieldName] = await field.resolve(null, request.variables || {}, context);
        } else if (field.restEndpoint) {
          // Forward to REST endpoint
          data[fieldName] = await this.forwardToREST(field.restEndpoint, request.variables || {});
        } else {
          data[fieldName] = null;
        }
      }
    }

    return { data };
  }

  private async executeMutation(request: GraphQLRequest, context?: any): Promise<GraphQLResponse> {
    const parsed = this.parser.parse(request.query);

    const data: any = {};

    for (const fieldName of parsed.fields) {
      const field = this.schema.mutations.get(fieldName);
      if (field) {
        if (field.resolve) {
          data[fieldName] = await field.resolve(null, request.variables || {}, context);
        } else if (field.restEndpoint) {
          data[fieldName] = await this.forwardToREST(
            field.restEndpoint,
            request.variables || {},
            'POST'
          );
        } else {
          data[fieldName] = null;
        }
      }
    }

    return { data };
  }

  private async forwardToREST(
    endpoint: string,
    variables: any,
    method: string = 'GET'
  ): Promise<any> {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-GraphQL-Forward': 'true'
        },
        body: method !== 'GET' ? JSON.stringify(variables) : undefined
      });

      if (!response.ok) {
        throw new Error(`REST endpoint returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('REST forwarding error:', error);
      return null;
    }
  }

  private initializeSchema(): void {
    // Register some example queries
    this.registerQuery('users', '[User]', async (args, context) => {
      return [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
      ];
    });

    this.registerQuery('user', 'User', async (args, context) => {
      return { id: args.id, name: 'User ' + args.id, email: `user${args.id}@example.com` };
    });

    this.registerQuery('products', '[Product]', async (args, context) => {
      return [
        { id: '1', name: 'Product 1', price: 99.99 },
        { id: '2', name: 'Product 2', price: 149.99 }
      ];
    });

    // Register example mutations
    this.registerMutation('createUser', 'User', async (args, context) => {
      return {
        id: crypto.randomUUID(),
        name: args.name,
        email: args.email
      };
    });

    this.registerMutation('updateUser', 'User', async (args, context) => {
      return {
        id: args.id,
        name: args.name,
        email: args.email
      };
    });
  }

  getSchema(): GraphQLSchema {
    return this.schema;
  }
}

// ==================== GraphQL Cache ====================

export class GraphQLCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  /**
   * Get cached query result
   */
  get(query: string, variables?: Record<string, any>): any | null {
    const key = this.generateKey(query, variables);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache query result
   */
  set(query: string, variables: Record<string, any> | undefined, data: any, ttl: number): void {
    const key = this.generateKey(query, variables);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Invalidate cache by pattern
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private generateKey(query: string, variables?: Record<string, any>): string {
    const normalized = query.replace(/\s+/g, ' ').trim();
    const varsKey = variables ? JSON.stringify(variables) : '';
    return `${normalized}:${varsKey}`;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// ==================== GraphQL Gateway ====================

export class GraphQLGateway {
  private executor: GraphQLExecutor;
  private cache: GraphQLCache;
  private parser: GraphQLParser;
  private maxComplexity: number = 1000;
  private maxDepth: number = 10;
  private enableBatching: boolean = true;
  private enableCaching: boolean = true;
  private cacheTTL: number = 60000; // 1 minute

  constructor(config?: {
    maxComplexity?: number;
    maxDepth?: number;
    enableBatching?: boolean;
    enableCaching?: boolean;
    cacheTTL?: number;
  }) {
    this.executor = new GraphQLExecutor();
    this.cache = new GraphQLCache();
    this.parser = new GraphQLParser();

    if (config) {
      if (config.maxComplexity !== undefined) this.maxComplexity = config.maxComplexity;
      if (config.maxDepth !== undefined) this.maxDepth = config.maxDepth;
      if (config.enableBatching !== undefined) this.enableBatching = config.enableBatching;
      if (config.enableCaching !== undefined) this.enableCaching = config.enableCaching;
      if (config.cacheTTL !== undefined) this.cacheTTL = config.cacheTTL;
    }
  }

  /**
   * Handle GraphQL HTTP request
   */
  async handleRequest(request: Request): Promise<Response> {
    try {
      const contentType = request.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        return new Response(
          JSON.stringify({
            errors: [{ message: 'Content-Type must be application/json' }]
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const body = await request.json();

      // Handle batch requests
      if (Array.isArray(body)) {
        if (!this.enableBatching) {
          return new Response(
            JSON.stringify({
              errors: [{ message: 'Batching is not enabled' }]
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        const results = await this.executor.executeBatch(body);
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validate request
      if (!body.query || typeof body.query !== 'string') {
        return new Response(
          JSON.stringify({
            errors: [{ message: 'query is required and must be a string' }]
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check complexity
      const complexity = this.parser.calculateComplexity(body.query);
      if (complexity.complexity > this.maxComplexity) {
        return new Response(
          JSON.stringify({
            errors: [{
              message: `Query complexity ${complexity.complexity} exceeds maximum ${this.maxComplexity}`,
              extensions: { code: 'QUERY_TOO_COMPLEX', complexity: complexity.complexity }
            }]
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (complexity.depth > this.maxDepth) {
        return new Response(
          JSON.stringify({
            errors: [{
              message: `Query depth ${complexity.depth} exceeds maximum ${this.maxDepth}`,
              extensions: { code: 'QUERY_TOO_DEEP', depth: complexity.depth }
            }]
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check cache
      if (this.enableCaching) {
        const parsed = this.parser.parse(body.query);
        if (parsed.operation === 'query') {
          const cached = this.cache.get(body.query, body.variables);
          if (cached) {
            return new Response(JSON.stringify({ data: cached }), {
              headers: {
                'Content-Type': 'application/json',
                'X-GraphQL-Cache': 'HIT'
              }
            });
          }
        }
      }

      // Execute query
      const result = await this.executor.execute(body);

      // Cache successful queries
      if (this.enableCaching && result.data && !result.errors) {
        const parsed = this.parser.parse(body.query);
        if (parsed.operation === 'query') {
          this.cache.set(body.query, body.variables, result.data, this.cacheTTL);
        }
      }

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'X-GraphQL-Cache': 'MISS'
        }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          errors: [{
            message: (error as Error).message,
            extensions: { code: 'INTERNAL_ERROR' }
          }]
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  /**
   * Get introspection schema
   */
  getIntrospectionSchema(): any {
    const schema = this.executor.getSchema();

    return {
      __schema: {
        queryType: { name: 'Query' },
        mutationType: { name: 'Mutation' },
        types: [
          {
            name: 'Query',
            kind: 'OBJECT',
            fields: Array.from(schema.queries.values()).map(field => ({
              name: field.name,
              type: { name: field.type }
            }))
          },
          {
            name: 'Mutation',
            kind: 'OBJECT',
            fields: Array.from(schema.mutations.values()).map(field => ({
              name: field.name,
              type: { name: field.type }
            }))
          }
        ]
      }
    };
  }

  getExecutor(): GraphQLExecutor {
    return this.executor;
  }

  getCache(): GraphQLCache {
    return this.cache;
  }

  /**
   * Start periodic cache cleanup
   */
  startCleanup(): void {
    setInterval(() => {
      this.cache.cleanup();
    }, 300000); // Every 5 minutes
  }
}
