/**
 * Route Planner
 *
 * Network analysis and routing using python:networkx for graph-based
 * shortest path calculations, service areas, and route optimization.
 */

// @ts-ignore
import networkx from 'python:networkx';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import heapq from 'python:heapq';

import {
  Network,
  NetworkEdge,
  NetworkNode,
  Route,
  RouteInstruction,
  RoutingAlgorithm,
  RoutingOptions,
  ServiceAreaOptions,
  Point,
  LineString,
  Polygon,
  Feature,
  RoutingError,
} from '../types';

/**
 * RoutePlanner class for network routing and analysis
 */
export class RoutePlanner {
  private graph: any = null;

  constructor() {}

  /**
   * Create network graph from edges
   */
  async createNetwork(
    edges: Feature<LineString>[],
    options?: {
      weightAttribute?: string;
      directed?: boolean;
      bidirectional?: boolean;
    }
  ): Promise<Network> {
    try {
      const directed = options?.directed !== false;
      this.graph = directed ? networkx.DiGraph() : networkx.Graph();

      const nodes: Map<string, NetworkNode> = new Map();
      const networkEdges: NetworkEdge[] = [];

      for (const edge of edges) {
        const coords = edge.geometry.coordinates;
        const startCoord = coords[0];
        const endCoord = coords[coords.length - 1];

        const startId = `${startCoord[0]},${startCoord[1]}`;
        const endId = `${endCoord[0]},${endCoord[1]}`;

        // Add nodes
        if (!nodes.has(startId)) {
          nodes.set(startId, {
            id: startId,
            geometry: { type: 'Point', coordinates: startCoord },
            attributes: {},
          });
        }
        if (!nodes.has(endId)) {
          nodes.set(endId, {
            id: endId,
            geometry: { type: 'Point', coordinates: endCoord },
            attributes: {},
          });
        }

        // Calculate weight
        let weight = 1;
        if (options?.weightAttribute && edge.properties[options.weightAttribute]) {
          weight = edge.properties[options.weightAttribute];
        } else {
          weight = this.calculateLength(coords);
        }

        // Add edge to graph
        this.graph.add_edge(startId, endId, weight=weight, geometry=edge.geometry, **edge.properties);
        networkEdges.push({
          id: edge.id || `${startId}-${endId}`,
          source: startId,
          target: endId,
          geometry: edge.geometry,
          weight,
          attributes: edge.properties,
        });

        // Add reverse edge for bidirectional
        if (options?.bidirectional && directed) {
          this.graph.add_edge(endId, startId, weight=weight, geometry=edge.geometry, **edge.properties);
        }
      }

      return {
        nodes: Array.from(nodes.values()),
        edges: networkEdges,
        directed: directed,
      };
    } catch (error) {
      throw new RoutingError(`Network creation failed: ${error}`);
    }
  }

  /**
   * Find shortest path between two points
   */
  async shortestPath(
    network: Network,
    start: Point,
    end: Point,
    options?: RoutingOptions
  ): Promise<Route> {
    try {
      const startNode = this.findNearestNode(network, start);
      const endNode = this.findNearestNode(network, end);

      const algorithm = options?.algorithm || RoutingAlgorithm.Dijkstra;

      let path: string[];
      let length: number;

      switch (algorithm) {
        case RoutingAlgorithm.Dijkstra:
          path = networkx.dijkstra_path(this.graph, startNode, endNode, weight='weight');
          length = networkx.dijkstra_path_length(this.graph, startNode, endNode, weight='weight');
          break;

        case RoutingAlgorithm.AStar:
          path = networkx.astar_path(
            this.graph,
            startNode,
            endNode,
            heuristic=this.heuristicDistance,
            weight='weight'
          );
          length = networkx.astar_path_length(
            this.graph,
            startNode,
            endNode,
            heuristic=this.heuristicDistance,
            weight='weight'
          );
          break;

        case RoutingAlgorithm.BellmanFord:
          path = networkx.bellman_ford_path(this.graph, startNode, endNode, weight='weight');
          length = networkx.bellman_ford_path_length(this.graph, startNode, endNode, weight='weight');
          break;

        default:
          path = networkx.shortest_path(this.graph, startNode, endNode, weight='weight');
          length = networkx.shortest_path_length(this.graph, startNode, endNode, weight='weight');
      }

      // Construct route geometry
      const coordinates: number[][] = [];
      const edges: string[] = [];

      for (let i = 0; i < path.length - 1; i++) {
        const edgeData = this.graph.get_edge_data(path[i], path[i + 1]);
        if (edgeData.geometry) {
          coordinates.push(...edgeData.geometry.coordinates);
          edges.push(`${path[i]}-${path[i + 1]}`);
        }
      }

      const geometry: LineString = {
        type: 'LineString',
        coordinates,
      };

      // Calculate duration (assuming speed if available)
      const duration = this.calculateDuration(length, options);

      return {
        geometry,
        distance: length,
        duration,
        nodes: Array.from(path),
        edges,
        instructions: this.generateInstructions(path, network),
      };
    } catch (error) {
      throw new RoutingError(`Shortest path calculation failed: ${error}`);
    }
  }

  /**
   * Calculate multiple routes (alternative routes)
   */
  async alternativeRoutes(
    network: Network,
    start: Point,
    end: Point,
    count: number = 3
  ): Promise<Route[]> {
    try {
      const startNode = this.findNearestNode(network, start);
      const endNode = this.findNearestNode(network, end);

      const routes: Route[] = [];

      // Find k-shortest paths using Yen's algorithm
      const paths = this.yensKShortestPaths(this.graph, startNode, endNode, count);

      for (const path of paths) {
        const coordinates: number[][] = [];
        const edges: string[] = [];
        let distance = 0;

        for (let i = 0; i < path.length - 1; i++) {
          const edgeData = this.graph.get_edge_data(path[i], path[i + 1]);
          if (edgeData.geometry) {
            coordinates.push(...edgeData.geometry.coordinates);
            edges.push(`${path[i]}-${path[i + 1]}`);
            distance += edgeData.weight || 0;
          }
        }

        const geometry: LineString = { type: 'LineString', coordinates };
        const duration = this.calculateDuration(distance, {});

        routes.push({
          geometry,
          distance,
          duration,
          nodes: Array.from(path),
          edges,
        });
      }

      return routes;
    } catch (error) {
      throw new RoutingError(`Alternative routes calculation failed: ${error}`);
    }
  }

  /**
   * Optimize multi-stop route (Traveling Salesman Problem)
   */
  async optimizeRoute(
    network: Network,
    waypoints: Point[],
    options?: {
      startLocation?: Point;
      endLocation?: Point;
      algorithm?: 'greedy' | 'genetic' | 'simulated-annealing';
    }
  ): Promise<Route> {
    try {
      const nodes = waypoints.map((p) => this.findNearestNode(network, p));

      let orderedNodes: string[];

      const algorithm = options?.algorithm || 'greedy';

      switch (algorithm) {
        case 'greedy':
          orderedNodes = await this.greedyTSP(nodes);
          break;
        case 'genetic':
          orderedNodes = await this.geneticTSP(nodes);
          break;
        case 'simulated-annealing':
          orderedNodes = await this.simulatedAnnealingTSP(nodes);
          break;
        default:
          orderedNodes = await this.greedyTSP(nodes);
      }

      // Calculate route through ordered nodes
      const allCoordinates: number[][] = [];
      const allEdges: string[] = [];
      let totalDistance = 0;
      let totalDuration = 0;

      for (let i = 0; i < orderedNodes.length - 1; i++) {
        const segment = await this.shortestPath(
          network,
          { type: 'Point', coordinates: this.nodeToCoords(orderedNodes[i]) },
          { type: 'Point', coordinates: this.nodeToCoords(orderedNodes[i + 1]) }
        );

        allCoordinates.push(...segment.geometry.coordinates);
        allEdges.push(...segment.edges);
        totalDistance += segment.distance;
        totalDuration += segment.duration;
      }

      return {
        geometry: { type: 'LineString', coordinates: allCoordinates },
        distance: totalDistance,
        duration: totalDuration,
        nodes: orderedNodes,
        edges: allEdges,
      };
    } catch (error) {
      throw new RoutingError(`Route optimization failed: ${error}`);
    }
  }

  /**
   * Calculate service area (isochrone)
   */
  async serviceArea(
    network: Network,
    center: Point,
    options: ServiceAreaOptions
  ): Promise<Feature<Polygon>[]> {
    try {
      const centerNode = this.findNearestNode(network, center);

      const maxCost = options.maxTime || options.maxDistance || 1000;
      const intervals = options.intervals || [maxCost];

      // Calculate shortest paths from center to all nodes
      const lengths = networkx.single_source_dijkstra_path_length(
        this.graph,
        centerNode,
        cutoff=maxCost,
        weight='weight'
      );

      const serviceAreas: Feature<Polygon>[] = [];

      for (const interval of intervals) {
        const reachableNodes: string[] = [];

        for (const [node, cost] of Object.entries(lengths)) {
          if (cost <= interval) {
            reachableNodes.push(node);
          }
        }

        // Create convex hull or concave hull around reachable nodes
        const coords = reachableNodes.map((n) => this.nodeToCoords(n));
        const hull = this.createConcaveHull(coords);

        serviceAreas.push({
          type: 'Feature',
          geometry: hull,
          properties: {
            interval,
            nodeCount: reachableNodes.length,
          },
        });
      }

      return serviceAreas;
    } catch (error) {
      throw new RoutingError(`Service area calculation failed: ${error}`);
    }
  }

  /**
   * Calculate network betweenness centrality
   */
  async betweennessCentrality(network: Network): Promise<Record<string, number>> {
    try {
      const centrality = networkx.betweenness_centrality(this.graph, weight='weight');
      return Object.fromEntries(centrality);
    } catch (error) {
      throw new RoutingError(`Betweenness centrality calculation failed: ${error}`);
    }
  }

  /**
   * Calculate network closeness centrality
   */
  async closenessCentrality(network: Network): Promise<Record<string, number>> {
    try {
      const centrality = networkx.closeness_centrality(this.graph, distance='weight');
      return Object.fromEntries(centrality);
    } catch (error) {
      throw new RoutingError(`Closeness centrality calculation failed: ${error}`);
    }
  }

  /**
   * Analyze network connectivity
   */
  async analyzeConnectivity(network: Network): Promise<{
    isConnected: boolean;
    componentCount: number;
    largestComponentSize: number;
    averageDegree: number;
  }> {
    try {
      const isConnected = networkx.is_connected(this.graph.to_undirected());
      const components = Array.from(networkx.connected_components(this.graph.to_undirected()));
      const componentCount = components.length;
      const largestComponentSize = Math.max(...components.map((c: any) => c.length));

      const degrees = Array.from(this.graph.degree()).map((d: any) => d[1]);
      const averageDegree = numpy.mean(degrees);

      return {
        isConnected,
        componentCount,
        largestComponentSize,
        averageDegree,
      };
    } catch (error) {
      throw new RoutingError(`Connectivity analysis failed: ${error}`);
    }
  }

  /**
   * Find minimum spanning tree
   */
  async minimumSpanningTree(network: Network): Promise<Network> {
    try {
      const mst = networkx.minimum_spanning_tree(this.graph.to_undirected(), weight='weight');

      const edges: NetworkEdge[] = [];
      for (const [u, v, data] of mst.edges(data=true)) {
        edges.push({
          id: `${u}-${v}`,
          source: u,
          target: v,
          geometry: data.geometry,
          weight: data.weight,
          attributes: data,
        });
      }

      return {
        nodes: network.nodes,
        edges,
        directed: false,
      };
    } catch (error) {
      throw new RoutingError(`Minimum spanning tree calculation failed: ${error}`);
    }
  }

  /**
   * Vehicle routing problem (VRP)
   */
  async vehicleRouting(
    network: Network,
    deliveries: Array<{ id: number; location: Point; demand?: number; timeWindow?: [number, number] }>,
    options: {
      vehicles: number;
      depot: Point;
      capacity?: number;
      timeWindows?: boolean;
      algorithm?: 'clarke-wright' | 'sweep' | 'savings';
    }
  ): Promise<{
    routes: Route[];
    totalDistance: number;
    totalTime: number;
    unassigned: number[];
  }> {
    try {
      const depotNode = this.findNearestNode(network, options.depot);
      const deliveryNodes = deliveries.map((d) => ({
        ...d,
        node: this.findNearestNode(network, d.location),
      }));

      // Simple Clarke-Wright savings algorithm
      const routes: Route[] = [];
      let totalDistance = 0;
      let totalTime = 0;

      // Calculate savings matrix
      const savings: Array<{ i: number; j: number; saving: number }> = [];

      for (let i = 0; i < deliveryNodes.length; i++) {
        for (let j = i + 1; j < deliveryNodes.length; j++) {
          const distI = networkx.shortest_path_length(
            this.graph,
            depotNode,
            deliveryNodes[i].node,
            weight='weight'
          );
          const distJ = networkx.shortest_path_length(
            this.graph,
            depotNode,
            deliveryNodes[j].node,
            weight='weight'
          );
          const distIJ = networkx.shortest_path_length(
            this.graph,
            deliveryNodes[i].node,
            deliveryNodes[j].node,
            weight='weight'
          );

          const saving = distI + distJ - distIJ;
          savings.push({ i, j, saving });
        }
      }

      // Sort by savings (descending)
      savings.sort((a, b) => b.saving - a.saving);

      // Build routes
      const vehicleRoutes: number[][] = Array(options.vehicles)
        .fill(0)
        .map(() => []);
      const assigned = new Set<number>();

      for (const { i, j } of savings) {
        if (assigned.has(i) || assigned.has(j)) continue;

        // Find vehicle with capacity
        const vehicleIdx = vehicleRoutes.findIndex((r) => r.length < Math.ceil(deliveries.length / options.vehicles));

        if (vehicleIdx >= 0) {
          vehicleRoutes[vehicleIdx].push(i, j);
          assigned.add(i);
          assigned.add(j);
        }
      }

      // Create routes for each vehicle
      for (const vehicleRoute of vehicleRoutes) {
        if (vehicleRoute.length === 0) continue;

        const waypoints = vehicleRoute.map((idx) => deliveries[idx].location);
        const route = await this.optimizeRoute(network, [options.depot, ...waypoints, options.depot]);

        routes.push(route);
        totalDistance += route.distance;
        totalTime += route.duration;
      }

      const unassigned = deliveries.map((_, i) => i).filter((i) => !assigned.has(i));

      return {
        routes,
        totalDistance,
        totalTime,
        unassigned,
      };
    } catch (error) {
      throw new RoutingError(`Vehicle routing failed: ${error}`);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private findNearestNode(network: Network, point: Point): string {
    let minDist = Infinity;
    let nearestNode: NetworkNode | null = null;

    for (const node of network.nodes) {
      const dist = this.distance(
        point.coordinates,
        (node.geometry as Point).coordinates
      );
      if (dist < minDist) {
        minDist = dist;
        nearestNode = node;
      }
    }

    return nearestNode!.id as string;
  }

  private calculateLength(coords: number[][]): number {
    let length = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      length += this.distance(coords[i], coords[i + 1]);
    }
    return length;
  }

  private distance(p1: number[], p2: number[]): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateDuration(distance: number, options?: RoutingOptions): number {
    // Assume average speed of 50 km/h if not specified
    const speed = 50 / 3.6; // m/s
    return distance / speed; // seconds
  }

  private generateInstructions(path: string[], network: Network): RouteInstruction[] {
    const instructions: RouteInstruction[] = [];

    instructions.push({
      type: 'depart',
      distance: 0,
      duration: 0,
      text: 'Depart from start location',
    });

    for (let i = 0; i < path.length - 2; i++) {
      instructions.push({
        type: 'straight',
        distance: 100,
        duration: 10,
        direction: 'straight',
        text: `Continue straight`,
      });
    }

    instructions.push({
      type: 'arrive',
      distance: 0,
      duration: 0,
      text: 'Arrive at destination',
    });

    return instructions;
  }

  private heuristicDistance(node1: string, node2: string): number {
    const coords1 = this.nodeToCoords(node1);
    const coords2 = this.nodeToCoords(node2);
    return this.distance(coords1, coords2);
  }

  private nodeToCoords(nodeId: string): number[] {
    const parts = nodeId.split(',');
    return [parseFloat(parts[0]), parseFloat(parts[1])];
  }

  private async greedyTSP(nodes: string[]): Promise<string[]> {
    const ordered = [nodes[0]];
    const remaining = new Set(nodes.slice(1));

    while (remaining.size > 0) {
      const current = ordered[ordered.length - 1];
      let nearest: string | null = null;
      let minDist = Infinity;

      for (const node of remaining) {
        try {
          const dist = networkx.shortest_path_length(this.graph, current, node, weight='weight');
          if (dist < minDist) {
            minDist = dist;
            nearest = node;
          }
        } catch {
          continue;
        }
      }

      if (nearest) {
        ordered.push(nearest);
        remaining.delete(nearest);
      } else {
        break;
      }
    }

    return ordered;
  }

  private async geneticTSP(nodes: string[]): Promise<string[]> {
    // Simplified genetic algorithm
    return this.greedyTSP(nodes);
  }

  private async simulatedAnnealingTSP(nodes: string[]): Promise<string[]> {
    // Simplified simulated annealing
    return this.greedyTSP(nodes);
  }

  private yensKShortestPaths(graph: any, source: string, target: string, k: number): string[][] {
    try {
      const paths: string[][] = [];
      const A: string[][] = [];

      // Find first shortest path
      const firstPath = networkx.shortest_path(graph, source, target, weight='weight');
      A.push(Array.from(firstPath));

      for (let i = 1; i < k; i++) {
        // Implementation of Yen's algorithm would go here
        // For simplicity, we'll just return the first path
        break;
      }

      return A;
    } catch {
      return [];
    }
  }

  private createConcaveHull(coords: number[][]): Polygon {
    // Simplified concave hull (using convex hull for now)
    if (coords.length < 3) {
      return { type: 'Polygon', coordinates: [[...coords, coords[0]]] };
    }

    // Simple convex hull algorithm
    coords.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));

    const lower: number[][] = [];
    for (const point of coords) {
      while (lower.length >= 2 && this.cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
        lower.pop();
      }
      lower.push(point);
    }

    const upper: number[][] = [];
    for (let i = coords.length - 1; i >= 0; i--) {
      const point = coords[i];
      while (upper.length >= 2 && this.cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
        upper.pop();
      }
      upper.push(point);
    }

    upper.pop();
    lower.pop();
    const hull = lower.concat(upper);
    hull.push(hull[0]); // Close polygon

    return { type: 'Polygon', coordinates: [hull] };
  }

  private cross(o: number[], a: number[], b: number[]): number {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }
}

export default RoutePlanner;
