/**
 * React Native Linear Gradient - Gradient Support
 *
 * Linear gradient component for React Native.
 * **POLYGLOT SHOWCASE**: One gradient library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-native-linear-gradient (~1M+ downloads/week)
 *
 * Features:
 * - Linear gradients
 * - Multiple colors
 * - Angle support
 * - Location control
 * - Zero dependencies
 *
 * Use cases:
 * - Background gradients
 * - Button styling
 * - UI effects
 * - Color transitions
 *
 * Package has ~1M+ downloads/week on npm!
 */

export class LinearGradient {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];

  constructor(props: { colors: string[]; start?: { x: number; y: number }; end?: { x: number; y: number }; locations?: number[] }) {
    this.colors = props.colors;
    this.start = props.start || { x: 0, y: 0 };
    this.end = props.end || { x: 0, y: 1 };
    this.locations = props.locations;
  }

  render(): string {
    return `<LinearGradient colors={[${this.colors.map(c => `'${c}'`).join(', ')}]} start={${JSON.stringify(this.start)}} end={${JSON.stringify(this.end)}} />`;
  }

  getCSS(): string {
    const angle = this.calculateAngle();
    return `linear-gradient(${angle}deg, ${this.colors.join(', ')})`;
  }

  private calculateAngle(): number {
    if (!this.start || !this.end) return 180;
    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;
    return Math.atan2(dy, dx) * 180 / Math.PI + 90;
  }
}

export default { LinearGradient };

// CLI Demo
if (import.meta.url.includes("elide-react-native-linear-gradient.ts")) {
  console.log("🌈 React Native Linear Gradient - Gradient Support for Elide (POLYGLOT!)\n");

  const gradient1 = new LinearGradient({
    colors: ['#FF6B6B', '#4ECDC4'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  });
  console.log('Gradient 1:', gradient1.getCSS());

  const gradient2 = new LinearGradient({
    colors: ['#667eea', '#764ba2', '#f093fb'],
  });
  console.log('Gradient 2:', gradient2.getCSS());

  console.log("\n🚀 ~1M+ downloads/week on npm!");
}
