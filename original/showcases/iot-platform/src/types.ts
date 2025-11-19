/**
 * Elide IoT Platform - Type Definitions
 *
 * Comprehensive type system for IoT platform components including devices,
 * sensors, events, protocols, analytics, and machine learning.
 */

// ============================================================================
// Core Device Types
// ============================================================================

export type DeviceId = string;
export type SensorId = string;
export type EventId = string;
export type TenantId = string;

export interface Device {
  id: DeviceId;
  tenantId: TenantId;
  name: string;
  type: DeviceType;
  protocol: ProtocolType;
  status: DeviceStatus;
  metadata: DeviceMetadata;
  capabilities: DeviceCapabilities;
  security: SecurityConfig;
  lastSeen: number;
  createdAt: number;
  updatedAt: number;
}

export enum DeviceType {
  SENSOR = 'sensor',
  ACTUATOR = 'actuator',
  GATEWAY = 'gateway',
  EDGE_DEVICE = 'edge-device',
  CONTROLLER = 'controller',
  HYBRID = 'hybrid'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  DEGRADED = 'degraded',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  UNKNOWN = 'unknown'
}

export interface DeviceMetadata {
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  hardwareVersion: string;
  location?: GeoLocation;
  zone?: string;
  tags: string[];
  customProperties: Record<string, any>;
}

export interface DeviceCapabilities {
  sensors: SensorCapability[];
  actuators: ActuatorCapability[];
  protocols: ProtocolType[];
  maxSampleRate: number;
  bufferSize: number;
  processingPower: ProcessingPower;
  storage: StorageCapability;
}

export interface SensorCapability {
  type: SensorType;
  range: [number, number];
  accuracy: number;
  resolution: number;
  unit: string;
}

export interface ActuatorCapability {
  type: ActuatorType;
  range: [number, number];
  precision: number;
  responseTime: number; // milliseconds
}

export enum ProcessingPower {
  LOW = 'low',         // Microcontroller
  MEDIUM = 'medium',   // Single-board computer
  HIGH = 'high',       // Edge server
  CLOUD = 'cloud'      // Cloud processing
}

export interface StorageCapability {
  type: 'volatile' | 'persistent';
  capacity: number; // bytes
  writeSpeed: number; // bytes/sec
  readSpeed: number; // bytes/sec
}

// ============================================================================
// Sensor Types
// ============================================================================

export enum SensorType {
  // Environmental
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  PRESSURE = 'pressure',
  AIR_QUALITY = 'air-quality',
  CO2 = 'co2',
  VOC = 'voc',
  PM25 = 'pm25',
  PM10 = 'pm10',
  LIGHT = 'light',
  UV = 'uv',
  NOISE = 'noise',

  // Motion & Position
  ACCELEROMETER = 'accelerometer',
  GYROSCOPE = 'gyroscope',
  MAGNETOMETER = 'magnetometer',
  GPS = 'gps',
  PROXIMITY = 'proximity',
  MOTION = 'motion',

  // Industrial
  VIBRATION = 'vibration',
  CURRENT = 'current',
  VOLTAGE = 'voltage',
  POWER = 'power',
  FLOW = 'flow',
  LEVEL = 'level',
  TORQUE = 'torque',
  RPM = 'rpm',

  // Other
  CAMERA = 'camera',
  MICROPHONE = 'microphone',
  RFID = 'rfid',
  CUSTOM = 'custom'
}

export enum ActuatorType {
  RELAY = 'relay',
  MOTOR = 'motor',
  SERVO = 'servo',
  VALVE = 'valve',
  PUMP = 'pump',
  HEATER = 'heater',
  COOLER = 'cooler',
  LED = 'led',
  BUZZER = 'buzzer',
  DISPLAY = 'display',
  CUSTOM = 'custom'
}

export interface SensorReading {
  sensorId: SensorId;
  deviceId: DeviceId;
  timestamp: number;
  value: number | number[] | string;
  unit: string;
  quality: DataQuality;
  metadata?: ReadingMetadata;
}

export interface ReadingMetadata {
  accuracy?: number;
  confidence?: number;
  source?: string;
  processedBy?: string;
  flags?: string[];
}

export enum DataQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  INVALID = 'invalid'
}

// ============================================================================
// Protocol Types
// ============================================================================

export enum ProtocolType {
  MQTT = 'mqtt',
  COAP = 'coap',
  HTTP = 'http',
  HTTPS = 'https',
  WEBSOCKET = 'websocket',
  LORAWAN = 'lorawan',
  ZIGBEE = 'zigbee',
  BLUETOOTH = 'bluetooth',
  MODBUS = 'modbus',
  CUSTOM = 'custom'
}

export interface MQTTConfig {
  broker: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  qos: 0 | 1 | 2;
  retain: boolean;
  cleanSession: boolean;
  keepAlive: number;
  reconnectPeriod: number;
  connectTimeout: number;
  will?: {
    topic: string;
    payload: string | Buffer;
    qos: 0 | 1 | 2;
    retain: boolean;
  };
  tls?: TLSConfig;
}

export interface CoAPConfig {
  host: string;
  port: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  confirmable: boolean;
  observe: boolean;
  blockSize: number;
  maxRetransmit: number;
  ackTimeout: number;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  heartbeatInterval: number;
  reconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface TLSConfig {
  ca?: Buffer;
  cert?: Buffer;
  key?: Buffer;
  rejectUnauthorized: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export interface Event {
  id: EventId;
  type: EventType;
  deviceId: DeviceId;
  tenantId: TenantId;
  timestamp: number;
  data: EventData;
  severity: EventSeverity;
  metadata?: EventMetadata;
}

export enum EventType {
  // Device Events
  DEVICE_CONNECTED = 'device-connected',
  DEVICE_DISCONNECTED = 'device-disconnected',
  DEVICE_REGISTERED = 'device-registered',
  DEVICE_UPDATED = 'device-updated',
  DEVICE_ERROR = 'device-error',

  // Sensor Events
  SENSOR_READING = 'sensor-reading',
  SENSOR_THRESHOLD_EXCEEDED = 'sensor-threshold-exceeded',
  SENSOR_CALIBRATION = 'sensor-calibration',
  SENSOR_FAULT = 'sensor-fault',

  // Anomaly Events
  ANOMALY_DETECTED = 'anomaly-detected',
  PATTERN_CHANGE = 'pattern-change',
  DRIFT_DETECTED = 'drift-detected',

  // Maintenance Events
  MAINTENANCE_REQUIRED = 'maintenance-required',
  MAINTENANCE_SCHEDULED = 'maintenance-scheduled',
  MAINTENANCE_COMPLETED = 'maintenance-completed',

  // System Events
  SYSTEM_ALERT = 'system-alert',
  SYSTEM_WARNING = 'system-warning',
  SYSTEM_INFO = 'system-info'
}

export enum EventSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export type EventData = Record<string, any>;

export interface EventMetadata {
  correlationId?: string;
  causedBy?: EventId;
  processed?: boolean;
  processingTime?: number;
  [key: string]: any;
}

// ============================================================================
// Security Types
// ============================================================================

export interface SecurityConfig {
  authentication: AuthenticationConfig;
  encryption: EncryptionConfig;
  authorization: AuthorizationConfig;
}

export interface AuthenticationConfig {
  method: AuthenticationMethod;
  credentials?: AuthenticationCredentials;
  certificateChain?: string[];
  tokenExpiry?: number;
}

export enum AuthenticationMethod {
  CERTIFICATE = 'certificate',
  TOKEN = 'token',
  PSK = 'psk',
  USERNAME_PASSWORD = 'username-password',
  NONE = 'none'
}

export type AuthenticationCredentials =
  | CertificateCredentials
  | TokenCredentials
  | PSKCredentials
  | UsernamePasswordCredentials;

export interface CertificateCredentials {
  type: 'certificate';
  certificate: string;
  privateKey: string;
  chain?: string[];
}

export interface TokenCredentials {
  type: 'token';
  token: string;
  refreshToken?: string;
}

export interface PSKCredentials {
  type: 'psk';
  identity: string;
  key: string;
}

export interface UsernamePasswordCredentials {
  type: 'username-password';
  username: string;
  password: string;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm?: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
  keyRotation?: number; // milliseconds
}

export interface AuthorizationConfig {
  roles: string[];
  permissions: Permission[];
}

export enum Permission {
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
  DELETE = 'delete',
  ADMIN = 'admin'
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface TimeSeriesData {
  timestamps: number[];
  values: number[];
  metadata?: TimeSeriesMetadata;
}

export interface TimeSeriesMetadata {
  sensorId: SensorId;
  deviceId: DeviceId;
  unit: string;
  sampleRate: number;
  interpolation?: 'linear' | 'cubic' | 'nearest';
  gaps?: TimeGap[];
}

export interface TimeGap {
  start: number;
  end: number;
  reason?: string;
}

export interface TimeSeriesDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
  timestamps: number[];
  model: 'additive' | 'multiplicative';
}

export interface Forecast {
  timestamps: number[];
  predictions: number[];
  lower: number[]; // Lower confidence bound
  upper: number[]; // Upper confidence bound
  confidence: number;
  method: ForecastMethod;
  metrics: ForecastMetrics;
}

export enum ForecastMethod {
  ARIMA = 'arima',
  SARIMA = 'sarima',
  EXPONENTIAL_SMOOTHING = 'exponential-smoothing',
  PROPHET = 'prophet',
  LSTM = 'lstm',
  SIMPLE_MOVING_AVERAGE = 'simple-moving-average',
  EXPONENTIAL_MOVING_AVERAGE = 'exponential-moving-average'
}

export interface ForecastMetrics {
  mae: number; // Mean Absolute Error
  mse: number; // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  aic?: number; // Akaike Information Criterion
  bic?: number; // Bayesian Information Criterion
}

export interface StatisticalSummary {
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
  skewness: number;
  kurtosis: number;
}

export interface FrequencyAnalysis {
  frequencies: number[];
  magnitudes: number[];
  phases: number[];
  dominantFrequencies: number[];
  powerSpectrum: number[];
}

// ============================================================================
// Machine Learning Types
// ============================================================================

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  score: number;
  confidence: number;
  timestamp: number;
  features?: number[];
  explanation?: string;
}

export interface AnomalyDetectorConfig {
  algorithm: AnomalyDetectionAlgorithm;
  contamination: number; // Expected proportion of outliers
  sensitivity: number;
  trainingSize: number;
  updateInterval: number; // milliseconds
  features: string[];
}

export enum AnomalyDetectionAlgorithm {
  ISOLATION_FOREST = 'isolation-forest',
  ONE_CLASS_SVM = 'one-class-svm',
  LOCAL_OUTLIER_FACTOR = 'lof',
  AUTOENCODER = 'autoencoder',
  GAUSSIAN_MIXTURE = 'gaussian-mixture',
  STATISTICAL = 'statistical',
  ENSEMBLE = 'ensemble'
}

export interface PredictiveMaintenanceResult {
  probability: number; // Failure probability (0-1)
  confidence: number;
  timeToFailure?: number; // milliseconds
  recommendation: MaintenanceRecommendation;
  featureImportance: Record<string, number>;
  riskFactors: RiskFactor[];
}

export enum MaintenanceRecommendation {
  IMMEDIATE = 'immediate',
  URGENT = 'urgent',
  SCHEDULED = 'scheduled',
  MONITOR = 'monitor',
  NONE = 'none'
}

export interface RiskFactor {
  factor: string;
  severity: number; // 0-1
  description: string;
}

export interface MLModelConfig {
  type: MLModelType;
  hyperparameters: Record<string, any>;
  features: string[];
  target?: string;
  validation: ValidationConfig;
}

export enum MLModelType {
  RANDOM_FOREST = 'random-forest',
  GRADIENT_BOOSTING = 'gradient-boosting',
  SVM = 'svm',
  NEURAL_NETWORK = 'neural-network',
  LINEAR_REGRESSION = 'linear-regression',
  LOGISTIC_REGRESSION = 'logistic-regression',
  DECISION_TREE = 'decision-tree',
  K_MEANS = 'k-means',
  DBSCAN = 'dbscan'
}

export interface ValidationConfig {
  method: 'cross-validation' | 'train-test-split' | 'time-series-split';
  splits?: number;
  testSize?: number;
  shuffle?: boolean;
}

export interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  confusionMatrix?: number[][];
  trainingTime: number;
  inferenceTime: number;
}

// ============================================================================
// Signal Processing Types
// ============================================================================

export interface FilterConfig {
  type: FilterType;
  order: number;
  cutoff: number | [number, number];
  sampleRate: number;
  ripple?: number;
  attenuation?: number;
}

export enum FilterType {
  LOWPASS = 'lowpass',
  HIGHPASS = 'highpass',
  BANDPASS = 'bandpass',
  BANDSTOP = 'bandstop',
  NOTCH = 'notch'
}

export enum FilterDesign {
  BUTTERWORTH = 'butterworth',
  CHEBYSHEV = 'chebyshev',
  BESSEL = 'bessel',
  ELLIPTIC = 'elliptic'
}

export interface FilteredSignal {
  signal: number[];
  timestamps: number[];
  filter: FilterConfig;
  metadata: {
    latency: number;
    snr?: number; // Signal-to-noise ratio
    distortion?: number;
  };
}

export interface SpectralAnalysis {
  frequencies: number[];
  psd: number[]; // Power spectral density
  peaks: Peak[];
  bandwidth: number;
  centerFrequency: number;
}

export interface Peak {
  frequency: number;
  magnitude: number;
  width: number;
  prominence: number;
}

export interface WaveletTransform {
  coefficients: number[][];
  scales: number[];
  waveletType: WaveletType;
  levels: number;
}

export enum WaveletType {
  HAAR = 'haar',
  DAUBECHIES = 'daubechies',
  SYMLET = 'symlet',
  COIFLET = 'coiflet',
  BIORTHOGONAL = 'biorthogonal'
}

// ============================================================================
// Storage Types
// ============================================================================

export interface TimeSeriesQuery {
  measurement: string;
  tags?: Record<string, string>;
  fields?: string[];
  start: number;
  end: number;
  aggregation?: AggregationType;
  groupBy?: string | number; // Tag or time interval
  limit?: number;
  offset?: number;
  orderBy?: 'asc' | 'desc';
}

export enum AggregationType {
  MEAN = 'mean',
  MEDIAN = 'median',
  SUM = 'sum',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  STDDEV = 'stddev',
  PERCENTILE = 'percentile',
  FIRST = 'first',
  LAST = 'last'
}

export interface TimeSeriesPoint {
  measurement: string;
  tags: Record<string, string>;
  fields: Record<string, number | string | boolean>;
  timestamp: number;
}

export interface QueryResult {
  points: TimeSeriesPoint[];
  count: number;
  executionTime: number;
  fromCache: boolean;
}

export interface RetentionPolicy {
  name: string;
  duration: number; // milliseconds
  replication: number;
  shardDuration: number;
  default: boolean;
}

export interface DownsamplingRule {
  sourceResolution: number;
  targetResolution: number;
  aggregation: AggregationType;
  retention: number;
}

// ============================================================================
// Edge Computing Types
// ============================================================================

export interface EdgeConfig {
  processingMode: ProcessingMode;
  localStorageLimit: number; // bytes
  syncInterval: number; // milliseconds
  syncStrategy: SyncStrategy;
  offlineCapability: boolean;
  compressionEnabled: boolean;
}

export enum ProcessingMode {
  LOCAL_ONLY = 'local-only',
  CLOUD_ONLY = 'cloud-only',
  HYBRID = 'hybrid',
  ADAPTIVE = 'adaptive'
}

export enum SyncStrategy {
  REALTIME = 'realtime',
  PERIODIC = 'periodic',
  ON_CHANGE = 'on-change',
  MANUAL = 'manual',
  SMART = 'smart'
}

export interface EdgeProcessingResult {
  processed: number;
  filtered: number;
  aggregated: number;
  synced: number;
  stored: number;
  errors: number;
  processingTime: number;
}

// ============================================================================
// Visualization Types
// ============================================================================

export interface DashboardConfig {
  id: string;
  name: string;
  refreshRate: number;
  widgets: Widget[];
  layout: LayoutConfig;
  theme: ThemeConfig;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: DataSource;
  config: WidgetConfig;
  position: WidgetPosition;
}

export enum WidgetType {
  TIMESERIES = 'timeseries',
  GAUGE = 'gauge',
  HEATMAP = 'heatmap',
  TABLE = 'table',
  ALERT_LIST = 'alert-list',
  MAP = 'map',
  BAR_CHART = 'bar-chart',
  PIE_CHART = 'pie-chart',
  STAT = 'stat',
  CUSTOM = 'custom'
}

export interface DataSource {
  type: 'query' | 'live' | 'static';
  query?: TimeSeriesQuery;
  liveStream?: string;
  staticData?: any;
  refreshInterval?: number;
}

export type WidgetConfig = Record<string, any>;

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutConfig {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
}

// ============================================================================
// Alert Types
// ============================================================================

export interface Alert {
  id: string;
  type: AlertType;
  severity: EventSeverity;
  title: string;
  message: string;
  deviceId?: DeviceId;
  sensorId?: SensorId;
  timestamp: number;
  status: AlertStatus;
  actions: AlertAction[];
}

export enum AlertType {
  THRESHOLD = 'threshold',
  ANOMALY = 'anomaly',
  DEVICE_OFFLINE = 'device-offline',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  SYSTEM = 'system'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed'
}

export interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'script';
  config: Record<string, any>;
  executed: boolean;
  executedAt?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  actions: AlertAction[];
  enabled: boolean;
  cooldown: number; // milliseconds
}

export type AlertCondition =
  | ThresholdCondition
  | AnomalyCondition
  | PatternCondition
  | CustomCondition;

export interface ThresholdCondition {
  type: 'threshold';
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  duration?: number;
}

export interface AnomalyCondition {
  type: 'anomaly';
  metric: string;
  algorithm: AnomalyDetectionAlgorithm;
  sensitivity: number;
}

export interface PatternCondition {
  type: 'pattern';
  pattern: string; // Regex or custom pattern
  metric: string;
}

export interface CustomCondition {
  type: 'custom';
  evaluator: (data: any) => boolean;
}

// ============================================================================
// Location Types
// ============================================================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: number;
}

export interface GeoFence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  coordinates: GeoLocation[];
  radius?: number; // For circle type
  metadata?: Record<string, any>;
}

// ============================================================================
// Performance Types
// ============================================================================

export interface PerformanceMetrics {
  throughput: ThroughputMetrics;
  latency: LatencyMetrics;
  resource: ResourceMetrics;
  errors: ErrorMetrics;
}

export interface ThroughputMetrics {
  eventsPerSecond: number;
  bytesPerSecond: number;
  messagesPerSecond: number;
  queriesPerSecond: number;
}

export interface LatencyMetrics {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
}

export interface ResourceMetrics {
  cpuUsage: number; // Percentage
  memoryUsage: number; // Bytes
  memoryUsagePercent: number;
  diskUsage: number; // Bytes
  networkIn: number; // Bytes/sec
  networkOut: number; // Bytes/sec
}

export interface ErrorMetrics {
  total: number;
  rate: number; // Errors per second
  byType: Record<string, number>;
  byDevice: Record<DeviceId, number>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface PlatformConfig {
  devices: DeviceManagerConfig;
  storage: StorageConfig;
  analytics: AnalyticsConfig;
  ml: MLConfig;
  edge: EdgeConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export interface DeviceManagerConfig {
  maxDevices: number;
  protocols: ProtocolType[];
  healthCheckInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
}

export interface StorageConfig {
  type: 'memory' | 'disk' | 'hybrid';
  path?: string;
  retention: RetentionPolicy[];
  downsampling: DownsamplingRule[];
  compression: 'none' | 'gorilla' | 'zstd';
  cacheSize: number; // bytes
}

export interface AnalyticsConfig {
  enabled: boolean;
  realtime: boolean;
  batchSize: number;
  processingInterval: number;
}

export interface MLConfig {
  enabled: boolean;
  autoTrain: boolean;
  trainingInterval: number;
  models: MLModelConfig[];
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  exporters: string[];
}
