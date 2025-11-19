/**
 * Jest Clone - Snapshot Testing
 * Snapshot state management and comparison
 */

import type { SnapshotState, SnapshotMatchResult } from '../types';

export class SnapshotStateImpl implements SnapshotState {
  private snapshots: Map<string, any> = new Map();
  private uncheckedKeys: Set<string> = new Set();
  private snapshotPath: string;
  update: boolean;
  private added = 0;
  private updated = 0;
  private matched = 0;
  private unmatched = 0;

  constructor(snapshotPath: string, update: boolean) {
    this.snapshotPath = snapshotPath;
    this.update = update;
    this.load();
  }

  match(testName: string, received: any, key: string): SnapshotMatchResult {
    const snapshotKey = `${testName} ${key}`;
    const serialized = this.serialize(received);

    if (this.snapshots.has(snapshotKey)) {
      this.uncheckedKeys.delete(snapshotKey);
      const expected = this.snapshots.get(snapshotKey);

      if (serialized === expected) {
        this.matched++;
        return {
          actual: serialized,
          expected,
          pass: true,
          key: snapshotKey
        };
      } else if (this.update) {
        this.snapshots.set(snapshotKey, serialized);
        this.updated++;
        return {
          actual: serialized,
          expected: serialized,
          pass: true,
          key: snapshotKey
        };
      } else {
        this.unmatched++;
        return {
          actual: serialized,
          expected,
          pass: false,
          key: snapshotKey
        };
      }
    } else {
      // New snapshot
      this.snapshots.set(snapshotKey, serialized);
      this.added++;
      return {
        actual: serialized,
        expected: undefined,
        pass: true,
        key: snapshotKey
      };
    }
  }

  save(): void {
    // Write snapshots to file
    const snapshotData = Object.fromEntries(this.snapshots);
    // In a real implementation, this would write to a .snap file
    console.log(`Saving ${this.snapshots.size} snapshots to ${this.snapshotPath}`);
  }

  getUncheckedCount(): number {
    return this.uncheckedKeys.size;
  }

  removeUncheckedKeys(): void {
    for (const key of this.uncheckedKeys) {
      this.snapshots.delete(key);
    }
    this.uncheckedKeys.clear();
  }

  getStatus(): SnapshotStatus {
    return {
      added: this.added,
      updated: this.updated,
      matched: this.matched,
      unmatched: this.unmatched,
      unchecked: this.uncheckedKeys.size
    };
  }

  private load(): void {
    // Load existing snapshots from file
    // In a real implementation, this would read from a .snap file
    // For now, we'll start with an empty map
    this.uncheckedKeys = new Set(this.snapshots.keys());
  }

  private serialize(value: any): string {
    return this.prettyFormat(value);
  }

  private prettyFormat(value: any, indent = 0): string {
    const spaces = '  '.repeat(indent);

    if (value === null) {
      return 'null';
    }

    if (value === undefined) {
      return 'undefined';
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'string') {
      return JSON.stringify(value);
    }

    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }

    if (value instanceof Date) {
      return `Date(${value.toISOString()})`;
    }

    if (value instanceof RegExp) {
      return value.toString();
    }

    if (value instanceof Error) {
      return `Error(${value.message})`;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }

      const items = value.map(item => this.prettyFormat(item, indent + 1));
      return `[\n${spaces}  ${items.join(`,\n${spaces}  `)}\n${spaces}]`;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);

      if (keys.length === 0) {
        return '{}';
      }

      const entries = keys.map(
        key => `${key}: ${this.prettyFormat(value[key], indent + 1)}`
      );

      return `{\n${spaces}  ${entries.join(`,\n${spaces}  `)}\n${spaces}}`;
    }

    return String(value);
  }
}

interface SnapshotStatus {
  added: number;
  updated: number;
  matched: number;
  unmatched: number;
  unchecked: number;
}

export class SnapshotResolver {
  private testPath: string;

  constructor(testPath: string) {
    this.testPath = testPath;
  }

  resolveSnapshotPath(): string {
    // Convert test path to snapshot path
    // e.g., src/math.test.ts -> src/__snapshots__/math.test.ts.snap
    const parts = this.testPath.split('/');
    const filename = parts.pop()!;
    const dir = parts.join('/');

    return `${dir}/__snapshots__/${filename}.snap`;
  }

  resolveTestPath(snapshotPath: string): string {
    // Convert snapshot path back to test path
    return snapshotPath
      .replace('__snapshots__/', '')
      .replace('.snap', '');
  }
}

export function toMatchSnapshot(
  this: any,
  received: any,
  propertyMatchers?: object,
  hint?: string
): { pass: boolean; message: () => string } {
  const testName = this.currentTestName || 'unknown';
  const key = hint || '1';

  // Get or create snapshot state
  const snapshotState = this.snapshotState || new SnapshotStateImpl(
    new SnapshotResolver(this.testPath).resolveSnapshotPath(),
    this.updateSnapshot || false
  );

  const result = snapshotState.match(testName, received, key);

  return {
    pass: result.pass,
    message: () => result.pass
      ? `Expected value not to match snapshot`
      : `Expected value to match snapshot\n\nExpected:\n${result.expected}\n\nReceived:\n${result.actual}`
  };
}

export function toMatchInlineSnapshot(
  this: any,
  received: any,
  propertyMatchers?: object | string,
  inlineSnapshot?: string
): { pass: boolean; message: () => string } {
  const serialized = new SnapshotStateImpl('', false).match('', received, '1').actual;

  if (typeof propertyMatchers === 'string') {
    inlineSnapshot = propertyMatchers;
    propertyMatchers = undefined;
  }

  if (inlineSnapshot === undefined) {
    // Update source code with snapshot
    console.log('Inline snapshot would be updated in source code');
    return {
      pass: true,
      message: () => 'Snapshot written'
    };
  }

  const pass = serialized === inlineSnapshot;

  return {
    pass,
    message: () => pass
      ? `Expected value not to match inline snapshot`
      : `Expected value to match inline snapshot\n\nExpected:\n${inlineSnapshot}\n\nReceived:\n${serialized}`
  };
}
