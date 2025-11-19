/**
 * Path Planning Algorithms
 *
 * Implements multiple path planning algorithms:
 * - RRT (Rapidly-exploring Random Tree)
 * - RRT* (Optimal RRT)
 * - RRT-Connect
 * - A* (A-star)
 * - Dijkstra
 */

// @ts-ignore
import numpy from 'python:numpy';

import {
  Vector3,
  Path,
  Waypoint,
  Obstacle,
  PathPlannerConfig,
  RRTNode,
  AStarNode,
  CollisionResult,
  BoundingBox
} from '../types';
import { distance, normalize } from '../kinematics/forward-kinematics';

/**
 * Path planner with multiple algorithms
 */
export class PathPlanner {
  private config: PathPlannerConfig;

  constructor(config: PathPlannerConfig) {
    this.config = config;
  }

  /**
   * Plan path from start to goal
   */
  public async planPath(
    start: Vector3,
    goal: Vector3,
    obstacles: Obstacle[]
  ): Promise<Path> {
    const startTime = performance.now();

    let path: Path;

    switch (this.config.algorithm) {
      case 'rrt':
        path = await this.planRRT(start, goal, obstacles);
        break;
      case 'rrt-star':
        path = await this.planRRTStar(start, goal, obstacles);
        break;
      case 'rrt-connect':
        path = await this.planRRTConnect(start, goal, obstacles);
        break;
      case 'a-star':
        path = await this.planAStar(start, goal, obstacles);
        break;
      case 'dijkstra':
        path = await this.planDijkstra(start, goal, obstacles);
        break;
      default:
        throw new Error(`Unknown algorithm: ${this.config.algorithm}`);
    }

    path.planningTime = performance.now() - startTime;
    path.algorithm = this.config.algorithm;

    return path;
  }

  /**
   * RRT (Rapidly-exploring Random Tree)
   */
  private async planRRT(
    start: Vector3,
    goal: Vector3,
    obstacles: Obstacle[]
  ): Promise<Path> {
    const tree: RRTNode[] = [{
      id: 0,
      position: start,
      parent: undefined,
      children: [],
      cost: 0
    }];

    const goalBias = this.config.goalBias || 0.1;
    let goalNode: RRTNode | undefined;

    for (let i = 0; i < this.config.maxIterations; i++) {
      // Sample random point (with goal bias)
      const randomPoint = Math.random() < goalBias
        ? goal
        : this.sampleRandomPoint();

      // Find nearest node in tree
      const nearest = this.findNearest(tree, randomPoint);

      // Steer towards random point
      const newPoint = this.steer(nearest.position, randomPoint, this.config.stepSize);

      // Check collision
      if (!this.checkCollisionLine(nearest.position, newPoint, obstacles)) {
        const newNode: RRTNode = {
          id: tree.length,
          position: newPoint,
          parent: nearest,
          children: [],
          cost: nearest.cost + distance(nearest.position, newPoint)
        };

        tree.push(newNode);
        nearest.children.push(newNode);

        // Check if goal reached
        if (distance(newPoint, goal) < this.config.stepSize) {
          goalNode = newNode;
          break;
        }
      }
    }

    if (!goalNode) {
      throw new Error('Failed to find path to goal');
    }

    // Extract path
    return this.extractPath(goalNode, goal);
  }

  /**
   * RRT* (Optimal RRT with rewiring)
   */
  private async planRRTStar(
    start: Vector3,
    goal: Vector3,
    obstacles: Obstacle[]
  ): Promise<Path> {
    const tree: RRTNode[] = [{
      id: 0,
      position: start,
      parent: undefined,
      children: [],
      cost: 0
    }];

    const goalBias = this.config.goalBias || 0.1;
    const rewireRadius = this.config.optimizationRadius || this.config.stepSize * 2;
    let goalNode: RRTNode | undefined;
    let bestCost = Infinity;

    for (let i = 0; i < this.config.maxIterations; i++) {
      const randomPoint = Math.random() < goalBias
        ? goal
        : this.sampleRandomPoint();

      const nearest = this.findNearest(tree, randomPoint);
      const newPoint = this.steer(nearest.position, randomPoint, this.config.stepSize);

      if (!this.checkCollisionLine(nearest.position, newPoint, obstacles)) {
        // Find near nodes for rewiring
        const nearNodes = this.findNearNodes(tree, newPoint, rewireRadius);

        // Find best parent
        let bestParent = nearest;
        let minCost = nearest.cost + distance(nearest.position, newPoint);

        for (const nearNode of nearNodes) {
          const cost = nearNode.cost + distance(nearNode.position, newPoint);
          if (cost < minCost && !this.checkCollisionLine(nearNode.position, newPoint, obstacles)) {
            bestParent = nearNode;
            minCost = cost;
          }
        }

        const newNode: RRTNode = {
          id: tree.length,
          position: newPoint,
          parent: bestParent,
          children: [],
          cost: minCost
        };

        tree.push(newNode);
        bestParent.children.push(newNode);

        // Rewire tree
        for (const nearNode of nearNodes) {
          const newCost = newNode.cost + distance(newNode.position, nearNode.position);
          if (newCost < nearNode.cost && !this.checkCollisionLine(newNode.position, nearNode.position, obstacles)) {
            // Remove from old parent
            if (nearNode.parent) {
              const idx = nearNode.parent.children.indexOf(nearNode);
              if (idx >= 0) {
                nearNode.parent.children.splice(idx, 1);
              }
            }

            // Set new parent
            nearNode.parent = newNode;
            nearNode.cost = newCost;
            newNode.children.push(nearNode);

            // Update costs of descendants
            this.updateDescendantCosts(nearNode);
          }
        }

        // Check if goal reached
        const distToGoal = distance(newPoint, goal);
        if (distToGoal < this.config.stepSize) {
          if (!goalNode || newNode.cost < bestCost) {
            goalNode = newNode;
            bestCost = newNode.cost;
          }
        }
      }
    }

    if (!goalNode) {
      throw new Error('Failed to find path to goal');
    }

    return this.extractPath(goalNode, goal);
  }

  /**
   * RRT-Connect (bidirectional RRT)
   */
  private async planRRTConnect(
    start: Vector3,
    goal: Vector3,
    obstacles: Obstacle[]
  ): Promise<Path> {
    const treeStart: RRTNode[] = [{
      id: 0,
      position: start,
      parent: undefined,
      children: [],
      cost: 0
    }];

    const treeGoal: RRTNode[] = [{
      id: 0,
      position: goal,
      parent: undefined,
      children: [],
      cost: 0
    }];

    for (let i = 0; i < this.config.maxIterations; i++) {
      // Extend start tree
      const randomPoint = this.sampleRandomPoint();
      const { reached, node: newNodeStart } = this.extend(treeStart, randomPoint, obstacles);

      if (newNodeStart) {
        // Try to connect from goal tree
        const { reached: connected, node: newNodeGoal } = this.extend(
          treeGoal,
          newNodeStart.position,
          obstacles
        );

        if (connected && newNodeGoal) {
          // Path found!
          const pathStart = this.extractPath(newNodeStart, newNodeStart.position);
          const pathGoal = this.extractPath(newNodeGoal, newNodeGoal.position);

          // Combine paths
          const waypoints = [
            ...pathStart.waypoints,
            ...pathGoal.waypoints.reverse()
          ];

          return {
            waypoints,
            totalLength: this.computePathLength(waypoints),
            planningTime: 0,
            algorithm: 'rrt-connect'
          };
        }
      }

      // Swap trees for balanced growth
      [treeStart, treeGoal] = [treeGoal, treeStart];
    }

    throw new Error('Failed to find path to goal');
  }

  /**
   * A* pathfinding on grid
   */
  private async planAStar(
    start: Vector3,
    goal: Vector3,
    obstacles: Obstacle[]
  ): Promise<Path> {
    const gridResolution = 0.1; // 10cm resolution
    const startNode = this.createAStarNode(start, goal, 0);
    const openSet: AStarNode[] = [startNode];
    const closedSet = new Set<string>();

    while (openSet.length > 0) {
      // Find node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      const currentKey = this.positionToKey(current.position);
      if (closedSet.has(currentKey)) {
        continue;
      }

      // Check if goal reached
      if (distance(current.position, goal) < gridResolution) {
        return this.extractAStarPath(current, goal);
      }

      closedSet.add(currentKey);

      // Explore neighbors
      const neighbors = this.getNeighbors(current.position, gridResolution);

      for (const neighbor of neighbors) {
        const neighborKey = this.positionToKey(neighbor);

        if (closedSet.has(neighborKey)) {
          continue;
        }

        // Check collision
        if (this.checkCollisionPoint(neighbor, obstacles)) {
          continue;
        }

        const g = current.g + distance(current.position, neighbor);
        const h = this.heuristic(neighbor, goal);
        const f = g + h;

        const neighborNode: AStarNode = {
          position: neighbor,
          g,
          h,
          f,
          parent: current
        };

        openSet.push(neighborNode);
      }
    }

    throw new Error('Failed to find path to goal');
  }

  /**
   * Dijkstra pathfinding
   */
  private async planDijkstra(
    start: Vector3,
    goal: Vector3,
    obstacles: Obstacle[]
  ): Promise<Path> {
    // Similar to A* but h = 0 (no heuristic)
    const gridResolution = 0.1;
    const startNode: AStarNode = {
      position: start,
      g: 0,
      h: 0,
      f: 0
    };

    const openSet: AStarNode[] = [startNode];
    const closedSet = new Set<string>();

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.g - b.g);
      const current = openSet.shift()!;

      const currentKey = this.positionToKey(current.position);
      if (closedSet.has(currentKey)) {
        continue;
      }

      if (distance(current.position, goal) < gridResolution) {
        return this.extractAStarPath(current, goal);
      }

      closedSet.add(currentKey);

      const neighbors = this.getNeighbors(current.position, gridResolution);

      for (const neighbor of neighbors) {
        const neighborKey = this.positionToKey(neighbor);

        if (closedSet.has(neighborKey) || this.checkCollisionPoint(neighbor, obstacles)) {
          continue;
        }

        const g = current.g + distance(current.position, neighbor);

        const neighborNode: AStarNode = {
          position: neighbor,
          g,
          h: 0,
          f: g,
          parent: current
        };

        openSet.push(neighborNode);
      }
    }

    throw new Error('Failed to find path to goal');
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Sample random point in workspace
   */
  private sampleRandomPoint(): Vector3 {
    const { min, max } = this.config.workspace;
    return {
      x: min.x + Math.random() * (max.x - min.x),
      y: min.y + Math.random() * (max.y - min.y),
      z: min.z + Math.random() * (max.z - min.z)
    };
  }

  /**
   * Find nearest node to point
   */
  private findNearest(tree: RRTNode[], point: Vector3): RRTNode {
    let nearest = tree[0];
    let minDist = distance(tree[0].position, point);

    for (const node of tree) {
      const dist = distance(node.position, point);
      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    }

    return nearest;
  }

  /**
   * Steer from one point towards another
   */
  private steer(from: Vector3, to: Vector3, stepSize: number): Vector3 {
    const dist = distance(from, to);

    if (dist <= stepSize) {
      return to;
    }

    const direction = normalize({
      x: to.x - from.x,
      y: to.y - from.y,
      z: to.z - from.z
    });

    return {
      x: from.x + direction.x * stepSize,
      y: from.y + direction.y * stepSize,
      z: from.z + direction.z * stepSize
    };
  }

  /**
   * Find nodes within radius
   */
  private findNearNodes(tree: RRTNode[], point: Vector3, radius: number): RRTNode[] {
    return tree.filter(node => distance(node.position, point) < radius);
  }

  /**
   * Update costs of all descendants
   */
  private updateDescendantCosts(node: RRTNode): void {
    for (const child of node.children) {
      child.cost = node.cost + distance(node.position, child.position);
      this.updateDescendantCosts(child);
    }
  }

  /**
   * Extend tree towards point
   */
  private extend(
    tree: RRTNode[],
    target: Vector3,
    obstacles: Obstacle[]
  ): { reached: boolean; node?: RRTNode } {
    const nearest = this.findNearest(tree, target);
    const newPoint = this.steer(nearest.position, target, this.config.stepSize);

    if (this.checkCollisionLine(nearest.position, newPoint, obstacles)) {
      return { reached: false };
    }

    const newNode: RRTNode = {
      id: tree.length,
      position: newPoint,
      parent: nearest,
      children: [],
      cost: nearest.cost + distance(nearest.position, newPoint)
    };

    tree.push(newNode);
    nearest.children.push(newNode);

    const reached = distance(newPoint, target) < this.config.stepSize;
    return { reached, node: newNode };
  }

  /**
   * Extract path from RRT node
   */
  private extractPath(node: RRTNode, goal: Vector3): Path {
    const waypoints: Waypoint[] = [];
    let current: RRTNode | undefined = node;

    while (current) {
      waypoints.unshift({ position: current.position });
      current = current.parent;
    }

    waypoints.push({ position: goal });

    return {
      waypoints,
      totalLength: this.computePathLength(waypoints),
      planningTime: 0,
      algorithm: this.config.algorithm,
      cost: node.cost
    };
  }

  /**
   * Extract path from A* node
   */
  private extractAStarPath(node: AStarNode, goal: Vector3): Path {
    const waypoints: Waypoint[] = [];
    let current: AStarNode | undefined = node;

    while (current) {
      waypoints.unshift({ position: current.position });
      current = current.parent;
    }

    waypoints.push({ position: goal });

    return {
      waypoints,
      totalLength: this.computePathLength(waypoints),
      planningTime: 0,
      algorithm: this.config.algorithm
    };
  }

  /**
   * Compute total path length
   */
  private computePathLength(waypoints: Waypoint[]): number {
    let length = 0;
    for (let i = 1; i < waypoints.length; i++) {
      length += distance(waypoints[i - 1].position, waypoints[i].position);
    }
    return length;
  }

  /**
   * Check collision along line
   */
  public checkCollisionLine(
    from: Vector3,
    to: Vector3,
    obstacles: Obstacle[]
  ): boolean {
    const resolution = this.config.collisionCheckResolution || 0.05;
    const dist = distance(from, to);
    const steps = Math.ceil(dist / resolution);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = {
        x: from.x + t * (to.x - from.x),
        y: from.y + t * (to.y - from.y),
        z: from.z + t * (to.z - from.z)
      };

      if (this.checkCollisionPoint(point, obstacles)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check collision at point
   */
  public checkCollisionPoint(point: Vector3, obstacles: Obstacle[]): boolean {
    for (const obstacle of obstacles) {
      if (this.pointInObstacle(point, obstacle)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if point is inside obstacle
   */
  private pointInObstacle(point: Vector3, obstacle: Obstacle): boolean {
    switch (obstacle.type) {
      case 'sphere':
        return distance(point, obstacle.position) <= (obstacle.radius || 0);

      case 'box': {
        const halfSize = {
          x: (obstacle.size?.x || 0) / 2,
          y: (obstacle.size?.y || 0) / 2,
          z: (obstacle.size?.z || 0) / 2
        };

        return (
          Math.abs(point.x - obstacle.position.x) <= halfSize.x &&
          Math.abs(point.y - obstacle.position.y) <= halfSize.y &&
          Math.abs(point.z - obstacle.position.z) <= halfSize.z
        );
      }

      case 'cylinder': {
        const dx = point.x - obstacle.position.x;
        const dy = point.y - obstacle.position.y;
        const dz = point.z - obstacle.position.z;
        const radialDist = Math.sqrt(dx * dx + dy * dy);

        return (
          radialDist <= (obstacle.radius || 0) &&
          Math.abs(dz) <= (obstacle.height || 0) / 2
        );
      }

      default:
        return false;
    }
  }

  /**
   * Create A* node
   */
  private createAStarNode(position: Vector3, goal: Vector3, g: number): AStarNode {
    const h = this.heuristic(position, goal);
    return {
      position,
      g,
      h,
      f: g + h
    };
  }

  /**
   * Heuristic function for A*
   */
  private heuristic(from: Vector3, to: Vector3): number {
    // Euclidean distance
    return distance(from, to);
  }

  /**
   * Get neighboring grid positions
   */
  private getNeighbors(position: Vector3, resolution: number): Vector3[] {
    const neighbors: Vector3[] = [];

    // 26-connected grid (3D)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) {
            continue;
          }

          neighbors.push({
            x: position.x + dx * resolution,
            y: position.y + dy * resolution,
            z: position.z + dz * resolution
          });
        }
      }
    }

    return neighbors;
  }

  /**
   * Convert position to string key
   */
  private positionToKey(position: Vector3): string {
    const precision = 2;
    return `${position.x.toFixed(precision)},${position.y.toFixed(precision)},${position.z.toFixed(precision)}`;
  }

  /**
   * Optimize path (smoothing)
   */
  public optimizePath(path: Path, obstacles: Obstacle[]): Path {
    const waypoints = [...path.waypoints];
    let i = 0;

    while (i < waypoints.length - 2) {
      // Try to connect i directly to i+2 (skip i+1)
      if (!this.checkCollisionLine(
        waypoints[i].position,
        waypoints[i + 2].position,
        obstacles
      )) {
        waypoints.splice(i + 1, 1);
      } else {
        i++;
      }
    }

    return {
      ...path,
      waypoints,
      totalLength: this.computePathLength(waypoints)
    };
  }

  /**
   * Check if path is blocked
   */
  public pathBlocked(path: Path, obstacles: Obstacle[]): boolean {
    for (let i = 1; i < path.waypoints.length; i++) {
      if (this.checkCollisionLine(
        path.waypoints[i - 1].position,
        path.waypoints[i].position,
        obstacles
      )) {
        return true;
      }
    }
    return false;
  }

  /**
   * Replan local path
   */
  public async replanLocal(
    current: Vector3,
    globalPath: Path,
    obstacles: Obstacle[]
  ): Promise<Path> {
    // Find nearest waypoint ahead
    let targetWaypoint = globalPath.waypoints[globalPath.waypoints.length - 1];

    for (const waypoint of globalPath.waypoints) {
      if (distance(current, waypoint.position) > this.config.stepSize * 5) {
        targetWaypoint = waypoint;
        break;
      }
    }

    return this.planPath(current, targetWaypoint.position, obstacles);
  }
}

export default PathPlanner;
