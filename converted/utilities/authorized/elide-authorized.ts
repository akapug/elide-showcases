/**
 * Authorized for Elide
 * Features: Simple authorization, Role checking, Permission management
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 100K+ downloads/week
 */

export class Authorized {
  private permissions: Map<string, string[]> = new Map();

  grant(role: string, permissions: string[]): void {
    this.permissions.set(role, permissions);
  }

  can(role: string, permission: string): boolean {
    return this.permissions.get(role)?.includes(permission) || false;
  }

  middleware(permission: string) {
    return (req: any, res: any, next: any) => {
      const role = req.user?.role;
      if (!role || !this.can(role, permission)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
  }
}

if (import.meta.url.includes("authorized")) {
  console.log("✔️  Authorized for Elide\n🚀 Polyglot: 100K+ npm downloads/week");
}

export default Authorized;
