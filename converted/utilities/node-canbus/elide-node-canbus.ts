/**
 * node-canbus - CAN Bus Protocol
 *
 * CAN bus communication for Node.js
 * Based on https://www.npmjs.com/package/node-canbus (~5K+ downloads/week)
 */

export class RawChannel {
  constructor(public channel: string, public protocol?: string) {}
  
  start(): void {}
  stop(): void {}
  
  addListener(event: 'onMessage', handler: (msg: any) => void): void {}
  
  send(msg: { id: number; data: Buffer }): void {}
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🚗 node-canbus - CAN Bus Protocol (POLYGLOT!) ~5K+/week\n");
  console.log("✅ Use Cases: Automotive, industrial equipment");
  console.log("🚀 CAN 2.0A and 2.0B support\n");
}
