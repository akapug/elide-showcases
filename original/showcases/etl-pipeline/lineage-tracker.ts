/**
 * Data Lineage Tracker
 *
 * Track data lineage and transformations:
 * - Source tracking
 * - Transformation history
 * - Impact analysis
 * - Dependency graphs
 * - Column-level lineage
 * - Audit trails
 * - Provenance tracking
 * - Lineage visualization
 */

export interface DataSource {
  id: string;
  type: 'database' | 'file' | 'api' | 'stream';
  name: string;
  location: string;
  schema?: string;
  table?: string;
  timestamp: number;
}

export interface Transformation {
  id: string;
  name: string;
  type: string;
  operation: string;
  inputs: string[];
  outputs: string[];
  params: Record<string, any>;
  timestamp: number;
  duration: number;
}

export interface LineageNode {
  id: string;
  type: 'source' | 'transformation' | 'target';
  name: string;
  metadata: Record<string, any>;
  timestamp: number;
}

export interface LineageEdge {
  from: string;
  to: string;
  relationship: 'produces' | 'consumes' | 'derives_from';
  metadata?: Record<string, any>;
}

export interface LineageGraph {
  nodes: Map<string, LineageNode>;
  edges: LineageEdge[];
}

export interface ColumnLineage {
  targetColumn: string;
  sourceColumns: {
    source: string;
    column: string;
    transformation: string;
  }[];
}

export interface ImpactAnalysis {
  affected: string[];
  downstream: string[];
  upstream: string[];
}

// ==================== Lineage Tracker ====================

export class LineageTracker {
  private graph: LineageGraph;
  private transformations: Map<string, Transformation>;
  private columnLineage: Map<string, ColumnLineage>;
  private auditLog: AuditEntry[];

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: []
    };
    this.transformations = new Map();
    this.columnLineage = new Map();
    this.auditLog = [];
  }

  // ==================== Source Tracking ====================

  trackSource(source: DataSource): void {
    const node: LineageNode = {
      id: source.id,
      type: 'source',
      name: source.name,
      metadata: {
        type: source.type,
        location: source.location,
        schema: source.schema,
        table: source.table
      },
      timestamp: source.timestamp
    };

    this.graph.nodes.set(source.id, node);

    this.addAuditEntry({
      action: 'source_tracked',
      entityId: source.id,
      entityType: 'source',
      details: `Tracked source: ${source.name}`,
      timestamp: Date.now()
    });

    console.log(`Tracked source: ${source.name} (${source.id})`);
  }

  trackTransformation(transformation: Transformation): void {
    const node: LineageNode = {
      id: transformation.id,
      type: 'transformation',
      name: transformation.name,
      metadata: {
        operation: transformation.operation,
        params: transformation.params,
        duration: transformation.duration
      },
      timestamp: transformation.timestamp
    };

    this.graph.nodes.set(transformation.id, node);
    this.transformations.set(transformation.id, transformation);

    // Create edges from inputs to transformation
    for (const input of transformation.inputs) {
      this.graph.edges.push({
        from: input,
        to: transformation.id,
        relationship: 'consumes'
      });
    }

    // Create edges from transformation to outputs
    for (const output of transformation.outputs) {
      this.graph.edges.push({
        from: transformation.id,
        to: output,
        relationship: 'produces'
      });
    }

    this.addAuditEntry({
      action: 'transformation_tracked',
      entityId: transformation.id,
      entityType: 'transformation',
      details: `Tracked transformation: ${transformation.name}`,
      timestamp: Date.now()
    });

    console.log(`Tracked transformation: ${transformation.name} (${transformation.id})`);
  }

  trackTarget(target: {
    id: string;
    name: string;
    type: string;
    location: string;
    sourceId: string;
  }): void {
    const node: LineageNode = {
      id: target.id,
      type: 'target',
      name: target.name,
      metadata: {
        type: target.type,
        location: target.location
      },
      timestamp: Date.now()
    };

    this.graph.nodes.set(target.id, node);

    // Create edge from source to target
    this.graph.edges.push({
      from: target.sourceId,
      to: target.id,
      relationship: 'derives_from'
    });

    this.addAuditEntry({
      action: 'target_tracked',
      entityId: target.id,
      entityType: 'target',
      details: `Tracked target: ${target.name}`,
      timestamp: Date.now()
    });

    console.log(`Tracked target: ${target.name} (${target.id})`);
  }

  // ==================== Column Lineage ====================

  trackColumnLineage(targetColumn: string, sourceColumns: ColumnLineage['sourceColumns']): void {
    this.columnLineage.set(targetColumn, {
      targetColumn,
      sourceColumns
    });

    console.log(`Tracked column lineage: ${targetColumn} <- ${sourceColumns.length} source columns`);
  }

  getColumnLineage(column: string): ColumnLineage | undefined {
    return this.columnLineage.get(column);
  }

  getColumnDependencies(column: string): string[] {
    const lineage = this.columnLineage.get(column);

    if (!lineage) {
      return [];
    }

    const dependencies: string[] = [];

    for (const source of lineage.sourceColumns) {
      dependencies.push(`${source.source}.${source.column}`);

      // Recursively get dependencies
      const nestedDeps = this.getColumnDependencies(`${source.source}.${source.column}`);
      dependencies.push(...nestedDeps);
    }

    return [...new Set(dependencies)];
  }

  // ==================== Lineage Queries ====================

  getUpstreamLineage(entityId: string, maxDepth = 10): LineageGraph {
    const visited = new Set<string>();
    const result: LineageGraph = {
      nodes: new Map(),
      edges: []
    };

    this.traverseUpstream(entityId, result, visited, 0, maxDepth);

    return result;
  }

  private traverseUpstream(
    entityId: string,
    result: LineageGraph,
    visited: Set<string>,
    depth: number,
    maxDepth: number
  ): void {
    if (depth >= maxDepth || visited.has(entityId)) {
      return;
    }

    visited.add(entityId);

    const node = this.graph.nodes.get(entityId);

    if (node) {
      result.nodes.set(entityId, node);
    }

    // Find edges that end at this entity
    const incomingEdges = this.graph.edges.filter(e => e.to === entityId);

    for (const edge of incomingEdges) {
      result.edges.push(edge);
      this.traverseUpstream(edge.from, result, visited, depth + 1, maxDepth);
    }
  }

  getDownstreamLineage(entityId: string, maxDepth = 10): LineageGraph {
    const visited = new Set<string>();
    const result: LineageGraph = {
      nodes: new Map(),
      edges: []
    };

    this.traverseDownstream(entityId, result, visited, 0, maxDepth);

    return result;
  }

  private traverseDownstream(
    entityId: string,
    result: LineageGraph,
    visited: Set<string>,
    depth: number,
    maxDepth: number
  ): void {
    if (depth >= maxDepth || visited.has(entityId)) {
      return;
    }

    visited.add(entityId);

    const node = this.graph.nodes.get(entityId);

    if (node) {
      result.nodes.set(entityId, node);
    }

    // Find edges that start from this entity
    const outgoingEdges = this.graph.edges.filter(e => e.from === entityId);

    for (const edge of outgoingEdges) {
      result.edges.push(edge);
      this.traverseDownstream(edge.to, result, visited, depth + 1, maxDepth);
    }
  }

  getFullLineage(entityId: string): LineageGraph {
    const upstream = this.getUpstreamLineage(entityId);
    const downstream = this.getDownstreamLineage(entityId);

    const result: LineageGraph = {
      nodes: new Map([...upstream.nodes, ...downstream.nodes]),
      edges: [...upstream.edges, ...downstream.edges]
    };

    return result;
  }

  // ==================== Impact Analysis ====================

  analyzeImpact(entityId: string): ImpactAnalysis {
    const downstream = this.getDownstreamLineage(entityId);
    const upstream = this.getUpstreamLineage(entityId);

    const affected = Array.from(downstream.nodes.keys()).filter(id => id !== entityId);
    const dependencies = Array.from(upstream.nodes.keys()).filter(id => id !== entityId);

    return {
      affected,
      downstream: affected,
      upstream: dependencies
    };
  }

  getDataflowPath(fromId: string, toId: string): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];

    if (this.findPath(fromId, toId, visited, path)) {
      return path;
    }

    return null;
  }

  private findPath(
    current: string,
    target: string,
    visited: Set<string>,
    path: string[]
  ): boolean {
    if (current === target) {
      path.push(current);
      return true;
    }

    if (visited.has(current)) {
      return false;
    }

    visited.add(current);
    path.push(current);

    // Find outgoing edges
    const outgoingEdges = this.graph.edges.filter(e => e.from === current);

    for (const edge of outgoingEdges) {
      if (this.findPath(edge.to, target, visited, path)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  // ==================== Audit Trail ====================

  private addAuditEntry(entry: AuditEntry): void {
    this.auditLog.push(entry);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
  }

  getAuditLog(filter?: {
    entityId?: string;
    action?: string;
    startTime?: number;
    endTime?: number;
  }): AuditEntry[] {
    let filtered = this.auditLog;

    if (filter) {
      if (filter.entityId) {
        filtered = filtered.filter(e => e.entityId === filter.entityId);
      }

      if (filter.action) {
        filtered = filtered.filter(e => e.action === filter.action);
      }

      if (filter.startTime) {
        filtered = filtered.filter(e => e.timestamp >= filter.startTime!);
      }

      if (filter.endTime) {
        filtered = filtered.filter(e => e.timestamp <= filter.endTime!);
      }
    }

    return filtered;
  }

  // ==================== Visualization ====================

  exportToMermaid(entityId?: string): string {
    const lineage = entityId ? this.getFullLineage(entityId) : this.graph;

    let mermaid = 'graph LR\n';

    // Add nodes
    for (const [id, node] of lineage.nodes) {
      const shape = this.getNodeShape(node.type);
      const label = node.name.replace(/"/g, '\\"');
      mermaid += `  ${this.sanitizeId(id)}${shape[0]}"${label}"${shape[1]}\n`;
    }

    // Add edges
    for (const edge of lineage.edges) {
      const arrow = this.getEdgeArrow(edge.relationship);
      mermaid += `  ${this.sanitizeId(edge.from)} ${arrow} ${this.sanitizeId(edge.to)}\n`;
    }

    return mermaid;
  }

  private getNodeShape(type: string): [string, string] {
    switch (type) {
      case 'source':
        return ['[(', ')]']; // Cylinder for data sources
      case 'transformation':
        return ['[', ']']; // Rectangle for transformations
      case 'target':
        return ['([', ')]']; // Stadium for targets
      default:
        return ['[', ']'];
    }
  }

  private getEdgeArrow(relationship: string): string {
    switch (relationship) {
      case 'produces':
        return '-->';
      case 'consumes':
        return '-->';
      case 'derives_from':
        return '==>';
      default:
        return '-->';
    }
  }

  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9]/g, '_');
  }

  exportToJSON(): string {
    return JSON.stringify({
      nodes: Array.from(this.graph.nodes.entries()),
      edges: this.graph.edges,
      transformations: Array.from(this.transformations.entries()),
      columnLineage: Array.from(this.columnLineage.entries())
    }, null, 2);
  }

  // ==================== Statistics ====================

  getStatistics(): {
    totalSources: number;
    totalTransformations: number;
    totalTargets: number;
    totalEdges: number;
    avgTransformationDuration: number;
    longestPath: number;
  } {
    const sources = Array.from(this.graph.nodes.values()).filter(n => n.type === 'source');
    const transformations = Array.from(this.graph.nodes.values()).filter(n => n.type === 'transformation');
    const targets = Array.from(this.graph.nodes.values()).filter(n => n.type === 'target');

    const durations = Array.from(this.transformations.values()).map(t => t.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    // Calculate longest path
    let longestPath = 0;

    for (const source of sources) {
      const depth = this.calculateMaxDepth(source.id);
      longestPath = Math.max(longestPath, depth);
    }

    return {
      totalSources: sources.length,
      totalTransformations: transformations.length,
      totalTargets: targets.length,
      totalEdges: this.graph.edges.length,
      avgTransformationDuration: avgDuration,
      longestPath
    };
  }

  private calculateMaxDepth(nodeId: string, visited = new Set<string>()): number {
    if (visited.has(nodeId)) {
      return 0;
    }

    visited.add(nodeId);

    const outgoingEdges = this.graph.edges.filter(e => e.from === nodeId);

    if (outgoingEdges.length === 0) {
      return 1;
    }

    let maxDepth = 0;

    for (const edge of outgoingEdges) {
      const depth = this.calculateMaxDepth(edge.to, visited);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth + 1;
  }

  printSummary(): void {
    const stats = this.getStatistics();

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          DATA LINEAGE SUMMARY                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log(`Total Sources: ${stats.totalSources}`);
    console.log(`Total Transformations: ${stats.totalTransformations}`);
    console.log(`Total Targets: ${stats.totalTargets}`);
    console.log(`Total Edges: ${stats.totalEdges}`);
    console.log(`Avg Transformation Duration: ${stats.avgTransformationDuration.toFixed(2)}ms`);
    console.log(`Longest Pipeline Path: ${stats.longestPath} hops`);

    if (this.columnLineage.size > 0) {
      console.log(`\nColumn Lineage Tracked: ${this.columnLineage.size} columns`);
    }

    console.log('\n═'.repeat(80) + '\n');
  }

  printLineage(entityId: string): void {
    const node = this.graph.nodes.get(entityId);

    if (!node) {
      console.log(`Entity not found: ${entityId}`);
      return;
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log(`║          LINEAGE: ${node.name.padEnd(39)}║`);
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log(`Type: ${node.type}`);
    console.log(`ID: ${node.id}`);
    console.log(`Timestamp: ${new Date(node.timestamp).toISOString()}\n`);

    // Upstream
    const upstream = this.getUpstreamLineage(entityId);
    console.log(`Upstream Dependencies (${upstream.nodes.size - 1}):`);

    for (const [id, upstreamNode] of upstream.nodes) {
      if (id !== entityId) {
        console.log(`  - ${upstreamNode.name} (${upstreamNode.type})`);
      }
    }

    // Downstream
    const downstream = this.getDownstreamLineage(entityId);
    console.log(`\nDownstream Impact (${downstream.nodes.size - 1}):`);

    for (const [id, downstreamNode] of downstream.nodes) {
      if (id !== entityId) {
        console.log(`  - ${downstreamNode.name} (${downstreamNode.type})`);
      }
    }

    console.log('\n═'.repeat(80) + '\n');
  }
}

// ==================== Audit Entry ====================

interface AuditEntry {
  action: string;
  entityId: string;
  entityType: string;
  details: string;
  timestamp: number;
  user?: string;
  metadata?: Record<string, any>;
}

// ==================== Lineage Builder ====================

export class LineageBuilder {
  private tracker: LineageTracker;
  private currentPipeline: string[] = [];

  constructor(tracker: LineageTracker) {
    this.tracker = tracker;
  }

  startPipeline(sourceId: string): this {
    this.currentPipeline = [sourceId];
    return this;
  }

  addTransformation(transformation: Transformation): this {
    this.tracker.trackTransformation(transformation);
    this.currentPipeline.push(transformation.id);
    return this;
  }

  endPipeline(targetId: string): this {
    if (this.currentPipeline.length === 0) {
      throw new Error('No pipeline started');
    }

    const lastId = this.currentPipeline[this.currentPipeline.length - 1];

    this.tracker.trackTarget({
      id: targetId,
      name: targetId,
      type: 'target',
      location: 'unknown',
      sourceId: lastId
    });

    this.currentPipeline = [];
    return this;
  }

  build(): LineageTracker {
    return this.tracker;
  }
}

// ==================== Provenance Tracker ====================

export class ProvenanceTracker {
  private lineageTracker: LineageTracker;
  private provenance: Map<string, ProvenanceRecord>;

  constructor(lineageTracker: LineageTracker) {
    this.lineageTracker = lineageTracker;
    this.provenance = new Map();
  }

  trackRecordProvenance(recordId: string, sourceId: string, transformations: string[]): void {
    this.provenance.set(recordId, {
      recordId,
      sourceId,
      transformations,
      timestamp: Date.now()
    });
  }

  getRecordProvenance(recordId: string): ProvenanceRecord | undefined {
    return this.provenance.get(recordId);
  }

  getRecordLineage(recordId: string): LineageGraph | null {
    const prov = this.provenance.get(recordId);

    if (!prov) {
      return null;
    }

    return this.lineageTracker.getFullLineage(prov.sourceId);
  }
}

interface ProvenanceRecord {
  recordId: string;
  sourceId: string;
  transformations: string[];
  timestamp: number;
}
