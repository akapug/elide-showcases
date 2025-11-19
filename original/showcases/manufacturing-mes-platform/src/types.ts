/**
 * Manufacturing MES Platform - Type Definitions
 *
 * Comprehensive type system for Industry 4.0 manufacturing execution systems.
 * Covers production, maintenance, quality, OEE, and IoT domains.
 */

// ============================================================================
// Core Domain Types
// ============================================================================

/**
 * Equipment/Machine representation
 */
export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  location: Location;
  capacity: ProductionCapacity;
  status: EquipmentStatus;
  specifications: EquipmentSpecifications;
  sensors: Sensor[];
  maintenanceHistory: MaintenanceRecord[];
  currentJob?: ProductionJob;
  metadata: Record<string, unknown>;
}

export enum EquipmentType {
  CNC_MILL = 'CNC_MILL',
  CNC_LATHE = 'CNC_LATHE',
  INJECTION_MOLDING = 'INJECTION_MOLDING',
  STAMPING_PRESS = 'STAMPING_PRESS',
  WELDING_ROBOT = 'WELDING_ROBOT',
  ASSEMBLY_LINE = 'ASSEMBLY_LINE',
  PACKAGING_MACHINE = 'PACKAGING_MACHINE',
  CONVEYOR_SYSTEM = 'CONVEYOR_SYSTEM',
  INDUSTRIAL_ROBOT = 'INDUSTRIAL_ROBOT',
  TESTING_EQUIPMENT = 'TESTING_EQUIPMENT',
  INSPECTION_SYSTEM = 'INSPECTION_SYSTEM',
  HEAT_TREATMENT = 'HEAT_TREATMENT',
  SURFACE_FINISHING = 'SURFACE_FINISHING',
  QUALITY_SCANNER = 'QUALITY_SCANNER'
}

export enum EquipmentStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  SETUP = 'SETUP',
  MAINTENANCE = 'MAINTENANCE',
  BREAKDOWN = 'BREAKDOWN',
  OFFLINE = 'OFFLINE',
  CALIBRATION = 'CALIBRATION',
  TESTING = 'TESTING'
}

export interface EquipmentSpecifications {
  manufacturer: string;
  model: string;
  serialNumber: string;
  yearInstalled: number;
  maxTemperature?: number;
  maxPressure?: number;
  maxSpeed?: number;
  powerRating: number; // kW
  voltage: number;
  weight: number; // kg
  dimensions: Dimensions;
  certifications: string[];
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'mm' | 'cm' | 'm' | 'in' | 'ft';
}

export interface Location {
  plantId: string;
  building: string;
  floor: number;
  zone: string;
  position: string;
  coordinates?: GeoCoordinates;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface ProductionCapacity {
  unitsPerHour: number;
  unitsPerShift: number;
  maxDailyCapacity: number;
  utilizationTarget: number; // percentage
}

// ============================================================================
// Production Types
// ============================================================================

export interface ProductionJob {
  id: string;
  workOrderId: string;
  productId: string;
  equipmentId: string;
  quantity: number;
  quantityProduced: number;
  quantityRejected: number;
  status: JobStatus;
  priority: JobPriority;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  setupTime?: number; // minutes
  cycleTime: number; // seconds per unit
  materials: MaterialRequirement[];
  instructions: ProductionInstructions;
  qualityChecks: QualityCheckpoint[];
  metrics: ProductionMetrics;
}

export enum JobStatus {
  SCHEDULED = 'SCHEDULED',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD'
}

export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4
}

export interface MaterialRequirement {
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  batchNumber?: string;
  expiryDate?: Date;
  location: string;
  status: MaterialStatus;
}

export enum MaterialStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  IN_USE = 'IN_USE',
  DEPLETED = 'DEPLETED',
  EXPIRED = 'EXPIRED',
  QUARANTINED = 'QUARANTINED'
}

export interface ProductionInstructions {
  programNumber?: string;
  setupInstructions: string;
  processParameters: ProcessParameter[];
  toolingRequirements: ToolingRequirement[];
  safetyRequirements: string[];
  documentation: string[];
}

export interface ProcessParameter {
  name: string;
  value: number | string;
  unit?: string;
  tolerance?: number;
  criticalParameter: boolean;
}

export interface ToolingRequirement {
  toolId: string;
  toolType: string;
  quantity: number;
  setupPosition?: string;
}

export interface ProductionMetrics {
  targetCycleTime: number;
  actualCycleTime: number;
  efficiency: number;
  scrapRate: number;
  reworkRate: number;
  downtimeMinutes: number;
  setupTimeMinutes: number;
}

export interface ProductionSchedule {
  id: string;
  plantId: string;
  shift: Shift;
  date: Date;
  jobs: ProductionJob[];
  equipmentAllocations: EquipmentAllocation[];
  constraints: SchedulingConstraint[];
  optimizationScore: number;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string;
  breakTimes: BreakTime[];
  crew: CrewMember[];
}

export interface BreakTime {
  startTime: string;
  duration: number; // minutes
  type: 'BREAK' | 'LUNCH' | 'SHIFT_CHANGE';
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  certifications: string[];
  experience: number; // years
}

export interface EquipmentAllocation {
  equipmentId: string;
  jobId: string;
  startTime: Date;
  endTime: Date;
  utilizationPercentage: number;
}

export interface SchedulingConstraint {
  type: ConstraintType;
  description: string;
  equipmentIds?: string[];
  materialIds?: string[];
  priority: number;
}

export enum ConstraintType {
  EQUIPMENT_AVAILABILITY = 'EQUIPMENT_AVAILABILITY',
  MATERIAL_AVAILABILITY = 'MATERIAL_AVAILABILITY',
  CREW_AVAILABILITY = 'CREW_AVAILABILITY',
  DEADLINE = 'DEADLINE',
  SETUP_TIME = 'SETUP_TIME',
  QUALITY_GATE = 'QUALITY_GATE',
  DEPENDENCY = 'DEPENDENCY'
}

// ============================================================================
// Maintenance Types
// ============================================================================

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: Date;
  actualDate?: Date;
  duration: number; // minutes
  technician?: string;
  description: string;
  parts: PartReplacement[];
  cost: number;
  downtime: number; // minutes
  notes: string;
  completionChecklist?: ChecklistItem[];
}

export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  PREDICTIVE = 'PREDICTIVE',
  CORRECTIVE = 'CORRECTIVE',
  EMERGENCY = 'EMERGENCY',
  CALIBRATION = 'CALIBRATION',
  INSPECTION = 'INSPECTION'
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE'
}

export interface PartReplacement {
  partNumber: string;
  partName: string;
  quantity: number;
  cost: number;
  supplier?: string;
}

export interface ChecklistItem {
  item: string;
  completed: boolean;
  notes?: string;
}

export interface FailurePrediction {
  equipmentId: string;
  timestamp: Date;
  failureProbability: number; // 0-1
  remainingUsefulLife: number; // hours
  predictedFailureDate: Date;
  confidenceInterval: [number, number];
  contributingFactors: FailureFactor[];
  recommendedAction: MaintenanceRecommendation;
  modelVersion: string;
  features: FeatureImportance[];
}

export interface FailureFactor {
  factor: string;
  importance: number;
  currentValue: number;
  thresholdValue: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

export interface MaintenanceRecommendation {
  action: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCost: number;
  estimatedDowntime: number; // minutes
  suggestedDate: Date;
  rationale: string;
}

export interface FeatureImportance {
  featureName: string;
  importance: number;
  currentValue: number;
  normalRange: [number, number];
}

export interface MaintenanceSchedule {
  equipmentId: string;
  preventiveMaintenance: PreventiveMaintenancePlan[];
  predictedMaintenance: FailurePrediction[];
  maintenanceWindows: MaintenanceWindow[];
}

export interface PreventiveMaintenancePlan {
  taskId: string;
  description: string;
  frequency: MaintenanceFrequency;
  lastPerformed?: Date;
  nextDue: Date;
  estimatedDuration: number;
  requiredParts: string[];
  requiredTools: string[];
}

export interface MaintenanceFrequency {
  interval: number;
  unit: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS' | 'CYCLES';
}

export interface MaintenanceWindow {
  startTime: Date;
  endTime: Date;
  type: 'PLANNED' | 'EMERGENCY' | 'OPPORTUNITY';
  availableForMaintenance: boolean;
}

// ============================================================================
// Quality Control Types
// ============================================================================

export interface QualityCheckpoint {
  id: string;
  name: string;
  type: QualityCheckType;
  frequency: InspectionFrequency;
  parameters: QualityParameter[];
  samplingPlan: SamplingPlan;
  inspectionMethod: string;
  requiredEquipment?: string[];
}

export enum QualityCheckType {
  INCOMING_INSPECTION = 'INCOMING_INSPECTION',
  IN_PROCESS_INSPECTION = 'IN_PROCESS_INSPECTION',
  FINAL_INSPECTION = 'FINAL_INSPECTION',
  FIRST_ARTICLE_INSPECTION = 'FIRST_ARTICLE_INSPECTION',
  PATROL_INSPECTION = 'PATROL_INSPECTION',
  AUTOMATED_INSPECTION = 'AUTOMATED_INSPECTION'
}

export interface InspectionFrequency {
  type: 'CONTINUOUS' | 'PERIODIC' | 'SAMPLING' | 'ON_DEMAND';
  interval?: number;
  unit?: 'UNITS' | 'HOURS' | 'BATCHES';
}

export interface QualityParameter {
  id: string;
  name: string;
  type: ParameterType;
  specification: Specification;
  measurementMethod: string;
  criticalParameter: boolean;
}

export enum ParameterType {
  DIMENSION = 'DIMENSION',
  WEIGHT = 'WEIGHT',
  TEMPERATURE = 'TEMPERATURE',
  PRESSURE = 'PRESSURE',
  HARDNESS = 'HARDNESS',
  SURFACE_FINISH = 'SURFACE_FINISH',
  VISUAL = 'VISUAL',
  CHEMICAL = 'CHEMICAL',
  ELECTRICAL = 'ELECTRICAL'
}

export interface Specification {
  nominal: number;
  upperLimit: number;
  lowerLimit: number;
  unit: string;
  toleranceType: 'BILATERAL' | 'UNILATERAL' | 'ASYMMETRIC';
}

export interface SamplingPlan {
  sampleSize: number;
  acceptanceQualityLimit: number; // AQL
  rejectionNumber: number;
  acceptanceNumber: number;
  inspectionLevel: 'I' | 'II' | 'III';
}

export interface QualityInspectionResult {
  id: string;
  checkpointId: string;
  timestamp: Date;
  inspector: string;
  measurements: Measurement[];
  overallResult: 'PASS' | 'FAIL' | 'CONDITIONAL';
  defects: Defect[];
  disposition: Disposition;
  notes: string;
}

export interface Measurement {
  parameterId: string;
  value: number;
  unit: string;
  withinSpecification: boolean;
  deviation?: number;
}

export interface Defect {
  id: string;
  type: DefectType;
  severity: DefectSeverity;
  location: string;
  description: string;
  imageUrl?: string;
  rootCause?: string;
  correctiveAction?: string;
}

export enum DefectType {
  DIMENSIONAL = 'DIMENSIONAL',
  SURFACE = 'SURFACE',
  MATERIAL = 'MATERIAL',
  ASSEMBLY = 'ASSEMBLY',
  FUNCTIONAL = 'FUNCTIONAL',
  COSMETIC = 'COSMETIC'
}

export enum DefectSeverity {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR'
}

export interface Disposition {
  decision: 'ACCEPT' | 'REJECT' | 'REWORK' | 'USE_AS_IS' | 'SCRAP';
  authority: string;
  timestamp: Date;
  justification?: string;
}

export interface SPCChart {
  parameterId: string;
  chartType: SPCChartType;
  dataPoints: SPCDataPoint[];
  controlLimits: ControlLimits;
  violations: ControlViolation[];
  processCapability: ProcessCapability;
}

export enum SPCChartType {
  X_BAR = 'X_BAR',
  R_CHART = 'R_CHART',
  X_MR = 'X_MR',
  P_CHART = 'P_CHART',
  NP_CHART = 'NP_CHART',
  C_CHART = 'C_CHART',
  U_CHART = 'U_CHART'
}

export interface SPCDataPoint {
  timestamp: Date;
  value: number;
  subgroupNumber: number;
  outOfControl: boolean;
}

export interface ControlLimits {
  centerLine: number;
  upperControlLimit: number;
  lowerControlLimit: number;
  upperWarningLimit: number;
  lowerWarningLimit: number;
  upperSpecificationLimit: number;
  lowerSpecificationLimit: number;
}

export interface ControlViolation {
  timestamp: Date;
  rule: string;
  description: string;
  dataPoints: number[];
}

export interface ProcessCapability {
  cp: number;  // Process capability
  cpk: number; // Process capability index
  pp: number;  // Process performance
  ppk: number; // Process performance index
  sigma: number;
  defectsPerMillionOpportunities: number;
}

// ============================================================================
// OEE (Overall Equipment Effectiveness) Types
// ============================================================================

export interface OEEMetrics {
  equipmentId: string;
  period: TimePeriod;
  availability: number;      // percentage
  performance: number;       // percentage
  quality: number;           // percentage
  oee: number;              // percentage
  components: OEEComponents;
  losses: ProductionLosses;
}

export interface TimePeriod {
  start: Date;
  end: Date;
  shift?: string;
}

export interface OEEComponents {
  plannedProductionTime: number;  // minutes
  actualRunningTime: number;      // minutes
  idealCycleTime: number;         // seconds
  totalPieces: number;
  goodPieces: number;
  downtime: DowntimeBreakdown;
}

export interface DowntimeBreakdown {
  plannedDowntime: number;        // minutes
  unplannedDowntime: number;      // minutes
  breakdowns: number;
  setupAndAdjustments: number;
  smallStops: number;
  reducedSpeed: number;
}

export interface ProductionLosses {
  availabilityLoss: number;       // minutes
  performanceLoss: number;        // minutes
  qualityLoss: number;           // units
  totalLossTime: number;         // minutes
  lossCategories: LossCategory[];
}

export interface LossCategory {
  category: SixBigLoss;
  duration: number;              // minutes or units
  frequency: number;
  impact: number;                // percentage of total loss
}

export enum SixBigLoss {
  BREAKDOWNS = 'BREAKDOWNS',
  SETUP_ADJUSTMENTS = 'SETUP_ADJUSTMENTS',
  SMALL_STOPS = 'SMALL_STOPS',
  REDUCED_SPEED = 'REDUCED_SPEED',
  STARTUP_REJECTS = 'STARTUP_REJECTS',
  PRODUCTION_REJECTS = 'PRODUCTION_REJECTS'
}

export interface OEETarget {
  equipmentId: string;
  targetOEE: number;
  targetAvailability: number;
  targetPerformance: number;
  targetQuality: number;
  benchmarkOEE?: number;
}

// ============================================================================
// IoT and Sensor Types
// ============================================================================

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  equipmentId: string;
  location: string;
  unit: string;
  samplingRate: number;           // Hz
  protocol: IoTProtocol;
  calibrationDate?: Date;
  calibrationDue?: Date;
  normalRange: [number, number];
  alarmThresholds: AlarmThreshold[];
}

export enum SensorType {
  TEMPERATURE = 'TEMPERATURE',
  PRESSURE = 'PRESSURE',
  VIBRATION = 'VIBRATION',
  CURRENT = 'CURRENT',
  VOLTAGE = 'VOLTAGE',
  FLOW_RATE = 'FLOW_RATE',
  LEVEL = 'LEVEL',
  SPEED = 'SPEED',
  TORQUE = 'TORQUE',
  POSITION = 'POSITION',
  PROXIMITY = 'PROXIMITY',
  FORCE = 'FORCE',
  HUMIDITY = 'HUMIDITY',
  ACOUSTIC = 'ACOUSTIC',
  VISION = 'VISION'
}

export enum IoTProtocol {
  MQTT = 'MQTT',
  OPC_UA = 'OPC_UA',
  MODBUS = 'MODBUS',
  PROFINET = 'PROFINET',
  ETHERNET_IP = 'ETHERNET_IP',
  HTTP = 'HTTP',
  COAP = 'COAP'
}

export interface AlarmThreshold {
  level: AlarmLevel;
  value: number;
  hysteresis?: number;
}

export enum AlarmLevel {
  WARNING = 'WARNING',
  ALARM = 'ALARM',
  CRITICAL = 'CRITICAL'
}

export interface SensorReading {
  sensorId: string;
  timestamp: Date;
  value: number;
  quality: DataQuality;
  alarm?: AlarmLevel;
}

export enum DataQuality {
  GOOD = 'GOOD',
  UNCERTAIN = 'UNCERTAIN',
  BAD = 'BAD'
}

export interface SensorDataBatch {
  sensorId: string;
  readings: SensorReading[];
  statistics: SensorStatistics;
}

export interface SensorStatistics {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  trend: number;
}

export interface IoTDevice {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  firmwareVersion: string;
  ipAddress: string;
  macAddress: string;
  status: DeviceStatus;
  lastHeartbeat: Date;
  sensors: Sensor[];
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE'
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface ProductionAnalytics {
  plantId: string;
  period: TimePeriod;
  overallOEE: number;
  totalProduction: number;
  totalDowntime: number;
  equipmentUtilization: number;
  scrapRate: number;
  trends: ProductionTrend[];
  topIssues: ProductionIssue[];
}

export interface ProductionTrend {
  metric: string;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  changePercent: number;
  dataPoints: TrendDataPoint[];
}

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
}

export interface ProductionIssue {
  category: string;
  description: string;
  frequency: number;
  totalImpact: number;
  equipmentIds: string[];
}

export interface CapacityPlan {
  plantId: string;
  planningHorizon: TimePeriod;
  demand: DemandForecast[];
  capacity: CapacityAnalysis;
  gaps: CapacityGap[];
  recommendations: CapacityRecommendation[];
}

export interface DemandForecast {
  productId: string;
  period: TimePeriod;
  forecastedDemand: number;
  confidence: number;
  seasonalFactor?: number;
}

export interface CapacityAnalysis {
  totalCapacity: number;
  utilizedCapacity: number;
  availableCapacity: number;
  bottleneckEquipment: string[];
  constraintAnalysis: ConstraintAnalysis[];
}

export interface ConstraintAnalysis {
  resource: string;
  capacity: number;
  demand: number;
  utilization: number;
  isBottleneck: boolean;
}

export interface CapacityGap {
  period: TimePeriod;
  productId: string;
  demand: number;
  capacity: number;
  gap: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CapacityRecommendation {
  type: 'ADD_EQUIPMENT' | 'ADD_SHIFT' | 'OUTSOURCE' | 'OPTIMIZE_SCHEDULE';
  description: string;
  estimatedCost: number;
  estimatedImpact: number;
  implementationTime: number; // days
  priority: number;
}

// ============================================================================
// Machine Learning Model Types
// ============================================================================

export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: ModelType;
  trainedDate: Date;
  features: string[];
  targetVariable: string;
  performance: ModelPerformance;
  hyperparameters: Record<string, unknown>;
}

export enum ModelType {
  RANDOM_FOREST = 'RANDOM_FOREST',
  GRADIENT_BOOSTING = 'GRADIENT_BOOSTING',
  NEURAL_NETWORK = 'NEURAL_NETWORK',
  SVM = 'SVM',
  LINEAR_REGRESSION = 'LINEAR_REGRESSION',
  LOGISTIC_REGRESSION = 'LOGISTIC_REGRESSION'
}

export interface ModelPerformance {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  rmse?: number;
  mae?: number;
  r2?: number;
  auc?: number;
}

export interface PredictionRequest {
  modelId: string;
  features: Record<string, number>;
  timestamp: Date;
}

export interface PredictionResponse {
  prediction: number | string;
  probability?: number;
  confidence: number;
  featureImportances: FeatureImportance[];
  timestamp: Date;
}

// ============================================================================
// Event and Notification Types
// ============================================================================

export interface ProductionEvent {
  id: string;
  type: EventType;
  equipmentId?: string;
  timestamp: Date;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  data: Record<string, unknown>;
  acknowledged: boolean;
}

export enum EventType {
  EQUIPMENT_STATUS_CHANGE = 'EQUIPMENT_STATUS_CHANGE',
  PRODUCTION_START = 'PRODUCTION_START',
  PRODUCTION_COMPLETE = 'PRODUCTION_COMPLETE',
  QUALITY_ALERT = 'QUALITY_ALERT',
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
  MAINTENANCE_COMPLETE = 'MAINTENANCE_COMPLETE',
  ALARM_TRIGGERED = 'ALARM_TRIGGERED',
  DOWNTIME_START = 'DOWNTIME_START',
  DOWNTIME_END = 'DOWNTIME_END',
  TARGET_MISSED = 'TARGET_MISSED',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED'
}

export interface Notification {
  id: string;
  recipient: string;
  channel: NotificationChannel;
  event: ProductionEvent;
  sentAt: Date;
  delivered: boolean;
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  DASHBOARD = 'DASHBOARD'
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface MESConfiguration {
  plantId: string;
  timezone: string;
  shifts: Shift[];
  workingDays: number[];  // 0-6, Sunday-Saturday
  oeeTargets: OEETarget[];
  qualityStandards: QualityStandard[];
  maintenancePolicy: MaintenancePolicy;
  iotConfiguration: IoTConfiguration;
}

export interface QualityStandard {
  standard: string;
  version: string;
  applicableProducts: string[];
  requirements: string[];
}

export interface MaintenancePolicy {
  preventiveMaintenanceEnabled: boolean;
  predictiveMaintenanceEnabled: boolean;
  minimumTimeToFailure: number; // hours
  maintenanceLeadTime: number;  // days
  sparesInventoryPolicy: string;
}

export interface IoTConfiguration {
  dataRetentionDays: number;
  aggregationInterval: number; // seconds
  edgeProcessingEnabled: boolean;
  protocols: IoTProtocol[];
  securityConfiguration: SecurityConfiguration;
}

export interface SecurityConfiguration {
  tlsEnabled: boolean;
  authenticationMethod: string;
  encryptionEnabled: boolean;
  certificatePath?: string;
}
