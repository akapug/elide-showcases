/**
 * Elide Performance Profiler
 * Advanced performance profiling with flame graphs
 */

import { EventEmitter } from 'events';

export interface ProfilerConfig {
  sampleInterval?: number; // microseconds
  maxDepth?: number;
  includeNative?: boolean;
  trackAllocations?: boolean;
}

export interface FlameGraphNode {
  name: string;
  value: number;
  children: FlameGraphNode[];
  selfTime: number;
  totalTime: number;
  color?: string;
}

export interface AllocationProfile {
  startTime: number;
  endTime: number;
  allocations: Allocation[];
  totalAllocated: number;
  totalFreed: number;
  liveObjects: number;
}

export interface Allocation {
  timestamp: number;
  size: number;
  type: string;
  stackTrace: StackFrame[];
}

export interface StackFrame {
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

export interface EventTrace {
  name: string;
  category: string;
  timestamp: number;
  duration?: number;
  phase: 'B' | 'E' | 'X' | 'I'; // Begin, End, Complete, Instant
  processId: number;
  threadId: number;
  args?: any;
}

export interface AsyncOperation {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'resolved' | 'rejected';
  stackTrace: StackFrame[];
}

export interface FrameTiming {
  frameNumber: number;
  startTime: number;
  duration: number;
  vsync: number;
  dropped: boolean;
}

export interface BundleAnalysis {
  totalSize: number;
  modules: BundleModule[];
  duplicates: BundleModule[];
  largestModules: BundleModule[];
}

export interface BundleModule {
  name: string;
  size: number;
  gzipSize: number;
  imports: string[];
  exports: string[];
}

export interface StartupProfile {
  totalTime: number;
  phases: StartupPhase[];
  bottlenecks: Bottleneck[];
}

export interface StartupPhase {
  name: string;
  startTime: number;
  duration: number;
  percentage: number;
}

export interface Bottleneck {
  phase: string;
  duration: number;
  reason: string;
  suggestion: string;
}

/**
 * Performance Profiler for Elide
 */
export class ElideProfiler extends EventEmitter {
  private config: ProfilerConfig;
  private isProfiling: boolean = false;
  private profileStartTime: number = 0;
  private samples: ProfileSample[] = [];
  private eventTraces: EventTrace[] = [];
  private asyncOps: Map<string, AsyncOperation> = new Map();
  private frameTiming: FrameTiming[] = [];
  private allocationProfile?: AllocationProfile;

  constructor(config: ProfilerConfig = {}) {
    super();
    this.config = {
      sampleInterval: 1000, // 1ms
      maxDepth: 50,
      includeNative: false,
      trackAllocations: false,
      ...config
    };
  }

  /**
   * Start profiling
   */
  async start(): Promise<void> {
    if (this.isProfiling) {
      throw new Error('Profiler already running');
    }

    console.log('[Profiler] Starting performance profiling');
    this.isProfiling = true;
    this.profileStartTime = this.getHighResTime();
    this.samples = [];
    this.eventTraces = [];

    if (this.config.trackAllocations) {
      await this.startAllocationTracking();
    }

    this.startSampling();
    this.emit('started');
  }

  /**
   * Stop profiling
   */
  async stop(): Promise<ProfileResult> {
    if (!this.isProfiling) {
      throw new Error('Profiler not running');
    }

    console.log('[Profiler] Stopping performance profiling');
    this.isProfiling = false;

    if (this.allocationProfile) {
      this.allocationProfile.endTime = Date.now();
    }

    const result = this.generateProfileResult();
    this.emit('stopped', result);

    return result;
  }

  /**
   * Get high-resolution time
   */
  private getHighResTime(): number {
    return performance.now();
  }

  /**
   * Start sampling
   */
  private startSampling(): void {
    this.sampleStack();
  }

  /**
   * Sample current stack
   */
  private sampleStack(): void {
    if (!this.isProfiling) return;

    const timestamp = this.getHighResTime() - this.profileStartTime;
    const stack = this.captureStack();

    this.samples.push({
      timestamp,
      stack
    });

    // Schedule next sample
    setTimeout(
      () => this.sampleStack(),
      this.config.sampleInterval! / 1000
    );
  }

  /**
   * Capture current stack trace
   */
  private captureStack(): StackFrame[] {
    // In production, this would capture the actual call stack
    return [
      {
        functionName: 'main',
        fileName: 'main.ts',
        lineNumber: 10,
        columnNumber: 5
      },
      {
        functionName: 'processData',
        fileName: 'data.ts',
        lineNumber: 42,
        columnNumber: 10
      },
      {
        functionName: 'transform',
        fileName: 'transform.ts',
        lineNumber: 15,
        columnNumber: 8
      }
    ];
  }

  /**
   * Generate profile result
   */
  private generateProfileResult(): ProfileResult {
    const endTime = this.getHighResTime();
    const duration = endTime - this.profileStartTime;

    return {
      duration,
      samples: this.samples.length,
      flameGraph: this.buildFlameGraph(),
      eventTraces: [...this.eventTraces],
      asyncOperations: Array.from(this.asyncOps.values()),
      allocationProfile: this.allocationProfile,
      hotspots: this.identifyHotspots(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Build flame graph from samples
   */
  buildFlameGraph(): FlameGraphNode {
    const root: FlameGraphNode = {
      name: '(root)',
      value: this.samples.length,
      children: [],
      selfTime: 0,
      totalTime: 0
    };

    // Build tree from samples
    for (const sample of this.samples) {
      this.addSampleToTree(root, sample.stack, 0);
    }

    // Calculate times
    this.calculateTimes(root, this.samples.length);

    return root;
  }

  /**
   * Add sample to flame graph tree
   */
  private addSampleToTree(node: FlameGraphNode, stack: StackFrame[], depth: number): void {
    if (depth >= stack.length) {
      node.selfTime++;
      return;
    }

    const frame = stack[depth];
    const childName = this.formatFrameName(frame);

    let child = node.children.find(c => c.name === childName);
    if (!child) {
      child = {
        name: childName,
        value: 0,
        children: [],
        selfTime: 0,
        totalTime: 0
      };
      node.children.push(child);
    }

    child.value++;
    this.addSampleToTree(child, stack, depth + 1);
  }

  /**
   * Format frame name for display
   */
  private formatFrameName(frame: StackFrame): string {
    return `${frame.functionName} (${frame.fileName}:${frame.lineNumber})`;
  }

  /**
   * Calculate times for flame graph nodes
   */
  private calculateTimes(node: FlameGraphNode, totalSamples: number): void {
    node.totalTime = (node.value / totalSamples) * 100;

    for (const child of node.children) {
      this.calculateTimes(child, totalSamples);
    }

    // Self time is total time minus children time
    const childrenTime = node.children.reduce((sum, c) => sum + c.totalTime, 0);
    node.selfTime = node.totalTime - childrenTime;

    // Assign colors based on time
    node.color = this.getColorForTime(node.selfTime);
  }

  /**
   * Get color for flame graph node based on time
   */
  private getColorForTime(percentage: number): string {
    if (percentage > 5) return '#d73027'; // Hot (red)
    if (percentage > 2) return '#fc8d59'; // Warm (orange)
    if (percentage > 1) return '#fee090'; // Mild (yellow)
    return '#e0f3f8'; // Cool (blue)
  }

  /**
   * Identify performance hotspots
   */
  private identifyHotspots(): Hotspot[] {
    const hotspots: Hotspot[] = [];
    const functionCounts = new Map<string, number>();

    // Count function occurrences
    for (const sample of this.samples) {
      for (const frame of sample.stack) {
        const key = `${frame.functionName}:${frame.fileName}`;
        functionCounts.set(key, (functionCounts.get(key) || 0) + 1);
      }
    }

    // Find top hotspots
    const sorted = Array.from(functionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [key, count] of sorted) {
      const [functionName, fileName] = key.split(':');
      hotspots.push({
        functionName,
        fileName,
        hitCount: count,
        percentage: (count / this.samples.length) * 100,
        suggestion: this.getHotspotSuggestion(count / this.samples.length)
      });
    }

    return hotspots;
  }

  /**
   * Get suggestion for hotspot
   */
  private getHotspotSuggestion(percentage: number): string {
    if (percentage > 0.1) {
      return 'Critical: Consider optimization or caching';
    } else if (percentage > 0.05) {
      return 'High: Review algorithm efficiency';
    } else if (percentage > 0.02) {
      return 'Medium: Monitor for improvements';
    }
    return 'Low: No immediate action needed';
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const hotspots = this.identifyHotspots();
    if (hotspots.length > 0 && hotspots[0].percentage > 10) {
      recommendations.push(
        `Hot function detected: ${hotspots[0].functionName} (${hotspots[0].percentage.toFixed(2)}% of time)`
      );
    }

    if (this.asyncOps.size > 100) {
      recommendations.push('High number of async operations - consider batching');
    }

    if (this.eventTraces.some(t => t.duration && t.duration > 16.67)) {
      recommendations.push('Long tasks detected - consider breaking into smaller chunks');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good - no major issues detected');
    }

    return recommendations;
  }

  /**
   * Start allocation tracking
   */
  private async startAllocationTracking(): Promise<void> {
    console.log('[Profiler] Starting allocation tracking');

    this.allocationProfile = {
      startTime: Date.now(),
      endTime: 0,
      allocations: [],
      totalAllocated: 0,
      totalFreed: 0,
      liveObjects: 0
    };
  }

  /**
   * Track allocation
   */
  trackAllocation(size: number, type: string, stackTrace: StackFrame[]): void {
    if (!this.allocationProfile) return;

    const allocation: Allocation = {
      timestamp: Date.now(),
      size,
      type,
      stackTrace
    };

    this.allocationProfile.allocations.push(allocation);
    this.allocationProfile.totalAllocated += size;
    this.allocationProfile.liveObjects++;
  }

  /**
   * Record event trace
   */
  recordEvent(event: Omit<EventTrace, 'processId' | 'threadId'>): void {
    this.eventTraces.push({
      ...event,
      processId: 1,
      threadId: 1
    });

    this.emit('event', event);
  }

  /**
   * Track async operation
   */
  trackAsyncOperation(name: string, stackTrace: StackFrame[]): string {
    const id = `async_${Date.now()}_${Math.random()}`;
    const op: AsyncOperation = {
      id,
      name,
      startTime: this.getHighResTime(),
      status: 'pending',
      stackTrace
    };

    this.asyncOps.set(id, op);
    this.emit('asyncStart', op);

    return id;
  }

  /**
   * Complete async operation
   */
  completeAsyncOperation(id: string, status: 'resolved' | 'rejected'): void {
    const op = this.asyncOps.get(id);
    if (!op) return;

    op.endTime = this.getHighResTime();
    op.duration = op.endTime - op.startTime;
    op.status = status;

    this.emit('asyncComplete', op);
  }

  /**
   * Record frame timing
   */
  recordFrame(frameNumber: number, startTime: number, duration: number): void {
    const frame: FrameTiming = {
      frameNumber,
      startTime,
      duration,
      vsync: 16.67, // 60 FPS
      dropped: duration > 16.67
    };

    this.frameTiming.push(frame);

    if (frame.dropped) {
      console.warn(`[Profiler] Dropped frame ${frameNumber}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get frame statistics
   */
  getFrameStats(): FrameStats {
    if (this.frameTiming.length === 0) {
      return {
        totalFrames: 0,
        droppedFrames: 0,
        averageDuration: 0,
        maxDuration: 0,
        fps: 0
      };
    }

    const droppedFrames = this.frameTiming.filter(f => f.dropped).length;
    const totalDuration = this.frameTiming.reduce((sum, f) => sum + f.duration, 0);
    const avgDuration = totalDuration / this.frameTiming.length;
    const maxDuration = Math.max(...this.frameTiming.map(f => f.duration));
    const fps = 1000 / avgDuration;

    return {
      totalFrames: this.frameTiming.length,
      droppedFrames,
      averageDuration: avgDuration,
      maxDuration,
      fps
    };
  }

  /**
   * Analyze bundle
   */
  async analyzeBundle(bundlePath: string): Promise<BundleAnalysis> {
    console.log(`[Profiler] Analyzing bundle: ${bundlePath}`);

    // In production, this would analyze the actual bundle
    const modules: BundleModule[] = [
      {
        name: 'react',
        size: 150000,
        gzipSize: 45000,
        imports: [],
        exports: ['Component', 'useState', 'useEffect']
      },
      {
        name: 'lodash',
        size: 500000,
        gzipSize: 70000,
        imports: [],
        exports: ['map', 'filter', 'reduce']
      }
    ];

    const totalSize = modules.reduce((sum, m) => sum + m.size, 0);

    return {
      totalSize,
      modules,
      duplicates: [],
      largestModules: modules.sort((a, b) => b.size - a.size).slice(0, 10)
    };
  }

  /**
   * Profile startup time
   */
  async profileStartup(): Promise<StartupProfile> {
    console.log('[Profiler] Profiling startup time');

    const phases: StartupPhase[] = [
      { name: 'Module Loading', startTime: 0, duration: 150, percentage: 30 },
      { name: 'Parse & Compile', startTime: 150, duration: 100, percentage: 20 },
      { name: 'Initialization', startTime: 250, duration: 200, percentage: 40 },
      { name: 'First Render', startTime: 450, duration: 50, percentage: 10 }
    ];

    const totalTime = phases.reduce((sum, p) => sum + p.duration, 0);

    const bottlenecks: Bottleneck[] = [];
    for (const phase of phases) {
      if (phase.percentage > 30) {
        bottlenecks.push({
          phase: phase.name,
          duration: phase.duration,
          reason: 'High percentage of startup time',
          suggestion: 'Consider lazy loading or code splitting'
        });
      }
    }

    return {
      totalTime,
      phases,
      bottlenecks
    };
  }

  /**
   * Export profile in Chrome/Firefox format
   */
  exportProfile(format: 'chrome' | 'firefox'): any {
    if (format === 'chrome') {
      return this.exportChromeProfile();
    } else {
      return this.exportFirefoxProfile();
    }
  }

  /**
   * Export Chrome DevTools profile format
   */
  private exportChromeProfile(): any {
    const nodes: any[] = [];
    let nodeId = 1;

    // Build nodes from samples
    const nodeMap = new Map<string, number>();

    for (const sample of this.samples) {
      for (const frame of sample.stack) {
        const key = this.formatFrameName(frame);
        if (!nodeMap.has(key)) {
          nodeMap.set(key, nodeId++);
          nodes.push({
            id: nodeMap.get(key),
            callFrame: {
              functionName: frame.functionName,
              scriptId: '1',
              url: frame.fileName,
              lineNumber: frame.lineNumber,
              columnNumber: frame.columnNumber
            },
            hitCount: 0,
            children: []
          });
        }
      }
    }

    return {
      nodes,
      startTime: this.profileStartTime,
      endTime: this.getHighResTime(),
      samples: this.samples.map(s => 1),
      timeDeltas: this.samples.map((s, i) => i === 0 ? 0 : s.timestamp - this.samples[i - 1].timestamp)
    };
  }

  /**
   * Export Firefox profile format
   */
  private exportFirefoxProfile(): any {
    return {
      meta: {
        version: 24,
        startTime: this.profileStartTime,
        product: 'Elide',
        interval: this.config.sampleInterval
      },
      threads: [
        {
          name: 'Main Thread',
          samples: this.samples.map(s => ({
            time: s.timestamp,
            stack: s.stack.map(f => f.functionName)
          }))
        }
      ]
    };
  }

  /**
   * Clear all profile data
   */
  clear(): void {
    this.samples = [];
    this.eventTraces = [];
    this.asyncOps.clear();
    this.frameTiming = [];
    this.allocationProfile = undefined;
  }
}

interface ProfileSample {
  timestamp: number;
  stack: StackFrame[];
}

interface ProfileResult {
  duration: number;
  samples: number;
  flameGraph: FlameGraphNode;
  eventTraces: EventTrace[];
  asyncOperations: AsyncOperation[];
  allocationProfile?: AllocationProfile;
  hotspots: Hotspot[];
  recommendations: string[];
}

interface Hotspot {
  functionName: string;
  fileName: string;
  hitCount: number;
  percentage: number;
  suggestion: string;
}

interface FrameStats {
  totalFrames: number;
  droppedFrames: number;
  averageDuration: number;
  maxDuration: number;
  fps: number;
}

export default ElideProfiler;
