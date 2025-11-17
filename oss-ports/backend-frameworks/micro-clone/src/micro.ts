/**
 * Micro Clone - Async microservices framework for Elide
 *
 * Minimalist async HTTP microservices framework
 */

import { serve } from 'node:http';

export type Handler = (req: Request, res: Response) => any | Promise<any>;

export interface Request {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}

export interface Response {
  statusCode: number;
  setHeader(name: string, value: string | number): void;
  end(data?: any): void;
}

export interface MicroOptions {
  onError?: (err: Error) => any;
  onNoMatch?: (req: Request, res: Response) => any;
}

// Helper: send JSON
export function send(res: Response, code: number, data: any = null): void {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(data !== null ? JSON.stringify(data) : undefined);
}

// Helper: send error
export function sendError(res: Response, err: Error | { statusCode?: number; message: string }): void {
  const statusCode = (err as any).statusCode || 500;
  send(res, statusCode, {
    error: true,
    message: err.message,
    statusCode
  });
}

// Helper: parse JSON body
export async function json(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk: any) => {
      data += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

// Helper: parse text body
export async function text(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk: any) => {
      data += chunk.toString();
    });

    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Helper: parse buffer body
export async function buffer(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];

    req.on('data', (chunk: any) => {
      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Main micro function
export default function micro(handler: Handler, options: MicroOptions = {}) {
  return async (rawReq: any, rawRes: any) => {
    const req = rawReq as Request;
    const res = rawRes as Response;

    try {
      const result = await handler(req, res);

      // Auto-send result
      if (result !== undefined && result !== null) {
        if (typeof result === 'string') {
          res.setHeader('Content-Type', 'text/plain');
          res.end(result);
        } else if (Buffer.isBuffer(result)) {
          res.setHeader('Content-Type', 'application/octet-stream');
          res.end(result);
        } else {
          send(res, res.statusCode || 200, result);
        }
      }
    } catch (err: any) {
      if (options.onError) {
        const errorResponse = options.onError(err);
        if (errorResponse) {
          send(res, err.statusCode || 500, errorResponse);
        }
      } else {
        sendError(res, err);
      }
    }
  };
}

// Create server helper
export function listen(handler: Handler, port: number, host: string = '0.0.0.0'): any {
  const microHandler = micro(handler);

  const server = serve(
    { port, hostname: host },
    microHandler
  );

  console.log(`Micro server listening on http://${host}:${port}`);
  return server;
}

// Router helper
export class Router {
  routes: Map<string, Map<string, Handler>> = new Map();

  get(path: string, handler: Handler): this {
    this.add('GET', path, handler);
    return this;
  }

  post(path: string, handler: Handler): this {
    this.add('POST', path, handler);
    return this;
  }

  put(path: string, handler: Handler): this {
    this.add('PUT', path, handler);
    return this;
  }

  delete(path: string, handler: Handler): this {
    this.add('DELETE', path, handler);
    return this;
  }

  private add(method: string, path: string, handler: Handler): void {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)!.set(path, handler);
  }

  handler(): Handler {
    return async (req, res) => {
      const methodRoutes = this.routes.get(req.method);

      if (!methodRoutes) {
        return send(res, 404, { error: 'Not Found' });
      }

      const url = new URL(req.url, 'http://localhost');
      const handler = methodRoutes.get(url.pathname);

      if (!handler) {
        return send(res, 404, { error: 'Not Found' });
      }

      return handler(req, res);
    };
  }
}

export { micro };
