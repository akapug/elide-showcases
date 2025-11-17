/**
 * Dashboard Link Implementations
 */

import type { DashboardLinkOptions } from './types';

/**
 * Dashboard Link class
 */
export class DashboardLink {
  public title: string;
  public type: 'link' | 'dashboards';
  public icon: string;
  public tooltip: string;
  public url?: string;
  public tags?: string[];
  public asDropdown: boolean;
  public targetBlank: boolean;
  public includeVars: boolean;
  public keepTime: boolean;

  constructor(options: DashboardLinkOptions) {
    this.title = options.title;
    this.type = options.type;
    this.icon = options.icon || 'external link';
    this.tooltip = options.tooltip || '';
    this.url = options.url;
    this.tags = options.tags;
    this.asDropdown = options.asDropdown || false;
    this.targetBlank = options.targetBlank || false;
    this.includeVars = options.includeVars !== false;
    this.keepTime = options.keepTime !== false;
  }

  /**
   * Convert link to JSON
   */
  toJSON(): any {
    return {
      title: this.title,
      type: this.type,
      icon: this.icon,
      tooltip: this.tooltip,
      url: this.url,
      tags: this.tags,
      asDropdown: this.asDropdown,
      targetBlank: this.targetBlank,
      includeVars: this.includeVars,
      keepTime: this.keepTime,
    };
  }
}

/**
 * Create an external link
 */
export function createExternalLink(options: {
  title: string;
  url: string;
  tooltip?: string;
  targetBlank?: boolean;
}): DashboardLink {
  return new DashboardLink({
    title: options.title,
    type: 'link',
    url: options.url,
    tooltip: options.tooltip,
    targetBlank: options.targetBlank,
  });
}

/**
 * Create a dashboard link
 */
export function createDashboardsLink(options: {
  title: string;
  tags: string[];
  asDropdown?: boolean;
  includeVars?: boolean;
  keepTime?: boolean;
}): DashboardLink {
  return new DashboardLink({
    title: options.title,
    type: 'dashboards',
    tags: options.tags,
    asDropdown: options.asDropdown,
    includeVars: options.includeVars,
    keepTime: options.keepTime,
  });
}
