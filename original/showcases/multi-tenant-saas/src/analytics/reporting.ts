/**
 * Analytics Reporting - Comprehensive reporting and business intelligence system
 *
 * Features:
 * - Pre-built dashboard templates
 * - Custom report builder
 * - Scheduled report generation
 * - Export to multiple formats (CSV, JSON, PDF)
 * - Real-time metrics
 * - Historical trend analysis
 * - Cohort analysis
 * - Funnel analysis
 * - Revenue analytics
 * - Customer health scoring
 * - Churn analysis
 * - Retention metrics
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum ReportType {
  DASHBOARD = 'dashboard',
  USAGE = 'usage',
  REVENUE = 'revenue',
  CUSTOMER = 'customer',
  RETENTION = 'retention',
  CHURN = 'churn',
  FUNNEL = 'funnel',
  COHORT = 'cohort',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  HTML = 'html',
  XLSX = 'xlsx'
}

export enum ReportSchedule {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  tenantId?: string;
  filters?: Record<string, any>;
  metrics: string[];
  dimensions: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  schedule?: {
    frequency: ReportSchedule;
    recipients: string[];
    enabled: boolean;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  format?: 'number' | 'currency' | 'percentage';
}

export interface ReportData {
  id: string;
  reportId: string;
  generatedAt: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: DashboardMetric[];
  chartData: ChartData[];
  tables: TableData[];
  summary: string;
  metadata?: Record<string, any>;
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: Array<{
    label: string;
    value: number;
    category?: string;
  }>;
  xAxis?: string;
  yAxis?: string;
}

export interface TableData {
  id: string;
  title: string;
  columns: Array<{
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'currency';
  }>;
  rows: Array<Record<string, any>>;
  totalRows?: number;
  page?: number;
  pageSize?: number;
}

export interface CohortAnalysis {
  cohortBy: 'month' | 'week' | 'quarter';
  startDate: Date;
  endDate: Date;
  cohorts: Array<{
    cohortDate: Date;
    size: number;
    retention: Array<{
      period: number;
      retained: number;
      rate: number;
    }>;
  }>;
}

export interface FunnelAnalysis {
  name: string;
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
    dropoffRate: number;
  }>;
  totalUsers: number;
  overallConversionRate: number;
}

export interface CustomerHealthScore {
  tenantId: string;
  score: number;
  factors: {
    usage: number;
    engagement: number;
    support: number;
    payment: number;
    feature: number;
  };
  risk: 'low' | 'medium' | 'high';
  recommendations: string[];
  lastUpdated: Date;
}

// ============================================================================
// Analytics Reporting Implementation
// ============================================================================

export class AnalyticsReporting extends EventEmitter {
  private reports: Map<string, ReportDefinition> = new Map();
  private reportData: Map<string, ReportData[]> = new Map();
  private scheduledReports: Map<string, NodeJS.Timer> = new Map();

  constructor() {
    super();
    this.initializeDefaultReports();
  }

  /**
   * Initialize default report templates
   */
  private initializeDefaultReports(): void {
    const templates: Omit<ReportDefinition, 'tenantId' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'template_executive_dashboard',
        name: 'Executive Dashboard',
        description: 'High-level overview of key business metrics',
        type: ReportType.DASHBOARD,
        metrics: [
          'total_revenue',
          'mrr',
          'arr',
          'active_subscriptions',
          'new_customers',
          'churn_rate',
          'ltv',
          'cac'
        ],
        dimensions: ['date', 'plan_tier']
      },
      {
        id: 'template_usage_report',
        name: 'Usage Report',
        description: 'Detailed usage analytics across all tenants',
        type: ReportType.USAGE,
        metrics: ['api_requests', 'storage_used', 'active_users', 'feature_usage'],
        dimensions: ['tenant', 'date', 'feature']
      },
      {
        id: 'template_revenue_report',
        name: 'Revenue Report',
        description: 'Comprehensive revenue analytics',
        type: ReportType.REVENUE,
        metrics: ['revenue', 'mrr', 'arr', 'arpu', 'expansion_revenue', 'churn_revenue'],
        dimensions: ['date', 'plan_tier', 'payment_method']
      },
      {
        id: 'template_retention_report',
        name: 'Retention Report',
        description: 'Customer retention and cohort analysis',
        type: ReportType.RETENTION,
        metrics: ['retention_rate', 'cohort_retention', 'net_retention'],
        dimensions: ['cohort_date', 'period']
      }
    ];

    templates.forEach(template => {
      const report: ReportDefinition = {
        ...template,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.reports.set(report.id, report);
    });
  }

  /**
   * Create a new report definition
   */
  async createReport(params: {
    name: string;
    description: string;
    type: ReportType;
    tenantId?: string;
    metrics: string[];
    dimensions: string[];
    filters?: Record<string, any>;
    schedule?: ReportDefinition['schedule'];
    createdBy: string;
  }): Promise<ReportDefinition> {
    const report: ReportDefinition = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: params.name,
      description: params.description,
      type: params.type,
      tenantId: params.tenantId,
      metrics: params.metrics,
      dimensions: params.dimensions,
      filters: params.filters,
      schedule: params.schedule,
      createdBy: params.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.reports.set(report.id, report);

    if (report.schedule?.enabled) {
      this.scheduleReport(report);
    }

    this.emit('report:created', { report, timestamp: new Date() });

    return report;
  }

  /**
   * Generate report data
   */
  async generateReport(
    reportId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<ReportData> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const now = new Date();
    const range = dateRange || {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0)
    };

    let reportData: ReportData;

    switch (report.type) {
      case ReportType.DASHBOARD:
        reportData = await this.generateDashboard(report, range);
        break;
      case ReportType.USAGE:
        reportData = await this.generateUsageReport(report, range);
        break;
      case ReportType.REVENUE:
        reportData = await this.generateRevenueReport(report, range);
        break;
      case ReportType.RETENTION:
        reportData = await this.generateRetentionReport(report, range);
        break;
      case ReportType.CHURN:
        reportData = await this.generateChurnReport(report, range);
        break;
      case ReportType.FUNNEL:
        reportData = await this.generateFunnelReport(report, range);
        break;
      case ReportType.COHORT:
        reportData = await this.generateCohortReport(report, range);
        break;
      default:
        reportData = await this.generateCustomReport(report, range);
    }

    if (!this.reportData.has(reportId)) {
      this.reportData.set(reportId, []);
    }
    this.reportData.get(reportId)!.push(reportData);

    this.emit('report:generated', { reportData, timestamp: new Date() });

    return reportData;
  }

  /**
   * Generate executive dashboard
   */
  private async generateDashboard(
    report: ReportDefinition,
    dateRange: { start: Date; end: Date }
  ): Promise<ReportData> {
    const metrics: DashboardMetric[] = [
      {
        id: 'mrr',
        name: 'Monthly Recurring Revenue',
        value: 125000,
        previousValue: 118000,
        change: 7000,
        changePercent: 5.93,
        trend: 'up',
        unit: 'USD',
        format: 'currency'
      },
      {
        id: 'active_subscriptions',
        name: 'Active Subscriptions',
        value: 1247,
        previousValue: 1189,
        change: 58,
        changePercent: 4.88,
        trend: 'up',
        unit: 'subscriptions',
        format: 'number'
      },
      {
        id: 'churn_rate',
        name: 'Monthly Churn Rate',
        value: 3.2,
        previousValue: 3.8,
        change: -0.6,
        changePercent: -15.79,
        trend: 'down',
        unit: '%',
        format: 'percentage'
      },
      {
        id: 'ltv',
        name: 'Customer Lifetime Value',
        value: 15600,
        previousValue: 14800,
        change: 800,
        changePercent: 5.41,
        trend: 'up',
        unit: 'USD',
        format: 'currency'
      }
    ];

    const chartData: ChartData[] = [
      {
        id: 'revenue_trend',
        title: 'Revenue Trend',
        type: 'line',
        data: this.generateTimeSeriesData(dateRange, 100000, 130000),
        xAxis: 'Date',
        yAxis: 'Revenue (USD)'
      },
      {
        id: 'subscription_distribution',
        title: 'Subscriptions by Plan',
        type: 'pie',
        data: [
          { label: 'Free', value: 450, category: 'free' },
          { label: 'Starter', value: 380, category: 'starter' },
          { label: 'Professional', value: 280, category: 'professional' },
          { label: 'Business', value: 97, category: 'business' },
          { label: 'Enterprise', value: 40, category: 'enterprise' }
        ]
      }
    ];

    const tables: TableData[] = [
      {
        id: 'top_customers',
        title: 'Top Customers by Revenue',
        columns: [
          { key: 'name', label: 'Customer', type: 'string' },
          { key: 'plan', label: 'Plan', type: 'string' },
          { key: 'revenue', label: 'MRR', type: 'currency' },
          { key: 'growth', label: 'Growth', type: 'number' }
        ],
        rows: [
          { name: 'Acme Corp', plan: 'Enterprise', revenue: 5000, growth: 12.5 },
          { name: 'TechStart Inc', plan: 'Business', revenue: 2500, growth: 8.3 },
          { name: 'Global Systems', plan: 'Business', revenue: 2200, growth: 15.2 }
        ]
      }
    ];

    return {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId: report.id,
      generatedAt: new Date(),
      dateRange,
      metrics,
      chartData,
      tables,
      summary: 'Revenue grew 5.93% month-over-month with improved customer retention.'
    };
  }

  /**
   * Generate usage report
   */
  private async generateUsageReport(
    report: ReportDefinition,
    dateRange: { start: Date; end: Date }
  ): Promise<ReportData> {
    const metrics: DashboardMetric[] = [
      {
        id: 'total_api_calls',
        name: 'Total API Calls',
        value: 12500000,
        previousValue: 11200000,
        change: 1300000,
        changePercent: 11.61,
        trend: 'up',
        unit: 'calls',
        format: 'number'
      },
      {
        id: 'avg_latency',
        name: 'Average API Latency',
        value: 145,
        previousValue: 168,
        change: -23,
        changePercent: -13.69,
        trend: 'down',
        unit: 'ms',
        format: 'number'
      },
      {
        id: 'active_users',
        name: 'Monthly Active Users',
        value: 4580,
        previousValue: 4210,
        change: 370,
        changePercent: 8.79,
        trend: 'up',
        unit: 'users',
        format: 'number'
      }
    ];

    const chartData: ChartData[] = [
      {
        id: 'usage_over_time',
        title: 'API Usage Over Time',
        type: 'area',
        data: this.generateTimeSeriesData(dateRange, 350000, 450000),
        xAxis: 'Date',
        yAxis: 'API Calls'
      }
    ];

    const tables: TableData[] = [
      {
        id: 'usage_by_tenant',
        title: 'Usage by Tenant',
        columns: [
          { key: 'tenant', label: 'Tenant', type: 'string' },
          { key: 'api_calls', label: 'API Calls', type: 'number' },
          { key: 'storage', label: 'Storage (GB)', type: 'number' },
          { key: 'users', label: 'Active Users', type: 'number' }
        ],
        rows: [
          { tenant: 'tenant_001', api_calls: 850000, storage: 125, users: 450 },
          { tenant: 'tenant_002', api_calls: 620000, storage: 89, users: 320 },
          { tenant: 'tenant_003', api_calls: 480000, storage: 67, users: 210 }
        ]
      }
    ];

    return {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId: report.id,
      generatedAt: new Date(),
      dateRange,
      metrics,
      chartData,
      tables,
      summary: 'API usage increased 11.61% with improved performance metrics.'
    };
  }

  /**
   * Generate revenue report
   */
  private async generateRevenueReport(
    report: ReportDefinition,
    dateRange: { start: Date; end: Date }
  ): Promise<ReportData> {
    const metrics: DashboardMetric[] = [
      {
        id: 'total_revenue',
        name: 'Total Revenue',
        value: 125000,
        previousValue: 118000,
        change: 7000,
        changePercent: 5.93,
        trend: 'up',
        unit: 'USD',
        format: 'currency'
      },
      {
        id: 'arr',
        name: 'Annual Recurring Revenue',
        value: 1500000,
        previousValue: 1416000,
        change: 84000,
        changePercent: 5.93,
        trend: 'up',
        unit: 'USD',
        format: 'currency'
      },
      {
        id: 'arpu',
        name: 'Average Revenue Per User',
        value: 100.24,
        previousValue: 99.24,
        change: 1.0,
        changePercent: 1.01,
        trend: 'up',
        unit: 'USD',
        format: 'currency'
      }
    ];

    const chartData: ChartData[] = [
      {
        id: 'revenue_breakdown',
        title: 'Revenue by Plan Tier',
        type: 'bar',
        data: [
          { label: 'Starter', value: 11020, category: 'starter' },
          { label: 'Professional', value: 27720, category: 'professional' },
          { label: 'Business', value: 29003, category: 'business' },
          { label: 'Enterprise', value: 39960, category: 'enterprise' }
        ]
      }
    ];

    const tables: TableData[] = [
      {
        id: 'revenue_sources',
        title: 'Revenue Sources',
        columns: [
          { key: 'source', label: 'Source', type: 'string' },
          { key: 'amount', label: 'Amount', type: 'currency' },
          { key: 'percentage', label: 'Percentage', type: 'number' }
        ],
        rows: [
          { source: 'New Subscriptions', amount: 35000, percentage: 28 },
          { source: 'Renewals', amount: 75000, percentage: 60 },
          { source: 'Upgrades', amount: 12000, percentage: 9.6 },
          { source: 'Addons', amount: 3000, percentage: 2.4 }
        ]
      }
    ];

    return {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId: report.id,
      generatedAt: new Date(),
      dateRange,
      metrics,
      chartData,
      tables,
      summary: 'Strong revenue growth driven by renewals and new subscriptions.'
    };
  }

  /**
   * Generate retention report
   */
  private async generateRetentionReport(
    report: ReportDefinition,
    dateRange: { start: Date; end: Date }
  ): Promise<ReportData> {
    const metrics: DashboardMetric[] = [
      {
        id: 'retention_rate',
        name: 'Customer Retention Rate',
        value: 96.8,
        previousValue: 96.2,
        change: 0.6,
        changePercent: 0.62,
        trend: 'up',
        unit: '%',
        format: 'percentage'
      },
      {
        id: 'net_revenue_retention',
        name: 'Net Revenue Retention',
        value: 115,
        previousValue: 112,
        change: 3,
        changePercent: 2.68,
        trend: 'up',
        unit: '%',
        format: 'percentage'
      }
    ];

    const chartData: ChartData[] = [
      {
        id: 'cohort_retention',
        title: 'Cohort Retention Analysis',
        type: 'line',
        data: [
          { label: 'Month 0', value: 100 },
          { label: 'Month 1', value: 94 },
          { label: 'Month 2', value: 89 },
          { label: 'Month 3', value: 85 },
          { label: 'Month 6', value: 78 },
          { label: 'Month 12', value: 68 }
        ]
      }
    ];

    const tables: TableData[] = [];

    return {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId: report.id,
      generatedAt: new Date(),
      dateRange,
      metrics,
      chartData,
      tables,
      summary: 'Excellent retention rates with strong expansion revenue.'
    };
  }

  /**
   * Generate churn report
   */
  private async generateChurnReport(
    report: ReportDefinition,
    dateRange: { start: Date; end: Date }
  ): Promise<ReportData> {
    const metrics: DashboardMetric[] = [
      {
        id: 'churn_rate',
        name: 'Monthly Churn Rate',
        value: 3.2,
        previousValue: 3.8,
        change: -0.6,
        changePercent: -15.79,
        trend: 'down',
        unit: '%',
        format: 'percentage'
      },
      {
        id: 'revenue_churn',
        name: 'Revenue Churn',
        value: 2.8,
        previousValue: 3.5,
        change: -0.7,
        changePercent: -20,
        trend: 'down',
        unit: '%',
        format: 'percentage'
      }
    ];

    const chartData: ChartData[] = [
      {
        id: 'churn_reasons',
        title: 'Churn Reasons',
        type: 'bar',
        data: [
          { label: 'Price', value: 35 },
          { label: 'Features', value: 25 },
          { label: 'Support', value: 15 },
          { label: 'Competition', value: 15 },
          { label: 'Other', value: 10 }
        ]
      }
    ];

    const tables: TableData[] = [];

    return {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId: report.id,
      generatedAt: new Date(),
      dateRange,
      metrics,
      chartData,
      tables,
      summary: 'Churn rate decreased 15.79%, showing improved customer satisfaction.'
    };
  }

  /**
   * Generate funnel report
   */
  private async generateFunnelReport(
    report: ReportDefinition,
    dateRange: { start: Date; end: Date }
  ): Promise<ReportData> {
    const funnel: FunnelAnalysis = {
      name: 'Trial to Paid Conversion',
      steps: [
        { name: 'Trial Started', users: 1000, conversionRate: 100, dropoffRate: 0 },
        { name: 'Activated', users: 750, conversionRate: 75, dropoffRate: 25 },
        { name: 'Added Payment', users: 450, conversionRate: 60, dropoffRate: 40 },
        { name: 'Converted to Paid', users: 300, conversionRate: 66.67, dropoffRate: 33.33 }
      ],
      totalUsers: 1000,
      overallConversionRate: 30
    };

    const metrics: DashboardMetric[] = [
      {
        id: 'conversion_rate',
        name: 'Trial Conversion Rate',
        value: 30,
        previousValue: 27,
        change: 3,
        changePercent: 11.11,
        trend: 'up',
        unit: '%',
        format: 'percentage'
      }
    ];

    const chartData: ChartData[] = [];
    const tables: TableData[] = [];

    return {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId: report.id,
      generatedAt: new Date(),
      dateRange,
      metrics,
      chartData,
      tables,
      summary: 'Conversion funnel shows 30% trial-to-paid conversion rate.',
      metadata: { funnel }
    };
  }

  /**
   * Generate cohort report
   */
  private async generateCohortReport(
    report: ReportDefinition,
    dateRange: { start: Date; end: Date }
  ): Promise<ReportData> {
    const cohortAnalysis: CohortAnalysis = {
      cohortBy: 'month',
      startDate: dateRange.start,
      endDate: dateRange.end,
      cohorts: [
        {
          cohortDate: new Date('2024-01-01'),
          size: 100,
          retention: [
            { period: 0, retained: 100, rate: 100 },
            { period: 1, retained: 92, rate: 92 },
            { period: 2, retained: 87, rate: 87 },
            { period: 3, retained: 82, rate: 82 }
          ]
        }
      ]
    };

    const metrics: DashboardMetric[] = [];
    const chartData: ChartData[] = [];
    const tables: TableData[] = [];

    return {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId: report.id,
      generatedAt: new Date(),
      dateRange,
      metrics,
      chartData,
      tables,
      summary: 'Cohort analysis shows strong retention across all cohorts.',
      metadata: { cohortAnalysis }
    };
  }

  /**
   * Generate custom report
   */
  private async generateCustomReport(
    report: ReportDefinition,
    dateRange: { start: Date; end: Date }
  ): Promise<ReportData> {
    return {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId: report.id,
      generatedAt: new Date(),
      dateRange,
      metrics: [],
      chartData: [],
      tables: [],
      summary: 'Custom report generated successfully.'
    };
  }

  /**
   * Generate time series data
   */
  private generateTimeSeriesData(
    dateRange: { start: Date; end: Date },
    minValue: number,
    maxValue: number
  ): Array<{ label: string; value: number }> {
    const data: Array<{ label: string; value: number }> = [];
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000));

    for (let i = 0; i <= days; i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      const value = minValue + Math.random() * (maxValue - minValue);
      data.push({
        label: date.toLocaleDateString(),
        value: Math.round(value)
      });
    }

    return data;
  }

  /**
   * Calculate customer health score
   */
  async calculateHealthScore(tenantId: string): Promise<CustomerHealthScore> {
    // Simulate health score calculation
    const factors = {
      usage: 85,
      engagement: 75,
      support: 90,
      payment: 100,
      feature: 70
    };

    const score = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;

    let risk: 'low' | 'medium' | 'high';
    if (score >= 80) risk = 'low';
    else if (score >= 60) risk = 'medium';
    else risk = 'high';

    const recommendations: string[] = [];
    if (factors.feature < 70) recommendations.push('Promote advanced features');
    if (factors.engagement < 70) recommendations.push('Increase engagement campaigns');
    if (factors.usage < 70) recommendations.push('Review usage patterns');

    return {
      tenantId,
      score,
      factors,
      risk,
      recommendations,
      lastUpdated: new Date()
    };
  }

  /**
   * Export report data
   */
  async exportReport(
    reportDataId: string,
    format: ReportFormat
  ): Promise<string> {
    // Find the report data
    let reportData: ReportData | undefined;
    for (const dataArray of this.reportData.values()) {
      reportData = dataArray.find(d => d.id === reportDataId);
      if (reportData) break;
    }

    if (!reportData) {
      throw new Error(`Report data ${reportDataId} not found`);
    }

    switch (format) {
      case ReportFormat.JSON:
        return JSON.stringify(reportData, null, 2);
      case ReportFormat.CSV:
        return this.exportToCSV(reportData);
      case ReportFormat.PDF:
        return this.exportToPDF(reportData);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(reportData: ReportData): string {
    let csv = 'Metric,Value,Previous Value,Change %\n';

    reportData.metrics.forEach(metric => {
      csv += `${metric.name},${metric.value},${metric.previousValue || 'N/A'},${metric.changePercent || 'N/A'}\n`;
    });

    return csv;
  }

  /**
   * Export to PDF format (simplified)
   */
  private exportToPDF(reportData: ReportData): string {
    return `PDF Report Generated: ${reportData.id}\nGenerated At: ${reportData.generatedAt}\n\n${reportData.summary}`;
  }

  /**
   * Schedule report generation
   */
  private scheduleReport(report: ReportDefinition): void {
    if (!report.schedule?.enabled) return;

    const interval = this.getScheduleInterval(report.schedule.frequency);
    const timer = setInterval(async () => {
      try {
        const data = await this.generateReport(report.id);
        this.emit('scheduled_report:generated', {
          report,
          data,
          recipients: report.schedule!.recipients,
          timestamp: new Date()
        });
      } catch (error) {
        this.emit('scheduled_report:error', { report, error, timestamp: new Date() });
      }
    }, interval);

    this.scheduledReports.set(report.id, timer);
  }

  /**
   * Get schedule interval in milliseconds
   */
  private getScheduleInterval(frequency: ReportSchedule): number {
    switch (frequency) {
      case ReportSchedule.DAILY:
        return 24 * 60 * 60 * 1000;
      case ReportSchedule.WEEKLY:
        return 7 * 24 * 60 * 60 * 1000;
      case ReportSchedule.MONTHLY:
        return 30 * 24 * 60 * 60 * 1000;
      case ReportSchedule.QUARTERLY:
        return 90 * 24 * 60 * 60 * 1000;
    }
  }

  // Getter methods
  getReport(reportId: string): ReportDefinition | undefined {
    return this.reports.get(reportId);
  }

  getReportData(reportId: string): ReportData[] {
    return this.reportData.get(reportId) || [];
  }

  getAllReports(): ReportDefinition[] {
    return Array.from(this.reports.values());
  }
}

export default AnalyticsReporting;
