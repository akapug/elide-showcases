/**
 * Ora - Elegant terminal spinner
 * Based on https://www.npmjs.com/package/ora (~10M downloads/week)
 */

export class Ora {
  private text: string;
  private isSpinning = false;

  constructor(text: string) {
    this.text = text;
  }

  start(): this {
    this.isSpinning = true;
    console.log(`⠋ ${this.text}`);
    return this;
  }

  succeed(text?: string): this {
    this.isSpinning = false;
    console.log(`✔ ${text || this.text}`);
    return this;
  }

  fail(text?: string): this {
    this.isSpinning = false;
    console.log(`✖ ${text || this.text}`);
    return this;
  }

  stop(): this {
    this.isSpinning = false;
    return this;
  }
}

export function ora(text: string): Ora {
  return new Ora(text);
}

export default ora;

if (import.meta.url.includes("ora.ts")) {
  console.log("⠋ Ora - Terminal spinner for Elide\n");
  const spinner = ora('Loading...');
  spinner.start();
  setTimeout(() => spinner.succeed('Done!'), 100);
  console.log("\n~10M+ downloads/week on npm!");
}
