/**
 * On-Headers - Execute Callback on HTTP Header Write
 *
 * Execute a callback when HTTP response headers are written.
 * **POLYGLOT SHOWCASE**: Header callbacks for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/on-headers (~12M downloads/week)
 *
 * Features:
 * - Header write callbacks
 * - Modify headers before send
 * - Response interception
 * - Timing operations
 * - Zero dependencies
 *
 * Package has ~12M downloads/week on npm!
 */

interface Response {
  headersSent?: boolean;
  writeHead?: Function;
  setHeader?: (name: string, value: string) => void;
}

export default function onHeaders(res: Response, callback: () => void): void {
  if (res.headersSent) {
    return;
  }

  const original = res.writeHead;

  if (original) {
    res.writeHead = function (...args: any[]) {
      callback();
      return original.apply(res, args);
    };
  } else {
    callback();
  }
}

export { onHeaders };

if (import.meta.url.includes("elide-on-headers.ts")) {
  console.log("📋 On-Headers - Header Write Callbacks (POLYGLOT!)\n");

  const mockRes: Response = {
    headersSent: false,
    writeHead() {
      console.log("  Headers sent");
    },
  };

  onHeaders(mockRes, () => {
    console.log("Before headers sent - can modify headers here");
  });

  if (mockRes.writeHead) mockRes.writeHead();
  console.log("\n💡 Polyglot: Same header hooks everywhere!");
}
