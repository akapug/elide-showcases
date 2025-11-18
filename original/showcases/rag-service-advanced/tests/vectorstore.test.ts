/**
 * Tests for vector store
 */

import { VectorStore, createVectorStore } from '../src/vectorstore/vector-store';

describe('VectorStore', () => {
  let vectorStore: VectorStore;

  beforeEach(() => {
    vectorStore = new VectorStore({
      collectionName: 'test_collection',
      dimension: 384,
      useFaiss: true,
    });
  });

  afterEach(async () => {
    await vectorStore.reset();
  });

  describe('addDocuments', () => {
    it('should add documents to the store', async () => {
      const documents = ['First document', 'Second document'];
      const embeddings = [
        Array(384).fill(0.1),
        Array(384).fill(0.2),
      ];

      const ids = await vectorStore.addDocuments(documents, embeddings);

      expect(ids).toBeDefined();
      expect(ids.length).toBe(2);

      const count = await vectorStore.count();
      expect(count).toBe(2);
    });

    it('should accept custom metadata', async () => {
      const documents = ['Document with metadata'];
      const embeddings = [Array(384).fill(0.1)];
      const metadatas = [{ source: 'test', category: 'example' }];

      const ids = await vectorStore.addDocuments(
        documents,
        embeddings,
        metadatas
      );

      expect(ids).toBeDefined();
      expect(ids.length).toBe(1);

      const doc = await vectorStore.getDocument(ids[0]);
      expect(doc?.metadata.source).toBe('test');
      expect(doc?.metadata.category).toBe('example');
    });

    it('should accept custom IDs', async () => {
      const documents = ['Document with custom ID'];
      const embeddings = [Array(384).fill(0.1)];
      const customIds = ['custom_id_123'];

      const ids = await vectorStore.addDocuments(
        documents,
        embeddings,
        undefined,
        customIds
      );

      expect(ids).toEqual(customIds);

      const doc = await vectorStore.getDocument('custom_id_123');
      expect(doc).toBeDefined();
      expect(doc?.document).toBe('Document with custom ID');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Add test documents
      const documents = [
        'Machine learning algorithms',
        'Deep neural networks',
        'Natural language processing',
        'Computer vision systems',
        'Data science techniques',
      ];
      const embeddings = documents.map((_, i) => {
        return Array(384).fill(0.1 * (i + 1));
      });

      await vectorStore.addDocuments(documents, embeddings);
    });

    it('should search for similar documents', async () => {
      const queryEmbedding = Array(384).fill(0.1);
      const results = await vectorStore.search(queryEmbedding, 3);

      expect(results).toBeDefined();
      expect(results.length).toBeLessThanOrEqual(3);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('document');
      expect(results[0]).toHaveProperty('score');
    });

    it('should return results in order of relevance', async () => {
      const queryEmbedding = Array(384).fill(0.1);
      const results = await vectorStore.search(queryEmbedding, 5);

      // Scores should be in descending order
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('should respect topK parameter', async () => {
      const queryEmbedding = Array(384).fill(0.1);
      const results = await vectorStore.search(queryEmbedding, 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      const documents = ['Test document'];
      const embeddings = [Array(384).fill(0.1)];
      const ids = await vectorStore.addDocuments(documents, embeddings);

      const doc = await vectorStore.getDocument(ids[0]);

      expect(doc).toBeDefined();
      expect(doc?.document).toBe('Test document');
      expect(doc?.embedding).toBeDefined();
    });

    it('should return null for non-existent ID', async () => {
      const doc = await vectorStore.getDocument('non_existent_id');
      expect(doc).toBeNull();
    });
  });

  describe('deleteDocuments', () => {
    it('should delete documents by IDs', async () => {
      const documents = ['Doc 1', 'Doc 2', 'Doc 3'];
      const embeddings = documents.map(() => Array(384).fill(0.1));
      const ids = await vectorStore.addDocuments(documents, embeddings);

      const countBefore = await vectorStore.count();
      expect(countBefore).toBe(3);

      await vectorStore.deleteDocuments([ids[0], ids[1]]);

      const countAfter = await vectorStore.count();
      expect(countAfter).toBe(1);
    });
  });

  describe('count', () => {
    it('should return correct document count', async () => {
      const initialCount = await vectorStore.count();
      expect(initialCount).toBe(0);

      const documents = ['Doc 1', 'Doc 2'];
      const embeddings = documents.map(() => Array(384).fill(0.1));
      await vectorStore.addDocuments(documents, embeddings);

      const finalCount = await vectorStore.count();
      expect(finalCount).toBe(2);
    });
  });

  describe('reset', () => {
    it('should delete all documents', async () => {
      const documents = ['Doc 1', 'Doc 2', 'Doc 3'];
      const embeddings = documents.map(() => Array(384).fill(0.1));
      await vectorStore.addDocuments(documents, embeddings);

      const countBefore = await vectorStore.count();
      expect(countBefore).toBe(3);

      await vectorStore.reset();

      const countAfter = await vectorStore.count();
      expect(countAfter).toBe(0);
    });
  });

  describe('createVectorStore', () => {
    it('should create a vector store with default config', () => {
      const store = createVectorStore();
      expect(store).toBeDefined();
      expect(store.getConfig()).toBeDefined();
    });

    it('should create a vector store with custom config', () => {
      const store = createVectorStore({
        collectionName: 'custom_collection',
        dimension: 768,
        useFaiss: false,
      });

      const config = store.getConfig();
      expect(config.collectionName).toBe('custom_collection');
      expect(config.dimension).toBe(768);
      expect(config.useFaiss).toBe(false);
    });
  });
});
