/**
 * express-request-id - Request ID Middleware
 *
 * Express middleware for generating and tracking request IDs.
 * **POLYGLOT SHOWCASE**: Request tracking for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/express-request-id (~50K+ downloads/week)
 *
 * Features:
 * - Automatic request ID generation
 * - Custom ID generators
 * - Header extraction
 * - Response header injection
 * - UUID support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Track requests across all services
 * - ONE request ID format on Elide
 * - End-to-end request tracking
 * - Language-agnostic
 *
 * Use cases:
 * - Request tracking
 * - Distributed logging
 * - Debugging
 * - Audit trails
 *
 * Package has ~50K+ downloads/week on npm!
 */

interface RequestIdOptions {
  headerName?: string;
  attributeName?: string;
  generator?: () => string;
  setHeader?: boolean;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function expressRequestId(options: RequestIdOptions = {}) {
  const {
    headerName = 'X-Request-Id',
    attributeName = 'id',
    generator = generateUUID,
    setHeader = true,
  } = options;

  return function requestIdMiddleware(req: any, res: any, next: any) {
    let requestId = req.headers[headerName.toLowerCase()];

    if (!requestId) {
      requestId = generator();
    }

    req[attributeName] = requestId;

    if (setHeader) {
      res.setHeader(headerName, requestId);
    }

    console.log(`[RequestId] ${req.method} ${req.url} - ID: ${requestId}`);

    next();
  };
}

export { expressRequestId, generateUUID, RequestIdOptions };
export default expressRequestId;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔖 express-request-id - Request Tracking (POLYGLOT!)\n");

  console.log("=== Generate Request IDs ===");
  console.log('UUID 1:', generateUUID());
  console.log('UUID 2:', generateUUID());
  console.log('UUID 3:', generateUUID());
  console.log();

  console.log("=== Middleware Usage ===");
  const middleware = expressRequestId({
    headerName: 'X-Request-Id',
    attributeName: 'id',
    setHeader: true,
  });

  // Simulate requests
  const mockReq = {
    method: 'GET',
    url: '/api/users',
    headers: {},
  };

  const mockRes = {
    setHeader: (name: string, value: string) => {
      console.log(`  Set header: ${name} = ${value}`);
    },
  };

  middleware(mockReq, mockRes, () => {
    console.log(`  Request ID attached: ${mockReq.id}`);
  });
  console.log();

  console.log("=== Custom Generator ===");
  let counter = 1;
  const customMiddleware = expressRequestId({
    generator: () => `req-${counter++}`,
  });

  for (let i = 0; i < 3; i++) {
    const req = { method: 'POST', url: '/api/orders', headers: {} };
    const res = { setHeader: () => {} };
    customMiddleware(req, res, () => {});
  }
  console.log();

  console.log("=== Extract Existing ID ===");
  const reqWithId = {
    method: 'GET',
    url: '/api/products',
    headers: { 'x-request-id': 'existing-id-123' },
  };

  middleware(reqWithId, mockRes, () => {
    console.log(`  Reused existing ID: ${reqWithId.id}`);
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Request tracking across services");
  console.log("- Distributed logging");
  console.log("- Debugging and troubleshooting");
  console.log("- Audit trails");
  console.log("- ~50K+ downloads/week on npm!");
}
