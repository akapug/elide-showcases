/**
 * Smart City Platform - Comprehensive Type Definitions
 *
 * TypeScript + Python interoperability types for urban infrastructure management,
 * traffic optimization, environmental monitoring, utilities, and public safety.
 */

// ============================================================================
// Core City Infrastructure Types
// ============================================================================

export interface CityConfig {
  cityId: string;
  cityName: string;
  population: number;
  area: number; // square kilometers
  timezone: string;
  coordinates: GeoCoordinates;
  districts: District[];
  metadata: Record<string, unknown>;
}

export interface District {
  districtId: string;
  name: string;
  type: DistrictType;
  population: number;
  area: number;
  boundaries: GeoBoundary[];
  zoneClassification: ZoneClassification;
}

export enum DistrictType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  MIXED_USE = 'mixed_use',
  RECREATIONAL = 'recreational',
  GOVERNMENT = 'government'
}

export enum ZoneClassification {
  URBAN_CORE = 'urban_core',
  SUBURBAN = 'suburban',
  RURAL = 'rural',
  SPECIAL_ECONOMIC = 'special_economic'
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface GeoBoundary {
  points: GeoCoordinates[];
  type: 'polygon' | 'multipolygon';
}

// ============================================================================
// Traffic Management Types
// ============================================================================

export interface TrafficNetwork {
  networkId: string;
  intersections: TrafficIntersection[];
  roads: RoadSegment[];
  zones: TrafficZone[];
  lastUpdated: Date;
}

export interface TrafficIntersection {
  intersectionId: string;
  location: GeoCoordinates;
  type: IntersectionType;
  signals: TrafficSignal[];
  sensors: TrafficSensor[];
  capacity: number;
  currentFlow: number;
  congestionLevel: CongestionLevel;
  priority: IntersectionPriority;
}

export enum IntersectionType {
  SIGNALIZED = 'signalized',
  STOP_CONTROLLED = 'stop_controlled',
  ROUNDABOUT = 'roundabout',
  UNCONTROLLED = 'uncontrolled',
  GRADE_SEPARATED = 'grade_separated'
}

export enum IntersectionPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface TrafficSignal {
  signalId: string;
  intersectionId: string;
  direction: Direction;
  phases: SignalPhase[];
  currentPhase: number;
  cycleLength: number; // seconds
  greenTime: number;
  redTime: number;
  yellowTime: number;
  pedestrianTime: number;
  isAdaptive: boolean;
  lastOptimized: Date;
}

export enum Direction {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west',
  NORTHEAST = 'northeast',
  NORTHWEST = 'northwest',
  SOUTHEAST = 'southeast',
  SOUTHWEST = 'southwest'
}

export interface SignalPhase {
  phaseId: number;
  duration: number; // seconds
  allowedDirections: Direction[];
  pedestrianCrossing: boolean;
  priority: number;
}

export interface TrafficSensor {
  sensorId: string;
  location: GeoCoordinates;
  type: SensorType;
  status: SensorStatus;
  lastReading: SensorReading;
  calibration: Date;
}

export enum SensorType {
  INDUCTIVE_LOOP = 'inductive_loop',
  CAMERA = 'camera',
  RADAR = 'radar',
  LIDAR = 'lidar',
  ULTRASONIC = 'ultrasonic',
  BLUETOOTH = 'bluetooth',
  WIFI = 'wifi',
  MICROWAVE = 'microwave'
}

export enum SensorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  CALIBRATING = 'calibrating'
}

export interface SensorReading {
  timestamp: Date;
  vehicleCount: number;
  avgSpeed: number;
  occupancy: number; // percentage
  classification: VehicleClassification;
  confidence: number;
}

export interface VehicleClassification {
  cars: number;
  trucks: number;
  buses: number;
  motorcycles: number;
  bicycles: number;
  pedestrians: number;
}

export interface RoadSegment {
  segmentId: string;
  name: string;
  type: RoadType;
  startPoint: GeoCoordinates;
  endPoint: GeoCoordinates;
  length: number; // meters
  lanes: number;
  speedLimit: number; // km/h
  capacity: number; // vehicles/hour
  currentFlow: TrafficFlow;
  condition: RoadCondition;
}

export enum RoadType {
  HIGHWAY = 'highway',
  ARTERIAL = 'arterial',
  COLLECTOR = 'collector',
  LOCAL = 'local',
  EXPRESSWAY = 'expressway'
}

export interface TrafficFlow {
  volume: number; // vehicles/hour
  speed: number; // km/h
  density: number; // vehicles/km
  levelOfService: LevelOfService;
  timestamp: Date;
}

export enum LevelOfService {
  A = 'A', // Free flow
  B = 'B', // Reasonably free flow
  C = 'C', // Stable flow
  D = 'D', // Approaching unstable flow
  E = 'E', // Unstable flow
  F = 'F'  // Forced or breakdown flow
}

export interface RoadCondition {
  surfaceQuality: SurfaceQuality;
  weather: WeatherCondition;
  visibility: number; // meters
  hazards: RoadHazard[];
  maintenanceNeeded: boolean;
}

export enum SurfaceQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical'
}

export interface RoadHazard {
  type: HazardType;
  location: GeoCoordinates;
  severity: HazardSeverity;
  reported: Date;
  resolved: boolean;
}

export enum HazardType {
  POTHOLE = 'pothole',
  DEBRIS = 'debris',
  FLOODING = 'flooding',
  ICE = 'ice',
  CONSTRUCTION = 'construction',
  ACCIDENT = 'accident',
  ANIMAL = 'animal'
}

export enum HazardSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface TrafficZone {
  zoneId: string;
  name: string;
  boundary: GeoBoundary;
  type: ZoneType;
  restrictions: ZoneRestriction[];
  occupancy: number;
  capacity: number;
}

export enum ZoneType {
  PEDESTRIAN = 'pedestrian',
  LOW_EMISSION = 'low_emission',
  RESTRICTED_ACCESS = 'restricted_access',
  PARKING = 'parking',
  LOADING = 'loading'
}

export interface ZoneRestriction {
  type: RestrictionType;
  schedule: Schedule;
  exemptions: string[];
  enforcement: EnforcementLevel;
}

export enum RestrictionType {
  NO_VEHICLES = 'no_vehicles',
  EMISSIONS_STANDARD = 'emissions_standard',
  TIME_BASED = 'time_based',
  PERMIT_ONLY = 'permit_only',
  RESIDENT_ONLY = 'resident_only'
}

export enum EnforcementLevel {
  ADVISORY = 'advisory',
  MONITORED = 'monitored',
  ENFORCED = 'enforced',
  STRICT = 'strict'
}

export interface Schedule {
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  exceptions: Date[];
}

export enum CongestionLevel {
  FREE_FLOW = 'free_flow',
  LIGHT = 'light',
  MODERATE = 'moderate',
  HEAVY = 'heavy',
  SEVERE = 'severe',
  GRIDLOCK = 'gridlock'
}

export interface TrafficOptimizationResult {
  optimizationId: string;
  timestamp: Date;
  signalAdjustments: SignalAdjustment[];
  predictedImprovement: number; // percentage
  estimatedDelay: number; // seconds
  confidence: number;
  algorithm: OptimizationAlgorithm;
  convergence: ConvergenceMetrics;
}

export enum OptimizationAlgorithm {
  GENETIC_ALGORITHM = 'genetic_algorithm',
  SIMULATED_ANNEALING = 'simulated_annealing',
  REINFORCEMENT_LEARNING = 'reinforcement_learning',
  LINEAR_PROGRAMMING = 'linear_programming',
  DYNAMIC_PROGRAMMING = 'dynamic_programming'
}

export interface SignalAdjustment {
  signalId: string;
  currentCycle: number;
  optimizedCycle: number;
  phaseAdjustments: PhaseAdjustment[];
  priority: number;
}

export interface PhaseAdjustment {
  phaseId: number;
  currentDuration: number;
  optimizedDuration: number;
  delta: number;
}

export interface ConvergenceMetrics {
  iterations: number;
  finalError: number;
  improvementRate: number;
  convergenceTime: number; // milliseconds
}

// ============================================================================
// Environmental Monitoring Types
// ============================================================================

export interface EnvironmentalNetwork {
  networkId: string;
  airQualitySensors: AirQualitySensor[];
  noiseSensors: NoiseSensor[];
  weatherStations: WeatherStation[];
  wasteManagement: WasteManagementSystem;
}

export interface AirQualitySensor {
  sensorId: string;
  location: GeoCoordinates;
  status: SensorStatus;
  measurements: AirQualityMeasurement;
  calibration: Date;
  manufacturer: string;
  model: string;
}

export interface AirQualityMeasurement {
  timestamp: Date;
  pm25: number;      // μg/m³
  pm10: number;      // μg/m³
  no2: number;       // ppb
  so2: number;       // ppb
  co: number;        // ppm
  o3: number;        // ppb
  voc: number;       // ppb
  temperature: number; // °C
  humidity: number;    // %
  pressure: number;    // hPa
  aqi: number;        // Air Quality Index
  category: AirQualityCategory;
}

export enum AirQualityCategory {
  GOOD = 'good',                      // 0-50
  MODERATE = 'moderate',              // 51-100
  UNHEALTHY_SENSITIVE = 'unhealthy_for_sensitive', // 101-150
  UNHEALTHY = 'unhealthy',            // 151-200
  VERY_UNHEALTHY = 'very_unhealthy',  // 201-300
  HAZARDOUS = 'hazardous'             // 301+
}

export interface NoiseSensor {
  sensorId: string;
  location: GeoCoordinates;
  status: SensorStatus;
  measurements: NoiseMeasurement;
  threshold: number; // dB
}

export interface NoiseMeasurement {
  timestamp: Date;
  level: number;        // dB
  leq: number;          // Equivalent continuous sound level
  lmax: number;         // Maximum level
  lmin: number;         // Minimum level
  frequency: FrequencySpectrum;
  compliance: boolean;
}

export interface FrequencySpectrum {
  low: number;    // 20-200 Hz
  mid: number;    // 200-2000 Hz
  high: number;   // 2000-20000 Hz
}

export interface WeatherStation {
  stationId: string;
  location: GeoCoordinates;
  status: SensorStatus;
  currentWeather: WeatherCondition;
  forecast: WeatherForecast[];
}

export interface WeatherCondition {
  timestamp: Date;
  temperature: number;      // °C
  feelsLike: number;        // °C
  humidity: number;         // %
  pressure: number;         // hPa
  windSpeed: number;        // km/h
  windDirection: Direction;
  precipitation: number;    // mm
  visibility: number;       // km
  cloudCover: number;       // %
  uvIndex: number;
  condition: WeatherType;
}

export enum WeatherType {
  CLEAR = 'clear',
  PARTLY_CLOUDY = 'partly_cloudy',
  CLOUDY = 'cloudy',
  RAIN = 'rain',
  HEAVY_RAIN = 'heavy_rain',
  SNOW = 'snow',
  FOG = 'fog',
  STORM = 'storm'
}

export interface WeatherForecast {
  timestamp: Date;
  condition: WeatherCondition;
  confidence: number;
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  alertId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  affectedAreas: string[];
}

export enum AlertType {
  EXTREME_HEAT = 'extreme_heat',
  EXTREME_COLD = 'extreme_cold',
  HEAVY_RAIN = 'heavy_rain',
  FLOOD = 'flood',
  STORM = 'storm',
  HIGH_WIND = 'high_wind',
  SNOW = 'snow',
  AIR_QUALITY = 'air_quality'
}

export enum AlertSeverity {
  INFO = 'info',
  ADVISORY = 'advisory',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

// ============================================================================
// Waste Management Types
// ============================================================================

export interface WasteManagementSystem {
  systemId: string;
  bins: SmartBin[];
  trucks: WasteTruck[];
  facilities: WasteFacility[];
  routes: WasteRoute[];
}

export interface SmartBin {
  binId: string;
  location: GeoCoordinates;
  type: WasteType;
  capacity: number; // liters
  fillLevel: number; // percentage
  temperature: number;
  lastCollection: Date;
  nextScheduled: Date;
  status: BinStatus;
  sensor: IoTSensor;
}

export enum WasteType {
  GENERAL = 'general',
  RECYCLABLE = 'recyclable',
  ORGANIC = 'organic',
  HAZARDOUS = 'hazardous',
  ELECTRONIC = 'electronic',
  GLASS = 'glass',
  METAL = 'metal'
}

export enum BinStatus {
  NORMAL = 'normal',
  NEARLY_FULL = 'nearly_full',
  FULL = 'full',
  OVERFLOW = 'overflow',
  MAINTENANCE = 'maintenance',
  DAMAGED = 'damaged'
}

export interface WasteTruck {
  truckId: string;
  location: GeoCoordinates;
  capacity: number;
  currentLoad: number;
  status: TruckStatus;
  route: string;
  driver: string;
  fuelLevel: number;
  lastMaintenance: Date;
}

export enum TruckStatus {
  IDLE = 'idle',
  IN_ROUTE = 'in_route',
  COLLECTING = 'collecting',
  RETURNING = 'returning',
  MAINTENANCE = 'maintenance',
  EMERGENCY = 'emergency'
}

export interface WasteFacility {
  facilityId: string;
  name: string;
  location: GeoCoordinates;
  type: FacilityType;
  capacity: number;
  currentLoad: number;
  acceptedWasteTypes: WasteType[];
  operatingHours: Schedule;
}

export enum FacilityType {
  LANDFILL = 'landfill',
  RECYCLING_CENTER = 'recycling_center',
  COMPOSTING = 'composting',
  INCINERATOR = 'incinerator',
  TRANSFER_STATION = 'transfer_station'
}

export interface WasteRoute {
  routeId: string;
  truckId: string;
  bins: string[];
  distance: number; // km
  estimatedDuration: number; // minutes
  optimizationScore: number;
  waypoints: GeoCoordinates[];
}

// ============================================================================
// Utilities Management Types
// ============================================================================

export interface SmartLightingSystem {
  systemId: string;
  streetLights: StreetLight[];
  zones: LightingZone[];
  schedule: LightingSchedule;
  energyUsage: EnergyMetrics;
}

export interface StreetLight {
  lightId: string;
  location: GeoCoordinates;
  type: LightType;
  brightness: number; // percentage
  status: LightStatus;
  energyConsumption: number; // watts
  motionDetected: boolean;
  lastMaintenance: Date;
  lifespan: number; // hours
}

export enum LightType {
  LED = 'led',
  SODIUM_VAPOR = 'sodium_vapor',
  HALOGEN = 'halogen',
  FLUORESCENT = 'fluorescent'
}

export enum LightStatus {
  ON = 'on',
  OFF = 'off',
  DIMMED = 'dimmed',
  FAULTY = 'faulty',
  MAINTENANCE = 'maintenance'
}

export interface LightingZone {
  zoneId: string;
  name: string;
  lights: string[];
  schedule: LightingSchedule;
  adaptiveLighting: boolean;
  priority: ZonePriority;
}

export enum ZonePriority {
  CRITICAL = 'critical',  // Hospitals, emergency services
  HIGH = 'high',          // Main roads, commercial areas
  MEDIUM = 'medium',      // Residential areas
  LOW = 'low'             // Parks, less trafficked areas
}

export interface LightingSchedule {
  mode: LightingMode;
  onTime: string;
  offTime: string;
  dimSchedule: DimSchedule[];
  weatherAdaptive: boolean;
  trafficAdaptive: boolean;
}

export enum LightingMode {
  SCHEDULED = 'scheduled',
  ADAPTIVE = 'adaptive',
  MANUAL = 'manual',
  EMERGENCY = 'emergency'
}

export interface DimSchedule {
  startTime: string;
  endTime: string;
  brightness: number; // percentage
  conditions: DimCondition[];
}

export interface DimCondition {
  type: ConditionType;
  threshold: number;
  action: DimAction;
}

export enum ConditionType {
  TRAFFIC_VOLUME = 'traffic_volume',
  PEDESTRIAN_COUNT = 'pedestrian_count',
  AMBIENT_LIGHT = 'ambient_light',
  WEATHER = 'weather',
  TIME = 'time'
}

export enum DimAction {
  INCREASE = 'increase',
  DECREASE = 'decrease',
  MAINTAIN = 'maintain',
  TURN_OFF = 'turn_off'
}

export interface WaterManagementSystem {
  systemId: string;
  network: WaterNetwork;
  sensors: WaterSensor[];
  reservoirs: Reservoir[];
  treatmentPlants: TreatmentPlant[];
}

export interface WaterNetwork {
  networkId: string;
  pipes: WaterPipe[];
  pumps: WaterPump[];
  valves: WaterValve[];
  totalLength: number; // km
  pressure: number; // bar
}

export interface WaterPipe {
  pipeId: string;
  startPoint: GeoCoordinates;
  endPoint: GeoCoordinates;
  diameter: number; // mm
  material: PipeMaterial;
  age: number; // years
  condition: PipeCondition;
  flowRate: number; // m³/h
  pressure: number; // bar
}

export enum PipeMaterial {
  PVC = 'pvc',
  CAST_IRON = 'cast_iron',
  DUCTILE_IRON = 'ductile_iron',
  STEEL = 'steel',
  COPPER = 'copper',
  HDPE = 'hdpe'
}

export interface PipeCondition {
  status: ConditionStatus;
  leakProbability: number;
  corrosion: number; // percentage
  lastInspection: Date;
  nextInspection: Date;
}

export enum ConditionStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical',
  FAILED = 'failed'
}

export interface WaterSensor {
  sensorId: string;
  location: GeoCoordinates;
  type: WaterSensorType;
  reading: WaterQualityReading;
  status: SensorStatus;
}

export enum WaterSensorType {
  FLOW = 'flow',
  PRESSURE = 'pressure',
  QUALITY = 'quality',
  LEVEL = 'level',
  LEAK_DETECTION = 'leak_detection'
}

export interface WaterQualityReading {
  timestamp: Date;
  ph: number;
  turbidity: number; // NTU
  chlorine: number;  // mg/L
  temperature: number; // °C
  conductivity: number; // μS/cm
  tds: number; // Total Dissolved Solids (ppm)
  compliance: boolean;
}

export interface WaterPump {
  pumpId: string;
  location: GeoCoordinates;
  capacity: number; // m³/h
  currentFlow: number;
  power: number; // kW
  efficiency: number; // percentage
  status: PumpStatus;
}

export enum PumpStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  STANDBY = 'standby',
  MAINTENANCE = 'maintenance',
  FAULT = 'fault'
}

export interface WaterValve {
  valveId: string;
  location: GeoCoordinates;
  type: ValveType;
  position: number; // 0-100 (closed-open)
  automated: boolean;
  status: ValveStatus;
}

export enum ValveType {
  GATE = 'gate',
  BALL = 'ball',
  BUTTERFLY = 'butterfly',
  CHECK = 'check',
  PRESSURE_REDUCING = 'pressure_reducing'
}

export enum ValveStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PARTIAL = 'partial',
  STUCK = 'stuck',
  MAINTENANCE = 'maintenance'
}

export interface Reservoir {
  reservoirId: string;
  name: string;
  location: GeoCoordinates;
  capacity: number; // m³
  currentLevel: number; // m³
  waterQuality: WaterQualityReading;
  inflow: number; // m³/h
  outflow: number; // m³/h
}

export interface TreatmentPlant {
  plantId: string;
  name: string;
  location: GeoCoordinates;
  capacity: number; // m³/day
  currentThroughput: number;
  efficiency: number; // percentage
  processes: TreatmentProcess[];
}

export interface TreatmentProcess {
  processId: string;
  name: string;
  type: ProcessType;
  efficiency: number;
  status: ProcessStatus;
}

export enum ProcessType {
  COAGULATION = 'coagulation',
  SEDIMENTATION = 'sedimentation',
  FILTRATION = 'filtration',
  DISINFECTION = 'disinfection',
  REVERSE_OSMOSIS = 'reverse_osmosis'
}

export enum ProcessStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEGRADED = 'degraded',
  MAINTENANCE = 'maintenance'
}

export interface EnergyMetrics {
  totalConsumption: number; // kWh
  peakDemand: number; // kW
  efficiency: number; // percentage
  cost: number;
  carbonFootprint: number; // kg CO2
  renewablePercentage: number;
}

// ============================================================================
// Public Safety Types
// ============================================================================

export interface EmergencyResponseSystem {
  systemId: string;
  emergencies: Emergency[];
  responders: EmergencyResponder[];
  facilities: EmergencyFacility[];
  dispatchCenter: DispatchCenter;
}

export interface Emergency {
  emergencyId: string;
  type: EmergencyType;
  severity: EmergencySeverity;
  location: GeoCoordinates;
  reportedTime: Date;
  description: string;
  status: EmergencyStatus;
  assignedResponders: string[];
  estimatedResponseTime: number; // minutes
  actualResponseTime?: number;
  resolution?: EmergencyResolution;
}

export enum EmergencyType {
  FIRE = 'fire',
  MEDICAL = 'medical',
  POLICE = 'police',
  ACCIDENT = 'accident',
  HAZMAT = 'hazmat',
  NATURAL_DISASTER = 'natural_disaster',
  INFRASTRUCTURE_FAILURE = 'infrastructure_failure',
  SECURITY = 'security'
}

export enum EmergencySeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SERIOUS = 'serious',
  CRITICAL = 'critical',
  CATASTROPHIC = 'catastrophic'
}

export enum EmergencyStatus {
  REPORTED = 'reported',
  DISPATCHED = 'dispatched',
  EN_ROUTE = 'en_route',
  ON_SCENE = 'on_scene',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled'
}

export interface EmergencyResponder {
  responderId: string;
  name: string;
  type: ResponderType;
  currentLocation: GeoCoordinates;
  status: ResponderStatus;
  skills: string[];
  equipment: Equipment[];
  assignedEmergency?: string;
}

export enum ResponderType {
  FIREFIGHTER = 'firefighter',
  PARAMEDIC = 'paramedic',
  POLICE_OFFICER = 'police_officer',
  HAZMAT_SPECIALIST = 'hazmat_specialist',
  RESCUE_TEAM = 'rescue_team'
}

export enum ResponderStatus {
  AVAILABLE = 'available',
  DISPATCHED = 'dispatched',
  ON_SCENE = 'on_scene',
  RETURNING = 'returning',
  OFF_DUTY = 'off_duty',
  UNAVAILABLE = 'unavailable'
}

export interface Equipment {
  equipmentId: string;
  type: EquipmentType;
  status: EquipmentStatus;
  lastMaintenance: Date;
}

export enum EquipmentType {
  FIRE_ENGINE = 'fire_engine',
  AMBULANCE = 'ambulance',
  POLICE_CAR = 'police_car',
  HAZMAT_VEHICLE = 'hazmat_vehicle',
  RESCUE_VEHICLE = 'rescue_vehicle',
  DRONE = 'drone'
}

export enum EquipmentStatus {
  OPERATIONAL = 'operational',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service'
}

export interface EmergencyFacility {
  facilityId: string;
  name: string;
  type: FacilityType;
  location: GeoCoordinates;
  capacity: number;
  currentOccupancy: number;
  responders: EmergencyResponder[];
  equipment: Equipment[];
}

export interface DispatchCenter {
  centerId: string;
  location: GeoCoordinates;
  operators: number;
  activeIncidents: number;
  averageResponseTime: number; // minutes
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  resolution Rate: number; // percentage
  satisfactionScore: number;
}

export interface EmergencyResolution {
  resolvedTime: Date;
  outcome: ResolutionOutcome;
  resourcesUsed: string[];
  cost: number;
  notes: string;
}

export enum ResolutionOutcome {
  SUCCESSFUL = 'successful',
  PARTIAL = 'partial',
  UNSUCCESSFUL = 'unsuccessful',
  ESCALATED = 'escalated'
}

// ============================================================================
// Citizen Services Types
// ============================================================================

export interface CitizenServicesSystem {
  systemId: string;
  serviceRequests: ServiceRequest[];
  publicTransport: PublicTransportSystem;
  parking: ParkingSystem;
  feedback: CitizenFeedback[];
}

export interface ServiceRequest {
  requestId: string;
  citizenId: string;
  type: ServiceRequestType;
  category: string;
  description: string;
  location: GeoCoordinates;
  attachments: string[];
  priority: RequestPriority;
  status: RequestStatus;
  submittedTime: Date;
  assignedTo?: string;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  satisfaction?: number;
}

export enum ServiceRequestType {
  INFRASTRUCTURE = 'infrastructure',
  UTILITIES = 'utilities',
  SANITATION = 'sanitation',
  SAFETY = 'safety',
  ENVIRONMENT = 'environment',
  TRANSPORT = 'transport',
  PERMITS = 'permits',
  OTHER = 'other'
}

export enum RequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum RequestStatus {
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface PublicTransportSystem {
  systemId: string;
  routes: TransitRoute[];
  vehicles: TransitVehicle[];
  stops: TransitStop[];
  realtime: boolean;
}

export interface TransitRoute {
  routeId: string;
  name: string;
  type: TransitType;
  stops: string[];
  schedule: TransitSchedule;
  frequency: number; // minutes
  capacity: number;
  currentLoad: number;
}

export enum TransitType {
  BUS = 'bus',
  TRAM = 'tram',
  METRO = 'metro',
  TRAIN = 'train',
  FERRY = 'ferry'
}

export interface TransitSchedule {
  weekday: TimeTable[];
  weekend: TimeTable[];
  holiday: TimeTable[];
}

export interface TimeTable {
  stopId: string;
  arrivalTime: string;
  departureTime: string;
}

export interface TransitVehicle {
  vehicleId: string;
  routeId: string;
  type: TransitType;
  location: GeoCoordinates;
  capacity: number;
  currentOccupancy: number;
  status: VehicleStatus;
  nextStop: string;
  delay: number; // minutes
}

export enum VehicleStatus {
  IN_SERVICE = 'in_service',
  OUT_OF_SERVICE = 'out_of_service',
  MAINTENANCE = 'maintenance',
  DELAYED = 'delayed'
}

export interface TransitStop {
  stopId: string;
  name: string;
  location: GeoCoordinates;
  routes: string[];
  facilities: StopFacility[];
  realTimeDisplay: boolean;
  accessibility: boolean;
}

export interface StopFacility {
  type: FacilityType;
  available: boolean;
}

export interface ParkingSystem {
  systemId: string;
  lots: ParkingLot[];
  meters: ParkingMeter[];
  regulations: ParkingRegulation[];
}

export interface ParkingLot {
  lotId: string;
  name: string;
  location: GeoCoordinates;
  totalSpaces: number;
  availableSpaces: number;
  type: ParkingType;
  rates: ParkingRate[];
  evCharging: number; // number of EV charging spaces
  accessibility: number; // number of accessible spaces
}

export enum ParkingType {
  SURFACE = 'surface',
  GARAGE = 'garage',
  STREET = 'street',
  PRIVATE = 'private'
}

export interface ParkingRate {
  period: string;
  rate: number; // per hour
  maxDuration: number; // hours
}

export interface ParkingMeter {
  meterId: string;
  location: GeoCoordinates;
  status: MeterStatus;
  currentOccupancy: boolean;
  paymentMethods: PaymentMethod[];
}

export enum MeterStatus {
  OPERATIONAL = 'operational',
  OUT_OF_ORDER = 'out_of_order',
  MAINTENANCE = 'maintenance'
}

export enum PaymentMethod {
  COIN = 'coin',
  CARD = 'card',
  MOBILE = 'mobile',
  CONTACTLESS = 'contactless'
}

export interface ParkingRegulation {
  zoneId: string;
  schedule: Schedule;
  restrictions: string[];
  enforcement: boolean;
}

export interface CitizenFeedback {
  feedbackId: string;
  citizenId: string;
  category: FeedbackCategory;
  sentiment: Sentiment;
  content: string;
  location?: GeoCoordinates;
  timestamp: Date;
  response?: string;
  resolved: boolean;
}

export enum FeedbackCategory {
  TRANSPORT = 'transport',
  INFRASTRUCTURE = 'infrastructure',
  SAFETY = 'safety',
  ENVIRONMENT = 'environment',
  SERVICES = 'services',
  GENERAL = 'general'
}

export enum Sentiment {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive'
}

// ============================================================================
// Analytics & IoT Types
// ============================================================================

export interface IoTSensor {
  sensorId: string;
  type: string;
  manufacturer: string;
  model: string;
  firmware: string;
  batteryLevel?: number;
  signalStrength: number;
  lastCommunication: Date;
}

export interface CityAnalytics {
  timestamp: Date;
  traffic: TrafficAnalytics;
  environment: EnvironmentalAnalytics;
  utilities: UtilityAnalytics;
  safety: SafetyAnalytics;
  citizen: CitizenAnalytics;
}

export interface TrafficAnalytics {
  totalVehicles: number;
  averageSpeed: number;
  congestionIndex: number;
  incidentCount: number;
  publicTransitUsage: number;
  emissions: number; // kg CO2
}

export interface EnvironmentalAnalytics {
  averageAQI: number;
  noiseLevel: number;
  greenSpaceUsage: number;
  wasteCollected: number; // tons
  recyclingRate: number; // percentage
}

export interface UtilityAnalytics {
  waterConsumption: number; // m³
  energyConsumption: number; // kWh
  streetLightEfficiency: number; // percentage
  leakDetection: number; // number of leaks
}

export interface SafetyAnalytics {
  emergencyCount: number;
  averageResponseTime: number; // minutes
  crimeIncidents: number;
  resolutionRate: number; // percentage
}

export interface CitizenAnalytics {
  serviceRequests: number;
  satisfactionScore: number;
  appUsage: number;
  feedbackCount: number;
}

export interface MLModelConfig {
  modelId: string;
  type: MLModelType;
  algorithm: string;
  features: string[];
  target: string;
  hyperparameters: Record<string, unknown>;
  trained: Date;
  accuracy: number;
  version: string;
}

export enum MLModelType {
  CLASSIFICATION = 'classification',
  REGRESSION = 'regression',
  CLUSTERING = 'clustering',
  TIME_SERIES = 'time_series',
  ANOMALY_DETECTION = 'anomaly_detection',
  REINFORCEMENT_LEARNING = 'reinforcement_learning'
}

export interface PredictionResult {
  predictionId: string;
  modelId: string;
  timestamp: Date;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  confidence: number;
  explanation?: string;
}

// ============================================================================
// System Integration Types
// ============================================================================

export interface SystemHealth {
  systemId: string;
  status: SystemStatus;
  uptime: number; // percentage
  latency: number; // milliseconds
  throughput: number; // requests/second
  errors: number;
  lastCheck: Date;
}

export enum SystemStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
  MAINTENANCE = 'maintenance'
}

export interface APIEndpoint {
  path: string;
  method: HTTPMethod;
  description: string;
  authentication: boolean;
  rateLimit: number; // requests per minute
}

export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

export interface DataStream {
  streamId: string;
  source: string;
  destination: string;
  protocol: Protocol;
  frequency: number; // Hz
  bandwidth: number; // Mbps
}

export enum Protocol {
  HTTP = 'http',
  HTTPS = 'https',
  MQTT = 'mqtt',
  WEBSOCKET = 'websocket',
  COAP = 'coap',
  AMQP = 'amqp'
}
