/**
 * Basic Prediction Example
 *
 * Simple example demonstrating how to use the polyglot bridge
 * to call Python ML models from TypeScript.
 */

import { MLBridge } from '../src/polyglot/bridge';

async function main() {
  console.log('🚀 Basic Prediction Example\n');

  // Initialize the ML bridge
  const mlBridge = new MLBridge({ debug: true });

  // Example 1: Sentiment Analysis
  console.log('Example 1: Sentiment Analysis');
  console.log('─'.repeat(50));

  const sentimentResult = await mlBridge.analyzeSentiment({
    text: 'This product is absolutely amazing! I love it so much!',
  });

  if (sentimentResult.success) {
    console.log('✓ Analysis succeeded');
    console.log(`  Sentiment: ${sentimentResult.data.sentiment}`);
    console.log(`  Confidence: ${sentimentResult.data.confidence.toFixed(2)}`);
    console.log(`  Score: ${sentimentResult.data.score.toFixed(2)}`);
    console.log(`  Latency: ${sentimentResult.latency.toFixed(3)}ms`);
  } else {
    console.error('✗ Analysis failed:', sentimentResult.error);
  }

  // Example 2: Negative Sentiment
  console.log('\n\nExample 2: Negative Sentiment');
  console.log('─'.repeat(50));

  const negativeResult = await mlBridge.analyzeSentiment({
    text: 'Terrible quality, completely disappointed. Waste of money!',
  });

  if (negativeResult.success) {
    console.log('✓ Analysis succeeded');
    console.log(`  Sentiment: ${negativeResult.data.sentiment}`);
    console.log(`  Confidence: ${negativeResult.data.confidence.toFixed(2)}`);
    console.log(`  Score: ${negativeResult.data.score.toFixed(2)}`);
    console.log(`  Latency: ${negativeResult.latency.toFixed(3)}ms`);
  }

  // Example 3: Detailed Analysis with Scores
  console.log('\n\nExample 3: Detailed Analysis');
  console.log('─'.repeat(50));

  const detailedResult = await mlBridge.analyzeSentiment({
    text: 'The product is okay, nothing special.',
    options: {
      detailed: true,
    },
  });

  if (detailedResult.success) {
    console.log('✓ Analysis succeeded');
    console.log(`  Sentiment: ${detailedResult.data.sentiment}`);
    console.log('  Score breakdown:');
    if (detailedResult.data.scores) {
      console.log(`    Positive: ${detailedResult.data.scores.positive.toFixed(3)}`);
      console.log(`    Neutral:  ${detailedResult.data.scores.neutral.toFixed(3)}`);
      console.log(`    Negative: ${detailedResult.data.scores.negative.toFixed(3)}`);
    }
  }

  // Example 4: Recommendations
  console.log('\n\nExample 4: Personalized Recommendations');
  console.log('─'.repeat(50));

  const recommendResult = await mlBridge.getRecommendations({
    user_id: 'user_demo_123',
    context: { category: 'tech' },
    limit: 5,
  });

  if (recommendResult.success) {
    console.log('✓ Recommendations generated');
    console.log(`  User: ${recommendResult.data.user_id}`);
    console.log(`  Count: ${recommendResult.data.count}`);
    console.log('  Top recommendations:');

    recommendResult.data.recommendations.forEach((rec, i) => {
      console.log(`    ${i + 1}. ${rec.item_id} (score: ${rec.score.toFixed(3)}, ${rec.category})`);
      console.log(`       Reason: ${rec.reason}`);
    });

    console.log(`  Latency: ${recommendResult.latency.toFixed(3)}ms`);
  }

  // Example 5: Direct Bridge Usage (Advanced)
  console.log('\n\nExample 5: Direct Bridge Usage (Advanced)');
  console.log('─'.repeat(50));

  const bridge = mlBridge.getBridge();

  // Call Python function directly
  const infoResult = await bridge.callPython('sentiment_model', 'get_info', {});

  if (infoResult.success) {
    console.log('✓ Model info retrieved');
    console.log('  Model details:');
    console.log(`    Name: ${infoResult.data.name}`);
    console.log(`    Version: ${infoResult.data.version}`);
    console.log(`    Type: ${infoResult.data.type}`);
    console.log(`    Algorithm: ${infoResult.data.algorithm}`);
  }

  // Example 6: Performance Metrics
  console.log('\n\nExample 6: Performance Metrics');
  console.log('─'.repeat(50));

  const metrics = mlBridge.getMetrics();
  console.log('Bridge performance:');
  console.log(`  Total calls: ${metrics.totalCalls}`);
  console.log(`  Successful: ${metrics.successfulCalls}`);
  console.log(`  Failed: ${metrics.failedCalls}`);
  console.log(`  Success rate: ${(metrics.successfulCalls / metrics.totalCalls * 100).toFixed(1)}%`);
  console.log(`  Avg latency: ${metrics.avgLatency.toFixed(3)}ms`);
  console.log(`  Min latency: ${metrics.minLatency.toFixed(3)}ms`);
  console.log(`  Max latency: ${metrics.maxLatency.toFixed(3)}ms`);
  console.log(`  Cache hits: ${metrics.cacheHits}`);
  console.log(`  Cache misses: ${metrics.cacheMisses}`);
  console.log(`  Cache hit rate: ${(metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100).toFixed(1)}%`);

  console.log('\n✅ Examples complete!\n');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
