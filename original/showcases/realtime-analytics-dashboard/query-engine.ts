/**
 * Analytics Query Engine
 *
 * Powerful query builder and execution engine for analytics data.
 * Supports funnel analysis, cohort analysis, A/B testing, and segmentation.
 */

import type { AnalyticsEvent, DataAggregator } from './data-aggregator.ts';

export interface QueryDefinition {
  id?: string;
  name: string;
  type: 'simple' | 'funnel' | 'cohort' | 'abtest' | 'segment';
  config: any;
}

export interface FunnelStep {
  name: string;
  eventType: string;
  filters?: Record<string, any>;
}

export interface FunnelResult {
  steps: Array<{
    name: string;
    count: number;
    conversionRate: number;
    dropoffRate: number;
  }>;
  totalEntered: number;
  totalCompleted: number;
  overallConversionRate: number;
}

export interface CohortDefinition {
  name: string;
  entryEvent: string;
  entryFilters?: Record<string, any>;
  retentionEvent: string;
  retentionFilters?: Record<string, any>;
  periods: number;
  periodLength: number; // in milliseconds
}

export interface CohortResult {
  cohorts: Array<{
    cohortDate: number;
    cohortSize: number;
    retention: number[];
  }>;
  averageRetention: number[];
}

export interface ABTestDefinition {
  name: string;
  eventType: string;
  variantProperty: string;
  metricEvent: string;
  metricProperty: string;
  minimumSampleSize?: number;
}

export interface ABTestResult {
  variants: Array<{
    name: string;
    users: number;
    conversions: number;
    conversionRate: number;
    averageValue?: number;
    confidence?: number;
  }>;
  winner?: string;
  significant: boolean;
}

export interface SegmentDefinition {
  name: string;
  filters: SegmentFilter[];
  operator: 'AND' | 'OR';
}

export interface SegmentFilter {
  property: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'exists';
  value?: any;
}

export interface SegmentResult {
  name: string;
  userCount: number;
  eventCount: number;
  properties: Record<string, any>;
}

export class QueryEngine {
  private aggregator: DataAggregator;
  private queryCache = new Map<string, { result: any; timestamp: number }>();
  private cacheTimeout = 30000; // 30 seconds

  constructor(aggregator: DataAggregator) {
    this.aggregator = aggregator;
    this.startCacheCleanup();
  }

  // Execute query
  async execute(query: QueryDefinition): Promise<any> {
    // Check cache
    const cacheKey = this.getCacheKey(query);
    const cached = this.queryCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    // Execute based on type
    let result: any;

    switch (query.type) {
      case 'funnel':
        result = await this.executeFunnel(query.config);
        break;
      case 'cohort':
        result = await this.executeCohort(query.config);
        break;
      case 'abtest':
        result = await this.executeABTest(query.config);
        break;
      case 'segment':
        result = await this.executeSegment(query.config);
        break;
      default:
        throw new Error(`Unknown query type: ${query.type}`);
    }

    // Cache result
    this.queryCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  }

  // Execute funnel analysis
  private async executeFunnel(config: {
    steps: FunnelStep[];
    startTime: number;
    endTime: number;
    timeLimit?: number;
  }): Promise<FunnelResult> {
    const { steps, startTime, endTime, timeLimit = 86400000 } = config; // Default 24h

    // Get all events in time range
    const events = this.aggregator.query({ startTime, endTime });

    // Track users through funnel
    const userJourneys = new Map<string, AnalyticsEvent[]>();

    for (const event of events) {
      if (!event.userId) continue;

      if (!userJourneys.has(event.userId)) {
        userJourneys.set(event.userId, []);
      }
      userJourneys.get(event.userId)!.push(event);
    }

    // Analyze each user's journey
    const stepCounts: number[] = new Array(steps.length).fill(0);

    for (const [userId, journey] of userJourneys.entries()) {
      journey.sort((a, b) => a.timestamp - b.timestamp);

      let currentStep = 0;
      let stepStartTime = 0;

      for (const event of journey) {
        if (currentStep >= steps.length) break;

        const step = steps[currentStep];

        // Check if event matches step
        if (event.type === step.eventType) {
          // Check filters
          if (step.filters) {
            const matches = Object.entries(step.filters).every(
              ([key, value]) => event.properties[key] === value
            );
            if (!matches) continue;
          }

          // Check time limit
          if (currentStep > 0 && timeLimit) {
            if (event.timestamp - stepStartTime > timeLimit) {
              break;
            }
          }

          stepCounts[currentStep]++;
          currentStep++;
          stepStartTime = event.timestamp;
        }
      }
    }

    // Calculate results
    const totalEntered = stepCounts[0] || 0;
    const totalCompleted = stepCounts[stepCounts.length - 1] || 0;

    const results: FunnelResult = {
      steps: steps.map((step, i) => {
        const count = stepCounts[i] || 0;
        const prevCount = i > 0 ? stepCounts[i - 1] : totalEntered;
        const conversionRate = prevCount > 0 ? (count / prevCount) * 100 : 0;
        const dropoffRate = 100 - conversionRate;

        return {
          name: step.name,
          count,
          conversionRate,
          dropoffRate
        };
      }),
      totalEntered,
      totalCompleted,
      overallConversionRate: totalEntered > 0 ? (totalCompleted / totalEntered) * 100 : 0
    };

    return results;
  }

  // Execute cohort analysis
  private async executeCohort(config: CohortDefinition): Promise<CohortResult> {
    const { entryEvent, retentionEvent, periods, periodLength } = config;

    // Get all entry events
    const entryEvents = this.aggregator.query({ type: entryEvent });

    // Group users by cohort (entry date)
    const cohorts = new Map<number, Set<string>>();

    for (const event of entryEvents) {
      if (!event.userId) continue;

      const cohortDate = Math.floor(event.timestamp / periodLength) * periodLength;

      if (!cohorts.has(cohortDate)) {
        cohorts.set(cohortDate, new Set());
      }
      cohorts.get(cohortDate)!.add(event.userId);
    }

    // Calculate retention for each cohort
    const results: CohortResult = {
      cohorts: [],
      averageRetention: new Array(periods).fill(0)
    };

    for (const [cohortDate, users] of cohorts.entries()) {
      const retention: number[] = [];

      for (let period = 0; period < periods; period++) {
        const periodStart = cohortDate + period * periodLength;
        const periodEnd = periodStart + periodLength;

        // Count users who returned in this period
        const returnedUsers = new Set<string>();

        const periodEvents = this.aggregator.query({
          type: retentionEvent,
          startTime: periodStart,
          endTime: periodEnd
        });

        for (const event of periodEvents) {
          if (event.userId && users.has(event.userId)) {
            returnedUsers.add(event.userId);
          }
        }

        const retentionRate = users.size > 0 ? (returnedUsers.size / users.size) * 100 : 0;
        retention.push(retentionRate);
        results.averageRetention[period] += retentionRate;
      }

      results.cohorts.push({
        cohortDate,
        cohortSize: users.size,
        retention
      });
    }

    // Calculate averages
    if (results.cohorts.length > 0) {
      results.averageRetention = results.averageRetention.map(
        sum => sum / results.cohorts.length
      );
    }

    return results;
  }

  // Execute A/B test analysis
  private async executeABTest(config: ABTestDefinition): Promise<ABTestResult> {
    const { eventType, variantProperty, metricEvent, metricProperty, minimumSampleSize = 100 } = config;

    // Get all variant assignment events
    const assignmentEvents = this.aggregator.query({ type: eventType });

    // Group users by variant
    const variants = new Map<string, Set<string>>();

    for (const event of assignmentEvents) {
      if (!event.userId) continue;

      const variant = event.properties[variantProperty];
      if (!variant) continue;

      if (!variants.has(variant)) {
        variants.set(variant, new Set());
      }
      variants.get(variant)!.add(event.userId);
    }

    // Calculate metrics for each variant
    const variantResults: ABTestResult['variants'] = [];

    for (const [variantName, users] of variants.entries()) {
      const metricEvents = this.aggregator.query({ type: metricEvent });

      let conversions = 0;
      let totalValue = 0;

      for (const event of metricEvents) {
        if (event.userId && users.has(event.userId)) {
          conversions++;

          if (metricProperty && metricProperty in event.properties) {
            totalValue += event.properties[metricProperty];
          }
        }
      }

      const conversionRate = users.size > 0 ? (conversions / users.size) * 100 : 0;
      const averageValue = conversions > 0 ? totalValue / conversions : 0;

      variantResults.push({
        name: variantName,
        users: users.size,
        conversions,
        conversionRate,
        averageValue
      });
    }

    // Determine winner and significance
    variantResults.sort((a, b) => b.conversionRate - a.conversionRate);

    const hasSufficientData = variantResults.every(v => v.users >= minimumSampleSize);
    const significant = hasSufficientData && variantResults.length >= 2 &&
      variantResults[0].conversionRate > variantResults[1].conversionRate * 1.1;

    return {
      variants: variantResults,
      winner: significant ? variantResults[0].name : undefined,
      significant
    };
  }

  // Execute segment query
  private async executeSegment(config: SegmentDefinition): Promise<SegmentResult> {
    const { name, filters, operator } = config;

    // Get all events
    const events = this.aggregator.query({});

    // Find matching users
    const matchingUsers = new Set<string>();
    let eventCount = 0;

    for (const event of events) {
      if (!event.userId) continue;

      const matches = this.evaluateFilters(event, filters, operator);

      if (matches) {
        matchingUsers.add(event.userId);
        eventCount++;
      }
    }

    return {
      name,
      userCount: matchingUsers.size,
      eventCount,
      properties: {}
    };
  }

  // Evaluate filters
  private evaluateFilters(
    event: AnalyticsEvent,
    filters: SegmentFilter[],
    operator: 'AND' | 'OR'
  ): boolean {
    const results = filters.map(filter => this.evaluateFilter(event, filter));

    return operator === 'AND'
      ? results.every(r => r)
      : results.some(r => r);
  }

  // Evaluate single filter
  private evaluateFilter(event: AnalyticsEvent, filter: SegmentFilter): boolean {
    const value = event.properties[filter.property];

    switch (filter.operator) {
      case 'eq':
        return value === filter.value;
      case 'ne':
        return value !== filter.value;
      case 'gt':
        return value > filter.value;
      case 'lt':
        return value < filter.value;
      case 'gte':
        return value >= filter.value;
      case 'lte':
        return value <= filter.value;
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);
      case 'contains':
        return typeof value === 'string' && value.includes(filter.value);
      case 'exists':
        return value !== undefined && value !== null;
      default:
        return false;
    }
  }

  // Generate cache key
  private getCacheKey(query: QueryDefinition): string {
    return JSON.stringify(query);
  }

  // Clean up old cache entries
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();

      for (const [key, cached] of this.queryCache.entries()) {
        if (now - cached.timestamp > this.cacheTimeout) {
          this.queryCache.delete(key);
        }
      }
    }, 60000); // Every minute
  }

  // Clear cache
  clearCache(): void {
    this.queryCache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      entries: this.queryCache.size,
      timeout: this.cacheTimeout
    };
  }
}
