/**
 * Node-Casbin for Elide
 * Features: Authorization library, Policy enforcement, RBAC/ABAC/ACL
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 300K+ downloads/week
 */

export { Enforcer, newEnforcer } from '../casbin/elide-casbin.ts';

if (import.meta.url.includes("node-casbin")) {
  console.log("🛡️  Node-Casbin for Elide\n🚀 Polyglot: 300K+ npm downloads/week");
}
