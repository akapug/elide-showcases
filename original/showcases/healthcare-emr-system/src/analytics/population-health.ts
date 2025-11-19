/**
 * Population Health Analytics
 *
 * Analytics and reporting for population health management,
 * quality metrics, risk stratification, and outcomes analysis.
 */

import type {
  Patient,
  PopulationHealthMetrics,
  QualityMetric,
  Condition,
  Gender
} from '../types'

// @ts-ignore - Python data science libraries
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import matplotlib from 'python:matplotlib.pyplot'

/**
 * Population Health Service
 *
 * Provides analytics for:
 * - Population health metrics
 * - Quality measure tracking
 * - Risk stratification
 * - Cost analysis
 * - Outcome tracking
 * - Care gap identification
 */
export class PopulationHealth {
  private patients: Patient[] = []

  constructor() {
    console.log('Population Health Analytics initialized')
  }

  // ============================================================================
  // Population Metrics
  // ============================================================================

  /**
   * Calculate comprehensive population health metrics
   */
  async calculatePopulationMetrics(patients: Patient[]): Promise<PopulationHealthMetrics> {
    this.patients = patients

    const totalPatients = patients.length

    // Demographics
    const demographics = {
      ageDistribution: this.calculateAgeDistribution(patients),
      genderDistribution: this.calculateGenderDistribution(patients),
      raceDistribution: this.calculateRaceDistribution(patients)
    }

    // Disease prevalence
    const prevalence = this.calculatePrevalence(patients)

    // Quality metrics
    const qualityMetrics = await this.calculateQualityMetrics({
      measures: ['HEDIS', 'STAR', 'MIPS'],
      period: new Date().getFullYear().toString()
    })

    // Risk stratification
    const riskStratification = this.stratifyPopulationRisk(patients)

    return {
      totalPatients,
      demographics,
      prevalence,
      qualityMetrics,
      riskStratification
    }
  }

  /**
   * Calculate age distribution
   */
  private calculateAgeDistribution(patients: Patient[]): Array<{ range: string; count: number }> {
    const ageGroups: Record<string, number> = {
      '0-17': 0,
      '18-34': 0,
      '35-49': 0,
      '50-64': 0,
      '65-79': 0,
      '80+': 0
    }

    patients.forEach(patient => {
      const age = this.calculateAge(patient.demographics.dateOfBirth)

      if (age < 18) ageGroups['0-17']++
      else if (age < 35) ageGroups['18-34']++
      else if (age < 50) ageGroups['35-49']++
      else if (age < 65) ageGroups['50-64']++
      else if (age < 80) ageGroups['65-79']++
      else ageGroups['80+']++
    })

    return Object.entries(ageGroups).map(([range, count]) => ({ range, count }))
  }

  /**
   * Calculate gender distribution
   */
  private calculateGenderDistribution(patients: Patient[]): Record<Gender, number> {
    const distribution: Record<string, number> = {
      male: 0,
      female: 0,
      other: 0,
      unknown: 0
    }

    patients.forEach(patient => {
      distribution[patient.demographics.gender]++
    })

    return distribution as Record<Gender, number>
  }

  /**
   * Calculate race/ethnicity distribution
   */
  private calculateRaceDistribution(patients: Patient[]): Record<string, number> {
    const distribution: Record<string, number> = {}

    patients.forEach(patient => {
      if (patient.demographics.race) {
        patient.demographics.race.forEach(race => {
          distribution[race] = (distribution[race] || 0) + 1
        })
      }
    })

    return distribution
  }

  /**
   * Calculate disease prevalence
   */
  private calculatePrevalence(patients: Patient[]): Array<{
    condition: string
    count: number
    percentage: number
  }> {
    const conditionCounts: Record<string, number> = {}

    patients.forEach(patient => {
      patient.conditions
        .filter(c => c.clinicalStatus === 'active')
        .forEach(condition => {
          const name = condition.code.display
          conditionCounts[name] = (conditionCounts[name] || 0) + 1
        })
    })

    const prevalence = Object.entries(conditionCounts)
      .map(([condition, count]) => ({
        condition,
        count,
        percentage: parseFloat(((count / patients.length) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count)

    return prevalence
  }

  /**
   * Stratify population by risk
   */
  private stratifyPopulationRisk(patients: Patient[]): {
    low: number
    moderate: number
    high: number
  } {
    const risk = { low: 0, moderate: 0, high: 0 }

    patients.forEach(patient => {
      const score = this.calculateRiskScore(patient)

      if (score <= 3) risk.low++
      else if (score <= 7) risk.moderate++
      else risk.high++
    })

    return risk
  }

  /**
   * Calculate individual risk score
   */
  private calculateRiskScore(patient: Patient): number {
    let score = 0

    // Age risk
    const age = this.calculateAge(patient.demographics.dateOfBirth)
    if (age > 65) score += 2
    if (age > 80) score += 2

    // Chronic conditions
    const activeConditions = patient.conditions.filter(c => c.clinicalStatus === 'active')
    score += Math.min(activeConditions.length, 5)

    // Polypharmacy
    const activeMeds = patient.medications.filter(m => m.status === 'active')
    if (activeMeds.length >= 5) score += 1
    if (activeMeds.length >= 10) score += 2

    // Recent hospitalizations
    const recentAdmissions = patient.encounters.filter(e =>
      e.type === 'inpatient' &&
      e.date > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
    )
    score += recentAdmissions.length * 2

    return score
  }

  // ============================================================================
  // Quality Metrics (HEDIS, STAR, MIPS)
  // ============================================================================

  /**
   * Calculate quality metrics
   */
  async calculateQualityMetrics(options: {
    measures: Array<'HEDIS' | 'STAR' | 'MIPS' | 'custom'>
    period: string
  }): Promise<QualityMetric[]> {
    const metrics: QualityMetric[] = []

    if (options.measures.includes('HEDIS')) {
      metrics.push(...await this.calculateHEDISMetrics())
    }

    if (options.measures.includes('STAR')) {
      metrics.push(...await this.calculateSTARMetrics())
    }

    if (options.measures.includes('MIPS')) {
      metrics.push(...await this.calculateMIPSMetrics())
    }

    return metrics
  }

  /**
   * Calculate HEDIS measures
   */
  private async calculateHEDISMetrics(): Promise<QualityMetric[]> {
    const metrics: QualityMetric[] = []

    // Diabetes: HbA1c Testing
    metrics.push(await this.calculateDiabetesHbA1cTesting())

    // Hypertension: Blood Pressure Control
    metrics.push(await this.calculateBPControl())

    // Breast Cancer Screening
    metrics.push(await this.calculateBreastCancerScreening())

    // Colorectal Cancer Screening
    metrics.push(await this.calculateColorectalScreening())

    // Controlling High Blood Pressure
    metrics.push(await this.calculateHTNControl())

    return metrics
  }

  /**
   * HEDIS: Diabetes HbA1c Testing
   */
  private async calculateDiabetesHbA1cTesting(): Promise<QualityMetric> {
    const diabeticPatients = this.patients.filter(p =>
      p.conditions.some(c =>
        c.code.display.toLowerCase().includes('diabetes') &&
        c.clinicalStatus === 'active'
      )
    )

    const testedPatients = diabeticPatients.filter(p =>
      p.labResults.some(r =>
        r.test.code.display.toLowerCase().includes('hba1c') &&
        r.performedDate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      )
    )

    const numerator = testedPatients.length
    const denominator = diabeticPatients.length
    const percentage = denominator > 0 ? (numerator / denominator) * 100 : 0

    return {
      measure: 'CDC-HbA1c',
      description: 'Comprehensive Diabetes Care: HbA1c Testing',
      numerator,
      denominator,
      percentage: parseFloat(percentage.toFixed(2)),
      benchmark: 90,
      target: 95,
      category: 'HEDIS'
    }
  }

  /**
   * HEDIS: Blood Pressure Control
   */
  private async calculateBPControl(): Promise<QualityMetric> {
    const htnPatients = this.patients.filter(p =>
      p.conditions.some(c =>
        c.code.display.toLowerCase().includes('hypertension') &&
        c.clinicalStatus === 'active'
      )
    )

    const controlledPatients = htnPatients.filter(p => {
      const latestVitals = p.vitalSigns[p.vitalSigns.length - 1]
      if (!latestVitals?.bloodPressure) return false

      return (
        latestVitals.bloodPressure.systolic < 140 &&
        latestVitals.bloodPressure.diastolic < 90
      )
    })

    const numerator = controlledPatients.length
    const denominator = htnPatients.length
    const percentage = denominator > 0 ? (numerator / denominator) * 100 : 0

    return {
      measure: 'CBP',
      description: 'Controlling Blood Pressure',
      numerator,
      denominator,
      percentage: parseFloat(percentage.toFixed(2)),
      benchmark: 70,
      target: 80,
      category: 'HEDIS'
    }
  }

  /**
   * HEDIS: Breast Cancer Screening
   */
  private async calculateBreastCancerScreening(): Promise<QualityMetric> {
    const eligiblePatients = this.patients.filter(p => {
      const age = this.calculateAge(p.demographics.dateOfBirth)
      return p.demographics.gender === 'female' && age >= 50 && age <= 74
    })

    const screenedPatients = eligiblePatients.filter(p =>
      p.imagingStudies.some(s =>
        s.modality === 'MG' &&
        s.started &&
        s.started > new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
      )
    )

    const numerator = screenedPatients.length
    const denominator = eligiblePatients.length
    const percentage = denominator > 0 ? (numerator / denominator) * 100 : 0

    return {
      measure: 'BCS',
      description: 'Breast Cancer Screening',
      numerator,
      denominator,
      percentage: parseFloat(percentage.toFixed(2)),
      benchmark: 75,
      target: 85,
      category: 'HEDIS'
    }
  }

  /**
   * HEDIS: Colorectal Cancer Screening
   */
  private async calculateColorectalScreening(): Promise<QualityMetric> {
    const eligiblePatients = this.patients.filter(p => {
      const age = this.calculateAge(p.demographics.dateOfBirth)
      return age >= 50 && age <= 75
    })

    // Placeholder - would check for colonoscopy, FIT test, etc.
    const screenedPatients = eligiblePatients.filter(() => Math.random() > 0.3)

    const numerator = screenedPatients.length
    const denominator = eligiblePatients.length
    const percentage = denominator > 0 ? (numerator / denominator) * 100 : 0

    return {
      measure: 'COL',
      description: 'Colorectal Cancer Screening',
      numerator,
      denominator,
      percentage: parseFloat(percentage.toFixed(2)),
      benchmark: 65,
      target: 75,
      category: 'HEDIS'
    }
  }

  /**
   * HEDIS: Hypertension Control
   */
  private async calculateHTNControl(): Promise<QualityMetric> {
    const htnPatients = this.patients.filter(p =>
      p.conditions.some(c =>
        (c.code.display.toLowerCase().includes('hypertension') ||
         c.code.display.toLowerCase().includes('high blood pressure')) &&
        c.clinicalStatus === 'active'
      )
    )

    const controlledPatients = htnPatients.filter(p => {
      const latestVitals = p.vitalSigns[p.vitalSigns.length - 1]
      if (!latestVitals?.bloodPressure) return false

      const age = this.calculateAge(p.demographics.dateOfBirth)
      const target = age < 60 ? 140 : 150

      return (
        latestVitals.bloodPressure.systolic < target &&
        latestVitals.bloodPressure.diastolic < 90
      )
    })

    const numerator = controlledPatients.length
    const denominator = htnPatients.length
    const percentage = denominator > 0 ? (numerator / denominator) * 100 : 0

    return {
      measure: 'CBP-HTN',
      description: 'Controlling High Blood Pressure',
      numerator,
      denominator,
      percentage: parseFloat(percentage.toFixed(2)),
      benchmark: 68,
      target: 75,
      category: 'HEDIS'
    }
  }

  /**
   * Calculate STAR measures (Medicare Advantage)
   */
  private async calculateSTARMetrics(): Promise<QualityMetric[]> {
    return [
      // Placeholder for STAR measures
      {
        measure: 'STAR-DM',
        description: 'Diabetes Care - Blood Sugar Controlled',
        numerator: 0,
        denominator: 0,
        percentage: 0,
        benchmark: 80,
        target: 90,
        category: 'STAR'
      }
    ]
  }

  /**
   * Calculate MIPS measures (Merit-based Incentive Payment System)
   */
  private async calculateMIPSMetrics(): Promise<QualityMetric[]> {
    return [
      // Placeholder for MIPS measures
      {
        measure: 'MIPS-001',
        description: 'Diabetes: Hemoglobin A1c (HbA1c) Poor Control (>9%)',
        numerator: 0,
        denominator: 0,
        percentage: 0,
        target: 20, // Lower is better for this inverse measure
        category: 'MIPS'
      }
    ]
  }

  // ============================================================================
  // Condition-Specific Analysis
  // ============================================================================

  /**
   * Analyze specific condition outcomes
   */
  async analyzeCondition(options: {
    condition: string
    timeframe: string
    metrics: string[]
  }): Promise<{
    condition: string
    prevalence: number
    totalPatients: number
    outcomes: Record<string, any>
    trends: any[]
  }> {
    const conditionPatients = this.patients.filter(p =>
      p.conditions.some(c =>
        c.code.display.toLowerCase().includes(options.condition.toLowerCase()) &&
        c.clinicalStatus === 'active'
      )
    )

    const prevalence = (conditionPatients.length / this.patients.length) * 100

    const outcomes: Record<string, any> = {}

    // Condition-specific analysis
    if (options.condition.toLowerCase().includes('diabetes')) {
      outcomes.hba1cControl = this.analyzeDiabetesControl(conditionPatients)
      outcomes.complications = this.analyzeDiabetesComplications(conditionPatients)
      outcomes.medicationAdherence = this.analyzeMedicationAdherence(conditionPatients)
    }

    if (options.condition.toLowerCase().includes('heart') || options.condition.toLowerCase().includes('cardiac')) {
      outcomes.readmissions = this.analyzeReadmissions(conditionPatients, 30)
      outcomes.mortalityRate = this.analyzeOutcomes(conditionPatients, 'mortality')
    }

    return {
      condition: options.condition,
      prevalence: parseFloat(prevalence.toFixed(2)),
      totalPatients: conditionPatients.length,
      outcomes,
      trends: []
    }
  }

  /**
   * Analyze diabetes control
   */
  private analyzeDiabetesControl(patients: Patient[]): {
    controlled: number
    uncontrolled: number
    avgHbA1c: number
  } {
    let controlled = 0
    let uncontrolled = 0
    let totalHbA1c = 0
    let hba1cCount = 0

    patients.forEach(patient => {
      const latestHbA1c = patient.labResults
        .filter(r => r.test.code.display.toLowerCase().includes('hba1c'))
        .sort((a, b) => b.performedDate.getTime() - a.performedDate.getTime())[0]

      if (latestHbA1c && latestHbA1c.value.numeric) {
        const value = latestHbA1c.value.numeric
        totalHbA1c += value
        hba1cCount++

        if (value < 7.0) controlled++
        else uncontrolled++
      }
    })

    return {
      controlled,
      uncontrolled,
      avgHbA1c: hba1cCount > 0 ? parseFloat((totalHbA1c / hba1cCount).toFixed(2)) : 0
    }
  }

  /**
   * Analyze diabetes complications
   */
  private analyzeDiabetesComplications(patients: Patient[]): {
    retinopathy: number
    nephropathy: number
    neuropathy: number
    cardiovascular: number
  } {
    const complications = {
      retinopathy: 0,
      nephropathy: 0,
      neuropathy: 0,
      cardiovascular: 0
    }

    patients.forEach(patient => {
      patient.conditions.forEach(condition => {
        const display = condition.code.display.toLowerCase()

        if (display.includes('retinopathy')) complications.retinopathy++
        if (display.includes('nephropathy') || display.includes('kidney')) complications.nephropathy++
        if (display.includes('neuropathy')) complications.neuropathy++
        if (display.includes('heart') || display.includes('cardiac')) complications.cardiovascular++
      })
    })

    return complications
  }

  /**
   * Analyze medication adherence
   */
  private analyzeMedicationAdherence(patients: Patient[]): {
    adherent: number
    nonAdherent: number
    avgAdherence: number
  } {
    // Placeholder - would calculate based on refill data
    const totalPatients = patients.length
    const adherent = Math.floor(totalPatients * 0.75)
    const nonAdherent = totalPatients - adherent

    return {
      adherent,
      nonAdherent,
      avgAdherence: 75.0
    }
  }

  /**
   * Analyze hospital readmissions
   */
  private analyzeReadmissions(patients: Patient[], days: number): {
    readmissions: number
    rate: number
  } {
    let readmissions = 0

    patients.forEach(patient => {
      const admissions = patient.encounters
        .filter(e => e.type === 'inpatient')
        .sort((a, b) => a.date.getTime() - b.date.getTime())

      for (let i = 1; i < admissions.length; i++) {
        const daysBetween = (admissions[i].date.getTime() - admissions[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)
        if (daysBetween <= days) {
          readmissions++
        }
      }
    })

    const totalAdmissions = patients.reduce((sum, p) =>
      sum + p.encounters.filter(e => e.type === 'inpatient').length, 0
    )

    const rate = totalAdmissions > 0 ? (readmissions / totalAdmissions) * 100 : 0

    return {
      readmissions,
      rate: parseFloat(rate.toFixed(2))
    }
  }

  /**
   * Analyze patient outcomes
   */
  private analyzeOutcomes(patients: Patient[], outcome: 'mortality' | 'morbidity'): {
    count: number
    rate: number
  } {
    let count = 0

    if (outcome === 'mortality') {
      count = patients.filter(p => p.demographics.deceased).length
    }

    const rate = (count / patients.length) * 100

    return {
      count,
      rate: parseFloat(rate.toFixed(2))
    }
  }

  // ============================================================================
  // Care Gap Analysis
  // ============================================================================

  /**
   * Identify care gaps
   */
  async identifyCareGaps(patients: Patient[]): Promise<Array<{
    patientId: string
    patientName: string
    gaps: Array<{
      type: string
      description: string
      priority: 'high' | 'medium' | 'low'
      dueDate?: Date
    }>
  }>> {
    const careGaps: Array<{
      patientId: string
      patientName: string
      gaps: Array<{
        type: string
        description: string
        priority: 'high' | 'medium' | 'low'
        dueDate?: Date
      }>
    }> = []

    for (const patient of patients) {
      const gaps: Array<{
        type: string
        description: string
        priority: 'high' | 'medium' | 'low'
        dueDate?: Date
      }> = []

      // Check for overdue screenings
      const age = this.calculateAge(patient.demographics.dateOfBirth)

      // Mammogram for women 50-74
      if (patient.demographics.gender === 'female' && age >= 50 && age <= 74) {
        const lastMammogram = patient.imagingStudies
          .filter(s => s.modality === 'MG')
          .sort((a, b) => (b.started?.getTime() || 0) - (a.started?.getTime() || 0))[0]

        if (!lastMammogram || !lastMammogram.started ||
            lastMammogram.started < new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)) {
          gaps.push({
            type: 'screening',
            description: 'Mammogram overdue',
            priority: 'high',
            dueDate: new Date()
          })
        }
      }

      // HbA1c for diabetics
      const hasDiabetes = patient.conditions.some(c =>
        c.code.display.toLowerCase().includes('diabetes') &&
        c.clinicalStatus === 'active'
      )

      if (hasDiabetes) {
        const lastHbA1c = patient.labResults
          .filter(r => r.test.code.display.toLowerCase().includes('hba1c'))
          .sort((a, b) => b.performedDate.getTime() - a.performedDate.getTime())[0]

        if (!lastHbA1c ||
            lastHbA1c.performedDate < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
          gaps.push({
            type: 'lab',
            description: 'HbA1c testing overdue (every 3 months)',
            priority: 'high',
            dueDate: new Date()
          })
        }
      }

      // Annual wellness visit
      const lastWellnessVisit = patient.encounters
        .filter(e => e.type === 'ambulatory')
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0]

      if (!lastWellnessVisit ||
          lastWellnessVisit.date < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
        gaps.push({
          type: 'preventive',
          description: 'Annual wellness visit overdue',
          priority: 'medium',
          dueDate: new Date()
        })
      }

      if (gaps.length > 0) {
        careGaps.push({
          patientId: patient.id,
          patientName: `${patient.demographics.firstName} ${patient.demographics.lastName}`,
          gaps
        })
      }
    }

    return careGaps
  }

  // ============================================================================
  // Cost Analysis
  // ============================================================================

  /**
   * Analyze healthcare costs
   */
  async analyzeCosts(patients: Patient[]): Promise<{
    totalCost: number
    avgCostPerPatient: number
    highCostPatients: Array<{ patientId: string; cost: number }>
    costByCategory: Record<string, number>
  }> {
    let totalCost = 0
    const patientCosts: Array<{ patientId: string; cost: number }> = []

    patients.forEach(patient => {
      let patientCost = 0

      // Calculate encounter costs (simplified)
      patient.encounters.forEach(encounter => {
        if (encounter.type === 'inpatient') patientCost += 15000
        else if (encounter.type === 'emergency') patientCost += 2000
        else if (encounter.type === 'ambulatory') patientCost += 200
      })

      // Add imaging costs
      patient.imagingStudies.forEach(study => {
        if (study.modality === 'CT') patientCost += 1500
        else if (study.modality === 'MRI') patientCost += 2500
        else if (study.modality === 'XR') patientCost += 200
      })

      // Add medication costs (estimate)
      patient.medications
        .filter(m => m.status === 'active')
        .forEach(() => {
          patientCost += 1200 // Annual cost per medication
        })

      totalCost += patientCost
      patientCosts.push({ patientId: patient.id, cost: patientCost })
    })

    const avgCostPerPatient = patients.length > 0 ? totalCost / patients.length : 0

    const highCostPatients = patientCosts
      .filter(p => p.cost > avgCostPerPatient * 2)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)

    const costByCategory = {
      inpatient: 0,
      outpatient: 0,
      emergency: 0,
      pharmacy: 0,
      imaging: 0,
      laboratory: 0
    }

    return {
      totalCost: Math.round(totalCost),
      avgCostPerPatient: Math.round(avgCostPerPatient),
      highCostPatients,
      costByCategory
    }
  }

  // ============================================================================
  // Predictive Analytics
  // ============================================================================

  /**
   * Predict future utilization using pandas
   */
  async predictUtilization(patients: Patient[]): Promise<{
    predictedAdmissions: number
    predictedERVisits: number
    highRiskPatients: string[]
  }> {
    // Create DataFrame from patient data
    const data = patients.map(p => {
      const age = this.calculateAge(p.demographics.dateOfBirth)
      const conditions = p.conditions.filter(c => c.clinicalStatus === 'active').length
      const medications = p.medications.filter(m => m.status === 'active').length
      const recentAdmissions = p.encounters.filter(e =>
        e.type === 'inpatient' &&
        e.date > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      ).length

      return {
        patient_id: p.id,
        age,
        conditions,
        medications,
        recent_admissions: recentAdmissions
      }
    })

    const df = pandas.DataFrame(data)

    // Simple prediction based on risk factors
    const highRiskPatients = data
      .filter(p => p.age > 65 && p.conditions >= 3 && p.recent_admissions > 0)
      .map(p => p.patient_id)

    const predictedAdmissions = Math.round(highRiskPatients.length * 0.3)
    const predictedERVisits = Math.round(patients.length * 0.15)

    return {
      predictedAdmissions,
      predictedERVisits,
      highRiskPatients
    }
  }

  // ============================================================================
  // Reporting
  // ============================================================================

  /**
   * Generate comprehensive population health report
   */
  async generateReport(patients: Patient[]): Promise<{
    summary: PopulationHealthMetrics
    qualityScores: QualityMetric[]
    careGaps: number
    costAnalysis: any
    recommendations: string[]
  }> {
    const summary = await this.calculatePopulationMetrics(patients)
    const qualityScores = await this.calculateQualityMetrics({
      measures: ['HEDIS', 'STAR', 'MIPS'],
      period: new Date().getFullYear().toString()
    })
    const careGaps = (await this.identifyCareGaps(patients)).length
    const costAnalysis = await this.analyzeCosts(patients)

    const recommendations: string[] = []

    // Generate recommendations based on findings
    if (summary.riskStratification.high > summary.riskStratification.low) {
      recommendations.push('Implement intensive care management program for high-risk patients')
    }

    qualityScores.forEach(metric => {
      if (metric.benchmark && metric.percentage < metric.benchmark) {
        recommendations.push(
          `Improve ${metric.description} (currently ${metric.percentage}%, benchmark ${metric.benchmark}%)`
        )
      }
    })

    if (careGaps > patients.length * 0.2) {
      recommendations.push('Launch care gap closure initiative to improve preventive care compliance')
    }

    return {
      summary,
      qualityScores,
      careGaps,
      costAnalysis,
      recommendations
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date()
    let age = today.getFullYear() - dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - dateOfBirth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--
    }

    return age
  }

  /**
   * Export data to pandas DataFrame for advanced analysis
   */
  async exportToDataFrame(patients: Patient[]): Promise<any> {
    const data = patients.map(p => ({
      patient_id: p.id,
      mrn: p.mrn,
      age: this.calculateAge(p.demographics.dateOfBirth),
      gender: p.demographics.gender,
      active_conditions: p.conditions.filter(c => c.clinicalStatus === 'active').length,
      active_medications: p.medications.filter(m => m.status === 'active').length,
      total_encounters: p.encounters.length,
      recent_admissions: p.encounters.filter(e =>
        e.type === 'inpatient' &&
        e.date > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      ).length
    }))

    return pandas.DataFrame(data)
  }
}
