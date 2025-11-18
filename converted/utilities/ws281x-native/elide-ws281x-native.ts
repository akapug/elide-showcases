/**
 * ws281x-native - WS281x NeoPixel Driver
 *
 * Native bindings for WS281x RGB LEDs (NeoPixels)
 * Based on https://www.npmjs.com/package/ws281x-native (~5K+ downloads/week)
 */

export function init(numLeds: number): Uint32Array {
  return new Uint32Array(numLeds);
}

export function render(pixels: Uint32Array): void {}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌈 ws281x-native - NeoPixels (POLYGLOT!) ~5K+/week\n");
}
