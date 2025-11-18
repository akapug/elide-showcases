/**
 * Similarity search tests
 */

import { SimilaritySearch } from '../shared/similarity';
import { Logger } from '../shared/utils';

function testCosineSimilarity() {
  Logger.info('\n=== Testing Cosine Similarity ===');

  // Identical vectors
  const v1 = [1, 2, 3, 4];
  const sim1 = SimilaritySearch.cosineSimilarity(v1, v1);
  console.assert(Math.abs(sim1 - 1.0) < 0.001, 'Identical vectors should have similarity 1.0');
  Logger.info(`Identical vectors: ${sim1.toFixed(4)}`);

  // Orthogonal vectors
  const v2 = [1, 0, 0];
  const v3 = [0, 1, 0];
  const sim2 = SimilaritySearch.cosineSimilarity(v2, v3);
  console.assert(Math.abs(sim2) < 0.001, 'Orthogonal vectors should have similarity 0.0');
  Logger.info(`Orthogonal vectors: ${sim2.toFixed(4)}`);

  // Opposite vectors
  const v4 = [1, 1, 1];
  const v5 = [-1, -1, -1];
  const sim3 = SimilaritySearch.cosineSimilarity(v4, v5);
  console.assert(Math.abs(sim3 + 1.0) < 0.001, 'Opposite vectors should have similarity -1.0');
  Logger.info(`Opposite vectors: ${sim3.toFixed(4)}`);

  Logger.info('✓ Cosine similarity works correctly');
  return true;
}

function testEuclideanDistance() {
  Logger.info('\n=== Testing Euclidean Distance ===');

  const v1 = [0, 0, 0];
  const v2 = [3, 4, 0];
  const dist = SimilaritySearch.euclideanDistance(v1, v2);

  // Distance should be 5 (3-4-5 triangle)
  console.assert(Math.abs(dist - 5.0) < 0.001, 'Distance calculation incorrect');
  Logger.info(`Distance: ${dist.toFixed(4)} (expected: 5.0)`);

  // Identical vectors should have distance 0
  const dist2 = SimilaritySearch.euclideanDistance(v1, v1);
  console.assert(Math.abs(dist2) < 0.001, 'Identical vectors should have distance 0');

  Logger.info('✓ Euclidean distance works correctly');
  return true;
}

function testTopK() {
  Logger.info('\n=== Testing Top-K Search ===');

  const query = [1, 0, 0];
  const candidates = [
    [1, 0, 0],    // Perfect match
    [0.9, 0.1, 0], // Close
    [0, 1, 0],    // Orthogonal
    [0.5, 0.5, 0], // Moderate
    [-1, 0, 0],   // Opposite
  ];

  const results = SimilaritySearch.findTopK(query, candidates, 3);

  console.assert(results.length === 3, 'Should return top 3 results');
  console.assert(results[0].index === 0, 'Perfect match should be first');
  console.assert(results[0].score > results[1].score, 'Results should be sorted by score');
  console.assert(results[1].score > results[2].score, 'Results should be sorted by score');

  Logger.info('Top 3 results:');
  results.forEach((r, i) => {
    Logger.info(`  ${i + 1}. Index ${r.index}, Score: ${r.score.toFixed(4)}`);
  });

  Logger.info('✓ Top-K search works correctly');
  return true;
}

function testThreshold() {
  Logger.info('\n=== Testing Threshold Search ===');

  const query = [1, 0];
  const candidates = [
    [1, 0],      // 1.0
    [0.9, 0.1],  // ~0.99
    [0.7, 0.3],  // ~0.92
    [0.5, 0.5],  // ~0.71
    [0, 1],      // 0.0
  ];

  const results = SimilaritySearch.findAboveThreshold(query, candidates, 0.8);

  console.assert(results.length === 3, 'Should return 3 results above 0.8 threshold');
  console.assert(results.every(r => r.score >= 0.8), 'All results should be above threshold');

  Logger.info(`Found ${results.length} results above threshold 0.8:`);
  results.forEach((r, i) => {
    Logger.info(`  ${i + 1}. Index ${r.index}, Score: ${r.score.toFixed(4)}`);
  });

  Logger.info('✓ Threshold search works correctly');
  return true;
}

function testNormalization() {
  Logger.info('\n=== Testing Vector Normalization ===');

  const v1 = [3, 4];
  const normalized = SimilaritySearch.normalize(v1);

  // Length should be 1.0
  const length = Math.sqrt(normalized[0] ** 2 + normalized[1] ** 2);
  console.assert(Math.abs(length - 1.0) < 0.001, 'Normalized vector should have length 1.0');
  Logger.info(`Original: [${v1.join(', ')}]`);
  Logger.info(`Normalized: [${normalized.map(x => x.toFixed(4)).join(', ')}]`);
  Logger.info(`Length: ${length.toFixed(4)}`);

  // Batch normalization
  const vectors = [[3, 4], [5, 12], [1, 1]];
  const normalizedBatch = SimilaritySearch.batchNormalize(vectors);

  console.assert(normalizedBatch.length === vectors.length, 'Batch size mismatch');
  normalizedBatch.forEach((v, i) => {
    const len = Math.sqrt(v[0] ** 2 + v[1] ** 2);
    console.assert(Math.abs(len - 1.0) < 0.001, `Vector ${i} not properly normalized`);
  });

  Logger.info('✓ Normalization works correctly');
  return true;
}

function testPerformance() {
  Logger.info('\n=== Testing Similarity Performance ===');

  // Generate random vectors
  const dimensions = 384;
  const query = Array(dimensions).fill(0).map(() => Math.random());
  const candidates = Array(10000).fill(0).map(() =>
    Array(dimensions).fill(0).map(() => Math.random())
  );

  // Benchmark top-K search
  const start = performance.now();
  const results = SimilaritySearch.findTopK(query, candidates, 10);
  const elapsed = performance.now() - start;

  Logger.info(`Top-10 search in ${candidates.length} vectors: ${elapsed.toFixed(2)}ms`);
  Logger.info(`Average per comparison: ${(elapsed / candidates.length * 1000).toFixed(2)}µs`);

  console.assert(results.length === 10, 'Should return 10 results');
  console.assert(elapsed < 100, 'Search should be fast (<100ms)');

  Logger.info('✓ Similarity search performance acceptable');
  return true;
}

function runAllTests() {
  Logger.info('Starting similarity search tests...');

  try {
    testCosineSimilarity();
    testEuclideanDistance();
    testTopK();
    testThreshold();
    testNormalization();
    testPerformance();

    Logger.info('\n=== All Similarity Tests Passed ===');
    process.exit(0);
  } catch (error) {
    Logger.error('\n=== Test Failed ===');
    Logger.error(String(error));
    process.exit(1);
  }
}

runAllTests();
