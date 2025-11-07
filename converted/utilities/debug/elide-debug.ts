/**
 * Debug - Tiny Debugging Utility
 *
 * Lightweight debugging utility modeled after Node.js core's debug technique.
 * **POLYGLOT SHOWCASE**: One debug logger for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/debug (~20M+ downloads/week)
 *
 * Features:
 * - Namespaced debug output
 * - Enable/disable via DEBUG environment variable
 * - Color-coded output
 * - Timestamps
 * - Diff timing between calls
 * - Printf-style formatting
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need debug logging
 * - ONE debug format works everywhere on Elide
 * - Consistent log output across languages
 * - Share debug namespaces across your stack
 *
 * Use cases:
 * - Development debugging
 * - Library instrumentation
 * - Performance timing
 * - Conditional logging
 *
 * Package has ~20M+ downloads/week on npm!
 */

// ANSI colors for different namespaces
const COLORS = [
  '\x1b[31m', // red
  '\x1b[32m', // green
  '\x1b[33m', // yellow
  '\x1b[34m', // blue
  '\x1b[35m', // magenta
  '\x1b[36m', // cyan
];

const RESET = '\x1b[0m';

// Track which namespaces are enabled
const enabledNamespaces = new Set<string>();
const namespaceColors = new Map<string, string>();
let colorIndex = 0;

// Previous call timestamp for diff calculation
const prevTime = new Map<string, number>();

/**
 * Parse DEBUG environment variable to determine enabled namespaces
 */
function parseDebugEnv(): void {
  const debugEnv = (typeof process !== 'undefined' && process.env?.DEBUG) || '';

  if (!debugEnv) return;

  const patterns = debugEnv.split(/[\s,]+/);

  for (const pattern of patterns) {
    if (!pattern) continue;

    // Convert glob pattern to regex
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/:/g, '\\:') + '$'
    );

    enabledNamespaces.add(pattern);
  }
}

/**
 * Check if a namespace is enabled
 */
function isEnabled(namespace: string): boolean {
  // Check exact match first
  for (const pattern of enabledNamespaces) {
    if (pattern === '*') return true;
    if (pattern === namespace) return true;

    // Check wildcard match
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/:/g, '\\:') + '$'
    );
    if (regex.test(namespace)) return true;
  }

  return false;
}

/**
 * Get color for namespace
 */
function getColor(namespace: string): string {
  if (!namespaceColors.has(namespace)) {
    namespaceColors.set(namespace, COLORS[colorIndex % COLORS.length]);
    colorIndex++;
  }
  return namespaceColors.get(namespace)!;
}

/**
 * Format time diff
 */
function formatDiff(ms: number): string {
  if (ms >= 1000) {
    return `+${(ms / 1000).toFixed(1)}s`;
  }
  return `+${ms.toFixed(0)}ms`;
}

/**
 * Printf-style formatting
 */
function formatArgs(fmt: string, ...args: any[]): string {
  let i = 0;
  return fmt.replace(/%([sdifoO])/g, (match, type) => {
    if (i >= args.length) return match;

    const arg = args[i++];

    switch (type) {
      case 's': return String(arg);
      case 'd':
      case 'i': return String(parseInt(arg, 10));
      case 'f': return String(parseFloat(arg));
      case 'o':
      case 'O': return JSON.stringify(arg);
      default: return match;
    }
  });
}

/**
 * Debug logger interface
 */
export interface Debugger {
  (...args: any[]): void;
  enabled: boolean;
  namespace: string;
  destroy(): void;
  extend(namespace: string): Debugger;
}

/**
 * Create a debug logger for a namespace
 */
export default function debug(namespace: string): Debugger {
  // Parse DEBUG env on first use
  if (enabledNamespaces.size === 0) {
    parseDebugEnv();
  }

  const enabled = isEnabled(namespace);
  const color = getColor(namespace);

  function debugFn(...args: any[]): void {
    if (!debugFn.enabled) return;

    const now = Date.now();
    const lastTime = prevTime.get(namespace) || now;
    const diff = now - lastTime;
    prevTime.set(namespace, now);

    // Format message
    let msg: string;
    if (typeof args[0] === 'string') {
      msg = formatArgs(args[0], ...args.slice(1));
    } else {
      msg = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
    }

    // Output with color and diff
    const prefix = `${color}${namespace}${RESET}`;
    const diffStr = diff > 0 ? ` ${formatDiff(diff)}` : '';
    console.log(`${prefix} ${msg}${diffStr}`);
  }

  debugFn.enabled = enabled;
  debugFn.namespace = namespace;

  debugFn.destroy = function() {
    // Cleanup
    prevTime.delete(namespace);
  };

  debugFn.extend = function(suffix: string): Debugger {
    return debug(`${namespace}:${suffix}`);
  };

  return debugFn as Debugger;
}

/**
 * Enable debug output for namespaces
 */
export function enable(namespaces: string): void {
  enabledNamespaces.clear();
  const patterns = namespaces.split(/[\s,]+/);
  for (const pattern of patterns) {
    if (pattern) enabledNamespaces.add(pattern);
  }
}

/**
 * Disable all debug output
 */
export function disable(): void {
  enabledNamespaces.clear();
}

// Set DEBUG via environment or enable manually
if (typeof process !== 'undefined' && process.env?.DEBUG) {
  parseDebugEnv();
}

// CLI Demo
if (import.meta.url.includes("elide-debug.ts")) {
  console.log("🐛 Debug - Debugging Utility for Elide (POLYGLOT!)\n");

  // Enable all debug output for demo
  enable('*');

  console.log("=== Example 1: Basic Usage ===");
  const log = debug('app');
  log('Starting application');
  log('Loading configuration');
  log('Server ready');
  console.log();

  console.log("=== Example 2: Namespaced Loggers ===");
  const httpLog = debug('app:http');
  const dbLog = debug('app:db');
  const cacheLog = debug('app:cache');

  httpLog('GET /api/users');
  dbLog('Querying users table');
  cacheLog('Cache hit for users');
  httpLog('Response sent: 200 OK');
  console.log();

  console.log("=== Example 3: Printf-Style Formatting ===");
  const debugFmt = debug('format');
  debugFmt('User %s logged in', 'Alice');
  debugFmt('Processing %d items', 42);
  debugFmt('Progress: %f%%', 75.5);
  debugFmt('Config: %O', { port: 3000, host: 'localhost' });
  console.log();

  console.log("=== Example 4: Nested Namespaces ===");
  const api = debug('api');
  const apiAuth = api.extend('auth');
  const apiUsers = api.extend('users');

  api('API server starting');
  apiAuth('Loading auth middleware');
  apiUsers('Registering user routes');
  console.log();

  console.log("=== Example 5: Timing Information ===");
  const timer = debug('timing');
  timer('Operation started');
  // Simulate work
  const start = Date.now();
  while (Date.now() - start < 100);
  timer('Operation completed');
  const start2 = Date.now();
  while (Date.now() - start2 < 250);
  timer('Cleanup done');
  console.log();

  console.log("=== Example 6: Conditional Debugging ===");
  console.log("With DEBUG='app:*' only app namespaces are shown:");
  enable('app:*');

  const app1 = debug('app:server');
  const app2 = debug('app:db');
  const other = debug('other');

  app1('This will show');
  app2('This will also show');
  other('This will NOT show (different namespace)');
  console.log();

  // Re-enable all
  enable('*');

  console.log("=== Example 7: HTTP Request Logging ===");
  const http = debug('http');

  function logRequest(method: string, path: string, status: number, time: number) {
    http('%s %s - %d (%dms)', method, path, status, time);
  }

  logRequest('GET', '/api/users', 200, 45);
  logRequest('POST', '/api/auth/login', 200, 120);
  logRequest('GET', '/api/posts', 404, 12);
  logRequest('DELETE', '/api/users/123', 204, 89);
  console.log();

  console.log("=== Example 8: Database Query Logging ===");
  const db = debug('db:query');

  db('SELECT * FROM users WHERE id = %d', 1);
  db('INSERT INTO posts (title, body) VALUES (%O)',
     { title: 'Hello', body: 'World' });
  db('UPDATE users SET last_login = NOW() WHERE id = %d', 1);
  console.log();

  console.log("=== Example 9: Multi-Layer Application ===");
  const controller = debug('app:controller');
  const service = debug('app:service');
  const repo = debug('app:repository');

  controller('Received request: GET /users/1');
  service('Fetching user by ID: 1');
  repo('Executing query: SELECT * FROM users WHERE id = 1');
  repo('Query returned 1 row');
  service('User found: Alice');
  controller('Sending response: 200 OK');
  console.log();

  console.log("=== Example 10: Error Tracking ===");
  const error = debug('error');
  const warn = debug('warn');
  const info = debug('info');

  info('Application started successfully');
  warn('Using default configuration (no .env found)');
  error('Failed to connect to cache: Connection refused');
  info('Retrying cache connection...');
  console.log();

  console.log("=== Example 11: Performance Profiling ===");
  const perf = debug('perf');

  perf('Starting expensive operation');
  const s1 = Date.now();
  while (Date.now() - s1 < 50);
  perf('Step 1 completed');

  const s2 = Date.now();
  while (Date.now() - s2 < 30);
  perf('Step 2 completed');

  const s3 = Date.now();
  while (Date.now() - s3 < 70);
  perf('Step 3 completed');
  console.log();

  console.log("=== Example 12: POLYGLOT Use Case ===");
  console.log("🌐 Same debug output works in:");
  console.log("  • Node.js/TypeScript applications");
  console.log("  • Python services (via Elide)");
  console.log("  • Ruby workers (via Elide)");
  console.log("  • Java microservices (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One debug format across all services");
  console.log("  ✓ Consistent log namespaces everywhere");
  console.log("  ✓ Share DEBUG environment variable");
  console.log("  ✓ Unified debugging experience");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Development debugging");
  console.log("- Library instrumentation");
  console.log("- Request/response logging");
  console.log("- Performance profiling");
  console.log("- Conditional logging by namespace");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Minimal overhead when disabled");
  console.log("- Color-coded for readability");
  console.log("- ~20M+ downloads/week on npm");
  console.log();

  console.log("💡 Environment Usage:");
  console.log("$ DEBUG=* node app.js          # Enable all");
  console.log("$ DEBUG=app:* node app.js       # Enable app namespace");
  console.log("$ DEBUG=app:http,app:db node app.js  # Specific namespaces");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use same DEBUG namespaces across all languages");
  console.log("- Consistent naming: service:module:function");
  console.log("- Share debug patterns in documentation");
  console.log("- Perfect for microservice debugging!");
}
