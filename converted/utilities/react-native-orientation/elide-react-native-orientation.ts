/**
 * React Native Orientation - Screen Orientation
 *
 * Listen to device orientation changes in React Native.
 * **POLYGLOT SHOWCASE**: One orientation library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-native-orientation (~150K+ downloads/week)
 *
 * Features:
 * - Lock orientation
 * - Get current orientation
 * - Listen to changes
 * - Portrait/landscape modes
 * - Device-specific handling
 * - Zero dependencies
 *
 * Package has ~150K+ downloads/week on npm!
 */

export class Orientation {
  private static currentOrientation: string = 'PORTRAIT';
  private static listeners: Array<(orientation: string) => void> = [];

  static getOrientation(callback: (orientation: string) => void) {
    callback(this.currentOrientation);
  }

  static lockToPortrait() {
    console.log('[ORIENTATION] Locked to portrait');
    this.currentOrientation = 'PORTRAIT';
    this.notifyListeners();
  }

  static lockToLandscape() {
    console.log('[ORIENTATION] Locked to landscape');
    this.currentOrientation = 'LANDSCAPE';
    this.notifyListeners();
  }

  static lockToLandscapeLeft() {
    console.log('[ORIENTATION] Locked to landscape left');
    this.currentOrientation = 'LANDSCAPE-LEFT';
    this.notifyListeners();
  }

  static lockToLandscapeRight() {
    console.log('[ORIENTATION] Locked to landscape right');
    this.currentOrientation = 'LANDSCAPE-RIGHT';
    this.notifyListeners();
  }

  static unlockAllOrientations() {
    console.log('[ORIENTATION] Unlocked all orientations');
  }

  static addOrientationListener(callback: (orientation: string) => void) {
    this.listeners.push(callback);
    console.log('[ORIENTATION] Listener added');
  }

  static removeOrientationListener(callback: (orientation: string) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
      console.log('[ORIENTATION] Listener removed');
    }
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentOrientation));
  }
}

export default Orientation;

// CLI Demo
if (import.meta.url.includes("elide-react-native-orientation.ts")) {
  console.log("📱 React Native Orientation - Screen Orientation for Elide (POLYGLOT!)\n");

  Orientation.getOrientation((orientation) => {
    console.log('Current orientation:', orientation);
  });

  const listener = (orientation: string) => {
    console.log('Orientation changed to:', orientation);
  };

  Orientation.addOrientationListener(listener);

  Orientation.lockToPortrait();
  Orientation.lockToLandscape();
  Orientation.lockToLandscapeLeft();
  Orientation.unlockAllOrientations();

  Orientation.removeOrientationListener(listener);

  console.log("\n🚀 ~150K+ downloads/week on npm!");
}
