/**
 * Course Recommender - Intelligent Course Recommendations
 *
 * Uses scikit-learn's ML algorithms via Elide polyglot to provide personalized
 * course recommendations through collaborative and content-based filtering.
 */

// @ts-ignore - Elide polyglot: Import Python's scikit-learn
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';

import type {
  Course,
  Student,
  CourseRecommendation,
  RecommendationReason
} from '../types';

/**
 * Recommender configuration
 */
export interface RecommenderConfig {
  algorithm: 'collaborative' | 'content' | 'hybrid';
  minSimilarity: number;
  maxRecommendations: number;
  diversityWeight: number;
  recencyWeight: number;
  popularityWeight: number;
  coldStartStrategy: 'popular' | 'trending' | 'beginner';
}

/**
 * Recommendation request parameters
 */
export interface RecommendationRequest {
  studentId: string;
  count: number;
  excludeCourseIds?: string[];
  subject?: string;
  difficulty?: string;
  diversify?: boolean;
  explainability?: boolean;
}

/**
 * User interaction data for collaborative filtering
 */
export interface UserInteraction {
  studentId: string;
  courseId: string;
  rating?: number;          // 1-5 stars
  completed: boolean;
  progress: number;         // 0-100
  timeSpent: number;        // minutes
  timestamp: Date;
}

/**
 * Course feature vector for content-based filtering
 */
export interface CourseFeatures {
  courseId: string;
  subjectVector: number[];
  difficultyScore: number;
  topicVector: number[];
  durationScore: number;
  popularityScore: number;
}

/**
 * Intelligent Course Recommendation System
 *
 * Implements multiple recommendation strategies:
 * 1. Collaborative Filtering: "Students like you also took..."
 * 2. Content-Based Filtering: Match student interests to course features
 * 3. Hybrid Approach: Combine both for best results
 *
 * Uses scikit-learn algorithms:
 * - SVD for matrix factorization
 * - K-Nearest Neighbors for similarity
 * - Cosine similarity for content matching
 */
export class CourseRecommender {
  private config: RecommenderConfig;
  private svdModel: any;
  private knnModel: any;
  private tfIdfVectorizer: any;
  private scalerModel: any;
  private interactionMatrix: any;
  private courseFeatures: Map<string, CourseFeatures>;
  private studentProfiles: Map<string, number[]>;

  constructor(config?: Partial<RecommenderConfig>) {
    this.config = {
      algorithm: 'hybrid',
      minSimilarity: 0.3,
      maxRecommendations: 50,
      diversityWeight: 0.3,
      recencyWeight: 0.2,
      popularityWeight: 0.1,
      coldStartStrategy: 'popular',
      ...config
    };

    this.courseFeatures = new Map();
    this.studentProfiles = new Map();
    this.initializeModels();
  }

  /**
   * Initialize ML models using scikit-learn
   */
  private async initializeModels(): Promise<void> {
    console.log('🎯 Initializing Course Recommender models...');

    // Import scikit-learn modules
    const { decomposition, neighbors, preprocessing, feature_extraction } = sklearn;

    // SVD for collaborative filtering (matrix factorization)
    console.log('  📊 Initializing SVD for collaborative filtering...');
    this.svdModel = new decomposition.TruncatedSVD({
      n_components: 50,
      random_state: 42
    });

    // K-Nearest Neighbors for finding similar students/courses
    console.log('  👥 Initializing KNN for similarity search...');
    this.knnModel = new neighbors.NearestNeighbors({
      n_neighbors: 10,
      metric: 'cosine',
      algorithm: 'brute'
    });

    // TF-IDF for text feature extraction
    console.log('  📝 Initializing TF-IDF vectorizer...');
    this.tfIdfVectorizer = new feature_extraction.text.TfidfVectorizer({
      max_features: 100,
      stop_words: 'english'
    });

    // StandardScaler for feature normalization
    this.scalerModel = new preprocessing.StandardScaler();

    console.log('✅ Recommender ready!\n');
  }

  /**
   * Get personalized course recommendations for a student
   */
  public async recommend(
    studentId: string,
    request: Partial<RecommendationRequest> = {}
  ): Promise<CourseRecommendation[]> {

    console.log(`\n🎓 Generating recommendations for student ${studentId}...`);

    const params: RecommendationRequest = {
      studentId,
      count: 10,
      diversify: true,
      explainability: true,
      ...request
    };

    // Check if student is new (cold start problem)
    const isNewStudent = !this.studentProfiles.has(studentId);

    if (isNewStudent) {
      console.log('  ❄️  Cold start: Student is new');
      return await this.handleColdStart(params);
    }

    // Generate recommendations based on configured algorithm
    let recommendations: CourseRecommendation[];

    switch (this.config.algorithm) {
      case 'collaborative':
        recommendations = await this.collaborativeFiltering(params);
        break;
      case 'content':
        recommendations = await this.contentBasedFiltering(params);
        break;
      case 'hybrid':
        recommendations = await this.hybridRecommendation(params);
        break;
      default:
        recommendations = await this.hybridRecommendation(params);
    }

    // Apply diversity if requested
    if (params.diversify) {
      recommendations = this.diversifyRecommendations(recommendations);
    }

    // Sort by score and limit to requested count
    recommendations.sort((a, b) => b.score - a.score);
    recommendations = recommendations.slice(0, params.count);

    console.log(`✅ Generated ${recommendations.length} recommendations`);

    return recommendations;
  }

  /**
   * Collaborative filtering: Find similar students and recommend their courses
   */
  private async collaborativeFiltering(
    request: RecommendationRequest
  ): Promise<CourseRecommendation[]> {

    console.log('  🤝 Using collaborative filtering...');

    // Get student's interaction vector
    const studentVector = this.studentProfiles.get(request.studentId);
    if (!studentVector) {
      return [];
    }

    // Find similar students using KNN
    const similarities = await this.findSimilarStudents(
      request.studentId,
      studentVector,
      20
    );

    // Aggregate course preferences from similar students
    const courseScores = new Map<string, number>();
    const courseReasons = new Map<string, RecommendationReason[]>();

    for (const { studentId: similarStudentId, similarity } of similarities) {
      const courses = await this.getStudentCourses(similarStudentId);

      for (const courseId of courses) {
        // Skip if student already took this course
        if (this.hasStudentTakenCourse(request.studentId, courseId)) {
          continue;
        }

        const currentScore = courseScores.get(courseId) || 0;
        courseScores.set(courseId, currentScore + similarity);

        // Track reasoning
        if (!courseReasons.has(courseId)) {
          courseReasons.set(courseId, []);
        }
        courseReasons.get(courseId)!.push({
          factor: 'collaborative_filtering',
          weight: similarity,
          explanation: `Students similar to you also took this course`
        });
      }
    }

    // Convert to recommendations
    const recommendations: CourseRecommendation[] = [];

    for (const [courseId, score] of courseScores.entries()) {
      recommendations.push({
        courseId,
        score: this.normalizeScore(score),
        reasoning: courseReasons.get(courseId) || [],
        similarStudents: similarities.slice(0, 3).map(s => s.studentId)
      });
    }

    return recommendations;
  }

  /**
   * Content-based filtering: Match courses to student interests
   */
  private async contentBasedFiltering(
    request: RecommendationRequest
  ): Promise<CourseRecommendation[]> {

    console.log('  📚 Using content-based filtering...');

    // Get student's interest profile
    const studentProfile = await this.buildStudentProfile(request.studentId);

    // Calculate similarity with all available courses
    const recommendations: CourseRecommendation[] = [];

    for (const [courseId, features] of this.courseFeatures.entries()) {
      // Skip if student already took this course
      if (this.hasStudentTakenCourse(request.studentId, courseId)) {
        continue;
      }

      // Calculate cosine similarity between student profile and course features
      const similarity = this.cosineSimilarity(
        studentProfile.interestVector,
        features.topicVector
      );

      if (similarity >= this.config.minSimilarity) {
        const reasons: RecommendationReason[] = [
          {
            factor: 'topic_match',
            weight: similarity,
            explanation: 'Matches your interests and learning history'
          }
        ];

        // Add difficulty matching
        if (Math.abs(studentProfile.averageDifficulty - features.difficultyScore) < 0.3) {
          reasons.push({
            factor: 'difficulty_match',
            weight: 0.8,
            explanation: 'Appropriate difficulty level for you'
          });
        }

        recommendations.push({
          courseId,
          score: similarity,
          reasoning: reasons,
          similarStudents: []
        });
      }
    }

    return recommendations;
  }

  /**
   * Hybrid recommendation: Combine collaborative and content-based
   */
  private async hybridRecommendation(
    request: RecommendationRequest
  ): Promise<CourseRecommendation[]> {

    console.log('  🔀 Using hybrid approach...');

    // Get recommendations from both methods
    const collaborative = await this.collaborativeFiltering(request);
    const contentBased = await this.contentBasedFiltering(request);

    // Merge and combine scores
    const combined = new Map<string, CourseRecommendation>();

    // Add collaborative filtering results
    for (const rec of collaborative) {
      combined.set(rec.courseId, {
        ...rec,
        score: rec.score * 0.6 // 60% weight for collaborative
      });
    }

    // Add content-based results
    for (const rec of contentBased) {
      if (combined.has(rec.courseId)) {
        // Course appeared in both - boost score
        const existing = combined.get(rec.courseId)!;
        existing.score += rec.score * 0.4; // 40% weight for content
        existing.reasoning.push(...rec.reasoning);
      } else {
        combined.set(rec.courseId, {
          ...rec,
          score: rec.score * 0.4
        });
      }
    }

    // Add popularity boost
    for (const [courseId, rec] of combined.entries()) {
      const popularity = this.getCoursePopularity(courseId);
      rec.score += popularity * this.config.popularityWeight;

      if (popularity > 0.8) {
        rec.reasoning.push({
          factor: 'popularity',
          weight: popularity,
          explanation: 'Highly popular course with many enrollments'
        });
      }
    }

    return Array.from(combined.values());
  }

  /**
   * Handle cold start problem for new students
   */
  private async handleColdStart(
    request: RecommendationRequest
  ): Promise<CourseRecommendation[]> {

    const strategy = this.config.coldStartStrategy;

    switch (strategy) {
      case 'popular':
        return await this.getPopularCourses(request);
      case 'trending':
        return await this.getTrendingCourses(request);
      case 'beginner':
        return await this.getBeginnerCourses(request);
      default:
        return await this.getPopularCourses(request);
    }
  }

  /**
   * Get popular courses
   */
  private async getPopularCourses(
    request: RecommendationRequest
  ): Promise<CourseRecommendation[]> {

    const recommendations: CourseRecommendation[] = [];

    // In production, query actual enrollment data
    // For demo, return based on stored popularity scores
    const popularCourses = this.getTopCoursesByPopularity(request.count);

    for (const courseId of popularCourses) {
      recommendations.push({
        courseId,
        score: this.getCoursePopularity(courseId),
        reasoning: [
          {
            factor: 'popularity',
            weight: 1.0,
            explanation: 'Popular course with high enrollment'
          }
        ],
        similarStudents: []
      });
    }

    return recommendations;
  }

  /**
   * Get trending courses (recent surge in enrollment)
   */
  private async getTrendingCourses(
    request: RecommendationRequest
  ): Promise<CourseRecommendation[]> {

    // In production, analyze enrollment trends over time
    // For demo, return popular courses with recency bias
    return await this.getPopularCourses(request);
  }

  /**
   * Get beginner-friendly courses
   */
  private async getBeginnerCourses(
    request: RecommendationRequest
  ): Promise<CourseRecommendation[]> {

    const recommendations: CourseRecommendation[] = [];

    for (const [courseId, features] of this.courseFeatures.entries()) {
      // Filter for beginner difficulty
      if (features.difficultyScore <= 0.3) {
        recommendations.push({
          courseId,
          score: 0.8,
          reasoning: [
            {
              factor: 'beginner_friendly',
              weight: 1.0,
              explanation: 'Great starting point for new learners'
            }
          ],
          similarStudents: []
        });
      }
    }

    return recommendations.slice(0, request.count);
  }

  /**
   * Train models with interaction data
   */
  public async train(interactions: UserInteraction[]): Promise<void> {
    console.log('\n🎓 Training recommender models...');
    console.log(`  📊 Processing ${interactions.length} interactions`);

    // Build user-item interaction matrix
    const matrix = this.buildInteractionMatrix(interactions);
    console.log(`  📈 Matrix shape: ${matrix.shape}`);

    // Train SVD model for collaborative filtering
    console.log('  🔄 Fitting SVD model...');
    this.interactionMatrix = this.svdModel.fit_transform(matrix);

    // Train KNN model for similarity search
    console.log('  👥 Fitting KNN model...');
    this.knnModel.fit(this.interactionMatrix);

    // Build student profiles
    console.log('  👤 Building student profiles...');
    await this.buildAllStudentProfiles(interactions);

    console.log('✅ Training complete!\n');
  }

  /**
   * Add course features for content-based filtering
   */
  public addCourse(course: Course): void {
    // Extract features from course
    const features: CourseFeatures = {
      courseId: course.id,
      subjectVector: this.encodeSubject(course.subject),
      difficultyScore: this.encodeDifficulty(course.difficulty),
      topicVector: this.extractTopicVector(course),
      durationScore: this.encodeDuration(course.duration),
      popularityScore: course.enrollment.totalStudents / 10000 // Normalize
    };

    this.courseFeatures.set(course.id, features);
  }

  /**
   * Build interaction matrix for collaborative filtering
   */
  private buildInteractionMatrix(interactions: UserInteraction[]): any {
    // Create pandas DataFrame
    const data = {
      student_id: interactions.map(i => i.studentId),
      course_id: interactions.map(i => i.courseId),
      rating: interactions.map(i => this.calculateImplicitRating(i))
    };

    const df = pandas.DataFrame(data);

    // Pivot to create user-item matrix
    const matrix = df.pivot_table({
      index: 'student_id',
      columns: 'course_id',
      values: 'rating',
      fill_value: 0
    });

    return numpy.array(matrix.values);
  }

  /**
   * Calculate implicit rating from interaction
   */
  private calculateImplicitRating(interaction: UserInteraction): number {
    let rating = 0;

    // Explicit rating if available
    if (interaction.rating) {
      rating = interaction.rating;
    } else {
      // Implicit rating from behavior
      if (interaction.completed) rating += 3;
      rating += interaction.progress / 33.33; // 0-3 points from progress
      rating += Math.min(interaction.timeSpent / 1000, 2); // Up to 2 points from time
    }

    return Math.min(rating, 5); // Cap at 5
  }

  /**
   * Find similar students using KNN
   */
  private async findSimilarStudents(
    studentId: string,
    studentVector: number[],
    k: number
  ): Promise<Array<{studentId: string; similarity: number}>> {

    // In production, query the KNN model
    // For demo, return mock similar students
    const similar: Array<{studentId: string; similarity: number}> = [];

    for (let i = 0; i < k; i++) {
      similar.push({
        studentId: `student_${i}`,
        similarity: 0.9 - (i * 0.05)
      });
    }

    return similar;
  }

  /**
   * Build student interest profile
   */
  private async buildStudentProfile(studentId: string): Promise<any> {
    // In production, aggregate from student's course history
    return {
      interestVector: Array(100).fill(0).map(() => Math.random()),
      averageDifficulty: 0.5
    };
  }

  /**
   * Build profiles for all students
   */
  private async buildAllStudentProfiles(interactions: UserInteraction[]): Promise<void> {
    const studentIds = new Set(interactions.map(i => i.studentId));

    for (const studentId of studentIds) {
      const profile = await this.buildStudentProfile(studentId);
      this.studentProfiles.set(studentId, profile.interestVector);
    }
  }

  /**
   * Diversify recommendations to avoid filter bubble
   */
  private diversifyRecommendations(
    recommendations: CourseRecommendation[]
  ): CourseRecommendation[] {

    // Implement Maximum Marginal Relevance (MMR) for diversity
    const diversified: CourseRecommendation[] = [];
    const remaining = [...recommendations];

    // Always include top recommendation
    if (remaining.length > 0) {
      diversified.push(remaining.shift()!);
    }

    // Iteratively add most diverse remaining items
    while (remaining.length > 0 && diversified.length < recommendations.length) {
      let maxDiversity = -1;
      let maxIndex = 0;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const candidateFeatures = this.courseFeatures.get(candidate.courseId);

        // Calculate average dissimilarity to already selected items
        let avgDissimilarity = 0;
        for (const selected of diversified) {
          const selectedFeatures = this.courseFeatures.get(selected.courseId);
          if (candidateFeatures && selectedFeatures) {
            const similarity = this.cosineSimilarity(
              candidateFeatures.topicVector,
              selectedFeatures.topicVector
            );
            avgDissimilarity += (1 - similarity);
          }
        }
        avgDissimilarity /= diversified.length;

        // MMR score: balance relevance and diversity
        const mmr = (1 - this.config.diversityWeight) * candidate.score +
                    this.config.diversityWeight * avgDissimilarity;

        if (mmr > maxDiversity) {
          maxDiversity = mmr;
          maxIndex = i;
        }
      }

      diversified.push(remaining.splice(maxIndex, 1)[0]);
    }

    return diversified;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  /**
   * Feature encoding methods
   */
  private encodeSubject(subject: any): number[] {
    // One-hot encoding for subjects
    const subjects = ['math', 'science', 'engineering', 'arts', 'business'];
    const vector = new Array(subjects.length).fill(0);
    const index = subjects.indexOf(subject.category.toLowerCase());
    if (index >= 0) vector[index] = 1;
    return vector;
  }

  private encodeDifficulty(difficulty: string): number {
    const levels: any = {
      beginner: 0.25,
      intermediate: 0.5,
      advanced: 0.75,
      expert: 1.0
    };
    return levels[difficulty.toLowerCase()] || 0.5;
  }

  private encodeDuration(duration: any): number {
    // Normalize to 0-1 scale (assuming max 52 weeks)
    return Math.min(duration.weeks / 52, 1);
  }

  private extractTopicVector(course: Course): number[] {
    // In production, use TF-IDF on course description and syllabus
    // For demo, return random vector
    return Array(100).fill(0).map(() => Math.random());
  }

  /**
   * Helper methods
   */
  private hasStudentTakenCourse(studentId: string, courseId: string): boolean {
    // In production, query database
    return false;
  }

  private async getStudentCourses(studentId: string): Promise<string[]> {
    // In production, query database
    return [`course_${Math.random()}`];
  }

  private getCoursePopularity(courseId: string): number {
    const features = this.courseFeatures.get(courseId);
    return features?.popularityScore || 0.5;
  }

  private getTopCoursesByPopularity(count: number): string[] {
    const courses = Array.from(this.courseFeatures.entries())
      .sort((a, b) => b[1].popularityScore - a[1].popularityScore)
      .slice(0, count)
      .map(([id]) => id);
    return courses;
  }

  private normalizeScore(score: number): number {
    // Normalize score to 0-1 range
    return Math.min(Math.max(score / 10, 0), 1);
  }
}

export default CourseRecommender;
