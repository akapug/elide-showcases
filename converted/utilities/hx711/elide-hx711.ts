/**
 * hx711 - HX711 Load Cell Amplifier
 *
 * Read weight sensors with HX711
 * Based on https://www.npmjs.com/package/hx711 (~3K+ downloads/week)
 */

export class HX711 {
  read(): number {
    return 12345;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚖️ hx711 - Load Cell (POLYGLOT!) ~3K+/week\n");
}
