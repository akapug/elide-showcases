import pino from 'pino';
import { RecommendationEngine } from '../core/recommendation-engine.js';

const logger = pino({
  level: 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

const engine = new RecommendationEngine(logger);

async function ecommerceExample() {
  console.log('🛍️  E-commerce Product Recommendations Example\n');

  // Simulate a user browsing products
  const userId = 'user_12345';

  // 1. Get personalized homepage recommendations
  console.log('📱 1. Homepage Recommendations (Hybrid Algorithm)');
  const homepage = await engine.recommend({
    userId,
    limit: 5,
    algorithm: 'hybrid',
    context: {
      device: 'mobile',
      location: 'US'
    }
  });

  console.log(`   Found ${homepage.recommendations.length} recommendations:`);
  homepage.recommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec.metadata?.title} (Score: ${rec.score.toFixed(3)}, Confidence: ${rec.confidence.toFixed(3)})`);
    console.log(`      Reason: ${rec.reason}`);
  });

  // 2. User clicks on a product - get similar products
  console.log('\n🔍 2. Similar Products (Content-Based)');
  const similar = await engine.getSimilarItems({
    itemId: homepage.recommendations[0].itemId,
    limit: 5,
    algorithm: 'content_based'
  });

  console.log(`   Found ${similar.similarItems.length} similar products:`);
  similar.similarItems.slice(0, 3).forEach((item: any, i: number) => {
    console.log(`   ${i + 1}. Item ${item.itemId} (Similarity: ${item.similarity.toFixed(3)})`);
  });

  // 3. Record user interaction
  console.log('\n📊 3. Recording User Interaction');
  const interaction = await engine.recordInteraction({
    userId,
    itemId: homepage.recommendations[0].itemId,
    interactionType: 'click',
    timestamp: Date.now(),
    context: {
      sessionId: 'session_xyz',
      position: 1
    }
  });

  console.log(`   ✅ Interaction recorded: ${interaction.interactionId}`);
  console.log(`   📈 Model update queued: ${interaction.modelUpdateQueued}`);

  // 4. Get recommendations with diversity
  console.log('\n🎨 4. Diverse Recommendations (with 40% diversity weight)');
  const diverse = await engine.recommend({
    userId,
    limit: 5,
    algorithm: 'collaborative_filtering',
    diversityWeight: 0.4
  });

  console.log(`   Found ${diverse.recommendations.length} diverse recommendations:`);
  diverse.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec.metadata?.title} (Category: ${rec.metadata?.category})`);
  });

  // 5. Filtered recommendations
  console.log('\n🔧 5. Filtered Recommendations (Electronics only, rating >= 4.5)');
  const filtered = await engine.recommend({
    userId,
    limit: 5,
    algorithm: 'matrix_factorization',
    filters: {
      category: ['electronics'],
      minRating: 4.5
    }
  });

  console.log(`   Found ${filtered.recommendations.length} filtered recommendations:`);
  filtered.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec.metadata?.title} (Rating: ${rec.metadata?.rating.toFixed(1)})`);
  });

  // 6. Get user profile
  console.log('\n👤 6. User Profile');
  const profile = await engine.getUserProfile(userId);
  console.log(`   Total Interactions: ${profile.totalInteractions}`);
  console.log(`   Top Categories: ${profile.topCategories.join(', ')}`);
  console.log(`   Preferred Brands: ${profile.preferences.brands.join(', ')}`);

  console.log('\n✅ E-commerce example completed!\n');
}

ecommerceExample().catch(console.error);
