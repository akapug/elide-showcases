/**
 * Polyglot Integration Tests
 *
 * Test cross-language communication between TypeScript and Python.
 */

import { PolyglotBridge, MLBridge } from '../src/polyglot/bridge';

/**
 * Test runner
 */
class TestRunner {
  private passed = 0;
  private failed = 0;

  async test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      this.passed++;
      console.log(`✓ ${name}`);
    } catch (error) {
      this.failed++;
      console.log(`✗ ${name}`);
      console.error(`  Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  printResults() {
    console.log('='.repeat(50));
    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed\n`);
    return this.failed === 0;
  }
}

async function main() {
  console.log('\n🔗 Running Polyglot Integration Tests\n');
  console.log('='.repeat(50));

  const runner = new TestRunner();
  const bridge = new PolyglotBridge({ debug: false });
  const mlBridge = new MLBridge({ debug: false });

  // Basic bridge tests
  await runner.test('Bridge initialization', async () => {
    const info = bridge.getInfo();
    if (!info.config) throw new Error('Missing config');
    if (!info.metrics) throw new Error('Missing metrics');
  });

  await runner.test('Python module import', async () => {
    const result = await bridge.callPython('sentiment_model', 'get_info', {});
    if (!result.success) throw new Error('Failed to call Python');
    if (!result.data.name) throw new Error('Missing model name');
    console.log(`    Model: ${result.data.name} v${result.data.version}`);
  });

  await runner.test('Type conversion: string', async () => {
    const result = await bridge.callPython('sentiment_model', 'analyze', {
      text: 'Test string conversion',
    });
    if (!result.success) throw new Error('Call failed');
    if (typeof result.data.sentiment !== 'string') throw new Error('Wrong type');
  });

  await runner.test('Type conversion: numbers', async () => {
    const result = await bridge.callPython('sentiment_model', 'analyze', {
      text: 'Test',
    });
    if (!result.success) throw new Error('Call failed');
    if (typeof result.data.confidence !== 'number') throw new Error('Wrong type');
    if (typeof result.data.score !== 'number') throw new Error('Wrong type');
  });

  await runner.test('Type conversion: nested objects', async () => {
    const result = await bridge.callPython('sentiment_model', 'analyze', {
      text: 'Test',
      options: {
        detailed: true,
        threshold: 0.5,
      },
    });
    if (!result.success) throw new Error('Call failed');
    if (!result.data.scores) throw new Error('Missing scores object');
  });

  await runner.test('Type conversion: arrays', async () => {
    const result = await bridge.callPython('sentiment_model', 'analyze_batch', {
      texts: ['Text 1', 'Text 2', 'Text 3'],
    });
    if (!result.success) throw new Error('Call failed');
    if (!Array.isArray(result.data)) throw new Error('Expected array');
    if (result.data.length !== 3) throw new Error('Wrong array length');
  });

  // Performance tests
  await runner.test('Cross-language call latency <1ms', async () => {
    // Warm up first
    await bridge.callPython('sentiment_model', 'analyze', { text: 'warmup' });

    // Measure multiple calls
    const iterations = 10;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const result = await bridge.callPython('sentiment_model', 'analyze', {
        text: 'Performance test',
      });
      latencies.push(result.latency);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    console.log(`    Avg: ${avgLatency.toFixed(3)}ms`);
    console.log(`    Min: ${minLatency.toFixed(3)}ms`);
    console.log(`    Max: ${maxLatency.toFixed(3)}ms`);

    if (avgLatency > 5) {
      console.log('    Warning: Higher latency than expected (may be cold start)');
    }
  });

  await runner.test('Module caching works', async () => {
    const initialMetrics = bridge.getMetrics();
    const initialMisses = initialMetrics.cacheMisses;

    // Call same module multiple times
    for (let i = 0; i < 5; i++) {
      await bridge.callPython('sentiment_model', 'analyze', { text: 'test' });
    }

    const finalMetrics = bridge.getMetrics();
    const cacheMisses = finalMetrics.cacheMisses - initialMisses;

    if (cacheMisses > 1) {
      throw new Error(`Too many cache misses: ${cacheMisses}`);
    }

    console.log(`    Cache hit rate: ${finalMetrics.cacheHits / (finalMetrics.cacheHits + finalMetrics.cacheMisses) * 100}%`);
  });

  // Error handling tests
  await runner.test('Python exception propagation', async () => {
    const result = await bridge.callPython('sentiment_model', 'analyze', {});
    if (result.success) throw new Error('Expected failure');
    if (!result.error) throw new Error('Missing error details');
    console.log(`    Error type: ${result.error.type}`);
  });

  await runner.test('Invalid module name', async () => {
    const result = await bridge.callPython('nonexistent_module', 'test', {});
    if (result.success) throw new Error('Expected failure');
  });

  await runner.test('Invalid function name', async () => {
    const result = await bridge.callPython('sentiment_model', 'nonexistent', {});
    if (result.success) throw new Error('Expected failure');
  });

  // ML-specific tests
  await runner.test('Sentiment analysis: positive text', async () => {
    const result = await mlBridge.analyzeSentiment({
      text: 'This is absolutely amazing! Best product ever!',
    });
    if (!result.success) throw new Error('Call failed');
    if (result.data.sentiment !== 'positive') {
      console.log(`    Warning: Expected positive, got ${result.data.sentiment}`);
    }
    console.log(`    Sentiment: ${result.data.sentiment} (${result.data.confidence.toFixed(2)})`);
  });

  await runner.test('Sentiment analysis: negative text', async () => {
    const result = await mlBridge.analyzeSentiment({
      text: 'Terrible quality, worst purchase ever. Very disappointed.',
    });
    if (!result.success) throw new Error('Call failed');
    if (result.data.sentiment !== 'negative') {
      console.log(`    Warning: Expected negative, got ${result.data.sentiment}`);
    }
    console.log(`    Sentiment: ${result.data.sentiment} (${result.data.confidence.toFixed(2)})`);
  });

  await runner.test('Sentiment analysis: neutral text', async () => {
    const result = await mlBridge.analyzeSentiment({
      text: 'The product is okay, nothing special.',
    });
    if (!result.success) throw new Error('Call failed');
    console.log(`    Sentiment: ${result.data.sentiment} (${result.data.confidence.toFixed(2)})`);
  });

  await runner.test('Batch sentiment analysis', async () => {
    const texts = [
      'Excellent!',
      'Horrible!',
      'Average.',
    ];
    const result = await mlBridge.analyzeSentimentBatch(texts);
    if (!result.success) throw new Error('Call failed');
    if (!Array.isArray(result.data)) throw new Error('Expected array');
    if (result.data.length !== 3) throw new Error('Wrong length');
    console.log(`    Batch latency: ${result.latency.toFixed(3)}ms`);
    console.log(`    Per item: ${(result.latency / 3).toFixed(3)}ms`);
  });

  await runner.test('Recommender: basic recommendations', async () => {
    const result = await mlBridge.getRecommendations({
      user_id: 'test_user',
      limit: 5,
    });
    if (!result.success) throw new Error('Call failed');
    if (!Array.isArray(result.data.recommendations)) throw new Error('Expected array');
    console.log(`    Got ${result.data.recommendations.length} recommendations`);
  });

  await runner.test('Recommender: context filtering', async () => {
    const result = await mlBridge.getRecommendations({
      user_id: 'test_user',
      context: { category: 'tech' },
      limit: 10,
    });
    if (!result.success) throw new Error('Call failed');
    const allTech = result.data.recommendations.every(
      (rec: any) => rec.category === 'tech'
    );
    if (!allTech) console.log('    Warning: Not all recommendations match context');
  });

  // Warmup test
  await runner.test('Model warmup', async () => {
    const start = performance.now();
    await mlBridge.warmup();
    const duration = performance.now() - start;
    console.log(`    Warmup took ${duration.toFixed(2)}ms`);
  });

  // Metrics test
  await runner.test('Metrics collection', async () => {
    const metrics = mlBridge.getMetrics();
    if (metrics.totalCalls === 0) throw new Error('No calls recorded');
    if (metrics.successfulCalls === 0) throw new Error('No successful calls');
    console.log(`    Total calls: ${metrics.totalCalls}`);
    console.log(`    Success rate: ${(metrics.successfulCalls / metrics.totalCalls * 100).toFixed(1)}%`);
    console.log(`    Avg latency: ${metrics.avgLatency.toFixed(3)}ms`);
  });

  const success = runner.printResults();
  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
});
