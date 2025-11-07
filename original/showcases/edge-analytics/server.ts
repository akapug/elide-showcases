/**
 * Edge Analytics Service
 *
 * Production-grade real-time analytics at the edge with event collection,
 * aggregation, session tracking, anomaly detection, and dashboard API.
 */

import { serve } from "http";

// Types and Interfaces
interface AnalyticsEvent {
  id: string;
  type: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  properties: Record<string, any>;
  geo?: GeoData;
  device?: DeviceInfo;
}

interface GeoData {
  country: string;
  region: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface DeviceInfo {
  type: "desktop" | "mobile" | "tablet" | "bot";
  os: string;
  browser: string;
  screenWidth?: number;
  screenHeight?: number;
}

interface Session {
  id: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  events: AnalyticsEvent[];
  pageViews: number;
  duration: number;
  referrer?: string;
  landingPage: string;
}

interface AggregatedMetrics {
  totalEvents: number;
  uniqueSessions: number;
  uniqueUsers: number;
  eventsByType: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  geoBreakdown: Record<string, number>;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number }>;
}

interface Anomaly {
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: number;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
}

// Event Collector
class EventCollector {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 100000;

  collect(event: Omit<AnalyticsEvent, "id" | "timestamp">): AnalyticsEvent {
    const fullEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      ...event
    };

    this.events.push(fullEvent);

    // Prevent memory overflow
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    return fullEvent;
  }

  getEvents(filters?: {
    type?: string;
    sessionId?: string;
    userId?: string;
    startTime?: number;
    endTime?: number;
  }): AnalyticsEvent[] {
    let filtered = this.events;

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(e => e.type === filters.type);
      }
      if (filters.sessionId) {
        filtered = filtered.filter(e => e.sessionId === filters.sessionId);
      }
      if (filters.userId) {
        filtered = filtered.filter(e => e.userId === filters.userId);
      }
      if (filters.startTime) {
        filtered = filtered.filter(e => e.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        filtered = filtered.filter(e => e.timestamp <= filters.endTime!);
      }
    }

    return filtered;
  }

  getEventCount(): number {
    return this.events.length;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Session Tracker
class SessionTracker {
  private sessions: Map<string, Session> = new Map();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  createOrUpdateSession(
    sessionId: string,
    event: AnalyticsEvent,
    referrer?: string,
    landingPage?: string
  ): Session {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        id: sessionId,
        userId: event.userId,
        startTime: event.timestamp,
        lastActivity: event.timestamp,
        events: [],
        pageViews: 0,
        duration: 0,
        referrer,
        landingPage: landingPage || event.properties.page || "/"
      };
      this.sessions.set(sessionId, session);
    }

    // Update session
    session.lastActivity = event.timestamp;
    session.events.push(event);
    session.duration = event.timestamp - session.startTime;

    if (event.type === "pageview") {
      session.pageViews++;
    }

    if (event.userId && !session.userId) {
      session.userId = event.userId;
    }

    return session;
  }

  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        this.sessions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  getActiveSessions(): Session[] {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(
      s => now - s.lastActivity <= this.sessionTimeout
    );
  }
}

// Real-time Aggregator
class RealTimeAggregator {
  private eventCollector: EventCollector;
  private sessionTracker: SessionTracker;

  constructor(eventCollector: EventCollector, sessionTracker: SessionTracker) {
    this.eventCollector = eventCollector;
    this.sessionTracker = sessionTracker;
  }

  aggregateMetrics(timeWindow?: { start: number; end: number }): AggregatedMetrics {
    const events = this.eventCollector.getEvents(timeWindow);
    const sessions = this.sessionTracker.getAllSessions();

    // Event counts by type
    const eventsByType: Record<string, number> = {};
    for (const event of events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    }

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    for (const event of events) {
      if (event.device?.type) {
        deviceBreakdown[event.device.type] = (deviceBreakdown[event.device.type] || 0) + 1;
      }
    }

    // Geographic breakdown
    const geoBreakdown: Record<string, number> = {};
    for (const event of events) {
      if (event.geo?.country) {
        geoBreakdown[event.geo.country] = (geoBreakdown[event.geo.country] || 0) + 1;
      }
    }

    // Top pages
    const pageViews: Record<string, number> = {};
    for (const event of events) {
      if (event.type === "pageview" && event.properties.page) {
        pageViews[event.properties.page] = (pageViews[event.properties.page] || 0) + 1;
      }
    }

    const topPages = Object.entries(pageViews)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Average session duration
    const validSessions = sessions.filter(s => s.duration > 0);
    const avgSessionDuration = validSessions.length > 0
      ? validSessions.reduce((sum, s) => sum + s.duration, 0) / validSessions.length
      : 0;

    // Bounce rate (sessions with only 1 page view)
    const bouncedSessions = sessions.filter(s => s.pageViews <= 1).length;
    const bounceRate = sessions.length > 0 ? (bouncedSessions / sessions.length) * 100 : 0;

    // Unique users
    const uniqueUserIds = new Set(events.filter(e => e.userId).map(e => e.userId));
    const uniqueSessionIds = new Set(events.map(e => e.sessionId));

    return {
      totalEvents: events.length,
      uniqueSessions: uniqueSessionIds.size,
      uniqueUsers: uniqueUserIds.size,
      eventsByType,
      deviceBreakdown,
      geoBreakdown,
      averageSessionDuration: Math.round(avgSessionDuration),
      bounceRate: Math.round(bounceRate * 100) / 100,
      topPages
    };
  }

  getTimeSeriesData(metric: string, interval: number = 60000): Array<{ timestamp: number; value: number }> {
    const events = this.eventCollector.getEvents();
    const dataPoints: Record<number, number> = {};

    for (const event of events) {
      const bucket = Math.floor(event.timestamp / interval) * interval;

      if (!dataPoints[bucket]) {
        dataPoints[bucket] = 0;
      }

      if (metric === "events") {
        dataPoints[bucket]++;
      } else if (metric === event.type) {
        dataPoints[bucket]++;
      }
    }

    return Object.entries(dataPoints)
      .map(([timestamp, value]) => ({
        timestamp: parseInt(timestamp),
        value
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  getFunnelAnalysis(steps: string[]): Array<{ step: string; count: number; dropoff: number }> {
    const sessions = this.sessionTracker.getAllSessions();
    const funnel: Array<{ step: string; count: number; dropoff: number }> = [];

    let previousCount = sessions.length;

    for (const step of steps) {
      const sessionsWithStep = sessions.filter(s =>
        s.events.some(e => e.type === step || e.properties.page === step)
      );

      const count = sessionsWithStep.length;
      const dropoff = previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0;

      funnel.push({
        step,
        count,
        dropoff: Math.round(dropoff * 100) / 100
      });

      previousCount = count;
    }

    return funnel;
  }
}

// Anomaly Detector
class AnomalyDetector {
  private historicalData: Map<string, number[]> = new Map();
  private detectionWindow = 60; // Look at last 60 data points

  recordMetric(metric: string, value: number): void {
    if (!this.historicalData.has(metric)) {
      this.historicalData.set(metric, []);
    }

    const history = this.historicalData.get(metric)!;
    history.push(value);

    // Keep only recent data
    if (history.length > this.detectionWindow) {
      history.shift();
    }
  }

  detectAnomalies(currentMetrics: Record<string, number>): Anomaly[] {
    const anomalies: Anomaly[] = [];

    for (const [metric, currentValue] of Object.entries(currentMetrics)) {
      const history = this.historicalData.get(metric);

      if (!history || history.length < 10) {
        // Not enough data for detection
        continue;
      }

      const { mean, stdDev } = this.calculateStats(history);
      const deviation = Math.abs((currentValue - mean) / stdDev);

      // Z-score based anomaly detection
      if (deviation > 3) {
        anomalies.push({
          type: "statistical_anomaly",
          severity: deviation > 5 ? "high" : deviation > 4 ? "medium" : "low",
          description: `Unusual ${metric} value detected`,
          timestamp: Date.now(),
          metric,
          currentValue,
          expectedValue: mean,
          deviation
        });
      }
    }

    return anomalies;
  }

  detectSpikeAnomaly(metric: string, currentValue: number, threshold: number = 2): Anomaly | null {
    const history = this.historicalData.get(metric);

    if (!history || history.length < 5) {
      return null;
    }

    const recentAvg = history.slice(-5).reduce((sum, v) => sum + v, 0) / 5;

    if (currentValue > recentAvg * threshold) {
      return {
        type: "spike_anomaly",
        severity: currentValue > recentAvg * 3 ? "high" : "medium",
        description: `Spike in ${metric} detected`,
        timestamp: Date.now(),
        metric,
        currentValue,
        expectedValue: recentAvg,
        deviation: currentValue / recentAvg
      };
    }

    return null;
  }

  private calculateStats(values: number[]): { mean: number; stdDev: number } {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }
}

// Device & Geo Detection
class RequestAnalyzer {
  detectDevice(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase();

    let type: DeviceInfo["type"] = "desktop";
    if (/(bot|crawler|spider)/i.test(userAgent)) {
      type = "bot";
    } else if (/(mobile|android|iphone|ipad|ipod)/i.test(ua)) {
      type = /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
    }

    const os = this.detectOS(ua);
    const browser = this.detectBrowser(ua);

    return { type, os, browser };
  }

  detectGeo(request: Request): GeoData {
    return {
      country: request.headers.get("CF-IPCountry") || "XX",
      region: request.headers.get("CF-Region") || "Unknown",
      city: request.headers.get("CF-City") || undefined,
      latitude: undefined,
      longitude: undefined
    };
  }

  private detectOS(ua: string): string {
    if (ua.includes("windows")) return "Windows";
    if (ua.includes("mac")) return "macOS";
    if (ua.includes("linux")) return "Linux";
    if (ua.includes("android")) return "Android";
    if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) return "iOS";
    return "Unknown";
  }

  private detectBrowser(ua: string): string {
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("chrome")) return "Chrome";
    if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
    if (ua.includes("edge")) return "Edge";
    if (ua.includes("opera")) return "Opera";
    return "Unknown";
  }
}

// Main Edge Analytics Service
class EdgeAnalyticsService {
  private eventCollector: EventCollector;
  private sessionTracker: SessionTracker;
  private aggregator: RealTimeAggregator;
  private anomalyDetector: AnomalyDetector;
  private requestAnalyzer: RequestAnalyzer;

  constructor() {
    this.eventCollector = new EventCollector();
    this.sessionTracker = new SessionTracker();
    this.aggregator = new RealTimeAggregator(this.eventCollector, this.sessionTracker);
    this.anomalyDetector = new AnomalyDetector();
    this.requestAnalyzer = new RequestAnalyzer();

    // Periodic cleanup
    setInterval(() => {
      const cleaned = this.sessionTracker.cleanupExpiredSessions();
      console.log(`Cleaned up ${cleaned} expired sessions`);
    }, 300000); // Every 5 minutes

    // Periodic anomaly detection
    setInterval(() => {
      const metrics = this.aggregator.aggregateMetrics();
      this.anomalyDetector.recordMetric("totalEvents", metrics.totalEvents);
      this.anomalyDetector.recordMetric("uniqueSessions", metrics.uniqueSessions);

      const anomalies = this.anomalyDetector.detectAnomalies({
        totalEvents: metrics.totalEvents,
        uniqueSessions: metrics.uniqueSessions
      });

      if (anomalies.length > 0) {
        console.log("Anomalies detected:", anomalies);
      }
    }, 60000); // Every minute
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Set CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Event collection endpoint
    if (path === "/collect" && request.method === "POST") {
      return this.handleCollect(request, corsHeaders);
    }

    // Dashboard API endpoints
    if (path === "/api/metrics") {
      return this.handleMetrics(request, corsHeaders);
    }

    if (path === "/api/sessions") {
      return this.handleSessions(request, corsHeaders);
    }

    if (path === "/api/events") {
      return this.handleEvents(request, corsHeaders);
    }

    if (path === "/api/timeseries") {
      return this.handleTimeSeries(request, corsHeaders);
    }

    if (path === "/api/funnel") {
      return this.handleFunnel(request, corsHeaders);
    }

    if (path === "/api/anomalies") {
      return this.handleAnomalies(request, corsHeaders);
    }

    if (path === "/api/realtime") {
      return this.handleRealtime(request, corsHeaders);
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }

  private async handleCollect(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json() as {
        type: string;
        sessionId: string;
        userId?: string;
        properties?: Record<string, any>;
      };

      const userAgent = request.headers.get("User-Agent") || "";
      const device = this.requestAnalyzer.detectDevice(userAgent);
      const geo = this.requestAnalyzer.detectGeo(request);

      const event = this.eventCollector.collect({
        type: body.type,
        sessionId: body.sessionId,
        userId: body.userId,
        properties: body.properties || {},
        geo,
        device
      });

      // Update session
      this.sessionTracker.createOrUpdateSession(
        body.sessionId,
        event,
        body.properties?.referrer,
        body.properties?.page
      );

      return new Response(JSON.stringify({ success: true, eventId: event.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  private handleMetrics(request: Request, corsHeaders: Record<string, string>): Response {
    const url = new URL(request.url);
    const startTime = url.searchParams.get("start");
    const endTime = url.searchParams.get("end");

    const timeWindow = startTime && endTime ? {
      start: parseInt(startTime),
      end: parseInt(endTime)
    } : undefined;

    const metrics = this.aggregator.aggregateMetrics(timeWindow);

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  private handleSessions(request: Request, corsHeaders: Record<string, string>): Response {
    const sessions = this.sessionTracker.getActiveSessions();

    const sessionsData = sessions.map(s => ({
      id: s.id,
      userId: s.userId,
      startTime: s.startTime,
      duration: s.duration,
      pageViews: s.pageViews,
      eventCount: s.events.length,
      landingPage: s.landingPage,
      referrer: s.referrer
    }));

    return new Response(JSON.stringify(sessionsData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  private handleEvents(request: Request, corsHeaders: Record<string, string>): Response {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || undefined;
    const sessionId = url.searchParams.get("sessionId") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "100");

    const events = this.eventCollector.getEvents({ type, sessionId }).slice(-limit);

    return new Response(JSON.stringify(events), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  private handleTimeSeries(request: Request, corsHeaders: Record<string, string>): Response {
    const url = new URL(request.url);
    const metric = url.searchParams.get("metric") || "events";
    const interval = parseInt(url.searchParams.get("interval") || "60000");

    const timeSeries = this.aggregator.getTimeSeriesData(metric, interval);

    return new Response(JSON.stringify(timeSeries), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  private handleFunnel(request: Request, corsHeaders: Record<string, string>): Response {
    const url = new URL(request.url);
    const stepsParam = url.searchParams.get("steps");

    if (!stepsParam) {
      return new Response(JSON.stringify({ error: "Missing steps parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const steps = stepsParam.split(",");
    const funnel = this.aggregator.getFunnelAnalysis(steps);

    return new Response(JSON.stringify(funnel), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  private handleAnomalies(request: Request, corsHeaders: Record<string, string>): Response {
    const metrics = this.aggregator.aggregateMetrics();

    const anomalies = this.anomalyDetector.detectAnomalies({
      totalEvents: metrics.totalEvents,
      uniqueSessions: metrics.uniqueSessions
    });

    return new Response(JSON.stringify(anomalies), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  private handleRealtime(request: Request, corsHeaders: Record<string, string>): Response {
    const activeSessions = this.sessionTracker.getActiveSessions();
    const recentEvents = this.eventCollector.getEvents().slice(-100);

    const realtime = {
      activeSessions: activeSessions.length,
      activeUsers: new Set(activeSessions.map(s => s.userId).filter(Boolean)).size,
      eventsLastMinute: recentEvents.filter(e => Date.now() - e.timestamp < 60000).length,
      topActivePages: this.getTopActivePages(activeSessions)
    };

    return new Response(JSON.stringify(realtime), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  private getTopActivePages(sessions: Session[]): Array<{ page: string; count: number }> {
    const pageCounts: Record<string, number> = {};

    for (const session of sessions) {
      const lastPageView = session.events
        .filter(e => e.type === "pageview")
        .pop();

      if (lastPageView?.properties.page) {
        const page = lastPageView.properties.page;
        pageCounts[page] = (pageCounts[page] || 0) + 1;
      }
    }

    return Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

// Start the server
const analytics = new EdgeAnalyticsService();

serve((request: Request) => {
  return analytics.handleRequest(request);
}, { port: 8084 });

console.log("Edge Analytics Service running on http://localhost:8084");
