/**
 * Base Panel Implementation
 */

import type {
  PanelOptions,
  GridPos,
  Target,
  FieldConfig,
  PanelLink,
  PanelType,
} from '../types';

/**
 * Base panel class
 */
export abstract class Panel {
  public id?: number;
  public title: string;
  public description: string;
  public gridPos: GridPos;
  public transparent: boolean;
  public datasource: string | null;
  public interval: string;
  public links: PanelLink[];
  public repeat?: string;
  public repeatDirection?: 'h' | 'v';
  public maxPerRow?: number;
  public targets: Target[];
  public fieldConfig: FieldConfig;
  public options: Record<string, any>;

  protected abstract panelType: PanelType;

  constructor(options: PanelOptions) {
    this.id = options.id;
    this.title = options.title;
    this.description = options.description || '';
    this.gridPos = options.gridPos || { x: 0, y: 0, w: 12, h: 8 };
    this.transparent = options.transparent || false;
    this.datasource = options.datasource !== undefined ? options.datasource : null;
    this.interval = options.interval || '';
    this.links = options.links || [];
    this.repeat = options.repeat;
    this.repeatDirection = options.repeatDirection;
    this.maxPerRow = options.maxPerRow;
    this.targets = [];
    this.fieldConfig = { defaults: {}, overrides: [] };
    this.options = {};
  }

  /**
   * Add a target to the panel
   */
  addTarget(target: Target): void {
    // Auto-assign refId if not provided
    if (!target.refId) {
      target.refId = this.generateRefId();
    }
    this.targets.push(target);
  }

  /**
   * Remove a target from the panel
   */
  removeTarget(refId: string): void {
    const index = this.targets.findIndex((t) => t.refId === refId);
    if (index !== -1) {
      this.targets.splice(index, 1);
    }
  }

  /**
   * Add a link to the panel
   */
  addLink(link: PanelLink): void {
    this.links.push(link);
  }

  /**
   * Convert panel to JSON
   */
  toJSON(): any {
    return {
      id: this.id,
      type: this.panelType,
      title: this.title,
      description: this.description,
      gridPos: this.gridPos,
      transparent: this.transparent,
      datasource: this.datasource,
      interval: this.interval,
      links: this.links,
      repeat: this.repeat,
      repeatDirection: this.repeatDirection,
      maxPerRow: this.maxPerRow,
      targets: this.targets,
      fieldConfig: this.fieldConfig,
      options: this.options,
    };
  }

  /**
   * Generate next refId
   */
  private generateRefId(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const existingRefIds = this.targets.map((t) => t.refId);

    for (let i = 0; i < letters.length; i++) {
      const refId = letters[i];
      if (!existingRefIds.includes(refId)) {
        return refId;
      }
    }

    // If all single letters are used, start with AA, AB, etc.
    for (let i = 0; i < letters.length; i++) {
      for (let j = 0; j < letters.length; j++) {
        const refId = letters[i] + letters[j];
        if (!existingRefIds.includes(refId)) {
          return refId;
        }
      }
    }

    return 'A';
  }

  /**
   * Clone panel
   */
  clone(): Panel {
    const json = this.toJSON();
    // Subclasses should implement proper cloning
    return json as any;
  }
}
