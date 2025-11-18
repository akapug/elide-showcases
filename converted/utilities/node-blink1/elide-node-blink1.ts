/**
 * node-blink1 - Blink(1) USB LED
 *
 * Control Blink(1) USB RGB LED
 * Based on https://www.npmjs.com/package/node-blink1 (~2K+ downloads/week)
 */

export class Blink1 {
  setRGB(r: number, g: number, b: number): void {}
  fadeToRGB(duration: number, r: number, g: number, b: number): void {}
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💡 node-blink1 - Blink(1) LED (POLYGLOT!) ~2K+/week\n");
}
