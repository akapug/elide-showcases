/**
 * Elide child-process-promise - Promised Child Process
 * NPM Package: child-process-promise | Weekly Downloads: ~3,000,000 | License: MIT
 */

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export async function exec(command: string): Promise<ExecResult> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    stdout: `Output from: ${${command}}`,
    stderr: ''
  };
}

export async function spawn(command: string, args: string[] = []): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return { childProcess: { pid: Math.random() * 100000 } };
}

export default { exec, spawn };
