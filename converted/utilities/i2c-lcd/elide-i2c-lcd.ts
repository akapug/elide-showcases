/**
 * i2c-lcd - I2C LCD Display
 *
 * Control LCD displays over I2C
 * Based on https://www.npmjs.com/package/i2c-lcd (~3K+ downloads/week)
 */

export class LCD {
  constructor(public address: number, public cols: number, public rows: number) {}
  print(text: string): void {}
  clear(): void {}
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📺 i2c-lcd - I2C LCD Display (POLYGLOT!) ~3K+/week\n");
}
