/**
 * AbortController Polyfill
 *
 * Polyfill for the AbortController DOM API.
 * **POLYGLOT SHOWCASE**: One AbortController for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/abortcontroller-polyfill (~500K+ downloads/week)
 *
 * Features:
 * - AbortController API
 * - AbortSignal support
 * - Event handling
 * - Zero dependencies
 *
 * Use cases:
 * - Cancel fetch requests
 * - Timeout handling
 * - Resource cleanup
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class AbortSignal {
  aborted = false;
  onabort: ((event: Event) => void) | null = null;
  
  private listeners: Array<(event: Event) => void> = [];

  addEventListener(type: string, listener: (event: Event) => void): void {
    if (type === 'abort') this.listeners.push(listener);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  dispatchEvent(event: Event): boolean {
    this.aborted = true;
    this.listeners.forEach(l => l(event));
    if (this.onabort) this.onabort(event);
    return true;
  }
}

export class AbortController {
  readonly signal = new AbortSignal();

  abort(): void {
    if (!this.signal.aborted) {
      this.signal.dispatchEvent(new Event('abort'));
    }
  }
}

class Event {
  constructor(public type: string) {}
}

export default AbortController;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🛑 AbortController Polyfill for Elide (POLYGLOT!)\n");
  
  const controller = new AbortController();
  const signal = controller.signal;
  
  signal.addEventListener('abort', () => console.log('Aborted!'));
  
  setTimeout(() => controller.abort(), 100);
  
  console.log("Signal aborted:", signal.aborted);
  console.log("\n  ✓ ~500K+ downloads/week");
}
