/**
 * Cross-Env for Elide
 *
 * A cross-platform environment variable setter for CLI commands.
 * This implementation provides full API compatibility with the original cross-env
 * while leveraging Elide's instant startup and native performance.
 *
 * @module @elide/cross-env
 */

import { spawn, SpawnOptions } from 'child_process';
import { platform } from 'os';

/**
 * Result of executing a command with cross-env
 */
export interface CrossEnvResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  signal?: string;
}

/**
 * Options for executing a command with environment variables
 */
export interface CrossEnvOptions {
  env?: Record<string, string>;
  command: string;
  args?: string[];
  cwd?: string;
  silent?: boolean;
}

/**
 * Parse command-line arguments into environment variables and command
 *
 * @param args - Command-line arguments
 * @returns Parsed environment variables and command parts
 */
export function parseArgs(args: string[]): {
  env: Record<string, string>;
  command: string[];
} {
  const env: Record<string, string> = {};
  const command: string[] = [];
  let parsingEnv = true;

  for (const arg of args) {
    if (parsingEnv && arg.includes('=')) {
      // Parse environment variable
      const eqIndex = arg.indexOf('=');
      const key = arg.substring(0, eqIndex);
      let value = arg.substring(eqIndex + 1);

      // Remove quotes if present
      value = stripQuotes(value);

      env[key] = value;
    } else {
      // Once we hit a non-env arg, everything else is the command
      parsingEnv = false;
      command.push(arg);
    }
  }

  return { env, command };
}

/**
 * Strip surrounding quotes from a string
 *
 * @param str - String to strip quotes from
 * @returns String without surrounding quotes
 */
export function stripQuotes(str: string): string {
  if ((str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * Get command for the current platform
 * On Windows, certain commands need to be run through cmd.exe
 *
 * @param command - Command to execute
 * @returns Platform-specific command configuration
 */
export function getPlatformCommand(command: string): {
  cmd: string;
  args: string[];
  shell: boolean;
} {
  const isWindows = platform() === 'win32';

  // Commands that need shell on Windows
  const needsShell = ['npm', 'yarn', 'pnpm', 'node', 'npx'];

  if (isWindows && needsShell.some(cmd => command.startsWith(cmd))) {
    return {
      cmd: command,
      args: [],
      shell: true
    };
  }

  return {
    cmd: command,
    args: [],
    shell: false
  };
}

/**
 * Execute a command with environment variables set
 *
 * @param args - Array of arguments (env vars and command)
 * @returns Promise that resolves when command completes
 */
export async function crossEnv(args: string[]): Promise<CrossEnvResult> {
  const { env: parsedEnv, command: commandParts } = parseArgs(args);

  if (commandParts.length === 0) {
    throw new Error('No command specified. Usage: cross-env VAR=value command args...');
  }

  const [command, ...commandArgs] = commandParts;

  return exec({
    env: parsedEnv,
    command,
    args: commandArgs
  });
}

/**
 * Execute a command with specified environment variables
 *
 * @param options - Execution options
 * @returns Promise with execution result
 */
export async function exec(options: CrossEnvOptions): Promise<CrossEnvResult> {
  const { env: extraEnv, command, args = [], cwd, silent = false } = options;

  // Merge environment variables
  const env = {
    ...process.env,
    ...extraEnv
  };

  // Get platform-specific command configuration
  const platformCmd = getPlatformCommand(command);
  const finalArgs = platformCmd.args.length > 0 ? platformCmd.args : args;

  // Spawn options
  const spawnOptions: SpawnOptions = {
    env,
    cwd,
    stdio: silent ? 'pipe' : 'inherit',
    shell: platformCmd.shell
  };

  return new Promise((resolve, reject) => {
    const child = spawn(platformCmd.cmd, finalArgs, spawnOptions);

    let stdout = '';
    let stderr = '';

    if (silent && child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (silent && child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    // Forward signals to child process
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGBREAK'];
    signals.forEach((signal) => {
      process.on(signal, () => {
        child.kill(signal);
      });
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code, signal) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        signal: signal ?? undefined
      });
    });
  });
}

/**
 * Set environment variables in the current process
 * Useful for programmatic usage without spawning a child process
 *
 * @param env - Environment variables to set
 */
export function setEnv(env: Record<string, string>): void {
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

/**
 * Get all environment variables that match a prefix
 *
 * @param prefix - Prefix to match
 * @returns Object with matching environment variables
 */
export function getEnvWithPrefix(prefix: string): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(process.env).forEach(([key, value]) => {
    if (key.startsWith(prefix) && value !== undefined) {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Validate environment variable name
 *
 * @param name - Variable name to validate
 * @returns True if valid, false otherwise
 */
export function isValidEnvVarName(name: string): boolean {
  // Environment variable names should start with letter or underscore
  // and contain only letters, numbers, and underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Parse environment variables from a string
 * Supports formats like "KEY=value KEY2=value2"
 *
 * @param str - String to parse
 * @returns Parsed environment variables
 */
export function parseEnvString(str: string): Record<string, string> {
  const env: Record<string, string> = {};
  const regex = /([a-zA-Z_][a-zA-Z0-9_]*)=([^\s]+)/g;
  let match;

  while ((match = regex.exec(str)) !== null) {
    const [, key, value] = match;
    env[key] = stripQuotes(value);
  }

  return env;
}

// Default export for convenience
export default {
  crossEnv,
  exec,
  parseArgs,
  setEnv,
  getEnvWithPrefix,
  isValidEnvVarName,
  parseEnvString,
  stripQuotes
};
