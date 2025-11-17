/**
 * Panel Types Export
 */

import { Panel } from './panel';
import type { PanelOptions, PanelType } from '../types';

/**
 * Graph Panel
 */
export class GraphPanel extends Panel {
  protected panelType: PanelType = 'graph';

  public aliasColors: Record<string, string>;
  public bars: boolean;
  public lines: boolean;
  public linewidth: number;
  public points: boolean;
  public pointradius: number;
  public fill: number;
  public stack: boolean;
  public steppedLine: boolean;
  public percentage: boolean;
  public legend: any;
  public xaxis: any;
  public yaxes: any[];
  public alert?: any;

  constructor(options: PanelOptions) {
    super(options);
    this.aliasColors = {};
    this.bars = false;
    this.lines = true;
    this.linewidth = 1;
    this.points = false;
    this.pointradius = 5;
    this.fill = 1;
    this.stack = false;
    this.steppedLine = false;
    this.percentage = false;
    this.legend = {
      show: true,
      alignAsTable: false,
      avg: false,
      current: false,
      max: false,
      min: false,
      rightSide: false,
      total: false,
      values: false,
    };
    this.xaxis = {
      show: true,
      mode: 'time',
    };
    this.yaxes = [
      {
        format: 'short',
        label: null,
        logBase: 1,
        show: true,
      },
      {
        format: 'short',
        label: null,
        logBase: 1,
        show: true,
      },
    ];
  }

  toJSON(): any {
    const base = super.toJSON();
    return {
      ...base,
      aliasColors: this.aliasColors,
      bars: this.bars,
      lines: this.lines,
      linewidth: this.linewidth,
      points: this.points,
      pointradius: this.pointradius,
      fill: this.fill,
      stack: this.stack,
      steppedLine: this.steppedLine,
      percentage: this.percentage,
      legend: this.legend,
      xaxis: this.xaxis,
      yaxes: this.yaxes,
      alert: this.alert,
    };
  }
}

/**
 * Stat Panel
 */
export class StatPanel extends Panel {
  protected panelType: PanelType = 'stat';

  constructor(options: PanelOptions) {
    super(options);
    this.options = {
      orientation: 'auto',
      textMode: 'auto',
      colorMode: 'value',
      graphMode: 'area',
      justifyMode: 'auto',
      reduceOptions: {
        values: false,
        fields: '',
        calcs: ['lastNotNull'],
      },
    };
  }
}

/**
 * Gauge Panel
 */
export class GaugePanel extends Panel {
  protected panelType: PanelType = 'gauge';

  constructor(options: PanelOptions) {
    super(options);
    this.options = {
      orientation: 'auto',
      showThresholdLabels: false,
      showThresholdMarkers: true,
      reduceOptions: {
        values: false,
        fields: '',
        calcs: ['lastNotNull'],
      },
    };
  }
}

/**
 * Bar Gauge Panel
 */
export class BarGaugePanel extends Panel {
  protected panelType: PanelType = 'bargauge';

  constructor(options: PanelOptions) {
    super(options);
    this.options = {
      orientation: 'auto',
      displayMode: 'gradient',
      showUnfilled: true,
      reduceOptions: {
        values: false,
        fields: '',
        calcs: ['lastNotNull'],
      },
    };
  }
}

/**
 * Table Panel
 */
export class TablePanel extends Panel {
  protected panelType: PanelType = 'table';

  constructor(options: PanelOptions) {
    super(options);
    this.options = {
      showHeader: true,
      sortBy: [],
      frameIndex: 0,
    };
  }
}

/**
 * Heatmap Panel
 */
export class HeatmapPanel extends Panel {
  protected panelType: PanelType = 'heatmap';

  public dataFormat: string;
  public yAxis: any;
  public color: any;
  public tooltip: any;

  constructor(options: PanelOptions) {
    super(options);
    this.dataFormat = 'timeseries';
    this.yAxis = {
      format: 'short',
      decimals: null,
      logBase: 1,
      show: true,
    };
    this.color = {
      mode: 'spectrum',
      cardColor: '#b4ff00',
      colorScale: 'sqrt',
      exponent: 0.5,
      colorScheme: 'interpolateSpectral',
    };
    this.tooltip = {
      show: true,
      showHistogram: false,
    };
  }

  toJSON(): any {
    const base = super.toJSON();
    return {
      ...base,
      dataFormat: this.dataFormat,
      yAxis: this.yAxis,
      color: this.color,
      tooltip: this.tooltip,
    };
  }
}

/**
 * Time Series Panel
 */
export class TimeSeriesPanel extends Panel {
  protected panelType: PanelType = 'timeseries';

  constructor(options: PanelOptions) {
    super(options);
    this.options = {
      tooltip: {
        mode: 'single',
        sort: 'none',
      },
      legend: {
        displayMode: 'list',
        placement: 'bottom',
        showLegend: true,
      },
    };
  }
}

/**
 * Bar Chart Panel
 */
export class BarChartPanel extends Panel {
  protected panelType: PanelType = 'barchart';

  constructor(options: PanelOptions) {
    super(options);
    this.options = {
      orientation: 'auto',
      xTickLabelRotation: 0,
      xTickLabelSpacing: 0,
      showValue: 'auto',
      stacking: 'none',
      groupWidth: 0.7,
      barWidth: 0.97,
      legend: {
        displayMode: 'list',
        placement: 'bottom',
        showLegend: true,
      },
      tooltip: {
        mode: 'single',
        sort: 'none',
      },
    };
  }
}

/**
 * Pie Chart Panel
 */
export class PieChartPanel extends Panel {
  protected panelType: PanelType = 'piechart';

  constructor(options: PanelOptions) {
    super(options);
    this.options = {
      pieType: 'pie',
      displayLabels: [],
      legendDisplayMode: 'table',
      legendPlacement: 'right',
      legendValues: [],
      reduceOptions: {
        values: false,
        fields: '',
        calcs: ['lastNotNull'],
      },
      tooltip: {
        mode: 'single',
        sort: 'none',
      },
    };
  }
}

/**
 * Text Panel
 */
export class TextPanel extends Panel {
  protected panelType: PanelType = 'text';

  public content: string;
  public mode: 'markdown' | 'html';

  constructor(options: PanelOptions & { content?: string; mode?: 'markdown' | 'html' }) {
    super(options);
    this.content = options.content || '';
    this.mode = options.mode || 'markdown';
    this.options = {
      content: this.content,
      mode: this.mode,
    };
  }

  toJSON(): any {
    const base = super.toJSON();
    return {
      ...base,
      options: {
        content: this.content,
        mode: this.mode,
      },
    };
  }
}

/**
 * Logs Panel
 */
export class LogsPanel extends Panel {
  protected panelType: PanelType = 'logs';

  constructor(options: PanelOptions) {
    super(options);
    this.options = {
      showTime: true,
      showLabels: false,
      showCommonLabels: false,
      wrapLogMessage: true,
      prettifyLogMessage: false,
      enableLogDetails: true,
      dedupStrategy: 'none',
      sortOrder: 'Descending',
    };
  }
}

/**
 * Alert List Panel
 */
export class AlertListPanel extends Panel {
  protected panelType: PanelType = 'alertlist';

  constructor(options: PanelOptions) {
    super(options);
    this.options = {
      showOptions: 'current',
      maxItems: 10,
      sortOrder: 1,
      dashboardAlerts: true,
      alertName: '',
      dashboardTitle: '',
      tags: [],
      stateFilter: [],
      folderId: null,
    };
  }
}

// Export all panel types
export { Panel } from './panel';
export {
  GraphPanel,
  StatPanel,
  GaugePanel,
  BarGaugePanel,
  TablePanel,
  HeatmapPanel,
  TimeSeriesPanel,
  BarChartPanel,
  PieChartPanel,
  TextPanel,
  LogsPanel,
  AlertListPanel,
};
