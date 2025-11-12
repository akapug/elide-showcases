/**
 * File Watcher
 *
 * Watches files for changes with debouncing and intelligent filtering.
 * Supports TypeScript, Python, Ruby, Java, and more.
 */

interface WatcherConfig {
  root: string;
  patterns: string[];
  onChange: (filePath: string) => void | Promise<void>;
  debounceMs?: number;
  ignorePatterns?: string[];
}

interface WatchedFile {
  path: string;
  lastModified: number;
  size: number;
}

export class FileWatcher {
  private config: Required<WatcherConfig>;
  private watchedFiles: Map<string, WatchedFile> = new Map();
  private changeTimers: Map<string, any> = new Map();
  private isWatching: boolean = false;
  private watchInterval: any = null;
  private stats = {
    changes: 0,
    debounced: 0,
    ignored: 0,
  };

  constructor(config: WatcherConfig) {
    this.config = {
      root: config.root,
      patterns: config.patterns,
      onChange: config.onChange,
      debounceMs: config.debounceMs || 100,
      ignorePatterns: config.ignorePatterns || [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/build/**",
        "**/.elide/**",
        "**/*.log",
        "**/.DS_Store",
        "**/tmp/**",
        "**/temp/**",
      ],
    };
  }

  /**
   * Start watching files
   */
  async start(): Promise<void> {
    if (this.isWatching) {
      console.warn("⚠️ Watcher already started");
      return;
    }

    console.log("👀 Starting file watcher...");

    // Initial scan
    await this.scanFiles();

    this.isWatching = true;

    // Poll for changes (simplified - production would use fs.watch)
    this.watchInterval = setInterval(async () => {
      await this.checkForChanges();
    }, 100);

    console.log(`✅ Watching ${this.watchedFiles.size} files`);
    console.log(`📂 Root: ${this.config.root}`);
    console.log(`🔍 Patterns: ${this.config.patterns.join(", ")}`);
  }

  /**
   * Stop watching files
   */
  async stop(): Promise<void> {
    if (!this.isWatching) return;

    this.isWatching = false;

    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }

    // Clear all pending timers
    for (const timer of this.changeTimers.values()) {
      clearTimeout(timer);
    }
    this.changeTimers.clear();

    console.log("✅ File watcher stopped");
    console.log(`📊 Stats: ${this.stats.changes} changes, ${this.stats.debounced} debounced, ${this.stats.ignored} ignored`);
  }

  /**
   * Get list of watched files
   */
  getWatchedFiles(): string[] {
    return Array.from(this.watchedFiles.keys());
  }

  /**
   * Get watcher statistics
   */
  getStats() {
    return {
      ...this.stats,
      watching: this.watchedFiles.size,
      pending: this.changeTimers.size,
    };
  }

  /**
   * Scan files in the root directory
   */
  private async scanFiles(): Promise<void> {
    // Simplified file scanning
    // In production, would use recursive directory traversal
    const patterns = this.config.patterns;

    // Simulate finding files
    const exampleFiles = [
      "src/index.ts",
      "src/server.ts",
      "src/utils.ts",
      "src/main.py",
      "src/app.rb",
      "src/Main.java",
      "lib/helper.ts",
      "lib/config.py",
    ];

    for (const file of exampleFiles) {
      const fullPath = `${this.config.root}/${file}`;

      if (this.shouldWatch(fullPath)) {
        this.watchedFiles.set(fullPath, {
          path: fullPath,
          lastModified: Date.now(),
          size: 0,
        });
      }
    }
  }

  /**
   * Check if a file should be watched
   */
  private shouldWatch(filePath: string): boolean {
    // Check ignore patterns
    for (const pattern of this.config.ignorePatterns) {
      if (this.matchPattern(filePath, pattern)) {
        return false;
      }
    }

    // Check watch patterns
    for (const pattern of this.config.patterns) {
      if (this.matchPattern(filePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simple pattern matching (production would use micromatch or similar)
   */
  private matchPattern(path: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Check for file changes
   */
  private async checkForChanges(): Promise<void> {
    if (!this.isWatching) return;

    // Simulate random file changes for demo purposes
    // In production, would check actual file stats
    if (Math.random() < 0.01) { // 1% chance per check
      const files = Array.from(this.watchedFiles.keys());
      if (files.length > 0) {
        const randomFile = files[Math.floor(Math.random() * files.length)];
        await this.handleFileChange(randomFile);
      }
    }
  }

  /**
   * Handle file change with debouncing
   */
  private async handleFileChange(filePath: string): Promise<void> {
    this.stats.changes++;

    // Clear existing timer for this file
    const existingTimer = this.changeTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.stats.debounced++;
    }

    // Set new debounced timer
    const timer = setTimeout(async () => {
      this.changeTimers.delete(filePath);

      // Update file info
      const file = this.watchedFiles.get(filePath);
      if (file) {
        file.lastModified = Date.now();
      }

      // Call change handler
      try {
        await this.config.onChange(filePath);
      } catch (error) {
        console.error(`❌ Error handling file change for ${filePath}:`, error);
      }
    }, this.config.debounceMs);

    this.changeTimers.set(filePath, timer);
  }

  /**
   * Manually trigger a file change (for testing)
   */
  async triggerChange(filePath: string): Promise<void> {
    if (this.watchedFiles.has(filePath)) {
      await this.handleFileChange(filePath);
    } else {
      console.warn(`⚠️ File not watched: ${filePath}`);
    }
  }

  /**
   * Add a file to watch list
   */
  addFile(filePath: string): void {
    if (!this.shouldWatch(filePath)) {
      this.stats.ignored++;
      return;
    }

    if (!this.watchedFiles.has(filePath)) {
      this.watchedFiles.set(filePath, {
        path: filePath,
        lastModified: Date.now(),
        size: 0,
      });
      console.log(`👀 Now watching: ${filePath}`);
    }
  }

  /**
   * Remove a file from watch list
   */
  removeFile(filePath: string): void {
    if (this.watchedFiles.delete(filePath)) {
      console.log(`👋 Stopped watching: ${filePath}`);

      // Clear any pending timer
      const timer = this.changeTimers.get(filePath);
      if (timer) {
        clearTimeout(timer);
        this.changeTimers.delete(filePath);
      }
    }
  }
}

// CLI demo
if (import.meta.url.includes("watcher.ts")) {
  console.log("👀 File Watcher Demo\n");

  const watcher = new FileWatcher({
    root: process.cwd(),
    patterns: ["**/*.{ts,js,py,rb,java}"],
    onChange: async (filePath) => {
      console.log(`🔄 File changed: ${filePath}`);
      console.log(`⏱️  Processing change...`);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 10));

      console.log(`✅ Change processed\n`);
    },
    debounceMs: 100,
  });

  watcher.start().then(() => {
    console.log("\n✅ Watcher started!\n");

    // Simulate some file changes
    setTimeout(() => {
      console.log("📝 Simulating file changes...\n");
      watcher.triggerChange(`${process.cwd()}/src/index.ts`);
    }, 1000);

    setTimeout(() => {
      watcher.triggerChange(`${process.cwd()}/src/server.ts`);
    }, 1500);

    setTimeout(() => {
      watcher.triggerChange(`${process.cwd()}/src/main.py`);
    }, 2000);

    // Stop after demo
    setTimeout(async () => {
      console.log("\n🛑 Stopping watcher...\n");
      await watcher.stop();
      console.log("\n📊 Final stats:", watcher.getStats());
    }, 3000);
  });
}
