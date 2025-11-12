/**
 * Event Handler - Advanced Event Processing
 *
 * Sophisticated event handling with:
 * - Event aggregation and deduplication
 * - Event severity levels
 * - Event filtering and querying
 * - Event persistence and rotation
 * - Metrics integration
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface KubernetesEvent {
  id: string;
  type: EventType;
  severity: EventSeverity;
  reason: string;
  message: string;
  involvedObject: ObjectReference;
  source: EventSource;
  firstTimestamp: string;
  lastTimestamp: string;
  count: number;
  metadata?: Record<string, unknown>;
}

export enum EventType {
  Normal = "Normal",
  Warning = "Warning",
  Error = "Error",
}

export enum EventSeverity {
  Info = "Info",
  Warning = "Warning",
  Error = "Error",
  Critical = "Critical",
}

export interface ObjectReference {
  apiVersion: string;
  kind: string;
  namespace: string;
  name: string;
  uid?: string;
  resourceVersion?: string;
}

export interface EventSource {
  component: string;
  host?: string;
}

export interface WatchEvent {
  type: "ADDED" | "MODIFIED" | "DELETED" | "ERROR";
  object: any;
  timestamp: string;
}

export interface EventQuery {
  namespace?: string;
  name?: string;
  kind?: string;
  type?: EventType;
  severity?: EventSeverity;
  since?: string;
  limit?: number;
}

// ============================================================================
// Event Handler
// ============================================================================

export class EventHandler {
  private events: KubernetesEvent[] = [];
  private eventMap = new Map<string, KubernetesEvent>();
  private maxEvents = 10000;
  private aggregationWindow = 60000; // 1 minute
  private eventCallbacks = new Set<EventCallback>();

  /**
   * Record a new event or aggregate with existing
   */
  record(event: Omit<KubernetesEvent, "id" | "firstTimestamp" | "lastTimestamp" | "count">): void {
    const eventKey = this.getEventKey(event);
    const existing = this.eventMap.get(eventKey);

    if (existing && this.shouldAggregate(existing)) {
      // Aggregate with existing event
      existing.count++;
      existing.lastTimestamp = new Date().toISOString();
      existing.metadata = { ...existing.metadata, ...event.metadata };

      console.log(
        `[EVENT] Aggregated ${event.severity}/${event.type}: ${event.reason} ` +
        `(${event.involvedObject.namespace}/${event.involvedObject.name}) count=${existing.count}`
      );
    } else {
      // Create new event
      const newEvent: KubernetesEvent = {
        id: this.generateEventId(),
        firstTimestamp: new Date().toISOString(),
        lastTimestamp: new Date().toISOString(),
        count: 1,
        ...event,
      };

      this.events.push(newEvent);
      this.eventMap.set(eventKey, newEvent);

      console.log(
        `[EVENT] Recorded ${event.severity}/${event.type}: ${event.reason} ` +
        `(${event.involvedObject.namespace}/${event.involvedObject.name})`
      );

      // Rotate events if needed
      this.rotateEvents();
    }

    // Notify callbacks
    const event_with_id = this.eventMap.get(eventKey)!;
    this.notifyCallbacks(event_with_id);
  }

  /**
   * Record a watch event
   */
  recordWatchEvent(watchEvent: WatchEvent): void {
    const obj = watchEvent.object;
    const severity = this.inferSeverity(watchEvent);
    const reason = this.inferReason(watchEvent);

    this.record({
      type: this.mapWatchEventType(watchEvent.type),
      severity,
      reason,
      message: this.generateMessage(watchEvent),
      involvedObject: {
        apiVersion: obj.apiVersion || "unknown",
        kind: obj.kind || "unknown",
        namespace: obj.metadata?.namespace || "default",
        name: obj.metadata?.name || "unknown",
        uid: obj.metadata?.uid,
        resourceVersion: obj.metadata?.resourceVersion,
      },
      source: {
        component: "controller",
      },
      metadata: {
        watchEventType: watchEvent.type,
      },
    });
  }

  /**
   * Query events with filters
   */
  query(query: EventQuery = {}): KubernetesEvent[] {
    let results = [...this.events];

    // Filter by namespace
    if (query.namespace) {
      results = results.filter(e => e.involvedObject.namespace === query.namespace);
    }

    // Filter by name
    if (query.name) {
      results = results.filter(e => e.involvedObject.name === query.name);
    }

    // Filter by kind
    if (query.kind) {
      results = results.filter(e => e.involvedObject.kind === query.kind);
    }

    // Filter by type
    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }

    // Filter by severity
    if (query.severity) {
      results = results.filter(e => e.severity === query.severity);
    }

    // Filter by time
    if (query.since) {
      const sinceTime = new Date(query.since).getTime();
      results = results.filter(e => new Date(e.firstTimestamp).getTime() >= sinceTime);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) =>
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get event by ID
   */
  getById(id: string): KubernetesEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  /**
   * Get recent events
   */
  getRecent(limit = 100): KubernetesEvent[] {
    return this.query({ limit });
  }

  /**
   * Get events for a specific resource
   */
  getForResource(namespace: string, name: string, kind?: string): KubernetesEvent[] {
    return this.query({ namespace, name, kind });
  }

  /**
   * Get error events
   */
  getErrors(limit = 100): KubernetesEvent[] {
    return this.query({ type: EventType.Error, limit });
  }

  /**
   * Get warning events
   */
  getWarnings(limit = 100): KubernetesEvent[] {
    return this.query({ type: EventType.Warning, limit });
  }

  /**
   * Register event callback
   */
  onEvent(callback: EventCallback): void {
    this.eventCallbacks.add(callback);
  }

  /**
   * Unregister event callback
   */
  offEvent(callback: EventCallback): void {
    this.eventCallbacks.delete(callback);
  }

  /**
   * Get event statistics
   */
  getStats(): EventStats {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const recentEvents = this.events.filter(
      e => new Date(e.lastTimestamp).getTime() > oneHourAgo
    );

    return {
      total: this.events.length,
      lastHour: recentEvents.length,
      byType: {
        normal: this.events.filter(e => e.type === EventType.Normal).length,
        warning: this.events.filter(e => e.type === EventType.Warning).length,
        error: this.events.filter(e => e.type === EventType.Error).length,
      },
      bySeverity: {
        info: this.events.filter(e => e.severity === EventSeverity.Info).length,
        warning: this.events.filter(e => e.severity === EventSeverity.Warning).length,
        error: this.events.filter(e => e.severity === EventSeverity.Error).length,
        critical: this.events.filter(e => e.severity === EventSeverity.Critical).length,
      },
      aggregated: this.events.filter(e => e.count > 1).length,
    };
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
    this.eventMap.clear();
    console.log("[EVENT] Cleared all events");
  }

  /**
   * Should aggregate event with existing
   */
  private shouldAggregate(existing: KubernetesEvent): boolean {
    const lastTime = new Date(existing.lastTimestamp).getTime();
    const now = Date.now();
    return now - lastTime < this.aggregationWindow;
  }

  /**
   * Rotate events when limit exceeded
   */
  private rotateEvents(): void {
    if (this.events.length > this.maxEvents) {
      const toRemove = this.events.length - this.maxEvents;
      const removed = this.events.splice(0, toRemove);

      // Remove from map
      for (const event of removed) {
        const key = this.getEventKey(event);
        this.eventMap.delete(key);
      }

      console.log(`[EVENT] Rotated ${toRemove} old events`);
    }
  }

  /**
   * Generate unique event key for aggregation
   */
  private getEventKey(event: Partial<KubernetesEvent>): string {
    return [
      event.involvedObject?.namespace,
      event.involvedObject?.name,
      event.involvedObject?.kind,
      event.reason,
      event.type,
    ].join("/");
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Map watch event type to Kubernetes event type
   */
  private mapWatchEventType(type: string): EventType {
    switch (type) {
      case "ERROR":
        return EventType.Error;
      case "DELETED":
        return EventType.Warning;
      default:
        return EventType.Normal;
    }
  }

  /**
   * Infer event severity from watch event
   */
  private inferSeverity(watchEvent: WatchEvent): EventSeverity {
    switch (watchEvent.type) {
      case "ERROR":
        return EventSeverity.Error;
      case "DELETED":
        return EventSeverity.Warning;
      case "MODIFIED":
        // Check if resource is in failed state
        if (watchEvent.object.status?.phase === "Failed") {
          return EventSeverity.Error;
        }
        return EventSeverity.Info;
      default:
        return EventSeverity.Info;
    }
  }

  /**
   * Infer event reason from watch event
   */
  private inferReason(watchEvent: WatchEvent): string {
    const reasonMap: Record<string, string> = {
      ADDED: "Created",
      MODIFIED: "Updated",
      DELETED: "Deleted",
      ERROR: "Error",
    };
    return reasonMap[watchEvent.type] || watchEvent.type;
  }

  /**
   * Generate event message
   */
  private generateMessage(watchEvent: WatchEvent): string {
    const obj = watchEvent.object;
    const kind = obj.kind || "Resource";
    const name = obj.metadata?.name || "unknown";

    switch (watchEvent.type) {
      case "ADDED":
        return `${kind} ${name} has been created`;
      case "MODIFIED":
        return `${kind} ${name} has been updated`;
      case "DELETED":
        return `${kind} ${name} has been deleted`;
      case "ERROR":
        return `Error occurred for ${kind} ${name}`;
      default:
        return `${watchEvent.type} event for ${kind} ${name}`;
    }
  }

  /**
   * Notify callbacks of new event
   */
  private notifyCallbacks(event: KubernetesEvent): void {
    for (const callback of this.eventCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error("[EVENT] Callback error:", error);
      }
    }
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

export type EventCallback = (event: KubernetesEvent) => void;

export interface EventStats {
  total: number;
  lastHour: number;
  byType: {
    normal: number;
    warning: number;
    error: number;
  };
  bySeverity: {
    info: number;
    warning: number;
    error: number;
    critical: number;
  };
  aggregated: number;
}

// ============================================================================
// Event Recorder Helper
// ============================================================================

export class EventRecorder {
  constructor(
    private eventHandler: EventHandler,
    private component: string
  ) {}

  /**
   * Record normal event
   */
  recordNormal(
    obj: ObjectReference,
    reason: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    this.eventHandler.record({
      type: EventType.Normal,
      severity: EventSeverity.Info,
      reason,
      message,
      involvedObject: obj,
      source: { component: this.component },
      metadata,
    });
  }

  /**
   * Record warning event
   */
  recordWarning(
    obj: ObjectReference,
    reason: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    this.eventHandler.record({
      type: EventType.Warning,
      severity: EventSeverity.Warning,
      reason,
      message,
      involvedObject: obj,
      source: { component: this.component },
      metadata,
    });
  }

  /**
   * Record error event
   */
  recordError(
    obj: ObjectReference,
    reason: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    this.eventHandler.record({
      type: EventType.Error,
      severity: EventSeverity.Error,
      reason,
      message,
      involvedObject: obj,
      source: { component: this.component },
      metadata,
    });
  }
}
