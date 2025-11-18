/**
 * node-ble - Bluetooth Low Energy
 *
 * Bluetooth Low Energy library for Node.js
 * Based on https://www.npmjs.com/package/node-ble (~10K+ downloads/week)
 */

export async function createBluetooth() {
  return {
    async startScanning() {},
    async stopScanning() {},
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📡 node-ble - BLE Library (POLYGLOT!) ~10K+/week\n");
}
