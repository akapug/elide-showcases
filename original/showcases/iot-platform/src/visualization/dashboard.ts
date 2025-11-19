/**
 * Elide IoT Platform - Dashboard
 *
 * Real-time visualization dashboard for IoT data monitoring.
 * Uses Python's matplotlib for advanced charting.
 */

// @ts-ignore
import matplotlib from 'python:matplotlib';
// @ts-ignore
import numpy from 'python:numpy';

import {
  DashboardConfig,
  Widget,
  WidgetType,
  DataSource,
  ThemeConfig,
  Alert,
  TimeSeriesQuery
} from '../types';

// ============================================================================
// Dashboard Implementation
// ============================================================================

export class Dashboard {
  private widgets: Map<string, Widget> = new Map();
  private updateInterval: NodeJS.Timer | null = null;
  private isRunning: boolean = false;

  constructor(private config: DashboardConfig) {
    config.widgets.forEach(widget => {
      this.widgets.set(widget.id, widget);
    });
  }

  // ========================================================================
  // Widget Management
  // ========================================================================

  addWidget(widget: Widget): void {
    this.widgets.set(widget.id, widget);
  }

  removeWidget(widgetId: string): void {
    this.widgets.delete(widgetId);
  }

  getWidget(widgetId: string): Widget | undefined {
    return this.widgets.get(widgetId);
  }

  getAllWidgets(): Widget[] {
    return Array.from(this.widgets.values());
  }

  // ========================================================================
  // Dashboard Lifecycle
  // ========================================================================

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;

    // Initial render
    await this.render();

    // Setup auto-refresh
    this.updateInterval = setInterval(async () => {
      await this.render();
    }, this.config.refreshRate);
  }

  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async render(): Promise<void> {
    for (const widget of this.widgets.values()) {
      await this.renderWidget(widget);
    }
  }

  // ========================================================================
  // Widget Rendering
  // ========================================================================

  private async renderWidget(widget: Widget): Promise<void> {
    // Fetch data
    const data = await this.fetchWidgetData(widget.dataSource);

    switch (widget.type) {
      case WidgetType.TIMESERIES:
        await this.renderTimeSeriesChart(widget, data);
        break;
      case WidgetType.GAUGE:
        await this.renderGauge(widget, data);
        break;
      case WidgetType.HEATMAP:
        await this.renderHeatmap(widget, data);
        break;
      case WidgetType.TABLE:
        await this.renderTable(widget, data);
        break;
      case WidgetType.ALERT_LIST:
        await this.renderAlertList(widget, data);
        break;
      case WidgetType.BAR_CHART:
        await this.renderBarChart(widget, data);
        break;
      case WidgetType.PIE_CHART:
        await this.renderPieChart(widget, data);
        break;
      case WidgetType.STAT:
        await this.renderStat(widget, data);
        break;
    }
  }

  private async fetchWidgetData(dataSource: DataSource): Promise<any> {
    switch (dataSource.type) {
      case 'query':
        // Fetch from time series database
        return await this.executeQuery(dataSource.query!);
      case 'live':
        // Fetch from live stream
        return await this.fetchLiveData(dataSource.liveStream!);
      case 'static':
        // Return static data
        return dataSource.staticData;
      default:
        return null;
    }
  }

  private async executeQuery(query: TimeSeriesQuery): Promise<any> {
    // In production, query the actual database
    return {
      timestamps: [Date.now() - 3600000, Date.now()],
      values: [20, 25]
    };
  }

  private async fetchLiveData(stream: string): Promise<any> {
    // In production, fetch from live stream
    return {
      value: Math.random() * 100
    };
  }

  // ========================================================================
  // Chart Rendering with matplotlib
  // ========================================================================

  private async renderTimeSeriesChart(widget: Widget, data: any): Promise<void> {
    if (!data.timestamps || !data.values) return;

    const plt = matplotlib.pyplot;

    // Create figure
    const fig = plt.figure({ figsize: [10, 6] });
    const ax = fig.add_subplot(111);

    // Plot time series
    ax.plot(
      numpy.array(data.timestamps),
      numpy.array(data.values),
      { color: this.config.theme.primaryColor, linewidth: 2 }
    );

    ax.set_xlabel('Time');
    ax.set_ylabel('Value');
    ax.set_title(widget.title);
    ax.grid(true, { alpha: 0.3 });

    // Apply theme
    if (this.config.theme.mode === 'dark') {
      fig.patch.set_facecolor(this.config.theme.backgroundColor);
      ax.set_facecolor('#1a1a1a');
    }

    // Save or display
    // plt.savefig(`dashboard/${widget.id}.png`)
    plt.close(fig);
  }

  private async renderGauge(widget: Widget, data: any): Promise<void> {
    if (typeof data.value !== 'number') return;

    const value = data.value;
    const min = widget.config.min || 0;
    const max = widget.config.max || 100;

    // Create gauge visualization
    const percentage = ((value - min) / (max - min)) * 100;

    // In production, render actual gauge chart
    console.log(`Gauge: ${widget.title} = ${percentage}%`);
  }

  private async renderHeatmap(widget: Widget, data: any): Promise<void> {
    if (!data.matrix) return;

    const plt = matplotlib.pyplot;

    const fig = plt.figure({ figsize: [8, 6] });
    const ax = fig.add_subplot(111);

    const im = ax.imshow(
      numpy.array(data.matrix),
      { cmap: 'viridis', aspect: 'auto' }
    );

    fig.colorbar(im, { ax });
    ax.set_title(widget.title);

    plt.close(fig);
  }

  private async renderBarChart(widget: Widget, data: any): Promise<void> {
    if (!data.categories || !data.values) return;

    const plt = matplotlib.pyplot;

    const fig = plt.figure({ figsize: [10, 6] });
    const ax = fig.add_subplot(111);

    ax.bar(
      data.categories,
      numpy.array(data.values),
      { color: this.config.theme.primaryColor }
    );

    ax.set_xlabel(widget.config.xLabel || 'Category');
    ax.set_ylabel(widget.config.yLabel || 'Value');
    ax.set_title(widget.title);
    ax.grid(true, { alpha: 0.3, axis: 'y' });

    plt.close(fig);
  }

  private async renderPieChart(widget: Widget, data: any): Promise<void> {
    if (!data.labels || !data.values) return;

    const plt = matplotlib.pyplot;

    const fig = plt.figure({ figsize: [8, 8] });
    const ax = fig.add_subplot(111);

    ax.pie(
      numpy.array(data.values),
      { labels: data.labels, autopct: '%1.1f%%' }
    );

    ax.set_title(widget.title);

    plt.close(fig);
  }

  private async renderTable(widget: Widget, data: any): Promise<void> {
    if (!data.rows) return;

    // Render table (simplified)
    console.log(`Table: ${widget.title}`);
    console.table(data.rows);
  }

  private async renderAlertList(widget: Widget, data: any): Promise<void> {
    if (!Array.isArray(data)) return;

    const alerts = data as Alert[];

    console.log(`Alerts: ${widget.title}`);
    alerts.forEach(alert => {
      console.log(`[${alert.severity}] ${alert.title}: ${alert.message}`);
    });
  }

  private async renderStat(widget: Widget, data: any): Promise<void> {
    if (typeof data.value === 'undefined') return;

    console.log(`Stat: ${widget.title} = ${data.value}`);
  }

  // ========================================================================
  // Export & Snapshot
  // ========================================================================

  async exportToPNG(widgetId: string, filename: string): Promise<void> {
    const widget = this.widgets.get(widgetId);
    if (!widget) throw new Error('Widget not found');

    const data = await this.fetchWidgetData(widget.dataSource);

    const plt = matplotlib.pyplot;

    // Render widget
    await this.renderWidget(widget);

    // Save to file
    plt.savefig(filename, { dpi: 300, bbox_inches: 'tight' });
  }

  async snapshot(): Promise<DashboardSnapshot> {
    const widgets: WidgetSnapshot[] = [];

    for (const widget of this.widgets.values()) {
      const data = await this.fetchWidgetData(widget.dataSource);

      widgets.push({
        id: widget.id,
        title: widget.title,
        type: widget.type,
        data
      });
    }

    return {
      timestamp: Date.now(),
      widgets,
      config: this.config
    };
  }

  // ========================================================================
  // Real-time Updates
  // ========================================================================

  async updateWidget(widgetId: string, data: any): Promise<void> {
    const widget = this.widgets.get(widgetId);
    if (!widget) return;

    await this.renderWidget(widget);
  }

  subscribeToUpdates(widgetId: string, callback: (data: any) => void): void {
    // In production, setup WebSocket or SSE for real-time updates
    setInterval(async () => {
      const widget = this.widgets.get(widgetId);
      if (widget) {
        const data = await this.fetchWidgetData(widget.dataSource);
        callback(data);
      }
    }, this.config.refreshRate);
  }

  // ========================================================================
  // Theme Management
  // ========================================================================

  setTheme(theme: ThemeConfig): void {
    this.config.theme = theme;
  }

  getTheme(): ThemeConfig {
    return this.config.theme;
  }
}

// ============================================================================
// Real-time Dashboard Stream
// ============================================================================

export class RealtimeDashboard extends Dashboard {
  private streams: Map<string, EventSource | WebSocket> = new Map();

  async connectStream(widgetId: string, streamUrl: string): Promise<void> {
    // In production, connect to actual stream
    console.log(`Connecting to stream: ${streamUrl}`);
  }

  async disconnectStream(widgetId: string): Promise<void> {
    const stream = this.streams.get(widgetId);
    if (stream) {
      if (stream instanceof WebSocket) {
        stream.close();
      } else {
        stream.close();
      }
      this.streams.delete(widgetId);
    }
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface DashboardSnapshot {
  timestamp: number;
  widgets: WidgetSnapshot[];
  config: DashboardConfig;
}

interface WidgetSnapshot {
  id: string;
  title: string;
  type: WidgetType;
  data: any;
}
