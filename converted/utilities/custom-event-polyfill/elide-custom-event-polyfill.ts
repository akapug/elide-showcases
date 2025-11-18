/**
 * CustomEvent Polyfill
 *
 * Polyfill for CustomEvent API.
 * **POLYGLOT SHOWCASE**: CustomEvent for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/custom-event-polyfill (~200K+ downloads/week)
 */

export interface CustomEventInit<T = any> {
  bubbles?: boolean;
  cancelable?: boolean;
  detail?: T;
}

export class CustomEventPolyfill<T = any> extends Event {
  detail: T;

  constructor(type: string, eventInitDict?: CustomEventInit<T>) {
    super(type, eventInitDict);
    this.detail = eventInitDict?.detail as T;
  }
}

// Polyfill global CustomEvent if needed
if (typeof window !== 'undefined' && typeof window.CustomEvent !== 'function') {
  (window as any).CustomEvent = CustomEventPolyfill;
}

export default CustomEventPolyfill;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 CustomEvent Polyfill (POLYGLOT!)\n");
  
  const event = new CustomEventPolyfill('my-event', {
    detail: { message: 'Hello World', timestamp: Date.now() },
    bubbles: true,
    cancelable: true
  });
  
  console.log('Event type:', event.type);
  console.log('Event detail:', event.detail);
  console.log('Bubbles:', event.bubbles);
  console.log('Cancelable:', event.cancelable);
  console.log("\n  ✓ ~200K+ downloads/week!");
}
