/**
 * Energy Management Platform - Type Definitions
 * Comprehensive types for smart grid, renewable energy, and optimization
 */

// ============================================================================
// Time Series & Data Types
// ============================================================================

export interface TimeSeriesData {
  timestamps: Date[]
  values: number[]
  metadata?: Record<string, any>
}

export interface TimeSeriesDataFrame {
  index: Date[]
  columns: string[]
  data: number[][]
}

export interface Forecast {
  timestamps: Date[]
  predictions: number[]
  confidence?: ConfidenceInterval[]
  metadata?: ForecastMetadata
}

export interface ConfidenceInterval {
  lower: number
  upper: number
  level: number // e.g., 0.95 for 95% confidence
}

export interface ForecastMetadata {
  model: string
  trainedAt: Date
  horizon: number
  features: string[]
  performance?: PerformanceMetrics
}

export interface PerformanceMetrics {
  mape: number // Mean Absolute Percentage Error
  rmse: number // Root Mean Squared Error
  mae: number // Mean Absolute Error
  r2: number // R-squared
  mase?: number // Mean Absolute Scaled Error
}

// ============================================================================
// Location & Weather Types
// ============================================================================

export interface Location {
  latitude: number
  longitude: number
  altitude: number
  timezone?: string
  name?: string
}

export interface WeatherData {
  timestamp: Date
  temperature: number // Celsius
  humidity: number // 0-1
  pressure: number // hPa
  windSpeed: number // m/s
  windDirection: number // degrees
  cloudCover: number // 0-1
  ghi?: number // Global Horizontal Irradiance (W/m²)
  dni?: number // Direct Normal Irradiance (W/m²)
  dhi?: number // Diffuse Horizontal Irradiance (W/m²)
  precipitation?: number // mm
}

export interface WeatherForecast {
  location: Location
  forecasts: WeatherData[]
  source: string
  issuedAt: Date
}

// ============================================================================
// Load Forecasting Types
// ============================================================================

export interface LoadForecasterOptions {
  models: LoadForecastModel[]
  ensemble?: boolean
  horizon: number // hours
  features: string[]
  hyperparameters?: Record<string, any>
}

export type LoadForecastModel =
  | 'lstm'
  | 'prophet'
  | 'xgboost'
  | 'arima'
  | 'sarima'
  | 'random_forest'
  | 'gradient_boosting'

export interface LoadForecastResult extends Forecast {
  peak?: number
  valley?: number
  peakTime?: Date
  valleyTime?: Date
}

export interface LoadHistoricalData {
  timestamp: Date
  load: number // MW
  temperature?: number
  humidity?: number
  dayOfWeek?: number
  hour?: number
  isHoliday?: boolean
  economicActivity?: number
}

export interface FeatureImportance {
  feature: string
  importance: number
  rank: number
}

// ============================================================================
// Renewable Energy Types
// ============================================================================

export interface RenewableForecasterOptions {
  sources: RenewableSource[]
  models: {
    solar?: SolarForecastModel
    wind?: WindForecastModel
  }
}

export type RenewableSource = 'solar' | 'wind' | 'hydro' | 'biomass'

export type SolarForecastModel =
  | 'pvlib'
  | 'pvlib_ml_hybrid'
  | 'satellite'
  | 'nwp'
  | 'persistence'

export type WindForecastModel =
  | 'power_curve'
  | 'power_curve_ml'
  | 'nwp'
  | 'statistical'

export interface SolarForecastParams {
  location: Location
  capacity: number // kW
  panelSpecs: SolarPanelSpecs
  weather: WeatherForecast
  horizon?: number
}

export interface SolarPanelSpecs {
  efficiency: number // 0-1
  tilt: number // degrees
  azimuth: number // degrees (0=North, 90=East, 180=South, 270=West)
  temperatureCoefficient: number // per °C
  area?: number // m²
  degradation?: number // per year
  inverterEfficiency?: number // 0-1
}

export interface SolarForecast extends Forecast {
  irradiance: number[] // W/m²
  cellTemperature?: number[]
  dcPower?: number[]
  acPower?: number[]
  capacity_factor?: number
}

export interface WindForecastParams {
  location: Location
  capacity: number // kW
  turbineSpecs: WindTurbineSpecs
  weather: WeatherForecast
  horizon?: number
}

export interface WindTurbineSpecs {
  hubHeight: number // meters
  rotorDiameter: number // meters
  ratedPower: number // kW
  cutInSpeed: number // m/s
  cutOutSpeed: number // m/s
  powerCurve: PowerCurve
  efficiency?: number
  availability?: number // 0-1
}

export interface PowerCurve {
  windSpeeds: number[] // m/s
  power: number[] // kW or fraction of rated
}

export interface WindForecast extends Forecast {
  windSpeed: number[] // m/s at hub height
  power: number[]
  capacity_factor?: number
}

// ============================================================================
// Battery & Storage Types
// ============================================================================

export interface BatterySpecs {
  capacity: number // kWh
  power: number // kW (max charge/discharge rate)
  efficiency: number // round-trip efficiency (0-1)
  depthOfDischarge: number // max DOD (0-1)
  cycleLife: number // number of cycles
  degradationModel?: DegradationModel
  initialSOC?: number // 0-1
  thermalModel?: ThermalModel
}

export type DegradationModel =
  | 'linear_capacity_fade'
  | 'cycle_counting'
  | 'semi_empirical'
  | 'electrochemical'

export interface ThermalModel {
  ambientTemperature: number // °C
  thermalResistance: number // °C/W
  heatCapacity: number // J/°C
  maxTemperature: number // °C
  minTemperature: number // °C
}

export interface BatteryState {
  soc: number // State of Charge (0-1)
  power: number // Current power (kW, negative = discharge)
  temperature?: number // °C
  cycles: number // Cumulative cycles
  health?: number // State of Health (0-1)
}

export interface BatteryOptimizationParams {
  loadForecast: Forecast
  renewableForecast?: Forecast
  prices: PriceForecast
  horizon: number // hours
  objective: OptimizationObjective
  constraints?: BatteryConstraints
}

export type OptimizationObjective =
  | 'maximize_revenue'
  | 'minimize_cost'
  | 'maximize_self_consumption'
  | 'minimize_peak_demand'
  | 'minimize_emissions'

export interface BatteryConstraints {
  socMin: number // 0-1
  socMax: number // 0-1
  maxCycles?: number // per day
  reserveRequirement?: number // fraction to keep in reserve
  temperatureLimit?: number // °C
}

export interface BatterySchedule {
  timestamps: Date[]
  soc: number[] // State of charge
  power: number[] // Power (negative = discharge)
  revenue?: number
  degradationCost?: number
  netRevenue?: number
}

// ============================================================================
// Demand Response Types
// ============================================================================

export interface DemandResponseProgram {
  type: DRProgramType
  assets?: DRAsset[]
  customers?: Customer[]
  capacity: number // kW
  curtailmentLimit?: number // max events per period
}

export type DRProgramType =
  | 'direct_load_control'
  | 'price_based'
  | 'emergency'
  | 'incentive_based'
  | 'ancillary_services'

export interface DRAsset {
  id: string
  type: AssetType
  capacity: number // kW
  flexibility: FlexibilityProfile
  location?: Location
}

export type AssetType =
  | 'hvac'
  | 'water_heater'
  | 'ev_charger'
  | 'industrial_process'
  | 'lighting'
  | 'refrigeration'

export interface FlexibilityProfile {
  minPower: number // kW
  maxPower: number // kW
  rampRate: number // kW/min
  recoveryTime: number // minutes
  curtailmentDuration: number // max minutes
}

export interface Customer {
  id: string
  segment: CustomerSegment
  averageLoad: number // kW
  priceElasticity?: number
  comfortPreferences?: ComfortPreferences
}

export type CustomerSegment =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'agricultural'

export interface ComfortPreferences {
  temperatureRange: { min: number; max: number }
  deferralTolerance: number // hours
  participationWillingness: number // 0-1
}

export interface DROptimizationParams {
  loadForecast: Forecast
  gridConstraints: GridConstraints
  eventTrigger: EventTrigger
  programs?: DemandResponseProgram[]
}

export interface EventTrigger {
  type: EventType
  threshold?: number
  duration?: number // hours
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export type EventType =
  | 'price_spike'
  | 'capacity_shortage'
  | 'frequency_deviation'
  | 'renewable_curtailment'
  | 'scheduled'

export interface DRSchedule {
  events: DREvent[]
  totalReduction: number // kW
  customerImpact: CustomerImpact[]
}

export interface DREvent {
  start: Date
  end: Date
  targetReduction: number // kW
  assets: string[] // asset IDs
  compensation?: number // $
}

export interface CustomerImpact {
  customerId: string
  reduction: number // kW
  discomfort: number // 0-1
  compensation: number // $
}

export interface DRResponse {
  eventId: string
  achievedReduction: number // kW
  complianceRate: number // 0-1
  totalIncentives: number // $
  assetPerformance: AssetPerformance[]
}

export interface AssetPerformance {
  assetId: string
  targetReduction: number
  actualReduction: number
  availability: number // 0-1
}

// ============================================================================
// Grid Management Types
// ============================================================================

export interface GridConfig {
  nominalFrequency: number // Hz
  voltageLevel: number // kV
  inertia: number // seconds
  droop: number // percentage
  topology?: GridTopology
}

export interface GridTopology {
  buses: Bus[]
  branches: Branch[]
  generators: Generator[]
}

export interface Bus {
  id: string
  type: BusType
  voltage: number // per unit
  angle: number // radians
  load?: number // MW
}

export type BusType = 'slack' | 'pv' | 'pq'

export interface Branch {
  id: string
  from: string // bus ID
  to: string // bus ID
  resistance: number // per unit
  reactance: number // per unit
  susceptance: number // per unit
  ratingMVA?: number
}

export interface Generator {
  id: string
  bus: string // bus ID
  type: GeneratorType
  capacity: number // MW
  minOutput: number // MW
  rampRate: number // MW/min
  heatRate?: number // BTU/kWh
  emissionRate?: number // kg CO2/MWh
  cost?: GeneratorCost
}

export type GeneratorType =
  | 'coal'
  | 'natural_gas'
  | 'nuclear'
  | 'hydro'
  | 'wind'
  | 'solar'
  | 'battery'

export interface GeneratorCost {
  fixed: number // $/hour
  variable: number // $/MWh
  startup: number // $
  shutdown: number // $
}

export interface GridConstraints {
  frequencyLimits: { min: number; max: number } // Hz
  voltageLimits: { min: number; max: number } // per unit
  lineLimits?: Record<string, number> // branch ID -> MW
  rampLimits?: Record<string, number> // generator ID -> MW/min
}

export interface AGCParams {
  frequencyError: number // Hz
  tieLineError: number // MW
  beta: number // MW/0.1Hz (frequency bias)
}

export interface AGCSignal {
  power: number // MW
  generators: Record<string, number> // generator ID -> MW
  timestamp: Date
}

export interface VAROptimizationParams {
  voltageLimits: { min: number; max: number }
  reactivePowerSources: ReactivePowerSource[]
  objective: 'minimize_losses' | 'maximize_voltage_stability'
}

export interface ReactivePowerSource {
  id: string
  bus: string
  type: 'generator' | 'capacitor' | 'reactor' | 'svc'
  qMin: number // MVAr
  qMax: number // MVAr
}

export interface VARSchedule {
  sources: Record<string, number> // source ID -> MVAr
  voltages: Record<string, number> // bus ID -> per unit
  losses: number // MW
}

export interface ControlAction {
  type: ControlActionType
  power?: number
  assets?: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
}

export type ControlActionType =
  | 'frequency_regulation'
  | 'voltage_control'
  | 'congestion_relief'
  | 'emergency_control'

// ============================================================================
// Market & Trading Types
// ============================================================================

export interface EnergyTraderOptions {
  markets: MarketType[]
  bidStrategy: BidStrategy
  riskTolerance: RiskTolerance
}

export type MarketType =
  | 'day_ahead'
  | 'real_time'
  | 'ancillary_services'
  | 'capacity'
  | 'rec'

export type BidStrategy =
  | 'profit_maximizing'
  | 'risk_averse'
  | 'market_making'
  | 'arbitrage'

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive'

export interface PriceForecast {
  timestamps: Date[]
  prices: number[] // $/MWh
  confidence?: ConfidenceInterval[]
}

export interface Bid {
  hour: number
  quantity: number // MW
  price: number // $/MWh
  type: 'energy' | 'regulation' | 'reserve'
}

export interface BidParams {
  loadForecast: Forecast
  renewableForecast?: Forecast
  priceForecasts: PriceForecast
  availableCapacity: AvailableCapacity
}

export interface AvailableCapacity {
  generation: number // MW
  storage: number // MW
  demandResponse: number // MW
}

export interface SubmissionResult {
  market: string
  accepted: boolean
  bids: Bid[]
  timestamp: Date
  confirmationId?: string
}

export interface TradingDecision {
  action: 'buy' | 'sell' | 'hold'
  quantity: number // MW
  price?: number // $/MWh
  reasoning?: string
}

export interface Position {
  market: string
  quantity: number // MW (positive = long, negative = short)
  averagePrice: number // $/MWh
  pnl: number // $
}

export interface AncillaryService {
  type: AncillaryServiceType
  capacity: number // MW
  price: number // $/MW
  duration: number // hours
}

export type AncillaryServiceType =
  | 'regulation_up'
  | 'regulation_down'
  | 'spinning_reserve'
  | 'non_spinning_reserve'
  | 'black_start'

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsConfig {
  dataWarehouse: DatabaseConfig
  metricsEngine: 'batch' | 'real_time'
  reporting: ReportingConfig
}

export interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

export interface ReportingConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  aggregations: AggregationLevel[]
}

export type AggregationLevel = 'hourly' | 'daily' | 'monthly' | 'annual'

export interface MetricsParams {
  period: DateRange
  metrics: MetricType[]
}

export interface DateRange {
  start: string | Date
  end: string | Date
}

export type MetricType =
  | 'forecast_accuracy'
  | 'renewable_capacity_factor'
  | 'battery_cycles'
  | 'demand_response_effectiveness'
  | 'grid_reliability'

export interface PerformanceMetricsResult {
  forecast_accuracy?: ForecastAccuracy
  renewable_capacity_factor?: CapacityFactors
  battery_cycles?: number
  demand_response_effectiveness?: number
  grid_reliability?: number
}

export interface ForecastAccuracy {
  load?: PerformanceMetrics
  solar?: PerformanceMetrics
  wind?: PerformanceMetrics
  price?: PerformanceMetrics
}

export interface CapacityFactors {
  solar?: number
  wind?: number
  combined?: number
}

export interface CostAnalysisParams {
  components: CostComponent[]
  allocation: 'activity_based' | 'proportional'
}

export type CostComponent =
  | 'generation'
  | 'transmission'
  | 'distribution'
  | 'storage'
  | 'demand_response'
  | 'market_operations'
  | 'maintenance'

export interface CostBreakdown {
  total: number
  components: Record<CostComponent, number>
  perMWh: number
  perCustomer?: number
}

export interface SustainabilityReportParams {
  standards: SustainabilityStandard[]
  metrics: SustainabilityMetric[]
}

export type SustainabilityStandard = 'GRI' | 'CDP' | 'TCFD' | 'SASB'

export type SustainabilityMetric =
  | 'renewable_penetration'
  | 'carbon_intensity'
  | 'avoided_emissions'
  | 'energy_efficiency'

export interface SustainabilityReport {
  period: DateRange
  renewable_penetration: number // 0-1
  carbon_intensity: number // kg CO2/MWh
  avoided_emissions: number // metric tons CO2
  energy_efficiency: number // 0-1
  standards: Record<SustainabilityStandard, any>
}

// ============================================================================
// Optimization Types
// ============================================================================

export interface OptimizationProblem {
  objective: ObjectiveFunction
  constraints: Constraints
  variables: Variable[]
  solver?: SolverType
}

export interface ObjectiveFunction {
  coefficients: number[]
  type: 'minimize' | 'maximize'
  quadratic?: number[][] // For QP
}

export interface Constraints {
  equality?: MatrixConstraint
  inequality?: MatrixConstraint
  bounds?: BoundsConstraint
}

export interface MatrixConstraint {
  A: number[][] // Coefficient matrix
  b: number[] // Right-hand side
}

export interface BoundsConstraint {
  lower: number[]
  upper: number[]
}

export interface Variable {
  name: string
  type: 'continuous' | 'integer' | 'binary'
  lowerBound?: number
  upperBound?: number
}

export type SolverType =
  | 'simplex'
  | 'interior_point'
  | 'cbc' // Coin-OR Branch and Cut
  | 'gurobi'
  | 'cplex'
  | 'scip'

export interface OptimizationResult {
  success: boolean
  objective: number
  variables: number[]
  dualVariables?: number[]
  solveTime: number // milliseconds
  iterations?: number
  gap?: number // For MILP
}

// ============================================================================
// Event & Streaming Types
// ============================================================================

export interface Event {
  id: string
  type: string
  timestamp: Date
  severity: Severity
  source: string
  data: any
}

export type Severity = 'info' | 'warning' | 'high' | 'critical'

export interface Measurement {
  id: string
  type: MeasurementType
  value: number
  unit: string
  timestamp: Date
  quality: number // 0-1
}

export type MeasurementType =
  | 'voltage'
  | 'current'
  | 'power'
  | 'frequency'
  | 'energy'
  | 'temperature'

export interface PMUMeasurement extends Measurement {
  phasor: {
    magnitude: number
    angle: number // radians
  }
  frequency: number // Hz
  rocof?: number // Rate of Change of Frequency (Hz/s)
}

export interface Anomaly {
  id: string
  type: AnomalyType
  severity: Severity
  timestamp: Date
  affected: string[] // asset/component IDs
  metrics: Record<string, number>
}

export type AnomalyType =
  | 'voltage_deviation'
  | 'frequency_deviation'
  | 'line_overload'
  | 'forecast_error'
  | 'equipment_failure'

export interface RootCause {
  anomaly: string
  cause: string
  description: string
  severity: Severity
  mitigation: string
  confidence: number // 0-1
}

// ============================================================================
// Training & ML Types
// ============================================================================

export interface TrainingData {
  features: number[][]
  targets: number[]
  featureNames: string[]
  timestamps?: Date[]
}

export interface TrainingResult {
  model: any // Trained model object
  metrics: PerformanceMetrics
  featureImportance?: FeatureImportance[]
  trainingTime: number // milliseconds
}

export interface HyperparameterTuning {
  method: 'grid_search' | 'random_search' | 'bayesian_optimization'
  iterations: number
  cv: number // Cross-validation folds
}

export interface ModelDrift {
  metric: string
  value: number
  threshold: number
  timestamp: Date
}

// ============================================================================
// Microgrid & VPP Types
// ============================================================================

export interface MicrogridAssets {
  solar?: { capacity: number; forecast: Forecast }
  wind?: { capacity: number; forecast: Forecast }
  battery?: BatterySpecs
  diesel?: { capacity: number; minLoad: number }
  loads?: { critical: number; flexible: number }
}

export interface MicrogridMode {
  mode: 'grid_connected' | 'islanded' | 'transitioning'
  islandedCapable: boolean
  blackstartCapable: boolean
}

export interface VPPResource {
  id: string
  type: 'solar' | 'battery' | 'ev' | 'thermostat' | 'load'
  capacity: number // kW
  flexibility: FlexibilityProfile
  location: Location
  owner?: string
}

export interface AggregatedForecast {
  total: Forecast
  byType: Record<string, Forecast>
  uncertainty: number // 0-1
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Alert {
  id: string
  severity: Severity
  message: string
  timestamp: Date
  acknowledged: boolean
  recipients: string[]
}

export interface Notification {
  channel: 'email' | 'sms' | 'pagerduty' | 'slack'
  recipients: string[]
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface MonitoringRule {
  metric: string
  condition: 'greater_than' | 'less_than' | 'outside_range' | 'inside_range'
  threshold: number | [number, number]
  severity: Severity
  action?: string
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Core data types
  TimeSeriesData,
  TimeSeriesDataFrame,
  Forecast,
  ConfidenceInterval,
  ForecastMetadata,
  PerformanceMetrics,

  // Location & Weather
  Location,
  WeatherData,
  WeatherForecast,

  // Load forecasting
  LoadForecasterOptions,
  LoadForecastModel,
  LoadForecastResult,
  LoadHistoricalData,
  FeatureImportance,

  // Renewable energy
  RenewableForecasterOptions,
  RenewableSource,
  SolarForecastModel,
  WindForecastModel,
  SolarForecastParams,
  SolarPanelSpecs,
  SolarForecast,
  WindForecastParams,
  WindTurbineSpecs,
  PowerCurve,
  WindForecast,

  // Battery & storage
  BatterySpecs,
  DegradationModel,
  ThermalModel,
  BatteryState,
  BatteryOptimizationParams,
  OptimizationObjective,
  BatteryConstraints,
  BatterySchedule,

  // Demand response
  DemandResponseProgram,
  DRProgramType,
  DRAsset,
  AssetType,
  FlexibilityProfile,
  Customer,
  CustomerSegment,
  ComfortPreferences,
  DROptimizationParams,
  EventTrigger,
  EventType,
  DRSchedule,
  DREvent,
  CustomerImpact,
  DRResponse,
  AssetPerformance,

  // Grid management
  GridConfig,
  GridTopology,
  Bus,
  BusType,
  Branch,
  Generator,
  GeneratorType,
  GeneratorCost,
  GridConstraints,
  AGCParams,
  AGCSignal,
  VAROptimizationParams,
  ReactivePowerSource,
  VARSchedule,
  ControlAction,
  ControlActionType,

  // Market & trading
  EnergyTraderOptions,
  MarketType,
  BidStrategy,
  RiskTolerance,
  PriceForecast,
  Bid,
  BidParams,
  AvailableCapacity,
  SubmissionResult,
  TradingDecision,
  Position,
  AncillaryService,
  AncillaryServiceType,

  // Analytics
  AnalyticsConfig,
  DatabaseConfig,
  ReportingConfig,
  AggregationLevel,
  MetricsParams,
  DateRange,
  MetricType,
  PerformanceMetricsResult,
  ForecastAccuracy,
  CapacityFactors,
  CostAnalysisParams,
  CostComponent,
  CostBreakdown,
  SustainabilityReportParams,
  SustainabilityStandard,
  SustainabilityMetric,
  SustainabilityReport,

  // Optimization
  OptimizationProblem,
  ObjectiveFunction,
  Constraints,
  MatrixConstraint,
  BoundsConstraint,
  Variable,
  SolverType,
  OptimizationResult,

  // Events & streaming
  Event,
  Severity,
  Measurement,
  MeasurementType,
  PMUMeasurement,
  Anomaly,
  AnomalyType,
  RootCause,

  // Training & ML
  TrainingData,
  TrainingResult,
  HyperparameterTuning,
  ModelDrift,

  // Microgrid & VPP
  MicrogridAssets,
  MicrogridMode,
  VPPResource,
  AggregatedForecast,

  // Utilities
  Alert,
  Notification,
  MonitoringRule,
}
