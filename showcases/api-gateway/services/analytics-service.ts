/**
 * Analytics Service (Python - Conceptual TypeScript Implementation)
 *
 * This service demonstrates how a Python service would use shared TypeScript utilities
 * via Elide's polyglot capabilities. The actual Python implementation would import
 * the same UUID, validator, and other utilities used by the TypeScript gateway.
 *
 * Conceptual Python code:
 * ```python
 * # analytics-service.py (conceptual - Elide Python API is alpha)
 * from elide import require
 * uuid_module = require('../shared/uuid.ts')
 * validator_module = require('../shared/validator.ts')
 *
 * def analyze_user(user_id: str):
 *     if not validator_module.isUUID(user_id):
 *         return {"error": "Invalid user ID"}
 *     analysis_id = uuid_module.v4()
 *     return {"analysisId": analysis_id, "userId": user_id}
 * ```
 */

import { v4 as uuidv4, validate as validateUuid } from '../shared/uuid.ts';
import { isUUID } from '../shared/validator.ts';
import type { RequestContext, Response } from '../gateway/middleware.ts';

/**
 * Analytics event interface
 */
interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string;
  timestamp: string;
  metadata: Record<string, any>;
}

/**
 * In-memory analytics store
 */
const events: AnalyticsEvent[] = [];
const userStats: Map<string, any> = new Map();

/**
 * Analyze user behavior
 *
 * In Python, this would use:
 * - uuid_module.v4() for generating analysis IDs
 * - validator_module.isUUID() for validating user IDs
 * - ms_module() for calculating time ranges
 */
export async function analyzeUser(ctx: RequestContext, userId: string): Promise<Response> {
  console.log(`[AnalyticsService][Python] Analyzing user: ${userId}`);

  // Python would use: validator_module.isUUID(user_id)
  if (!validateUuid(userId)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid user ID format',
        note: 'Validated using shared TypeScript validator',
      },
    };
  }

  // Python would use: analysis_id = uuid_module.v4()
  const analysisId = uuidv4();

  // Simulate analytics computation
  const userEvents = events.filter(e => e.userId === userId);
  const analysis = {
    analysisId,
    userId,
    totalEvents: userEvents.length,
    eventTypes: [...new Set(userEvents.map(e => e.eventType))],
    firstEvent: userEvents.length > 0 ? userEvents[0].timestamp : null,
    lastEvent: userEvents.length > 0 ? userEvents[userEvents.length - 1].timestamp : null,
    averageEventsPerDay: userEvents.length / 30, // Simplified
    metadata: {
      service: 'analytics-python',
      sharedUtilities: ['uuid', 'validator'],
      note: 'This service would be written in Python, using the same TS utilities',
    },
  };

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { analysis },
  };
}

/**
 * Get aggregated statistics
 *
 * In Python, this would use:
 * - query_string_module.parse() for parsing query parameters
 * - ms_module() for parsing time periods
 * - uuid_module.v4() for generating report IDs
 */
export async function getStats(ctx: RequestContext, query: Record<string, any>): Promise<Response> {
  console.log(`[AnalyticsService][Python] Getting stats:`, query);

  const period = query.period || '7d';

  // Python would use: report_id = uuid_module.v4()
  const reportId = uuidv4();

  // Simulate stats computation
  const stats = {
    reportId,
    period,
    totalEvents: events.length,
    uniqueUsers: new Set(events.map(e => e.userId)).size,
    eventsByType: getEventsByType(),
    topUsers: getTopUsers(5),
    generatedAt: new Date().toISOString(),
    metadata: {
      service: 'analytics-python',
      sharedUtilities: ['uuid', 'query-string', 'ms'],
      note: 'Python service using TypeScript utilities via Elide',
    },
  };

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { stats },
  };
}

/**
 * Track analytics event
 *
 * In Python, this would use:
 * - uuid_module.v4() for generating event IDs
 * - validator_module.isUUID() for validating user IDs
 * - validator_module.isJSON() for validating metadata
 */
export async function trackEvent(
  ctx: RequestContext,
  data: { userId: string; eventType: string; metadata?: Record<string, any> }
): Promise<Response> {
  console.log(`[AnalyticsService][Python] Tracking event:`, data);

  // Validate user ID using shared utility
  // Python: if not validator_module.isUUID(data['userId']):
  if (!isUUID(data.userId)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid user ID format',
      },
    };
  }

  if (!data.eventType) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Event type is required',
      },
    };
  }

  // Create event with UUID from shared utility
  // Python: event_id = uuid_module.v4()
  const event: AnalyticsEvent = {
    id: uuidv4(),
    userId: data.userId,
    eventType: data.eventType,
    timestamp: new Date().toISOString(),
    metadata: data.metadata || {},
  };

  events.push(event);

  // Update user stats
  const stats = userStats.get(data.userId) || { totalEvents: 0, eventTypes: [] };
  stats.totalEvents++;
  if (!stats.eventTypes.includes(data.eventType)) {
    stats.eventTypes.push(data.eventType);
  }
  userStats.set(data.userId, stats);

  return {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
    body: {
      event,
      message: 'Event tracked successfully',
      polyglotNote: 'This Python service uses the same UUID generator as all other services',
    },
  };
}

/**
 * Helper: Get events grouped by type
 */
function getEventsByType(): Record<string, number> {
  const byType: Record<string, number> = {};
  for (const event of events) {
    byType[event.eventType] = (byType[event.eventType] || 0) + 1;
  }
  return byType;
}

/**
 * Helper: Get top users by event count
 */
function getTopUsers(limit: number): Array<{ userId: string; eventCount: number }> {
  const userCounts = new Map<string, number>();

  for (const event of events) {
    userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
  }

  return Array.from(userCounts.entries())
    .map(([userId, eventCount]) => ({ userId, eventCount }))
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, limit);
}
