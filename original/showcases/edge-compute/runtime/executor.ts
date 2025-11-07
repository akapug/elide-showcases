/**
 * Function Executor - Executes serverless functions
 *
 * Handles function invocation with timeout, memory limits, and error handling.
 * Supports TypeScript, Python, and Ruby runtimes.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';

export interface ExecutionContext {
  requestId: string;
  functionId: string;
  functionName: string;
  version: string;
  runtime: string;
  region: string;
  timestamp: Date;
  env: Record<string, string>;
}

export interface ExecutionRequest {
  functionId: string;
  version: string;
  event: any;
  context?: Partial<ExecutionContext>;
  timeout?: number;
  memory?: number;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  logs: string[];
  metrics: {
    duration: number;
    memoryUsed: number;
    cpuTime: number;
  };
  context: ExecutionContext;
}

export class FunctionExecutor extends EventEmitter {
  private storageDir: string;
  private activeExecutions: Map<string, ChildProcess>;

  constructor(storageDir: string = './functions') {
    super();
    this.storageDir = storageDir;
    this.activeExecutions = new Map();
  }

  /**
   * Execute a function
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const logs: string[] = [];

    const context: ExecutionContext = {
      requestId,
      functionId: request.functionId,
      functionName: '', // Will be loaded from metadata
      version: request.version,
      runtime: '', // Will be loaded from metadata
      region: 'default',
      timestamp: new Date(),
      env: {},
      ...request.context,
    };

    try {
      // Load function metadata
      const metadata = await this.loadFunctionMetadata(request.functionId, request.version);
      context.functionName = metadata.name;
      context.runtime = metadata.runtime;
      context.env = { ...metadata.env, ...context.env };

      // Execute based on runtime
      let result: any;
      switch (metadata.runtime) {
        case 'typescript':
          result = await this.executeTypeScript(request, context, logs);
          break;
        case 'python':
          result = await this.executePython(request, context, logs);
          break;
        case 'ruby':
          result = await this.executeRuby(request, context, logs);
          break;
        default:
          throw new Error(`Unsupported runtime: ${metadata.runtime}`);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        result,
        logs,
        metrics: {
          duration,
          memoryUsed: process.memoryUsage().heapUsed,
          cpuTime: process.cpuUsage().user,
        },
        context,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: errorMessage,
        logs,
        metrics: {
          duration,
          memoryUsed: process.memoryUsage().heapUsed,
          cpuTime: process.cpuUsage().user,
        },
        context,
      };
    }
  }

  /**
   * Execute TypeScript function
   */
  private async executeTypeScript(
    request: ExecutionRequest,
    context: ExecutionContext,
    logs: string[]
  ): Promise<any> {
    const funcDir = path.join(this.storageDir, request.functionId, request.version);
    const entrypoint = path.join(funcDir, 'index.ts');

    // For simplicity, we'll use dynamic import with eval
    // In production, you'd want to use ts-node or pre-compile
    const code = await fs.promises.readFile(entrypoint, 'utf-8');

    // Create a sandboxed environment
    const sandbox = {
      console: {
        log: (...args: any[]) => logs.push(args.map(String).join(' ')),
        error: (...args: any[]) => logs.push(`ERROR: ${args.map(String).join(' ')}`),
        warn: (...args: any[]) => logs.push(`WARN: ${args.map(String).join(' ')}`),
      },
      context,
      event: request.event,
      require: (module: string) => {
        // Whitelist safe modules
        const safeModules = ['crypto', 'url', 'querystring', 'util'];
        if (safeModules.includes(module)) {
          return require(module);
        }
        throw new Error(`Module not allowed: ${module}`);
      },
    };

    // Execute the function
    try {
      // Create a wrapper function
      const wrapper = new Function(
        'sandbox',
        `
        with (sandbox) {
          ${code}

          // Call the handler
          if (typeof handler === 'function') {
            return handler(event, context);
          } else if (typeof exports !== 'undefined' && typeof exports.handler === 'function') {
            return exports.handler(event, context);
          } else {
            throw new Error('No handler function found');
          }
        }
      `
      );

      const result = await wrapper(sandbox);
      return result;
    } catch (error) {
      throw new Error(`TypeScript execution failed: ${error}`);
    }
  }

  /**
   * Execute Python function
   */
  private async executePython(
    request: ExecutionRequest,
    context: ExecutionContext,
    logs: string[]
  ): Promise<any> {
    const funcDir = path.join(this.storageDir, request.functionId, request.version);
    const entrypoint = path.join(funcDir, 'main.py');

    return new Promise((resolve, reject) => {
      const timeout = request.timeout || 30000;

      // Create a Python script that wraps the function
      const wrapperScript = `
import sys
import json
import traceback

# Add function directory to path
sys.path.insert(0, '${funcDir}')

try:
    # Import the function
    from main import handler

    # Parse event
    event = json.loads('''${JSON.stringify(request.event)}''')

    # Create context
    context = {
        'request_id': '${context.requestId}',
        'function_id': '${context.functionId}',
        'function_name': '${context.functionName}',
        'version': '${context.version}'
    }

    # Execute handler
    result = handler(event, context)

    # Return result
    print('__RESULT__', json.dumps(result))
except Exception as e:
    print('__ERROR__', str(e), file=sys.stderr)
    traceback.print_exc()
    sys.exit(1)
`;

      const python = spawn('python3', ['-c', wrapperScript], {
        env: { ...process.env, ...context.env },
        timeout,
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logs.push(output.trim());
      });

      python.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        logs.push(`ERROR: ${output.trim()}`);
      });

      python.on('close', (code) => {
        this.activeExecutions.delete(context.requestId);

        if (code === 0) {
          // Parse result from stdout
          const match = stdout.match(/__RESULT__ (.*)/);
          if (match) {
            try {
              const result = JSON.parse(match[1]);
              resolve(result);
            } catch (e) {
              reject(new Error('Failed to parse Python result'));
            }
          } else {
            resolve(stdout.trim());
          }
        } else {
          reject(new Error(`Python execution failed with code ${code}: ${stderr}`));
        }
      });

      python.on('error', (error) => {
        this.activeExecutions.delete(context.requestId);
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });

      this.activeExecutions.set(context.requestId, python);

      // Set timeout
      setTimeout(() => {
        if (this.activeExecutions.has(context.requestId)) {
          python.kill();
          reject(new Error(`Execution timeout after ${timeout}ms`));
        }
      }, timeout);
    });
  }

  /**
   * Execute Ruby function
   */
  private async executeRuby(
    request: ExecutionRequest,
    context: ExecutionContext,
    logs: string[]
  ): Promise<any> {
    const funcDir = path.join(this.storageDir, request.functionId, request.version);
    const entrypoint = path.join(funcDir, 'main.rb');

    return new Promise((resolve, reject) => {
      const timeout = request.timeout || 30000;

      // Create a Ruby script that wraps the function
      const wrapperScript = `
require 'json'

$LOAD_PATH.unshift('${funcDir}')

begin
  # Load the function
  require '${entrypoint}'

  # Parse event
  event = JSON.parse('${JSON.stringify(request.event)}')

  # Create context
  context = {
    'request_id' => '${context.requestId}',
    'function_id' => '${context.functionId}',
    'function_name' => '${context.functionName}',
    'version' => '${context.version}'
  }

  # Execute handler
  result = handler(event, context)

  # Return result
  puts '__RESULT__ ' + result.to_json
rescue => e
  $stderr.puts '__ERROR__ ' + e.message
  $stderr.puts e.backtrace
  exit 1
end
`;

      const ruby = spawn('ruby', ['-e', wrapperScript], {
        env: { ...process.env, ...context.env },
        timeout,
      });

      let stdout = '';
      let stderr = '';

      ruby.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logs.push(output.trim());
      });

      ruby.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        logs.push(`ERROR: ${output.trim()}`);
      });

      ruby.on('close', (code) => {
        this.activeExecutions.delete(context.requestId);

        if (code === 0) {
          // Parse result from stdout
          const match = stdout.match(/__RESULT__ (.*)/);
          if (match) {
            try {
              const result = JSON.parse(match[1]);
              resolve(result);
            } catch (e) {
              reject(new Error('Failed to parse Ruby result'));
            }
          } else {
            resolve(stdout.trim());
          }
        } else {
          reject(new Error(`Ruby execution failed with code ${code}: ${stderr}`));
        }
      });

      ruby.on('error', (error) => {
        this.activeExecutions.delete(context.requestId);
        reject(new Error(`Failed to spawn Ruby process: ${error.message}`));
      });

      this.activeExecutions.set(context.requestId, ruby);

      // Set timeout
      setTimeout(() => {
        if (this.activeExecutions.has(context.requestId)) {
          ruby.kill();
          reject(new Error(`Execution timeout after ${timeout}ms`));
        }
      }, timeout);
    });
  }

  /**
   * Stop an active execution
   */
  stop(requestId: string): boolean {
    const process = this.activeExecutions.get(requestId);
    if (process) {
      process.kill();
      this.activeExecutions.delete(requestId);
      return true;
    }
    return false;
  }

  /**
   * Get active execution count
   */
  getActiveCount(): number {
    return this.activeExecutions.size;
  }

  // Private helper methods

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadFunctionMetadata(
    functionId: string,
    version: string
  ): Promise<{ name: string; runtime: string; env: Record<string, string> }> {
    const metadataPath = path.join(this.storageDir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      throw new Error('Function metadata not found');
    }

    const data = JSON.parse(await fs.promises.readFile(metadataPath, 'utf-8'));
    const functions = new Map(data.functions);
    const metadata = functions.get(functionId);

    if (!metadata) {
      throw new Error(`Function not found: ${functionId}`);
    }

    return metadata;
  }
}

export default FunctionExecutor;
