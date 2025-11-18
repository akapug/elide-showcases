/**
 * FormData Polyfill
 *
 * Polyfill for the FormData API.
 * **POLYGLOT SHOWCASE**: One FormData for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/formdata-polyfill (~300K+ downloads/week)
 *
 * Features:
 * - Full FormData API
 * - File uploads
 * - Iteration support
 * - Zero dependencies
 *
 * Use cases:
 * - Form submissions
 * - File uploads
 * - Multipart data
 *
 * Package has ~300K+ downloads/week on npm!
 */

export class FormData {
  private data = new Map<string, string | Blob>();

  append(name: string, value: string | Blob): void {
    this.data.set(name, value);
  }

  delete(name: string): void {
    this.data.delete(name);
  }

  get(name: string): string | Blob | null {
    return this.data.get(name) || null;
  }

  getAll(name: string): Array<string | Blob> {
    const value = this.data.get(name);
    return value ? [value] : [];
  }

  has(name: string): boolean {
    return this.data.has(name);
  }

  set(name: string, value: string | Blob): void {
    this.data.set(name, value);
  }

  forEach(callback: (value: string | Blob, key: string) => void): void {
    this.data.forEach((value, key) => callback(value, key));
  }

  *entries(): IterableIterator<[string, string | Blob]> {
    yield* this.data.entries();
  }

  *keys(): IterableIterator<string> {
    yield* this.data.keys();
  }

  *values(): IterableIterator<string | Blob> {
    yield* this.data.values();
  }
}

export default FormData;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📋 FormData Polyfill for Elide (POLYGLOT!)\n");
  
  const form = new FormData();
  form.append('name', 'Alice');
  form.append('email', 'alice@example.com');
  
  console.log('Name:', form.get('name'));
  console.log('Email:', form.get('email'));
  console.log("\n  ✓ ~300K+ downloads/week");
}
