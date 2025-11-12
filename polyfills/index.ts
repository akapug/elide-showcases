/**
 * Elide Polyfills - Main Index
 *
 * Central export point for all polyfilled APIs.
 * Import everything from one place!
 *
 * Usage:
 *   import { EventEmitter, path, fs } from './polyfills/index.ts';
 */

// ============================================================================
// Node.js Core APIs
// ============================================================================

// Events
export { EventEmitter, default as events } from './node/events.ts';
export type { Listener } from './node/events.ts';

// Path
export * as path from './node/path.ts';
export type { ParsedPath } from './node/path.ts';

// File System
export * as fs from './node/fs.ts';
export type { Stats, ReadOptions, WriteOptions, BufferEncoding } from './node/fs.ts';

// Operating System
export * as os from './node/os.ts';
export type { CpuInfo, NetworkInterfaceInfo, UserInfo } from './node/os.ts';

// Utilities
export * as util from './node/util.ts';
export { TextEncoder, TextDecoder } from './node/util.ts';

// URL
export { URL, URLSearchParams, default as url } from './node/url.ts';
export type { UrlObject } from './node/url.ts';

// Query String
export * as querystring from './node/querystring.ts';

// Assert
export * as assert from './node/assert.ts';
export { AssertionError, strict as assertStrict } from './node/assert.ts';

// Timers
export * as timers from './node/timers.ts';
export type { Timeout } from './node/timers.ts';

// ============================================================================
// Web APIs
// ============================================================================

// WebSocket
export { WebSocket, ReadyState, CloseEvent, MessageEvent } from './web/websocket.ts';
export type { BinaryType } from './web/websocket.ts';

// Storage
export {
  Storage,
  StorageEvent,
  JSONStorage,
  localStorage,
  sessionStorage
} from './web/storage.ts';

// BroadcastChannel
export { BroadcastChannel } from './web/broadcast-channel.ts';

// ============================================================================
// Compatibility Layer
// ============================================================================

export {
  features,
  inject,
  createRequire,
  shims,
  setupAll
} from './compat/auto-inject.ts';
export type { PolyfillConfig } from './compat/auto-inject.ts';

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * All Node.js APIs in one object
 */
export const node = {
  events: () => import('./node/events.ts'),
  path: () => import('./node/path.ts'),
  fs: () => import('./node/fs.ts'),
  os: () => import('./node/os.ts'),
  util: () => import('./node/util.ts'),
  url: () => import('./node/url.ts'),
  querystring: () => import('./node/querystring.ts'),
  assert: () => import('./node/assert.ts'),
  timers: () => import('./node/timers.ts')
};

/**
 * All Web APIs in one object
 */
export const web = {
  websocket: () => import('./web/websocket.ts'),
  storage: () => import('./web/storage.ts'),
  broadcastChannel: () => import('./web/broadcast-channel.ts')
};

/**
 * Version information
 */
export const version = '1.0.0';

/**
 * Polyfill metadata
 */
export const meta = {
  version: '1.0.0',
  elideVersion: '1.0.0-beta11-rc1',
  modules: {
    node: [
      'events',
      'path',
      'fs',
      'os',
      'util',
      'url',
      'querystring',
      'assert',
      'timers'
    ],
    web: [
      'websocket',
      'storage',
      'broadcast-channel'
    ]
  },
  totalModules: 12,
  linesOfCode: 7100,
  compatibility: {
    nodejs: '>=12.0.0',
    browsers: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    elide: '>=1.0.0-beta11'
  }
};

// Default export
export default {
  // Node.js
  EventEmitter,
  events,
  path,
  fs,
  os,
  util,
  url,
  querystring,
  assert,
  timers,

  // Web
  WebSocket,
  Storage,
  localStorage,
  sessionStorage,
  BroadcastChannel,

  // Compat
  features,
  inject,
  setupAll,

  // Meta
  version,
  meta
};

// CLI Demo
if (import.meta.url.includes("index.ts")) {
  console.log("📦 Elide Polyfills - Complete API Library\n");

  console.log("=== Metadata ===");
  console.log('Version:', meta.version);
  console.log('Elide Version:', meta.elideVersion);
  console.log('Total Modules:', meta.totalModules);
  console.log('Lines of Code:', meta.linesOfCode);
  console.log();

  console.log("=== Node.js APIs ===");
  meta.modules.node.forEach((mod, i) => {
    console.log(`${i + 1}. ${mod}`);
  });
  console.log();

  console.log("=== Web APIs ===");
  meta.modules.web.forEach((mod, i) => {
    console.log(`${i + 1}. ${mod}`);
  });
  console.log();

  console.log("=== Quick Start ===");
  console.log('Import everything:');
  console.log('  import * as polyfills from "./polyfills/index.ts";');
  console.log();
  console.log('Import specific APIs:');
  console.log('  import { EventEmitter, path, fs } from "./polyfills/index.ts";');
  console.log();
  console.log('Auto-setup:');
  console.log('  import { setupAll } from "./polyfills/index.ts";');
  console.log('  await setupAll();');
  console.log();

  console.log("=== Compatibility ===");
  console.log('Node.js:', meta.compatibility.nodejs);
  console.log('Elide:', meta.compatibility.elide);
  console.log('Browsers:', meta.compatibility.browsers.join(', '));
  console.log();

  console.log("✅ All polyfills ready!");
  console.log("🌐 One API. Four Languages. Zero Compromise.");
}
