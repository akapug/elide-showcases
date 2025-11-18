/**
 * Tests for embedding service
 */

import { EmbeddingService, embed, embedBatch } from '../src/embeddings/embedding-service';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeAll(() => {
    service = new EmbeddingService('all-MiniLM-L6-v2');
  });

  describe('encodeText', () => {
    it('should generate embeddings for a single text', async () => {
      const text = 'Hello, world!';
      const embedding = await service.encodeText(text);

      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(384); // all-MiniLM-L6-v2 dimension
      expect(embedding.every((v) => typeof v === 'number')).toBe(true);
    });

    it('should generate different embeddings for different texts', async () => {
      const text1 = 'Machine learning is fascinating';
      const text2 = 'Cooking pasta is easy';

      const embedding1 = await service.encodeText(text1);
      const embedding2 = await service.encodeText(text2);

      // Embeddings should be different
      expect(embedding1).not.toEqual(embedding2);
    });

    it('should generate similar embeddings for similar texts', async () => {
      const text1 = 'The cat sat on the mat';
      const text2 = 'A cat was sitting on a mat';

      const embedding1 = await service.encodeText(text1);
      const embedding2 = await service.encodeText(text2);

      // Calculate cosine similarity
      const similarity = await service.similarity(embedding1, embedding2);

      // Similar texts should have high similarity (> 0.7)
      expect(similarity).toBeGreaterThan(0.7);
    });
  });

  describe('encodeTexts', () => {
    it('should generate embeddings for multiple texts', async () => {
      const texts = ['First text', 'Second text', 'Third text'];
      const embeddings = await service.encodeTexts(texts);

      expect(embeddings).toBeDefined();
      expect(Array.isArray(embeddings)).toBe(true);
      expect(embeddings.length).toBe(3);
      expect(embeddings[0].length).toBe(384);
    });

    it('should handle empty array', async () => {
      const embeddings = await service.encodeTexts([]);
      expect(embeddings).toBeDefined();
      expect(Array.isArray(embeddings)).toBe(true);
      expect(embeddings.length).toBe(0);
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', async () => {
      const info = await service.getModelInfo();

      expect(info).toBeDefined();
      expect(info.model_name).toBe('all-MiniLM-L6-v2');
      expect(info.dimension).toBe(384);
      expect(info.max_seq_length).toBeGreaterThan(0);
    });
  });

  describe('convenience functions', () => {
    it('should work with embed function', async () => {
      const embedding = await embed('Test text');
      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(384);
    });

    it('should work with embedBatch function', async () => {
      const embeddings = await embedBatch(['Text 1', 'Text 2']);
      expect(embeddings).toBeDefined();
      expect(embeddings.length).toBe(2);
      expect(embeddings[0].length).toBe(384);
    });
  });

  describe('performance', () => {
    it('should encode text in reasonable time', async () => {
      const start = Date.now();
      await service.encodeText('Performance test text');
      const duration = Date.now() - start;

      // Should complete in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should batch encode efficiently', async () => {
      const texts = Array(10).fill('Sample text for batch encoding');

      const start = Date.now();
      await service.encodeTexts(texts);
      const duration = Date.now() - start;

      // Batch encoding should be faster than individual encoding
      // Should complete in less than 200ms for 10 texts
      expect(duration).toBeLessThan(200);
    });
  });
});
