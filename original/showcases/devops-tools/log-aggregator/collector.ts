/**
 * Log Aggregator - Collector
 *
 * Real-time log collection system for distributed applications.
 * Collects logs from multiple sources, normalizes them, and forwards
 * to the analyzer for processing.
 */

import * as fs from 'fs';
import * as path from 'path';
import stripAnsi from 'strip-ansi';
import { spawn } from 'child_process';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface LogEntry {
  timestamp: Date;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  source: string;
  message: string;
  metadata?: Record<string, any>;
  rawMessage: string;
}

export interface LogSource {
  id: string;
  name: string;
  type: 'file' | 'stream' | 'socket' | 'http';
  path?: string;
  host?: string;
  port?: number;
  filters?: LogFilter[];
}

export interface LogFilter {
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt';
  value: any;
}

export interface CollectorConfig {
  sources: LogSource[];
  bufferSize: number;
  flushInterval: number;
  outputPath?: string;
  enablePythonParser?: boolean;
}

export interface CollectorStats {
  totalCollected: number;
  totalProcessed: number;
  totalErrors: number;
  sourceStats: Map<string, SourceStats>;
  startTime: Date;
  uptime: number;
}

export interface SourceStats {
  collected: number;
  errors: number;
  lastActivity: Date;
}

// ============================================================================
// Log Parser
// ============================================================================

export class LogParser {
  private patterns: Map<string, RegExp>;

  constructor() {
    this.patterns = new Map([
      // Common log formats
      ['apache', /^(\S+) \S+ \S+ \[([^\]]+)\] "([^"]+)" (\d+) (\d+)/],
      ['nginx', /^(\S+) - \S+ \[([^\]]+)\] "([^"]+)" (\d+) (\d+) "([^"]*)" "([^"]*)"/],
      ['syslog', /^(\w+\s+\d+\s+\d+:\d+:\d+) (\S+) ([^:]+): (.+)$/],
      ['json', /^\{.*\}$/],
      ['standard', /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?) \[(\w+)\] (.+)$/],
    ]);
  }

  /**
   * Parse a raw log line into structured format
   */
  parse(line: string, source: string): LogEntry | null {
    // Strip ANSI codes first
    const cleanLine = stripAnsi(line.trim());

    if (!cleanLine) {
      return null;
    }

    // Try JSON first
    if (cleanLine.startsWith('{')) {
      try {
        const json = JSON.parse(cleanLine);
        return this.parseJsonLog(json, source, cleanLine);
      } catch (e) {
        // Not valid JSON, continue with other patterns
      }
    }

    // Try standard format
    const standardMatch = this.patterns.get('standard')?.exec(cleanLine);
    if (standardMatch) {
      return {
        timestamp: new Date(standardMatch[1]),
        level: this.normalizeLevel(standardMatch[2]),
        source,
        message: standardMatch[3],
        rawMessage: cleanLine,
      };
    }

    // Try syslog format
    const syslogMatch = this.patterns.get('syslog')?.exec(cleanLine);
    if (syslogMatch) {
      return {
        timestamp: this.parseSyslogDate(syslogMatch[1]),
        level: 'INFO',
        source: `${source}:${syslogMatch[2]}`,
        message: `${syslogMatch[3]}: ${syslogMatch[4]}`,
        rawMessage: cleanLine,
      };
    }

    // Default: unstructured log
    return {
      timestamp: new Date(),
      level: 'INFO',
      source,
      message: cleanLine,
      rawMessage: cleanLine,
    };
  }

  private parseJsonLog(json: any, source: string, rawMessage: string): LogEntry {
    return {
      timestamp: json.timestamp ? new Date(json.timestamp) : new Date(),
      level: this.normalizeLevel(json.level || json.severity || 'INFO'),
      source: json.source || source,
      message: json.message || json.msg || JSON.stringify(json),
      metadata: json,
      rawMessage,
    };
  }

  private normalizeLevel(level: string): LogEntry['level'] {
    const upper = level.toUpperCase();
    if (['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].includes(upper)) {
      return upper as LogEntry['level'];
    }

    // Map common variations
    if (upper.includes('ERR')) return 'ERROR';
    if (upper.includes('WARN')) return 'WARN';
    if (upper.includes('DEBUG') || upper.includes('TRACE')) return 'DEBUG';
    if (upper.includes('FATAL') || upper.includes('CRITICAL')) return 'FATAL';

    return 'INFO';
  }

  private parseSyslogDate(dateStr: string): Date {
    // Simple syslog date parser (e.g., "Nov 6 10:30:45")
    const year = new Date().getFullYear();
    return new Date(`${dateStr} ${year}`);
  }
}

// ============================================================================
// Log Collector
// ============================================================================

export class LogCollector {
  private config: CollectorConfig;
  private parser: LogParser;
  private buffer: LogEntry[];
  private stats: CollectorStats;
  private flushTimer?: NodeJS.Timeout;
  private watchers: Map<string, fs.FSWatcher>;
  private handlers: Map<string, (entry: LogEntry) => void>;

  constructor(config: CollectorConfig) {
    this.config = config;
    this.parser = new LogParser();
    this.buffer = [];
    this.watchers = new Map();
    this.handlers = new Map();

    this.stats = {
      totalCollected: 0,
      totalProcessed: 0,
      totalErrors: 0,
      sourceStats: new Map(),
      startTime: new Date(),
      uptime: 0,
    };
  }

  /**
   * Start collecting logs from all configured sources
   */
  async start(): Promise<void> {
    console.log(`[LogCollector] Starting with ${this.config.sources.length} sources`);

    for (const source of this.config.sources) {
      await this.addSource(source);
    }

    // Start periodic flush
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    console.log('[LogCollector] Started successfully');
  }

  /**
   * Stop collecting logs
   */
  async stop(): Promise<void> {
    console.log('[LogCollector] Stopping...');

    // Stop flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Stop all watchers
    for (const [id, watcher] of this.watchers) {
      watcher.close();
      console.log(`[LogCollector] Closed watcher for ${id}`);
    }

    // Final flush
    this.flush();

    console.log('[LogCollector] Stopped');
  }

  /**
   * Add a new log source
   */
  async addSource(source: LogSource): Promise<void> {
    console.log(`[LogCollector] Adding source: ${source.name} (${source.type})`);

    // Initialize stats for this source
    this.stats.sourceStats.set(source.id, {
      collected: 0,
      errors: 0,
      lastActivity: new Date(),
    });

    switch (source.type) {
      case 'file':
        await this.watchFile(source);
        break;
      case 'stream':
        await this.watchStream(source);
        break;
      case 'socket':
        console.warn(`[LogCollector] Socket sources not yet implemented for ${source.id}`);
        break;
      case 'http':
        console.warn(`[LogCollector] HTTP sources not yet implemented for ${source.id}`);
        break;
    }
  }

  /**
   * Watch a log file for new entries
   */
  private async watchFile(source: LogSource): Promise<void> {
    if (!source.path) {
      throw new Error(`File source ${source.id} missing path`);
    }

    // Check if file exists
    if (!fs.existsSync(source.path)) {
      console.warn(`[LogCollector] File not found: ${source.path}`);
      return;
    }

    // Get current file size
    let fileSize = fs.statSync(source.path).size;
    let stream = fs.createReadStream(source.path, {
      encoding: 'utf8',
      start: fileSize,
    });

    let buffer = '';

    stream.on('data', (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        this.processLine(line, source);
      }
    });

    // Watch for file changes
    const watcher = fs.watch(source.path, (eventType) => {
      if (eventType === 'change') {
        const newSize = fs.statSync(source.path!).size;

        if (newSize < fileSize) {
          // File was truncated, restart stream
          stream.close();
          stream = fs.createReadStream(source.path!, {
            encoding: 'utf8',
            start: 0,
          });
          fileSize = 0;
        }

        fileSize = newSize;
      }
    });

    this.watchers.set(source.id, watcher);
  }

  /**
   * Watch a stream source
   */
  private async watchStream(source: LogSource): Promise<void> {
    console.log(`[LogCollector] Watching stream: ${source.id}`);

    // For demo purposes, we'll simulate reading from stdin
    // In production, this would connect to actual stream sources
    let buffer = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        this.processLine(line, source);
      }
    });
  }

  /**
   * Process a single log line
   */
  private processLine(line: string, source: LogSource): void {
    try {
      const entry = this.parser.parse(line, source.name);

      if (!entry) {
        return;
      }

      // Apply filters
      if (source.filters && !this.applyFilters(entry, source.filters)) {
        return;
      }

      // Add to buffer
      this.buffer.push(entry);
      this.stats.totalCollected++;

      const sourceStats = this.stats.sourceStats.get(source.id);
      if (sourceStats) {
        sourceStats.collected++;
        sourceStats.lastActivity = new Date();
      }

      // Call handlers
      for (const handler of this.handlers.values()) {
        handler(entry);
      }

      // Flush if buffer is full
      if (this.buffer.length >= this.config.bufferSize) {
        this.flush();
      }
    } catch (error) {
      this.stats.totalErrors++;
      const sourceStats = this.stats.sourceStats.get(source.id);
      if (sourceStats) {
        sourceStats.errors++;
      }
      console.error(`[LogCollector] Error processing line from ${source.id}:`, error);
    }
  }

  /**
   * Apply filters to a log entry
   */
  private applyFilters(entry: LogEntry, filters: LogFilter[]): boolean {
    for (const filter of filters) {
      const value = this.getFilterValue(entry, filter.field);

      switch (filter.operator) {
        case 'equals':
          if (value !== filter.value) return false;
          break;
        case 'contains':
          if (!String(value).includes(String(filter.value))) return false;
          break;
        case 'regex':
          if (!new RegExp(filter.value).test(String(value))) return false;
          break;
        case 'gt':
          if (value <= filter.value) return false;
          break;
        case 'lt':
          if (value >= filter.value) return false;
          break;
      }
    }

    return true;
  }

  private getFilterValue(entry: LogEntry, field: string): any {
    if (field in entry) {
      return (entry as any)[field];
    }
    if (entry.metadata && field in entry.metadata) {
      return entry.metadata[field];
    }
    return null;
  }

  /**
   * Flush buffer to storage/handlers
   */
  private flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    console.log(`[LogCollector] Flushing ${this.buffer.length} log entries`);

    if (this.config.outputPath) {
      this.writeToFile(this.buffer);
    }

    // Call Python parser if enabled
    if (this.config.enablePythonParser) {
      this.invokePythonParser(this.buffer);
    }

    this.stats.totalProcessed += this.buffer.length;
    this.buffer = [];
  }

  /**
   * Write logs to file
   */
  private writeToFile(entries: LogEntry[]): void {
    const lines = entries.map(e => JSON.stringify(e)).join('\n') + '\n';

    fs.appendFile(this.config.outputPath!, lines, (err) => {
      if (err) {
        console.error('[LogCollector] Error writing to file:', err);
        this.stats.totalErrors++;
      }
    });
  }

  /**
   * Invoke Python parser for advanced analysis
   */
  private invokePythonParser(entries: LogEntry[]): void {
    const pythonScript = path.join(__dirname, 'parser.py');

    if (!fs.existsSync(pythonScript)) {
      console.warn('[LogCollector] Python parser not found');
      return;
    }

    const python = spawn('python3', [pythonScript]);

    // Send logs to Python parser
    python.stdin.write(JSON.stringify(entries));
    python.stdin.end();

    python.stdout.on('data', (data) => {
      console.log('[PythonParser]', data.toString());
    });

    python.stderr.on('data', (data) => {
      console.error('[PythonParser Error]', data.toString());
    });
  }

  /**
   * Register a handler for log entries
   */
  onLog(id: string, handler: (entry: LogEntry) => void): void {
    this.handlers.set(id, handler);
  }

  /**
   * Remove a handler
   */
  offLog(id: string): void {
    this.handlers.delete(id);
  }

  /**
   * Get collector statistics
   */
  getStats(): CollectorStats {
    this.stats.uptime = Date.now() - this.stats.startTime.getTime();
    return { ...this.stats };
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Search logs in buffer
   */
  searchBuffer(query: string): LogEntry[] {
    const regex = new RegExp(query, 'i');
    return this.buffer.filter(entry =>
      regex.test(entry.message) || regex.test(entry.source)
    );
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

export async function main() {
  console.log('=== Log Collector ===\n');

  const config: CollectorConfig = {
    sources: [
      {
        id: 'app-logs',
        name: 'Application',
        type: 'file',
        path: '/var/log/app.log',
      },
      {
        id: 'system-logs',
        name: 'System',
        type: 'file',
        path: '/var/log/syslog',
      },
    ],
    bufferSize: 100,
    flushInterval: 5000,
    outputPath: '/tmp/collected-logs.jsonl',
    enablePythonParser: true,
  };

  const collector = new LogCollector(config);

  // Register log handler
  collector.onLog('console', (entry) => {
    console.log(`[${entry.level}] ${entry.source}: ${entry.message}`);
  });

  // Start collector
  await collector.start();

  // Print stats every 10 seconds
  setInterval(() => {
    const stats = collector.getStats();
    console.log('\n--- Stats ---');
    console.log(`Collected: ${stats.totalCollected}`);
    console.log(`Processed: ${stats.totalProcessed}`);
    console.log(`Errors: ${stats.totalErrors}`);
    console.log(`Buffer: ${collector.getBufferSize()}`);
    console.log(`Uptime: ${Math.round(stats.uptime / 1000)}s`);
  }, 10000);

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await collector.stop();
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(console.error);
}
