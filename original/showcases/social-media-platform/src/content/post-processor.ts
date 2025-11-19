/**
 * Post Processor - Content Processing with Python ML Libraries
 *
 * Processes user-generated posts using:
 * - python:transformers for NLP (embeddings, entities, sentiment)
 * - python:cv2 for image processing (features, objects, faces)
 * - python:numpy for numerical operations
 *
 * Demonstrates Elide's polyglot capabilities by seamlessly calling
 * Python ML libraries from TypeScript.
 */

// @ts-ignore
import transformers from 'python:transformers';
// @ts-ignore
import cv2 from 'python:cv2';
// @ts-ignore
import numpy from 'python:numpy';

import type {
  Post,
  ProcessedText,
  ProcessedImage,
  Entity,
  Embedding,
  Sentiment,
  Media,
  MediaMetadata,
  ImageFeatures,
  FaceDetection,
  ObjectDetection,
  SceneDetection,
} from '../types';

/**
 * Post processing configuration
 */
export interface PostProcessorConfig {
  // NLP configuration
  embeddingModel: string;
  sentimentModel: string;
  nerModel: string;
  enableLanguageDetection: boolean;

  // Image processing configuration
  enableFaceDetection: boolean;
  enableObjectDetection: boolean;
  enableSceneDetection: boolean;
  generateThumbnails: boolean;

  // Performance configuration
  maxConcurrentRequests: number;
  requestTimeout: number;
  enableCaching: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PostProcessorConfig = {
  embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
  sentimentModel: 'cardiffnlp/twitter-roberta-base-sentiment',
  nerModel: 'dslim/bert-base-NER',
  enableLanguageDetection: true,
  enableFaceDetection: true,
  enableObjectDetection: true,
  enableSceneDetection: true,
  generateThumbnails: true,
  maxConcurrentRequests: 10,
  requestTimeout: 5000,
  enableCaching: true,
};

/**
 * PostProcessor - Main class for processing posts
 */
export class PostProcessor {
  private config: PostProcessorConfig;
  private embeddingModel: any;
  private embeddingTokenizer: any;
  private sentimentPipeline: any;
  private nerPipeline: any;
  private languageDetector: any;
  private modelCache: Map<string, any>;
  private processingQueue: Set<string>;

  constructor(config: Partial<PostProcessorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.modelCache = new Map();
    this.processingQueue = new Set();
  }

  /**
   * Initialize ML models
   */
  async initialize(): Promise<void> {
    console.log('Initializing PostProcessor...');

    // Load embedding model
    this.embeddingTokenizer = transformers.AutoTokenizer.from_pretrained(
      this.config.embeddingModel
    );
    this.embeddingModel = transformers.AutoModel.from_pretrained(
      this.config.embeddingModel
    );

    // Load sentiment analysis pipeline
    this.sentimentPipeline = transformers.pipeline(
      'sentiment-analysis',
      { model: this.config.sentimentModel }
    );

    // Load NER pipeline
    this.nerPipeline = transformers.pipeline(
      'ner',
      { model: this.config.nerModel, grouped_entities: true }
    );

    // Load language detector
    if (this.config.enableLanguageDetection) {
      this.languageDetector = transformers.pipeline('text-classification', {
        model: 'papluca/xlm-roberta-base-language-detection'
      });
    }

    console.log('PostProcessor initialized successfully');
  }

  /**
   * Process a complete post (text + media)
   */
  async processPost(post: Partial<Post>): Promise<Post> {
    const postId = post.id || this.generateId();

    // Avoid duplicate processing
    if (this.processingQueue.has(postId)) {
      throw new Error(`Post ${postId} is already being processed`);
    }

    this.processingQueue.add(postId);

    try {
      // Process text content
      const processedText = await this.processText(post.content || '');

      // Process media if present
      const processedMedia: Media[] = [];
      if (post.media && post.media.length > 0) {
        for (const media of post.media) {
          if (media.type === 'image') {
            const processed = await this.processImageMedia(media);
            processedMedia.push(processed);
          }
        }
      }

      // Build processed post
      const processedPost: Post = {
        id: postId,
        authorId: post.authorId || '',
        content: post.content || '',
        media: processedMedia,
        type: this.determinePostType(post),
        visibility: post.visibility || 'public',
        hashtags: processedText.hashtags,
        mentions: processedText.mentions,
        embedding: processedText.embedding,
        entities: processedText.entities,
        location: post.location,
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          views: 0,
          clicks: 0,
          engagementRate: 0,
          viralCoefficient: 0,
        },
        metadata: {
          language: processedText.language,
          source: 'web',
          sentiment: processedText.sentiment,
          topics: processedText.topics,
          readingTime: processedText.readingTime,
          wordCount: processedText.wordCount,
        },
        isPinned: false,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return processedPost;
    } finally {
      this.processingQueue.delete(postId);
    }
  }

  /**
   * Process text content using transformers
   */
  async processText(text: string): Promise<ProcessedText> {
    if (!text || text.trim().length === 0) {
      return this.getEmptyProcessedText();
    }

    // Parallel processing for better performance
    const [
      embedding,
      entities,
      sentiment,
      language
    ] = await Promise.all([
      this.generateEmbedding(text),
      this.extractEntities(text),
      this.analyzeSentiment(text),
      this.detectLanguage(text),
    ]);

    // Extract hashtags and mentions
    const hashtags = this.extractHashtags(text);
    const mentions = this.extractMentions(text);
    const urls = this.extractUrls(text);

    // Extract topics from entities
    const topics = this.extractTopics(entities);

    // Calculate reading time
    const wordCount = this.countWords(text);
    const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute

    return {
      text,
      embedding,
      entities,
      hashtags,
      mentions,
      urls,
      sentiment,
      language,
      topics,
      readingTime,
      wordCount,
    };
  }

  /**
   * Generate text embedding using transformers
   */
  async generateEmbedding(text: string): Promise<Embedding> {
    // Tokenize input
    const inputs = this.embeddingTokenizer(
      text,
      { padding: true, truncation: true, return_tensors: 'pt' }
    );

    // Generate embeddings
    const outputs = this.embeddingModel(**inputs);

    // Mean pooling
    const embeddings = outputs.last_hidden_state;
    const attentionMask = inputs.attention_mask;

    const maskedEmbeddings = embeddings * attentionMask.unsqueeze(-1);
    const sumEmbeddings = maskedEmbeddings.sum(dim=1);
    const sumMask = attentionMask.sum(dim=1, keepdim=True);
    const meanPooled = sumEmbeddings / sumMask;

    // Convert to array
    const vector = Array.from(meanPooled[0].detach().numpy());

    return {
      model: this.config.embeddingModel,
      vector,
      dimensions: vector.length,
      createdAt: new Date(),
    };
  }

  /**
   * Extract named entities using NER
   */
  async extractEntities(text: string): Promise<Entity[]> {
    // Run NER pipeline
    const results = this.nerPipeline(text);

    const entities: Entity[] = [];

    for (const result of results) {
      entities.push({
        text: result.word,
        type: this.mapEntityType(result.entity_group),
        startIndex: result.start,
        endIndex: result.end,
        confidence: result.score,
      });
    }

    // Add regex-based entities
    const regexEntities = this.extractRegexEntities(text);
    entities.push(...regexEntities);

    return entities;
  }

  /**
   * Analyze sentiment using transformers
   */
  async analyzeSentiment(text: string): Promise<Sentiment> {
    const results = this.sentimentPipeline(text);

    if (!results || results.length === 0) {
      return {
        label: 'neutral',
        score: 0.5,
        confidence: 0,
      };
    }

    const result = results[0];

    return {
      label: this.normalizeSentimentLabel(result.label),
      score: result.score,
      confidence: result.score,
    };
  }

  /**
   * Detect language
   */
  async detectLanguage(text: string): Promise<string> {
    if (!this.config.enableLanguageDetection || !this.languageDetector) {
      return 'en';
    }

    try {
      const results = this.languageDetector(text.substring(0, 512));
      if (results && results.length > 0) {
        return results[0].label;
      }
    } catch (error) {
      console.error('Language detection failed:', error);
    }

    return 'unknown';
  }

  /**
   * Extract hashtags from text
   */
  extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.matchAll(hashtagRegex);
    const hashtags = Array.from(matches, m => m[1].toLowerCase());
    return [...new Set(hashtags)]; // Remove duplicates
  }

  /**
   * Extract mentions from text
   */
  extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = text.matchAll(mentionRegex);
    const mentions = Array.from(matches, m => m[1].toLowerCase());
    return [...new Set(mentions)];
  }

  /**
   * Extract URLs from text
   */
  extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = text.match(urlRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Extract regex-based entities (email, phone, dates, etc.)
   */
  extractRegexEntities(text: string): Entity[] {
    const entities: Entity[] = [];

    // Email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let match;
    while ((match = emailRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'email',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 1.0,
      });
    }

    // Phone numbers (basic pattern)
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'phone',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.9,
      });
    }

    // Money amounts
    const moneyRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?/g;
    while ((match = moneyRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'money',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.95,
      });
    }

    // Percentages
    const percentRegex = /\b\d+(?:\.\d+)?%/g;
    while ((match = percentRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'percentage',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.95,
      });
    }

    return entities;
  }

  /**
   * Extract topics from entities
   */
  extractTopics(entities: Entity[]): string[] {
    const topicTypes = ['organization', 'product', 'event', 'location'];
    const topics = entities
      .filter(e => topicTypes.includes(e.type) && e.confidence > 0.7)
      .map(e => e.text.toLowerCase());

    return [...new Set(topics)];
  }

  /**
   * Process image media
   */
  async processImageMedia(media: Media): Promise<Media> {
    // Download image buffer (simulated)
    const imageBuffer = await this.downloadImage(media.url);

    // Process image
    const processed = await this.processImage(imageBuffer);

    // Update media with processed information
    return {
      ...media,
      thumbnail: processed.thumbnail ? this.bufferToUrl(processed.thumbnail) : undefined,
      preview: processed.preview ? this.bufferToUrl(processed.preview) : undefined,
      metadata: {
        ...media.metadata,
        dominantColors: processed.features.dominantColors,
        faces: processed.features.faces,
        objects: processed.features.objects,
        scenes: processed.features.scenes,
        quality: processed.features.quality,
      },
      processing: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      },
    };
  }

  /**
   * Process image using cv2
   */
  async processImage(imageBuffer: Buffer): Promise<ProcessedImage> {
    // Convert buffer to numpy array
    const npArray = numpy.frombuffer(imageBuffer, dtype=numpy.uint8);
    const image = cv2.imdecode(npArray, cv2.IMREAD_COLOR);

    // Generate thumbnails
    const thumbnail = this.generateThumbnail(image, 150, 150);
    const preview = this.generateThumbnail(image, 600, 600);

    // Extract features
    const features = await this.extractImageFeatures(image);

    // Get image metadata
    const height = image.shape[0];
    const width = image.shape[1];

    const metadata: MediaMetadata = {
      mimeType: 'image/jpeg',
      originalFilename: 'image.jpg',
      uploadedAt: new Date(),
      dominantColors: features.dominantColors,
      faces: features.faces,
      objects: features.objects,
      scenes: features.scenes,
      quality: features.quality,
    };

    return {
      imageId: this.generateId(),
      thumbnail: this.imageToBuffer(thumbnail),
      preview: this.imageToBuffer(preview),
      full: imageBuffer,
      metadata,
      features,
    };
  }

  /**
   * Extract image features
   */
  async extractImageFeatures(image: any): Promise<ImageFeatures> {
    const [
      dominantColors,
      faces,
      objects,
      scenes,
      quality
    ] = await Promise.all([
      this.extractDominantColors(image),
      this.config.enableFaceDetection ? this.detectFaces(image) : [],
      this.config.enableObjectDetection ? this.detectObjects(image) : [],
      this.config.enableSceneDetection ? this.detectScenes(image) : [],
      this.assessImageQuality(image),
    ]);

    const aesthetic = this.calculateAestheticScore(image);

    return {
      dominantColors,
      faces,
      objects,
      scenes,
      aesthetic,
      quality,
    };
  }

  /**
   * Extract dominant colors using cv2
   */
  extractDominantColors(image: any, numColors: number = 5): string[] {
    // Reshape image to 2D array of pixels
    const pixels = image.reshape(-1, 3);

    // Convert to float32
    const pixelsFloat = numpy.float32(pixels);

    // K-means clustering
    const criteria = [cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2];
    const [_, labels, centers] = cv2.kmeans(
      pixelsFloat,
      numColors,
      null,
      criteria,
      10,
      cv2.KMEANS_RANDOM_CENTERS
    );

    // Convert BGR to RGB and then to hex
    const colors: string[] = [];
    for (let i = 0; i < numColors; i++) {
      const [b, g, r] = centers[i];
      const hex = this.rgbToHex(Math.round(r), Math.round(g), Math.round(b));
      colors.push(hex);
    }

    return colors;
  }

  /**
   * Detect faces using cv2 Haar Cascades
   */
  detectFaces(image: any): FaceDetection[] {
    // Convert to grayscale
    const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);

    // Load face cascade
    const faceCascade = cv2.CascadeClassifier(
      cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    );

    // Detect faces
    const faces = faceCascade.detectMultiScale(
      gray,
      { scaleFactor: 1.1, minNeighbors: 5, minSize: [30, 30] }
    );

    const detections: FaceDetection[] = [];

    for (const [x, y, w, h] of faces) {
      detections.push({
        boundingBox: { x, y, width: w, height: h },
        confidence: 0.85, // Haar cascades don't provide confidence scores
      });
    }

    return detections;
  }

  /**
   * Detect objects (simplified - would use YOLO or similar in production)
   */
  async detectObjects(image: any): Promise<ObjectDetection[]> {
    // In production, would use YOLO, Faster R-CNN, etc.
    // For demo, return placeholder
    return [];
  }

  /**
   * Detect scenes (simplified - would use scene classification model)
   */
  async detectScenes(image: any): Promise<SceneDetection[]> {
    // In production, would use Places365 or similar
    // For demo, return placeholder
    return [];
  }

  /**
   * Assess image quality
   */
  assessImageQuality(image: any): number {
    // Calculate Laplacian variance (blur detection)
    const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);
    const laplacian = cv2.Laplacian(gray, cv2.CV_64F);
    const variance = laplacian.var();

    // Normalize to 0-1 scale
    const quality = Math.min(variance / 1000, 1.0);

    return quality;
  }

  /**
   * Calculate aesthetic score
   */
  calculateAestheticScore(image: any): any {
    // Simplified aesthetic scoring
    // In production, would use trained aesthetic models

    const height = image.shape[0];
    const width = image.shape[1];

    // Rule of thirds composition score
    const composition = this.scoreComposition(width, height);

    // Color harmony (simplified)
    const colorHarmony = 0.7;

    // Sharpness (using Laplacian variance)
    const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);
    const laplacian = cv2.Laplacian(gray, cv2.CV_64F);
    const sharpness = Math.min(laplacian.var() / 1000, 1.0);

    // Lighting (mean brightness)
    const meanBrightness = gray.mean() / 255;
    const lighting = 1.0 - Math.abs(meanBrightness - 0.5) * 2;

    const overall = (composition + colorHarmony + sharpness + lighting) / 4;

    return {
      overall,
      composition,
      lighting,
      colorHarmony,
      sharpness,
    };
  }

  /**
   * Score composition based on aspect ratio
   */
  scoreComposition(width: number, height: number): number {
    const aspectRatio = width / height;

    // Golden ratio ≈ 1.618
    const goldenRatio = 1.618;

    // Distance from golden ratio
    const distance = Math.abs(aspectRatio - goldenRatio);

    // Score decreases with distance
    return Math.max(0, 1.0 - distance);
  }

  /**
   * Generate thumbnail
   */
  generateThumbnail(image: any, width: number, height: number): any {
    return cv2.resize(image, [width, height], interpolation=cv2.INTER_AREA);
  }

  /**
   * Convert image to buffer
   */
  imageToBuffer(image: any): Buffer {
    const [success, encoded] = cv2.imencode('.jpg', image);
    if (!success) {
      throw new Error('Failed to encode image');
    }
    return Buffer.from(encoded);
  }

  /**
   * Convert buffer to URL (placeholder)
   */
  bufferToUrl(buffer: Buffer): string {
    // In production, would upload to CDN and return URL
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }

  /**
   * Download image (placeholder)
   */
  async downloadImage(url: string): Promise<Buffer> {
    // In production, would fetch from URL
    // For demo, return empty buffer
    return Buffer.alloc(0);
  }

  /**
   * Helper functions
   */

  generateId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  mapEntityType(entityGroup: string): any {
    const mapping: Record<string, any> = {
      'PER': 'person',
      'ORG': 'organization',
      'LOC': 'location',
      'MISC': 'product',
    };
    return mapping[entityGroup] || 'misc';
  }

  normalizeSentimentLabel(label: string): 'positive' | 'negative' | 'neutral' {
    const lower = label.toLowerCase();
    if (lower.includes('pos')) return 'positive';
    if (lower.includes('neg')) return 'negative';
    return 'neutral';
  }

  determinePostType(post: Partial<Post>): any {
    if (post.media && post.media.length > 0) {
      const hasVideo = post.media.some(m => m.type === 'video');
      if (hasVideo) return 'video';
      return 'image';
    }
    return 'text';
  }

  getEmptyProcessedText(): ProcessedText {
    return {
      text: '',
      embedding: {
        model: this.config.embeddingModel,
        vector: [],
        dimensions: 0,
        createdAt: new Date(),
      },
      entities: [],
      hashtags: [],
      mentions: [],
      urls: [],
      sentiment: {
        label: 'neutral',
        score: 0.5,
        confidence: 0,
      },
      language: 'en',
      topics: [],
      readingTime: 0,
      wordCount: 0,
    };
  }

  /**
   * Batch processing for multiple posts
   */
  async processBatch(posts: Partial<Post>[]): Promise<Post[]> {
    const results: Post[] = [];

    // Process in batches to avoid overwhelming the system
    const batchSize = this.config.maxConcurrency;

    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      const processed = await Promise.all(
        batch.map(post => this.processPost(post))
      );
      results.push(...processed);
    }

    return results;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.modelCache.clear();
  }

  /**
   * Get statistics
   */
  getStats(): any {
    return {
      modelsLoaded: this.modelCache.size,
      processingQueueSize: this.processingQueue.size,
      config: this.config,
    };
  }
}

/**
 * Create a default PostProcessor instance
 */
export function createPostProcessor(config?: Partial<PostProcessorConfig>): PostProcessor {
  return new PostProcessor(config);
}
