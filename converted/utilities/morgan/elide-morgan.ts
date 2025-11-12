/**
 * Elide Morgan - Universal HTTP Request Logger
 *
 * HTTP request logging middleware across all languages.
 * Compatible with Express.js and other web frameworks.
 */

export type FormatFunction = (tokens: TokensObject, req: any, res: any) => string;
export type FormatString = string;
export type Format = FormatString | FormatFunction;

export interface TokensObject {
  [key: string]: (req: any, res: any) => string | undefined;
}

export interface MorganOptions {
  immediate?: boolean;
  skip?: (req: any, res: any) => boolean;
  stream?: { write: (str: string) => void };
}

// Built-in tokens
const tokens: TokensObject = {
  method: (req) => req.method,
  url: (req) => req.url || req.path,
  status: (req, res) => String(res.statusCode || 0),
  'response-time': (req, res) => {
    if (!req._startAt || !res._startAt) return '-';
    const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
               (res._startAt[1] - req._startAt[1]) / 1000000;
    return ms.toFixed(3);
  },
  date: () => new Date().toUTCString(),
  'http-version': (req) => `${req.httpVersionMajor || 1}.${req.httpVersionMinor || 1}`,
  'remote-addr': (req) => req.ip || req.socket?.remoteAddress || '-',
  'remote-user': (req) => req.user || '-',
  referrer: (req) => req.headers?.referer || req.headers?.referrer || '-',
  'user-agent': (req) => req.headers?.['user-agent'] || '-',
  'content-length': (req, res) => {
    const length = res.getHeader?.('content-length') || res.headers?.['content-length'];
    return length ? String(length) : '-';
  },
  'req': (req) => (key: string) => req.headers?.[key.toLowerCase()] || '-',
  'res': (req, res) => (key: string) => res.getHeader?.(key) || res.headers?.[key] || '-'
};

// Predefined formats
const formats: Record<string, string> = {
  combined: ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :content-length ":referrer" ":user-agent"',
  common: ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :content-length',
  dev: ':method :url :status :response-time ms - :content-length',
  short: ':remote-addr :remote-user :method :url HTTP/:http-version :status :content-length - :response-time ms',
  tiny: ':method :url :status :content-length - :response-time ms'
};

// Compile format string to function
function compile(format: Format): FormatFunction {
  if (typeof format === 'function') {
    return format;
  }

  // Get predefined format or use custom format
  const formatString = formats[format] || format;

  return (tokenFuncs: TokensObject, req: any, res: any): string => {
    return formatString.replace(/:(\w+(?:\[[\w-]+\])?)/g, (match, token) => {
      // Handle token with parameter like :req[accept]
      const paramMatch = token.match(/^(\w+)\[([\w-]+)\]$/);
      if (paramMatch) {
        const [, tokenName, param] = paramMatch;
        const tokenFunc = tokenFuncs[tokenName];
        if (tokenFunc) {
          const result = tokenFunc(req, res);
          return typeof result === 'function' ? result(param) : '-';
        }
        return '-';
      }

      // Regular token
      const tokenFunc = tokenFuncs[token];
      return tokenFunc ? (tokenFunc(req, res) || '-') : '-';
    });
  };
}

// Morgan logger factory
export function morgan(format: Format = 'combined', options: MorganOptions = {}) {
  const formatFunc = compile(format);
  const immediate = options.immediate || false;
  const skip = options.skip || (() => false);
  const stream = options.stream || { write: (str: string) => console.log(str.trim()) };

  return (req: any, res: any, next: () => void) => {
    // Skip logging if skip function returns true
    if (skip(req, res)) {
      return next();
    }

    // Record start time
    req._startAt = process.hrtime?.() || [Date.now() / 1000, 0];

    // Log immediately if requested
    if (immediate) {
      const line = formatFunc(tokens, req, res);
      stream.write(line + '\n');
    }

    // Record finish time and log
    const logFn = () => {
      res._startAt = process.hrtime?.() || [Date.now() / 1000, 0];
      const line = formatFunc(tokens, req, res);
      stream.write(line + '\n');
    };

    // Attach to response finish event
    if (!immediate) {
      res.on?.('finish', logFn);
      res.on?.('close', logFn);
    }

    next();
  };
}

// Add custom token
export function token(name: string, fn: (req: any, res: any) => string | undefined) {
  tokens[name] = fn;
}

// Export default
export default morgan;

// Demo
if (import.meta.main) {
  console.log('=== Elide Morgan Demo ===\n');

  // Mock request/response
  const createMockReq = (method: string, url: string) => ({
    method,
    url,
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    headers: {
      'user-agent': 'Mozilla/5.0',
      'referer': 'https://example.com'
    },
    ip: '127.0.0.1',
    _startAt: [Date.now() / 1000, 0]
  });

  const createMockRes = (statusCode: number) => ({
    statusCode,
    headers: { 'content-length': '1234' },
    getHeader: (name: string) => ({ 'content-length': '1234' }[name]),
    _startAt: [Date.now() / 1000 + 0.05, 50000000], // 50ms later
    on: (event: string, fn: () => void) => {}
  });

  // Example 1: Tiny format
  console.log('1. Tiny format:');
  const tinyFormat = compile('tiny');
  const req1 = createMockReq('GET', '/api/users');
  const res1 = createMockRes(200);
  console.log('   ' + tinyFormat(tokens, req1, res1));
  console.log('');

  // Example 2: Dev format
  console.log('2. Dev format:');
  const devFormat = compile('dev');
  const req2 = createMockReq('POST', '/api/users');
  const res2 = createMockRes(201);
  console.log('   ' + devFormat(tokens, req2, res2));
  console.log('');

  // Example 3: Common format
  console.log('3. Common format:');
  const commonFormat = compile('common');
  const req3 = createMockReq('DELETE', '/api/users/123');
  const res3 = createMockRes(204);
  console.log('   ' + commonFormat(tokens, req3, res3));
  console.log('');

  // Example 4: Custom format
  console.log('4. Custom format:');
  const customFormat = compile(':method :url -> :status in :response-time ms');
  const req4 = createMockReq('PUT', '/api/users/456');
  const res4 = createMockRes(200);
  console.log('   ' + customFormat(tokens, req4, res4));
  console.log('');

  // Example 5: Custom token
  console.log('5. Custom token:');
  token('request-id', (req) => req.headers?.['x-request-id'] || 'no-id');
  const customFormat2 = compile(':method :url [:request-id]');
  const req5 = createMockReq('GET', '/api/data');
  req5.headers['x-request-id'] = 'req-123-456';
  const res5 = createMockRes(200);
  console.log('   ' + customFormat2(tokens, req5, res5));
  console.log('');

  console.log('✓ All examples completed successfully!');
  console.log('\nUse with Express.js:');
  console.log('  app.use(morgan("combined"));');
  console.log('  app.use(morgan("dev"));');
  console.log('  app.use(morgan(":method :url :status"));');
}
