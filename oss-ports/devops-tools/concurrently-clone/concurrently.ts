#!/usr/bin/env elide

/**
 * Concurrently Clone - Run Multiple Commands for Elide
 *
 * A production-ready tool for running multiple commands concurrently
 * with beautiful output formatting and advanced control options.
 *
 * @author Elide Team
 * @license MIT
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ConcurrentlyConfig {
  commands: CommandConfig[];
  names?: string[];
  prefix?: string;
  prefixColors?: string[];
  raw?: boolean;
  killOthers?: boolean | string[];
  killOthersOnFail?: boolean;
  success?: string;
  restartTries?: number;
  restartDelay?: number;
  maxProcesses?: number;
  hide?: string[];
  timestampFormat?: string;
  passthroughArguments?: boolean;
}

interface CommandConfig {
  command: string;
  name?: string;
  prefixColor?: string;
  env?: Record<string, string>;
  cwd?: string;
}

interface CommandProcess {
  index: number;
  name: string;
  command: string;
  child?: ChildProcess;
  exitCode?: number;
  startTime: number;
  endTime?: number;
  restartCount: number;
  prefixColor: string;
  hidden: boolean;
}

type SuccessCondition = 'first' | 'last' | 'all' | string;

// ============================================================================
// Color Utilities
// ============================================================================

const COLORS: Record<string, string> = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  grey: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  reset: '\x1b[0m',
};

const DEFAULT_COLORS = [
  'blue',
  'green',
  'yellow',
  'magenta',
  'cyan',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
];

function colorize(text: string, color: string): string {
  const colorCode = COLORS[color] || COLORS.white;
  return `${colorCode}${text}${COLORS.reset}`;
}

// ============================================================================
// Prefix Formatter
// ============================================================================

class PrefixFormatter {
  private template: string;

  constructor(template: string = '[{index}]') {
    this.template = template;
  }

  format(process: CommandProcess): string {
    const timestamp = this.formatTimestamp();

    let prefix = this.template
      .replace('{index}', String(process.index))
      .replace('{name}', process.name)
      .replace('{time}', timestamp)
      .replace('{pid}', String(process.child?.pid || ''));

    // Handle padding
    const paddingMatch = prefix.match(/\{name:(\d+)\}/);
    if (paddingMatch) {
      const length = parseInt(paddingMatch[1]);
      const padded = process.name.padEnd(length);
      prefix = prefix.replace(/\{name:\d+\}/, padded);
    }

    return colorize(prefix, process.prefixColor);
  }

  private formatTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}

// ============================================================================
// Output Manager
// ============================================================================

class OutputManager {
  private formatter: PrefixFormatter;
  private raw: boolean;

  constructor(prefixTemplate: string, raw: boolean = false) {
    this.formatter = new PrefixFormatter(prefixTemplate);
    this.raw = raw;
  }

  write(process: CommandProcess, data: string, isError: boolean = false): void {
    if (process.hidden) {
      return;
    }

    const lines = data.toString().split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (this.raw) {
        const stream = isError ? process.stderr : process.stdout;
        stream.write(line + '\n');
      } else {
        const prefix = this.formatter.format(process);
        const output = `${prefix} ${line}\n`;
        const stream = isError ? process.stderr : process.stdout;
        stream.write(output);
      }
    });
  }
}

// ============================================================================
// Process Manager
// ============================================================================

class ProcessManager extends EventEmitter {
  private processes: Map<number, CommandProcess> = new Map();
  private outputManager: OutputManager;
  private config: ConcurrentlyConfig;
  private running: boolean = false;
  private completedCount: number = 0;
  private failedCount: number = 0;

  constructor(config: ConcurrentlyConfig) {
    super();
    this.config = config;
    this.outputManager = new OutputManager(
      config.prefix || '[{name}]',
      config.raw || false
    );
  }

  async start(): Promise<number> {
    this.running = true;

    // Start all processes
    const maxProcesses = this.config.maxProcesses || this.config.commands.length;
    const queue = [...this.config.commands];
    const active: Promise<void>[] = [];

    while (queue.length > 0 || active.length > 0) {
      // Start processes up to max concurrent
      while (active.length < maxProcesses && queue.length > 0) {
        const commandConfig = queue.shift()!;
        const index = this.config.commands.indexOf(commandConfig);
        const promise = this.startProcess(index, commandConfig);
        active.push(promise);
      }

      // Wait for at least one to complete
      if (active.length > 0) {
        await Promise.race(active);
        // Remove completed promises
        for (let i = active.length - 1; i >= 0; i--) {
          if (await this.isPromiseSettled(active[i])) {
            active.splice(i, 1);
          }
        }
      }
    }

    // Wait for all to complete
    await Promise.all(
      Array.from(this.processes.values()).map(p => this.waitForProcess(p))
    );

    return this.determineExitCode();
  }

  private async startProcess(index: number, config: CommandConfig): Promise<void> {
    const process: CommandProcess = {
      index,
      name: config.name || String(index),
      command: config.command,
      startTime: Date.now(),
      restartCount: 0,
      prefixColor: this.getColor(index),
      hidden: this.isHidden(index),
    };

    this.processes.set(index, process);

    return this.spawnProcess(process, config);
  }

  private async spawnProcess(process: CommandProcess, config: CommandConfig): Promise<void> {
    return new Promise((resolve) => {
      console.log(colorize(`Starting: ${process.name}`, process.prefixColor));

      const [command, ...args] = config.command.split(' ');

      process.child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, ...config.env },
        cwd: config.cwd || process.cwd(),
        shell: true,
      });

      process.child.stdout?.on('data', (data) => {
        this.outputManager.write(process, data.toString());
      });

      process.child.stderr?.on('data', (data) => {
        this.outputManager.write(process, data.toString(), true);
      });

      process.child.on('exit', async (code) => {
        process.endTime = Date.now();
        process.exitCode = code || 0;

        this.emit('exit', process);

        if (code === 0) {
          this.completedCount++;
          console.log(
            colorize(`✓ ${process.name} exited with code 0`, 'green')
          );

          // Check success condition
          if (this.checkSuccessCondition()) {
            this.killAll();
            resolve();
            return;
          }
        } else {
          this.failedCount++;
          console.log(
            colorize(`✗ ${process.name} exited with code ${code}`, 'red')
          );

          // Try restart
          if (this.shouldRestart(process)) {
            await this.restartProcess(process, config);
            return;
          }

          // Kill others on fail
          if (this.config.killOthersOnFail) {
            console.log(colorize('Killing other processes...', 'yellow'));
            this.killAll();
            resolve();
            return;
          }
        }

        // Kill others if configured
        if (this.config.killOthers) {
          this.killAll();
        }

        resolve();
      });

      process.child.on('error', (err) => {
        console.error(colorize(`Error in ${process.name}: ${err}`, 'red'));
        this.emit('error', process, err);
        resolve();
      });
    });
  }

  private async restartProcess(process: CommandProcess, config: CommandConfig): Promise<void> {
    process.restartCount++;

    const delay = this.config.restartDelay || 0;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log(
      colorize(
        `Restarting ${process.name} (attempt ${process.restartCount})`,
        'yellow'
      )
    );

    return this.spawnProcess(process, config);
  }

  private shouldRestart(process: CommandProcess): boolean {
    const maxTries = this.config.restartTries || 0;
    return maxTries > 0 && process.restartCount < maxTries;
  }

  private async waitForProcess(process: CommandProcess): Promise<void> {
    return new Promise((resolve) => {
      if (!process.child) {
        resolve();
        return;
      }

      if (process.exitCode !== undefined) {
        resolve();
        return;
      }

      process.child.on('exit', () => resolve());
    });
  }

  private killAll(): void {
    this.processes.forEach(process => {
      if (process.child && !process.exitCode) {
        try {
          process.child.kill('SIGTERM');

          // Force kill after timeout
          setTimeout(() => {
            if (process.child && !process.exitCode) {
              process.child.kill('SIGKILL');
            }
          }, 5000);
        } catch (err) {
          // Ignore errors
        }
      }
    });
  }

  private checkSuccessCondition(): boolean {
    const condition = this.config.success || 'all';

    if (condition === 'first') {
      return this.completedCount >= 1;
    }

    if (condition === 'last') {
      return this.completedCount === this.config.commands.length;
    }

    if (condition === 'all') {
      return this.completedCount === this.config.commands.length && this.failedCount === 0;
    }

    // Command-specific condition
    if (condition.startsWith('command-')) {
      const name = condition.replace('command-', '');
      const process = Array.from(this.processes.values()).find(p => p.name === name);
      return process?.exitCode === 0;
    }

    if (condition.startsWith('!command-')) {
      const name = condition.replace('!command-', '');
      const process = Array.from(this.processes.values()).find(p => p.name === name);
      return process?.exitCode !== 0;
    }

    return false;
  }

  private determineExitCode(): number {
    if (this.failedCount > 0) {
      return 1;
    }

    return 0;
  }

  private getColor(index: number): string {
    if (this.config.prefixColors && this.config.prefixColors[index]) {
      return this.config.prefixColors[index];
    }

    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  }

  private isHidden(index: number): boolean {
    if (!this.config.hide) {
      return false;
    }

    return this.config.hide.includes(String(index));
  }

  private async isPromiseSettled(promise: Promise<any>): Promise<boolean> {
    try {
      await Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject('timeout'), 0))
      ]);
      return true;
    } catch {
      return false;
    }
  }

  stop(): void {
    this.running = false;
    this.killAll();
  }
}

// ============================================================================
// Concurrently Main Class
// ============================================================================

class Concurrently extends EventEmitter {
  private config: ConcurrentlyConfig;
  private processManager?: ProcessManager;

  constructor(config: ConcurrentlyConfig) {
    super();
    this.config = this.normalizeConfig(config);
  }

  private normalizeConfig(config: ConcurrentlyConfig): ConcurrentlyConfig {
    // Ensure commands have names
    config.commands = config.commands.map((cmd, index) => ({
      ...cmd,
      name: cmd.name || (config.names && config.names[index]) || String(index),
    }));

    return config;
  }

  async run(): Promise<number> {
    try {
      this.processManager = new ProcessManager(this.config);

      this.processManager.on('exit', (process) => {
        this.emit('exit', process);
      });

      this.processManager.on('error', (process, err) => {
        this.emit('error', process, err);
      });

      const exitCode = await this.processManager.start();

      return exitCode;
    } catch (err) {
      console.error('Error:', err);
      return 2;
    }
  }

  stop(): void {
    this.processManager?.stop();
  }

  static loadConfig(configPath?: string): Partial<ConcurrentlyConfig> {
    // Try to find config file
    const possiblePaths = [
      configPath,
      'concurrently.config.json',
      path.join(process.cwd(), 'concurrently.config.json'),
      path.join(process.cwd(), 'package.json'),
    ].filter(Boolean) as string[];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const json = JSON.parse(content);

          // Handle package.json with concurrently property
          if (filePath.endsWith('package.json')) {
            return json.concurrently || {};
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
    const fileConfig = Concurrently.loadConfig(config.configFile);

    // Merge configurations
    const finalConfig: ConcurrentlyConfig = {
      commands: [],
      ...fileConfig,
      ...config,
    };

    if (finalConfig.commands.length === 0) {
      console.error('Error: No commands specified');
      this.showHelp();
      process.exit(2);
    }

    try {
      const concurrently = new Concurrently(finalConfig);

      // Handle exit signals
      process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, stopping...');
        concurrently.stop();
        process.exit(3);
      });

      process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM, stopping...');
        concurrently.stop();
        process.exit(3);
      });

      const exitCode = await concurrently.run();

      process.exit(exitCode);
    } catch (err) {
      console.error('Fatal error:', err);
      process.exit(2);
    }
  }

  private parseArgs(args: string[]): any {
    const config: any = {
      commands: [],
      names: [],
      prefixColors: [],
      hide: [],
    };

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      if (arg === '--names' || arg === '-n') {
        config.names = args[++i].split(',').map((s: string) => s.trim());
      } else if (arg === '--prefix' || arg === '-p') {
        config.prefix = args[++i];
      } else if (arg === '--raw' || arg === '-r') {
        config.raw = true;
      } else if (arg === '--kill-others' || arg === '-k') {
        config.killOthers = true;
      } else if (arg === '--kill-others-on-fail') {
        config.killOthersOnFail = true;
      } else if (arg === '--success' || arg === '-s') {
        config.success = args[++i];
      } else if (arg === '--restart-tries') {
        config.restartTries = parseInt(args[++i]);
      } else if (arg === '--restart-delay') {
        config.restartDelay = parseInt(args[++i]);
      } else if (arg === '--prefix-colors') {
        config.prefixColors = args[++i].split(',').map((s: string) => s.trim());
      } else if (arg === '--max-processes') {
        config.maxProcesses = parseInt(args[++i]);
      } else if (arg === '--hide') {
        config.hide = args[++i].split(',').map((s: string) => s.trim());
      } else if (arg === '--timestampFormat') {
        config.timestampFormat = args[++i];
      } else if (arg === '--passthrough-arguments') {
        config.passthroughArguments = true;
      } else if (arg === '--config' || arg === '-c') {
        config.configFile = args[++i];
      } else if (arg === '--help' || arg === '-h') {
        this.showHelp();
        process.exit(0);
      } else if (arg === '--version' || arg === '-v') {
        this.showVersion();
        process.exit(0);
      } else if (!arg.startsWith('-')) {
        // Command
        config.commands.push({ command: arg });
      }

      i++;
    }

    return config;
  }

  private showVersion(): void {
    console.log('Concurrently Clone version 1.0.0 (Elide)');
  }

  private showHelp(): void {
    console.log(`
Concurrently Clone - Run Multiple Commands for Elide

Usage: elide concurrently.ts [OPTIONS] <command1> <command2> ...

Options:
  -n, --names <names>              Comma-separated command names
  -p, --prefix <template>          Prefix format (default: [{name}])
  -r, --raw                        Raw output (no colors/prefixes)
  -k, --kill-others                Kill others on first exit
  --kill-others-on-fail            Kill others on first failure
  -s, --success <condition>        Success condition (first|last|all|command-{name})
  --restart-tries <number>         Max restart attempts
  --restart-delay <ms>             Delay between restarts
  --prefix-colors <colors>         Custom prefix colors
  --max-processes <number>         Max concurrent processes
  --hide <indexes>                 Hide output from commands
  --timestampFormat <format>       Timestamp format
  --passthrough-arguments          Pass args to commands
  -c, --config <file>              Config file path
  -h, --help                       Show help
  -v, --version                    Show version

Prefix Placeholders:
  {index}  - Command index
  {name}   - Command name
  {time}   - Current time
  {pid}    - Process ID

Examples:
  elide concurrently.ts "npm run server" "npm run client"
  elide concurrently.ts --names "api,web" "npm run api" "npm run web"
  elide concurrently.ts --kill-others-on-fail "npm test" "npm run lint"
  elide concurrently.ts --prefix "[{name}]" --success first "cmd1" "cmd2"

Configuration:
  Create concurrently.config.json or add "concurrently" property to package.json

For more information, see: https://github.com/elide/concurrently-clone
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
    process.exit(2);
  });
}

export { Concurrently, ConcurrentlyConfig, CommandConfig };
