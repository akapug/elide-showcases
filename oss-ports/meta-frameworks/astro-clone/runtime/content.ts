/**
 * Content Collections System
 *
 * Features:
 * - Type-safe content
 * - Markdown/MDX support
 * - Schema validation
 * - Fast queries
 */

import { readdir, readFile } from 'fs/promises';
import { join, parse } from 'path';
import matter from 'gray-matter';

export interface ContentCollection<T = any> {
  type: 'content' | 'data';
  schema: any;
}

export interface ContentEntry<T = any> {
  id: string;
  slug: string;
  collection: string;
  data: T;
  body?: string;
}

export class ContentCollectionManager {
  private collections = new Map<string, ContentCollection>();
  private entries = new Map<string, ContentEntry[]>();
  private contentDir: string;

  constructor(contentDir: string) {
    this.contentDir = contentDir;
  }

  /**
   * Define collection
   */
  defineCollection<T>(name: string, collection: ContentCollection<T>): void {
    this.collections.set(name, collection);
  }

  /**
   * Load all collections
   */
  async load(): Promise<void> {
    console.log('[Content] Loading collections...');
    const start = performance.now();

    for (const [name, collection] of this.collections) {
      const entries = await this.loadCollection(name, collection);
      this.entries.set(name, entries);
    }

    const elapsed = performance.now() - start;
    const totalEntries = Array.from(this.entries.values())
      .reduce((sum, arr) => sum + arr.length, 0);

    console.log(`[Content] Loaded ${totalEntries} entries in ${elapsed.toFixed(2)}ms`);
  }

  /**
   * Load collection entries
   */
  private async loadCollection(
    name: string,
    collection: ContentCollection
  ): Promise<ContentEntry[]> {
    const collectionDir = join(this.contentDir, name);
    const entries: ContentEntry[] = [];

    try {
      const files = await this.scanDirectory(collectionDir);

      for (const file of files) {
        const entry = await this.loadEntry(name, file, collection);
        if (entry) {
          entries.push(entry);
        }
      }
    } catch (error) {
      console.error(`Failed to load collection ${name}:`, error);
    }

    return entries;
  }

  /**
   * Scan directory for files
   */
  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await this.scanDirectory(fullPath);
        files.push(...subFiles);
      } else if (this.isContentFile(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Check if file is a content file
   */
  private isContentFile(filename: string): boolean {
    return /\.(md|mdx|json|yaml|yml)$/.test(filename);
  }

  /**
   * Load single entry
   */
  private async loadEntry(
    collectionName: string,
    filePath: string,
    collection: ContentCollection
  ): Promise<ContentEntry | null> {
    const content = await readFile(filePath, 'utf-8');
    const parsed = parse(filePath);
    const slug = this.generateSlug(filePath, this.contentDir, collectionName);

    let data: any;
    let body: string | undefined;

    if (filePath.endsWith('.json')) {
      data = JSON.parse(content);
    } else if (filePath.endsWith('.md') || filePath.endsWith('.mdx')) {
      const { data: frontmatter, content: markdown } = matter(content);
      data = frontmatter;
      body = markdown;
    } else {
      return null;
    }

    // Validate with schema
    if (collection.schema) {
      try {
        data = collection.schema.parse(data);
      } catch (error) {
        console.error(`Schema validation failed for ${filePath}:`, error);
        return null;
      }
    }

    return {
      id: slug,
      slug,
      collection: collectionName,
      data,
      body,
    };
  }

  /**
   * Generate slug from file path
   */
  private generateSlug(
    filePath: string,
    contentDir: string,
    collectionName: string
  ): string {
    const relative = filePath
      .replace(contentDir, '')
      .replace(new RegExp(`^/${collectionName}/`), '')
      .replace(/\.(md|mdx|json|yaml|yml)$/, '');

    return relative;
  }

  /**
   * Get collection
   */
  async getCollection<T = any>(
    name: string,
    filter?: (entry: ContentEntry<T>) => boolean
  ): Promise<ContentEntry<T>[]> {
    const entries = this.entries.get(name) || [];

    if (filter) {
      return entries.filter(filter as any) as ContentEntry<T>[];
    }

    return entries as ContentEntry<T>[];
  }

  /**
   * Get entry by slug
   */
  async getEntry<T = any>(
    collection: string,
    slug: string
  ): Promise<ContentEntry<T> | undefined> {
    const entries = this.entries.get(collection) || [];
    return entries.find(e => e.slug === slug) as ContentEntry<T> | undefined;
  }

  /**
   * Render entry (for MDX)
   */
  async render(entry: ContentEntry): Promise<{ Content: any; headings: any[] }> {
    if (!entry.body) {
      return { Content: () => null, headings: [] };
    }

    // In production, use MDX compiler
    // For now, return simple HTML
    const Content = () => {
      return { __html: entry.body };
    };

    return { Content, headings: [] };
  }
}

/**
 * Schema helpers (Zod-like)
 */
export const z = {
  string: () => ({
    parse: (val: any) => String(val),
    optional: () => ({
      parse: (val: any) => val === undefined ? undefined : String(val),
    }),
  }),

  number: () => ({
    parse: (val: any) => Number(val),
    optional: () => ({
      parse: (val: any) => val === undefined ? undefined : Number(val),
    }),
  }),

  boolean: () => ({
    parse: (val: any) => Boolean(val),
  }),

  date: () => ({
    parse: (val: any) => new Date(val),
  }),

  array: (schema: any) => ({
    parse: (val: any[]) => val.map(v => schema.parse(v)),
  }),

  object: (shape: Record<string, any>) => ({
    parse: (val: any) => {
      const result: any = {};
      for (const [key, schema] of Object.entries(shape)) {
        result[key] = schema.parse(val[key]);
      }
      return result;
    },
  }),
};

/**
 * Helper to define collection
 */
export function defineCollection<T>(config: ContentCollection<T>): ContentCollection<T> {
  return config;
}

export default ContentCollectionManager;
