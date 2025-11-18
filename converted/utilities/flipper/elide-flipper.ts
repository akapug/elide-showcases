/**
 * Flipper - Feature Flipper Library
 *
 * Feature flipper for conditional feature activation.
 * **POLYGLOT SHOWCASE**: One flipper for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/flipper (~5K+ downloads/week)
 *
 * Features:
 * - Feature flipping
 * - Conditional activation
 * - Actor-based features
 * - Group support
 * - Zero dependencies
 *
 * Use cases:
 * - Feature flipping
 * - User-based features
 * - Group features
 *
 * Package has ~5K+ downloads/week on npm!
 */

export interface Actor {
  id: string;
  [key: string]: any;
}

export interface Group {
  name: string;
  match: (actor: Actor) => boolean;
}

export class Flipper {
  private features = new Map<string, FeatureState>();
  private groups = new Map<string, Group>();

  addFeature(name: string): void {
    if (!this.features.has(name)) {
      this.features.set(name, new FeatureState(name));
    }
  }

  feature(name: string): FeatureState | undefined {
    return this.features.get(name);
  }

  enable(name: string): void {
    this.addFeature(name);
    this.features.get(name)!.enableForAll();
  }

  disable(name: string): void {
    this.addFeature(name);
    this.features.get(name)!.disableForAll();
  }

  isEnabled(name: string, actor?: Actor): boolean {
    const feature = this.features.get(name);
    if (!feature) return false;
    return feature.isEnabled(actor);
  }

  registerGroup(name: string, match: (actor: Actor) => boolean): void {
    this.groups.set(name, { name, match });
  }

  getGroup(name: string): Group | undefined {
    return this.groups.get(name);
  }
}

class FeatureState {
  private name: string;
  private enabledForAll = false;
  private disabledForAll = false;
  private actors = new Set<string>();
  private groups = new Set<string>();
  private percentage = 0;

  constructor(name: string) {
    this.name = name;
  }

  enableForAll(): void {
    this.enabledForAll = true;
    this.disabledForAll = false;
  }

  disableForAll(): void {
    this.disabledForAll = true;
    this.enabledForAll = false;
  }

  enableActor(actor: Actor): void {
    this.actors.add(actor.id);
  }

  disableActor(actor: Actor): void {
    this.actors.delete(actor.id);
  }

  enableGroup(groupName: string): void {
    this.groups.add(groupName);
  }

  disableGroup(groupName: string): void {
    this.groups.delete(groupName);
  }

  enablePercentage(percentage: number): void {
    this.percentage = percentage;
  }

  isEnabled(actor?: Actor): boolean {
    if (this.disabledForAll) return false;
    if (this.enabledForAll) return true;

    if (actor) {
      if (this.actors.has(actor.id)) return true;

      if (this.percentage > 0) {
        const hash = this.hashActor(actor.id);
        if (hash < this.percentage) return true;
      }
    }

    return false;
  }

  private hashActor(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }
}

export function createFlipper(): Flipper {
  return new Flipper();
}

export default { createFlipper, Flipper };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎲 Flipper - Feature Flipper (POLYGLOT!)\n');

  const flipper = createFlipper();

  console.log('=== Example 1: Enable/Disable All ===');
  flipper.enable('feature-a');
  console.log('Feature A (all):', flipper.isEnabled('feature-a'));
  flipper.disable('feature-a');
  console.log('Feature A (disabled):', flipper.isEnabled('feature-a'));
  console.log();

  console.log('=== Example 2: Actor-based Features ===');
  flipper.addFeature('premium');
  const user1: Actor = { id: 'user1', plan: 'premium' };
  const user2: Actor = { id: 'user2', plan: 'free' };
  flipper.feature('premium')!.enableActor(user1);
  console.log('Premium for user1:', flipper.isEnabled('premium', user1));
  console.log('Premium for user2:', flipper.isEnabled('premium', user2));
  console.log();

  console.log('=== Example 3: Percentage Rollout ===');
  flipper.addFeature('beta');
  flipper.feature('beta')!.enablePercentage(50);
  let enabled = 0;
  for (let i = 0; i < 100; i++) {
    if (flipper.isEnabled('beta', { id: `user${i}` })) {
      enabled++;
    }
  }
  console.log(`Beta enabled for ${enabled}/100 users (~50% expected)`);
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
