/**
 * Logistics Platform Performance Benchmarks
 *
 * Comprehensive performance testing for all major components:
 * - Route optimization scaling
 * - Dynamic routing performance
 * - Fleet management operations
 * - Warehouse optimization
 * - ML model inference speed
 * - Database query performance
 */

import { RouteOptimizer } from '../src/routing/route-optimizer';
import { DynamicRouter } from '../src/routing/dynamic-routing';
import { FleetManager } from '../src/fleet/fleet-manager';
import { WarehouseOptimizer } from '../src/warehouse/warehouse-optimizer';
import { DemandPredictor } from '../src/forecasting/demand-predictor';
import { ShipmentTracker } from '../src/tracking/shipment-tracker';

import { Order, Vehicle, Depot, GeoLocation } from '../src/types';

/**
 * Benchmark result
 */
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  throughput?: number;
}

/**
 * Performance benchmark suite
 */
class LogisticsBenchmarks {
  private results: BenchmarkResult[] = [];

  /**
   * Run a benchmark
   */
  private async runBenchmark(
    name: string,
    fn: () => Promise<void>,
    iterations: number = 10
  ): Promise<BenchmarkResult> {
    console.log(`Running benchmark: ${name} (${iterations} iterations)...`);

    const times: number[] = [];

    // Warm-up run
    await fn();

    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const totalTimeMs = times.reduce((sum, t) => sum + t, 0);
    const avgTimeMs = totalTimeMs / iterations;
    const minTimeMs = Math.min(...times);
    const maxTimeMs = Math.max(...times);

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTimeMs,
      avgTimeMs,
      minTimeMs,
      maxTimeMs,
    };

    this.results.push(result);

    console.log(`  Average: ${avgTimeMs.toFixed(2)}ms`);
    console.log(`  Min: ${minTimeMs.toFixed(2)}ms`);
    console.log(`  Max: ${maxTimeMs.toFixed(2)}ms\n`);

    return result;
  }

  /**
   * Benchmark 1: Route Optimization Scaling
   */
  async benchmark1_RouteOptimizationScaling(): Promise<void> {
    console.log('\n=== Benchmark 1: Route Optimization Scaling ===\n');

    const optimizer = new RouteOptimizer();
    const depot = this.createSampleDepot();
    const vehicles = this.createSampleVehicles(10);

    // Test different problem sizes
    const sizes = [10, 25, 50, 100];

    for (const size of sizes) {
      const orders = this.createSampleOrders(size, depot.location);

      await this.runBenchmark(
        `Route optimization - ${size} orders`,
        async () => {
          await optimizer.optimizeRoutes({
            depot,
            vehicles,
            orders,
            optimizationGoal: 'minimize_cost',
            timeLimitSeconds: 10,
            allowPartialSolutions: true,
            constraints: {
              timeWindows: true,
              capacity: true,
              vehicleBreaks: false,
            },
          });
        },
        5
      );
    }
  }

  /**
   * Benchmark 2: Dynamic Order Insertion
   */
  async benchmark2_DynamicOrderInsertion(): Promise<void> {
    console.log('\n=== Benchmark 2: Dynamic Order Insertion ===\n');

    const dynamicRouter = new DynamicRouter();

    // Test insertion into routes of different sizes
    const routeSizes = [10, 25, 50];

    for (const size of routeSizes) {
      const route = this.createSampleRouteWithStops(size);
      const newOrder = this.createSampleOrders(1, route.startLocation)[0];

      await this.runBenchmark(
        `Dynamic insertion - ${size} stop route`,
        async () => {
          await dynamicRouter.insertOrder({
            route,
            order: newOrder,
            preserveTimeWindows: true,
          });
        },
        20
      );
    }
  }

  /**
   * Benchmark 3: Distance Matrix Calculation
   */
  async benchmark3_DistanceMatrixCalculation(): Promise<void> {
    console.log('\n=== Benchmark 3: Distance Matrix Calculation ===\n');

    const optimizer = new RouteOptimizer();

    const sizes = [10, 25, 50, 100];

    for (const size of sizes) {
      const locations: GeoLocation[] = Array.from({ length: size }, () => ({
        lat: 37.7749 + (Math.random() - 0.5) * 0.1,
        lng: -122.4194 + (Math.random() - 0.5) * 0.1,
      }));

      await this.runBenchmark(
        `Distance matrix - ${size}x${size}`,
        async () => {
          // Would calculate actual distance matrix
          // Simulated calculation
          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              if (i !== j) {
                this.haversineDistance(locations[i], locations[j]);
              }
            }
          }
        },
        10
      );
    }
  }

  /**
   * Benchmark 4: Fleet Utilization Analysis
   */
  async benchmark4_FleetUtilizationAnalysis(): Promise<void> {
    console.log('\n=== Benchmark 4: Fleet Utilization Analysis ===\n');

    const fleetManager = new FleetManager();

    const fleetSizes = [20, 50, 100];

    for (const size of fleetSizes) {
      await this.runBenchmark(
        `Fleet analysis - ${size} vehicles`,
        async () => {
          await fleetManager.analyzeUtilization({
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            groupBy: 'vehicle',
          });
        },
        10
      );
    }
  }

  /**
   * Benchmark 5: Warehouse Pick Path Optimization
   */
  async benchmark5_WarehousePickPath(): Promise<void> {
    console.log('\n=== Benchmark 5: Warehouse Pick Path Optimization ===\n');

    const warehouseOptimizer = new WarehouseOptimizer();

    const itemCounts = [10, 25, 50];

    for (const count of itemCounts) {
      const orders = this.createSampleOrders(count, { lat: 37.7749, lng: -122.4194 });

      await this.runBenchmark(
        `Pick path - ${count} items`,
        async () => {
          await warehouseOptimizer.optimizePickPath({
            depotId: 'depot-1',
            orders,
            startLocation: 'A-01-01',
            endLocation: 'PACKING-1',
          });
        },
        10
      );
    }
  }

  /**
   * Benchmark 6: ML Model Inference
   */
  async benchmark6_MLModelInference(): Promise<void> {
    console.log('\n=== Benchmark 6: ML Model Inference ===\n');

    const demandPredictor = new DemandPredictor();

    // Train a simple model
    const historicalData = this.generateHistoricalDemand(180);
    await demandPredictor.train({
      historicalData,
      features: ['day_of_week', 'month', 'is_holiday'],
      targetVariable: 'order_count',
      validationSplit: 0.2,
      modelType: 'linear',
    });

    // Benchmark prediction
    const forecastDays = [7, 14, 30];

    for (const days of forecastDays) {
      await this.runBenchmark(
        `Demand forecast - ${days} days`,
        async () => {
          await demandPredictor.predict({
            startDate: new Date('2024-02-01'),
            days,
            region: 'san-francisco',
          });
        },
        20
      );
    }
  }

  /**
   * Benchmark 7: Real-Time Tracking Updates
   */
  async benchmark7_TrackingUpdates(): Promise<void> {
    console.log('\n=== Benchmark 7: Real-Time Tracking Updates ===\n');

    const tracker = new ShipmentTracker();

    await this.runBenchmark(
      'GPS location update processing',
      async () => {
        await tracker.logEvent({
          eventType: 'location_update',
          timestamp: new Date(),
          vehicleId: 'vehicle-1',
          routeId: 'route-1',
          location: {
            lat: 37.7749 + (Math.random() - 0.5) * 0.01,
            lng: -122.4194 + (Math.random() - 0.5) * 0.01,
          },
          speed: 45,
          heading: 90,
        });
      },
      100
    );

    await this.runBenchmark(
      'ETA prediction',
      async () => {
        const route = this.createSampleRouteWithStops(15);
        await tracker.predictETA({
          route,
          currentLocation: route.startLocation,
          contextualFactors: {},
        });
      },
      50
    );
  }

  /**
   * Benchmark 8: Analytics Calculations
   */
  async benchmark8_AnalyticsCalculations(): Promise<void> {
    console.log('\n=== Benchmark 8: Analytics Calculations ===\n');

    const LogisticsAnalytics = (await import('../src/analytics/logistics-analytics')).default;
    const analytics = new LogisticsAnalytics();

    await this.runBenchmark(
      'Performance metrics calculation (30 days)',
      async () => {
        await analytics.calculateMetrics({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          groupBy: 'day',
        });
      },
      10
    );

    const routes = Array.from({ length: 20 }, (_, i) =>
      this.createSampleRouteWithStops(15)
    );

    await this.runBenchmark(
      'Route efficiency analysis (20 routes)',
      async () => {
        await analytics.analyzeRouteEfficiency({
          routes,
          compareToOptimal: true,
        });
      },
      10
    );
  }

  /**
   * Benchmark 9: Concurrent Operations
   */
  async benchmark9_ConcurrentOperations(): Promise<void> {
    console.log('\n=== Benchmark 9: Concurrent Operations ===\n');

    const optimizer = new RouteOptimizer();
    const depot = this.createSampleDepot();
    const vehicles = this.createSampleVehicles(5);

    // Simulate multiple concurrent optimization requests
    await this.runBenchmark(
      'Concurrent optimizations (3 parallel)',
      async () => {
        const orders1 = this.createSampleOrders(20, depot.location);
        const orders2 = this.createSampleOrders(20, depot.location);
        const orders3 = this.createSampleOrders(20, depot.location);

        await Promise.all([
          optimizer.optimizeRoutes({
            depot,
            vehicles,
            orders: orders1,
            optimizationGoal: 'minimize_cost',
            timeLimitSeconds: 5,
            allowPartialSolutions: true,
            constraints: {
              timeWindows: true,
              capacity: true,
              vehicleBreaks: false,
            },
          }),
          optimizer.optimizeRoutes({
            depot,
            vehicles,
            orders: orders2,
            optimizationGoal: 'minimize_distance',
            timeLimitSeconds: 5,
            allowPartialSolutions: true,
            constraints: {
              timeWindows: true,
              capacity: true,
              vehicleBreaks: false,
            },
          }),
          optimizer.optimizeRoutes({
            depot,
            vehicles,
            orders: orders3,
            optimizationGoal: 'minimize_time',
            timeLimitSeconds: 5,
            allowPartialSolutions: true,
            constraints: {
              timeWindows: true,
              capacity: true,
              vehicleBreaks: false,
            },
          }),
        ]);
      },
      5
    );
  }

  /**
   * Benchmark 10: Memory Usage
   */
  async benchmark10_MemoryUsage(): Promise<void> {
    console.log('\n=== Benchmark 10: Memory Usage ===\n');

    const optimizer = new RouteOptimizer();
    const depot = this.createSampleDepot();
    const vehicles = this.createSampleVehicles(10);

    // Create large problem
    const orders = this.createSampleOrders(500, depot.location);

    const memBefore = process.memoryUsage();

    await optimizer.optimizeRoutes({
      depot,
      vehicles,
      orders,
      optimizationGoal: 'minimize_cost',
      timeLimitSeconds: 30,
      allowPartialSolutions: true,
      constraints: {
        timeWindows: true,
        capacity: true,
        vehicleBreaks: false,
      },
    });

    const memAfter = process.memoryUsage();

    console.log('Memory usage (500 orders):');
    console.log(`  Heap used: ${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  External: ${((memAfter.external - memBefore.external) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  RSS: ${((memAfter.rss - memBefore.rss) / 1024 / 1024).toFixed(2)} MB\n`);
  }

  /**
   * Run all benchmarks
   */
  async runAllBenchmarks(): Promise<void> {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   Logistics Platform Performance Benchmarks       ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const startTime = Date.now();

    await this.benchmark1_RouteOptimizationScaling();
    await this.benchmark2_DynamicOrderInsertion();
    await this.benchmark3_DistanceMatrixCalculation();
    await this.benchmark4_FleetUtilizationAnalysis();
    await this.benchmark5_WarehousePickPath();
    await this.benchmark6_MLModelInference();
    await this.benchmark7_TrackingUpdates();
    await this.benchmark8_AnalyticsCalculations();
    await this.benchmark9_ConcurrentOperations();
    await this.benchmark10_MemoryUsage();

    const totalTime = (Date.now() - startTime) / 1000;

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║              Benchmark Summary                     ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('Operation                                  | Avg Time (ms)');
    console.log('-------------------------------------------|---------------');

    this.results.forEach((result) => {
      const name = result.name.padEnd(42);
      const avg = result.avgTimeMs.toFixed(2).padStart(12);
      console.log(`${name} | ${avg}`);
    });

    console.log(`\nTotal benchmark time: ${totalTime.toFixed(2)}s`);
    console.log(`Total operations: ${this.results.reduce((sum, r) => sum + r.iterations, 0)}`);

    // Performance rating
    const avgTime = this.results.reduce((sum, r) => sum + r.avgTimeMs, 0) / this.results.length;
    let rating = 'Excellent';
    if (avgTime > 100) rating = 'Good';
    if (avgTime > 500) rating = 'Fair';
    if (avgTime > 1000) rating = 'Needs Optimization';

    console.log(`\nOverall Performance Rating: ${rating}`);
    console.log(`Average operation time: ${avgTime.toFixed(2)}ms\n`);
  }

  // ========== Helper Methods ==========

  /**
   * Create sample depot
   */
  private createSampleDepot(): Depot {
    return {
      id: 'depot-1',
      name: 'Test Depot',
      code: 'TD1',
      address: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
      },
      location: { lat: 37.7749, lng: -122.4194 },
      type: 'distribution_center',
      operatingHours: { start: '06:00', end: '22:00' },
      capacity: {
        totalAreaSqM: 5000,
        storageAreaSqM: 4000,
        dockDoors: 10,
        maxVehicles: 30,
        maxVolumeM3: 10000,
        maxWeightKg: 50000,
      },
      zones: [],
      isActive: true,
    };
  }

  /**
   * Create sample vehicles
   */
  private createSampleVehicles(count: number): Vehicle[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `vehicle-${i + 1}`,
      vehicleNumber: `V-${String(i + 1).padStart(3, '0')}`,
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
    }));
  }

  /**
   * Create sample orders
   */
  private createSampleOrders(count: number, center: GeoLocation): Order[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `order-${i + 1}`,
      orderNumber: `ORD-${String(i + 1).padStart(4, '0')}`,
      customerName: `Customer ${i + 1}`,
      customerPhone: `555-${String(i).padStart(4, '0')}`,
      deliveryAddress: {
        street: `${i + 1} Test St`,
        city: 'Test City',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
      },
      deliveryLocation: {
        lat: center.lat + (Math.random() - 0.5) * 0.1,
        lng: center.lng + (Math.random() - 0.5) * 0.1,
      },
      priority: Math.floor(Math.random() * 5) + 1 as any,
      type: 'standard',
      status: 'pending',
      dimensions: {
        weightKg: 5 + Math.random() * 45,
        volumeM3: 0.5 + Math.random() * 2,
      },
      serviceTimeMinutes: 5 + Math.floor(Math.random() * 10),
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
   * Create sample route with stops
   */
  private createSampleRouteWithStops(stopCount: number): any {
    const stops = Array.from({ length: stopCount }, (_, i) => ({
      id: `stop-${i + 1}`,
      routeId: 'route-1',
      stopSequence: i,
      stopType: 'delivery' as const,
      orderId: `order-${i + 1}`,
      location: {
        lat: 37.7749 + (Math.random() - 0.5) * 0.05,
        lng: -122.4194 + (Math.random() - 0.5) * 0.05,
      },
      plannedArrivalTime: new Date(),
      plannedDepartureTime: new Date(),
      status: 'pending' as const,
      serviceTimeMinutes: 10,
      distanceFromPreviousKm: 5,
      durationFromPreviousMinutes: 15,
    }));

    return {
      id: 'route-1',
      routeNumber: 'R-001',
      vehicleId: 'vehicle-1',
      depotId: 'depot-1',
      date: new Date(),
      status: 'planned',
      stops,
      startLocation: { lat: 37.7749, lng: -122.4194 },
      endLocation: { lat: 37.7749, lng: -122.4194 },
      plannedStartTime: new Date(),
      plannedEndTime: new Date(),
      totalDistanceKm: stopCount * 5,
      totalDurationMinutes: stopCount * 15,
      totalWeightKg: stopCount * 25,
      totalVolumeM3: stopCount * 1.5,
      totalCost: stopCount * 15,
      completedStops: 0,
      optimization: {
        optimizationTime: 5,
        algorithm: 'OR-Tools',
        objectiveValue: 100,
        utilizationPercent: 70,
        efficiencyScore: 85,
      },
    };
  }

  /**
   * Generate historical demand data
   */
  private generateHistoricalDemand(days: number): any[] {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));

      return {
        date,
        orderCount: 100 + Math.floor(Math.random() * 100),
        totalVolume: 0,
        totalWeight: 0,
        dayOfWeek: date.getDay(),
        month: date.getMonth() + 1,
        isHoliday: false,
        temperature: 20,
        promotionActive: false,
      };
    });
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
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

// Run benchmarks if executed directly
if (require.main === module) {
  const benchmarks = new LogisticsBenchmarks();
  benchmarks.runAllBenchmarks().catch(console.error);
}

export default LogisticsBenchmarks;
