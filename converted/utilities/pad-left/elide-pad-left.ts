/**
 * Pad Left - Elide Polyglot Showcase
 *
 * Left-pad strings with characters to specified width.
 * Perfect for formatting numbers, terminal output, and alignment.
 *
 * Features:
 * - Pad strings to specific width
 * - Custom padding character
 * - Number formatting (zero-padding)
 * - Alignment utilities
 * - Zero dependencies
 *
 * Use cases:
 * - Zero-padding numbers (5 → 005)
 * - Terminal table alignment
 * - Log formatting
 * - File naming (file001.jpg)
 * - Time formatting (9:05 → 09:05)
 */

interface PadOptions {
  /** Total width to pad to */
  width?: number;
  /** Character to pad with (default: ' ') */
  char?: string;
  /** Pad on right instead of left */
  padRight?: boolean;
}

/**
 * Left-pad a string to specified width
 */
export default function padLeft(
  str: string | number,
  widthOrOptions: number | PadOptions = 0,
  char: string = ' '
): string {
  // Convert to string
  const s = String(str);

  // Handle options object
  let options: PadOptions;
  if (typeof widthOrOptions === 'number') {
    options = { width: widthOrOptions, char };
  } else {
    options = widthOrOptions;
  }

  const { width = 0, char: padChar = ' ', padRight = false } = options;

  // Already wide enough
  if (s.length >= width) {
    return s;
  }

  const padding = padChar.repeat(width - s.length);

  return padRight ? s + padding : padding + s;
}

/**
 * Zero-pad numbers (5 → 005)
 */
export function zeroPad(num: number | string, width: number): string {
  return padLeft(num, width, '0');
}

/**
 * Pad on the right
 */
export function padRight(str: string | number, width: number, char: string = ' '): string {
  return padLeft(str, { width, char, padRight: true });
}

/**
 * Center-align by padding both sides
 */
export function center(str: string, width: number, char: string = ' '): string {
  const s = String(str);
  if (s.length >= width) return s;

  const totalPad = width - s.length;
  const leftPad = Math.floor(totalPad / 2);
  const rightPad = totalPad - leftPad;

  return char.repeat(leftPad) + s + char.repeat(rightPad);
}

// CLI Demo
if (import.meta.url.includes("elide-pad-left.ts")) {
  console.log("⬅️  Pad Left - String Padding for Elide\n");

  console.log("=== Example 1: Zero-Padding Numbers ===");
  console.log(zeroPad(5, 3));
  console.log(zeroPad(42, 5));
  console.log(zeroPad(123, 6));
  console.log();

  console.log("=== Example 2: File Naming ===");
  console.log("Files:");
  for (let i = 1; i <= 10; i++) {
    console.log(`  file${zeroPad(i, 3)}.jpg`);
  }
  console.log();

  console.log("=== Example 3: Time Formatting ===");
  const times = [[9, 5], [14, 30], [23, 59]];
  times.forEach(([h, m]) => {
    console.log(`  ${zeroPad(h, 2)}:${zeroPad(m, 2)}`);
  });
  console.log();

  console.log("=== Example 4: Terminal Table Alignment ===");
  const data = [
    ['ID', 'Name', 'Age'],
    [1, 'Alice', 25],
    [42, 'Bob', 30],
    [123, 'Charlie', 35]
  ];

  data.forEach(row => {
    const formatted = [
      padLeft(row[0], 5),
      padRight(row[1], 10),
      padLeft(row[2], 5)
    ];
    console.log(`  | ${formatted.join(' | ')} |`);
  });
  console.log();

  console.log("=== Example 5: Log Line Numbers ===");
  const logs = [
    "Application started",
    "Database connected",
    "Server listening on port 3000"
  ];

  logs.forEach((log, i) => {
    console.log(`  ${zeroPad(i + 1, 4)} | ${log}`);
  });
  console.log();

  console.log("=== Example 6: Currency Formatting ===");
  const amounts = [5, 42.5, 123.45, 1234.56];
  amounts.forEach(amount => {
    const formatted = amount.toFixed(2);
    console.log(`  $${padLeft(formatted, 10)}`);
  });
  console.log();

  console.log("=== Example 7: Progress Bar ===");
  const progress = [0, 25, 50, 75, 100];
  progress.forEach(pct => {
    const filled = '█'.repeat(pct / 5);
    const empty = '░'.repeat(20 - pct / 5);
    console.log(`  ${padLeft(pct, 3)}% [${filled}${empty}]`);
  });
  console.log();

  console.log("=== Example 8: Center Alignment ===");
  const titles = ["Welcome", "Dashboard", "Settings"];
  titles.forEach(title => {
    console.log(`  ${center(title, 30, '-')}`);
  });
  console.log();

  console.log("=== Example 9: Invoice Line Items ===");
  const items = [
    { qty: 5, item: "Widget", price: 12.99 },
    { qty: 10, item: "Gadget", price: 24.50 },
    { qty: 2, item: "Tool", price: 99.99 }
  ];

  console.log("Invoice:");
  items.forEach(({ qty, item, price }) => {
    const total = (qty * price).toFixed(2);
    console.log(`  ${padLeft(qty, 4)} × ${padRight(item, 15)} $${padLeft(total, 8)}`);
  });
  console.log();

  console.log("=== Example 10: Version Numbers ===");
  const versions = [
    [1, 0, 0],
    [1, 5, 2],
    [2, 10, 15]
  ];

  versions.forEach(([major, minor, patch]) => {
    console.log(`  v${zeroPad(major, 2)}.${zeroPad(minor, 2)}.${zeroPad(patch, 2)}`);
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Zero-padding numbers");
  console.log("- Terminal table formatting");
  console.log("- Log line numbers");
  console.log("- File naming sequences");
  console.log("- Time/date formatting");
  console.log("- Currency alignment");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- O(n) complexity");
  console.log("- Instant execution");
  console.log();

  console.log("💡 Tips:");
  console.log("- Use '0' for numbers");
  console.log("- Use ' ' for text alignment");
  console.log("- Consider padRight() for labels");
  console.log("- Use center() for titles");
}
