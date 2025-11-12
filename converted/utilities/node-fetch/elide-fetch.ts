/**
 * Elide Fetch - Universal HTTP Client
 *
 * A lightweight, promise-based HTTP client that works across all languages.
 * Drop-in replacement for node-fetch with Elide's built-in HTTP support.
 */

// Response class matching Fetch API
export class Response {
  public readonly status: number;
  public readonly statusText: string;
  public readonly ok: boolean;
  public readonly headers: Headers;
  public readonly url: string;
  public readonly redirected: boolean;
  private _body: string;
  private _bodyUsed: boolean = false;

  constructor(body: string, init: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    url?: string;
    redirected?: boolean;
  } = {}) {
    this._body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Headers(init.headers || {});
    this.url = init.url || '';
    this.redirected = init.redirected || false;
  }

  async text(): Promise<string> {
    if (this._bodyUsed) {
      throw new Error('Response body already consumed');
    }
    this._bodyUsed = true;
    return this._body;
  }

  async json(): Promise<any> {
    const text = await this.text();
    return JSON.parse(text);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const text = await this.text();
    const encoder = new TextEncoder();
    return encoder.encode(text).buffer;
  }

  async blob(): Promise<Blob> {
    const buffer = await this.arrayBuffer();
    return new Blob([buffer]);
  }

  clone(): Response {
    if (this._bodyUsed) {
      throw new Error('Cannot clone consumed response');
    }
    return new Response(this._body, {
      status: this.status,
      statusText: this.statusText,
      headers: Object.fromEntries(this.headers.entries()),
      url: this.url,
      redirected: this.redirected
    });
  }
}

// Headers class matching Fetch API
export class Headers {
  private _headers: Map<string, string>;

  constructor(init?: Record<string, string> | Headers) {
    this._headers = new Map();
    if (init) {
      if (init instanceof Headers) {
        init.forEach((value, key) => this.set(key, value));
      } else {
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }

  get(name: string): string | null {
    return this._headers.get(name.toLowerCase()) || null;
  }

  set(name: string, value: string): void {
    this._headers.set(name.toLowerCase(), value);
  }

  has(name: string): boolean {
    return this._headers.has(name.toLowerCase());
  }

  delete(name: string): void {
    this._headers.delete(name.toLowerCase());
  }

  append(name: string, value: string): void {
    const existing = this.get(name);
    if (existing) {
      this.set(name, `${existing}, ${value}`);
    } else {
      this.set(name, value);
    }
  }

  forEach(callback: (value: string, key: string) => void): void {
    this._headers.forEach((value, key) => callback(value, key));
  }

  entries(): IterableIterator<[string, string]> {
    return this._headers.entries();
  }

  keys(): IterableIterator<string> {
    return this._headers.keys();
  }

  values(): IterableIterator<string> {
    return this._headers.values();
  }
}

// Request options interface
export interface RequestInit {
  method?: string;
  headers?: Record<string, string> | Headers;
  body?: string | object;
  redirect?: 'follow' | 'error' | 'manual';
  timeout?: number;
  signal?: AbortSignal;
}

// Main fetch function
export async function fetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);

  // Set default headers
  if (!headers.has('user-agent')) {
    headers.set('user-agent', 'elide-fetch/1.0');
  }

  // Handle body
  let body = init.body;
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
  }

  // Build fetch options
  const fetchOptions: any = {
    method,
    headers: Object.fromEntries(headers.entries()),
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = body;
  }

  // Handle timeout
  if (init.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), init.timeout);
    fetchOptions.signal = controller.signal;
  }

  try {
    // Use native fetch if available (Elide provides this)
    const response = await globalThis.fetch(url, fetchOptions);
    const responseText = await response.text();

    return new Response(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url,
      redirected: response.redirected
    });
  } catch (error: any) {
    throw new Error(`Fetch failed: ${error.message}`);
  }
}

// Convenience methods
export const get = (url: string, init?: RequestInit) =>
  fetch(url, { ...init, method: 'GET' });

export const post = (url: string, body?: any, init?: RequestInit) =>
  fetch(url, { ...init, method: 'POST', body });

export const put = (url: string, body?: any, init?: RequestInit) =>
  fetch(url, { ...init, method: 'PUT', body });

export const patch = (url: string, body?: any, init?: RequestInit) =>
  fetch(url, { ...init, method: 'PATCH', body });

export const del = (url: string, init?: RequestInit) =>
  fetch(url, { ...init, method: 'DELETE' });

export const head = (url: string, init?: RequestInit) =>
  fetch(url, { ...init, method: 'HEAD' });

// Export default
export default fetch;

// Demo
if (import.meta.main) {
  console.log('=== Elide Fetch Demo ===\n');

  try {
    // Example 1: Basic GET request
    console.log('1. Basic GET request:');
    const response1 = await get('https://jsonplaceholder.typicode.com/posts/1');
    const data1 = await response1.json();
    console.log(`   Status: ${response1.status}`);
    console.log(`   Title: ${data1.title}`);
    console.log(`   OK: ${response1.ok}\n`);

    // Example 2: POST request with JSON body
    console.log('2. POST request:');
    const response2 = await post('https://jsonplaceholder.typicode.com/posts', {
      title: 'Test Post',
      body: 'This is a test',
      userId: 1
    });
    const data2 = await response2.json();
    console.log(`   Status: ${response2.status}`);
    console.log(`   Created ID: ${data2.id}\n`);

    // Example 3: Custom headers
    console.log('3. Custom headers:');
    const response3 = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
      headers: {
        'Accept': 'application/json',
        'X-Custom-Header': 'elide-test'
      }
    });
    console.log(`   Status: ${response3.status}`);
    console.log(`   Content-Type: ${response3.headers.get('content-type')}\n`);

    // Example 4: Error handling
    console.log('4. Error handling:');
    const response4 = await get('https://jsonplaceholder.typicode.com/posts/999999');
    console.log(`   Status: ${response4.status}`);
    console.log(`   OK: ${response4.ok}`);
    console.log(`   Status Text: ${response4.statusText}\n`);

    console.log('✓ All examples completed successfully!');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}
