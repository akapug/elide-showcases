/**
 * URLSearchParams Polyfill
 *
 * Polyfill for URLSearchParams API.
 * **POLYGLOT SHOWCASE**: One URLSearchParams for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/urlsearchparams-polyfill (~100K+ downloads/week)
 */

export class URLSearchParams {
  private params = new Map<string, string[]>();

  constructor(init?: string | Record<string, string>) {
    if (typeof init === 'string') {
      this.parseString(init.startsWith('?') ? init.slice(1) : init);
    } else if (init) {
      Object.entries(init).forEach(([k, v]) => this.append(k, v));
    }
  }

  private parseString(str: string): void {
    str.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) this.append(decodeURIComponent(key), decodeURIComponent(value || ''));
    });
  }

  append(name: string, value: string): void {
    if (!this.params.has(name)) this.params.set(name, []);
    this.params.get(name)!.push(value);
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
    this.params.set(name, [value]);
  }

  toString(): string {
    const parts: string[] = [];
    this.params.forEach((values, key) => {
      values.forEach(value => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`));
    });
    return parts.join('&');
  }
}

export default URLSearchParams;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 URLSearchParams Polyfill (POLYGLOT!)\n");
  
  const params = new URLSearchParams('foo=bar&name=Alice&age=30');
  console.log('foo:', params.get('foo'));
  console.log('name:', params.get('name'));
  params.append('hobby', 'coding');
  console.log('toString:', params.toString());
  console.log("\n  ✓ ~100K+ downloads/week");
}
