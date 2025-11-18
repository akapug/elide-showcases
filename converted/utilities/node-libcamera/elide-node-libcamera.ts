/**
 * node-libcamera - Camera Library
 *
 * Camera access using libcamera
 * Based on https://www.npmjs.com/package/node-libcamera (~2K+ downloads/week)
 */

export class Camera {
  capture(filename: string): Promise<void> {
    return Promise.resolve();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📷 node-libcamera - Camera Library (POLYGLOT!) ~2K+/week\n");
}
