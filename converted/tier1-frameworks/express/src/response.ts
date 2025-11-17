/**
 * Express Response - Enhanced HTTP Response
 *
 * Extends Node's ServerResponse with Express-specific methods:
 * - json(): Send JSON response
 * - send(): Send various response types
 * - status(): Set status code (chainable)
 * - redirect(): Redirect to URL
 * - render(): Render template
 * - cookie(): Set cookies
 * - download(): Send file as download
 * - sendFile(): Send file
 */

import { IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

/**
 * Response class extending ServerResponse
 */
export class Response {
  // Original Node.js objects
  public req: IncomingMessage;
  public res: ServerResponse;
  public app: any;

  // Express-specific properties
  public locals: any = {};
  public charset: string = 'utf-8';

  private _headersSent: boolean = false;

  constructor(req: IncomingMessage, res: ServerResponse, app: any) {
    this.req = req;
    this.res = res;
    this.app = app;
  }

  /**
   * Set status code (chainable)
   */
  public status(code: number): this {
    this.res.statusCode = code;
    return this;
  }

  /**
   * Set multiple links in Link header
   */
  public links(links: { [rel: string]: string }): this {
    const linkHeader = Object.keys(links)
      .map(rel => `<${links[rel]}>; rel="${rel}"`)
      .join(', ');

    return this.append('Link', linkHeader);
  }

  /**
   * Send JSON response
   */
  public json(obj: any): this {
    // Get settings
    const replacer = this.app.get('json replacer');
    const spaces = this.app.get('json spaces');

    // Stringify
    const body = JSON.stringify(obj, replacer, spaces);

    // Set content-type if not already set
    if (!this.get('Content-Type')) {
      this.setHeader('Content-Type', 'application/json');
    }

    return this.send(body);
  }

  /**
   * Send JSONP response
   */
  public jsonp(obj: any): this {
    // Get callback name from query or settings
    const callbackName = this.app.get('jsonp callback name') || 'callback';
    const req = this.req as any;
    const callback = req.query?.[callbackName];

    // Generate JSON
    const replacer = this.app.get('json replacer');
    const spaces = this.app.get('json spaces');
    let body = JSON.stringify(obj, replacer, spaces);

    // Set content-type
    this.setHeader('Content-Type', 'application/json');

    // Wrap in callback if provided
    if (callback && typeof callback === 'string') {
      this.setHeader('Content-Type', 'text/javascript');
      // Sanitize callback name (basic safety)
      const safeCallback = callback.replace(/[^\w$.[\]]/g, '');
      body = `/**/ typeof ${safeCallback} === 'function' && ${safeCallback}(${body});`;
    }

    return this.send(body);
  }

  /**
   * Send response (handles various types)
   */
  public send(body?: any): this {
    // Handle status code
    let statusCode = this.statusCode;

    // Determine content type based on body
    if (body !== undefined) {
      switch (typeof body) {
        case 'string':
          if (!this.get('Content-Type')) {
            this.setHeader('Content-Type', 'text/html');
          }
          break;

        case 'boolean':
        case 'number':
        case 'object':
          if (body === null) {
            body = '';
          } else if (Buffer.isBuffer(body)) {
            if (!this.get('Content-Type')) {
              this.setHeader('Content-Type', 'application/octet-stream');
            }
          } else {
            return this.json(body);
          }
          break;
      }
    }

    // Convert to string if needed
    if (typeof body === 'number') {
      body = String(body);
      if (!this.get('Content-Type')) {
        this.setHeader('Content-Type', 'text/plain');
      }
    }

    // Handle different types
    if (typeof body === 'string') {
      this.setHeader('Content-Length', Buffer.byteLength(body));
    }

    // Default status code
    if (statusCode === undefined || statusCode === 200) {
      if (body === undefined) {
        statusCode = 204;
        body = '';
      } else {
        statusCode = 200;
      }
    }

    // Send response
    this.res.statusCode = statusCode;
    this.res.end(body);

    return this;
  }

  /**
   * Send status with optional message
   */
  public sendStatus(statusCode: number): this {
    const body = http.STATUS_CODES[statusCode] || String(statusCode);
    this.status(statusCode);
    this.setHeader('Content-Type', 'text/plain');
    return this.send(body);
  }

  /**
   * Set header(s)
   */
  public set(field: string, value?: string | string[]): this;
  public set(headers: { [key: string]: string | string[] }): this;
  public set(field: any, value?: any): this {
    if (arguments.length === 2) {
      // Single header
      if (Array.isArray(value)) {
        value = value.map(String);
      } else {
        value = String(value);
      }
      this.res.setHeader(field, value);
    } else {
      // Multiple headers
      for (const key in field) {
        this.set(key, field[key]);
      }
    }

    return this;
  }

  /**
   * Alias for set()
   */
  public header(field: string, value?: string | string[]): this;
  public header(headers: { [key: string]: string | string[] }): this;
  public header(field: any, value?: any): this {
    return this.set(field, value);
  }

  /**
   * Get header value
   */
  public get(field: string): string | number | string[] | undefined {
    return this.res.getHeader(field);
  }

  /**
   * Append to header
   */
  public append(field: string, value: string | string[]): this {
    const prev = this.get(field);

    if (prev) {
      if (Array.isArray(prev)) {
        value = Array.isArray(value) ? prev.concat(value) : [...prev, value];
      } else {
        value = Array.isArray(value) ? [prev as string, ...value] : [prev as string, value];
      }
    }

    return this.set(field, value);
  }

  /**
   * Set cookie
   */
  public cookie(name: string, value: string | object, options?: any): this {
    options = options || {};

    // Serialize object values
    const val = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

    // Build cookie string
    let cookie = `${name}=${encodeURIComponent(val)}`;

    // Add options
    if (options.domain) {
      cookie += `; Domain=${options.domain}`;
    }

    if (options.path) {
      cookie += `; Path=${options.path}`;
    } else {
      cookie += '; Path=/';
    }

    if (options.expires) {
      cookie += `; Expires=${options.expires.toUTCString()}`;
    }

    if (options.maxAge) {
      cookie += `; Max-Age=${options.maxAge}`;
    }

    if (options.httpOnly) {
      cookie += '; HttpOnly';
    }

    if (options.secure) {
      cookie += '; Secure';
    }

    if (options.sameSite) {
      cookie += `; SameSite=${options.sameSite}`;
    }

    return this.append('Set-Cookie', cookie);
  }

  /**
   * Clear cookie
   */
  public clearCookie(name: string, options?: any): this {
    return this.cookie(name, '', {
      ...options,
      expires: new Date(1),
      maxAge: -1
    });
  }

  /**
   * Redirect to URL
   */
  public redirect(url: string): void;
  public redirect(status: number, url: string): void;
  public redirect(statusOrUrl: number | string, url?: string): void {
    let status = 302;
    let location = statusOrUrl as string;

    // Parse arguments
    if (arguments.length === 2) {
      status = statusOrUrl as number;
      location = url!;
    }

    // Handle special cases
    if (location === 'back') {
      location = (this.req.headers.referer || this.req.headers.referrer || '/') as string;
    }

    // Set status and location
    this.status(status);
    this.setHeader('Location', location);

    // Send body (for non-XHR requests)
    if (this.req.headers.accept?.includes('text/html')) {
      this.setHeader('Content-Type', 'text/html');
      this.send(`<p>Redirecting to <a href="${location}">${location}</a></p>`);
    } else {
      this.setHeader('Content-Type', 'text/plain');
      this.send(`Redirecting to ${location}`);
    }
  }

  /**
   * Set Content-Type
   */
  public type(type: string): this {
    // Handle extensions
    const contentType = type.includes('/') ? type : this.getMimeType(type);
    return this.set('Content-Type', contentType);
  }

  /**
   * Set Content-Type to "application/octet-stream"
   * and Content-Disposition to "attachment"
   */
  public attachment(filename?: string): this {
    if (filename) {
      this.type(path.extname(filename));
      this.set('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
    } else {
      this.set('Content-Disposition', 'attachment');
    }

    return this;
  }

  /**
   * Send file
   */
  public sendFile(filepath: string, options?: any, callback?: (err?: Error) => void): void {
    // Parse arguments
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    options = options || {};

    // Resolve path
    const root = options.root || '';
    const fullPath = path.resolve(root, filepath);

    // Check if file exists
    fs.stat(fullPath, (err, stats) => {
      if (err) {
        if (callback) {
          callback(err);
        } else {
          this.status(404).send('File not found');
        }
        return;
      }

      // Set headers
      this.setHeader('Content-Length', stats.size);
      if (!this.get('Content-Type')) {
        this.type(path.extname(fullPath));
      }

      // Stream file
      const stream = fs.createReadStream(fullPath);

      stream.on('error', (err) => {
        if (callback) {
          callback(err);
        }
      });

      stream.on('end', () => {
        if (callback) {
          callback();
        }
      });

      stream.pipe(this.res);
    });
  }

  /**
   * Transfer file as download
   */
  public download(filepath: string, filename?: string | Function, callback?: (err?: Error) => void): void {
    // Parse arguments
    if (typeof filename === 'function') {
      callback = filename;
      filename = undefined;
    }

    // Set attachment
    this.attachment(filename as string || path.basename(filepath));

    // Send file
    this.sendFile(filepath, callback);
  }

  /**
   * Render template
   */
  public render(view: string, options?: any, callback?: (err: Error | null, html?: string) => void): void {
    // Parse arguments
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    options = options || {};

    // Merge app.locals, res.locals, and options
    const opts = { ...this.app.locals, ...this.locals, ...options };

    // Use app.render
    this.app.render(view, opts, (err: Error | null, html?: string) => {
      if (err) {
        if (callback) {
          return callback(err);
        }
        // If no callback, emit error and send 500
        this.req.emit('error', err);
        this.status(500).send('Internal Server Error');
        return;
      }

      if (callback) {
        callback(null, html);
      } else {
        this.send(html);
      }
    });
  }

  /**
   * Set Content-Disposition to "inline"
   */
  public inline(filename?: string): this {
    if (filename) {
      this.set('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      this.set('Content-Disposition', 'inline');
    }
    return this;
  }

  /**
   * Add Vary header
   */
  public vary(field: string): this {
    return this.append('Vary', field);
  }

  /**
   * Set Location header
   */
  public location(url: string): this {
    return this.set('Location', url);
  }

  /**
   * Set Content-Length
   */
  public contentLength(length: number): this {
    return this.set('Content-Length', String(length));
  }

  /**
   * End response
   */
  public end(data?: any, encoding?: string): void {
    this.res.end(data, encoding as BufferEncoding);
  }

  /**
   * Format response based on Accept header
   */
  public format(obj: { [type: string]: () => void }): this {
    const req = this.req as any;
    const accept = req.headers.accept || '*/*';

    // Parse accept types
    const types = Object.keys(obj);

    // Simple accept header matching
    for (const type of types) {
      if (accept.includes(type) || accept === '*/*') {
        obj[type]();
        return this;
      }
    }

    // No match - send 406
    this.status(406).send('Not Acceptable');
    return this;
  }

  /**
   * Get MIME type for extension
   */
  private getMimeType(ext: string): string {
    const mimes: { [key: string]: string } = {
      'html': 'text/html',
      'json': 'application/json',
      'xml': 'application/xml',
      'txt': 'text/plain',
      'css': 'text/css',
      'js': 'application/javascript',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'zip': 'application/zip'
    };

    return mimes[ext] || 'application/octet-stream';
  }

  /**
   * Get status code
   */
  public get statusCode(): number {
    return this.res.statusCode;
  }

  /**
   * Set status code
   */
  public set statusCode(code: number) {
    this.res.statusCode = code;
  }

  /**
   * Convenience method to set header
   */
  public setHeader(name: string, value: string | number | string[]): this {
    this.res.setHeader(name, value);
    return this;
  }

  /**
   * Check if headers have been sent
   */
  public get headersSent(): boolean {
    return this.res.headersSent;
  }
}

export default Response;
