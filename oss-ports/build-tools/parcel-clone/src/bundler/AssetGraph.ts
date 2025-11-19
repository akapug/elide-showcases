/**
 * Parcel Clone - Asset Graph
 *
 * Manages relationships between assets and dependencies.
 */

import type { Asset } from './Bundler';

export class AssetGraph {
  private assets: Map<string, Asset> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();
  private entries: Asset[] = [];

  addAsset(asset: Asset): void {
    this.assets.set(asset.id, asset);
    if (asset.isEntry) {
      this.entries.push(asset);
    }
  }

  addDependency(from: Asset, to: Asset): void {
    if (!this.dependencies.has(from.id)) {
      this.dependencies.set(from.id, new Set());
    }
    this.dependencies.get(from.id)!.add(to.id);
  }

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  getEntries(): Asset[] {
    return this.entries;
  }

  getAssets(entry: Asset): Asset[] {
    const result: Asset[] = [entry];
    const visited = new Set<string>([entry.id]);
    const queue = [entry.id];

    while (queue.length > 0) {
      const id = queue.shift()!;
      const deps = this.dependencies.get(id);

      if (deps) {
        for (const depId of deps) {
          if (!visited.has(depId)) {
            visited.add(depId);
            const asset = this.assets.get(depId);
            if (asset) {
              result.push(asset);
              queue.push(depId);
            }
          }
        }
      }
    }

    return result;
  }
}
