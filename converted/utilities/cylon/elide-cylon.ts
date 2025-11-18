/**
 * cylon - JavaScript Robotics Framework
 *
 * Next-generation robotics framework with support for many platforms
 * Based on https://www.npmjs.com/package/cylon (~5K+ downloads/week)
 */

export class Robot {
  constructor(public config: any) {}
  start(): void {
    console.log("Robot started");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🤖 cylon - Robotics Framework (POLYGLOT!) ~5K+/week\n");
}
