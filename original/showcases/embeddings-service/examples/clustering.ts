/**
 * Document clustering example
 * Groups similar documents together using embeddings
 */

import { EmbeddingService } from '../api/embedding-service';
import { SimilaritySearch } from '../shared/similarity';
import { Logger, formatDuration } from '../shared/utils';

interface Document {
  id: string;
  text: string;
  category?: string;
  cluster?: number;
}

class DocumentClusterer {
  private service: EmbeddingService;

  constructor() {
    this.service = new EmbeddingService();
  }

  /**
   * Simple K-means clustering implementation
   */
  async cluster(documents: Document[], k: number, maxIterations: number = 10): Promise<Document[]> {
    Logger.info(`Clustering ${documents.length} documents into ${k} clusters...\n`);

    // 1. Generate embeddings
    Logger.info('Step 1: Generating embeddings...');
    const start = performance.now();
    const texts = documents.map(d => d.text);
    const result = await this.service.encodeTextBatch(texts);
    const embeddings = result.embeddings;
    Logger.info(`Generated embeddings in ${formatDuration(performance.now() - start)}\n`);

    // 2. Initialize centroids randomly
    Logger.info('Step 2: Initializing centroids...');
    const indices = new Set<number>();
    while (indices.size < k) {
      indices.add(Math.floor(Math.random() * embeddings.length));
    }
    let centroids = Array.from(indices).map(i => embeddings[i]);
    Logger.info(`Initialized ${k} centroids\n`);

    // 3. Iterate K-means
    Logger.info('Step 3: Running K-means iterations...');
    let assignments = new Array(embeddings.length).fill(0);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const iterStart = performance.now();

      // Assign each point to nearest centroid
      const newAssignments = embeddings.map(embedding => {
        let minDist = Infinity;
        let bestCluster = 0;

        for (let c = 0; c < k; c++) {
          const dist = SimilaritySearch.euclideanDistance(embedding, centroids[c]);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = c;
          }
        }

        return bestCluster;
      });

      // Check convergence
      const changed = newAssignments.filter((a, i) => a !== assignments[i]).length;
      assignments = newAssignments;

      // Update centroids
      const clusterSums = Array(k).fill(0).map(() => new Array(embeddings[0].length).fill(0));
      const clusterCounts = new Array(k).fill(0);

      for (let i = 0; i < embeddings.length; i++) {
        const cluster = assignments[i];
        clusterCounts[cluster]++;
        for (let j = 0; j < embeddings[i].length; j++) {
          clusterSums[cluster][j] += embeddings[i][j];
        }
      }

      centroids = clusterSums.map((sum, c) =>
        sum.map(v => clusterCounts[c] > 0 ? v / clusterCounts[c] : 0)
      );

      const iterTime = performance.now() - iterStart;
      Logger.info(`  Iteration ${iteration + 1}: ${changed} assignments changed (${formatDuration(iterTime)})`);

      if (changed === 0) {
        Logger.info('  Converged!\n');
        break;
      }
    }

    // Assign clusters to documents
    documents.forEach((doc, i) => {
      doc.cluster = assignments[i];
    });

    const totalTime = performance.now() - start;
    Logger.info(`Total clustering time: ${formatDuration(totalTime)}\n`);

    return documents;
  }

  /**
   * Analyze cluster quality
   */
  analyzeCluster(documents: Document[]): void {
    const clusters = new Map<number, Document[]>();

    documents.forEach(doc => {
      if (!clusters.has(doc.cluster!)) {
        clusters.set(doc.cluster!, []);
      }
      clusters.get(doc.cluster!)!.push(doc);
    });

    Logger.info('=== Cluster Analysis ===\n');

    clusters.forEach((docs, clusterId) => {
      Logger.info(`Cluster ${clusterId} (${docs.length} documents):`);

      // Show sample documents
      docs.slice(0, 3).forEach(doc => {
        Logger.info(`  - ${doc.text.substring(0, 60)}...`);
        if (doc.category) {
          Logger.info(`    [Category: ${doc.category}]`);
        }
      });

      // Category distribution
      if (docs.some(d => d.category)) {
        const categories = new Map<string, number>();
        docs.forEach(doc => {
          if (doc.category) {
            categories.set(doc.category, (categories.get(doc.category) || 0) + 1);
          }
        });

        Logger.info('  Categories:');
        categories.forEach((count, cat) => {
          const pct = (count / docs.length * 100).toFixed(0);
          Logger.info(`    ${cat}: ${count} (${pct}%)`);
        });
      }

      Logger.info('');
    });
  }
}

async function main() {
  Logger.info('=== Document Clustering Example ===\n');

  // Sample documents with known categories
  const documents: Document[] = [
    // Technology
    { id: '1', text: 'Machine learning algorithms for data analysis', category: 'Technology' },
    { id: '2', text: 'Deep neural networks and artificial intelligence', category: 'Technology' },
    { id: '3', text: 'Cloud computing infrastructure and services', category: 'Technology' },
    { id: '4', text: 'Programming languages for software development', category: 'Technology' },

    // Food
    { id: '5', text: 'Italian pasta recipes with fresh ingredients', category: 'Food' },
    { id: '6', text: 'Healthy Mediterranean diet and nutrition', category: 'Food' },
    { id: '7', text: 'Baking bread and pastries at home', category: 'Food' },
    { id: '8', text: 'Asian cuisine cooking techniques and flavors', category: 'Food' },

    // Travel
    { id: '9', text: 'European cities and historical landmarks', category: 'Travel' },
    { id: '10', text: 'Beach destinations and tropical vacations', category: 'Travel' },
    { id: '11', text: 'Mountain hiking and outdoor adventures', category: 'Travel' },
    { id: '12', text: 'Cultural experiences in foreign countries', category: 'Travel' },

    // Health
    { id: '13', text: 'Exercise routines for cardiovascular fitness', category: 'Health' },
    { id: '14', text: 'Nutrition guidelines for healthy living', category: 'Health' },
    { id: '15', text: 'Mental health and stress management', category: 'Health' },
    { id: '16', text: 'Sleep quality and wellness practices', category: 'Health' },
  ];

  const clusterer = new DocumentClusterer();

  // Cluster documents
  const k = 4; // Expected number of clusters
  const clustered = await clusterer.cluster(documents, k);

  // Analyze results
  clusterer.analyzeCluster(clustered);

  // Evaluate clustering accuracy
  Logger.info('=== Clustering Accuracy ===\n');
  const categories = new Set(documents.map(d => d.category!));
  Logger.info(`Ground truth categories: ${Array.from(categories).join(', ')}`);
  Logger.info(`Number of clusters: ${k}`);

  // Calculate purity
  const clusterMap = new Map<number, Document[]>();
  clustered.forEach(doc => {
    if (!clusterMap.has(doc.cluster!)) {
      clusterMap.set(doc.cluster!, []);
    }
    clusterMap.get(doc.cluster!)!.push(doc);
  });

  let correctAssignments = 0;
  clusterMap.forEach(docs => {
    const categoryCount = new Map<string, number>();
    docs.forEach(doc => {
      categoryCount.set(doc.category!, (categoryCount.get(doc.category!) || 0) + 1);
    });
    const maxCount = Math.max(...categoryCount.values());
    correctAssignments += maxCount;
  });

  const purity = correctAssignments / documents.length;
  Logger.info(`Purity: ${(purity * 100).toFixed(1)}%`);
  Logger.info('(Purity measures how well clusters align with true categories)\n');

  Logger.info('=== Use Cases ===');
  Logger.info('- Content organization: Auto-categorize articles');
  Logger.info('- Topic discovery: Find themes in document collections');
  Logger.info('- Customer segmentation: Group similar user profiles');
  Logger.info('- Anomaly detection: Identify outliers');

  Logger.info('\n=== Example Complete ===');
}

main().catch(error => {
  Logger.error('Example failed:', error);
  process.exit(1);
});
