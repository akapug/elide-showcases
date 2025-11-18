/**
 * ads1x15 - ADS1015/ADS1115 ADC
 *
 * Analog-to-digital converter library
 * Based on https://www.npmjs.com/package/ads1x15 (~3K+ downloads/week)
 */

export class ADS1115 {
  readADC(channel: number, callback: (err: Error | null, value?: number) => void): void {
    setTimeout(() => callback(null, 2048), 10);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📊 ads1x15 - ADC (POLYGLOT!) ~3K+/week\n");
}
