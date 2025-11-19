/**
 * Billing Tracker - Token Usage and Cost Tracking
 *
 * Tracks token usage, calculates costs, manages billing cycles,
 * and provides detailed usage analytics per API key/user.
 */

export interface UsageRecord {
  id: string;
  apiKey: string;
  userId?: string;
  modelId: string;
  timestamp: Date;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  requestId: string;
  cached: boolean;
  metadata?: Record<string, any>;
}

export interface BillingPeriod {
  apiKey: string;
  startDate: Date;
  endDate: Date;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  costByModel: Record<string, number>;
  tokensByModel: Record<string, number>;
  requestsByModel: Record<string, number>;
}

export interface BillingLimit {
  apiKey: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  hardLimit?: number;
  alertThreshold?: number; // Percentage (0-100)
  notificationEmail?: string;
}

export interface CostBreakdown {
  inputTokenCost: number;
  outputTokenCost: number;
  cacheCost: number;
  totalCost: number;
  savings: number; // From caching
}

export class BillingTracker {
  private usageRecords: UsageRecord[] = [];
  private billingLimits: Map<string, BillingLimit> = new Map();
  private currentUsage: Map<string, { daily: number; monthly: number }> = new Map();
  private modelPricing: Map<
    string,
    { inputCost: number; outputCost: number }
  > = new Map();
  private cacheDiscountRate: number = 0.5; // 50% discount for cached tokens

  constructor() {
    this.initializeModelPricing();
    this.startBillingCycleReset();
  }

  /**
   * Initialize model pricing
   */
  private initializeModelPricing(): void {
    // Pricing per token (in dollars)
    this.modelPricing.set("gpt-4-turbo", {
      inputCost: 0.00001,
      outputCost: 0.00003,
    });
    this.modelPricing.set("gpt-3.5-turbo", {
      inputCost: 0.000001,
      outputCost: 0.000002,
    });
    this.modelPricing.set("claude-3-opus", {
      inputCost: 0.000015,
      outputCost: 0.000075,
    });
    this.modelPricing.set("claude-3-sonnet", {
      inputCost: 0.000003,
      outputCost: 0.000015,
    });
    this.modelPricing.set("llama-3-70b", {
      inputCost: 0.0000006,
      outputCost: 0.0000006,
    });
    this.modelPricing.set("llama-3-8b", {
      inputCost: 0.00000015,
      outputCost: 0.00000015,
    });
    this.modelPricing.set("mistral-large", {
      inputCost: 0.000004,
      outputCost: 0.000012,
    });
  }

  /**
   * Record usage for a request
   */
  recordUsage(
    apiKey: string,
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    requestId: string,
    cached: boolean = false,
    userId?: string,
    metadata?: Record<string, any>
  ): UsageRecord {
    const pricing = this.modelPricing.get(modelId) || {
      inputCost: 0.000001,
      outputCost: 0.000001,
    };

    const cacheMultiplier = cached ? this.cacheDiscountRate : 1.0;

    const inputCost = inputTokens * pricing.inputCost * cacheMultiplier;
    const outputCost = outputTokens * pricing.outputCost;
    const totalCost = inputCost + outputCost;

    const record: UsageRecord = {
      id: this.generateRecordId(),
      apiKey,
      userId,
      modelId,
      timestamp: new Date(),
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost,
      requestId,
      cached,
      metadata,
    };

    this.usageRecords.push(record);
    this.updateCurrentUsage(apiKey, totalCost);

    return record;
  }

  /**
   * Update current usage tracking
   */
  private updateCurrentUsage(apiKey: string, cost: number): void {
    if (!this.currentUsage.has(apiKey)) {
      this.currentUsage.set(apiKey, { daily: 0, monthly: 0 });
    }

    const usage = this.currentUsage.get(apiKey)!;
    usage.daily += cost;
    usage.monthly += cost;
  }

  /**
   * Check if usage is within limits
   */
  checkLimits(apiKey: string): {
    allowed: boolean;
    reason?: string;
    currentUsage: { daily: number; monthly: number };
    limits?: BillingLimit;
  } {
    const limits = this.billingLimits.get(apiKey);
    const usage = this.currentUsage.get(apiKey) || { daily: 0, monthly: 0 };

    if (!limits) {
      return { allowed: true, currentUsage: usage };
    }

    // Check hard limit
    if (limits.hardLimit && usage.monthly >= limits.hardLimit) {
      return {
        allowed: false,
        reason: "Hard monthly limit exceeded",
        currentUsage: usage,
        limits,
      };
    }

    // Check daily limit
    if (limits.dailyLimit && usage.daily >= limits.dailyLimit) {
      return {
        allowed: false,
        reason: "Daily limit exceeded",
        currentUsage: usage,
        limits,
      };
    }

    // Check monthly limit
    if (limits.monthlyLimit && usage.monthly >= limits.monthlyLimit) {
      return {
        allowed: false,
        reason: "Monthly limit exceeded",
        currentUsage: usage,
        limits,
      };
    }

    // Check alert threshold
    if (limits.alertThreshold && limits.monthlyLimit) {
      const percentage = (usage.monthly / limits.monthlyLimit) * 100;
      if (percentage >= limits.alertThreshold) {
        console.warn(
          `API key ${apiKey} has reached ${percentage.toFixed(1)}% of monthly limit`
        );
      }
    }

    return { allowed: true, currentUsage: usage, limits };
  }

  /**
   * Set billing limits for an API key
   */
  setBillingLimit(apiKey: string, limits: Omit<BillingLimit, "apiKey">): void {
    this.billingLimits.set(apiKey, { apiKey, ...limits });
  }

  /**
   * Get billing period summary
   */
  getBillingPeriod(
    apiKey: string,
    startDate: Date,
    endDate: Date
  ): BillingPeriod {
    const records = this.usageRecords.filter(
      (r) =>
        r.apiKey === apiKey &&
        r.timestamp >= startDate &&
        r.timestamp <= endDate
    );

    const period: BillingPeriod = {
      apiKey,
      startDate,
      endDate,
      totalRequests: records.length,
      totalTokens: 0,
      totalCost: 0,
      costByModel: {},
      tokensByModel: {},
      requestsByModel: {},
    };

    for (const record of records) {
      period.totalTokens += record.totalTokens;
      period.totalCost += record.totalCost;

      // By model
      if (!period.costByModel[record.modelId]) {
        period.costByModel[record.modelId] = 0;
        period.tokensByModel[record.modelId] = 0;
        period.requestsByModel[record.modelId] = 0;
      }

      period.costByModel[record.modelId] += record.totalCost;
      period.tokensByModel[record.modelId] += record.totalTokens;
      period.requestsByModel[record.modelId]++;
    }

    return period;
  }

  /**
   * Get current month billing
   */
  getCurrentMonthBilling(apiKey: string): BillingPeriod {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.getBillingPeriod(apiKey, startOfMonth, endOfMonth);
  }

  /**
   * Get current day billing
   */
  getCurrentDayBilling(apiKey: string): BillingPeriod {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    return this.getBillingPeriod(apiKey, startOfDay, endOfDay);
  }

  /**
   * Get cost breakdown for a specific request
   */
  getCostBreakdown(recordId: string): CostBreakdown | null {
    const record = this.usageRecords.find((r) => r.id === recordId);
    if (!record) return null;

    const savings = record.cached
      ? record.inputTokens *
        (this.modelPricing.get(record.modelId)?.inputCost || 0) *
        (1 - this.cacheDiscountRate)
      : 0;

    return {
      inputTokenCost: record.inputCost,
      outputTokenCost: record.outputCost,
      cacheCost: record.cached ? record.inputCost : 0,
      totalCost: record.totalCost,
      savings,
    };
  }

  /**
   * Get usage records by API key
   */
  getUsageRecords(
    apiKey: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): UsageRecord[] {
    let records = this.usageRecords.filter((r) => r.apiKey === apiKey);

    if (startDate) {
      records = records.filter((r) => r.timestamp >= startDate);
    }

    if (endDate) {
      records = records.filter((r) => r.timestamp <= endDate);
    }

    return records.slice(-limit);
  }

  /**
   * Get analytics
   */
  getAnalytics(apiKey: string): {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    avgCostPerRequest: number;
    avgTokensPerRequest: number;
    cacheHitRate: number;
    topModels: Array<{ model: string; cost: number; requests: number }>;
  } {
    const records = this.usageRecords.filter((r) => r.apiKey === apiKey);

    if (records.length === 0) {
      return {
        totalCost: 0,
        totalTokens: 0,
        totalRequests: 0,
        avgCostPerRequest: 0,
        avgTokensPerRequest: 0,
        cacheHitRate: 0,
        topModels: [],
      };
    }

    const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);
    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const cachedRequests = records.filter((r) => r.cached).length;

    const modelStats = new Map<string, { cost: number; requests: number }>();
    for (const record of records) {
      if (!modelStats.has(record.modelId)) {
        modelStats.set(record.modelId, { cost: 0, requests: 0 });
      }
      const stats = modelStats.get(record.modelId)!;
      stats.cost += record.totalCost;
      stats.requests++;
    }

    const topModels = Array.from(modelStats.entries())
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    return {
      totalCost,
      totalTokens,
      totalRequests: records.length,
      avgCostPerRequest: totalCost / records.length,
      avgTokensPerRequest: totalTokens / records.length,
      cacheHitRate: (cachedRequests / records.length) * 100,
      topModels,
    };
  }

  /**
   * Export billing data (CSV format)
   */
  exportBillingData(apiKey: string, format: "csv" | "json" = "csv"): string {
    const records = this.usageRecords.filter((r) => r.apiKey === apiKey);

    if (format === "json") {
      return JSON.stringify(records, null, 2);
    }

    // CSV format
    const header =
      "Timestamp,Model,Input Tokens,Output Tokens,Total Tokens,Input Cost,Output Cost,Total Cost,Cached,Request ID\n";
    const rows = records
      .map(
        (r) =>
          `${r.timestamp.toISOString()},${r.modelId},${r.inputTokens},${r.outputTokens},${r.totalTokens},${r.inputCost.toFixed(6)},${r.outputCost.toFixed(6)},${r.totalCost.toFixed(6)},${r.cached},${r.requestId}`
      )
      .join("\n");

    return header + rows;
  }

  /**
   * Start billing cycle reset (daily/monthly)
   */
  private startBillingCycleReset(): void {
    // Reset daily usage at midnight
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.resetDailyUsage();
      // Then set daily interval
      setInterval(() => this.resetDailyUsage(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    // Reset monthly usage on first of month
    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const msUntilNextMonth = firstOfNextMonth.getTime() - now.getTime();

    setTimeout(() => {
      this.resetMonthlyUsage();
      // Then set monthly interval (approximately)
      setInterval(() => this.resetMonthlyUsage(), 30 * 24 * 60 * 60 * 1000);
    }, msUntilNextMonth);
  }

  /**
   * Reset daily usage counters
   */
  private resetDailyUsage(): void {
    console.log("Resetting daily usage counters");
    for (const usage of this.currentUsage.values()) {
      usage.daily = 0;
    }
  }

  /**
   * Reset monthly usage counters
   */
  private resetMonthlyUsage(): void {
    console.log("Resetting monthly usage counters");
    for (const usage of this.currentUsage.values()) {
      usage.monthly = 0;
    }
  }

  /**
   * Get model pricing
   */
  getModelPricing(modelId: string): { inputCost: number; outputCost: number } | null {
    return this.modelPricing.get(modelId) || null;
  }

  /**
   * Set custom model pricing
   */
  setModelPricing(
    modelId: string,
    inputCost: number,
    outputCost: number
  ): void {
    this.modelPricing.set(modelId, { inputCost, outputCost });
  }

  private generateRecordId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
