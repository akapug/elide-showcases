/**
 * Batch Processing Example
 *
 * Demonstrates how to efficiently process multiple predictions in parallel
 * using the polyglot bridge.
 */

import { MLBridge } from '../src/polyglot/bridge';

async function main() {
  console.log('📦 Batch Processing Example\n');

  const mlBridge = new MLBridge({ debug: false });

  // Example 1: Batch Sentiment Analysis (Optimized)
  console.log('Example 1: Batch Sentiment Analysis (Optimized)');
  console.log('─'.repeat(50));

  const texts = [
    'Excellent product, highly recommended!',
    'Terrible quality, very disappointed.',
    'Average, nothing special.',
    'Love it! Best purchase ever!',
    'Not worth the money, poor quality.',
    'Good value for the price.',
    'Absolutely amazing experience!',
    'Worst service ever received.',
    'Decent product, meets expectations.',
    'Outstanding quality and fast delivery!',
  ];

  console.log(`Processing ${texts.length} texts in batch...\n`);

  const start = performance.now();
  const batchResult = await mlBridge.analyzeSentimentBatch(texts);
  const duration = performance.now() - start;

  if (batchResult.success) {
    console.log('✓ Batch processing succeeded');
    console.log(`  Total time: ${duration.toFixed(2)}ms`);
    console.log(`  Per item: ${(duration / texts.length).toFixed(3)}ms`);
    console.log(`  Throughput: ${(texts.length / duration * 1000).toFixed(0)} items/sec`);

    console.log('\n  Results:');
    batchResult.data.forEach((result, i) => {
      console.log(`    ${i + 1}. "${texts[i].substring(0, 40)}..."`);
      console.log(`       → ${result.sentiment} (${result.confidence.toFixed(2)})`);
    });
  }

  // Example 2: Parallel Individual Requests (Less Efficient)
  console.log('\n\nExample 2: Parallel Individual Requests (Comparison)');
  console.log('─'.repeat(50));

  console.log(`Processing same ${texts.length} texts in parallel...\n`);

  const startParallel = performance.now();
  const parallelResults = await Promise.all(
    texts.map(text => mlBridge.analyzeSentiment({ text }))
  );
  const durationParallel = performance.now() - startParallel;

  const successCount = parallelResults.filter(r => r.success).length;

  console.log('✓ Parallel processing completed');
  console.log(`  Total time: ${durationParallel.toFixed(2)}ms`);
  console.log(`  Per item: ${(durationParallel / texts.length).toFixed(3)}ms`);
  console.log(`  Throughput: ${(texts.length / durationParallel * 1000).toFixed(0)} items/sec`);
  console.log(`  Success: ${successCount}/${texts.length}`);

  // Comparison
  console.log('\n  Performance Comparison:');
  const improvement = ((durationParallel - duration) / durationParallel * 100);
  console.log(`    Batch method is ${improvement.toFixed(1)}% faster`);
  console.log(`    Speedup: ${(durationParallel / duration).toFixed(2)}x`);

  // Example 3: Large Batch Processing
  console.log('\n\nExample 3: Large Batch Processing (100 items)');
  console.log('─'.repeat(50));

  // Generate 100 sample texts
  const largeTexts = Array(100).fill(null).map((_, i) => {
    const sentiments = [
      'This is great!',
      'Not good at all.',
      'It\'s okay.',
    ];
    return sentiments[i % 3];
  });

  console.log(`Processing ${largeTexts.length} texts...\n`);

  const startLarge = performance.now();
  const largeBatchResult = await mlBridge.analyzeSentimentBatch(largeTexts);
  const durationLarge = performance.now() - startLarge;

  if (largeBatchResult.success) {
    console.log('✓ Large batch completed');
    console.log(`  Total time: ${durationLarge.toFixed(2)}ms`);
    console.log(`  Per item: ${(durationLarge / largeTexts.length).toFixed(3)}ms`);
    console.log(`  Throughput: ${(largeTexts.length / durationLarge * 1000).toFixed(0)} items/sec`);

    // Aggregate results
    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    largeBatchResult.data.forEach(result => {
      sentimentCounts[result.sentiment as keyof typeof sentimentCounts]++;
    });

    console.log('\n  Sentiment distribution:');
    console.log(`    Positive: ${sentimentCounts.positive} (${(sentimentCounts.positive / largeTexts.length * 100).toFixed(1)}%)`);
    console.log(`    Negative: ${sentimentCounts.negative} (${(sentimentCounts.negative / largeTexts.length * 100).toFixed(1)}%)`);
    console.log(`    Neutral: ${sentimentCounts.neutral} (${(sentimentCounts.neutral / largeTexts.length * 100).toFixed(1)}%)`);
  }

  // Example 4: Chunked Processing (for very large datasets)
  console.log('\n\nExample 4: Chunked Processing (1000 items in chunks of 100)');
  console.log('─'.repeat(50));

  const veryLargeTexts = Array(1000).fill(null).map((_, i) => `Sample text ${i}`);
  const chunkSize = 100;
  const chunks: string[][] = [];

  // Split into chunks
  for (let i = 0; i < veryLargeTexts.length; i += chunkSize) {
    chunks.push(veryLargeTexts.slice(i, i + chunkSize));
  }

  console.log(`Processing ${veryLargeTexts.length} texts in ${chunks.length} chunks...\n`);

  const startChunked = performance.now();
  const chunkResults: any[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkResult = await mlBridge.analyzeSentimentBatch(chunks[i]);
    if (chunkResult.success) {
      chunkResults.push(...chunkResult.data);
    }
    process.stdout.write(`\r  Progress: ${i + 1}/${chunks.length} chunks`);
  }

  const durationChunked = performance.now() - startChunked;
  console.log('\n');

  console.log('✓ Chunked processing completed');
  console.log(`  Total time: ${(durationChunked / 1000).toFixed(2)}s`);
  console.log(`  Per item: ${(durationChunked / veryLargeTexts.length).toFixed(3)}ms`);
  console.log(`  Throughput: ${(veryLargeTexts.length / durationChunked * 1000).toFixed(0)} items/sec`);
  console.log(`  Results: ${chunkResults.length}/${veryLargeTexts.length}`);

  // Example 5: Streaming Processing Pattern
  console.log('\n\nExample 5: Streaming Processing Pattern');
  console.log('─'.repeat(50));

  console.log('Processing items as they arrive...\n');

  // Simulate streaming data
  const streamItems = [
    'First item',
    'Second item',
    'Third item',
    'Fourth item',
    'Fifth item',
  ];

  for (const item of streamItems) {
    const result = await mlBridge.analyzeSentiment({ text: item });
    if (result.success) {
      console.log(`  ✓ Processed: "${item}" → ${result.data.sentiment} (${result.latency.toFixed(3)}ms)`);
    }
  }

  // Final metrics
  console.log('\n\n📊 Final Performance Metrics');
  console.log('─'.repeat(50));

  const finalMetrics = mlBridge.getMetrics();
  console.log(`Total predictions: ${finalMetrics.totalCalls}`);
  console.log(`Success rate: ${(finalMetrics.successfulCalls / finalMetrics.totalCalls * 100).toFixed(1)}%`);
  console.log(`Avg latency: ${finalMetrics.avgLatency.toFixed(3)}ms`);
  console.log(`Min latency: ${finalMetrics.minLatency.toFixed(3)}ms`);
  console.log(`Max latency: ${finalMetrics.maxLatency.toFixed(3)}ms`);

  console.log('\n✅ Batch processing examples complete!\n');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
