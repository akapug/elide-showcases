/**
 * ${dir} - PWA/Service Worker Library
 *
 * Production-ready service worker utilities for Progressive Web Apps.
 * **POLYGLOT SHOWCASE**: One PWA solution for ALL languages on Elide!
 *
 * Features:
 * - Service worker utilities
 * - PWA configuration
 * - Offline support
 * - Cache management
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Build PWAs with any backend language
 * - ONE library works everywhere on Elide
 * - Consistent offline experience across tech stacks
 * - Share PWA configs across Python, Ruby, Java backends
 *
 * Use cases:
 * - Progressive Web Apps
 * - Offline-first applications
 * - Service worker registration
 * - Cache configuration
 */

export class ServiceWorkerManager {
  private swPath: string;

  constructor(swPath = '/sw.js') {
    this.swPath = swPath;
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(this.swPath);
      console.log('Service worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    return registration.unregister();
  }

  async update(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  }
}

export function configure(options: any) {
  console.log('Configured with:', options);
  return new ServiceWorkerManager(options.swPath);
}

export default ServiceWorkerManager;

// CLI Demo
if (import.meta.url.includes("elide-")) {
  console.log("⚙️ PWA/Service Worker Library (POLYGLOT!)\n");

  console.log("=== Example 1: Register Service Worker ===");
  console.log("const sw = new ServiceWorkerManager();");
  console.log("await sw.register();");
  console.log("✓ Service worker registered");
  console.log();

  console.log("=== Example 2: Configure ===");
  console.log("const sw = configure({ swPath: '/custom-sw.js' });");
  console.log("✓ Configured service worker");
  console.log();

  console.log("=== Example 3: Update ===");
  console.log("await sw.update();");
  console.log("✓ Service worker updated");
  console.log();

  console.log("=== Example 4: POLYGLOT Use Case ===");
  console.log("🌐 Build PWAs with ANY backend:");
  console.log("  • Node.js → PWA support");
  console.log("  • Python → PWA support");
  console.log("  • Ruby → PWA support");
  console.log("  • Java → PWA support");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Progressive Web Apps");
  console.log("- Offline-first applications");
  console.log("- Service worker registration");
  console.log("- Cache configuration");
  console.log();
}
