/**
 * Vite Clone - Hot Module Replacement (HMR)
 *
 * WebSocket-based HMR implementation with support for:
 * - Full page reload
 * - CSS hot update
 * - Module hot update
 * - Custom events
 * - Error overlay
 */

import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import WebSocket from 'ws';
import type { ResolvedConfig } from '../types/config';
import type { ModuleNode } from './moduleGraph';

/**
 * HMR Server interface
 */
export interface HMRServer {
  ws: WebSocket.Server;
  send: (payload: HMRPayload) => void;
  close: () => Promise<void>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
}

/**
 * HMR Payload types
 */
export type HMRPayload =
  | ConnectedPayload
  | UpdatePayload
  | FullReloadPayload
  | CustomPayload
  | ErrorPayload
  | PrunePayload;

export interface ConnectedPayload {
  type: 'connected';
}

export interface UpdatePayload {
  type: 'update';
  updates: Update[];
}

export interface Update {
  type: 'js-update' | 'css-update';
  path: string;
  acceptedPath: string;
  timestamp: number;
}

export interface FullReloadPayload {
  type: 'full-reload';
  path?: string;
}

export interface CustomPayload {
  type: 'custom';
  event: string;
  data?: any;
}

export interface ErrorPayload {
  type: 'error';
  err: {
    message: string;
    stack: string;
    id?: string;
    frame?: string;
    plugin?: string;
    pluginCode?: string;
    loc?: ErrorLocation;
  };
}

export interface ErrorLocation {
  file?: string;
  line: number;
  column: number;
}

export interface PrunePayload {
  type: 'prune';
  paths: string[];
}

/**
 * HMR Options
 */
export interface HMROptions {
  protocol?: string;
  host?: string;
  port?: number;
  clientPort?: number;
  path?: string;
  timeout?: number;
  overlay?: boolean;
  server?: HttpServer | HttpsServer;
}

/**
 * Create HMR server
 */
export function createHMRServer(
  httpServer: HttpServer | HttpsServer,
  config: ResolvedConfig,
): HMRServer {
  const hmrConfig = config.server?.hmr || {};
  const port = hmrConfig.port || 24678;

  // Create WebSocket server
  const wss = new WebSocket.Server({
    noServer: true,
    path: hmrConfig.path || '/__vite_hmr',
  });

  const clients = new Set<WebSocket>();

  // Handle WebSocket upgrade
  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url!, `http://${request.headers.host}`);

    if (pathname === (hmrConfig.path || '/__vite_hmr')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  // Handle new connections
  wss.on('connection', (socket) => {
    clients.add(socket);

    // Send connected message
    socket.send(JSON.stringify({ type: 'connected' } as ConnectedPayload));

    // Handle messages from client
    socket.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        handleClientMessage(message, socket);
      } catch (error) {
        console.error('Failed to parse HMR message:', error);
      }
    });

    // Handle disconnection
    socket.on('close', () => {
      clients.delete(socket);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('HMR WebSocket error:', error);
      clients.delete(socket);
    });
  });

  const server: HMRServer = {
    ws: wss,

    send: (payload: HMRPayload) => {
      const message = JSON.stringify(payload);

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });

      config.logger?.info(`[HMR] ${payload.type}`, payload);
    },

    close: async () => {
      return new Promise((resolve) => {
        clients.forEach((client) => {
          client.close();
        });
        clients.clear();

        wss.close(() => {
          resolve();
        });
      });
    },

    on: (event: string, handler: (...args: any[]) => void) => {
      wss.on(event, handler);
    },

    off: (event: string, handler: (...args: any[]) => void) => {
      wss.off(event, handler);
    },
  };

  return server;
}

/**
 * Handle client messages
 */
function handleClientMessage(message: any, socket: WebSocket) {
  switch (message.type) {
    case 'ping':
      socket.send(JSON.stringify({ type: 'pong' }));
      break;

    case 'custom':
      // Handle custom events
      console.log('Custom HMR event:', message);
      break;

    default:
      console.warn('Unknown HMR message type:', message.type);
  }
}

/**
 * Handle hot update for a module
 */
export async function handleHotUpdate(
  file: string,
  server: any,
): Promise<void> {
  const { moduleGraph, ws, config } = server;

  // Normalize file path
  const normalizedFile = normalizePath(file);

  // Get affected modules
  const modules = moduleGraph.getModulesByFile(normalizedFile);

  if (!modules || modules.size === 0) {
    // No modules affected, do nothing
    return;
  }

  const timestamp = Date.now();
  const updates: Update[] = [];

  // Check each affected module
  for (const mod of modules) {
    // Invalidate module
    moduleGraph.invalidateModule(mod);

    // Determine update type
    const updateType = getUpdateType(mod);

    if (updateType === 'full-reload') {
      // Full page reload required
      ws.send({
        type: 'full-reload',
        path: mod.url,
      } as FullReloadPayload);
      return;
    }

    if (updateType === 'css-update') {
      updates.push({
        type: 'css-update',
        path: mod.url,
        acceptedPath: mod.url,
        timestamp,
      });
    } else if (updateType === 'js-update') {
      // Find all modules that accept this update
      const boundaries = findHMRBoundaries(mod, moduleGraph);

      if (boundaries.length === 0) {
        // No boundaries found, full reload
        ws.send({
          type: 'full-reload',
          path: mod.url,
        } as FullReloadPayload);
        return;
      }

      for (const boundary of boundaries) {
        updates.push({
          type: 'js-update',
          path: boundary.url,
          acceptedPath: mod.url,
          timestamp,
        });
      }
    }
  }

  if (updates.length > 0) {
    ws.send({
      type: 'update',
      updates,
    } as UpdatePayload);
  }

  // Run handleHotUpdate plugin hooks
  let filteredModules = Array.from(modules);

  for (const plugin of config.plugins) {
    if (plugin.handleHotUpdate) {
      const result = await plugin.handleHotUpdate({
        file: normalizedFile,
        modules: filteredModules,
        server,
        timestamp,
      });

      if (result) {
        filteredModules = result;
      }
    }
  }
}

/**
 * Get update type for a module
 */
function getUpdateType(mod: ModuleNode): 'css-update' | 'js-update' | 'full-reload' {
  // CSS files can be hot updated
  if (mod.url?.endsWith('.css') || mod.url?.includes('.css?')) {
    return 'css-update';
  }

  // Check if module accepts hot updates
  if (mod.isSelfAccepting) {
    return 'js-update';
  }

  // Check if any importer accepts this module
  for (const importer of mod.importers) {
    if (importer.acceptedHmrDeps?.has(mod)) {
      return 'js-update';
    }
  }

  // Default to full reload if no HMR boundary found
  return 'full-reload';
}

/**
 * Find HMR boundaries for a module
 */
function findHMRBoundaries(
  mod: ModuleNode,
  moduleGraph: any,
  boundaries: Set<ModuleNode> = new Set(),
  visited: Set<ModuleNode> = new Set(),
): ModuleNode[] {
  if (visited.has(mod)) {
    return Array.from(boundaries);
  }

  visited.add(mod);

  // If module accepts itself, it's a boundary
  if (mod.isSelfAccepting) {
    boundaries.add(mod);
    return Array.from(boundaries);
  }

  // Check importers
  for (const importer of mod.importers) {
    // If importer accepts this module, it's a boundary
    if (importer.acceptedHmrDeps?.has(mod)) {
      boundaries.add(importer);
    } else {
      // Continue searching up the import chain
      findHMRBoundaries(importer, moduleGraph, boundaries, visited);
    }
  }

  return Array.from(boundaries);
}

/**
 * Create error payload from error
 */
export function createErrorPayload(error: Error & { loc?: any; frame?: string; plugin?: string }): ErrorPayload {
  return {
    type: 'error',
    err: {
      message: error.message,
      stack: error.stack || '',
      loc: error.loc,
      frame: error.frame,
      plugin: error.plugin,
    },
  };
}

/**
 * Normalize path
 */
function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * HMR Client code (injected into browser)
 */
export const HMR_CLIENT_CODE = `
// HMR Client for Vite Clone
console.log('[vite] connecting...');

const socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
const socketHost = location.hostname + ':' + (import.meta.env.HMR_PORT || 24678);
const socket = new WebSocket(\`\${socketProtocol}://\${socketHost}/__vite_hmr\`, 'vite-hmr');

// Map of module URL to callbacks
const hotModulesMap = new Map();
const pruneMap = new Map();
const dataMap = new Map();
const customListenersMap = new Map();

// Update queue to batch updates
let updateQueue = [];
let updateTimer = null;

socket.addEventListener('message', async ({ data }) => {
  const payload = JSON.parse(data);

  switch (payload.type) {
    case 'connected':
      console.log('[vite] connected.');
      sendMessage({ type: 'ping' });
      break;

    case 'update':
      payload.updates.forEach((update) => {
        if (update.type === 'js-update') {
          queueUpdate(fetchUpdate(update));
        } else if (update.type === 'css-update') {
          updateStyle(update);
        }
      });
      break;

    case 'full-reload':
      console.log('[vite] page reload ', payload.path);
      location.reload();
      break;

    case 'prune':
      payload.paths.forEach((path) => {
        const fn = pruneMap.get(path);
        if (fn) fn(dataMap.get(path));
      });
      break;

    case 'error':
      console.error('[vite] error:', payload.err);
      showErrorOverlay(payload.err);
      break;

    case 'custom':
      const cbs = customListenersMap.get(payload.event);
      if (cbs) {
        cbs.forEach((cb) => cb(payload.data));
      }
      break;
  }
});

socket.addEventListener('close', () => {
  console.log('[vite] server connection lost. Polling for restart...');
  waitForReconnect();
});

function sendMessage(message) {
  socket.send(JSON.stringify(message));
}

async function fetchUpdate({ path, acceptedPath, timestamp }) {
  const mod = hotModulesMap.get(path);
  if (!mod) return;

  const moduleMap = new Map();
  const isSelfUpdate = path === acceptedPath;

  const fetchedModule = await import(
    \`\${acceptedPath}?t=\${timestamp}\${
      isSelfUpdate ? '' : \`&import=true\`
    }\`
  );

  return () => {
    for (const { deps, fn } of mod.callbacks) {
      if (deps.includes(acceptedPath)) {
        fn(deps.map((dep) => (dep === acceptedPath ? fetchedModule : undefined)));
      }
    }
    console.log(\`[vite] hot updated: \${path}\`);
  };
}

function queueUpdate(p) {
  updateQueue.push(p);
  if (!updateTimer) {
    updateTimer = setTimeout(() => {
      updateTimer = null;
      const updates = updateQueue;
      updateQueue = [];
      Promise.all(updates).then((fns) => {
        fns.forEach((fn) => fn && fn());
      });
    }, 50);
  }
}

async function updateStyle({ path, timestamp }) {
  const searchUrl = cleanUrl(path);
  const el = document.querySelector(\`link[href*="\${searchUrl}"]\`);

  if (el) {
    const newPath = \`\${path}\${
      path.includes('?') ? '&' : '?'
    }t=\${timestamp}\`;

    el.href = new URL(newPath, el.href).href;
    console.log(\`[vite] css hot updated: \${path}\`);
  }
}

function cleanUrl(url) {
  return url.replace(/[?#].*$/, '');
}

function showErrorOverlay(err) {
  const ErrorOverlay = customElements.get('vite-error-overlay');
  if (!ErrorOverlay) return;

  const overlay = new ErrorOverlay(err);
  document.body.appendChild(overlay);
}

function waitForReconnect() {
  setInterval(() => {
    fetch('/')
      .then(() => {
        location.reload();
      })
      .catch(() => {
        // Server still not available
      });
  }, 1000);
}

// Export HMR API
export const hot = {
  accept(deps, callback) {
    const mod = hotModulesMap.get(import.meta.url) || {
      url: import.meta.url,
      callbacks: [],
    };

    mod.callbacks.push({
      deps: Array.isArray(deps) ? deps : [deps],
      fn: callback || (() => location.reload()),
    });

    hotModulesMap.set(import.meta.url, mod);
  },

  acceptDeps(deps, callback) {
    const mod = hotModulesMap.get(import.meta.url) || {
      url: import.meta.url,
      callbacks: [],
    };

    mod.callbacks.push({
      deps: Array.isArray(deps) ? deps : [deps],
      fn: callback,
    });

    hotModulesMap.set(import.meta.url, mod);
  },

  dispose(cb) {
    pruneMap.set(import.meta.url, cb);
  },

  prune(cb) {
    pruneMap.set(import.meta.url, cb);
  },

  data: dataMap.get(import.meta.url) || {},

  decline() {
    // Not implemented
  },

  invalidate() {
    location.reload();
  },

  on(event, cb) {
    const listeners = customListenersMap.get(event) || [];
    listeners.push(cb);
    customListenersMap.set(event, listeners);
  },

  send(event, data) {
    sendMessage({ type: 'custom', event, data });
  },
};

// Make hot available globally for import.meta.hot
if (import.meta) {
  import.meta.hot = hot;
}
`;
