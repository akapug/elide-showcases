/**
 * Permission Checker
 * Checks user permissions against actions and subjects
 */

import { getDatabase } from '../database/connection.js';

export class PermissionChecker {
  constructor(user) {
    this.user = user;
    this.permissionsCache = null;
  }

  /**
   * Check if user can perform action on subject
   */
  async can(action, subject, conditions = null) {
    // Super admin has all permissions
    if (this.user?.role?.type === 'super-admin') {
      return true;
    }

    // API tokens have custom permission model
    if (this.user?.type === 'api-token') {
      return this.checkAPITokenPermission(action, this.user.tokenType);
    }

    // Public user
    if (!this.user) {
      return this.checkPublicPermission(action, subject);
    }

    // Load user permissions
    const permissions = await this.getPermissions(action, subject);

    if (permissions.length === 0) {
      return false;
    }

    // Check conditions if provided
    if (conditions) {
      return permissions.some(p => this.matchConditions(p.conditions, conditions));
    }

    return true;
  }

  /**
   * Get permissions for action and subject
   */
  async getPermissions(action, subject) {
    if (!this.user?.role) {
      return [];
    }

    // Load all permissions for user's role
    if (!this.permissionsCache) {
      await this.loadPermissions();
    }

    // Filter permissions by action and subject
    return this.permissionsCache.filter(p => {
      const actionMatch = !p.action || p.action === action || p.action === '*';
      const subjectMatch = !p.subject || p.subject === subject || p.subject === '*';
      return actionMatch && subjectMatch;
    });
  }

  /**
   * Load permissions from database
   */
  async loadPermissions() {
    const db = getDatabase();
    const results = await db.query(
      'SELECT * FROM cms_permissions WHERE role_id = ?',
      [this.user.role.id]
    );

    this.permissionsCache = results.map(p => ({
      id: p.id,
      action: p.action,
      subject: p.subject,
      fields: p.fields ? JSON.parse(p.fields) : null,
      conditions: p.conditions ? JSON.parse(p.conditions) : null,
    }));
  }

  /**
   * Check public permissions
   */
  async checkPublicPermission(action, subject) {
    const db = getDatabase();

    // Find public role
    const roles = await db.query("SELECT * FROM cms_roles WHERE type = 'public' LIMIT 1");
    if (roles.length === 0) {
      return false;
    }

    const permissions = await db.query(
      'SELECT * FROM cms_permissions WHERE role_id = ? AND action = ? AND subject = ?',
      [roles[0].id, action, subject]
    );

    return permissions.length > 0;
  }

  /**
   * Check API token permissions
   */
  checkAPITokenPermission(action, tokenType) {
    // Map token types to allowed actions
    const permissions = {
      'read-only': ['read'],
      'full-access': ['read', 'create', 'update', 'delete'],
      'custom': [], // Would be configured per token
    };

    const allowed = permissions[tokenType] || [];
    return allowed.includes(action) || allowed.includes('*');
  }

  /**
   * Match permission conditions
   */
  matchConditions(permissionConditions, actualConditions) {
    if (!permissionConditions) {
      return true;
    }

    // Simple condition matching
    for (const [key, value] of Object.entries(permissionConditions)) {
      if (actualConditions[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get allowed fields for action and subject
   */
  async getAllowedFields(action, subject) {
    const permissions = await this.getPermissions(action, subject);

    if (permissions.length === 0) {
      return [];
    }

    // Merge fields from all matching permissions
    const fields = new Set();

    for (const permission of permissions) {
      if (permission.fields) {
        if (permission.fields.includes('*')) {
          return ['*'];
        }
        permission.fields.forEach(f => fields.add(f));
      }
    }

    return Array.from(fields);
  }
}

/**
 * Permission Service
 * Manages permissions CRUD
 */
export class PermissionService {
  /**
   * Create permission
   */
  async createPermission(data) {
    const db = getDatabase();

    await db.execute(
      `INSERT INTO cms_permissions
       (role_id, action, subject, fields, conditions)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.roleId,
        data.action,
        data.subject || null,
        data.fields ? JSON.stringify(data.fields) : null,
        data.conditions ? JSON.stringify(data.conditions) : null,
      ]
    );

    return true;
  }

  /**
   * Update permission
   */
  async updatePermission(id, data) {
    const db = getDatabase();

    await db.execute(
      `UPDATE cms_permissions
       SET action = ?, subject = ?, fields = ?, conditions = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.action,
        data.subject || null,
        data.fields ? JSON.stringify(data.fields) : null,
        data.conditions ? JSON.stringify(data.conditions) : null,
        id,
      ]
    );

    return true;
  }

  /**
   * Delete permission
   */
  async deletePermission(id) {
    const db = getDatabase();
    await db.execute('DELETE FROM cms_permissions WHERE id = ?', [id]);
    return true;
  }

  /**
   * Get permissions for role
   */
  async getPermissionsByRole(roleId) {
    const db = getDatabase();
    const results = await db.query(
      'SELECT * FROM cms_permissions WHERE role_id = ?',
      [roleId]
    );

    return results.map(p => ({
      id: p.id,
      roleId: p.role_id,
      action: p.action,
      subject: p.subject,
      fields: p.fields ? JSON.parse(p.fields) : null,
      conditions: p.conditions ? JSON.parse(p.conditions) : null,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  }

  /**
   * Set default permissions for content type
   */
  async setDefaultPermissions(contentType, roleType, actions = ['read']) {
    const db = getDatabase();

    // Find role
    const roles = await db.query('SELECT * FROM cms_roles WHERE type = ? LIMIT 1', [roleType]);
    if (roles.length === 0) {
      throw new Error(`Role ${roleType} not found`);
    }

    const role = roles[0];

    // Create permissions for each action
    for (const action of actions) {
      await this.createPermission({
        roleId: role.id,
        action,
        subject: contentType.uid,
        fields: ['*'],
      });
    }

    return true;
  }
}
