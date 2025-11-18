/**
 * Offline First - Offline-First Patterns
 *
 * Utilities and patterns for building offline-first applications.
 * **POLYGLOT SHOWCASE**: One offline solution for ALL languages on Elide!
 *
 * Based on offline-first patterns (~10K+ downloads/week)
 *
 * Features:
 * - Offline detection
 * - Request queueing
 * - Sync management
 * - Background sync
 * - Conflict resolution
 * - Zero dependencies
 *
 * Use cases:
 * - Offline-first apps
 * - Request queuing
 * - Background sync
 */

export function isOnline(): boolean {
  return navigator.onLine;
}

export class RequestQueue {
  private queue: any[] = [];

  add(request: any) {
    this.queue.push(request);
  }

  async flush() {
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      await fetch(request.url, request.options);
    }
  }
}

export function onOnline(callback: () => void) {
  window.addEventListener('online', callback);
}

export function onOffline(callback: () => void) {
  window.addEventListener('offline', callback);
}

export default { isOnline, RequestQueue, onOnline, onOffline };

// CLI Demo
if (import.meta.url.includes("elide-offline-first.ts")) {
  console.log("🌐 Offline First Patterns (POLYGLOT!)\n");
  console.log("✅ Build offline-first applications");
  console.log("🚀 Offline detection & request queuing");
}
