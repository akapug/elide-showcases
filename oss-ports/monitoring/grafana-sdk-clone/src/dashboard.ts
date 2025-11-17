/**
 * Grafana Dashboard Implementation
 */

import type {
  DashboardOptions,
  TimeRange,
  Variable,
  PanelOptions,
} from './types';
import { Panel } from './panels/panel';
import { Row } from './row';
import { Annotation } from './annotations';
import { DashboardLink } from './links';

/**
 * Dashboard class
 */
export class Dashboard {
  public uid: string;
  public title: string;
  public description: string;
  public tags: string[];
  public timezone: string;
  public refresh: string;
  public time: TimeRange;
  public version: number;
  public editable: boolean;
  public graphTooltip: number | string;
  public style: string;
  public panels: Panel[];
  public rows: Row[];
  public templating: { list: Variable[] };
  public annotations: { list: Annotation[] };
  public links: DashboardLink[];
  public timepicker: any;
  public schemaVersion: number;

  private nextPanelId: number = 1;

  constructor(options: DashboardOptions) {
    this.uid = options.uid || this.generateUID();
    this.title = options.title;
    this.description = options.description || '';
    this.tags = options.tags || [];
    this.timezone = options.timezone || 'browser';
    this.refresh = options.refresh || '';
    this.time = options.time || { from: 'now-6h', to: 'now' };
    this.version = options.version || 0;
    this.editable = options.editable !== false;
    this.graphTooltip = options.graphTooltip || 0;
    this.style = options.style || 'dark';
    this.panels = [];
    this.rows = [];
    this.templating = { list: [] };
    this.annotations = { list: [] };
    this.links = [];
    this.timepicker = {
      refresh_intervals: [
        '5s',
        '10s',
        '30s',
        '1m',
        '5m',
        '15m',
        '30m',
        '1h',
        '2h',
        '1d',
      ],
      time_options: ['5m', '15m', '1h', '6h', '12h', '24h', '2d', '7d', '30d'],
    };
    this.schemaVersion = 36;
  }

  /**
   * Add a panel to the dashboard
   */
  addPanel(panel: Panel): void {
    if (!panel.id) {
      panel.id = this.nextPanelId++;
    } else {
      this.nextPanelId = Math.max(this.nextPanelId, panel.id + 1);
    }
    this.panels.push(panel);
  }

  /**
   * Remove a panel from the dashboard
   */
  removePanel(panelId: number): void {
    const index = this.panels.findIndex((p) => p.id === panelId);
    if (index !== -1) {
      this.panels.splice(index, 1);
    }
  }

  /**
   * Add a row to the dashboard
   */
  addRow(row: Row): void {
    this.rows.push(row);
    // Add row as a panel
    this.panels.push(row as any);
  }

  /**
   * Add a variable to the dashboard
   */
  addVariable(variable: Variable): void {
    this.templating.list.push(variable);
  }

  /**
   * Remove a variable from the dashboard
   */
  removeVariable(name: string): void {
    const index = this.templating.list.findIndex((v) => v.name === name);
    if (index !== -1) {
      this.templating.list.splice(index, 1);
    }
  }

  /**
   * Add an annotation to the dashboard
   */
  addAnnotation(annotation: Annotation): void {
    this.annotations.list.push(annotation);
  }

  /**
   * Add a link to the dashboard
   */
  addLink(link: DashboardLink): void {
    this.links.push(link);
  }

  /**
   * Convert dashboard to JSON
   */
  toJSON(): any {
    return {
      uid: this.uid,
      title: this.title,
      description: this.description,
      tags: this.tags,
      timezone: this.timezone,
      refresh: this.refresh,
      time: this.time,
      version: this.version,
      editable: this.editable,
      graphTooltip:
        typeof this.graphTooltip === 'string'
          ? this.parseGraphTooltip(this.graphTooltip)
          : this.graphTooltip,
      style: this.style,
      panels: this.panels.map((p) => p.toJSON()),
      templating: {
        list: this.templating.list.map((v) => v.toJSON()),
      },
      annotations: {
        list: this.annotations.list.map((a) => a.toJSON()),
      },
      links: this.links.map((l) => l.toJSON()),
      timepicker: this.timepicker,
      schemaVersion: this.schemaVersion,
    };
  }

  /**
   * Create dashboard from JSON
   */
  static fromJSON(json: any): Dashboard {
    const dashboard = new Dashboard({
      uid: json.uid,
      title: json.title,
      description: json.description,
      tags: json.tags,
      timezone: json.timezone,
      refresh: json.refresh,
      time: json.time,
      version: json.version,
      editable: json.editable,
      graphTooltip: json.graphTooltip,
      style: json.style,
    });

    // Add panels
    if (json.panels) {
      for (const panelJson of json.panels) {
        // Panel reconstruction would require factory pattern
        // For now, store as generic
        dashboard.panels.push(panelJson);
      }
    }

    // Add variables
    if (json.templating?.list) {
      dashboard.templating.list = json.templating.list;
    }

    // Add annotations
    if (json.annotations?.list) {
      dashboard.annotations.list = json.annotations.list;
    }

    // Add links
    if (json.links) {
      dashboard.links = json.links;
    }

    if (json.timepicker) {
      dashboard.timepicker = json.timepicker;
    }

    if (json.schemaVersion) {
      dashboard.schemaVersion = json.schemaVersion;
    }

    return dashboard;
  }

  /**
   * Convert dashboard to YAML
   */
  toYAML(): string {
    const json = this.toJSON();
    return this.jsonToYaml(json, 0);
  }

  /**
   * Create dashboard from YAML
   */
  static fromYAML(yaml: string): Dashboard {
    // Simple YAML parser (production would use a library)
    const json = JSON.parse(yaml); // Simplified
    return Dashboard.fromJSON(json);
  }

  /**
   * Generate unique ID
   */
  private generateUID(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let uid = '';
    for (let i = 0; i < 9; i++) {
      uid += chars[Math.floor(Math.random() * chars.length)];
    }
    return uid;
  }

  /**
   * Parse graph tooltip string to number
   */
  private parseGraphTooltip(value: string): number {
    const tooltips: Record<string, number> = {
      default: 0,
      shared_crosshair: 1,
      shared_tooltip: 2,
    };
    return tooltips[value] || 0;
  }

  /**
   * Simple JSON to YAML converter
   */
  private jsonToYaml(obj: any, indent: number): string {
    const spaces = ' '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object') {
          yaml += `${spaces}-\n${this.jsonToYaml(item, indent + 2)}`;
        } else {
          yaml += `${spaces}- ${item}\n`;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n${this.jsonToYaml(value, indent + 2)}`;
        } else if (typeof value === 'object' && value !== null) {
          yaml += `${spaces}${key}:\n${this.jsonToYaml(value, indent + 2)}`;
        } else if (typeof value === 'string') {
          yaml += `${spaces}${key}: "${value}"\n`;
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      }
    }

    return yaml;
  }

  /**
   * Clone dashboard
   */
  clone(): Dashboard {
    return Dashboard.fromJSON(this.toJSON());
  }

  /**
   * Get panel by ID
   */
  getPanel(id: number): Panel | undefined {
    return this.panels.find((p) => p.id === id);
  }

  /**
   * Get variable by name
   */
  getVariable(name: string): Variable | undefined {
    return this.templating.list.find((v) => v.name === name);
  }
}
