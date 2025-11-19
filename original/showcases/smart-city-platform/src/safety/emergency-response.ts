/**
 * Smart City Platform - Emergency Response System
 *
 * Emergency dispatch and response optimization using TypeScript + Python routing.
 * Real-time incident management, optimal resource allocation, and predictive analytics.
 */

// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import networkx from 'python:networkx';
// @ts-ignore
import sklearn from 'python:sklearn';

import type {
  EmergencyResponseSystem,
  Emergency,
  EmergencyResponder,
  EmergencyFacility,
  DispatchCenter,
  EmergencyType,
  EmergencySeverity,
  EmergencyStatus,
  ResponderType,
  ResponderStatus,
  Equipment,
  EquipmentType,
  EmergencyResolution,
  ResolutionOutcome,
  GeoCoordinates
} from '../types.ts';

/**
 * Emergency Response Coordination and Optimization System
 */
export class EmergencyResponseCoordinator {
  private system: EmergencyResponseSystem;
  private incidentHistory: Emergency[] = [];
  private responseTimeHistory: ResponseTimeRecord[] = [];
  private routingGraph: any;

  constructor(system: EmergencyResponseSystem) {
    this.system = system;
    this.initializeRoutingGraph();
  }

  /**
   * Initialize city road network for routing
   */
  private async initializeRoutingGraph(): Promise<void> {
    this.routingGraph = networkx.Graph();
    // In production, would load actual road network
    console.log('Emergency routing graph initialized');
  }

  /**
   * Report new emergency incident
   */
  async reportEmergency(
    type: EmergencyType,
    location: GeoCoordinates,
    description: string,
    severity?: EmergencySeverity
  ): Promise<Emergency> {
    const emergency: Emergency = {
      emergencyId: `emg-${Date.now()}`,
      type,
      severity: severity || this.assessSeverity(type, description),
      location,
      reportedTime: new Date(),
      description,
      status: 'reported',
      assignedResponders: [],
      estimatedResponseTime: 0
    };

    // Determine required responders
    const requiredResponders = this.determineRequiredResponders(emergency);

    // Find optimal responders
    const dispatch = await this.dispatchOptimalResponders(emergency, requiredResponders);

    emergency.assignedResponders = dispatch.responders.map(r => r.responderId);
    emergency.estimatedResponseTime = dispatch.estimatedTime;
    emergency.status = 'dispatched';

    this.system.emergencies.push(emergency);
    this.incidentHistory.push(emergency);

    console.log(`Emergency ${emergency.emergencyId} reported and dispatched in ${Date.now() - emergency.reportedTime.getTime()}ms`);

    return emergency;
  }

  /**
   * Assess emergency severity
   */
  private assessSeverity(type: EmergencyType, description: string): EmergencySeverity {
    // ML-based severity assessment (simplified)
    const criticalKeywords = ['multiple', 'fatalities', 'explosion', 'collapse', 'hazmat'];
    const seriousKeywords = ['injuries', 'fire', 'accident', 'trapped'];

    const lowerDesc = description.toLowerCase();

    if (criticalKeywords.some(kw => lowerDesc.includes(kw))) {
      return 'catastrophic';
    }

    if (type === 'fire' || type === 'hazmat') {
      return 'critical';
    }

    if (seriousKeywords.some(kw => lowerDesc.includes(kw))) {
      return 'serious';
    }

    return 'moderate';
  }

  /**
   * Determine required responders for emergency
   */
  private determineRequiredResponders(emergency: Emergency): ResponderRequirement[] {
    const requirements: ResponderRequirement[] = [];

    switch (emergency.type) {
      case 'fire':
        requirements.push({ type: 'firefighter', count: 4 + (emergency.severity === 'critical' ? 4 : 0) });
        requirements.push({ type: 'paramedic', count: 2 });
        break;

      case 'medical':
        requirements.push({ type: 'paramedic', count: emergency.severity === 'critical' ? 3 : 2 });
        break;

      case 'police':
      case 'security':
        requirements.push({ type: 'police_officer', count: 2 + (emergency.severity === 'serious' ? 2 : 0) });
        break;

      case 'accident':
        requirements.push({ type: 'police_officer', count: 2 });
        requirements.push({ type: 'paramedic', count: 2 });
        requirements.push({ type: 'firefighter', count: 2 });
        break;

      case 'hazmat':
        requirements.push({ type: 'hazmat_specialist', count: 3 });
        requirements.push({ type: 'firefighter', count: 4 });
        break;

      case 'natural_disaster':
        requirements.push({ type: 'rescue_team', count: 6 });
        requirements.push({ type: 'paramedic', count: 4 });
        break;

      default:
        requirements.push({ type: 'police_officer', count: 2 });
    }

    return requirements;
  }

  /**
   * Dispatch optimal responders using optimization
   */
  async dispatchOptimalResponders(
    emergency: Emergency,
    requirements: ResponderRequirement[]
  ): Promise<DispatchPlan> {
    console.log(`Finding optimal responders for ${emergency.emergencyId}...`);

    const selectedResponders: EmergencyResponder[] = [];
    let maxEstimatedTime = 0;

    for (const requirement of requirements) {
      // Find available responders of required type
      const available = this.system.responders.filter(r =>
        r.type === requirement.type && r.status === 'available'
      );

      if (available.length < requirement.count) {
        console.warn(`Insufficient ${requirement.type} responders available`);
      }

      // Calculate distances and select nearest responders
      const candidates = available.map(responder => ({
        responder,
        distance: this.calculateDistance(responder.currentLocation, emergency.location),
        travelTime: this.estimateTravelTime(responder.currentLocation, emergency.location)
      }));

      // Sort by travel time
      candidates.sort((a, b) => a.travelTime - b.travelTime);

      // Select required count
      const selected = candidates.slice(0, requirement.count);

      for (const { responder, travelTime } of selected) {
        selectedResponders.push(responder);
        maxEstimatedTime = Math.max(maxEstimatedTime, travelTime);

        // Update responder status
        responder.status = 'dispatched';
        responder.assignedEmergency = emergency.emergencyId;
      }
    }

    this.system.dispatchCenter.activeIncidents++;

    return {
      emergencyId: emergency.emergencyId,
      responders: selectedResponders,
      estimatedTime: Math.ceil(maxEstimatedTime),
      dispatchedAt: new Date()
    };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(p1: GeoCoordinates, p2: GeoCoordinates): number {
    const R = 6371;
    const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
    const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Estimate travel time
   */
  private estimateTravelTime(from: GeoCoordinates, to: GeoCoordinates): number {
    const distance = this.calculateDistance(from, to);
    const avgSpeed = 60; // km/h (emergency vehicles)
    return (distance / avgSpeed) * 60; // minutes
  }

  /**
   * Update emergency status
   */
  async updateEmergencyStatus(
    emergencyId: string,
    status: EmergencyStatus,
    notes?: string
  ): Promise<void> {
    const emergency = this.system.emergencies.find(e => e.emergencyId === emergencyId);
    if (!emergency) {
      throw new Error(`Emergency ${emergencyId} not found`);
    }

    const previousStatus = emergency.status;
    emergency.status = status;

    // Update responder statuses
    if (status === 'on_scene') {
      for (const responderId of emergency.assignedResponders) {
        const responder = this.system.responders.find(r => r.responderId === responderId);
        if (responder) {
          responder.status = 'on_scene';
        }
      }
    }

    if (status === 'resolved') {
      // Calculate actual response time
      const responseTime = (Date.now() - emergency.reportedTime.getTime()) / 60000; // minutes

      this.responseTimeHistory.push({
        emergencyId,
        type: emergency.type,
        severity: emergency.severity,
        estimatedTime: emergency.estimatedResponseTime || 0,
        actualTime: emergency.actualResponseTime || responseTime,
        timestamp: new Date()
      });

      // Release responders
      for (const responderId of emergency.assignedResponders) {
        const responder = this.system.responders.find(r => r.responderId === responderId);
        if (responder) {
          responder.status = 'available';
          responder.assignedEmergency = undefined;
        }
      }

      this.system.dispatchCenter.activeIncidents--;
    }

    console.log(`Emergency ${emergencyId} status updated: ${previousStatus} -> ${status}`);
  }

  /**
   * Resolve emergency with outcome
   */
  async resolveEmergency(
    emergencyId: string,
    outcome: ResolutionOutcome,
    resourcesUsed: string[],
    cost: number,
    notes: string
  ): Promise<void> {
    const emergency = this.system.emergencies.find(e => e.emergencyId === emergencyId);
    if (!emergency) {
      throw new Error(`Emergency ${emergencyId} not found`);
    }

    emergency.resolution = {
      resolvedTime: new Date(),
      outcome,
      resourcesUsed,
      cost,
      notes
    };

    emergency.status = 'resolved';
    emergency.actualResponseTime = (Date.now() - emergency.reportedTime.getTime()) / 60000;

    await this.updateEmergencyStatus(emergencyId, 'resolved');

    console.log(`Emergency ${emergencyId} resolved with outcome: ${outcome}`);
  }

  /**
   * Predict emergency hotspots using historical data
   */
  async predictHotspots(): Promise<EmergencyHotspot[]> {
    console.log('Predicting emergency hotspots...');

    if (this.incidentHistory.length < 50) {
      console.warn('Insufficient historical data for hotspot prediction');
      return [];
    }

    // Prepare spatial data
    const locations = this.incidentHistory.map(e => [
      e.location.latitude,
      e.location.longitude
    ]);

    // Use DBSCAN clustering to identify hotspots
    const DBSCAN = sklearn.cluster.DBSCAN;
    const clustering = new DBSCAN({
      eps: 0.01, // ~1km
      min_samples: 5
    });

    const X = numpy.array(locations);
    const labels = clustering.fit_predict(X);

    // Analyze clusters
    const clusters = new Map<number, Emergency[]>();
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      if (label === -1) continue; // Noise

      if (!clusters.has(label)) {
        clusters.set(label, []);
      }
      clusters.get(label)!.push(this.incidentHistory[i]);
    }

    const hotspots: EmergencyHotspot[] = [];

    for (const [clusterId, incidents] of clusters.entries()) {
      const centerLat = incidents.reduce((sum, e) => sum + e.location.latitude, 0) / incidents.length;
      const centerLon = incidents.reduce((sum, e) => sum + e.location.longitude, 0) / incidents.length;

      const typeDistribution = this.analyzeTypeDistribution(incidents);
      const avgSeverity = this.calculateAverageSeverity(incidents);

      hotspots.push({
        hotspotId: `hotspot-${clusterId}`,
        location: { latitude: centerLat, longitude: centerLon },
        incidentCount: incidents.length,
        radius: this.calculateClusterRadius(incidents),
        primaryType: typeDistribution[0].type,
        typeDistribution,
        avgSeverity,
        riskScore: this.calculateRiskScore(incidents.length, avgSeverity),
        recommendations: this.generateHotspotRecommendations(typeDistribution[0].type, incidents.length)
      });
    }

    return hotspots.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Analyze emergency type distribution
   */
  private analyzeTypeDistribution(incidents: Emergency[]): Array<{ type: EmergencyType; count: number }> {
    const distribution = new Map<EmergencyType, number>();

    for (const incident of incidents) {
      distribution.set(incident.type, (distribution.get(incident.type) || 0) + 1);
    }

    return Array.from(distribution.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate average severity
   */
  private calculateAverageSeverity(incidents: Emergency[]): number {
    const severityValues: Record<EmergencySeverity, number> = {
      'minor': 1,
      'moderate': 2,
      'serious': 3,
      'critical': 4,
      'catastrophic': 5
    };

    const sum = incidents.reduce((s, e) => s + severityValues[e.severity], 0);
    return sum / incidents.length;
  }

  /**
   * Calculate cluster radius
   */
  private calculateClusterRadius(incidents: Emergency[]): number {
    if (incidents.length === 0) return 0;

    const centerLat = incidents.reduce((sum, e) => sum + e.location.latitude, 0) / incidents.length;
    const centerLon = incidents.reduce((sum, e) => sum + e.location.longitude, 0) / incidents.length;
    const center = { latitude: centerLat, longitude: centerLon };

    const maxDistance = Math.max(...incidents.map(e =>
      this.calculateDistance(center, e.location)
    ));

    return maxDistance;
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(incidentCount: number, avgSeverity: number): number {
    return incidentCount * avgSeverity * 10;
  }

  /**
   * Generate hotspot recommendations
   */
  private generateHotspotRecommendations(primaryType: EmergencyType, count: number): string[] {
    const recommendations: string[] = [];

    if (count > 20) {
      recommendations.push('High incident frequency - allocate additional resources to this area');
    }

    switch (primaryType) {
      case 'fire':
        recommendations.push('Conduct fire safety inspections');
        recommendations.push('Install additional fire detection systems');
        break;
      case 'medical':
        recommendations.push('Consider positioning ambulance in this area');
        recommendations.push('Establish community health programs');
        break;
      case 'police':
      case 'security':
        recommendations.push('Increase police patrols');
        recommendations.push('Install additional surveillance cameras');
        break;
      case 'accident':
        recommendations.push('Review traffic patterns and add safety measures');
        recommendations.push('Improve road signage and lighting');
        break;
    }

    return recommendations;
  }

  /**
   * Optimize responder allocation using ML
   */
  async optimizeResponderAllocation(): Promise<AllocationOptimization[]> {
    console.log('Optimizing responder allocation...');

    const optimizations: AllocationOptimization[] = [];

    // Analyze historical demand patterns
    const demandByHour = this.analyzeDemandPatterns();
    const demandByLocation = this.analyzeLocationDemand();

    // For each facility, optimize responder count
    for (const facility of this.system.facilities) {
      const currentResponders = facility.responders.length;
      const nearbyDemand = this.estimateNearbyDemand(facility.location, demandByLocation);
      const optimalCount = this.calculateOptimalResponderCount(nearbyDemand, facility.type);

      if (Math.abs(optimalCount - currentResponders) >= 2) {
        optimizations.push({
          facilityId: facility.facilityId,
          facilityName: facility.name,
          currentResponders,
          optimalResponders: optimalCount,
          adjustment: optimalCount - currentResponders,
          expectedImprovement: this.estimateImprovementFromReallocation(optimalCount - currentResponders),
          recommendation: this.generateAllocationRecommendation(optimalCount - currentResponders)
        });
      }
    }

    return optimizations;
  }

  /**
   * Analyze demand patterns by hour
   */
  private analyzeDemandPatterns(): Map<number, number> {
    const demandByHour = new Map<number, number>();

    for (let hour = 0; hour < 24; hour++) {
      const count = this.incidentHistory.filter(e =>
        e.reportedTime.getHours() === hour
      ).length;
      demandByHour.set(hour, count);
    }

    return demandByHour;
  }

  /**
   * Analyze location demand
   */
  private analyzeLocationDemand(): Map<string, number> {
    // Grid-based demand analysis
    const gridSize = 0.01; // ~1km
    const demand = new Map<string, number>();

    for (const incident of this.incidentHistory) {
      const gridX = Math.floor(incident.location.latitude / gridSize);
      const gridY = Math.floor(incident.location.longitude / gridSize);
      const key = `${gridX},${gridY}`;
      demand.set(key, (demand.get(key) || 0) + 1);
    }

    return demand;
  }

  /**
   * Estimate nearby demand
   */
  private estimateNearbyDemand(location: GeoCoordinates, demandMap: Map<string, number>): number {
    const gridSize = 0.01;
    const gridX = Math.floor(location.latitude / gridSize);
    const gridY = Math.floor(location.longitude / gridSize);

    let total = 0;
    // Check 3x3 grid around facility
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        total += demandMap.get(key) || 0;
      }
    }

    return total;
  }

  /**
   * Calculate optimal responder count
   */
  private calculateOptimalResponderCount(demand: number, facilityType: string): number {
    // Simple heuristic: 1 responder per 10 incidents per month
    const baseCount = Math.ceil(demand / 10);
    return Math.max(5, Math.min(20, baseCount));
  }

  /**
   * Estimate improvement from reallocation
   */
  private estimateImprovementFromReallocation(adjustment: number): number {
    // Estimate response time improvement
    return adjustment * 2; // 2% improvement per responder
  }

  /**
   * Generate allocation recommendation
   */
  private generateAllocationRecommendation(adjustment: number): string {
    if (adjustment > 0) {
      return `Add ${adjustment} responders to improve response times`;
    } else {
      return `Reduce by ${Math.abs(adjustment)} responders - excess capacity detected`;
    }
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics(): EmergencyPerformanceMetrics {
    const responseTimes = this.responseTimeHistory.map(r => r.actualTime);

    if (responseTimes.length === 0) {
      return {
        avgResponseTime: 0,
        responseTimeP50: 0,
        responseTimeP95: 0,
        responseTimeP99: 0,
        resolutionRate: 0,
        successRate: 0,
        activeIncidents: this.system.dispatchCenter.activeIncidents
      };
    }

    responseTimes.sort((a, b) => a - b);

    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    const resolved = this.incidentHistory.filter(e => e.status === 'resolved').length;
    const successful = this.incidentHistory.filter(e =>
      e.resolution?.outcome === 'successful'
    ).length;

    return {
      avgResponseTime: avg,
      responseTimeP50: p50,
      responseTimeP95: p95,
      responseTimeP99: p99,
      resolutionRate: (resolved / this.incidentHistory.length) * 100,
      successRate: resolved > 0 ? (successful / resolved) * 100 : 0,
      activeIncidents: this.system.dispatchCenter.activeIncidents
    };
  }

  /**
   * Generate emergency response report
   */
  generateReport(): EmergencyResponseReport {
    const metrics = this.calculatePerformanceMetrics();
    const last24h = this.incidentHistory.filter(e =>
      e.reportedTime.getTime() > Date.now() - 24 * 3600000
    );

    const byType = new Map<EmergencyType, number>();
    for (const incident of last24h) {
      byType.set(incident.type, (byType.get(incident.type) || 0) + 1);
    }

    return {
      timestamp: new Date(),
      summary: {
        totalIncidents: this.incidentHistory.length,
        activeIncidents: metrics.activeIncidents,
        last24Hours: last24h.length,
        totalResponders: this.system.responders.length,
        availableResponders: this.system.responders.filter(r => r.status === 'available').length
      },
      performance: metrics,
      incidentsByType: Object.fromEntries(byType),
      recommendations: this.generateSystemRecommendations(metrics)
    };
  }

  /**
   * Generate system recommendations
   */
  private generateSystemRecommendations(metrics: EmergencyPerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.avgResponseTime > 10) {
      recommendations.push('Average response time exceeds 10 minutes - consider adding resources');
    }

    if (metrics.responseTimeP95 > 20) {
      recommendations.push('95th percentile response time is high - optimize responder allocation');
    }

    const availableRate = this.system.responders.filter(r => r.status === 'available').length /
      this.system.responders.length;

    if (availableRate < 0.3) {
      recommendations.push('Low responder availability - consider hiring additional staff');
    }

    if (metrics.successRate < 80) {
      recommendations.push('Success rate below 80% - review response protocols');
    }

    return recommendations;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface ResponderRequirement {
  type: ResponderType;
  count: number;
}

interface DispatchPlan {
  emergencyId: string;
  responders: EmergencyResponder[];
  estimatedTime: number;
  dispatchedAt: Date;
}

interface ResponseTimeRecord {
  emergencyId: string;
  type: EmergencyType;
  severity: EmergencySeverity;
  estimatedTime: number;
  actualTime: number;
  timestamp: Date;
}

interface EmergencyHotspot {
  hotspotId: string;
  location: GeoCoordinates;
  incidentCount: number;
  radius: number;
  primaryType: EmergencyType;
  typeDistribution: Array<{ type: EmergencyType; count: number }>;
  avgSeverity: number;
  riskScore: number;
  recommendations: string[];
}

interface AllocationOptimization {
  facilityId: string;
  facilityName: string;
  currentResponders: number;
  optimalResponders: number;
  adjustment: number;
  expectedImprovement: number;
  recommendation: string;
}

interface EmergencyPerformanceMetrics {
  avgResponseTime: number;
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  resolutionRate: number;
  successRate: number;
  activeIncidents: number;
}

interface EmergencyResponseReport {
  timestamp: Date;
  summary: {
    totalIncidents: number;
    activeIncidents: number;
    last24Hours: number;
    totalResponders: number;
    availableResponders: number;
  };
  performance: EmergencyPerformanceMetrics;
  incidentsByType: Record<string, number>;
  recommendations: string[];
}
