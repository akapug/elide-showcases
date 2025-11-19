/**
 * Logistics Platform Demo
 *
 * Comprehensive demonstration of the logistics optimization platform
 * capabilities including route optimization, dynamic routing, fleet
 * management, warehouse operations, forecasting, tracking, and analytics.
 */

import { RouteOptimizer } from '../src/routing/route-optimizer';
import { DynamicRouter } from '../src/routing/dynamic-routing';
import { FleetManager } from '../src/fleet/fleet-manager';
import { WarehouseOptimizer } from '../src/warehouse/warehouse-optimizer';
import { DemandPredictor } from '../src/forecasting/demand-predictor';
import { ShipmentTracker } from '../src/tracking/shipment-tracker';
import { LogisticsAnalytics } from '../src/analytics/logistics-analytics';

import {
  Order,
  Vehicle,
  Depot,
  Driver,
  GeoLocation,
  Route,
} from '../src/types';

/**
 * Demo scenarios
 */
class LogisticsDemo {
  private routeOptimizer: RouteOptimizer;
  private dynamicRouter: DynamicRouter;
  private fleetManager: FleetManager;
  private warehouseOptimizer: WarehouseOptimizer;
  private demandPredictor: DemandPredictor;
  private shipmentTracker: ShipmentTracker;
  private analytics: LogisticsAnalytics;

  constructor() {
    this.routeOptimizer = new RouteOptimizer();
    this.dynamicRouter = new DynamicRouter();
    this.fleetManager = new FleetManager();
    this.warehouseOptimizer = new WarehouseOptimizer();
    this.demandPredictor = new DemandPredictor();
    this.shipmentTracker = new ShipmentTracker();
    this.analytics = new LogisticsAnalytics();
  }

  /**
   * Demo 1: Basic Route Optimization
   */
  async demo1_BasicRouteOptimization(): Promise<void> {
    console.log('\n=== DEMO 1: Basic Route Optimization ===\n');

    // Create depot
    const depot: Depot = {
      id: 'depot-sf',
      name: 'San Francisco Distribution Center',
      code: 'SF-DC',
      address: {
        street: '123 Market St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
        location: { lat: 37.7749, lng: -122.4194 },
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

    // Create vehicles
    const vehicles: Vehicle[] = [
      {
        id: 'vehicle-1',
        vehicleNumber: 'V-001',
        type: 'van',
        fuelType: 'gasoline',
        status: 'available',
        capacity: { weightKg: 1000, volumeM3: 15 },
        cost: { fixedCost: 100, costPerKm: 0.50, costPerHour: 25 },
        maxDurationHours: 10,
        speedKmh: 40,
        depotId: depot.id,
        features: {
          refrigerated: false,
          liftGate: false,
          gps: true,
          temperatureControl: false,
          hazmatCertified: false,
          wheelchairAccessible: false,
        },
      },
      {
        id: 'vehicle-2',
        vehicleNumber: 'V-002',
        type: 'van',
        fuelType: 'gasoline',
        status: 'available',
        capacity: { weightKg: 1000, volumeM3: 15 },
        cost: { fixedCost: 100, costPerKm: 0.50, costPerHour: 25 },
        maxDurationHours: 10,
        speedKmh: 40,
        depotId: depot.id,
        features: {
          refrigerated: false,
          liftGate: false,
          gps: true,
          temperatureControl: false,
          hazmatCertified: false,
          wheelchairAccessible: false,
        },
      },
    ];

    // Create sample orders
    const orders: Order[] = this.generateSampleOrders(20, depot.location);

    console.log(`Depot: ${depot.name}`);
    console.log(`Vehicles available: ${vehicles.length}`);
    console.log(`Orders to deliver: ${orders.length}`);
    console.log('\nOptimizing routes...\n');

    // Optimize routes
    const solution = await this.routeOptimizer.optimizeRoutes({
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

    // Display results
    console.log('=== Optimization Results ===');
    console.log(`Total routes: ${solution.routes.length}`);
    console.log(`Total cost: $${solution.totalCost.toFixed(2)}`);
    console.log(`Total distance: ${solution.totalDistanceKm.toFixed(2)} km`);
    console.log(`Total duration: ${(solution.totalDurationMinutes / 60).toFixed(1)} hours`);
    console.log(`Fleet utilization: ${(solution.utilizationRate * 100).toFixed(1)}%`);
    console.log(`Unassigned orders: ${solution.unassignedOrders.length}`);

    solution.routes.forEach((route, idx) => {
      console.log(`\nRoute ${idx + 1} (${route.vehicleId}):`);
      console.log(`  Stops: ${route.stops.length}`);
      console.log(`  Distance: ${route.totalDistanceKm.toFixed(2)} km`);
      console.log(`  Duration: ${(route.totalDurationMinutes / 60).toFixed(1)} hours`);
      console.log(`  Cost: $${route.totalCost.toFixed(2)}`);
      console.log(`  Capacity utilization: ${route.optimization.utilizationPercent.toFixed(1)}%`);
    });
  }

  /**
   * Demo 2: Dynamic Route Updates
   */
  async demo2_DynamicRouteUpdates(): Promise<void> {
    console.log('\n=== DEMO 2: Dynamic Route Updates ===\n');

    // Create a sample existing route
    const existingRoute = this.createSampleRoute();

    console.log(`Existing route: ${existingRoute.routeNumber}`);
    console.log(`Current stops: ${existingRoute.stops.length}`);
    console.log(`Distance: ${existingRoute.totalDistanceKm.toFixed(2)} km\n`);

    // Create urgent order
    const urgentOrder: Order = {
      id: 'order-urgent',
      orderNumber: 'URG-001',
      customerName: 'Priority Customer',
      customerPhone: '555-0199',
      deliveryAddress: {
        street: '789 Emergency Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94110',
        country: 'USA',
      },
      deliveryLocation: { lat: 37.7599, lng: -122.4148 },
      priority: 10,
      type: 'express',
      status: 'pending',
      dimensions: { weightKg: 15, volumeM3: 1 },
      serviceTimeMinutes: 5,
      specialRequirements: {
        signatureRequired: true,
        ageVerification: false,
        refrigerated: false,
        fragile: false,
        hazmat: false,
        oversized: false,
        liftGateRequired: false,
        appointmentRequired: false,
      },
    };

    console.log('Urgent order received!');
    console.log(`Order: ${urgentOrder.orderNumber}`);
    console.log(`Priority: ${urgentOrder.priority}/10`);
    console.log(`Weight: ${urgentOrder.dimensions.weightKg} kg\n`);

    console.log('Attempting dynamic insertion...\n');

    // Insert into existing route
    const result = await this.dynamicRouter.insertOrder({
      route: existingRoute,
      order: urgentOrder,
      preserveTimeWindows: true,
    });

    if (result.success) {
      console.log('✓ Order successfully inserted!');
      console.log(`Insertion point: Stop ${result.insertionIndex}`);
      console.log(`Distance increase: ${result.impactAnalysis.distanceChange.toFixed(2)} km`);
      console.log(`Duration increase: ${result.impactAnalysis.durationChange.toFixed(0)} minutes`);
      console.log(`Cost increase: $${result.impactAnalysis.costChange.toFixed(2)}`);
      console.log(`Affected stops: ${result.impactAnalysis.affectedStops.length}`);
    } else {
      console.log('✗ Could not insert order');
      console.log(`Reason: ${result.reason}`);
    }
  }

  /**
   * Demo 3: Fleet Management
   */
  async demo3_FleetManagement(): Promise<void> {
    console.log('\n=== DEMO 3: Fleet Management ===\n');

    // Get fleet statistics
    const stats = await this.fleetManager.getFleetStats();

    console.log('Fleet Overview:');
    console.log(`Total vehicles: ${stats.totalVehicles}`);
    console.log(`Available: ${stats.availableVehicles}`);
    console.log(`Utilization rate: ${(stats.utilizationRate * 100).toFixed(1)}%`);
    console.log(`Average mileage: ${stats.averageMileagePerDay.toFixed(0)} km/day`);
    console.log(`Total cost: $${stats.totalCostPerDay.toFixed(2)}/day`);
    console.log(`Cost per delivery: $${stats.costPerDelivery.toFixed(2)}`);

    console.log('\nFleet breakdown by type:');
    Object.entries(stats.breakdown.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} vehicles`);
    });

    console.log('\nScheduling maintenance...\n');

    // Schedule maintenance
    const vehicles = await this.fleetManager.getAllVehicles();
    const maintenanceSchedule = await this.fleetManager.scheduleMaintenanceOptimal({
      vehicles: vehicles,
      horizonDays: 30,
      maintenanceCapacityPerDay: 3,
    });

    console.log(`Maintenance events scheduled: ${maintenanceSchedule.length}`);
    maintenanceSchedule.slice(0, 5).forEach((event) => {
      console.log(`  ${event.vehicleId}: ${event.scheduledDate.toISOString().split('T')[0]} - ${event.priority} priority`);
    });

    console.log('\nAnalyzing utilization...\n');

    // Analyze utilization
    const utilizationAnalysis = await this.fleetManager.analyzeUtilization({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      groupBy: 'vehicle_type',
    });

    console.log('Utilization by vehicle type:');
    utilizationAnalysis.forEach((stat: any) => {
      console.log(`\n${stat.group}:`);
      console.log(`  Average utilization: ${(stat.avgUtilization * 100).toFixed(1)}%`);
      console.log(`  Total distance: ${stat.totalDistance.toFixed(0)} km`);
      console.log(`  Cost per km: $${stat.costPerKm.toFixed(2)}`);
    });
  }

  /**
   * Demo 4: Warehouse Optimization
   */
  async demo4_WarehouseOptimization(): Promise<void> {
    console.log('\n=== DEMO 4: Warehouse Optimization ===\n');

    // Generate sample inventory
    const inventory = this.generateSampleInventory(100);
    const pickFrequency = new Map<string, number>();
    inventory.forEach((item) => {
      pickFrequency.set(item.sku, Math.floor(Math.random() * 50));
    });

    console.log(`Inventory items: ${inventory.length}`);
    console.log('Optimizing inventory placement...\n');

    // Optimize slotting
    const slottingRec = await this.warehouseOptimizer.optimizeInventoryPlacement({
      depotId: 'depot-1',
      items: inventory,
      pickFrequencyData: pickFrequency,
      warehouseLayout: {
        zones: ['A', 'B', 'C'],
        aislesPerZone: 10,
        shelvesPerAisle: 20,
      },
    });

    console.log('Slotting Optimization Results:');
    console.log(`Relocations needed: ${slottingRec.relocations.length}`);
    console.log(`Estimated time reduction: ${slottingRec.estimatedTimeReduction.toFixed(1)}%`);
    console.log(`Implementation cost: $${slottingRec.implementationCost.toFixed(2)}`);

    console.log('\nTop 5 relocations:');
    slottingRec.relocations.slice(0, 5).forEach((rel) => {
      console.log(`  ${rel.sku}: ${rel.currentLocation} → ${rel.newLocation}`);
      console.log(`    Reason: ${rel.reason}`);
    });

    // Analyze space utilization
    console.log('\nAnalyzing space utilization...\n');

    const spaceAnalysis = await this.warehouseOptimizer.analyzeSpaceUtilization({
      depotId: 'depot-1',
      inventory,
    });

    console.log('Space Utilization:');
    console.log(`Total space: ${spaceAnalysis.totalSpaceM3.toFixed(0)} m³`);
    console.log(`Used space: ${spaceAnalysis.usedSpaceM3.toFixed(0)} m³`);
    console.log(`Utilization: ${spaceAnalysis.utilizationPercent.toFixed(1)}%`);

    console.log('\nBy zone:');
    Object.entries(spaceAnalysis.byZone).forEach(([zone, util]) => {
      console.log(`  Zone ${zone}: ${util.toFixed(1)}%`);
    });

    if (spaceAnalysis.recommendations.length > 0) {
      console.log('\nRecommendations:');
      spaceAnalysis.recommendations.forEach((rec) => {
        console.log(`  • ${rec}`);
      });
    }
  }

  /**
   * Demo 5: Demand Forecasting
   */
  async demo5_DemandForecasting(): Promise<void> {
    console.log('\n=== DEMO 5: Demand Forecasting ===\n');

    // Generate historical data
    const historicalData = this.generateHistoricalDemand(180); // 6 months

    console.log(`Historical data: ${historicalData.length} days`);
    console.log('Training forecasting model...\n');

    // Train model
    const modelMetrics = await this.demandPredictor.train({
      historicalData,
      features: [
        'day_of_week',
        'month',
        'is_holiday',
        'temperature',
        'promotion_active',
      ],
      targetVariable: 'order_count',
      validationSplit: 0.2,
      modelType: 'ensemble',
    });

    console.log('Model Training Results:');
    console.log(`Accuracy: ${modelMetrics.accuracy.toFixed(1)}%`);
    console.log(`RMSE: ${modelMetrics.rmse.toFixed(2)}`);
    console.log(`MAE: ${modelMetrics.mae.toFixed(2)}`);
    console.log(`R² Score: ${modelMetrics.r2Score.toFixed(3)}`);

    // Generate forecast
    console.log('\nGenerating 30-day forecast...\n');

    const forecast = await this.demandPredictor.predict({
      startDate: new Date('2024-02-01'),
      days: 30,
      region: 'san-francisco',
      externalFactors: {
        holidays: ['2024-02-14'], // Valentine's Day
        events: [],
      },
    });

    console.log('Demand Forecast:');
    console.log('Date       | Predicted Orders | Confidence Interval');
    console.log('-----------|------------------|--------------------');
    forecast.slice(0, 10).forEach((day) => {
      const dateStr = day.date.toISOString().split('T')[0];
      const ci = `${day.confidenceInterval.lower}-${day.confidenceInterval.upper}`;
      console.log(`${dateStr} | ${day.predictedOrders.toString().padStart(16)} | ${ci}`);
    });

    // Plan capacity
    console.log('\nPlanning capacity...\n');

    const capacityPlan = await this.demandPredictor.planCapacity({
      forecast,
      currentFleetSize: 20,
      targetServiceLevel: 0.95,
    });

    const peakDay = capacityPlan.reduce((max, day) =>
      day.forecast.predictedOrders > max.forecast.predictedOrders ? day : max
    );

    console.log('Capacity Recommendations:');
    console.log(`Current fleet: 20 vehicles`);
    console.log(`Peak day: ${peakDay.date.toISOString().split('T')[0]} (${peakDay.forecast.predictedOrders} orders)`);
    console.log(`Recommended vehicles for peak: ${peakDay.recommendedCapacity.vehicles}`);
    console.log(`Additional drivers needed: ${peakDay.recommendedCapacity.drivers - 20}`);
  }

  /**
   * Demo 6: Real-Time Tracking
   */
  async demo6_RealTimeTracking(): Promise<void> {
    console.log('\n=== DEMO 6: Real-Time Tracking ===\n');

    // Set up event listeners
    this.shipmentTracker.on('location_update', (event: any) => {
      console.log(`Vehicle ${event.vehicleId} at ${event.location.lat.toFixed(4)}, ${event.location.lng.toFixed(4)}`);
    });

    this.shipmentTracker.on('geofence_enter', (event: any) => {
      console.log(`✓ Vehicle ${event.vehicleId} arrived at stop ${event.stopId}`);
    });

    this.shipmentTracker.on('delay_detected', (event: any) => {
      console.log(`⚠ Delay detected on route ${event.routeId}: ${event.delayMinutes} minutes`);
    });

    console.log('Starting real-time tracking for vehicle-1...\n');

    // Start tracking
    this.shipmentTracker.startTracking({
      vehicleId: 'vehicle-1',
      routeId: 'route-1',
      updateIntervalSeconds: 5,
    });

    // Let it run for a bit
    await new Promise((resolve) => setTimeout(resolve, 15000)); // 15 seconds

    console.log('\nStopping tracking...\n');

    this.shipmentTracker.stopTracking('vehicle-1');

    console.log('Tracking demonstration complete.');
  }

  /**
   * Demo 7: Analytics and Reporting
   */
  async demo7_AnalyticsAndReporting(): Promise<void> {
    console.log('\n=== DEMO 7: Analytics and Reporting ===\n');

    // Calculate metrics
    const metrics = await this.analytics.calculateMetrics({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      groupBy: 'day',
    });

    console.log('Performance Metrics (Last 7 days):');
    console.log('Date       | Orders | On-Time % | Avg Time | Cost/Del');
    console.log('-----------|--------|-----------|----------|----------');
    metrics.slice(0, 7).forEach((day) => {
      const dateStr = day.period.start.toISOString().split('T')[0];
      const onTime = (day.deliveries.onTimeRate * 100).toFixed(0);
      const avgTime = day.deliveries.averageDeliveryTime.toFixed(0);
      const cost = day.costs.costPerDelivery.toFixed(2);
      console.log(`${dateStr} | ${day.orders.total.toString().padStart(6)} | ${onTime.padStart(9)}% | ${avgTime.padStart(8)} | $${cost.padStart(7)}`);
    });

    // Generate executive summary
    console.log('\nGenerating executive summary...\n');

    const summary = await this.analytics.generateExecutiveSummary({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    console.log('Executive Summary:');
    console.log('\nKey Metrics:');
    Object.entries(summary.keyMetrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\nHighlights:');
    summary.highlights.forEach((h) => console.log(`  ✓ ${h}`));

    console.log('\nConcerns:');
    summary.concerns.forEach((c) => console.log(`  ⚠ ${c}`));

    console.log('\nRecommendations:');
    summary.recommendations.forEach((r) => console.log(`  → ${r}`));
  }

  /**
   * Run all demos
   */
  async runAllDemos(): Promise<void> {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   Logistics Optimization Platform - Full Demo     ║');
    console.log('╚════════════════════════════════════════════════════╝');

    try {
      await this.demo1_BasicRouteOptimization();
      await this.demo2_DynamicRouteUpdates();
      await this.demo3_FleetManagement();
      await this.demo4_WarehouseOptimization();
      await this.demo5_DemandForecasting();
      // await this.demo6_RealTimeTracking(); // Skip in automated demo
      await this.demo7_AnalyticsAndReporting();

      console.log('\n╔════════════════════════════════════════════════════╗');
      console.log('║           All Demos Completed Successfully!        ║');
      console.log('╚════════════════════════════════════════════════════╝\n');
    } catch (error) {
      console.error('\nError running demos:', error);
    }
  }

  // ========== Helper Methods ==========

  /**
   * Generate sample orders
   */
  private generateSampleOrders(count: number, depotLocation: GeoLocation): Order[] {
    const orders: Order[] = [];

    for (let i = 0; i < count; i++) {
      // Random location within ~10km radius
      const lat = depotLocation.lat + (Math.random() - 0.5) * 0.1;
      const lng = depotLocation.lng + (Math.random() - 0.5) * 0.1;

      orders.push({
        id: `order-${i + 1}`,
        orderNumber: `ORD-${String(i + 1).padStart(4, '0')}`,
        customerName: `Customer ${i + 1}`,
        customerPhone: `555-01${String(i).padStart(2, '0')}`,
        deliveryAddress: {
          street: `${i + 1} Main St`,
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          country: 'USA',
        },
        deliveryLocation: { lat, lng },
        priority: Math.floor(Math.random() * 5) + 1 as any,
        type: 'standard',
        status: 'pending',
        dimensions: {
          weightKg: 5 + Math.random() * 45,
          volumeM3: 0.5 + Math.random() * 2,
        },
        serviceTimeMinutes: 5 + Math.floor(Math.random() * 10),
        specialRequirements: {
          signatureRequired: Math.random() > 0.7,
          ageVerification: false,
          refrigerated: false,
          fragile: Math.random() > 0.8,
          hazmat: false,
          oversized: false,
          liftGateRequired: false,
          appointmentRequired: false,
        },
      });
    }

    return orders;
  }

  /**
   * Create sample route
   */
  private createSampleRoute(): Route {
    const stops = Array.from({ length: 8 }, (_, i) => ({
      id: `stop-${i + 1}`,
      routeId: 'route-1',
      stopSequence: i,
      stopType: 'delivery' as const,
      orderId: `order-${i + 1}`,
      location: {
        lat: 37.7749 + (Math.random() - 0.5) * 0.05,
        lng: -122.4194 + (Math.random() - 0.5) * 0.05,
      },
      plannedArrivalTime: new Date(Date.now() + i * 30 * 60000),
      plannedDepartureTime: new Date(Date.now() + (i * 30 + 10) * 60000),
      status: 'pending' as const,
      serviceTimeMinutes: 10,
      distanceFromPreviousKm: 5 + Math.random() * 5,
      durationFromPreviousMinutes: 15 + Math.random() * 10,
    }));

    return {
      id: 'route-1',
      routeNumber: 'R-001',
      vehicleId: 'vehicle-1',
      depotId: 'depot-1',
      date: new Date(),
      status: 'in_progress',
      stops,
      startLocation: { lat: 37.7749, lng: -122.4194 },
      endLocation: { lat: 37.7749, lng: -122.4194 },
      plannedStartTime: new Date(),
      plannedEndTime: new Date(Date.now() + 8 * 60 * 60000),
      totalDistanceKm: 45,
      totalDurationMinutes: 240,
      totalWeightKg: 350,
      totalVolumeM3: 12,
      totalCost: 150,
      completedStops: 2,
      currentStopIndex: 2,
      optimization: {
        optimizationTime: 5.2,
        algorithm: 'OR-Tools',
        objectiveValue: 150,
        utilizationPercent: 70,
        efficiencyScore: 85,
      },
    };
  }

  /**
   * Generate sample inventory
   */
  private generateSampleInventory(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `inv-${i + 1}`,
      sku: `SKU-${String(i + 1).padStart(4, '0')}`,
      productName: `Product ${i + 1}`,
      depotId: 'depot-1',
      location: {
        zone: ['A', 'B', 'C'][i % 3],
        aisle: String(Math.floor(i / 10) + 1).padStart(2, '0'),
        shelf: String((i % 10) + 1).padStart(2, '0'),
        bin: '01',
      },
      quantity: 10 + Math.floor(Math.random() * 90),
      dimensions: {
        weightKg: 1 + Math.random() * 10,
        volumeM3: 0.1 + Math.random() * 0.9,
      },
      pickFrequency: Math.floor(Math.random() * 50),
    }));
  }

  /**
   * Generate historical demand data
   */
  private generateHistoricalDemand(days: number): any[] {
    const data: any[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const dayOfWeek = date.getDay();
      const month = date.getMonth();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const seasonalFactor = [0.9, 0.95, 1.0, 1.0, 1.05, 1.1, 1.1, 1.05, 1.0, 1.05, 1.15, 1.25][month];

      let baseOrders = 150;
      if (isWeekend) baseOrders *= 0.7;
      baseOrders *= seasonalFactor;

      data.push({
        date,
        orderCount: Math.floor(baseOrders + (Math.random() - 0.5) * 30),
        totalVolume: 0,
        totalWeight: 0,
        dayOfWeek,
        month: month + 1,
        isHoliday: false,
        temperature: 15 + Math.random() * 15,
        promotionActive: Math.random() > 0.9,
      });
    }

    return data;
  }
}

// Run demos if executed directly
if (require.main === module) {
  const demo = new LogisticsDemo();
  demo.runAllDemos().catch(console.error);
}

export default LogisticsDemo;
