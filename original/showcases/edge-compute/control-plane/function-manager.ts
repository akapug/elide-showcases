/**
 * Function Manager - Manages serverless function lifecycle
 *
 * Handles function registration, retrieval, updates, and deletion.
 * Supports versioning, rollback, and metadata management.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface FunctionMetadata {
  id: string;
  name: string;
  version: string;
  runtime: 'typescript' | 'python' | 'ruby';
  entrypoint: string;
  code: string;
  env: Record<string, string>;
  memory: number; // MB
  timeout: number; // seconds
  createdAt: Date;
  updatedAt: Date;
  deployedBy: string;
  description?: string;
  tags?: string[];
  routes?: string[];
  config?: Record<string, any>;
}

export interface FunctionVersion {
  version: string;
  functionId: string;
  metadata: FunctionMetadata;
  createdAt: Date;
  active: boolean;
}

export interface DeploymentOptions {
  version?: string;
  autoVersion?: boolean;
  activateImmediately?: boolean;
  validateCode?: boolean;
}

export class FunctionManager {
  private functions: Map<string, FunctionMetadata>;
  private versions: Map<string, FunctionVersion[]>;
  private activeVersions: Map<string, string>;
  private storageDir: string;

  constructor(storageDir: string = './functions') {
    this.functions = new Map();
    this.versions = new Map();
    this.activeVersions = new Map();
    this.storageDir = storageDir;

    this.ensureStorageDir();
    this.loadFunctions();
  }

  /**
   * Deploy a new function or update an existing one
   */
  async deploy(
    name: string,
    code: string,
    runtime: 'typescript' | 'python' | 'ruby',
    options: DeploymentOptions = {}
  ): Promise<FunctionMetadata> {
    const existingFunction = Array.from(this.functions.values()).find(
      (f) => f.name === name
    );

    let version = options.version;
    if (!version && options.autoVersion !== false) {
      version = this.generateVersion(existingFunction);
    }

    if (!version) {
      throw new Error('Version is required when autoVersion is disabled');
    }

    const functionId = existingFunction?.id || this.generateId(name);
    const entrypoint = this.getEntrypoint(runtime);

    const metadata: FunctionMetadata = {
      id: functionId,
      name,
      version,
      runtime,
      entrypoint,
      code,
      env: {},
      memory: 128,
      timeout: 30,
      createdAt: existingFunction?.createdAt || new Date(),
      updatedAt: new Date(),
      deployedBy: 'user', // TODO: get from auth context
      ...options,
    };

    // Validate code if requested
    if (options.validateCode !== false) {
      await this.validateCode(metadata);
    }

    // Save function code to disk
    await this.saveFunctionCode(metadata);

    // Store metadata
    this.functions.set(functionId, metadata);

    // Add to version history
    const versionEntry: FunctionVersion = {
      version,
      functionId,
      metadata: { ...metadata },
      createdAt: new Date(),
      active: options.activateImmediately !== false,
    };

    if (!this.versions.has(functionId)) {
      this.versions.set(functionId, []);
    }
    this.versions.get(functionId)!.push(versionEntry);

    // Update active version
    if (options.activateImmediately !== false) {
      this.activeVersions.set(functionId, version);
    }

    // Persist to disk
    await this.persistMetadata();

    return metadata;
  }

  /**
   * Get a function by ID or name
   */
  get(identifier: string): FunctionMetadata | undefined {
    // Try by ID first
    let func = this.functions.get(identifier);
    if (func) return func;

    // Try by name
    func = Array.from(this.functions.values()).find((f) => f.name === identifier);
    return func;
  }

  /**
   * Get active version of a function
   */
  getActiveVersion(functionId: string): string | undefined {
    return this.activeVersions.get(functionId);
  }

  /**
   * Get specific version of a function
   */
  getVersion(functionId: string, version: string): FunctionVersion | undefined {
    const versions = this.versions.get(functionId);
    if (!versions) return undefined;
    return versions.find((v) => v.version === version);
  }

  /**
   * List all versions of a function
   */
  listVersions(functionId: string): FunctionVersion[] {
    return this.versions.get(functionId) || [];
  }

  /**
   * List all functions
   */
  list(filter?: { runtime?: string; tag?: string }): FunctionMetadata[] {
    let functions = Array.from(this.functions.values());

    if (filter?.runtime) {
      functions = functions.filter((f) => f.runtime === filter.runtime);
    }

    if (filter?.tag) {
      functions = functions.filter((f) => f.tags?.includes(filter.tag));
    }

    return functions;
  }

  /**
   * Update function metadata
   */
  async update(
    functionId: string,
    updates: Partial<FunctionMetadata>
  ): Promise<FunctionMetadata> {
    const func = this.functions.get(functionId);
    if (!func) {
      throw new Error(`Function not found: ${functionId}`);
    }

    const updated = {
      ...func,
      ...updates,
      id: func.id, // Prevent ID changes
      updatedAt: new Date(),
    };

    this.functions.set(functionId, updated);
    await this.persistMetadata();

    return updated;
  }

  /**
   * Delete a function
   */
  async delete(functionId: string): Promise<void> {
    const func = this.functions.get(functionId);
    if (!func) {
      throw new Error(`Function not found: ${functionId}`);
    }

    // Delete function code from disk
    await this.deleteFunctionCode(func);

    // Remove from memory
    this.functions.delete(functionId);
    this.versions.delete(functionId);
    this.activeVersions.delete(functionId);

    // Persist changes
    await this.persistMetadata();
  }

  /**
   * Rollback to a previous version
   */
  async rollback(functionId: string, targetVersion: string): Promise<FunctionMetadata> {
    const version = this.getVersion(functionId, targetVersion);
    if (!version) {
      throw new Error(`Version not found: ${targetVersion}`);
    }

    // Update active version
    this.activeVersions.set(functionId, targetVersion);

    // Update function metadata to match the version
    this.functions.set(functionId, version.metadata);

    await this.persistMetadata();

    return version.metadata;
  }

  /**
   * Promote a version to active
   */
  async promote(functionId: string, version: string): Promise<void> {
    const versionEntry = this.getVersion(functionId, version);
    if (!versionEntry) {
      throw new Error(`Version not found: ${version}`);
    }

    this.activeVersions.set(functionId, version);
    await this.persistMetadata();
  }

  /**
   * Get function statistics
   */
  getStats(): {
    total: number;
    byRuntime: Record<string, number>;
    totalVersions: number;
  } {
    const byRuntime: Record<string, number> = {};
    let totalVersions = 0;

    for (const func of this.functions.values()) {
      byRuntime[func.runtime] = (byRuntime[func.runtime] || 0) + 1;
    }

    for (const versions of this.versions.values()) {
      totalVersions += versions.length;
    }

    return {
      total: this.functions.size,
      byRuntime,
      totalVersions,
    };
  }

  // Private helper methods

  private generateId(name: string): string {
    const hash = crypto.createHash('sha256').update(name + Date.now()).digest('hex');
    return `fn-${hash.substring(0, 12)}`;
  }

  private generateVersion(existingFunction?: FunctionMetadata): string {
    if (!existingFunction) {
      return '1.0.0';
    }

    const parts = existingFunction.version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }

  private getEntrypoint(runtime: string): string {
    switch (runtime) {
      case 'typescript':
        return 'index.ts';
      case 'python':
        return 'main.py';
      case 'ruby':
        return 'main.rb';
      default:
        return 'index.js';
    }
  }

  private async validateCode(metadata: FunctionMetadata): Promise<void> {
    // Basic validation
    if (!metadata.code || metadata.code.trim().length === 0) {
      throw new Error('Function code cannot be empty');
    }

    // Runtime-specific validation
    switch (metadata.runtime) {
      case 'typescript':
        this.validateTypeScript(metadata.code);
        break;
      case 'python':
        this.validatePython(metadata.code);
        break;
      case 'ruby':
        this.validateRuby(metadata.code);
        break;
    }
  }

  private validateTypeScript(code: string): void {
    // Check for required exports
    if (!code.includes('export') && !code.includes('module.exports')) {
      console.warn('TypeScript function should export a handler');
    }
  }

  private validatePython(code: string): void {
    // Check for required handler function
    if (!code.includes('def handler') && !code.includes('def main')) {
      console.warn('Python function should define a handler or main function');
    }
  }

  private validateRuby(code: string): void {
    // Check for required handler function
    if (!code.includes('def handler') && !code.includes('def main')) {
      console.warn('Ruby function should define a handler or main method');
    }
  }

  private async saveFunctionCode(metadata: FunctionMetadata): Promise<void> {
    const funcDir = path.join(this.storageDir, metadata.id, metadata.version);
    await fs.promises.mkdir(funcDir, { recursive: true });

    const codePath = path.join(funcDir, metadata.entrypoint);
    await fs.promises.writeFile(codePath, metadata.code, 'utf-8');
  }

  private async deleteFunctionCode(metadata: FunctionMetadata): Promise<void> {
    const funcDir = path.join(this.storageDir, metadata.id);
    try {
      await fs.promises.rm(funcDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to delete function code: ${error}`);
    }
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private async persistMetadata(): Promise<void> {
    const data = {
      functions: Array.from(this.functions.entries()),
      versions: Array.from(this.versions.entries()),
      activeVersions: Array.from(this.activeVersions.entries()),
    };

    const metadataPath = path.join(this.storageDir, 'metadata.json');
    await fs.promises.writeFile(metadataPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private loadFunctions(): void {
    const metadataPath = path.join(this.storageDir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      this.functions = new Map(data.functions);
      this.versions = new Map(data.versions);
      this.activeVersions = new Map(data.activeVersions);
    } catch (error) {
      console.error('Failed to load function metadata:', error);
    }
  }
}

export default FunctionManager;
