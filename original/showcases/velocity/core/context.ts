/**
 * Velocity Context - Request/Response Context
 * Provides fast access to request data and response methods
 */

import type { Server } from 'bun';
import type { Params } from './router';

export interface Cookie {
  name: string;
  value: string;
  options?: {
    expires?: Date;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  };
}

export class Context {
  req: Request;
  params: Params;
  query: URLSearchParams;
  private _url: URL;
  private _body: any;
  private _json: any;
  private _text: string | null;
  private _headers: Headers;
  private _cookies: Map<string, string> | null;
  private _status: number;

  constructor(req: Request, params: Params = {}) {
    this.req = req;
    this.params = params;
    this._url = new URL(req.url);
    this.query = this._url.searchParams;
    this._body = null;
    this._json = null;
    this._text = null;
    this._headers = new Headers();
    this._cookies = null;
    this._status = 200;
  }

  /**
   * Get request header
   */
  header(name: string): string | null {
    return this.req.headers.get(name);
  }

  /**
   * Set response header
   */
  setHeader(name: string, value: string): void {
    this._headers.set(name, value);
  }

  /**
   * Set response status
   */
  status(code: number): this {
    this._status = code;
    return this;
  }

  /**
   * Get request body as text
   */
  async text(): Promise<string> {
    if (this._text !== null) {
      return this._text;
    }
    this._text = await this.req.text();
    return this._text;
  }

  /**
   * Get request body as JSON
   */
  async json<T = any>(): Promise<T> {
    if (this._json !== null) {
      return this._json;
    }
    const text = await this.text();
    this._json = JSON.parse(text);
    return this._json;
  }

  /**
   * Get request body as FormData
   */
  async formData(): Promise<FormData> {
    return await this.req.formData();
  }

  /**
   * Get request body as ArrayBuffer
   */
  async arrayBuffer(): Promise<ArrayBuffer> {
    return await this.req.arrayBuffer();
  }

  /**
   * Get request body as Blob
   */
  async blob(): Promise<Blob> {
    return await this.req.blob();
  }

  /**
   * Get query parameter
   */
  queryParam(name: string): string | null {
    return this.query.get(name);
  }

  /**
   * Get route parameter
   */
  param(name: string): string | undefined {
    return this.params[name];
  }

  /**
   * Get all cookies
   */
  get cookies(): Map<string, string> {
    if (this._cookies) {
      return this._cookies;
    }

    this._cookies = new Map();
    const cookieHeader = this.req.headers.get('Cookie');

    if (cookieHeader) {
      const cookies = cookieHeader.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          this._cookies.set(name, decodeURIComponent(value));
        }
      }
    }

    return this._cookies;
  }

  /**
   * Get a specific cookie
   */
  cookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  /**
   * Set a cookie
   */
  setCookie(cookie: Cookie): void {
    let value = `${cookie.name}=${encodeURIComponent(cookie.value)}`;

    if (cookie.options) {
      if (cookie.options.expires) {
        value += `; Expires=${cookie.options.expires.toUTCString()}`;
      }
      if (cookie.options.maxAge !== undefined) {
        value += `; Max-Age=${cookie.options.maxAge}`;
      }
      if (cookie.options.domain) {
        value += `; Domain=${cookie.options.domain}`;
      }
      if (cookie.options.path) {
        value += `; Path=${cookie.options.path}`;
      }
      if (cookie.options.secure) {
        value += '; Secure';
      }
      if (cookie.options.httpOnly) {
        value += '; HttpOnly';
      }
      if (cookie.options.sameSite) {
        value += `; SameSite=${cookie.options.sameSite}`;
      }
    }

    this._headers.append('Set-Cookie', value);
  }

  /**
   * Send JSON response
   */
  jsonResponse(data: any, status?: number): Response {
    if (status) {
      this._status = status;
    }

    this._headers.set('Content-Type', 'application/json');

    return new Response(JSON.stringify(data), {
      status: this._status,
      headers: this._headers,
    });
  }

  /**
   * Send text response
   */
  textResponse(text: string, status?: number): Response {
    if (status) {
      this._status = status;
    }

    this._headers.set('Content-Type', 'text/plain');

    return new Response(text, {
      status: this._status,
      headers: this._headers,
    });
  }

  /**
   * Send HTML response
   */
  htmlResponse(html: string, status?: number): Response {
    if (status) {
      this._status = status;
    }

    this._headers.set('Content-Type', 'text/html');

    return new Response(html, {
      status: this._status,
      headers: this._headers,
    });
  }

  /**
   * Send redirect response
   */
  redirect(url: string, status: number = 302): Response {
    this._headers.set('Location', url);

    return new Response(null, {
      status,
      headers: this._headers,
    });
  }

  /**
   * Send stream response
   */
  streamResponse(stream: ReadableStream, contentType?: string): Response {
    if (contentType) {
      this._headers.set('Content-Type', contentType);
    }

    return new Response(stream, {
      status: this._status,
      headers: this._headers,
    });
  }

  /**
   * Send file response
   */
  fileResponse(file: Blob | File, filename?: string): Response {
    if (filename) {
      this._headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    }

    return new Response(file, {
      status: this._status,
      headers: this._headers,
    });
  }

  /**
   * Get request method
   */
  get method(): string {
    return this.req.method;
  }

  /**
   * Get request URL
   */
  get url(): URL {
    return this._url;
  }

  /**
   * Get request path
   */
  get path(): string {
    return this._url.pathname;
  }

  /**
   * Get request host
   */
  get host(): string {
    return this._url.host;
  }

  /**
   * Get request hostname
   */
  get hostname(): string {
    return this._url.hostname;
  }

  /**
   * Get request protocol
   */
  get protocol(): string {
    return this._url.protocol;
  }

  /**
   * Check if request is secure (HTTPS)
   */
  get secure(): boolean {
    return this._url.protocol === 'https:';
  }

  /**
   * Get client IP address
   */
  get ip(): string | null {
    return this.req.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
           this.req.headers.get('X-Real-IP') ||
           null;
  }

  /**
   * Check if request accepts a content type
   */
  accepts(type: string): boolean {
    const accept = this.req.headers.get('Accept');
    if (!accept) return false;
    return accept.includes(type);
  }

  /**
   * Check if request is AJAX
   */
  get isAjax(): boolean {
    return this.req.headers.get('X-Requested-With') === 'XMLHttpRequest';
  }

  /**
   * Get user agent
   */
  get userAgent(): string | null {
    return this.req.headers.get('User-Agent');
  }
}
