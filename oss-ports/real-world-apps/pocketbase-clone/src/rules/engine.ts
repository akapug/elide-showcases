/**
 * Rules Engine
 * Evaluates JavaScript expressions for collection access control
 */

import { Collection } from '../collections/manager.js';

export interface RuleContext {
  auth?: any; // Authenticated user record
  record?: any; // The record being accessed
  data?: any; // Data being submitted (for create/update)
  admin?: boolean; // Is the user an admin
}

export type RuleType = 'listRule' | 'viewRule' | 'createRule' | 'updateRule' | 'deleteRule';

export class RulesEngine {
  /**
   * Check if a rule allows access
   */
  async checkRule(
    collection: Collection,
    ruleType: RuleType,
    context: RuleContext
  ): Promise<boolean> {
    // Admin always has access
    if (context.admin) {
      return true;
    }

    const rule = collection[ruleType];

    // null means no access (locked)
    if (rule === null) {
      return false;
    }

    // undefined or empty string means public access
    if (rule === undefined || rule === '') {
      return true;
    }

    // Evaluate the rule expression
    try {
      const result = await this.evaluateExpression(rule, context);
      return Boolean(result);
    } catch (error) {
      console.error(`Error evaluating ${ruleType} for ${collection.name}:`, error);
      return false;
    }
  }

  /**
   * Evaluate a JavaScript expression with context
   */
  private async evaluateExpression(expression: string, context: RuleContext): Promise<any> {
    // Create a safe evaluation context
    const safeContext = {
      auth: context.auth || null,
      record: context.record || null,
      data: context.data || null,

      // Helper functions
      $auth: context.auth || null,
      $record: context.record || null,
      $data: context.data || null,

      // Utility functions
      $now: () => new Date(),
      $contains: (arr: any[], val: any) => Array.isArray(arr) && arr.includes(val),
      $size: (val: any) => {
        if (Array.isArray(val)) return val.length;
        if (typeof val === 'string') return val.length;
        if (typeof val === 'object' && val !== null) return Object.keys(val).length;
        return 0;
      },
      $isEmpty: (val: any) => {
        if (val === null || val === undefined) return true;
        if (Array.isArray(val)) return val.length === 0;
        if (typeof val === 'string') return val === '';
        if (typeof val === 'object') return Object.keys(val).length === 0;
        return false;
      },
      $isNotEmpty: (val: any) => {
        return !this.evaluateExpression('$isEmpty(val)', { ...context, data: { val } });
      },
    };

    // Use Function constructor for safer evaluation than eval
    // Wrap in async function to support await
    const func = new Function(
      ...Object.keys(safeContext),
      `return (async () => { return ${expression}; })();`
    );

    try {
      return await func(...Object.values(safeContext));
    } catch (error) {
      throw new Error(`Failed to evaluate expression: ${expression}. Error: ${error}`);
    }
  }

  /**
   * Generate filter query from list rule
   */
  async generateFilterFromRule(
    collection: Collection,
    context: RuleContext
  ): Promise<string | null> {
    // Admin has no filter
    if (context.admin) {
      return null;
    }

    const rule = collection.listRule;

    // null means no access
    if (rule === null) {
      return 'id = NULL'; // Always false
    }

    // undefined or empty means no filter
    if (rule === undefined || rule === '') {
      return null;
    }

    // Parse simple rules into SQL filters
    // This is a simplified version - full implementation would need a proper parser
    try {
      // Common patterns:
      // auth.id = record.userId -> userId = '{auth.id}'
      // auth.verified = true -> (if verified) no filter, else block

      // Check if rule references auth.id
      if (rule.includes('auth.id') && context.auth) {
        // Extract field name from patterns like "auth.id = record.fieldName"
        const fieldMatch = rule.match(/auth\.id\s*[=!]=\s*record\.(\w+)/);
        if (fieldMatch) {
          const field = fieldMatch[1];
          const operator = rule.includes('!=') ? '!=' : '=';
          return `${field} ${operator} '${context.auth.id}'`;
        }
      }

      // If we can't parse it, evaluate it as a boolean
      // and return a filter that either allows all or none
      const result = await this.evaluateExpression(rule, context);
      if (result) {
        return null; // Allow all
      } else {
        return 'id = NULL'; // Block all
      }
    } catch (error) {
      console.error(`Error generating filter from rule for ${collection.name}:`, error);
      return 'id = NULL'; // Block all on error
    }
  }

  /**
   * Common rule patterns as helpers
   */
  static readonly RULES = {
    // Public access
    PUBLIC: '',

    // No access
    PRIVATE: null,

    // Only authenticated users
    AUTH_ONLY: 'auth.id != null && auth.id != ""',

    // Only record owner
    OWNER_ONLY: 'auth.id != null && auth.id = record.userId',

    // Only verified users
    VERIFIED_ONLY: 'auth.id != null && auth.verified = true',

    // Owner can update their own record
    OWNER_UPDATE: 'auth.id != null && auth.id = record.id',

    // Owner or admin
    OWNER_OR_ADMIN: 'auth.id = record.userId',
  };

  /**
   * Validate a rule expression syntax
   */
  validateRule(rule: string | null): { valid: boolean; error?: string } {
    if (rule === null || rule === undefined || rule === '') {
      return { valid: true };
    }

    try {
      // Try to parse as JavaScript
      new Function(`return ${rule}`);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid rule syntax: ${error}`,
      };
    }
  }

  /**
   * Get available context variables for rules
   */
  getContextVariables(ruleType: RuleType): string[] {
    const common = ['auth', 'auth.id', 'auth.email', 'auth.verified'];

    switch (ruleType) {
      case 'listRule':
        return common;
      case 'viewRule':
      case 'updateRule':
      case 'deleteRule':
        return [...common, 'record', 'record.id', 'record.*'];
      case 'createRule':
        return [...common, 'data', 'data.*'];
      default:
        return common;
    }
  }

  /**
   * Get available helper functions
   */
  getHelperFunctions(): string[] {
    return [
      '$now() - Current date/time',
      '$contains(array, value) - Check if array contains value',
      '$size(value) - Get size/length of value',
      '$isEmpty(value) - Check if value is empty',
      '$isNotEmpty(value) - Check if value is not empty',
    ];
  }
}

/**
 * Middleware to check rules before API operations
 */
export class RulesMiddleware {
  private engine: RulesEngine;

  constructor(engine: RulesEngine) {
    this.engine = engine;
  }

  /**
   * Check list rule
   */
  async checkListAccess(collection: Collection, context: RuleContext): Promise<void> {
    const allowed = await this.engine.checkRule(collection, 'listRule', context);
    if (!allowed) {
      throw new Error('Forbidden: You do not have permission to list this collection');
    }
  }

  /**
   * Check view rule
   */
  async checkViewAccess(collection: Collection, record: any, context: RuleContext): Promise<void> {
    const allowed = await this.engine.checkRule(collection, 'viewRule', {
      ...context,
      record,
    });
    if (!allowed) {
      throw new Error('Forbidden: You do not have permission to view this record');
    }
  }

  /**
   * Check create rule
   */
  async checkCreateAccess(collection: Collection, data: any, context: RuleContext): Promise<void> {
    const allowed = await this.engine.checkRule(collection, 'createRule', {
      ...context,
      data,
    });
    if (!allowed) {
      throw new Error('Forbidden: You do not have permission to create records in this collection');
    }
  }

  /**
   * Check update rule
   */
  async checkUpdateAccess(
    collection: Collection,
    record: any,
    data: any,
    context: RuleContext
  ): Promise<void> {
    const allowed = await this.engine.checkRule(collection, 'updateRule', {
      ...context,
      record,
      data,
    });
    if (!allowed) {
      throw new Error('Forbidden: You do not have permission to update this record');
    }
  }

  /**
   * Check delete rule
   */
  async checkDeleteAccess(collection: Collection, record: any, context: RuleContext): Promise<void> {
    const allowed = await this.engine.checkRule(collection, 'deleteRule', {
      ...context,
      record,
    });
    if (!allowed) {
      throw new Error('Forbidden: You do not have permission to delete this record');
    }
  }
}
