/**
 * Express Request - Enhanced HTTP Request
 *
 * Extends Node's IncomingMessage with Express-specific properties and methods:
 * - params: Route parameters
 * - query: Query string parameters
 * - body: Parsed request body (requires middleware)
 * - cookies: Parsed cookies (requires middleware)
 * - headers: Request headers
 * - get(): Get header value
 * - is(): Check content type
 * - accepts(): Content negotiation
 */

import { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { parse as parseQuery } from 'querystring';

/**
 * Request class extending IncomingMessage
 */
export class Request {
  // Original Node.js objects
  public req: IncomingMessage;
  public res: ServerResponse;
  public app: any;

  // Express-specific properties
  public params: { [key: string]: string } = {};
  public query: { [key: string]: any } = {};
  public body: any = {};
  public cookies: { [key: string]: string } = {};
  public signedCookies: { [key: string]: string } = {};
  public route?: any;
  public baseUrl: string = '';
  public originalUrl: string = '';
  public path: string = '';
  public fresh: boolean = false;
  public stale: boolean = true;
  public xhr: boolean = false;
  public ip?: string;
  public ips: string[] = [];
  public protocol: string = 'http';
  public secure: boolean = false;
  public subdomains: string[] = [];

  constructor(req: IncomingMessage, res: ServerResponse, app: any) {
    this.req = req;
    this.res = res;
    this.app = app;

    // Initialize properties from IncomingMessage
    this.originalUrl = req.url || '/';
    this.parseUrl();

    // Detect XHR requests
    this.xhr = this.get('X-Requested-With') === 'XMLHttpRequest';

    // Parse protocol
    const encrypted = (req.connection as any).encrypted;
    this.protocol = encrypted ? 'https' : 'http';
    this.secure = this.protocol === 'https';

    // Get IP address
    this.ip = req.socket.remoteAddress;
  }

  /**
   * Parse URL and query string
   */
  private parseUrl(): void {
    const url = parseUrl(this.originalUrl, true);
    this.path = url.pathname || '/';
    this.query = url.query as any;
  }

  /**
   * Get header value (case-insensitive)
   */
  public get(name: string): string | undefined {
    const lowerName = name.toLowerCase();

    switch (lowerName) {
      case 'referer':
      case 'referrer':
        return this.req.headers.referer || this.req.headers.referrer;
      default:
        const value = this.req.headers[lowerName];
        return Array.isArray(value) ? value[0] : value;
    }
  }

  /**
   * Alias for get()
   */
  public header(name: string): string | undefined {
    return this.get(name);
  }

  /**
   * Check if the request content type matches the given type(s)
   */
  public is(...types: string[]): string | false {
    const contentType = this.get('content-type');

    if (!contentType) {
      return false;
    }

    // Parse content type (remove charset)
    const ct = contentType.split(';')[0].trim().toLowerCase();

    for (const type of types) {
      const t = type.toLowerCase();

      // Exact match
      if (ct === t) {
        return type;
      }

      // Wildcard match
      if (t.includes('*')) {
        const pattern = t.replace('*', '.*');
        const regex = new RegExp('^' + pattern + '$');
        if (regex.test(ct)) {
          return type;
        }
      }

      // Shorthand types
      if (this.matchesShorthand(ct, t)) {
        return type;
      }
    }

    return false;
  }

  /**
   * Match content type shorthands
   */
  private matchesShorthand(contentType: string, type: string): boolean {
    const shorthands: { [key: string]: string } = {
      'json': 'application/json',
      'html': 'text/html',
      'xml': 'application/xml',
      'text': 'text/plain',
      'urlencoded': 'application/x-www-form-urlencoded',
      'multipart': 'multipart/form-data'
    };

    return contentType === shorthands[type];
  }

  /**
   * Check if the request accepts the given content type(s)
   * Returns the best match or false
   */
  public accepts(...types: string[]): string | false {
    const accept = this.get('accept');

    if (!accept || accept === '*/*') {
      return types[0] || false;
    }

    // Parse accept header
    const acceptedTypes = accept.split(',').map(t => {
      const parts = t.trim().split(';');
      return parts[0].trim().toLowerCase();
    });

    // Find best match
    for (const type of types) {
      const t = type.toLowerCase();

      for (const accepted of acceptedTypes) {
        if (accepted === t || accepted === '*/*') {
          return type;
        }

        // Check wildcard matches
        if (accepted.endsWith('/*')) {
          const prefix = accepted.slice(0, -2);
          if (t.startsWith(prefix + '/')) {
            return type;
          }
        }
      }
    }

    return false;
  }

  /**
   * Check if the request accepts the given charset(s)
   */
  public acceptsCharsets(...charsets: string[]): string | false {
    const accept = this.get('accept-charset');

    if (!accept) {
      return charsets[0] || false;
    }

    const accepted = accept.toLowerCase().split(',').map(c => c.trim());

    for (const charset of charsets) {
      if (accepted.includes(charset.toLowerCase()) || accepted.includes('*')) {
        return charset;
      }
    }

    return false;
  }

  /**
   * Check if the request accepts the given encoding(s)
   */
  public acceptsEncodings(...encodings: string[]): string | false {
    const accept = this.get('accept-encoding');

    if (!accept) {
      return encodings[0] || false;
    }

    const accepted = accept.toLowerCase().split(',').map(e => e.trim());

    for (const encoding of encodings) {
      if (accepted.includes(encoding.toLowerCase()) || accepted.includes('*')) {
        return encoding;
      }
    }

    return false;
  }

  /**
   * Check if the request accepts the given language(s)
   */
  public acceptsLanguages(...languages: string[]): string | false {
    const accept = this.get('accept-language');

    if (!accept) {
      return languages[0] || false;
    }

    const accepted = accept.toLowerCase().split(',').map(l => l.trim().split(';')[0]);

    for (const language of languages) {
      if (accepted.includes(language.toLowerCase()) || accepted.includes('*')) {
        return language;
      }
    }

    return false;
  }

  /**
   * Return the value of param `name` when present or `defaultValue`.
   * - Checks route placeholders (`req.params`), ex: /user/:id
   * - Checks query string params (`req.query`), ex: ?id=12
   * - Checks urlencoded body params (`req.body`), ex: id=12
   */
  public param(name: string, defaultValue?: any): any {
    if (this.params && this.params.hasOwnProperty(name)) {
      return this.params[name];
    }

    if (this.body && this.body.hasOwnProperty(name)) {
      return this.body[name];
    }

    if (this.query && this.query.hasOwnProperty(name)) {
      return this.query[name];
    }

    return defaultValue;
  }

  /**
   * Check if request is fresh (for caching)
   */
  public get isFresh(): boolean {
    const method = this.method;
    const status = this.res.statusCode;

    // GET or HEAD for success codes
    if ((method !== 'GET' && method !== 'HEAD') || (status < 200 || status >= 300)) {
      return false;
    }

    return this.fresh;
  }

  /**
   * Check if request is stale (for caching)
   */
  public get isStale(): boolean {
    return !this.isFresh;
  }

  /**
   * Get request method
   */
  public get method(): string {
    return this.req.method || 'GET';
  }

  /**
   * Get request URL
   */
  public get url(): string {
    return this.req.url || '/';
  }

  /**
   * Get request headers
   */
  public get headers(): any {
    return this.req.headers;
  }

  /**
   * Get HTTP version
   */
  public get httpVersion(): string {
    return this.req.httpVersion;
  }

  /**
   * Get hostname (without port)
   */
  public get hostname(): string {
    const host = this.get('host');

    if (!host) {
      return '';
    }

    // Remove port if present
    const colonIndex = host.indexOf(':');
    return colonIndex !== -1 ? host.substring(0, colonIndex) : host;
  }

  /**
   * Get host (with port)
   */
  public get host(): string {
    return this.get('host') || '';
  }

  /**
   * Parse Range header
   */
  public range(size: number, options?: any): any {
    const range = this.get('range');

    if (!range) {
      return undefined;
    }

    // Simple range parsing (can be extended)
    return { type: 'bytes', ranges: [] };
  }
}

export default Request;
