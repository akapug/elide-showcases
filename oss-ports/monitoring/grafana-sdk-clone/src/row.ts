/**
 * Row Implementation
 */

import type { RowOptions, GridPos } from './types';
import { Panel } from './panels/panel';

/**
 * Row class for organizing panels
 */
export class Row {
  public type: string = 'row';
  public title: string;
  public collapsed: boolean;
  public showTitle: boolean;
  public gridPos: GridPos;
  public panels: Panel[];
  public id?: number;

  constructor(options: RowOptions = {}) {
    this.title = options.title || 'Row';
    this.collapsed = options.collapsed || false;
    this.showTitle = options.showTitle !== false;
    this.gridPos = options.gridPos || { x: 0, y: 0, w: 24, h: 1 };
    this.panels = [];
  }

  /**
   * Add a panel to the row
   */
  addPanel(panel: Panel): void {
    this.panels.push(panel);
  }

  /**
   * Remove a panel from the row
   */
  removePanel(panelId: number): void {
    const index = this.panels.findIndex((p) => p.id === panelId);
    if (index !== -1) {
      this.panels.splice(index, 1);
    }
  }

  /**
   * Convert row to JSON
   */
  toJSON(): any {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      collapsed: this.collapsed,
      showTitle: this.showTitle,
      gridPos: this.gridPos,
      panels: this.collapsed ? this.panels.map((p) => p.toJSON()) : [],
    };
  }
}
