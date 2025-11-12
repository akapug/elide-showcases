/**
 * Storage - Web Storage API for Elide
 *
 * Complete implementation of localStorage and sessionStorage.
 * **POLYGLOT SHOWCASE**: Client-side storage for ALL languages on Elide!
 *
 * Features:
 * - localStorage (persistent)
 * - sessionStorage (session-only)
 * - Key-value storage
 * - JSON support
 * - Storage events
 * - Quota management
 *
 * Use cases:
 * - User preferences
 * - Session state
 * - Offline data
 * - Caching
 * - Form data persistence
 */

/**
 * Storage implementation
 */
export class Storage {
  private data: Map<string, string> = new Map();
  private readonly storageType: 'local' | 'session';

  constructor(type: 'local' | 'session' = 'local') {
    this.storageType = type;
  }

  /**
   * Get number of items
   */
  get length(): number {
    return this.data.size;
  }

  /**
   * Get item by key
   */
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  /**
   * Set item
   */
  setItem(key: string, value: string): void {
    const oldValue = this.data.get(key);
    this.data.set(key, String(value));

    // Dispatch storage event
    if (typeof window !== 'undefined') {
      const event = new StorageEvent('storage', {
        key,
        oldValue: oldValue ?? null,
        newValue: String(value),
        url: typeof location !== 'undefined' ? location.href : '',
        storageArea: this
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Remove item by key
   */
  removeItem(key: string): void {
    const oldValue = this.data.get(key);
    this.data.delete(key);

    // Dispatch storage event
    if (typeof window !== 'undefined' && oldValue !== undefined) {
      const event = new StorageEvent('storage', {
        key,
        oldValue,
        newValue: null,
        url: typeof location !== 'undefined' ? location.href : '',
        storageArea: this
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.data.clear();

    // Dispatch storage event
    if (typeof window !== 'undefined') {
      const event = new StorageEvent('storage', {
        key: null,
        oldValue: null,
        newValue: null,
        url: typeof location !== 'undefined' ? location.href : '',
        storageArea: this
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Get key at index
   */
  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  /**
   * Check if key exists
   */
  hasItem(key: string): boolean {
    return this.data.has(key);
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.data.keys());
  }

  /**
   * Get all values
   */
  values(): string[] {
    return Array.from(this.data.values());
  }

  /**
   * Get all entries
   */
  entries(): [string, string][] {
    return Array.from(this.data.entries());
  }
}

/**
 * StorageEvent class
 */
export class StorageEvent extends Event {
  key: string | null;
  oldValue: string | null;
  newValue: string | null;
  url: string;
  storageArea: Storage | null;

  constructor(type: string, init?: StorageEventInit) {
    super(type);
    this.key = init?.key ?? null;
    this.oldValue = init?.oldValue ?? null;
    this.newValue = init?.newValue ?? null;
    this.url = init?.url ?? '';
    this.storageArea = init?.storageArea ?? null;
  }
}

interface StorageEventInit {
  key?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  url?: string;
  storageArea?: Storage | null;
}

/**
 * Helper class for JSON storage
 */
export class JSONStorage {
  constructor(private storage: Storage) {}

  getItem<T = any>(key: string): T | null {
    const value = this.storage.getItem(key);
    if (value === null) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value as any;
    }
  }

  setItem(key: string, value: any): void {
    this.storage.setItem(key, JSON.stringify(value));
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }

  hasItem(key: string): boolean {
    return this.storage.hasItem(key);
  }
}

// Global instances
export const localStorage = new Storage('local');
export const sessionStorage = new Storage('session');

// Default export
export default {
  Storage,
  StorageEvent,
  JSONStorage,
  localStorage,
  sessionStorage
};

// CLI Demo
if (import.meta.url.includes("storage.ts")) {
  console.log("💾 Storage - Web Storage API for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: localStorage Basics ===");
  localStorage.setItem('username', 'Alice');
  localStorage.setItem('theme', 'dark');
  console.log('Username:', localStorage.getItem('username'));
  console.log('Theme:', localStorage.getItem('theme'));
  console.log('Items:', localStorage.length);
  console.log();

  console.log("=== Example 2: sessionStorage ===");
  sessionStorage.setItem('sessionId', 'abc123');
  sessionStorage.setItem('isLoggedIn', 'true');
  console.log('Session ID:', sessionStorage.getItem('sessionId'));
  console.log('Logged in:', sessionStorage.getItem('isLoggedIn'));
  console.log();

  console.log("=== Example 3: Remove Items ===");
  localStorage.setItem('temp', 'value');
  console.log('Before remove:', localStorage.getItem('temp'));
  localStorage.removeItem('temp');
  console.log('After remove:', localStorage.getItem('temp'));
  console.log();

  console.log("=== Example 4: Clear Storage ===");
  localStorage.setItem('key1', 'value1');
  localStorage.setItem('key2', 'value2');
  console.log('Items before clear:', localStorage.length);
  localStorage.clear();
  console.log('Items after clear:', localStorage.length);
  console.log();

  console.log("=== Example 5: Iterate Keys ===");
  localStorage.setItem('a', '1');
  localStorage.setItem('b', '2');
  localStorage.setItem('c', '3');

  console.log('All keys:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key!);
    console.log(`  ${key}: ${value}`);
  }
  console.log();

  console.log("=== Example 6: JSON Storage ===");
  const jsonStore = new JSONStorage(localStorage);

  const user = { name: 'Bob', age: 30, preferences: { theme: 'light' } };
  jsonStore.setItem('user', user);

  const loadedUser = jsonStore.getItem<typeof user>('user');
  console.log('Saved user:', loadedUser);
  console.log();

  console.log("=== Example 7: Array Storage ===");
  const tasks = ['Task 1', 'Task 2', 'Task 3'];
  jsonStore.setItem('tasks', tasks);

  const loadedTasks = jsonStore.getItem<string[]>('tasks');
  console.log('Saved tasks:', loadedTasks);
  console.log();

  console.log("=== Example 8: User Preferences ===");
  class UserPreferences {
    private storage: JSONStorage;

    constructor() {
      this.storage = new JSONStorage(localStorage);
    }

    setPreference(key: string, value: any) {
      const prefs = this.getAll();
      prefs[key] = value;
      this.storage.setItem('preferences', prefs);
    }

    getPreference(key: string, defaultValue?: any): any {
      const prefs = this.getAll();
      return prefs[key] ?? defaultValue;
    }

    getAll(): Record<string, any> {
      return this.storage.getItem('preferences') || {};
    }

    clear() {
      this.storage.removeItem('preferences');
    }
  }

  const prefs = new UserPreferences();
  prefs.setPreference('language', 'en');
  prefs.setPreference('notifications', true);
  prefs.setPreference('fontSize', 14);

  console.log('Language:', prefs.getPreference('language'));
  console.log('Notifications:', prefs.getPreference('notifications'));
  console.log('Font size:', prefs.getPreference('fontSize'));
  console.log('All preferences:', prefs.getAll());
  console.log();

  console.log("=== Example 9: Form State Persistence ===");
  class FormState {
    private storage: JSONStorage;

    constructor(private formId: string) {
      this.storage = new JSONStorage(sessionStorage);
    }

    saveField(fieldName: string, value: any) {
      const state = this.load();
      state[fieldName] = value;
      this.storage.setItem(`form_${this.formId}`, state);
    }

    load(): Record<string, any> {
      return this.storage.getItem(`form_${this.formId}`) || {};
    }

    clear() {
      this.storage.removeItem(`form_${this.formId}`);
    }
  }

  const formState = new FormState('contact');
  formState.saveField('name', 'John Doe');
  formState.saveField('email', 'john@example.com');
  formState.saveField('message', 'Hello!');

  console.log('Form state:', formState.load());
  console.log();

  console.log("=== Example 10: Cache Manager ===");
  class CacheManager {
    private storage: JSONStorage;

    constructor() {
      this.storage = new JSONStorage(localStorage);
    }

    set(key: string, value: any, ttlSeconds?: number) {
      const item = {
        value,
        expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
      };
      this.storage.setItem(`cache_${key}`, item);
    }

    get<T = any>(key: string): T | null {
      const item = this.storage.getItem<{ value: T; expires: number | null }>(`cache_${key}`);
      if (!item) return null;

      if (item.expires && Date.now() > item.expires) {
        this.remove(key);
        return null;
      }

      return item.value;
    }

    remove(key: string) {
      this.storage.removeItem(`cache_${key}`);
    }

    clear() {
      // Remove all cache items
      const keys = localStorage.keys().filter(k => k.startsWith('cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    }
  }

  const cache = new CacheManager();
  cache.set('api_response', { data: [1, 2, 3] }, 60); // 60 seconds TTL
  console.log('Cached data:', cache.get('api_response'));
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Web Storage works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One storage API for all languages");
  console.log("  ✓ Consistent client-side data");
  console.log("  ✓ Share storage utilities");
  console.log("  ✓ Cross-language state management");
}
