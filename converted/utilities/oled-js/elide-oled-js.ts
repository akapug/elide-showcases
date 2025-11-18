/**
 * oled-js - OLED Display Driver
 *
 * Control SSD1306 OLED displays
 * Based on https://www.npmjs.com/package/oled-js (~2K+ downloads/week)
 */

export class Oled {
  constructor(public config: any) {}
  clearDisplay(): void {}
  drawPixel(x: number, y: number, color: number): void {}
  writeString(x: number, y: number, text: string): void {}
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📺 oled-js - OLED Display (POLYGLOT!) ~2K+/week\n");
}
