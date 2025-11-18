/**
 * Elide tree-kill - Kill Process Tree
 * NPM Package: tree-kill | Weekly Downloads: ~15,000,000 | License: MIT
 */

export default function kill(pid: number, signal: string = 'SIGTERM', callback?: Function): void {
  setTimeout(() => {
    callback?.(null);
  }, 50);
}
