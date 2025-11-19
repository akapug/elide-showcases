/**
 * Recommendation System with Collaborative Filtering in TypeScript
 *
 * Demonstrates building recommendation engines using numpy, scipy, and scikit-learn
 * imported directly in TypeScript via Elide's polyglot capabilities.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import pandas from 'python:pandas';

/**
 * User-Based Collaborative Filtering
 */
export class UserBasedCF {
  private user_item_matrix: any;
  private similarity_matrix: any;
  private user_means: any;

  constructor(ratings_matrix: number[][]) {
    this.user_item_matrix = numpy.array(ratings_matrix);
    this.computeSimilarities();
  }

  /**
   * Compute user-user cosine similarity
   */
  private computeSimilarities(): void {
    console.log('Computing user similarities...');

    // Center ratings by user mean
    const user_ratings_mean = numpy.nanmean(this.user_item_matrix, { axis: 1, keepdims: true });
    this.user_means = user_ratings_mean;

    const centered = this.user_item_matrix - user_ratings_mean;

    // Replace NaN with 0 for similarity computation
    const filled = numpy.nan_to_num(centered);

    // Compute cosine similarity
    this.similarity_matrix = sklearn.metrics.pairwise.cosine_similarity(filled, filled);

    // Set diagonal to 0 (user not similar to themselves)
    numpy.fill_diagonal(this.similarity_matrix, 0);

    console.log('User similarities computed');
  }

  /**
   * Predict rating for user-item pair
   */
  predictRating(user_id: number, item_id: number, k: number = 10): number {
    // Get k most similar users who have rated this item
    const item_ratings = this.user_item_matrix.slice([null, item_id]);
    const rated_mask = ~numpy.isnan(item_ratings);

    if (rated_mask.sum() === 0) {
      return this.user_means[user_id];
    }

    const similarities = this.similarity_matrix[user_id];
    const valid_similarities = similarities * rated_mask;

    // Get top k similar users
    const top_k_indices = numpy.argsort(valid_similarities)[-k:];
    const top_similarities = valid_similarities[top_k_indices];
    const top_ratings = item_ratings[top_k_indices];

    // Weighted average
    const sim_sum = numpy.sum(numpy.abs(top_similarities));

    if (sim_sum === 0) {
      return this.user_means[user_id];
    }

    const weighted_ratings = numpy.sum(top_similarities * top_ratings);
    return this.user_means[user_id] + weighted_ratings / sim_sum;
  }

  /**
   * Get top N recommendations for a user
   */
  recommend(user_id: number, n: number = 10): Array<{ item_id: number; score: number }> {
    const user_ratings = this.user_item_matrix[user_id];
    const unrated_items = numpy.where(numpy.isnan(user_ratings))[0];

    const predictions: Array<{ item_id: number; score: number }> = [];

    for (const item_id of unrated_items) {
      const score = this.predictRating(user_id, item_id);
      predictions.push({ item_id: item_id, score: score });
    }

    // Sort by score
    predictions.sort((a, b) => b.score - a.score);

    return predictions.slice(0, n);
  }

  /**
   * Evaluate RMSE on test set
   */
  evaluateRMSE(test_data: Array<[number, number, number]>): number {
    const predictions: number[] = [];
    const actuals: number[] = [];

    for (const [user_id, item_id, rating] of test_data) {
      const pred = this.predictRating(user_id, item_id);
      predictions.push(pred);
      actuals.push(rating);
    }

    return sklearn.metrics.mean_squared_error(actuals, predictions, { squared: false });
  }
}

/**
 * Item-Based Collaborative Filtering
 */
export class ItemBasedCF {
  private user_item_matrix: any;
  private similarity_matrix: any;
  private item_means: any;

  constructor(ratings_matrix: number[][]) {
    this.user_item_matrix = numpy.array(ratings_matrix);
    this.computeSimilarities();
  }

  /**
   * Compute item-item similarity
   */
  private computeSimilarities(): void {
    console.log('Computing item similarities...');

    // Center ratings by item mean
    const item_ratings_mean = numpy.nanmean(this.user_item_matrix, { axis: 0, keepdims: true });
    this.item_means = item_ratings_mean;

    const centered = this.user_item_matrix - item_ratings_mean;

    // Replace NaN with 0
    const filled = numpy.nan_to_num(centered);

    // Compute cosine similarity between items
    this.similarity_matrix = sklearn.metrics.pairwise.cosine_similarity(
      filled.T,
      filled.T
    );

    // Set diagonal to 0
    numpy.fill_diagonal(this.similarity_matrix, 0);

    console.log('Item similarities computed');
  }

  /**
   * Predict rating
   */
  predictRating(user_id: number, item_id: number, k: number = 10): number {
    // Get k most similar items that user has rated
    const user_ratings = this.user_item_matrix[user_id];
    const similarities = this.similarity_matrix[item_id];

    // Find rated items
    const rated_mask = ~numpy.isnan(user_ratings);
    const rated_items = numpy.where(rated_mask)[0];

    if (rated_items.length === 0) {
      return this.item_means[item_id];
    }

    // Get similarities for rated items
    const item_similarities = similarities[rated_items];
    const item_ratings = user_ratings[rated_items];

    // Get top k similar items
    const top_k_indices = numpy.argsort(item_similarities)[-k:];
    const top_similarities = item_similarities[top_k_indices];
    const top_ratings = item_ratings[top_k_indices];

    // Weighted average
    const sim_sum = numpy.sum(numpy.abs(top_similarities));

    if (sim_sum === 0) {
      return this.item_means[item_id];
    }

    const weighted_ratings = numpy.sum(top_similarities * top_ratings);
    return weighted_ratings / sim_sum;
  }

  /**
   * Recommend items for user
   */
  recommend(user_id: number, n: number = 10): Array<{ item_id: number; score: number }> {
    const user_ratings = this.user_item_matrix[user_id];
    const unrated_items = numpy.where(numpy.isnan(user_ratings))[0];

    const predictions: Array<{ item_id: number; score: number }> = [];

    for (const item_id of unrated_items) {
      const score = this.predictRating(user_id, item_id);
      predictions.push({ item_id: item_id, score: score });
    }

    predictions.sort((a, b) => b.score - a.score);

    return predictions.slice(0, n);
  }
}

/**
 * Matrix Factorization (SVD)
 */
export class MatrixFactorization {
  private user_item_matrix: any;
  private U: any;
  private sigma: any;
  private Vt: any;
  private n_factors: number;

  constructor(ratings_matrix: number[][], n_factors: number = 50) {
    this.user_item_matrix = numpy.array(ratings_matrix);
    this.n_factors = n_factors;
    this.train();
  }

  /**
   * Train using SVD
   */
  private train(): void {
    console.log('Training matrix factorization...');

    // Fill NaN with column means
    const filled_matrix = this.fillMatrix();

    // Perform SVD
    const [U, sigma, Vt] = scipy.linalg.svd(filled_matrix, { full_matrices: false });

    // Keep only top k factors
    this.U = U.slice([null, 0, this.n_factors]);
    this.sigma = sigma.slice([0, this.n_factors]);
    this.Vt = Vt.slice([0, this.n_factors, null]);

    console.log('Matrix factorization completed');
  }

  /**
   * Fill missing values with column means
   */
  private fillMatrix(): any {
    const col_means = numpy.nanmean(this.user_item_matrix, { axis: 0 });
    const filled = this.user_item_matrix.copy();

    for (let i = 0; i < filled.shape[1]; i++) {
      const col = filled.slice([null, i]);
      const nan_mask = numpy.isnan(col);
      col[nan_mask] = col_means[i];
      filled.slice([null, i]).assign(col);
    }

    return filled;
  }

  /**
   * Predict rating
   */
  predictRating(user_id: number, item_id: number): number {
    const user_vector = this.U[user_id] * this.sigma;
    const item_vector = this.Vt.slice([null, item_id]);
    return numpy.dot(user_vector, item_vector);
  }

  /**
   * Get all predictions
   */
  getPredictions(): any {
    return numpy.dot(
      numpy.dot(this.U, numpy.diag(this.sigma)),
      this.Vt
    );
  }

  /**
   * Recommend items
   */
  recommend(user_id: number, n: number = 10): Array<{ item_id: number; score: number }> {
    const predictions = this.getPredictions()[user_id];
    const user_ratings = this.user_item_matrix[user_id];

    const recommendations: Array<{ item_id: number; score: number }> = [];

    for (let item_id = 0; item_id < predictions.length; item_id++) {
      // Only recommend unrated items
      if (numpy.isnan(user_ratings[item_id])) {
        recommendations.push({
          item_id: item_id,
          score: predictions[item_id]
        });
      }
    }

    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, n);
  }
}

/**
 * Neural Collaborative Filtering
 */
export class NeuralCF {
  private model: any;
  private n_users: number;
  private n_items: number;
  private embedding_size: number;

  constructor(n_users: number, n_items: number, embedding_size: number = 50) {
    this.n_users = n_users;
    this.n_items = n_items;
    this.embedding_size = embedding_size;
    this.buildModel();
  }

  /**
   * Build neural network model
   */
  private buildModel(): void {
    console.log('Building neural collaborative filtering model...');

    // @ts-ignore
    const tensorflow = require('python:tensorflow');

    // User input
    const user_input = tensorflow.keras.Input({ shape: [1], name: 'user_input' });

    // Item input
    const item_input = tensorflow.keras.Input({ shape: [1], name: 'item_input' });

    // User embedding
    let user_embedding = tensorflow.keras.layers.Embedding(
      this.n_users,
      this.embedding_size,
      { name: 'user_embedding' }
    )(user_input);
    user_embedding = tensorflow.keras.layers.Flatten()(user_embedding);

    // Item embedding
    let item_embedding = tensorflow.keras.layers.Embedding(
      this.n_items,
      this.embedding_size,
      { name: 'item_embedding' }
    )(item_input);
    item_embedding = tensorflow.keras.layers.Flatten()(item_embedding);

    // Concatenate embeddings
    let concat = tensorflow.keras.layers.Concatenate()([user_embedding, item_embedding]);

    // Dense layers
    concat = tensorflow.keras.layers.Dense(128, { activation: 'relu' })(concat);
    concat = tensorflow.keras.layers.Dropout(0.3)(concat);
    concat = tensorflow.keras.layers.Dense(64, { activation: 'relu' })(concat);
    concat = tensorflow.keras.layers.Dropout(0.2)(concat);
    concat = tensorflow.keras.layers.Dense(32, { activation: 'relu' })(concat);

    // Output layer
    const output = tensorflow.keras.layers.Dense(1, { activation: 'linear' })(concat);

    // Create model
    this.model = tensorflow.keras.Model({
      inputs: [user_input, item_input],
      outputs: output
    });

    this.model.compile({
      optimizer: tensorflow.keras.optimizers.Adam({ learning_rate: 0.001 }),
      loss: 'mse',
      metrics: ['mae']
    });

    console.log('Neural CF model built');
  }

  /**
   * Train model
   */
  async train(
    user_ids: number[],
    item_ids: number[],
    ratings: number[],
    epochs: number = 20,
    batch_size: number = 256,
    validation_split: number = 0.1
  ): Promise<void> {
    console.log('Training neural CF model...');

    // @ts-ignore
    const tensorflow = require('python:tensorflow');

    const user_array = numpy.array(user_ids);
    const item_array = numpy.array(item_ids);
    const ratings_array = numpy.array(ratings);

    await this.model.fit(
      [user_array, item_array],
      ratings_array,
      {
        epochs: epochs,
        batch_size: batch_size,
        validation_split: validation_split,
        callbacks: [
          tensorflow.keras.callbacks.EarlyStopping({
            monitor: 'val_loss',
            patience: 5,
            restore_best_weights: true
          })
        ],
        verbose: 1
      }
    );

    console.log('Training completed');
  }

  /**
   * Predict rating
   */
  predictRating(user_id: number, item_id: number): number {
    const user_array = numpy.array([[user_id]]);
    const item_array = numpy.array([[item_id]]);

    const prediction = this.model.predict([user_array, item_array]);
    return prediction[0][0];
  }

  /**
   * Recommend items for user
   */
  recommend(user_id: number, all_item_ids: number[], n: number = 10): Array<{ item_id: number; score: number }> {
    const user_array = numpy.full(all_item_ids.length, user_id);
    const item_array = numpy.array(all_item_ids);

    const predictions = this.model.predict([user_array, item_array]);

    const recommendations: Array<{ item_id: number; score: number }> = [];

    for (let i = 0; i < all_item_ids.length; i++) {
      recommendations.push({
        item_id: all_item_ids[i],
        score: predictions[i][0]
      });
    }

    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, n);
  }
}

/**
 * Content-Based Recommender
 */
export class ContentBasedRecommender {
  private item_features: any;
  private similarity_matrix: any;

  constructor(item_features: number[][]) {
    this.item_features = numpy.array(item_features);
    this.computeSimilarities();
  }

  /**
   * Compute item similarities based on features
   */
  private computeSimilarities(): void {
    console.log('Computing content-based similarities...');

    this.similarity_matrix = sklearn.metrics.pairwise.cosine_similarity(
      this.item_features,
      this.item_features
    );

    numpy.fill_diagonal(this.similarity_matrix, 0);

    console.log('Similarities computed');
  }

  /**
   * Recommend similar items
   */
  recommendSimilar(item_id: number, n: number = 10): Array<{ item_id: number; similarity: number }> {
    const similarities = this.similarity_matrix[item_id];

    const recommendations: Array<{ item_id: number; similarity: number }> = [];

    for (let i = 0; i < similarities.length; i++) {
      if (i !== item_id) {
        recommendations.push({
          item_id: i,
          similarity: similarities[i]
        });
      }
    }

    recommendations.sort((a, b) => b.similarity - a.similarity);

    return recommendations.slice(0, n);
  }

  /**
   * Recommend based on user's rated items
   */
  recommendForUser(
    user_ratings: Record<number, number>,
    n: number = 10
  ): Array<{ item_id: number; score: number }> {
    const scores: Record<number, number> = {};

    // For each item the user has rated
    for (const [item_id_str, rating] of Object.entries(user_ratings)) {
      const item_id = parseInt(item_id_str);
      const similarities = this.similarity_matrix[item_id];

      // Add weighted similarity scores
      for (let i = 0; i < similarities.length; i++) {
        if (!(i in user_ratings)) {
          scores[i] = (scores[i] || 0) + similarities[i] * rating;
        }
      }
    }

    // Convert to array and sort
    const recommendations = Object.entries(scores).map(([item_id, score]) => ({
      item_id: parseInt(item_id),
      score: score
    }));

    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, n);
  }
}

/**
 * Hybrid Recommender System
 */
export class HybridRecommender {
  private collaborative: ItemBasedCF;
  private content: ContentBasedRecommender;
  private alpha: number;

  constructor(
    ratings_matrix: number[][],
    item_features: number[][],
    alpha: number = 0.5
  ) {
    this.alpha = alpha; // Weight for collaborative filtering
    this.collaborative = new ItemBasedCF(ratings_matrix);
    this.content = new ContentBasedRecommender(item_features);
  }

  /**
   * Hybrid recommendation
   */
  recommend(
    user_id: number,
    user_ratings: Record<number, number>,
    n: number = 10
  ): Array<{ item_id: number; score: number }> {
    // Get collaborative recommendations
    const cf_recs = this.collaborative.recommend(user_id, n * 2);

    // Get content-based recommendations
    const cb_recs = this.content.recommendForUser(user_ratings, n * 2);

    // Combine scores
    const combined_scores: Record<number, number> = {};

    for (const rec of cf_recs) {
      combined_scores[rec.item_id] = this.alpha * rec.score;
    }

    for (const rec of cb_recs) {
      combined_scores[rec.item_id] =
        (combined_scores[rec.item_id] || 0) + (1 - this.alpha) * rec.score;
    }

    // Convert to array and sort
    const recommendations = Object.entries(combined_scores).map(([item_id, score]) => ({
      item_id: parseInt(item_id),
      score: score
    }));

    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, n);
  }
}

/**
 * Evaluation Metrics for Recommender Systems
 */
export class RecommenderMetrics {
  /**
   * Mean Average Precision at K
   */
  static mapAtK(
    recommendations: number[][],
    ground_truth: number[][],
    k: number
  ): number {
    let total_ap = 0;

    for (let i = 0; i < recommendations.length; i++) {
      const recs = recommendations[i].slice(0, k);
      const truth = new Set(ground_truth[i]);

      let hits = 0;
      let sum_precisions = 0;

      for (let j = 0; j < recs.length; j++) {
        if (truth.has(recs[j])) {
          hits++;
          sum_precisions += hits / (j + 1);
        }
      }

      total_ap += truth.size > 0 ? sum_precisions / truth.size : 0;
    }

    return total_ap / recommendations.length;
  }

  /**
   * Precision at K
   */
  static precisionAtK(
    recommendations: number[][],
    ground_truth: number[][],
    k: number
  ): number {
    let total_precision = 0;

    for (let i = 0; i < recommendations.length; i++) {
      const recs = new Set(recommendations[i].slice(0, k));
      const truth = new Set(ground_truth[i]);

      const hits = [...recs].filter(x => truth.has(x)).length;
      total_precision += hits / k;
    }

    return total_precision / recommendations.length;
  }

  /**
   * Recall at K
   */
  static recallAtK(
    recommendations: number[][],
    ground_truth: number[][],
    k: number
  ): number {
    let total_recall = 0;

    for (let i = 0; i < recommendations.length; i++) {
      const recs = new Set(recommendations[i].slice(0, k));
      const truth = new Set(ground_truth[i]);

      const hits = [...recs].filter(x => truth.has(x)).length;
      total_recall += truth.size > 0 ? hits / truth.size : 0;
    }

    return total_recall / recommendations.length;
  }

  /**
   * Normalized Discounted Cumulative Gain
   */
  static ndcgAtK(
    recommendations: number[][],
    ground_truth: number[][],
    k: number
  ): number {
    let total_ndcg = 0;

    for (let i = 0; i < recommendations.length; i++) {
      const recs = recommendations[i].slice(0, k);
      const truth = new Set(ground_truth[i]);

      // DCG
      let dcg = 0;
      for (let j = 0; j < recs.length; j++) {
        if (truth.has(recs[j])) {
          dcg += 1 / Math.log2(j + 2);
        }
      }

      // IDCG
      let idcg = 0;
      const ideal_length = Math.min(k, truth.size);
      for (let j = 0; j < ideal_length; j++) {
        idcg += 1 / Math.log2(j + 2);
      }

      total_ndcg += idcg > 0 ? dcg / idcg : 0;
    }

    return total_ndcg / recommendations.length;
  }
}

/**
 * Example usage: Movie recommendation
 */
function movieRecommendationExample() {
  console.log('=== Movie Recommendation System ===\n');

  // Sample ratings matrix (users x movies)
  // NaN represents unrated movies
  const ratings = [
    [5, 4, NaN, NaN, 3, NaN],
    [4, NaN, NaN, 5, NaN, 2],
    [NaN, 3, 4, NaN, NaN, NaN],
    [NaN, NaN, 5, 4, NaN, 3],
    [3, NaN, NaN, NaN, 4, 5]
  ];

  const movie_names = [
    'The Matrix',
    'Inception',
    'Interstellar',
    'The Prestige',
    'Shutter Island',
    'Memento'
  ];

  // Item-based collaborative filtering
  console.log('Training Item-Based Collaborative Filtering...');
  const cf = new ItemBasedCF(ratings);

  const user_id = 0;
  const recommendations = cf.recommend(user_id, 3);

  console.log(`\nTop 3 recommendations for User ${user_id}:`);
  for (const rec of recommendations) {
    console.log(`  ${movie_names[rec.item_id]}: ${rec.score.toFixed(2)}`);
  }

  // Matrix factorization
  console.log('\n\nTraining Matrix Factorization...');
  const mf = new MatrixFactorization(ratings, 10);

  const mf_recs = mf.recommend(user_id, 3);

  console.log(`\nTop 3 MF recommendations for User ${user_id}:`);
  for (const rec of mf_recs) {
    console.log(`  ${movie_names[rec.item_id]}: ${rec.score.toFixed(2)}`);
  }
}

export {
  UserBasedCF,
  ItemBasedCF,
  MatrixFactorization,
  NeuralCF,
  ContentBasedRecommender,
  HybridRecommender,
  RecommenderMetrics,
  movieRecommendationExample
};

export default ItemBasedCF;
