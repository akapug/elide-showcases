/**
 * Laboratory Results Service
 *
 * Management of laboratory orders, results, and interpretation.
 */

import { randomUUID } from 'crypto'
import type {
  LabOrder,
  LabResult,
  LabTest,
  OrderStatus,
  Provider
} from '../types'

// @ts-ignore - Python libraries for data analysis
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'

/**
 * Lab Results Service
 *
 * Handles laboratory workflows:
 * - Lab order creation
 * - Result management
 * - Result interpretation
 * - Critical value alerting
 * - Trending analysis
 */
export class LabResultsService {
  private orders: Map<string, LabOrder> = new Map()
  private results: Map<string, LabResult> = new Map()
  private referenceRanges: Map<string, any> = new Map()

  constructor() {
    this.initializeService()
  }

  private initializeService(): void {
    this.loadReferenceRanges()
    console.log('Lab Results Service initialized')
  }

  // ============================================================================
  // Lab Orders
  // ============================================================================

  /**
   * Create lab order
   */
  async createOrder(options: {
    patientId: string
    encounterId?: string
    tests: string[]
    priority?: 'routine' | 'urgent' | 'stat' | 'asap'
    orderedBy: Provider
    clinicalInfo?: string
    diagnosis?: string[]
  }): Promise<LabOrder> {
    const order: LabOrder = {
      id: randomUUID(),
      patientId: options.patientId,
      encounterId: options.encounterId,
      status: 'active',
      priority: options.priority || 'routine',
      orderedDate: new Date(),
      orderedBy: options.orderedBy,
      tests: options.tests.map(test => this.getTestDefinition(test)),
      clinicalInfo: options.clinicalInfo,
      diagnosis: options.diagnosis
    }

    this.orders.set(order.id, order)
    console.log(`Lab order created: ${order.id} (${options.tests.length} tests)`)

    return order
  }

  /**
   * Get lab order
   */
  async getOrder(orderId: string): Promise<LabOrder | null> {
    return this.orders.get(orderId) || null
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<LabOrder | null> {
    const order = this.orders.get(orderId)
    if (!order) return null

    order.status = status
    return order
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason: string): Promise<LabOrder | null> {
    const order = this.orders.get(orderId)
    if (!order) return null

    if (order.status === 'completed') {
      throw new Error('Cannot cancel completed order')
    }

    order.status = 'revoked'
    console.log(`Order cancelled: ${orderId} - ${reason}`)

    return order
  }

  // ============================================================================
  // Lab Results
  // ============================================================================

  /**
   * Receive and process lab results
   */
  async receiveResults(options: {
    orderId: string
    results: Record<string, { value: number | string; unit?: string }>
    performedBy?: string
    performedDate?: Date
  }): Promise<{
    resultIds: string[]
    criticalValues: LabResult[]
    abnormalResults: LabResult[]
  }> {
    const order = await this.getOrder(options.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    const resultIds: string[] = []
    const criticalValues: LabResult[] = []
    const abnormalResults: LabResult[] = []

    for (const [testName, resultValue] of Object.entries(options.results)) {
      const testDefinition = order.tests.find(t =>
        t.code.display.toLowerCase().includes(testName.toLowerCase())
      )

      if (!testDefinition) {
        console.warn(`Test ${testName} not found in order`)
        continue
      }

      // Determine value type
      const value = typeof resultValue.value === 'number'
        ? { type: 'numeric' as const, numeric: resultValue.value }
        : { type: 'text' as const, text: String(resultValue.value) }

      // Get reference range
      const refRange = this.getReferenceRange(testName)

      // Interpret result
      const interpretation = this.interpretResult(
        testName,
        resultValue.value,
        refRange
      )

      // Check for critical values
      const flags = this.checkCriticalValue(testName, resultValue.value, refRange)

      const result: LabResult = {
        id: randomUUID(),
        orderId: options.orderId,
        patientId: order.patientId,
        test: testDefinition,
        status: 'final',
        value,
        unit: resultValue.unit || refRange?.unit,
        referenceRange: refRange,
        interpretation,
        flags,
        performedDate: options.performedDate || new Date(),
        reportedDate: new Date(),
        performedBy: options.performedBy
      }

      this.results.set(result.id, result)
      resultIds.push(result.id)

      // Track critical and abnormal values
      if (flags && (flags.includes('critical-high') || flags.includes('critical-low'))) {
        criticalValues.push(result)
      }

      if (interpretation && interpretation !== 'normal') {
        abnormalResults.push(result)
      }
    }

    // Update order status
    await this.updateOrderStatus(options.orderId, 'completed')

    // Alert on critical values
    if (criticalValues.length > 0) {
      await this.alertCriticalValues(criticalValues)
    }

    console.log(`Received ${resultIds.length} results for order ${options.orderId}`)

    return {
      resultIds,
      criticalValues,
      abnormalResults
    }
  }

  /**
   * Get lab result
   */
  async getResult(resultId: string): Promise<LabResult | null> {
    return this.results.get(resultId) || null
  }

  /**
   * Get results for order
   */
  async getOrderResults(orderId: string): Promise<LabResult[]> {
    return Array.from(this.results.values())
      .filter(r => r.orderId === orderId)
      .sort((a, b) => a.test.code.display.localeCompare(b.test.code.display))
  }

  /**
   * Get patient lab history
   */
  async getPatientResults(
    patientId: string,
    options?: {
      testName?: string
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<LabResult[]> {
    let results = Array.from(this.results.values())
      .filter(r => r.patientId === patientId)

    if (options?.testName) {
      results = results.filter(r =>
        r.test.code.display.toLowerCase().includes(options.testName!.toLowerCase())
      )
    }

    if (options?.startDate) {
      results = results.filter(r => r.performedDate >= options.startDate!)
    }

    if (options?.endDate) {
      results = results.filter(r => r.performedDate <= options.endDate!)
    }

    results.sort((a, b) => b.performedDate.getTime() - a.performedDate.getTime())

    if (options?.limit) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  // ============================================================================
  // Result Interpretation
  // ============================================================================

  /**
   * Interpret lab result
   */
  interpretResult(
    testName: string,
    value: number | string,
    refRange?: any
  ): 'normal' | 'high' | 'low' | 'critical-high' | 'critical-low' | 'abnormal' | undefined {
    if (typeof value !== 'number' || !refRange) {
      return undefined
    }

    const numValue = value as number

    // Check critical values first
    if (refRange.criticalHigh && numValue >= refRange.criticalHigh) {
      return 'critical-high'
    }
    if (refRange.criticalLow && numValue <= refRange.criticalLow) {
      return 'critical-low'
    }

    // Check normal range
    if (refRange.high && numValue > refRange.high) {
      return 'high'
    }
    if (refRange.low && numValue < refRange.low) {
      return 'low'
    }

    return 'normal'
  }

  /**
   * Get detailed interpretation with clinical significance
   */
  async interpretResults(resultId: string): Promise<{
    result: LabResult
    interpretation: string
    clinicalSignificance: string
    recommendations: string[]
  }> {
    const result = await this.getResult(resultId)
    if (!result) {
      throw new Error('Result not found')
    }

    const testName = result.test.code.display.toLowerCase()
    let interpretation = ''
    let clinicalSignificance = ''
    const recommendations: string[] = []

    // Test-specific interpretations
    if (testName.includes('glucose')) {
      const value = result.value.numeric!
      if (value < 70) {
        interpretation = 'Hypoglycemia'
        clinicalSignificance = 'Low blood sugar requiring immediate attention'
        recommendations.push('Check for symptoms of hypoglycemia')
        recommendations.push('Administer glucose if symptomatic')
      } else if (value > 125) {
        interpretation = 'Hyperglycemia'
        clinicalSignificance = 'Elevated blood sugar, may indicate diabetes or poor control'
        recommendations.push('Check HbA1c if not recently done')
        recommendations.push('Review diabetes management plan')
      } else {
        interpretation = 'Normal glucose'
        clinicalSignificance = 'Blood sugar within normal range'
      }
    } else if (testName.includes('hemoglobin') || testName.includes('hgb')) {
      const value = result.value.numeric!
      if (value < 12) {
        interpretation = 'Anemia'
        clinicalSignificance = 'Low hemoglobin indicating anemia'
        recommendations.push('Check iron studies, B12, folate')
        recommendations.push('Consider reticulocyte count')
        recommendations.push('Evaluate for bleeding or hemolysis')
      }
    } else if (testName.includes('creatinine')) {
      const value = result.value.numeric!
      if (value > 1.3) {
        interpretation = 'Elevated creatinine'
        clinicalSignificance = 'May indicate impaired kidney function'
        recommendations.push('Calculate eGFR')
        recommendations.push('Review medications that may affect kidney function')
        recommendations.push('Consider renal ultrasound if persistently elevated')
      }
    } else if (testName.includes('potassium')) {
      const value = result.value.numeric!
      if (value > 5.5) {
        interpretation = 'Hyperkalemia'
        clinicalSignificance = 'Elevated potassium - potentially life-threatening'
        recommendations.push('Repeat test to confirm')
        recommendations.push('Check EKG for cardiac changes')
        recommendations.push('Consider treatment to lower potassium')
      } else if (value < 3.5) {
        interpretation = 'Hypokalemia'
        clinicalSignificance = 'Low potassium - may cause cardiac arrhythmias'
        recommendations.push('Supplement potassium')
        recommendations.push('Monitor with repeat testing')
      }
    } else if (testName.includes('troponin')) {
      const value = result.value.numeric!
      if (value > 0.04) {
        interpretation = 'Elevated troponin'
        clinicalSignificance = 'Cardiac enzyme elevation suggesting myocardial injury'
        recommendations.push('Obtain serial troponins')
        recommendations.push('EKG and cardiology consultation')
        recommendations.push('Rule out myocardial infarction')
      }
    }

    return {
      result,
      interpretation: interpretation || 'See reference range',
      clinicalSignificance: clinicalSignificance || 'Value within expected range',
      recommendations
    }
  }

  // ============================================================================
  // Critical Value Management
  // ============================================================================

  /**
   * Check for critical values
   */
  private checkCriticalValue(
    testName: string,
    value: number | string,
    refRange?: any
  ): ('critical' | 'abnormal' | 'high' | 'low')[] | undefined {
    if (typeof value !== 'number' || !refRange) {
      return undefined
    }

    const flags: ('critical' | 'abnormal' | 'high' | 'low')[] = []

    if (refRange.criticalHigh && value >= refRange.criticalHigh) {
      flags.push('critical', 'high')
    } else if (refRange.criticalLow && value <= refRange.criticalLow) {
      flags.push('critical', 'low')
    } else if (refRange.high && value > refRange.high) {
      flags.push('abnormal', 'high')
    } else if (refRange.low && value < refRange.low) {
      flags.push('abnormal', 'low')
    }

    return flags.length > 0 ? flags : undefined
  }

  /**
   * Alert on critical values
   */
  private async alertCriticalValues(results: LabResult[]): Promise<void> {
    for (const result of results) {
      console.log(`🚨 CRITICAL VALUE ALERT: ${result.test.code.display} = ${result.value.numeric} ${result.unit}`)
      console.log(`   Patient ID: ${result.patientId}`)
      console.log(`   Flags: ${result.flags?.join(', ')}`)

      // In production, this would:
      // - Page the ordering physician
      // - Send alerts to care team
      // - Log in audit trail
      // - Require acknowledgment
    }
  }

  // ============================================================================
  // Trending & Analysis
  // ============================================================================

  /**
   * Analyze lab trends over time
   */
  async analyzeTrends(
    patientId: string,
    testName: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    testName: string
    dataPoints: number
    trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating'
    values: Array<{ date: Date; value: number }>
    statistics: {
      min: number
      max: number
      mean: number
      std: number
      range: number
    }
  }> {
    const results = await this.getPatientResults(patientId, {
      testName,
      startDate,
      endDate
    })

    const values = results
      .filter(r => r.value.type === 'numeric' && r.value.numeric !== undefined)
      .map(r => ({
        date: r.performedDate,
        value: r.value.numeric!
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    if (values.length < 2) {
      return {
        testName,
        dataPoints: values.length,
        trend: 'stable',
        values,
        statistics: {
          min: 0,
          max: 0,
          mean: 0,
          std: 0,
          range: 0
        }
      }
    }

    // Calculate statistics using numpy
    const valuesArray = values.map(v => v.value)
    const npArray = numpy.array(valuesArray)

    const statistics = {
      min: parseFloat(numpy.min(npArray)),
      max: parseFloat(numpy.max(npArray)),
      mean: parseFloat(numpy.mean(npArray)),
      std: parseFloat(numpy.std(npArray)),
      range: parseFloat(numpy.max(npArray) - numpy.min(npArray))
    }

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating' = 'stable'

    const firstHalf = valuesArray.slice(0, Math.floor(valuesArray.length / 2))
    const secondHalf = valuesArray.slice(Math.floor(valuesArray.length / 2))

    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    const changePercent = ((secondMean - firstMean) / firstMean) * 100

    if (changePercent > 10) {
      trend = 'increasing'
    } else if (changePercent < -10) {
      trend = 'decreasing'
    } else if (statistics.std / statistics.mean > 0.2) {
      trend = 'fluctuating'
    }

    return {
      testName,
      dataPoints: values.length,
      trend,
      values,
      statistics
    }
  }

  /**
   * Generate lab summary report
   */
  async generateLabSummary(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalOrders: number
    totalResults: number
    abnormalResults: number
    criticalValues: number
    commonTests: Array<{ test: string; count: number }>
    recentAbnormal: LabResult[]
  }> {
    const results = await this.getPatientResults(patientId, { startDate, endDate })

    const abnormalResults = results.filter(r =>
      r.interpretation && r.interpretation !== 'normal'
    ).length

    const criticalValues = results.filter(r =>
      r.flags && (r.flags.includes('critical-high') || r.flags.includes('critical-low'))
    ).length

    // Count test frequency
    const testCounts: Record<string, number> = {}
    results.forEach(r => {
      const testName = r.test.code.display
      testCounts[testName] = (testCounts[testName] || 0) + 1
    })

    const commonTests = Object.entries(testCounts)
      .map(([test, count]) => ({ test, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const recentAbnormal = results
      .filter(r => r.interpretation && r.interpretation !== 'normal')
      .slice(0, 5)

    // Get unique orders
    const orderIds = new Set(results.map(r => r.orderId))

    return {
      totalOrders: orderIds.size,
      totalResults: results.length,
      abnormalResults,
      criticalValues,
      commonTests,
      recentAbnormal
    }
  }

  // ============================================================================
  // Reference Ranges
  // ============================================================================

  /**
   * Get reference range for test
   */
  getReferenceRange(testName: string): any {
    const testLower = testName.toLowerCase()

    for (const [key, value] of this.referenceRanges.entries()) {
      if (testLower.includes(key.toLowerCase())) {
        return value
      }
    }

    return null
  }

  /**
   * Load reference ranges
   */
  private loadReferenceRanges(): void {
    // Common lab reference ranges (adult values)
    this.referenceRanges.set('Glucose', {
      low: 70,
      high: 100,
      criticalLow: 40,
      criticalHigh: 400,
      unit: 'mg/dL'
    })

    this.referenceRanges.set('Hemoglobin', {
      low: 12.0,
      high: 16.0,
      criticalLow: 7.0,
      criticalHigh: 20.0,
      unit: 'g/dL'
    })

    this.referenceRanges.set('WBC', {
      low: 4.5,
      high: 11.0,
      criticalLow: 2.0,
      criticalHigh: 30.0,
      unit: '10^9/L'
    })

    this.referenceRanges.set('Platelet', {
      low: 150,
      high: 400,
      criticalLow: 50,
      criticalHigh: 1000,
      unit: '10^9/L'
    })

    this.referenceRanges.set('Creatinine', {
      low: 0.6,
      high: 1.2,
      criticalHigh: 5.0,
      unit: 'mg/dL'
    })

    this.referenceRanges.set('Potassium', {
      low: 3.5,
      high: 5.0,
      criticalLow: 2.5,
      criticalHigh: 6.0,
      unit: 'mmol/L'
    })

    this.referenceRanges.set('Sodium', {
      low: 136,
      high: 145,
      criticalLow: 120,
      criticalHigh: 160,
      unit: 'mmol/L'
    })

    this.referenceRanges.set('Troponin', {
      high: 0.04,
      criticalHigh: 0.10,
      unit: 'ng/mL'
    })

    this.referenceRanges.set('HbA1c', {
      high: 5.7,
      criticalHigh: 10.0,
      unit: '%'
    })

    this.referenceRanges.set('TSH', {
      low: 0.4,
      high: 4.0,
      unit: 'mIU/L'
    })
  }

  /**
   * Get test definition
   */
  private getTestDefinition(testName: string): LabTest {
    // LOINC codes for common tests
    const testDefinitions: Record<string, LabTest> = {
      'CBC': {
        code: { system: 'LOINC', code: '58410-2', display: 'Complete Blood Count' },
        category: 'Hematology',
        panel: true
      },
      'CMP': {
        code: { system: 'LOINC', code: '24323-8', display: 'Comprehensive Metabolic Panel' },
        category: 'Chemistry',
        panel: true
      },
      'BMP': {
        code: { system: 'LOINC', code: '24362-6', display: 'Basic Metabolic Panel' },
        category: 'Chemistry',
        panel: true
      },
      'Lipid Panel': {
        code: { system: 'LOINC', code: '57698-3', display: 'Lipid Panel' },
        category: 'Chemistry',
        panel: true
      },
      'HbA1c': {
        code: { system: 'LOINC', code: '4548-4', display: 'Hemoglobin A1c' },
        category: 'Chemistry'
      },
      'TSH': {
        code: { system: 'LOINC', code: '3016-3', display: 'Thyroid Stimulating Hormone' },
        category: 'Endocrinology'
      },
      'Troponin': {
        code: { system: 'LOINC', code: '10839-9', display: 'Troponin I' },
        category: 'Cardiac'
      }
    }

    return testDefinitions[testName] || {
      code: { system: 'LOINC', code: '000000', display: testName },
      category: 'General'
    }
  }
}
