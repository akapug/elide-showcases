/**
 * Risk Management System
 *
 * Comprehensive supply chain risk assessment and mitigation:
 * - Risk identification and scoring
 * - Disruption simulation
 * - Scenario planning
 * - Mitigation strategy optimization
 * - Business continuity planning
 */

// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'

import type {
  RiskAssessment,
  Risk,
  RiskCategory,
  DisruptionScenario,
  DisruptionSimulation,
  SupplyChainState,
  DisruptionImpact,
  Mitigation,
  ResilienceMetrics,
} from '../types'

/**
 * RiskManager - Identify, assess, and mitigate supply chain risks
 *
 * Features:
 * - Multi-dimensional risk assessment
 * - Probability-impact matrix
 * - Monte Carlo simulation
 * - Scenario-based planning
 * - Early warning systems
 * - Mitigation optimization
 */
export class RiskManager {
  /**
   * Assess supply chain risks
   */
  async assessRisks(params: {
    scope: 'end-to-end' | 'supply' | 'demand' | 'operations'
    categories: RiskCategory[]
    data: {
      suppliers?: any[]
      facilities?: any[]
      inventory?: any[]
      demand?: any[]
    }
  }): Promise<RiskAssessment> {
    console.log(`Assessing ${params.scope} supply chain risks...`)

    const { scope, categories, data } = params

    const risks: Risk[] = []

    // Assess each category
    for (const category of categories) {
      const categoryRisks = await this.assessCategory(category, data)
      risks.push(...categoryRisks)
    }

    // Calculate risk scores
    for (const risk of risks) {
      risk.score = risk.probability * risk.impact * 100
      risk.severity = this.determineSeverity(risk.score)
    }

    // Sort by score
    risks.sort((a, b) => b.score - a.score)

    // Categorize risks
    const critical = risks.filter(r => r.severity === 'critical')
    const high = risks.filter(r => r.severity === 'high')
    const medium = risks.filter(r => r.severity === 'medium')
    const low = risks.filter(r => r.severity === 'low')

    // Calculate overall risk score
    const overallScore = risks.reduce((sum, r) => sum + r.score, 0) / risks.length

    // Build risk heatmap
    const heatmap = this.buildRiskHeatmap(risks)

    console.log(`Total risks identified: ${risks.length}`)
    console.log(`Critical: ${critical.length}, High: ${high.length}, Medium: ${medium.length}, Low: ${low.length}`)
    console.log(`Overall risk score: ${overallScore.toFixed(0)}/100`)

    return {
      scope,
      categories,
      risks,
      topRisks: risks.slice(0, 10),
      critical,
      high,
      medium,
      low,
      overallScore,
      heatmap,
    }
  }

  /**
   * Simulate supply chain disruption
   */
  async simulateDisruption(params: {
    scenario: DisruptionScenario
    currentState: SupplyChainState
    mitigations: any
  }): Promise<DisruptionSimulation> {
    console.log(`Simulating ${params.scenario.type} disruption...`)

    const { scenario, currentState, mitigations } = params

    // Run Monte Carlo simulation
    const simulations = 1000
    const impacts: DisruptionImpact[] = []

    for (let i = 0; i < simulations; i++) {
      const impact = await this.simulateSingleScenario(scenario, currentState, mitigations)
      impacts.push(impact)
    }

    // Aggregate results
    const avgImpact = this.aggregateImpacts(impacts)

    // Evaluate mitigation effectiveness
    const baselineImpact = await this.simulateSingleScenario(scenario, currentState, {})
    const mitigationEffectiveness = this.calculateMitigationEffectiveness(
      baselineImpact,
      avgImpact
    )

    // Generate recommendations
    const recommendations = this.generateRecommendations(scenario, avgImpact, mitigations)

    console.log(`Simulation complete:`)
    console.log(`  Lost sales: $${avgImpact.lostSales.toFixed(2)}`)
    console.log(`  Additional costs: $${avgImpact.additionalCosts.toFixed(2)}`)
    console.log(`  Recovery time: ${avgImpact.recoveryTime} days`)
    console.log(`  Mitigation effectiveness: ${(mitigationEffectiveness * 100).toFixed(1)}%`)

    const availableMitigations = this.identifyMitigations(scenario)

    return {
      scenario,
      currentState,
      impact: avgImpact,
      mitigations: availableMitigations,
      mitigationEffectiveness,
      recommendations,
    }
  }

  /**
   * Develop risk mitigation plan
   */
  async developMitigationPlan(params: {
    risks: Risk[]
    budget: number
    priorities: string[]
  }): Promise<{
    plan: Array<{
      risk: Risk
      mitigations: Mitigation[]
      cost: number
      effectiveness: number
    }>
    totalCost: number
    riskReduction: number
  }> {
    console.log('Developing risk mitigation plan...')

    const { risks, budget, priorities } = params

    // Prioritize risks
    const prioritizedRisks = this.prioritizeRisks(risks, priorities)

    // Select mitigations for each risk
    const plan = []
    let totalCost = 0
    let initialRisk = 0
    let residualRisk = 0

    for (const risk of prioritizedRisks) {
      if (totalCost >= budget) break

      initialRisk += risk.score

      // Identify possible mitigations
      const availableMitigations = this.identifyMitigationsForRisk(risk)

      // Select best mitigations within budget
      const selectedMitigations = []
      let riskAfterMitigation = risk.score

      for (const mitigation of availableMitigations) {
        if (totalCost + mitigation.cost <= budget) {
          selectedMitigations.push(mitigation)
          totalCost += mitigation.cost
          riskAfterMitigation *= 1 - mitigation.effectiveness
        }
      }

      residualRisk += riskAfterMitigation

      plan.push({
        risk,
        mitigations: selectedMitigations,
        cost: selectedMitigations.reduce((sum, m) => sum + m.cost, 0),
        effectiveness: 1 - riskAfterMitigation / risk.score,
      })
    }

    const riskReduction = (initialRisk - residualRisk) / initialRisk

    console.log(`Mitigation plan developed:`)
    console.log(`  Risks addressed: ${plan.length}`)
    console.log(`  Total cost: $${totalCost.toFixed(2)} (budget: $${budget})`)
    console.log(`  Risk reduction: ${(riskReduction * 100).toFixed(1)}%`)

    return {
      plan,
      totalCost,
      riskReduction,
    }
  }

  /**
   * Monitor risk indicators (early warning system)
   */
  async monitorRiskIndicators(params: {
    indicators: Array<{
      name: string
      current: number
      threshold: number
      trend: number[]
    }>
  }): Promise<{
    alerts: Array<{
      indicator: string
      severity: 'critical' | 'warning' | 'info'
      message: string
      recommendation: string
    }>
    overallStatus: 'green' | 'yellow' | 'red'
  }> {
    console.log('Monitoring risk indicators...')

    const { indicators } = params
    const alerts = []

    for (const indicator of indicators) {
      // Check threshold
      if (indicator.current >= indicator.threshold) {
        alerts.push({
          indicator: indicator.name,
          severity: indicator.current >= indicator.threshold * 1.2 ? 'critical' : 'warning',
          message: `${indicator.name} exceeds threshold: ${indicator.current} (threshold: ${indicator.threshold})`,
          recommendation: this.getIndicatorRecommendation(indicator.name),
        })
      }

      // Check trend
      const trend = this.analyzeTrend(indicator.trend)
      if (trend === 'increasing' && indicator.current > indicator.threshold * 0.8) {
        alerts.push({
          indicator: indicator.name,
          severity: 'warning',
          message: `${indicator.name} is trending up and approaching threshold`,
          recommendation: 'Monitor closely and prepare contingency plans',
        })
      }
    }

    // Determine overall status
    let overallStatus: 'green' | 'yellow' | 'red' = 'green'
    if (alerts.some(a => a.severity === 'critical')) {
      overallStatus = 'red'
    } else if (alerts.length > 0) {
      overallStatus = 'yellow'
    }

    console.log(`Risk monitoring: ${alerts.length} alerts, status: ${overallStatus}`)

    return {
      alerts,
      overallStatus,
    }
  }

  /**
   * Calculate supply chain resilience metrics
   */
  async calculateResilience(params: {
    network: any
    historicalDisruptions: any[]
    recoveryData: any[]
  }): Promise<ResilienceMetrics> {
    console.log('Calculating resilience metrics...')

    const { network, historicalDisruptions, recoveryData } = params

    // Average recovery time
    const avgRecoveryTime = recoveryData.reduce((sum, r) => sum + r.recoveryTime, 0) / recoveryData.length

    // Network redundancy
    const redundancy = this.calculateNetworkRedundancy(network)

    // Flexibility score
    const flexibility = this.calculateFlexibility(network)

    // Visibility score
    const visibility = 0.7 // Simplified

    // Collaboration score
    const collaboration = 0.65 // Simplified

    // Overall resilience score
    const score = (redundancy * 25 + flexibility * 25 + visibility * 25 + collaboration * 25)

    console.log(`Resilience score: ${score.toFixed(0)}/100`)

    return {
      score,
      avgRecoveryTime,
      redundancy,
      flexibility,
      visibility,
      collaboration,
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async assessCategory(category: RiskCategory, data: any): Promise<Risk[]> {
    const risks: Risk[] = []

    switch (category) {
      case 'supply':
        risks.push(...this.assessSupplyRisks(data.suppliers || []))
        break
      case 'demand':
        risks.push(...this.assessDemandRisks(data.demand || []))
        break
      case 'operational':
        risks.push(...this.assessOperationalRisks(data.facilities || []))
        break
      case 'financial':
        risks.push(...this.assessFinancialRisks(data))
        break
      case 'strategic':
        risks.push(...this.assessStrategicRisks(data))
        break
      case 'external':
        risks.push(...this.assessExternalRisks(data))
        break
    }

    return risks
  }

  private assessSupplyRisks(suppliers: any[]): Risk[] {
    return [
      {
        id: 'RISK-SUP-001',
        description: 'Supplier concentration risk - top 3 suppliers represent 70% of spend',
        category: 'supply',
        probability: 0.6,
        impact: 0.8,
        score: 48,
        severity: 'high',
        mitigation: 'Diversify supplier base, dual-source critical components',
        owner: 'Procurement',
        status: 'monitoring',
        controls: [],
      },
      {
        id: 'RISK-SUP-002',
        description: 'Geographic concentration - 80% of suppliers in single region',
        category: 'supply',
        probability: 0.4,
        impact: 0.7,
        score: 28,
        severity: 'medium',
        mitigation: 'Identify alternative suppliers in different regions',
        owner: 'Supply Planning',
        status: 'identified',
        controls: [],
      },
      {
        id: 'RISK-SUP-003',
        description: 'Lead time variability - coefficient of variation > 0.5',
        category: 'supply',
        probability: 0.7,
        impact: 0.5,
        score: 35,
        severity: 'medium',
        mitigation: 'Increase safety stock, improve supplier performance management',
        owner: 'Procurement',
        status: 'mitigating',
        controls: [],
      },
    ]
  }

  private assessDemandRisks(demand: any[]): Risk[] {
    return [
      {
        id: 'RISK-DEM-001',
        description: 'Demand volatility - high coefficient of variation',
        category: 'demand',
        probability: 0.8,
        impact: 0.6,
        score: 48,
        severity: 'high',
        mitigation: 'Improve demand forecasting, flexible production capacity',
        owner: 'Demand Planning',
        status: 'monitoring',
        controls: [],
      },
      {
        id: 'RISK-DEM-002',
        description: 'Customer concentration - top customer represents 40% of revenue',
        category: 'demand',
        probability: 0.5,
        impact: 0.9,
        score: 45,
        severity: 'high',
        mitigation: 'Diversify customer base, develop new markets',
        owner: 'Sales',
        status: 'identified',
        controls: [],
      },
    ]
  }

  private assessOperationalRisks(facilities: any[]): Risk[] {
    return [
      {
        id: 'RISK-OPS-001',
        description: 'Single facility dependency - only one DC serves critical region',
        category: 'operational',
        probability: 0.3,
        impact: 0.9,
        score: 27,
        severity: 'medium',
        mitigation: 'Establish backup facility or cross-shipping capability',
        owner: 'Operations',
        status: 'identified',
        controls: [],
      },
      {
        id: 'RISK-OPS-002',
        description: 'Capacity constraints - operating at >90% utilization',
        category: 'operational',
        probability: 0.6,
        impact: 0.6,
        score: 36,
        severity: 'medium',
        mitigation: 'Add capacity, improve efficiency, outsource peak demand',
        owner: 'Operations',
        status: 'mitigating',
        controls: [],
      },
    ]
  }

  private assessFinancialRisks(data: any): Risk[] {
    return [
      {
        id: 'RISK-FIN-001',
        description: 'Currency exposure - significant foreign exchange risk',
        category: 'financial',
        probability: 0.5,
        impact: 0.5,
        score: 25,
        severity: 'medium',
        mitigation: 'Implement hedging strategy, natural hedges',
        owner: 'Finance',
        status: 'monitoring',
        controls: [],
      },
    ]
  }

  private assessStrategicRisks(data: any): Risk[] {
    return [
      {
        id: 'RISK-STR-001',
        description: 'Technology disruption - new technologies may obsolete current products',
        category: 'strategic',
        probability: 0.4,
        impact: 0.8,
        score: 32,
        severity: 'medium',
        mitigation: 'Invest in R&D, monitor technology trends',
        owner: 'Strategy',
        status: 'monitoring',
        controls: [],
      },
    ]
  }

  private assessExternalRisks(data: any): Risk[] {
    return [
      {
        id: 'RISK-EXT-001',
        description: 'Regulatory changes - new trade restrictions possible',
        category: 'external',
        probability: 0.6,
        impact: 0.7,
        score: 42,
        severity: 'high',
        mitigation: 'Monitor regulatory changes, diversify supply base',
        owner: 'Legal',
        status: 'monitoring',
        controls: [],
      },
    ]
  }

  private determineSeverity(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 70) return 'critical'
    if (score >= 40) return 'high'
    if (score >= 20) return 'medium'
    return 'low'
  }

  private buildRiskHeatmap(risks: Risk[]): any {
    const matrix = Array(5).fill(0).map(() => Array(5).fill(0))
    const riskPositions = []

    for (const risk of risks) {
      const x = Math.min(4, Math.floor(risk.probability * 5))
      const y = Math.min(4, Math.floor(risk.impact * 5))
      matrix[y][x]++
      riskPositions.push({ x, y, risk })
    }

    return {
      matrix,
      labels: {
        probability: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
        impact: ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'],
      },
      risks: riskPositions,
    }
  }

  private async simulateSingleScenario(
    scenario: DisruptionScenario,
    state: SupplyChainState,
    mitigations: any
  ): Promise<DisruptionImpact> {
    // Monte Carlo simulation of disruption
    const duration = scenario.duration
    const severity = this.severityToNumber(scenario.severity)

    // Calculate impacts
    const dailyRevenue = 1000000 // $1M per day
    const lostSales = dailyRevenue * duration * severity * (mitigations.alternativeSuppliers ? 0.5 : 1)

    const additionalCosts =
      (mitigations.expeditedShipping ? 50000 * duration : 0) +
      (mitigations.alternativeSuppliers ? 30000 : 0)

    const stockoutDays = duration * severity * (mitigations.safetyStock ? 0.3 : 1)

    const customersAffected = Math.floor(100 * severity * (mitigations.alternativeSuppliers ? 0.5 : 1))

    const ordersDelayed = Math.floor(500 * duration * severity)

    const recoveryTime = duration * (mitigations.businessContinuityPlan ? 0.7 : 1)

    return {
      lostSales,
      additionalCosts,
      stockoutDays,
      customersAffected,
      ordersDelayed,
      recoveryTime,
    }
  }

  private aggregateImpacts(impacts: DisruptionImpact[]): DisruptionImpact {
    const avg = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length

    return {
      lostSales: avg(impacts.map(i => i.lostSales)),
      additionalCosts: avg(impacts.map(i => i.additionalCosts)),
      stockoutDays: avg(impacts.map(i => i.stockoutDays)),
      customersAffected: avg(impacts.map(i => i.customersAffected)),
      ordersDelayed: avg(impacts.map(i => i.ordersDelayed)),
      recoveryTime: avg(impacts.map(i => i.recoveryTime)),
    }
  }

  private calculateMitigationEffectiveness(
    baseline: DisruptionImpact,
    mitigated: DisruptionImpact
  ): number {
    const baselineTotal = baseline.lostSales + baseline.additionalCosts
    const mitigatedTotal = mitigated.lostSales + mitigated.additionalCosts

    if (baselineTotal === 0) return 0
    return (baselineTotal - mitigatedTotal) / baselineTotal
  }

  private generateRecommendations(
    scenario: DisruptionScenario,
    impact: DisruptionImpact,
    mitigations: any
  ): string[] {
    const recommendations = []

    if (impact.lostSales > 1000000) {
      recommendations.push('High revenue impact - prioritize business continuity planning')
    }

    if (impact.stockoutDays > 20) {
      recommendations.push('Long stockout period - increase safety stock levels')
    }

    if (!mitigations.alternativeSuppliers) {
      recommendations.push('Qualify alternative suppliers to reduce dependency risk')
    }

    if (impact.recoveryTime > 30) {
      recommendations.push('Long recovery time - develop detailed recovery procedures')
    }

    return recommendations
  }

  private identifyMitigations(scenario: DisruptionScenario): Mitigation[] {
    return [
      {
        action: 'Qualify alternative suppliers',
        cost: 50000,
        effectiveness: 0.6,
        implementationTime: 60,
        description: 'Identify, qualify, and establish relationships with backup suppliers',
      },
      {
        action: 'Increase safety stock',
        cost: 200000,
        effectiveness: 0.4,
        implementationTime: 7,
        description: 'Increase inventory buffer to cover disruption period',
      },
      {
        action: 'Expedited shipping capability',
        cost: 30000,
        effectiveness: 0.3,
        implementationTime: 1,
        description: 'Establish expedited shipping options for critical items',
      },
      {
        action: 'Business continuity plan',
        cost: 100000,
        effectiveness: 0.5,
        implementationTime: 90,
        description: 'Develop comprehensive business continuity and disaster recovery plan',
      },
    ]
  }

  private prioritizeRisks(risks: Risk[], priorities: string[]): Risk[] {
    return risks.sort((a, b) => b.score - a.score)
  }

  private identifyMitigationsForRisk(risk: Risk): Mitigation[] {
    return [
      {
        action: risk.mitigation,
        cost: 50000,
        effectiveness: 0.7,
        implementationTime: 30,
        description: `Mitigation for ${risk.description}`,
      },
    ]
  }

  private getIndicatorRecommendation(indicatorName: string): string {
    const recommendations: Record<string, string> = {
      'supplier-lead-time': 'Expedite orders, engage with supplier on root cause',
      'inventory-level': 'Accelerate replenishment, review safety stock',
      'quality-defects': 'Halt shipments, conduct quality audit',
    }

    return recommendations[indicatorName] || 'Investigate and take corrective action'
  }

  private analyzeTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable'

    const recent = values.slice(-3)
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length
    const previous = values.slice(-6, -3)
    const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length

    if (avg > prevAvg * 1.1) return 'increasing'
    if (avg < prevAvg * 0.9) return 'decreasing'
    return 'stable'
  }

  private calculateNetworkRedundancy(network: any): number {
    // Simplified redundancy calculation
    return 0.65
  }

  private calculateFlexibility(network: any): number {
    // Simplified flexibility score
    return 0.7
  }

  private severityToNumber(severity: string): number {
    const map: Record<string, number> = {
      low: 0.2,
      medium: 0.5,
      high: 0.8,
      critical: 1.0,
    }
    return map[severity] || 0.5
  }
}
