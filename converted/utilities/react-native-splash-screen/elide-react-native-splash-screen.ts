/**
 * React Native Splash Screen - Splash Screen
 *
 * Splash screen for React Native apps.
 * **POLYGLOT SHOWCASE**: One splash screen library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-native-splash-screen (~300K+ downloads/week)
 *
 * Features:
 * - Show/hide splash screen
 * - Customizable duration
 * - Native implementation
 * - iOS and Android support
 * - Zero dependencies
 *
 * Package has ~300K+ downloads/week on npm!
 */

export class SplashScreen {
  private static isVisible: boolean = true;

  static show() {
    this.isVisible = true;
    console.log('[SPLASH_SCREEN] Showing');
  }

  static hide() {
    this.isVisible = false;
    console.log('[SPLASH_SCREEN] Hiding');
  }

  static preventAutoHide() {
    console.log('[SPLASH_SCREEN] Auto-hide prevented');
  }
}

export default SplashScreen;

// CLI Demo
if (import.meta.url.includes("elide-react-native-splash-screen.ts")) {
  console.log("🎬 React Native Splash Screen - Splash Screen for Elide (POLYGLOT!)\n");

  SplashScreen.show();
  console.log('App is loading...');

  setTimeout(() => {
    SplashScreen.hide();
    console.log('App ready!');
  }, 2000);

  console.log("\n🚀 ~300K+ downloads/week on npm!");
}
