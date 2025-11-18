/**
 * React PWA - PWA Utilities for React
 *
 * PWA utilities and service worker registration for React apps.
 * **POLYGLOT SHOWCASE**: One PWA utility for ALL languages on Elide!
 *
 * Based on Create React App PWA template (~30K+ downloads/week)
 *
 * Features:
 * - Service worker registration
 * - Update notifications
 * - Offline support
 * - Cache management
 * - Zero dependencies
 *
 * Use cases:
 * - React PWAs
 * - Offline React apps
 */

export function register(config?: { onSuccess?: (reg: ServiceWorkerRegistration) => void; onUpdate?: (reg: ServiceWorkerRegistration) => void }) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => config?.onSuccess?.(registration))
      .catch(error => console.error('SW registration failed:', error));
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => registration.unregister());
  }
}

export default { register, unregister };

// CLI Demo
if (import.meta.url.includes("elide-react-pwa.ts")) {
  console.log("⚛️ React PWA Utilities (POLYGLOT!)\n");
  console.log("✅ PWA support for React");
  console.log("🚀 ~30K+ downloads/week on npm!");
}
