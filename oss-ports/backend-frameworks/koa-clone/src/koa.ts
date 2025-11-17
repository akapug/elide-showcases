/**
 * Koa Clone - Middleware-focused web framework for Elide
 *
 * A production-ready implementation of Koa's elegant middleware composition
 * using Elide's runtime. Features context-based API and async/await first design.
 */

import { serve } from 'node:http';
import { EventEmitter } from 'node:events';

// ==================== TYPE DEFINITIONS ====================

export interface Middleware {
  (ctx: Context, next: () => Promise<void>): Promise<void> | void;
}

export interface Context {
  // Request properties
  request: Request;
  req: any; // Raw Node request
  method: string;
  url: string;
  path: string;
  query: Record<string, string | string[]>;
  querystring: string;
  search: string;
  host: string;
  hostname: string;
  href: string;
  origin: string;
  protocol: string;
  headers: Record<string, string | string[] | undefined>;
  header: Record<string, string | string[] | undefined>;
  ip: string;
  ips: string[];
  subdomains: string[];

  // Request methods
  get(field: string): string | string[] | undefined;
  is(...types: string[]): string | false;
  accepts(...types: string[]): string | false | string[];
  acceptsEncodings(...encodings: string[]): string | false;
  acceptsCharsets(...charsets: string[]): string | false;
  acceptsLanguages(...langs: string[]): string | false;

  // Response properties
  response: Response;
  res: any; // Raw Node response
  body: any;
  status: number;
  message: string;
  length: number | undefined;
  type: string;
  headerSent: boolean;
  lastModified: Date | string | undefined;
  etag: string | undefined;

  // Response methods
  set(field: string, val: string | number | string[]): void;
  set(fields: Record<string, string | number | string[]>): void;
  append(field: string, val: string | string[]): void;
  remove(field: string): void;
  redirect(url: string, alt?: string): void;
  attachment(filename?: string): void;

  // Helpers
  throw(status: number, message?: string, properties?: any): never;
  throw(message: string, status?: number, properties?: any): never;
  assert(value: any, status: number, message?: string, properties?: any): void;
  assert(value: any, message: string, status?: number, properties?: any): void;

  // State
  state: Record<string, any>;

  // App reference
  app: Application;

  // Cookies
  cookies: Cookies;

  // Extensions
  [key: string]: any;
}

export interface Request {
  method: string;
  url: string;
  path: string;
  query: Record<string, string | string[]>;
  querystring: string;
  search: string;
  host: string;
  hostname: string;
  href: string;
  origin: string;
  protocol: string;
  headers: Record<string, string | string[] | undefined>;
  header: Record<string, string | string[] | undefined>;
  ip: string;
  ips: string[];
  subdomains: string[];
  body?: any;
  rawBody?: string;

  get(field: string): string | string[] | undefined;
  is(...types: string[]): string | false;
  accepts(...types: string[]): string | false | string[];
  acceptsEncodings(...encodings: string[]): string | false;
  acceptsCharsets(...charsets: string[]): string | false;
  acceptsLanguages(...langs: string[]): string | false;
}

export interface Response {
  status: number;
  message: string;
  body: any;
  length: number | undefined;
  type: string;
  headerSent: boolean;
  lastModified: Date | string | undefined;
  etag: string | undefined;
  headers: Record<string, string | number | string[]>;

  get(field: string): string | number | string[] | undefined;
  set(field: string, val: string | number | string[]): void;
  set(fields: Record<string, string | number | string[]>): void;
  append(field: string, val: string | string[]): void;
  remove(field: string): void;
  redirect(url: string, alt?: string): void;
  attachment(filename?: string): void;
}

export interface Cookies {
  get(name: string, options?: { signed?: boolean }): string | undefined;
  set(name: string, value: string | null, options?: CookieOptions): void;
}

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  signed?: boolean;
  overwrite?: boolean;
}

export interface ApplicationOptions {
  env?: string;
  keys?: string[];
  proxy?: boolean;
  subdomainOffset?: number;
  proxyIpHeader?: string;
  maxIpsCount?: number;
}

export interface ListenOptions {
  port: number;
  host?: string;
  backlog?: number;
}

// ==================== HTTP ERROR ====================

export class HttpError extends Error {
  status: number;
  statusCode: number;
  expose: boolean;

  constructor(status: number = 500, message?: string, properties?: any) {
    super(message || `HTTP Error ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusCode = status;
    this.expose = status < 500;

    if (properties) {
      Object.assign(this, properties);
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

// ==================== COOKIES IMPLEMENTATION ====================

class CookiesImpl implements Cookies {
  private ctx: Context;
  private keys?: string[];

  constructor(ctx: Context, keys?: string[]) {
    this.ctx = ctx;
    this.keys = keys;
  }

  get(name: string, options: { signed?: boolean } = {}): string | undefined {
    const cookieHeader = this.ctx.headers['cookie'];
    if (!cookieHeader) return undefined;

    const cookies = this.parseCookies(cookieHeader as string);
    return cookies[name];
  }

  set(name: string, value: string | null, options: CookieOptions = {}): void {
    const {
      maxAge,
      expires,
      path = '/',
      domain,
      secure,
      httpOnly = true,
      sameSite,
      overwrite = false
    } = options;

    let cookie = `${name}=${value || ''}`;

    if (maxAge !== undefined) {
      cookie += `; Max-Age=${Math.floor(maxAge / 1000)}`;
    }

    if (expires) {
      cookie += `; Expires=${expires.toUTCString()}`;
    }

    cookie += `; Path=${path}`;

    if (domain) {
      cookie += `; Domain=${domain}`;
    }

    if (secure) {
      cookie += '; Secure';
    }

    if (httpOnly) {
      cookie += '; HttpOnly';
    }

    if (sameSite) {
      cookie += `; SameSite=${sameSite.charAt(0).toUpperCase() + sameSite.slice(1)}`;
    }

    this.ctx.append('Set-Cookie', cookie);
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.split('=');
      const trimmedName = name.trim();
      if (trimmedName) {
        cookies[trimmedName] = rest.join('=').trim();
      }
    });

    return cookies;
  }
}

// ==================== REQUEST IMPLEMENTATION ====================

class RequestImpl implements Request {
  method: string;
  url: string;
  path: string;
  query: Record<string, string | string[]> = {};
  querystring: string = '';
  search: string = '';
  host: string = '';
  hostname: string = '';
  href: string = '';
  origin: string = '';
  protocol: string = 'http';
  headers: Record<string, string | string[] | undefined> = {};
  header: Record<string, string | string[] | undefined> = {};
  ip: string = '';
  ips: string[] = [];
  subdomains: string[] = [];
  body?: any;
  rawBody?: string;

  private req: any;
  private app: Application;

  constructor(req: any, app: Application) {
    this.req = req;
    this.app = app;
    this.method = req.method || 'GET';
    this.url = req.url || '/';
    this.headers = req.headers || {};
    this.header = this.headers;

    // Parse URL
    this.parseUrl();

    // Parse IP
    this.parseIp();

    // Parse host
    this.parseHost();
  }

  private parseUrl(): void {
    const url = new URL(this.url, `http://${this.host || 'localhost'}`);
    this.path = url.pathname;
    this.querystring = url.search.substring(1);
    this.search = url.search;

    // Parse query params
    this.query = {};
    url.searchParams.forEach((value, key) => {
      if (this.query[key]) {
        const existing = this.query[key];
        this.query[key] = Array.isArray(existing) ? [...existing, value] : [existing as string, value];
      } else {
        this.query[key] = value;
      }
    });
  }

  private parseIp(): void {
    if (this.app.proxy) {
      const proxyHeader = this.app.proxyIpHeader;
      const ips = this.headers[proxyHeader] as string;

      if (ips) {
        this.ips = ips.split(',').map(ip => ip.trim()).slice(0, this.app.maxIpsCount);
        this.ip = this.ips[0] || '';
      }
    }

    if (!this.ip) {
      this.ip = this.headers['x-forwarded-for'] as string ||
                this.headers['x-real-ip'] as string ||
                '127.0.0.1';
    }
  }

  private parseHost(): void {
    const hostHeader = this.headers['host'] as string;
    if (hostHeader) {
      this.host = hostHeader;
      this.hostname = hostHeader.split(':')[0];

      const parts = this.hostname.split('.');
      const offset = this.app.subdomainOffset;
      this.subdomains = parts.length > offset ? parts.slice(0, -offset) : [];
    }

    this.protocol = this.headers['x-forwarded-proto'] as string || 'http';
    this.origin = `${this.protocol}://${this.host}`;
    this.href = `${this.origin}${this.url}`;
  }

  get(field: string): string | string[] | undefined {
    return this.headers[field.toLowerCase()];
  }

  is(...types: string[]): string | false {
    const contentType = this.headers['content-type'] as string || '';

    for (const type of types) {
      if (contentType.includes(type)) {
        return type;
      }
    }

    return false;
  }

  accepts(...types: string[]): string | false | string[] {
    const accept = this.headers['accept'] as string || '*/*';

    if (types.length === 0) return accept.split(',').map(t => t.trim());

    for (const type of types) {
      if (accept.includes(type) || accept.includes('*/*')) {
        return type;
      }
    }

    return false;
  }

  acceptsEncodings(...encodings: string[]): string | false {
    const acceptEncoding = this.headers['accept-encoding'] as string || '';

    for (const encoding of encodings) {
      if (acceptEncoding.includes(encoding)) {
        return encoding;
      }
    }

    return false;
  }

  acceptsCharsets(...charsets: string[]): string | false {
    const acceptCharset = this.headers['accept-charset'] as string || '';

    for (const charset of charsets) {
      if (acceptCharset.includes(charset)) {
        return charset;
      }
    }

    return false;
  }

  acceptsLanguages(...langs: string[]): string | false {
    const acceptLanguage = this.headers['accept-language'] as string || '';

    for (const lang of langs) {
      if (acceptLanguage.includes(lang)) {
        return lang;
      }
    }

    return false;
  }
}

// ==================== RESPONSE IMPLEMENTATION ====================

class ResponseImpl implements Response {
  status: number = 200;
  message: string = 'OK';
  body: any = null;
  length: number | undefined;
  type: string = 'text/plain';
  headerSent: boolean = false;
  lastModified: Date | string | undefined;
  etag: string | undefined;
  headers: Record<string, string | number | string[]> = {};

  private res: any;

  constructor(res: any) {
    this.res = res;
  }

  get(field: string): string | number | string[] | undefined {
    return this.headers[field.toLowerCase()];
  }

  set(fieldOrFields: string | Record<string, string | number | string[]>, val?: string | number | string[]): void {
    if (typeof fieldOrFields === 'object') {
      Object.keys(fieldOrFields).forEach(key => {
        this.headers[key.toLowerCase()] = fieldOrFields[key];
      });
    } else {
      this.headers[fieldOrFields.toLowerCase()] = val!;
    }
  }

  append(field: string, val: string | string[]): void {
    const existing = this.headers[field.toLowerCase()];

    if (existing) {
      const values = Array.isArray(existing) ? existing : [existing.toString()];
      const newValues = Array.isArray(val) ? val : [val];
      this.headers[field.toLowerCase()] = [...values, ...newValues];
    } else {
      this.headers[field.toLowerCase()] = val;
    }
  }

  remove(field: string): void {
    delete this.headers[field.toLowerCase()];
  }

  redirect(url: string, alt?: string): void {
    this.status = 302;
    this.set('Location', url);

    if (alt) {
      this.body = `Redirecting to <a href="${url}">${url}</a>`;
      this.type = 'text/html';
    }
  }

  attachment(filename?: string): void {
    if (filename) {
      this.set('Content-Disposition', `attachment; filename="${filename}"`);
      const ext = filename.split('.').pop()?.toLowerCase();
      this.type = this.getMimeType(ext || '');
    } else {
      this.set('Content-Disposition', 'attachment');
    }
  }

  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'txt': 'text/plain'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}

// ==================== CONTEXT IMPLEMENTATION ====================

class ContextImpl implements Context {
  request: Request;
  req: any;
  response: Response;
  res: any;
  app: Application;
  state: Record<string, any> = {};
  cookies: Cookies;

  constructor(req: any, res: any, app: Application) {
    this.req = req;
    this.res = res;
    this.app = app;
    this.request = new RequestImpl(req, app);
    this.response = new ResponseImpl(res);
    this.cookies = new CookiesImpl(this, app.keys);
  }

  // Request delegated properties
  get method(): string { return this.request.method; }
  get url(): string { return this.request.url; }
  get path(): string { return this.request.path; }
  get query(): Record<string, string | string[]> { return this.request.query; }
  get querystring(): string { return this.request.querystring; }
  get search(): string { return this.request.search; }
  get host(): string { return this.request.host; }
  get hostname(): string { return this.request.hostname; }
  get href(): string { return this.request.href; }
  get origin(): string { return this.request.origin; }
  get protocol(): string { return this.request.protocol; }
  get headers(): Record<string, string | string[] | undefined> { return this.request.headers; }
  get header(): Record<string, string | string[] | undefined> { return this.request.header; }
  get ip(): string { return this.request.ip; }
  get ips(): string[] { return this.request.ips; }
  get subdomains(): string[] { return this.request.subdomains; }

  // Request delegated methods
  get(field: string): string | string[] | undefined {
    return this.request.get(field);
  }

  is(...types: string[]): string | false {
    return this.request.is(...types);
  }

  accepts(...types: string[]): string | false | string[] {
    return this.request.accepts(...types);
  }

  acceptsEncodings(...encodings: string[]): string | false {
    return this.request.acceptsEncodings(...encodings);
  }

  acceptsCharsets(...charsets: string[]): string | false {
    return this.request.acceptsCharsets(...charsets);
  }

  acceptsLanguages(...langs: string[]): string | false {
    return this.request.acceptsLanguages(...langs);
  }

  // Response delegated properties
  get body(): any { return this.response.body; }
  set body(val: any) { this.response.body = val; }

  get status(): number { return this.response.status; }
  set status(code: number) { this.response.status = code; }

  get message(): string { return this.response.message; }
  set message(msg: string) { this.response.message = msg; }

  get length(): number | undefined { return this.response.length; }
  set length(len: number | undefined) { this.response.length = len; }

  get type(): string { return this.response.type; }
  set type(type: string) { this.response.type = type; }

  get headerSent(): boolean { return this.response.headerSent; }

  get lastModified(): Date | string | undefined { return this.response.lastModified; }
  set lastModified(val: Date | string | undefined) { this.response.lastModified = val; }

  get etag(): string | undefined { return this.response.etag; }
  set etag(val: string | undefined) { this.response.etag = val; }

  // Response delegated methods
  set(fieldOrFields: string | Record<string, string | number | string[]>, val?: string | number | string[]): void {
    if (typeof fieldOrFields === 'object') {
      this.response.set(fieldOrFields);
    } else {
      this.response.set(fieldOrFields, val!);
    }
  }

  append(field: string, val: string | string[]): void {
    this.response.append(field, val);
  }

  remove(field: string): void {
    this.response.remove(field);
  }

  redirect(url: string, alt?: string): void {
    this.response.redirect(url, alt);
  }

  attachment(filename?: string): void {
    this.response.attachment(filename);
  }

  // Helper methods
  throw(statusOrMessage: number | string, messageOrStatus?: string | number, properties?: any): never {
    let status: number;
    let message: string | undefined;

    if (typeof statusOrMessage === 'number') {
      status = statusOrMessage;
      message = typeof messageOrStatus === 'string' ? messageOrStatus : undefined;
    } else {
      message = statusOrMessage;
      status = typeof messageOrStatus === 'number' ? messageOrStatus : 500;
    }

    throw new HttpError(status, message, properties);
  }

  assert(value: any, statusOrMessage: number | string, messageOrStatus?: string | number, properties?: any): void {
    if (!value) {
      this.throw(statusOrMessage as any, messageOrStatus as any, properties);
    }
  }
}

// ==================== APPLICATION ====================

export class Application extends EventEmitter {
  middleware: Middleware[] = [];
  context: Partial<Context> = {};
  request: Partial<Request> = {};
  response: Partial<Response> = {};

  env: string = process.env.NODE_ENV || 'development';
  keys?: string[];
  proxy: boolean = false;
  subdomainOffset: number = 2;
  proxyIpHeader: string = 'x-forwarded-for';
  maxIpsCount: number = 0;

  private server: any = null;

  constructor(options: ApplicationOptions = {}) {
    super();

    this.env = options.env || this.env;
    this.keys = options.keys;
    this.proxy = options.proxy || false;
    this.subdomainOffset = options.subdomainOffset || 2;
    this.proxyIpHeader = options.proxyIpHeader || 'x-forwarded-for';
    this.maxIpsCount = options.maxIpsCount || 0;
  }

  // ==================== MIDDLEWARE ====================

  use(fn: Middleware): this {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be a function');
    }

    this.middleware.push(fn);
    return this;
  }

  // ==================== SERVER ====================

  listen(portOrOptions: number | ListenOptions, callback?: () => void): any {
    const options = typeof portOrOptions === 'number'
      ? { port: portOrOptions }
      : portOrOptions;

    const { port, host = '0.0.0.0', backlog } = options;

    this.server = serve(
      { port, hostname: host },
      async (req: any, res: any) => {
        await this.handleRequest(req, res);
      }
    );

    const address = `http://${host}:${port}`;
    console.log(`Server listening on ${address}`);

    if (callback) {
      callback();
    }

    return this.server;
  }

  // ==================== REQUEST HANDLING ====================

  private async handleRequest(req: any, res: any): Promise<void> {
    const ctx = this.createContext(req, res);

    try {
      // Parse body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(ctx.method)) {
        await this.parseBody(req, ctx.request);
      }

      // Execute middleware chain
      await this.handleMiddleware(ctx);

      // Send response
      this.respond(ctx);
    } catch (err) {
      this.handleError(err as Error, ctx);
    }
  }

  private createContext(req: any, res: any): Context {
    const context = new ContextImpl(req, res, this);

    // Copy custom properties
    Object.assign(context, this.context);
    Object.assign(context.request, this.request);
    Object.assign(context.response, this.response);

    return context;
  }

  private async handleMiddleware(ctx: Context): Promise<void> {
    const fn = this.compose(this.middleware);
    await fn(ctx);
  }

  private compose(middleware: Middleware[]): (ctx: Context) => Promise<void> {
    return async (ctx: Context) => {
      let index = -1;

      const dispatch = async (i: number): Promise<void> => {
        if (i <= index) {
          throw new Error('next() called multiple times');
        }

        index = i;

        if (i === middleware.length) return;

        const fn = middleware[i];

        try {
          await fn(ctx, () => dispatch(i + 1));
        } catch (err) {
          throw err;
        }
      };

      await dispatch(0);
    };
  }

  private async parseBody(req: any, request: Request): Promise<void> {
    return new Promise((resolve, reject) => {
      let data = '';

      req.on('data', (chunk: any) => {
        data += chunk.toString();
      });

      req.on('end', () => {
        try {
          request.rawBody = data;

          const contentType = request.headers['content-type'] as string || '';

          if (contentType.includes('application/json')) {
            request.body = data ? JSON.parse(data) : {};
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            request.body = this.parseFormData(data);
          } else {
            request.body = data;
          }

          resolve();
        } catch (err) {
          reject(err);
        }
      });

      req.on('error', reject);
    });
  }

  private parseFormData(data: string): Record<string, string> {
    const result: Record<string, string> = {};
    const params = new URLSearchParams(data);

    for (const [key, value] of params) {
      result[key] = value;
    }

    return result;
  }

  private respond(ctx: Context): void {
    const { res, response, status, body } = ctx;

    // Set status
    res.statusCode = status;

    // Set headers
    for (const [key, value] of Object.entries(response.headers)) {
      res.setHeader(key, value);
    }

    // Handle body
    if (body === null || body === undefined) {
      if (!response.headers['content-type']) {
        res.setHeader('Content-Type', 'text/plain');
      }
      res.end();
      return;
    }

    if (typeof body === 'string') {
      if (!response.headers['content-type']) {
        res.setHeader('Content-Type', 'text/plain');
      }
      res.end(body);
    } else if (Buffer.isBuffer(body)) {
      if (!response.headers['content-type']) {
        res.setHeader('Content-Type', 'application/octet-stream');
      }
      res.end(body);
    } else if (typeof body === 'object') {
      if (!response.headers['content-type']) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(body));
    } else {
      res.end(String(body));
    }

    response.headerSent = true;
  }

  private handleError(err: Error, ctx: Context): void {
    const error = err as HttpError;

    // Emit error event
    this.emit('error', error, ctx);

    // Send error response
    const status = error.status || error.statusCode || 500;
    const message = error.expose ? error.message : 'Internal Server Error';

    ctx.status = status;
    ctx.body = {
      error: true,
      status,
      message
    };

    this.respond(ctx);
  }

  // ==================== CALLBACK FOR NODE HTTP ====================

  callback(): (req: any, res: any) => Promise<void> {
    return async (req: any, res: any) => {
      await this.handleRequest(req, res);
    };
  }
}

// ==================== FACTORY FUNCTION ====================

export default function koa(options?: ApplicationOptions): Application {
  return new Application(options);
}

export { koa };
