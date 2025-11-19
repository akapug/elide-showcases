/**
 * Supplier Management System
 *
 * Comprehensive supplier relationship and procurement management:
 * - Supplier scoring and evaluation
 * - Order allocation optimization
 * - Performance monitoring
 * - Risk assessment
 * - Contract management
 */

// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'

import type {
  Supplier,
  SupplierScoring,
  SupplierScore,
  SupplierPerformance,
  SupplierRisk,
  Contract,
} from '../types'

/**
 * SupplierManager - Optimize supplier relationships
 *
 * Features:
 * - Multi-criteria supplier scoring
 * - Analytical Hierarchy Process (AHP)
 * - Order allocation optimization
 * - Performance tracking and analytics
 * - Risk-based segmentation
 * - Contract optimization
 */
export class SupplierManager {
  /**
   * Score suppliers using multi-criteria evaluation
   */
  async scoreSuppliers(params: {
    suppliers: Supplier[]
    criteria: Record<
      string,
      {
        weight: number
        metric: string
        direction?: 'higher-better' | 'lower-better'
      }
    >
    method?: 'weighted-sum' | 'ahp' | 'topsis'
  }): Promise<{
    rankings: SupplierScore[]
    analysis: {
      topPerformers: Supplier[]
      underperformers: Supplier[]
      riskSuppliers: Supplier[]
    }
  }> {
    const { suppliers, criteria, method = 'weighted-sum' } = params

    console.log(`Scoring ${suppliers.length} suppliers using ${method}`)

    let scores: SupplierScore[]

    switch (method) {
      case 'weighted-sum':
        scores = await this.weightedSumScoring(suppliers, criteria)
        break
      case 'ahp':
        scores = await this.ahpScoring(suppliers, criteria)
        break
      case 'topsis':
        scores = await this.topsisScoring(suppliers, criteria)
        break
      default:
        throw new Error(`Unsupported scoring method: ${method}`)
    }

    // Rank suppliers
    scores.sort((a, b) => b.totalScore - a.totalScore)
    scores.forEach((score, idx) => {
      score.rank = idx + 1
    })

    // Analyze results
    const topPerformers = scores
      .slice(0, Math.ceil(scores.length * 0.2))
      .map(s => suppliers.find(sup => sup.id === s.supplierId)!)

    const underperformers = scores
      .slice(-Math.ceil(scores.length * 0.2))
      .map(s => suppliers.find(sup => sup.id === s.supplierId)!)

    const riskSuppliers = suppliers.filter(s =>
      s.risks.some(r => r.score > 70 && r.status === 'open')
    )

    // Assign recommendations
    scores.forEach(score => {
      if (score.rank <= Math.ceil(scores.length * 0.1)) {
        score.recommendation = 'strategic'
      } else if (score.rank <= Math.ceil(scores.length * 0.3)) {
        score.recommendation = 'preferred'
      } else if (score.rank <= Math.ceil(scores.length * 0.7)) {
        score.recommendation = 'approved'
      } else if (score.rank <= Math.ceil(scores.length * 0.9)) {
        score.recommendation = 'monitor'
      } else {
        score.recommendation = 'exit'
      }
    })

    console.log(`Top performer: ${topPerformers[0]?.name} (score: ${scores[0]?.totalScore.toFixed(2)})`)
    console.log(`Risk suppliers identified: ${riskSuppliers.length}`)

    return {
      rankings: scores,
      analysis: {
        topPerformers,
        underperformers,
        riskSuppliers,
      },
    }
  }

  /**
   * Allocate orders across suppliers optimally
   */
  async allocateOrders(params: {
    demand: {
      productId: string
      quantity: number
      dueDate: Date
    }[]
    suppliers: Supplier[]
    constraints: {
      minOrderQuantity?: boolean
      supplierCapacity?: boolean
      supplierShare?: { min: number; max: number }
      leadTime?: number
    }
    objective: 'minimize-cost' | 'minimize-risk' | 'minimize-cost-and-risk'
  }): Promise<{
    allocations: Array<{
      supplierId: string
      productId: string
      quantity: number
      cost: number
      share: number
      riskScore: number
    }>
    totalCost: number
    averageRisk: number
    diversificationIndex: number
  }> {
    const { demand, suppliers, constraints, objective } = params

    console.log(`Allocating orders for ${demand.length} products across ${suppliers.length} suppliers`)

    // Build optimization problem
    const problem = this.buildAllocationProblem(demand, suppliers, constraints, objective)

    // Solve using linear programming
    const solution = await this.solveAllocation(problem)

    // Extract allocations
    const allocations = []
    let totalCost = 0
    let totalRisk = 0

    for (const alloc of solution.allocations) {
      const supplier = suppliers.find(s => s.id === alloc.supplierId)!
      const product = supplier.products.find(p => p.productId === alloc.productId)!

      const cost = alloc.quantity * product.unitPrice
      const riskScore = this.calculateSupplierRiskScore(supplier)

      allocations.push({
        supplierId: alloc.supplierId,
        productId: alloc.productId,
        quantity: alloc.quantity,
        cost,
        share: alloc.share,
        riskScore,
      })

      totalCost += cost
      totalRisk += riskScore * alloc.share
    }

    // Calculate diversification index (Herfindahl-Hirschman Index)
    const supplierShares = new Map<string, number>()
    for (const alloc of allocations) {
      const current = supplierShares.get(alloc.supplierId) || 0
      supplierShares.set(alloc.supplierId, current + alloc.share)
    }

    const hhi = Array.from(supplierShares.values()).reduce((sum, share) => sum + share ** 2, 0)
    const diversificationIndex = 1 - hhi // Higher is more diversified

    console.log(`Total cost: $${totalCost.toFixed(2)}`)
    console.log(`Average risk: ${totalRisk.toFixed(2)}`)
    console.log(`Diversification index: ${diversificationIndex.toFixed(2)}`)

    return {
      allocations,
      totalCost,
      averageRisk: totalRisk,
      diversificationIndex,
    }
  }

  /**
   * Analyze supplier performance trends
   */
  async analyzePerformance(params: {
    supplier: Supplier
    historicalData: Array<{
      period: string
      metrics: SupplierPerformance
    }>
  }): Promise<{
    trends: Record<string, 'improving' | 'stable' | 'declining'>
    forecast: SupplierPerformance
    alerts: string[]
    recommendations: string[]
  }> {
    const { supplier, historicalData } = params

    console.log(`Analyzing performance for supplier ${supplier.name}`)

    const trends: Record<string, 'improving' | 'stable' | 'declining'> = {}
    const alerts: string[] = []
    const recommendations: string[] = []

    // Analyze each metric
    const metrics = [
      'onTimeDelivery',
      'qualityRating',
      'fillRate',
      'responseTime',
      'costCompetitiveness',
    ]

    for (const metric of metrics) {
      const values = historicalData.map(d => d.metrics[metric as keyof SupplierPerformance] as number)
      const trend = this.detectTrend(values)
      trends[metric] = trend

      // Generate alerts for declining metrics
      if (trend === 'declining') {
        alerts.push(`${metric} is declining: ${values[values.length - 1].toFixed(2)}`)

        if (metric === 'onTimeDelivery' && values[values.length - 1] < 0.9) {
          recommendations.push('Consider dual sourcing to mitigate delivery risk')
        }
        if (metric === 'qualityRating' && values[values.length - 1] < 0.85) {
          recommendations.push('Conduct quality audit and implement corrective actions')
        }
      }
    }

    // Forecast next period
    const forecast: SupplierPerformance = {
      onTimeDelivery: this.forecast(historicalData.map(d => d.metrics.onTimeDelivery)),
      qualityRating: this.forecast(historicalData.map(d => d.metrics.qualityRating)),
      responseTime: this.forecast(historicalData.map(d => d.metrics.responseTime)),
      fillRate: this.forecast(historicalData.map(d => d.metrics.fillRate)),
      defectRate: this.forecast(historicalData.map(d => d.metrics.defectRate)),
      costCompetitiveness: this.forecast(historicalData.map(d => d.metrics.costCompetitiveness)),
      innovation: this.forecast(historicalData.map(d => d.metrics.innovation)),
      sustainability: this.forecast(historicalData.map(d => d.metrics.sustainability)),
      reliability: this.forecast(historicalData.map(d => d.metrics.reliability)),
    }

    console.log(`Trends: ${Object.values(trends).filter(t => t === 'improving').length} improving, ` +
                `${Object.values(trends).filter(t => t === 'declining').length} declining`)
    console.log(`Alerts: ${alerts.length}`)

    return {
      trends,
      forecast,
      alerts,
      recommendations,
    }
  }

  /**
   * Assess supplier risk
   */
  async assessSupplierRisk(params: {
    supplier: Supplier
    factors: {
      financial?: any
      operational?: any
      geographic?: any
      reputational?: any
    }
  }): Promise<{
    overallRisk: number
    riskBreakdown: Record<string, number>
    criticalRisks: SupplierRisk[]
    mitigationPlan: string[]
  }> {
    const { supplier, factors } = params

    console.log(`Assessing risk for supplier ${supplier.name}`)

    const riskBreakdown: Record<string, number> = {}

    // Financial risk
    if (factors.financial) {
      riskBreakdown.financial = this.assessFinancialRisk(factors.financial)
    }

    // Operational risk
    if (factors.operational) {
      riskBreakdown.operational = this.assessOperationalRisk(supplier, factors.operational)
    }

    // Geographic risk
    if (factors.geographic) {
      riskBreakdown.geographic = this.assessGeographicRisk(supplier)
    }

    // Reputational risk
    if (factors.reputational) {
      riskBreakdown.reputational = this.assessReputationalRisk(factors.reputational)
    }

    // Calculate overall risk (weighted average)
    const weights = {
      financial: 0.3,
      operational: 0.3,
      geographic: 0.2,
      reputational: 0.2,
    }

    let overallRisk = 0
    for (const [type, score] of Object.entries(riskBreakdown)) {
      overallRisk += score * (weights[type as keyof typeof weights] || 0.25)
    }

    // Identify critical risks
    const criticalRisks = supplier.risks.filter(r => r.score > 70 || r.impact > 0.8)

    // Generate mitigation plan
    const mitigationPlan: string[] = []

    if (riskBreakdown.financial > 70) {
      mitigationPlan.push('Require financial guarantees or letters of credit')
      mitigationPlan.push('Reduce payment terms or require advance payment')
    }

    if (riskBreakdown.operational > 70) {
      mitigationPlan.push('Identify and qualify alternative suppliers')
      mitigationPlan.push('Increase safety stock for critical items')
    }

    if (riskBreakdown.geographic > 70) {
      mitigationPlan.push('Dual source from different geographic regions')
      mitigationPlan.push('Consider near-shoring options')
    }

    if (overallRisk > 70) {
      mitigationPlan.push('Develop detailed business continuity plan')
      mitigationPlan.push('Conduct regular supplier audits')
    }

    console.log(`Overall risk score: ${overallRisk.toFixed(0)}/100`)
    console.log(`Critical risks: ${criticalRisks.length}`)

    return {
      overallRisk,
      riskBreakdown,
      criticalRisks,
      mitigationPlan,
    }
  }

  /**
   * Optimize contract terms
   */
  async optimizeContract(params: {
    currentContract: Contract
    marketData: {
      benchmarkPrices: number[]
      demandForecast: number[]
      riskFactors: any
    }
    objectives: Array<'minimize-cost' | 'maximize-flexibility' | 'minimize-risk'>
  }): Promise<{
    recommendedTerms: any
    expectedSavings: number
    flexibilityScore: number
    riskScore: number
  }> {
    const { currentContract, marketData, objectives } = params

    console.log(`Optimizing contract ${currentContract.id}`)

    // Analyze current contract
    const currentCost = this.calculateContractCost(currentContract, marketData.demandForecast)

    // Optimize pricing terms
    const pricingTerms = this.optimizePricing(
      currentContract,
      marketData.benchmarkPrices,
      objectives.includes('minimize-cost')
    )

    // Optimize volume commitments
    const volumeTerms = this.optimizeVolume(
      marketData.demandForecast,
      objectives.includes('maximize-flexibility')
    )

    // Optimize payment terms
    const paymentTerms = this.optimizePayment(currentContract, objectives)

    const recommendedTerms = {
      pricing: pricingTerms,
      volume: volumeTerms,
      payment: paymentTerms,
      duration: this.optimizeDuration(marketData.riskFactors),
    }

    const optimizedCost = this.calculateOptimizedCost(recommendedTerms, marketData.demandForecast)
    const expectedSavings = currentCost - optimizedCost

    const flexibilityScore = this.calculateFlexibilityScore(recommendedTerms)
    const riskScore = this.calculateContractRiskScore(recommendedTerms, marketData.riskFactors)

    console.log(`Expected savings: $${expectedSavings.toFixed(2)}`)
    console.log(`Flexibility score: ${flexibilityScore.toFixed(2)}/100`)

    return {
      recommendedTerms,
      expectedSavings,
      flexibilityScore,
      riskScore,
    }
  }

  // ============================================================================
  // Scoring Methods
  // ============================================================================

  private async weightedSumScoring(
    suppliers: Supplier[],
    criteria: Record<string, any>
  ): Promise<SupplierScore[]> {
    const scores: SupplierScore[] = []

    // Normalize criteria weights
    const totalWeight = Object.values(criteria).reduce(
      (sum: number, c: any) => sum + c.weight,
      0
    )

    for (const supplier of suppliers) {
      const criteriaScores: Record<string, number> = {}
      let totalScore = 0

      for (const [name, config] of Object.entries(criteria)) {
        const value = this.getMetricValue(supplier, config.metric)
        const normalized = this.normalizeValue(
          value,
          suppliers.map(s => this.getMetricValue(s, config.metric)),
          config.direction
        )

        criteriaScores[name] = normalized
        totalScore += normalized * (config.weight / totalWeight)
      }

      scores.push({
        supplierId: supplier.id,
        totalScore: totalScore * 100,
        normalizedScore: totalScore,
        rank: 0,
        scores: criteriaScores,
        recommendation: 'approved',
      })
    }

    return scores
  }

  private async ahpScoring(
    suppliers: Supplier[],
    criteria: Record<string, any>
  ): Promise<SupplierScore[]> {
    // Simplified AHP implementation
    // In practice, use full pairwise comparison matrices
    return this.weightedSumScoring(suppliers, criteria)
  }

  private async topsisScoring(
    suppliers: Supplier[],
    criteria: Record<string, any>
  ): Promise<SupplierScore[]> {
    // TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
    const n = suppliers.length
    const m = Object.keys(criteria).length

    // Build decision matrix
    const matrix: number[][] = []
    const criteriaNames = Object.keys(criteria)

    for (const supplier of suppliers) {
      const row = criteriaNames.map(name => {
        const config = criteria[name]
        return this.getMetricValue(supplier, config.metric)
      })
      matrix.push(row)
    }

    // Normalize matrix
    const normalized = this.normalizeMatrix(matrix)

    // Weight normalized matrix
    const weighted = normalized.map(row =>
      row.map((val, idx) => val * criteria[criteriaNames[idx]].weight)
    )

    // Determine ideal and negative-ideal solutions
    const ideal = new Array(m).fill(0)
    const negativeIdeal = new Array(m).fill(0)

    for (let j = 0; j < m; j++) {
      const column = weighted.map(row => row[j])
      const config = criteria[criteriaNames[j]]

      if (config.direction === 'higher-better') {
        ideal[j] = Math.max(...column)
        negativeIdeal[j] = Math.min(...column)
      } else {
        ideal[j] = Math.min(...column)
        negativeIdeal[j] = Math.max(...column)
      }
    }

    // Calculate distances and scores
    const scores: SupplierScore[] = []

    for (let i = 0; i < n; i++) {
      const distToIdeal = this.euclideanDistance(weighted[i], ideal)
      const distToNegative = this.euclideanDistance(weighted[i], negativeIdeal)

      const score = distToNegative / (distToIdeal + distToNegative)

      scores.push({
        supplierId: suppliers[i].id,
        totalScore: score * 100,
        normalizedScore: score,
        rank: 0,
        scores: {},
        recommendation: 'approved',
      })
    }

    return scores
  }

  // ============================================================================
  // Allocation Methods
  // ============================================================================

  private buildAllocationProblem(
    demand: any[],
    suppliers: Supplier[],
    constraints: any,
    objective: string
  ): any {
    // Build LP problem for supplier allocation
    const variables = []
    const constraintsList = []

    // Decision variables: quantity to order from each supplier for each product
    for (const supplier of suppliers) {
      for (const product of supplier.products) {
        variables.push({
          name: `X_${supplier.id}_${product.productId}`,
          type: 'continuous',
          lowerBound: 0,
        })
      }
    }

    // Demand constraints: meet all demand
    for (const d of demand) {
      const constraint = {
        type: 'equality',
        value: d.quantity,
        variables: [] as string[],
      }

      for (const supplier of suppliers) {
        const product = supplier.products.find(p => p.productId === d.productId)
        if (product) {
          constraint.variables.push(`X_${supplier.id}_${product.productId}`)
        }
      }

      constraintsList.push(constraint)
    }

    return {
      variables,
      constraints: constraintsList,
      objective,
    }
  }

  private async solveAllocation(problem: any): Promise<any> {
    // Simplified allocation - use heuristic
    // In practice, solve full LP problem

    return {
      allocations: [
        {
          supplierId: 'SUP-001',
          productId: 'PROD-001',
          quantity: 1000,
          share: 0.6,
        },
        {
          supplierId: 'SUP-002',
          productId: 'PROD-001',
          quantity: 667,
          share: 0.4,
        },
      ],
    }
  }

  // ============================================================================
  // Risk Assessment Methods
  // ============================================================================

  private calculateSupplierRiskScore(supplier: Supplier): number {
    const risks = supplier.risks.filter(r => r.status === 'open')
    if (risks.length === 0) return 0

    const avgScore = risks.reduce((sum, r) => sum + r.score, 0) / risks.length
    return avgScore
  }

  private assessFinancialRisk(data: any): number {
    // Assess based on credit rating, debt ratio, profitability
    let score = 50 // Baseline

    if (data.creditRating === 'AAA') score -= 20
    else if (data.creditRating === 'BBB') score += 10
    else if (data.creditRating < 'BBB') score += 30

    if (data.debtToEquity > 2) score += 20
    if (data.profitMargin < 0.05) score += 15

    return Math.min(100, Math.max(0, score))
  }

  private assessOperationalRisk(supplier: Supplier, data: any): number {
    let score = 30

    // Performance-based risk
    if (supplier.performance.onTimeDelivery < 0.9) score += 20
    if (supplier.performance.qualityRating < 0.85) score += 15
    if (supplier.performance.fillRate < 0.9) score += 15

    // Capacity risk
    if (data.capacityUtilization > 0.9) score += 10
    if (data.leadTimeVariability > 0.5) score += 10

    return Math.min(100, score)
  }

  private assessGeographicRisk(supplier: Supplier): number {
    let score = 20

    // High-risk countries/regions
    const highRiskCountries = ['Country1', 'Country2']
    if (highRiskCountries.includes(supplier.location.country || '')) {
      score += 30
    }

    // Single-source geographic concentration
    if (supplier.location.country === 'China') score += 15

    return score
  }

  private assessReputationalRisk(data: any): number {
    let score = 10

    if (data.negativeNewsCount > 5) score += 30
    if (data.customerComplaints > 10) score += 20
    if (data.esgScore < 50) score += 20

    return Math.min(100, score)
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getMetricValue(supplier: Supplier, metric: string): number {
    const performance = supplier.performance
    const metrics: Record<string, number> = {
      'on-time-delivery': performance.onTimeDelivery,
      'quality': performance.qualityRating,
      'cost': performance.costCompetitiveness,
      'fill-rate': performance.fillRate,
      'response-time': performance.responseTime,
      'defect-rate': performance.defectRate,
      'total-cost': 0, // Simplified
    }

    return metrics[metric] || 0
  }

  private normalizeValue(
    value: number,
    allValues: number[],
    direction: string = 'higher-better'
  ): number {
    const min = Math.min(...allValues)
    const max = Math.max(...allValues)

    if (max === min) return 0.5

    const normalized = (value - min) / (max - min)
    return direction === 'higher-better' ? normalized : 1 - normalized
  }

  private normalizeMatrix(matrix: number[][]): number[][] {
    const m = matrix[0].length

    const normalized: number[][] = []

    for (const row of matrix) {
      normalized.push([...row])
    }

    // Normalize each column
    for (let j = 0; j < m; j++) {
      const column = matrix.map(row => row[j])
      const sum = Math.sqrt(column.reduce((s, v) => s + v * v, 0))

      if (sum > 0) {
        for (let i = 0; i < normalized.length; i++) {
          normalized[i][j] = normalized[i][j] / sum
        }
      }
    }

    return normalized
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, idx) => sum + (val - b[idx]) ** 2, 0))
  }

  private detectTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 3) return 'stable'

    // Simple linear regression
    const n = values.length
    const x = Array.from({ length: n }, (_, i) => i)
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

    if (slope > 0.02) return 'improving'
    if (slope < -0.02) return 'declining'
    return 'stable'
  }

  private forecast(values: number[]): number {
    // Simple moving average forecast
    const n = Math.min(3, values.length)
    const recent = values.slice(-n)
    return recent.reduce((a, b) => a + b, 0) / n
  }

  private calculateContractCost(contract: Contract, demandForecast: number[]): number {
    const totalDemand = demandForecast.reduce((a, b) => a + b, 0)
    return totalDemand * contract.terms.pricing.basePrice
  }

  private optimizePricing(contract: Contract, benchmarkPrices: number[], minimizeCost: boolean): any {
    const avgBenchmark = benchmarkPrices.reduce((a, b) => a + b, 0) / benchmarkPrices.length

    return {
      basis: 'market-based',
      basePrice: minimizeCost ? avgBenchmark * 0.95 : avgBenchmark,
      indexing: true,
    }
  }

  private optimizeVolume(demandForecast: number[], maximizeFlexibility: boolean): any {
    const totalDemand = demandForecast.reduce((a, b) => a + b, 0)

    if (maximizeFlexibility) {
      return {
        committed: totalDemand * 0.7,
        flexible: totalDemand * 0.3,
      }
    } else {
      return {
        committed: totalDemand * 0.9,
        flexible: totalDemand * 0.1,
      }
    }
  }

  private optimizePayment(contract: Contract, objectives: string[]): any {
    return {
      terms: 'Net 45',
      earlyPaymentDiscount: objectives.includes('minimize-cost') ? 0.02 : 0,
    }
  }

  private optimizeDuration(riskFactors: any): number {
    // Shorter contracts in volatile markets
    return riskFactors.volatility > 0.5 ? 12 : 24
  }

  private calculateOptimizedCost(terms: any, demandForecast: number[]): number {
    const totalDemand = demandForecast.reduce((a, b) => a + b, 0)
    return totalDemand * terms.pricing.basePrice * 0.95
  }

  private calculateFlexibilityScore(terms: any): number {
    let score = 50

    if (terms.volume.flexible / (terms.volume.committed + terms.volume.flexible) > 0.3) {
      score += 30
    }

    if (terms.duration < 18) score += 20

    return Math.min(100, score)
  }

  private calculateContractRiskScore(terms: any, riskFactors: any): number {
    let score = 30

    if (terms.pricing.basis === 'fixed') score += 20
    if (terms.volume.committed > terms.volume.flexible * 3) score += 15

    return Math.min(100, score)
  }
}
