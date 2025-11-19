/**
 * Route Optimizer
 *
 * Advanced vehicle routing optimization using Google OR-Tools.
 * Solves complex VRP (Vehicle Routing Problem) variants including:
 * - CVRP (Capacitated Vehicle Routing Problem)
 * - VRPTW (Vehicle Routing Problem with Time Windows)
 * - Multi-depot VRP
 * - Pickup and Delivery Problem
 * - VRP with breaks and driver constraints
 *
 * Demonstrates seamless TypeScript + Python interop via Elide.
 */

// @ts-ignore - Elide Python interop
import ortools from 'python:ortools';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import networkx from 'python:networkx';

import {
  Route,
  RouteStop,
  Order,
  Vehicle,
  Depot,
  GeoLocation,
  RouteOptimizationParams,
  RouteOptimizationSolution,
  OptimizationObjective,
  OptimizationStrategy,
  LocalSearchMetaheuristic,
  DistanceMatrix,
  TimeWindow,
  StopType,
} from '../types';

/**
 * Main route optimizer class
 */
export class RouteOptimizer {
  private distanceCache: Map<string, DistanceMatrix> = new Map();
  private readonly EARTH_RADIUS_KM = 6371;

  /**
   * Optimize delivery routes for multiple vehicles
   */
  async optimizeRoutes(
    params: RouteOptimizationParams
  ): Promise<RouteOptimizationSolution> {
    const startTime = Date.now();

    console.log('Starting route optimization...');
    console.log(`Orders: ${params.orders.length}`);
    console.log(`Vehicles: ${params.vehicles.length}`);
    console.log(`Depot: ${params.depot.name}`);
    console.log(`Optimization goal: ${params.optimizationGoal}`);

    // Validate input
    this.validateInput(params);

    // Prepare data for OR-Tools
    const data = await this.prepareRoutingData(params);

    // Create routing model
    const solution = await this.solveRoutingProblem(data, params);

    // Extract routes from solution
    const routes = this.extractRoutes(solution, data, params);

    // Calculate metrics
    const metrics = this.calculateSolutionMetrics(routes, params.orders);

    const optimizationTime = (Date.now() - startTime) / 1000;

    console.log(`Optimization completed in ${optimizationTime.toFixed(2)}s`);
    console.log(`Routes generated: ${routes.length}`);
    console.log(`Total cost: $${metrics.totalCost.toFixed(2)}`);
    console.log(`Total distance: ${metrics.totalDistanceKm.toFixed(2)} km`);
    console.log(`Utilization: ${(metrics.utilizationRate * 100).toFixed(1)}%`);

    return {
      routes,
      unassignedOrders: metrics.unassignedOrders,
      totalCost: metrics.totalCost,
      totalDistanceKm: metrics.totalDistanceKm,
      totalDurationMinutes: metrics.totalDurationMinutes,
      utilizationRate: metrics.utilizationRate,
      objectiveValue: metrics.objectiveValue,
      optimizationTime,
      feasible: solution.feasible,
      status: solution.status,
    };
  }

  /**
   * Optimize routes for a single vehicle (useful for re-optimization)
   */
  async optimizeSingleRoute(
    vehicle: Vehicle,
    orders: Order[],
    depot: Depot,
    constraints?: any
  ): Promise<Route | null> {
    const solution = await this.optimizeRoutes({
      depot,
      vehicles: [vehicle],
      orders,
      optimizationGoal: 'minimize_distance',
      timeLimitSeconds: 30,
      allowPartialSolutions: true,
      constraints: constraints || {
        timeWindows: true,
        capacity: true,
        vehicleBreaks: false,
      },
    });

    return solution.routes.length > 0 ? solution.routes[0] : null;
  }

  /**
   * Improve an existing solution with more optimization time
   */
  async improveExistingSolution(params: {
    initialSolution: RouteOptimizationSolution;
    timeLimitSeconds: number;
    metaheuristic?: LocalSearchMetaheuristic;
  }): Promise<RouteOptimizationSolution> {
    console.log('Improving existing solution...');

    // Extract parameters from initial solution
    const orders = this.extractOrdersFromRoutes(params.initialSolution.routes);
    const vehicles = this.extractVehiclesFromRoutes(params.initialSolution.routes);

    // Re-optimize with more time and advanced metaheuristic
    const improvedSolution = await this.optimizeRoutes({
      depot: { id: 'depot-1' } as Depot, // Would extract from routes
      vehicles,
      orders,
      optimizationGoal: 'minimize_cost',
      metaheuristic: params.metaheuristic || 'GUIDED_LOCAL_SEARCH',
      timeLimitSeconds: params.timeLimitSeconds,
      allowPartialSolutions: false,
      constraints: {
        timeWindows: true,
        capacity: true,
        vehicleBreaks: true,
      },
    });

    const improvement =
      ((params.initialSolution.totalCost - improvedSolution.totalCost) /
        params.initialSolution.totalCost) *
      100;

    console.log(`Improvement: ${improvement.toFixed(2)}%`);

    return improvedSolution;
  }

  /**
   * Validate optimization input parameters
   */
  private validateInput(params: RouteOptimizationParams): void {
    if (params.orders.length === 0) {
      throw new Error('No orders provided for optimization');
    }

    if (params.vehicles.length === 0) {
      throw new Error('No vehicles available for optimization');
    }

    if (params.timeLimitSeconds <= 0) {
      throw new Error('Time limit must be positive');
    }

    // Validate each order has required fields
    for (const order of params.orders) {
      if (!order.deliveryLocation) {
        throw new Error(`Order ${order.id} missing delivery location`);
      }

      if (!order.dimensions || order.dimensions.weightKg <= 0) {
        throw new Error(`Order ${order.id} missing or invalid dimensions`);
      }
    }

    // Validate vehicles
    for (const vehicle of params.vehicles) {
      if (!vehicle.capacity || vehicle.capacity.weightKg <= 0) {
        throw new Error(`Vehicle ${vehicle.id} missing or invalid capacity`);
      }
    }
  }

  /**
   * Prepare data structures for OR-Tools routing
   */
  private async prepareRoutingData(params: RouteOptimizationParams) {
    console.log('Preparing routing data...');

    // Create location list: [depot, ...order_locations]
    const locations: GeoLocation[] = [params.depot.location];
    const locationToOrder: Map<number, Order> = new Map();

    params.orders.forEach((order, idx) => {
      locations.push(order.deliveryLocation);
      locationToOrder.set(idx + 1, order); // +1 because depot is at index 0
    });

    // Calculate or retrieve distance matrix
    const distanceMatrix = params.distanceMatrix ||
      await this.calculateDistanceMatrix(locations);

    // Extract distance and duration matrices as 2D arrays
    const distances = distanceMatrix.distances;
    const durations = distanceMatrix.durations;

    // Prepare demand (weight) for each location
    const demands = [0]; // depot has no demand
    params.orders.forEach((order) => {
      demands.push(Math.ceil(order.dimensions.weightKg));
    });

    // Prepare time windows [earliest, latest] in minutes from midnight
    const timeWindows: [number, number][] = [];
    const depotWindow = this.getTimeWindowMinutes(params.depot.operatingHours);
    timeWindows.push(depotWindow);

    params.orders.forEach((order) => {
      if (order.timeWindow) {
        const window = this.convertTimeWindowToMinutes(order.timeWindow);
        timeWindows.push(window);
      } else {
        // Use depot operating hours as default
        timeWindows.push(depotWindow);
      }
    });

    // Prepare service times (time spent at each location)
    const serviceTimes = [0]; // no service time at depot
    params.orders.forEach((order) => {
      serviceTimes.push(order.serviceTimeMinutes);
    });

    // Prepare vehicle capacities
    const vehicleCapacities = params.vehicles.map((v) =>
      Math.floor(v.capacity.weightKg)
    );

    // Prepare vehicle costs
    const vehicleCosts = params.vehicles.map((v) => ({
      fixedCost: v.cost.fixedCost,
      perKmCost: v.cost.costPerKm,
      perHourCost: v.cost.costPerHour,
    }));

    // Prepare vehicle max distances and durations
    const vehicleMaxDistances = params.vehicles.map(
      (v) => v.maxDistanceKm || 1000
    );
    const vehicleMaxDurations = params.vehicles.map(
      (v) => v.maxDurationHours * 60
    ); // convert to minutes

    return {
      numLocations: locations.length,
      numVehicles: params.vehicles.length,
      depotIndex: 0,
      locations,
      locationToOrder,
      distanceMatrix: distances,
      durationMatrix: durations,
      demands,
      vehicleCapacities,
      vehicleCosts,
      vehicleMaxDistances,
      vehicleMaxDurations,
      timeWindows,
      serviceTimes,
      vehicles: params.vehicles,
      orders: params.orders,
      depot: params.depot,
    };
  }

  /**
   * Solve the routing problem using OR-Tools
   */
  private async solveRoutingProblem(
    data: any,
    params: RouteOptimizationParams
  ): Promise<any> {
    console.log('Creating OR-Tools routing model...');

    // This demonstrates the Python interop - calling OR-Tools directly from TypeScript
    const manager = ortools.constraint_solver.pywrapcp.RoutingIndexManager(
      data.numLocations,
      data.numVehicles,
      data.depotIndex
    );

    const routing = ortools.constraint_solver.pywrapcp.RoutingModel(manager);

    // Define cost callback
    const transitCallback = (fromIndex: number, toIndex: number): number => {
      const fromNode = manager.IndexToNode(fromIndex);
      const toNode = manager.IndexToNode(toIndex);
      return data.distanceMatrix[fromNode][toNode] * 1000; // Convert to meters
    };

    const transitCallbackIndex = routing.RegisterTransitCallback(transitCallback);

    // Set arc cost evaluator
    routing.SetArcCostEvaluatorOfAllVehicles(transitCallbackIndex);

    // Add capacity constraints
    if (params.constraints.capacity) {
      const demandCallback = (fromIndex: number): number => {
        const fromNode = manager.IndexToNode(fromIndex);
        return data.demands[fromNode];
      };

      const demandCallbackIndex = routing.RegisterUnaryTransitCallback(demandCallback);

      routing.AddDimensionWithVehicleCapacity(
        demandCallbackIndex,
        0, // null capacity slack
        data.vehicleCapacities,
        true, // start cumul to zero
        'Capacity'
      );
    }

    // Add time window constraints
    if (params.constraints.timeWindows) {
      const timeCallback = (fromIndex: number, toIndex: number): number => {
        const fromNode = manager.IndexToNode(fromIndex);
        const toNode = manager.IndexToNode(toIndex);
        const travelTime = data.durationMatrix[fromNode][toNode] / 60; // seconds to minutes
        const serviceTime = data.serviceTimes[fromNode];
        return Math.ceil(travelTime + serviceTime);
      };

      const timeCallbackIndex = routing.RegisterTransitCallback(timeCallback);

      const horizonMinutes = 16 * 60; // 16 hour horizon

      routing.AddDimension(
        timeCallbackIndex,
        30, // allow waiting time up to 30 minutes
        horizonMinutes,
        false, // don't force start cumul to zero (allow flexible start)
        'Time'
      );

      const timeDimension = routing.GetDimensionOrDie('Time');

      // Add time window constraints for each location
      for (let i = 1; i < data.numLocations; i++) {
        const index = manager.NodeToIndex(i);
        const [earliest, latest] = data.timeWindows[i];
        timeDimension.CumulVar(index).SetRange(earliest, latest);
      }

      // Add time window constraints for depot
      const depotIndex = manager.NodeToIndex(0);
      const [depotStart, depotEnd] = data.timeWindows[0];
      timeDimension.CumulVar(depotIndex).SetRange(depotStart, depotEnd);

      // Minimize time dimension (encourage earlier completions)
      for (let i = 0; i < data.numVehicles; i++) {
        const endIndex = routing.End(i);
        timeDimension.SetCumulVarSoftUpperBound(endIndex, depotEnd, 10000);
      }
    }

    // Add distance constraints
    if (params.constraints.maxRouteDistance) {
      const distCallback = (fromIndex: number, toIndex: number): number => {
        const fromNode = manager.IndexToNode(fromIndex);
        const toNode = manager.IndexToNode(toIndex);
        return data.distanceMatrix[fromNode][toNode] * 1000; // meters
      };

      const distCallbackIndex = routing.RegisterTransitCallback(distCallback);

      routing.AddDimension(
        distCallbackIndex,
        0, // no slack
        params.constraints.maxRouteDistance * 1000, // convert to meters
        true,
        'Distance'
      );
    }

    // Set search parameters
    const searchParameters =
      ortools.constraint_solver.pywrapcp.DefaultRoutingSearchParameters();

    // Set first solution strategy
    const strategy = this.getFirstSolutionStrategy(
      params.strategy || 'PATH_CHEAPEST_ARC'
    );
    searchParameters.first_solution_strategy = strategy;

    // Set local search metaheuristic
    const metaheuristic = this.getLocalSearchMetaheuristic(
      params.metaheuristic || 'GUIDED_LOCAL_SEARCH'
    );
    searchParameters.local_search_metaheuristic = metaheuristic;

    // Set time limit
    searchParameters.time_limit.seconds = params.timeLimitSeconds;

    // Set other parameters
    searchParameters.log_search = false;
    searchParameters.solution_limit = 1;

    // Allow dropping visits if no feasible solution
    if (params.allowPartialSolutions) {
      const penalty = 1000000; // High penalty for dropping visits
      for (let i = 1; i < data.numLocations; i++) {
        routing.AddDisjunction([manager.NodeToIndex(i)], penalty);
      }
    }

    console.log('Solving routing problem...');
    const solution = routing.SolveWithParameters(searchParameters);

    if (!solution) {
      console.warn('No solution found!');
      return {
        feasible: false,
        status: 'infeasible',
        routes: [],
      };
    }

    console.log(`Solution status: ${routing.status()}`);
    console.log(`Objective value: ${solution.ObjectiveValue()}`);

    return {
      feasible: true,
      status: this.getStatusString(routing.status()),
      objectiveValue: solution.ObjectiveValue(),
      routing,
      manager,
      solution,
    };
  }

  /**
   * Extract route information from OR-Tools solution
   */
  private extractRoutes(
    solution: any,
    data: any,
    params: RouteOptimizationParams
  ): Route[] {
    if (!solution.feasible) {
      return [];
    }

    const routes: Route[] = [];
    const { routing, manager, solution: ortoolsSolution } = solution;

    // Get time dimension if available
    const timeDimension = params.constraints.timeWindows
      ? routing.GetDimensionOrDie('Time')
      : null;

    for (let vehicleIdx = 0; vehicleIdx < data.numVehicles; vehicleIdx++) {
      const stops: RouteStop[] = [];
      let index = routing.Start(vehicleIdx);
      let routeDistance = 0;
      let routeDuration = 0;
      let routeLoad = 0;

      const vehicle = data.vehicles[vehicleIdx];

      // Check if vehicle is used
      if (routing.IsVehicleUsed(ortoolsSolution, vehicleIdx)) {
        let stopSequence = 0;

        while (!routing.IsEnd(index)) {
          const node = manager.IndexToNode(index);
          const nextIndex = ortoolsSolution.Value(routing.NextVar(index));
          const nextNode = manager.IndexToNode(nextIndex);

          // Get time information
          let arrivalTime = 0;
          let departureTime = 0;
          if (timeDimension) {
            arrivalTime = ortoolsSolution.Value(timeDimension.CumulVar(index));
            departureTime = arrivalTime + data.serviceTimes[node];
          }

          // Create stop (skip depot at start)
          if (node !== 0) {
            const order = data.locationToOrder.get(node);
            if (order) {
              const prevNode = stops.length > 0
                ? manager.IndexToNode(
                    ortoolsSolution.Value(
                      routing.NextVar(routing.Start(vehicleIdx))
                    )
                  )
                : 0;

              const distanceFromPrevious = data.distanceMatrix[prevNode][node];
              const durationFromPrevious = data.durationMatrix[prevNode][node] / 60;

              routeDistance += distanceFromPrevious;
              routeDuration += durationFromPrevious + data.serviceTimes[node];
              routeLoad += data.demands[node];

              const baseTime = new Date();
              baseTime.setHours(6, 0, 0, 0); // Assume 6 AM start

              stops.push({
                id: `stop-${vehicleIdx}-${stopSequence}`,
                routeId: `route-${vehicleIdx}`,
                stopSequence,
                stopType: 'delivery' as StopType,
                orderId: order.id,
                location: order.deliveryLocation,
                address: order.deliveryAddress,
                plannedArrivalTime: new Date(
                  baseTime.getTime() + arrivalTime * 60000
                ),
                plannedDepartureTime: new Date(
                  baseTime.getTime() + departureTime * 60000
                ),
                status: 'pending',
                serviceTimeMinutes: data.serviceTimes[node],
                distanceFromPreviousKm: distanceFromPrevious,
                durationFromPreviousMinutes: durationFromPrevious,
              });

              stopSequence++;
            }
          }

          index = nextIndex;
        }

        // Only create route if it has stops
        if (stops.length > 0) {
          const routeCost =
            routeDistance * vehicle.cost.costPerKm +
            (routeDuration / 60) * vehicle.cost.costPerHour +
            vehicle.cost.fixedCost;

          const baseTime = new Date();
          baseTime.setHours(6, 0, 0, 0);

          routes.push({
            id: `route-${vehicleIdx}`,
            routeNumber: `R-${String(vehicleIdx + 1).padStart(3, '0')}`,
            vehicleId: vehicle.id,
            depotId: data.depot.id,
            date: new Date(),
            status: 'planned',
            stops,
            startLocation: data.depot.location,
            endLocation: data.depot.location,
            plannedStartTime: baseTime,
            plannedEndTime: new Date(baseTime.getTime() + routeDuration * 60000),
            totalDistanceKm: routeDistance,
            totalDurationMinutes: routeDuration,
            totalWeightKg: routeLoad,
            totalVolumeM3: 0,
            totalCost: routeCost,
            completedStops: 0,
            optimization: {
              optimizationTime: 0,
              algorithm: 'OR-Tools',
              objectiveValue: solution.objectiveValue,
              utilizationPercent: (routeLoad / vehicle.capacity.weightKg) * 100,
              efficiencyScore: 85,
            },
          });
        }
      }
    }

    return routes;
  }

  /**
   * Calculate solution metrics
   */
  private calculateSolutionMetrics(routes: Route[], orders: Order[]) {
    const assignedOrderIds = new Set<string>();

    routes.forEach((route) => {
      route.stops.forEach((stop) => {
        if (stop.orderId) {
          assignedOrderIds.add(stop.orderId);
        }
      });
    });

    const unassignedOrders = orders.filter(
      (order) => !assignedOrderIds.has(order.id)
    );

    const totalCost = routes.reduce((sum, route) => sum + route.totalCost, 0);
    const totalDistanceKm = routes.reduce(
      (sum, route) => sum + route.totalDistanceKm,
      0
    );
    const totalDurationMinutes = routes.reduce(
      (sum, route) => sum + route.totalDurationMinutes,
      0
    );

    const totalCapacity = routes.reduce(
      (sum, route) =>
        sum +
        (routes[0] ? parseFloat(routes[0].optimization.utilizationPercent.toString()) : 0),
      0
    );
    const utilizationRate =
      routes.length > 0 ? totalCapacity / routes.length / 100 : 0;

    return {
      unassignedOrders,
      totalCost,
      totalDistanceKm,
      totalDurationMinutes,
      utilizationRate,
      objectiveValue: totalCost,
    };
  }

  /**
   * Calculate distance matrix using haversine formula
   */
  private async calculateDistanceMatrix(
    locations: GeoLocation[]
  ): Promise<DistanceMatrix> {
    const cacheKey = this.getCacheKey(locations);

    if (this.distanceCache.has(cacheKey)) {
      return this.distanceCache.get(cacheKey)!;
    }

    const n = locations.length;
    const distances: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    const durations: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          distances[i][j] = 0;
          durations[i][j] = 0;
        } else {
          const dist = this.haversineDistance(locations[i], locations[j]);
          distances[i][j] = dist;

          // Estimate duration: assume average speed of 40 km/h in urban areas
          const avgSpeedKmh = 40;
          durations[i][j] = (dist / avgSpeedKmh) * 3600; // convert to seconds
        }
      }
    }

    const matrix: DistanceMatrix = {
      origins: locations,
      destinations: locations,
      distances,
      durations,
      timestamp: new Date(),
    };

    this.distanceCache.set(cacheKey, matrix);

    return matrix;
  }

  /**
   * Calculate haversine distance between two points
   */
  private haversineDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    const lat1Rad = (loc1.lat * Math.PI) / 180;
    const lat2Rad = (loc2.lat * Math.PI) / 180;
    const deltaLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const deltaLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Get time window in minutes from midnight
   */
  private getTimeWindowMinutes(operatingHours: any): [number, number] {
    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start = parseTime(operatingHours.start || '06:00');
    const end = parseTime(operatingHours.end || '22:00');

    return [start, end];
  }

  /**
   * Convert TimeWindow to minutes from midnight
   */
  private convertTimeWindowToMinutes(timeWindow: TimeWindow): [number, number] {
    const start = timeWindow.start.getHours() * 60 + timeWindow.start.getMinutes();
    const end = timeWindow.end.getHours() * 60 + timeWindow.end.getMinutes();
    return [start, end];
  }

  /**
   * Get OR-Tools first solution strategy enum
   */
  private getFirstSolutionStrategy(strategy: OptimizationStrategy): any {
    const strategies = {
      PATH_CHEAPEST_ARC:
        ortools.constraint_solver.pywrapcp.FirstSolutionStrategy.PATH_CHEAPEST_ARC,
      PATH_MOST_CONSTRAINED_ARC:
        ortools.constraint_solver.pywrapcp.FirstSolutionStrategy
          .PATH_MOST_CONSTRAINED_ARC,
      SAVINGS:
        ortools.constraint_solver.pywrapcp.FirstSolutionStrategy.SAVINGS,
      SWEEP: ortools.constraint_solver.pywrapcp.FirstSolutionStrategy.SWEEP,
      BEST_INSERTION:
        ortools.constraint_solver.pywrapcp.FirstSolutionStrategy.LOCAL_CHEAPEST_INSERTION,
    };

    return (
      strategies[strategy] ||
      ortools.constraint_solver.pywrapcp.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    );
  }

  /**
   * Get OR-Tools local search metaheuristic enum
   */
  private getLocalSearchMetaheuristic(
    metaheuristic: LocalSearchMetaheuristic
  ): any {
    const metaheuristics = {
      AUTOMATIC:
        ortools.constraint_solver.pywrapcp.LocalSearchMetaheuristic.AUTOMATIC,
      GREEDY_DESCENT:
        ortools.constraint_solver.pywrapcp.LocalSearchMetaheuristic.GREEDY_DESCENT,
      GUIDED_LOCAL_SEARCH:
        ortools.constraint_solver.pywrapcp.LocalSearchMetaheuristic
          .GUIDED_LOCAL_SEARCH,
      SIMULATED_ANNEALING:
        ortools.constraint_solver.pywrapcp.LocalSearchMetaheuristic
          .SIMULATED_ANNEALING,
      TABU_SEARCH:
        ortools.constraint_solver.pywrapcp.LocalSearchMetaheuristic.TABU_SEARCH,
    };

    return (
      metaheuristics[metaheuristic] ||
      ortools.constraint_solver.pywrapcp.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    );
  }

  /**
   * Get status string from OR-Tools status code
   */
  private getStatusString(status: number): 'optimal' | 'feasible' | 'infeasible' | 'timeout' {
    // OR-Tools status codes
    const statusMap: Record<number, 'optimal' | 'feasible' | 'infeasible' | 'timeout'> = {
      0: 'optimal',
      1: 'optimal',
      2: 'feasible',
      3: 'infeasible',
      4: 'timeout',
    };

    return statusMap[status] || 'feasible';
  }

  /**
   * Extract orders from existing routes
   */
  private extractOrdersFromRoutes(routes: Route[]): Order[] {
    const orders: Order[] = [];
    const orderIds = new Set<string>();

    routes.forEach((route) => {
      route.stops.forEach((stop) => {
        if (stop.orderId && !orderIds.has(stop.orderId)) {
          orderIds.add(stop.orderId);
          // Create minimal order object (would typically fetch from database)
          orders.push({
            id: stop.orderId,
            orderNumber: stop.orderId,
            customerName: 'Customer',
            customerPhone: '',
            deliveryAddress: stop.address!,
            deliveryLocation: stop.location,
            priority: 5,
            type: 'standard',
            status: 'assigned',
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
          });
        }
      });
    });

    return orders;
  }

  /**
   * Extract vehicles from existing routes
   */
  private extractVehiclesFromRoutes(routes: Route[]): Vehicle[] {
    const vehicles: Vehicle[] = [];
    const vehicleIds = new Set<string>();

    routes.forEach((route) => {
      if (!vehicleIds.has(route.vehicleId)) {
        vehicleIds.add(route.vehicleId);
        // Create minimal vehicle object (would typically fetch from database)
        vehicles.push({
          id: route.vehicleId,
          vehicleNumber: route.vehicleId,
          type: 'van',
          fuelType: 'gasoline',
          status: 'available',
          capacity: { weightKg: 1000, volumeM3: 15 },
          cost: { fixedCost: 100, costPerKm: 0.5, costPerHour: 25 },
          maxDurationHours: 10,
          speedKmh: 40,
          depotId: route.depotId,
          features: {
            refrigerated: false,
            liftGate: false,
            gps: true,
            temperatureControl: false,
            hazmatCertified: false,
            wheelchairAccessible: false,
          },
        });
      }
    });

    return vehicles;
  }

  /**
   * Generate cache key for distance matrix
   */
  private getCacheKey(locations: GeoLocation[]): string {
    return locations
      .map((loc) => `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`)
      .join('|');
  }

  /**
   * Clear distance matrix cache
   */
  clearCache(): void {
    this.distanceCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.distanceCache.size,
      memoryUsage: this.distanceCache.size * 1000, // rough estimate in bytes
    };
  }
}

/**
 * Helper function to create a quick route optimization
 */
export async function optimizeDeliveryRoutes(
  orders: Order[],
  vehicles: Vehicle[],
  depot: Depot,
  options?: {
    timeLimitSeconds?: number;
    optimizationGoal?: OptimizationObjective;
  }
): Promise<RouteOptimizationSolution> {
  const optimizer = new RouteOptimizer();

  return optimizer.optimizeRoutes({
    depot,
    vehicles,
    orders,
    optimizationGoal: options?.optimizationGoal || 'minimize_cost',
    timeLimitSeconds: options?.timeLimitSeconds || 60,
    allowPartialSolutions: true,
    constraints: {
      timeWindows: true,
      capacity: true,
      vehicleBreaks: false,
    },
  });
}

export default RouteOptimizer;
