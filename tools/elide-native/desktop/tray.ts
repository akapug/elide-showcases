/**
 * Elide Desktop Framework - System Tray
 *
 * Native system tray/notification area integration.
 */

import { EventEmitter } from './events';
import { NativeBridge } from '../runtime/bridge';
import { Menu } from './menu';

export interface TrayOptions {
  icon: string;
  title?: string;
  tooltip?: string;
}

export interface TrayIconOptions {
  icon?: string;
  title?: string;
  tooltip?: string;
}

export class Tray extends EventEmitter {
  private handle: number;
  private _icon: string;
  private _title?: string;
  private _tooltip?: string;
  private _contextMenu?: Menu;

  constructor(options: TrayOptions) {
    super();

    this._icon = options.icon;
    this._title = options.title;
    this._tooltip = options.tooltip;

    // Create native tray icon
    this.handle = NativeBridge.createTray({
      icon: this._icon,
      title: this._title,
      tooltip: this._tooltip,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    NativeBridge.onTrayEvent(this.handle, 'click', (event: MouseEvent) => {
      this.emit('click', event);
    });

    NativeBridge.onTrayEvent(this.handle, 'right-click', (event: MouseEvent) => {
      this.emit('right-click', event);
    });

    NativeBridge.onTrayEvent(this.handle, 'double-click', (event: MouseEvent) => {
      this.emit('double-click', event);
    });

    NativeBridge.onTrayEvent(this.handle, 'balloon-show', () => {
      this.emit('balloon-show');
    });

    NativeBridge.onTrayEvent(this.handle, 'balloon-click', () => {
      this.emit('balloon-click');
    });

    NativeBridge.onTrayEvent(this.handle, 'balloon-closed', () => {
      this.emit('balloon-closed');
    });

    NativeBridge.onTrayEvent(this.handle, 'drop-files', (files: string[]) => {
      this.emit('drop-files', files);
    });

    NativeBridge.onTrayEvent(this.handle, 'drop-text', (text: string) => {
      this.emit('drop-text', text);
    });

    NativeBridge.onTrayEvent(this.handle, 'drag-enter', () => {
      this.emit('drag-enter');
    });

    NativeBridge.onTrayEvent(this.handle, 'drag-leave', () => {
      this.emit('drag-leave');
    });

    NativeBridge.onTrayEvent(this.handle, 'drag-end', () => {
      this.emit('drag-end');
    });

    NativeBridge.onTrayEvent(this.handle, 'mouse-enter', (event: MouseEvent) => {
      this.emit('mouse-enter', event);
    });

    NativeBridge.onTrayEvent(this.handle, 'mouse-leave', (event: MouseEvent) => {
      this.emit('mouse-leave', event);
    });

    NativeBridge.onTrayEvent(this.handle, 'mouse-move', (event: MouseEvent) => {
      this.emit('mouse-move', event);
    });
  }

  destroy(): void {
    NativeBridge.destroyTray(this.handle);
    this.removeAllListeners();
  }

  setImage(icon: string): void {
    this._icon = icon;
    NativeBridge.setTrayImage(this.handle, icon);
  }

  setPressedImage(icon: string): void {
    NativeBridge.setTrayPressedImage(this.handle, icon);
  }

  setToolTip(tooltip: string): void {
    this._tooltip = tooltip;
    NativeBridge.setTrayToolTip(this.handle, tooltip);
  }

  setTitle(title: string): void {
    this._title = title;
    NativeBridge.setTrayTitle(this.handle, title);
  }

  setContextMenu(menu: Menu | null): void {
    this._contextMenu = menu || undefined;
    NativeBridge.setTrayContextMenu(this.handle, menu?.handle || 0);
  }

  getContextMenu(): Menu | undefined {
    return this._contextMenu;
  }

  displayBalloon(options: {
    icon?: string;
    title: string;
    content: string;
  }): void {
    NativeBridge.displayTrayBalloon(this.handle, options);
  }

  removeBalloon(): void {
    NativeBridge.removeTrayBalloon(this.handle);
  }

  focus(): void {
    NativeBridge.focusTray(this.handle);
  }

  popUpContextMenu(menu?: Menu, position?: { x: number; y: number }): void {
    const menuHandle = menu?.handle || this._contextMenu?.handle;
    if (menuHandle) {
      NativeBridge.popUpTrayContextMenu(this.handle, menuHandle, position);
    }
  }

  closeContextMenu(): void {
    NativeBridge.closeTrayContextMenu(this.handle);
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return NativeBridge.getTrayBounds(this.handle);
  }

  isDestroyed(): boolean {
    return NativeBridge.isTrayDestroyed(this.handle);
  }
}
