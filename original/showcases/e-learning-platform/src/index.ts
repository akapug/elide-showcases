/**
 * E-Learning Platform - Main Entry Point
 * 
 * Exports all platform components for easy importing
 */

export * from './types';
export { default as AITutor } from './ai/tutor';
export { default as AssessmentGenerator } from './ai/assessment-generator';
export { default as CourseRecommender } from './recommendations/course-recommender';
export { default as LearningAnalytics } from './analytics/learning-analytics';
export { default as VideoAnalyzer } from './content/video-analyzer';
export { default as EngagementPredictor } from './engagement/engagement-predictor';
export { default as AdaptiveLearning } from './personalization/adaptive-learning';
export { default as AutoGrader } from './grading/auto-grader';
export { default as StudyGroupMatcher } from './collaboration/study-groups';
