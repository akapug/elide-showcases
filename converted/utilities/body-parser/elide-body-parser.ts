/**
 * Elide Body Parser - Universal Request Body Parser
 *
 * Parse HTTP request bodies (JSON, URL-encoded, text, raw) across all languages.
 * Compatible with Express.js and other web frameworks.
 */

export interface BodyParserOptions {
  limit?: string | number;
  strict?: boolean;
  type?: string | string[] | ((req: any) => boolean);
  verify?: (req: any, res: any, buf: Buffer, encoding: string) => void;
}

export interface JsonOptions extends BodyParserOptions {
  reviver?: (key: string, value: any) => any;
}

export interface UrlEncodedOptions extends BodyParserOptions {
  extended?: boolean;
  parameterLimit?: number;
}

// Parse size strings like '100kb', '1mb' to bytes
function parseSize(size: string | number): number {
  if (typeof size === 'number') return size;

  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };

  const match = size.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i);
  if (!match) return 100 * 1024; // Default 100kb

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'b').toLowerCase();
  return value * units[unit];
}

// Check content type
function typeMatches(req: any, type: string | string[] | ((req: any) => boolean)): boolean {
  const contentType = req.headers?.['content-type'] || '';

  if (typeof type === 'function') {
    return type(req);
  }

  if (Array.isArray(type)) {
    return type.some(t => contentType.includes(t));
  }

  return contentType.includes(type);
}

// JSON body parser
export function json(options: JsonOptions = {}): (req: any, res: any, next: () => void) => void {
  const limit = parseSize(options.limit || '100kb');
  const strict = options.strict !== false;
  const type = options.type || 'application/json';

  return (req: any, res: any, next: () => void) => {
    if (!typeMatches(req, type)) {
      return next();
    }

    if (req.body !== undefined) {
      return next();
    }

    let body = '';
    let size = 0;

    req.on?.('data', (chunk: any) => {
      size += chunk.length;
      if (size > limit) {
        const error: any = new Error('Request entity too large');
        error.status = 413;
        error.statusCode = 413;
        throw error;
      }
      body += chunk.toString('utf8');
    });

    req.on?.('end', () => {
      try {
        if (body === '') {
          req.body = {};
        } else {
          const parsed = JSON.parse(body, options.reviver);
          if (strict && typeof parsed !== 'object') {
            throw new Error('JSON must be object or array');
          }
          req.body = parsed;
        }
        next();
      } catch (error: any) {
        error.status = 400;
        error.statusCode = 400;
        throw error;
      }
    });
  };
}

// URL-encoded body parser
export function urlencoded(options: UrlEncodedOptions = {}): (req: any, res: any, next: () => void) => void {
  const limit = parseSize(options.limit || '100kb');
  const extended = options.extended !== false;
  const type = options.type || 'application/x-www-form-urlencoded';

  return (req: any, res: any, next: () => void) => {
    if (!typeMatches(req, type)) {
      return next();
    }

    if (req.body !== undefined) {
      return next();
    }

    let body = '';
    let size = 0;

    req.on?.('data', (chunk: any) => {
      size += chunk.length;
      if (size > limit) {
        const error: any = new Error('Request entity too large');
        error.status = 413;
        error.statusCode = 413;
        throw error;
      }
      body += chunk.toString('utf8');
    });

    req.on?.('end', () => {
      try {
        req.body = parseUrlEncoded(body, extended);
        next();
      } catch (error: any) {
        error.status = 400;
        error.statusCode = 400;
        throw error;
      }
    });
  };
}

// Parse URL-encoded data
function parseUrlEncoded(body: string, extended: boolean): Record<string, any> {
  const params = new URLSearchParams(body);
  const result: Record<string, any> = {};

  for (const [key, value] of params.entries()) {
    if (extended && key.includes('[')) {
      // Handle nested parameters like user[name]=John
      const match = key.match(/^([^\[]+)\[([^\]]*)\]$/);
      if (match) {
        const [, parentKey, childKey] = match;
        if (!result[parentKey]) {
          result[parentKey] = childKey ? {} : [];
        }
        if (childKey) {
          result[parentKey][childKey] = value;
        } else {
          (result[parentKey] as any[]).push(value);
        }
        continue;
      }
    }

    if (result[key] !== undefined) {
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Text body parser
export function text(options: BodyParserOptions = {}): (req: any, res: any, next: () => void) => void {
  const limit = parseSize(options.limit || '100kb');
  const type = options.type || 'text/plain';

  return (req: any, res: any, next: () => void) => {
    if (!typeMatches(req, type)) {
      return next();
    }

    if (req.body !== undefined) {
      return next();
    }

    let body = '';
    let size = 0;

    req.on?.('data', (chunk: any) => {
      size += chunk.length;
      if (size > limit) {
        const error: any = new Error('Request entity too large');
        error.status = 413;
        error.statusCode = 413;
        throw error;
      }
      body += chunk.toString('utf8');
    });

    req.on?.('end', () => {
      req.body = body;
      next();
    });
  };
}

// Raw body parser
export function raw(options: BodyParserOptions = {}): (req: any, res: any, next: () => void) => void {
  const limit = parseSize(options.limit || '100kb');
  const type = options.type || 'application/octet-stream';

  return (req: any, res: any, next: () => void) => {
    if (!typeMatches(req, type)) {
      return next();
    }

    if (req.body !== undefined) {
      return next();
    }

    const chunks: any[] = [];
    let size = 0;

    req.on?.('data', (chunk: any) => {
      size += chunk.length;
      if (size > limit) {
        const error: any = new Error('Request entity too large');
        error.status = 413;
        error.statusCode = 413;
        throw error;
      }
      chunks.push(chunk);
    });

    req.on?.('end', () => {
      req.body = Buffer.concat(chunks);
      next();
    });
  };
}

// Export all parsers as default object
export default {
  json,
  urlencoded,
  text,
  raw
};

// Demo
if (import.meta.main) {
  console.log('=== Elide Body Parser Demo ===\n');

  // Example 1: JSON parsing
  console.log('1. JSON parsing:');
  const jsonData = '{"name":"John","age":30,"email":"john@example.com"}';
  const parsedJson = JSON.parse(jsonData);
  console.log('   Parsed:', parsedJson);
  console.log('');

  // Example 2: URL-encoded parsing (simple)
  console.log('2. URL-encoded parsing (simple):');
  const urlEncodedSimple = 'name=John&age=30&email=john@example.com';
  const parsedSimple = parseUrlEncoded(urlEncodedSimple, false);
  console.log('   Parsed:', parsedSimple);
  console.log('');

  // Example 3: URL-encoded parsing (extended)
  console.log('3. URL-encoded parsing (extended):');
  const urlEncodedExtended = 'user[name]=John&user[email]=john@example.com&tags[]=javascript&tags[]=typescript';
  const parsedExtended = parseUrlEncoded(urlEncodedExtended, true);
  console.log('   Parsed:', parsedExtended);
  console.log('');

  // Example 4: Size parsing
  console.log('4. Size parsing:');
  console.log('   100kb =', parseSize('100kb'), 'bytes');
  console.log('   1mb =', parseSize('1mb'), 'bytes');
  console.log('   5mb =', parseSize('5mb'), 'bytes');
  console.log('');

  // Example 5: Multiple values for same key
  console.log('5. Multiple values for same key:');
  const multiValue = 'color=red&color=blue&color=green';
  const parsedMulti = parseUrlEncoded(multiValue, false);
  console.log('   Parsed:', parsedMulti);
  console.log('');

  console.log('✓ All examples completed successfully!');
  console.log('\nNote: Middleware examples require an HTTP server context.');
  console.log('Use with Express.js or similar frameworks:');
  console.log('  app.use(bodyParser.json());');
  console.log('  app.use(bodyParser.urlencoded({ extended: true }));');
}
