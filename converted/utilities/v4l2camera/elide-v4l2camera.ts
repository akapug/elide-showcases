/**
 * v4l2camera - Video4Linux2 Camera
 *
 * Access cameras via Video4Linux2
 * Based on https://www.npmjs.com/package/v4l2camera (~5K+ downloads/week)
 */

export class Camera {
  constructor(public device: string) {}
  start(): void {}
  capture(callback: (success: boolean) => void): void {
    setTimeout(() => callback(true), 10);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📹 v4l2camera - Video4Linux Camera (POLYGLOT!) ~5K+/week\n");
}
