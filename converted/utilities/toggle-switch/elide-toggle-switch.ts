/**
 * Toggle Switch - UI Toggle Component
 *
 * Toggle switch component for feature activation.
 * **POLYGLOT SHOWCASE**: One toggle switch for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/toggle-switch (~3K+ downloads/week)
 *
 * Features:
 * - Simple toggle switches
 * - State management
 * - Event callbacks
 * - Customizable
 * - Zero dependencies
 *
 * Use cases:
 * - UI toggle switches
 * - Feature switches
 *
 * Package has ~3K+ downloads/week on npm!
 */

export interface ToggleSwitchOptions {
  defaultState?: boolean;
  onChange?: (state: boolean) => void;
  disabled?: boolean;
}

export class ToggleSwitch {
  private state: boolean;
  private options: ToggleSwitchOptions;
  private listeners: Array<(state: boolean) => void> = [];

  constructor(options: ToggleSwitchOptions = {}) {
    this.state = options.defaultState || false;
    this.options = options;

    if (options.onChange) {
      this.listeners.push(options.onChange);
    }
  }

  toggle(): void {
    if (this.options.disabled) return;
    this.setState(!this.state);
  }

  turnOn(): void {
    if (this.options.disabled) return;
    this.setState(true);
  }

  turnOff(): void {
    if (this.options.disabled) return;
    this.setState(false);
  }

  setState(state: boolean): void {
    if (this.options.disabled) return;
    if (this.state !== state) {
      this.state = state;
      this.notifyListeners();
    }
  }

  getState(): boolean {
    return this.state;
  }

  isOn(): boolean {
    return this.state;
  }

  isOff(): boolean {
    return !this.state;
  }

  disable(): void {
    this.options.disabled = true;
  }

  enable(): void {
    this.options.disabled = false;
  }

  isDisabled(): boolean {
    return this.options.disabled || false;
  }

  onChange(callback: (state: boolean) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export function createSwitch(options?: ToggleSwitchOptions): ToggleSwitch {
  return new ToggleSwitch(options);
}

export default { createSwitch, ToggleSwitch };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎚️  Toggle Switch - UI Toggles (POLYGLOT!)\n');

  const toggle = createSwitch({
    defaultState: false,
    onChange: (state) => console.log('  → State changed to:', state),
  });

  console.log('=== Example 1: Basic Operations ===');
  console.log('Initial state:', toggle.getState());
  toggle.turnOn();
  console.log('After turnOn():', toggle.isOn());
  toggle.turnOff();
  console.log('After turnOff():', toggle.isOff());
  console.log();

  console.log('=== Example 2: Toggle ===');
  toggle.toggle();
  console.log('After toggle():', toggle.getState());
  toggle.toggle();
  console.log('After toggle():', toggle.getState());
  console.log();

  console.log('=== Example 3: Disabled State ===');
  toggle.disable();
  console.log('Is disabled:', toggle.isDisabled());
  toggle.toggle(); // Should not work
  console.log('State (unchanged):', toggle.getState());
  toggle.enable();
  toggle.toggle(); // Should work
  console.log('State (changed):', toggle.getState());
  console.log();

  console.log('=== Example 4: Event Listeners ===');
  const eventToggle = createSwitch();
  eventToggle.onChange((state) => {
    console.log('  ✓ Listener fired, new state:', state);
  });
  eventToggle.toggle();
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
