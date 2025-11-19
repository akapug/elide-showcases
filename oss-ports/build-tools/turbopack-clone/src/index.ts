/**
 * Turbopack Clone - Incremental Bundler
 *
 * Main entry point for the Turbopack-style incremental bundler.
 */

import { EventEmitter } from 'events';
import { resolve, dirname, extname } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

export interface TurbopackOptions {
  entry: string | string[];
  outdir?: string;
  dev?: boolean;
  port?: number;
  cache?: boolean;
  cacheDir?: string;
}

export class Turbopack extends EventEmitter {
  private options: Required<TurbopackOptions>;
  private cache: Map<string, CacheEntry> = new Map();
  private functionCache: Map<string, FunctionCache> = new Map();

  constructor(options: TurbopackOptions) {
    super();

    this.options = {
      entry: options.entry,
      outdir: options.outdir || 'dist',
      dev: options.dev || false,
      port: options.port || 3000,
      cache: options.cache !== false,
      cacheDir: options.cacheDir || '.turbopack',
    };

    this.loadCache();
  }

  async build(): Promise<void> {
    const startTime = Date.now();
    console.log('[turbopack] Building...');

    const entries = Array.isArray(this.options.entry) ? this.options.entry : [this.options.entry];

    for (const entry of entries) {
      await this.processEntry(entry);
    }

    this.saveCache();

    const duration = Date.now() - startTime;
    console.log(`[turbopack] Built in ${duration}ms`);
  }

  private async processEntry(entry: string): Promise<void> {
    const resolved = resolve(process.cwd(), entry);

    if (!existsSync(resolved)) {
      throw new Error(`Entry not found: ${entry}`);
    }

    const content = readFileSync(resolved, 'utf-8');

    // Function-level caching
    const functions = this.extractFunctions(content);

    for (const func of functions) {
      const cached = this.functionCache.get(func.hash);

      if (cached && cached.compiled) {
        console.log(`[turbopack] Using cached: ${func.name}`);
        continue;
      }

      // Compile function
      const compiled = await this.compileFunction(func);

      this.functionCache.set(func.hash, {
        name: func.name,
        compiled,
        hash: func.hash,
      });
    }
  }

  private extractFunctions(code: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    // Extract function declarations
    const funcRegex = /function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/g;
    let match;

    while ((match = funcRegex.exec(code)) !== null) {
      const name = match[1];
      const body = match[0];
      const hash = this.generateHash(body);

      functions.push({ name, body, hash });
    }

    // Extract arrow functions
    const arrowRegex = /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{[^}]*}/g;
    while ((match = arrowRegex.exec(code)) !== null) {
      const name = match[1];
      const body = match[0];
      const hash = this.generateHash(body);

      functions.push({ name, body, hash });
    }

    return functions;
  }

  private async compileFunction(func: FunctionInfo): Promise<string> {
    console.log(`[turbopack] Compiling: ${func.name}`);

    // Simplified compilation
    return func.body;
  }

  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private loadCache(): void {
    if (!this.options.cache) return;

    const cachePath = resolve(this.options.cacheDir, 'cache.json');
    if (existsSync(cachePath)) {
      try {
        const data = readFileSync(cachePath, 'utf-8');
        const cache = JSON.parse(data);
        this.functionCache = new Map(Object.entries(cache.functions || {}));
      } catch (error) {
        console.warn('[turbopack] Failed to load cache');
      }
    }
  }

  private saveCache(): void {
    if (!this.options.cache) return;

    const cachePath = resolve(this.options.cacheDir, 'cache.json');
    const dir = dirname(cachePath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    try {
      const cache = {
        functions: Object.fromEntries(this.functionCache),
      };
      writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (error) {
      console.warn('[turbopack] Failed to save cache');
    }
  }
}

interface CacheEntry {
  mtime: number;
  compiled: string;
}

interface FunctionCache {
  name: string;
  compiled: string;
  hash: string;
}

interface FunctionInfo {
  name: string;
  body: string;
  hash: string;
}
