/**
 * Fleet Manager
 *
 * Comprehensive fleet management system for logistics operations.
 * Handles vehicle assignment, maintenance scheduling, utilization
 * analytics, and cost tracking.
 *
 * Key capabilities:
 * - Vehicle availability and assignment
 * - Predictive maintenance scheduling
 * - Fleet utilization analytics
 * - Cost per mile/delivery tracking
 * - Driver-vehicle matching
 * - Electric vehicle range management
 */

// @ts-ignore - Elide Python interop
import sklearn from 'python:sklearn';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';

import {
  Vehicle,
  VehicleStatus,
  VehicleType,
  Driver,
  Route,
  FleetStats,
  DriverPerformance,
  ElectricVehicleProps,
  MaintenanceSchedule,
  GeoLocation,
} from '../types';

/**
 * Maintenance event type
 */
interface MaintenanceEvent {
  vehicleId: string;
  scheduledDate: Date;
  maintenanceType: 'routine' | 'repair' | 'inspection' | 'emergency';
  estimatedDurationHours: number;
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

/**
 * Vehicle assignment result
 */
interface AssignmentResult {
  vehicleId: string;
  score: number;
  reason: string;
  alternatives: Array<{ vehicleId: string; score: number }>;
}

/**
 * Fleet Manager class
 */
export class FleetManager {
  private vehicleCache: Map<string, Vehicle> = new Map();
  private driverCache: Map<string, Driver> = new Map();

  /**
   * Get available vehicles for a specific date and depot
   */
  async getAvailableVehicles(params: {
    date: Date;
    depotId?: string;
    minCapacityKg?: number;
    vehicleType?: VehicleType;
    requiredFeatures?: string[];
  }): Promise<Vehicle[]> {
    console.log('Finding available vehicles...');

    const { date, depotId, minCapacityKg, vehicleType, requiredFeatures } = params;

    // Would fetch from database - simulated here
    const allVehicles = await this.getAllVehicles();

    let available = allVehicles.filter((v) => {
      // Check basic availability
      if (v.status !== 'available') return false;

      // Check depot
      if (depotId && v.depotId !== depotId) return false;

      // Check capacity
      if (minCapacityKg && v.capacity.weightKg < minCapacityKg) return false;

      // Check type
      if (vehicleType && v.type !== vehicleType) return false;

      // Check features
      if (requiredFeatures) {
        for (const feature of requiredFeatures) {
          if (!(v.features as any)[feature]) return false;
        }
      }

      // Check maintenance schedule
      if (this.isInMaintenance(v, date)) return false;

      return true;
    });

    console.log(`Found ${available.length} available vehicles`);

    return available;
  }

  /**
   * Assign optimal vehicle to a route
   */
  async assignVehicleToRoute(params: {
    route: Route;
    availableVehicles: Vehicle[];
    criteria?: 'cost' | 'efficiency' | 'emissions' | 'balanced';
  }): Promise<AssignmentResult> {
    const { route, availableVehicles, criteria = 'balanced' } = params;

    console.log(`Assigning vehicle to route ${route.id} using ${criteria} criteria`);

    if (availableVehicles.length === 0) {
      throw new Error('No vehicles available for assignment');
    }

    // Score each vehicle
    const scoredVehicles = availableVehicles.map((vehicle) => {
      const score = this.scoreVehicleForRoute(vehicle, route, criteria);
      return { vehicle, score };
    });

    // Sort by score (descending)
    scoredVehicles.sort((a, b) => b.score - a.score);

    const best = scoredVehicles[0];
    const alternatives = scoredVehicles
      .slice(1, 4)
      .map((sv) => ({ vehicleId: sv.vehicle.id, score: sv.score }));

    console.log(`Best vehicle: ${best.vehicle.id} (score: ${best.score.toFixed(2)})`);

    return {
      vehicleId: best.vehicle.id,
      score: best.score,
      reason: this.explainVehicleScore(best.vehicle, route, criteria),
      alternatives,
    };
  }

  /**
   * Score a vehicle's suitability for a route
   */
  private scoreVehicleForRoute(
    vehicle: Vehicle,
    route: Route,
    criteria: string
  ): number {
    let score = 100;

    // Capacity utilization score (0-30 points)
    const utilization = route.totalWeightKg / vehicle.capacity.weightKg;
    if (utilization > 1.0) {
      score -= 100; // Over capacity - major penalty
    } else if (utilization > 0.8) {
      score += 30; // Optimal utilization
    } else if (utilization > 0.6) {
      score += 20;
    } else {
      score += 10 * utilization; // Underutilization penalty
    }

    // Distance capability score (0-20 points)
    if (vehicle.maxDistanceKm && route.totalDistanceKm > vehicle.maxDistanceKm) {
      score -= 50; // Cannot complete route
    } else {
      const distanceRatio = route.totalDistanceKm / (vehicle.maxDistanceKm || 500);
      score += 20 * (1 - distanceRatio);
    }

    // Duration capability score (0-20 points)
    if (route.totalDurationMinutes / 60 > vehicle.maxDurationHours) {
      score -= 50; // Route too long
    } else {
      const durationRatio = route.totalDurationMinutes / 60 / vehicle.maxDurationHours;
      score += 20 * (1 - durationRatio);
    }

    // Cost efficiency score (0-15 points)
    const estimatedCost =
      route.totalDistanceKm * vehicle.cost.costPerKm +
      (route.totalDurationMinutes / 60) * vehicle.cost.costPerHour;

    const costPerStop = estimatedCost / route.stops.length;
    if (costPerStop < 10) {
      score += 15;
    } else if (costPerStop < 15) {
      score += 10;
    } else {
      score += 5;
    }

    // Electric vehicle bonus for short routes
    if (vehicle.fuelType === 'electric' && route.totalDistanceKm < 100) {
      score += 10;
    }

    // Criteria-specific adjustments
    switch (criteria) {
      case 'cost':
        score += 20 * (1 - costPerStop / 20);
        break;
      case 'efficiency':
        score += 20 * utilization;
        break;
      case 'emissions':
        if (vehicle.fuelType === 'electric') score += 20;
        else if (vehicle.fuelType === 'hybrid') score += 10;
        break;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Explain why a vehicle was scored a certain way
   */
  private explainVehicleScore(
    vehicle: Vehicle,
    route: Route,
    criteria: string
  ): string {
    const utilization = (route.totalWeightKg / vehicle.capacity.weightKg) * 100;
    const costPerStop =
      (route.totalDistanceKm * vehicle.cost.costPerKm +
        (route.totalDurationMinutes / 60) * vehicle.cost.costPerHour) /
      route.stops.length;

    return `${vehicle.type} with ${utilization.toFixed(0)}% capacity utilization, ` +
      `$${costPerStop.toFixed(2)} cost per stop, ${vehicle.fuelType} fuel type`;
  }

  /**
   * Schedule maintenance optimally to minimize disruption
   */
  async scheduleMaintenanceOptimal(params: {
    vehicles: Vehicle[];
    horizonDays: number;
    maintenanceCapacityPerDay?: number;
  }): Promise<MaintenanceEvent[]> {
    const { vehicles, horizonDays, maintenanceCapacityPerDay = 5 } = params;

    console.log(`Scheduling maintenance for ${vehicles.length} vehicles over ${horizonDays} days`);

    const maintenanceEvents: MaintenanceEvent[] = [];
    const today = new Date();

    // Identify vehicles needing maintenance
    const needsMaintenance = vehicles.filter((v) => {
      if (!v.maintenanceSchedule) return false;

      const daysSinceLastMaintenance = this.daysBetween(
        v.maintenanceSchedule.lastMaintenanceDate,
        today
      );

      const mileageSinceMaintenance =
        (v.maintenanceSchedule.lastMaintenanceMileage || 0) +
        (this.estimateDailyMileage(v) * daysSinceLastMaintenance);

      // Check if maintenance is due
      return (
        daysSinceLastMaintenance >= v.maintenanceSchedule.maintenanceIntervalDays * 0.9 ||
        mileageSinceMaintenance >= v.maintenanceSchedule.maintenanceIntervalKm * 0.9
      );
    });

    console.log(`${needsMaintenance.length} vehicles need maintenance`);

    // Sort by urgency (closer to maintenance limit = higher priority)
    needsMaintenance.sort((a, b) => {
      const urgencyA = this.calculateMaintenanceUrgency(a);
      const urgencyB = this.calculateMaintenanceUrgency(b);
      return urgencyB - urgencyA;
    });

    // Schedule maintenance events
    let currentDay = 0;
    let vehiclesScheduledToday = 0;

    for (const vehicle of needsMaintenance) {
      // Move to next day if capacity reached
      if (vehiclesScheduledToday >= maintenanceCapacityPerDay) {
        currentDay++;
        vehiclesScheduledToday = 0;
      }

      // Skip if beyond horizon
      if (currentDay >= horizonDays) {
        console.warn(`Cannot schedule all maintenance within ${horizonDays} day horizon`);
        break;
      }

      const scheduledDate = new Date(today);
      scheduledDate.setDate(scheduledDate.getDate() + currentDay);

      const urgency = this.calculateMaintenanceUrgency(vehicle);
      const priority =
        urgency > 0.95
          ? 'critical'
          : urgency > 0.85
          ? 'high'
          : urgency > 0.7
          ? 'medium'
          : 'low';

      maintenanceEvents.push({
        vehicleId: vehicle.id,
        scheduledDate,
        maintenanceType: 'routine',
        estimatedDurationHours: 4,
        estimatedCost: this.estimateMaintenanceCost(vehicle),
        priority: priority as any,
        description: `Routine maintenance for ${vehicle.vehicleNumber}`,
      });

      vehiclesScheduledToday++;
    }

    console.log(`Scheduled ${maintenanceEvents.length} maintenance events`);

    return maintenanceEvents;
  }

  /**
   * Analyze fleet utilization
   */
  async analyzeUtilization(params: {
    startDate: Date;
    endDate: Date;
    groupBy?: 'vehicle' | 'vehicle_type' | 'depot' | 'day';
  }): Promise<any[]> {
    const { startDate, endDate, groupBy = 'vehicle' } = params;

    console.log(`Analyzing fleet utilization from ${startDate} to ${endDate}`);

    // Would fetch actual route/usage data from database
    // Simulated data here
    const vehicles = await this.getAllVehicles();
    const days = this.daysBetween(startDate, endDate);

    const utilizationData = vehicles.map((vehicle) => {
      const avgUtilization = 0.65 + Math.random() * 0.3; // 65-95%
      const totalDistanceKm = days * this.estimateDailyMileage(vehicle) * avgUtilization;
      const totalHours = totalDistanceKm / vehicle.speedKmh;
      const totalCost =
        totalDistanceKm * vehicle.cost.costPerKm +
        totalHours * vehicle.cost.costPerHour +
        days * vehicle.cost.fixedCost;

      return {
        vehicle: vehicle.id,
        vehicleType: vehicle.type,
        depot: vehicle.depotId,
        avgUtilization,
        totalDistanceKm,
        totalHours,
        totalCost,
        costPerKm: totalCost / totalDistanceKm,
        daysActive: Math.floor(days * avgUtilization),
      };
    });

    // Group data based on groupBy parameter
    if (groupBy === 'vehicle_type') {
      return this.groupUtilizationByType(utilizationData);
    } else if (groupBy === 'depot') {
      return this.groupUtilizationByDepot(utilizationData);
    }

    return utilizationData;
  }

  /**
   * Get fleet statistics
   */
  async getFleetStats(): Promise<FleetStats> {
    const vehicles = await this.getAllVehicles();

    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter((v) => v.status === 'available').length;

    // Calculate utilization (would use actual route data)
    const avgUtilization = 0.72; // 72% average

    // Estimate metrics
    const avgMileagePerDay = vehicles.reduce(
      (sum, v) => sum + this.estimateDailyMileage(v),
      0
    ) / totalVehicles;

    const totalCostPerDay = vehicles.reduce((sum, v) => {
      const dailyMileage = this.estimateDailyMileage(v) * avgUtilization;
      const dailyHours = 8 * avgUtilization;
      return (
        sum +
        dailyMileage * v.cost.costPerKm +
        dailyHours * v.cost.costPerHour +
        v.cost.fixedCost
      );
    }, 0);

    const avgDeliveriesPerDay = totalVehicles * avgUtilization * 25; // 25 deliveries per active vehicle
    const costPerDelivery = totalCostPerDay / avgDeliveriesPerDay;

    // Breakdown by type
    const byType: Record<VehicleType, number> = {} as any;
    const byStatus: Record<VehicleStatus, number> = {} as any;
    const byDepot: Record<string, number> = {};

    vehicles.forEach((v) => {
      byType[v.type] = (byType[v.type] || 0) + 1;
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
      byDepot[v.depotId] = (byDepot[v.depotId] || 0) + 1;
    });

    return {
      totalVehicles,
      availableVehicles,
      utilizationRate: avgUtilization,
      averageMileagePerDay: avgMileagePerDay,
      totalCostPerDay,
      costPerDelivery,
      breakdown: {
        byType,
        byStatus,
        byDepot,
      },
    };
  }

  /**
   * Track vehicle in real-time
   */
  async updateVehicleLocation(
    vehicleId: string,
    location: GeoLocation,
    metadata?: {
      speed?: number;
      heading?: number;
      odometer?: number;
    }
  ): Promise<void> {
    const vehicle = await this.getVehicleById(vehicleId);

    if (vehicle) {
      vehicle.currentLocation = location;

      // Update cache
      this.vehicleCache.set(vehicleId, vehicle);

      // Would persist to database
      console.log(`Updated location for vehicle ${vehicleId}`);
    }
  }

  /**
   * Manage electric vehicle charging
   */
  async scheduleEVCharging(params: {
    vehicle: Vehicle;
    route: Route;
    chargingStations: any[];
  }): Promise<{
    needsCharging: boolean;
    recommendedStations: any[];
    chargingPlan?: any;
  }> {
    if (vehicle.fuelType !== 'electric' || !vehicle.electricProps) {
      return { needsCharging: false, recommendedStations: [] };
    }

    const ev = vehicle.electricProps;
    const routeDistance = params.route.totalDistanceKm;

    // Calculate if charging needed
    const currentRange = ev.rangeKm * (ev.currentChargePercent / 100);
    const bufferRange = ev.rangeKm * (ev.minChargePercent / 100);

    const needsCharging = currentRange < routeDistance + bufferRange;

    if (!needsCharging) {
      console.log(`Vehicle ${vehicle.id} has sufficient charge for route`);
      return { needsCharging: false, recommendedStations: [] };
    }

    console.log(`Vehicle ${vehicle.id} needs charging for route`);

    // Find nearby charging stations along route
    const recommendedStations = params.chargingStations
      .filter((station) => station.availableConnectors > 0)
      .slice(0, 3);

    // Create charging plan
    const chargingPlan = {
      stationId: recommendedStations[0]?.id,
      chargingTimeMinutes: Math.ceil(
        (ev.batteryCapacityKWh * 0.8) / ev.chargingRateKWh * 60
      ),
      targetChargePercent: 95,
      costEstimate: 15,
    };

    return {
      needsCharging: true,
      recommendedStations,
      chargingPlan,
    };
  }

  /**
   * Analyze driver-vehicle compatibility
   */
  async analyzeDriverVehicleMatch(
    driver: Driver,
    vehicle: Vehicle
  ): Promise<{
    compatible: boolean;
    score: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    let score = 100;

    // Check license compatibility
    if (vehicle.type === 'large_truck' && driver.licenseType !== 'class_a') {
      issues.push('Driver license insufficient for vehicle type');
      score -= 50;
    }

    // Check vehicle type preference
    if (
      driver.preferences.preferredVehicleTypes.length > 0 &&
      !driver.preferences.preferredVehicleTypes.includes(vehicle.type)
    ) {
      score -= 15;
    }

    // Check features
    if (vehicle.features.hazmatCertified) {
      if (!driver.certifications.includes('hazmat')) {
        issues.push('Vehicle requires HAZMAT certification');
        score -= 40;
      }
    }

    const compatible = issues.length === 0 && score >= 50;

    return { compatible, score, issues };
  }

  /**
   * Predict maintenance needs using ML
   */
  async predictMaintenanceNeeds(
    vehicle: Vehicle
  ): Promise<{
    probabilityNeedsService: number;
    daysUntilService: number;
    confidence: number;
  }> {
    // Would use sklearn model trained on historical maintenance data
    // Simulated prediction here

    if (!vehicle.maintenanceSchedule) {
      return {
        probabilityNeedsService: 0.1,
        daysUntilService: 90,
        confidence: 0.5,
      };
    }

    const daysSince = this.daysBetween(
      vehicle.maintenanceSchedule.lastMaintenanceDate,
      new Date()
    );

    const intervalDays = vehicle.maintenanceSchedule.maintenanceIntervalDays;
    const ratio = daysSince / intervalDays;

    const probability = Math.min(ratio, 1.0);
    const daysUntil = Math.max(0, intervalDays - daysSince);

    return {
      probabilityNeedsService: probability,
      daysUntilService: daysUntil,
      confidence: 0.85,
    };
  }

  /**
   * Optimize fleet size recommendation
   */
  async recommendFleetSize(params: {
    historicalDemand: number[];
    targetServiceLevel: number;
    seasonalFactors?: number[];
  }): Promise<{
    recommendedVehicles: number;
    peakRequirement: number;
    averageRequirement: number;
    breakdown: Record<VehicleType, number>;
  }> {
    const { historicalDemand, targetServiceLevel, seasonalFactors } = params;

    // Calculate statistics
    const avgDemand = historicalDemand.reduce((sum, d) => sum + d, 0) / historicalDemand.length;
    const maxDemand = Math.max(...historicalDemand);

    // Vehicles needed for average demand
    const deliveriesPerVehicle = 25; // per day
    const averageRequirement = Math.ceil(avgDemand / deliveriesPerVehicle);

    // Vehicles needed for peak demand with service level
    const peakRequirement = Math.ceil(
      (maxDemand * targetServiceLevel) / deliveriesPerVehicle
    );

    // Recommended fleet size (between average and peak)
    const recommendedVehicles = Math.ceil(
      averageRequirement + (peakRequirement - averageRequirement) * 0.6
    );

    // Breakdown by type (suggested mix)
    const breakdown: Record<VehicleType, number> = {
      bicycle: Math.floor(recommendedVehicles * 0.1),
      motorcycle: Math.floor(recommendedVehicles * 0.15),
      van: Math.floor(recommendedVehicles * 0.50),
      small_truck: Math.floor(recommendedVehicles * 0.15),
      medium_truck: Math.floor(recommendedVehicles * 0.08),
      large_truck: Math.floor(recommendedVehicles * 0.02),
      electric_van: 0,
      electric_truck: 0,
    };

    console.log(`Fleet size recommendation: ${recommendedVehicles} vehicles`);

    return {
      recommendedVehicles,
      peakRequirement,
      averageRequirement,
      breakdown,
    };
  }

  // ========== Helper Methods ==========

  /**
   * Get all vehicles (would fetch from database)
   */
  async getAllVehicles(): Promise<Vehicle[]> {
    // Simulated vehicle data
    return Array.from({ length: 20 }, (_, i) => ({
      id: `vehicle-${i + 1}`,
      vehicleNumber: `V-${String(i + 1).padStart(3, '0')}`,
      type: this.getRandomVehicleType(),
      fuelType: 'gasoline' as const,
      status: 'available' as const,
      capacity: { weightKg: 1000, volumeM3: 15 },
      cost: { fixedCost: 100, costPerKm: 0.5, costPerHour: 25 },
      maxDurationHours: 10,
      speedKmh: 40,
      depotId: `depot-${(i % 3) + 1}`,
      features: {
        refrigerated: false,
        liftGate: i % 5 === 0,
        gps: true,
        temperatureControl: false,
        hazmatCertified: i % 10 === 0,
        wheelchairAccessible: false,
      },
      maintenanceSchedule: {
        lastMaintenanceDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        lastMaintenanceMileage: 10000 + Math.random() * 5000,
        maintenanceIntervalKm: 5000,
        maintenanceIntervalDays: 90,
      },
    }));
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
    if (this.vehicleCache.has(vehicleId)) {
      return this.vehicleCache.get(vehicleId)!;
    }

    const vehicles = await this.getAllVehicles();
    return vehicles.find((v) => v.id === vehicleId) || null;
  }

  /**
   * Check if vehicle is in maintenance on a specific date
   */
  private isInMaintenance(vehicle: Vehicle, date: Date): boolean {
    // Would check maintenance schedule from database
    return false;
  }

  /**
   * Estimate daily mileage for a vehicle
   */
  private estimateDailyMileage(vehicle: Vehicle): number {
    // Rough estimate based on vehicle type
    const mileageByType: Record<VehicleType, number> = {
      bicycle: 30,
      motorcycle: 80,
      van: 150,
      small_truck: 120,
      medium_truck: 180,
      large_truck: 250,
      electric_van: 100,
      electric_truck: 150,
    };

    return mileageByType[vehicle.type] || 100;
  }

  /**
   * Calculate maintenance urgency (0-1 scale)
   */
  private calculateMaintenanceUrgency(vehicle: Vehicle): number {
    if (!vehicle.maintenanceSchedule) return 0;

    const daysSince = this.daysBetween(
      vehicle.maintenanceSchedule.lastMaintenanceDate,
      new Date()
    );

    const daysRatio = daysSince / vehicle.maintenanceSchedule.maintenanceIntervalDays;

    // Estimate mileage since last maintenance
    const estimatedMileage =
      (vehicle.maintenanceSchedule.lastMaintenanceMileage || 0) +
      this.estimateDailyMileage(vehicle) * daysSince;

    const mileageRatio = estimatedMileage / vehicle.maintenanceSchedule.maintenanceIntervalKm;

    return Math.max(daysRatio, mileageRatio);
  }

  /**
   * Estimate maintenance cost
   */
  private estimateMaintenanceCost(vehicle: Vehicle): number {
    const baseCost: Record<VehicleType, number> = {
      bicycle: 50,
      motorcycle: 150,
      van: 300,
      small_truck: 400,
      medium_truck: 600,
      large_truck: 1000,
      electric_van: 250,
      electric_truck: 500,
    };

    return baseCost[vehicle.type] || 300;
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
  }

  /**
   * Group utilization data by vehicle type
   */
  private groupUtilizationByType(data: any[]): any[] {
    const grouped = new Map<string, any>();

    data.forEach((item) => {
      if (!grouped.has(item.vehicleType)) {
        grouped.set(item.vehicleType, {
          group: item.vehicleType,
          count: 0,
          totalDistance: 0,
          totalHours: 0,
          totalCost: 0,
        });
      }

      const group = grouped.get(item.vehicleType)!;
      group.count++;
      group.totalDistance += item.totalDistanceKm;
      group.totalHours += item.totalHours;
      group.totalCost += item.totalCost;
    });

    return Array.from(grouped.values()).map((group) => ({
      ...group,
      avgUtilization: group.totalDistance / group.count / 150, // 150 km baseline
      avgDistancePerVehicle: group.totalDistance / group.count,
      costPerKm: group.totalCost / group.totalDistance,
    }));
  }

  /**
   * Group utilization data by depot
   */
  private groupUtilizationByDepot(data: any[]): any[] {
    const grouped = new Map<string, any>();

    data.forEach((item) => {
      if (!grouped.has(item.depot)) {
        grouped.set(item.depot, {
          group: item.depot,
          count: 0,
          totalDistance: 0,
          totalHours: 0,
          totalCost: 0,
        });
      }

      const group = grouped.get(item.depot)!;
      group.count++;
      group.totalDistance += item.totalDistanceKm;
      group.totalHours += item.totalHours;
      group.totalCost += item.totalCost;
    });

    return Array.from(grouped.values()).map((group) => ({
      ...group,
      avgUtilization: group.totalDistance / group.count / 150,
      avgDistancePerVehicle: group.totalDistance / group.count,
      costPerKm: group.totalCost / group.totalDistance,
    }));
  }

  /**
   * Get random vehicle type (for simulation)
   */
  private getRandomVehicleType(): VehicleType {
    const types: VehicleType[] = ['van', 'small_truck', 'medium_truck', 'large_truck'];
    return types[Math.floor(Math.random() * types.length)];
  }
}

export default FleetManager;
