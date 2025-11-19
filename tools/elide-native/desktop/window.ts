/**
 * Elide Desktop Framework - Window Management
 *
 * Cross-platform native window management with advanced features.
 * Compiles to native binaries with zero overhead.
 */

import { EventEmitter } from './events';
import { NativeBridge } from '../runtime/bridge';

export interface WindowOptions {
  title?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  x?: number;
  y?: number;
  resizable?: boolean;
  movable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  alwaysOnTop?: boolean;
  fullscreen?: boolean;
  frame?: boolean;
  transparent?: boolean;
  backgroundColor?: string;
  icon?: string;
  show?: boolean;
  center?: boolean;
  skipTaskbar?: boolean;
  kiosk?: boolean;
  parent?: Window;
  modal?: boolean;
  webPreferences?: {
    devTools?: boolean;
    nodeIntegration?: boolean;
    contextIsolation?: boolean;
    sandbox?: boolean;
  };
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Display {
  id: number;
  bounds: WindowBounds;
  workArea: WindowBounds;
  scaleFactor: number;
  rotation: number;
  internal: boolean;
}

export class Window extends EventEmitter {
  private handle: number;
  private _title: string;
  private _bounds: WindowBounds;
  private _isVisible: boolean = false;
  private _isMinimized: boolean = false;
  private _isMaximized: boolean = false;
  private _isFullscreen: boolean = false;
  private _isFocused: boolean = false;
  private _isDestroyed: boolean = false;
  private children: Set<Window> = new Set();

  constructor(options: WindowOptions = {}) {
    super();

    const defaultOptions: WindowOptions = {
      title: 'Elide App',
      width: 800,
      height: 600,
      resizable: true,
      movable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      frame: true,
      show: true,
      center: false,
      backgroundColor: '#ffffff',
      webPreferences: {
        devTools: false,
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: true,
      },
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Create native window handle
    this.handle = NativeBridge.createWindow(mergedOptions);
    this._title = mergedOptions.title!;
    this._bounds = {
      x: mergedOptions.x || 0,
      y: mergedOptions.y || 0,
      width: mergedOptions.width!,
      height: mergedOptions.height!,
    };

    if (mergedOptions.center) {
      this.center();
    }

    if (mergedOptions.show) {
      this.show();
    }

    // Set up native event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    NativeBridge.onWindowEvent(this.handle, 'close', () => {
      this.emit('close');
    });

    NativeBridge.onWindowEvent(this.handle, 'closed', () => {
      this._isDestroyed = true;
      this.emit('closed');
    });

    NativeBridge.onWindowEvent(this.handle, 'ready-to-show', () => {
      this.emit('ready-to-show');
    });

    NativeBridge.onWindowEvent(this.handle, 'blur', () => {
      this._isFocused = false;
      this.emit('blur');
    });

    NativeBridge.onWindowEvent(this.handle, 'focus', () => {
      this._isFocused = true;
      this.emit('focus');
    });

    NativeBridge.onWindowEvent(this.handle, 'show', () => {
      this._isVisible = true;
      this.emit('show');
    });

    NativeBridge.onWindowEvent(this.handle, 'hide', () => {
      this._isVisible = false;
      this.emit('hide');
    });

    NativeBridge.onWindowEvent(this.handle, 'minimize', () => {
      this._isMinimized = true;
      this.emit('minimize');
    });

    NativeBridge.onWindowEvent(this.handle, 'maximize', () => {
      this._isMaximized = true;
      this.emit('maximize');
    });

    NativeBridge.onWindowEvent(this.handle, 'unmaximize', () => {
      this._isMaximized = false;
      this.emit('unmaximize');
    });

    NativeBridge.onWindowEvent(this.handle, 'restore', () => {
      this._isMinimized = false;
      this.emit('restore');
    });

    NativeBridge.onWindowEvent(this.handle, 'resize', (bounds: WindowBounds) => {
      this._bounds = bounds;
      this.emit('resize', bounds);
    });

    NativeBridge.onWindowEvent(this.handle, 'move', (bounds: WindowBounds) => {
      this._bounds = bounds;
      this.emit('move', bounds);
    });

    NativeBridge.onWindowEvent(this.handle, 'enter-fullscreen', () => {
      this._isFullscreen = true;
      this.emit('enter-fullscreen');
    });

    NativeBridge.onWindowEvent(this.handle, 'leave-fullscreen', () => {
      this._isFullscreen = false;
      this.emit('leave-fullscreen');
    });
  }

  // Window control methods

  show(): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.showWindow(this.handle);
    this._isVisible = true;
  }

  hide(): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.hideWindow(this.handle);
    this._isVisible = false;
  }

  close(): void {
    if (this._isDestroyed) return;
    NativeBridge.closeWindow(this.handle);
  }

  destroy(): void {
    if (this._isDestroyed) return;

    // Close all children first
    for (const child of this.children) {
      child.destroy();
    }

    NativeBridge.destroyWindow(this.handle);
    this._isDestroyed = true;
    this.removeAllListeners();
  }

  focus(): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.focusWindow(this.handle);
  }

  blur(): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.blurWindow(this.handle);
  }

  minimize(): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.minimizeWindow(this.handle);
  }

  maximize(): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.maximizeWindow(this.handle);
  }

  unmaximize(): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.unmaximizeWindow(this.handle);
  }

  restore(): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.restoreWindow(this.handle);
  }

  setFullscreen(fullscreen: boolean): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.setWindowFullscreen(this.handle, fullscreen);
    this._isFullscreen = fullscreen;
  }

  // Window properties

  setTitle(title: string): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    this._title = title;
    NativeBridge.setWindowTitle(this.handle, title);
  }

  getTitle(): string {
    return this._title;
  }

  setBounds(bounds: Partial<WindowBounds>, animate: boolean = false): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    const newBounds = { ...this._bounds, ...bounds };
    NativeBridge.setWindowBounds(this.handle, newBounds, animate);
    this._bounds = newBounds;
  }

  getBounds(): WindowBounds {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    return NativeBridge.getWindowBounds(this.handle);
  }

  setSize(width: number, height: number, animate: boolean = false): void {
    this.setBounds({ width, height }, animate);
  }

  getSize(): [number, number] {
    const bounds = this.getBounds();
    return [bounds.width, bounds.height];
  }

  setMinimumSize(width: number, height: number): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.setWindowMinimumSize(this.handle, width, height);
  }

  setMaximumSize(width: number, height: number): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.setWindowMaximumSize(this.handle, width, height);
  }

  setPosition(x: number, y: number, animate: boolean = false): void {
    this.setBounds({ x, y }, animate);
  }

  getPosition(): [number, number] {
    const bounds = this.getBounds();
    return [bounds.x, bounds.y];
  }

  center(): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    const display = this.getDisplay();
    const bounds = this.getBounds();

    const x = Math.floor(display.workArea.x + (display.workArea.width - bounds.width) / 2);
    const y = Math.floor(display.workArea.y + (display.workArea.height - bounds.height) / 2);

    this.setPosition(x, y);
  }

  setResizable(resizable: boolean): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.setWindowResizable(this.handle, resizable);
  }

  setMovable(movable: boolean): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.setWindowMovable(this.handle, movable);
  }

  setMinimizable(minimizable: boolean): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.setWindowMinimizable(this.handle, minimizable);
  }

  setMaximizable(maximizable: boolean): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.setWindowMaximizable(this.handle, maximizable);
  }

  setClosable(closable: boolean): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.setWindowClosable(this.handle, closable);
  }

  setAlwaysOnTop(alwaysOnTop: boolean, level?: 'normal' | 'floating' | 'modal-panel' | 'main-menu' | 'status' | 'pop-up-menu' | 'screen-saver'): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.setWindowAlwaysOnTop(this.handle, alwaysOnTop, level);
  }

  setOpacity(opacity: number): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    if (opacity < 0 || opacity > 1) {
      throw new Error('Opacity must be between 0 and 1');
    }
    NativeBridge.setWindowOpacity(this.handle, opacity);
  }

  // State queries

  isVisible(): boolean {
    return this._isVisible;
  }

  isMinimized(): boolean {
    return this._isMinimized;
  }

  isMaximized(): boolean {
    return this._isMaximized;
  }

  isFullscreen(): boolean {
    return this._isFullscreen;
  }

  isFocused(): boolean {
    return this._isFocused;
  }

  isDestroyed(): boolean {
    return this._isDestroyed;
  }

  // Display information

  getDisplay(): Display {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    return NativeBridge.getWindowDisplay(this.handle);
  }

  static getAllDisplays(): Display[] {
    return NativeBridge.getAllDisplays();
  }

  static getPrimaryDisplay(): Display {
    return NativeBridge.getPrimaryDisplay();
  }

  // Content loading

  loadURL(url: string): Promise<void> {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    return NativeBridge.loadWindowURL(this.handle, url);
  }

  loadFile(filePath: string): Promise<void> {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    return NativeBridge.loadWindowFile(this.handle, filePath);
  }

  loadHTML(html: string): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.loadWindowHTML(this.handle, html);
  }

  reload(): void {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    NativeBridge.reloadWindow(this.handle);
  }

  // Screenshot and capture

  async capturePage(): Promise<Uint8Array> {
    if (this._isDestroyed) throw new Error('Window is destroyed');
    return NativeBridge.captureWindowPage(this.handle);
  }

  // Child windows

  addChild(window: Window): void {
    this.children.add(window);
    NativeBridge.setWindowParent(window.handle, this.handle);
  }

  removeChild(window: Window): void {
    this.children.delete(window);
    NativeBridge.setWindowParent(window.handle, 0);
  }

  getChildren(): Window[] {
    return Array.from(this.children);
  }
}
