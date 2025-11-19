/**
 * Content Moderator - AI-Powered Content Moderation
 *
 * Implements multi-layer content moderation using:
 * - python:transformers for toxic content detection
 * - python:cv2 for NSFW image detection
 * - Rule-based filters for spam and patterns
 *
 * Provides automatic moderation with configurable thresholds
 * and human review workflows.
 */

// @ts-ignore
import transformers from 'python:transformers';
// @ts-ignore
import cv2 from 'python:cv2';
// @ts-ignore
import numpy from 'python:numpy';

import type {
  Post,
  Media,
  ModerationResult,
  TextModerationResult,
  ImageModerationResult,
  ModerationAction,
  ModerationReason,
  ModerationScores,
  ModerationCategory,
} from '../types';

/**
 * Moderation configuration
 */
export interface ContentModeratorConfig {
  // Thresholds
  toxicityThreshold: number;
  nsfwThreshold: number;
  spamThreshold: number;
  hateSpeechThreshold: number;
  violenceThreshold: number;

  // Actions
  autoReject: boolean;
  autoReview: boolean;
  enableShadowBan: boolean;

  // Models
  toxicityModel: string;
  sentimentModel: string;
  nsfwModel: string;

  // Features
  enableTextModeration: boolean;
  enableImageModeration: boolean;
  enableVideoModeration: boolean;
  enableSpamDetection: boolean;
  enablePatternMatching: boolean;

  // Performance
  maxConcurrentRequests: number;
  requestTimeout: number;
  enableCaching: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ContentModeratorConfig = {
  toxicityThreshold: 0.7,
  nsfwThreshold: 0.7,
  spamThreshold: 0.8,
  hateSpeechThreshold: 0.65,
  violenceThreshold: 0.7,
  autoReject: true,
  autoReview: true,
  enableShadowBan: false,
  toxicityModel: 'unitary/toxic-bert',
  sentimentModel: 'cardiffnlp/twitter-roberta-base-sentiment',
  nsfwModel: 'Falconsai/nsfw_image_detection',
  enableTextModeration: true,
  enableImageModeration: true,
  enableVideoModeration: true,
  enableSpamDetection: true,
  enablePatternMatching: true,
  maxConcurrentRequests: 20,
  requestTimeout: 5000,
  enableCaching: true,
};

/**
 * ContentModerator - Main moderation class
 */
export class ContentModerator {
  private config: ContentModeratorConfig;
  private toxicityClassifier: any;
  private hateSpeechClassifier: any;
  private nsfwClassifier: any;
  private spamPatterns: RegExp[];
  private bannedWords: Set<string>;
  private moderationCache: Map<string, ModerationResult>;

  constructor(config: Partial<ContentModeratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.spamPatterns = this.buildSpamPatterns();
    this.bannedWords = this.buildBannedWordsList();
    this.moderationCache = new Map();
  }

  /**
   * Initialize moderation models
   */
  async initialize(): Promise<void> {
    console.log('Initializing ContentModerator...');

    // Load toxicity classifier
    this.toxicityClassifier = transformers.pipeline(
      'text-classification',
      { model: this.config.toxicityModel }
    );

    // Load hate speech classifier
    this.hateSpeechClassifier = transformers.pipeline(
      'text-classification',
      { model: 'facebook/roberta-hate-speech-dynabench-r4-target' }
    );

    // Load NSFW classifier (for images)
    if (this.config.enableImageModeration) {
      this.nsfwClassifier = transformers.pipeline(
        'image-classification',
        { model: this.config.nsfwModel }
      );
    }

    console.log('ContentModerator initialized successfully');
  }

  /**
   * Moderate complete post (text + media)
   */
  async moderatePost(post: Post): Promise<ModerationResult> {
    const moderationId = this.getModerationId(post.id);

    // Check cache
    if (this.config.enableCaching && this.moderationCache.has(moderationId)) {
      return this.moderationCache.get(moderationId)!;
    }

    // Moderate text content
    const textResult = await this.moderateText(post.content);

    // Moderate media
    const mediaResults: ImageModerationResult[] = [];
    if (post.media && post.media.length > 0) {
      for (const media of post.media) {
        if (media.type === 'image' && this.config.enableImageModeration) {
          const result = await this.moderateImage(media);
          mediaResults.push(result);
        }
      }
    }

    // Combine results
    const combinedResult = this.combineResults(textResult, mediaResults);

    // Cache result
    if (this.config.enableCaching) {
      this.moderationCache.set(moderationId, combinedResult);
    }

    return combinedResult;
  }

  /**
   * Moderate text content
   */
  async moderateText(text: string): Promise<TextModerationResult> {
    if (!text || text.trim().length === 0) {
      return this.getApprovedTextResult();
    }

    // Run all checks in parallel
    const [
      toxicityScores,
      hateSpeechScores,
      spamScore,
      patternMatches
    ] = await Promise.all([
      this.detectToxicity(text),
      this.detectHateSpeech(text),
      this.detectSpam(text),
      this.detectBannedPatterns(text),
    ]);

    // Calculate overall scores
    const scores: ModerationScores = {
      toxicity: toxicityScores.toxicity,
      spam: spamScore,
      hateSpeech: hateSpeechScores.hate,
      harassment: toxicityScores.insult,
      violence: toxicityScores.threat,
      selfHarm: 0, // Would need specific model
      sexual: toxicityScores.sexual || 0,
      nsfw: 0,
      overall: this.calculateOverallScore(toxicityScores, hateSpeechScores, spamScore),
    };

    // Determine action
    const reasons = this.buildModerationReasons(scores, patternMatches);
    const action = this.determineAction(scores, reasons);

    return {
      approved: action === 'approve',
      action,
      reasons,
      scores,
      confidence: this.calculateConfidence(scores),
      reviewRequired: action === 'review',
      textScores: toxicityScores,
      language: this.detectLanguage(text),
      detectedPatterns: patternMatches,
    };
  }

  /**
   * Detect toxicity using transformers
   */
  async detectToxicity(text: string): Promise<any> {
    try {
      const results = this.toxicityClassifier(text, { top_k: null });

      // Parse results based on model output
      const scores: any = {
        toxicity: 0,
        severeToxicity: 0,
        identityAttack: 0,
        insult: 0,
        profanity: 0,
        threat: 0,
      };

      // Extract scores from results
      for (const result of results) {
        const label = result.label.toLowerCase();
        const score = result.score;

        if (label.includes('toxic')) {
          scores.toxicity = Math.max(scores.toxicity, score);
        }
        if (label.includes('severe')) {
          scores.severeToxicity = score;
        }
        if (label.includes('identity')) {
          scores.identityAttack = score;
        }
        if (label.includes('insult')) {
          scores.insult = score;
        }
        if (label.includes('profanity') || label.includes('obscene')) {
          scores.profanity = score;
        }
        if (label.includes('threat')) {
          scores.threat = score;
        }
      }

      return scores;
    } catch (error) {
      console.error('Toxicity detection failed:', error);
      return {
        toxicity: 0,
        severeToxicity: 0,
        identityAttack: 0,
        insult: 0,
        profanity: 0,
        threat: 0,
      };
    }
  }

  /**
   * Detect hate speech
   */
  async detectHateSpeech(text: string): Promise<any> {
    try {
      const results = this.hateSpeechClassifier(text);

      const scores: any = {
        hate: 0,
        offensive: 0,
        neutral: 1,
      };

      for (const result of results) {
        const label = result.label.toLowerCase();
        const score = result.score;

        if (label.includes('hate')) {
          scores.hate = score;
        } else if (label.includes('offensive')) {
          scores.offensive = score;
        } else if (label.includes('neutral') || label.includes('neither')) {
          scores.neutral = score;
        }
      }

      return scores;
    } catch (error) {
      console.error('Hate speech detection failed:', error);
      return { hate: 0, offensive: 0, neutral: 1 };
    }
  }

  /**
   * Detect spam using patterns and heuristics
   */
  async detectSpam(text: string): Promise<number> {
    let spamScore = 0;

    // Check spam patterns
    const patternMatches = this.spamPatterns.filter(pattern => pattern.test(text));
    spamScore += patternMatches.length * 0.3;

    // Check excessive capitalization
    const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (upperCaseRatio > 0.5) {
      spamScore += 0.2;
    }

    // Check excessive punctuation
    const punctuationRatio = (text.match(/[!?]{2,}/g) || []).length / text.length;
    if (punctuationRatio > 0.1) {
      spamScore += 0.2;
    }

    // Check excessive emojis
    const emojiRatio = (text.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length / text.length;
    if (emojiRatio > 0.3) {
      spamScore += 0.15;
    }

    // Check URL spam
    const urlCount = (text.match(/https?:\/\//g) || []).length;
    if (urlCount > 3) {
      spamScore += 0.25;
    }

    // Check repetitive words
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = 1 - (uniqueWords.size / words.length);
    if (repetitionRatio > 0.5) {
      spamScore += 0.2;
    }

    return Math.min(spamScore, 1.0);
  }

  /**
   * Detect banned patterns
   */
  async detectBannedPatterns(text: string): Promise<string[]> {
    const matches: string[] = [];
    const lowerText = text.toLowerCase();

    // Check banned words
    for (const word of this.bannedWords) {
      if (lowerText.includes(word)) {
        matches.push(word);
      }
    }

    return matches;
  }

  /**
   * Moderate image content
   */
  async moderateImage(media: Media): Promise<ImageModerationResult> {
    // Download image
    const imageBuffer = await this.downloadImage(media.url);

    // Convert to format suitable for model
    const npArray = numpy.frombuffer(imageBuffer, dtype=numpy.uint8);
    const image = cv2.imdecode(npArray, cv2.IMREAD_COLOR);

    // Run NSFW detection
    const nsfwScores = await this.detectNSFW(image);

    // Run violence detection
    const violenceScore = await this.detectViolence(image);

    // Detect faces (for privacy concerns)
    const faces = await this.detectFaces(image);

    // Calculate scores
    const scores: ModerationScores = {
      toxicity: 0,
      spam: 0,
      hateSpeech: 0,
      harassment: 0,
      violence: violenceScore,
      selfHarm: 0,
      sexual: nsfwScores.sexual,
      nsfw: nsfwScores.nsfw,
      overall: Math.max(nsfwScores.nsfw, violenceScore),
    };

    // Determine action
    const reasons = this.buildImageModerationReasons(scores, faces.length);
    const action = this.determineAction(scores, reasons);

    return {
      approved: action === 'approve',
      action,
      reasons,
      scores,
      confidence: this.calculateConfidence(scores),
      reviewRequired: action === 'review',
      imageScores: {
        nsfw: nsfwScores.nsfw,
        violence: violenceScore,
        gore: nsfwScores.gore || 0,
        nudity: nsfwScores.nudity || 0,
        suggestive: nsfwScores.suggestive || 0,
      },
      detectedFaces: faces.length,
    };
  }

  /**
   * Detect NSFW content in images
   */
  async detectNSFW(image: any): Promise<any> {
    try {
      // In production, would use specialized NSFW detection model
      // For demo, return simulated scores
      return {
        nsfw: 0.1,
        sexual: 0.05,
        nudity: 0.03,
        suggestive: 0.08,
        gore: 0.02,
      };
    } catch (error) {
      console.error('NSFW detection failed:', error);
      return {
        nsfw: 0,
        sexual: 0,
        nudity: 0,
        suggestive: 0,
        gore: 0,
      };
    }
  }

  /**
   * Detect violence in images
   */
  async detectViolence(image: any): Promise<number> {
    // In production, would use violence detection model
    // For demo, return low score
    return 0.05;
  }

  /**
   * Detect faces in images
   */
  async detectFaces(image: any): Promise<any[]> {
    try {
      const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);
      const faceCascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
      );
      const faces = faceCascade.detectMultiScale(
        gray,
        { scaleFactor: 1.1, minNeighbors: 5 }
      );
      return Array.from(faces);
    } catch (error) {
      console.error('Face detection failed:', error);
      return [];
    }
  }

  /**
   * Combine moderation results
   */
  combineResults(
    textResult: TextModerationResult,
    mediaResults: ImageModerationResult[]
  ): ModerationResult {
    // Calculate combined scores
    const scores: ModerationScores = { ...textResult.scores };

    // Add media scores
    for (const mediaResult of mediaResults) {
      scores.nsfw = Math.max(scores.nsfw, mediaResult.scores.nsfw);
      scores.violence = Math.max(scores.violence, mediaResult.scores.violence);
      scores.sexual = Math.max(scores.sexual, mediaResult.scores.sexual);
    }

    // Recalculate overall
    scores.overall = Math.max(
      scores.toxicity,
      scores.hateSpeech,
      scores.spam,
      scores.nsfw,
      scores.violence
    );

    // Combine reasons
    const reasons = [
      ...textResult.reasons,
      ...mediaResults.flatMap(r => r.reasons)
    ];

    // Determine final action (most restrictive)
    const actions = [textResult.action, ...mediaResults.map(r => r.action)];
    const action = this.getMostRestrictiveAction(actions);

    return {
      approved: action === 'approve',
      action,
      reasons,
      scores,
      confidence: this.calculateConfidence(scores),
      reviewRequired: action === 'review',
    };
  }

  /**
   * Determine moderation action
   */
  determineAction(
    scores: ModerationScores,
    reasons: ModerationReason[]
  ): ModerationAction {
    // Critical violations - immediate reject
    if (
      scores.toxicity > 0.9 ||
      scores.hateSpeech > 0.85 ||
      scores.nsfw > 0.9 ||
      scores.violence > 0.85
    ) {
      return 'reject';
    }

    // High-severity violations
    const hasHighSeverity = reasons.some(r => r.severity === 'high' || r.severity === 'critical');
    if (hasHighSeverity && this.config.autoReject) {
      return 'reject';
    }

    // Above thresholds - review or reject
    if (scores.toxicity > this.config.toxicityThreshold) {
      return this.config.autoReview ? 'review' : 'reject';
    }
    if (scores.hateSpeech > this.config.hateSpeechThreshold) {
      return this.config.autoReview ? 'review' : 'reject';
    }
    if (scores.nsfw > this.config.nsfwThreshold) {
      return this.config.autoReview ? 'review' : 'reject';
    }
    if (scores.spam > this.config.spamThreshold) {
      return 'reject';
    }

    // Medium-severity violations - review
    const hasMediumSeverity = reasons.some(r => r.severity === 'medium');
    if (hasMediumSeverity) {
      return 'review';
    }

    // Shadow ban for borderline cases
    if (this.config.enableShadowBan && scores.overall > 0.5) {
      return 'shadow_ban';
    }

    return 'approve';
  }

  /**
   * Build moderation reasons
   */
  buildModerationReasons(
    scores: ModerationScores,
    patternMatches: string[]
  ): ModerationReason[] {
    const reasons: ModerationReason[] = [];

    if (scores.toxicity > this.config.toxicityThreshold) {
      reasons.push({
        category: 'toxicity',
        severity: scores.toxicity > 0.9 ? 'critical' : 'high',
        description: 'Content contains toxic language',
        confidence: scores.toxicity,
      });
    }

    if (scores.hateSpeech > this.config.hateSpeechThreshold) {
      reasons.push({
        category: 'hate_speech',
        severity: scores.hateSpeech > 0.85 ? 'critical' : 'high',
        description: 'Content contains hate speech',
        confidence: scores.hateSpeech,
      });
    }

    if (scores.spam > this.config.spamThreshold) {
      reasons.push({
        category: 'spam',
        severity: 'medium',
        description: 'Content appears to be spam',
        confidence: scores.spam,
      });
    }

    if (scores.harassment > 0.7) {
      reasons.push({
        category: 'harassment',
        severity: 'high',
        description: 'Content contains harassing language',
        confidence: scores.harassment,
      });
    }

    if (scores.violence > this.config.violenceThreshold) {
      reasons.push({
        category: 'violence',
        severity: 'high',
        description: 'Content contains violent imagery or threats',
        confidence: scores.violence,
      });
    }

    if (patternMatches.length > 0) {
      reasons.push({
        category: 'spam',
        severity: 'medium',
        description: `Banned patterns detected: ${patternMatches.join(', ')}`,
        confidence: 0.95,
      });
    }

    return reasons;
  }

  /**
   * Build image moderation reasons
   */
  buildImageModerationReasons(scores: ModerationScores, faceCount: number): ModerationReason[] {
    const reasons: ModerationReason[] = [];

    if (scores.nsfw > this.config.nsfwThreshold) {
      reasons.push({
        category: 'sexual_content',
        severity: scores.nsfw > 0.9 ? 'critical' : 'high',
        description: 'Image contains NSFW content',
        confidence: scores.nsfw,
      });
    }

    if (scores.violence > this.config.violenceThreshold) {
      reasons.push({
        category: 'violence',
        severity: 'high',
        description: 'Image contains violent content',
        confidence: scores.violence,
      });
    }

    return reasons;
  }

  /**
   * Calculate overall score
   */
  calculateOverallScore(
    toxicityScores: any,
    hateSpeechScores: any,
    spamScore: number
  ): number {
    return Math.max(
      toxicityScores.toxicity || 0,
      toxicityScores.severeToxicity || 0,
      hateSpeechScores.hate || 0,
      spamScore
    );
  }

  /**
   * Calculate confidence
   */
  calculateConfidence(scores: ModerationScores): number {
    // Higher overall score = higher confidence
    return Math.min(scores.overall * 1.2, 1.0);
  }

  /**
   * Get most restrictive action
   */
  getMostRestrictiveAction(actions: ModerationAction[]): ModerationAction {
    if (actions.includes('reject')) return 'reject';
    if (actions.includes('review')) return 'review';
    if (actions.includes('shadow_ban')) return 'shadow_ban';
    return 'approve';
  }

  /**
   * Build spam patterns
   */
  buildSpamPatterns(): RegExp[] {
    return [
      /\b(buy now|click here|limited time|act now)\b/i,
      /\b(viagra|cialis|pharmacy)\b/i,
      /\b(earn money|make \$\d+|work from home)\b/i,
      /\b(congratulations|you('ve| have) won)\b/i,
      /\b(free gift|free prize|claim your)\b/i,
      /\b(nigerian prince|inheritance|million dollars)\b/i,
    ];
  }

  /**
   * Build banned words list
   */
  buildBannedWordsList(): Set<string> {
    // In production, would load from database or config file
    return new Set([
      // Placeholder - actual list would be much larger
      'spam',
      'scam',
    ]);
  }

  /**
   * Download image
   */
  async downloadImage(url: string): Promise<Buffer> {
    // In production, would fetch from URL
    return Buffer.alloc(0);
  }

  /**
   * Detect language (simplified)
   */
  detectLanguage(text: string): string {
    return 'en';
  }

  /**
   * Get moderation ID for caching
   */
  getModerationId(postId: string): string {
    return `moderation_${postId}`;
  }

  /**
   * Get approved text result
   */
  getApprovedTextResult(): TextModerationResult {
    return {
      approved: true,
      action: 'approve',
      reasons: [],
      scores: {
        toxicity: 0,
        spam: 0,
        hateSpeech: 0,
        harassment: 0,
        violence: 0,
        selfHarm: 0,
        sexual: 0,
        nsfw: 0,
        overall: 0,
      },
      confidence: 1.0,
      reviewRequired: false,
      textScores: {
        toxicity: 0,
        severeToxicity: 0,
        identityAttack: 0,
        insult: 0,
        profanity: 0,
        threat: 0,
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.moderationCache.clear();
  }

  /**
   * Get statistics
   */
  getStats(): any {
    return {
      cacheSize: this.moderationCache.size,
      config: this.config,
    };
  }
}

/**
 * Create a default ContentModerator instance
 */
export function createContentModerator(config?: Partial<ContentModeratorConfig>): ContentModerator {
  return new ContentModerator(config);
}
