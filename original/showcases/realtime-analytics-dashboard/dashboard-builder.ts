/**
 * Dashboard Builder
 *
 * Dynamic dashboard configuration and layout management.
 * Supports multiple widget types and custom layouts.
 */

import type { DataAggregator } from './data-aggregator.ts';
import type { QueryEngine } from './query-engine.ts';

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: Layout;
  widgets: Widget[];
  refreshInterval: number; // milliseconds
  filters?: DashboardFilter[];
  createdAt: number;
  updatedAt: number;
}

export interface Layout {
  type: 'grid' | 'flex' | 'custom';
  columns: number;
  gap: number;
  responsive?: boolean;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
  dataSource: DataSource;
}

export type WidgetType =
  | 'line-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'area-chart'
  | 'scatter-chart'
  | 'gauge'
  | 'counter'
  | 'table'
  | 'heatmap'
  | 'funnel'
  | 'cohort'
  | 'metric';

export interface WidgetConfig {
  colors?: string[];
  legend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  animation?: boolean;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  [key: string]: any;
}

export interface AxisConfig {
  label?: string;
  min?: number;
  max?: number;
  format?: 'number' | 'percentage' | 'currency' | 'time';
}

export interface DataSource {
  type: 'events' | 'aggregation' | 'query' | 'custom';
  eventType?: string;
  metric?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string;
  timeRange?: 'last_hour' | 'last_24h' | 'last_7d' | 'last_30d' | 'custom';
  customTimeRange?: { start: number; end: number };
  interval?: number;
  filters?: Record<string, any>;
  queryId?: string;
}

export interface DashboardFilter {
  name: string;
  type: 'select' | 'daterange' | 'search' | 'toggle';
  values?: any[];
  defaultValue?: any;
}

export interface WidgetData {
  widgetId: string;
  data: any;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class DashboardBuilder {
  private dashboards = new Map<string, Dashboard>();
  private aggregator: DataAggregator;
  private queryEngine?: QueryEngine;

  constructor(aggregator: DataAggregator, queryEngine?: QueryEngine) {
    this.aggregator = aggregator;
    this.queryEngine = queryEngine;
  }

  // Create dashboard
  create(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateDashboardId();
    const now = Date.now();

    const newDashboard: Dashboard = {
      id,
      createdAt: now,
      updatedAt: now,
      ...dashboard
    };

    this.dashboards.set(id, newDashboard);
    console.log(`Dashboard created: ${newDashboard.name} (${id})`);

    return id;
  }

  // Update dashboard
  update(id: string, updates: Partial<Dashboard>): boolean {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) return false;

    Object.assign(dashboard, updates, { updatedAt: Date.now() });
    return true;
  }

  // Delete dashboard
  delete(id: string): boolean {
    return this.dashboards.delete(id);
  }

  // Get dashboard
  get(id: string): Dashboard | undefined {
    return this.dashboards.get(id);
  }

  // List all dashboards
  list(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  // Add widget to dashboard
  addWidget(dashboardId: string, widget: Omit<Widget, 'id'>): string | null {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const widgetId = this.generateWidgetId();
    const newWidget: Widget = {
      id: widgetId,
      ...widget
    };

    dashboard.widgets.push(newWidget);
    dashboard.updatedAt = Date.now();

    return widgetId;
  }

  // Update widget
  updateWidget(dashboardId: string, widgetId: string, updates: Partial<Widget>): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;

    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) return false;

    Object.assign(widget, updates);
    dashboard.updatedAt = Date.now();

    return true;
  }

  // Remove widget
  removeWidget(dashboardId: string, widgetId: string): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;

    const index = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (index === -1) return false;

    dashboard.widgets.splice(index, 1);
    dashboard.updatedAt = Date.now();

    return true;
  }

  // Get dashboard data
  async getData(dashboardId: string): Promise<{
    dashboard: Dashboard;
    widgets: WidgetData[];
    timestamp: number;
  } | null> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const widgetDataPromises = dashboard.widgets.map(async widget => {
      const data = await this.getWidgetData(widget);
      return {
        widgetId: widget.id,
        data,
        timestamp: Date.now()
      };
    });

    const widgets = await Promise.all(widgetDataPromises);

    return {
      dashboard,
      widgets,
      timestamp: Date.now()
    };
  }

  // Get widget data
  private async getWidgetData(widget: Widget): Promise<any> {
    const { dataSource } = widget;
    const { start, end } = this.resolveTimeRange(dataSource.timeRange, dataSource.customTimeRange);

    switch (dataSource.type) {
      case 'events': {
        if (!dataSource.eventType) return [];

        return this.aggregator.query({
          type: dataSource.eventType,
          startTime: start,
          endTime: end,
          properties: dataSource.filters
        });
      }

      case 'aggregation': {
        if (!dataSource.eventType || !dataSource.metric) return [];

        const interval = dataSource.interval || this.getDefaultInterval(start, end);

        return this.aggregator.aggregate(
          dataSource.eventType,
          dataSource.metric,
          start,
          end,
          interval
        );
      }

      case 'query': {
        if (!this.queryEngine || !dataSource.queryId) return null;

        // Execute saved query
        return null; // Implement query execution
      }

      case 'custom': {
        // Custom data source
        return this.getCustomData(widget);
      }

      default:
        return null;
    }
  }

  // Resolve time range
  private resolveTimeRange(
    range?: string,
    custom?: { start: number; end: number }
  ): { start: number; end: number } {
    const now = Date.now();

    if (custom) {
      return custom;
    }

    switch (range) {
      case 'last_hour':
        return { start: now - 3600000, end: now };
      case 'last_24h':
        return { start: now - 86400000, end: now };
      case 'last_7d':
        return { start: now - 604800000, end: now };
      case 'last_30d':
        return { start: now - 2592000000, end: now };
      default:
        return { start: now - 3600000, end: now };
    }
  }

  // Get default interval based on time range
  private getDefaultInterval(start: number, end: number): number {
    const duration = end - start;

    if (duration <= 3600000) return 60000; // 1 minute for 1 hour
    if (duration <= 86400000) return 300000; // 5 minutes for 24 hours
    if (duration <= 604800000) return 3600000; // 1 hour for 7 days
    return 86400000; // 1 day for 30+ days
  }

  // Get custom data
  private getCustomData(widget: Widget): any {
    // Implement custom data sources
    switch (widget.type) {
      case 'counter': {
        const { start, end } = this.resolveTimeRange(widget.dataSource.timeRange);
        return {
          value: this.aggregator.uniqueUsers(start, end),
          label: 'Unique Users'
        };
      }

      case 'gauge': {
        const { start, end } = this.resolveTimeRange(widget.dataSource.timeRange);
        const stats = this.aggregator.getStats();
        return {
          value: stats.eventsPerSecond,
          max: 10000,
          label: 'Events/sec'
        };
      }

      default:
        return null;
    }
  }

  // Create template dashboard
  createTemplate(template: 'overview' | 'engagement' | 'performance' | 'errors'): string {
    const templates: Record<string, Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>> = {
      overview: {
        name: 'Overview Dashboard',
        description: 'High-level metrics and KPIs',
        layout: { type: 'grid', columns: 12, gap: 16, responsive: true },
        refreshInterval: 30000,
        widgets: [
          {
            id: '',
            type: 'counter',
            title: 'Total Events',
            position: { x: 0, y: 0, w: 3, h: 2 },
            config: { colors: ['#3b82f6'] },
            dataSource: {
              type: 'custom',
              timeRange: 'last_24h'
            }
          },
          {
            id: '',
            type: 'line-chart',
            title: 'Events Over Time',
            position: { x: 3, y: 0, w: 9, h: 4 },
            config: { showGrid: true, legend: true },
            dataSource: {
              type: 'aggregation',
              eventType: 'pageview',
              metric: 'count',
              aggregation: 'count',
              timeRange: 'last_24h',
              interval: 300000
            }
          }
        ]
      },

      engagement: {
        name: 'User Engagement',
        description: 'User activity and engagement metrics',
        layout: { type: 'grid', columns: 12, gap: 16, responsive: true },
        refreshInterval: 60000,
        widgets: [
          {
            id: '',
            type: 'counter',
            title: 'Active Users',
            position: { x: 0, y: 0, w: 4, h: 2 },
            config: { colors: ['#10b981'] },
            dataSource: {
              type: 'custom',
              timeRange: 'last_hour'
            }
          },
          {
            id: '',
            type: 'funnel',
            title: 'Conversion Funnel',
            position: { x: 4, y: 0, w: 8, h: 4 },
            config: {},
            dataSource: {
              type: 'query',
              timeRange: 'last_7d'
            }
          }
        ]
      },

      performance: {
        name: 'Performance Metrics',
        description: 'System and application performance',
        layout: { type: 'grid', columns: 12, gap: 16, responsive: true },
        refreshInterval: 10000,
        widgets: [
          {
            id: '',
            type: 'gauge',
            title: 'Throughput',
            position: { x: 0, y: 0, w: 3, h: 3 },
            config: { colors: ['#f59e0b'] },
            dataSource: {
              type: 'custom',
              timeRange: 'last_hour'
            }
          },
          {
            id: '',
            type: 'line-chart',
            title: 'Response Time',
            position: { x: 3, y: 0, w: 9, h: 3 },
            config: { showGrid: true },
            dataSource: {
              type: 'aggregation',
              eventType: 'api_request',
              metric: 'duration',
              aggregation: 'avg',
              timeRange: 'last_hour'
            }
          }
        ]
      },

      errors: {
        name: 'Error Tracking',
        description: 'Error rates and monitoring',
        layout: { type: 'grid', columns: 12, gap: 16, responsive: true },
        refreshInterval: 30000,
        widgets: [
          {
            id: '',
            type: 'counter',
            title: 'Total Errors',
            position: { x: 0, y: 0, w: 4, h: 2 },
            config: { colors: ['#ef4444'] },
            dataSource: {
              type: 'events',
              eventType: 'error',
              timeRange: 'last_24h'
            }
          },
          {
            id: '',
            type: 'bar-chart',
            title: 'Errors by Type',
            position: { x: 4, y: 0, w: 8, h: 4 },
            config: {},
            dataSource: {
              type: 'aggregation',
              eventType: 'error',
              metric: 'count',
              groupBy: 'errorType',
              timeRange: 'last_24h'
            }
          }
        ]
      }
    };

    const template_config = templates[template];
    if (!template_config) {
      throw new Error(`Unknown template: ${template}`);
    }

    return this.create(template_config);
  }

  // Generate dashboard ID
  private generateDashboardId(): string {
    return `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate widget ID
  private generateWidgetId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export dashboard config
  export(dashboardId: string): string | null {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;

    return JSON.stringify(dashboard, null, 2);
  }

  // Import dashboard config
  import(config: string): string {
    const dashboard = JSON.parse(config) as Dashboard;
    const id = this.generateDashboardId();

    dashboard.id = id;
    dashboard.createdAt = Date.now();
    dashboard.updatedAt = Date.now();

    this.dashboards.set(id, dashboard);

    return id;
  }
}
