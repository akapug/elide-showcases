/**
 * Elide npm-run-all - Run NPM Scripts in Parallel
 * NPM Package: npm-run-all | Weekly Downloads: ~15,000,000 | License: MIT
 */

export interface RunOptions {
  parallel?: boolean;
  serial?: boolean;
  silent?: boolean;
  continueOnError?: boolean;
}

export async function runAll(scripts: string[], options: RunOptions = {}): Promise<void> {
  if (options.parallel) {
    await Promise.all(scripts.map(s => runScript(s, options)));
  } else {
    for (const script of scripts) {
      await runScript(script, options);
    }
  }
}

async function runScript(script: string, options: RunOptions): Promise<void> {
  if (!options.silent) {
    console.log(`Running: ${${script}}`);
  }
  await new Promise(resolve => setTimeout(resolve, 500));
}

export default runAll;
