/**
 * ConflictResolver - Handles conflicts during sync using various strategies
 * Supports Last-Write-Wins, First-Write-Wins, and custom resolution
 */

import {
  Change,
  Document,
  VectorClock,
  ConflictResolutionStrategy,
  OperationType
} from '../types';

export interface ConflictResolution {
  winner: Change;
  loser: Change;
  strategy: ConflictResolutionStrategy;
}

export type CustomResolver = (local: Change, remote: Change) => Change;

export class ConflictResolver {
  private strategy: ConflictResolutionStrategy;
  private customResolver?: CustomResolver;

  constructor(
    strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.LAST_WRITE_WINS,
    customResolver?: CustomResolver
  ) {
    this.strategy = strategy;
    this.customResolver = customResolver;
  }

  /**
   * Resolve a conflict between local and remote changes
   */
  resolve(local: Change, remote: Change, vectorClock: VectorClock): Change {
    console.log(
      `Resolving conflict for document ${local.documentId} using ${this.strategy}`
    );

    // If custom resolver is provided, use it
    if (this.strategy === ConflictResolutionStrategy.CUSTOM && this.customResolver) {
      return this.customResolver(local, remote);
    }

    switch (this.strategy) {
      case ConflictResolutionStrategy.LAST_WRITE_WINS:
        return this.lastWriteWins(local, remote);

      case ConflictResolutionStrategy.FIRST_WRITE_WINS:
        return this.firstWriteWins(local, remote);

      default:
        return this.lastWriteWins(local, remote);
    }
  }

  /**
   * Last-Write-Wins: Choose the change with the latest timestamp
   */
  private lastWriteWins(local: Change, remote: Change): Change {
    if (local.timestamp > remote.timestamp) {
      return local;
    } else if (remote.timestamp > local.timestamp) {
      return remote;
    } else {
      // Timestamps are equal - use client ID as tiebreaker
      return local.clientId > remote.clientId ? local : remote;
    }
  }

  /**
   * First-Write-Wins: Choose the change with the earliest timestamp
   */
  private firstWriteWins(local: Change, remote: Change): Change {
    if (local.timestamp < remote.timestamp) {
      return local;
    } else if (remote.timestamp < local.timestamp) {
      return remote;
    } else {
      // Timestamps are equal - use client ID as tiebreaker
      return local.clientId < remote.clientId ? local : remote;
    }
  }

  /**
   * Detect if two changes are in conflict
   */
  isConflict(change1: Change, change2: Change, vectorClock: VectorClock): boolean {
    // Same document?
    if (change1.documentId !== change2.documentId || change1.table !== change2.table) {
      return false;
    }

    // Check if changes are concurrent using vector clock
    return this.areConcurrent(change1, change2, vectorClock);
  }

  /**
   * Check if two changes are concurrent (happened independently)
   */
  private areConcurrent(change1: Change, change2: Change, vectorClock: VectorClock): boolean {
    const client1Version = vectorClock[change1.clientId] || 0;
    const client2Version = vectorClock[change2.clientId] || 0;

    // If both changes happened after each client's last known state,
    // they are concurrent
    return change1.version > client2Version && change2.version > client1Version;
  }

  /**
   * Merge two documents field-by-field (for custom resolution)
   */
  mergeDocuments(doc1: Document, doc2: Document): Document {
    const merged = { ...doc1 };

    for (const [key, value] of Object.entries(doc2)) {
      // Skip system fields
      if (key.startsWith('_')) continue;

      // If field exists in both, choose the one with latest timestamp
      if (key in doc1) {
        // Use doc2's value if it's newer or if timestamps are equal and doc2's client ID is greater
        if (
          doc2._timestamp > doc1._timestamp ||
          (doc2._timestamp === doc1._timestamp && doc2._clientId > doc1._clientId)
        ) {
          merged[key] = value;
        }
      } else {
        // Field only in doc2, add it
        merged[key] = value;
      }
    }

    // Update metadata
    merged._version = Math.max(doc1._version, doc2._version) + 1;
    merged._timestamp = Date.now();

    return merged;
  }

  /**
   * Create a three-way merge between base, local, and remote documents
   */
  threeWayMerge(base: Document, local: Document, remote: Document): Document {
    const merged = { ...base };

    // Get all unique keys from all three documents
    const allKeys = new Set([
      ...Object.keys(base),
      ...Object.keys(local),
      ...Object.keys(remote)
    ]);

    for (const key of allKeys) {
      // Skip system fields
      if (key.startsWith('_')) continue;

      const baseValue = base[key];
      const localValue = local[key];
      const remoteValue = remote[key];

      // Both modified the same field
      if (localValue !== baseValue && remoteValue !== baseValue) {
        if (localValue === remoteValue) {
          // Both made the same change
          merged[key] = localValue;
        } else {
          // Conflict - use Last-Write-Wins
          merged[key] =
            local._timestamp > remote._timestamp ? localValue : remoteValue;
        }
      }
      // Only local modified
      else if (localValue !== baseValue) {
        merged[key] = localValue;
      }
      // Only remote modified
      else if (remoteValue !== baseValue) {
        merged[key] = remoteValue;
      }
      // Neither modified
      else {
        merged[key] = baseValue;
      }
    }

    // Update metadata
    merged._version = Math.max(local._version, remote._version) + 1;
    merged._timestamp = Date.now();

    return merged;
  }

  /**
   * Operational Transform for collaborative editing
   * Transforms an operation based on another concurrent operation
   */
  transform(op1: Change, op2: Change): Change {
    // If operations don't conflict, return original
    if (op1.documentId !== op2.documentId || op1.table !== op2.table) {
      return op1;
    }

    // Handle different operation type combinations
    if (op1.operation === OperationType.DELETE) {
      return op1; // Deletes always win
    }

    if (op2.operation === OperationType.DELETE) {
      // If other operation is delete, this operation is superseded
      return op2;
    }

    // Both are INSERT or UPDATE - merge the documents
    const doc1 = op1.data as Document;
    const doc2 = op2.data as Document;
    const merged = this.mergeDocuments(doc1, doc2);

    return {
      ...op1,
      data: merged,
      version: merged._version,
      timestamp: merged._timestamp
    };
  }

  /**
   * CRDT-based automatic conflict resolution for specific data types
   */
  crdtMerge(local: any, remote: any, dataType: 'counter' | 'set' | 'map' | 'text'): any {
    switch (dataType) {
      case 'counter':
        // Counter CRDT - sum of all increments
        return (local || 0) + (remote || 0);

      case 'set':
        // OR-Set CRDT - union of both sets
        const localSet = new Set(local || []);
        const remoteSet = new Set(remote || []);
        return Array.from(new Set([...localSet, ...remoteSet]));

      case 'map':
        // LWW-Map CRDT - per-key last-write-wins
        return { ...(local || {}), ...(remote || {}) };

      case 'text':
        // Simple text CRDT - for full implementation, use Yjs or Automerge
        // This is a simplified version
        return this.mergeText(local || '', remote || '');

      default:
        return local;
    }
  }

  /**
   * Simple text merging (for demonstration - use a proper CRDT library in production)
   */
  private mergeText(text1: string, text2: string): string {
    // Find longest common subsequence
    const lcs = this.longestCommonSubsequence(text1, text2);

    // Reconstruct merged text
    let merged = '';
    let i = 0, j = 0, k = 0;

    while (k < lcs.length || i < text1.length || j < text2.length) {
      if (k < lcs.length && i < text1.length && text1[i] === lcs[k]) {
        merged += text1[i];
        i++;
        k++;
      } else if (k < lcs.length && j < text2.length && text2[j] === lcs[k]) {
        merged += text2[j];
        j++;
        k++;
      } else if (i < text1.length) {
        merged += text1[i];
        i++;
      } else if (j < text2.length) {
        merged += text2[j];
        j++;
      }
    }

    return merged;
  }

  /**
   * Longest common subsequence algorithm
   */
  private longestCommonSubsequence(str1: string, str2: string): string {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Reconstruct LCS
    let lcs = '';
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (str1[i - 1] === str2[j - 1]) {
        lcs = str1[i - 1] + lcs;
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }

  /**
   * Get conflict history for a document
   */
  getConflictHistory(documentId: string, changes: Change[]): ConflictResolution[] {
    const history: ConflictResolution[] = [];
    const docChanges = changes.filter(c => c.documentId === documentId);

    for (let i = 0; i < docChanges.length - 1; i++) {
      for (let j = i + 1; j < docChanges.length; j++) {
        const change1 = docChanges[i];
        const change2 = docChanges[j];

        if (this.isConflict(change1, change2, {})) {
          const winner = this.resolve(change1, change2, {});
          const loser = winner === change1 ? change2 : change1;

          history.push({
            winner,
            loser,
            strategy: this.strategy
          });
        }
      }
    }

    return history;
  }
}
