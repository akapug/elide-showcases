/**
 * Video Streaming Platform - Type Definitions
 *
 * Comprehensive type definitions for the video streaming platform,
 * demonstrating Elide's polyglot capabilities with Python integration.
 */

// ============================================================================
// Video Types
// ============================================================================

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
  audioCodec: string;
  audioChannels: number;
  audioSampleRate: number;
  fileSize: number;
  format: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category: string;
  language: string;
  uploadedBy: string;
}

export interface VideoFormat {
  resolution: string;
  width: number;
  height: number;
  bitrate: string;
  fps: number;
  codec: VideoCodec;
  audioCodec: AudioCodec;
  audioBitrate: string;
  preset: TranscodePreset;
  profile?: string;
  level?: string;
  pixelFormat?: string;
  colorSpace?: string;
  hdr?: boolean;
}

export type VideoCodec = 'h264' | 'h265' | 'vp9' | 'av1';
export type AudioCodec = 'aac' | 'opus' | 'mp3' | 'vorbis';
export type TranscodePreset = 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';

export interface TranscodeJob {
  id: string;
  videoId: string;
  inputPath: string;
  outputPath: string;
  format: VideoFormat;
  status: TranscodeStatus;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  retryCount: number;
  priority: number;
}

export type TranscodeStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface TranscodeResult {
  success: boolean;
  outputPath: string;
  fileSize: number;
  duration: number;
  processingTime: number;
  quality?: QualityMetrics;
  error?: string;
}

// ============================================================================
// Thumbnail Types
// ============================================================================

export interface ThumbnailOptions {
  count: number;
  width: number;
  height: number;
  quality: number;
  format: 'jpg' | 'png' | 'webp';
  method: ThumbnailMethod;
  detectFaces?: boolean;
  detectScenes?: boolean;
  avoidBlur?: boolean;
  preferActionShots?: boolean;
  useRuleOfThirds?: boolean;
}

export type ThumbnailMethod = 'interval' | 'keyframes' | 'intelligent' | 'random';

export interface Thumbnail {
  id: string;
  videoId: string;
  path: string;
  timestamp: number;
  width: number;
  height: number;
  fileSize: number;
  score?: number;
  features?: ThumbnailFeatures;
  isPrimary: boolean;
}

export interface ThumbnailFeatures {
  hasFaces: boolean;
  faceCount: number;
  facePositions?: Array<{ x: number; y: number; width: number; height: number }>;
  blurScore: number;
  brightness: number;
  contrast: number;
  colorfulness: number;
  compositionScore: number;
  actionScore: number;
  aestheticScore: number;
}

// ============================================================================
// Subtitle Types
// ============================================================================

export interface SubtitleOptions {
  language: string;
  model: string;
  format: SubtitleFormat;
  maxLineLength: number;
  maxLinesPerSubtitle: number;
  punctuate: boolean;
  diarization: boolean;
  translate?: string[];
  customVocabulary?: string[];
}

export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'ssa' | 'sub';

export interface Subtitle {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
  confidence?: number;
}

export interface SubtitleTrack {
  language: string;
  format: SubtitleFormat;
  path: string;
  subtitles: Subtitle[];
  metadata: {
    totalWords: number;
    averageConfidence: number;
    speakerCount?: number;
    processingTime: number;
  };
}

// ============================================================================
// Content Analysis Types
// ============================================================================

export interface ContentAnalysisOptions {
  detectObjects: boolean;
  classifyScenes: boolean;
  recognizeActions: boolean;
  detectFaces: boolean;
  extractText: boolean;
  detectLogos: boolean;
  analyzeAudio: boolean;
  extractKeyframes: boolean;
  generateMetadata: boolean;
  samplingInterval?: number;
}

export interface ContentAnalysis {
  videoId: string;
  duration: number;
  frameCount: number;
  sampledFrames: number;
  summary: ContentSummary;
  objects: ObjectDetection[];
  scenes: SceneClassification[];
  actions: ActionRecognition[];
  faces: FaceDetection[];
  text: TextExtraction[];
  logos: LogoDetection[];
  audio: AudioAnalysis;
  keyframes: Keyframe[];
  metadata: Record<string, any>;
  processingTime: number;
}

export interface ContentSummary {
  primaryCategories: string[];
  primaryObjects: string[];
  primaryActions: string[];
  mood: string;
  contentRating: string;
  isAdultContent: boolean;
  hasViolence: boolean;
  hasExplicitLanguage: boolean;
  dominantColors: string[];
  visualComplexity: number;
}

export interface ObjectDetection {
  timestamp: number;
  frameNumber: number;
  objects: Array<{
    label: string;
    confidence: number;
    bbox: BoundingBox;
    track?: number;
  }>;
}

export interface SceneClassification {
  timestamp: number;
  frameNumber: number;
  scenes: Array<{
    label: string;
    confidence: number;
  }>;
  isTransition: boolean;
}

export interface ActionRecognition {
  startTime: number;
  endTime: number;
  action: string;
  confidence: number;
  actors: number[];
}

export interface FaceDetection {
  timestamp: number;
  frameNumber: number;
  faces: Array<{
    bbox: BoundingBox;
    confidence: number;
    landmarks?: FaceLandmarks;
    attributes?: FaceAttributes;
    embedding?: number[];
    trackId?: number;
  }>;
}

export interface TextExtraction {
  timestamp: number;
  frameNumber: number;
  text: string;
  confidence: number;
  bbox: BoundingBox;
  language?: string;
}

export interface LogoDetection {
  timestamp: number;
  frameNumber: number;
  logo: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface AudioAnalysis {
  hasAudio: boolean;
  hasSpeech: boolean;
  hasMusic: boolean;
  musicGenre?: string[];
  averageVolume: number;
  dynamicRange: number;
  silenceRatio: number;
  speechRatio: number;
  musicRatio: number;
}

export interface Keyframe {
  timestamp: number;
  frameNumber: number;
  path?: string;
  importance: number;
  isSceneChange: boolean;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmarks {
  leftEye: Point;
  rightEye: Point;
  nose: Point;
  leftMouth: Point;
  rightMouth: Point;
}

export interface FaceAttributes {
  age?: number;
  gender?: string;
  emotion?: string;
  glasses?: boolean;
  beard?: boolean;
  mustache?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

// ============================================================================
// Recommendation Types
// ============================================================================

export interface RecommendationOptions {
  count: number;
  methods: RecommendationMethod[];
  diversify: boolean;
  explainability: boolean;
  filters?: RecommendationFilters;
  boosts?: Record<string, number>;
}

export type RecommendationMethod =
  | 'collaborative-filtering'
  | 'content-based'
  | 'hybrid'
  | 'popularity'
  | 'trending'
  | 'session-based'
  | 'deep-learning';

export interface RecommendationFilters {
  categories?: string[];
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
  minRating?: number;
  languages?: string[];
  uploadedAfter?: Date;
  excludeWatched?: boolean;
}

export interface Recommendation {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  viewCount: number;
  rating: number;
  score: number;
  method: RecommendationMethod;
  explanation: string;
  confidence: number;
}

export interface WatchHistory {
  userId: string;
  videoId: string;
  watchTime: number;
  completionRate: number;
  quality: string;
  liked: boolean;
  timestamp: Date;
}

export interface UserProfile {
  userId: string;
  preferences: {
    categories: Record<string, number>;
    tags: Record<string, number>;
    languages: string[];
    preferredQuality: string;
  };
  watchHistory: WatchHistory[];
  interactions: {
    likes: string[];
    dislikes: string[];
    watchLater: string[];
    subscriptions: string[];
  };
  demographics?: {
    age?: number;
    gender?: string;
    location?: string;
  };
}

// ============================================================================
// Streaming Types
// ============================================================================

export interface StreamingOptions {
  videoId: string;
  protocols: StreamingProtocol[];
  variants: StreamVariant[];
  segmentDuration: number;
  enableDRM: boolean;
  drmSystems?: DRMSystem[];
  cdnConfig?: CDNConfig;
}

export type StreamingProtocol = 'hls' | 'dash' | 'smooth';
export type DRMSystem = 'widevine' | 'fairplay' | 'playready';

export interface StreamVariant {
  id: string;
  bandwidth: number;
  resolution: string;
  width: number;
  height: number;
  fps: number;
  codec: string;
  audioCodec: string;
  audioBitrate: number;
  path: string;
}

export interface StreamManifest {
  protocol: StreamingProtocol;
  url: string;
  variants: StreamVariant[];
  duration: number;
  isLive: boolean;
  dvrWindow?: number;
  drm?: DRMInfo;
}

export interface DRMInfo {
  systems: DRMSystem[];
  licenseUrl: string;
  certificateUrl?: string;
}

export interface CDNConfig {
  provider: string;
  domains: string[];
  regions: string[];
  cacheTTL: number;
  purgeOnUpdate: boolean;
}

export interface BandwidthEstimate {
  timestamp: Date;
  bandwidth: number;
  latency: number;
  throughput: number;
  quality: string;
  bufferHealth: number;
}

export interface QualitySwitch {
  timestamp: Date;
  fromQuality: string;
  toQuality: string;
  reason: string;
  bufferLevel: number;
  bandwidth: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsOptions {
  timeWindow: string;
  metrics: AnalyticsMetric[];
  dimensions?: string[];
  aggregations?: AggregationType[];
  filters?: Record<string, any>;
}

export type AnalyticsMetric =
  | 'watch-time'
  | 'completion-rate'
  | 'engagement'
  | 'quality-of-experience'
  | 'views'
  | 'unique-viewers'
  | 'retention'
  | 'drop-off';

export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'percentile-50' | 'percentile-95' | 'percentile-99';

export interface AnalyticsResult {
  metric: AnalyticsMetric;
  aggregation: AggregationType;
  value: number;
  breakdown?: Record<string, number>;
  timeSeries?: TimeSeriesData[];
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface WatchSession {
  sessionId: string;
  userId?: string;
  videoId: string;
  startTime: Date;
  endTime?: Date;
  watchTime: number;
  completionRate: number;
  events: SessionEvent[];
  quality: QualityOfExperience;
  device: DeviceInfo;
  location: LocationInfo;
}

export interface SessionEvent {
  timestamp: Date;
  type: SessionEventType;
  data?: Record<string, any>;
}

export type SessionEventType =
  | 'play'
  | 'pause'
  | 'seek'
  | 'quality-change'
  | 'buffer-start'
  | 'buffer-end'
  | 'error'
  | 'complete';

export interface QualityOfExperience {
  startupTime: number;
  bufferingTime: number;
  bufferingCount: number;
  averageBitrate: number;
  qualitySwitches: number;
  errorCount: number;
  rebufferRatio: number;
  score: number;
}

export interface DeviceInfo {
  type: string;
  browser: string;
  os: string;
  screenResolution: string;
  connection: string;
}

export interface LocationInfo {
  country: string;
  region?: string;
  city?: string;
  isp?: string;
  timezone?: string;
}

// ============================================================================
// Live Streaming Types
// ============================================================================

export interface LiveStreamOptions {
  streamKey: string;
  ingestProtocol: LiveIngestProtocol;
  latency: LiveLatencyMode;
  transcode: boolean;
  recordArchive: boolean;
  enableChat: boolean;
  enableDVR: boolean;
  maxViewers: number;
  geoRestrictions?: string[];
}

export type LiveIngestProtocol = 'rtmp' | 'rtmps' | 'webrtc' | 'srt';
export type LiveLatencyMode = 'ultra-low' | 'low' | 'normal';

export interface LiveStream {
  id: string;
  streamKey: string;
  status: LiveStreamStatus;
  startTime?: Date;
  endTime?: Date;
  currentViewers: number;
  peakViewers: number;
  totalViews: number;
  health: StreamHealth;
  variants: StreamVariant[];
  chatId?: string;
  archiveId?: string;
}

export type LiveStreamStatus = 'idle' | 'starting' | 'live' | 'stopping' | 'ended' | 'error';

export interface StreamHealth {
  ingestBitrate: number;
  ingestFrameRate: number;
  droppedFrames: number;
  encoderCPU: number;
  encoderGPU?: number;
  networkLatency: number;
  bufferHealth: number;
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
}

export interface LiveViewer {
  id: string;
  userId?: string;
  joinTime: Date;
  leaveTime?: Date;
  quality: string;
  location: LocationInfo;
  device: DeviceInfo;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  limit: number;
  offset: number;
  facets?: string[];
  highlight?: boolean;
}

export interface SearchFilters {
  categories?: string[];
  tags?: string[];
  duration?: { min?: number; max?: number };
  uploadDate?: { before?: Date; after?: Date };
  rating?: { min?: number; max?: number };
  language?: string;
  hasSubtitles?: boolean;
  quality?: string[];
}

export interface SearchSort {
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  uploadDate: Date;
  viewCount: number;
  rating: number;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets?: Record<string, FacetValue[]>;
  processingTime: number;
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface SemanticSearchOptions {
  query: string;
  threshold: number;
  limit: number;
  includeVisual?: boolean;
  includeAudio?: boolean;
  weights?: {
    text?: number;
    visual?: number;
    audio?: number;
  };
}

export interface VisualSearchOptions {
  imagePath: string;
  similarityMetric: 'cosine' | 'euclidean' | 'manhattan';
  threshold: number;
  limit: number;
}

// ============================================================================
// Quality Analysis Types
// ============================================================================

export interface QualityAnalysisOptions {
  metrics: QualityMetric[];
  referenceVideo?: string;
  samplingInterval?: number;
  fullFrameAnalysis?: boolean;
}

export type QualityMetric = 'psnr' | 'ssim' | 'vmaf' | 'blur' | 'noise' | 'artifacts' | 'blocking' | 'banding';

export interface QualityMetrics {
  overallScore: number;
  psnr?: PSNRMetrics;
  ssim?: SSIMMetrics;
  vmaf?: VMAFMetrics;
  blur?: BlurMetrics;
  noise?: NoiseMetrics;
  artifacts?: ArtifactMetrics;
  issues: QualityIssue[];
  processingTime: number;
}

export interface PSNRMetrics {
  mean: number;
  min: number;
  max: number;
  std: number;
  perFrame: number[];
}

export interface SSIMMetrics {
  mean: number;
  min: number;
  max: number;
  std: number;
  perFrame: number[];
}

export interface VMAFMetrics {
  mean: number;
  min: number;
  max: number;
  std: number;
  harmonic_mean: number;
  perFrame: number[];
}

export interface BlurMetrics {
  averageBlur: number;
  blurryFrames: number;
  blurThreshold: number;
  perFrame: number[];
}

export interface NoiseMetrics {
  averageNoise: number;
  noisyFrames: number;
  signalToNoise: number;
  perFrame: number[];
}

export interface ArtifactMetrics {
  blockingScore: number;
  ringingScore: number;
  mosquitoScore: number;
  bandingScore: number;
  compressionArtifacts: number;
}

export interface QualityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedFrames?: number[];
  suggestions?: string[];
}

// ============================================================================
// Error Types
// ============================================================================

export class VideoStreamingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'VideoStreamingError';
  }
}

export class TranscodingError extends VideoStreamingError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'TRANSCODING_ERROR', details);
    this.name = 'TranscodingError';
  }
}

export class StreamingError extends VideoStreamingError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'STREAMING_ERROR', details);
    this.name = 'StreamingError';
  }
}

export class AnalysisError extends VideoStreamingError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ANALYSIS_ERROR', details);
    this.name = 'AnalysisError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CacheOptions {
  ttl: number;
  key: string;
  tags?: string[];
}

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (context: any) => string;
}
