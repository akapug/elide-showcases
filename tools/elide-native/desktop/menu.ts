/**
 * Elide Desktop Framework - Native Menu System
 *
 * Cross-platform native menu creation and management.
 */

import { NativeBridge } from '../runtime/bridge';
import { Window } from './window';

export type MenuItemType = 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
export type MenuItemRole =
  | 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'selectAll'
  | 'minimize' | 'close' | 'quit' | 'reload' | 'forceReload'
  | 'toggleDevTools' | 'toggleFullscreen' | 'resetZoom'
  | 'zoomIn' | 'zoomOut' | 'about' | 'hide' | 'hideOthers'
  | 'unhide' | 'startSpeaking' | 'stopSpeaking' | 'front'
  | 'zoom' | 'window' | 'help' | 'services';

export interface MenuItemOptions {
  type?: MenuItemType;
  label?: string;
  sublabel?: string;
  accelerator?: string;
  icon?: string;
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  role?: MenuItemRole;
  submenu?: MenuItemOptions[] | Menu;
  click?: (menuItem: MenuItem, window: Window | undefined, event: KeyboardEvent) => void;
  id?: string;
  position?: string;
}

export class MenuItem {
  private handle: number;
  public type: MenuItemType;
  public label: string;
  public sublabel?: string;
  public accelerator?: string;
  public icon?: string;
  public enabled: boolean;
  public visible: boolean;
  public checked: boolean;
  public role?: MenuItemRole;
  public submenu?: Menu;
  public click?: (menuItem: MenuItem, window: Window | undefined, event: KeyboardEvent) => void;
  public id?: string;

  constructor(options: MenuItemOptions) {
    this.type = options.type || 'normal';
    this.label = options.label || '';
    this.sublabel = options.sublabel;
    this.accelerator = options.accelerator;
    this.icon = options.icon;
    this.enabled = options.enabled !== false;
    this.visible = options.visible !== false;
    this.checked = options.checked || false;
    this.role = options.role;
    this.click = options.click;
    this.id = options.id;

    if (options.submenu) {
      if (Array.isArray(options.submenu)) {
        this.submenu = new Menu(options.submenu);
      } else {
        this.submenu = options.submenu;
      }
    }

    // Create native menu item
    this.handle = NativeBridge.createMenuItem({
      type: this.type,
      label: this.label,
      sublabel: this.sublabel,
      accelerator: this.accelerator,
      icon: this.icon,
      enabled: this.enabled,
      visible: this.visible,
      checked: this.checked,
      role: this.role,
      submenu: this.submenu?.handle,
      id: this.id,
    });

    // Set up click handler
    if (this.click) {
      NativeBridge.onMenuItemClick(this.handle, (window: Window | undefined, event: KeyboardEvent) => {
        this.click!(this, window, event);
      });
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    NativeBridge.setMenuItemEnabled(this.handle, enabled);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    NativeBridge.setMenuItemVisible(this.handle, visible);
  }

  setChecked(checked: boolean): void {
    this.checked = checked;
    NativeBridge.setMenuItemChecked(this.handle, checked);
  }

  setLabel(label: string): void {
    this.label = label;
    NativeBridge.setMenuItemLabel(this.handle, label);
  }
}

export class Menu {
  public handle: number;
  private items: MenuItem[] = [];

  constructor(items: MenuItemOptions[] = []) {
    this.handle = NativeBridge.createMenu();

    for (const itemOptions of items) {
      this.append(new MenuItem(itemOptions));
    }
  }

  append(menuItem: MenuItem): void {
    this.items.push(menuItem);
    NativeBridge.appendMenuItem(this.handle, menuItem['handle']);
  }

  insert(position: number, menuItem: MenuItem): void {
    this.items.splice(position, 0, menuItem);
    NativeBridge.insertMenuItem(this.handle, position, menuItem['handle']);
  }

  remove(menuItem: MenuItem): void {
    const index = this.items.indexOf(menuItem);
    if (index !== -1) {
      this.items.splice(index, 1);
      NativeBridge.removeMenuItem(this.handle, menuItem['handle']);
    }
  }

  getMenuItemById(id: string): MenuItem | undefined {
    for (const item of this.items) {
      if (item.id === id) {
        return item;
      }
      if (item.submenu) {
        const found = item.submenu.getMenuItemById(id);
        if (found) return found;
      }
    }
    return undefined;
  }

  popup(window?: Window, options?: { x?: number; y?: number; positioningItem?: number }): void {
    NativeBridge.popupMenu(this.handle, window?.['handle'], options);
  }

  closePopup(window?: Window): void {
    NativeBridge.closePopupMenu(this.handle, window?.['handle']);
  }

  static setApplicationMenu(menu: Menu | null): void {
    NativeBridge.setApplicationMenu(menu?.handle || 0);
  }

  static getApplicationMenu(): Menu | null {
    const handle = NativeBridge.getApplicationMenu();
    return handle ? { handle } as Menu : null;
  }

  static buildFromTemplate(template: MenuItemOptions[]): Menu {
    return new Menu(template);
  }
}

// Common menu templates

export class MenuTemplates {
  static createMacOSTemplate(appName: string): MenuItemOptions[] {
    return [
      {
        label: appName,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'toggleFullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          { type: 'separator' },
          { role: 'front' },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Learn More',
            click: async () => {
              // Open help URL
            },
          },
        ],
      },
    ];
  }

  static createWindowsTemplate(appName: string): MenuItemOptions[] {
    return [
      {
        label: 'File',
        submenu: [
          { role: 'quit' },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'toggleFullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: async () => {
              // Show about dialog
            },
          },
        ],
      },
    ];
  }

  static createLinuxTemplate(appName: string): MenuItemOptions[] {
    return this.createWindowsTemplate(appName);
  }

  static createDefaultTemplate(appName: string): MenuItemOptions[] {
    const platform = NativeBridge.getPlatform();

    switch (platform) {
      case 'darwin':
        return this.createMacOSTemplate(appName);
      case 'win32':
        return this.createWindowsTemplate(appName);
      case 'linux':
        return this.createLinuxTemplate(appName);
      default:
        return this.createWindowsTemplate(appName);
    }
  }
}
