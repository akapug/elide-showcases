/**
 * Elide Native Runtime - Bridge to Native OS APIs
 *
 * Low-level bridge between TypeScript and native OS functionality.
 * This is implemented in native code and provides the foundation for all native features.
 */

/**
 * NativeBridge is the core interface to native OS functionality.
 * In production, this is implemented by Elide's native runtime.
 * This file provides TypeScript type definitions and documentation.
 */
export class NativeBridge {
  // Platform Information

  static getPlatform(): 'darwin' | 'win32' | 'linux' | 'ios' | 'android' {
    return (globalThis as any).__elide_platform;
  }

  static getArchitecture(): 'x64' | 'arm64' | 'arm' | 'x86' {
    return (globalThis as any).__elide_arch;
  }

  static getMobilePlatform(): 'ios' | 'android' {
    return (globalThis as any).__elide_mobile_platform;
  }

  // Window Management (Desktop)

  static createWindow(options: any): number {
    return (globalThis as any).__elide_createWindow(options);
  }

  static showWindow(handle: number): void {
    (globalThis as any).__elide_showWindow(handle);
  }

  static hideWindow(handle: number): void {
    (globalThis as any).__elide_hideWindow(handle);
  }

  static closeWindow(handle: number): void {
    (globalThis as any).__elide_closeWindow(handle);
  }

  static destroyWindow(handle: number): void {
    (globalThis as any).__elide_destroyWindow(handle);
  }

  static focusWindow(handle: number): void {
    (globalThis as any).__elide_focusWindow(handle);
  }

  static blurWindow(handle: number): void {
    (globalThis as any).__elide_blurWindow(handle);
  }

  static minimizeWindow(handle: number): void {
    (globalThis as any).__elide_minimizeWindow(handle);
  }

  static maximizeWindow(handle: number): void {
    (globalThis as any).__elide_maximizeWindow(handle);
  }

  static unmaximizeWindow(handle: number): void {
    (globalThis as any).__elide_unmaximizeWindow(handle);
  }

  static restoreWindow(handle: number): void {
    (globalThis as any).__elide_restoreWindow(handle);
  }

  static setWindowFullscreen(handle: number, fullscreen: boolean): void {
    (globalThis as any).__elide_setWindowFullscreen(handle, fullscreen);
  }

  static setWindowTitle(handle: number, title: string): void {
    (globalThis as any).__elide_setWindowTitle(handle, title);
  }

  static setWindowBounds(handle: number, bounds: any, animate: boolean): void {
    (globalThis as any).__elide_setWindowBounds(handle, bounds, animate);
  }

  static getWindowBounds(handle: number): any {
    return (globalThis as any).__elide_getWindowBounds(handle);
  }

  static setWindowMinimumSize(handle: number, width: number, height: number): void {
    (globalThis as any).__elide_setWindowMinimumSize(handle, width, height);
  }

  static setWindowMaximumSize(handle: number, width: number, height: number): void {
    (globalThis as any).__elide_setWindowMaximumSize(handle, width, height);
  }

  static setWindowResizable(handle: number, resizable: boolean): void {
    (globalThis as any).__elide_setWindowResizable(handle, resizable);
  }

  static setWindowMovable(handle: number, movable: boolean): void {
    (globalThis as any).__elide_setWindowMovable(handle, movable);
  }

  static setWindowMinimizable(handle: number, minimizable: boolean): void {
    (globalThis as any).__elide_setWindowMinimizable(handle, minimizable);
  }

  static setWindowMaximizable(handle: number, maximizable: boolean): void {
    (globalThis as any).__elide_setWindowMaximizable(handle, maximizable);
  }

  static setWindowClosable(handle: number, closable: boolean): void {
    (globalThis as any).__elide_setWindowClosable(handle, closable);
  }

  static setWindowAlwaysOnTop(handle: number, alwaysOnTop: boolean, level?: string): void {
    (globalThis as any).__elide_setWindowAlwaysOnTop(handle, alwaysOnTop, level);
  }

  static setWindowOpacity(handle: number, opacity: number): void {
    (globalThis as any).__elide_setWindowOpacity(handle, opacity);
  }

  static getWindowDisplay(handle: number): any {
    return (globalThis as any).__elide_getWindowDisplay(handle);
  }

  static getAllDisplays(): any[] {
    return (globalThis as any).__elide_getAllDisplays();
  }

  static getPrimaryDisplay(): any {
    return (globalThis as any).__elide_getPrimaryDisplay();
  }

  static loadWindowURL(handle: number, url: string): Promise<void> {
    return (globalThis as any).__elide_loadWindowURL(handle, url);
  }

  static loadWindowFile(handle: number, filePath: string): Promise<void> {
    return (globalThis as any).__elide_loadWindowFile(handle, filePath);
  }

  static loadWindowHTML(handle: number, html: string): void {
    (globalThis as any).__elide_loadWindowHTML(handle, html);
  }

  static reloadWindow(handle: number): void {
    (globalThis as any).__elide_reloadWindow(handle);
  }

  static captureWindowPage(handle: number): Promise<Uint8Array> {
    return (globalThis as any).__elide_captureWindowPage(handle);
  }

  static setWindowParent(handle: number, parentHandle: number): void {
    (globalThis as any).__elide_setWindowParent(handle, parentHandle);
  }

  static onWindowEvent(handle: number, event: string, callback: (...args: any[]) => void): void {
    (globalThis as any).__elide_onWindowEvent(handle, event, callback);
  }

  // Menu Management

  static createMenu(): number {
    return (globalThis as any).__elide_createMenu();
  }

  static createMenuItem(options: any): number {
    return (globalThis as any).__elide_createMenuItem(options);
  }

  static appendMenuItem(menuHandle: number, itemHandle: number): void {
    (globalThis as any).__elide_appendMenuItem(menuHandle, itemHandle);
  }

  static insertMenuItem(menuHandle: number, position: number, itemHandle: number): void {
    (globalThis as any).__elide_insertMenuItem(menuHandle, position, itemHandle);
  }

  static removeMenuItem(menuHandle: number, itemHandle: number): void {
    (globalThis as any).__elide_removeMenuItem(menuHandle, itemHandle);
  }

  static setMenuItemEnabled(handle: number, enabled: boolean): void {
    (globalThis as any).__elide_setMenuItemEnabled(handle, enabled);
  }

  static setMenuItemVisible(handle: number, visible: boolean): void {
    (globalThis as any).__elide_setMenuItemVisible(handle, visible);
  }

  static setMenuItemChecked(handle: number, checked: boolean): void {
    (globalThis as any).__elide_setMenuItemChecked(handle, checked);
  }

  static setMenuItemLabel(handle: number, label: string): void {
    (globalThis as any).__elide_setMenuItemLabel(handle, label);
  }

  static onMenuItemClick(handle: number, callback: (window: any, event: any) => void): void {
    (globalThis as any).__elide_onMenuItemClick(handle, callback);
  }

  static popupMenu(menuHandle: number, windowHandle?: number, options?: any): void {
    (globalThis as any).__elide_popupMenu(menuHandle, windowHandle, options);
  }

  static closePopupMenu(menuHandle: number, windowHandle?: number): void {
    (globalThis as any).__elide_closePopupMenu(menuHandle, windowHandle);
  }

  static setApplicationMenu(menuHandle: number): void {
    (globalThis as any).__elide_setApplicationMenu(menuHandle);
  }

  static getApplicationMenu(): number {
    return (globalThis as any).__elide_getApplicationMenu();
  }

  // System Tray

  static createTray(options: any): number {
    return (globalThis as any).__elide_createTray(options);
  }

  static destroyTray(handle: number): void {
    (globalThis as any).__elide_destroyTray(handle);
  }

  static setTrayImage(handle: number, icon: string): void {
    (globalThis as any).__elide_setTrayImage(handle, icon);
  }

  static setTrayPressedImage(handle: number, icon: string): void {
    (globalThis as any).__elide_setTrayPressedImage(handle, icon);
  }

  static setTrayToolTip(handle: number, tooltip: string): void {
    (globalThis as any).__elide_setTrayToolTip(handle, tooltip);
  }

  static setTrayTitle(handle: number, title: string): void {
    (globalThis as any).__elide_setTrayTitle(handle, title);
  }

  static setTrayContextMenu(handle: number, menuHandle: number): void {
    (globalThis as any).__elide_setTrayContextMenu(handle, menuHandle);
  }

  static displayTrayBalloon(handle: number, options: any): void {
    (globalThis as any).__elide_displayTrayBalloon(handle, options);
  }

  static removeTrayBalloon(handle: number): void {
    (globalThis as any).__elide_removeTrayBalloon(handle);
  }

  static focusTray(handle: number): void {
    (globalThis as any).__elide_focusTray(handle);
  }

  static popUpTrayContextMenu(handle: number, menuHandle: number, position?: any): void {
    (globalThis as any).__elide_popUpTrayContextMenu(handle, menuHandle, position);
  }

  static closeTrayContextMenu(handle: number): void {
    (globalThis as any).__elide_closeTrayContextMenu(handle);
  }

  static getTrayBounds(handle: number): any {
    return (globalThis as any).__elide_getTrayBounds(handle);
  }

  static isTrayDestroyed(handle: number): boolean {
    return (globalThis as any).__elide_isTrayDestroyed(handle);
  }

  static onTrayEvent(handle: number, event: string, callback: (...args: any[]) => void): void {
    (globalThis as any).__elide_onTrayEvent(handle, event, callback);
  }

  // Dialogs

  static showOpenDialog(windowHandle: number | undefined, options: any): Promise<any> {
    return (globalThis as any).__elide_showOpenDialog(windowHandle, options);
  }

  static showOpenDialogSync(windowHandle: number | undefined, options: any): string[] {
    return (globalThis as any).__elide_showOpenDialogSync(windowHandle, options);
  }

  static showSaveDialog(windowHandle: number | undefined, options: any): Promise<any> {
    return (globalThis as any).__elide_showSaveDialog(windowHandle, options);
  }

  static showSaveDialogSync(windowHandle: number | undefined, options: any): string | undefined {
    return (globalThis as any).__elide_showSaveDialogSync(windowHandle, options);
  }

  static showMessageBox(windowHandle: number | undefined, options: any): Promise<any> {
    return (globalThis as any).__elide_showMessageBox(windowHandle, options);
  }

  static showMessageBoxSync(windowHandle: number | undefined, options: any): number {
    return (globalThis as any).__elide_showMessageBoxSync(windowHandle, options);
  }

  static showErrorBox(title: string, content: string): Promise<void> {
    return (globalThis as any).__elide_showErrorBox(title, content);
  }

  static showCertificateTrustDialog(windowHandle: number | undefined, options: any): Promise<void> {
    return (globalThis as any).__elide_showCertificateTrustDialog(windowHandle, options);
  }

  // Application Lifecycle

  static onAppEvent(event: string, callback: (...args: any[]) => void): void {
    (globalThis as any).__elide_onAppEvent(event, callback);
  }

  static quitApp(): void {
    (globalThis as any).__elide_quitApp();
  }

  static exitApp(exitCode: number): void {
    (globalThis as any).__elide_exitApp(exitCode);
  }

  static relaunchApp(options?: any): void {
    (globalThis as any).__elide_relaunchApp(options);
  }

  static focusApp(options?: any): void {
    (globalThis as any).__elide_focusApp(options);
  }

  static hideApp(): void {
    (globalThis as any).__elide_hideApp();
  }

  static showApp(): void {
    (globalThis as any).__elide_showApp();
  }

  static isAppHidden(): boolean {
    return (globalThis as any).__elide_isAppHidden();
  }

  static getAppName(): string {
    return (globalThis as any).__elide_getAppName();
  }

  static setAppName(name: string): void {
    (globalThis as any).__elide_setAppName(name);
  }

  static getAppVersion(): string {
    return (globalThis as any).__elide_getAppVersion();
  }

  static getAppLocale(): string {
    return (globalThis as any).__elide_getAppLocale();
  }

  static getAppLocaleCountryCode(): string {
    return (globalThis as any).__elide_getAppLocaleCountryCode();
  }

  static getSystemLocale(): string {
    return (globalThis as any).__elide_getSystemLocale();
  }

  static getPreferredSystemLanguages(): string[] {
    return (globalThis as any).__elide_getPreferredSystemLanguages();
  }

  static getAppPath(name: string): string {
    return (globalThis as any).__elide_getAppPath(name);
  }

  static setAppPath(name: string, path: string): void {
    (globalThis as any).__elide_setAppPath(name, path);
  }

  static setLoginItemSettings(settings: any): void {
    (globalThis as any).__elide_setLoginItemSettings(settings);
  }

  static getLoginItemSettings(options?: any): any {
    return (globalThis as any).__elide_getLoginItemSettings(options);
  }

  static dockBounce(type: string): number {
    return (globalThis as any).__elide_dockBounce(type);
  }

  static dockCancelBounce(id: number): void {
    (globalThis as any).__elide_dockCancelBounce(id);
  }

  static dockDownloadFinished(filePath: string): void {
    (globalThis as any).__elide_dockDownloadFinished(filePath);
  }

  static dockSetBadge(text: string): void {
    (globalThis as any).__elide_dockSetBadge(text);
  }

  static dockGetBadge(): string {
    return (globalThis as any).__elide_dockGetBadge();
  }

  static dockHide(): void {
    (globalThis as any).__elide_dockHide();
  }

  static dockShow(): Promise<void> {
    return (globalThis as any).__elide_dockShow();
  }

  static dockIsVisible(): boolean {
    return (globalThis as any).__elide_dockIsVisible();
  }

  static dockSetMenu(menuHandle: number): void {
    (globalThis as any).__elide_dockSetMenu(menuHandle);
  }

  static dockGetMenu(): number {
    return (globalThis as any).__elide_dockGetMenu();
  }

  static dockSetIcon(icon: string): void {
    (globalThis as any).__elide_dockSetIcon(icon);
  }

  static isNotificationSupported(): boolean {
    return (globalThis as any).__elide_isNotificationSupported();
  }

  static getSystemIdleState(threshold: number): string {
    return (globalThis as any).__elide_getSystemIdleState(threshold);
  }

  static getSystemIdleTime(): number {
    return (globalThis as any).__elide_getSystemIdleTime();
  }

  static getGPUFeatureStatus(): any {
    return (globalThis as any).__elide_getGPUFeatureStatus();
  }

  static getGPUInfo(infoType: string): Promise<any> {
    return (globalThis as any).__elide_getGPUInfo(infoType);
  }

  static getAppMetrics(): any[] {
    return (globalThis as any).__elide_getAppMetrics();
  }

  static setAccessibilitySupportEnabled(enabled: boolean): void {
    (globalThis as any).__elide_setAccessibilitySupportEnabled(enabled);
  }

  static isAccessibilitySupportEnabled(): boolean {
    return (globalThis as any).__elide_isAccessibilitySupportEnabled();
  }

  static setAppBadgeCount(count: number): boolean {
    return (globalThis as any).__elide_setAppBadgeCount(count);
  }

  static getAppBadgeCount(): number {
    return (globalThis as any).__elide_getAppBadgeCount();
  }

  static setUserTasks(tasks: any[]): boolean {
    return (globalThis as any).__elide_setUserTasks(tasks);
  }

  static setJumpList(categories: any[] | null): void {
    (globalThis as any).__elide_setJumpList(categories);
  }

  // Mobile APIs

  static initializeMobileApp(config: any): void {
    (globalThis as any).__elide_initializeMobileApp(config);
  }

  static onMobileEvent(event: string, callback: (...args: any[]) => void): void {
    (globalThis as any).__elide_onMobileEvent(event, callback);
  }

  static setStatusBarStyle(style: string): void {
    (globalThis as any).__elide_setStatusBarStyle(style);
  }

  static hideStatusBar(animated: boolean): void {
    (globalThis as any).__elide_hideStatusBar(animated);
  }

  static showStatusBar(animated: boolean): void {
    (globalThis as any).__elide_showStatusBar(animated);
  }

  static setStatusBarBackgroundColor(color: string): void {
    (globalThis as any).__elide_setStatusBarBackgroundColor(color);
  }

  static setOrientation(orientation: string): void {
    (globalThis as any).__elide_setOrientation(orientation);
  }

  static getOrientation(): string {
    return (globalThis as any).__elide_getOrientation();
  }

  static lockOrientation(orientation: string): void {
    (globalThis as any).__elide_lockOrientation(orientation);
  }

  static unlockOrientation(): void {
    (globalThis as any).__elide_unlockOrientation();
  }

  static requestPermissions(permissions: string[]): Promise<any> {
    return (globalThis as any).__elide_requestPermissions(permissions);
  }

  static checkPermission(permission: string): Promise<boolean> {
    return (globalThis as any).__elide_checkPermission(permission);
  }

  static requestPermission(permission: string): Promise<boolean> {
    return (globalThis as any).__elide_requestPermission(permission);
  }

  static openAppSettings(): void {
    (globalThis as any).__elide_openAppSettings();
  }

  static registerDeepLinkScheme(scheme: string): void {
    (globalThis as any).__elide_registerDeepLinkScheme(scheme);
  }

  static openURL(url: string): Promise<boolean> {
    return (globalThis as any).__elide_openURL(url);
  }

  static canOpenURL(url: string): Promise<boolean> {
    return (globalThis as any).__elide_canOpenURL(url);
  }

  static triggerHapticFeedback(type: string): void {
    (globalThis as any).__elide_triggerHapticFeedback(type);
  }

  static dismissKeyboard(): void {
    (globalThis as any).__elide_dismissKeyboard();
  }

  static keepScreenOn(enabled: boolean): void {
    (globalThis as any).__elide_keepScreenOn(enabled);
  }

  static getScreenBrightness(): Promise<number> {
    return (globalThis as any).__elide_getScreenBrightness();
  }

  static setScreenBrightness(brightness: number): Promise<void> {
    return (globalThis as any).__elide_setScreenBrightness(brightness);
  }

  static getSafeAreaInsets(): any {
    return (globalThis as any).__elide_getSafeAreaInsets();
  }

  static requestAppReview(): Promise<void> {
    return (globalThis as any).__elide_requestAppReview();
  }

  static share(options: any): Promise<any> {
    return (globalThis as any).__elide_share(options);
  }

  static getAppBuildNumber(): string {
    return (globalThis as any).__elide_getAppBuildNumber();
  }

  // Mobile UI

  static createView(options: any): number {
    return (globalThis as any).__elide_createView(options);
  }

  static setViewType(handle: number, type: string): void {
    (globalThis as any).__elide_setViewType(handle, type);
  }

  static setViewStyle(handle: number, style: any): void {
    (globalThis as any).__elide_setViewStyle(handle, style);
  }

  static setViewPressHandler(handle: number, handler: () => void): void {
    (globalThis as any).__elide_setViewPressHandler(handle, handler);
  }

  static setViewLongPressHandler(handle: number, handler: () => void): void {
    (globalThis as any).__elide_setViewLongPressHandler(handle, handler);
  }

  static addViewChild(parentHandle: number, childHandle: number): void {
    (globalThis as any).__elide_addViewChild(parentHandle, childHandle);
  }

  static removeViewChild(parentHandle: number, childHandle: number): void {
    (globalThis as any).__elide_removeViewChild(parentHandle, childHandle);
  }

  static removeView(handle: number): void {
    (globalThis as any).__elide_removeView(handle);
  }

  static measureView(handle: number): Promise<any> {
    return (globalThis as any).__elide_measureView(handle);
  }

  static animateView(handle: number, animation: any): Promise<void> {
    return (globalThis as any).__elide_animateView(handle, animation);
  }

  static setTextContent(handle: number, text: string): void {
    (globalThis as any).__elide_setTextContent(handle, text);
  }

  static getTextContent(handle: number): string {
    return (globalThis as any).__elide_getTextContent(handle);
  }

  static setTextNumberOfLines(handle: number, lines: number): void {
    (globalThis as any).__elide_setTextNumberOfLines(handle, lines);
  }

  static setTextEllipsizeMode(handle: number, mode: string): void {
    (globalThis as any).__elide_setTextEllipsizeMode(handle, mode);
  }

  static setImageSource(handle: number, source: string): void {
    (globalThis as any).__elide_setImageSource(handle, source);
  }

  static setImageResizeMode(handle: number, mode: string): void {
    (globalThis as any).__elide_setImageResizeMode(handle, mode);
  }

  static onImageLoad(handle: number, callback: () => void): void {
    (globalThis as any).__elide_onImageLoad(handle, callback);
  }

  static onImageError(handle: number, callback: (error: Error) => void): void {
    (globalThis as any).__elide_onImageError(handle, callback);
  }

  static setButtonTitle(handle: number, title: string): void {
    (globalThis as any).__elide_setButtonTitle(handle, title);
  }

  static setButtonColor(handle: number, color: string): void {
    (globalThis as any).__elide_setButtonColor(handle, color);
  }

  static setButtonDisabled(handle: number, disabled: boolean): void {
    (globalThis as any).__elide_setButtonDisabled(handle, disabled);
  }

  static setTextInputValue(handle: number, value: string): void {
    (globalThis as any).__elide_setTextInputValue(handle, value);
  }

  static getTextInputValue(handle: number): string {
    return (globalThis as any).__elide_getTextInputValue(handle);
  }

  static setTextInputPlaceholder(handle: number, placeholder: string): void {
    (globalThis as any).__elide_setTextInputPlaceholder(handle, placeholder);
  }

  static setTextInputPlaceholderColor(handle: number, color: string): void {
    (globalThis as any).__elide_setTextInputPlaceholderColor(handle, color);
  }

  static setTextInputSecure(handle: number, secure: boolean): void {
    (globalThis as any).__elide_setTextInputSecure(handle, secure);
  }

  static setTextInputKeyboardType(handle: number, type: string): void {
    (globalThis as any).__elide_setTextInputKeyboardType(handle, type);
  }

  static setTextInputAutoCapitalize(handle: number, mode: string): void {
    (globalThis as any).__elide_setTextInputAutoCapitalize(handle, mode);
  }

  static setTextInputAutoCorrect(handle: number, enabled: boolean): void {
    (globalThis as any).__elide_setTextInputAutoCorrect(handle, enabled);
  }

  static setTextInputMaxLength(handle: number, maxLength: number): void {
    (globalThis as any).__elide_setTextInputMaxLength(handle, maxLength);
  }

  static setTextInputMultiline(handle: number, multiline: boolean): void {
    (globalThis as any).__elide_setTextInputMultiline(handle, multiline);
  }

  static onTextInputChange(handle: number, callback: (text: string) => void): void {
    (globalThis as any).__elide_onTextInputChange(handle, callback);
  }

  static onTextInputSubmit(handle: number, callback: () => void): void {
    (globalThis as any).__elide_onTextInputSubmit(handle, callback);
  }

  static onTextInputFocus(handle: number, callback: () => void): void {
    (globalThis as any).__elide_onTextInputFocus(handle, callback);
  }

  static onTextInputBlur(handle: number, callback: () => void): void {
    (globalThis as any).__elide_onTextInputBlur(handle, callback);
  }

  static focusTextInput(handle: number): void {
    (globalThis as any).__elide_focusTextInput(handle);
  }

  static blurTextInput(handle: number): void {
    (globalThis as any).__elide_blurTextInput(handle);
  }

  static setScrollViewHorizontal(handle: number, horizontal: boolean): void {
    (globalThis as any).__elide_setScrollViewHorizontal(handle, horizontal);
  }

  static setScrollViewShowIndicator(handle: number, show: boolean): void {
    (globalThis as any).__elide_setScrollViewShowIndicator(handle, show);
  }

  static onScrollViewScroll(handle: number, callback: (event: any) => void): void {
    (globalThis as any).__elide_onScrollViewScroll(handle, callback);
  }

  static scrollViewScrollTo(handle: number, options: any): void {
    (globalThis as any).__elide_scrollViewScrollTo(handle, options);
  }

  static scrollViewScrollToEnd(handle: number, animated: boolean): void {
    (globalThis as any).__elide_scrollViewScrollToEnd(handle, animated);
  }

  static clearListView(handle: number): void {
    (globalThis as any).__elide_clearListView(handle);
  }

  static addListViewItem(handle: number, itemHandle: number): void {
    (globalThis as any).__elide_addListViewItem(handle, itemHandle);
  }

  static onListViewEndReached(handle: number, callback: () => void): void {
    (globalThis as any).__elide_onListViewEndReached(handle, callback);
  }

  static setListViewEndReachedThreshold(handle: number, threshold: number): void {
    (globalThis as any).__elide_setListViewEndReachedThreshold(handle, threshold);
  }

  // Sensors and Device Info

  static isCameraAvailable(): Promise<boolean> {
    return (globalThis as any).__elide_isCameraAvailable();
  }

  static requestCameraPermission(): Promise<boolean> {
    return (globalThis as any).__elide_requestCameraPermission();
  }

  static takePhoto(options: any): Promise<any> {
    return (globalThis as any).__elide_takePhoto(options);
  }

  static recordVideo(options: any): Promise<any> {
    return (globalThis as any).__elide_recordVideo(options);
  }

  static pickFromGallery(options: any): Promise<any> {
    return (globalThis as any).__elide_pickFromGallery(options);
  }

  static requestLocationPermission(): Promise<boolean> {
    return (globalThis as any).__elide_requestLocationPermission();
  }

  static getCurrentPosition(options: any): Promise<any> {
    return (globalThis as any).__elide_getCurrentPosition(options);
  }

  static watchPosition(callback: (position: any) => void, errorCallback?: (error: Error) => void, options?: any): number {
    return (globalThis as any).__elide_watchPosition(callback, errorCallback, options);
  }

  static clearWatch(watchId: number): void {
    (globalThis as any).__elide_clearWatch(watchId);
  }

  static startAccelerometer(interval: number, callback: (data: any) => void): void {
    (globalThis as any).__elide_startAccelerometer(interval, callback);
  }

  static stopAccelerometer(): void {
    (globalThis as any).__elide_stopAccelerometer();
  }

  static startGyroscope(interval: number, callback: (data: any) => void): void {
    (globalThis as any).__elide_startGyroscope(interval, callback);
  }

  static stopGyroscope(): void {
    (globalThis as any).__elide_stopGyroscope();
  }

  static startMagnetometer(interval: number, callback: (data: any) => void): void {
    (globalThis as any).__elide_startMagnetometer(interval, callback);
  }

  static stopMagnetometer(): void {
    (globalThis as any).__elide_stopMagnetometer();
  }

  static onBatteryStatusChange(callback: (status: any) => void): void {
    (globalThis as any).__elide_onBatteryStatusChange(callback);
  }

  static getBatteryStatus(): Promise<any> {
    return (globalThis as any).__elide_getBatteryStatus();
  }

  static onNetworkStatusChange(callback: (status: any) => void): void {
    (globalThis as any).__elide_onNetworkStatusChange(callback);
  }

  static getNetworkStatus(): Promise<any> {
    return (globalThis as any).__elide_getNetworkStatus();
  }

  static isBiometricAvailable(): Promise<any> {
    return (globalThis as any).__elide_isBiometricAvailable();
  }

  static authenticateBiometric(options: any): Promise<any> {
    return (globalThis as any).__elide_authenticateBiometric(options);
  }

  static getDeviceModel(): string {
    return (globalThis as any).__elide_getDeviceModel();
  }

  static getDeviceBrand(): string {
    return (globalThis as any).__elide_getDeviceBrand();
  }

  static getDeviceSystemName(): string {
    return (globalThis as any).__elide_getDeviceSystemName();
  }

  static getDeviceSystemVersion(): string {
    return (globalThis as any).__elide_getDeviceSystemVersion();
  }

  static getDeviceId(): string {
    return (globalThis as any).__elide_getDeviceId();
  }

  static isTablet(): boolean {
    return (globalThis as any).__elide_isTablet();
  }

  static hasNotch(): boolean {
    return (globalThis as any).__elide_hasNotch();
  }

  static getScreenSize(): any {
    return (globalThis as any).__elide_getScreenSize();
  }

  static getPixelRatio(): number {
    return (globalThis as any).__elide_getPixelRatio();
  }

  static getFontScale(): number {
    return (globalThis as any).__elide_getFontScale();
  }

  static getTotalMemory(): Promise<number> {
    return (globalThis as any).__elide_getTotalMemory();
  }

  static getUsedMemory(): Promise<number> {
    return (globalThis as any).__elide_getUsedMemory();
  }

  static getTotalDiskSpace(): Promise<number> {
    return (globalThis as any).__elide_getTotalDiskSpace();
  }

  static getFreeDiskSpace(): Promise<number> {
    return (globalThis as any).__elide_getFreeDiskSpace();
  }

  static getBatteryLevel(): Promise<number> {
    return (globalThis as any).__elide_getBatteryLevel();
  }

  static isBatteryCharging(): Promise<boolean> {
    return (globalThis as any).__elide_isBatteryCharging();
  }

  static getCarrier(): string | null {
    return (globalThis as any).__elide_getCarrier();
  }

  static getIpAddress(): Promise<string | null> {
    return (globalThis as any).__elide_getIpAddress();
  }

  static getMacAddress(): Promise<string | null> {
    return (globalThis as any).__elide_getMacAddress();
  }

  static getTimezone(): string {
    return (globalThis as any).__elide_getTimezone();
  }

  static is24Hour(): boolean {
    return (globalThis as any).__elide_is24Hour();
  }

  // Storage

  static asyncStorageSetItem(key: string, value: string): Promise<void> {
    return (globalThis as any).__elide_asyncStorageSetItem(key, value);
  }

  static asyncStorageGetItem(key: string): Promise<string | null> {
    return (globalThis as any).__elide_asyncStorageGetItem(key);
  }

  static asyncStorageRemoveItem(key: string): Promise<void> {
    return (globalThis as any).__elide_asyncStorageRemoveItem(key);
  }

  static asyncStorageGetAllKeys(): Promise<string[]> {
    return (globalThis as any).__elide_asyncStorageGetAllKeys();
  }

  static asyncStorageMultiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    return (globalThis as any).__elide_asyncStorageMultiGet(keys);
  }

  static asyncStorageMultiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    return (globalThis as any).__elide_asyncStorageMultiSet(keyValuePairs);
  }

  static asyncStorageMultiRemove(keys: string[]): Promise<void> {
    return (globalThis as any).__elide_asyncStorageMultiRemove(keys);
  }

  static asyncStorageClear(): Promise<void> {
    return (globalThis as any).__elide_asyncStorageClear();
  }

  static secureStorageSetItem(key: string, value: string): Promise<void> {
    return (globalThis as any).__elide_secureStorageSetItem(key, value);
  }

  static secureStorageGetItem(key: string): Promise<string | null> {
    return (globalThis as any).__elide_secureStorageGetItem(key);
  }

  static secureStorageRemoveItem(key: string): Promise<void> {
    return (globalThis as any).__elide_secureStorageRemoveItem(key);
  }

  static secureStorageGetAllKeys(): Promise<string[]> {
    return (globalThis as any).__elide_secureStorageGetAllKeys();
  }

  static secureStorageClear(): Promise<void> {
    return (globalThis as any).__elide_secureStorageClear();
  }

  static getDocumentDirectory(): string {
    return (globalThis as any).__elide_getDocumentDirectory();
  }

  static getCacheDirectory(): string {
    return (globalThis as any).__elide_getCacheDirectory();
  }

  static getTemporaryDirectory(): string {
    return (globalThis as any).__elide_getTemporaryDirectory();
  }

  static readFile(path: string, encoding: string): Promise<string> {
    return (globalThis as any).__elide_readFile(path, encoding);
  }

  static writeFile(path: string, content: string, encoding: string): Promise<void> {
    return (globalThis as any).__elide_writeFile(path, content, encoding);
  }

  static appendFile(path: string, content: string, encoding: string): Promise<void> {
    return (globalThis as any).__elide_appendFile(path, content, encoding);
  }

  static deleteFile(path: string): Promise<void> {
    return (globalThis as any).__elide_deleteFile(path);
  }

  static fileExists(path: string): boolean {
    return (globalThis as any).__elide_fileExists(path);
  }

  static fileStat(path: string): Promise<any> {
    return (globalThis as any).__elide_fileStat(path);
  }

  static readDir(path: string): Promise<any[]> {
    return (globalThis as any).__elide_readDir(path);
  }

  static mkdir(path: string): Promise<void> {
    return (globalThis as any).__elide_mkdir(path);
  }

  static moveFile(from: string, to: string): Promise<void> {
    return (globalThis as any).__elide_moveFile(from, to);
  }

  static copyFile(from: string, to: string): Promise<void> {
    return (globalThis as any).__elide_copyFile(from, to);
  }

  static downloadFile(url: string, destination: string): Promise<void> {
    return (globalThis as any).__elide_downloadFile(url, destination);
  }

  static uploadFile(path: string, url: string, headers?: Record<string, string>): Promise<void> {
    return (globalThis as any).__elide_uploadFile(path, url, headers);
  }

  static openSQLiteDatabase(name: string, version: string): Promise<number> {
    return (globalThis as any).__elide_openSQLiteDatabase(name, version);
  }

  static sqliteTransaction(handle: number, callback: any): Promise<void> {
    return (globalThis as any).__elide_sqliteTransaction(handle, callback);
  }

  static sqliteReadTransaction(handle: number, callback: any): Promise<void> {
    return (globalThis as any).__elide_sqliteReadTransaction(handle, callback);
  }

  static sqliteExecuteSql(handle: number, sql: string, args?: any[]): Promise<any> {
    return (globalThis as any).__elide_sqliteExecuteSql(handle, sql, args);
  }

  static closeSQLiteDatabase(handle: number): Promise<void> {
    return (globalThis as any).__elide_closeSQLiteDatabase(handle);
  }

  static deleteSQLiteDatabase(name: string): Promise<void> {
    return (globalThis as any).__elide_deleteSQLiteDatabase(name);
  }

  // Notifications

  static requestNotificationPermissions(): Promise<any> {
    return (globalThis as any).__elide_requestNotificationPermissions();
  }

  static checkNotificationPermissions(): Promise<any> {
    return (globalThis as any).__elide_checkNotificationPermissions();
  }

  static scheduleLocalNotification(notification: any): Promise<string> {
    return (globalThis as any).__elide_scheduleLocalNotification(notification);
  }

  static cancelLocalNotification(id: string): Promise<void> {
    return (globalThis as any).__elide_cancelLocalNotification(id);
  }

  static cancelAllLocalNotifications(): Promise<void> {
    return (globalThis as any).__elide_cancelAllLocalNotifications();
  }

  static getPendingNotifications(): Promise<any[]> {
    return (globalThis as any).__elide_getPendingNotifications();
  }

  static getDeliveredNotifications(): Promise<any[]> {
    return (globalThis as any).__elide_getDeliveredNotifications();
  }

  static removeDeliveredNotification(id: string): Promise<void> {
    return (globalThis as any).__elide_removeDeliveredNotification(id);
  }

  static removeAllDeliveredNotifications(): Promise<void> {
    return (globalThis as any).__elide_removeAllDeliveredNotifications();
  }

  static registerForPushNotifications(): Promise<void> {
    return (globalThis as any).__elide_registerForPushNotifications();
  }

  static unregisterForPushNotifications(): Promise<void> {
    return (globalThis as any).__elide_unregisterForPushNotifications();
  }

  static getPushToken(): Promise<string | null> {
    return (globalThis as any).__elide_getPushToken();
  }

  static setNotificationBadgeCount(count: number): Promise<void> {
    return (globalThis as any).__elide_setNotificationBadgeCount(count);
  }

  static getNotificationBadgeCount(): Promise<number> {
    return (globalThis as any).__elide_getNotificationBadgeCount();
  }

  static setNotificationCategories(categories: any[]): Promise<void> {
    return (globalThis as any).__elide_setNotificationCategories(categories);
  }

  static onNotificationReceived(callback: (notification: any) => void): void {
    (globalThis as any).__elide_onNotificationReceived(callback);
  }

  static onNotificationAction(callback: (action: string, notification: any) => void): void {
    (globalThis as any).__elide_onNotificationAction(callback);
  }

  static onPushTokenReceived(callback: (token: any) => void): void {
    (globalThis as any).__elide_onPushTokenReceived(callback);
  }

  static onPushTokenError(callback: (error: Error) => void): void {
    (globalThis as any).__elide_onPushTokenError(callback);
  }

  // CLI

  static promptText(question: string, defaultValue?: string): Promise<string> {
    return (globalThis as any).__elide_promptText(question, defaultValue);
  }

  static promptConfirm(question: string, defaultValue: boolean): Promise<boolean> {
    return (globalThis as any).__elide_promptConfirm(question, defaultValue);
  }

  static promptSelect(question: string, choices: any[]): Promise<any> {
    return (globalThis as any).__elide_promptSelect(question, choices);
  }

  static promptMultiSelect(question: string, choices: any[]): Promise<any[]> {
    return (globalThis as any).__elide_promptMultiSelect(question, choices);
  }

  static promptPassword(question: string): Promise<string> {
    return (globalThis as any).__elide_promptPassword(question);
  }

  static promptNumber(question: string, defaultValue?: number): Promise<number> {
    return (globalThis as any).__elide_promptNumber(question, defaultValue);
  }

  static getHomeDirgetHomeDir(): string {
    return (globalThis as any).__elide_getHomeDir();
  }

  // Compiler

  static parseSourceFiles(entryPoint: string): Promise<any[]> {
    return (globalThis as any).__elide_parseSourceFiles(entryPoint);
  }

  static resolveDependencies(sourceFiles: any[], options: any): Promise<any[]> {
    return (globalThis as any).__elide_resolveDependencies(sourceFiles, options);
  }

  static treeShake(dependencies: any[]): Promise<void> {
    return (globalThis as any).__elide_treeShake(dependencies);
  }

  static transformToNative(dependencies: any[], options: any): Promise<any> {
    return (globalThis as any).__elide_transformToNative(dependencies, options);
  }

  static optimize(nativeCode: any, optimizations: any): Promise<void> {
    return (globalThis as any).__elide_optimize(nativeCode, optimizations);
  }

  static link(nativeCode: any, options: any): Promise<any> {
    return (globalThis as any).__elide_link(nativeCode, options);
  }

  static embedAsset(binary: any, asset: string): Promise<void> {
    return (globalThis as any).__elide_embedAsset(binary, asset);
  }

  static setIcon(binary: any, icon: string): Promise<void> {
    return (globalThis as any).__elide_setIcon(binary, icon);
  }

  static writeBinary(binary: any, output: string): Promise<void> {
    return (globalThis as any).__elide_writeBinary(binary, output);
  }

  static analyzeBinary(binary: any): Promise<any> {
    return (globalThis as any).__elide_analyzeBinary(binary);
  }

  static resolveModule(module: string): Promise<string> {
    return (globalThis as any).__elide_resolveModule(module);
  }

  static parseModule(code: string, moduleId: string): Promise<any> {
    return (globalThis as any).__elide_parseModule(code, moduleId);
  }

  static resolveImport(importPath: string, importer: string): Promise<string> {
    return (globalThis as any).__elide_resolveImport(importPath, importer);
  }

  static treeShakeModules(modules: any[], graph: any, options: any): Promise<void> {
    return (globalThis as any).__elide_treeShakeModules(modules, graph, options);
  }

  static transformModule(code: string, options: any): Promise<string> {
    return (globalThis as any).__elide_transformModule(code, options);
  }

  static minifyCode(code: string): Promise<string> {
    return (globalThis as any).__elide_minifyCode(code);
  }

  static generateSourceMap(bundle: any): Promise<any> {
    return (globalThis as any).__elide_generateSourceMap(bundle);
  }
}
