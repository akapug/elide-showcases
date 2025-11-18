/**
 * Final Handler - HTTP Final Responder
 *
 * Final HTTP responder for unhandled requests.
 * **POLYGLOT SHOWCASE**: Error handling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/finalhandler (~12M downloads/week)
 *
 * Features:
 * - Default error responses
 * - 404 handling
 * - Error logging
 * - Production/dev modes
 * - Stack trace hiding
 * - Zero dependencies
 *
 * Use cases:
 * - Error handling
 * - 404 pages
 * - Fallback responses
 * - Error logging
 *
 * Package has ~12M downloads/week on npm!
 */

interface Request {
  url: string;
  method: string;
}

interface Response {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(data: string): void;
}

export default function finalhandler(req: Request, res: Response, options: { env?: string } = {}) {
  return function (err?: Error) {
    const isDev = options.env !== "production";

    if (err) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "Internal Server Error",
          message: isDev ? err.message : undefined,
          stack: isDev ? err.stack : undefined,
        })
      );
    } else {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Not Found", path: req.url }));
    }
  };
}

export { finalhandler };

if (import.meta.url.includes("elide-finalhandler.ts")) {
  console.log("🛑 Final Handler - HTTP Final Responder (POLYGLOT!)\n");

  const req = { url: "/unknown", method: "GET" };
  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) {},
    end(data: string) {
      console.log("Response:", data);
    },
  };

  const handler = finalhandler(req, res, { env: "development" });
  handler(); // 404
  console.log();

  handler(new Error("Test error")); // 500
  console.log("\n💡 Polyglot: Same error handling everywhere!");
}
