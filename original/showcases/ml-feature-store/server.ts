/**
 * ML Feature Store Service
 *
 * Production-ready feature store for ML systems with:
 * - Feature registration and versioning
 * - Real-time feature serving
 * - Historical feature queries
 * - Feature monitoring and drift detection
 * - Data quality checks
 */

import { serve } from "bun";
import { Database } from "bun:sqlite";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Feature {
  id: string;
  name: string;
  description: string;
  valueType: "string" | "number" | "boolean" | "array";
  entity: string; // user, product, etc.
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tags: string[];
  schema?: Record<string, unknown>;
}

interface FeatureValue {
  featureId: string;
  entityId: string;
  value: unknown;
  timestamp: Date;
  version: number;
}

interface FeatureGroup {
  id: string;
  name: string;
  features: string[];
  entity: string;
  description: string;
}

interface FeatureServingRequest {
  entityIds: string[];
  features: string[];
  timestamp?: Date;
}

interface FeatureServingResponse {
  entityId: string;
  features: Record<string, unknown>;
  timestamp: Date;
}

interface HistoricalQuery {
  entityIds: string[];
  features: string[];
  startTime: Date;
  endTime: Date;
  aggregation?: "latest" | "avg" | "sum" | "min" | "max";
}

interface FeatureStats {
  featureId: string;
  count: number;
  nullCount: number;
  uniqueValues: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  lastUpdated: Date;
}

interface DataQualityCheck {
  id: string;
  featureId: string;
  checkType: "null" | "range" | "uniqueness" | "freshness" | "schema";
  config: Record<string, unknown>;
  status: "passing" | "failing" | "warning";
  lastRun: Date;
}

// ============================================================================
// Feature Registry
// ============================================================================

class FeatureRegistry {
  private features: Map<string, Feature> = new Map();
  private featureGroups: Map<string, FeatureGroup> = new Map();

  registerFeature(feature: Omit<Feature, "id" | "createdAt" | "updatedAt">): Feature {
    const id = `${feature.entity}.${feature.name}.v${feature.version}`;
    const newFeature: Feature = {
      ...feature,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.features.set(id, newFeature);
    console.log(`Registered feature: ${id}`);

    return newFeature;
  }

  getFeature(featureId: string): Feature | null {
    return this.features.get(featureId) || null;
  }

  listFeatures(entity?: string, tags?: string[]): Feature[] {
    let features = Array.from(this.features.values());

    if (entity) {
      features = features.filter(f => f.entity === entity);
    }

    if (tags && tags.length > 0) {
      features = features.filter(f =>
        tags.some(tag => f.tags.includes(tag))
      );
    }

    return features;
  }

  registerFeatureGroup(group: Omit<FeatureGroup, "id">): FeatureGroup {
    const id = `${group.entity}.${group.name}`;
    const newGroup: FeatureGroup = { ...group, id };

    this.featureGroups.set(id, newGroup);
    console.log(`Registered feature group: ${id}`);

    return newGroup;
  }

  getFeatureGroup(groupId: string): FeatureGroup | null {
    return this.featureGroups.get(groupId) || null;
  }

  listFeatureGroups(): FeatureGroup[] {
    return Array.from(this.featureGroups.values());
  }

  updateFeature(featureId: string, updates: Partial<Feature>): Feature | null {
    const feature = this.features.get(featureId);
    if (!feature) return null;

    const updated = {
      ...feature,
      ...updates,
      updatedAt: new Date(),
    };

    this.features.set(featureId, updated);
    return updated;
  }
}

// ============================================================================
// Feature Store
// ============================================================================

class FeatureStore {
  private storage: Map<string, FeatureValue[]> = new Map();

  writeFeature(featureValue: FeatureValue): void {
    const key = `${featureValue.featureId}:${featureValue.entityId}`;

    if (!this.storage.has(key)) {
      this.storage.set(key, []);
    }

    const values = this.storage.get(key)!;
    values.push(featureValue);

    // Keep only last 1000 values per feature-entity pair
    if (values.length > 1000) {
      values.shift();
    }
  }

  writeBatch(values: FeatureValue[]): void {
    values.forEach(value => this.writeFeature(value));
  }

  getLatestFeature(featureId: string, entityId: string): FeatureValue | null {
    const key = `${featureId}:${entityId}`;
    const values = this.storage.get(key);

    if (!values || values.length === 0) return null;

    return values[values.length - 1];
  }

  getFeatureAtTime(
    featureId: string,
    entityId: string,
    timestamp: Date
  ): FeatureValue | null {
    const key = `${featureId}:${entityId}`;
    const values = this.storage.get(key);

    if (!values || values.length === 0) return null;

    // Find the latest value before or at the timestamp
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i].timestamp <= timestamp) {
        return values[i];
      }
    }

    return null;
  }

  getHistoricalFeatures(
    featureId: string,
    entityId: string,
    startTime: Date,
    endTime: Date
  ): FeatureValue[] {
    const key = `${featureId}:${entityId}`;
    const values = this.storage.get(key);

    if (!values) return [];

    return values.filter(
      v => v.timestamp >= startTime && v.timestamp <= endTime
    );
  }

  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }
}

// ============================================================================
// Feature Serving Engine
// ============================================================================

class FeatureServingEngine {
  constructor(
    private registry: FeatureRegistry,
    private store: FeatureStore
  ) {}

  async serve(request: FeatureServingRequest): Promise<FeatureServingResponse[]> {
    const timestamp = request.timestamp || new Date();
    const results: FeatureServingResponse[] = [];

    for (const entityId of request.entityIds) {
      const features: Record<string, unknown> = {};

      for (const featureName of request.features) {
        const value = this.store.getLatestFeature(featureName, entityId);
        features[featureName] = value ? value.value : null;
      }

      results.push({
        entityId,
        features,
        timestamp,
      });
    }

    return results;
  }

  async queryHistorical(query: HistoricalQuery): Promise<Record<string, unknown>[]> {
    const results: Record<string, unknown>[] = [];

    for (const entityId of query.entityIds) {
      const entityData: Record<string, unknown> = { entityId };

      for (const featureId of query.features) {
        const values = this.store.getHistoricalFeatures(
          featureId,
          entityId,
          query.startTime,
          query.endTime
        );

        if (values.length === 0) {
          entityData[featureId] = null;
          continue;
        }

        // Apply aggregation
        const aggregation = query.aggregation || "latest";
        entityData[featureId] = this.aggregate(
          values.map(v => v.value as number),
          aggregation
        );
      }

      results.push(entityData);
    }

    return results;
  }

  private aggregate(values: number[], method: string): number | null {
    if (values.length === 0) return null;

    switch (method) {
      case "latest":
        return values[values.length - 1];
      case "avg":
        return values.reduce((a, b) => a + b, 0) / values.length;
      case "sum":
        return values.reduce((a, b) => a + b, 0);
      case "min":
        return Math.min(...values);
      case "max":
        return Math.max(...values);
      default:
        return values[values.length - 1];
    }
  }
}

// ============================================================================
// Feature Monitoring
// ============================================================================

class FeatureMonitor {
  private stats: Map<string, FeatureStats> = new Map();
  private qualityChecks: Map<string, DataQualityCheck> = new Map();

  computeStats(featureId: string, values: FeatureValue[]): FeatureStats {
    const numericValues = values
      .map(v => v.value)
      .filter(v => typeof v === "number") as number[];

    const stats: FeatureStats = {
      featureId,
      count: values.length,
      nullCount: values.filter(v => v.value === null).length,
      uniqueValues: new Set(values.map(v => v.value)).size,
      lastUpdated: new Date(),
    };

    if (numericValues.length > 0) {
      stats.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      stats.min = Math.min(...numericValues);
      stats.max = Math.max(...numericValues);

      const variance = numericValues.reduce(
        (sum, val) => sum + Math.pow(val - stats.mean!, 2),
        0
      ) / numericValues.length;
      stats.std = Math.sqrt(variance);
    }

    this.stats.set(featureId, stats);
    return stats;
  }

  getStats(featureId: string): FeatureStats | null {
    return this.stats.get(featureId) || null;
  }

  addQualityCheck(check: DataQualityCheck): void {
    this.qualityChecks.set(check.id, check);
  }

  runQualityChecks(featureId: string, values: FeatureValue[]): DataQualityCheck[] {
    const checks = Array.from(this.qualityChecks.values())
      .filter(c => c.featureId === featureId);

    checks.forEach(check => {
      check.lastRun = new Date();

      switch (check.checkType) {
        case "null":
          const nullRate = values.filter(v => v.value === null).length / values.length;
          const maxNullRate = (check.config.maxNullRate as number) || 0.1;
          check.status = nullRate <= maxNullRate ? "passing" : "failing";
          break;

        case "range":
          const numericVals = values
            .map(v => v.value)
            .filter(v => typeof v === "number") as number[];
          const min = check.config.min as number;
          const max = check.config.max as number;
          const inRange = numericVals.every(v => v >= min && v <= max);
          check.status = inRange ? "passing" : "failing";
          break;

        case "freshness":
          const maxAgeMs = (check.config.maxAgeMs as number) || 3600000; // 1 hour
          const latestTimestamp = Math.max(...values.map(v => v.timestamp.getTime()));
          const age = Date.now() - latestTimestamp;
          check.status = age <= maxAgeMs ? "passing" : "failing";
          break;

        case "uniqueness":
          const uniqueCount = new Set(values.map(v => v.value)).size;
          const minUnique = (check.config.minUnique as number) || 1;
          check.status = uniqueCount >= minUnique ? "passing" : "failing";
          break;
      }
    });

    return checks;
  }

  detectDrift(
    featureId: string,
    currentValues: number[],
    baselineValues: number[]
  ): { drift: boolean; score: number } {
    // Simple drift detection using mean difference
    const currentMean = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
    const baselineMean = baselineValues.reduce((a, b) => a + b, 0) / baselineValues.length;
    const baselineStd = Math.sqrt(
      baselineValues.reduce((sum, v) => sum + Math.pow(v - baselineMean, 2), 0) /
      baselineValues.length
    );

    const score = Math.abs(currentMean - baselineMean) / (baselineStd || 1);
    const drift = score > 2.0; // 2 standard deviations

    return { drift, score };
  }
}

// ============================================================================
// Server Setup
// ============================================================================

const registry = new FeatureRegistry();
const store = new FeatureStore();
const servingEngine = new FeatureServingEngine(registry, store);
const monitor = new FeatureMonitor();

// Register demo features
registry.registerFeature({
  name: "purchase_count_7d",
  description: "Number of purchases in the last 7 days",
  valueType: "number",
  entity: "user",
  version: 1,
  tags: ["user", "behavior"],
});

registry.registerFeature({
  name: "avg_order_value",
  description: "Average order value for the user",
  valueType: "number",
  entity: "user",
  version: 1,
  tags: ["user", "revenue"],
});

const server = serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health" && req.method === "GET") {
      return new Response(JSON.stringify({ status: "healthy" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Register feature
    if (url.pathname === "/features/register" && req.method === "POST") {
      try {
        const body = await req.json();
        const feature = registry.registerFeature(body);
        return new Response(JSON.stringify(feature), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // List features
    if (url.pathname === "/features" && req.method === "GET") {
      const entity = url.searchParams.get("entity") || undefined;
      const tags = url.searchParams.get("tags")?.split(",") || undefined;
      const features = registry.listFeatures(entity, tags);
      return new Response(JSON.stringify({ features }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Write feature value
    if (url.pathname === "/features/write" && req.method === "POST") {
      try {
        const body = await req.json();
        const featureValue: FeatureValue = {
          ...body,
          timestamp: new Date(body.timestamp || Date.now()),
        };
        store.writeFeature(featureValue);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Batch write
    if (url.pathname === "/features/write-batch" && req.method === "POST") {
      try {
        const body = await req.json();
        const values = body.values.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp || Date.now()),
        }));
        store.writeBatch(values);
        return new Response(JSON.stringify({ success: true, count: values.length }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Serve features
    if (url.pathname === "/features/serve" && req.method === "POST") {
      try {
        const body = await req.json() as FeatureServingRequest;
        const results = await servingEngine.serve(body);
        return new Response(JSON.stringify({ results }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Historical query
    if (url.pathname === "/features/historical" && req.method === "POST") {
      try {
        const body = await req.json();
        const query: HistoricalQuery = {
          ...body,
          startTime: new Date(body.startTime),
          endTime: new Date(body.endTime),
        };
        const results = await servingEngine.queryHistorical(query);
        return new Response(JSON.stringify({ results }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Feature statistics
    if (url.pathname.startsWith("/features/") && url.pathname.endsWith("/stats")) {
      const featureId = url.pathname.split("/")[2];
      const stats = monitor.getStats(featureId);
      return new Response(JSON.stringify(stats), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`ML Feature Store Service running on http://localhost:${server.port}`);
console.log(`
Available endpoints:
  GET  /health                   - Health check
  POST /features/register        - Register new feature
  GET  /features                 - List features
  POST /features/write           - Write feature value
  POST /features/write-batch     - Batch write feature values
  POST /features/serve           - Serve features (real-time)
  POST /features/historical      - Historical feature query
  GET  /features/:id/stats       - Feature statistics
`);
