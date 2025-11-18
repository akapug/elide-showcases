import type { Logger } from 'pino';

interface Stats {
  totalRecommendations: number;
  totalInteractions: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  cacheHitRate: number;
  clickThroughRate: number;
  conversionRate: number;
}

export class AnalyticsTracker {
  private recommendations: number = 0;
  private interactions: number = 0;
  private clicks: number = 0;
  private conversions: number = 0;
  private cacheHits: number = 0;
  private latencies: number[] = [];

  constructor(private logger: Logger) {}

  trackRecommendation(data: {
    userId: string;
    algorithm: string;
    count: number;
    latencyMs: number;
    cacheHit?: boolean;
  }): void {
    this.recommendations++;
    this.latencies.push(data.latencyMs);

    if (data.cacheHit) {
      this.cacheHits++;
    }

    // Keep only last 10000 latencies
    if (this.latencies.length > 10000) {
      this.latencies.shift();
    }
  }

  trackInteraction(data: any): void {
    this.interactions++;

    if (data.interactionType === 'click') {
      this.clicks++;
    } else if (data.interactionType === 'purchase') {
      this.conversions++;
    }
  }

  getStats(): Stats {
    const avgLatency = this.latencies.length > 0
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
      : 0;

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95Latency = sorted.length > 0 ? sorted[p95Index] || 0 : 0;

    return {
      totalRecommendations: this.recommendations,
      totalInteractions: this.interactions,
      avgLatencyMs: Math.round(avgLatency * 100) / 100,
      p95LatencyMs: Math.round(p95Latency * 100) / 100,
      cacheHitRate: this.recommendations > 0
        ? Math.round((this.cacheHits / this.recommendations) * 100) / 100
        : 0,
      clickThroughRate: this.recommendations > 0
        ? Math.round((this.clicks / this.recommendations) * 100) / 100
        : 0,
      conversionRate: this.clicks > 0
        ? Math.round((this.conversions / this.clicks) * 100) / 100
        : 0
    };
  }
}
