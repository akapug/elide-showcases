/**
 * Core type definitions for the Logistics Optimization Platform
 *
 * Comprehensive type system covering all logistics entities, operations,
 * and optimization parameters for route planning, fleet management,
 * warehouse operations, and tracking.
 */

// ============================================================================
// Geographic and Location Types
// ============================================================================

/**
 * Geographic coordinate (latitude, longitude)
 */
export interface GeoLocation {
  lat: number;
  lng: number;
}

/**
 * Address with optional geocoding
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  location?: GeoLocation;
}

/**
 * Bounding box for geographic queries
 */
export interface BoundingBox {
  northEast: GeoLocation;
  southWest: GeoLocation;
}

/**
 * Distance matrix between locations
 */
export interface DistanceMatrix {
  origins: GeoLocation[];
  destinations: GeoLocation[];
  distances: number[][]; // in kilometers
  durations: number[][]; // in seconds
  timestamp: Date;
}

/**
 * Route geometry (encoded polyline or coordinates)
 */
export interface RouteGeometry {
  type: 'polyline' | 'coordinates';
  data: string | GeoLocation[];
}

// ============================================================================
// Time Window and Schedule Types
// ============================================================================

/**
 * Time window for deliveries or operations
 */
export interface TimeWindow {
  start: Date;
  end: Date;
}

/**
 * Operating hours for a facility
 */
export interface OperatingHours {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  daysOfWeek?: number[]; // 0-6, Sunday=0
}

/**
 * Break requirements for drivers
 */
export interface BreakRequirement {
  durationMinutes: number;
  earliestStartMinutes: number; // minutes from shift start
  latestStartMinutes: number;
}

/**
 * Shift definition
 */
export interface Shift {
  id: string;
  start: Date;
  end: Date;
  breaks: BreakRequirement[];
}

// ============================================================================
// Vehicle and Fleet Types
// ============================================================================

/**
 * Vehicle type classification
 */
export type VehicleType =
  | 'bicycle'
  | 'motorcycle'
  | 'van'
  | 'small_truck'
  | 'medium_truck'
  | 'large_truck'
  | 'electric_van'
  | 'electric_truck';

/**
 * Vehicle fuel/energy type
 */
export type FuelType =
  | 'gasoline'
  | 'diesel'
  | 'electric'
  | 'hybrid'
  | 'cng'
  | 'lng';

/**
 * Vehicle status
 */
export type VehicleStatus =
  | 'available'
  | 'in_use'
  | 'maintenance'
  | 'out_of_service'
  | 'reserved';

/**
 * Vehicle capacity constraints
 */
export interface VehicleCapacity {
  weightKg: number;
  volumeM3: number;
  pallets?: number;
  items?: number;
}

/**
 * Vehicle cost structure
 */
export interface VehicleCost {
  fixedCost: number;        // per day
  costPerKm: number;
  costPerHour: number;
  overtimeCostPerHour?: number;
}

/**
 * Electric vehicle specific properties
 */
export interface ElectricVehicleProps {
  batteryCapacityKWh: number;
  currentChargePercent: number;
  rangeKm: number;
  chargingRateKWh: number;
  minChargePercent: number;
}

/**
 * Complete vehicle definition
 */
export interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: VehicleType;
  fuelType: FuelType;
  status: VehicleStatus;
  capacity: VehicleCapacity;
  cost: VehicleCost;
  maxDurationHours: number;
  maxDistanceKm?: number;
  speedKmh: number;
  depotId: string;
  currentLocation?: GeoLocation;
  features: VehicleFeatures;
  electricProps?: ElectricVehicleProps;
  maintenanceSchedule?: MaintenanceSchedule;
  insuranceExpiry?: Date;
  registrationExpiry?: Date;
}

/**
 * Vehicle features and capabilities
 */
export interface VehicleFeatures {
  refrigerated: boolean;
  liftGate: boolean;
  gps: boolean;
  temperatureControl: boolean;
  hazmatCertified: boolean;
  wheelchairAccessible: boolean;
}

/**
 * Maintenance schedule
 */
export interface MaintenanceSchedule {
  lastMaintenanceDate: Date;
  lastMaintenanceMileage: number;
  nextMaintenanceDate?: Date;
  nextMaintenanceMileage?: number;
  maintenanceIntervalKm: number;
  maintenanceIntervalDays: number;
}

/**
 * Fleet statistics
 */
export interface FleetStats {
  totalVehicles: number;
  availableVehicles: number;
  utilizationRate: number;
  averageMileagePerDay: number;
  totalCostPerDay: number;
  costPerDelivery: number;
  breakdown: {
    byType: Record<VehicleType, number>;
    byStatus: Record<VehicleStatus, number>;
    byDepot: Record<string, number>;
  };
}

// ============================================================================
// Driver Types
// ============================================================================

/**
 * Driver status
 */
export type DriverStatus =
  | 'available'
  | 'on_route'
  | 'on_break'
  | 'off_duty'
  | 'sick_leave'
  | 'vacation';

/**
 * Driver license type
 */
export type LicenseType =
  | 'class_a'
  | 'class_b'
  | 'class_c'
  | 'motorcycle'
  | 'standard';

/**
 * Driver definition
 */
export interface Driver {
  id: string;
  driverNumber: string;
  name: string;
  phone: string;
  email: string;
  status: DriverStatus;
  licenseType: LicenseType;
  licenseNumber: string;
  licenseExpiry: Date;
  currentVehicleId?: string;
  currentLocation?: GeoLocation;
  shift?: Shift;
  rating: number; // 0-5
  experienceYears: number;
  certifications: string[];
  preferences: DriverPreferences;
}

/**
 * Driver preferences and constraints
 */
export interface DriverPreferences {
  preferredVehicleTypes: VehicleType[];
  maxDailyHours: number;
  preferredStartTime?: string;
  avoidAreas?: BoundingBox[];
  languages: string[];
}

/**
 * Driver performance metrics
 */
export interface DriverPerformance {
  driverId: string;
  periodStart: Date;
  periodEnd: Date;
  deliveriesCompleted: number;
  onTimeDeliveryRate: number;
  customerRating: number;
  milesPerHour: number;
  deliveriesPerHour: number;
  incidents: number;
  safetyScore: number;
}

// ============================================================================
// Order and Delivery Types
// ============================================================================

/**
 * Order priority levels
 */
export type OrderPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Order status
 */
export type OrderStatus =
  | 'pending'
  | 'assigned'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'returned';

/**
 * Delivery type
 */
export type DeliveryType =
  | 'standard'
  | 'express'
  | 'same_day'
  | 'scheduled'
  | 'return';

/**
 * Package dimensions
 */
export interface PackageDimensions {
  weightKg: number;
  volumeM3: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  pallets?: number;
}

/**
 * Special requirements for delivery
 */
export interface SpecialRequirements {
  signatureRequired: boolean;
  ageVerification: boolean;
  refrigerated: boolean;
  fragile: boolean;
  hazmat: boolean;
  oversized: boolean;
  liftGateRequired: boolean;
  appointmentRequired: boolean;
}

/**
 * Order/Delivery definition
 */
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: Address;
  deliveryLocation: GeoLocation;
  pickupAddress?: Address;
  pickupLocation?: GeoLocation;
  timeWindow?: TimeWindow;
  priority: OrderPriority;
  type: DeliveryType;
  status: OrderStatus;
  dimensions: PackageDimensions;
  serviceTimeMinutes: number;
  specialRequirements: SpecialRequirements;
  specialInstructions?: string;
  assignedRouteId?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  proofOfDelivery?: ProofOfDelivery;
  value?: number;
  contents?: string;
}

/**
 * Proof of delivery
 */
export interface ProofOfDelivery {
  timestamp: Date;
  location: GeoLocation;
  signatureUrl?: string;
  photoUrl?: string;
  recipientName?: string;
  notes?: string;
  driverId: string;
}

// ============================================================================
// Route and Stop Types
// ============================================================================

/**
 * Route status
 */
export type RouteStatus =
  | 'planned'
  | 'optimizing'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * Stop type
 */
export type StopType =
  | 'depot'
  | 'pickup'
  | 'delivery'
  | 'break'
  | 'charging';

/**
 * Stop status
 */
export type StopStatus =
  | 'pending'
  | 'approaching'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped';

/**
 * Route stop definition
 */
export interface RouteStop {
  id: string;
  routeId: string;
  stopSequence: number;
  stopType: StopType;
  orderId?: string;
  location: GeoLocation;
  address?: Address;
  plannedArrivalTime: Date;
  plannedDepartureTime: Date;
  actualArrivalTime?: Date;
  actualDepartureTime?: Date;
  estimatedArrivalTime?: Date;
  status: StopStatus;
  serviceTimeMinutes: number;
  notes?: string;
  distanceFromPreviousKm: number;
  durationFromPreviousMinutes: number;
}

/**
 * Complete route definition
 */
export interface Route {
  id: string;
  routeNumber: string;
  vehicleId: string;
  driverId?: string;
  depotId: string;
  date: Date;
  status: RouteStatus;
  stops: RouteStop[];
  startLocation: GeoLocation;
  endLocation: GeoLocation;
  plannedStartTime: Date;
  plannedEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalCost: number;
  geometry?: RouteGeometry;
  currentStopIndex?: number;
  completedStops: number;
  optimization: RouteOptimizationMetrics;
}

/**
 * Route optimization metrics
 */
export interface RouteOptimizationMetrics {
  optimizationTime: number; // seconds
  algorithm: string;
  objectiveValue: number;
  utilizationPercent: number;
  efficiencyScore: number;
  deviationFromOptimal?: number;
}

// ============================================================================
// Depot/Warehouse Types
// ============================================================================

/**
 * Depot/warehouse definition
 */
export interface Depot {
  id: string;
  name: string;
  code: string;
  address: Address;
  location: GeoLocation;
  type: 'distribution_center' | 'warehouse' | 'hub' | 'cross_dock';
  operatingHours: OperatingHours;
  capacity: DepotCapacity;
  zones: WarehouseZone[];
  chargingStations?: ChargingStation[];
  isActive: boolean;
}

/**
 * Depot capacity
 */
export interface DepotCapacity {
  totalAreaSqM: number;
  storageAreaSqM: number;
  dockDoors: number;
  maxVehicles: number;
  maxVolumeM3: number;
  maxWeightKg: number;
}

/**
 * Warehouse zone
 */
export interface WarehouseZone {
  id: string;
  name: string;
  type: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping';
  aisles: number;
  shelvesPerAisle: number;
  binsPerShelf: number;
}

/**
 * Charging station for electric vehicles
 */
export interface ChargingStation {
  id: string;
  location: GeoLocation;
  chargingRateKWh: number;
  availableConnectors: number;
  costPerKWh: number;
}

/**
 * Inventory item
 */
export interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  depotId: string;
  location: InventoryLocation;
  quantity: number;
  dimensions: PackageDimensions;
  pickFrequency: number; // picks per day
  lastPickedAt?: Date;
  reorderPoint?: number;
  reorderQuantity?: number;
}

/**
 * Inventory location within warehouse
 */
export interface InventoryLocation {
  zone: string;
  aisle: string;
  shelf: string;
  bin: string;
  coordinates?: { x: number; y: number; z: number };
}

// ============================================================================
// Optimization Types
// ============================================================================

/**
 * Optimization objective
 */
export type OptimizationObjective =
  | 'minimize_cost'
  | 'minimize_distance'
  | 'minimize_time'
  | 'minimize_vehicles'
  | 'maximize_utilization'
  | 'balanced';

/**
 * Optimization strategy
 */
export type OptimizationStrategy =
  | 'PATH_CHEAPEST_ARC'
  | 'PATH_MOST_CONSTRAINED_ARC'
  | 'EVALUATOR_STRATEGY'
  | 'SAVINGS'
  | 'SWEEP'
  | 'CHRISTOFIDES'
  | 'ALL_UNPERFORMED'
  | 'BEST_INSERTION'
  | 'PARALLEL_CHEAPEST_INSERTION'
  | 'SEQUENTIAL_CHEAPEST_INSERTION'
  | 'LOCAL_CHEAPEST_INSERTION';

/**
 * Local search metaheuristic
 */
export type LocalSearchMetaheuristic =
  | 'AUTOMATIC'
  | 'GREEDY_DESCENT'
  | 'GUIDED_LOCAL_SEARCH'
  | 'SIMULATED_ANNEALING'
  | 'TABU_SEARCH'
  | 'GENERIC_TABU_SEARCH';

/**
 * Route optimization parameters
 */
export interface RouteOptimizationParams {
  depot: Depot;
  vehicles: Vehicle[];
  orders: Order[];
  existingRoutes?: Route[];
  optimizationGoal: OptimizationObjective;
  strategy?: OptimizationStrategy;
  metaheuristic?: LocalSearchMetaheuristic;
  timeLimitSeconds: number;
  allowPartialSolutions: boolean;
  vehicleFixedCost?: boolean;
  distanceMatrix?: DistanceMatrix;
  trafficData?: TrafficData;
  constraints: OptimizationConstraints;
}

/**
 * Optimization constraints
 */
export interface OptimizationConstraints {
  timeWindows: boolean;
  capacity: boolean;
  maxRouteDistance?: number;
  maxRouteDuration?: number;
  vehicleBreaks: boolean;
  dropoffBeforePickup?: boolean;
  compatibilityMatrix?: boolean;
  zonalRestrictions?: Record<string, string[]>;
}

/**
 * Route optimization solution
 */
export interface RouteOptimizationSolution {
  routes: Route[];
  unassignedOrders: Order[];
  totalCost: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  utilizationRate: number;
  objectiveValue: number;
  optimizationTime: number;
  feasible: boolean;
  status: 'optimal' | 'feasible' | 'infeasible' | 'timeout';
}

// ============================================================================
// Traffic and Weather Types
// ============================================================================

/**
 * Traffic condition level
 */
export type TrafficLevel =
  | 'free_flow'
  | 'light'
  | 'moderate'
  | 'heavy'
  | 'severe';

/**
 * Traffic data
 */
export interface TrafficData {
  timestamp: Date;
  segments: TrafficSegment[];
  incidents: TrafficIncident[];
}

/**
 * Traffic segment
 */
export interface TrafficSegment {
  segmentId: string;
  start: GeoLocation;
  end: GeoLocation;
  level: TrafficLevel;
  speedKmh: number;
  delayMinutes: number;
}

/**
 * Traffic incident
 */
export interface TrafficIncident {
  id: string;
  location: GeoLocation;
  type: 'accident' | 'construction' | 'road_closure' | 'event';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  startTime: Date;
  estimatedEndTime?: Date;
}

/**
 * Weather condition
 */
export type WeatherCondition =
  | 'clear'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'storm'
  | 'ice';

/**
 * Weather data
 */
export interface WeatherData {
  timestamp: Date;
  location: GeoLocation;
  condition: WeatherCondition;
  temperatureC: number;
  precipitationMm: number;
  windSpeedKmh: number;
  visibility: number;
  roadConditions: 'good' | 'fair' | 'poor' | 'hazardous';
}

// ============================================================================
// Tracking Types
// ============================================================================

/**
 * Tracking event type
 */
export type TrackingEventType =
  | 'location_update'
  | 'route_started'
  | 'route_completed'
  | 'stop_arrived'
  | 'stop_departed'
  | 'delivery_completed'
  | 'delivery_failed'
  | 'break_started'
  | 'break_ended'
  | 'route_deviation'
  | 'delay_detected'
  | 'vehicle_issue';

/**
 * Tracking event
 */
export interface TrackingEvent {
  id: string;
  eventType: TrackingEventType;
  timestamp: Date;
  vehicleId: string;
  driverId?: string;
  routeId?: string;
  orderId?: string;
  location: GeoLocation;
  speed?: number;
  heading?: number;
  metadata?: Record<string, any>;
}

/**
 * Vehicle telemetry
 */
export interface VehicleTelemetry {
  vehicleId: string;
  timestamp: Date;
  location: GeoLocation;
  speed: number;
  heading: number;
  odometer: number;
  fuelLevel?: number;
  batteryLevel?: number;
  engineStatus: 'on' | 'off' | 'idle';
  doorStatus?: 'open' | 'closed';
}

/**
 * ETA prediction
 */
export interface ETAPrediction {
  stopId: string;
  orderId?: string;
  predictedArrivalTime: Date;
  confidenceInterval: {
    lower: Date;
    upper: Date;
    confidenceLevel: number; // 0-1
  };
  factors: ETAFactors;
}

/**
 * Factors affecting ETA
 */
export interface ETAFactors {
  baselineMinutes: number;
  trafficDelayMinutes: number;
  weatherDelayMinutes: number;
  driverExperienceAdjustment: number;
  historicalAccuracy: number;
}

// ============================================================================
// Analytics and Reporting Types
// ============================================================================

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  period: {
    start: Date;
    end: Date;
  };
  orders: {
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  deliveries: {
    onTimeRate: number;
    firstAttemptSuccess: number;
    averageDeliveryTime: number;
  };
  routes: {
    total: number;
    completed: number;
    averageDistance: number;
    averageDuration: number;
    averageStops: number;
  };
  fleet: {
    utilizationRate: number;
    averageMileagePerVehicle: number;
    fuelCostPerMile: number;
    maintenanceCostPerMile: number;
  };
  costs: {
    totalCost: number;
    costPerDelivery: number;
    costPerMile: number;
    breakdown: CostBreakdown;
  };
  service: {
    customerSatisfaction: number;
    complaintsRate: number;
    damageRate: number;
  };
}

/**
 * Cost breakdown
 */
export interface CostBreakdown {
  fuel: number;
  labor: number;
  maintenance: number;
  vehicle: number;
  overhead: number;
  other: number;
}

/**
 * Route efficiency analysis
 */
export interface RouteEfficiencyAnalysis {
  routeId: string;
  efficiencyScore: number; // 0-100
  plannedVsActual: {
    distanceDiff: number;
    durationDiff: number;
    costDiff: number;
  };
  issues: RouteIssue[];
  recommendations: string[];
  potentialSavings: number;
}

/**
 * Route issue
 */
export interface RouteIssue {
  type: 'suboptimal_sequence' | 'backtracking' | 'long_wait' | 'detour' | 'capacity_violation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impactCost: number;
  location?: GeoLocation;
}

// ============================================================================
// Forecasting Types
// ============================================================================

/**
 * Demand forecast
 */
export interface DemandForecast {
  date: Date;
  region?: string;
  depot?: string;
  predictedOrders: number;
  predictedVolume: number;
  predictedWeight: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidenceLevel: number;
  };
  seasonalFactor: number;
  trendFactor: number;
}

/**
 * Capacity recommendation
 */
export interface CapacityRecommendation {
  date: Date;
  forecast: DemandForecast;
  currentCapacity: {
    vehicles: number;
    drivers: number;
    maxOrders: number;
  };
  recommendedCapacity: {
    vehicles: number;
    drivers: number;
    adjustment: number; // percentage
  };
  utilizationPrediction: number;
  serviceLevel: number;
}

/**
 * Forecasting model configuration
 */
export interface ForecastingModelConfig {
  modelType: 'linear' | 'tree' | 'ensemble' | 'neural_network';
  features: string[];
  targetVariable: string;
  trainingPeriodDays: number;
  validationSplit: number;
  hyperparameters?: Record<string, any>;
}

// ============================================================================
// Dynamic Routing Types
// ============================================================================

/**
 * Route update request
 */
export interface RouteUpdateRequest {
  routeId: string;
  updateType: 'add_stop' | 'remove_stop' | 'reoptimize' | 'emergency_reroute';
  newOrder?: Order;
  removeStopId?: string;
  reason?: string;
  currentLocation?: GeoLocation;
  currentTime?: Date;
  trafficData?: TrafficData;
}

/**
 * Route update result
 */
export interface RouteUpdateResult {
  success: boolean;
  updatedRoute?: Route;
  insertionIndex?: number;
  impactAnalysis: {
    distanceChange: number;
    durationChange: number;
    costChange: number;
    affectedStops: string[];
  };
  reason?: string;
}

// ============================================================================
// Configuration and Settings Types
// ============================================================================

/**
 * System configuration
 */
export interface SystemConfig {
  database: {
    url: string;
    poolSize: number;
  };
  apis: {
    googleMaps?: string;
    traffic?: string;
    weather?: string;
  };
  optimization: {
    defaultTimeLimitSeconds: number;
    defaultStrategy: OptimizationStrategy;
    defaultMetaheuristic: LocalSearchMetaheuristic;
  };
  routing: {
    maxRouteDistanceKm: number;
    maxRouteDurationHours: number;
    defaultBufferPercent: number;
  };
  tracking: {
    updateIntervalSeconds: number;
    geofenceRadiusMeters: number;
    etaPredictionInterval: number;
  };
  ml: {
    modelRetrainInterval: number;
    etaModelPath: string;
    demandModelPath: string;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    duration: number;
  };
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Core entities
  Vehicle,
  Driver,
  Order,
  Route,
  Depot,

  // Results and solutions
  RouteOptimizationSolution,
  RouteUpdateResult,
  ETAPrediction,
  DemandForecast,

  // Analytics
  PerformanceMetrics,
  RouteEfficiencyAnalysis,
  DriverPerformance,
  FleetStats,
};
