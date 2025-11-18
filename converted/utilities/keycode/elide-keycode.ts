/**
 * keycode - Keyboard Key Code Utilities
 *
 * Convert between keyboard event codes and names.
 * **POLYGLOT SHOWCASE**: Key codes for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/keycode (~500K+ downloads/week)
 *
 * Features:
 * - Key code to name conversion
 * - Name to key code conversion
 * - Event parsing
 * - Alias support
 * - Cross-browser support
 * - Zero dependencies
 *
 * Use cases:
 * - Keyboard shortcuts
 * - Event handling
 * - Input validation
 * - Accessibility
 *
 * Package has ~500K+ downloads/week on npm!
 */

const CODES: Record<number, string> = {
  8: 'backspace', 9: 'tab', 13: 'enter', 16: 'shift', 17: 'ctrl',
  18: 'alt', 20: 'caps lock', 27: 'escape', 32: 'space',
  33: 'page up', 34: 'page down', 35: 'end', 36: 'home',
  37: 'left', 38: 'up', 39: 'right', 40: 'down',
  45: 'insert', 46: 'delete',
  48: '0', 49: '1', 50: '2', 51: '3', 52: '4',
  53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
  65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e', 70: 'f',
  71: 'g', 72: 'h', 73: 'i', 74: 'j', 75: 'k', 76: 'l',
  77: 'm', 78: 'n', 79: 'o', 80: 'p', 81: 'q', 82: 'r',
  83: 's', 84: 't', 85: 'u', 86: 'v', 87: 'w', 88: 'x',
  89: 'y', 90: 'z',
  91: 'command', 93: 'command', 224: 'command',
  112: 'f1', 113: 'f2', 114: 'f3', 115: 'f4', 116: 'f5',
  117: 'f6', 118: 'f7', 119: 'f8', 120: 'f9', 121: 'f10',
  122: 'f11', 123: 'f12'
};

const NAMES: Record<string, number> = Object.fromEntries(
  Object.entries(CODES).map(([code, name]) => [name, parseInt(code)])
);

// Aliases
NAMES['esc'] = 27;
NAMES['return'] = 13;
NAMES['cmd'] = 91;
NAMES['meta'] = 91;
NAMES['control'] = 17;
NAMES['option'] = 18;

/**
 * Convert key code to name or vice versa
 */
function keycode(input: number | string | KeyboardEvent): string | number | undefined {
  if (typeof input === 'number') {
    return CODES[input];
  }

  if (typeof input === 'string') {
    const code = NAMES[input.toLowerCase()];
    if (code !== undefined) return code;

    // Try length 1 strings
    if (input.length === 1) {
      return input.toUpperCase().charCodeAt(0);
    }

    return undefined;
  }

  // Handle event
  if (input && 'keyCode' in input) {
    return CODES[input.keyCode];
  }

  return undefined;
}

/**
 * Get all key codes
 */
keycode.codes = CODES;

/**
 * Get all key names
 */
keycode.names = NAMES;

/**
 * Check if code exists
 */
keycode.isEventKey = function(event: KeyboardEvent, name: string): boolean {
  const eventName = keycode(event);
  return eventName === name.toLowerCase();
};

export default keycode;
export { keycode, CODES, NAMES };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⌨️  keycode - Key Code Utilities (POLYGLOT!)\n");

  console.log("=== Example 1: Code to Name ===");
  console.log(`13 -> ${keycode(13)}`);
  console.log(`27 -> ${keycode(27)}`);
  console.log(`65 -> ${keycode(65)}`);
  console.log();

  console.log("=== Example 2: Name to Code ===");
  console.log(`enter -> ${keycode('enter')}`);
  console.log(`escape -> ${keycode('escape')}`);
  console.log(`a -> ${keycode('a')}`);
  console.log();

  console.log("=== Example 3: Aliases ===");
  console.log(`esc -> ${keycode('esc')}`);
  console.log(`return -> ${keycode('return')}`);
  console.log(`cmd -> ${keycode('cmd')}`);
  console.log();

  console.log("=== Example 4: Check Event Key ===");
  const event = { keyCode: 13 } as KeyboardEvent;
  console.log(`Event is 'enter': ${keycode.isEventKey(event, 'enter')}`);
  console.log();

  console.log("=== Example 5: All Codes ===");
  const sampleCodes = Object.entries(CODES).slice(0, 5);
  sampleCodes.forEach(([code, name]) => {
    console.log(`  ${code}: ${name}`);
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Keyboard shortcuts");
  console.log("- Event handling");
  console.log("- Input validation");
  console.log("- Accessibility features");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant lookups");
  console.log("- ~500K+ downloads/week on npm!");
}
