/**
 * Compliance Engine - Regulatory compliance and audit trail
 *
 * Pre-trade compliance, best execution monitoring, audit logging,
 * wash sale tracking, and regulatory reporting.
 */

import type {
  Order,
  Fill,
  Portfolio,
  Position,
  ComplianceRule,
  ComplianceCheck,
  ComplianceViolation,
  ComplianceWarning,
  AuditEntry,
  WashSaleEvent
} from '../types.ts'

/**
 * Compliance Engine
 */
export class ComplianceEngine {
  private rules: Set<ComplianceRule>
  private jurisdiction: string
  private auditLog: AuditEntry[] = []
  private prohibitedSecurities: Set<string> = new Set()
  private approvedSecurities?: Set<string>
  private washSaleEvents: WashSaleEvent[] = []
  private entryIdCounter = 0

  constructor(config: {
    rules: ComplianceRule[]
    jurisdiction: string
    prohibitedSecurities?: string[]
    approvedSecurities?: string[]
  }) {
    this.rules = new Set(config.rules)
    this.jurisdiction = config.jurisdiction

    if (config.prohibitedSecurities) {
      this.prohibitedSecurities = new Set(config.prohibitedSecurities)
    }

    if (config.approvedSecurities) {
      this.approvedSecurities = new Set(config.approvedSecurities)
    }
  }

  /**
   * Validate order pre-trade
   */
  async validateOrder(order: Order, portfolio: Portfolio): Promise<ComplianceCheck> {
    const violations: ComplianceViolation[] = []
    const warnings: ComplianceWarning[] = []

    // Check prohibited securities
    if (this.rules.has('prohibited_securities')) {
      const violation = this.checkProhibitedSecurity(order)
      if (violation) violations.push(violation)
    }

    // Check approved securities (if whitelist exists)
    if (this.approvedSecurities && this.rules.has('prohibited_securities')) {
      const violation = this.checkApprovedSecurity(order)
      if (violation) violations.push(violation)
    }

    // Check position limits
    if (this.rules.has('position_limits')) {
      const violation = this.checkPositionLimits(order, portfolio)
      if (violation) violations.push(violation)
    }

    // Check concentration limits
    if (this.rules.has('concentration_limits')) {
      const violation = this.checkConcentration(order, portfolio)
      if (violation) violations.push(violation)
    }

    // Check pattern day trading
    if (this.rules.has('pattern_day_trading')) {
      const warning = this.checkPatternDayTrading(order, portfolio)
      if (warning) warnings.push(warning)
    }

    // Check wash sale
    if (this.rules.has('wash_sale')) {
      const warning = this.checkWashSale(order, portfolio)
      if (warning) warnings.push(warning)
    }

    // Check market manipulation
    if (this.rules.has('market_manipulation')) {
      const violation = this.checkMarketManipulation(order)
      if (violation) violations.push(violation)
    }

    const approved = violations.filter(v => v.action === 'block').length === 0

    const check: ComplianceCheck = {
      rule: 'pre_trade_validation',
      approved,
      violations,
      warnings,
      timestamp: Date.now()
    }

    // Log compliance check
    await this.logComplianceCheck(order, check)

    return check
  }

  /**
   * Check prohibited security
   */
  private checkProhibitedSecurity(order: Order): ComplianceViolation | null {
    if (this.prohibitedSecurities.has(order.symbol)) {
      return {
        rule: 'prohibited_securities',
        severity: 'critical',
        message: `${order.symbol} is on the prohibited securities list`,
        details: { symbol: order.symbol },
        action: 'block'
      }
    }
    return null
  }

  /**
   * Check approved security (whitelist)
   */
  private checkApprovedSecurity(order: Order): ComplianceViolation | null {
    if (this.approvedSecurities && !this.approvedSecurities.has(order.symbol)) {
      return {
        rule: 'prohibited_securities',
        severity: 'critical',
        message: `${order.symbol} is not on the approved securities list`,
        details: { symbol: order.symbol },
        action: 'block'
      }
    }
    return null
  }

  /**
   * Check position limits
   */
  private checkPositionLimits(order: Order, portfolio: Portfolio): ComplianceViolation | null {
    const position = portfolio.positions.get(order.symbol)
    const currentQuantity = position?.quantity || 0

    let newQuantity = currentQuantity
    if (order.side === 'BUY') {
      newQuantity += order.quantity
    } else {
      newQuantity -= order.quantity
    }

    const maxPositionSize = portfolio.totalValue * 0.2 // 20% limit
    const estimatedValue = newQuantity * (order.price || 100)

    if (estimatedValue > maxPositionSize) {
      return {
        rule: 'position_limits',
        severity: 'major',
        message: 'Position would exceed maximum position size limit',
        details: {
          symbol: order.symbol,
          currentValue: position?.marketValue || 0,
          newValue: estimatedValue,
          limit: maxPositionSize
        },
        action: 'block'
      }
    }

    return null
  }

  /**
   * Check concentration limits
   */
  private checkConcentration(order: Order, portfolio: Portfolio): ComplianceViolation | null {
    const position = portfolio.positions.get(order.symbol)
    const currentValue = position?.marketValue || 0
    const estimatedValue = order.quantity * (order.price || 100)
    const newValue = order.side === 'BUY'
      ? currentValue + estimatedValue
      : currentValue - estimatedValue

    const concentration = newValue / portfolio.totalValue

    if (concentration > 0.25) { // 25% max concentration
      return {
        rule: 'concentration_limits',
        severity: 'major',
        message: 'Order would create excessive concentration',
        details: {
          symbol: order.symbol,
          concentration: concentration * 100,
          limit: 25
        },
        action: 'warn'
      }
    }

    return null
  }

  /**
   * Check pattern day trading rules
   */
  private checkPatternDayTrading(order: Order, portfolio: Portfolio): ComplianceWarning | null {
    // Count day trades in the last 5 days
    const dayTrades = this.countRecentDayTrades(order.symbol)

    if (dayTrades >= 3 && portfolio.totalValue < 25000) {
      return {
        rule: 'pattern_day_trading',
        message: 'This would be your 4th day trade in 5 days. Pattern day trading rules may apply.',
        recommendation: 'Ensure account value is above $25,000 or reduce day trading frequency'
      }
    }

    return null
  }

  /**
   * Check wash sale
   */
  private checkWashSale(order: Order, portfolio: Portfolio): ComplianceWarning | null {
    if (order.side !== 'BUY') return null

    // Check if we sold this security at a loss in the last 30 days
    const recentSells = this.auditLog
      .filter(e =>
        e.fill &&
        e.fill.symbol === order.symbol &&
        e.fill.side === 'SELL' &&
        Date.now() - e.timestamp < 30 * 24 * 60 * 60 * 1000
      )

    for (const sell of recentSells) {
      const position = portfolio.positions.get(order.symbol)
      if (position && position.realizedPnl < 0) {
        return {
          rule: 'wash_sale',
          message: `Potential wash sale: buying ${order.symbol} within 30 days of selling at a loss`,
          recommendation: 'Loss may be disallowed for tax purposes'
        }
      }
    }

    return null
  }

  /**
   * Check for market manipulation patterns
   */
  private checkMarketManipulation(order: Order): ComplianceViolation | null {
    // Check for suspicious patterns
    const recentOrders = this.auditLog
      .filter(e =>
        e.order &&
        e.order.symbol === order.symbol &&
        Date.now() - e.timestamp < 60000 // Last minute
      )

    // Excessive order cancellations (layering/spoofing)
    const cancellations = recentOrders.filter(e =>
      e.order?.status === 'CANCELED'
    ).length

    if (cancellations > 10) {
      return {
        rule: 'market_manipulation',
        severity: 'critical',
        message: 'Excessive order cancellations detected - possible layering/spoofing',
        details: {
          symbol: order.symbol,
          cancellations,
          timeWindow: '1 minute'
        },
        action: 'block'
      }
    }

    // Rapid order placement and cancellation
    if (recentOrders.length > 20) {
      return {
        rule: 'market_manipulation',
        severity: 'major',
        message: 'Excessive order activity detected',
        details: {
          symbol: order.symbol,
          orderCount: recentOrders.length,
          timeWindow: '1 minute'
        },
        action: 'warn'
      }
    }

    return null
  }

  /**
   * Log trade for audit
   */
  async logTrade(
    fill: Fill,
    metadata: {
      strategy?: string
      rationale?: string
      userId?: string
    }
  ): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateEntryId(),
      timestamp: fill.timestamp,
      eventType: 'fill',
      userId: metadata.userId || 'system',
      accountId: 'default',
      symbol: fill.symbol,
      fill,
      strategyName: metadata.strategy,
      rationale: metadata.rationale,
      metadata
    }

    this.auditLog.push(entry)

    // Check for wash sale events
    await this.detectWashSale(fill)
  }

  /**
   * Log order for audit
   */
  async logOrder(order: Order, userId: string = 'system'): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateEntryId(),
      timestamp: order.createdAt,
      eventType: 'order',
      userId,
      accountId: 'default',
      symbol: order.symbol,
      order
    }

    this.auditLog.push(entry)
  }

  /**
   * Log compliance check
   */
  private async logComplianceCheck(order: Order, check: ComplianceCheck): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateEntryId(),
      timestamp: Date.now(),
      eventType: 'compliance_check',
      userId: 'system',
      accountId: 'default',
      symbol: order.symbol,
      order,
      complianceCheck: check
    }

    this.auditLog.push(entry)
  }

  /**
   * Detect wash sale
   */
  private async detectWashSale(fill: Fill): Promise<void> {
    if (fill.side !== 'SELL') return

    // Look for buys within 30 days before or after
    const washSaleWindow = 30 * 24 * 60 * 60 * 1000
    const startWindow = fill.timestamp - washSaleWindow
    const endWindow = fill.timestamp + washSaleWindow

    const relatedBuys = this.auditLog
      .filter(e =>
        e.fill &&
        e.fill.symbol === fill.symbol &&
        e.fill.side === 'BUY' &&
        e.timestamp >= startWindow &&
        e.timestamp <= endWindow
      )

    for (const buyEntry of relatedBuys) {
      if (!buyEntry.fill) continue

      // Calculate if this was a loss
      const loss = (fill.price - buyEntry.fill.price) * fill.quantity

      if (loss < 0) {
        const washSale: WashSaleEvent = {
          symbol: fill.symbol,
          sellDate: fill.timestamp,
          sellQuantity: fill.quantity,
          sellPrice: fill.price,
          loss: Math.abs(loss),
          buyDate: buyEntry.fill.timestamp,
          buyQuantity: buyEntry.fill.quantity,
          buyPrice: buyEntry.fill.price,
          disallowedLoss: Math.abs(loss) // Simplified
        }

        this.washSaleEvents.push(washSale)
      }
    }
  }

  /**
   * Get audit trail
   */
  getAuditTrail(config?: {
    startDate?: number
    endDate?: number
    events?: Array<'orders' | 'fills' | 'cancels' | 'violations'>
    symbol?: string
  }): AuditEntry[] {
    let filtered = this.auditLog

    if (config) {
      if (config.startDate) {
        filtered = filtered.filter(e => e.timestamp >= config.startDate!)
      }
      if (config.endDate) {
        filtered = filtered.filter(e => e.timestamp <= config.endDate!)
      }
      if (config.symbol) {
        filtered = filtered.filter(e => e.symbol === config.symbol)
      }
      if (config.events) {
        filtered = filtered.filter(e => {
          if (config.events!.includes('orders') && e.eventType === 'order') return true
          if (config.events!.includes('fills') && e.eventType === 'fill') return true
          if (config.events!.includes('violations') && e.complianceCheck) return true
          return false
        })
      }
    }

    return filtered
  }

  /**
   * Get wash sale events
   */
  getWashSales(symbol?: string): WashSaleEvent[] {
    if (symbol) {
      return this.washSaleEvents.filter(w => w.symbol === symbol)
    }
    return this.washSaleEvents
  }

  /**
   * Export regulatory report
   */
  async exportReport(config: {
    format: 'MiFID_II' | 'Reg_NMS' | 'CSV' | 'JSON'
    period: string
    destination: string
  }): Promise<void> {
    const report = this.generateReport(config.format, config.period)

    // In production, write to file or send to regulatory authority
    console.log(`Exporting ${config.format} report to ${config.destination}`)
    console.log(`Report contains ${this.auditLog.length} entries`)
  }

  /**
   * Generate regulatory report
   */
  private generateReport(format: string, period: string): any {
    const report = {
      format,
      period,
      generatedAt: new Date().toISOString(),
      totalTrades: this.auditLog.filter(e => e.eventType === 'fill').length,
      totalOrders: this.auditLog.filter(e => e.eventType === 'order').length,
      complianceViolations: this.auditLog.filter(e =>
        e.complianceCheck && e.complianceCheck.violations.length > 0
      ).length,
      washSales: this.washSaleEvents.length,
      entries: this.auditLog
    }

    if (format === 'MiFID_II') {
      return this.formatMiFIDII(report)
    } else if (format === 'Reg_NMS') {
      return this.formatRegNMS(report)
    }

    return report
  }

  /**
   * Format for MiFID II
   */
  private formatMiFIDII(report: any): any {
    return {
      ...report,
      regulatory_framework: 'MiFID II',
      best_execution_summary: this.generateBestExecutionSummary(),
      transaction_reporting: this.formatTransactionReporting()
    }
  }

  /**
   * Format for Reg NMS
   */
  private formatRegNMS(report: any): any {
    return {
      ...report,
      regulatory_framework: 'Regulation NMS',
      order_protection_rule: true,
      access_rule_compliance: true
    }
  }

  /**
   * Generate best execution summary
   */
  private generateBestExecutionSummary(): any {
    const fills = this.auditLog.filter(e => e.fill)

    return {
      total_trades: fills.length,
      venues_used: new Set(fills.map(e => e.fill!.venue)).size,
      avg_fill_quality: 0.98, // Mock
      price_improvement_rate: 0.45 // Mock
    }
  }

  /**
   * Format transaction reporting
   */
  private formatTransactionReporting(): any[] {
    return this.auditLog
      .filter(e => e.fill)
      .map(e => ({
        transaction_id: e.id,
        timestamp: new Date(e.timestamp).toISOString(),
        symbol: e.symbol,
        quantity: e.fill!.quantity,
        price: e.fill!.price,
        venue: e.fill!.venue,
        side: e.fill!.side
      }))
  }

  /**
   * Count recent day trades
   */
  private countRecentDayTrades(symbol: string): number {
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000
    const trades = this.auditLog.filter(e =>
      e.fill &&
      e.fill.symbol === symbol &&
      e.timestamp >= fiveDaysAgo
    )

    // Count round trips (buy and sell on same day)
    const dayTrades = new Map<string, number>()

    for (const trade of trades) {
      const date = new Date(trade.timestamp).toDateString()
      dayTrades.set(date, (dayTrades.get(date) || 0) + 1)
    }

    return Array.from(dayTrades.values()).filter(count => count >= 2).length
  }

  /**
   * Add prohibited security
   */
  addProhibitedSecurity(symbol: string): void {
    this.prohibitedSecurities.add(symbol)
  }

  /**
   * Remove prohibited security
   */
  removeProhibitedSecurity(symbol: string): void {
    this.prohibitedSecurities.delete(symbol)
  }

  /**
   * Get prohibited securities
   */
  getProhibitedSecurities(): string[] {
    return Array.from(this.prohibitedSecurities)
  }

  /**
   * Generate audit entry ID
   */
  private generateEntryId(): string {
    return `audit-${++this.entryIdCounter}-${Date.now()}`
  }

  /**
   * Get compliance statistics
   */
  getStatistics(): {
    totalAuditEntries: number
    totalOrders: number
    totalFills: number
    complianceChecks: number
    violations: number
    washSales: number
  } {
    return {
      totalAuditEntries: this.auditLog.length,
      totalOrders: this.auditLog.filter(e => e.eventType === 'order').length,
      totalFills: this.auditLog.filter(e => e.eventType === 'fill').length,
      complianceChecks: this.auditLog.filter(e => e.eventType === 'compliance_check').length,
      violations: this.auditLog.filter(e =>
        e.complianceCheck && e.complianceCheck.violations.length > 0
      ).length,
      washSales: this.washSaleEvents.length
    }
  }
}
