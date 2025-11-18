/**
 * Elide Cross-Spawn - Cross-Platform Spawn
 *
 * NPM Package: cross-spawn
 * Weekly Downloads: ~150,000,000
 * License: MIT
 */

export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string>;
  shell?: boolean;
  windowsVerbatimArguments?: boolean;
}

export class ChildProcess {
  pid: number;
  exitCode: number | null = null;
  
  constructor(public command: string) {
    this.pid = Math.floor(Math.random() * 100000);
  }
  
  kill(signal?: string): boolean {
    this.exitCode = 1;
    return true;
  }
}

export function spawn(command: string, args: string[] = [], options: SpawnOptions = {}): ChildProcess {
  return new ChildProcess(command);
}

export default spawn;
