/**
 * Comprehensive embedding service tests
 */

import { EmbeddingService } from '../api/embedding-service';
import { validateEmbedding, validateEmbeddings, Logger } from '../shared/utils';

async function testTextEmbeddings() {
  Logger.info('\n=== Testing Text Embeddings ===');

  const service = new EmbeddingService();

  // Test single text
  Logger.info('Testing single text embedding...');
  const single = await service.encodeText(['Hello, world!']);
  console.assert(validateEmbedding(single.embeddings[0]), 'Single embedding validation failed');
  console.assert(single.embeddings[0].length === single.dimensions, 'Dimension mismatch');
  Logger.info(`✓ Single text: ${single.dimensions}D, ${single.processingTime.toFixed(2)}ms`);

  // Test multiple texts
  Logger.info('Testing multiple text embeddings...');
  const texts = [
    'Machine learning is fascinating',
    'Deep learning uses neural networks',
    'Pizza is delicious',
    'The weather is nice today',
  ];
  const multiple = await service.encodeText(texts);
  console.assert(validateEmbeddings(multiple.embeddings), 'Multiple embeddings validation failed');
  console.assert(multiple.embeddings.length === texts.length, 'Count mismatch');
  Logger.info(`✓ Multiple texts: ${multiple.embeddings.length} embeddings, ${multiple.processingTime.toFixed(2)}ms`);

  // Test batch processing
  Logger.info('Testing batch text processing...');
  const largeBatch = Array(100).fill('Sample text for batch testing');
  const batch = await service.encodeTextBatch(largeBatch);
  console.assert(batch.embeddings.length === 100, 'Batch count mismatch');
  const avgTime = batch.processingTime / 100;
  Logger.info(`✓ Batch (100): ${batch.processingTime.toFixed(2)}ms total, ${avgTime.toFixed(2)}ms avg`);

  return true;
}

async function testSimilarity() {
  Logger.info('\n=== Testing Semantic Similarity ===');

  const service = new EmbeddingService();

  const texts = [
    'The cat sits on the mat',
    'A feline rests on the carpet',
    'Dogs are great pets',
    'Python is a programming language',
  ];

  const result = await service.encodeText(texts);
  const embeddings = result.embeddings;

  // Calculate cosine similarity manually
  function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  const sim1 = cosineSimilarity(embeddings[0], embeddings[1]);
  const sim2 = cosineSimilarity(embeddings[0], embeddings[2]);
  const sim3 = cosineSimilarity(embeddings[0], embeddings[3]);

  Logger.info(`Similar sentences (cat/feline): ${sim1.toFixed(4)}`);
  Logger.info(`Different topic (cat/dog): ${sim2.toFixed(4)}`);
  Logger.info(`Unrelated (cat/python): ${sim3.toFixed(4)}`);

  console.assert(sim1 > sim2, 'Similar sentences should have higher similarity');
  console.assert(sim1 > sim3, 'Similar sentences should have higher similarity than unrelated');
  Logger.info('✓ Similarity tests passed');

  return true;
}

async function testPerformance() {
  Logger.info('\n=== Testing Performance Requirements ===');

  const service = new EmbeddingService();

  // Test single embedding < 10ms (after warmup)
  Logger.info('Testing single embedding latency...');
  const warmup = await service.encodeText(['Warmup text']);
  const singleStart = performance.now();
  const singleResult = await service.encodeText(['Test text']);
  const singleTime = performance.now() - singleStart;

  Logger.info(`Single embedding: ${singleTime.toFixed(2)}ms`);
  if (singleTime < 10) {
    Logger.info('✓ Single embedding meets <10ms requirement');
  } else {
    Logger.warn(`⚠ Single embedding ${singleTime.toFixed(2)}ms (target: <10ms)`);
  }

  // Test batch of 100 < 50ms
  Logger.info('Testing batch of 100 embeddings...');
  const batch = Array(100).fill('Sample text');
  const batchStart = performance.now();
  const batchResult = await service.encodeTextBatch(batch);
  const batchTime = performance.now() - batchStart;

  Logger.info(`Batch of 100: ${batchTime.toFixed(2)}ms`);
  if (batchTime < 50) {
    Logger.info('✓ Batch meets <50ms requirement');
  } else {
    Logger.warn(`⚠ Batch ${batchTime.toFixed(2)}ms (target: <50ms)`);
  }

  return true;
}

async function runAllTests() {
  Logger.info('Starting embedding service tests...');

  try {
    await testTextEmbeddings();
    await testSimilarity();
    await testPerformance();

    Logger.info('\n=== All Tests Passed ===');
    process.exit(0);
  } catch (error) {
    Logger.error('\n=== Test Failed ===');
    Logger.error(String(error));
    process.exit(1);
  }
}

runAllTests();
