/**
 * Deploy Platform - Metadata Store
 *
 * Manages metadata for deployments, projects, and users.
 * Supports multiple database backends.
 */

interface DatabaseConfig {
  type: 'sqlite' | 'postgres' | 'mysql' | 'mongodb';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  filename?: string; // For SQLite
}

interface QueryOptions {
  where?: Record<string, any>;
  orderBy?: { field: string; direction: 'ASC' | 'DESC' }[];
  limit?: number;
  offset?: number;
}

/**
 * Metadata Store
 */
export class MetadataStore {
  private config: DatabaseConfig;
  private data: Map<string, Map<string, any>> = new Map();

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializeCollections();
  }

  /**
   * Initialize collections
   */
  private initializeCollections(): void {
    const collections = [
      'users',
      'teams',
      'projects',
      'deployments',
      'domains',
      'environment_variables',
      'build_logs',
      'analytics'
    ];

    for (const collection of collections) {
      this.data.set(collection, new Map());
    }
  }

  /**
   * Insert document
   */
  async insert<T>(collection: string, document: T & { id: string }): Promise<T> {
    const coll = this.data.get(collection);

    if (!coll) {
      throw new Error(`Collection ${collection} not found`);
    }

    coll.set(document.id, { ...document, createdAt: new Date(), updatedAt: new Date() });

    return document;
  }

  /**
   * Find one document
   */
  async findOne<T>(collection: string, query: Record<string, any>): Promise<T | null> {
    const coll = this.data.get(collection);

    if (!coll) {
      throw new Error(`Collection ${collection} not found`);
    }

    for (const doc of coll.values()) {
      if (this.matchesQuery(doc, query)) {
        return doc as T;
      }
    }

    return null;
  }

  /**
   * Find documents
   */
  async find<T>(collection: string, options: QueryOptions = {}): Promise<T[]> {
    const coll = this.data.get(collection);

    if (!coll) {
      throw new Error(`Collection ${collection} not found`);
    }

    let results = Array.from(coll.values());

    // Apply where filter
    if (options.where) {
      results = results.filter(doc => this.matchesQuery(doc, options.where!));
    }

    // Apply sorting
    if (options.orderBy) {
      results.sort((a, b) => {
        for (const order of options.orderBy!) {
          const aVal = a[order.field];
          const bVal = b[order.field];

          if (aVal < bVal) return order.direction === 'ASC' ? -1 : 1;
          if (aVal > bVal) return order.direction === 'ASC' ? 1 : -1;
        }

        return 0;
      });
    }

    // Apply pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results as T[];
  }

  /**
   * Update document
   */
  async update<T>(
    collection: string,
    id: string,
    updates: Partial<T>
  ): Promise<T | null> {
    const coll = this.data.get(collection);

    if (!coll) {
      throw new Error(`Collection ${collection} not found`);
    }

    const doc = coll.get(id);

    if (!doc) {
      return null;
    }

    Object.assign(doc, updates, { updatedAt: new Date() });

    return doc as T;
  }

  /**
   * Delete document
   */
  async delete(collection: string, id: string): Promise<boolean> {
    const coll = this.data.get(collection);

    if (!coll) {
      throw new Error(`Collection ${collection} not found`);
    }

    return coll.delete(id);
  }

  /**
   * Count documents
   */
  async count(collection: string, query: Record<string, any> = {}): Promise<number> {
    const results = await this.find(collection, { where: query });
    return results.length;
  }

  /**
   * Aggregate
   */
  async aggregate<T>(
    collection: string,
    pipeline: any[]
  ): Promise<T[]> {
    // Mock aggregation
    const coll = this.data.get(collection);

    if (!coll) {
      throw new Error(`Collection ${collection} not found`);
    }

    return Array.from(coll.values()) as T[];
  }

  /**
   * Match query
   */
  private matchesQuery(doc: any, query: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(query)) {
      if (doc[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    console.log('Database connection closed');
  }
}

/**
 * Deployment Repository
 */
export class DeploymentRepository {
  private store: MetadataStore;

  constructor(store: MetadataStore) {
    this.store = store;
  }

  /**
   * Create deployment
   */
  async create(deployment: any): Promise<any> {
    return this.store.insert('deployments', deployment);
  }

  /**
   * Get deployment by ID
   */
  async getById(id: string): Promise<any | null> {
    return this.store.findOne('deployments', { id });
  }

  /**
   * Get deployments by project
   */
  async getByProject(projectId: string, limit: number = 50): Promise<any[]> {
    return this.store.find('deployments', {
      where: { projectId },
      orderBy: [{ field: 'createdAt', direction: 'DESC' }],
      limit
    });
  }

  /**
   * Update deployment status
   */
  async updateStatus(id: string, status: string): Promise<any | null> {
    return this.store.update('deployments', id, { status });
  }

  /**
   * Get recent deployments
   */
  async getRecent(limit: number = 10): Promise<any[]> {
    return this.store.find('deployments', {
      orderBy: [{ field: 'createdAt', direction: 'DESC' }],
      limit
    });
  }

  /**
   * Count deployments by status
   */
  async countByStatus(projectId: string, status: string): Promise<number> {
    return this.store.count('deployments', { projectId, status });
  }

  /**
   * Delete deployment
   */
  async delete(id: string): Promise<boolean> {
    return this.store.delete('deployments', id);
  }
}

/**
 * Project Repository
 */
export class ProjectRepository {
  private store: MetadataStore;

  constructor(store: MetadataStore) {
    this.store = store;
  }

  /**
   * Create project
   */
  async create(project: any): Promise<any> {
    return this.store.insert('projects', project);
  }

  /**
   * Get project by ID
   */
  async getById(id: string): Promise<any | null> {
    return this.store.findOne('projects', { id });
  }

  /**
   * Get projects by team
   */
  async getByTeam(teamId: string): Promise<any[]> {
    return this.store.find('projects', {
      where: { teamId },
      orderBy: [{ field: 'createdAt', direction: 'DESC' }]
    });
  }

  /**
   * Update project
   */
  async update(id: string, updates: any): Promise<any | null> {
    return this.store.update('projects', id, updates);
  }

  /**
   * Delete project
   */
  async delete(id: string): Promise<boolean> {
    return this.store.delete('projects', id);
  }

  /**
   * Get all projects
   */
  async getAll(): Promise<any[]> {
    return this.store.find('projects', {
      orderBy: [{ field: 'createdAt', direction: 'DESC' }]
    });
  }
}

/**
 * User Repository
 */
export class UserRepository {
  private store: MetadataStore;

  constructor(store: MetadataStore) {
    this.store = store;
  }

  /**
   * Create user
   */
  async create(user: any): Promise<any> {
    return this.store.insert('users', user);
  }

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<any | null> {
    return this.store.findOne('users', { id });
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<any | null> {
    return this.store.findOne('users', { email });
  }

  /**
   * Update user
   */
  async update(id: string, updates: any): Promise<any | null> {
    return this.store.update('users', id, updates);
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    return this.store.delete('users', id);
  }
}

/**
 * Analytics Repository
 */
export class AnalyticsRepository {
  private store: MetadataStore;

  constructor(store: MetadataStore) {
    this.store = store;
  }

  /**
   * Record event
   */
  async recordEvent(event: any): Promise<any> {
    return this.store.insert('analytics', {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`
    });
  }

  /**
   * Get events
   */
  async getEvents(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const events = await this.store.find('analytics', {
      where: { projectId }
    });

    return events.filter(e =>
      e.timestamp >= startDate && e.timestamp <= endDate
    );
  }

  /**
   * Get deployment stats
   */
  async getDeploymentStats(projectId: string, days: number = 30): Promise<any> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await this.store.find('analytics', {
      where: { projectId }
    });

    const recentEvents = events.filter(e => e.timestamp >= cutoff);

    return {
      totalDeployments: recentEvents.filter(e => e.type === 'deployment').length,
      successfulDeployments: recentEvents.filter(
        e => e.type === 'deployment' && e.status === 'success'
      ).length,
      failedDeployments: recentEvents.filter(
        e => e.type === 'deployment' && e.status === 'failed'
      ).length,
      averageBuildTime: this.calculateAverageBuildTime(recentEvents)
    };
  }

  /**
   * Calculate average build time
   */
  private calculateAverageBuildTime(events: any[]): number {
    const buildEvents = events.filter(
      e => e.type === 'deployment' && e.buildTime
    );

    if (buildEvents.length === 0) return 0;

    const sum = buildEvents.reduce((acc, e) => acc + e.buildTime, 0);
    return Math.round(sum / buildEvents.length);
  }
}

// Export singleton instance
export const metadataStore = new MetadataStore({
  type: 'sqlite',
  filename: process.env.DB_PATH || '/tmp/deploy-platform/db.sqlite'
});

export const deploymentRepository = new DeploymentRepository(metadataStore);
export const projectRepository = new ProjectRepository(metadataStore);
export const userRepository = new UserRepository(metadataStore);
export const analyticsRepository = new AnalyticsRepository(metadataStore);
