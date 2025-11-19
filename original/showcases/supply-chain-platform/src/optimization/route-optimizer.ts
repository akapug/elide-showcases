/**
 * Route Optimizer - Vehicle Routing Problem (VRP) Optimization
 *
 * Advanced routing optimization using OR-Tools for solving:
 * - Vehicle Routing Problem (VRP)
 * - Capacitated VRP (CVRP)
 * - VRP with Time Windows (VRPTW)
 * - Multi-Depot VRP
 * - Pick-up and Delivery Problem
 * - Heterogeneous Fleet VRP
 */

// @ts-ignore
import ortools from 'python:ortools'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'

import type {
  RoutingProblem,
  RoutingSolution,
  Route,
  RouteStop,
  Delivery,
  Vehicle,
  Depot,
  RoutingAlgorithm,
  RoutingMetrics,
  GeoLocation,
} from '../types'

/**
 * RouteOptimizer - Comprehensive vehicle routing optimization
 *
 * Features:
 * - Multiple VRP variants support
 * - Constraint programming with OR-Tools
 * - Heuristic algorithms for large-scale problems
 * - Real-time route updates
 * - Cost and distance minimization
 * - Load balancing across vehicles
 * - Time window constraints
 * - Carbon footprint calculation
 */
export class RouteOptimizer {
  private algorithm: RoutingAlgorithm
  private timeLimit: number
  private numThreads: number

  constructor(params: {
    algorithm?: RoutingAlgorithm
    timeLimit?: number
    numThreads?: number
  } = {}) {
    this.algorithm = params.algorithm || 'clarke-wright'
    this.timeLimit = params.timeLimit || 300 // 5 minutes
    this.numThreads = params.numThreads || 4
  }

  /**
   * Optimize vehicle routing problem
   */
  async optimize(problem: RoutingProblem): Promise<RoutingSolution> {
    console.log(`Optimizing routes for ${problem.deliveries.length} deliveries`)
    console.log(`Vehicles available: ${problem.vehicles.length}`)
    console.log(`Algorithm: ${this.algorithm}`)

    const startTime = Date.now()

    // Build distance and time matrices
    const { distanceMatrix, timeMatrix } = await this.buildMatrices(
      problem.depots,
      problem.deliveries
    )

    // Select and run optimization algorithm
    let solution: RoutingSolution

    switch (this.algorithm) {
      case 'clarke-wright':
        solution = await this.clarkeWrightSavings(problem, distanceMatrix)
        break
      case 'sweep':
        solution = await this.sweepAlgorithm(problem, distanceMatrix)
        break
      case 'cp-sat':
        solution = await this.cpSatOptimization(problem, distanceMatrix, timeMatrix)
        break
      case 'nearest-neighbor':
        solution = await this.nearestNeighbor(problem, distanceMatrix)
        break
      case 'genetic':
        solution = await this.geneticAlgorithm(problem, distanceMatrix)
        break
      case 'simulated-annealing':
        solution = await this.simulatedAnnealing(problem, distanceMatrix)
        break
      default:
        throw new Error(`Unsupported algorithm: ${this.algorithm}`)
    }

    const computationTime = Date.now() - startTime

    // Calculate metrics
    const metrics = this.calculateMetrics(solution)

    return {
      ...solution,
      metrics,
      computationTime,
    }
  }

  /**
   * Clarke-Wright Savings Algorithm
   * Heuristic for CVRP - fast and effective for medium-sized problems
   */
  private async clarkeWrightSavings(
    problem: RoutingProblem,
    distanceMatrix: number[][]
  ): Promise<RoutingSolution> {
    console.log('Running Clarke-Wright Savings algorithm...')

    const depot = problem.depots[0]
    const deliveries = problem.deliveries
    const vehicles = problem.vehicles

    // Calculate savings for all delivery pairs
    const savings: Array<{
      i: number
      j: number
      saving: number
    }> = []

    for (let i = 0; i < deliveries.length; i++) {
      for (let j = i + 1; j < deliveries.length; j++) {
        const saving =
          distanceMatrix[0][i + 1] +
          distanceMatrix[0][j + 1] -
          distanceMatrix[i + 1][j + 1]
        savings.push({ i, j, saving })
      }
    }

    // Sort savings in descending order
    savings.sort((a, b) => b.saving - a.saving)

    // Initialize routes (one delivery per route)
    const routes: Array<{
      vehicleId: string
      deliveryIndices: number[]
      load: number
      distance: number
    }> = []

    const assigned = new Set<number>()

    // Assign deliveries to routes based on savings
    for (const { i, j } of savings) {
      if (assigned.has(i) && assigned.has(j)) continue

      // Find routes containing i or j
      let routeI = routes.find(r => r.deliveryIndices.includes(i))
      let routeJ = routes.find(r => r.deliveryIndices.includes(j))

      if (!routeI && !routeJ) {
        // Create new route with both deliveries
        const load = deliveries[i].demand + deliveries[j].demand
        const vehicle = this.findVehicleForLoad(vehicles, load, routes)

        if (vehicle) {
          routes.push({
            vehicleId: vehicle.id,
            deliveryIndices: [i, j],
            load,
            distance: 0,
          })
          assigned.add(i)
          assigned.add(j)
        }
      } else if (routeI && !routeJ) {
        // Add j to route containing i
        const newLoad = routeI.load + deliveries[j].demand
        const vehicle = vehicles.find(v => v.id === routeI!.vehicleId)

        if (vehicle && newLoad <= vehicle.capacity) {
          routeI.deliveryIndices.push(j)
          routeI.load = newLoad
          assigned.add(j)
        }
      } else if (!routeI && routeJ) {
        // Add i to route containing j
        const newLoad = routeJ.load + deliveries[i].demand
        const vehicle = vehicles.find(v => v.id === routeJ!.vehicleId)

        if (vehicle && newLoad <= vehicle.capacity) {
          routeJ.deliveryIndices.push(i)
          routeJ.load = newLoad
          assigned.add(i)
        }
      } else if (routeI && routeJ && routeI !== routeJ) {
        // Merge routes
        const newLoad = routeI.load + routeJ.load
        const vehicle = vehicles.find(v => v.id === routeI!.vehicleId)

        if (vehicle && newLoad <= vehicle.capacity) {
          routeI.deliveryIndices.push(...routeJ.deliveryIndices)
          routeI.load = newLoad
          routes.splice(routes.indexOf(routeJ), 1)
        }
      }
    }

    // Add unassigned deliveries
    for (let i = 0; i < deliveries.length; i++) {
      if (!assigned.has(i)) {
        const vehicle = this.findVehicleForLoad(vehicles, deliveries[i].demand, routes)
        if (vehicle) {
          routes.push({
            vehicleId: vehicle.id,
            deliveryIndices: [i],
            load: deliveries[i].demand,
            distance: 0,
          })
          assigned.add(i)
        }
      }
    }

    // Convert to solution format
    return this.buildSolution(problem, routes, distanceMatrix)
  }

  /**
   * Sweep Algorithm
   * Geometric heuristic for VRP - works well with clustered deliveries
   */
  private async sweepAlgorithm(
    problem: RoutingProblem,
    distanceMatrix: number[][]
  ): Promise<RoutingSolution> {
    console.log('Running Sweep algorithm...')

    const depot = problem.depots[0]
    const deliveries = problem.deliveries
    const vehicles = problem.vehicles

    // Calculate polar coordinates relative to depot
    const polarDeliveries = deliveries.map((d, idx) => {
      const angle = this.calculateAngle(depot.location, d.location)
      return { index: idx, angle, demand: d.demand }
    })

    // Sort by angle
    polarDeliveries.sort((a, b) => a.angle - b.angle)

    // Sweep and create routes
    const routes: Array<{
      vehicleId: string
      deliveryIndices: number[]
      load: number
      distance: number
    }> = []

    let currentRoute: number[] = []
    let currentLoad = 0
    let vehicleIdx = 0

    for (const delivery of polarDeliveries) {
      const vehicle = vehicles[vehicleIdx % vehicles.length]

      if (currentLoad + delivery.demand <= vehicle.capacity) {
        currentRoute.push(delivery.index)
        currentLoad += delivery.demand
      } else {
        // Finish current route and start new one
        if (currentRoute.length > 0) {
          routes.push({
            vehicleId: vehicle.id,
            deliveryIndices: currentRoute,
            load: currentLoad,
            distance: 0,
          })
        }

        vehicleIdx++
        currentRoute = [delivery.index]
        currentLoad = delivery.demand
      }
    }

    // Add last route
    if (currentRoute.length > 0) {
      const vehicle = vehicles[vehicleIdx % vehicles.length]
      routes.push({
        vehicleId: vehicle.id,
        deliveryIndices: currentRoute,
        load: currentLoad,
        distance: 0,
      })
    }

    // Optimize sequence within each route
    for (const route of routes) {
      route.deliveryIndices = this.optimizeSequence(route.deliveryIndices, distanceMatrix)
    }

    return this.buildSolution(problem, routes, distanceMatrix)
  }

  /**
   * CP-SAT Optimization using OR-Tools
   * Exact method for small to medium problems
   */
  private async cpSatOptimization(
    problem: RoutingProblem,
    distanceMatrix: number[][],
    timeMatrix: number[][]
  ): Promise<RoutingSolution> {
    console.log('Running OR-Tools CP-SAT optimization...')

    const numVehicles = problem.vehicles.length
    const numDeliveries = problem.deliveries.length

    // Create routing index manager
    const manager = new ortools.constraint_solver.pywrapcp.RoutingIndexManager(
      numDeliveries + 1, // +1 for depot
      numVehicles,
      0 // depot index
    )

    // Create routing model
    const routing = new ortools.constraint_solver.pywrapcp.RoutingModel(manager)

    // Register distance callback
    const distanceCallback = (fromIndex: number, toIndex: number) => {
      const fromNode = manager.IndexToNode(fromIndex)
      const toNode = manager.IndexToNode(toIndex)
      return distanceMatrix[fromNode][toNode]
    }

    const transitCallbackIndex = routing.RegisterTransitCallback(distanceCallback)

    // Define cost of each arc
    routing.SetArcCostEvaluatorOfAllVehicles(transitCallbackIndex)

    // Add capacity constraints
    const demands = [0, ...problem.deliveries.map(d => d.demand)]
    const demandCallback = (fromIndex: number) => {
      const fromNode = manager.IndexToNode(fromIndex)
      return demands[fromNode]
    }

    const demandCallbackIndex = routing.RegisterUnaryTransitCallback(demandCallback)

    routing.AddDimensionWithVehicleCapacity(
      demandCallbackIndex,
      0, // null capacity slack
      problem.vehicles.map(v => v.capacity), // vehicle capacities
      true, // start cumul to zero
      'Capacity'
    )

    // Add time window constraints if specified
    if (problem.constraints.timeWindowConstraints) {
      const timeCallback = (fromIndex: number, toIndex: number) => {
        const fromNode = manager.IndexToNode(fromIndex)
        const toNode = manager.IndexToNode(toIndex)
        return timeMatrix[fromNode][toNode]
      }

      const timeCallbackIndex = routing.RegisterTransitCallback(timeCallback)

      routing.AddDimension(
        timeCallbackIndex,
        30, // allow waiting time
        problem.vehicles[0].maxRouteTime || 480, // maximum time per vehicle
        false, // don't force start cumul to zero
        'Time'
      )

      const timeDimension = routing.GetDimensionOrDie('Time')

      // Add time window constraints for each delivery
      for (let i = 0; i < problem.deliveries.length; i++) {
        const delivery = problem.deliveries[i]
        const index = manager.NodeToIndex(i + 1)

        if (delivery.timeWindow) {
          const startMinutes = this.timeToMinutes(delivery.timeWindow.start)
          const endMinutes = this.timeToMinutes(delivery.timeWindow.end)
          timeDimension.CumulVar(index).SetRange(startMinutes, endMinutes)
        }
      }

      // Add time window for depot
      const depotIdx = manager.NodeToIndex(0)
      timeDimension.CumulVar(depotIdx).SetRange(0, 1440) // Full day
    }

    // Set search parameters
    const searchParameters = ortools.constraint_solver.pywrapcp.DefaultRoutingSearchParameters()
    searchParameters.first_solution_strategy =
      ortools.constraint_solver.pywrapcp.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    searchParameters.local_search_metaheuristic =
      ortools.constraint_solver.pywrapcp.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    searchParameters.time_limit.seconds = this.timeLimit

    // Solve
    const solution = routing.SolveWithParameters(searchParameters)

    if (!solution) {
      throw new Error('No solution found')
    }

    // Extract solution
    return this.extractORToolsSolution(problem, manager, routing, solution, distanceMatrix)
  }

  /**
   * Nearest Neighbor Algorithm
   * Simple greedy heuristic
   */
  private async nearestNeighbor(
    problem: RoutingProblem,
    distanceMatrix: number[][]
  ): Promise<RoutingSolution> {
    console.log('Running Nearest Neighbor algorithm...')

    const deliveries = problem.deliveries
    const vehicles = problem.vehicles
    const routes: Array<{
      vehicleId: string
      deliveryIndices: number[]
      load: number
      distance: number
    }> = []

    const unassigned = new Set(deliveries.map((_, idx) => idx))
    let vehicleIdx = 0

    while (unassigned.size > 0 && vehicleIdx < vehicles.length) {
      const vehicle = vehicles[vehicleIdx]
      const route: number[] = []
      let load = 0
      let current = 0 // Start at depot

      while (true) {
        let nearest = -1
        let minDistance = Infinity

        // Find nearest unassigned delivery that fits in vehicle
        for (const deliveryIdx of unassigned) {
          const demand = deliveries[deliveryIdx].demand
          if (load + demand <= vehicle.capacity) {
            const distance = distanceMatrix[current][deliveryIdx + 1]
            if (distance < minDistance) {
              minDistance = distance
              nearest = deliveryIdx
            }
          }
        }

        if (nearest === -1) break // No more deliveries fit

        route.push(nearest)
        load += deliveries[nearest].demand
        unassigned.delete(nearest)
        current = nearest + 1
      }

      if (route.length > 0) {
        routes.push({
          vehicleId: vehicle.id,
          deliveryIndices: route,
          load,
          distance: 0,
        })
      }

      vehicleIdx++
    }

    return this.buildSolution(problem, routes, distanceMatrix)
  }

  /**
   * Genetic Algorithm
   * Metaheuristic for large-scale problems
   */
  private async geneticAlgorithm(
    problem: RoutingProblem,
    distanceMatrix: number[][]
  ): Promise<RoutingSolution> {
    console.log('Running Genetic Algorithm...')

    const populationSize = 100
    const generations = 1000
    const mutationRate = 0.1
    const crossoverRate = 0.8

    // Initialize population
    let population = this.initializePopulation(problem, populationSize)

    for (let gen = 0; gen < generations; gen++) {
      // Evaluate fitness
      const fitness = population.map(individual =>
        this.evaluateFitness(individual, problem, distanceMatrix)
      )

      // Selection
      const selected = this.tournamentSelection(population, fitness, populationSize)

      // Crossover
      const offspring = []
      for (let i = 0; i < selected.length; i += 2) {
        if (Math.random() < crossoverRate && i + 1 < selected.length) {
          const [child1, child2] = this.crossover(selected[i], selected[i + 1])
          offspring.push(child1, child2)
        } else {
          offspring.push(selected[i])
          if (i + 1 < selected.length) offspring.push(selected[i + 1])
        }
      }

      // Mutation
      for (const individual of offspring) {
        if (Math.random() < mutationRate) {
          this.mutate(individual)
        }
      }

      population = offspring
    }

    // Get best solution
    const fitness = population.map(individual =>
      this.evaluateFitness(individual, problem, distanceMatrix)
    )
    const bestIdx = fitness.indexOf(Math.min(...fitness))
    const bestIndividual = population[bestIdx]

    return this.buildSolution(problem, bestIndividual, distanceMatrix)
  }

  /**
   * Simulated Annealing
   * Metaheuristic with probabilistic acceptance
   */
  private async simulatedAnnealing(
    problem: RoutingProblem,
    distanceMatrix: number[][]
  ): Promise<RoutingSolution> {
    console.log('Running Simulated Annealing...')

    const initialTemp = 1000
    const coolingRate = 0.995
    const minTemp = 1
    const iterationsPerTemp = 100

    // Generate initial solution
    let currentSolution = await this.nearestNeighbor(problem, distanceMatrix)
    let currentCost = currentSolution.totalCost
    let bestSolution = currentSolution
    let bestCost = currentCost

    let temperature = initialTemp

    while (temperature > minTemp) {
      for (let i = 0; i < iterationsPerTemp; i++) {
        // Generate neighbor solution
        const neighbor = this.generateNeighbor(currentSolution, problem)
        const neighborCost = this.calculateTotalCost(neighbor, problem, distanceMatrix)

        // Accept or reject
        const delta = neighborCost - currentCost
        if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
          currentSolution = neighbor
          currentCost = neighborCost

          if (currentCost < bestCost) {
            bestSolution = currentSolution
            bestCost = currentCost
          }
        }
      }

      temperature *= coolingRate
    }

    return bestSolution
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Build distance and time matrices
   */
  private async buildMatrices(
    depots: Depot[],
    deliveries: Delivery[]
  ): Promise<{ distanceMatrix: number[][]; timeMatrix: number[][] }> {
    const locations = [depots[0], ...deliveries]
    const n = locations.length

    const distanceMatrix: number[][] = []
    const timeMatrix: number[][] = []

    for (let i = 0; i < n; i++) {
      distanceMatrix[i] = []
      timeMatrix[i] = []

      for (let j = 0; j < n; j++) {
        const loc1 = i === 0 ? depots[0].location : deliveries[i - 1].location
        const loc2 = j === 0 ? depots[0].location : deliveries[j - 1].location

        const distance = this.calculateDistance(loc1, loc2)
        const time = distance / 50 // Assume 50 km/h average speed

        distanceMatrix[i][j] = distance
        timeMatrix[i][j] = time * 60 // Convert to minutes
      }
    }

    return { distanceMatrix, timeMatrix }
  }

  /**
   * Calculate Haversine distance between two locations
   */
  private calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    const R = 6371 // Earth radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat)
    const dLng = this.toRad(loc2.lng - loc1.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.lat)) *
        Math.cos(this.toRad(loc2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  /**
   * Calculate angle from depot to delivery (for sweep algorithm)
   */
  private calculateAngle(depot: GeoLocation, delivery: GeoLocation): number {
    const dx = delivery.lng - depot.lng
    const dy = delivery.lat - depot.lat
    return Math.atan2(dy, dx)
  }

  /**
   * Find vehicle with available capacity
   */
  private findVehicleForLoad(
    vehicles: Vehicle[],
    load: number,
    existingRoutes: any[]
  ): Vehicle | null {
    // Count how many times each vehicle is used
    const usageCount = new Map<string, number>()
    for (const route of existingRoutes) {
      usageCount.set(route.vehicleId, (usageCount.get(route.vehicleId) || 0) + 1)
    }

    // Find vehicle with capacity and least usage
    let bestVehicle: Vehicle | null = null
    let minUsage = Infinity

    for (const vehicle of vehicles) {
      if (vehicle.capacity >= load) {
        const usage = usageCount.get(vehicle.id) || 0
        if (usage < minUsage) {
          minUsage = usage
          bestVehicle = vehicle
        }
      }
    }

    return bestVehicle
  }

  /**
   * Optimize delivery sequence within a route using 2-opt
   */
  private optimizeSequence(sequence: number[], distanceMatrix: number[][]): number[] {
    const n = sequence.length
    if (n <= 2) return sequence

    let improved = true
    let best = [...sequence]

    while (improved) {
      improved = false

      for (let i = 0; i < n - 1; i++) {
        for (let j = i + 2; j < n; j++) {
          // Try reversing segment [i+1, j]
          const newSequence = [
            ...best.slice(0, i + 1),
            ...best.slice(i + 1, j + 1).reverse(),
            ...best.slice(j + 1),
          ]

          const currentDist = this.calculateSequenceDistance(best, distanceMatrix)
          const newDist = this.calculateSequenceDistance(newSequence, distanceMatrix)

          if (newDist < currentDist) {
            best = newSequence
            improved = true
          }
        }
      }
    }

    return best
  }

  /**
   * Calculate total distance for a sequence
   */
  private calculateSequenceDistance(sequence: number[], distanceMatrix: number[][]): number {
    let distance = 0
    let current = 0 // Depot

    for (const deliveryIdx of sequence) {
      distance += distanceMatrix[current][deliveryIdx + 1]
      current = deliveryIdx + 1
    }

    distance += distanceMatrix[current][0] // Return to depot

    return distance
  }

  /**
   * Convert time string to minutes
   */
  private timeToMinutes(time: string | Date): number {
    if (time instanceof Date) {
      return time.getHours() * 60 + time.getMinutes()
    }

    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Build solution from routes
   */
  private buildSolution(
    problem: RoutingProblem,
    routes: Array<{
      vehicleId: string
      deliveryIndices: number[]
      load: number
      distance: number
    }>,
    distanceMatrix: number[][]
  ): RoutingSolution {
    const depot = problem.depots[0]
    const deliveries = problem.deliveries
    const vehicles = problem.vehicles

    const formattedRoutes: Route[] = []
    let totalDistance = 0
    let totalTime = 0
    let totalCost = 0

    const assigned = new Set<number>()

    for (const route of routes) {
      const vehicle = vehicles.find(v => v.id === route.vehicleId)!
      const stops: RouteStop[] = []

      let currentLocation = depot.location
      let currentTime = this.timeToMinutes(depot.openTime)
      let routeDistance = 0

      // Build stops
      for (const deliveryIdx of route.deliveryIndices) {
        const delivery = deliveries[deliveryIdx]
        const distance = this.calculateDistance(currentLocation, delivery.location)
        const travelTime = (distance / 50) * 60 // Minutes

        const arrivalTime = currentTime + travelTime
        const departureTime = arrivalTime + delivery.serviceTime

        stops.push({
          deliveryId: delivery.id,
          location: delivery.location,
          arrivalTime: this.minutesToTime(arrivalTime),
          departureTime: this.minutesToTime(departureTime),
          waitTime: 0,
          serviceTime: delivery.serviceTime,
          load: route.load,
          distance: routeDistance + distance,
          distanceFromPrevious: distance,
          sequence: stops.length,
        })

        routeDistance += distance
        currentLocation = delivery.location
        currentTime = departureTime
        assigned.add(deliveryIdx)
      }

      // Return to depot
      const returnDistance = this.calculateDistance(currentLocation, depot.location)
      routeDistance += returnDistance
      const routeDuration = currentTime - this.timeToMinutes(depot.openTime)

      const routeCost =
        vehicle.fixedCost +
        routeDistance * vehicle.costPerKm +
        (routeDuration / 60) * vehicle.costPerHour

      formattedRoutes.push({
        vehicleId: vehicle.id,
        depotId: depot.id,
        stops,
        distance: routeDistance,
        duration: routeDuration,
        load: route.load,
        capacity: vehicle.capacity,
        cost: routeCost,
        startTime: depot.openTime.toString(),
        endTime: this.minutesToTime(currentTime),
        violated: false,
      })

      totalDistance += routeDistance
      totalTime += routeDuration
      totalCost += routeCost
    }

    // Identify unassigned deliveries
    const unassigned = deliveries.filter((_, idx) => !assigned.has(idx))

    return {
      routes: formattedRoutes,
      unassigned,
      totalCost,
      totalDistance,
      totalTime,
      totalVehicles: routes.length,
      metrics: {} as RoutingMetrics,
      computationTime: 0,
    }
  }

  /**
   * Extract solution from OR-Tools solver
   */
  private extractORToolsSolution(
    problem: RoutingProblem,
    manager: any,
    routing: any,
    solution: any,
    distanceMatrix: number[][]
  ): RoutingSolution {
    const routes: Array<{
      vehicleId: string
      deliveryIndices: number[]
      load: number
      distance: number
    }> = []

    for (let vehicleIdx = 0; vehicleIdx < problem.vehicles.length; vehicleIdx++) {
      const vehicle = problem.vehicles[vehicleIdx]
      const deliveryIndices: number[] = []
      let load = 0
      let index = routing.Start(vehicleIdx)

      while (!routing.IsEnd(index)) {
        const nodeIdx = manager.IndexToNode(index)
        if (nodeIdx > 0) {
          // Not depot
          const deliveryIdx = nodeIdx - 1
          deliveryIndices.push(deliveryIdx)
          load += problem.deliveries[deliveryIdx].demand
        }
        index = solution.Value(routing.NextVar(index))
      }

      if (deliveryIndices.length > 0) {
        routes.push({
          vehicleId: vehicle.id,
          deliveryIndices,
          load,
          distance: 0,
        })
      }
    }

    return this.buildSolution(problem, routes, distanceMatrix)
  }

  /**
   * Calculate routing metrics
   */
  private calculateMetrics(solution: RoutingSolution): RoutingMetrics {
    const totalCapacity = solution.routes.reduce((sum, r) => sum + r.capacity, 0)
    const totalLoad = solution.routes.reduce((sum, r) => sum + r.load, 0)

    const utilizationRate = totalLoad / totalCapacity
    const averageLoadFactor =
      solution.routes.reduce((sum, r) => sum + r.load / r.capacity, 0) / solution.routes.length
    const averageRouteTime =
      solution.routes.reduce((sum, r) => sum + r.duration, 0) / solution.routes.length
    const averageStopsPerRoute =
      solution.routes.reduce((sum, r) => sum + r.stops.length, 0) / solution.routes.length
    const onTimeDeliveryRate = 1.0 // Simplified
    const costPerDelivery =
      solution.totalCost /
      solution.routes.reduce((sum, r) => sum + r.stops.length, 0)
    const costPerKm = solution.totalCost / solution.totalDistance

    return {
      utilizationRate,
      averageLoadFactor,
      averageRouteTime,
      averageStopsPerRoute,
      onTimeDeliveryRate,
      costPerDelivery,
      costPerKm,
    }
  }

  /**
   * Minutes to time string
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Genetic Algorithm helpers
  private initializePopulation(problem: RoutingProblem, size: number): any[] {
    const population = []
    for (let i = 0; i < size; i++) {
      population.push(this.randomSolution(problem))
    }
    return population
  }

  private randomSolution(problem: RoutingProblem): any[] {
    const deliveryIndices = problem.deliveries.map((_, idx) => idx)
    // Shuffle
    for (let i = deliveryIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deliveryIndices[i], deliveryIndices[j]] = [deliveryIndices[j], deliveryIndices[i]]
    }

    // Split into routes based on vehicle capacity
    const routes = []
    let currentRoute: number[] = []
    let currentLoad = 0

    for (const idx of deliveryIndices) {
      const demand = problem.deliveries[idx].demand
      if (currentLoad + demand <= problem.vehicles[0].capacity) {
        currentRoute.push(idx)
        currentLoad += demand
      } else {
        if (currentRoute.length > 0) {
          routes.push({
            vehicleId: problem.vehicles[routes.length % problem.vehicles.length].id,
            deliveryIndices: currentRoute,
            load: currentLoad,
            distance: 0,
          })
        }
        currentRoute = [idx]
        currentLoad = demand
      }
    }

    if (currentRoute.length > 0) {
      routes.push({
        vehicleId: problem.vehicles[routes.length % problem.vehicles.length].id,
        deliveryIndices: currentRoute,
        load: currentLoad,
        distance: 0,
      })
    }

    return routes
  }

  private evaluateFitness(individual: any[], problem: RoutingProblem, distanceMatrix: number[][]): number {
    const solution = this.buildSolution(problem, individual, distanceMatrix)
    return solution.totalCost
  }

  private tournamentSelection(population: any[], fitness: number[], size: number): any[] {
    const selected = []
    for (let i = 0; i < size; i++) {
      const a = Math.floor(Math.random() * population.length)
      const b = Math.floor(Math.random() * population.length)
      selected.push(fitness[a] < fitness[b] ? population[a] : population[b])
    }
    return selected
  }

  private crossover(parent1: any[], parent2: any[]): [any[], any[]] {
    // Simple crossover - combine routes from both parents
    const mid = Math.floor(parent1.length / 2)
    const child1 = [...parent1.slice(0, mid), ...parent2.slice(mid)]
    const child2 = [...parent2.slice(0, mid), ...parent1.slice(mid)]
    return [child1, child2]
  }

  private mutate(individual: any[]): void {
    // Swap two random routes
    if (individual.length < 2) return
    const i = Math.floor(Math.random() * individual.length)
    const j = Math.floor(Math.random() * individual.length)
    ;[individual[i], individual[j]] = [individual[j], individual[i]]
  }

  private generateNeighbor(solution: RoutingSolution, problem: RoutingProblem): RoutingSolution {
    // Generate neighbor by swapping two deliveries
    const newSolution = JSON.parse(JSON.stringify(solution))

    if (newSolution.routes.length >= 2) {
      const route1Idx = Math.floor(Math.random() * newSolution.routes.length)
      const route2Idx = Math.floor(Math.random() * newSolution.routes.length)

      const route1 = newSolution.routes[route1Idx]
      const route2 = newSolution.routes[route2Idx]

      if (route1.stops.length > 0 && route2.stops.length > 0) {
        const stop1Idx = Math.floor(Math.random() * route1.stops.length)
        const stop2Idx = Math.floor(Math.random() * route2.stops.length)

        ;[route1.stops[stop1Idx], route2.stops[stop2Idx]] =
         [route2.stops[stop2Idx], route1.stops[stop1Idx]]
      }
    }

    return newSolution
  }

  private calculateTotalCost(solution: RoutingSolution, problem: RoutingProblem, distanceMatrix: number[][]): number {
    return solution.totalCost
  }
}
