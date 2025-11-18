/**
 * keyboard-key - Keyboard Event Key Utilities
 *
 * Utilities for working with keyboard event keys.
 * **POLYGLOT SHOWCASE**: Keyboard handling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/keyboard-key (~100K+ downloads/week)
 *
 * Features:
 * - Key code normalization
 * - Cross-browser compatibility
 * - Key name to code mapping
 * - Event helper functions
 * - Modifier key detection
 * - Zero dependencies
 *
 * Use cases:
 * - Keyboard shortcuts
 * - Accessibility features
 * - Game controls
 * - Form handling
 *
 * Package has ~100K+ downloads/week on npm!
 */

const KEY_CODES: Record<string, number> = {
  'Backspace': 8,
  'Tab': 9,
  'Enter': 13,
  'Shift': 16,
  'Ctrl': 17,
  'Alt': 18,
  'Escape': 27,
  'Space': 32,
  'ArrowLeft': 37,
  'ArrowUp': 38,
  'ArrowRight': 39,
  'ArrowDown': 40,
  'Delete': 46,
  'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69,
  'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74,
  'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79,
  'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84,
  'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89, 'z': 90
};

const CODE_TO_KEY: Record<number, string> = Object.fromEntries(
  Object.entries(KEY_CODES).map(([k, v]) => [v, k])
);

interface KeyboardEventLike {
  key?: string;
  keyCode?: number;
  which?: number;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

class KeyboardKey {
  /**
   * Get key code from event
   */
  getCode(event: KeyboardEventLike): number | undefined {
    return event.keyCode || event.which;
  }

  /**
   * Get key name from event
   */
  getKey(event: KeyboardEventLike): string | undefined {
    if (event.key) return event.key;
    const code = this.getCode(event);
    return code ? CODE_TO_KEY[code] : undefined;
  }

  /**
   * Check if key matches
   */
  isKey(event: KeyboardEventLike, key: string): boolean {
    const eventKey = this.getKey(event);
    return eventKey?.toLowerCase() === key.toLowerCase();
  }

  /**
   * Check if modifier key is pressed
   */
  hasModifier(event: KeyboardEventLike): boolean {
    return !!(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey);
  }

  /**
   * Get modifier state
   */
  getModifiers(event: KeyboardEventLike): string[] {
    const modifiers: string[] = [];
    if (event.shiftKey) modifiers.push('Shift');
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey) modifiers.push('Alt');
    if (event.metaKey) modifiers.push('Meta');
    return modifiers;
  }

  /**
   * Convert key name to code
   */
  toCode(key: string): number | undefined {
    return KEY_CODES[key];
  }

  /**
   * Convert code to key name
   */
  toKey(code: number): string | undefined {
    return CODE_TO_KEY[code];
  }
}

const keyboardKey = new KeyboardKey();

export default keyboardKey;
export { KeyboardKey, KeyboardEventLike, KEY_CODES };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⌨️  keyboard-key - Keyboard Event Utilities (POLYGLOT!)\n");

  console.log("=== Example 1: Key to Code ===");
  console.log(`Enter key code: ${keyboardKey.toCode('Enter')}`);
  console.log(`Escape key code: ${keyboardKey.toCode('Escape')}`);
  console.log();

  console.log("=== Example 2: Code to Key ===");
  console.log(`Code 13: ${keyboardKey.toKey(13)}`);
  console.log(`Code 27: ${keyboardKey.toKey(27)}`);
  console.log();

  console.log("=== Example 3: Check Event Key ===");
  const event1 = { key: 'Enter', keyCode: 13 };
  console.log(`Is Enter: ${keyboardKey.isKey(event1, 'Enter')}`);
  console.log();

  console.log("=== Example 4: Get Modifiers ===");
  const event2 = { key: 's', ctrlKey: true, shiftKey: true };
  const mods = keyboardKey.getModifiers(event2);
  console.log(`Modifiers: ${mods.join('+')}`);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Keyboard shortcuts");
  console.log("- Accessibility features");
  console.log("- Game controls");
  console.log("- Form handling");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast lookups");
  console.log("- ~100K+ downloads/week on npm!");
}
