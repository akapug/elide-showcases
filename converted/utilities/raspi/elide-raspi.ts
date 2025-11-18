/**
 * raspi - Raspberry Pi IO Library
 *
 * Base library for Raspberry Pi peripherals
 * Based on https://www.npmjs.com/package/raspi (~5K+ downloads/week)
 */

export function init(callback: () => void): void {
  setTimeout(callback, 0);
}

export class PeripheralBase {
  constructor(public pins: number[]) {}
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🥧 raspi - RPi IO Library (POLYGLOT!) ~5K+/week\n");
}
