/**
 * Basic text embeddings example
 */

import { EmbeddingService } from '../api/embedding-service';
import { Logger } from '../shared/utils';

async function main() {
  Logger.info('=== Text Embeddings Example ===\n');

  const service = new EmbeddingService();

  // Example 1: Single text embedding
  Logger.info('1. Single text embedding:');
  const singleText = 'Machine learning is transforming the world';
  const single = await service.encodeText([singleText]);

  Logger.info(`   Text: "${singleText}"`);
  Logger.info(`   Embedding dimensions: ${single.dimensions}`);
  Logger.info(`   First 5 values: [${single.embeddings[0].slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
  Logger.info(`   Processing time: ${single.processingTime.toFixed(2)}ms\n`);

  // Example 2: Multiple texts
  Logger.info('2. Multiple text embeddings:');
  const texts = [
    'Artificial intelligence and machine learning',
    'Deep neural networks for computer vision',
    'Natural language processing with transformers',
    'Pizza and pasta are delicious',
  ];

  const multiple = await service.encodeText(texts);
  Logger.info(`   Encoded ${multiple.embeddings.length} texts`);
  Logger.info(`   Total time: ${multiple.processingTime.toFixed(2)}ms`);
  Logger.info(`   Average: ${(multiple.processingTime / texts.length).toFixed(2)}ms per text\n`);

  // Example 3: Computing similarity
  Logger.info('3. Computing semantic similarity:');
  const [emb1, emb2, emb3, emb4] = multiple.embeddings;

  function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  Logger.info(`   Text 1 vs Text 2 (AI topics): ${cosineSimilarity(emb1, emb2).toFixed(4)}`);
  Logger.info(`   Text 1 vs Text 3 (AI topics): ${cosineSimilarity(emb1, emb3).toFixed(4)}`);
  Logger.info(`   Text 1 vs Text 4 (unrelated): ${cosineSimilarity(emb1, emb4).toFixed(4)}`);
  Logger.info('   → Similar topics have higher similarity scores\n');

  // Example 4: Batch processing
  Logger.info('4. Batch processing (100 texts):');
  const batchTexts = Array(100).fill(0).map((_, i) => `Document ${i}: Sample text about various topics`);
  const batch = await service.encodeTextBatch(batchTexts);

  Logger.info(`   Total time: ${batch.processingTime.toFixed(2)}ms`);
  Logger.info(`   Average: ${(batch.processingTime / 100).toFixed(2)}ms per text`);
  Logger.info(`   Throughput: ${(100 / (batch.processingTime / 1000)).toFixed(0)} texts/second\n`);

  // Example 5: Different text lengths
  Logger.info('5. Handling different text lengths:');
  const lengths = [
    'Short',
    'This is a medium length sentence with more context.',
    'This is a much longer text that contains multiple sentences. It demonstrates how the embedding model handles longer inputs with more information. The model will capture the overall semantic meaning despite the increased length.',
  ];

  for (let i = 0; i < lengths.length; i++) {
    const result = await service.encodeText([lengths[i]]);
    Logger.info(`   Text ${i + 1} (${lengths[i].length} chars): ${result.processingTime.toFixed(2)}ms`);
  }

  Logger.info('\n=== Example Complete ===');
}

main().catch(error => {
  Logger.error('Example failed:', error);
  process.exit(1);
});
