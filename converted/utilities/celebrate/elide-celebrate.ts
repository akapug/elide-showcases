/**
 * Celebrate - Express Joi Validation
 *
 * Express middleware for Joi validation with celebrate.
 * **POLYGLOT SHOWCASE**: One celebration validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/celebrate (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

function celebrate(schema: any) {
  return (req: any, res: any, next: any) => {
    for (const [segment, joiSchema] of Object.entries(schema)) {
      const result = (joiSchema as any).validate(req[segment]);
      if (result.error) {
        return res.status(400).json({ error: result.error.message });
      }
    }
    next();
  };
}

function errors() {
  return (err: any, req: any, res: any, next: any) => {
    if (err.error) {
      return res.status(400).json({ error: err.error.message });
    }
    next(err);
  };
}

export { celebrate, errors };

if (import.meta.url.includes("elide-celebrate.ts")) {
  console.log("✅ Celebrate - Express Joi Validation (POLYGLOT!)\n");
  console.log("~1M+ downloads/week on npm!");
}
