// dot-prop - Dot notation property access for Elide/TypeScript
// Original: https://github.com/sindresorhus/dot-prop
// Author: Sindre Sorhus
// Zero dependencies - pure TypeScript!

/**
 * Get a property from an object using dot notation.
 *
 * @param obj - Object to get property from
 * @param path - Dot notation path (e.g., 'a.b.c')
 * @param defaultValue - Default value if property doesn't exist
 * @returns Property value or default
 *
 * @example
 * ```typescript
 * get({a: {b: 1}}, 'a.b')        // 1
 * get({a: {b: 1}}, 'a.c')        // undefined
 * get({a: {b: 1}}, 'a.c', 0)     // 0 (default)
 * get({a: [1, 2, 3]}, 'a.1')     // 2 (array index)
 * ```
 */
export function get(obj: any, path: string, defaultValue?: any): any {
  if (obj == null) return defaultValue;

  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }

  return result === undefined ? defaultValue : result;
}

/**
 * Set a property on an object using dot notation.
 *
 * @param obj - Object to set property on
 * @param path - Dot notation path
 * @param value - Value to set
 * @returns Modified object
 *
 * @example
 * ```typescript
 * set({}, 'a.b.c', 1)            // {a: {b: {c: 1}}}
 * set({a: {b: 1}}, 'a.c', 2)     // {a: {b: 1, c: 2}}
 * ```
 */
export function set(obj: any, path: string, value: any): any {
  if (obj == null) {
    obj = {};
  }

  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
  return obj;
}

/**
 * Check if object has a property using dot notation.
 *
 * @param obj - Object to check
 * @param path - Dot notation path
 * @returns True if property exists
 *
 * @example
 * ```typescript
 * has({a: {b: 1}}, 'a.b')        // true
 * has({a: {b: 1}}, 'a.c')        // false
 * ```
 */
export function has(obj: any, path: string): boolean {
  if (obj == null) return false;

  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (current == null || typeof current !== 'object') return false;
    current = current[keys[i]];
  }

  return current != null && keys[keys.length - 1] in current;
}

/**
 * Delete a property from an object using dot notation.
 *
 * @param obj - Object to delete property from
 * @param path - Dot notation path
 * @returns True if property was deleted
 *
 * @example
 * ```typescript
 * deleteProperty({a: {b: 1}}, 'a.b')  // true (deletes a.b)
 * deleteProperty({a: {b: 1}}, 'a.c')  // false (doesn't exist)
 * ```
 */
export function deleteProperty(obj: any, path: string): boolean {
  if (obj == null) return false;

  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  for (const key of keys) {
    if (current == null || typeof current !== 'object') return false;
    current = current[key];
  }

  if (current != null && lastKey in current) {
    delete current[lastKey];
    return true;
  }

  return false;
}

const dotProp = { get, set, has, delete: deleteProperty };
export default dotProp;

// CLI usage and demonstrations
if (import.meta.url.includes("elide-dot-prop.ts")) {
  console.log("🔗 dot-prop - Dot Notation Access on Elide\n");

  console.log("=== Get Property ===");
  const obj = {
    user: {
      name: 'Alice',
      address: {
        city: 'New York',
        zip: '10001'
      },
      tags: ['admin', 'user']
    }
  };

  console.log(`get(obj, 'user.name'):`, get(obj, 'user.name'));
  console.log(`get(obj, 'user.address.city'):`, get(obj, 'user.address.city'));
  console.log(`get(obj, 'user.tags.0'):`, get(obj, 'user.tags.0'));
  console.log(`get(obj, 'user.email'):`, get(obj, 'user.email'));
  console.log(`get(obj, 'user.email', 'N/A'):`, get(obj, 'user.email', 'N/A'));
  console.log();

  console.log("=== Set Property ===");
  const obj2 = {};
  set(obj2, 'a.b.c', 42);
  console.log(`set({}, 'a.b.c', 42):`, obj2);

  const obj3 = { a: { b: 1 } };
  set(obj3, 'a.c', 2);
  console.log(`set({a: {b: 1}}, 'a.c', 2):`, obj3);
  console.log();

  console.log("=== Has Property ===");
  console.log(`has(obj, 'user.name'):`, has(obj, 'user.name'));
  console.log(`has(obj, 'user.email'):`, has(obj, 'user.email'));
  console.log(`has(obj, 'user.address.city'):`, has(obj, 'user.address.city'));
  console.log();

  console.log("=== Delete Property ===");
  const obj4 = { a: { b: 1, c: 2 } };
  console.log(`Before delete:`, obj4);
  deleteProperty(obj4, 'a.b');
  console.log(`After delete(obj, 'a.b'):`, obj4);
  console.log();

  console.log("=== Real-World Examples ===");
  console.log();

  console.log("1. Configuration access:");
  const config = {
    database: {
      host: 'localhost',
      port: 5432,
      credentials: {
        username: 'admin',
        password: 'secret'
      }
    }
  };
  console.log(`  DB Host: ${get(config, 'database.host')}`);
  console.log(`  DB User: ${get(config, 'database.credentials.username')}`);
  console.log();

  console.log("2. API response parsing:");
  const apiResponse = {
    data: {
      user: {
        id: 123,
        profile: {
          displayName: 'Alice Smith'
        }
      }
    }
  };
  console.log(`  Display Name: ${get(apiResponse, 'data.user.profile.displayName')}`);
  console.log();

  console.log("3. Form validation:");
  const form = {
    fields: {
      email: { value: 'alice@example.com', valid: true },
      password: { value: 'secret123', valid: true }
    }
  };
  console.log(`  Email valid: ${get(form, 'fields.email.valid')}`);
  console.log(`  Password valid: ${get(form, 'fields.password.valid')}`);
  console.log();

  console.log("=== Performance Note ===");
  console.log("✅ 40M+ downloads/week on npm");
  console.log("✅ Clean dot notation access");
  console.log("✅ Supports get, set, has, delete");
  console.log("✅ Zero dependencies");
}
