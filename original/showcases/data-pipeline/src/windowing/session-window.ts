/**
 * Session Window Processor
 *
 * Dynamic session-based windowing with:
 * - Gap-based session detection
 * - Session merging
 * - Custom session key extraction
 * - Session timeout handling
 * - Multi-user session tracking
 * - Session aggregation
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SessionConfig {
  gap: number; // Inactivity gap in milliseconds
  maxDuration?: number; // Maximum session duration
  minDuration?: number; // Minimum session duration
  keyExtractor?: (event: any) => string; // Extract session key from event
  allowedLateness?: number;
}

export interface Session {
  sessionId: string;
  sessionKey: string;
  startTime: number;
  endTime: number;
  lastEventTime: number;
  duration: number;
}

export interface SessionState<T> {
  session: Session;
  events: T[];
  eventCount: number;
  active: boolean;
  metadata: Record<string, any>;
}

export interface SessionResult<T = any> {
  session: Session;
  events: T[];
  count: number;
  aggregates?: Record<string, any>;
  reason: 'gap' | 'max-duration' | 'manual' | 'watermark';
}

export type SessionAggregator<T, R> = (events: T[], session: Session) => R;

// ============================================================================
// Session Window Processor
// ============================================================================

export class SessionWindowProcessor<T = any> extends EventEmitter {
  private config: SessionConfig;
  private sessions: Map<string, SessionState<T>> = new Map();
  private aggregator?: SessionAggregator<T, any>;
  private currentWatermark: number = 0;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: SessionConfig) {
    super();
    this.config = {
      keyExtractor: (event: any) => event.userId || 'default',
      ...config
    };
    this.startCleanupTimer();
  }

  // ==========================================================================
  // Event Processing
  // ==========================================================================

  public process(event: T, eventTime: number = Date.now()): void {
    const sessionKey = this.config.keyExtractor!(event);
    const existingSession = this.findActiveSession(sessionKey, eventTime);

    if (existingSession) {
      this.addEventToSession(existingSession, event, eventTime);
    } else {
      this.createNewSession(sessionKey, event, eventTime);
    }

    // Update watermark
    this.updateWatermark(eventTime);

    // Check for expired sessions
    this.checkExpiredSessions();
  }

  public processBatch(events: Array<{ event: T; eventTime: number }>): void {
    // Sort events by time to maintain order
    const sorted = [...events].sort((a, b) => a.eventTime - b.eventTime);

    for (const { event, eventTime } of sorted) {
      this.process(event, eventTime);
    }
  }

  private findActiveSession(sessionKey: string, eventTime: number): SessionState<T> | null {
    for (const [sessionId, state] of this.sessions.entries()) {
      if (!state.active) continue;
      if (state.session.sessionKey !== sessionKey) continue;

      // Check if within gap
      const timeSinceLastEvent = eventTime - state.session.lastEventTime;
      if (timeSinceLastEvent <= this.config.gap) {
        return state;
      }

      // Check if max duration would be exceeded
      if (this.config.maxDuration) {
        const potentialDuration = eventTime - state.session.startTime;
        if (potentialDuration > this.config.maxDuration) {
          // Close this session and return null to create new one
          this.closeSession(sessionId, state, 'max-duration');
          return null;
        }
      }

      // Gap exceeded - close session
      this.closeSession(sessionId, state, 'gap');
    }

    return null;
  }

  private createNewSession(sessionKey: string, event: T, eventTime: number): void {
    const sessionId = this.generateSessionId(sessionKey, eventTime);
    const session: Session = {
      sessionId,
      sessionKey,
      startTime: eventTime,
      endTime: eventTime,
      lastEventTime: eventTime,
      duration: 0
    };

    const state: SessionState<T> = {
      session,
      events: [event],
      eventCount: 1,
      active: true,
      metadata: {}
    };

    this.sessions.set(sessionId, state);
    this.emit('session:created', session);
  }

  private addEventToSession(state: SessionState<T>, event: T, eventTime: number): void {
    state.events.push(event);
    state.eventCount++;
    state.session.lastEventTime = eventTime;
    state.session.endTime = eventTime;
    state.session.duration = eventTime - state.session.startTime;

    this.emit('event:added', {
      session: state.session,
      event,
      eventTime
    });

    // Check if max duration reached
    if (this.config.maxDuration && state.session.duration >= this.config.maxDuration) {
      this.closeSession(state.session.sessionId, state, 'max-duration');
    }
  }

  // ==========================================================================
  // Session Management
  // ==========================================================================

  private closeSession(
    sessionId: string,
    state: SessionState<T>,
    reason: SessionResult['reason']
  ): void {
    // Check minimum duration
    if (this.config.minDuration && state.session.duration < this.config.minDuration) {
      // Don't emit result for too-short sessions
      this.sessions.delete(sessionId);
      this.emit('session:discarded', state.session);
      return;
    }

    state.active = false;

    const result: SessionResult<T> = {
      session: state.session,
      events: [...state.events],
      count: state.eventCount,
      reason
    };

    // Apply aggregation
    if (this.aggregator) {
      result.aggregates = this.aggregator(state.events, state.session);
    }

    this.emit('session:closed', result);
    this.emit('session:result', result);

    // Remove from active sessions
    this.sessions.delete(sessionId);
  }

  public manuallyCloseSession(sessionKey: string): boolean {
    for (const [sessionId, state] of this.sessions.entries()) {
      if (state.session.sessionKey === sessionKey && state.active) {
        this.closeSession(sessionId, state, 'manual');
        return true;
      }
    }
    return false;
  }

  private checkExpiredSessions(): void {
    const now = Date.now();
    const sessionsToClose: Array<[string, SessionState<T>]> = [];

    for (const [sessionId, state] of this.sessions.entries()) {
      if (!state.active) continue;

      const timeSinceLastEvent = now - state.session.lastEventTime;

      // Close if gap exceeded
      if (timeSinceLastEvent > this.config.gap) {
        sessionsToClose.push([sessionId, state]);
        continue;
      }

      // Close if max duration exceeded
      if (this.config.maxDuration && state.session.duration >= this.config.maxDuration) {
        sessionsToClose.push([sessionId, state]);
      }
    }

    for (const [sessionId, state] of sessionsToClose) {
      const reason = state.session.duration >= (this.config.maxDuration || Infinity)
        ? 'max-duration'
        : 'gap';
      this.closeSession(sessionId, state, reason);
    }
  }

  // ==========================================================================
  // Watermark Management
  // ==========================================================================

  private updateWatermark(eventTime: number): void {
    if (eventTime > this.currentWatermark) {
      this.currentWatermark = eventTime;
      this.emit('watermark:updated', eventTime);

      // Close sessions that are complete based on watermark
      this.closeSessionsByWatermark();
    }
  }

  private closeSessionsByWatermark(): void {
    const allowedLateness = this.config.allowedLateness || 0;
    const sessionsToClose: Array<[string, SessionState<T>]> = [];

    for (const [sessionId, state] of this.sessions.entries()) {
      if (!state.active) continue;

      // Close if watermark has passed the session end + allowed lateness
      const sessionEnd = state.session.lastEventTime + this.config.gap;
      if (this.currentWatermark > sessionEnd + allowedLateness) {
        sessionsToClose.push([sessionId, state]);
      }
    }

    for (const [sessionId, state] of sessionsToClose) {
      this.closeSession(sessionId, state, 'watermark');
    }
  }

  // ==========================================================================
  // Session Merging
  // ==========================================================================

  public mergeSessions(sessionId1: string, sessionId2: string): boolean {
    const state1 = this.sessions.get(sessionId1);
    const state2 = this.sessions.get(sessionId2);

    if (!state1 || !state2) return false;
    if (!state1.active || !state2.active) return false;
    if (state1.session.sessionKey !== state2.session.sessionKey) return false;

    // Merge into earlier session
    const [earlier, later] = state1.session.startTime < state2.session.startTime
      ? [state1, state2]
      : [state2, state1];

    // Merge events
    earlier.events.push(...later.events);
    earlier.eventCount += later.eventCount;

    // Update session times
    earlier.session.endTime = Math.max(earlier.session.endTime, later.session.endTime);
    earlier.session.lastEventTime = Math.max(
      earlier.session.lastEventTime,
      later.session.lastEventTime
    );
    earlier.session.duration = earlier.session.endTime - earlier.session.startTime;

    // Sort events by time if they have timestamp
    if (earlier.events[0] && 'timestamp' in earlier.events[0]) {
      earlier.events.sort((a: any, b: any) => a.timestamp - b.timestamp);
    }

    // Remove later session
    this.sessions.delete(later.session.sessionId);

    this.emit('session:merged', {
      fromSession: later.session,
      toSession: earlier.session,
      mergedSession: earlier.session
    });

    return true;
  }

  // ==========================================================================
  // Aggregation
  // ==========================================================================

  public setAggregator<R>(aggregator: SessionAggregator<T, R>): void {
    this.aggregator = aggregator;
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.checkExpiredSessions();
    }, Math.min(this.config.gap / 2, 5000));
  }

  public stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Close all active sessions
    for (const [sessionId, state] of this.sessions.entries()) {
      if (state.active) {
        this.closeSession(sessionId, state, 'manual');
      }
    }

    this.sessions.clear();
    this.emit('stopped');
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateSessionId(sessionKey: string, timestamp: number): string {
    return `session-${sessionKey}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  public getActiveSessions(): Session[] {
    return Array.from(this.sessions.values())
      .filter(state => state.active)
      .map(state => state.session);
  }

  public getSessionState(sessionId: string): SessionState<T> | undefined {
    return this.sessions.get(sessionId);
  }

  public getSessionsByKey(sessionKey: string): Session[] {
    return Array.from(this.sessions.values())
      .filter(state => state.session.sessionKey === sessionKey)
      .map(state => state.session);
  }

  public getActiveSessionCount(): number {
    return Array.from(this.sessions.values()).filter(state => state.active).length;
  }

  public getTotalEventCount(): number {
    return Array.from(this.sessions.values()).reduce(
      (sum, state) => sum + state.eventCount,
      0
    );
  }

  public getSessionMetrics(): {
    activeSessionCount: number;
    totalEventCount: number;
    avgSessionDuration: number;
    avgEventsPerSession: number;
  } {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.active);

    if (activeSessions.length === 0) {
      return {
        activeSessionCount: 0,
        totalEventCount: 0,
        avgSessionDuration: 0,
        avgEventsPerSession: 0
      };
    }

    const totalDuration = activeSessions.reduce(
      (sum, s) => sum + s.session.duration,
      0
    );

    const totalEvents = activeSessions.reduce(
      (sum, s) => sum + s.eventCount,
      0
    );

    return {
      activeSessionCount: activeSessions.length,
      totalEventCount: totalEvents,
      avgSessionDuration: totalDuration / activeSessions.length,
      avgEventsPerSession: totalEvents / activeSessions.length
    };
  }
}

// ============================================================================
// Common Session Aggregators
// ============================================================================

export class SessionAggregators {
  public static count<T>(): SessionAggregator<T, { count: number }> {
    return (events: T[]) => ({ count: events.length });
  }

  public static duration(): SessionAggregator<any, { duration: number }> {
    return (events: any[], session: Session) => ({
      duration: session.duration
    });
  }

  public static eventRate<T>(): SessionAggregator<T, { eventsPerSecond: number }> {
    return (events: T[], session: Session) => {
      const durationInSeconds = session.duration / 1000;
      return {
        eventsPerSecond: durationInSeconds > 0
          ? events.length / durationInSeconds
          : 0
      };
    };
  }

  public static sum<T>(field: keyof T): SessionAggregator<T, { sum: number }> {
    return (events: T[]) => {
      const sum = events.reduce((acc, event) => {
        const value = event[field];
        return acc + (typeof value === 'number' ? value : 0);
      }, 0);
      return { sum };
    };
  }

  public static custom<T, R>(
    aggregateFn: (events: T[], session: Session) => R
  ): SessionAggregator<T, R> {
    return aggregateFn;
  }
}

// ============================================================================
// Export utilities
// ============================================================================

export function createSessionWindow<T>(
  gap: number,
  options?: Partial<SessionConfig>
): SessionWindowProcessor<T> {
  const config: SessionConfig = {
    gap,
    ...options
  };
  return new SessionWindowProcessor<T>(config);
}

export function createUserSessionWindow<T>(
  gap: number,
  userIdField: keyof T,
  options?: Partial<SessionConfig>
): SessionWindowProcessor<T> {
  const config: SessionConfig = {
    gap,
    keyExtractor: (event: any) => String(event[userIdField]),
    ...options
  };
  return new SessionWindowProcessor<T>(config);
}
