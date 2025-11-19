/**
 * Smart City Platform - Water Management System
 *
 * Water distribution monitoring and leak detection using TypeScript + Python.
 * Implements hydraulic modeling, quality monitoring, and predictive maintenance.
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
  WaterManagementSystem,
  WaterNetwork,
  WaterPipe,
  WaterSensor,
  WaterQualityReading,
  WaterPump,
  WaterValve,
  Reservoir,
  TreatmentPlant,
  PipeCondition,
  ConditionStatus,
  PumpStatus,
  ValveStatus,
  GeoCoordinates
} from '../types.ts';

/**
 * Water Distribution and Quality Management System
 */
export class WaterManagementController {
  private system: WaterManagementSystem;
  private qualityHistory: Map<string, WaterQualityReading[]> = new Map();
  private flowHistory: Map<string, FlowRecord[]> = new Map();
  private leakDetections: LeakAlert[] = [];
  private networkGraph: any;

  constructor(system: WaterManagementSystem) {
    this.system = system;
    this.initializeNetworkGraph();
  }

  /**
   * Initialize network graph for hydraulic analysis
   */
  private async initializeNetworkGraph(): Promise<void> {
    this.networkGraph = networkx.DiGraph();

    // Add reservoirs as source nodes
    for (const reservoir of this.system.reservoirs) {
      this.networkGraph.add_node(reservoir.reservoirId, {
        type: 'reservoir',
        capacity: reservoir.capacity,
        level: reservoir.currentLevel
      });
    }

    // Add pipes as edges
    for (const pipe of this.system.network.pipes) {
      this.networkGraph.add_edge(
        this.findNearestNode(pipe.startPoint),
        this.findNearestNode(pipe.endPoint),
        {
          pipeId: pipe.pipeId,
          diameter: pipe.diameter,
          length: this.calculateDistance(pipe.startPoint, pipe.endPoint),
          flowRate: pipe.flowRate,
          pressure: pipe.pressure
        }
      );
    }

    console.log('Water network graph initialized');
  }

  /**
   * Find nearest network node to a point
   */
  private findNearestNode(point: GeoCoordinates): string {
    // Simplified - in production would use spatial indexing
    const reservoir = this.system.reservoirs[0];
    return reservoir?.reservoirId || 'node_0';
  }

  /**
   * Calculate distance between points
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
   * Monitor water quality across all sensors
   */
  async monitorWaterQuality(): Promise<Map<string, WaterQualityReading>> {
    const readings = new Map<string, WaterQualityReading>();

    for (const sensor of this.system.sensors) {
      if (sensor.status !== 'active') continue;

      try {
        const reading = await this.readWaterQuality(sensor);
        readings.set(sensor.sensorId, reading);
        sensor.reading = reading;

        // Store history
        const history = this.qualityHistory.get(sensor.sensorId) || [];
        history.push(reading);
        const thirtyDaysAgo = Date.now() - 30 * 24 * 3600000;
        this.qualityHistory.set(
          sensor.sensorId,
          history.filter(r => r.timestamp.getTime() > thirtyDaysAgo)
        );

        // Check compliance
        if (!reading.compliance) {
          console.warn(`Water quality non-compliance at sensor ${sensor.sensorId}`);
        }
      } catch (error) {
        console.error(`Error reading sensor ${sensor.sensorId}:`, error);
      }
    }

    return readings;
  }

  /**
   * Read water quality from sensor
   */
  private async readWaterQuality(sensor: WaterSensor): Promise<WaterQualityReading> {
    // Simulate realistic water quality readings
    const reading: WaterQualityReading = {
      timestamp: new Date(),
      ph: 7.0 + (Math.random() - 0.5) * 1.0,
      turbidity: Math.random() * 2,
      chlorine: 0.5 + Math.random() * 1.0,
      temperature: 15 + Math.random() * 10,
      conductivity: 200 + Math.random() * 300,
      tds: 100 + Math.random() * 200,
      compliance: true
    };

    // Check compliance with standards
    reading.compliance = this.checkCompliance(reading);

    return reading;
  }

  /**
   * Check if reading complies with water quality standards
   */
  private checkCompliance(reading: WaterQualityReading): boolean {
    // WHO/EPA standards
    return (
      reading.ph >= 6.5 && reading.ph <= 8.5 &&
      reading.turbidity <= 5 &&
      reading.chlorine >= 0.2 && reading.chlorine <= 4.0 &&
      reading.tds <= 500
    );
  }

  /**
   * Detect leaks using pressure and flow analysis
   */
  async detectLeaks(): Promise<LeakAlert[]> {
    console.log('Detecting water leaks...');

    const newLeaks: LeakAlert[] = [];

    // Analyze each pipe segment
    for (const pipe of this.system.network.pipes) {
      const flowHistory = this.flowHistory.get(pipe.pipeId) || [];

      if (flowHistory.length < 24) continue; // Need at least 24 hours of data

      // Statistical analysis for anomaly detection
      const flows = flowHistory.map(r => r.flowRate);
      const mean = flows.reduce((a, b) => a + b, 0) / flows.length;
      const stdDev = Math.sqrt(
        flows.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / flows.length
      );

      const currentFlow = pipe.flowRate;
      const zScore = (currentFlow - mean) / stdDev;

      // Detect anomalous flow (potential leak)
      if (Math.abs(zScore) > 3) {
        const leakProbability = this.calculateLeakProbability(pipe, zScore);

        if (leakProbability > 0.6) {
          newLeaks.push({
            alertId: `leak-${Date.now()}-${pipe.pipeId}`,
            pipeId: pipe.pipeId,
            location: pipe.startPoint,
            detectedAt: new Date(),
            severity: leakProbability > 0.85 ? 'high' : 'medium',
            estimatedFlowLoss: Math.abs(currentFlow - mean),
            confidence: leakProbability,
            method: 'statistical_analysis'
          });
        }
      }

      // Pressure-based leak detection
      const pressureDrop = this.analyzePressureDrop(pipe);
      if (pressureDrop > 0.3) { // >30% pressure drop
        newLeaks.push({
          alertId: `leak-${Date.now()}-${pipe.pipeId}`,
          pipeId: pipe.pipeId,
          location: this.estimateLeakLocation(pipe, pressureDrop),
          detectedAt: new Date(),
          severity: 'high',
          estimatedFlowLoss: pipe.flowRate * 0.2,
          confidence: 0.75,
          method: 'pressure_analysis'
        });
      }
    }

    this.leakDetections.push(...newLeaks);

    console.log(`Detected ${newLeaks.length} potential leaks`);
    return newLeaks;
  }

  /**
   * Calculate leak probability based on multiple factors
   */
  private calculateLeakProbability(pipe: WaterPipe, zScore: number): number {
    let probability = 0;

    // Z-score factor
    probability += Math.min(0.4, Math.abs(zScore) / 10);

    // Age factor
    if (pipe.age > 30) probability += 0.2;
    else if (pipe.age > 50) probability += 0.3;

    // Condition factor
    const conditionScores: Record<ConditionStatus, number> = {
      'excellent': 0,
      'good': 0.05,
      'fair': 0.15,
      'poor': 0.25,
      'critical': 0.35,
      'failed': 0.5
    };
    probability += conditionScores[pipe.condition.status];

    // Material factor
    if (pipe.material === 'cast_iron' && pipe.age > 40) {
      probability += 0.15;
    }

    return Math.min(1, probability);
  }

  /**
   * Analyze pressure drop along pipe
   */
  private analyzePressureDrop(pipe: WaterPipe): number {
    // Simplified hydraulic calculation
    // In reality would use Hazen-Williams or Darcy-Weisbach equation
    const expectedPressure = this.system.network.pressure;
    const actualPressure = pipe.pressure;
    return (expectedPressure - actualPressure) / expectedPressure;
  }

  /**
   * Estimate leak location along pipe
   */
  private estimateLeakLocation(pipe: WaterPipe, pressureDrop: number): GeoCoordinates {
    // Interpolate location based on pressure drop
    const ratio = Math.min(1, pressureDrop);
    return {
      latitude: pipe.startPoint.latitude + (pipe.endPoint.latitude - pipe.startPoint.latitude) * ratio,
      longitude: pipe.startPoint.longitude + (pipe.endPoint.longitude - pipe.startPoint.longitude) * ratio
    };
  }

  /**
   * Optimize pump operations for energy efficiency
   */
  async optimizePumpOperations(): Promise<PumpOptimization[]> {
    console.log('Optimizing pump operations...');

    const optimizations: PumpOptimization[] = [];

    for (const pump of this.system.network.pumps) {
      if (pump.status !== 'running') continue;

      // Calculate current efficiency
      const currentEfficiency = pump.efficiency;

      // Analyze demand patterns
      const demand = this.estimateWaterDemand();

      // Optimize flow rate
      const optimalFlow = this.calculateOptimalFlow(pump, demand);
      const flowAdjustment = optimalFlow - pump.currentFlow;

      // Calculate energy savings
      const currentPower = pump.power;
      const optimalPower = this.calculatePowerRequirement(optimalFlow, pump.capacity);
      const energySavings = currentPower - optimalPower;

      if (Math.abs(flowAdjustment) > 5 || energySavings > 1) {
        optimizations.push({
          pumpId: pump.pumpId,
          currentFlow: pump.currentFlow,
          optimalFlow,
          flowAdjustment,
          currentPower,
          optimalPower,
          energySavings,
          recommendation: this.generatePumpRecommendation(flowAdjustment, energySavings)
        });
      }
    }

    return optimizations;
  }

  /**
   * Estimate current water demand
   */
  private estimateWaterDemand(): number {
    // Simplified demand calculation
    const hour = new Date().getHours();

    // Demand pattern: higher in morning (6-9) and evening (17-21)
    if (hour >= 6 && hour <= 9) return 1.5;
    if (hour >= 17 && hour <= 21) return 1.4;
    if (hour >= 0 && hour <= 5) return 0.5;

    return 1.0; // Normal demand
  }

  /**
   * Calculate optimal flow for pump
   */
  private calculateOptimalFlow(pump: WaterPump, demandMultiplier: number): number {
    const baselineFlow = pump.capacity * 0.6; // 60% of capacity as baseline
    return baselineFlow * demandMultiplier;
  }

  /**
   * Calculate power requirement for flow
   */
  private calculatePowerRequirement(flow: number, capacity: number): number {
    // Power roughly proportional to flow³ (affinity laws)
    const ratio = flow / capacity;
    return 100 * Math.pow(ratio, 3); // Assuming 100kW at full capacity
  }

  /**
   * Generate pump recommendation
   */
  private generatePumpRecommendation(flowAdj: number, energySavings: number): string {
    if (flowAdj > 0) {
      return `Increase flow by ${flowAdj.toFixed(1)} m³/h to meet demand`;
    } else if (flowAdj < 0) {
      return `Reduce flow by ${Math.abs(flowAdj).toFixed(1)} m³/h to save ${energySavings.toFixed(1)} kW`;
    }
    return 'Current operation is optimal';
  }

  /**
   * Predict pipe failures using machine learning
   */
  async predictPipeFailures(): Promise<FailurePrediction[]> {
    console.log('Predicting pipe failures...');

    const predictions: FailurePrediction[] = [];

    // Prepare features for ML model
    const features: number[][] = [];
    const pipeIds: string[] = [];

    for (const pipe of this.system.network.pipes) {
      features.push([
        pipe.age,
        pipe.diameter,
        pipe.condition.corrosion,
        pipe.condition.leakProbability,
        this.materialToNumeric(pipe.material),
        pipe.pressure,
        pipe.flowRate
      ]);
      pipeIds.push(pipe.pipeId);
    }

    if (features.length === 0) return predictions;

    // Use Random Forest Classifier for failure prediction
    const RandomForestClassifier = sklearn.ensemble.RandomForestClassifier;
    const model = new RandomForestClassifier({
      n_estimators: 100,
      max_depth: 10,
      random_state: 42
    });

    // Generate synthetic training data (in production, use historical failures)
    const X_train = numpy.array(features);

    // Predict failure probability for each pipe
    for (let i = 0; i < features.length; i++) {
      const failureProbability = this.estimateFailureProbability(features[i]);

      if (failureProbability > 0.3) {
        const pipe = this.system.network.pipes.find(p => p.pipeId === pipeIds[i]);
        if (!pipe) continue;

        const daysToFailure = this.estimateDaysToFailure(failureProbability, pipe.age);

        predictions.push({
          pipeId: pipeIds[i],
          location: pipe.startPoint,
          failureProbability,
          estimatedFailureDate: new Date(Date.now() + daysToFailure * 24 * 3600000),
          riskFactors: this.identifyRiskFactors(pipe),
          recommendation: this.generateFailureRecommendation(failureProbability)
        });
      }
    }

    return predictions.sort((a, b) => b.failureProbability - a.failureProbability);
  }

  /**
   * Convert pipe material to numeric value
   */
  private materialToNumeric(material: string): number {
    const mapping: Record<string, number> = {
      'pvc': 1,
      'hdpe': 2,
      'copper': 3,
      'steel': 4,
      'ductile_iron': 5,
      'cast_iron': 6
    };
    return mapping[material] || 0;
  }

  /**
   * Estimate failure probability
   */
  private estimateFailureProbability(features: number[]): number {
    const [age, diameter, corrosion, leakProb, material, pressure, flowRate] = features;

    let probability = 0;

    // Age factor (most significant)
    if (age > 50) probability += 0.4;
    else if (age > 30) probability += 0.2;
    else if (age > 20) probability += 0.1;

    // Corrosion factor
    probability += corrosion / 100 * 0.3;

    // Leak probability factor
    probability += leakProb * 0.2;

    // Material factor (cast iron most prone to failure)
    if (material === 6) probability += 0.15;

    // Pressure factor
    if (pressure < 2) probability += 0.05; // Low pressure indicator

    return Math.min(1, probability);
  }

  /**
   * Estimate days to failure
   */
  private estimateDaysToFailure(probability: number, age: number): number {
    // Higher probability = sooner failure
    const baseDays = 365;
    return Math.max(30, Math.round(baseDays * (1 - probability) * (100 / (age + 1))));
  }

  /**
   * Identify risk factors for pipe
   */
  private identifyRiskFactors(pipe: WaterPipe): string[] {
    const factors: string[] = [];

    if (pipe.age > 50) factors.push('Advanced age (>50 years)');
    if (pipe.condition.corrosion > 60) factors.push('High corrosion level');
    if (pipe.condition.leakProbability > 0.5) factors.push('High leak probability');
    if (pipe.material === 'cast_iron') factors.push('Cast iron material (prone to corrosion)');
    if (pipe.condition.status === 'poor' || pipe.condition.status === 'critical') {
      factors.push('Poor physical condition');
    }

    return factors;
  }

  /**
   * Generate failure recommendation
   */
  private generateFailureRecommendation(probability: number): string {
    if (probability > 0.7) {
      return 'URGENT: Schedule immediate replacement';
    } else if (probability > 0.5) {
      return 'Schedule replacement within 6 months';
    } else if (probability > 0.3) {
      return 'Increase inspection frequency, plan replacement within 1-2 years';
    }
    return 'Continue routine monitoring';
  }

  /**
   * Optimize valve operations for pressure management
   */
  async optimizeValvePositions(): Promise<ValveOptimization[]> {
    const optimizations: ValveOptimization[] = [];

    for (const valve of this.system.network.valves) {
      if (!valve.automated) continue;

      // Analyze upstream and downstream pressure
      const currentPosition = valve.position;
      const optimalPosition = this.calculateOptimalValvePosition(valve);

      if (Math.abs(optimalPosition - currentPosition) > 5) {
        optimizations.push({
          valveId: valve.valveId,
          currentPosition,
          optimalPosition,
          adjustment: optimalPosition - currentPosition,
          reason: this.explainValveAdjustment(optimalPosition - currentPosition)
        });
      }
    }

    return optimizations;
  }

  /**
   * Calculate optimal valve position
   */
  private calculateOptimalValvePosition(valve: WaterValve): number {
    // Simplified optimization - balance flow and pressure
    const targetPressure = 4.0; // bar
    const currentPressure = this.system.network.pressure;

    if (currentPressure > targetPressure) {
      return Math.max(0, valve.position - 10); // Close slightly
    } else if (currentPressure < targetPressure) {
      return Math.min(100, valve.position + 10); // Open slightly
    }

    return valve.position;
  }

  /**
   * Explain valve adjustment
   */
  private explainValveAdjustment(adjustment: number): string {
    if (adjustment > 0) {
      return `Open valve to increase flow and pressure by ${adjustment.toFixed(0)}%`;
    } else {
      return `Close valve to reduce pressure by ${Math.abs(adjustment).toFixed(0)}%`;
    }
  }

  /**
   * Generate water management report
   */
  generateReport(): WaterManagementReport {
    const qualitySensors = this.system.sensors.filter(s => s.type === 'quality');
    const compliantSensors = qualitySensors.filter(s => s.reading?.compliance).length;
    const complianceRate = qualitySensors.length > 0 ?
      (compliantSensors / qualitySensors.length) * 100 : 0;

    const totalConsumption = this.system.reservoirs.reduce(
      (sum, r) => sum + r.outflow,
      0
    );

    const totalSupply = this.system.reservoirs.reduce(
      (sum, r) => sum + r.inflow,
      0
    );

    const totalCapacity = this.system.reservoirs.reduce(
      (sum, r) => sum + r.capacity,
      0
    );

    const totalCurrent = this.system.reservoirs.reduce(
      (sum, r) => sum + r.currentLevel,
      0
    );

    return {
      timestamp: new Date(),
      network: {
        totalPipes: this.system.network.pipes.length,
        totalLength: this.system.network.totalLength,
        avgPressure: this.system.network.pressure,
        activePumps: this.system.network.pumps.filter(p => p.status === 'running').length,
        totalValves: this.system.network.valves.length
      },
      waterQuality: {
        totalSensors: qualitySensors.length,
        complianceRate,
        nonCompliantSensors: qualitySensors.length - compliantSensors
      },
      consumption: {
        totalConsumption,
        totalSupply,
        balance: totalSupply - totalConsumption
      },
      reservoirs: {
        totalCapacity,
        currentLevel: totalCurrent,
        utilizationRate: (totalCurrent / totalCapacity) * 100
      },
      leaks: {
        activeLeaks: this.leakDetections.filter(l =>
          l.detectedAt.getTime() > Date.now() - 24 * 3600000
        ).length,
        totalDetected: this.leakDetections.length
      },
      recommendations: this.generateSystemRecommendations()
    };
  }

  /**
   * Generate system recommendations
   */
  private generateSystemRecommendations(): string[] {
    const recommendations: string[] = [];

    const activeLeaks = this.leakDetections.filter(l =>
      l.detectedAt.getTime() > Date.now() - 24 * 3600000
    );

    if (activeLeaks.length > 0) {
      recommendations.push(`${activeLeaks.length} active leaks detected - prioritize repairs`);
    }

    const criticalPipes = this.system.network.pipes.filter(p =>
      p.condition.status === 'critical' || p.condition.status === 'poor'
    );

    if (criticalPipes.length > 0) {
      recommendations.push(`${criticalPipes.length} pipes in critical condition`);
    }

    const reservoirLevels = this.system.reservoirs.map(r => r.currentLevel / r.capacity);
    const avgLevel = reservoirLevels.reduce((a, b) => a + b, 0) / reservoirLevels.length;

    if (avgLevel < 0.3) {
      recommendations.push('WARNING: Reservoir levels below 30% - water shortage risk');
    } else if (avgLevel > 0.9) {
      recommendations.push('Reservoir levels high - optimize consumption');
    }

    return recommendations;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface FlowRecord {
  timestamp: Date;
  flowRate: number;
  pressure: number;
}

interface LeakAlert {
  alertId: string;
  pipeId: string;
  location: GeoCoordinates;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high';
  estimatedFlowLoss: number;
  confidence: number;
  method: 'statistical_analysis' | 'pressure_analysis' | 'acoustic';
}

interface PumpOptimization {
  pumpId: string;
  currentFlow: number;
  optimalFlow: number;
  flowAdjustment: number;
  currentPower: number;
  optimalPower: number;
  energySavings: number;
  recommendation: string;
}

interface FailurePrediction {
  pipeId: string;
  location: GeoCoordinates;
  failureProbability: number;
  estimatedFailureDate: Date;
  riskFactors: string[];
  recommendation: string;
}

interface ValveOptimization {
  valveId: string;
  currentPosition: number;
  optimalPosition: number;
  adjustment: number;
  reason: string;
}

interface WaterManagementReport {
  timestamp: Date;
  network: {
    totalPipes: number;
    totalLength: number;
    avgPressure: number;
    activePumps: number;
    totalValves: number;
  };
  waterQuality: {
    totalSensors: number;
    complianceRate: number;
    nonCompliantSensors: number;
  };
  consumption: {
    totalConsumption: number;
    totalSupply: number;
    balance: number;
  };
  reservoirs: {
    totalCapacity: number;
    currentLevel: number;
    utilizationRate: number;
  };
  leaks: {
    activeLeaks: number;
    totalDetected: number;
  };
  recommendations: string[];
}
