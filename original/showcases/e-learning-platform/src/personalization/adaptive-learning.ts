/**
 * Adaptive Learning Engine - Personalized Learning Paths
 *
 * Creates dynamic, personalized learning experiences that adapt to
 * individual student needs, pace, and learning style.
 */

// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';

import type {
  Student,
  CourseModule,
  Lesson,
  MasteryLevel,
  LearningStyle,
  LessonContent
} from '../types';

export interface AdaptivePath {
  studentId: string;
  currentTopic: string;
  nextContent: ContentRecommendation[];
  difficultyLevel: number;
  estimatedTime: number;
  reasoning: string[];
  knowledgeGraph: KnowledgeNode[];
}

export interface ContentRecommendation {
  contentId: string;
  contentType: 'lesson' | 'practice' | 'assessment' | 'review';
  title: string;
  difficulty: number;
  estimatedTime: number;
  priority: number;
  prerequisites: string[];
}

export interface KnowledgeNode {
  concept: string;
  mastery: number;
  lastAssessed: Date;
  dependencies: string[];
  status: 'locked' | 'available' | 'in_progress' | 'mastered';
}

export interface StudentModel {
  studentId: string;
  knowledgeState: Map<string, number>;
  learningRate: number;
  strengths: string[];
  weaknesses: string[];
  preferredFormats: string[];
  optimalDifficulty: number;
}

/**
 * Adaptive Learning Engine
 *
 * Implements:
 * - Knowledge graph modeling
 * - Mastery-based progression
 * - Personalized content sequencing
 * - Difficulty adaptation
 * - Learning style matching
 * - Optimal challenge point
 */
export class AdaptiveLearning {
  private knowledgeGraphs: Map<string, KnowledgeNode[]>;
  private studentModels: Map<string, StudentModel>;
  private contentLibrary: Map<string, any>;
  private bayesianModel: any;

  constructor() {
    this.knowledgeGraphs = new Map();
    this.studentModels = new Map();
    this.contentLibrary = new Map();
    this.initializeModels();
  }

  private async initializeModels(): Promise<void> {
    console.log('🧠 Initializing Adaptive Learning Engine...');

    // Bayesian Knowledge Tracing for mastery estimation
    const { naive_bayes } = sklearn;
    this.bayesianModel = new naive_bayes.GaussianNB();

    console.log('✅ Adaptive Learning ready!\n');
  }

  /**
   * Get next recommended content for student
   */
  public async getNextContent(
    studentId: string,
    options: {
      currentTopic?: string;
      masteryThreshold?: number;
      adaptToStyle?: boolean;
      count?: number;
    } = {}
  ): Promise<AdaptivePath> {

    console.log(`\n🎯 Generating adaptive path for student ${studentId}...`);

    const masteryThreshold = options.masteryThreshold || 0.8;

    // Get or create student model
    let studentModel = this.studentModels.get(studentId);
    if (!studentModel) {
      studentModel = await this.createStudentModel(studentId);
      this.studentModels.set(studentId, studentModel);
    }

    // Get knowledge graph for current topic
    const topic = options.currentTopic || 'general';
    const knowledgeGraph = await this.getKnowledgeGraph(topic);

    // Update knowledge state based on recent performance
    await this.updateKnowledgeState(studentModel, knowledgeGraph);

    // Find concepts student is ready to learn
    const readyConcepts = this.identifyReadyConcepts(
      studentModel,
      knowledgeGraph,
      masteryThreshold
    );

    console.log(`  📚 Found ${readyConcepts.length} concepts ready to learn`);

    // Generate content recommendations
    const recommendations = await this.generateRecommendations(
      studentModel,
      readyConcepts,
      options.count || 5,
      options.adaptToStyle
    );

    // Calculate optimal difficulty
    const difficulty = this.calculateOptimalDifficulty(studentModel);

    // Estimate time to complete
    const estimatedTime = recommendations.reduce((sum, r) => sum + r.estimatedTime, 0);

    // Generate reasoning
    const reasoning = this.generateReasoning(studentModel, readyConcepts, recommendations);

    return {
      studentId,
      currentTopic: topic,
      nextContent: recommendations,
      difficultyLevel: difficulty,
      estimatedTime,
      reasoning,
      knowledgeGraph
    };
  }

  /**
   * Create student model from historical data
   */
  private async createStudentModel(studentId: string): Promise<StudentModel> {
    // In production, analyze student's history
    // For demo, create initial model

    const knowledgeState = new Map<string, number>();

    // Initialize with baseline knowledge
    const concepts = ['basics', 'intermediate', 'advanced'];
    for (const concept of concepts) {
      knowledgeState.set(concept, 0.3); // Starting mastery
    }

    return {
      studentId,
      knowledgeState,
      learningRate: 0.7, // How quickly student learns
      strengths: ['visual learning', 'problem solving'],
      weaknesses: ['abstract concepts'],
      preferredFormats: ['video', 'interactive'],
      optimalDifficulty: 0.6 // Challenge level (0-1)
    };
  }

  /**
   * Get or create knowledge graph for topic
   */
  private async getKnowledgeGraph(topic: string): Promise<KnowledgeNode[]> {
    if (this.knowledgeGraphs.has(topic)) {
      return this.knowledgeGraphs.get(topic)!;
    }

    // Create knowledge graph structure
    const graph: KnowledgeNode[] = [
      {
        concept: 'Fundamentals',
        mastery: 0,
        lastAssessed: new Date(),
        dependencies: [],
        status: 'available'
      },
      {
        concept: 'Core Concepts',
        mastery: 0,
        lastAssessed: new Date(),
        dependencies: ['Fundamentals'],
        status: 'locked'
      },
      {
        concept: 'Advanced Topics',
        mastery: 0,
        lastAssessed: new Date(),
        dependencies: ['Core Concepts'],
        status: 'locked'
      },
      {
        concept: 'Expert Applications',
        mastery: 0,
        lastAssessed: new Date(),
        dependencies: ['Advanced Topics'],
        status: 'locked'
      }
    ];

    this.knowledgeGraphs.set(topic, graph);
    return graph;
  }

  /**
   * Update student's knowledge state based on recent assessments
   */
  private async updateKnowledgeState(
    studentModel: StudentModel,
    knowledgeGraph: KnowledgeNode[]
  ): Promise<void> {

    // Bayesian Knowledge Tracing update
    for (const node of knowledgeGraph) {
      const currentMastery = studentModel.knowledgeState.get(node.concept) || 0;

      // In production, use actual assessment results
      // For demo, simulate learning progress
      const practice = Math.random() > 0.5;
      const success = Math.random() > (1 - currentMastery);

      if (practice) {
        if (success) {
          // Increase mastery on success
          node.mastery = Math.min(1.0, currentMastery + studentModel.learningRate * 0.1);
        } else {
          // Slight decrease on failure
          node.mastery = Math.max(0.0, currentMastery - 0.05);
        }

        studentModel.knowledgeState.set(node.concept, node.mastery);
        node.lastAssessed = new Date();
      }

      // Update status based on mastery and dependencies
      if (node.mastery >= 0.8) {
        node.status = 'mastered';
      } else if (node.mastery > 0) {
        node.status = 'in_progress';
      } else if (this.areDependenciesMastered(node, knowledgeGraph, studentModel)) {
        node.status = 'available';
      } else {
        node.status = 'locked';
      }
    }
  }

  /**
   * Identify concepts student is ready to learn
   */
  private identifyReadyConcepts(
    studentModel: StudentModel,
    knowledgeGraph: KnowledgeNode[],
    masteryThreshold: number
  ): KnowledgeNode[] {

    const ready: KnowledgeNode[] = [];

    for (const node of knowledgeGraph) {
      // Ready if:
      // 1. Not yet mastered
      // 2. Dependencies are met
      // 3. Currently in progress or available

      if (node.mastery < masteryThreshold &&
          (node.status === 'available' || node.status === 'in_progress') &&
          this.areDependenciesMastered(node, knowledgeGraph, studentModel)) {

        ready.push(node);
      }
    }

    // Sort by current mastery (continue what's in progress first)
    ready.sort((a, b) => b.mastery - a.mastery);

    return ready;
  }

  /**
   * Check if all dependencies are mastered
   */
  private areDependenciesMastered(
    node: KnowledgeNode,
    graph: KnowledgeNode[],
    studentModel: StudentModel
  ): boolean {

    if (node.dependencies.length === 0) return true;

    for (const depName of node.dependencies) {
      const dep = graph.find(n => n.concept === depName);
      if (!dep) continue;

      const mastery = studentModel.knowledgeState.get(dep.concept) || 0;
      if (mastery < 0.7) return false; // Dependency not sufficiently mastered
    }

    return true;
  }

  /**
   * Generate content recommendations
   */
  private async generateRecommendations(
    studentModel: StudentModel,
    readyConcepts: KnowledgeNode[],
    count: number,
    adaptToStyle?: boolean
  ): Promise<ContentRecommendation[]> {

    const recommendations: ContentRecommendation[] = [];

    for (const concept of readyConcepts.slice(0, count)) {
      const mastery = concept.mastery;

      // Determine content type based on mastery level
      let contentType: 'lesson' | 'practice' | 'assessment' | 'review';

      if (mastery === 0) {
        contentType = 'lesson'; // New concept - introduce
      } else if (mastery < 0.5) {
        contentType = 'practice'; // Some knowledge - practice
      } else if (mastery < 0.8) {
        contentType = 'assessment'; // Good knowledge - assess
      } else {
        contentType = 'review'; // Near mastery - review
      }

      // Adapt content format to learning style
      let format = 'mixed';
      if (adaptToStyle && studentModel.preferredFormats.length > 0) {
        format = studentModel.preferredFormats[0];
      }

      recommendations.push({
        contentId: `content_${concept.concept}_${contentType}`,
        contentType,
        title: `${concept.concept}: ${this.getContentTitle(contentType)}`,
        difficulty: this.calculateContentDifficulty(mastery, studentModel.optimalDifficulty),
        estimatedTime: this.estimateContentTime(contentType, mastery),
        priority: (1 - mastery) * (readyConcepts.length - recommendations.length),
        prerequisites: concept.dependencies
      });
    }

    return recommendations;
  }

  /**
   * Calculate optimal difficulty for student
   */
  private calculateOptimalDifficulty(studentModel: StudentModel): number {
    // Optimal challenge point: slightly above current ability
    const avgMastery = Array.from(studentModel.knowledgeState.values())
      .reduce((sum, m) => sum + m, 0) / studentModel.knowledgeState.size;

    return Math.min(1.0, avgMastery + 0.2);
  }

  /**
   * Calculate difficulty for specific content
   */
  private calculateContentDifficulty(currentMastery: number, optimalDifficulty: number): number {
    // Content should challenge but not frustrate
    return Math.max(0, Math.min(1, currentMastery + 0.15));
  }

  /**
   * Estimate time to complete content
   */
  private estimateContentTime(contentType: string, mastery: number): number {
    // Base times (in minutes)
    const baseTimes: Record<string, number> = {
      lesson: 30,
      practice: 20,
      assessment: 15,
      review: 10
    };

    const baseTime = baseTimes[contentType] || 20;

    // Adjust based on mastery (lower mastery = more time needed)
    return Math.ceil(baseTime * (1.5 - mastery * 0.5));
  }

  /**
   * Generate reasoning for recommendations
   */
  private generateReasoning(
    studentModel: StudentModel,
    readyConcepts: KnowledgeNode[],
    recommendations: ContentRecommendation[]
  ): string[] {

    const reasoning: string[] = [];

    // Overall strategy
    if (readyConcepts.length > 0) {
      const inProgress = readyConcepts.filter(c => c.mastery > 0).length;
      if (inProgress > 0) {
        reasoning.push(`Continuing ${inProgress} concept(s) in progress`);
      }

      const newConcepts = readyConcepts.filter(c => c.mastery === 0).length;
      if (newConcepts > 0) {
        reasoning.push(`Introducing ${newConcepts} new concept(s)`);
      }
    }

    // Learning rate
    if (studentModel.learningRate > 0.8) {
      reasoning.push('Fast learner - slightly accelerated pace');
    } else if (studentModel.learningRate < 0.5) {
      reasoning.push('Taking time to master - reinforced practice');
    }

    // Difficulty adaptation
    if (studentModel.optimalDifficulty > 0.7) {
      reasoning.push('Ready for challenging material');
    } else if (studentModel.optimalDifficulty < 0.4) {
      reasoning.push('Building confidence with manageable challenges');
    }

    // Learning style adaptation
    if (studentModel.preferredFormats.includes('video')) {
      reasoning.push('Video-based content preferred');
    }
    if (studentModel.preferredFormats.includes('interactive')) {
      reasoning.push('Interactive exercises included');
    }

    return reasoning;
  }

  /**
   * Get content title based on type
   */
  private getContentTitle(contentType: string): string {
    const titles: Record<string, string> = {
      lesson: 'Introduction',
      practice: 'Practice Exercises',
      assessment: 'Mastery Check',
      review: 'Quick Review'
    };

    return titles[contentType] || 'Learning Content';
  }

  /**
   * Record student interaction for model updates
   */
  public async recordInteraction(
    studentId: string,
    contentId: string,
    outcome: {
      completed: boolean;
      timeSpent: number;
      score?: number;
      struggledWith?: string[];
    }
  ): Promise<void> {

    const studentModel = this.studentModels.get(studentId);
    if (!studentModel) return;

    // Update learning rate based on time spent vs expected
    // Update knowledge state based on score
    // Identify new strengths/weaknesses

    console.log(`📝 Recorded interaction for student ${studentId} on ${contentId}`);

    if (outcome.score !== undefined) {
      // Update mastery based on score
      const conceptEstimate = outcome.score / 100;

      // In production, map contentId to concepts and update
      console.log(`  Score: ${outcome.score}%, estimated mastery: ${conceptEstimate}`);
    }

    if (outcome.struggledWith && outcome.struggledWith.length > 0) {
      // Add to weaknesses if not already there
      for (const struggle of outcome.struggledWith) {
        if (!studentModel.weaknesses.includes(struggle)) {
          studentModel.weaknesses.push(struggle);
        }
      }
    }
  }

  /**
   * Get student progress overview
   */
  public getProgress(studentId: string, topic: string): {
    overallMastery: number;
    conceptsMastered: number;
    conceptsInProgress: number;
    conceptsRemaining: number;
  } {

    const studentModel = this.studentModels.get(studentId);
    const knowledgeGraph = this.knowledgeGraphs.get(topic);

    if (!studentModel || !knowledgeGraph) {
      return {
        overallMastery: 0,
        conceptsMastered: 0,
        conceptsInProgress: 0,
        conceptsRemaining: 0
      };
    }

    const conceptsMastered = knowledgeGraph.filter(n => n.status === 'mastered').length;
    const conceptsInProgress = knowledgeGraph.filter(n => n.status === 'in_progress').length;
    const conceptsRemaining = knowledgeGraph.filter(n => n.status === 'locked' || n.status === 'available').length;

    const totalMastery = Array.from(studentModel.knowledgeState.values())
      .reduce((sum, m) => sum + m, 0);
    const overallMastery = totalMastery / studentModel.knowledgeState.size;

    return {
      overallMastery,
      conceptsMastered,
      conceptsInProgress,
      conceptsRemaining
    };
  }
}

export default AdaptiveLearning;
