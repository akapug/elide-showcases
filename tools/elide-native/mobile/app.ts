/**
 * Elide Mobile Framework - Application
 *
 * Cross-platform mobile application framework for iOS and Android.
 * Compiles TypeScript to native mobile binaries.
 */

import { EventEmitter } from '../desktop/events';
import { NativeBridge } from '../runtime/bridge';

export interface MobileAppConfig {
  appName: string;
  appId: string;
  version: string;
  orientation?: 'portrait' | 'landscape' | 'auto';
  statusBar?: {
    hidden?: boolean;
    style?: 'light' | 'dark';
    backgroundColor?: string;
  };
  splashScreen?: {
    image: string;
    backgroundColor?: string;
    duration?: number;
  };
  permissions?: string[];
  ios?: {
    bundleId: string;
    teamId?: string;
    deploymentTarget?: string;
  };
  android?: {
    packageName: string;
    minSdkVersion?: number;
    targetSdkVersion?: number;
    compileSdkVersion?: number;
  };
}

export interface AppState {
  active: boolean;
  background: boolean;
  inactive: boolean;
}

export class MobileApp extends EventEmitter {
  private static instance: MobileApp;
  private config: MobileAppConfig;
  private appState: AppState = {
    active: true,
    background: false,
    inactive: false,
  };

  private constructor(config: MobileAppConfig) {
    super();
    this.config = config;
    this.setupEventHandlers();
    this.initialize();
  }

  static create(config: MobileAppConfig): MobileApp {
    if (!MobileApp.instance) {
      MobileApp.instance = new MobileApp(config);
    }
    return MobileApp.instance;
  }

  static getInstance(): MobileApp {
    if (!MobileApp.instance) {
      throw new Error('MobileApp not initialized. Call MobileApp.create() first.');
    }
    return MobileApp.instance;
  }

  private setupEventHandlers(): void {
    NativeBridge.onMobileEvent('appDidFinishLaunching', () => {
      this.emit('ready');
    });

    NativeBridge.onMobileEvent('appWillEnterForeground', () => {
      this.appState = { active: false, background: false, inactive: true };
      this.emit('foreground');
    });

    NativeBridge.onMobileEvent('appDidBecomeActive', () => {
      this.appState = { active: true, background: false, inactive: false };
      this.emit('active');
    });

    NativeBridge.onMobileEvent('appWillResignActive', () => {
      this.appState = { active: false, background: false, inactive: true };
      this.emit('inactive');
    });

    NativeBridge.onMobileEvent('appDidEnterBackground', () => {
      this.appState = { active: false, background: true, inactive: false };
      this.emit('background');
    });

    NativeBridge.onMobileEvent('appWillTerminate', () => {
      this.emit('terminate');
    });

    NativeBridge.onMobileEvent('memoryWarning', () => {
      this.emit('memory-warning');
    });

    NativeBridge.onMobileEvent('openURL', (url: string) => {
      this.emit('open-url', url);
    });

    NativeBridge.onMobileEvent('continueUserActivity', (activity: any) => {
      this.emit('continue-activity', activity);
    });
  }

  private initialize(): void {
    // Initialize native mobile runtime
    NativeBridge.initializeMobileApp(this.config);

    // Configure status bar
    if (this.config.statusBar) {
      this.setStatusBarStyle(this.config.statusBar.style || 'dark');
      if (this.config.statusBar.hidden) {
        this.hideStatusBar();
      }
    }

    // Configure orientation
    if (this.config.orientation) {
      this.setOrientation(this.config.orientation);
    }

    // Request permissions
    if (this.config.permissions) {
      this.requestPermissions(this.config.permissions);
    }
  }

  getAppState(): AppState {
    return { ...this.appState };
  }

  isActive(): boolean {
    return this.appState.active;
  }

  isBackground(): boolean {
    return this.appState.background;
  }

  getConfig(): MobileAppConfig {
    return { ...this.config };
  }

  getPlatform(): 'ios' | 'android' {
    return NativeBridge.getMobilePlatform();
  }

  getVersion(): string {
    return this.config.version;
  }

  getBuildNumber(): string {
    return NativeBridge.getAppBuildNumber();
  }

  getBundleId(): string {
    const platform = this.getPlatform();
    return platform === 'ios' ? this.config.ios!.bundleId : this.config.android!.packageName;
  }

  // Status bar control

  setStatusBarStyle(style: 'light' | 'dark'): void {
    NativeBridge.setStatusBarStyle(style);
  }

  hideStatusBar(animated: boolean = true): void {
    NativeBridge.hideStatusBar(animated);
  }

  showStatusBar(animated: boolean = true): void {
    NativeBridge.showStatusBar(animated);
  }

  setStatusBarBackgroundColor(color: string): void {
    if (this.getPlatform() === 'android') {
      NativeBridge.setStatusBarBackgroundColor(color);
    }
  }

  // Orientation control

  setOrientation(orientation: 'portrait' | 'landscape' | 'auto'): void {
    NativeBridge.setOrientation(orientation);
  }

  getOrientation(): 'portrait' | 'landscape' {
    return NativeBridge.getOrientation();
  }

  lockOrientation(orientation: 'portrait' | 'landscape'): void {
    NativeBridge.lockOrientation(orientation);
  }

  unlockOrientation(): void {
    NativeBridge.unlockOrientation();
  }

  // Permission handling

  async requestPermissions(permissions: string[]): Promise<{ [key: string]: boolean }> {
    return NativeBridge.requestPermissions(permissions);
  }

  async checkPermission(permission: string): Promise<boolean> {
    return NativeBridge.checkPermission(permission);
  }

  async requestPermission(permission: string): Promise<boolean> {
    return NativeBridge.requestPermission(permission);
  }

  openSettings(): void {
    NativeBridge.openAppSettings();
  }

  // Deep linking

  registerDeepLink(scheme: string): void {
    NativeBridge.registerDeepLinkScheme(scheme);
  }

  openURL(url: string): Promise<boolean> {
    return NativeBridge.openURL(url);
  }

  canOpenURL(url: string): Promise<boolean> {
    return NativeBridge.canOpenURL(url);
  }

  // Haptics

  hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): void {
    NativeBridge.triggerHapticFeedback(type);
  }

  // App badge (iOS)

  setBadgeCount(count: number): void {
    if (this.getPlatform() === 'ios') {
      NativeBridge.setAppBadgeCount(count);
    }
  }

  getBadgeCount(): number {
    if (this.getPlatform() === 'ios') {
      return NativeBridge.getAppBadgeCount();
    }
    return 0;
  }

  // Keyboard

  dismissKeyboard(): void {
    NativeBridge.dismissKeyboard();
  }

  // Screen

  keepScreenOn(enabled: boolean): void {
    NativeBridge.keepScreenOn(enabled);
  }

  getScreenBrightness(): Promise<number> {
    return NativeBridge.getScreenBrightness();
  }

  setScreenBrightness(brightness: number): Promise<void> {
    if (brightness < 0 || brightness > 1) {
      throw new Error('Brightness must be between 0 and 1');
    }
    return NativeBridge.setScreenBrightness(brightness);
  }

  // Safe area (for notched devices)

  getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    return NativeBridge.getSafeAreaInsets();
  }

  // App review

  requestReview(): Promise<void> {
    return NativeBridge.requestAppReview();
  }

  // Share

  async share(options: {
    title?: string;
    message?: string;
    url?: string;
    subject?: string;
  }): Promise<{ success: boolean }> {
    return NativeBridge.share(options);
  }

  // Exit

  exit(): void {
    NativeBridge.exitApp();
  }
}
