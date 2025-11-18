/**
 * express-mung - Response Munging Middleware
 *
 * Express middleware for transforming responses before sending.
 * **POLYGLOT SHOWCASE**: Response transformation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/express-mung (~50K+ downloads/week)
 *
 * Features:
 * - Response body transformation
 * - JSON munging
 * - Header manipulation
 * - Async transformations
 * - Streaming support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Transform responses across languages
 * - ONE transformation pattern on Elide
 * - Consistent response formatting
 * - Cross-service standardization
 *
 * Use cases:
 * - Response formatting
 * - Data sanitization
 * - Header injection
 * - Logging
 *
 * Package has ~50K+ downloads/week on npm!
 */

type TransformFunction = (body: any, req: any, res: any) => any;
type AsyncTransformFunction = (body: any, req: any, res: any) => Promise<any>;

class ExpressMung {
  static json(transform: TransformFunction) {
    return (req: any, res: any, next: any) => {
      const originalJson = res.json;

      res.json = function (body: any) {
        try {
          const transformed = transform(body, req, res);
          return originalJson.call(this, transformed);
        } catch (error) {
          console.error('[express-mung] Transform error:', error);
          return originalJson.call(this, body);
        }
      };

      next();
    };
  }

  static jsonAsync(transform: AsyncTransformFunction) {
    return (req: any, res: any, next: any) => {
      const originalJson = res.json;

      res.json = async function (body: any) {
        try {
          const transformed = await transform(body, req, res);
          return originalJson.call(this, transformed);
        } catch (error) {
          console.error('[express-mung] Async transform error:', error);
          return originalJson.call(this, body);
        }
      };

      next();
    };
  }

  static headers(transform: (req: any, res: any) => void) {
    return (req: any, res: any, next: any) => {
      const originalJson = res.json;
      const originalSend = res.send;

      const wrapResponse = function (this: any, body: any) {
        transform(req, res);
        return originalJson.call(this, body);
      };

      res.json = wrapResponse;
      res.send = wrapResponse;

      next();
    };
  }

  static write(transform: TransformFunction) {
    return (req: any, res: any, next: any) => {
      const originalWrite = res.write;
      const originalEnd = res.end;

      let body = '';

      res.write = function (chunk: any, encoding?: any) {
        body += chunk;
        return true;
      };

      res.end = function (chunk?: any, encoding?: any) {
        if (chunk) {
          body += chunk;
        }

        try {
          const transformed = transform(body, req, res);
          return originalEnd.call(this, transformed, encoding);
        } catch (error) {
          console.error('[express-mung] Write transform error:', error);
          return originalEnd.call(this, body, encoding);
        }
      };

      next();
    };
  }
}

export { ExpressMung, TransformFunction, AsyncTransformFunction };
export default ExpressMung;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔧 express-mung - Response Munging (POLYGLOT!)\n");

  console.log("=== JSON Transform ===");
  const jsonMiddleware = ExpressMung.json((body, req, res) => {
    console.log('Transforming JSON response...');
    return {
      ...body,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown',
    };
  });

  const mockReq = { id: 'req-123', method: 'GET', url: '/api/users' };
  const mockRes = {
    json: function (data: any) {
      console.log('Final response:', data);
    },
  };

  jsonMiddleware(mockReq, mockRes, () => {
    mockRes.json({ users: ['Alice', 'Bob'] });
  });
  console.log();

  console.log("=== Async Transform ===");
  const asyncMiddleware = ExpressMung.jsonAsync(async (body, req, res) => {
    console.log('Async transforming...');
    await new Promise(resolve => setTimeout(resolve, 10));
    return {
      ...body,
      processed: true,
    };
  });

  asyncMiddleware(mockReq, mockRes, async () => {
    await mockRes.json({ data: 'test' });
  });
  console.log();

  console.log("=== Header Transform ===");
  const headerMiddleware = ExpressMung.headers((req, res) => {
    console.log('Adding custom headers...');
    res.setHeader = (name: string, value: string) => {
      console.log(`  Header: ${name} = ${value}`);
    };
    res.setHeader('X-Request-Id', req.id);
    res.setHeader('X-Powered-By', 'Elide');
  });

  headerMiddleware(mockReq, mockRes, () => {
    console.log('Headers added');
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Response formatting");
  console.log("- Data sanitization");
  console.log("- Header injection");
  console.log("- Logging and monitoring");
  console.log("- ~50K+ downloads/week on npm!");
}
