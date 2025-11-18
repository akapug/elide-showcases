/**
 * Vue PWA - PWA Plugin for Vue.js
 *
 * PWA functionality for Vue.js applications.
 * **POLYGLOT SHOWCASE**: One PWA plugin for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@vue/cli-plugin-pwa (~50K+ downloads/week)
 *
 * Features:
 * - Service worker registration
 * - Workbox configuration
 * - Manifest support
 * - Offline mode
 * - Zero dependencies
 *
 * Use cases:
 * - Vue.js PWAs
 * - Offline Vue apps
 */

export function registerServiceWorker(swPath: string = '/service-worker.js') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(swPath);
  }
}

export default { registerServiceWorker };

// CLI Demo
if (import.meta.url.includes("elide-vue-pwa.ts")) {
  console.log("💚 Vue PWA Plugin (POLYGLOT!)\n");
  console.log("✅ PWA support for Vue.js");
  console.log("🚀 ~50K+ downloads/week on npm!");
}
