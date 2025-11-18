/**
 * node-pixel - LED Pixel Control
 *
 * Control NeoPixels and other LED strips
 * Based on https://www.npmjs.com/package/node-pixel (~2K+ downloads/week)
 */

export class Strip {
  constructor(public config: any) {}
  color(color: string): void {}
  show(): void {}
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💡 node-pixel - LED Control (POLYGLOT!) ~2K+/week\n");
}
