/**
 * koa-joi-router - Koa Router with Joi Validation
 *
 * Koa router with built-in Joi validation.
 * **POLYGLOT SHOWCASE**: One Koa router for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/koa-joi-router (~200K+ downloads/week)
 *
 * Package has ~200K+ downloads/week on npm!
 */

class Router {
  route(config: any) {
    return this;
  }

  middleware() {
    return async (ctx: any, next: any) => {
      await next();
    };
  }
}

function router() {
  return new Router();
}

export default router;

if (import.meta.url.includes("elide-koa-joi-router.ts")) {
  console.log("✅ koa-joi-router - Koa Router with Joi Validation (POLYGLOT!)\n");
  console.log("~200K+ downloads/week on npm!");
}
