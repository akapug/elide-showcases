/**
 * noble - Bluetooth Low Energy Central
 *
 * BLE (Bluetooth Low Energy) central module for Node.js
 * Based on https://www.npmjs.com/package/noble (~50K+ downloads/week)
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

export class Peripheral extends EventEmitter {
  constructor(public uuid: string, public advertisement: any) { super(); }
  connect(callback?: (err: Error | null) => void): void {
    if (callback) setTimeout(() => callback(null), 10);
  }
  disconnect(): void {}
}

class Noble extends EventEmitter {
  startScanning(services?: string[]): void {
    setTimeout(() => {
      this.emit('discover', new Peripheral('aabbccddeeff', { localName: 'Device' }));
    }, 100);
  }
  stopScanning(): void {}
}

export default new Noble();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📡 noble - BLE Central (POLYGLOT!) ~50K+/week\n");
}
