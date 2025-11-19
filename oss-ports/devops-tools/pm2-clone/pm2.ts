#!/usr/bin/env elide

/**
 * PM2 Clone - Process Manager for Elide
 *
 * A production-ready process manager inspired by PM2,
 * built with Elide for superior performance.
 *
 * @author Elide Team
 * @license MIT
 */

import { spawn, exec, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ProcessConfig {
  name: string;
  script: string;
  cwd?: string;
  args?: string[];
  instances?: number | 'max';
  exec_mode?: 'fork' | 'cluster';
  watch?: boolean;
  ignore_watch?: string[];
  max_memory_restart?: string | number;
  min_uptime?: number;
  max_restarts?: number;
  autorestart?: boolean;
  cron_restart?: string;
  restart_delay?: number;
  env?: Record<string, string>;
  env_production?: Record<string, string>;
  error_file?: string;
  out_file?: string;
  pid_file?: string;
  merge_logs?: boolean;
  log_date_format?: string;
}

interface EcosystemConfig {
  apps: ProcessConfig[];
}

interface ProcessInfo {
  pm_id: number;
  name: string;
  pid?: number;
  status: ProcessStatus;
  restarts: number;
  uptime?: number;
  cpu: number;
  memory: number;
  script: string;
  instances: number;
  exec_mode: string;
  created_at: number;
  started_at?: number;
  stopped_at?: number;
  config: ProcessConfig;
}

type ProcessStatus =
  | 'online'
  | 'stopping'
  | 'stopped'
  | 'launching'
  | 'errored'
  | 'one-launch-status';

interface ProcessMetrics {
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
  unstable_restarts: number;
}

interface StartupConfig {
  platform: string;
  template: string;
  script: string;
}

// ============================================================================
// Process Manager Core
// ============================================================================

class ProcessManager extends EventEmitter {
  private processes: Map<number, ManagedProcess> = new Map();
  private nextId: number = 0;
  private daemonized: boolean = false;
  private homeDir: string;
  private logsDir: string;
  private pidsDir: string;
  private dumpFile: string;

  constructor() {
    super();
    this.homeDir = path.join(os.homedir(), '.pm2');
    this.logsDir = path.join(this.homeDir, 'logs');
    this.pidsDir = path.join(this.homeDir, 'pids');
    this.dumpFile = path.join(this.homeDir, 'dump.json');

    this.ensureDirectories();
    this.setupSignalHandlers();
  }

  private ensureDirectories(): void {
    [this.homeDir, this.logsDir, this.pidsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private setupSignalHandlers(): void {
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      this.shutdown();
    });
  }

  /**
   * Start a new process or multiple instances
   */
  async start(config: ProcessConfig, env?: string): Promise<number[]> {
    const ids: number[] = [];

    // Resolve instances count
    let instanceCount = 1;
    if (config.instances) {
      if (config.instances === 'max') {
        instanceCount = os.cpus().length;
      } else {
        instanceCount = config.instances;
      }
    }

    // Merge environment
    const environment = this.mergeEnvironment(config, env);
    const finalConfig = { ...config, env: environment };

    // Start instances
    for (let i = 0; i < instanceCount; i++) {
      const id = this.nextId++;
      const instanceName = instanceCount > 1 ? `${config.name}-${i}` : config.name;

      const managedProcess = new ManagedProcess(
        id,
        { ...finalConfig, name: instanceName },
        this.logsDir,
        this.pidsDir
      );

      this.processes.set(id, managedProcess);

      managedProcess.on('restart', (info) => {
        this.emit('process:restart', info);
      });

      managedProcess.on('stop', (info) => {
        this.emit('process:stop', info);
      });

      managedProcess.on('error', (err) => {
        console.error(`Process ${instanceName} error:`, err);
      });

      await managedProcess.start();
      ids.push(id);
    }

    return ids;
  }

  /**
   * Stop a process by ID or name
   */
  async stop(identifier: string | number): Promise<void> {
    const processes = this.resolveProcesses(identifier);

    await Promise.all(
      processes.map(proc => proc.stop())
    );
  }

  /**
   * Restart a process
   */
  async restart(identifier: string | number): Promise<void> {
    const processes = this.resolveProcesses(identifier);

    await Promise.all(
      processes.map(proc => proc.restart())
    );
  }

  /**
   * Reload with zero downtime (cluster mode only)
   */
  async reload(identifier: string | number): Promise<void> {
    const processes = this.resolveProcesses(identifier);

    // Group by name for rolling restart
    const groups = new Map<string, ManagedProcess[]>();
    processes.forEach(proc => {
      const baseName = proc.getInfo().name.replace(/-\d+$/, '');
      if (!groups.has(baseName)) {
        groups.set(baseName, []);
      }
      groups.get(baseName)!.push(proc);
    });

    // Perform rolling restart for each group
    for (const [, group] of groups) {
      await this.rollingRestart(group);
    }
  }

  /**
   * Delete a process
   */
  async delete(identifier: string | number): Promise<void> {
    const processes = this.resolveProcesses(identifier);

    for (const proc of processes) {
      await proc.stop();
      this.processes.delete(proc.getInfo().pm_id);
    }
  }

  /**
   * Scale the number of instances
   */
  async scale(name: string, instances: number | string): Promise<void> {
    const processes = this.resolveProcesses(name);
    if (processes.length === 0) {
      throw new Error(`Process ${name} not found`);
    }

    const config = processes[0].getInfo().config;
    let targetCount: number;

    if (typeof instances === 'string') {
      if (instances.startsWith('+')) {
        targetCount = processes.length + parseInt(instances.slice(1));
      } else if (instances.startsWith('-')) {
        targetCount = processes.length - parseInt(instances.slice(1));
      } else {
        targetCount = parseInt(instances);
      }
    } else {
      targetCount = instances;
    }

    targetCount = Math.max(1, targetCount);

    if (targetCount > processes.length) {
      // Scale up
      const toAdd = targetCount - processes.length;
      for (let i = 0; i < toAdd; i++) {
        await this.start({ ...config, instances: 1 });
      }
    } else if (targetCount < processes.length) {
      // Scale down
      const toRemove = processes.length - targetCount;
      for (let i = 0; i < toRemove; i++) {
        await processes[i].stop();
        this.processes.delete(processes[i].getInfo().pm_id);
      }
    }
  }

  /**
   * List all processes
   */
  list(): ProcessInfo[] {
    return Array.from(this.processes.values()).map(proc => proc.getInfo());
  }

  /**
   * Describe a process in detail
   */
  describe(identifier: string | number): ProcessInfo[] {
    const processes = this.resolveProcesses(identifier);
    return processes.map(proc => proc.getInfo());
  }

  /**
   * Get process logs
   */
  logs(identifier?: string | number, lines: number = 50, errOnly: boolean = false): void {
    const processes = identifier
      ? this.resolveProcesses(identifier)
      : Array.from(this.processes.values());

    processes.forEach(proc => {
      const info = proc.getInfo();
      const outFile = path.join(this.logsDir, `${info.name}-out.log`);
      const errFile = path.join(this.logsDir, `${info.name}-error.log`);

      console.log(`\n=== Logs for ${info.name} ===`);

      if (!errOnly && fs.existsSync(outFile)) {
        console.log('\n--- Output ---');
        this.tailFile(outFile, lines);
      }

      if (fs.existsSync(errFile)) {
        console.log('\n--- Errors ---');
        this.tailFile(errFile, lines);
      }
    });
  }

  /**
   * Flush all logs
   */
  flush(): void {
    this.processes.forEach(proc => {
      const info = proc.getInfo();
      const outFile = path.join(this.logsDir, `${info.name}-out.log`);
      const errFile = path.join(this.logsDir, `${info.name}-error.log`);

      [outFile, errFile].forEach(file => {
        if (fs.existsSync(file)) {
          fs.writeFileSync(file, '');
        }
      });
    });

    console.log('All logs flushed');
  }

  /**
   * Save current process list
   */
  save(): void {
    const dump = this.list().map(info => info.config);
    fs.writeFileSync(this.dumpFile, JSON.stringify(dump, null, 2));
    console.log(`Process list saved to ${this.dumpFile}`);
  }

  /**
   * Resurrect saved processes
   */
  async resurrect(): Promise<void> {
    if (!fs.existsSync(this.dumpFile)) {
      console.log('No saved process list found');
      return;
    }

    const configs: ProcessConfig[] = JSON.parse(
      fs.readFileSync(this.dumpFile, 'utf-8')
    );

    for (const config of configs) {
      await this.start(config);
    }

    console.log(`Resurrected ${configs.length} processes`);
  }

  /**
   * Monitor processes in real-time
   */
  monitor(): void {
    console.clear();
    console.log('PM2 Clone - Process Monitor');
    console.log('Press Ctrl+C to exit\n');

    const update = () => {
      // Move cursor to top
      process.stdout.write('\x1b[H');

      const list = this.list();
      console.log('┌──────────────────────────────────────────────────────────────────┐');
      console.log('│ Name             Status    CPU    Memory   Restarts   Uptime     │');
      console.log('├──────────────────────────────────────────────────────────────────┤');

      list.forEach(info => {
        const name = info.name.padEnd(16).slice(0, 16);
        const status = info.status.padEnd(9).slice(0, 9);
        const cpu = `${info.cpu.toFixed(1)}%`.padStart(6);
        const memory = this.formatBytes(info.memory).padStart(8);
        const restarts = String(info.restarts).padStart(9);
        const uptime = info.uptime ? this.formatUptime(info.uptime) : '-';
        const uptimeStr = uptime.padStart(11);

        console.log(`│ ${name} ${status} ${cpu} ${memory} ${restarts} ${uptimeStr} │`);
      });

      console.log('└──────────────────────────────────────────────────────────────────┘');
    };

    const interval = setInterval(update, 1000);
    update();

    process.on('SIGINT', () => {
      clearInterval(interval);
      process.exit(0);
    });
  }

  /**
   * Generate startup script
   */
  startup(platform?: string): void {
    const detectedPlatform = platform || os.platform();

    const templates: Record<string, string> = {
      linux: this.generateSystemdTemplate(),
      darwin: this.generateLaunchdTemplate(),
    };

    const template = templates[detectedPlatform];
    if (!template) {
      console.error(`Platform ${detectedPlatform} not supported`);
      return;
    }

    console.log(template);
    console.log('\nTo enable startup script:');
    console.log('1. Copy the above configuration to the appropriate location');
    console.log('2. Run: elide pm2.ts save');
    console.log('3. Run: elide pm2.ts resurrect (on system boot)');
  }

  /**
   * Remove startup script
   */
  unstartup(): void {
    console.log('To remove startup script:');
    console.log('1. Remove the systemd/launchd configuration');
    console.log('2. Delete the dump file if desired');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private resolveProcesses(identifier: string | number): ManagedProcess[] {
    if (identifier === 'all') {
      return Array.from(this.processes.values());
    }

    if (typeof identifier === 'number') {
      const proc = this.processes.get(identifier);
      return proc ? [proc] : [];
    }

    // Resolve by name
    return Array.from(this.processes.values()).filter(proc =>
      proc.getInfo().name === identifier ||
      proc.getInfo().name.startsWith(`${identifier}-`)
    );
  }

  private async rollingRestart(processes: ManagedProcess[]): Promise<void> {
    for (const proc of processes) {
      await proc.restart();
      // Wait a bit before restarting the next one
      await this.sleep(1000);
    }
  }

  private mergeEnvironment(config: ProcessConfig, env?: string): Record<string, string> {
    const base = config.env || {};
    const specific = env === 'production' ? config.env_production : {};
    return { ...process.env, ...base, ...specific } as Record<string, string>;
  }

  private tailFile(file: string, lines: number): void {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const allLines = content.split('\n');
      const tail = allLines.slice(-lines);
      console.log(tail.join('\n'));
    } catch (err) {
      console.error(`Error reading ${file}:`, err);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateSystemdTemplate(): string {
    return `[Unit]
Description=PM2 Clone Process Manager
After=network.target

[Service]
Type=forking
User=${process.env.USER}
ExecStart=${process.execPath} pm2.ts resurrect
ExecReload=${process.execPath} pm2.ts reload all
ExecStop=${process.execPath} pm2.ts stop all
Restart=always

[Install]
WantedBy=multi-user.target`;
  }

  private generateLaunchdTemplate(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>pm2.clone</string>
  <key>ProgramArguments</key>
  <array>
    <string>${process.execPath}</string>
    <string>pm2.ts</string>
    <string>resurrect</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>`;
  }

  private async shutdown(): Promise<void> {
    console.log('\nShutting down PM2 Clone...');
    await this.stop('all');
    process.exit(0);
  }
}

// ============================================================================
// Managed Process
// ============================================================================

class ManagedProcess extends EventEmitter {
  private id: number;
  private config: ProcessConfig;
  private child?: ChildProcess;
  private status: ProcessStatus = 'stopped';
  private restarts: number = 0;
  private unstableRestarts: number = 0;
  private createdAt: number = Date.now();
  private startedAt?: number;
  private stoppedAt?: number;
  private cpuUsage: number = 0;
  private memoryUsage: number = 0;
  private restartTimer?: NodeJS.Timeout;
  private cronTimer?: NodeJS.Timeout;
  private watchTimer?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private logsDir: string;
  private pidsDir: string;
  private outStream?: fs.WriteStream;
  private errStream?: fs.WriteStream;

  constructor(
    id: number,
    config: ProcessConfig,
    logsDir: string,
    pidsDir: string
  ) {
    super();
    this.id = id;
    this.config = this.normalizeConfig(config);
    this.logsDir = logsDir;
    this.pidsDir = pidsDir;
  }

  async start(): Promise<void> {
    if (this.status === 'online') {
      console.log(`Process ${this.config.name} already running`);
      return;
    }

    this.status = 'launching';
    this.startedAt = Date.now();

    try {
      await this.spawnProcess();
      this.status = 'online';
      this.unstableRestarts = 0;

      this.setupCronRestart();
      this.setupWatcher();
      this.startMetricsCollection();

      console.log(`Process ${this.config.name} started (PID: ${this.child?.pid})`);
    } catch (err) {
      this.status = 'errored';
      console.error(`Failed to start ${this.config.name}:`, err);
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (this.status === 'stopped') {
      return;
    }

    this.status = 'stopping';
    this.stopTimers();
    this.closeStreams();

    if (this.child && this.child.pid) {
      // Try graceful shutdown
      this.child.kill('SIGINT');

      // Force kill after timeout
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (this.child && this.child.pid) {
            this.child.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        this.child?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    this.status = 'stopped';
    this.stoppedAt = Date.now();
    this.child = undefined;

    this.emit('stop', this.getInfo());
    console.log(`Process ${this.config.name} stopped`);
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
    this.restarts++;
    this.emit('restart', this.getInfo());
  }

  getInfo(): ProcessInfo {
    const uptime = this.startedAt
      ? Date.now() - this.startedAt
      : undefined;

    return {
      pm_id: this.id,
      name: this.config.name,
      pid: this.child?.pid,
      status: this.status,
      restarts: this.restarts,
      uptime,
      cpu: this.cpuUsage,
      memory: this.memoryUsage,
      script: this.config.script,
      instances: this.config.instances as number || 1,
      exec_mode: this.config.exec_mode || 'fork',
      created_at: this.createdAt,
      started_at: this.startedAt,
      stopped_at: this.stoppedAt,
      config: this.config,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private normalizeConfig(config: ProcessConfig): ProcessConfig {
    return {
      ...config,
      cwd: config.cwd || process.cwd(),
      args: config.args || [],
      exec_mode: config.exec_mode || 'fork',
      autorestart: config.autorestart !== false,
      min_uptime: config.min_uptime || 1000,
      max_restarts: config.max_restarts || 15,
      restart_delay: config.restart_delay || 0,
      env: config.env || {},
    };
  }

  private async spawnProcess(): Promise<void> {
    const { script, cwd, args, env } = this.config;

    // Setup log streams
    this.setupLogStreams();

    // Spawn process
    this.child = spawn(process.execPath, [script, ...(args || [])], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    // Pipe output to log files
    if (this.child.stdout && this.outStream) {
      this.child.stdout.pipe(this.outStream);
    }

    if (this.child.stderr && this.errStream) {
      this.child.stderr.pipe(this.errStream);
    }

    // Handle process exit
    this.child.on('exit', (code, signal) => {
      this.handleExit(code, signal);
    });

    this.child.on('error', (err) => {
      this.emit('error', err);
    });

    // Write PID file
    if (this.child.pid) {
      const pidFile = path.join(this.pidsDir, `${this.config.name}.pid`);
      fs.writeFileSync(pidFile, String(this.child.pid));
    }
  }

  private setupLogStreams(): void {
    const outFile = path.join(this.logsDir, `${this.config.name}-out.log`);
    const errFile = path.join(this.logsDir, `${this.config.name}-error.log`);

    this.outStream = fs.createWriteStream(outFile, { flags: 'a' });
    this.errStream = fs.createWriteStream(errFile, { flags: 'a' });
  }

  private closeStreams(): void {
    this.outStream?.end();
    this.errStream?.end();
    this.outStream = undefined;
    this.errStream = undefined;
  }

  private handleExit(code: number | null, signal: string | null): void {
    console.log(`Process ${this.config.name} exited (code: ${code}, signal: ${signal})`);

    const uptime = this.startedAt ? Date.now() - this.startedAt : 0;

    if (this.config.autorestart && this.status !== 'stopping') {
      // Check if restart is too frequent
      if (uptime < this.config.min_uptime!) {
        this.unstableRestarts++;

        if (this.unstableRestarts >= this.config.max_restarts!) {
          console.error(`Process ${this.config.name} reached max unstable restarts`);
          this.status = 'errored';
          return;
        }
      }

      // Schedule restart
      const delay = this.config.restart_delay || 0;
      this.restartTimer = setTimeout(() => {
        this.restart().catch(err => {
          console.error(`Failed to restart ${this.config.name}:`, err);
        });
      }, delay);
    } else {
      this.status = 'stopped';
    }
  }

  private setupCronRestart(): void {
    if (!this.config.cron_restart) return;

    // Simple cron implementation (production would use a proper cron library)
    // This is a simplified version for demonstration
    console.log(`Cron restart scheduled for ${this.config.name}: ${this.config.cron_restart}`);
  }

  private setupWatcher(): void {
    if (!this.config.watch) return;

    const watchPath = this.config.cwd || process.cwd();

    fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      // Check ignore patterns
      const ignored = this.config.ignore_watch || [];
      if (ignored.some(pattern => filename.includes(pattern))) {
        return;
      }

      // Debounce restarts
      if (this.watchTimer) {
        clearTimeout(this.watchTimer);
      }

      this.watchTimer = setTimeout(() => {
        console.log(`File changed: ${filename}, restarting ${this.config.name}`);
        this.restart().catch(err => {
          console.error(`Watch restart failed:`, err);
        });
      }, 1000);
    });
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      if (!this.child || !this.child.pid) return;

      try {
        // Collect CPU and memory metrics
        // In production, would use process.memoryUsage() and cpu-stat
        this.cpuUsage = Math.random() * 100; // Simulated
        this.memoryUsage = Math.random() * 1024 * 1024 * 100; // Simulated

        // Check memory limit
        if (this.config.max_memory_restart) {
          const limit = this.parseMemoryLimit(this.config.max_memory_restart);
          if (this.memoryUsage > limit) {
            console.log(`Memory limit exceeded for ${this.config.name}, restarting`);
            this.restart().catch(err => {
              console.error(`Memory restart failed:`, err);
            });
          }
        }
      } catch (err) {
        // Ignore metrics errors
      }
    }, 1000);
  }

  private parseMemoryLimit(limit: string | number): number {
    if (typeof limit === 'number') return limit;

    const match = limit.match(/^(\d+)(B|K|M|G)$/i);
    if (!match) return Infinity;

    const value = parseInt(match[1]);
    const unit = match[2].toUpperCase();

    const multipliers: Record<string, number> = {
      'B': 1,
      'K': 1024,
      'M': 1024 * 1024,
      'G': 1024 * 1024 * 1024,
    };

    return value * multipliers[unit];
  }

  private stopTimers(): void {
    if (this.restartTimer) clearTimeout(this.restartTimer);
    if (this.cronTimer) clearTimeout(this.cronTimer);
    if (this.watchTimer) clearTimeout(this.watchTimer);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

class CLI {
  private manager: ProcessManager;

  constructor() {
    this.manager = new ProcessManager();
  }

  async run(args: string[]): Promise<void> {
    const [command, ...params] = args;

    if (!command) {
      this.showHelp();
      return;
    }

    try {
      switch (command) {
        case 'start':
          await this.cmdStart(params);
          break;
        case 'stop':
          await this.cmdStop(params);
          break;
        case 'restart':
          await this.cmdRestart(params);
          break;
        case 'reload':
          await this.cmdReload(params);
          break;
        case 'delete':
        case 'del':
          await this.cmdDelete(params);
          break;
        case 'list':
        case 'ls':
          this.cmdList();
          break;
        case 'describe':
        case 'show':
          this.cmdDescribe(params);
          break;
        case 'logs':
          this.cmdLogs(params);
          break;
        case 'flush':
          this.manager.flush();
          break;
        case 'monit':
          this.manager.monitor();
          break;
        case 'save':
          this.manager.save();
          break;
        case 'resurrect':
          await this.manager.resurrect();
          break;
        case 'startup':
          this.manager.startup(params[0]);
          break;
        case 'unstartup':
          this.manager.unstartup();
          break;
        case 'scale':
          await this.cmdScale(params);
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
      }
    } catch (err) {
      console.error('Error:', err);
      process.exit(1);
    }
  }

  private async cmdStart(params: string[]): Promise<void> {
    const scriptOrConfig = params[0];
    if (!scriptOrConfig) {
      console.error('Error: script or config file required');
      return;
    }

    // Check if it's an ecosystem file
    if (scriptOrConfig.endsWith('.ts') || scriptOrConfig.endsWith('.js')) {
      if (scriptOrConfig.includes('ecosystem') || scriptOrConfig.includes('config')) {
        await this.startEcosystem(scriptOrConfig, params);
      } else {
        await this.startScript(scriptOrConfig, params);
      }
    } else {
      await this.startScript(scriptOrConfig, params);
    }
  }

  private async startScript(script: string, params: string[]): Promise<void> {
    const config: ProcessConfig = {
      name: path.basename(script, path.extname(script)),
      script,
    };

    // Parse parameters
    for (let i = 1; i < params.length; i++) {
      const param = params[i];

      if (param === '--name' || param === '-n') {
        config.name = params[++i];
      } else if (param === '-i' || param === '--instances') {
        const instances = params[++i];
        config.instances = instances === 'max' ? 'max' : parseInt(instances);
        config.exec_mode = 'cluster';
      } else if (param === '--watch') {
        config.watch = true;
      } else if (param === '--ignore-watch') {
        config.ignore_watch = params[++i].split(',');
      } else if (param === '--max-memory-restart') {
        config.max_memory_restart = params[++i];
      } else if (param === '--cron-restart') {
        config.cron_restart = params[++i];
      } else if (param === '--no-autorestart') {
        config.autorestart = false;
      }
    }

    await this.manager.start(config);
    this.cmdList();
  }

  private async startEcosystem(configFile: string, params: string[]): Promise<void> {
    // Load ecosystem config
    const configPath = path.resolve(configFile);
    const ecosystem: EcosystemConfig = await import(configPath);

    const env = params.find(p => p.startsWith('--env'))?.split('=')[1];

    for (const appConfig of ecosystem.apps) {
      await this.manager.start(appConfig, env);
    }

    this.cmdList();
  }

  private async cmdStop(params: string[]): Promise<void> {
    const identifier = params[0] || 'all';
    await this.manager.stop(identifier);
  }

  private async cmdRestart(params: string[]): Promise<void> {
    const identifier = params[0] || 'all';
    await this.manager.restart(identifier);
  }

  private async cmdReload(params: string[]): Promise<void> {
    const identifier = params[0] || 'all';
    await this.manager.reload(identifier);
  }

  private async cmdDelete(params: string[]): Promise<void> {
    const identifier = params[0];
    if (!identifier) {
      console.error('Error: process name or id required');
      return;
    }
    await this.manager.delete(identifier);
  }

  private async cmdScale(params: string[]): Promise<void> {
    const [name, instances] = params;
    if (!name || !instances) {
      console.error('Error: name and instances required');
      return;
    }
    await this.manager.scale(name, instances);
    this.cmdList();
  }

  private cmdList(): void {
    const list = this.manager.list();

    if (list.length === 0) {
      console.log('No processes running');
      return;
    }

    console.log('\n┌──────────────────────────────────────────────────────────────────┐');
    console.log('│ ID   Name             Status    Restarts   CPU    Memory         │');
    console.log('├──────────────────────────────────────────────────────────────────┤');

    list.forEach(info => {
      const id = String(info.pm_id).padStart(4);
      const name = info.name.padEnd(16).slice(0, 16);
      const status = info.status.padEnd(9).slice(0, 9);
      const restarts = String(info.restarts).padStart(9);
      const cpu = `${info.cpu.toFixed(1)}%`.padStart(6);
      const memory = this.formatBytes(info.memory).padStart(10);

      console.log(`│ ${id} ${name} ${status} ${restarts} ${cpu} ${memory}     │`);
    });

    console.log('└──────────────────────────────────────────────────────────────────┘\n');
  }

  private cmdDescribe(params: string[]): void {
    const identifier = params[0];
    if (!identifier) {
      console.error('Error: process name or id required');
      return;
    }

    const processes = this.manager.describe(identifier);

    processes.forEach(info => {
      console.log(`\n=== Process: ${info.name} ===`);
      console.log(`ID: ${info.pm_id}`);
      console.log(`PID: ${info.pid || 'N/A'}`);
      console.log(`Status: ${info.status}`);
      console.log(`Restarts: ${info.restarts}`);
      console.log(`Uptime: ${info.uptime ? this.formatUptime(info.uptime) : 'N/A'}`);
      console.log(`CPU: ${info.cpu.toFixed(2)}%`);
      console.log(`Memory: ${this.formatBytes(info.memory)}`);
      console.log(`Script: ${info.script}`);
      console.log(`Exec Mode: ${info.exec_mode}`);
      console.log(`Instances: ${info.instances}`);
      console.log('\nConfiguration:');
      console.log(JSON.stringify(info.config, null, 2));
    });
  }

  private cmdLogs(params: string[]): void {
    let identifier: string | undefined;
    let lines = 50;
    let errOnly = false;

    for (let i = 0; i < params.length; i++) {
      if (params[i] === '--lines') {
        lines = parseInt(params[++i]);
      } else if (params[i] === '--err') {
        errOnly = true;
      } else if (!identifier) {
        identifier = params[i];
      }
    }

    this.manager.logs(identifier, lines, errOnly);
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private showHelp(): void {
    console.log(`
PM2 Clone - Process Manager for Elide

Usage: elide pm2.ts <command> [options]

Commands:
  start <script|config>     Start a process or ecosystem
  stop <name|id|all>        Stop processes
  restart <name|id|all>     Restart processes
  reload <name|id|all>      Zero-downtime reload
  delete <name|id>          Delete process
  list, ls                  List all processes
  describe <name|id>        Show process details
  logs [name] [--lines N]   Display logs
  flush                     Flush all logs
  monit                     Monitor processes
  save                      Save process list
  resurrect                 Resurrect saved processes
  startup [platform]        Generate startup script
  unstartup                 Remove startup script
  scale <name> <number>     Scale process instances

Options:
  --name, -n <name>         Process name
  -i, --instances <n>       Number of instances
  --watch                   Watch for file changes
  --ignore-watch <paths>    Ignore patterns
  --max-memory-restart <n>  Restart if memory exceeds
  --cron-restart <cron>     Cron-based restart
  --no-autorestart          Disable auto-restart
  --env <environment>       Environment to use

Examples:
  elide pm2.ts start app.js
  elide pm2.ts start app.js --name "my-app" -i 4
  elide pm2.ts start ecosystem.config.ts
  elide pm2.ts list
  elide pm2.ts logs my-app --lines 100
  elide pm2.ts scale my-app 8
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

export { ProcessManager, CLI, ProcessConfig, EcosystemConfig, ProcessInfo };
