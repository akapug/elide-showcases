/**
 * snapshot-diff - Snapshot Diffing
 *
 * Diff snapshots for better testing.
 * **POLYGLOT SHOWCASE**: One snapshot diff library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/snapshot-diff (~100K+ downloads/week)
 *
 * Features:
 * - Diff two snapshots
 * - Readable output
 * - Works with Jest
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export function toMatchDiffSnapshot(a: any, b: any): { pass: boolean; message: () => string; diff: string } {
  const strA = JSON.stringify(a, null, 2);
  const strB = JSON.stringify(b, null, 2);
  const diff = strA === strB ? 'No changes' : `- ${strA}\n+ ${strB}`;
  return {
    pass: strA === strB,
    message: () => strA === strB ? 'Snapshots match' : 'Snapshots differ',
    diff
  };
}

export function snapshotDiff(a: any, b: any, options?: { colors?: boolean }): string {
  const strA = JSON.stringify(a, null, 2);
  const strB = JSON.stringify(b, null, 2);
  if (strA === strB) return 'No changes';
  return `- ${strA}\n+ ${strB}`;
}

if (import.meta.url.includes("elide-snapshot-diff.ts")) {
  console.log("🧪 snapshot-diff - Snapshot Diffing for Elide (POLYGLOT!)\n");
  const diff = snapshotDiff({ name: 'Alice' }, { name: 'Bob' });
  console.log("Diff:", diff);
  console.log("\n✓ ~100K+ downloads/week on npm!");
}
