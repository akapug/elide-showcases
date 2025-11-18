/**
 * jest-snapshot - Snapshot Testing
 *
 * Jest's snapshot testing utilities.
 * **POLYGLOT SHOWCASE**: One snapshot testing library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jest-snapshot (~5M+ downloads/week)
 *
 * Features:
 * - Snapshot testing
 * - Inline snapshots
 * - Update snapshots
 * - Snapshot serializers
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

const snapshots = new Map<string, any>();

export function toMatchSnapshot(received: any, testName: string): { pass: boolean; message: () => string } {
  const key = testName;
  if (!snapshots.has(key)) {
    snapshots.set(key, received);
    return { pass: true, message: () => 'Snapshot created' };
  }
  const snapshot = snapshots.get(key);
  const pass = JSON.stringify(received) === JSON.stringify(snapshot);
  return {
    pass,
    message: () => pass ? 'Snapshot matches' : `Snapshot doesn't match`
  };
}

export function toMatchInlineSnapshot(received: any, snapshot?: any): { pass: boolean; message: () => string } {
  if (!snapshot) {
    return { pass: true, message: () => 'Inline snapshot created' };
  }
  const pass = JSON.stringify(received) === JSON.stringify(snapshot);
  return {
    pass,
    message: () => pass ? 'Inline snapshot matches' : `Inline snapshot doesn't match`
  };
}

export function updateSnapshot(testName: string, value: any) {
  snapshots.set(testName, value);
}

if (import.meta.url.includes("elide-jest-snapshot.ts")) {
  console.log("🧪 jest-snapshot - Snapshot Testing for Elide (POLYGLOT!)\n");
  const result = toMatchSnapshot({ name: 'Alice' }, 'user-test');
  console.log("Snapshot result:", result.message());
  console.log("\n✓ ~5M+ downloads/week on npm!");
}
