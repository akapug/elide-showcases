/**
 * Elide Native Compilation Tools
 *
 * Production-ready tools for compiling Elide applications to native binaries.
 *
 * @packageDocumentation
 */

// Desktop framework
export * from './desktop';

// Mobile framework
export * from './mobile';

// CLI builder
export * from './cli';

// Native compiler
export * from './compiler';

// Runtime bridge
export * from './runtime';

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Framework capabilities
 */
export const CAPABILITIES = {
  desktop: {
    platforms: ['windows', 'macos', 'linux'],
    features: [
      'window-management',
      'native-menus',
      'system-tray',
      'dialogs',
      'file-system',
      'ipc',
    ],
  },
  mobile: {
    platforms: ['ios', 'android'],
    features: [
      'native-ui',
      'sensors',
      'camera',
      'location',
      'notifications',
      'storage',
      'biometrics',
    ],
  },
  cli: {
    platforms: ['windows', 'macos', 'linux'],
    features: [
      'argument-parsing',
      'progress-bars',
      'spinners',
      'colors',
      'tables',
      'prompts',
      'config-management',
    ],
  },
  compiler: {
    features: [
      'aot-compilation',
      'tree-shaking',
      'optimization',
      'bundling',
      'cross-compilation',
      'bundle-analysis',
    ],
  },
};

/**
 * Get platform information
 */
export function getPlatformInfo() {
  return {
    platform: process.platform,
    architecture: process.arch,
    nodeVersion: process.version,
  };
}
