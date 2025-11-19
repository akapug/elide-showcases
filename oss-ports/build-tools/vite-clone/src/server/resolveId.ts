/**
 * Vite Clone - Module Resolution
 *
 * Resolves module identifiers to file paths with support for:
 * - Node module resolution
 * - Path aliases
 * - Extensions
 * - Main fields
 */

import { resolve, dirname, extname, join, isAbsolute } from 'path';
import { existsSync, statSync, readFileSync } from 'fs';
import type { ResolvedConfig } from '../types/config';

/**
 * Resolve options
 */
export interface ResolveOptions {
  alias?: Record<string, string>;
  extensions?: string[];
  mainFields?: string[];
  conditions?: string[];
  preserveSymlinks?: boolean;
}

/**
 * Resolved module
 */
export interface ResolvedModule {
  id: string;
  external: boolean;
}

/**
 * Resolve module ID
 */
export async function resolveId(
  id: string,
  importer: string | undefined,
  config: ResolvedConfig,
): Promise<ResolvedModule | null> {
  // External URLs
  if (isExternalUrl(id)) {
    return {
      id,
      external: true,
    };
  }

  // Data URLs
  if (id.startsWith('data:')) {
    return null;
  }

  // Virtual modules
  if (id.startsWith('\0')) {
    return {
      id,
      external: false,
    };
  }

  // Check aliases
  const aliased = resolveAlias(id, config.resolve?.alias || {});
  if (aliased !== id) {
    return await resolveId(aliased, importer, config);
  }

  // Absolute paths
  if (isAbsolute(id)) {
    const resolved = await resolveFile(id, config);
    if (resolved) {
      return {
        id: resolved,
        external: false,
      };
    }
  }

  // Relative imports
  if (id.startsWith('.')) {
    if (!importer) {
      throw new Error(`Cannot resolve relative import "${id}" without importer`);
    }

    const base = dirname(importer);
    const resolved = await resolveFile(resolve(base, id), config);

    if (resolved) {
      return {
        id: resolved,
        external: false,
      };
    }
  }

  // Bare imports (node_modules)
  const nodeResolved = await resolveNodeModule(id, importer || config.root, config);
  if (nodeResolved) {
    return {
      id: nodeResolved,
      external: false,
    };
  }

  // Check if external
  if (isExternal(id, config)) {
    return {
      id,
      external: true,
    };
  }

  return null;
}

/**
 * Resolve alias
 */
function resolveAlias(id: string, alias: Record<string, string>): string {
  for (const [find, replacement] of Object.entries(alias)) {
    if (id === find) {
      return replacement;
    }

    if (id.startsWith(find + '/')) {
      return replacement + id.slice(find.length);
    }
  }

  return id;
}

/**
 * Resolve file with extensions
 */
async function resolveFile(
  path: string,
  config: ResolvedConfig,
): Promise<string | null> {
  // Try exact path
  if (existsSync(path)) {
    const stat = statSync(path);

    if (stat.isFile()) {
      return path;
    }

    if (stat.isDirectory()) {
      // Try index files
      const indexFile = await resolveIndex(path, config);
      if (indexFile) {
        return indexFile;
      }
    }
  }

  // Try with extensions
  const extensions = config.resolve?.extensions || ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'];

  for (const ext of extensions) {
    const withExt = path + ext;
    if (existsSync(withExt)) {
      return withExt;
    }
  }

  return null;
}

/**
 * Resolve index file
 */
async function resolveIndex(
  dir: string,
  config: ResolvedConfig,
): Promise<string | null> {
  const extensions = config.resolve?.extensions || ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'];

  for (const ext of extensions) {
    const indexFile = join(dir, 'index' + ext);
    if (existsSync(indexFile)) {
      return indexFile;
    }
  }

  return null;
}

/**
 * Resolve node module
 */
async function resolveNodeModule(
  id: string,
  from: string,
  config: ResolvedConfig,
): Promise<string | null> {
  let current = from;

  while (true) {
    const nodeModules = join(current, 'node_modules');

    if (existsSync(nodeModules)) {
      const modulePath = join(nodeModules, id);

      // Try exact path
      const resolved = await resolveFile(modulePath, config);
      if (resolved) {
        return resolved;
      }

      // Try package.json
      const pkgResolved = await resolvePackage(modulePath, config);
      if (pkgResolved) {
        return pkgResolved;
      }
    }

    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return null;
}

/**
 * Resolve package.json main field
 */
async function resolvePackage(
  pkgDir: string,
  config: ResolvedConfig,
): Promise<string | null> {
  const pkgPath = join(pkgDir, 'package.json');

  if (!existsSync(pkgPath)) {
    return null;
  }

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const mainFields = config.resolve?.mainFields || ['module', 'jsnext:main', 'jsnext', 'main'];

    for (const field of mainFields) {
      if (pkg[field]) {
        const mainFile = join(pkgDir, pkg[field]);
        const resolved = await resolveFile(mainFile, config);
        if (resolved) {
          return resolved;
        }
      }
    }

    // Try exports field
    if (pkg.exports) {
      const exported = resolveExports(pkg.exports, '.', config);
      if (exported) {
        const exportedFile = join(pkgDir, exported);
        const resolved = await resolveFile(exportedFile, config);
        if (resolved) {
          return resolved;
        }
      }
    }
  } catch (error) {
    // Ignore invalid package.json
  }

  return null;
}

/**
 * Resolve exports field
 */
function resolveExports(
  exports: any,
  subpath: string,
  config: ResolvedConfig,
): string | null {
  if (typeof exports === 'string') {
    return exports;
  }

  if (typeof exports === 'object' && !Array.isArray(exports)) {
    // Conditional exports
    const conditions = config.resolve?.conditions || ['import', 'module', 'browser', 'default'];

    for (const condition of conditions) {
      if (exports[condition]) {
        return resolveExports(exports[condition], subpath, config);
      }
    }

    // Subpath exports
    if (exports[subpath]) {
      return resolveExports(exports[subpath], subpath, config);
    }

    // Wildcard exports
    for (const [key, value] of Object.entries(exports)) {
      if (key.includes('*')) {
        const pattern = key.replace('*', '(.+)');
        const regex = new RegExp(`^${pattern}$`);
        const match = regex.exec(subpath);

        if (match) {
          const replacement = typeof value === 'string' ? value : JSON.stringify(value);
          return replacement.replace('*', match[1]);
        }
      }
    }
  }

  return null;
}

/**
 * Check if external
 */
function isExternal(id: string, config: ResolvedConfig): boolean {
  const external = config.external;

  if (!external) {
    return false;
  }

  if (Array.isArray(external)) {
    return external.some(ext => {
      if (typeof ext === 'string') {
        return id === ext || id.startsWith(ext + '/');
      }
      if (ext instanceof RegExp) {
        return ext.test(id);
      }
      return false;
    });
  }

  if (typeof external === 'function') {
    return external(id);
  }

  return false;
}

/**
 * Check if external URL
 */
function isExternalUrl(url: string): boolean {
  return /^(https?:)?\/\//.test(url);
}
