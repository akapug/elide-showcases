/**
 * Recommendation system example
 * Content-based recommendations using embeddings
 */

import { EmbeddingService } from '../api/embedding-service';
import { SimilaritySearch } from '../shared/similarity';
import { Logger, formatDuration } from '../shared/utils';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  embedding?: number[];
}

interface UserProfile {
  id: string;
  name: string;
  interactionHistory: string[]; // Item IDs
  embedding?: number[];
}

class RecommendationEngine {
  private service: EmbeddingService;
  private items: Item[] = [];

  constructor() {
    this.service = new EmbeddingService();
  }

  /**
   * Index item catalog
   */
  async indexItems(items: Item[]): Promise<void> {
    Logger.info(`Indexing ${items.length} items...\n`);

    const start = performance.now();
    const texts = items.map(item => `${item.title}. ${item.description}`);
    const result = await this.service.encodeTextBatch(texts);

    items.forEach((item, i) => {
      item.embedding = result.embeddings[i];
    });

    this.items = items;
    Logger.info(`Indexed ${items.length} items in ${formatDuration(performance.now() - start)}\n`);
  }

  /**
   * Build user profile from interaction history
   */
  buildUserProfile(user: UserProfile): void {
    const interactedItems = this.items.filter(item =>
      user.interactionHistory.includes(item.id)
    );

    if (interactedItems.length === 0) {
      return;
    }

    // Average embeddings of interacted items
    const dimensions = interactedItems[0].embedding!.length;
    const avgEmbedding = new Array(dimensions).fill(0);

    interactedItems.forEach(item => {
      item.embedding!.forEach((val, i) => {
        avgEmbedding[i] += val;
      });
    });

    user.embedding = avgEmbedding.map(val => val / interactedItems.length);
  }

  /**
   * Get recommendations for user
   */
  recommend(user: UserProfile, topK: number = 5, excludeHistory: boolean = true): Item[] {
    if (!user.embedding) {
      this.buildUserProfile(user);
    }

    if (!user.embedding) {
      return [];
    }

    // Filter out already interacted items
    let candidates = this.items;
    if (excludeHistory) {
      candidates = this.items.filter(item => !user.interactionHistory.includes(item.id));
    }

    // Find similar items
    const embeddings = candidates.map(item => item.embedding!);
    const results = SimilaritySearch.findTopK(user.embedding, embeddings, topK);

    return results.map(r => candidates[r.index]);
  }

  /**
   * Get similar items (item-to-item recommendations)
   */
  getSimilarItems(itemId: string, topK: number = 5): Array<Item & { score: number }> {
    const item = this.items.find(i => i.id === itemId);
    if (!item || !item.embedding) {
      return [];
    }

    // Exclude the item itself
    const candidates = this.items.filter(i => i.id !== itemId);
    const embeddings = candidates.map(i => i.embedding!);

    const results = SimilaritySearch.findTopK(item.embedding, embeddings, topK);

    return results.map(r => ({
      ...candidates[r.index],
      score: r.score,
    }));
  }
}

async function main() {
  Logger.info('=== Recommendation System Example ===\n');

  // Sample item catalog
  const items: Item[] = [
    { id: '1', title: 'Machine Learning Fundamentals', description: 'Learn the basics of ML algorithms and neural networks', category: 'Technology' },
    { id: '2', title: 'Deep Learning with Python', description: 'Advanced deep learning techniques using PyTorch and TensorFlow', category: 'Technology' },
    { id: '3', title: 'Data Science Bootcamp', description: 'Complete guide to data analysis, statistics, and visualization', category: 'Technology' },
    { id: '4', title: 'Web Development Mastery', description: 'Full-stack development with React, Node.js, and databases', category: 'Technology' },
    { id: '5', title: 'Italian Cooking Course', description: 'Authentic Italian recipes from pasta to desserts', category: 'Cooking' },
    { id: '6', title: 'Healthy Meal Prep', description: 'Nutritious meal planning and preparation strategies', category: 'Cooking' },
    { id: '7', title: 'Baking Masterclass', description: 'Professional baking techniques for breads and pastries', category: 'Cooking' },
    { id: '8', title: 'Yoga for Beginners', description: 'Introduction to yoga poses and breathing exercises', category: 'Fitness' },
    { id: '9', title: 'HIIT Workout Program', description: 'High-intensity interval training for fat loss and fitness', category: 'Fitness' },
    { id: '10', title: 'Marathon Training', description: 'Complete training plan for running your first marathon', category: 'Fitness' },
    { id: '11', title: 'Photography Essentials', description: 'Camera settings, composition, and editing basics', category: 'Creative' },
    { id: '12', title: 'Digital Art Techniques', description: 'Create stunning digital artwork with professional tools', category: 'Creative' },
  ];

  const engine = new RecommendationEngine();
  await engine.indexItems(items);

  // Create user profiles
  const users: UserProfile[] = [
    {
      id: 'user1',
      name: 'Alice',
      interactionHistory: ['1', '2', '3'], // ML and data science interested
    },
    {
      id: 'user2',
      name: 'Bob',
      interactionHistory: ['5', '6', '7'], // Cooking enthusiast
    },
    {
      id: 'user3',
      name: 'Charlie',
      interactionHistory: ['8', '9'], // Fitness focused
    },
  ];

  // Generate recommendations for each user
  Logger.info('=== User-based Recommendations ===\n');

  for (const user of users) {
    Logger.info(`Recommendations for ${user.name}:`);
    Logger.info(`  Interaction history: ${user.interactionHistory.map(id => items.find(i => i.id === id)?.title).join(', ')}\n`);

    const start = performance.now();
    const recommendations = engine.recommend(user, 3);
    const elapsed = performance.now() - start;

    Logger.info(`  Top 3 recommendations (${formatDuration(elapsed)}):`);
    recommendations.forEach((item, i) => {
      Logger.info(`    ${i + 1}. ${item.title}`);
      Logger.info(`       ${item.description}`);
      Logger.info(`       [${item.category}]`);
    });
    Logger.info('');
  }

  // Item-to-item recommendations
  Logger.info('=== Item-based Recommendations ===\n');

  const testItem = items[0]; // Machine Learning Fundamentals
  Logger.info(`Similar items to "${testItem.title}":\n`);

  const start = performance.now();
  const similar = engine.getSimilarItems(testItem.id, 3);
  const elapsed = performance.now() - start;

  Logger.info(`Top 3 similar items (${formatDuration(elapsed)}):`);
  similar.forEach((item, i) => {
    Logger.info(`  ${i + 1}. ${item.title} (similarity: ${item.score.toFixed(4)})`);
    Logger.info(`     ${item.description}`);
  });
  Logger.info('');

  // Demonstrate cross-category recommendations
  Logger.info('=== Cross-Category Recommendations ===\n');

  const mixedUser: UserProfile = {
    id: 'user4',
    name: 'Diana',
    interactionHistory: ['1', '5', '8'], // Tech + Cooking + Fitness
  };

  Logger.info(`Recommendations for ${mixedUser.name} (diverse interests):`);
  const mixedRecs = engine.recommend(mixedUser, 5);
  mixedRecs.forEach((item, i) => {
    Logger.info(`  ${i + 1}. ${item.title} [${item.category}]`);
  });
  Logger.info('');

  // Performance metrics
  Logger.info('=== Performance Metrics ===');
  const recStart = performance.now();
  engine.recommend(users[0], 10);
  const recTime = performance.now() - recStart;

  Logger.info(`Recommendation generation: ${formatDuration(recTime)}`);
  Logger.info(`Catalog size: ${items.length} items`);
  Logger.info(`Recommendations/second: ${(1000 / recTime).toFixed(0)}`);

  Logger.info('\n=== Use Cases ===');
  Logger.info('- E-commerce: Product recommendations');
  Logger.info('- Content platforms: Article/video suggestions');
  Logger.info('- Education: Course recommendations');
  Logger.info('- Music/movies: Personalized playlists');
  Logger.info('- Job matching: Candidate-job fit');

  Logger.info('\n=== Example Complete ===');
}

main().catch(error => {
  Logger.error('Example failed:', error);
  process.exit(1);
});
