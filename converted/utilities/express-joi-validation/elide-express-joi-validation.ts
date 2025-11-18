/**
 * express-joi-validation - Express Joi Validation Middleware
 *
 * Express middleware for Joi validation.
 * **POLYGLOT SHOWCASE**: One validation middleware for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/express-joi-validation (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

function createValidator() {
  return {
    body(schema: any) {
      return (req: any, res: any, next: any) => {
        const result = schema.validate(req.body);
        if (result.error) {
          return res.status(400).json({ error: result.error.message });
        }
        next();
      };
    },
    query(schema: any) {
      return (req: any, res: any, next: any) => {
        const result = schema.validate(req.query);
        if (result.error) {
          return res.status(400).json({ error: result.error.message });
        }
        next();
      };
    }
  };
}

export default createValidator;

if (import.meta.url.includes("elide-express-joi-validation.ts")) {
  console.log("✅ express-joi-validation - Express Joi Middleware (POLYGLOT!)\n");
  console.log("~500K+ downloads/week on npm!");
}
