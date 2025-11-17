/**
 * Database backup implementation
 */

import type { Database } from './database';
import * as types from './types';

/**
 * SQLite database backup
 */
export class Backup {
  private sourceDb: Database;
  private destinationDb: Database | null = null;
  private destinationPath: string | null = null;
  private options: types.BackupOptions;
  private handle: any;
  private _completed: boolean = false;
  private _totalPages: number = 0;
  private _remainingPages: number = 0;

  constructor(
    source: Database,
    destination: string | Database,
    options: types.BackupOptions = {}
  ) {
    this.sourceDb = source;
    this.options = {
      pageSize: 100,
      pauseBetweenPages: 250,
      ...options
    };

    if (typeof destination === 'string') {
      this.destinationPath = destination;
      // Create destination database
      const { Database: DatabaseClass } = require('./database');
      this.destinationDb = new DatabaseClass(destination, { enableWAL: false });
    } else {
      this.destinationDb = destination;
    }

    // Initialize backup handle
    this.handle = this.nativeBackupInit(
      (this.destinationDb as any).handle,
      (this.sourceDb as any).handle
    );
  }

  /**
   * Execute backup step
   */
  step(pages: number = -1): boolean {
    if (this._completed) {
      throw new Error('Backup has already completed');
    }

    const remaining = this.nativeBackupStep(this.handle, pages);

    this._totalPages = this.nativeBackupPageCount(this.handle);
    this._remainingPages = remaining;

    if (remaining === 0) {
      this._completed = true;
      this.finalize();
      return true;
    }

    // Call progress callback if provided
    if (this.options.progress) {
      const progress: types.BackupProgress = {
        totalPages: this._totalPages,
        remainingPages: this._remainingPages,
        percentComplete: ((this._totalPages - this._remainingPages) / this._totalPages) * 100
      };
      this.options.progress(progress);
    }

    return false;
  }

  /**
   * Execute full backup with progress
   */
  async execute(): Promise<void> {
    const pageSize = this.options.pageSize || 100;
    const pauseTime = this.options.pauseBetweenPages || 250;

    return new Promise((resolve, reject) => {
      const doStep = () => {
        try {
          const completed = this.step(pageSize);

          if (completed) {
            resolve();
          } else {
            // Pause between steps to allow other operations
            setTimeout(doStep, pauseTime);
          }
        } catch (error) {
          reject(error);
        }
      };

      doStep();
    });
  }

  /**
   * Execute full backup synchronously
   */
  executeSync(): void {
    this.step(-1); // Backup all pages at once
  }

  /**
   * Finalize backup
   */
  finalize(): void {
    if (!this._completed) {
      this._completed = true;
    }

    if (this.handle) {
      this.nativeBackupFinish(this.handle);
      this.handle = null;
    }

    // Close destination if we created it
    if (this.destinationPath && this.destinationDb) {
      this.destinationDb.close();
      this.destinationDb = null;
    }
  }

  /**
   * Get backup progress
   */
  get progress(): types.BackupProgress {
    return {
      totalPages: this._totalPages,
      remainingPages: this._remainingPages,
      percentComplete: this._totalPages > 0
        ? ((this._totalPages - this._remainingPages) / this._totalPages) * 100
        : 0
    };
  }

  /**
   * Check if backup is completed
   */
  get completed(): boolean {
    return this._completed;
  }

  // Native bindings
  private nativeBackupInit(destHandle: any, sourceHandle: any): any {
    return (globalThis as any).__elide_sqlite_backup_init?.(destHandle, sourceHandle) || { mock: true };
  }

  private nativeBackupStep(handle: any, pages: number): number {
    return (globalThis as any).__elide_sqlite_backup_step?.(handle, pages) || 0;
  }

  private nativeBackupPageCount(handle: any): number {
    return (globalThis as any).__elide_sqlite_backup_page_count?.(handle) || 0;
  }

  private nativeBackupFinish(handle: any): void {
    (globalThis as any).__elide_sqlite_backup_finish?.(handle);
  }
}
