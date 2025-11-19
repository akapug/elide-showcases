/**
 * Time-Based Windowing
 *
 * Stream windowing operations with:
 * - Tumbling windows (fixed size, no overlap)
 * - Sliding windows (fixed size with overlap)
 * - Hopping windows (fixed size with hop interval)
 * - Watermark handling
 * - Late arrival handling
 * - Window aggregations
 * - Trigger policies
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface WindowConfig {
  size: number; // Window size in milliseconds
  slide?: number; // Slide interval for sliding windows
  allowedLateness?: number; // Maximum lateness for events
  watermarkInterval?: number; // Watermark update interval
}

export interface TimeWindow {
  start: number;
  end: number;
  windowId: string;
}

export interface WindowedEvent<T = any> {
  event: T;
  timestamp: number;
  eventTime: number;
  window: TimeWindow;
  isLate: boolean;
}

export interface WindowResult<T = any> {
  window: TimeWindow;
  events: T[];
  count: number;
  aggregates?: Record<string, any>;
  watermark: number;
}

export type WindowAggregator<T, R> = (events: T[]) => R;

export type TriggerPolicy = 'event-time' | 'processing-time' | 'count' | 'custom';

export interface Trigger {
  policy: TriggerPolicy;
  condition?: (window: WindowState<any>) => boolean;
  interval?: number;
  count?: number;
}

// ============================================================================
// Window State
// ============================================================================

export class WindowState<T> {
  public window: TimeWindow;
  public events: T[] = [];
  public eventCount: number = 0;
  public watermark: number = 0;
  public firstEventTime: number = 0;
  public lastEventTime: number = 0;
  public metadata: Record<string, any> = {};

  constructor(window: TimeWindow) {
    this.window = window;
  }

  public addEvent(event: T, eventTime: number): void {
    this.events.push(event);
    this.eventCount++;

    if (this.firstEventTime === 0) {
      this.firstEventTime = eventTime;
    }
    this.lastEventTime = eventTime;
  }

  public updateWatermark(watermark: number): void {
    this.watermark = watermark;
  }

  public isComplete(watermark: number, allowedLateness: number): boolean {
    return watermark >= this.window.end + allowedLateness;
  }

  public shouldTrigger(trigger: Trigger): boolean {
    switch (trigger.policy) {
      case 'event-time':
        return this.watermark >= this.window.end;
      case 'processing-time':
        return Date.now() >= this.window.end;
      case 'count':
        return trigger.count ? this.eventCount >= trigger.count : false;
      case 'custom':
        return trigger.condition ? trigger.condition(this) : false;
      default:
        return false;
    }
  }
}

// ============================================================================
// Time Window Processor
// ============================================================================

export class TimeWindowProcessor<T = any> extends EventEmitter {
  private config: WindowConfig;
  private windows: Map<string, WindowState<T>> = new Map();
  private currentWatermark: number = 0;
  private aggregator?: WindowAggregator<T, any>;
  private trigger: Trigger;

  private watermarkTimer?: NodeJS.Timeout;
  private processingTimer?: NodeJS.Timeout;

  constructor(config: WindowConfig, trigger?: Trigger) {
    super();
    this.config = config;
    this.trigger = trigger || { policy: 'event-time' };

    this.startWatermarkTimer();
  }

  // ==========================================================================
  // Event Processing
  // ==========================================================================

  public process(event: T, eventTime: number = Date.now()): void {
    // Determine which windows this event belongs to
    const windows = this.assignWindows(eventTime);

    for (const window of windows) {
      this.addEventToWindow(event, eventTime, window);
    }

    // Update watermark
    this.updateWatermark(eventTime);

    // Check for windows to trigger
    this.checkTriggers();
  }

  public processBatch(events: Array<{ event: T; eventTime: number }>): void {
    for (const { event, eventTime } of events) {
      this.process(event, eventTime);
    }
  }

  private addEventToWindow(event: T, eventTime: number, window: TimeWindow): void {
    let windowState = this.windows.get(window.windowId);

    if (!windowState) {
      windowState = new WindowState<T>(window);
      this.windows.set(window.windowId, windowState);
      this.emit('window:created', window);
    }

    // Check if event is late
    const isLate = eventTime < this.currentWatermark - (this.config.allowedLateness || 0);

    if (isLate) {
      const allowedLateness = this.config.allowedLateness || 0;
      if (eventTime < this.currentWatermark - allowedLateness) {
        this.emit('event:dropped', {
          event,
          eventTime,
          window,
          watermark: this.currentWatermark
        });
        return;
      }

      this.emit('event:late', {
        event,
        eventTime,
        window,
        lateness: this.currentWatermark - eventTime
      });
    }

    windowState.addEvent(event, eventTime);
    this.emit('event:added', {
      event,
      eventTime,
      window,
      isLate
    });
  }

  // ==========================================================================
  // Window Assignment
  // ==========================================================================

  protected assignWindows(eventTime: number): TimeWindow[] {
    // Base implementation for tumbling windows
    const windowStart = this.getWindowStart(eventTime);
    const windowEnd = windowStart + this.config.size;

    return [{
      start: windowStart,
      end: windowEnd,
      windowId: this.generateWindowId(windowStart, windowEnd)
    }];
  }

  protected getWindowStart(timestamp: number): number {
    return Math.floor(timestamp / this.config.size) * this.config.size;
  }

  protected generateWindowId(start: number, end: number): string {
    return `window-${start}-${end}`;
  }

  // ==========================================================================
  // Watermark Management
  // ==========================================================================

  private updateWatermark(eventTime: number): void {
    const newWatermark = eventTime;

    if (newWatermark > this.currentWatermark) {
      this.currentWatermark = newWatermark;
      this.emit('watermark:updated', newWatermark);

      // Update all window states
      for (const windowState of this.windows.values()) {
        windowState.updateWatermark(newWatermark);
      }
    }
  }

  private startWatermarkTimer(): void {
    const interval = this.config.watermarkInterval || 1000;

    this.watermarkTimer = setInterval(() => {
      this.emit('watermark:tick', this.currentWatermark);
      this.checkTriggers();
      this.cleanupCompletedWindows();
    }, interval);
  }

  public getCurrentWatermark(): number {
    return this.currentWatermark;
  }

  // ==========================================================================
  // Trigger Management
  // ==========================================================================

  private checkTriggers(): void {
    for (const [windowId, windowState] of this.windows.entries()) {
      if (windowState.shouldTrigger(this.trigger)) {
        this.triggerWindow(windowId, windowState);
      }
    }
  }

  private triggerWindow(windowId: string, windowState: WindowState<T>): void {
    const result: WindowResult<T> = {
      window: windowState.window,
      events: [...windowState.events],
      count: windowState.eventCount,
      watermark: this.currentWatermark
    };

    // Apply aggregation if configured
    if (this.aggregator) {
      result.aggregates = this.aggregator(windowState.events);
    }

    this.emit('window:triggered', result);
    this.emit('window:result', result);

    // Mark window as triggered
    windowState.metadata.triggered = true;
    windowState.metadata.triggerTime = Date.now();
  }

  // ==========================================================================
  // Aggregation
  // ==========================================================================

  public setAggregator<R>(aggregator: WindowAggregator<T, R>): void {
    this.aggregator = aggregator;
  }

  // ==========================================================================
  // Window Cleanup
  // ==========================================================================

  private cleanupCompletedWindows(): void {
    const allowedLateness = this.config.allowedLateness || 0;
    const windowsToRemove: string[] = [];

    for (const [windowId, windowState] of this.windows.entries()) {
      if (windowState.isComplete(this.currentWatermark, allowedLateness)) {
        // Trigger window one final time if not already triggered
        if (!windowState.metadata.triggered) {
          this.triggerWindow(windowId, windowState);
        }

        windowsToRemove.push(windowId);
      }
    }

    // Remove completed windows
    for (const windowId of windowsToRemove) {
      const windowState = this.windows.get(windowId)!;
      this.emit('window:closed', windowState.window);
      this.windows.delete(windowId);
    }
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  public stop(): void {
    if (this.watermarkTimer) {
      clearInterval(this.watermarkTimer);
    }
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }

    // Flush all windows
    for (const [windowId, windowState] of this.windows.entries()) {
      this.triggerWindow(windowId, windowState);
    }

    this.windows.clear();
    this.emit('stopped');
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  public getActiveWindows(): TimeWindow[] {
    return Array.from(this.windows.values()).map(state => state.window);
  }

  public getWindowState(windowId: string): WindowState<T> | undefined {
    return this.windows.get(windowId);
  }

  public getWindowCount(): number {
    return this.windows.size;
  }

  public getTotalEventCount(): number {
    return Array.from(this.windows.values()).reduce(
      (sum, state) => sum + state.eventCount,
      0
    );
  }
}

// ============================================================================
// Sliding Window Processor
// ============================================================================

export class SlidingWindowProcessor<T = any> extends TimeWindowProcessor<T> {
  protected assignWindows(eventTime: number): TimeWindow[] {
    const windows: TimeWindow[] = [];
    const slide = this.config.slide || this.config.size;

    // Calculate the first window that includes this event
    const firstWindowStart = Math.floor((eventTime - this.config.size + slide) / slide) * slide;

    // Generate all windows that include this event
    for (
      let windowStart = firstWindowStart;
      windowStart <= eventTime;
      windowStart += slide
    ) {
      const windowEnd = windowStart + this.config.size;

      if (eventTime >= windowStart && eventTime < windowEnd) {
        windows.push({
          start: windowStart,
          end: windowEnd,
          windowId: this.generateWindowId(windowStart, windowEnd)
        });
      }
    }

    return windows;
  }
}

// ============================================================================
// Hopping Window Processor
// ============================================================================

export class HoppingWindowProcessor<T = any> extends TimeWindowProcessor<T> {
  private hopInterval: number;

  constructor(config: WindowConfig, hopInterval: number, trigger?: Trigger) {
    super(config, trigger);
    this.hopInterval = hopInterval;
  }

  protected assignWindows(eventTime: number): TimeWindow[] {
    const windows: TimeWindow[] = [];

    // Calculate window alignment
    const alignedTime = Math.floor(eventTime / this.hopInterval) * this.hopInterval;

    // Go back to find all windows that could contain this event
    for (
      let windowStart = alignedTime - this.config.size;
      windowStart <= eventTime;
      windowStart += this.hopInterval
    ) {
      const windowEnd = windowStart + this.config.size;

      if (eventTime >= windowStart && eventTime < windowEnd) {
        windows.push({
          start: windowStart,
          end: windowEnd,
          windowId: this.generateWindowId(windowStart, windowEnd)
        });
      }
    }

    return windows;
  }
}

// ============================================================================
// Common Aggregators
// ============================================================================

export class WindowAggregators {
  public static count<T>(): WindowAggregator<T, { count: number }> {
    return (events: T[]) => ({ count: events.length });
  }

  public static sum<T>(field: keyof T): WindowAggregator<T, { sum: number }> {
    return (events: T[]) => {
      const sum = events.reduce((acc, event) => {
        const value = event[field];
        return acc + (typeof value === 'number' ? value : 0);
      }, 0);
      return { sum };
    };
  }

  public static average<T>(field: keyof T): WindowAggregator<T, { avg: number }> {
    return (events: T[]) => {
      const sum = events.reduce((acc, event) => {
        const value = event[field];
        return acc + (typeof value === 'number' ? value : 0);
      }, 0);
      return { avg: events.length > 0 ? sum / events.length : 0 };
    };
  }

  public static minMax<T>(field: keyof T): WindowAggregator<T, { min: number; max: number }> {
    return (events: T[]) => {
      if (events.length === 0) {
        return { min: 0, max: 0 };
      }

      const values = events
        .map(e => e[field])
        .filter(v => typeof v === 'number') as number[];

      return {
        min: Math.min(...values),
        max: Math.max(...values)
      };
    };
  }

  public static custom<T, R>(
    aggregateFn: (events: T[]) => R
  ): WindowAggregator<T, R> {
    return aggregateFn;
  }
}

// ============================================================================
// Export utilities
// ============================================================================

export function createTumblingWindow<T>(
  windowSize: number,
  options?: Partial<WindowConfig>,
  trigger?: Trigger
): TimeWindowProcessor<T> {
  const config: WindowConfig = {
    size: windowSize,
    ...options
  };
  return new TimeWindowProcessor<T>(config, trigger);
}

export function createSlidingWindow<T>(
  windowSize: number,
  slideInterval: number,
  options?: Partial<WindowConfig>,
  trigger?: Trigger
): SlidingWindowProcessor<T> {
  const config: WindowConfig = {
    size: windowSize,
    slide: slideInterval,
    ...options
  };
  return new SlidingWindowProcessor<T>(config, trigger);
}

export function createHoppingWindow<T>(
  windowSize: number,
  hopInterval: number,
  options?: Partial<WindowConfig>,
  trigger?: Trigger
): HoppingWindowProcessor<T> {
  const config: WindowConfig = {
    size: windowSize,
    ...options
  };
  return new HoppingWindowProcessor<T>(config, hopInterval, trigger);
}
