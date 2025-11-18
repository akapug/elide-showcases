/**
 * raspi-io - Johnny-Five IO Plugin for Raspberry Pi
 *
 * Based on https://www.npmjs.com/package/raspi-io (~5K+ downloads/week)
 */

export class RaspiIO {
  constructor() {}
  pinMode(pin: number, mode: number): void {}
  digitalWrite(pin: number, value: number): void {}
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🤖 raspi-io - Johnny-Five RPi Plugin (POLYGLOT!) ~5K+/week\n");
}
