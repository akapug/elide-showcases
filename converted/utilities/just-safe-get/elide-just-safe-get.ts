/**
 * Just Safe Get - Safe Property Access
 *
 * Safely get nested object properties without errors.
 * **POLYGLOT SHOWCASE**: One safe get utility for ALL languages on Elide!
 *
 * Based on just-* utilities pattern (~20K+ downloads/week combined)
 *
 * Features:
 * - Null-safe property access
 * - Dot notation support
 * - Array indexing support
 * - Default value support
 * - Type-safe access
 * - Zero dependencies
 *
 * Use cases:
 * - API response parsing
 * - Configuration access
 * - Optional chaining alternative
 * - Deep object traversal
 */

export function safeGet<T = any>(obj: any, path: string | string[], defaultValue?: T): T | undefined {
  if (!obj) return defaultValue;

  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result == null) {
      return defaultValue;
    }
    result = result[key];
  }

  return result === undefined ? defaultValue : result;
}

export default safeGet;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔒 Just Safe Get - Safe Property Access for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Safe Access ===");
  const user = {
    name: "Alice",
    address: {
      city: "New York",
      zip: "10001"
    }
  };

  console.log("safeGet(user, 'name'):", safeGet(user, 'name'));
  console.log("safeGet(user, 'address.city'):", safeGet(user, 'address.city'));
  console.log("safeGet(user, 'address.country'):", safeGet(user, 'address.country'));
  console.log("safeGet(user, 'address.country', 'USA'):", safeGet(user, 'address.country', 'USA'));
  console.log();

  console.log("=== Example 2: Deeply Nested Access ===");
  const data = {
    response: {
      data: {
        users: [
          { id: 1, profile: { email: "alice@example.com" } },
          { id: 2, profile: { email: "bob@example.com" } }
        ]
      }
    }
  };

  console.log("Deep access:", safeGet(data, 'response.data.users'));
  console.log("Missing path:", safeGet(data, 'response.error.message', 'No error'));
  console.log();

  console.log("=== Example 3: Array Access ===");
  const arr = {
    items: [
      { name: "Item 1" },
      { name: "Item 2" }
    ]
  };

  console.log("Array access:", safeGet(arr, ['items', '0', 'name']));
  console.log("Missing index:", safeGet(arr, ['items', '10', 'name'], 'Not found'));
  console.log();

  console.log("=== Example 4: Null/Undefined Handling ===");
  const nullObj = null;
  const undefinedObj = undefined;
  const emptyObj = {};

  console.log("Null object:", safeGet(nullObj, 'any.path', 'default'));
  console.log("Undefined object:", safeGet(undefinedObj, 'any.path', 'default'));
  console.log("Empty object:", safeGet(emptyObj, 'any.path', 'default'));
  console.log();

  console.log("=== Example 5: API Response Parsing ===");
  const apiResponse = {
    status: 200,
    data: {
      user: {
        id: 1,
        name: "Alice"
      }
    }
  };

  const userId = safeGet(apiResponse, 'data.user.id', -1);
  const userName = safeGet(apiResponse, 'data.user.name', 'Unknown');
  const userEmail = safeGet(apiResponse, 'data.user.email', 'N/A');

  console.log("User ID:", userId);
  console.log("User Name:", userName);
  console.log("User Email:", userEmail);
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same safe get utility works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log("\nBenefits:");
  console.log("  ✓ One safe access implementation, all languages");
  console.log("  ✓ Null-safe property access everywhere");
  console.log("  ✓ Share utilities across your stack");
  console.log("  ✓ No need for language-specific implementations");
  console.log("\n✅ Use Cases:");
  console.log("- API response parsing");
  console.log("- Configuration access");
  console.log("- Optional chaining alternative");
  console.log("- Deep object traversal");
  console.log("- Safe property access");
  console.log("\n🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Minimal overhead");
  console.log("- Part of just-* utilities family");
}
