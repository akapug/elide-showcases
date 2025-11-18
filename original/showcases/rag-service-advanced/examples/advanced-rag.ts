/**
 * Advanced RAG Example
 * Demonstrates hybrid search, multi-query retrieval, and metadata filtering
 */

import { EmbeddingService } from '../src/embeddings/embedding-service';
import { VectorStore } from '../src/vectorstore/vector-store';
import { DocumentProcessor } from '../src/ingestion/document-processor';
import { Retriever } from '../src/retrieval/retriever';

async function main() {
  console.log('🚀 Advanced RAG Example\n');

  // Initialize services
  console.log('1️⃣  Initializing services...');
  const embeddingService = new EmbeddingService('all-MiniLM-L6-v2');
  const vectorStore = new VectorStore({
    collectionName: 'advanced_example',
    dimension: 384,
    useFaiss: true,
  });
  const documentProcessor = new DocumentProcessor(embeddingService, vectorStore);
  const retriever = new Retriever(embeddingService, vectorStore);
  console.log('✓ Services initialized\n');

  // Ingest documents with rich metadata
  console.log('2️⃣  Ingesting documents with metadata...');
  const documents = [
    {
      id: 'research_ai_2024',
      text: `Recent advances in large language models have revolutionized natural language
             processing. Models like GPT-4 and Claude demonstrate unprecedented capabilities
             in understanding and generating human-like text.`,
      metadata: { category: 'research', year: 2024, topic: 'AI' },
    },
    {
      id: 'research_quantum_2023',
      text: `Quantum computing harnesses quantum mechanical phenomena to perform computations.
             Recent breakthroughs show promise for solving complex optimization problems
             impossible for classical computers.`,
      metadata: { category: 'research', year: 2023, topic: 'quantum' },
    },
    {
      id: 'tutorial_python_2024',
      text: `Python remains the leading language for data science and machine learning.
             This tutorial covers essential libraries including NumPy, Pandas, scikit-learn,
             and TensorFlow for building ML models.`,
      metadata: { category: 'tutorial', year: 2024, topic: 'programming' },
    },
    {
      id: 'tutorial_web_2024',
      text: `Modern web development uses frameworks like React and Next.js for building
             scalable applications. TypeScript adds type safety while maintaining JavaScript's
             flexibility.`,
      metadata: { category: 'tutorial', year: 2024, topic: 'web' },
    },
    {
      id: 'news_tech_2024',
      text: `Tech industry sees major investments in AI infrastructure. Cloud providers
             expand GPU capacity to meet growing demand for training large language models
             and computer vision systems.`,
      metadata: { category: 'news', year: 2024, topic: 'industry' },
    },
  ];

  for (const doc of documents) {
    await documentProcessor.ingestDocument(doc.id, doc.text, {
      metadata: doc.metadata,
    });
  }
  console.log('✓ Documents ingested with metadata\n');

  // Example 1: Metadata Filtering
  console.log('3️⃣  Example 1: Metadata Filtering\n');
  console.log('   Searching only in "research" category:');

  const researchResult = await retriever.retrieve('AI and computing', {
    topK: 3,
    filterMetadata: { category: 'research' },
  });

  console.log(`   Found ${researchResult.documents.length} research documents:`);
  researchResult.documents.forEach((doc, i) => {
    console.log(
      `   ${i + 1}. ${doc.id} [${doc.metadata.year}] - Score: ${doc.score.toFixed(3)}`
    );
  });
  console.log('');

  // Example 2: Hybrid Search (Semantic + Keywords)
  console.log('4️⃣  Example 2: Hybrid Search\n');
  console.log('   Combining semantic search with keyword filtering:');

  const hybridResult = await retriever.hybridSearch(
    'programming languages and frameworks',
    ['Python', 'TypeScript'],
    { topK: 3 }
  );

  console.log(`   Found ${hybridResult.documents.length} matching documents:`);
  hybridResult.documents.forEach((doc, i) => {
    console.log(
      `   ${i + 1}. ${doc.id} - Score: ${doc.score.toFixed(3)}`
    );
    console.log(`      ${doc.text.substring(0, 100)}...`);
  });
  console.log('');

  // Example 3: Multi-Query Retrieval
  console.log('5️⃣  Example 3: Multi-Query Retrieval\n');
  console.log('   Fusing results from multiple related queries:');

  const multiQueries = [
    'What are recent AI advances?',
    'Tell me about language models',
    'Latest developments in machine learning',
  ];

  console.log(`   Queries:\n     - ${multiQueries.join('\n     - ')}`);

  const multiResult = await retriever.multiQueryRetrieve(multiQueries, { topK: 3 });

  console.log(`\n   Fused results (${multiResult.documents.length} documents):`);
  multiResult.documents.forEach((doc, i) => {
    console.log(
      `   ${i + 1}. ${doc.id} - RRF Score: ${doc.score.toFixed(3)}`
    );
  });
  console.log('');

  // Example 4: Retrieval with Score Threshold
  console.log('6️⃣  Example 4: Score Threshold Filtering\n');
  console.log('   Only returning highly relevant results (score > 0.5):');

  const thresholdResult = await retriever.retrieve('quantum computing research', {
    topK: 10,
    minScore: 0.5,
  });

  console.log(`   Found ${thresholdResult.documents.length} high-quality results:`);
  thresholdResult.documents.forEach((doc, i) => {
    console.log(
      `   ${i + 1}. ${doc.id} - Score: ${doc.score.toFixed(3)}`
    );
  });
  console.log('');

  // Example 5: Performance Benchmarking
  console.log('7️⃣  Example 5: Performance Benchmarking\n');
  console.log('   Running benchmark queries:');

  const benchmarkQueries = [
    'artificial intelligence',
    'web development',
    'machine learning',
    'cloud computing',
    'programming languages',
  ];

  const benchmarkStats = await retriever.benchmark(benchmarkQueries, 3);

  console.log(`   Benchmark Results:`);
  console.log(`     Average latency: ${benchmarkStats.avgRetrievalTimeMs.toFixed(2)}ms`);
  console.log(`     Min latency: ${benchmarkStats.minRetrievalTimeMs.toFixed(2)}ms`);
  console.log(`     Max latency: ${benchmarkStats.maxRetrievalTimeMs.toFixed(2)}ms`);
  console.log(`     Throughput: ${benchmarkStats.queriesPerSecond.toFixed(2)} queries/sec`);
  console.log('');

  // Example 6: Statistics and Insights
  console.log('8️⃣  Knowledge Base Statistics:');
  const stats = await documentProcessor.getStats();
  console.log(`   Total documents: ${stats.totalDocuments}`);
  console.log(`   Total chunks: ${stats.totalChunks}`);

  console.log('\n💡 Key Insights:');
  console.log('   • Metadata filtering enables precise scoping of search');
  console.log('   • Hybrid search combines semantic understanding with exact matching');
  console.log('   • Multi-query retrieval improves recall for complex questions');
  console.log('   • Score thresholds ensure high-quality results');
  console.log('   • All operations happen IN-PROCESS with zero network latency!');

  // Cleanup
  await vectorStore.reset();
  console.log('\n✓ Advanced example complete!');
}

main().catch(console.error);
