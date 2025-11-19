/**
 * Elide Desktop Framework - Application
 *
 * Main application lifecycle and system integration.
 */

import { EventEmitter } from './events';
import { NativeBridge } from '../runtime/bridge';
import { Window } from './window';
import { Menu } from './menu';

export interface AppInfo {
  name: string;
  version: string;
  productName?: string;
  copyright?: string;
  credits?: string;
  website?: string;
}

export interface LaunchInfo {
  args: string[];
  cwd: string;
}

export interface LoginItemSettings {
  openAtLogin: boolean;
  openAsHidden: boolean;
  path: string;
  args: string[];
}

export class App extends EventEmitter {
  private static instance: App;
  private _isReady: boolean = false;
  private _isQuitting: boolean = false;
  private mainWindow?: Window;

  private constructor() {
    super();
    this.setupEventHandlers();
  }

  static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }

  private setupEventHandlers(): void {
    NativeBridge.onAppEvent('will-finish-launching', () => {
      this.emit('will-finish-launching');
    });

    NativeBridge.onAppEvent('ready', () => {
      this._isReady = true;
      this.emit('ready');
    });

    NativeBridge.onAppEvent('window-all-closed', () => {
      this.emit('window-all-closed');

      // On macOS, apps typically stay open without windows
      if (NativeBridge.getPlatform() !== 'darwin') {
        this.quit();
      }
    });

    NativeBridge.onAppEvent('before-quit', (event: any) => {
      this._isQuitting = true;
      this.emit('before-quit', event);
    });

    NativeBridge.onAppEvent('will-quit', (event: any) => {
      this.emit('will-quit', event);
    });

    NativeBridge.onAppEvent('quit', (event: any, exitCode: number) => {
      this.emit('quit', event, exitCode);
    });

    NativeBridge.onAppEvent('activate', (event: any, hasVisibleWindows: boolean) => {
      this.emit('activate', event, hasVisibleWindows);

      // On macOS, recreate window when dock icon is clicked
      if (NativeBridge.getPlatform() === 'darwin' && !hasVisibleWindows) {
        this.emit('reopen', event, hasVisibleWindows);
      }
    });

    NativeBridge.onAppEvent('open-file', (event: any, path: string) => {
      this.emit('open-file', event, path);
    });

    NativeBridge.onAppEvent('open-url', (event: any, url: string) => {
      this.emit('open-url', event, url);
    });

    NativeBridge.onAppEvent('web-contents-created', (event: any, contents: any) => {
      this.emit('web-contents-created', event, contents);
    });
  }

  // Application lifecycle

  async whenReady(): Promise<void> {
    if (this._isReady) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.once('ready', () => resolve());
    });
  }

  quit(): void {
    NativeBridge.quitApp();
  }

  exit(exitCode: number = 0): void {
    NativeBridge.exitApp(exitCode);
  }

  relaunch(options?: { args?: string[]; execPath?: string }): void {
    NativeBridge.relaunchApp(options);
  }

  isReady(): boolean {
    return this._isReady;
  }

  focus(options?: { steal?: boolean }): void {
    NativeBridge.focusApp(options);
  }

  hide(): void {
    NativeBridge.hideApp();
  }

  show(): void {
    NativeBridge.showApp();
  }

  isHidden(): boolean {
    return NativeBridge.isAppHidden();
  }

  // Application info

  getName(): string {
    return NativeBridge.getAppName();
  }

  setName(name: string): void {
    NativeBridge.setAppName(name);
  }

  getVersion(): string {
    return NativeBridge.getAppVersion();
  }

  getLocale(): string {
    return NativeBridge.getAppLocale();
  }

  getLocaleCountryCode(): string {
    return NativeBridge.getAppLocaleCountryCode();
  }

  getSystemLocale(): string {
    return NativeBridge.getSystemLocale();
  }

  getPreferredSystemLanguages(): string[] {
    return NativeBridge.getPreferredSystemLanguages();
  }

  // Paths

  getPath(name:
    | 'home'
    | 'appData'
    | 'userData'
    | 'cache'
    | 'temp'
    | 'exe'
    | 'module'
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'music'
    | 'pictures'
    | 'videos'
    | 'recent'
    | 'logs'
    | 'crashDumps'
  ): string {
    return NativeBridge.getAppPath(name);
  }

  setPath(name: string, path: string): void {
    NativeBridge.setAppPath(name, path);
  }

  getAppPath(): string {
    return NativeBridge.getAppPath('exe');
  }

  // Login items (auto-start)

  setLoginItemSettings(settings: Partial<LoginItemSettings>): void {
    NativeBridge.setLoginItemSettings(settings);
  }

  getLoginItemSettings(options?: { path?: string; args?: string[] }): LoginItemSettings {
    return NativeBridge.getLoginItemSettings(options);
  }

  // Dock (macOS)

  dock = {
    bounce: (type: 'critical' | 'informational' = 'informational'): number => {
      return NativeBridge.dockBounce(type);
    },

    cancelBounce: (id: number): void => {
      NativeBridge.dockCancelBounce(id);
    },

    downloadFinished: (filePath: string): void => {
      NativeBridge.dockDownloadFinished(filePath);
    },

    setBadge: (text: string): void => {
      NativeBridge.dockSetBadge(text);
    },

    getBadge: (): string => {
      return NativeBridge.dockGetBadge();
    },

    hide: (): void => {
      NativeBridge.dockHide();
    },

    show: (): Promise<void> => {
      return NativeBridge.dockShow();
    },

    isVisible: (): boolean => {
      return NativeBridge.dockIsVisible();
    },

    setMenu: (menu: Menu): void => {
      NativeBridge.dockSetMenu(menu.handle);
    },

    getMenu: (): Menu | null => {
      const handle = NativeBridge.dockGetMenu();
      return handle ? { handle } as Menu : null;
    },

    setIcon: (icon: string): void => {
      NativeBridge.dockSetIcon(icon);
    },
  };

  // Notifications

  isNotificationSupported(): boolean {
    return NativeBridge.isNotificationSupported();
  }

  // Power monitoring

  getSystemIdleState(idleThreshold: number): 'active' | 'idle' | 'locked' {
    return NativeBridge.getSystemIdleState(idleThreshold);
  }

  getSystemIdleTime(): number {
    return NativeBridge.getSystemIdleTime();
  }

  // GPU info

  getGPUFeatureStatus(): any {
    return NativeBridge.getGPUFeatureStatus();
  }

  async getGPUInfo(infoType: 'basic' | 'complete'): Promise<any> {
    return NativeBridge.getGPUInfo(infoType);
  }

  // Metrics

  getAppMetrics(): any[] {
    return NativeBridge.getAppMetrics();
  }

  // Accessibility

  setAccessibilitySupportEnabled(enabled: boolean): void {
    NativeBridge.setAccessibilitySupportEnabled(enabled);
  }

  isAccessibilitySupportEnabled(): boolean {
    return NativeBridge.isAccessibilitySupportEnabled();
  }

  // Badge count

  setBadgeCount(count: number): boolean {
    return NativeBridge.setAppBadgeCount(count);
  }

  getBadgeCount(): number {
    return NativeBridge.getAppBadgeCount();
  }

  // User tasks (Windows)

  setUserTasks(tasks: Array<{
    program: string;
    arguments: string;
    title: string;
    description: string;
    iconPath: string;
    iconIndex?: number;
  }>): boolean {
    return NativeBridge.setUserTasks(tasks);
  }

  // JumpList (Windows)

  setJumpList(categories: any[] | null): void {
    NativeBridge.setJumpList(categories);
  }

  // Main window management

  setMainWindow(window: Window): void {
    this.mainWindow = window;
  }

  getMainWindow(): Window | undefined {
    return this.mainWindow;
  }
}

// Export singleton instance
export const app = App.getInstance();
