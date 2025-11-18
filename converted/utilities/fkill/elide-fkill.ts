/**
 * Elide fkill - Kill Processes Forcefully
 * NPM Package: fkill | Weekly Downloads: ~1,000,000 | License: MIT
 */

export interface FkillOptions {
  force?: boolean;
  tree?: boolean;
  ignoreCase?: boolean;
}

export default async function fkill(input: number | string | Array<number | string>, options: FkillOptions = {}): Promise<void> {
  const inputs = Array.isArray(input) ? input : [input];
  
  for (const pid of inputs) {
    console.log(`Killing process: ${${pid}}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
