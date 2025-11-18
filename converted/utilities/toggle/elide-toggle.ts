/**
 * Toggle - Minimal Toggle Library
 *
 * Minimal library for managing feature toggles.
 * **POLYGLOT SHOWCASE**: One minimal toggle for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/toggle (~10K+ downloads/week)
 *
 * Features:
 * - Minimal API
 * - Fast operations
 * - Simple state management
 * - Zero dependencies
 *
 * Use cases:
 * - Simple toggles
 * - State management
 *
 * Package has ~10K+ downloads/week on npm!
 */

export class Toggle {
  private state: boolean;

  constructor(initialState = false) {
    this.state = initialState;
  }

  on(): void {
    this.state = true;
  }

  off(): void {
    this.state = false;
  }

  toggle(): void {
    this.state = !this.state;
  }

  isOn(): boolean {
    return this.state;
  }

  isOff(): boolean {
    return !this.state;
  }

  set(value: boolean): void {
    this.state = value;
  }

  get(): boolean {
    return this.state;
  }
}

export function createToggle(initialState?: boolean): Toggle {
  return new Toggle(initialState);
}

export default { createToggle, Toggle };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔘 Toggle - Minimal Toggle Library (POLYGLOT!)\n');

  const toggle = createToggle(false);

  console.log('=== Example 1: Basic Operations ===');
  console.log('Initial state:', toggle.get());
  toggle.on();
  console.log('After on():', toggle.isOn());
  toggle.off();
  console.log('After off():', toggle.isOff());
  toggle.toggle();
  console.log('After toggle():', toggle.isOn());
  console.log();

  console.log('=== Example 2: Set State ===');
  toggle.set(true);
  console.log('After set(true):', toggle.get());
  toggle.set(false);
  console.log('After set(false):', toggle.get());
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
