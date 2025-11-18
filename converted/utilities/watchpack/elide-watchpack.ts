/**
 * watchpack - Webpack File Watcher
 *
 * File and directory watcher used by webpack
 * Optimized for build tool file watching
 *
 * Popular package with ~40M downloads/week on npm!
 */

interface WatchpackOptions {
  aggregateTimeout?: number;
  poll?: boolean | number;
  followSymlinks?: boolean;
  ignored?: string | RegExp | string[];
}

class Watchpack {
  private watchers = new Map<string, Deno.FsWatcher>();
  private fileListeners = new Set<(file: string, mtime: number) => void>();
  private dirListeners = new Set<(file: string, mtime: number) => void>();
  private aggregatedListeners = new Set<(changes: Set<string>, removals: Set<string>) => void>();

  watch(files: string[], directories: string[], startTime?: number): void {
    this.close();

    [...files, ...directories].forEach(path => {
      try {
        const watcher = Deno.watchFs(path);
        this.watchers.set(path, watcher);

        (async () => {
          for await (const event of watcher) {
            for (const eventPath of event.paths) {
              const mtime = Date.now();

              if (event.kind === 'modify' || event.kind === 'create') {
                for (const listener of this.fileListeners) {
                  listener(eventPath, mtime);
                }
              }
            }
          }
        })();
      } catch {
        // Ignore errors
      }
    });
  }

  on(event: string, callback: Function): void {
    if (event === 'change') {
      this.fileListeners.add(callback as any);
    } else if (event === 'aggregated') {
      this.aggregatedListeners.add(callback as any);
    }
  }

  close(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
  }
}

// CLI Demo
if (import.meta.url.includes("elide-watchpack.ts")) {
  console.log("📦 watchpack - Webpack File Watcher for Elide\n");
  console.log('const wp = new Watchpack({});');
  console.log('wp.watch(["src/index.ts"], ["src"], Date.now());');
  console.log('wp.on("change", (file, mtime) => {');
  console.log('  console.log(`Changed: ${file}`);');
  console.log('});');
  console.log();
  console.log("✅ Use Cases: Webpack, build tools");
  console.log("🚀 ~40M downloads/week on npm");
}

export default Watchpack;
export { Watchpack };
