#!/usr/bin/env elide

/**
 * Nodemon Clone - File Watcher and Auto-Reloader for Elide
 *
 * A production-ready development tool that automatically restarts
 * your application when file changes are detected.
 *
 * @author Elide Team
 * @license MIT
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface NodemonConfig {
  script?: string;
  watch?: string[];
  ext?: string;
  ignore?: string[];
  exec?: string;
  delay?: number;
  verbose?: boolean;
  quiet?: boolean;
  restartable?: string;
  signal?: string;
  env?: Record<string, string>;
  events?: EventHooks;
  legacyWatch?: boolean;
  stdin?: boolean;
}

interface EventHooks {
  start?: string;
  restart?: string;
  crash?: string;
  quit?: string;
}

type FileEventType = 'add' | 'change' | 'unlink';

interface FileEvent {
  type: FileEventType;
  path: string;
  timestamp: number;
}

// ============================================================================
// File Watcher
// ============================================================================

class FileWatcher extends EventEmitter {
  private watchers: fs.FSWatcher[] = [];
  private watchedPaths: Set<string> = new Set();
  private extensions: Set<string> = new Set();
  private ignorePatterns: RegExp[] = [];
  private debounceTimeout?: NodeJS.Timeout;
  private debounceDelay: number;
  private changedFiles: Set<string> = new Set();

  constructor(
    paths: string[],
    extensions: string[],
    ignorePatterns: string[],
    delay: number = 1000
  ) {
    super();
    this.extensions = new Set(extensions);
    this.debounceDelay = delay;
    this.ignorePatterns = ignorePatterns.map(pattern => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      return new RegExp(`^${regexPattern}$`);
    });

    paths.forEach(p => this.watchPath(p));
  }

  private watchPath(watchPath: string): void {
    if (this.watchedPaths.has(watchPath)) {
      return;
    }

    try {
      const stat = fs.statSync(watchPath);

      if (stat.isDirectory()) {
        this.watchDirectory(watchPath);
      } else if (stat.isFile()) {
        this.watchFile(watchPath);
      }

      this.watchedPaths.add(watchPath);
    } catch (err) {
      console.error(`Failed to watch ${watchPath}:`, err);
    }
  }

  private watchDirectory(dir: string): void {
    // Watch the directory
    try {
      const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        const filePath = path.join(dir, filename);
        this.handleFileEvent(eventType, filePath);
      });

      this.watchers.push(watcher);

      // Recursively watch subdirectories (for non-recursive systems)
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        entries.forEach(entry => {
          if (entry.isDirectory() && !this.shouldIgnore(entry.name)) {
            const subdir = path.join(dir, entry.name);
            this.watchDirectory(subdir);
          }
        });
      } catch (err) {
        // Ignore permission errors
      }
    } catch (err) {
      console.error(`Failed to watch directory ${dir}:`, err);
    }
  }

  private watchFile(file: string): void {
    try {
      const watcher = fs.watch(file, (eventType) => {
        this.handleFileEvent(eventType, file);
      });

      this.watchers.push(watcher);
    } catch (err) {
      console.error(`Failed to watch file ${file}:`, err);
    }
  }

  private handleFileEvent(eventType: string, filePath: string): void {
    // Ignore if file should be ignored
    if (this.shouldIgnore(filePath)) {
      return;
    }

    // Check file extension
    const ext = path.extname(filePath).slice(1);
    if (this.extensions.size > 0 && !this.extensions.has(ext)) {
      return;
    }

    // Add to changed files
    this.changedFiles.add(filePath);

    // Debounce file change events
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      const files = Array.from(this.changedFiles);
      this.changedFiles.clear();
      this.emit('change', files);
    }, this.debounceDelay);
  }

  private shouldIgnore(filePath: string): boolean {
    const normalized = path.normalize(filePath);

    return this.ignorePatterns.some(pattern => {
      return pattern.test(normalized) || pattern.test(path.basename(normalized));
    });
  }

  close(): void {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
    this.watchedPaths.clear();

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }
}

// ============================================================================
// Process Manager
// ============================================================================

class ProcessManager extends EventEmitter {
  private child?: ChildProcess;
  private command: string;
  private args: string[];
  private env: Record<string, string>;
  private signal: string;
  private restarts: number = 0;
  private running: boolean = false;

  constructor(
    command: string,
    args: string[],
    env: Record<string, string>,
    signal: string = 'SIGTERM'
  ) {
    super();
    this.command = command;
    this.args = args;
    this.env = { ...process.env, ...env };
    this.signal = signal;
  }

  async start(): Promise<void> {
    if (this.running) {
      await this.stop();
    }

    console.log(`Starting: ${this.command} ${this.args.join(' ')}`);

    this.child = spawn(this.command, this.args, {
      stdio: 'inherit',
      env: this.env,
      shell: true,
    });

    this.running = true;

    this.child.on('exit', (code, signal) => {
      this.running = false;

      if (code !== null && code !== 0) {
        console.error(`Process exited with code ${code}`);
        this.emit('crash', { code, signal });
      } else {
        this.emit('exit', { code, signal });
      }
    });

    this.child.on('error', (err) => {
      console.error('Process error:', err);
      this.emit('error', err);
    });

    this.emit('start');
  }

  async stop(): Promise<void> {
    if (!this.child || !this.running) {
      return;
    }

    console.log('Stopping process...');

    return new Promise((resolve) => {
      if (!this.child) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        if (this.child && this.running) {
          console.log('Force killing process...');
          this.child.kill('SIGKILL');
        }
        resolve();
      }, 5000);

      this.child.once('exit', () => {
        clearTimeout(timeout);
        this.running = false;
        this.child = undefined;
        resolve();
      });

      try {
        this.child.kill(this.signal);
      } catch (err) {
        clearTimeout(timeout);
        this.running = false;
        this.child = undefined;
        resolve();
      }
    });
  }

  async restart(): Promise<void> {
    this.restarts++;
    console.log(`Restarting... (${this.restarts})`);

    await this.stop();
    await this.start();

    this.emit('restart', this.restarts);
  }

  isRunning(): boolean {
    return this.running;
  }

  getRestartCount(): number {
    return this.restarts;
  }
}

// ============================================================================
// Nodemon Main Class
// ============================================================================

class Nodemon extends EventEmitter {
  private config: Required<NodemonConfig>;
  private watcher?: FileWatcher;
  private processManager?: ProcessManager;
  private running: boolean = false;

  constructor(config: NodemonConfig) {
    super();

    // Default configuration
    this.config = {
      script: config.script || '',
      watch: config.watch || ['.'],
      ext: config.ext || 'ts,js',
      ignore: config.ignore || ['node_modules/**', '.git/**'],
      exec: config.exec || 'elide run',
      delay: config.delay || 1000,
      verbose: config.verbose || false,
      quiet: config.quiet || false,
      restartable: config.restartable || 'rs',
      signal: config.signal || 'SIGTERM',
      env: config.env || {},
      events: config.events || {},
      legacyWatch: config.legacyWatch || false,
      stdin: config.stdin || false,
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.script) {
      throw new Error('Script is required');
    }

    if (!fs.existsSync(this.config.script)) {
      throw new Error(`Script not found: ${this.config.script}`);
    }
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    this.log('Starting nodemon...');
    this.log(`Watching: ${this.config.watch.join(', ')}`);
    this.log(`Extensions: ${this.config.ext}`);
    this.log(`Ignore: ${this.config.ignore.join(', ')}`);

    // Setup file watcher
    this.setupWatcher();

    // Setup process manager
    this.setupProcessManager();

    // Setup stdin
    if (this.config.stdin) {
      this.setupStdin();
    }

    // Start the process
    await this.processManager!.start();

    // Execute start event
    await this.executeEvent('start');

    this.emit('start');

    // Keep running
    await new Promise(() => {});
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.log('Stopping nodemon...');

    this.running = false;

    // Close watcher
    if (this.watcher) {
      this.watcher.close();
    }

    // Stop process
    if (this.processManager) {
      await this.processManager.stop();
    }

    // Execute quit event
    await this.executeEvent('quit');

    this.emit('quit');
  }

  private setupWatcher(): void {
    const extensions = this.config.ext.split(',').map(e => e.trim());

    this.watcher = new FileWatcher(
      this.config.watch,
      extensions,
      this.config.ignore,
      this.config.delay
    );

    this.watcher.on('change', async (files: string[]) => {
      this.log(`Files changed: ${files.join(', ')}`);

      if (this.processManager && this.processManager.isRunning()) {
        await this.executeEvent('restart');
        await this.processManager.restart();
        this.emit('restart', files);
      }
    });
  }

  private setupProcessManager(): void {
    const [command, ...execArgs] = this.config.exec.split(' ');
    const args = [...execArgs, this.config.script];

    this.processManager = new ProcessManager(
      command,
      args,
      this.config.env,
      this.config.signal
    );

    this.processManager.on('start', () => {
      this.log('Process started');
    });

    this.processManager.on('restart', (count: number) => {
      this.log(`Process restarted (${count} times)`);
    });

    this.processManager.on('crash', async (info: any) => {
      this.log(`Process crashed with code ${info.code}`);
      await this.executeEvent('crash');
      this.emit('crash', info);

      // Auto-restart on crash
      setTimeout(async () => {
        if (this.running && this.processManager) {
          await this.processManager.start();
        }
      }, this.config.delay);
    });

    this.processManager.on('error', (err: Error) => {
      console.error('Process error:', err);
      this.emit('error', err);
    });
  }

  private setupStdin(): void {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (data: string) => {
      const input = data.trim();

      if (input === this.config.restartable) {
        this.log('Manual restart triggered');
        if (this.processManager) {
          await this.processManager.restart();
        }
      } else if (input === 'quit' || input === 'exit') {
        await this.stop();
        process.exit(0);
      }
    });

    if (this.config.restartable) {
      this.log(`Type '${this.config.restartable}' to restart, 'quit' to exit`);
    }
  }

  private async executeEvent(eventName: keyof EventHooks): Promise<void> {
    const command = this.config.events[eventName];
    if (!command) return;

    this.log(`Executing ${eventName} event: ${command}`);

    return new Promise((resolve) => {
      const child = spawn(command, [], {
        stdio: 'inherit',
        shell: true,
      });

      child.on('exit', () => {
        resolve();
      });

      child.on('error', (err) => {
        console.error(`Event ${eventName} failed:`, err);
        resolve();
      });
    });
  }

  private log(message: string): void {
    if (this.config.quiet) return;

    const timestamp = new Date().toISOString();
    const prefix = this.config.verbose ? `[${timestamp}] [nodemon]` : '[nodemon]';

    console.log(`${prefix} ${message}`);
  }

  static loadConfig(configPath?: string): NodemonConfig {
    // Try to find config file
    const possiblePaths = [
      configPath,
      'nodemon.json',
      path.join(process.cwd(), 'nodemon.json'),
      path.join(process.cwd(), 'package.json'),
    ].filter(Boolean) as string[];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const json = JSON.parse(content);

          // Handle package.json with nodemon property
          if (filePath.endsWith('package.json')) {
            return json.nodemon || {};
          }

          return json;
        } catch (err) {
          console.error(`Failed to load config from ${filePath}:`, err);
        }
      }
    }

    return {};
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

class CLI {
  async run(args: string[]): Promise<void> {
    // Parse arguments
    const config = this.parseArgs(args);

    // Load config file
    const fileConfig = Nodemon.loadConfig(config.configFile);

    // Merge configurations (CLI args take precedence)
    const finalConfig: NodemonConfig = {
      ...fileConfig,
      ...config,
    };

    try {
      const nodemon = new Nodemon(finalConfig);

      // Handle exit signals
      process.on('SIGINT', async () => {
        await nodemon.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await nodemon.stop();
        process.exit(0);
      });

      await nodemon.start();
    } catch (err) {
      console.error('Error:', err);
      process.exit(1);
    }
  }

  private parseArgs(args: string[]): any {
    const config: any = {
      watch: [],
      ignore: [],
    };

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      if (arg === '--watch' || arg === '-w') {
        config.watch.push(args[++i]);
      } else if (arg === '--ext' || arg === '-e') {
        config.ext = args[++i];
      } else if (arg === '--ignore' || arg === '-i') {
        config.ignore.push(args[++i]);
      } else if (arg === '--exec' || arg === '-x') {
        config.exec = args[++i];
      } else if (arg === '--delay' || arg === '-d') {
        config.delay = parseInt(args[++i]);
      } else if (arg === '--verbose' || arg === '-V') {
        config.verbose = true;
      } else if (arg === '--quiet' || arg === '-q') {
        config.quiet = true;
      } else if (arg === '--signal' || arg === '-s') {
        config.signal = args[++i];
      } else if (arg === '--env') {
        const envPairs = args[++i].split(',');
        config.env = envPairs.reduce((acc: any, pair: string) => {
          const [key, value] = pair.split('=');
          acc[key] = value;
          return acc;
        }, {});
      } else if (arg === '--config' || arg === '-c') {
        config.configFile = args[++i];
      } else if (arg === '--legacy-watch') {
        config.legacyWatch = true;
      } else if (arg === '--stdin') {
        config.stdin = true;
      } else if (arg === '--help' || arg === '-h') {
        this.showHelp();
        process.exit(0);
      } else if (!arg.startsWith('-')) {
        // Script path
        config.script = arg;
      }

      i++;
    }

    return config;
  }

  private showHelp(): void {
    console.log(`
Nodemon Clone - File Watcher and Auto-Reloader for Elide

Usage: elide nodemon.ts [OPTIONS] <script>

Options:
  -w, --watch <path>         Directory to watch
  -e, --ext <extensions>     Extensions to watch (default: ts,js)
  -i, --ignore <pattern>     Pattern to ignore
  -x, --exec <command>       Command to execute (default: elide run)
  -d, --delay <ms>           Delay before restart (default: 1000)
  -V, --verbose              Verbose output
  -q, --quiet                Suppress output
  -s, --signal <signal>      Kill signal (default: SIGTERM)
  --env <key=value>          Environment variables
  -c, --config <file>        Config file path
  --legacy-watch             Use legacy watch mode
  --stdin                    Enable stdin
  -h, --help                 Show help

Examples:
  elide nodemon.ts app.ts
  elide nodemon.ts --watch src --ext ts,js app.ts
  elide nodemon.ts --ignore node_modules --delay 2000 app.ts
  elide nodemon.ts --exec "elide run --inspect" app.ts

Configuration:
  Create nodemon.json or add "nodemon" property to package.json

For more information, see: https://github.com/elide/nodemon-clone
`);
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

if (require.main === module) {
  const cli = new CLI();
  const args = process.argv.slice(2);

  cli.run(args).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { Nodemon, NodemonConfig, FileWatcher, ProcessManager };
