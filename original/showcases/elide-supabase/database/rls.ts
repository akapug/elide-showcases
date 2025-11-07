/**
 * Row-Level Security (RLS) Engine
 *
 * Implements PostgreSQL-style row-level security policies
 * for controlling access to table rows based on user context
 */

import { DatabaseDriver } from './manager';
import { RLSPolicy, Query } from '../types';
import { Logger } from '../utils/logger';

/**
 * RLS policy context
 */
interface PolicyContext {
  userId?: string;
  role?: string;
  metadata?: Record<string, any>;
}

/**
 * RLS Engine
 */
export class RLSEngine {
  private driver: DatabaseDriver;
  private logger: Logger;
  private policies: Map<string, RLSPolicy[]> = new Map();

  constructor(driver: DatabaseDriver, logger: Logger) {
    this.driver = driver;
    this.logger = logger;
  }

  /**
   * Initialize RLS engine
   */
  async initialize(): Promise<void> {
    // Load policies from database
    await this.loadPolicies();
    this.logger.info('RLS engine initialized');
  }

  /**
   * Load RLS policies from database
   */
  async loadPolicies(): Promise<void> {
    // In PostgreSQL, policies are stored in pg_policies
    // For demo, we'll define some common policies
    this.defineDefaultPolicies();
  }

  /**
   * Define default RLS policies
   */
  private defineDefaultPolicies(): void {
    // Users table policies
    this.addPolicy('users', {
      name: 'users_select_own',
      operation: 'SELECT',
      using: 'id = current_user_id()',
      roles: ['authenticated']
    });

    this.addPolicy('users', {
      name: 'users_update_own',
      operation: 'UPDATE',
      using: 'id = current_user_id()',
      roles: ['authenticated']
    });

    this.addPolicy('users', {
      name: 'users_admin_all',
      operation: 'ALL',
      using: 'true',
      roles: ['admin']
    });

    // Storage objects policies
    this.addPolicy('storage_objects', {
      name: 'storage_select_public',
      operation: 'SELECT',
      using: 'public = true',
      roles: ['anon', 'authenticated']
    });

    this.addPolicy('storage_objects', {
      name: 'storage_select_own',
      operation: 'SELECT',
      using: 'owner_id = current_user_id()',
      roles: ['authenticated']
    });

    this.addPolicy('storage_objects', {
      name: 'storage_insert_own',
      operation: 'INSERT',
      withCheck: 'owner_id = current_user_id()',
      roles: ['authenticated']
    });

    this.addPolicy('storage_objects', {
      name: 'storage_update_own',
      operation: 'UPDATE',
      using: 'owner_id = current_user_id()',
      roles: ['authenticated']
    });

    this.addPolicy('storage_objects', {
      name: 'storage_delete_own',
      operation: 'DELETE',
      using: 'owner_id = current_user_id()',
      roles: ['authenticated']
    });

    // Edge functions policies
    this.addPolicy('edge_functions', {
      name: 'functions_select_all',
      operation: 'SELECT',
      using: 'true',
      roles: ['authenticated']
    });

    this.addPolicy('edge_functions', {
      name: 'functions_admin_all',
      operation: 'ALL',
      using: 'true',
      roles: ['admin']
    });
  }

  /**
   * Add a policy to a table
   */
  addPolicy(table: string, policy: RLSPolicy): void {
    if (!this.policies.has(table)) {
      this.policies.set(table, []);
    }

    this.policies.get(table)!.push(policy);
    this.logger.debug(`Added RLS policy ${policy.name} to table ${table}`);
  }

  /**
   * Remove a policy from a table
   */
  removePolicy(table: string, policyName: string): void {
    const policies = this.policies.get(table);
    if (policies) {
      const filtered = policies.filter(p => p.name !== policyName);
      this.policies.set(table, filtered);
      this.logger.debug(`Removed RLS policy ${policyName} from table ${table}`);
    }
  }

  /**
   * Get all policies for a table
   */
  getPolicies(table: string): RLSPolicy[] {
    return this.policies.get(table) || [];
  }

  /**
   * Check if operation is allowed by RLS policies
   */
  async checkPolicy(
    table: string,
    operation: string,
    data: Record<string, any>,
    userId?: string
  ): Promise<boolean> {
    const policies = this.getPolicies(table);

    if (policies.length === 0) {
      // No policies means access is allowed
      return true;
    }

    const context = await this.getContext(userId);

    // Find applicable policies
    const applicablePolicies = policies.filter(
      p =>
        (p.operation === operation || p.operation === 'ALL') &&
        this.hasRole(context, p.roles)
    );

    if (applicablePolicies.length === 0) {
      // No applicable policies means access is denied
      return false;
    }

    // Check each policy (OR logic - any policy can grant access)
    for (const policy of applicablePolicies) {
      const allowed = await this.evaluatePolicy(policy, data, context);
      if (allowed) {
        return true;
      }
    }

    return false;
  }

  /**
   * Apply RLS policies to a query
   */
  async applyPolicies(query: Query, userId?: string): Promise<Query> {
    const policies = this.getPolicies(query.table);

    if (policies.length === 0) {
      return query;
    }

    const context = await this.getContext(userId);

    // Find applicable SELECT policies
    const selectPolicies = policies.filter(
      p =>
        (p.operation === 'SELECT' || p.operation === 'ALL') &&
        this.hasRole(context, p.roles)
    );

    if (selectPolicies.length === 0) {
      // No policies means no rows visible
      query.filter = query.filter || [];
      query.filter.push({
        column: '1',
        operator: 'eq',
        value: 0
      });
      return query;
    }

    // Build WHERE clause from policies (OR logic)
    const policyConditions = selectPolicies
      .map(p => p.using)
      .filter(Boolean)
      .map(condition => this.substituteContext(condition!, context));

    if (policyConditions.length > 0) {
      // For simplicity, we'll add the first policy condition
      // In a real implementation, we'd combine all conditions with OR
      const condition = policyConditions[0];
      query.filter = query.filter || [];

      // Parse simple conditions like "id = current_user_id()"
      if (condition.includes('current_user_id()')) {
        const column = condition.split('=')[0].trim();
        query.filter.push({
          column,
          operator: 'eq',
          value: context.userId
        });
      } else if (condition === 'true') {
        // Allow all rows
      } else if (condition.includes('public = true')) {
        query.filter.push({
          column: 'public',
          operator: 'eq',
          value: true
        });
      }
    }

    return query;
  }

  /**
   * Evaluate a policy against data
   */
  private async evaluatePolicy(
    policy: RLSPolicy,
    data: Record<string, any>,
    context: PolicyContext
  ): Promise<boolean> {
    const condition =
      policy.operation === 'INSERT' || policy.operation === 'UPDATE'
        ? policy.withCheck || policy.using
        : policy.using;

    if (!condition) {
      return true;
    }

    const substituted = this.substituteContext(condition, context);

    // Evaluate simple conditions
    if (substituted === 'true') {
      return true;
    }

    if (substituted === 'false') {
      return false;
    }

    // Parse conditions like "id = 'user_id'"
    const match = substituted.match(/(\w+)\s*=\s*'([^']+)'/);
    if (match) {
      const [, column, value] = match;
      return data[column] === value;
    }

    // Default to allowing if we can't parse
    this.logger.warn(`Could not evaluate RLS condition: ${substituted}`);
    return true;
  }

  /**
   * Get user context
   */
  private async getContext(userId?: string): Promise<PolicyContext> {
    if (!userId) {
      return {
        role: 'anon'
      };
    }

    // In real implementation, fetch user from database
    // For demo, we'll mock it
    return {
      userId,
      role: 'authenticated',
      metadata: {}
    };
  }

  /**
   * Check if context has required role
   */
  private hasRole(context: PolicyContext, roles: string[]): boolean {
    return roles.includes(context.role || 'anon');
  }

  /**
   * Substitute context values in condition
   */
  private substituteContext(condition: string, context: PolicyContext): string {
    let substituted = condition;

    // Replace current_user_id()
    if (context.userId) {
      substituted = substituted.replace(/current_user_id\(\)/g, `'${context.userId}'`);
    }

    // Replace current_role()
    if (context.role) {
      substituted = substituted.replace(/current_role\(\)/g, `'${context.role}'`);
    }

    return substituted;
  }

  /**
   * Create a policy in database (PostgreSQL)
   */
  async createPolicy(table: string, policy: RLSPolicy): Promise<void> {
    const parts = [
      `CREATE POLICY ${policy.name}`,
      `ON ${table}`,
      `FOR ${policy.operation}`,
      `TO ${policy.roles.join(', ')}`
    ];

    if (policy.using) {
      parts.push(`USING (${policy.using})`);
    }

    if (policy.withCheck) {
      parts.push(`WITH CHECK (${policy.withCheck})`);
    }

    const sql = parts.join(' ');

    try {
      await this.driver.query(sql);
      this.addPolicy(table, policy);
      this.logger.info(`Created RLS policy: ${policy.name}`);
    } catch (error) {
      this.logger.error(`Failed to create RLS policy: ${policy.name}`, error);
      throw error;
    }
  }

  /**
   * Drop a policy from database (PostgreSQL)
   */
  async dropPolicy(table: string, policyName: string): Promise<void> {
    const sql = `DROP POLICY IF EXISTS ${policyName} ON ${table}`;

    try {
      await this.driver.query(sql);
      this.removePolicy(table, policyName);
      this.logger.info(`Dropped RLS policy: ${policyName}`);
    } catch (error) {
      this.logger.error(`Failed to drop RLS policy: ${policyName}`, error);
      throw error;
    }
  }

  /**
   * Enable RLS on a table (PostgreSQL)
   */
  async enableRLS(table: string): Promise<void> {
    const sql = `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`;

    try {
      await this.driver.query(sql);
      this.logger.info(`Enabled RLS on table: ${table}`);
    } catch (error) {
      this.logger.error(`Failed to enable RLS on table: ${table}`, error);
      throw error;
    }
  }

  /**
   * Disable RLS on a table (PostgreSQL)
   */
  async disableRLS(table: string): Promise<void> {
    const sql = `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`;

    try {
      await this.driver.query(sql);
      this.logger.info(`Disabled RLS on table: ${table}`);
    } catch (error) {
      this.logger.error(`Failed to disable RLS on table: ${table}`, error);
      throw error;
    }
  }
}
