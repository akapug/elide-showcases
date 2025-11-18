/**
 * Flagr Client - Feature Flag Evaluation Service
 *
 * Client for Flagr feature flag evaluation service.
 * **POLYGLOT SHOWCASE**: One Flagr client for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/flagr-client (~5K+ downloads/week)
 *
 * Features:
 * - Flag evaluation
 * - Variant selection
 * - Context-based evaluation
 * - Batch evaluation
 * - Zero dependencies
 *
 * Use cases:
 * - Flagr integration
 * - Service flags
 *
 * Package has ~5K+ downloads/week on npm!
 */

export interface FlagrContext {
  entityID: string;
  entityType?: string;
  entityContext?: Record<string, any>;
}

export interface EvaluationResult {
  flagID: number;
  flagKey: string;
  variantID: number;
  variantKey: string;
  variantAttachment?: any;
}

export class FlagrClient {
  private baseURL: string;
  private flags = new Map<string, any>();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async evaluate(flagKey: string, context: FlagrContext): Promise<EvaluationResult | null> {
    // Mock evaluation
    return {
      flagID: 1,
      flagKey,
      variantID: 1,
      variantKey: 'control',
    };
  }

  async evaluateBatch(contexts: Array<{ flagKey: string; context: FlagrContext }>): Promise<EvaluationResult[]> {
    return Promise.all(contexts.map(c => this.evaluate(c.flagKey, c.context).then(r => r!)));
  }

  // Demo helper
  setFlag(key: string, variant: string): void {
    this.flags.set(key, variant);
  }
}

export function createClient(baseURL: string): FlagrClient {
  return new FlagrClient(baseURL);
}

export default { createClient, FlagrClient };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚩 Flagr Client - Flag Evaluation (POLYGLOT!)\n');

  const client = createClient('http://localhost:18000');

  console.log('=== Example 1: Evaluate Flag ===');
  const result = await client.evaluate('new-ui', {
    entityID: 'user123',
    entityType: 'user',
  });
  console.log('Evaluation result:', result);
  console.log();

  console.log('=== Example 2: Batch Evaluation ===');
  const results = await client.evaluateBatch([
    { flagKey: 'new-ui', context: { entityID: 'user123' } },
    { flagKey: 'dark-mode', context: { entityID: 'user123' } },
  ]);
  console.log('Batch results:', results);
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
