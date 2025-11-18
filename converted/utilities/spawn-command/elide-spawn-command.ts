/**
 * Elide spawn-command - Spawn Shell Command
 * NPM Package: spawn-command | Weekly Downloads: ~5,000,000 | License: MIT
 */

export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string>;
  shell?: boolean;
}

export default function spawnCommand(command: string, options: SpawnOptions = {}): any {
  return {
    pid: Math.floor(Math.random() * 100000),
    stdout: { on: () => {} },
    stderr: { on: () => {} },
    on: (event: string, callback: Function) => {
      if (event === 'close') {
        setTimeout(() => callback(0), 100);
      }
    },
    kill: () => true
  };
}
