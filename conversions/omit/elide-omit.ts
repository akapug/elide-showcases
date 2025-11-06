/**
 * Omit - Object Property Filtering
 *
 * Create a new object by omitting specified properties.
 * Essential for data sanitization, API responses, and security.
 *
 * Features:
 * - Omit multiple properties at once
 * - Deep omit for nested properties
 * - Does not mutate input object
 * - Type-safe operations
 * - Array support
 *
 * Use cases:
 * - Remove sensitive data before sending to client
 * - API response sanitization
 * - Form data filtering
 * - Database object cleaning
 * - Security: remove passwords, tokens, keys
 *
 * Package has ~15M+ downloads/week on npm!
 */

/**
 * Omit specified keys from an object (shallow)
 */
export default function omit<T extends object, K extends keyof T>(
  obj: T,
  ...keys: (K | string)[]
): Omit<T, K> {
  const result = { ...obj };

  for (const key of keys) {
    delete (result as any)[key];
  }

  return result as Omit<T, K>;
}

/**
 * Deep omit - omit properties from nested objects
 * Supports dot notation: 'user.profile.email'
 */
export function omitDeep<T extends object>(
  obj: T,
  ...paths: string[]
): Partial<T> {
  const result = deepClone(obj);

  for (const path of paths) {
    deletePath(result, path);
  }

  return result;
}

/**
 * Omit properties by predicate function
 */
export function omitBy<T extends object>(
  obj: T,
  predicate: (value: any, key: string) => boolean
): Partial<T> {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!predicate(value, key)) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Omit null and undefined properties
 */
export function omitNullish<T extends object>(obj: T): Partial<T> {
  return omitBy(obj, (value) => value == null);
}

/**
 * Omit falsy properties (null, undefined, false, 0, "", NaN)
 */
export function omitFalsy<T extends object>(obj: T): Partial<T> {
  return omitBy(obj, (value) => !value);
}

/**
 * Omit empty values (null, undefined, "", [], {})
 */
export function omitEmpty<T extends object>(obj: T): Partial<T> {
  return omitBy(obj, (value) => {
    if (value == null) return true;
    if (typeof value === 'string' && value === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  });
}

/**
 * Helper: Deep clone an object
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }

  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Helper: Delete a property by path (dot notation)
 */
function deletePath(obj: any, path: string): void {
  const parts = path.split('.');
  const last = parts.pop()!;

  let current = obj;
  for (const part of parts) {
    if (current[part] == null || typeof current[part] !== 'object') {
      return; // Path doesn't exist
    }
    current = current[part];
  }

  delete current[last];
}

// CLI Demo
if (import.meta.url.includes("elide-omit.ts")) {
  console.log("🔒 Omit - Object Property Filtering for Elide\n");

  console.log("=== Example 1: Basic Omit ===");
  const user = { id: 1, name: "Alice", password: "secret123", email: "alice@example.com" };
  const sanitized = omit(user, 'password');
  console.log("Original:", user);
  console.log("Sanitized:", sanitized);
  console.log();

  console.log("=== Example 2: Omit Multiple Keys ===");
  const data = { a: 1, b: 2, c: 3, d: 4, e: 5 };
  const filtered = omit(data, 'b', 'd');
  console.log("Original:", data);
  console.log("Filtered:", filtered);
  console.log();

  console.log("=== Example 3: API Response Sanitization ===");
  const apiResponse = {
    id: 123,
    username: "alice",
    email: "alice@example.com",
    password: "hashed_password",
    salt: "random_salt",
    apiKey: "secret_key",
    createdAt: "2024-01-01",
    role: "user"
  };

  const publicData = omit(apiResponse, 'password', 'salt', 'apiKey');
  console.log("API response (sanitized for client):");
  console.log(JSON.stringify(publicData, null, 2));
  console.log();

  console.log("=== Example 4: Deep Omit ===");
  const profile = {
    name: "Alice",
    user: {
      id: 1,
      profile: {
        email: "alice@example.com",
        phone: "123-456-7890"
      }
    }
  };

  const withoutEmail = omitDeep(profile, 'user.profile.email');
  console.log("Deep omit 'user.profile.email':");
  console.log(JSON.stringify(withoutEmail, null, 2));
  console.log();

  console.log("=== Example 5: Omit By Predicate ===");
  const scores = { math: 85, science: 92, english: 78, history: 88 };
  const highScores = omitBy(scores, (value) => value < 85);
  console.log("All scores:", scores);
  console.log("High scores only (>=85):", highScores);
  console.log();

  console.log("=== Example 6: Omit Nullish Values ===");
  const formData = {
    name: "Alice",
    age: 25,
    city: null,
    country: undefined,
    email: "alice@example.com"
  };

  const cleaned = omitNullish(formData);
  console.log("Form data:", formData);
  console.log("Cleaned (no null/undefined):", cleaned);
  console.log();

  console.log("=== Example 7: Omit Falsy Values ===");
  const config = {
    enabled: true,
    count: 0,
    name: "",
    debug: false,
    timeout: 3000,
    retries: null
  };

  const truthy = omitFalsy(config);
  console.log("Config:", config);
  console.log("Truthy values only:", truthy);
  console.log();

  console.log("=== Example 8: Omit Empty Values ===");
  const userData = {
    name: "Alice",
    bio: "",
    tags: [],
    metadata: {},
    email: "alice@example.com",
    settings: { theme: "dark" }
  };

  const nonEmpty = omitEmpty(userData);
  console.log("User data:", userData);
  console.log("Non-empty values:", nonEmpty);
  console.log();

  console.log("=== Example 9: Database Query Sanitization ===");
  const queryParams = {
    page: 1,
    limit: 10,
    _csrf: "token",
    _method: "GET",
    sort: "created_at",
    filter: "active"
  };

  const cleanQuery = omit(queryParams, '_csrf', '_method');
  console.log("Query params:", queryParams);
  console.log("Clean query (no internal fields):", cleanQuery);
  console.log();

  console.log("=== Example 10: Security: Remove Sensitive Data ===");
  const userRecord = {
    id: 456,
    username: "bob",
    email: "bob@example.com",
    firstName: "Bob",
    lastName: "Smith",
    password: "hashed_pwd",
    passwordResetToken: "reset_token",
    apiSecret: "secret_key",
    role: "admin",
    lastLogin: "2024-01-01"
  };

  const safeRecord = omit(userRecord, 'password', 'passwordResetToken', 'apiSecret');
  console.log("User record (safe for logging):");
  console.log(JSON.stringify(safeRecord, null, 2));
  console.log();

  console.log("=== Example 11: Form Submission Cleanup ===");
  const formSubmission = {
    name: "Product Name",
    price: 99.99,
    description: "Great product",
    _formId: "form_123",
    _timestamp: Date.now(),
    _honeypot: "",
    category: "electronics"
  };

  const cleanSubmission = omitBy(formSubmission, (_, key) => key.startsWith('_'));
  console.log("Form submission:", formSubmission);
  console.log("Clean submission (no _ fields):", cleanSubmission);
  console.log();

  console.log("=== Example 12: No Mutation ===");
  const original = { a: 1, b: 2, c: 3 };
  const modified = omit(original, 'b');
  console.log("Original:", original);
  console.log("Modified:", modified);
  console.log("Original unchanged:", 'b' in original);
  console.log();

  console.log("=== Example 13: Multiple Deep Paths ===");
  const complex = {
    user: {
      profile: { email: "user@example.com", phone: "123" },
      settings: { theme: "dark", apiKey: "secret" }
    },
    admin: {
      token: "admin_token"
    }
  };

  const sanitizedComplex = omitDeep(complex, 'user.profile.email', 'user.settings.apiKey', 'admin.token');
  console.log("Complex object (sanitized):");
  console.log(JSON.stringify(sanitizedComplex, null, 2));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- API response sanitization");
  console.log("- Remove sensitive data (passwords, tokens)");
  console.log("- Form data filtering");
  console.log("- Database query cleanup");
  console.log("- Logging-safe objects");
  console.log("- DTO creation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~15M+ downloads/week on npm");
  console.log();

  console.log("💡 Tips:");
  console.log("- Use omit() for simple key removal");
  console.log("- Use omitDeep() for nested properties");
  console.log("- Use omitBy() for conditional filtering");
  console.log("- Use omitNullish() to clean optional fields");
  console.log("- Always omit sensitive data before logging/sending");
}
