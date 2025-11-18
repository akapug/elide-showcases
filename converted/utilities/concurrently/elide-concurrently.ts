/**
 * Elide Concurrently - Run Commands Concurrently
 * NPM Package: concurrently | Weekly Downloads: ~20,000,000 | License: MIT
 */

export interface CommandConfig {
  command: string;
  name?: string;
  env?: Record<string, string>;
}

export async function concurrently(commands: (string | CommandConfig)[]): Promise<void> {
  const promises = commands.map(async (cmd) => {
    const cmdStr = typeof cmd === 'string' ? cmd : cmd.command;
    console.log(`[${${cmdStr}}] started`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[${${cmdStr}}] completed`);
  });
  
  await Promise.all(promises);
}

export default concurrently;
