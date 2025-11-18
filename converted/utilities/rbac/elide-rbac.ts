/**
 * RBAC (Role-Based Access Control) for Elide
 *
 * Features: Role management, Permission assignment, Hierarchical roles,
 * Dynamic role checking, User-role mapping, Fine-grained control
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 300K+ downloads/week
 */

export interface Permission {
  resource: string;
  action: string;
}

export class RBAC {
  private rolePermissions: Map<string, Permission[]> = new Map();
  private userRoles: Map<string, string[]> = new Map();
  private roleHierarchy: Map<string, string[]> = new Map();

  createRole(role: string, permissions: Permission[] = []): void {
    this.rolePermissions.set(role, permissions);
  }

  addPermission(role: string, permission: Permission): void {
    if (!this.rolePermissions.has(role)) {
      this.rolePermissions.set(role, []);
    }
    this.rolePermissions.get(role)!.push(permission);
  }

  assignRole(userId: string, role: string): void {
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, []);
    }
    this.userRoles.get(userId)!.push(role);
  }

  can(userId: string, resource: string, action: string): boolean {
    const roles = this.userRoles.get(userId) || [];
    for (const role of roles) {
      const permissions = this.rolePermissions.get(role) || [];
      if (permissions.some(p => p.resource === resource && p.action === action)) {
        return true;
      }
    }
    return false;
  }

  setParent(role: string, parentRole: string): void {
    if (!this.roleHierarchy.has(role)) {
      this.roleHierarchy.set(role, []);
    }
    this.roleHierarchy.get(role)!.push(parentRole);
  }

  check(userId: string, resource: string, action: string): boolean {
    const roles = this.getAllRoles(userId);
    for (const role of roles) {
      const permissions = this.rolePermissions.get(role) || [];
      if (permissions.some(p => p.resource === resource && p.action === action)) {
        return true;
      }
    }
    return false;
  }

  private getAllRoles(userId: string): string[] {
    const direct = this.userRoles.get(userId) || [];
    const all = new Set(direct);
    for (const role of direct) {
      const parents = this.roleHierarchy.get(role) || [];
      parents.forEach(p => all.add(p));
    }
    return Array.from(all);
  }
}

if (import.meta.url.includes("rbac")) {
  console.log("👥 RBAC for Elide - Role-Based Access Control\n");
  const rbac = new RBAC();
  rbac.createRole('editor', [{ resource: 'article', action: 'edit' }]);
  rbac.createRole('admin', [{ resource: 'article', action: 'delete' }]);
  rbac.setParent('admin', 'editor');
  rbac.assignRole('alice', 'admin');
  console.log("alice can edit article:", rbac.check('alice', 'article', 'edit'));
  console.log("alice can delete article:", rbac.check('alice', 'article', 'delete'));
  console.log("\n🚀 Polyglot Benefits: 300K+ npm downloads/week");
}

export default RBAC;
