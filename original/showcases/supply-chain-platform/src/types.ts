/**
 * Supply Chain Platform - Type Definitions
 * Comprehensive type system for supply chain management
 */

// ============================================================================
// Core Types
// ============================================================================

export type UUID = string
export type Timestamp = Date | string | number
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY'
export type UnitOfMeasure = 'EA' | 'KG' | 'LB' | 'M' | 'FT' | 'L' | 'GAL' | 'CASE' | 'PALLET'
export type DistributionType = 'normal' | 'lognormal' | 'poisson' | 'exponential' | 'uniform' | 'gamma'

export interface GeoLocation {
  lat: number
  lng: number
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export interface TimeWindow {
  start: string | Date
  end: string | Date
  timezone?: string
}

export interface DateRange {
  start: Date | string
  end: Date | string
}

// ============================================================================
// Product & SKU Types
// ============================================================================

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  category: string
  subcategory?: string
  brand?: string
  uom: UnitOfMeasure
  dimensions: ProductDimensions
  weight: number
  weightUnit: 'kg' | 'lb'
  unitCost: number
  sellingPrice: number
  currency: Currency
  perishable: boolean
  shelfLife?: number
  temperatureControlled: boolean
  temperatureRange?: TemperatureRange
  hazmat: boolean
  fragile: boolean
  attributes: Record<string, any>
  tags: string[]
}

export interface ProductDimensions {
  length: number
  width: number
  height: number
  unit: 'm' | 'cm' | 'in' | 'ft'
  volume?: number
}

export interface TemperatureRange {
  min: number
  max: number
  unit: 'C' | 'F'
}

export interface ProductClassification {
  abc: 'A' | 'B' | 'C'
  xyz: 'X' | 'Y' | 'Z'
  revenue: number
  revenuePercentile: number
  volume: number
  volumePercentile: number
  velocity: 'fast' | 'medium' | 'slow'
  variability: 'low' | 'medium' | 'high'
}

// ============================================================================
// Demand & Forecasting Types
// ============================================================================

export interface DemandHistory {
  productId: string
  locationId?: string
  data: DemandDataPoint[]
  frequency: 'daily' | 'weekly' | 'monthly'
  uom: UnitOfMeasure
}

export interface DemandDataPoint {
  date: Date | string
  demand: number
  sales?: number
  stockout?: boolean
  promotion?: boolean
  price?: number
  externalFactors?: Record<string, number>
}

export interface ForecastConfig {
  models: ForecastModel[]
  horizon: number
  frequency: 'daily' | 'weekly' | 'monthly'
  confidenceLevel: number
  seasonality: 'auto' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'none'
  includeExternalFactors: boolean
  ensembleMethod: 'average' | 'weighted' | 'stacking' | 'voting'
}

export type ForecastModel =
  | 'naive'
  | 'moving-average'
  | 'exponential-smoothing'
  | 'holt-winters'
  | 'arima'
  | 'sarima'
  | 'prophet'
  | 'linear-regression'
  | 'randomforest'
  | 'xgboost'
  | 'lstm'
  | 'ensemble'

export interface ForecastResult {
  productId: string
  locationId?: string
  forecastDate: Date
  horizon: number
  model: ForecastModel
  pointForecast: number[]
  lowerBound?: number[]
  upperBound?: number[]
  confidenceLevel?: number
  metrics: ForecastMetrics
  features?: Record<string, any>
}

export interface ForecastMetrics {
  mae: number
  rmse: number
  mape: number
  bias: number
  forecastAccuracy: number
  trainR2?: number
  testR2?: number
}

export interface DemandFeatures {
  seasonality: SeasonalityFeatures
  trends: TrendFeatures
  promotions: PromotionFeatures
  pricing: PricingFeatures
  externalFactors: ExternalFactors
}

export interface SeasonalityFeatures {
  dayOfWeek: number[]
  weekOfMonth: number[]
  monthOfYear: number[]
  quarter: number[]
  holiday: boolean[]
  specialEvents: string[]
}

export interface TrendFeatures {
  linearTrend: number[]
  quadraticTrend: number[]
  growthRate: number
  changePoints: number[]
}

export interface PromotionFeatures {
  active: boolean[]
  type: string[]
  discount: number[]
  duration: number[]
  lag: number[]
}

export interface PricingFeatures {
  price: number[]
  priceChange: number[]
  competitorPrice?: number[]
  priceIndex: number[]
}

export interface ExternalFactors {
  weather?: WeatherFeatures
  economic?: EconomicFeatures
  social?: SocialFeatures
}

export interface WeatherFeatures {
  temperature: number[]
  precipitation: number[]
  condition: string[]
}

export interface EconomicFeatures {
  gdp?: number[]
  unemployment?: number[]
  cpi?: number[]
  consumerConfidence?: number[]
}

export interface SocialFeatures {
  searchTrends?: number[]
  socialMentions?: number[]
  sentiment?: number[]
}

// ============================================================================
// Inventory Types
// ============================================================================

export interface InventoryState {
  productId: string
  locationId: string
  onHand: number
  available: number
  committed: number
  onOrder: number
  inTransit: number
  safetyStock: number
  reorderPoint: number
  economicOrderQuantity: number
  uom: UnitOfMeasure
  lastUpdated: Date
  costs: InventoryCosts
}

export interface InventoryCosts {
  unitCost: number
  holdingCostRate: number
  orderingCost: number
  backorderCost: number
  stockoutCost: number
}

export interface InventoryPolicy {
  type: 'continuous-review' | 'periodic-review' | 'min-max' | 'just-in-time'
  reorderPoint: number
  orderUpToLevel: number
  reviewPeriod?: number
  minOrderQuantity: number
  maxOrderQuantity: number
  orderMultiple?: number
  safetyStock: number
  serviceLevel: number
}

export interface InventoryOptimizationConfig {
  policy: InventoryPolicy['type']
  serviceLevel: number
  holdingCostRate: number
  leadTimeDemandDistribution: DistributionType
  demandDistribution: DistributionType
  objective: 'minimize-cost' | 'maximize-service' | 'balance'
}

export interface InventoryOptimizationResult {
  productId: string
  locationId: string
  policy: InventoryPolicy
  expectedAnnualCost: number
  expectedServiceLevel: number
  expectedFillRate: number
  expectedStockouts: number
  averageInventory: number
  inventoryValue: number
  turnoverRate: number
}

export interface MultiEchelonConfig {
  network: SupplyChainNetwork
  products: Product[]
  demand: DemandHistory[]
  serviceLevel: number
  objective: 'minimize-cost' | 'minimize-inventory' | 'maximize-service'
  constraints: MultiEchelonConstraints
}

export interface MultiEchelonConstraints {
  maxInventoryValue?: number
  minServiceLevel?: number
  maxLeadTime?: number
  capacityConstraints: boolean
  budgetConstraint?: number
}

export interface MultiEchelonResult {
  totalInventoryValue: number
  totalAnnualCost: number
  serviceLevel: number
  inventoryLevels: NodeInventoryLevel[]
  flows: InventoryFlow[]
  metrics: MultiEchelonMetrics
}

export interface NodeInventoryLevel {
  nodeId: string
  productId: string
  baseStock: number
  safetyStock: number
  cycleStock: number
  averageInventory: number
  inventoryValue: number
  holdingCost: number
}

export interface InventoryFlow {
  from: string
  to: string
  productId: string
  quantity: number
  frequency: number
  cost: number
}

export interface MultiEchelonMetrics {
  totalCost: number
  holdingCost: number
  transportationCost: number
  orderingCost: number
  backorderCost: number
  serviceLevel: number
  fillRate: number
  inventoryTurnover: number
}

// ============================================================================
// Routing & Transportation Types
// ============================================================================

export interface RoutingProblem {
  depots: Depot[]
  deliveries: Delivery[]
  vehicles: Vehicle[]
  constraints: RoutingConstraints
  objectives: RoutingObjective[]
  options: RoutingOptions
}

export interface Depot {
  id: string
  name: string
  location: GeoLocation
  openTime: string
  closeTime: string
  capacity?: number
  vehiclesAvailable?: string[]
}

export interface Delivery {
  id: string
  customerId: string
  location: GeoLocation
  demand: number
  demandType: 'pickup' | 'delivery' | 'both'
  pickupDemand?: number
  deliveryDemand?: number
  timeWindow: TimeWindow
  serviceTime: number
  priority: number
  skillsRequired?: string[]
  notes?: string
}

export interface Vehicle {
  id: string
  type: string
  capacity: number
  maxVolume?: number
  maxWeight?: number
  costPerKm: number
  costPerHour: number
  fixedCost: number
  maxRouteTime: number
  maxRouteDistance?: number
  startLocation: GeoLocation
  endLocation?: GeoLocation
  skills?: string[]
  availableTimeWindow: TimeWindow
  breaks?: VehicleBreak[]
}

export interface VehicleBreak {
  earliestStart: string
  latestStart: string
  duration: number
}

export interface RoutingConstraints {
  capacityConstraints: boolean
  timeWindowConstraints: boolean
  maxRouteTime?: number
  maxRouteDistance?: number
  maxStopsPerRoute?: number
  skillConstraints: boolean
  compatibilityConstraints?: CompatibilityConstraint[]
}

export interface CompatibilityConstraint {
  deliveryId: string
  incompatibleWith: string[]
  requiredSequence?: string[]
}

export type RoutingObjective =
  | 'minimize-cost'
  | 'minimize-distance'
  | 'minimize-time'
  | 'minimize-vehicles'
  | 'balance-routes'
  | 'maximize-deliveries'

export interface RoutingOptions {
  algorithm: RoutingAlgorithm
  timeLimit: number
  numThreads?: number
  firstSolutionStrategy?: string
  localSearchMetaheuristic?: string
  improvementLimit?: number
}

export type RoutingAlgorithm =
  | 'clarke-wright'
  | 'sweep'
  | 'nearest-neighbor'
  | 'insertion'
  | 'genetic'
  | 'simulated-annealing'
  | 'tabu-search'
  | 'cp-sat'
  | 'lns'

export interface RoutingSolution {
  routes: Route[]
  unassigned: Delivery[]
  totalCost: number
  totalDistance: number
  totalTime: number
  totalVehicles: number
  metrics: RoutingMetrics
  computationTime: number
}

export interface Route {
  vehicleId: string
  depotId: string
  stops: RouteStop[]
  distance: number
  duration: number
  load: number
  capacity: number
  cost: number
  startTime: string
  endTime: string
  violated: boolean
  violations?: string[]
}

export interface RouteStop {
  deliveryId: string
  location: GeoLocation
  arrivalTime: string
  departureTime: string
  waitTime: number
  serviceTime: number
  load: number
  distance: number
  distanceFromPrevious: number
  sequence: number
}

export interface RoutingMetrics {
  utilizationRate: number
  averageLoadFactor: number
  averageRouteTime: number
  averageStopsPerRoute: number
  onTimeDeliveryRate: number
  costPerDelivery: number
  costPerKm: number
}

// ============================================================================
// Warehouse & Facility Types
// ============================================================================

export interface Warehouse {
  id: string
  name: string
  location: GeoLocation
  type: 'distribution-center' | 'fulfillment-center' | 'cross-dock' | 'warehouse'
  capacity: WarehouseCapacity
  layout: WarehouseLayout
  zones: WarehouseZone[]
  equipment: Equipment[]
  operatingHours: TimeWindow
  laborPool: LaborPool
}

export interface WarehouseCapacity {
  totalSpace: number
  usedSpace: number
  availableSpace: number
  unit: 'm2' | 'ft2'
  pallet-positions: number
  pickLocations: number
  dockDoors: number
}

export interface WarehouseLayout {
  aisles: Aisle[]
  zones: string[]
  docks: Dock[]
  pickingArea: Area
  receivingArea: Area
  shippingArea: Area
  stagingArea: Area
}

export interface Aisle {
  id: string
  zone: string
  length: number
  width: number
  locations: Location[]
}

export interface Location {
  id: string
  aisle: string
  zone: string
  level: number
  position: number
  coordinates: { x: number; y: number; z: number }
  type: 'pick' | 'reserve' | 'staging'
  capacity: number
  occupied: boolean
  productId?: string
  quantity?: number
}

export interface Dock {
  id: string
  type: 'inbound' | 'outbound' | 'both'
  status: 'available' | 'occupied' | 'maintenance'
  schedule: DockSchedule[]
}

export interface DockSchedule {
  appointmentId: string
  type: 'receiving' | 'shipping'
  start: Date
  end: Date
  carrierId: string
  status: 'scheduled' | 'arrived' | 'in-progress' | 'completed'
}

export interface Area {
  id: string
  type: string
  size: number
  capacity: number
  utilization: number
}

export interface WarehouseZone {
  id: string
  name: string
  type: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'staging'
  temperature?: TemperatureRange
  productCategories: string[]
  capacity: number
  utilization: number
}

export interface Equipment {
  id: string
  type: 'forklift' | 'reach-truck' | 'pallet-jack' | 'picker' | 'conveyor' | 'sorter'
  status: 'available' | 'in-use' | 'maintenance'
  assignedTo?: string
  location?: string
}

export interface LaborPool {
  totalWorkers: number
  availableWorkers: number
  shifts: Shift[]
  productivity: ProductivityMetrics
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  workers: number
}

export interface ProductivityMetrics {
  picksPerHour: number
  linesPerHour: number
  unitsPerHour: number
  accuracy: number
  utilization: number
}

export interface SlottingConfig {
  objectives: SlottingObjective[]
  constraints: SlottingConstraints
  strategy: SlottingStrategy
}

export type SlottingObjective =
  | 'minimize-pick-distance'
  | 'maximize-cube-utilization'
  | 'balance-workload'
  | 'optimize-replenishment'

export interface SlottingConstraints {
  temperatureZones: boolean
  productCompatibility: boolean
  weightLimits: boolean
  heightLimits: boolean
  affinityRules: AffinityRule[]
}

export interface AffinityRule {
  productIds: string[]
  type: 'must-colocate' | 'should-colocate' | 'must-separate'
  reason: string
}

export type SlottingStrategy =
  | 'velocity-based'
  | 'cube-per-order-index'
  | 'abc-analysis'
  | 'golden-zone'

export interface SlottingResult {
  assignments: LocationAssignment[]
  metrics: SlottingMetrics
  improvements: SlottingImprovements
}

export interface LocationAssignment {
  productId: string
  fromLocation?: string
  toLocation: string
  quantity: number
  priority: number
  move: boolean
}

export interface SlottingMetrics {
  averagePickDistance: number
  cubeUtilization: number
  workloadBalance: number
  replenishmentFrequency: number
}

export interface SlottingImprovements {
  beforeDistance: number
  afterDistance: number
  improvement: number
  estimatedTimeSavings: number
  estimatedCostSavings: number
}

export interface WavePlan {
  date: Date
  waves: Wave[]
  metrics: WaveMetrics
}

export interface Wave {
  waveId: string
  cutoffTime: string
  releaseTime: string
  orders: string[]
  lines: number
  units: number
  zones: string[]
  estimatedTime: number
  assignedWorkers: number
  status: 'planned' | 'released' | 'in-progress' | 'completed'
}

export interface WaveMetrics {
  totalOrders: number
  totalLines: number
  totalUnits: number
  averageWaveSize: number
  pickingEfficiency: number
  completionRate: number
}

// ============================================================================
// Supplier & Procurement Types
// ============================================================================

export interface Supplier {
  id: string
  name: string
  location: GeoLocation
  tier: 'strategic' | 'preferred' | 'approved' | 'transactional'
  categories: string[]
  products: SupplierProduct[]
  capabilities: SupplierCapabilities
  performance: SupplierPerformance
  risks: SupplierRisk[]
  contracts: Contract[]
  contacts: Contact[]
}

export interface SupplierProduct {
  productId: string
  supplierId: string
  sku: string
  unitPrice: number
  currency: Currency
  moq: number
  leadTime: number
  leadTimeVariability: number
  capacity: number
  qualityRating: number
}

export interface SupplierCapabilities {
  capacity: number
  flexibility: number
  qualitySystem: string[]
  certifications: string[]
  technology: string[]
  innovation: number
}

export interface SupplierPerformance {
  onTimeDelivery: number
  qualityRating: number
  responseTime: number
  fillRate: number
  defectRate: number
  costCompetitiveness: number
  innovation: number
  sustainability: number
  reliability: number
}

export interface SupplierRisk {
  type: 'financial' | 'operational' | 'geographic' | 'reputational' | 'compliance'
  description: string
  probability: number
  impact: number
  score: number
  mitigation: string
  status: 'open' | 'monitoring' | 'mitigated' | 'closed'
}

export interface Contract {
  id: string
  supplierId: string
  type: 'spot' | 'fixed-term' | 'framework' | 'blanket'
  startDate: Date
  endDate: Date
  value: number
  currency: Currency
  terms: ContractTerms
  status: 'draft' | 'active' | 'expired' | 'terminated'
}

export interface ContractTerms {
  pricing: PricingTerms
  delivery: DeliveryTerms
  quality: QualityTerms
  payment: PaymentTerms
  penalties: PenaltyTerms
}

export interface PricingTerms {
  basis: 'fixed' | 'variable' | 'cost-plus' | 'market-based'
  basePrice: number
  discounts: Discount[]
  escalation?: EscalationClause
}

export interface Discount {
  type: 'volume' | 'early-payment' | 'seasonal'
  threshold: number
  percentage: number
}

export interface EscalationClause {
  index: string
  frequency: 'monthly' | 'quarterly' | 'annually'
  cap?: number
}

export interface DeliveryTerms {
  leadTime: number
  incoterms: string
  moq: number
  maxOrderQuantity?: number
  orderMultiple?: number
}

export interface QualityTerms {
  aql: number
  inspectionLevel: string
  certifications: string[]
  returnPolicy: string
}

export interface PaymentTerms {
  method: string
  terms: string
  daysNet: number
  discountDays?: number
  discountPercentage?: number
}

export interface PenaltyTerms {
  lateDelivery: number
  qualityDefects: number
  shortShipment: number
}

export interface Contact {
  name: string
  role: string
  email: string
  phone: string
  primary: boolean
}

export interface SupplierScoring {
  criteria: ScoringCriterion[]
  weights: Record<string, number>
  method: 'weighted-sum' | 'ahp' | 'topsis'
}

export interface ScoringCriterion {
  name: string
  metric: string
  weight: number
  direction: 'higher-better' | 'lower-better'
  normalization: 'min-max' | 'z-score'
}

export interface SupplierScore {
  supplierId: string
  totalScore: number
  normalizedScore: number
  rank: number
  scores: Record<string, number>
  recommendation: 'strategic' | 'preferred' | 'approved' | 'monitor' | 'exit'
}

// ============================================================================
// Network Design Types
// ============================================================================

export interface SupplyChainNetwork {
  nodes: NetworkNode[]
  arcs: NetworkArc[]
  products: string[]
  flows: ProductFlow[]
  costs: NetworkCosts
}

export interface NetworkNode {
  id: string
  type: 'supplier' | 'plant' | 'distribution-center' | 'warehouse' | 'store' | 'customer'
  location: GeoLocation
  capacity: number
  fixedCost: number
  variableCost: number
  leadTime: number
  status: 'existing' | 'candidate' | 'planned' | 'closed'
  throughput?: number
  utilization?: number
}

export interface NetworkArc {
  id: string
  from: string
  to: string
  transportMode: 'truck' | 'rail' | 'air' | 'ocean' | 'intermodal'
  distance: number
  leadTime: number
  capacity?: number
  cost: number
  carbonEmissions?: number
}

export interface ProductFlow {
  productId: string
  from: string
  to: string
  quantity: number
  frequency: number
  cost: number
}

export interface NetworkCosts {
  fixedCosts: number
  transportationCosts: number
  warehouseCosts: number
  inventoryCosts: number
  totalCosts: number
}

export interface FacilityLocationProblem {
  customers: CustomerDemand[]
  candidateSites: FacilitySite[]
  constraints: FacilityConstraints
  costs: FacilityCosts
  objective: 'minimize-total-cost' | 'maximize-coverage' | 'minimize-facilities'
}

export interface CustomerDemand {
  id: string
  location: GeoLocation
  demand: number
  revenue: number
  serviceTimeRequired: number
}

export interface FacilitySite {
  id: string
  location: GeoLocation
  capacity: number
  fixedCost: number
  variableCost: number
  operatingCost: number
  constructionTime?: number
  status: 'available' | 'selected' | 'rejected'
}

export interface FacilityConstraints {
  maxFacilities?: number
  minFacilities?: number
  minCapacity: number
  maxCapacity: number
  serviceTimeLimit?: number
  budgetLimit?: number
  regionConstraints?: RegionConstraint[]
}

export interface RegionConstraint {
  region: string
  minFacilities?: number
  maxFacilities?: number
  coverageRequirement?: number
}

export interface FacilityCosts {
  fixedCost: Record<string, number>
  variableCost: Record<string, number>
  transportationCost: number[][]
}

export interface NetworkDesignSolution {
  facilities: SelectedFacility[]
  assignments: CustomerAssignment[]
  flows: ProductFlow[]
  totalCost: number
  metrics: NetworkMetrics
}

export interface SelectedFacility {
  siteId: string
  location: GeoLocation
  capacity: number
  throughput: number
  utilization: number
  customers: string[]
  annualCost: number
  constructionRequired: boolean
}

export interface CustomerAssignment {
  customerId: string
  facilityId: string
  distance: number
  serviceTime: number
  cost: number
}

export interface NetworkMetrics {
  totalCost: number
  fixedCost: number
  transportationCost: number
  operatingCost: number
  avgServiceTime: number
  maxServiceTime: number
  avgUtilization: number
  totalCapacity: number
  totalThroughput: number
  coverage: number
}

// ============================================================================
// Analytics & KPI Types
// ============================================================================

export interface SupplyChainKPIs {
  period: DateRange
  financialMetrics: FinancialMetrics
  operationalMetrics: OperationalMetrics
  serviceMetrics: ServiceMetrics
  efficiencyMetrics: EfficiencyMetrics
  sustainabilityMetrics: SustainabilityMetrics
}

export interface FinancialMetrics {
  totalRevenue: number
  totalCost: number
  grossMargin: number
  operatingMargin: number
  cashToCashCycle: number
  dio: number
  dso: number
  dpo: number
  inventoryValue: number
  costOfGoodsSold: number
  logisticsCostPercentage: number
}

export interface OperationalMetrics {
  inventoryTurnover: number
  fillRate: number
  stockoutRate: number
  orderCycleTime: number
  leadTime: number
  capacityUtilization: number
  throughput: number
  productivity: number
}

export interface ServiceMetrics {
  perfectOrderRate: number
  onTimeDelivery: number
  onTimeInFull: number
  completeOrders: number
  damageFree: number
  accurateDocs: number
  customerSatisfaction: number
  returnRate: number
}

export interface EfficiencyMetrics {
  orderAccuracy: number
  pickAccuracy: number
  warehouseUtilization: number
  transportationUtilization: number
  laborProductivity: number
  equipmentUtilization: number
  cycleTime: number
}

export interface SustainabilityMetrics {
  carbonEmissions: number
  emissionsPerUnit: number
  fuelConsumption: number
  wasteGenerated: number
  recyclingRate: number
  renewableEnergyUse: number
  waterConsumption: number
}

export interface BenchmarkData {
  metric: string
  value: number
  industryAverage: number
  topQuartile: number
  bottomQuartile: number
  percentile: number
  gap: number
}

export interface RootCauseAnalysis {
  metric: string
  target: number
  actual: number
  gap: number
  factors: CausalFactor[]
  recommendations: string[]
}

export interface CausalFactor {
  name: string
  contribution: number
  impact: string
  evidence: string[]
  recommendation: string
}

// ============================================================================
// Risk Management Types
// ============================================================================

export interface RiskAssessment {
  scope: 'end-to-end' | 'supply' | 'demand' | 'operations'
  categories: RiskCategory[]
  risks: Risk[]
  topRisks: Risk[]
  critical: Risk[]
  high: Risk[]
  medium: Risk[]
  low: Risk[]
  overallScore: number
  heatmap: RiskHeatmap
}

export type RiskCategory = 'supply' | 'demand' | 'operational' | 'financial' | 'strategic' | 'external'

export interface Risk {
  id: string
  description: string
  category: RiskCategory
  probability: number
  impact: number
  score: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  mitigation: string
  owner: string
  status: 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'closed'
  controls: Control[]
}

export interface Control {
  id: string
  description: string
  type: 'preventive' | 'detective' | 'corrective'
  effectiveness: number
  cost: number
  owner: string
}

export interface RiskHeatmap {
  matrix: number[][]
  labels: {
    probability: string[]
    impact: string[]
  }
  risks: Array<{ x: number; y: number; risk: Risk }>
}

export interface DisruptionScenario {
  type: 'supplier-disruption' | 'facility-closure' | 'transportation-disruption' | 'demand-spike' | 'natural-disaster'
  description: string
  duration: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedNodes: string[]
  affectedProducts?: string[]
  probability?: number
}

export interface DisruptionSimulation {
  scenario: DisruptionScenario
  currentState: SupplyChainState
  impact: DisruptionImpact
  mitigations: Mitigation[]
  mitigationEffectiveness: number
  recommendations: string[]
}

export interface SupplyChainState {
  inventory: InventoryState[]
  orders: Order[]
  production: ProductionSchedule[]
  transportation: TransportationPlan[]
}

export interface Order {
  id: string
  customerId: string
  items: OrderItem[]
  status: 'pending' | 'confirmed' | 'in-progress' | 'shipped' | 'delivered' | 'cancelled'
  promiseDate: Date
  actualDate?: Date
}

export interface OrderItem {
  productId: string
  quantity: number
  price: number
  status: string
}

export interface ProductionSchedule {
  facilityId: string
  productId: string
  quantity: number
  startDate: Date
  endDate: Date
  status: 'planned' | 'in-progress' | 'completed'
}

export interface TransportationPlan {
  id: string
  origin: string
  destination: string
  shipments: Shipment[]
  departureDate: Date
  arrivalDate: Date
  status: 'planned' | 'in-transit' | 'delivered' | 'delayed'
}

export interface Shipment {
  id: string
  productId: string
  quantity: number
  orderId?: string
}

export interface DisruptionImpact {
  lostSales: number
  additionalCosts: number
  stockoutDays: number
  customersAffected: number
  ordersDelayed: number
  recoveryTime: number
}

export interface Mitigation {
  action: string
  cost: number
  effectiveness: number
  implementationTime: number
  description: string
}

export interface ResilienceMetrics {
  score: number
  avgRecoveryTime: number
  redundancy: number
  flexibility: number
  visibility: number
  collaboration: number
}

// ============================================================================
// Optimization Common Types
// ============================================================================

export interface OptimizationProblem {
  objectiveFunction: ObjectiveFunction
  variables: Variable[]
  constraints: Constraint[]
  bounds: Bounds
}

export interface ObjectiveFunction {
  type: 'minimize' | 'maximize'
  expression: string
  coefficients: number[]
}

export interface Variable {
  name: string
  type: 'continuous' | 'integer' | 'binary'
  lowerBound: number
  upperBound: number
}

export interface Constraint {
  name: string
  type: 'equality' | 'inequality'
  expression: string
  bound: number
}

export interface Bounds {
  lower: number[]
  upper: number[]
}

export interface OptimizationResult {
  status: 'optimal' | 'feasible' | 'infeasible' | 'unbounded' | 'error'
  objectiveValue: number
  solution: number[]
  computationTime: number
  iterations?: number
  gap?: number
}
