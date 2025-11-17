/**
 * Parcel Clone - Resolver Pipeline
 */

import { resolve, dirname, extname } from 'path';
import { existsSync } from 'fs';

export class ResolverPipeline {
  async resolve(specifier: string, from: string): Promise<string | null> {
    // Relative resolution
    if (specifier.startsWith('.')) {
      const base = dirname(from);
      const resolved = resolve(base, specifier);

      // Try with extensions
      const extensions = ['', '.js', '.ts', '.tsx', '.jsx', '.json', '.css'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (existsSync(withExt)) {
          return withExt;
        }
      }

      if (existsSync(resolved)) {
        return resolved;
      }
    }

    // Node modules resolution
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
      const nodeModules = resolve(dirname(from), 'node_modules', specifier);
      if (existsSync(nodeModules)) {
        return nodeModules;
      }
    }

    return null;
  }
}
