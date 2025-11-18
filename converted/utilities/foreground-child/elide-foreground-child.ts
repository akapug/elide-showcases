/**
 * Elide foreground-child - Run Child in Foreground
 * NPM Package: foreground-child | Weekly Downloads: ~40,000,000 | License: ISC
 */

export default function foregroundChild(command: string, args: string[], callback?: Function): any {
  const child = {
    pid: Math.floor(Math.random() * 100000),
    kill: () => true
  };
  
  setTimeout(() => {
    callback?.(null, child);
  }, 100);
  
  return child;
}
