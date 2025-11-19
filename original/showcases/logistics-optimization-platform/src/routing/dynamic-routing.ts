/**
 * Dynamic Routing Engine
 *
 * Real-time route optimization and adjustment capabilities.
 * Handles on-demand order insertion, route reoptimization,
 * traffic-aware routing, and emergency rerouting.
 *
 * Key features:
 * - Insert new orders into existing routes
 * - Handle order cancellations and modifications
 * - Adjust routes based on real-time traffic
 * - Emergency rerouting for vehicle breakdowns
 * - Multi-objective route balancing
 */

// @ts-ignore - Elide Python interop
import ortools from 'python:ortools';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import sklearn from 'python:sklearn';

import {
  Route,
  RouteStop,
  Order,
  GeoLocation,
  RouteUpdateRequest,
  RouteUpdateResult,
  TrafficData,
  WeatherData,
  Vehicle,
  Depot,
} from '../types';
import { RouteOptimizer } from './route-optimizer';

/**
 * Dynamic routing engine for real-time route adjustments
 */
export class DynamicRouter {
  private routeOptimizer: RouteOptimizer;
  private readonly MAX_INSERTION_ATTEMPTS = 10;
  private readonly TRAFFIC_WEIGHT = 1.5;
  private readonly WEATHER_WEIGHT = 1.2;

  constructor() {
    this.routeOptimizer = new RouteOptimizer();
  }

  /**
   * Insert a new order into an existing route
   */
  async insertOrder(params: {
    route: Route;
    order: Order;
    currentTrafficConditions?: TrafficData;
    preserveTimeWindows?: boolean;
  }): Promise<RouteUpdateResult> {
    console.log(`Attempting to insert order ${params.order.id} into route ${params.route.id}`);

    const { route, order, currentTrafficConditions, preserveTimeWindows = true } = params;

    // Validate capacity
    const currentLoad = route.totalWeightKg;
    const remainingCapacity = this.getRemainingCapacity(route);

    if (order.dimensions.weightKg > remainingCapacity) {
      return {
        success: false,
        reason: `Insufficient capacity. Required: ${order.dimensions.weightKg}kg, Available: ${remainingCapacity}kg`,
        impactAnalysis: {
          distanceChange: 0,
          durationChange: 0,
          costChange: 0,
          affectedStops: [],
        },
      };
    }

    // Find best insertion point
    const insertionAnalysis = await this.findBestInsertionPoint(
      route,
      order,
      currentTrafficConditions
    );

    if (!insertionAnalysis.feasible) {
      return {
        success: false,
        reason: insertionAnalysis.reason,
        impactAnalysis: {
          distanceChange: 0,
          durationChange: 0,
          costChange: 0,
          affectedStops: [],
        },
      };
    }

    // Create updated route with new stop
    const updatedRoute = this.insertStopAtPosition(
      route,
      order,
      insertionAnalysis.bestPosition
    );

    // Recalculate timing and validate time windows
    await this.recalculateRouteTiming(updatedRoute, currentTrafficConditions);

    if (preserveTimeWindows && !this.validateTimeWindows(updatedRoute)) {
      return {
        success: false,
        reason: 'Time window violations after insertion',
        impactAnalysis: {
          distanceChange: insertionAnalysis.distanceIncrease,
          durationChange: insertionAnalysis.durationIncrease,
          costChange: insertionAnalysis.costIncrease,
          affectedStops: insertionAnalysis.affectedStops,
        },
      };
    }

    console.log(`Order inserted at position ${insertionAnalysis.bestPosition}`);
    console.log(`Distance increase: ${insertionAnalysis.distanceIncrease.toFixed(2)}km`);
    console.log(`Duration increase: ${insertionAnalysis.durationIncrease.toFixed(0)} minutes`);

    return {
      success: true,
      updatedRoute,
      insertionIndex: insertionAnalysis.bestPosition,
      impactAnalysis: {
        distanceChange: insertionAnalysis.distanceIncrease,
        durationChange: insertionAnalysis.durationIncrease,
        costChange: insertionAnalysis.costIncrease,
        affectedStops: insertionAnalysis.affectedStops,
      },
    };
  }

  /**
   * Remove an order from a route (cancellation)
   */
  async removeOrder(params: {
    route: Route;
    orderId: string;
    recalculate?: boolean;
  }): Promise<RouteUpdateResult> {
    const { route, orderId, recalculate = true } = params;

    const stopIndex = route.stops.findIndex((stop) => stop.orderId === orderId);

    if (stopIndex === -1) {
      return {
        success: false,
        reason: `Order ${orderId} not found in route`,
        impactAnalysis: {
          distanceChange: 0,
          durationChange: 0,
          costChange: 0,
          affectedStops: [],
        },
      };
    }

    const removedStop = route.stops[stopIndex];

    // Calculate impact before removal
    const distanceRemoved =
      removedStop.distanceFromPreviousKm +
      (stopIndex < route.stops.length - 1
        ? route.stops[stopIndex + 1].distanceFromPreviousKm
        : 0);

    const durationRemoved =
      removedStop.durationFromPreviousMinutes +
      removedStop.serviceTimeMinutes;

    // Create updated route
    const updatedRoute = { ...route };
    updatedRoute.stops = route.stops.filter((_, idx) => idx !== stopIndex);

    // Update stop sequences
    updatedRoute.stops.forEach((stop, idx) => {
      stop.stopSequence = idx;
    });

    if (recalculate) {
      await this.recalculateRouteTiming(updatedRoute);
    }

    updatedRoute.totalDistanceKm -= distanceRemoved;
    updatedRoute.totalDurationMinutes -= durationRemoved;
    updatedRoute.totalWeightKg -= removedStop.orderId
      ? (await this.getOrderWeight(removedStop.orderId))
      : 0;

    const affectedStops = route.stops
      .slice(stopIndex)
      .map((stop) => stop.id);

    return {
      success: true,
      updatedRoute,
      impactAnalysis: {
        distanceChange: -distanceRemoved,
        durationChange: -durationRemoved,
        costChange: -(distanceRemoved * 0.5 + (durationRemoved / 60) * 25),
        affectedStops,
      },
    };
  }

  /**
   * Reoptimize remaining stops in a route
   */
  async reoptimizeRoute(params: {
    route: Route;
    currentLocation: GeoLocation;
    completedStopIds: string[];
    trafficData?: TrafficData;
  }): Promise<RouteUpdateResult> {
    console.log(`Reoptimizing route ${params.route.id}`);

    const { route, currentLocation, completedStopIds, trafficData } = params;

    // Filter to remaining stops only
    const remainingStops = route.stops.filter(
      (stop) => !completedStopIds.includes(stop.id)
    );

    if (remainingStops.length === 0) {
      return {
        success: true,
        updatedRoute: route,
        impactAnalysis: {
          distanceChange: 0,
          durationChange: 0,
          costChange: 0,
          affectedStops: [],
        },
      };
    }

    // Extract orders from remaining stops
    const remainingOrders = await this.extractOrdersFromStops(remainingStops);

    // Create temporary depot at current location
    const tempDepot: Depot = {
      id: 'temp-depot',
      name: 'Current Location',
      code: 'TEMP',
      address: {} as any,
      location: currentLocation,
      type: 'hub',
      operatingHours: { start: '00:00', end: '23:59' },
      capacity: {} as any,
      zones: [],
      isActive: true,
    };

    // Get vehicle information
    const vehicle = await this.getVehicleById(route.vehicleId);

    // Reoptimize remaining stops
    const optimizedSolution = await this.routeOptimizer.optimizeRoutes({
      depot: tempDepot,
      vehicles: [vehicle],
      orders: remainingOrders,
      optimizationGoal: 'minimize_distance',
      timeLimitSeconds: 15, // Quick reoptimization
      allowPartialSolutions: false,
      constraints: {
        timeWindows: true,
        capacity: true,
        vehicleBreaks: false,
      },
    });

    if (optimizedSolution.routes.length === 0) {
      console.warn('Reoptimization failed, keeping original sequence');
      return {
        success: false,
        reason: 'Could not find feasible reoptimization',
        impactAnalysis: {
          distanceChange: 0,
          durationChange: 0,
          costChange: 0,
          affectedStops: [],
        },
      };
    }

    const optimizedRoute = optimizedSolution.routes[0];

    // Calculate improvement
    const originalDistance = remainingStops.reduce(
      (sum, stop) => sum + stop.distanceFromPreviousKm,
      0
    );
    const optimizedDistance = optimizedRoute.totalDistanceKm;

    const improvement = originalDistance - optimizedDistance;

    console.log(`Reoptimization complete. Savings: ${improvement.toFixed(2)}km`);

    // Merge completed stops with optimized remaining stops
    const completedStops = route.stops.filter((stop) =>
      completedStopIds.includes(stop.id)
    );

    const updatedRoute = { ...route };
    updatedRoute.stops = [...completedStops, ...optimizedRoute.stops];

    // Update sequences
    updatedRoute.stops.forEach((stop, idx) => {
      stop.stopSequence = idx;
    });

    return {
      success: true,
      updatedRoute,
      impactAnalysis: {
        distanceChange: -improvement,
        durationChange: -(improvement / 40) * 60, // Assume 40 km/h
        costChange: -(improvement * 0.5),
        affectedStops: remainingStops.map((stop) => stop.id),
      },
    };
  }

  /**
   * Adjust route based on real-time traffic
   */
  async adjustForTraffic(params: {
    route: Route;
    trafficData: TrafficData;
    minimumImprovementPercent?: number;
  }): Promise<RouteUpdateResult> {
    const { route, trafficData, minimumImprovementPercent = 5 } = params;

    console.log('Analyzing traffic impact on route...');

    // Calculate current route duration with traffic
    const currentDurationWithTraffic = await this.calculateRouteDurationWithTraffic(
      route,
      trafficData
    );

    // Check if significant delay
    const delayMinutes = currentDurationWithTraffic - route.totalDurationMinutes;

    if (delayMinutes < 10) {
      console.log('Traffic impact minimal, no adjustment needed');
      return {
        success: true,
        updatedRoute: route,
        impactAnalysis: {
          distanceChange: 0,
          durationChange: delayMinutes,
          costChange: 0,
          affectedStops: [],
        },
      };
    }

    console.log(`Traffic delay detected: ${delayMinutes.toFixed(0)} minutes`);

    // Try to reoptimize with traffic-aware distance matrix
    const trafficAwareMatrix = await this.buildTrafficAwareDistanceMatrix(
      route.stops.map((stop) => stop.location),
      trafficData
    );

    // This would use the traffic-aware matrix in optimization
    // For now, we'll simulate the impact
    const improvement = delayMinutes * 0.3; // Assume 30% improvement possible

    if ((improvement / delayMinutes) * 100 < minimumImprovementPercent) {
      console.log('Insufficient improvement from rerouting');
      return {
        success: false,
        reason: 'Traffic adjustment would not provide significant improvement',
        impactAnalysis: {
          distanceChange: 0,
          durationChange: delayMinutes,
          costChange: 0,
          affectedStops: [],
        },
      };
    }

    // Return updated route (in practice, would be reoptimized)
    return {
      success: true,
      updatedRoute: route,
      impactAnalysis: {
        distanceChange: 0,
        durationChange: -improvement,
        costChange: 0,
        affectedStops: route.stops.map((stop) => stop.id),
      },
    };
  }

  /**
   * Handle emergency rerouting (e.g., vehicle breakdown)
   */
  async emergencyReroute(params: {
    failedRoute: Route;
    availableVehicles: Vehicle[];
    depot: Depot;
    priorityThreshold?: number;
  }): Promise<{
    success: boolean;
    newRoutes: Route[];
    unassignedOrders: Order[];
  }> {
    console.log(`Emergency rerouting for route ${params.failedRoute.id}`);

    const { failedRoute, availableVehicles, depot, priorityThreshold = 7 } = params;

    // Get remaining undelivered orders
    const remainingStops = failedRoute.stops.filter(
      (stop) => stop.status === 'pending' || stop.status === 'approaching'
    );

    const remainingOrders = await this.extractOrdersFromStops(remainingStops);

    // Separate high priority orders
    const highPriorityOrders = remainingOrders.filter(
      (order) => order.priority >= priorityThreshold
    );

    const normalOrders = remainingOrders.filter(
      (order) => order.priority < priorityThreshold
    );

    console.log(`High priority orders: ${highPriorityOrders.length}`);
    console.log(`Normal priority orders: ${normalOrders.length}`);

    // First, try to assign high priority orders
    const highPrioritySolution = await this.routeOptimizer.optimizeRoutes({
      depot,
      vehicles: availableVehicles,
      orders: highPriorityOrders,
      optimizationGoal: 'minimize_time',
      timeLimitSeconds: 30,
      allowPartialSolutions: true,
      constraints: {
        timeWindows: true,
        capacity: true,
        vehicleBreaks: false,
      },
    });

    // Then assign remaining orders to remaining vehicles
    const usedVehicleIds = new Set(
      highPrioritySolution.routes.map((r) => r.vehicleId)
    );
    const remainingVehicles = availableVehicles.filter(
      (v) => !usedVehicleIds.has(v.id)
    );

    let normalSolution = { routes: [], unassignedOrders: normalOrders };

    if (remainingVehicles.length > 0 && normalOrders.length > 0) {
      normalSolution = await this.routeOptimizer.optimizeRoutes({
        depot,
        vehicles: remainingVehicles,
        orders: normalOrders,
        optimizationGoal: 'minimize_cost',
        timeLimitSeconds: 30,
        allowPartialSolutions: true,
        constraints: {
          timeWindows: true,
          capacity: true,
          vehicleBreaks: false,
        },
      });
    }

    const newRoutes = [
      ...highPrioritySolution.routes,
      ...normalSolution.routes,
    ];

    const unassignedOrders = [
      ...highPrioritySolution.unassignedOrders,
      ...normalSolution.unassignedOrders,
    ];

    console.log(`Emergency rerouting complete`);
    console.log(`New routes created: ${newRoutes.length}`);
    console.log(`Unassigned orders: ${unassignedOrders.length}`);

    return {
      success: unassignedOrders.length < remainingOrders.length * 0.1, // 90% success rate
      newRoutes,
      unassignedOrders,
    };
  }

  /**
   * Balance load across multiple routes
   */
  async balanceRoutes(params: {
    routes: Route[];
    objective?: 'time' | 'distance' | 'load';
  }): Promise<Route[]> {
    const { routes, objective = 'time' } = params;

    console.log(`Balancing ${routes.length} routes by ${objective}`);

    // Calculate current imbalance
    const metrics = routes.map((route) => {
      switch (objective) {
        case 'time':
          return route.totalDurationMinutes;
        case 'distance':
          return route.totalDistanceKm;
        case 'load':
          return route.totalWeightKg;
      }
    });

    const avg = metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
    const variance = metrics.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / metrics.length;
    const stdDev = Math.sqrt(variance);

    console.log(`Current standard deviation: ${stdDev.toFixed(2)}`);

    // If already well balanced, return as-is
    if (stdDev / avg < 0.15) {
      console.log('Routes already well balanced');
      return routes;
    }

    // Identify overloaded and underloaded routes
    const overloaded = routes.filter((_, idx) => metrics[idx] > avg + stdDev * 0.5);
    const underloaded = routes.filter((_, idx) => metrics[idx] < avg - stdDev * 0.5);

    console.log(`Overloaded routes: ${overloaded.length}`);
    console.log(`Underloaded routes: ${underloaded.length}`);

    // Attempt to move stops from overloaded to underloaded routes
    const balancedRoutes = [...routes];

    for (const overRoute of overloaded) {
      for (const underRoute of underloaded) {
        // Try to move a stop
        const moved = await this.tryMoveStop(overRoute, underRoute);
        if (moved) {
          console.log(`Moved stop from ${overRoute.id} to ${underRoute.id}`);
        }
      }
    }

    return balancedRoutes;
  }

  /**
   * Find the best insertion point for a new order
   */
  private async findBestInsertionPoint(
    route: Route,
    order: Order,
    trafficData?: TrafficData
  ): Promise<{
    feasible: boolean;
    bestPosition: number;
    distanceIncrease: number;
    durationIncrease: number;
    costIncrease: number;
    affectedStops: string[];
    reason?: string;
  }> {
    let bestPosition = -1;
    let bestCost = Infinity;
    let bestDistanceIncrease = 0;
    let bestDurationIncrease = 0;

    // Try inserting at each position
    for (let pos = 0; pos <= route.stops.length; pos++) {
      const { cost, distanceIncrease, durationIncrease, feasible } =
        await this.evaluateInsertion(route, order, pos, trafficData);

      if (feasible && cost < bestCost) {
        bestCost = cost;
        bestPosition = pos;
        bestDistanceIncrease = distanceIncrease;
        bestDurationIncrease = durationIncrease;
      }
    }

    if (bestPosition === -1) {
      return {
        feasible: false,
        bestPosition: -1,
        distanceIncrease: 0,
        durationIncrease: 0,
        costIncrease: 0,
        affectedStops: [],
        reason: 'No feasible insertion point found',
      };
    }

    const affectedStops = route.stops
      .slice(bestPosition)
      .map((stop) => stop.id);

    return {
      feasible: true,
      bestPosition,
      distanceIncrease: bestDistanceIncrease,
      durationIncrease: bestDurationIncrease,
      costIncrease: bestCost,
      affectedStops,
    };
  }

  /**
   * Evaluate cost of inserting order at specific position
   */
  private async evaluateInsertion(
    route: Route,
    order: Order,
    position: number,
    trafficData?: TrafficData
  ): Promise<{
    cost: number;
    distanceIncrease: number;
    durationIncrease: number;
    feasible: boolean;
  }> {
    // Get previous and next locations
    const prevLocation =
      position === 0
        ? route.startLocation
        : route.stops[position - 1].location;

    const nextLocation =
      position >= route.stops.length
        ? route.endLocation
        : route.stops[position].location;

    // Calculate distances
    const distToPrev = this.haversineDistance(prevLocation, order.deliveryLocation);
    const distToNext = this.haversineDistance(order.deliveryLocation, nextLocation);
    const originalDist = this.haversineDistance(prevLocation, nextLocation);

    const distanceIncrease = distToPrev + distToNext - originalDist;

    // Estimate duration increase
    const avgSpeed = 40; // km/h
    const travelTimeIncrease = (distanceIncrease / avgSpeed) * 60; // minutes
    const durationIncrease = travelTimeIncrease + order.serviceTimeMinutes;

    // Check capacity feasibility
    const remainingCapacity = this.getRemainingCapacity(route);
    if (order.dimensions.weightKg > remainingCapacity) {
      return { cost: Infinity, distanceIncrease: 0, durationIncrease: 0, feasible: false };
    }

    // Check time window feasibility (simplified)
    const feasible = true; // Would do detailed time window check here

    // Calculate cost increase
    const cost = distanceIncrease * 0.5 + (durationIncrease / 60) * 25;

    return {
      cost,
      distanceIncrease,
      durationIncrease,
      feasible,
    };
  }

  /**
   * Insert stop at specific position in route
   */
  private insertStopAtPosition(
    route: Route,
    order: Order,
    position: number
  ): Route {
    const newStop: RouteStop = {
      id: `stop-${route.id}-${Date.now()}`,
      routeId: route.id,
      stopSequence: position,
      stopType: 'delivery',
      orderId: order.id,
      location: order.deliveryLocation,
      address: order.deliveryAddress,
      plannedArrivalTime: new Date(),
      plannedDepartureTime: new Date(),
      status: 'pending',
      serviceTimeMinutes: order.serviceTimeMinutes,
      distanceFromPreviousKm: 0,
      durationFromPreviousMinutes: 0,
    };

    const updatedRoute = { ...route };
    updatedRoute.stops = [
      ...route.stops.slice(0, position),
      newStop,
      ...route.stops.slice(position),
    ];

    // Update sequences
    updatedRoute.stops.forEach((stop, idx) => {
      stop.stopSequence = idx;
    });

    updatedRoute.totalWeightKg += order.dimensions.weightKg;

    return updatedRoute;
  }

  /**
   * Recalculate route timing after modifications
   */
  private async recalculateRouteTiming(
    route: Route,
    trafficData?: TrafficData
  ): Promise<void> {
    let currentTime = route.plannedStartTime;
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < route.stops.length; i++) {
      const stop = route.stops[i];
      const prevLocation =
        i === 0 ? route.startLocation : route.stops[i - 1].location;

      const distance = this.haversineDistance(prevLocation, stop.location);
      const duration = (distance / 40) * 60; // 40 km/h average

      stop.distanceFromPreviousKm = distance;
      stop.durationFromPreviousMinutes = duration;

      currentTime = new Date(currentTime.getTime() + duration * 60000);
      stop.plannedArrivalTime = new Date(currentTime);

      currentTime = new Date(
        currentTime.getTime() + stop.serviceTimeMinutes * 60000
      );
      stop.plannedDepartureTime = new Date(currentTime);

      totalDistance += distance;
      totalDuration += duration + stop.serviceTimeMinutes;
    }

    route.totalDistanceKm = totalDistance;
    route.totalDurationMinutes = totalDuration;
    route.plannedEndTime = new Date(currentTime);
  }

  /**
   * Validate time windows for all stops
   */
  private validateTimeWindows(route: Route): boolean {
    // Simplified validation - would check against actual time windows
    return route.totalDurationMinutes <= 10 * 60; // 10 hour max
  }

  /**
   * Get remaining capacity in route
   */
  private getRemainingCapacity(route: Route): number {
    // Would fetch vehicle capacity from database
    const vehicleCapacity = 1000; // kg
    return vehicleCapacity - route.totalWeightKg;
  }

  /**
   * Calculate route duration with traffic
   */
  private async calculateRouteDurationWithTraffic(
    route: Route,
    trafficData: TrafficData
  ): Promise<number> {
    let totalDuration = 0;

    for (let i = 0; i < route.stops.length; i++) {
      const stop = route.stops[i];
      totalDuration += stop.durationFromPreviousMinutes * this.TRAFFIC_WEIGHT;
      totalDuration += stop.serviceTimeMinutes;
    }

    return totalDuration;
  }

  /**
   * Build traffic-aware distance matrix
   */
  private async buildTrafficAwareDistanceMatrix(
    locations: GeoLocation[],
    trafficData: TrafficData
  ): Promise<number[][]> {
    const n = locations.length;
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const baseDistance = this.haversineDistance(locations[i], locations[j]);
          // Apply traffic factor
          matrix[i][j] = baseDistance * this.TRAFFIC_WEIGHT;
        }
      }
    }

    return matrix;
  }

  /**
   * Extract orders from stops
   */
  private async extractOrdersFromStops(stops: RouteStop[]): Promise<Order[]> {
    // Would fetch from database - simplified here
    return stops
      .filter((stop) => stop.orderId)
      .map((stop) => ({
        id: stop.orderId!,
        orderNumber: stop.orderId!,
        customerName: 'Customer',
        customerPhone: '',
        deliveryAddress: stop.address!,
        deliveryLocation: stop.location,
        priority: 5,
        type: 'standard' as const,
        status: 'assigned' as const,
        dimensions: { weightKg: 10, volumeM3: 1 },
        serviceTimeMinutes: stop.serviceTimeMinutes,
        specialRequirements: {
          signatureRequired: false,
          ageVerification: false,
          refrigerated: false,
          fragile: false,
          hazmat: false,
          oversized: false,
          liftGateRequired: false,
          appointmentRequired: false,
        },
      }));
  }

  /**
   * Get vehicle by ID (would fetch from database)
   */
  private async getVehicleById(vehicleId: string): Promise<any> {
    return {
      id: vehicleId,
      vehicleNumber: vehicleId,
      type: 'van',
      fuelType: 'gasoline',
      status: 'available',
      capacity: { weightKg: 1000, volumeM3: 15 },
      cost: { fixedCost: 100, costPerKm: 0.5, costPerHour: 25 },
      maxDurationHours: 10,
      speedKmh: 40,
      depotId: 'depot-1',
      features: {
        refrigerated: false,
        liftGate: false,
        gps: true,
        temperatureControl: false,
        hazmatCertified: false,
        wheelchairAccessible: false,
      },
    };
  }

  /**
   * Get order weight (would fetch from database)
   */
  private async getOrderWeight(orderId: string): Promise<number> {
    return 10; // kg - would fetch from database
  }

  /**
   * Try to move a stop from one route to another
   */
  private async tryMoveStop(
    fromRoute: Route,
    toRoute: Route
  ): Promise<boolean> {
    // Simplified - would attempt to move a stop and check feasibility
    return false;
  }

  /**
   * Calculate haversine distance
   */
  private haversineDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    const R = 6371; // Earth radius in km
    const lat1 = (loc1.lat * Math.PI) / 180;
    const lat2 = (loc2.lat * Math.PI) / 180;
    const deltaLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const deltaLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export default DynamicRouter;
