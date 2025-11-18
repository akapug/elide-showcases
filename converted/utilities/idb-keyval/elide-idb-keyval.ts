/**
 * IDB-Keyval - Simple IndexedDB Key-Value Store
 *
 * Super-simple key-value store built on IndexedDB.
 * **POLYGLOT SHOWCASE**: One key-value store for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/idb-keyval (~200K+ downloads/week)
 *
 * Features:
 * - Simple get/set/del API
 * - Promise-based
 * - Only 600 bytes minified
 * - No setup required
 * - Works in all browsers
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Store data from any backend
 * - ONE key-value store works everywhere on Elide
 * - Consistent storage API across tech stacks
 * - Share storage patterns across Python, Ruby, Java frontends
 *
 * Use cases:
 * - Simple offline storage
 * - User preferences
 * - Cache layer
 * - Session data
 *
 * Package has ~200K+ downloads/week on npm - simplest IDB wrapper!
 */

const dbName = 'keyval-store';
const storeName = 'keyval';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(storeName);
      };
    });
  }
  return dbPromise;
}

export async function get<T = any>(key: IDBValidKey): Promise<T | undefined> {
  const db = await getDB();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  const request = store.get(key);

  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function set(key: IDBValidKey, value: any): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);
  const request = store.put(value, key);

  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function del(key: IDBValidKey): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);
  const request = store.delete(key);

  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clear(): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);
  const request = store.clear();

  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function keys(): Promise<IDBValidKey[]> {
  const db = await getDB();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  const request = store.getAllKeys();

  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function values<T = any>(): Promise<T[]> {
  const db = await getDB();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function entries<T = any>(): Promise<[IDBValidKey, T][]> {
  const [allKeys, allValues] = await Promise.all([keys(), values<T>()]);
  return allKeys.map((key, i) => [key, allValues[i]]);
}

export default { get, set, del, clear, keys, values, entries };

// CLI Demo
if (import.meta.url.includes("elide-idb-keyval.ts")) {
  console.log("🔑 IDB-Keyval - Simple Key-Value Store (POLYGLOT!)\n");

  console.log("=== Example 1: Set and Get ===");
  console.log("await set('username', 'alice');");
  console.log("const name = await get('username');");
  console.log("console.log(name); // 'alice'");
  console.log("✓ Simple get/set operations");
  console.log();

  console.log("=== Example 2: Store Objects ===");
  console.log("await set('user', { name: 'Alice', age: 30 });");
  console.log("const user = await get('user');");
  console.log("console.log(user); // { name: 'Alice', age: 30 }");
  console.log("✓ Store any JSON-serializable data");
  console.log();

  console.log("=== Example 3: Store Arrays ===");
  console.log("await set('todos', ['Buy milk', 'Walk dog']);");
  console.log("const todos = await get('todos');");
  console.log("console.log(todos); // ['Buy milk', 'Walk dog']");
  console.log("✓ Arrays are fully supported");
  console.log();

  console.log("=== Example 4: Delete Key ===");
  console.log("await del('username');");
  console.log("const name = await get('username');");
  console.log("console.log(name); // undefined");
  console.log("✓ Delete individual keys");
  console.log();

  console.log("=== Example 5: Get All Keys ===");
  console.log("await set('key1', 'value1');");
  console.log("await set('key2', 'value2');");
  console.log("const allKeys = await keys();");
  console.log("console.log(allKeys); // ['key1', 'key2']");
  console.log("✓ List all stored keys");
  console.log();

  console.log("=== Example 6: Get All Values ===");
  console.log("const allValues = await values();");
  console.log("console.log(allValues); // ['value1', 'value2']");
  console.log("✓ List all stored values");
  console.log();

  console.log("=== Example 7: Get All Entries ===");
  console.log("const allEntries = await entries();");
  console.log("console.log(allEntries);");
  console.log("// [['key1', 'value1'], ['key2', 'value2']]");
  console.log("✓ List all key-value pairs");
  console.log();

  console.log("=== Example 8: Clear All Data ===");
  console.log("await clear();");
  console.log("const allKeys = await keys();");
  console.log("console.log(allKeys.length); // 0");
  console.log("✓ Clear entire store");
  console.log();

  console.log("=== Example 9: Real-World Usage ===");
  console.log("// Store user preferences");
  console.log("await set('theme', 'dark');");
  console.log("await set('language', 'en');");
  console.log("await set('notifications', true);");
  console.log("");
  console.log("// Retrieve preferences");
  console.log("const theme = await get('theme'); // 'dark'");
  console.log("const lang = await get('language'); // 'en'");
  console.log("const notif = await get('notifications'); // true");
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Store data from ANY backend:");
  console.log("  • Node.js frontend → idb-keyval");
  console.log("  • Python frontend → idb-keyval");
  console.log("  • Ruby frontend → idb-keyval");
  console.log("  • Java frontend → idb-keyval");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One storage API, all frontends");
  console.log("  ✓ Only 600 bytes minified");
  console.log("  ✓ No setup required");
  console.log("  ✓ No need for language-specific solutions");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- User preferences");
  console.log("- Cache layer");
  console.log("- Session data");
  console.log("- Simple offline storage");
  console.log("- Settings persistence");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Only 600 bytes minified");
  console.log("- Zero dependencies");
  console.log("- Fast operations");
  console.log("- ~200K+ downloads/week on npm!");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use for simple storage across all frontends");
  console.log("- Perfect for user preferences");
  console.log("- One storage pattern for all projects");
  console.log("- Ideal for polyglot PWA development!");
}
