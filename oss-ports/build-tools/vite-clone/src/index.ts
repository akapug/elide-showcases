/**
 * Vite Clone - Main Entry Point
 *
 * Exports all public APIs.
 */

// Core APIs
export { defineConfig, loadConfigFromFile, resolveConfig, mergeConfig } from './core/config';
export { build } from './core/build';

// Server APIs
export { createServer } from './server/index';
export type { ViteDevServer, TransformOptions, TransformResult } from './server/index';

// HMR
export { createHMRServer } from './server/hmr';
export type { HMRServer, HMRPayload, Update, HMROptions } from './server/hmr';

// Module Graph
export { ModuleNode, ModuleGraph, createModuleGraph } from './server/moduleGraph';
export type { TransformResult as ModuleTransformResult } from './server/moduleGraph';

// Plugin Container
export { createPluginContainer } from './server/pluginContainer';
export type { PluginContainer } from './server/pluginContainer';

// Transform
export { transformRequest } from './server/transformRequest';

// Types
export type * from './types/config';
export type * from './types/plugin';

// Plugins
export { default as react } from './plugins/react';
export type { ReactPluginOptions } from './plugins/react';

// Preview
export async function preview(inlineConfig: any = {}) {
  const { createPreviewServer } = await import('./server/preview');
  return createPreviewServer(inlineConfig);
}

// Re-export for convenience
export { normalizePath, cleanUrl, isExternalUrl } from './core/config';
