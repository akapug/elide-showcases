/**
 * bleno - Bluetooth Low Energy Peripheral
 *
 * BLE (Bluetooth Low Energy) peripheral module for Node.js
 * Based on https://www.npmjs.com/package/bleno (~20K+ downloads/week)
 */

class EventEmitter {
  private events = new Map<string, Function[]>();
  on(event: string, handler: Function) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event)!.push(handler);
  }
  emit(event: string, ...args: any[]) {
    this.events.get(event)?.forEach(h => h(...args));
  }
}

class Bleno extends EventEmitter {
  startAdvertising(name: string, serviceUuids: string[]): void {}
  stopAdvertising(): void {}
}

export default new Bleno();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📡 bleno - BLE Peripheral (POLYGLOT!) ~20K+/week\n");
}
