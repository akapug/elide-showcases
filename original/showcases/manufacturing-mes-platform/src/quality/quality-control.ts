/**
 * Quality Control System
 *
 * Statistical Process Control (SPC), quality inspection, and defect analysis
 * using Python scientific computing libraries for advanced statistical analysis.
 */

// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';

import type {
  QualityCheckpoint,
  QualityInspectionResult,
  QualityParameter,
  Measurement,
  Defect,
  SPCChart,
  SPCDataPoint,
  ControlLimits,
  ControlViolation,
  ProcessCapability,
  Specification,
  SPCChartType,
  Disposition,
  DefectType,
  DefectSeverity
} from '../types.js';

// ============================================================================
// Quality Control Engine
// ============================================================================

export class QualityControlEngine {
  private spcCharts: Map<string, SPCChart> = new Map();
  private inspectionHistory: QualityInspectionResult[] = [];
  private config: QualityControlConfig;

  constructor(config: QualityControlConfig) {
    this.config = config;
  }

  /**
   * Perform quality inspection
   */
  async performInspection(
    checkpoint: QualityCheckpoint,
    measurements: Measurement[],
    inspector: string
  ): Promise<QualityInspectionResult> {
    console.log(`Performing quality inspection at checkpoint ${checkpoint.name}`);

    // Validate measurements against specifications
    const validatedMeasurements = this.validateMeasurements(
      measurements,
      checkpoint.parameters
    );

    // Detect defects
    const defects = this.detectDefects(validatedMeasurements, checkpoint.parameters);

    // Determine overall result
    const overallResult = this.determineInspectionResult(
      validatedMeasurements,
      defects,
      checkpoint
    );

    // Make disposition decision
    const disposition = this.makeDisposition(
      overallResult,
      defects,
      inspector
    );

    const inspectionResult: QualityInspectionResult = {
      id: this.generateInspectionId(),
      checkpointId: checkpoint.id,
      timestamp: new Date(),
      inspector,
      measurements: validatedMeasurements,
      overallResult,
      defects,
      disposition,
      notes: this.generateInspectionNotes(validatedMeasurements, defects)
    };

    // Update SPC charts
    await this.updateSPCCharts(checkpoint, validatedMeasurements);

    this.inspectionHistory.push(inspectionResult);

    return inspectionResult;
  }

  /**
   * Create and maintain SPC chart
   */
  async createSPCChart(
    parameterId: string,
    chartType: SPCChartType,
    specification: Specification
  ): Promise<SPCChart> {
    console.log(`Creating SPC chart for parameter ${parameterId}: ${chartType}`);

    // Get historical data for parameter
    const historicalData = this.getHistoricalMeasurements(parameterId);

    // Calculate control limits
    const controlLimits = await this.calculateControlLimits(
      historicalData,
      chartType,
      specification
    );

    // Create data points
    const dataPoints: SPCDataPoint[] = historicalData.map((measurement, index) => ({
      timestamp: new Date(),
      value: measurement,
      subgroupNumber: Math.floor(index / this.config.subgroupSize),
      outOfControl: this.isOutOfControl(measurement, controlLimits)
    }));

    // Detect control violations
    const violations = this.detectControlViolations(dataPoints, controlLimits);

    // Calculate process capability
    const processCapability = await this.calculateProcessCapability(
      historicalData,
      specification
    );

    const spcChart: SPCChart = {
      parameterId,
      chartType,
      dataPoints,
      controlLimits,
      violations,
      processCapability
    };

    this.spcCharts.set(parameterId, spcChart);

    return spcChart;
  }

  /**
   * Calculate control limits for SPC chart
   */
  private async calculateControlLimits(
    data: number[],
    chartType: SPCChartType,
    specification: Specification
  ): Promise<ControlLimits> {
    const npData = numpy.array(data);

    switch (chartType) {
      case 'X_BAR':
        return this.calculateXBarLimits(data, specification);

      case 'R_CHART':
        return this.calculateRChartLimits(data, specification);

      case 'X_MR':
        return this.calculateXMRLimits(data, specification);

      case 'P_CHART':
        return this.calculatePChartLimits(data, specification);

      case 'NP_CHART':
        return this.calculateNPChartLimits(data, specification);

      case 'C_CHART':
        return this.calculateCChartLimits(data, specification);

      case 'U_CHART':
        return this.calculateUChartLimits(data, specification);

      default:
        return this.calculateXBarLimits(data, specification);
    }
  }

  /**
   * Calculate X-Bar chart control limits
   */
  private calculateXBarLimits(
    data: number[],
    specification: Specification
  ): ControlLimits {
    const subgroupSize = this.config.subgroupSize;
    const subgroups: number[][] = [];

    // Divide data into subgroups
    for (let i = 0; i < data.length; i += subgroupSize) {
      subgroups.push(data.slice(i, i + subgroupSize));
    }

    // Calculate subgroup means and ranges
    const means = subgroups.map(group =>
      group.reduce((a, b) => a + b, 0) / group.length
    );
    const ranges = subgroups.map(group =>
      Math.max(...group) - Math.min(...group)
    );

    // Calculate grand mean and average range
    const grandMean = means.reduce((a, b) => a + b, 0) / means.length;
    const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;

    // Get A2, D3, D4 constants for subgroup size
    const constants = this.getSPCConstants(subgroupSize);

    // Calculate control limits
    const centerLine = grandMean;
    const upperControlLimit = grandMean + constants.A2 * avgRange;
    const lowerControlLimit = grandMean - constants.A2 * avgRange;
    const upperWarningLimit = grandMean + (2/3) * constants.A2 * avgRange;
    const lowerWarningLimit = grandMean - (2/3) * constants.A2 * avgRange;

    return {
      centerLine,
      upperControlLimit,
      lowerControlLimit,
      upperWarningLimit,
      lowerWarningLimit,
      upperSpecificationLimit: specification.upperLimit,
      lowerSpecificationLimit: specification.lowerLimit
    };
  }

  /**
   * Calculate R-Chart control limits
   */
  private calculateRChartLimits(
    data: number[],
    specification: Specification
  ): ControlLimits {
    const subgroupSize = this.config.subgroupSize;
    const subgroups: number[][] = [];

    for (let i = 0; i < data.length; i += subgroupSize) {
      subgroups.push(data.slice(i, i + subgroupSize));
    }

    const ranges = subgroups.map(group =>
      Math.max(...group) - Math.min(...group)
    );

    const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    const constants = this.getSPCConstants(subgroupSize);

    return {
      centerLine: avgRange,
      upperControlLimit: constants.D4 * avgRange,
      lowerControlLimit: constants.D3 * avgRange,
      upperWarningLimit: avgRange + (2/3) * (constants.D4 - 1) * avgRange,
      lowerWarningLimit: Math.max(0, avgRange - (2/3) * avgRange),
      upperSpecificationLimit: specification.upperLimit,
      lowerSpecificationLimit: specification.lowerLimit
    };
  }

  /**
   * Calculate X-MR (Individual-Moving Range) chart limits
   */
  private calculateXMRLimits(
    data: number[],
    specification: Specification
  ): ControlLimits {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;

    // Calculate moving ranges
    const movingRanges: number[] = [];
    for (let i = 1; i < data.length; i++) {
      movingRanges.push(Math.abs(data[i] - data[i - 1]));
    }

    const avgMovingRange = movingRanges.reduce((a, b) => a + b, 0) / movingRanges.length;

    // Constants for individuals chart
    const d2 = 1.128; // for n=2 (moving range)
    const D4 = 3.267;
    const D3 = 0;

    const sigma = avgMovingRange / d2;

    return {
      centerLine: mean,
      upperControlLimit: mean + 3 * sigma,
      lowerControlLimit: mean - 3 * sigma,
      upperWarningLimit: mean + 2 * sigma,
      lowerWarningLimit: mean - 2 * sigma,
      upperSpecificationLimit: specification.upperLimit,
      lowerSpecificationLimit: specification.lowerLimit
    };
  }

  /**
   * Calculate P-Chart (proportion defective) limits
   */
  private calculatePChartLimits(
    data: number[],
    specification: Specification
  ): ControlLimits {
    const pBar = data.reduce((a, b) => a + b, 0) / data.length;
    const n = this.config.subgroupSize;

    const sigma = Math.sqrt(pBar * (1 - pBar) / n);

    return {
      centerLine: pBar,
      upperControlLimit: pBar + 3 * sigma,
      lowerControlLimit: Math.max(0, pBar - 3 * sigma),
      upperWarningLimit: pBar + 2 * sigma,
      lowerWarningLimit: Math.max(0, pBar - 2 * sigma),
      upperSpecificationLimit: specification.upperLimit,
      lowerSpecificationLimit: specification.lowerLimit
    };
  }

  /**
   * Calculate NP-Chart limits
   */
  private calculateNPChartLimits(
    data: number[],
    specification: Specification
  ): ControlLimits {
    const n = this.config.subgroupSize;
    const pBar = data.reduce((a, b) => a + b, 0) / (data.length * n);
    const npBar = n * pBar;

    const sigma = Math.sqrt(n * pBar * (1 - pBar));

    return {
      centerLine: npBar,
      upperControlLimit: npBar + 3 * sigma,
      lowerControlLimit: Math.max(0, npBar - 3 * sigma),
      upperWarningLimit: npBar + 2 * sigma,
      lowerWarningLimit: Math.max(0, npBar - 2 * sigma),
      upperSpecificationLimit: specification.upperLimit,
      lowerSpecificationLimit: specification.lowerLimit
    };
  }

  /**
   * Calculate C-Chart (count of defects) limits
   */
  private calculateCChartLimits(
    data: number[],
    specification: Specification
  ): ControlLimits {
    const cBar = data.reduce((a, b) => a + b, 0) / data.length;
    const sigma = Math.sqrt(cBar);

    return {
      centerLine: cBar,
      upperControlLimit: cBar + 3 * sigma,
      lowerControlLimit: Math.max(0, cBar - 3 * sigma),
      upperWarningLimit: cBar + 2 * sigma,
      lowerWarningLimit: Math.max(0, cBar - 2 * sigma),
      upperSpecificationLimit: specification.upperLimit,
      lowerSpecificationLimit: specification.lowerLimit
    };
  }

  /**
   * Calculate U-Chart (defects per unit) limits
   */
  private calculateUChartLimits(
    data: number[],
    specification: Specification
  ): ControlLimits {
    const n = this.config.subgroupSize;
    const uBar = data.reduce((a, b) => a + b, 0) / (data.length * n);
    const sigma = Math.sqrt(uBar / n);

    return {
      centerLine: uBar,
      upperControlLimit: uBar + 3 * sigma,
      lowerControlLimit: Math.max(0, uBar - 3 * sigma),
      upperWarningLimit: uBar + 2 * sigma,
      lowerWarningLimit: Math.max(0, uBar - 2 * sigma),
      upperSpecificationLimit: specification.upperLimit,
      lowerSpecificationLimit: specification.lowerLimit
    };
  }

  /**
   * Get SPC constants based on subgroup size
   */
  private getSPCConstants(n: number): SPCConstants {
    const constants: Record<number, SPCConstants> = {
      2: { A2: 1.880, D3: 0, D4: 3.267, d2: 1.128 },
      3: { A2: 1.023, D3: 0, D4: 2.574, d2: 1.693 },
      4: { A2: 0.729, D3: 0, D4: 2.282, d2: 2.059 },
      5: { A2: 0.577, D3: 0, D4: 2.114, d2: 2.326 },
      6: { A2: 0.483, D3: 0, D4: 2.004, d2: 2.534 },
      7: { A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704 },
      8: { A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847 },
      9: { A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.970 },
      10: { A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078 }
    };

    return constants[n] || constants[5];
  }

  /**
   * Calculate process capability indices
   */
  private async calculateProcessCapability(
    data: number[],
    specification: Specification
  ): Promise<ProcessCapability> {
    const npData = numpy.array(data);

    // Calculate mean and standard deviation
    const mean = await numpy.mean(npData);
    const std = await numpy.std(npData);

    // Calculate Cp (process capability)
    const cp = (specification.upperLimit - specification.lowerLimit) / (6 * std);

    // Calculate Cpk (process capability index)
    const cpupper = (specification.upperLimit - mean) / (3 * std);
    const cplower = (mean - specification.lowerLimit) / (3 * std);
    const cpk = Math.min(cpupper, cplower);

    // Calculate Pp and Ppk (process performance)
    // Using population standard deviation
    const stdPop = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    );

    const pp = (specification.upperLimit - specification.lowerLimit) / (6 * stdPop);
    const ppupper = (specification.upperLimit - mean) / (3 * stdPop);
    const pplower = (mean - specification.lowerLimit) / (3 * stdPop);
    const ppk = Math.min(ppupper, pplower);

    // Calculate sigma level
    const sigma = Math.min(cpupper, cplower) * 3;

    // Calculate DPMO (Defects Per Million Opportunities)
    const dpmo = this.calculateDPMO(data, specification);

    return {
      cp,
      cpk,
      pp,
      ppk,
      sigma,
      defectsPerMillionOpportunities: dpmo
    };
  }

  /**
   * Calculate Defects Per Million Opportunities
   */
  private calculateDPMO(data: number[], specification: Specification): number {
    const defects = data.filter(
      value => value < specification.lowerLimit || value > specification.upperLimit
    ).length;

    return (defects / data.length) * 1000000;
  }

  /**
   * Detect control chart violations (Western Electric Rules)
   */
  private detectControlViolations(
    dataPoints: SPCDataPoint[],
    controlLimits: ControlLimits
  ): ControlViolation[] {
    const violations: ControlViolation[] = [];

    // Rule 1: One point beyond control limits
    for (let i = 0; i < dataPoints.length; i++) {
      if (dataPoints[i].outOfControl) {
        violations.push({
          timestamp: dataPoints[i].timestamp,
          rule: 'Rule 1: Point beyond control limits',
          description: `Value ${dataPoints[i].value.toFixed(2)} exceeds control limits`,
          dataPoints: [i]
        });
      }
    }

    // Rule 2: 8+ consecutive points on one side of center line
    for (let i = 7; i < dataPoints.length; i++) {
      const last8 = dataPoints.slice(i - 7, i + 1);
      const allAbove = last8.every(p => p.value > controlLimits.centerLine);
      const allBelow = last8.every(p => p.value < controlLimits.centerLine);

      if (allAbove || allBelow) {
        violations.push({
          timestamp: dataPoints[i].timestamp,
          rule: 'Rule 2: 8 consecutive points on one side',
          description: allAbove ? 'Process shifted high' : 'Process shifted low',
          dataPoints: Array.from({ length: 8 }, (_, idx) => i - 7 + idx)
        });
      }
    }

    // Rule 3: 6+ consecutive increasing or decreasing points
    for (let i = 5; i < dataPoints.length; i++) {
      const last6 = dataPoints.slice(i - 5, i + 1);
      const increasing = last6.every((p, idx) => idx === 0 || p.value > last6[idx - 1].value);
      const decreasing = last6.every((p, idx) => idx === 0 || p.value < last6[idx - 1].value);

      if (increasing || decreasing) {
        violations.push({
          timestamp: dataPoints[i].timestamp,
          rule: 'Rule 3: 6 consecutive trending points',
          description: increasing ? 'Increasing trend detected' : 'Decreasing trend detected',
          dataPoints: Array.from({ length: 6 }, (_, idx) => i - 5 + idx)
        });
      }
    }

    // Rule 4: 14+ consecutive alternating up and down
    for (let i = 13; i < dataPoints.length; i++) {
      const last14 = dataPoints.slice(i - 13, i + 1);
      const alternating = last14.every((p, idx) => {
        if (idx === 0) return true;
        const current = p.value;
        const prev = last14[idx - 1].value;
        const prevPrev = idx > 1 ? last14[idx - 2].value : current;
        return (current > prev && prev < prevPrev) || (current < prev && prev > prevPrev);
      });

      if (alternating) {
        violations.push({
          timestamp: dataPoints[i].timestamp,
          rule: 'Rule 4: 14 consecutive alternating points',
          description: 'Systematic variation detected',
          dataPoints: Array.from({ length: 14 }, (_, idx) => i - 13 + idx)
        });
      }
    }

    // Rule 5: 2/3 points in Zone A or beyond
    const zoneLimits = this.calculateZoneLimits(controlLimits);
    for (let i = 2; i < dataPoints.length; i++) {
      const last3 = dataPoints.slice(i - 2, i + 1);
      const inZoneA = last3.filter(p =>
        p.value > zoneLimits.upperZoneA || p.value < zoneLimits.lowerZoneA
      );

      if (inZoneA.length >= 2) {
        violations.push({
          timestamp: dataPoints[i].timestamp,
          rule: 'Rule 5: 2 of 3 points in Zone A',
          description: 'Large variation detected',
          dataPoints: Array.from({ length: 3 }, (_, idx) => i - 2 + idx)
        });
      }
    }

    return violations;
  }

  /**
   * Calculate zone limits for Western Electric Rules
   */
  private calculateZoneLimits(controlLimits: ControlLimits): ZoneLimits {
    const cl = controlLimits.centerLine;
    const ucl = controlLimits.upperControlLimit;
    const lcl = controlLimits.lowerControlLimit;

    const range = (ucl - lcl) / 6; // Each zone is 1 sigma

    return {
      upperZoneA: cl + 2 * range,
      upperZoneB: cl + range,
      lowerZoneB: cl - range,
      lowerZoneA: cl - 2 * range
    };
  }

  /**
   * Check if data point is out of control
   */
  private isOutOfControl(value: number, controlLimits: ControlLimits): boolean {
    return value > controlLimits.upperControlLimit ||
           value < controlLimits.lowerControlLimit;
  }

  /**
   * Validate measurements against specifications
   */
  private validateMeasurements(
    measurements: Measurement[],
    parameters: QualityParameter[]
  ): Measurement[] {
    return measurements.map(measurement => {
      const parameter = parameters.find(p => p.id === measurement.parameterId);
      if (!parameter) {
        return { ...measurement, withinSpecification: false };
      }

      const spec = parameter.specification;
      const withinSpec = measurement.value >= spec.lowerLimit &&
                         measurement.value <= spec.upperLimit;

      const deviation = withinSpec
        ? 0
        : Math.min(
            Math.abs(measurement.value - spec.upperLimit),
            Math.abs(measurement.value - spec.lowerLimit)
          );

      return {
        ...measurement,
        withinSpecification: withinSpec,
        deviation
      };
    });
  }

  /**
   * Detect defects based on measurements
   */
  private detectDefects(
    measurements: Measurement[],
    parameters: QualityParameter[]
  ): Defect[] {
    const defects: Defect[] = [];

    for (const measurement of measurements) {
      if (!measurement.withinSpecification) {
        const parameter = parameters.find(p => p.id === measurement.parameterId);
        if (!parameter) continue;

        const severity = this.determineDefectSeverity(
          parameter,
          measurement.deviation || 0
        );

        defects.push({
          id: this.generateDefectId(),
          type: this.getDefectType(parameter.type),
          severity,
          location: parameter.name,
          description: `${parameter.name} out of specification: ${measurement.value} ${measurement.unit}`,
          rootCause: this.identifyRootCause(parameter, measurement)
        });
      }
    }

    return defects;
  }

  /**
   * Determine defect severity
   */
  private determineDefectSeverity(
    parameter: QualityParameter,
    deviation: number
  ): DefectSeverity {
    if (parameter.criticalParameter) {
      return 'CRITICAL';
    }

    const spec = parameter.specification;
    const tolerance = spec.upperLimit - spec.lowerLimit;
    const deviationPercent = (deviation / tolerance) * 100;

    if (deviationPercent > 50) {
      return 'CRITICAL';
    } else if (deviationPercent > 20) {
      return 'MAJOR';
    } else {
      return 'MINOR';
    }
  }

  /**
   * Get defect type from parameter type
   */
  private getDefectType(parameterType: string): DefectType {
    const typeMap: Record<string, DefectType> = {
      'DIMENSION': 'DIMENSIONAL',
      'WEIGHT': 'DIMENSIONAL',
      'SURFACE_FINISH': 'SURFACE',
      'VISUAL': 'COSMETIC',
      'CHEMICAL': 'MATERIAL',
      'ELECTRICAL': 'FUNCTIONAL'
    };

    return typeMap[parameterType] || 'DIMENSIONAL';
  }

  /**
   * Identify potential root cause
   */
  private identifyRootCause(
    parameter: QualityParameter,
    measurement: Measurement
  ): string {
    const spec = parameter.specification;

    if (measurement.value > spec.upperLimit) {
      return `Measurement exceeds upper limit by ${(measurement.deviation || 0).toFixed(2)} ${measurement.unit}`;
    } else {
      return `Measurement below lower limit by ${(measurement.deviation || 0).toFixed(2)} ${measurement.unit}`;
    }
  }

  /**
   * Determine overall inspection result
   */
  private determineInspectionResult(
    measurements: Measurement[],
    defects: Defect[],
    checkpoint: QualityCheckpoint
  ): 'PASS' | 'FAIL' | 'CONDITIONAL' {
    // Critical defects = automatic fail
    const criticalDefects = defects.filter(d => d.severity === 'CRITICAL');
    if (criticalDefects.length > 0) {
      return 'FAIL';
    }

    // Major defects above acceptance number = fail
    const majorDefects = defects.filter(d => d.severity === 'MAJOR');
    if (majorDefects.length > checkpoint.samplingPlan.rejectionNumber) {
      return 'FAIL';
    }

    // Minor defects = conditional
    const minorDefects = defects.filter(d => d.severity === 'MINOR');
    if (minorDefects.length > 0) {
      return 'CONDITIONAL';
    }

    return 'PASS';
  }

  /**
   * Make disposition decision
   */
  private makeDisposition(
    result: 'PASS' | 'FAIL' | 'CONDITIONAL',
    defects: Defect[],
    inspector: string
  ): Disposition {
    let decision: 'ACCEPT' | 'REJECT' | 'REWORK' | 'USE_AS_IS' | 'SCRAP';
    let justification: string | undefined;

    switch (result) {
      case 'PASS':
        decision = 'ACCEPT';
        break;

      case 'CONDITIONAL':
        decision = 'USE_AS_IS';
        justification = 'Minor defects within acceptable limits';
        break;

      case 'FAIL':
        const criticalDefects = defects.filter(d => d.severity === 'CRITICAL');
        if (criticalDefects.length > 0) {
          decision = 'SCRAP';
          justification = 'Critical defects detected';
        } else {
          decision = 'REWORK';
          justification = 'Major defects require rework';
        }
        break;
    }

    return {
      decision,
      authority: inspector,
      timestamp: new Date(),
      justification
    };
  }

  /**
   * Update SPC charts with new measurements
   */
  private async updateSPCCharts(
    checkpoint: QualityCheckpoint,
    measurements: Measurement[]
  ): Promise<void> {
    for (const measurement of measurements) {
      const chart = this.spcCharts.get(measurement.parameterId);
      if (chart) {
        // Add new data point
        const newDataPoint: SPCDataPoint = {
          timestamp: new Date(),
          value: measurement.value,
          subgroupNumber: Math.floor(chart.dataPoints.length / this.config.subgroupSize),
          outOfControl: this.isOutOfControl(measurement.value, chart.controlLimits)
        };

        chart.dataPoints.push(newDataPoint);

        // Recalculate control limits if needed
        if (chart.dataPoints.length % this.config.recalculationInterval === 0) {
          const parameter = checkpoint.parameters.find(p => p.id === measurement.parameterId);
          if (parameter) {
            const historicalData = chart.dataPoints.map(dp => dp.value);
            chart.controlLimits = await this.calculateControlLimits(
              historicalData,
              chart.chartType,
              parameter.specification
            );
          }
        }

        // Update violations
        chart.violations = this.detectControlViolations(
          chart.dataPoints,
          chart.controlLimits
        );
      }
    }
  }

  /**
   * Get historical measurements for parameter
   */
  private getHistoricalMeasurements(parameterId: string): number[] {
    return this.inspectionHistory
      .flatMap(inspection => inspection.measurements)
      .filter(m => m.parameterId === parameterId)
      .map(m => m.value);
  }

  /**
   * Generate inspection notes
   */
  private generateInspectionNotes(
    measurements: Measurement[],
    defects: Defect[]
  ): string {
    const notes: string[] = [];

    const outOfSpec = measurements.filter(m => !m.withinSpecification);
    if (outOfSpec.length > 0) {
      notes.push(`${outOfSpec.length} measurements out of specification`);
    }

    if (defects.length > 0) {
      const bySeverity = {
        CRITICAL: defects.filter(d => d.severity === 'CRITICAL').length,
        MAJOR: defects.filter(d => d.severity === 'MAJOR').length,
        MINOR: defects.filter(d => d.severity === 'MINOR').length
      };

      notes.push(`Defects: ${bySeverity.CRITICAL} critical, ${bySeverity.MAJOR} major, ${bySeverity.MINOR} minor`);
    }

    return notes.join('. ');
  }

  /**
   * Generate unique inspection ID
   */
  private generateInspectionId(): string {
    return `INS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique defect ID
   */
  private generateDefectId(): string {
    return `DEF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get SPC chart for parameter
   */
  getSPCChart(parameterId: string): SPCChart | undefined {
    return this.spcCharts.get(parameterId);
  }

  /**
   * Get inspection history
   */
  getInspectionHistory(limit?: number): QualityInspectionResult[] {
    return limit
      ? this.inspectionHistory.slice(-limit)
      : this.inspectionHistory;
  }

  /**
   * Calculate quality metrics
   */
  calculateQualityMetrics(period: { start: Date; end: Date }): QualityMetrics {
    const inspections = this.inspectionHistory.filter(
      i => i.timestamp >= period.start && i.timestamp <= period.end
    );

    const totalInspections = inspections.length;
    const passed = inspections.filter(i => i.overallResult === 'PASS').length;
    const failed = inspections.filter(i => i.overallResult === 'FAIL').length;
    const conditional = inspections.filter(i => i.overallResult === 'CONDITIONAL').length;

    const allDefects = inspections.flatMap(i => i.defects);
    const criticalDefects = allDefects.filter(d => d.severity === 'CRITICAL').length;
    const majorDefects = allDefects.filter(d => d.severity === 'MAJOR').length;
    const minorDefects = allDefects.filter(d => d.severity === 'MINOR').length;

    return {
      totalInspections,
      passRate: (passed / totalInspections) * 100,
      failRate: (failed / totalInspections) * 100,
      conditionalRate: (conditional / totalInspections) * 100,
      totalDefects: allDefects.length,
      criticalDefects,
      majorDefects,
      minorDefects,
      firstPassYield: (passed / totalInspections) * 100
    };
  }
}

// ============================================================================
// Types
// ============================================================================

export interface QualityControlConfig {
  subgroupSize: number;
  recalculationInterval: number; // Number of data points before recalculating limits
  confidenceLevel: number;
}

interface SPCConstants {
  A2: number;
  D3: number;
  D4: number;
  d2: number;
}

interface ZoneLimits {
  upperZoneA: number;
  upperZoneB: number;
  lowerZoneB: number;
  lowerZoneA: number;
}

export interface QualityMetrics {
  totalInspections: number;
  passRate: number;
  failRate: number;
  conditionalRate: number;
  totalDefects: number;
  criticalDefects: number;
  majorDefects: number;
  minorDefects: number;
  firstPassYield: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_QC_CONFIG: QualityControlConfig = {
  subgroupSize: 5,
  recalculationInterval: 25,
  confidenceLevel: 0.95
};
