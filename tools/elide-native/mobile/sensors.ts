/**
 * Elide Mobile Framework - Device Sensors
 *
 * Access to device sensors: camera, accelerometer, gyroscope, etc.
 */

import { EventEmitter } from '../desktop/events';
import { NativeBridge } from '../runtime/bridge';

// Camera

export interface CameraOptions {
  mediaType?: 'photo' | 'video';
  quality?: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  cameraType?: 'front' | 'back';
  saveToGallery?: boolean;
}

export interface CameraResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  type: string;
  cancelled: boolean;
}

export class Camera {
  static async isAvailable(): Promise<boolean> {
    return NativeBridge.isCameraAvailable();
  }

  static async requestPermissions(): Promise<boolean> {
    return NativeBridge.requestCameraPermission();
  }

  static async takePhoto(options: CameraOptions = {}): Promise<CameraResult> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission denied');
    }

    return NativeBridge.takePhoto(options);
  }

  static async recordVideo(options: CameraOptions = {}): Promise<CameraResult> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission denied');
    }

    return NativeBridge.recordVideo(options);
  }

  static async pickFromGallery(options: CameraOptions = {}): Promise<CameraResult> {
    return NativeBridge.pickFromGallery(options);
  }
}

// Location

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
}

export class Location extends EventEmitter {
  private watchId?: number;

  static async requestPermissions(): Promise<boolean> {
    return NativeBridge.requestLocationPermission();
  }

  static async getCurrentPosition(options: LocationOptions = {}): Promise<LocationCoordinates> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return NativeBridge.getCurrentPosition(options);
  }

  async watchPosition(
    callback: (position: LocationCoordinates) => void,
    errorCallback?: (error: Error) => void,
    options: LocationOptions = {}
  ): Promise<void> {
    const hasPermission = await Location.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    this.watchId = NativeBridge.watchPosition(callback, errorCallback, options);
  }

  clearWatch(): void {
    if (this.watchId !== undefined) {
      NativeBridge.clearWatch(this.watchId);
      this.watchId = undefined;
    }
  }
}

// Accelerometer

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export class Accelerometer extends EventEmitter {
  private isListening: boolean = false;

  start(interval: number = 100): void {
    if (this.isListening) return;

    this.isListening = true;
    NativeBridge.startAccelerometer(interval, (data: AccelerometerData) => {
      this.emit('data', data);
    });
  }

  stop(): void {
    if (!this.isListening) return;

    this.isListening = false;
    NativeBridge.stopAccelerometer();
  }
}

// Gyroscope

export interface GyroscopeData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export class Gyroscope extends EventEmitter {
  private isListening: boolean = false;

  start(interval: number = 100): void {
    if (this.isListening) return;

    this.isListening = true;
    NativeBridge.startGyroscope(interval, (data: GyroscopeData) => {
      this.emit('data', data);
    });
  }

  stop(): void {
    if (!this.isListening) return;

    this.isListening = false;
    NativeBridge.stopGyroscope();
  }
}

// Magnetometer

export interface MagnetometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export class Magnetometer extends EventEmitter {
  private isListening: boolean = false;

  start(interval: number = 100): void {
    if (this.isListening) return;

    this.isListening = true;
    NativeBridge.startMagnetometer(interval, (data: MagnetometerData) => {
      this.emit('data', data);
    });
  }

  stop(): void {
    if (!this.isListening) return;

    this.isListening = false;
    NativeBridge.stopMagnetometer();
  }
}

// Battery

export interface BatteryStatus {
  level: number; // 0-1
  isCharging: boolean;
}

export class Battery extends EventEmitter {
  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    NativeBridge.onBatteryStatusChange((status: BatteryStatus) => {
      this.emit('change', status);
    });
  }

  async getStatus(): Promise<BatteryStatus> {
    return NativeBridge.getBatteryStatus();
  }
}

// Network

export interface NetworkStatus {
  isConnected: boolean;
  type: 'none' | 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  isInternetReachable: boolean;
}

export class Network extends EventEmitter {
  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    NativeBridge.onNetworkStatusChange((status: NetworkStatus) => {
      this.emit('change', status);
    });
  }

  async getStatus(): Promise<NetworkStatus> {
    return NativeBridge.getNetworkStatus();
  }
}

// Biometric Authentication

export interface BiometricOptions {
  promptMessage?: string;
  cancelButtonText?: string;
  fallbackToPasscode?: boolean;
}

export class Biometric {
  static async isAvailable(): Promise<{
    available: boolean;
    biometryType: 'TouchID' | 'FaceID' | 'Fingerprint' | 'Iris' | 'None';
  }> {
    return NativeBridge.isBiometricAvailable();
  }

  static async authenticate(options: BiometricOptions = {}): Promise<{
    success: boolean;
    error?: string;
  }> {
    const availability = await this.isAvailable();
    if (!availability.available) {
      return {
        success: false,
        error: 'Biometric authentication not available',
      };
    }

    return NativeBridge.authenticateBiometric(options);
  }
}

// Device Info

export class DeviceInfo {
  static getModel(): string {
    return NativeBridge.getDeviceModel();
  }

  static getBrand(): string {
    return NativeBridge.getDeviceBrand();
  }

  static getSystemName(): string {
    return NativeBridge.getDeviceSystemName();
  }

  static getSystemVersion(): string {
    return NativeBridge.getDeviceSystemVersion();
  }

  static getDeviceId(): string {
    return NativeBridge.getDeviceId();
  }

  static isTablet(): boolean {
    return NativeBridge.isTablet();
  }

  static hasNotch(): boolean {
    return NativeBridge.hasNotch();
  }

  static getScreenSize(): { width: number; height: number } {
    return NativeBridge.getScreenSize();
  }

  static getPixelRatio(): number {
    return NativeBridge.getPixelRatio();
  }

  static getFontScale(): number {
    return NativeBridge.getFontScale();
  }

  static async getTotalMemory(): Promise<number> {
    return NativeBridge.getTotalMemory();
  }

  static async getUsedMemory(): Promise<number> {
    return NativeBridge.getUsedMemory();
  }

  static async getTotalDiskSpace(): Promise<number> {
    return NativeBridge.getTotalDiskSpace();
  }

  static async getFreeDiskSpace(): Promise<number> {
    return NativeBridge.getFreeDiskSpace();
  }

  static async getBatteryLevel(): Promise<number> {
    return NativeBridge.getBatteryLevel();
  }

  static async isBatteryCharging(): Promise<boolean> {
    return NativeBridge.isBatteryCharging();
  }

  static getCarrier(): string | null {
    return NativeBridge.getCarrier();
  }

  static async getIpAddress(): Promise<string | null> {
    return NativeBridge.getIpAddress();
  }

  static async getMacAddress(): Promise<string | null> {
    return NativeBridge.getMacAddress();
  }

  static getTimezone(): string {
    return NativeBridge.getTimezone();
  }

  static is24Hour(): boolean {
    return NativeBridge.is24Hour();
  }
}
