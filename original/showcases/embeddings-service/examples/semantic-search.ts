/**
 * Semantic search example
 * Demonstrates building a simple search engine with embeddings
 */

import { EmbeddingService } from '../api/embedding-service';
import { SimilaritySearch } from '../shared/similarity';
import { Logger, formatDuration } from '../shared/utils';

interface Document {
  id: string;
  title: string;
  content: string;
  embedding?: number[];
}

class SemanticSearchEngine {
  private service: EmbeddingService;
  private documents: Document[] = [];

  constructor() {
    this.service = new EmbeddingService();
  }

  /**
   * Index documents by generating embeddings
   */
  async indexDocuments(docs: Document[]): Promise<void> {
    Logger.info(`Indexing ${docs.length} documents...`);

    const start = performance.now();
    const texts = docs.map(d => `${d.title}. ${d.content}`);
    const result = await this.service.encodeTextBatch(texts);

    for (let i = 0; i < docs.length; i++) {
      docs[i].embedding = result.embeddings[i];
    }

    this.documents = docs;
    const elapsed = performance.now() - start;

    Logger.info(`Indexed ${docs.length} documents in ${formatDuration(elapsed)}`);
    Logger.info(`Average: ${formatDuration(elapsed / docs.length)} per document\n`);
  }

  /**
   * Search documents by query
   */
  async search(query: string, topK: number = 5): Promise<Array<Document & { score: number }>> {
    Logger.info(`Searching for: "${query}"`);

    const start = performance.now();

    // Encode query
    const queryResult = await this.service.encodeText([query]);
    const queryEmbedding = queryResult.embeddings[0];

    // Find similar documents
    const embeddings = this.documents.map(d => d.embedding!);
    const results = SimilaritySearch.findTopK(queryEmbedding, embeddings, topK);

    const elapsed = performance.now() - start;

    Logger.info(`Search completed in ${formatDuration(elapsed)}\n`);

    return results.map(r => ({
      ...this.documents[r.index],
      score: r.score,
    }));
  }
}

async function main() {
  Logger.info('=== Semantic Search Example ===\n');

  // Sample document collection
  const documents: Document[] = [
    {
      id: '1',
      title: 'Introduction to Machine Learning',
      content: 'Machine learning is a subset of artificial intelligence that enables systems to learn from data without explicit programming.',
    },
    {
      id: '2',
      title: 'Deep Learning Fundamentals',
      content: 'Deep learning uses neural networks with multiple layers to learn hierarchical representations of data.',
    },
    {
      id: '3',
      title: 'Natural Language Processing',
      content: 'NLP enables computers to understand, interpret, and generate human language using computational techniques.',
    },
    {
      id: '4',
      title: 'Computer Vision Applications',
      content: 'Computer vision allows machines to interpret and understand visual information from the world, enabling applications like facial recognition.',
    },
    {
      id: '5',
      title: 'Cooking Italian Pasta',
      content: 'Italian pasta is cooked al dente in boiling salted water. Popular varieties include spaghetti, penne, and linguine.',
    },
    {
      id: '6',
      title: 'Travel Guide to Paris',
      content: 'Paris, the capital of France, is famous for the Eiffel Tower, Louvre Museum, and its romantic atmosphere.',
    },
    {
      id: '7',
      title: 'Introduction to Python Programming',
      content: 'Python is a high-level programming language known for its simplicity and readability, widely used in data science.',
    },
    {
      id: '8',
      title: 'Quantum Computing Basics',
      content: 'Quantum computers use quantum bits or qubits to perform computations, potentially solving problems intractable for classical computers.',
    },
    {
      id: '9',
      title: 'Healthy Mediterranean Diet',
      content: 'The Mediterranean diet emphasizes fruits, vegetables, whole grains, olive oil, and fish for heart health.',
    },
    {
      id: '10',
      title: 'Climate Change and Global Warming',
      content: 'Climate change refers to long-term shifts in global temperatures and weather patterns, primarily caused by human activities.',
    },
  ];

  // Initialize search engine
  const searchEngine = new SemanticSearchEngine();

  // Index documents
  await searchEngine.indexDocuments(documents);

  // Perform searches
  const queries = [
    'neural networks and AI',
    'understanding human language',
    'food and recipes',
    'programming languages',
  ];

  for (const query of queries) {
    const results = await searchEngine.search(query, 3);

    Logger.info('Top 3 results:');
    results.forEach((doc, i) => {
      Logger.info(`  ${i + 1}. ${doc.title} (score: ${doc.score.toFixed(4)})`);
      Logger.info(`     ${doc.content.substring(0, 80)}...`);
    });
    Logger.info('');
  }

  // Demonstrate semantic understanding
  Logger.info('=== Semantic Understanding Demo ===\n');
  Logger.info('Notice how the search understands semantics:');
  Logger.info('- "neural networks" finds ML/DL articles');
  Logger.info('- "understanding language" finds NLP articles');
  Logger.info('- "food" finds both pasta and diet articles');
  Logger.info('- Exact keyword matches are not required\n');

  // Performance metrics
  Logger.info('=== Performance Metrics ===');
  const searchStart = performance.now();
  await searchEngine.search('test query', 5);
  const searchTime = performance.now() - searchStart;

  Logger.info(`Search latency: ${formatDuration(searchTime)}`);
  Logger.info(`Documents searched: ${documents.length}`);
  Logger.info(`Queries per second: ${(1000 / searchTime).toFixed(0)}`);

  Logger.info('\n=== Example Complete ===');
}

main().catch(error => {
  Logger.error('Example failed:', error);
  process.exit(1);
});
