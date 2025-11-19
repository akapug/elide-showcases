/**
 * Smart City Platform - Waste Management System
 *
 * Smart waste collection optimization using TypeScript + Python route optimization.
 * Implements vehicle routing, bin monitoring, and predictive fill level forecasting.
 */

// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import networkx from 'python:networkx';

import type {
  WasteManagementSystem,
  SmartBin,
  WasteTruck,
  WasteFacility,
  WasteRoute,
  WasteType,
  BinStatus,
  TruckStatus,
  GeoCoordinates,
  IoTSensor
} from '../types.ts';

/**
 * Waste Management and Route Optimization System
 */
export class WasteManagementOptimizer {
  private system: WasteManagementSystem;
  private fillLevelHistory: Map<string, FillLevelRecord[]> = new Map();
  private routeHistory: WasteRoute[] = [];

  constructor(system: WasteManagementSystem) {
    this.system = system;
  }

  /**
   * Monitor all smart bins and update status
   */
  async monitorBins(): Promise<Map<string, BinStatus>> {
    const binStatuses = new Map<string, BinStatus>();

    for (const bin of this.system.bins) {
      try {
        const fillLevel = await this.readBinFillLevel(bin);
        bin.fillLevel = fillLevel;

        // Update status based on fill level
        bin.status = this.determineBinStatus(fillLevel);
        binStatuses.set(bin.binId, bin.status);

        // Record historical data
        this.recordFillLevel(bin.binId, fillLevel, bin.temperature);

        // Check for anomalies
        if (bin.temperature > 60) {
          console.warn(`High temperature detected in bin ${bin.binId}: ${bin.temperature}°C`);
        }
      } catch (error) {
        console.error(`Error monitoring bin ${bin.binId}:`, error);
        bin.status = 'maintenance';
      }
    }

    return binStatuses;
  }

  /**
   * Read fill level from bin sensor
   */
  private async readBinFillLevel(bin: SmartBin): Promise<number> {
    // In production, this would read from actual IoT sensors
    // For demo, simulate realistic fill level progression
    const currentFill = bin.fillLevel;
    const hoursSinceCollection = (Date.now() - bin.lastCollection.getTime()) / 3600000;

    // Estimate fill rate based on bin type and location
    const fillRate = this.estimateFillRate(bin.type);
    const newFill = Math.min(100, currentFill + fillRate * hoursSinceCollection / 24);

    return newFill;
  }

  /**
   * Estimate fill rate based on waste type
   */
  private estimateFillRate(type: WasteType): number {
    const rates: Record<WasteType, number> = {
      'general': 15,      // 15% per day
      'recyclable': 10,
      'organic': 20,
      'hazardous': 5,
      'electronic': 3,
      'glass': 8,
      'metal': 7
    };
    return rates[type] || 10;
  }

  /**
   * Determine bin status from fill level
   */
  private determineBinStatus(fillLevel: number): BinStatus {
    if (fillLevel >= 100) return 'overflow';
    if (fillLevel >= 85) return 'full';
    if (fillLevel >= 70) return 'nearly_full';
    return 'normal';
  }

  /**
   * Record fill level history
   */
  private recordFillLevel(binId: string, fillLevel: number, temperature: number): void {
    const history = this.fillLevelHistory.get(binId) || [];
    history.push({
      timestamp: new Date(),
      fillLevel,
      temperature
    });

    // Keep last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600000;
    const filtered = history.filter(r => r.timestamp.getTime() > thirtyDaysAgo);
    this.fillLevelHistory.set(binId, filtered);
  }

  /**
   * Predict when bins will be full using time series forecasting
   */
  async predictFillTimes(): Promise<Map<string, Date>> {
    console.log('Predicting bin fill times...');

    const predictions = new Map<string, Date>();

    for (const bin of this.system.bins) {
      const history = this.fillLevelHistory.get(bin.binId);

      if (!history || history.length < 7) {
        // Not enough data, use simple linear projection
        const fillRate = this.estimateFillRate(bin.type);
        const remainingCapacity = 100 - bin.fillLevel;
        const hoursToFull = (remainingCapacity / fillRate) * 24;
        predictions.set(bin.binId, new Date(Date.now() + hoursToFull * 3600000));
        continue;
      }

      // Use linear regression for prediction
      const times = history.map((r, i) => i);
      const levels = history.map(r => r.fillLevel);

      const result = this.linearRegression(times, levels);
      const { slope, intercept } = result;

      // Predict when fill level will reach 100%
      const timeToFull = (100 - intercept) / slope;
      const hoursToFull = (timeToFull - times.length) * (history.length > 1 ?
        (history[history.length - 1].timestamp.getTime() - history[0].timestamp.getTime()) /
        (history.length - 1) / 3600000 : 24);

      predictions.set(bin.binId, new Date(Date.now() + Math.max(1, hoursToFull) * 3600000));
    }

    return predictions;
  }

  /**
   * Simple linear regression
   */
  private linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Optimize collection routes using Vehicle Routing Problem (VRP) algorithms
   */
  async optimizeRoutes(availableTrucks?: string[]): Promise<WasteRoute[]> {
    console.log('Optimizing waste collection routes...');

    // Get bins that need collection (≥70% full)
    const binsNeedingCollection = this.system.bins.filter(
      bin => bin.fillLevel >= 70 && bin.status !== 'maintenance'
    );

    if (binsNeedingCollection.length === 0) {
      console.log('No bins require collection');
      return [];
    }

    // Get available trucks
    const trucks = availableTrucks ?
      this.system.trucks.filter(t => availableTrucks.includes(t.truckId)) :
      this.system.trucks.filter(t => t.status === 'idle');

    if (trucks.length === 0) {
      console.warn('No available trucks for collection');
      return [];
    }

    console.log(`Optimizing routes for ${binsNeedingCollection.length} bins and ${trucks.length} trucks`);

    // Create distance matrix
    const locations = [
      ...this.system.facilities.map(f => f.location),
      ...binsNeedingCollection.map(b => b.location)
    ];

    const distanceMatrix = this.createDistanceMatrix(locations);

    // Group bins by type for efficient collection
    const binsByType = this.groupBinsByType(binsNeedingCollection);

    const routes: WasteRoute[] = [];

    for (const [type, bins] of binsByType.entries()) {
      const assignedTrucks = trucks.filter(t => {
        const facility = this.system.facilities.find(f => f.acceptedWasteTypes.includes(type));
        return facility !== undefined;
      });

      if (assignedTrucks.length === 0) continue;

      // Use greedy nearest neighbor heuristic for route construction
      const typeRoutes = await this.constructRoutesGreedy(
        bins,
        assignedTrucks.slice(0, Math.ceil(bins.length / 20)), // Max 20 bins per truck
        type
      );

      routes.push(...typeRoutes);
    }

    // Optimize routes using 2-opt local search
    const optimizedRoutes = await this.optimizeRoutesWithTwoOpt(routes);

    // Store routes
    this.routeHistory.push(...optimizedRoutes);

    return optimizedRoutes;
  }

  /**
   * Create distance matrix between locations
   */
  private createDistanceMatrix(locations: GeoCoordinates[]): number[][] {
    const n = locations.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const distance = this.calculateDistance(locations[i], locations[j]);
        matrix[i][j] = distance;
        matrix[j][i] = distance;
      }
    }

    return matrix;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(p1: GeoCoordinates, p2: GeoCoordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
    const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Group bins by waste type
   */
  private groupBinsByType(bins: SmartBin[]): Map<WasteType, SmartBin[]> {
    const groups = new Map<WasteType, SmartBin[]>();

    for (const bin of bins) {
      const existing = groups.get(bin.type) || [];
      existing.push(bin);
      groups.set(bin.type, existing);
    }

    return groups;
  }

  /**
   * Construct routes using greedy nearest neighbor
   */
  private async constructRoutesGreedy(
    bins: SmartBin[],
    trucks: WasteTruck[],
    wasteType: WasteType
  ): Promise<WasteRoute[]> {
    const routes: WasteRoute[] = [];
    const unvisited = new Set(bins.map(b => b.binId));
    const facility = this.system.facilities.find(f => f.acceptedWasteTypes.includes(wasteType));

    if (!facility) {
      console.warn(`No facility found for waste type ${wasteType}`);
      return routes;
    }

    for (const truck of trucks) {
      if (unvisited.size === 0) break;

      const routeBins: SmartBin[] = [];
      let currentLocation = facility.location;
      let totalDistance = 0;
      let currentLoad = truck.currentLoad;

      while (unvisited.size > 0 && routeBins.length < 20) {
        // Find nearest unvisited bin
        let nearestBin: SmartBin | null = null;
        let minDistance = Infinity;

        for (const binId of unvisited) {
          const bin = bins.find(b => b.binId === binId);
          if (!bin) continue;

          // Check if truck has capacity
          const binLoad = (bin.fillLevel / 100) * bin.capacity;
          if (currentLoad + binLoad > truck.capacity) continue;

          const distance = this.calculateDistance(currentLocation, bin.location);
          if (distance < minDistance) {
            minDistance = distance;
            nearestBin = bin;
          }
        }

        if (!nearestBin) break; // No more bins can fit

        routeBins.push(nearestBin);
        unvisited.delete(nearestBin.binId);
        totalDistance += minDistance;
        currentLocation = nearestBin.location;
        currentLoad += (nearestBin.fillLevel / 100) * nearestBin.capacity;
      }

      if (routeBins.length > 0) {
        // Add return distance to facility
        totalDistance += this.calculateDistance(currentLocation, facility.location);

        const waypoints = [
          facility.location,
          ...routeBins.map(b => b.location),
          facility.location
        ];

        routes.push({
          routeId: `route-${Date.now()}-${truck.truckId}`,
          truckId: truck.truckId,
          bins: routeBins.map(b => b.binId),
          distance: totalDistance,
          estimatedDuration: Math.ceil(totalDistance / 30 * 60 + routeBins.length * 5), // 30 km/h avg speed, 5 min per bin
          optimizationScore: this.calculateRouteScore(totalDistance, routeBins.length),
          waypoints
        });
      }
    }

    return routes;
  }

  /**
   * Calculate route quality score
   */
  private calculateRouteScore(distance: number, binCount: number): number {
    // Lower is better: penalize distance, reward bin count
    return distance / binCount;
  }

  /**
   * Optimize routes using 2-opt algorithm
   */
  private async optimizeRoutesWithTwoOpt(routes: WasteRoute[]): Promise<WasteRoute[]> {
    const optimized: WasteRoute[] = [];

    for (const route of routes) {
      let bestRoute = route;
      let bestDistance = route.distance;
      let improved = true;

      // 2-opt iterations
      while (improved) {
        improved = false;

        for (let i = 1; i < route.waypoints.length - 2; i++) {
          for (let j = i + 1; j < route.waypoints.length - 1; j++) {
            // Try reversing segment [i, j]
            const newWaypoints = [
              ...route.waypoints.slice(0, i),
              ...route.waypoints.slice(i, j + 1).reverse(),
              ...route.waypoints.slice(j + 1)
            ];

            const newDistance = this.calculateRouteDistance(newWaypoints);

            if (newDistance < bestDistance) {
              bestDistance = newDistance;
              bestRoute = {
                ...route,
                waypoints: newWaypoints,
                distance: newDistance,
                optimizationScore: this.calculateRouteScore(newDistance, route.bins.length)
              };
              improved = true;
            }
          }
        }

        if (improved) {
          route.waypoints = bestRoute.waypoints;
          route.distance = bestRoute.distance;
        }
      }

      optimized.push(bestRoute);
    }

    return optimized;
  }

  /**
   * Calculate total route distance
   */
  private calculateRouteDistance(waypoints: GeoCoordinates[]): number {
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      total += this.calculateDistance(waypoints[i], waypoints[i + 1]);
    }
    return total;
  }

  /**
   * Assign routes to trucks and execute
   */
  async executeRoutes(routes: WasteRoute[]): Promise<void> {
    console.log(`Executing ${routes.length} collection routes`);

    for (const route of routes) {
      const truck = this.system.trucks.find(t => t.truckId === route.truckId);
      if (!truck) {
        console.warn(`Truck ${route.truckId} not found`);
        continue;
      }

      // Update truck status
      truck.status = 'in_route';
      truck.route = route.routeId;

      // Update bins
      for (const binId of route.bins) {
        const bin = this.system.bins.find(b => b.binId === binId);
        if (bin) {
          bin.nextScheduled = new Date();
        }
      }

      console.log(`Truck ${truck.truckId} assigned to route ${route.routeId} with ${route.bins.length} bins`);
    }
  }

  /**
   * Simulate route completion and update bin status
   */
  async completeCollection(routeId: string): Promise<CollectionResult> {
    const route = this.system.routes.find(r => r.routeId === routeId);
    if (!route) {
      throw new Error(`Route ${routeId} not found`);
    }

    const truck = this.system.trucks.find(t => t.truckId === route.truckId);
    if (!truck) {
      throw new Error(`Truck ${route.truckId} not found`);
    }

    let totalWasteCollected = 0;
    const collectedBins: string[] = [];

    // Process each bin
    for (const binId of route.bins) {
      const bin = this.system.bins.find(b => b.binId === binId);
      if (!bin) continue;

      const wasteVolume = (bin.fillLevel / 100) * bin.capacity;
      totalWasteCollected += wasteVolume;

      // Empty bin
      bin.fillLevel = 0;
      bin.lastCollection = new Date();
      bin.status = 'normal';

      collectedBins.push(binId);
    }

    // Update truck
    truck.status = 'returning';
    truck.currentLoad += totalWasteCollected;

    const result: CollectionResult = {
      routeId,
      truckId: truck.truckId,
      binsCollected: collectedBins.length,
      wasteCollected: totalWasteCollected,
      distance: route.distance,
      duration: route.estimatedDuration,
      completedAt: new Date()
    };

    console.log(`Route ${routeId} completed: ${result.binsCollected} bins, ${result.wasteCollected.toFixed(1)}L waste`);

    return result;
  }

  /**
   * Analyze waste patterns and trends
   */
  async analyzeWastePatterns(): Promise<WasteAnalysis> {
    console.log('Analyzing waste patterns...');

    // Aggregate data by waste type
    const wasteByType = new Map<WasteType, number>();
    const binsByType = new Map<WasteType, number>();

    for (const bin of this.system.bins) {
      const volume = (bin.fillLevel / 100) * bin.capacity;
      wasteByType.set(bin.type, (wasteByType.get(bin.type) || 0) + volume);
      binsByType.set(bin.type, (binsByType.get(bin.type) || 0) + 1);
    }

    // Calculate recycling rate
    const recyclableWaste = wasteByType.get('recyclable') || 0;
    const totalWaste = Array.from(wasteByType.values()).reduce((a, b) => a + b, 0);
    const recyclingRate = totalWaste > 0 ? (recyclableWaste / totalWaste) * 100 : 0;

    // Identify hotspots (areas with high waste generation)
    const hotspots = this.identifyWasteHotspots();

    // Calculate collection efficiency
    const avgBinsPerRoute = this.routeHistory.length > 0 ?
      this.routeHistory.reduce((sum, r) => sum + r.bins.length, 0) / this.routeHistory.length : 0;

    const avgDistancePerBin = this.routeHistory.length > 0 ?
      this.routeHistory.reduce((sum, r) => sum + r.distance / r.bins.length, 0) / this.routeHistory.length : 0;

    // Forecast waste generation
    const forecast = await this.forecastWasteGeneration(7); // 7 days ahead

    return {
      timestamp: new Date(),
      totalBins: this.system.bins.length,
      totalWaste,
      wasteByType: Object.fromEntries(wasteByType),
      recyclingRate,
      hotspots,
      collectionEfficiency: {
        avgBinsPerRoute,
        avgDistancePerBin,
        routeOptimizationScore: avgDistancePerBin > 0 ? 1 / avgDistancePerBin : 0
      },
      forecast,
      recommendations: this.generateWasteRecommendations(recyclingRate, hotspots.length)
    };
  }

  /**
   * Identify waste generation hotspots
   */
  private identifyWasteHotspots(): WasteHotspot[] {
    // Cluster bins by location and analyze fill rates
    const hotspots: WasteHotspot[] = [];

    // Simple grid-based clustering
    const gridSize = 0.01; // ~1km
    const grid = new Map<string, SmartBin[]>();

    for (const bin of this.system.bins) {
      const gridX = Math.floor(bin.location.latitude / gridSize);
      const gridY = Math.floor(bin.location.longitude / gridSize);
      const key = `${gridX},${gridY}`;

      const cell = grid.get(key) || [];
      cell.push(bin);
      grid.set(key, cell);
    }

    // Analyze each grid cell
    for (const [key, bins] of grid.entries()) {
      if (bins.length < 3) continue; // Need at least 3 bins

      const avgFillLevel = bins.reduce((sum, b) => sum + b.fillLevel, 0) / bins.length;

      if (avgFillLevel > 60) { // High fill level threshold
        const [gridX, gridY] = key.split(',').map(Number);

        hotspots.push({
          location: {
            latitude: gridX * gridSize + gridSize / 2,
            longitude: gridY * gridSize + gridSize / 2
          },
          binCount: bins.length,
          avgFillLevel,
          wasteVolume: bins.reduce((sum, b) => sum + (b.fillLevel / 100) * b.capacity, 0),
          severity: avgFillLevel > 80 ? 'high' : 'medium'
        });
      }
    }

    return hotspots.sort((a, b) => b.avgFillLevel - a.avgFillLevel);
  }

  /**
   * Forecast waste generation
   */
  private async forecastWasteGeneration(days: number): Promise<WasteForecast[]> {
    const forecasts: WasteForecast[] = [];

    for (let day = 1; day <= days; day++) {
      const date = new Date(Date.now() + day * 24 * 3600000);

      // Simple forecasting based on historical fill rates
      let totalExpectedWaste = 0;

      for (const bin of this.system.bins) {
        const fillRate = this.estimateFillRate(bin.type);
        const expectedFill = bin.fillLevel + (fillRate * day);
        totalExpectedWaste += Math.min(100, expectedFill) / 100 * bin.capacity;
      }

      forecasts.push({
        date,
        expectedWaste: totalExpectedWaste,
        confidence: Math.max(0.5, 1 - day * 0.05) // Confidence decreases with time
      });
    }

    return forecasts;
  }

  /**
   * Generate recommendations
   */
  private generateWasteRecommendations(recyclingRate: number, hotspotCount: number): string[] {
    const recommendations: string[] = [];

    if (recyclingRate < 30) {
      recommendations.push('Recycling rate is below 30% - increase public awareness campaigns');
      recommendations.push('Add more recycling bins in high-traffic areas');
    } else if (recyclingRate > 50) {
      recommendations.push('Excellent recycling rate - maintain current programs');
    }

    if (hotspotCount > 5) {
      recommendations.push(`${hotspotCount} waste hotspots identified - increase collection frequency in these areas`);
      recommendations.push('Consider adding more bins in high-generation zones');
    }

    const overflowBins = this.system.bins.filter(b => b.status === 'overflow').length;
    if (overflowBins > 0) {
      recommendations.push(`URGENT: ${overflowBins} bins are overflowing - immediate collection required`);
    }

    const maintenanceBins = this.system.bins.filter(b => b.status === 'maintenance').length;
    if (maintenanceBins > 0) {
      recommendations.push(`${maintenanceBins} bins require maintenance`);
    }

    return recommendations;
  }

  /**
   * Generate waste management report
   */
  generateReport(): WasteManagementReport {
    const totalBins = this.system.bins.length;
    const activeBins = this.system.bins.filter(b => b.status !== 'maintenance').length;
    const fullBins = this.system.bins.filter(b => b.fillLevel >= 70).length;
    const avgFillLevel = this.system.bins.reduce((sum, b) => sum + b.fillLevel, 0) / totalBins;

    const totalCapacity = this.system.bins.reduce((sum, b) => sum + b.capacity, 0);
    const currentWaste = this.system.bins.reduce((sum, b) => sum + (b.fillLevel / 100) * b.capacity, 0);

    return {
      timestamp: new Date(),
      summary: {
        totalBins,
        activeBins,
        fullBins,
        avgFillLevel: Math.round(avgFillLevel),
        totalCapacity,
        currentWaste: Math.round(currentWaste)
      },
      trucks: {
        total: this.system.trucks.length,
        active: this.system.trucks.filter(t => t.status === 'in_route').length,
        idle: this.system.trucks.filter(t => t.status === 'idle').length,
        maintenance: this.system.trucks.filter(t => t.status === 'maintenance').length
      },
      recentCollections: this.routeHistory.slice(-10),
      binStatus: this.summarizeBinStatus()
    };
  }

  /**
   * Summarize bin status
   */
  private summarizeBinStatus(): Record<BinStatus, number> {
    const summary: Record<BinStatus, number> = {
      'normal': 0,
      'nearly_full': 0,
      'full': 0,
      'overflow': 0,
      'maintenance': 0,
      'damaged': 0
    };

    for (const bin of this.system.bins) {
      summary[bin.status]++;
    }

    return summary;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface FillLevelRecord {
  timestamp: Date;
  fillLevel: number;
  temperature: number;
}

interface CollectionResult {
  routeId: string;
  truckId: string;
  binsCollected: number;
  wasteCollected: number; // liters
  distance: number; // km
  duration: number; // minutes
  completedAt: Date;
}

interface WasteHotspot {
  location: GeoCoordinates;
  binCount: number;
  avgFillLevel: number;
  wasteVolume: number;
  severity: 'low' | 'medium' | 'high';
}

interface WasteForecast {
  date: Date;
  expectedWaste: number; // liters
  confidence: number;
}

interface WasteAnalysis {
  timestamp: Date;
  totalBins: number;
  totalWaste: number;
  wasteByType: Record<string, number>;
  recyclingRate: number;
  hotspots: WasteHotspot[];
  collectionEfficiency: {
    avgBinsPerRoute: number;
    avgDistancePerBin: number;
    routeOptimizationScore: number;
  };
  forecast: WasteForecast[];
  recommendations: string[];
}

interface WasteManagementReport {
  timestamp: Date;
  summary: {
    totalBins: number;
    activeBins: number;
    fullBins: number;
    avgFillLevel: number;
    totalCapacity: number;
    currentWaste: number;
  };
  trucks: {
    total: number;
    active: number;
    idle: number;
    maintenance: number;
  };
  recentCollections: WasteRoute[];
  binStatus: Record<BinStatus, number>;
}
