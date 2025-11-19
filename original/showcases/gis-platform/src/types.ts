/**
 * GIS Platform Type Definitions
 *
 * Comprehensive type system for geospatial operations, geometries,
 * coordinate reference systems, and spatial analysis.
 */

// ============================================================================
// Coordinate and Position Types
// ============================================================================

/**
 * A position in geographic coordinates [longitude, latitude] or [longitude, latitude, elevation]
 */
export type Position = [number, number] | [number, number, number];

/**
 * Bounding box [minX, minY, maxX, maxY]
 */
export type BBox = [number, number, number, number];

/**
 * 3D Bounding box [minX, minY, minZ, maxX, maxY, maxZ]
 */
export type BBox3D = [number, number, number, number, number, number];

/**
 * Coordinate Reference System
 */
export interface CoordinateReferenceSystem {
  type: 'name' | 'link';
  properties: {
    name?: string;
    href?: string;
    type?: string;
  };
}

/**
 * EPSG code representation
 */
export type EPSGCode = `EPSG:${number}`;

/**
 * Common CRS types
 */
export enum CommonCRS {
  WGS84 = 'EPSG:4326',
  WebMercator = 'EPSG:3857',
  NAD83 = 'EPSG:4269',
  UTM_North_10 = 'EPSG:32610',
  UTM_North_11 = 'EPSG:32611',
}

// ============================================================================
// Geometry Types (GeoJSON-compliant)
// ============================================================================

/**
 * Base geometry interface
 */
export interface Geometry {
  type: GeometryType;
  coordinates: any;
  crs?: CoordinateReferenceSystem;
}

/**
 * Geometry type enumeration
 */
export enum GeometryType {
  Point = 'Point',
  MultiPoint = 'MultiPoint',
  LineString = 'LineString',
  MultiLineString = 'MultiLineString',
  Polygon = 'Polygon',
  MultiPolygon = 'MultiPolygon',
  GeometryCollection = 'GeometryCollection',
}

/**
 * Point geometry
 */
export interface Point extends Geometry {
  type: GeometryType.Point;
  coordinates: Position;
}

/**
 * MultiPoint geometry
 */
export interface MultiPoint extends Geometry {
  type: GeometryType.MultiPoint;
  coordinates: Position[];
}

/**
 * LineString geometry
 */
export interface LineString extends Geometry {
  type: GeometryType.LineString;
  coordinates: Position[];
}

/**
 * MultiLineString geometry
 */
export interface MultiLineString extends Geometry {
  type: GeometryType.MultiLineString;
  coordinates: Position[][];
}

/**
 * Polygon geometry (first ring is exterior, others are holes)
 */
export interface Polygon extends Geometry {
  type: GeometryType.Polygon;
  coordinates: Position[][];
}

/**
 * MultiPolygon geometry
 */
export interface MultiPolygon extends Geometry {
  type: GeometryType.MultiPolygon;
  coordinates: Position[][][];
}

/**
 * GeometryCollection
 */
export interface GeometryCollection extends Geometry {
  type: GeometryType.GeometryCollection;
  coordinates: never;
  geometries: Geometry[];
}

/**
 * Union type of all geometries
 */
export type AnyGeometry =
  | Point
  | MultiPoint
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon
  | GeometryCollection;

// ============================================================================
// Feature Types
// ============================================================================

/**
 * GeoJSON Feature
 */
export interface Feature<G extends Geometry = Geometry, P = Record<string, any>> {
  type: 'Feature';
  id?: string | number;
  geometry: G;
  properties: P;
  bbox?: BBox;
  crs?: CoordinateReferenceSystem;
}

/**
 * Feature Collection
 */
export interface FeatureCollection<G extends Geometry = Geometry, P = Record<string, any>> {
  type: 'FeatureCollection';
  features: Feature<G, P>[];
  bbox?: BBox;
  crs?: CoordinateReferenceSystem;
}

// ============================================================================
// Spatial Index Types
// ============================================================================

/**
 * Spatial index types
 */
export enum SpatialIndexType {
  RTree = 'rtree',
  QuadTree = 'quadtree',
  KDTree = 'kdtree',
  GridIndex = 'grid',
}

/**
 * Spatial index configuration
 */
export interface SpatialIndexConfig {
  indexType: SpatialIndexType;
  maxEntries?: number;
  minEntries?: number;
  dimensions?: number;
}

/**
 * Spatial index interface
 */
export interface SpatialIndex {
  insert(id: string | number, bbox: BBox): void;
  remove(id: string | number, bbox: BBox): void;
  search(bbox: BBox): Array<string | number>;
  clear(): void;
}

// ============================================================================
// Raster Types
// ============================================================================

/**
 * Raster data type
 */
export enum RasterDataType {
  UInt8 = 'uint8',
  UInt16 = 'uint16',
  UInt32 = 'uint32',
  Int8 = 'int8',
  Int16 = 'int16',
  Int32 = 'int32',
  Float32 = 'float32',
  Float64 = 'float64',
}

/**
 * Raster band metadata
 */
export interface RasterBand {
  index: number;
  dataType: RasterDataType;
  noDataValue?: number;
  statistics?: RasterStatistics;
  colorInterpretation?: string;
  description?: string;
}

/**
 * Raster statistics
 */
export interface RasterStatistics {
  min: number;
  max: number;
  mean: number;
  stddev: number;
  median?: number;
  mode?: number;
  count: number;
  sum?: number;
  percentiles?: Record<number, number>;
}

/**
 * Raster metadata
 */
export interface RasterMetadata {
  width: number;
  height: number;
  bands: number;
  dataType: RasterDataType;
  crs: string;
  transform: GeoTransform;
  bounds: BBox;
  resolution: [number, number];
  noDataValue?: number;
  compression?: string;
}

/**
 * Geotransform coefficients
 */
export type GeoTransform = [number, number, number, number, number, number];

/**
 * Raster data structure
 */
export interface Raster {
  metadata: RasterMetadata;
  bands: RasterBand[];
  data?: ArrayBuffer | Float32Array | Float64Array;
  path?: string;
}

/**
 * Resampling methods
 */
export enum ResamplingMethod {
  Nearest = 'nearest',
  Bilinear = 'bilinear',
  Cubic = 'cubic',
  CubicSpline = 'cubicspline',
  Lanczos = 'lanczos',
  Average = 'average',
  Mode = 'mode',
  Max = 'max',
  Min = 'min',
}

/**
 * Resample options
 */
export interface ResampleOptions {
  resolution?: [number, number];
  width?: number;
  height?: number;
  method?: ResamplingMethod;
  noDataValue?: number;
}

/**
 * Reproject options
 */
export interface ReprojectOptions {
  targetCRS: string;
  method?: ResamplingMethod;
  noDataValue?: number;
}

// ============================================================================
// Spatial Analysis Types
// ============================================================================

/**
 * Spatial operation types
 */
export enum SpatialOperation {
  Intersection = 'intersection',
  Union = 'union',
  Difference = 'difference',
  SymDifference = 'symdifference',
  Clip = 'clip',
  Erase = 'erase',
}

/**
 * Spatial predicate types
 */
export enum SpatialPredicate {
  Intersects = 'intersects',
  Contains = 'contains',
  Within = 'within',
  Touches = 'touches',
  Crosses = 'crosses',
  Overlaps = 'overlaps',
  Disjoint = 'disjoint',
  Equals = 'equals',
}

/**
 * Buffer options
 */
export interface BufferOptions {
  distance: number;
  resolution?: number;
  capStyle?: 'round' | 'square' | 'flat';
  joinStyle?: 'round' | 'mitre' | 'bevel';
  mitreLimit?: number;
  singleSided?: boolean;
}

/**
 * Simplification options
 */
export interface SimplificationOptions {
  tolerance: number;
  preserveTopology?: boolean;
  algorithm?: 'douglas-peucker' | 'visvalingam' | 'lang';
}

/**
 * Spatial join options
 */
export interface SpatialJoinOptions {
  predicate?: SpatialPredicate;
  how?: 'inner' | 'left' | 'right';
  lsuffix?: string;
  rsuffix?: string;
  op?: string;
}

/**
 * Overlay options
 */
export interface OverlayOptions {
  operation: SpatialOperation;
  keepAttributes?: boolean;
}

// ============================================================================
// Routing Types
// ============================================================================

/**
 * Network edge
 */
export interface NetworkEdge {
  id: string | number;
  source: string | number;
  target: string | number;
  geometry: LineString;
  weight?: number;
  attributes?: Record<string, any>;
}

/**
 * Network node
 */
export interface NetworkNode {
  id: string | number;
  geometry: Point;
  attributes?: Record<string, any>;
}

/**
 * Network graph
 */
export interface Network {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  directed: boolean;
  crs?: string;
}

/**
 * Routing algorithm types
 */
export enum RoutingAlgorithm {
  Dijkstra = 'dijkstra',
  AStar = 'astar',
  BellmanFord = 'bellman-ford',
  FloydWarshall = 'floyd-warshall',
}

/**
 * Route result
 */
export interface Route {
  geometry: LineString;
  distance: number;
  duration: number;
  nodes: Array<string | number>;
  edges: Array<string | number>;
  instructions?: RouteInstruction[];
}

/**
 * Route instruction
 */
export interface RouteInstruction {
  type: 'turn' | 'straight' | 'arrive' | 'depart';
  distance: number;
  duration: number;
  direction?: 'left' | 'right' | 'straight';
  text: string;
}

/**
 * Routing options
 */
export interface RoutingOptions {
  algorithm?: RoutingAlgorithm;
  impedance?: string;
  restrictions?: string[];
  uTurns?: boolean;
}

/**
 * Service area options
 */
export interface ServiceAreaOptions {
  maxTime?: number;
  maxDistance?: number;
  intervals?: number[];
  direction?: 'from' | 'to';
}

// ============================================================================
// Geocoding Types
// ============================================================================

/**
 * Geocoding provider
 */
export enum GeocodingProvider {
  Nominatim = 'nominatim',
  Google = 'google',
  Bing = 'bing',
  Here = 'here',
  MapBox = 'mapbox',
}

/**
 * Geocoded location
 */
export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  address: string;
  displayName?: string;
  importance?: number;
  placeId?: string;
  type?: string;
  bbox?: BBox;
  raw?: any;
}

/**
 * Parsed address
 */
export interface ParsedAddress {
  streetNumber?: string;
  street?: string;
  unit?: string;
  city?: string;
  county?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Geocoding options
 */
export interface GeocodingOptions {
  provider?: GeocodingProvider;
  language?: string;
  region?: string;
  bounds?: BBox;
  limit?: number;
  timeout?: number;
}

// ============================================================================
// Terrain Analysis Types
// ============================================================================

/**
 * Slope unit
 */
export enum SlopeUnit {
  Degrees = 'degrees',
  Percent = 'percent',
  Radians = 'radians',
}

/**
 * Slope algorithm
 */
export enum SlopeAlgorithm {
  Horn = 'horn',
  Zevenbergen = 'zevenbergen',
  FiniteDifference = 'finite-difference',
}

/**
 * Slope options
 */
export interface SlopeOptions {
  unit?: SlopeUnit;
  algorithm?: SlopeAlgorithm;
  zFactor?: number;
}

/**
 * Aspect options
 */
export interface AspectOptions {
  unit?: SlopeUnit;
  northDirection?: number;
}

/**
 * Hillshade options
 */
export interface HillshadeOptions {
  azimuth?: number;
  altitude?: number;
  zFactor?: number;
  scale?: number;
}

/**
 * Contour options
 */
export interface ContourOptions {
  interval: number;
  baseElevation?: number;
  minElevation?: number;
  maxElevation?: number;
  simplify?: boolean;
  tolerance?: number;
}

/**
 * Viewshed options
 */
export interface ViewshedOptions {
  observerHeight?: number;
  targetHeight?: number;
  radius?: number;
  useCurvature?: boolean;
  useRefraction?: boolean;
  refractionCoefficient?: number;
}

/**
 * Flow direction algorithm
 */
export enum FlowDirectionAlgorithm {
  D8 = 'd8',
  DInfinity = 'dinf',
  MFD = 'mfd',
}

// ============================================================================
// Satellite Imagery Types
// ============================================================================

/**
 * Multi-spectral image
 */
export interface MultiSpectralImage {
  bands: Raster[];
  metadata: ImageryMetadata;
}

/**
 * Imagery metadata
 */
export interface ImageryMetadata {
  satellite?: string;
  sensor?: string;
  acquisitionDate?: Date;
  cloudCover?: number;
  sunElevation?: number;
  sunAzimuth?: number;
  processingLevel?: string;
}

/**
 * Vegetation index type
 */
export enum VegetationIndex {
  NDVI = 'ndvi',
  EVI = 'evi',
  SAVI = 'savi',
  NDWI = 'ndwi',
  NDMI = 'ndmi',
  NBR = 'nbr',
}

/**
 * Band math expression
 */
export interface BandMathExpression {
  expression: string;
  bandMap: Record<string, number>;
  outputType?: RasterDataType;
}

/**
 * Pan-sharpening method
 */
export enum PanSharpenMethod {
  Brovey = 'brovey',
  IHS = 'ihs',
  PCA = 'pca',
  GramSchmidt = 'gram-schmidt',
}

/**
 * Atmospheric correction method
 */
export enum AtmosphericCorrectionMethod {
  DOS = 'dos',
  TOA = 'toa',
  SurfaceReflectance = 'surface-reflectance',
}

// ============================================================================
// Clustering Types
// ============================================================================

/**
 * Clustering algorithm
 */
export enum ClusteringAlgorithm {
  KMeans = 'kmeans',
  DBSCAN = 'dbscan',
  Hierarchical = 'hierarchical',
  OPTICS = 'optics',
  MeanShift = 'meanshift',
  SpectralClustering = 'spectral',
}

/**
 * Cluster result
 */
export interface Cluster {
  id: number;
  centroid?: Position;
  members: Array<string | number>;
  size: number;
  bounds?: BBox;
}

/**
 * DBSCAN options
 */
export interface DBSCANOptions {
  eps: number;
  minSamples: number;
  metric?: 'euclidean' | 'haversine' | 'manhattan';
  algorithm?: 'auto' | 'ball_tree' | 'kd_tree' | 'brute';
}

/**
 * K-Means options
 */
export interface KMeansOptions {
  nClusters: number;
  maxIterations?: number;
  tolerance?: number;
  init?: 'k-means++' | 'random';
  randomState?: number;
}

/**
 * Hierarchical clustering options
 */
export interface HierarchicalOptions {
  nClusters?: number;
  method?: 'ward' | 'complete' | 'average' | 'single';
  metric?: string;
  distanceThreshold?: number;
}

/**
 * Spatial autocorrelation result
 */
export interface AutocorrelationResult {
  statistic: number;
  pValue: number;
  zScore: number;
  expectedValue: number;
  variance: number;
}

/**
 * Hot spot analysis result
 */
export interface HotSpotResult extends Feature {
  properties: {
    zScore: number;
    pValue: number;
    confidence: number;
    type: 'hot' | 'cold' | 'not-significant';
  };
}

// ============================================================================
// Visualization Types
// ============================================================================

/**
 * Map options
 */
export interface MapOptions {
  center?: Position;
  zoom?: number;
  basemap?: string;
  width?: number;
  height?: number;
  crs?: string;
}

/**
 * Style definition
 */
export interface Style {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeDashArray?: string;
  radius?: number;
  weight?: number;
}

/**
 * Choropleth options
 */
export interface ChoroplethOptions {
  valueField: string;
  colorScheme?: string;
  bins?: number;
  method?: 'equal_interval' | 'quantile' | 'natural_breaks' | 'standard_deviation';
  legend?: boolean;
  legendTitle?: string;
}

/**
 * Heatmap options
 */
export interface HeatmapOptions {
  intensity?: string | number;
  radius?: number;
  blur?: number;
  minOpacity?: number;
  maxZoom?: number;
  gradient?: Record<number, string>;
}

/**
 * Colormap type
 */
export type Colormap =
  | 'viridis'
  | 'plasma'
  | 'inferno'
  | 'magma'
  | 'cividis'
  | 'YlOrRd'
  | 'RdYlGn'
  | 'Spectral'
  | 'coolwarm';

// ============================================================================
// Processing Options
// ============================================================================

/**
 * Parallel processing options
 */
export interface ParallelOptions {
  workers?: number;
  chunkSize?: number;
  memoryLimit?: string;
}

/**
 * Streaming options
 */
export interface StreamingOptions {
  batchSize?: number;
  filter?: (feature: Feature) => boolean;
  transform?: (feature: Feature) => Feature;
}

/**
 * Cache options
 */
export interface CacheOptions {
  enabled?: boolean;
  ttl?: number;
  maxSize?: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * GIS Error
 */
export class GISError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GISError';
  }
}

/**
 * Projection Error
 */
export class ProjectionError extends GISError {
  constructor(message: string, details?: any) {
    super(message, 'PROJECTION_ERROR', details);
    this.name = 'ProjectionError';
  }
}

/**
 * Geometry Error
 */
export class GeometryError extends GISError {
  constructor(message: string, details?: any) {
    super(message, 'GEOMETRY_ERROR', details);
    this.name = 'GeometryError';
  }
}

/**
 * Routing Error
 */
export class RoutingError extends GISError {
  constructor(message: string, details?: any) {
    super(message, 'ROUTING_ERROR', details);
    this.name = 'RoutingError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Distance unit
 */
export enum DistanceUnit {
  Meters = 'meters',
  Kilometers = 'kilometers',
  Miles = 'miles',
  Feet = 'feet',
  NauticalMiles = 'nautical-miles',
}

/**
 * Area unit
 */
export enum AreaUnit {
  SquareMeters = 'square-meters',
  SquareKilometers = 'square-kilometers',
  SquareMiles = 'square-miles',
  SquareFeet = 'square-feet',
  Hectares = 'hectares',
  Acres = 'acres',
}

/**
 * Measurement result
 */
export interface Measurement {
  value: number;
  unit: DistanceUnit | AreaUnit;
}

/**
 * Extent (bounding box with CRS)
 */
export interface Extent {
  bounds: BBox;
  crs: string;
}

/**
 * Grid cell
 */
export interface GridCell {
  id: string | number;
  geometry: Polygon;
  row: number;
  column: number;
  properties?: Record<string, any>;
}

/**
 * Grid options
 */
export interface GridOptions {
  cellSize?: number;
  cellWidth?: number;
  cellHeight?: number;
  rows?: number;
  columns?: number;
  crs?: string;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  Position,
  BBox,
  BBox3D,
  Geometry,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection,
  AnyGeometry,
  Feature,
  FeatureCollection,
  Raster,
  RasterBand,
  RasterMetadata,
  MultiSpectralImage,
  Network,
  NetworkEdge,
  NetworkNode,
  Route,
  Cluster,
};
