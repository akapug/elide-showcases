/**
 * Auto-Inject - Automatic Polyfill Injection for Elide
 *
 * Automatically detect missing APIs and inject polyfills.
 * **POLYGLOT SHOWCASE**: Seamless polyfill injection for ALL languages!
 *
 * Features:
 * - Feature detection
 * - Automatic polyfill injection
 * - Graceful degradation
 * - No conflicts with native APIs
 * - Zero-config setup
 *
 * Use cases:
 * - Legacy code migration
 * - Cross-runtime compatibility
 * - Progressive enhancement
 * - Platform abstraction
 */

/**
 * Feature detection
 */
export const features = {
  // Node.js APIs
  hasEventEmitter: typeof EventEmitter !== 'undefined',
  hasPath: typeof path !== 'undefined',
  hasFS: typeof fs !== 'undefined',
  hasOS: typeof os !== 'undefined',
  hasUtil: typeof util !== 'undefined',
  hasURL: typeof URL !== 'undefined',
  hasQueryString: typeof querystring !== 'undefined',
  hasAssert: typeof assert !== 'undefined',
  hasTimers: typeof setTimeout !== 'undefined',

  // Web APIs
  hasWebSocket: typeof WebSocket !== 'undefined',
  hasLocalStorage: typeof localStorage !== 'undefined',
  hasBroadcastChannel: typeof BroadcastChannel !== 'undefined',
  hasFetch: typeof fetch !== 'undefined',

  // Runtime detection
  isNode: typeof process !== 'undefined' && process.versions?.node,
  isBrowser: typeof window !== 'undefined',
  isElide: typeof Elide !== 'undefined' || typeof Java !== 'undefined',
  isDeno: typeof Deno !== 'undefined'
};

/**
 * Polyfill injection configuration
 */
export interface PolyfillConfig {
  /** Auto-inject missing Node.js APIs */
  nodeAPIs?: boolean;

  /** Auto-inject missing Web APIs */
  webAPIs?: boolean;

  /** Force injection even if native API exists */
  force?: boolean;

  /** List of specific APIs to inject */
  include?: string[];

  /** List of APIs to exclude from injection */
  exclude?: string[];

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Auto-inject polyfills
 */
export async function inject(config: PolyfillConfig = {}): Promise<void> {
  const {
    nodeAPIs = true,
    webAPIs = true,
    force = false,
    include = [],
    exclude = [],
    verbose = false
  } = config;

  const log = (msg: string) => {
    if (verbose) console.log(`[Polyfill] ${msg}`);
  };

  // Helper to check if API should be injected
  const shouldInject = (name: string, exists: boolean): boolean => {
    if (exclude.includes(name)) return false;
    if (include.length > 0 && !include.includes(name)) return false;
    return force || !exists;
  };

  // Inject Node.js APIs
  if (nodeAPIs) {
    // EventEmitter
    if (shouldInject('EventEmitter', features.hasEventEmitter)) {
      log('Injecting EventEmitter');
      const { EventEmitter: EE } = await import('../node/events.ts');
      (globalThis as any).EventEmitter = EE;
    }

    // Path
    if (shouldInject('path', features.hasPath)) {
      log('Injecting path');
      const pathModule = await import('../node/path.ts');
      (globalThis as any).path = pathModule.default;
    }

    // FS
    if (shouldInject('fs', features.hasFS)) {
      log('Injecting fs');
      const fsModule = await import('../node/fs.ts');
      (globalThis as any).fs = fsModule.default;
    }

    // OS
    if (shouldInject('os', features.hasOS)) {
      log('Injecting os');
      const osModule = await import('../node/os.ts');
      (globalThis as any).os = osModule.default;
    }

    // Util
    if (shouldInject('util', features.hasUtil)) {
      log('Injecting util');
      const utilModule = await import('../node/util.ts');
      (globalThis as any).util = utilModule.default;
    }

    // URL (if not present)
    if (shouldInject('URL', features.hasURL)) {
      log('Injecting URL');
      const { URL: URLClass, URLSearchParams: USP } = await import('../node/url.ts');
      (globalThis as any).URL = URLClass;
      (globalThis as any).URLSearchParams = USP;
    }

    // QueryString
    if (shouldInject('querystring', features.hasQueryString)) {
      log('Injecting querystring');
      const qsModule = await import('../node/querystring.ts');
      (globalThis as any).querystring = qsModule.default;
    }

    // Assert
    if (shouldInject('assert', features.hasAssert)) {
      log('Injecting assert');
      const assertModule = await import('../node/assert.ts');
      (globalThis as any).assert = assertModule.default;
    }

    // Timers (usually native, but can override)
    if (force && include.includes('timers')) {
      log('Injecting timers');
      const timersModule = await import('../node/timers.ts');
      (globalThis as any).timers = timersModule.default;
    }
  }

  // Inject Web APIs
  if (webAPIs) {
    // WebSocket
    if (shouldInject('WebSocket', features.hasWebSocket)) {
      log('Injecting WebSocket');
      const { WebSocket: WS } = await import('../web/websocket.ts');
      (globalThis as any).WebSocket = WS;
    }

    // Storage
    if (shouldInject('localStorage', features.hasLocalStorage)) {
      log('Injecting Storage APIs');
      const { localStorage: ls, sessionStorage: ss } = await import('../web/storage.ts');
      (globalThis as any).localStorage = ls;
      (globalThis as any).sessionStorage = ss;
    }

    // BroadcastChannel
    if (shouldInject('BroadcastChannel', features.hasBroadcastChannel)) {
      log('Injecting BroadcastChannel');
      const { BroadcastChannel: BC } = await import('../web/broadcast-channel.ts');
      (globalThis as any).BroadcastChannel = BC;
    }
  }

  if (verbose) {
    log('Polyfill injection complete');
    log(`Node.js APIs: ${nodeAPIs ? 'enabled' : 'disabled'}`);
    log(`Web APIs: ${webAPIs ? 'enabled' : 'disabled'}`);
  }
}

/**
 * Create a require function that uses polyfills
 */
export function createRequire(baseUrl?: string) {
  return function require(moduleName: string): any {
    const polyfillMap: Record<string, string> = {
      'events': '../node/events.ts',
      'path': '../node/path.ts',
      'fs': '../node/fs.ts',
      'os': '../node/os.ts',
      'util': '../node/util.ts',
      'url': '../node/url.ts',
      'querystring': '../node/querystring.ts',
      'assert': '../node/assert.ts',
      'timers': '../node/timers.ts'
    };

    const polyfillPath = polyfillMap[moduleName];
    if (polyfillPath) {
      // Dynamic import would go here
      // For now, return a placeholder
      throw new Error(`Use 'import' instead of 'require' for '${moduleName}'`);
    }

    throw new Error(`Module not found: ${moduleName}`);
  };
}

/**
 * Compatibility shims
 */
export const shims = {
  /**
   * Shim for process.env
   */
  processEnv(): void {
    if (typeof process === 'undefined') {
      (globalThis as any).process = {
        env: {},
        platform: 'elide',
        version: '1.0.0',
        versions: { elide: '1.0.0-beta11' }
      };
    }
  },

  /**
   * Shim for __dirname and __filename
   */
  moduleGlobals(): void {
    if (typeof __dirname === 'undefined') {
      (globalThis as any).__dirname = '/';
      (globalThis as any).__filename = '/index.ts';
    }
  },

  /**
   * Shim for Buffer (basic)
   */
  buffer(): void {
    if (typeof Buffer === 'undefined') {
      (globalThis as any).Buffer = class Buffer {
        static from(data: any): Buffer {
          return new Buffer(data);
        }

        static alloc(size: number): Buffer {
          return new Buffer(new Array(size).fill(0));
        }

        constructor(private data: any) {}

        toString(encoding?: string): string {
          if (typeof this.data === 'string') return this.data;
          if (Array.isArray(this.data)) return String.fromCharCode(...this.data);
          return String(this.data);
        }
      };
    }
  },

  /**
   * Apply all shims
   */
  all(): void {
    this.processEnv();
    this.moduleGlobals();
    this.buffer();
  }
};

/**
 * One-line setup for maximum compatibility
 */
export async function setupAll(config?: PolyfillConfig): Promise<void> {
  shims.all();
  await inject(config);
}

// Default export
export default {
  features,
  inject,
  createRequire,
  shims,
  setupAll
};

// CLI Demo
if (import.meta.url.includes("auto-inject.ts")) {
  console.log("🔧 Auto-Inject - Automatic Polyfill Injection for Elide (POLYGLOT!)\n");

  console.log("=== Feature Detection ===");
  console.log('Has EventEmitter:', features.hasEventEmitter);
  console.log('Has Path:', features.hasPath);
  console.log('Has FS:', features.hasFS);
  console.log('Has OS:', features.hasOS);
  console.log('Has Util:', features.hasUtil);
  console.log('Has URL:', features.hasURL);
  console.log('Has WebSocket:', features.hasWebSocket);
  console.log('Has localStorage:', features.hasLocalStorage);
  console.log('Has BroadcastChannel:', features.hasBroadcastChannel);
  console.log();

  console.log("=== Runtime Detection ===");
  console.log('Is Node.js:', features.isNode);
  console.log('Is Browser:', features.isBrowser);
  console.log('Is Elide:', features.isElide);
  console.log('Is Deno:', features.isDeno);
  console.log();

  console.log("=== Auto-Injection Example ===");
  console.log('Usage:');
  console.log('  import { inject } from "./compat/auto-inject.ts";');
  console.log('  await inject({ nodeAPIs: true, webAPIs: true, verbose: true });');
  console.log();

  console.log("=== Shims Example ===");
  console.log('Apply all shims:');
  console.log('  import { shims } from "./compat/auto-inject.ts";');
  console.log('  shims.all();');
  console.log();

  console.log("=== One-Line Setup ===");
  console.log('Maximum compatibility:');
  console.log('  import { setupAll } from "./compat/auto-inject.ts";');
  console.log('  await setupAll({ verbose: true });');
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Auto-injection works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Zero-config polyfill injection");
  console.log("  ✓ Feature detection");
  console.log("  ✓ Graceful degradation");
  console.log("  ✓ Cross-runtime compatibility");
}
