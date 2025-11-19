/**
 * E-Learning Platform - Core Type Definitions
 *
 * Comprehensive type system for the entire platform, ensuring type safety
 * across all components while maintaining flexibility for extensibility.
 */

// ============================================================================
// Student Types
// ============================================================================

/**
 * Represents a student in the e-learning platform
 */
export interface Student {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  enrollmentDate: Date;
  profile: StudentProfile;
  preferences: StudentPreferences;
  achievements: Achievement[];
  currentCourses: CourseEnrollment[];
  completedCourses: CompletedCourse[];
  metadata: Record<string, unknown>;
}

/**
 * Student profile information
 */
export interface StudentProfile {
  avatar?: string;
  bio?: string;
  educationLevel: EducationLevel;
  major?: string;
  interests: string[];
  goals: LearningGoal[];
  learningStyle: LearningStyle;
  timezone: string;
  language: string;
  accessibility: AccessibilityNeeds;
}

/**
 * Student learning preferences
 */
export interface StudentPreferences {
  contentFormat: ContentFormat[];
  studyTimePreference: TimePreference;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  difficultyPreference: DifficultyLevel;
  pacePreference: PacePreference;
}

/**
 * Education level enum
 */
export enum EducationLevel {
  Elementary = 'elementary',
  MiddleSchool = 'middle_school',
  HighSchool = 'high_school',
  Undergraduate = 'undergraduate',
  Graduate = 'graduate',
  Postgraduate = 'postgraduate',
  Professional = 'professional',
  Lifelong = 'lifelong'
}

/**
 * Learning styles (VARK model)
 */
export enum LearningStyle {
  Visual = 'visual',
  Auditory = 'auditory',
  Reading = 'reading',
  Kinesthetic = 'kinesthetic',
  Multimodal = 'multimodal'
}

/**
 * Learning goals
 */
export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetDate?: Date;
  progress: number; // 0-100
  milestones: Milestone[];
  status: GoalStatus;
}

export enum GoalStatus {
  Active = 'active',
  Completed = 'completed',
  Paused = 'paused',
  Abandoned = 'abandoned'
}

/**
 * Accessibility needs
 */
export interface AccessibilityNeeds {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  captionsRequired: boolean;
  keyboardOnly: boolean;
  reducedMotion: boolean;
  colorBlindMode?: ColorBlindMode;
}

export enum ColorBlindMode {
  Protanopia = 'protanopia',
  Deuteranopia = 'deuteranopia',
  Tritanopia = 'tritanopia'
}

// ============================================================================
// Course Types
// ============================================================================

/**
 * Represents a course in the platform
 */
export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  instructors: Instructor[];
  subject: Subject;
  difficulty: DifficultyLevel;
  duration: Duration;
  syllabus: Syllabus;
  modules: CourseModule[];
  prerequisites: string[]; // Course IDs
  learningObjectives: LearningObjective[];
  assessments: Assessment[];
  resources: Resource[];
  tags: string[];
  language: string;
  thumbnail?: string;
  trailer?: string;
  rating: CourseRating;
  enrollment: EnrollmentInfo;
  metadata: CourseMetadata;
}

/**
 * Course difficulty level
 */
export enum DifficultyLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
  Expert = 'expert'
}

/**
 * Subject/discipline
 */
export interface Subject {
  id: string;
  name: string;
  category: SubjectCategory;
  parent?: string; // Parent subject ID for hierarchy
}

export enum SubjectCategory {
  Mathematics = 'mathematics',
  Science = 'science',
  Engineering = 'engineering',
  Technology = 'technology',
  Arts = 'arts',
  Humanities = 'humanities',
  Business = 'business',
  Language = 'language',
  Health = 'health',
  Social = 'social'
}

/**
 * Course duration
 */
export interface Duration {
  weeks: number;
  hoursPerWeek: number;
  totalHours: number;
  selfPaced: boolean;
}

/**
 * Course syllabus
 */
export interface Syllabus {
  overview: string;
  topics: string[];
  schedule: ScheduleItem[];
  gradingPolicy: GradingPolicy;
  policies: CoursePolicies;
}

/**
 * Schedule item
 */
export interface ScheduleItem {
  week: number;
  title: string;
  topics: string[];
  materials: string[];
  assignments: string[];
  dueDate?: Date;
}

/**
 * Course module
 */
export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  quiz?: Assessment;
  estimatedTime: number; // minutes
  prerequisites: string[]; // Module IDs
  status: ModuleStatus;
}

export enum ModuleStatus {
  Locked = 'locked',
  Available = 'available',
  InProgress = 'in_progress',
  Completed = 'completed'
}

/**
 * Lesson
 */
export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  content: LessonContent[];
  estimatedTime: number;
  activities: Activity[];
  notes?: string;
  resources: Resource[];
}

/**
 * Lesson content types
 */
export type LessonContent =
  | VideoContent
  | TextContent
  | InteractiveContent
  | CodeContent
  | QuizContent;

export interface VideoContent {
  type: 'video';
  url: string;
  duration: number;
  transcript?: string;
  chapters?: VideoChapter[];
  subtitles?: Subtitle[];
}

export interface VideoChapter {
  title: string;
  timestamp: number; // seconds
  description?: string;
}

export interface Subtitle {
  language: string;
  url: string;
}

export interface TextContent {
  type: 'text';
  markdown: string;
  readingTime: number; // minutes
}

export interface InteractiveContent {
  type: 'interactive';
  interactionType: InteractionType;
  config: Record<string, unknown>;
  data: unknown;
}

export enum InteractionType {
  Simulation = 'simulation',
  Diagram = 'diagram',
  Game = 'game',
  VirtualLab = 'virtual_lab',
  DragDrop = 'drag_drop',
  Timeline = 'timeline'
}

export interface CodeContent {
  type: 'code';
  language: string;
  code: string;
  runnable: boolean;
  tests?: CodeTest[];
}

export interface CodeTest {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface QuizContent {
  type: 'quiz';
  questions: Question[];
  passingScore: number;
  timeLimit?: number; // minutes
}

/**
 * Learning objective
 */
export interface LearningObjective {
  id: string;
  description: string;
  bloomLevel: BloomLevel;
  assessedBy: string[]; // Assessment IDs
}

export enum BloomLevel {
  Remember = 'remember',
  Understand = 'understand',
  Apply = 'apply',
  Analyze = 'analyze',
  Evaluate = 'evaluate',
  Create = 'create'
}

/**
 * Course rating
 */
export interface CourseRating {
  average: number; // 0-5
  count: number;
  distribution: Record<number, number>; // star -> count
  reviews: Review[];
}

export interface Review {
  studentId: string;
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

/**
 * Enrollment information
 */
export interface EnrollmentInfo {
  totalStudents: number;
  activeStudents: number;
  completionRate: number; // percentage
  capacity?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Course metadata
 */
export interface CourseMetadata {
  created: Date;
  updated: Date;
  version: string;
  accreditation?: Accreditation;
  certificate: boolean;
  creditHours?: number;
}

export interface Accreditation {
  organization: string;
  certificateId: string;
  validUntil?: Date;
}

// ============================================================================
// Assessment Types
// ============================================================================

/**
 * Assessment (quiz, exam, project, etc.)
 */
export interface Assessment {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  description: string;
  type: AssessmentType;
  questions: Question[];
  totalPoints: number;
  passingScore: number;
  timeLimit?: number; // minutes
  attempts: number;
  availableFrom?: Date;
  dueDate?: Date;
  rubric?: Rubric;
  weight: number; // percentage of final grade
}

export enum AssessmentType {
  Quiz = 'quiz',
  Exam = 'exam',
  Assignment = 'assignment',
  Project = 'project',
  Essay = 'essay',
  Lab = 'lab',
  Presentation = 'presentation',
  PeerReview = 'peer_review'
}

/**
 * Question types
 */
export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | EssayQuestion
  | CodeQuestion
  | MatchingQuestion
  | FillInBlankQuestion;

export interface BaseQuestion {
  id: string;
  text: string;
  points: number;
  difficulty: DifficultyLevel;
  topic: string;
  explanation?: string;
  hints?: string[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: QuestionOption[];
  correctAnswer: number; // index
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  correctAnswer: boolean;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  acceptedAnswers: string[];
  caseSensitive: boolean;
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  minWords: number;
  maxWords: number;
  rubric: Rubric;
}

export interface CodeQuestion extends BaseQuestion {
  type: 'code';
  language: string;
  starterCode?: string;
  testCases: CodeTest[];
  timeLimit?: number; // seconds
  memoryLimit?: number; // MB
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  leftItems: MatchItem[];
  rightItems: MatchItem[];
  correctPairs: [string, string][]; // [leftId, rightId]
}

export interface MatchItem {
  id: string;
  text: string;
}

export interface FillInBlankQuestion extends BaseQuestion {
  type: 'fill_blank';
  template: string; // Text with {blank} placeholders
  blanks: BlankAnswer[];
}

export interface BlankAnswer {
  position: number;
  acceptedAnswers: string[];
  caseSensitive: boolean;
}

/**
 * Grading rubric
 */
export interface Rubric {
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  points: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  description: string;
}

/**
 * Student submission
 */
export interface Submission {
  id: string;
  studentId: string;
  assessmentId: string;
  answers: Answer[];
  submittedAt: Date;
  timeSpent: number; // seconds
  attempt: number;
  grade?: Grade;
}

export type Answer =
  | { questionId: string; type: 'multiple_choice'; selected: number }
  | { questionId: string; type: 'true_false'; selected: boolean }
  | { questionId: string; type: 'short_answer'; text: string }
  | { questionId: string; type: 'essay'; text: string }
  | { questionId: string; type: 'code'; code: string }
  | { questionId: string; type: 'matching'; pairs: [string, string][] }
  | { questionId: string; type: 'fill_blank'; answers: string[] };

/**
 * Grade
 */
export interface Grade {
  score: number;
  percentage: number;
  passed: boolean;
  feedback: Feedback[];
  gradedAt: Date;
  gradedBy: string; // 'auto' or instructor ID
  rubricScores?: RubricScore[];
}

export interface Feedback {
  questionId: string;
  isCorrect: boolean;
  earnedPoints: number;
  feedback: string;
}

export interface RubricScore {
  criterionId: string;
  score: number;
  feedback: string;
}

// ============================================================================
// Instructor Types
// ============================================================================

export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar?: string;
  expertise: string[];
  courses: string[]; // Course IDs
  rating: number;
  students: number;
}

// ============================================================================
// Activity & Engagement Types
// ============================================================================

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  estimatedTime: number;
  required: boolean;
  config: Record<string, unknown>;
}

export enum ActivityType {
  Discussion = 'discussion',
  Practice = 'practice',
  Reading = 'reading',
  Video = 'video',
  Quiz = 'quiz',
  Project = 'project',
  PeerReview = 'peer_review',
  Reflection = 'reflection'
}

export interface StudentActivity {
  id: string;
  studentId: string;
  activityId: string;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number;
  progress: number; // 0-100
  data: Record<string, unknown>;
}

/**
 * Engagement metrics
 */
export interface EngagementMetrics {
  studentId: string;
  courseId: string;
  period: DateRange;
  loginFrequency: number;
  sessionDuration: number; // average minutes
  contentInteraction: number; // 0-100 score
  forumParticipation: number;
  assignmentCompletion: number; // percentage
  videoWatchTime: number; // percentage of total
  engagementScore: number; // 0-100
  trend: Trend;
}

export enum Trend {
  Increasing = 'increasing',
  Stable = 'stable',
  Decreasing = 'decreasing'
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface StudentAnalytics {
  studentId: string;
  courseId?: string;
  period: DateRange;
  performance: PerformanceMetrics;
  engagement: EngagementMetrics;
  predictions: PredictionMetrics;
  recommendations: Recommendation[];
}

export interface PerformanceMetrics {
  averageScore: number;
  gradeDistribution: Record<string, number>;
  assessmentScores: AssessmentScore[];
  skillMastery: SkillMastery[];
  learningVelocity: number; // concepts per week
  consistencyScore: number; // 0-100
  improvementRate: number; // percentage
}

export interface AssessmentScore {
  assessmentId: string;
  score: number;
  percentile: number;
  date: Date;
}

export interface SkillMastery {
  skill: string;
  level: MasteryLevel;
  confidence: number; // 0-1
  assessments: string[]; // Assessment IDs
}

export enum MasteryLevel {
  Novice = 'novice',
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
  Expert = 'expert'
}

export interface PredictionMetrics {
  dropoutRisk: number; // 0-1 probability
  finalGradePrediction: number;
  weeklyEngagement: number[]; // next N weeks
  strugglingTopics: string[];
  completionDate?: Date;
  interventionNeeded: boolean;
}

export interface Recommendation {
  type: RecommendationType;
  priority: Priority;
  title: string;
  description: string;
  action: RecommendedAction;
  reasoning: string;
}

export enum RecommendationType {
  Content = 'content',
  Intervention = 'intervention',
  Resource = 'resource',
  StudyPlan = 'study_plan',
  PeerConnection = 'peer_connection'
}

export enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

export interface RecommendedAction {
  type: string;
  target: string;
  parameters: Record<string, unknown>;
}

// ============================================================================
// Study Group Types
// ============================================================================

export interface StudyGroup {
  id: string;
  name: string;
  courseId: string;
  members: string[]; // Student IDs
  maxSize: number;
  created: Date;
  schedule?: Schedule[];
  activities: GroupActivity[];
  performance: GroupPerformance;
}

export interface Schedule {
  day: DayOfWeek;
  time: string;
  duration: number; // minutes
  recurring: boolean;
}

export enum DayOfWeek {
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
  Sunday = 'sunday'
}

export interface GroupActivity {
  id: string;
  type: GroupActivityType;
  date: Date;
  participants: string[];
  notes: string;
}

export enum GroupActivityType {
  Study = 'study',
  Discussion = 'discussion',
  Project = 'project',
  Review = 'review'
}

export interface GroupPerformance {
  averageScore: number;
  collaboration: number; // 0-100
  attendance: number; // percentage
  productivity: number; // 0-100
}

// ============================================================================
// Resource Types
// ============================================================================

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  url?: string;
  content?: string;
  fileSize?: number;
  format?: string;
  tags: string[];
  created: Date;
}

export enum ResourceType {
  PDF = 'pdf',
  Video = 'video',
  Article = 'article',
  Book = 'book',
  Website = 'website',
  Dataset = 'dataset',
  Code = 'code',
  Slides = 'slides'
}

// ============================================================================
// Achievement & Gamification Types
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  rarity: Rarity;
  earnedAt: Date;
}

export enum AchievementCategory {
  Learning = 'learning',
  Social = 'social',
  Mastery = 'mastery',
  Consistency = 'consistency',
  Special = 'special'
}

export enum Rarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary'
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  completedAt?: Date;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface NotificationSettings {
  email: EmailNotifications;
  push: PushNotifications;
  inApp: boolean;
  digest: DigestFrequency;
}

export interface EmailNotifications {
  enabled: boolean;
  assignments: boolean;
  grades: boolean;
  announcements: boolean;
  messages: boolean;
  reminders: boolean;
}

export interface PushNotifications {
  enabled: boolean;
  assignments: boolean;
  messages: boolean;
  liveEvents: boolean;
}

export enum DigestFrequency {
  None = 'none',
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly'
}

// ============================================================================
// Privacy & Settings Types
// ============================================================================

export interface PrivacySettings {
  profileVisibility: Visibility;
  activityVisibility: Visibility;
  progressVisibility: Visibility;
  allowMessages: boolean;
  allowGroupInvites: boolean;
  dataSharing: DataSharingSettings;
}

export enum Visibility {
  Public = 'public',
  CourseMates = 'course_mates',
  Friends = 'friends',
  Private = 'private'
}

export interface DataSharingSettings {
  analytics: boolean;
  research: boolean;
  thirdParty: boolean;
}

// ============================================================================
// Content Preference Types
// ============================================================================

export enum ContentFormat {
  Video = 'video',
  Text = 'text',
  Interactive = 'interactive',
  Audio = 'audio',
  Mixed = 'mixed'
}

export enum TimePreference {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening',
  Night = 'night',
  Flexible = 'flexible'
}

export enum PacePreference {
  Slow = 'slow',
  Moderate = 'moderate',
  Fast = 'fast',
  SelfPaced = 'self_paced'
}

// ============================================================================
// Enrollment Types
// ============================================================================

export interface CourseEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  progress: number; // 0-100
  currentModule: string;
  lastAccessed: Date;
  timeSpent: number; // total minutes
  status: EnrollmentStatus;
  grade?: FinalGrade;
}

export enum EnrollmentStatus {
  Active = 'active',
  Completed = 'completed',
  Dropped = 'dropped',
  OnHold = 'on_hold'
}

export interface CompletedCourse {
  courseId: string;
  completedAt: Date;
  finalGrade: FinalGrade;
  certificate?: Certificate;
}

export interface FinalGrade {
  score: number;
  letter: LetterGrade;
  percentile: number;
  passed: boolean;
}

export enum LetterGrade {
  A_Plus = 'A+',
  A = 'A',
  A_Minus = 'A-',
  B_Plus = 'B+',
  B = 'B',
  B_Minus = 'B-',
  C_Plus = 'C+',
  C = 'C',
  C_Minus = 'C-',
  D = 'D',
  F = 'F'
}

export interface Certificate {
  id: string;
  courseId: string;
  studentId: string;
  issuedAt: Date;
  verificationUrl: string;
  pdfUrl: string;
}

// ============================================================================
// Grading Policy Types
// ============================================================================

export interface GradingPolicy {
  components: GradeComponent[];
  scale: GradingScale;
  latePolicy: LatePolicy;
  dropLowest?: number;
}

export interface GradeComponent {
  name: string;
  weight: number; // percentage
  assessmentIds: string[];
}

export interface GradingScale {
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
}

export interface LatePolicy {
  allowed: boolean;
  penaltyPerDay: number; // percentage
  maxLateDays: number;
}

// ============================================================================
// Course Policy Types
// ============================================================================

export interface CoursePolicies {
  attendance?: AttendancePolicy;
  collaboration: CollaborationPolicy;
  plagiarism: PlagiarismPolicy;
  accommodations: AccommodationPolicy;
}

export interface AttendancePolicy {
  required: boolean;
  minimumPercentage?: number;
  makeupAllowed: boolean;
}

export interface CollaborationPolicy {
  discussionAllowed: boolean;
  groupWorkAllowed: boolean;
  codeReviewAllowed: boolean;
  restrictions: string[];
}

export interface PlagiarismPolicy {
  tolerance: number; // similarity percentage
  consequences: string[];
  detectionEnabled: boolean;
}

export interface AccommodationPolicy {
  extraTime: boolean;
  alternativeFormats: boolean;
  flexibleDeadlines: boolean;
  contactInfo: string;
}

// ============================================================================
// AI & ML Types
// ============================================================================

/**
 * AI tutor conversation
 */
export interface TutorConversation {
  id: string;
  studentId: string;
  courseId: string;
  messages: TutorMessage[];
  started: Date;
  lastActivity: Date;
  context: ConversationContext;
}

export interface TutorMessage {
  id: string;
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
}

export interface ConversationContext {
  currentTopic: string;
  recentTopics: string[];
  studentLevel: MasteryLevel;
  courseProgress: number;
  strugglingAreas: string[];
}

/**
 * Video analysis results
 */
export interface VideoAnalysis {
  videoId: string;
  duration: number;
  scenes: Scene[];
  transcript: Transcript;
  keyMoments: KeyMoment[];
  topics: ExtractedTopic[];
  quality: VideoQuality;
}

export interface Scene {
  startTime: number;
  endTime: number;
  description: string;
  keyFrame: string; // URL
  detectedText: string[];
}

export interface Transcript {
  language: string;
  text: string;
  segments: TranscriptSegment[];
  confidence: number;
}

export interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
}

export interface KeyMoment {
  timestamp: number;
  title: string;
  description: string;
  importance: number; // 0-1
}

export interface ExtractedTopic {
  topic: string;
  relevance: number; // 0-1
  timestamps: number[];
}

export interface VideoQuality {
  resolution: string;
  audioQuality: number; // 0-100
  videoQuality: number; // 0-100
  issues: string[];
}

/**
 * Recommendation types
 */
export interface CourseRecommendation {
  courseId: string;
  score: number;
  reasoning: RecommendationReason[];
  similarStudents: string[];
}

export interface RecommendationReason {
  factor: string;
  weight: number;
  explanation: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface TimeSeriesData<T> {
  timestamps: Date[];
  values: T[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface PlatformConfig {
  ai: AIConfig;
  analytics: AnalyticsConfig;
  video: VideoConfig;
  recommendations: RecommendationConfig;
}

export interface AIConfig {
  tutorModel: string;
  assessmentModel: string;
  gradingModel: string;
  maxTokens: number;
  temperature: number;
  cache: boolean;
}

export interface AnalyticsConfig {
  trackingEnabled: boolean;
  retentionDays: number;
  anonymize: boolean;
  batchSize: number;
}

export interface VideoConfig {
  maxDuration: number;
  allowedFormats: string[];
  transcriptionEnabled: boolean;
  sceneDetectionThreshold: number;
}

export interface RecommendationConfig {
  algorithm: 'collaborative' | 'content' | 'hybrid';
  minSimilarity: number;
  diversityWeight: number;
  recencyWeight: number;
}

// ============================================================================
// Exports
// ============================================================================

export type {
  Student,
  Course,
  Assessment,
  Submission,
  StudyGroup,
  Instructor,
  Resource
};
