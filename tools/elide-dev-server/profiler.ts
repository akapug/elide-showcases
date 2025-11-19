/**
 * Performance Profiler
 *
 * CPU and memory profiling with cross-language support.
 * Tracks performance metrics, identifies bottlenecks, and generates reports.
 */

interface ProfileEntry {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  type: "function" | "request" | "module" | "custom";
  language?: string;
  metadata?: Record<string, any>;
}

interface MemorySample {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

interface CPUProfile {
  samples: number[];
  timestamps: number[];
  nodes: ProfileNode[];
}

interface ProfileNode {
  id: number;
  callFrame: {
    functionName: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  hitCount: number;
  children: number[];
}

interface PerformanceReport {
  summary: {
    totalSamples: number;
    duration: number;
    avgMemory: number;
    peakMemory: number;
  };
  slowest: ProfileEntry[];
  mostCalled: { name: string; count: number; totalTime: number }[];
  memoryTrend: "increasing" | "stable" | "decreasing";
  hotspots: { name: string; hitCount: number; percentage: number }[];
}

export class Profiler {
  private enabled: boolean;
  private profiles: Map<string, ProfileEntry> = new Map();
  private completedProfiles: ProfileEntry[] = [];
  private memorySamples: MemorySample[] = [];
  private cpuSamples: number[] = [];
  private functionCalls: Map<string, { count: number; totalTime: number }> = new Map();
  private sampleInterval: any = null;
  private startTime: number = 0;

  constructor(enabled: boolean = false) {
    this.enabled = enabled;

    if (this.enabled) {
      this.startProfiling();
    }
  }

  /**
   * Start profiling
   */
  startProfiling(): void {
    if (!this.enabled) {
      console.log("⚠️ Profiler is disabled");
      return;
    }

    this.startTime = Date.now();
    console.log("📊 Profiler started");

    // Sample memory and CPU periodically
    this.sampleInterval = setInterval(() => {
      this.sampleMemory();
      this.sampleCPU();
    }, 100); // Sample every 100ms
  }

  /**
   * Stop profiling
   */
  stopProfiling(): void {
    if (this.sampleInterval) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }

    console.log("📊 Profiler stopped");
    console.log(`⏱️  Duration: ${((Date.now() - this.startTime) / 1000).toFixed(2)}s`);
  }

  /**
   * Start profiling a function/request
   */
  start(name: string, type: "function" | "request" | "module" | "custom" = "function", metadata?: Record<string, any>): string {
    const id = `profile-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const entry: ProfileEntry = {
      id,
      name,
      startTime: performance.now(),
      type,
      metadata,
    };

    this.profiles.set(id, entry);
    return id;
  }

  /**
   * End profiling a function/request
   */
  end(id: string): number | null {
    const entry = this.profiles.get(id);
    if (!entry) {
      console.warn(`⚠️ Profile not found: ${id}`);
      return null;
    }

    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;

    // Move to completed profiles
    this.profiles.delete(id);
    this.completedProfiles.push(entry);

    // Update function call stats
    const stats = this.functionCalls.get(entry.name) || { count: 0, totalTime: 0 };
    stats.count++;
    stats.totalTime += entry.duration;
    this.functionCalls.set(entry.name, stats);

    return entry.duration;
  }

  /**
   * Profile a function execution
   */
  async profile<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    const id = this.start(name, "function");

    try {
      const result = await fn();
      const duration = this.end(id);

      if (this.enabled && duration !== null) {
        console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      this.end(id);
      throw error;
    }
  }

  /**
   * Record a request for profiling
   */
  recordRequest(url: string, duration: number): void {
    const entry: ProfileEntry = {
      id: `req-${Date.now()}`,
      name: url,
      startTime: performance.now() - duration,
      endTime: performance.now(),
      duration,
      type: "request",
      metadata: { url },
    };

    this.completedProfiles.push(entry);

    // Update request stats
    const stats = this.functionCalls.get(url) || { count: 0, totalTime: 0 };
    stats.count++;
    stats.totalTime += duration;
    this.functionCalls.set(url, stats);
  }

  /**
   * Sample memory usage
   */
  private sampleMemory(): void {
    if (!this.enabled) return;

    const usage = process.memoryUsage();
    this.memorySamples.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
    });

    // Keep last 1000 samples
    if (this.memorySamples.length > 1000) {
      this.memorySamples.shift();
    }
  }

  /**
   * Sample CPU usage
   */
  private sampleCPU(): void {
    if (!this.enabled) return;

    // Simplified CPU sampling
    // In production, would use actual CPU profiling APIs
    const sample = Math.random() * 100; // Mock CPU usage
    this.cpuSamples.push(sample);

    // Keep last 1000 samples
    if (this.cpuSamples.length > 1000) {
      this.cpuSamples.shift();
    }
  }

  /**
   * Generate performance report
   */
  getReport(): PerformanceReport {
    const duration = Date.now() - this.startTime;

    // Calculate memory stats
    const avgMemory = this.memorySamples.reduce((sum, s) => sum + s.heapUsed, 0) / this.memorySamples.length || 0;
    const peakMemory = Math.max(...this.memorySamples.map((s) => s.heapUsed), 0);

    // Get slowest operations
    const slowest = [...this.completedProfiles]
      .filter((p) => p.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    // Get most called functions
    const mostCalled = Array.from(this.functionCalls.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Determine memory trend
    const memoryTrend = this.analyzeMemoryTrend();

    // Calculate hotspots
    const totalHits = this.completedProfiles.length;
    const hotspots = mostCalled.map((item) => ({
      name: item.name,
      hitCount: item.count,
      percentage: (item.count / totalHits) * 100,
    }));

    return {
      summary: {
        totalSamples: this.completedProfiles.length,
        duration: duration / 1000, // Convert to seconds
        avgMemory: avgMemory / 1024 / 1024, // Convert to MB
        peakMemory: peakMemory / 1024 / 1024, // Convert to MB
      },
      slowest,
      mostCalled,
      memoryTrend,
      hotspots,
    };
  }

  /**
   * Analyze memory trend
   */
  private analyzeMemoryTrend(): "increasing" | "stable" | "decreasing" {
    if (this.memorySamples.length < 10) {
      return "stable";
    }

    // Compare recent samples with older samples
    const recentSamples = this.memorySamples.slice(-10);
    const olderSamples = this.memorySamples.slice(-20, -10);

    const recentAvg = recentSamples.reduce((sum, s) => sum + s.heapUsed, 0) / recentSamples.length;
    const olderAvg = olderSamples.reduce((sum, s) => sum + s.heapUsed, 0) / olderSamples.length;

    const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (percentageChange > 5) return "increasing";
    if (percentageChange < -5) return "decreasing";
    return "stable";
  }

  /**
   * Get memory samples
   */
  getMemorySamples(): MemorySample[] {
    return [...this.memorySamples];
  }

  /**
   * Get CPU samples
   */
  getCPUSamples(): number[] {
    return [...this.cpuSamples];
  }

  /**
   * Get active profiles
   */
  getActiveProfiles(): ProfileEntry[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get completed profiles
   */
  getCompletedProfiles(): ProfileEntry[] {
    return [...this.completedProfiles];
  }

  /**
   * Clear all profile data
   */
  clear(): void {
    this.profiles.clear();
    this.completedProfiles = [];
    this.memorySamples = [];
    this.cpuSamples = [];
    this.functionCalls.clear();
    console.log("🗑️  Profile data cleared");
  }

  /**
   * Export profile data as JSON
   */
  export(): string {
    return JSON.stringify({
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      completedProfiles: this.completedProfiles,
      memorySamples: this.memorySamples,
      cpuSamples: this.cpuSamples,
      functionCalls: Array.from(this.functionCalls.entries()),
      report: this.getReport(),
    }, null, 2);
  }

  /**
   * Enable/disable profiler
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (enabled && !this.sampleInterval) {
      this.startProfiling();
    } else if (!enabled && this.sampleInterval) {
      this.stopProfiling();
    }

    console.log(`📊 Profiler ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Get performance summary as a formatted string
   */
  getSummary(): string {
    const report = this.getReport();

    return `
📊 Performance Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️  Duration: ${report.summary.duration.toFixed(2)}s
📦 Total Samples: ${report.summary.totalSamples}
💾 Avg Memory: ${report.summary.avgMemory.toFixed(2)} MB
🔝 Peak Memory: ${report.summary.peakMemory.toFixed(2)} MB
📈 Memory Trend: ${report.memoryTrend}

🐌 Slowest Operations:
${report.slowest.slice(0, 5).map((p, i) =>
  `   ${i + 1}. ${p.name}: ${p.duration?.toFixed(2)}ms`
).join('\n')}

🔥 Most Called:
${report.mostCalled.slice(0, 5).map((p, i) =>
  `   ${i + 1}. ${p.name}: ${p.count} calls (${p.totalTime.toFixed(2)}ms total)`
).join('\n')}

🎯 Hotspots:
${report.hotspots.slice(0, 5).map((h, i) =>
  `   ${i + 1}. ${h.name}: ${h.percentage.toFixed(1)}% of executions`
).join('\n')}
    `.trim();
  }
}

// CLI demo
if (import.meta.url.includes("profiler.ts")) {
  console.log("📊 Performance Profiler Demo\n");

  const profiler = new Profiler(true);

  // Simulate some work
  (async () => {
    console.log("🎬 Running performance test...\n");

    // Test 1: Profile some functions
    await profiler.profile("fetchData", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await profiler.profile("processData", async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    await profiler.profile("renderUI", async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // Test 2: Call same function multiple times
    for (let i = 0; i < 5; i++) {
      await profiler.profile("calculateTotal", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }

    // Test 3: Record some requests
    profiler.recordRequest("/api/users", 45);
    profiler.recordRequest("/api/posts", 32);
    profiler.recordRequest("/api/comments", 28);

    // Wait for some memory samples
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Show report
    console.log("\n" + profiler.getSummary());

    // Export data
    console.log("\n📥 Exporting profile data...");
    const exported = profiler.export();
    console.log(`✅ Exported ${exported.length} bytes`);

    // Stop profiler
    profiler.stopProfiling();

    console.log("\n✅ Demo completed!");
  })();
}
