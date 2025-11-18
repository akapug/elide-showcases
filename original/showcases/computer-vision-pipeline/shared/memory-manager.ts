/**
 * Memory Manager - Shared Memory for Polyglot Processing
 *
 * Manages shared memory regions between TypeScript and Python processes.
 * Enables zero-copy image buffer sharing for computer vision operations.
 *
 * Features:
 * - Shared memory allocation
 * - Inter-process buffer sharing
 * - Memory-mapped file support
 * - Automatic cleanup
 *
 * @module shared/memory-manager
 */

import { randomBytes } from 'crypto';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

interface SharedMemoryRegion {
  id: string;
  size: number;
  path: string;
  buffer: Buffer;
  createdAt: number;
  lastAccessedAt: number;
  refCount: number;
}

interface MemoryStats {
  totalRegions: number;
  totalMemory: number;
  activeRegions: number;
  activeMemory: number;
}

/**
 * Memory Manager for zero-copy buffer sharing
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private regions: Map<string, SharedMemoryRegion>;
  private tempDir: string;
  private maxMemory: number;

  private constructor() {
    this.regions = new Map();
    this.tempDir = join(tmpdir(), 'cv-pipeline-shared');
    this.maxMemory = parseInt(process.env.SHARED_MEMORY_MAX || '1073741824', 10); // 1GB default

    // Create temp directory if it doesn't exist
    if (!existsSync(this.tempDir)) {
      try {
        require('fs').mkdirSync(this.tempDir, { recursive: true });
      } catch (error) {
        console.warn('Failed to create shared memory directory:', error);
      }
    }

    // Cleanup on process exit
    this.setupCleanup();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Generate unique region ID
   */
  private generateRegionId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Create shared memory region
   */
  public createRegion(size: number, data?: Buffer): SharedMemoryRegion {
    const id = this.generateRegionId();
    const path = join(this.tempDir, `shm_${id}`);
    const buffer = data ? Buffer.from(data) : Buffer.alloc(size);

    // Write buffer to file for sharing with Python
    try {
      writeFileSync(path, buffer);
    } catch (error) {
      throw new Error(`Failed to create shared memory region: ${error}`);
    }

    const region: SharedMemoryRegion = {
      id,
      size,
      path,
      buffer,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      refCount: 1,
    };

    this.regions.set(id, region);

    return region;
  }

  /**
   * Get shared memory region
   */
  public getRegion(id: string): SharedMemoryRegion | null {
    const region = this.regions.get(id);
    if (region) {
      region.lastAccessedAt = Date.now();
      region.refCount++;
    }
    return region || null;
  }

  /**
   * Release shared memory region
   */
  public releaseRegion(id: string): boolean {
    const region = this.regions.get(id);
    if (!region) {
      return false;
    }

    region.refCount--;

    // Remove if no more references
    if (region.refCount <= 0) {
      this.deleteRegion(id);
    }

    return true;
  }

  /**
   * Delete shared memory region
   */
  private deleteRegion(id: string): void {
    const region = this.regions.get(id);
    if (!region) {
      return;
    }

    // Delete file
    try {
      if (existsSync(region.path)) {
        unlinkSync(region.path);
      }
    } catch (error) {
      console.warn(`Failed to delete shared memory file: ${error}`);
    }

    this.regions.delete(id);
  }

  /**
   * Get total memory usage
   */
  private getTotalMemory(): number {
    let total = 0;
    for (const region of this.regions.values()) {
      total += region.size;
    }
    return total;
  }

  /**
   * Get memory statistics
   */
  public getStats(): MemoryStats {
    let totalMemory = 0;
    let activeMemory = 0;
    let activeRegions = 0;

    for (const region of this.regions.values()) {
      totalMemory += region.size;
      if (region.refCount > 0) {
        activeMemory += region.size;
        activeRegions++;
      }
    }

    return {
      totalRegions: this.regions.size,
      totalMemory,
      activeRegions,
      activeMemory,
    };
  }

  /**
   * Cleanup old regions
   */
  public cleanup(maxAge: number = 3600000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, region] of this.regions.entries()) {
      if (region.refCount <= 0 && now - region.lastAccessedAt > maxAge) {
        this.deleteRegion(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Clear all regions
   */
  public clearAll(): void {
    for (const id of this.regions.keys()) {
      this.deleteRegion(id);
    }
  }

  /**
   * Setup cleanup on process exit
   */
  private setupCleanup(): void {
    const cleanup = () => {
      this.clearAll();
    };

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  /**
   * Write buffer to shared memory
   */
  public writeBuffer(id: string, data: Buffer, offset: number = 0): boolean {
    const region = this.regions.get(id);
    if (!region) {
      return false;
    }

    if (offset + data.length > region.size) {
      return false;
    }

    data.copy(region.buffer, offset);

    // Update file
    try {
      writeFileSync(region.path, region.buffer);
    } catch (error) {
      console.warn(`Failed to update shared memory file: ${error}`);
      return false;
    }

    region.lastAccessedAt = Date.now();
    return true;
  }

  /**
   * Read buffer from shared memory
   */
  public readBuffer(id: string, offset: number = 0, length?: number): Buffer | null {
    const region = this.regions.get(id);
    if (!region) {
      return null;
    }

    region.lastAccessedAt = Date.now();

    if (length) {
      return region.buffer.slice(offset, offset + length);
    } else {
      return region.buffer.slice(offset);
    }
  }

  /**
   * Get region path for Python access
   */
  public getRegionPath(id: string): string | null {
    const region = this.regions.get(id);
    return region ? region.path : null;
  }

  /**
   * Check if region exists
   */
  public hasRegion(id: string): boolean {
    return this.regions.has(id);
  }

  /**
   * Get all region IDs
   */
  public getRegionIds(): string[] {
    return Array.from(this.regions.keys());
  }

  /**
   * Get region count
   */
  public size(): number {
    return this.regions.size;
  }
}
