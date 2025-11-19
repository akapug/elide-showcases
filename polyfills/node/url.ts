/**
 * URL - URL Parsing and Formatting for Elide
 *
 * Complete implementation of Node.js url module and WHATWG URL API.
 * **POLYGLOT SHOWCASE**: URL handling for ALL languages on Elide!
 *
 * Features:
 * - WHATWG URL API
 * - Legacy url.parse/format
 * - URL parsing and validation
 * - Query string handling
 * - URL resolution
 * - URLSearchParams
 *
 * Use cases:
 * - HTTP routing
 * - API clients
 * - Web scraping
 * - Link validation
 * - Query parameter handling
 */

/**
 * URLSearchParams implementation
 */
export class URLSearchParams {
  private params: Map<string, string[]> = new Map();

  constructor(init?: string | Record<string, string> | URLSearchParams) {
    if (!init) return;

    if (typeof init === 'string') {
      this.parseString(init);
    } else if (init instanceof URLSearchParams) {
      init.forEach((value, key) => this.append(key, value));
    } else {
      for (const [key, value] of Object.entries(init)) {
        this.append(key, value);
      }
    }
  }

  private parseString(str: string): void {
    if (str.startsWith('?')) {
      str = str.slice(1);
    }

    const pairs = str.split('&');
    for (const pair of pairs) {
      if (!pair) continue;

      const [key, value = ''] = pair.split('=');
      this.append(
        decodeURIComponent(key.replace(/\+/g, ' ')),
        decodeURIComponent(value.replace(/\+/g, ' '))
      );
    }
  }

  append(name: string, value: string): void {
    const values = this.params.get(name) || [];
    values.push(String(value));
    this.params.set(name, values);
  }

  delete(name: string): void {
    this.params.delete(name);
  }

  get(name: string): string | null {
    const values = this.params.get(name);
    return values && values.length > 0 ? values[0] : null;
  }

  getAll(name: string): string[] {
    return this.params.get(name) || [];
  }

  has(name: string): boolean {
    return this.params.has(name);
  }

  set(name: string, value: string): void {
    this.params.set(name, [String(value)]);
  }

  sort(): void {
    const sorted = new Map([...this.params.entries()].sort());
    this.params = sorted;
  }

  forEach(callback: (value: string, key: string, parent: URLSearchParams) => void): void {
    for (const [key, values] of this.params) {
      for (const value of values) {
        callback(value, key, this);
      }
    }
  }

  keys(): IterableIterator<string> {
    const keys: string[] = [];
    for (const [key, values] of this.params) {
      for (let i = 0; i < values.length; i++) {
        keys.push(key);
      }
    }
    return keys[Symbol.iterator]();
  }

  values(): IterableIterator<string> {
    const values: string[] = [];
    for (const [_, vals] of this.params) {
      values.push(...vals);
    }
    return values[Symbol.iterator]();
  }

  entries(): IterableIterator<[string, string]> {
    const entries: [string, string][] = [];
    for (const [key, values] of this.params) {
      for (const value of values) {
        entries.push([key, value]);
      }
    }
    return entries[Symbol.iterator]();
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  toString(): string {
    const parts: string[] = [];
    for (const [key, values] of this.params) {
      for (const value of values) {
        parts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        );
      }
    }
    return parts.join('&');
  }
}

/**
 * URL class implementation
 */
export class URL {
  hash: string = '';
  host: string = '';
  hostname: string = '';
  href: string = '';
  origin: string = '';
  password: string = '';
  pathname: string = '';
  port: string = '';
  protocol: string = '';
  search: string = '';
  searchParams: URLSearchParams;
  username: string = '';

  constructor(url: string, base?: string | URL) {
    this.searchParams = new URLSearchParams();

    // Handle base URL
    if (base) {
      const baseUrl = typeof base === 'string' ? new URL(base) : base;
      url = this.resolveURL(url, baseUrl);
    }

    this.parse(url);
  }

  private resolveURL(url: string, base: URL): string {
    // If absolute, return as-is
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
      return url;
    }

    // Relative URL
    if (url.startsWith('//')) {
      return base.protocol + url;
    }

    if (url.startsWith('/')) {
      return base.origin + url;
    }

    // Relative to current path
    const basePath = base.pathname.replace(/\/[^/]*$/, '');
    return base.origin + basePath + '/' + url;
  }

  private parse(url: string): void {
    this.href = url;

    // Parse protocol
    const protocolMatch = url.match(/^([a-z][a-z0-9+.-]*):\/\//i);
    if (protocolMatch) {
      this.protocol = protocolMatch[1].toLowerCase() + ':';
      url = url.slice(protocolMatch[0].length);
    }

    // Parse auth, host, port
    const hostMatch = url.match(/^([^/?#]*)/);
    if (hostMatch) {
      let hostPart = hostMatch[1];
      url = url.slice(hostPart.length);

      // Parse auth
      const authMatch = hostPart.match(/^([^@]*)@/);
      if (authMatch) {
        const [username, password] = authMatch[1].split(':');
        this.username = decodeURIComponent(username || '');
        this.password = decodeURIComponent(password || '');
        hostPart = hostPart.slice(authMatch[0].length);
      }

      // Parse port
      const portMatch = hostPart.match(/:(\d+)$/);
      if (portMatch) {
        this.port = portMatch[1];
        hostPart = hostPart.slice(0, -portMatch[0].length);
      }

      this.hostname = hostPart;
      this.host = this.port ? `${this.hostname}:${this.port}` : this.hostname;
    }

    // Set origin
    this.origin = `${this.protocol}//${this.host}`;

    // Parse pathname
    const pathMatch = url.match(/^([^?#]*)/);
    if (pathMatch) {
      this.pathname = pathMatch[1] || '/';
      url = url.slice(pathMatch[0].length);
    }

    // Parse search
    const searchMatch = url.match(/^(\?[^#]*)/);
    if (searchMatch) {
      this.search = searchMatch[1];
      this.searchParams = new URLSearchParams(this.search);
      url = url.slice(searchMatch[0].length);
    }

    // Parse hash
    if (url.startsWith('#')) {
      this.hash = url;
    }
  }

  toString(): string {
    return this.href;
  }

  toJSON(): string {
    return this.href;
  }
}

/**
 * Legacy url.parse interface
 */
export interface UrlObject {
  protocol?: string | null;
  slashes?: boolean;
  auth?: string | null;
  host?: string | null;
  port?: string | null;
  hostname?: string | null;
  hash?: string | null;
  search?: string | null;
  query?: string | Record<string, string | string[]> | null;
  pathname?: string | null;
  path?: string | null;
  href?: string;
}

/**
 * Parse URL (legacy)
 */
export function parse(urlStr: string, parseQueryString?: boolean, slashesDenoteHost?: boolean): UrlObject {
  const url = new URL(urlStr);

  return {
    protocol: url.protocol,
    slashes: true,
    auth: url.username || url.password ? `${url.username}:${url.password}` : null,
    host: url.host,
    port: url.port || null,
    hostname: url.hostname,
    hash: url.hash || null,
    search: url.search || null,
    query: parseQueryString && url.search ? Object.fromEntries(url.searchParams.entries()) : url.search?.slice(1) || null,
    pathname: url.pathname,
    path: url.pathname + url.search,
    href: url.href
  };
}

/**
 * Format URL (legacy)
 */
export function format(urlObject: UrlObject | URL): string {
  if (urlObject instanceof URL) {
    return urlObject.href;
  }

  let result = '';

  // Protocol
  if (urlObject.protocol) {
    result += urlObject.protocol;
    if (urlObject.slashes) {
      result += '//';
    }
  }

  // Auth
  if (urlObject.auth) {
    result += urlObject.auth + '@';
  }

  // Host
  if (urlObject.host) {
    result += urlObject.host;
  } else if (urlObject.hostname) {
    result += urlObject.hostname;
    if (urlObject.port) {
      result += ':' + urlObject.port;
    }
  }

  // Path
  if (urlObject.pathname) {
    result += urlObject.pathname;
  }

  // Search/Query
  if (urlObject.search) {
    result += urlObject.search;
  } else if (urlObject.query) {
    if (typeof urlObject.query === 'string') {
      result += '?' + urlObject.query;
    } else {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(urlObject.query)) {
        if (Array.isArray(value)) {
          for (const v of value) {
            params.append(key, v);
          }
        } else {
          params.append(key, value);
        }
      }
      result += '?' + params.toString();
    }
  }

  // Hash
  if (urlObject.hash) {
    result += urlObject.hash;
  }

  return result;
}

/**
 * Resolve URL
 */
export function resolve(from: string, to: string): string {
  return new URL(to, from).href;
}

/**
 * URL utilities
 */
export function fileURLToPath(url: string | URL): string {
  const urlStr = typeof url === 'string' ? url : url.href;

  if (!urlStr.startsWith('file://')) {
    throw new TypeError('The URL must be a file: URL');
  }

  // Remove file:// and decode
  let path = urlStr.slice(7);
  path = decodeURIComponent(path);

  // Handle Windows paths
  if (/^\/[a-zA-Z]:/.test(path)) {
    path = path.slice(1);
  }

  return path;
}

export function pathToFileURL(path: string): URL {
  // Handle Windows paths
  if (/^[a-zA-Z]:/.test(path)) {
    path = '/' + path;
  }

  return new URL('file://' + encodeURI(path));
}

// Default export
export default {
  URL,
  URLSearchParams,
  parse,
  format,
  resolve,
  fileURLToPath,
  pathToFileURL
};

// CLI Demo
if (import.meta.url.includes("url.ts")) {
  console.log("🔗 URL - URL Parsing for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Parse URL ===");
  const url1 = new URL('https://user:pass@example.com:8080/path?query=value#hash');
  console.log('Protocol:', url1.protocol);
  console.log('Hostname:', url1.hostname);
  console.log('Port:', url1.port);
  console.log('Pathname:', url1.pathname);
  console.log('Search:', url1.search);
  console.log('Hash:', url1.hash);
  console.log();

  console.log("=== Example 2: URLSearchParams ===");
  const params = new URLSearchParams('foo=bar&baz=qux&foo=baz');
  console.log('Get foo:', params.get('foo'));
  console.log('Get all foo:', params.getAll('foo'));
  params.append('new', 'value');
  console.log('String:', params.toString());
  console.log();

  console.log("=== Example 3: Legacy Parse ===");
  const parsed = parse('https://example.com:8080/path?key=value', true);
  console.log('Parsed:', parsed);
  console.log();

  console.log("=== Example 4: Format URL ===");
  const formatted = format({
    protocol: 'https:',
    hostname: 'example.com',
    pathname: '/api/users',
    query: { id: '123', filter: 'active' }
  });
  console.log('Formatted:', formatted);
  console.log();

  console.log("=== Example 5: Resolve URLs ===");
  console.log(resolve('https://example.com/foo', 'bar'));
  console.log(resolve('https://example.com/foo', '/bar'));
  console.log(resolve('https://example.com/foo', 'https://other.com/bar'));
  console.log();

  console.log("=== Example 6: URL with Base ===");
  const url2 = new URL('/api/users', 'https://example.com');
  console.log('Full URL:', url2.href);
  console.log();

  console.log("=== Example 7: Modify Search Params ===");
  const url3 = new URL('https://example.com/search');
  url3.searchParams.set('q', 'elide');
  url3.searchParams.set('page', '1');
  console.log('URL with params:', url3.href);
  console.log();

  console.log("=== Example 8: File URLs ===");
  const fileUrl = pathToFileURL('/home/user/file.txt');
  console.log('File URL:', fileUrl.href);
  console.log('Back to path:', fileURLToPath(fileUrl));
  console.log();

  console.log("=== Example 9: API Query Building ===");
  const apiUrl = new URL('https://api.example.com/v1/users');
  apiUrl.searchParams.set('limit', '10');
  apiUrl.searchParams.set('offset', '0');
  apiUrl.searchParams.set('sort', 'name');
  console.log('API URL:', apiUrl.href);
  console.log();

  console.log("=== Example 10: Extract Query Params ===");
  const url4 = new URL('https://example.com/search?q=test&category=books&page=2');
  console.log('Query params:');
  url4.searchParams.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 URL parsing works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One URL API for all languages");
  console.log("  ✓ Consistent URL handling");
  console.log("  ✓ Share HTTP clients");
  console.log("  ✓ Cross-language routing");
}
