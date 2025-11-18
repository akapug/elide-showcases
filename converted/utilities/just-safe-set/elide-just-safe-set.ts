/**
 * Just Safe Set - Safe Property Setting
 *
 * Safely set nested object properties with automatic creation.
 * **POLYGLOT SHOWCASE**: One safe set utility for ALL languages on Elide!
 *
 * Based on just-* utilities pattern (~20K+ downloads/week combined)
 *
 * Features:
 * - Automatic path creation
 * - Dot notation support
 * - Array support
 * - Immutable updates
 * - Type-safe setting
 * - Zero dependencies
 *
 * Use cases:
 * - Deep object updates
 * - Configuration building
 * - State management
 * - Form data handling
 */

export function safeSet<T = any>(obj: any, path: string | string[], value: T): any {
  const keys = Array.isArray(path) ? path : path.split('.');
  
  function setRecursive(current: any, index: number): any {
    if (index === keys.length - 1) {
      const key = keys[index];
      if (Array.isArray(current)) {
        const result = [...current];
        result[key as any] = value;
        return result;
      }
      return { ...(current || {}), [key]: value };
    }

    const key = keys[index];
    const currentValue = current?.[key];
    const nextValue = setRecursive(currentValue, index + 1);
    
    if (Array.isArray(current)) {
      const result = [...current];
      result[key as any] = nextValue;
      return result;
    }
    
    return { ...(current || {}), [key]: nextValue };
  }

  return setRecursive(obj, 0);
}

export default safeSet;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✏️  Just Safe Set - Safe Property Setting for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Safe Set ===");
  const user = { name: "Alice" };
  console.log("Original:", user);
  
  const updated = safeSet(user, 'age', 25);
  console.log("After safeSet(user, 'age', 25):", updated);
  console.log("Original unchanged:", user);
  console.log();

  console.log("=== Example 2: Deep Path Creation ===");
  const empty = {};
  const withDeepPath = safeSet(empty, 'address.city.name', 'New York');
  console.log("Created deep path:", withDeepPath);
  console.log();

  console.log("=== Example 3: Updating Nested Properties ===");
  const config = {
    server: {
      host: 'localhost',
      port: 3000
    }
  };
  
  console.log("Original config:", config);
  const newConfig = safeSet(config, 'server.port', 8080);
  console.log("Updated config:", newConfig);
  console.log("Original unchanged:", config);
  console.log();

  console.log("=== Example 4: Array Updates ===");
  const data = {
    items: [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" }
    ]
  };

  const updatedData = safeSet(data, ['items', '0', 'name'], 'Updated Item 1');
  console.log("Updated array item:", updatedData);
  console.log();

  console.log("=== Example 5: Building Complex Objects ===");
  let state = {};
  state = safeSet(state, 'user.profile.name', 'Alice');
  state = safeSet(state, 'user.profile.email', 'alice@example.com');
  state = safeSet(state, 'user.settings.theme', 'dark');
  state = safeSet(state, 'user.settings.notifications', true);
  
  console.log("Built complex object:", state);
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same safe set utility works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log("\nBenefits:");
  console.log("  ✓ One safe set implementation, all languages");
  console.log("  ✓ Automatic path creation everywhere");
  console.log("  ✓ Immutable updates by default");
  console.log("  ✓ Share utilities across your stack");
  console.log("\n✅ Use Cases:");
  console.log("- Deep object updates");
  console.log("- Configuration building");
  console.log("- State management");
  console.log("- Form data handling");
  console.log("- Immutable updates");
  console.log("\n🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Minimal overhead");
  console.log("- Part of just-* utilities family");
}
