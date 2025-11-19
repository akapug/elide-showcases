/**
 * Spatial Analyzer
 *
 * Comprehensive spatial analysis operations using python:geopandas and python:shapely
 * for distance calculations, area measurements, overlay analysis, and density estimation.
 */

// @ts-ignore
import geopandas from 'python:geopandas';
// @ts-ignore
import shapely from 'python:shapely';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import pandas from 'python:pandas';

import {
  Feature,
  Point,
  Polygon,
  MultiPolygon,
  LineString,
  Geometry,
  BBox,
  GridCell,
  GridOptions,
  Measurement,
  DistanceUnit,
  AreaUnit,
  SpatialOperation,
  GeometryError,
} from '../types';

/**
 * SpatialAnalyzer class for advanced spatial operations
 */
export class SpatialAnalyzer {
  constructor() {}

  /**
   * Calculate distances from features to a reference point
   */
  async calculateDistances(features: Feature[], reference: Point): Promise<number[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const refGeom = shapely.geometry.shape(reference);
      const distances = gdf.geometry.distance(refGeom);
      return Array.from(distances);
    } catch (error) {
      throw new GeometryError(`Distance calculation failed: ${error}`);
    }
  }

  /**
   * Calculate pairwise distances between all features
   */
  async calculatePairwiseDistances(features: Feature[]): Promise<number[][]> {
    try {
      const geometries = features.map((f) => shapely.geometry.shape(f.geometry));
      const n = geometries.length;
      const distances: number[][] = Array(n)
        .fill(0)
        .map(() => Array(n).fill(0));

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dist = geometries[i].distance(geometries[j]);
          distances[i][j] = dist;
          distances[j][i] = dist;
        }
      }

      return distances;
    } catch (error) {
      throw new GeometryError(`Pairwise distance calculation failed: ${error}`);
    }
  }

  /**
   * Find k-nearest neighbors for each feature
   */
  async findNearestNeighbors(features: Feature[], k: number = 5): Promise<Array<number[]>> {
    try {
      const distances = await this.calculatePairwiseDistances(features);
      const neighbors: Array<number[]> = [];

      for (let i = 0; i < features.length; i++) {
        const row = distances[i].map((d, idx) => ({ distance: d, index: idx }));
        row.sort((a, b) => a.distance - b.distance);
        neighbors.push(row.slice(1, k + 1).map((n) => n.index));
      }

      return neighbors;
    } catch (error) {
      throw new GeometryError(`Nearest neighbor search failed: ${error}`);
    }
  }

  /**
   * Calculate areas of polygon features
   */
  async calculateAreas(features: Feature<Polygon | MultiPolygon>[], unit?: AreaUnit): Promise<Measurement[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const areas = Array.from(gdf.geometry.area);

      return areas.map((area) => ({
        value: this.convertArea(area, unit || AreaUnit.SquareMeters),
        unit: unit || AreaUnit.SquareMeters,
      }));
    } catch (error) {
      throw new GeometryError(`Area calculation failed: ${error}`);
    }
  }

  /**
   * Calculate perimeters of polygon features
   */
  async calculatePerimeters(
    features: Feature<Polygon | MultiPolygon>[],
    unit?: DistanceUnit
  ): Promise<Measurement[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const lengths = Array.from(gdf.geometry.length);

      return lengths.map((length) => ({
        value: this.convertDistance(length, unit || DistanceUnit.Meters),
        unit: unit || DistanceUnit.Meters,
      }));
    } catch (error) {
      throw new GeometryError(`Perimeter calculation failed: ${error}`);
    }
  }

  /**
   * Calculate lengths of line features
   */
  async calculateLengths(features: Feature<LineString>[], unit?: DistanceUnit): Promise<Measurement[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const lengths = Array.from(gdf.geometry.length);

      return lengths.map((length) => ({
        value: this.convertDistance(length, unit || DistanceUnit.Meters),
        unit: unit || DistanceUnit.Meters,
      }));
    } catch (error) {
      throw new GeometryError(`Length calculation failed: ${error}`);
    }
  }

  /**
   * Spatial overlay analysis
   */
  async spatialOverlay(
    layer1: Feature[],
    layer2: Feature[],
    options: {
      operation: SpatialOperation;
      keepAttributes?: boolean;
    }
  ): Promise<Feature[]> {
    try {
      const gdf1 = this.featuresToGeoDataFrame(layer1);
      const gdf2 = this.featuresToGeoDataFrame(layer2);

      const operation = this.getOverlayOperation(options.operation);
      const result = geopandas.overlay(gdf1, gdf2, how=operation);

      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Spatial overlay failed: ${error}`);
    }
  }

  /**
   * Kernel density estimation
   */
  async kernelDensity(
    points: Feature<Point>[],
    options: {
      bandwidth: number;
      cellSize: number;
      kernel?: 'gaussian' | 'exponential' | 'quartic' | 'triangular';
      bounds?: BBox;
    }
  ): Promise<{
    values: number[][];
    bounds: BBox;
    cellSize: number;
  }> {
    try {
      const gdf = this.featuresToGeoDataFrame(points);
      const coords = numpy.array(
        Array.from(gdf.geometry.apply((g: any) => [g.x, g.y]))
      );

      // Determine bounds
      const bounds = options.bounds || Array.from(gdf.total_bounds);
      const [minX, minY, maxX, maxY] = bounds;

      // Create grid
      const xRange = numpy.arange(minX, maxX, options.cellSize);
      const yRange = numpy.arange(minY, maxY, options.cellSize);
      const xx, yy = numpy.meshgrid(xRange, yRange);

      // Perform KDE
      const positions = numpy.vstack([xx.ravel(), yy.ravel()]);
      const kernel = scipy.stats.gaussian_kde(coords.T);
      const density = numpy.reshape(kernel(positions), xx.shape);

      const values: number[][] = [];
      for (let i = 0; i < density.shape[0]; i++) {
        values.push(Array.from(density[i]));
      }

      return {
        values,
        bounds: bounds as BBox,
        cellSize: options.cellSize,
      };
    } catch (error) {
      throw new GeometryError(`Kernel density estimation failed: ${error}`);
    }
  }

  /**
   * Point density analysis
   */
  async pointDensity(
    points: Feature<Point>[],
    polygons: Feature<Polygon | MultiPolygon>[]
  ): Promise<Feature[]> {
    try {
      const pointsGdf = this.featuresToGeoDataFrame(points);
      const polygonsGdf = this.featuresToGeoDataFrame(polygons);

      // Spatial join to count points in polygons
      const joined = geopandas.sjoin(pointsGdf, polygonsGdf, how='right', predicate='within');

      // Count points per polygon
      const counts = joined.groupby(joined.index).size();

      // Add density to polygons
      polygonsGdf['point_count'] = counts;
      polygonsGdf['density'] = counts / polygonsGdf.geometry.area;

      return this.convertToFeatures(polygonsGdf);
    } catch (error) {
      throw new GeometryError(`Point density calculation failed: ${error}`);
    }
  }

  /**
   * Generate Voronoi polygons
   */
  async voronoiPolygons(points: Feature<Point>[], bounds?: BBox): Promise<Feature<Polygon>[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(points);
      const coords = numpy.array(
        Array.from(gdf.geometry.apply((g: any) => [g.x, g.y]))
      );

      // Create Voronoi diagram
      const vor = scipy.spatial.Voronoi(coords);

      // Convert to polygons
      const polygons: Feature<Polygon>[] = [];

      for (let i = 0; i < vor.point_region.length; i++) {
        const region = vor.regions[vor.point_region[i]];
        if (region.length > 0 && !region.includes(-1)) {
          const vertices = region.map((idx: number) => vor.vertices[idx]);
          const polygon = shapely.geometry.Polygon(vertices);

          // Clip to bounds if provided
          if (bounds) {
            const boundsGeom = shapely.geometry.box(*bounds);
            polygon = polygon.intersection(boundsGeom);
          }

          polygons.push({
            type: 'Feature',
            geometry: shapely.geometry.mapping(polygon),
            properties: { point_index: i },
          });
        }
      }

      return polygons as Feature<Polygon>[];
    } catch (error) {
      throw new GeometryError(`Voronoi polygon generation failed: ${error}`);
    }
  }

  /**
   * Delaunay triangulation
   */
  async delaunayTriangulation(points: Feature<Point>[]): Promise<Feature<Polygon>[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(points);
      const coords = numpy.array(
        Array.from(gdf.geometry.apply((g: any) => [g.x, g.y]))
      );

      // Create Delaunay triangulation
      const tri = scipy.spatial.Delaunay(coords);

      // Convert to polygons
      const polygons: Feature<Polygon>[] = [];

      for (let i = 0; i < tri.simplices.length; i++) {
        const simplex = tri.simplices[i];
        const vertices = simplex.map((idx: number) => [coords[idx][0], coords[idx][1]]);
        vertices.push(vertices[0]); // Close the polygon

        const polygon = shapely.geometry.Polygon(vertices);

        polygons.push({
          type: 'Feature',
          geometry: shapely.geometry.mapping(polygon),
          properties: { triangle_index: i },
        });
      }

      return polygons as Feature<Polygon>[];
    } catch (error) {
      throw new GeometryError(`Delaunay triangulation failed: ${error}`);
    }
  }

  /**
   * Create regular grid
   */
  async createGrid(extent: BBox | Feature[], options: GridOptions): Promise<Feature<Polygon>[]> {
    try {
      let bounds: BBox;

      if (Array.isArray(extent) && typeof extent[0] === 'number') {
        bounds = extent as BBox;
      } else {
        const gdf = this.featuresToGeoDataFrame(extent as Feature[]);
        bounds = Array.from(gdf.total_bounds) as BBox;
      }

      const [minX, minY, maxX, maxY] = bounds;

      let cellWidth: number;
      let cellHeight: number;

      if (options.cellSize) {
        cellWidth = cellHeight = options.cellSize;
      } else if (options.cellWidth && options.cellHeight) {
        cellWidth = options.cellWidth;
        cellHeight = options.cellHeight;
      } else if (options.rows && options.columns) {
        cellWidth = (maxX - minX) / options.columns;
        cellHeight = (maxY - minY) / options.rows;
      } else {
        throw new Error('Must specify cellSize, cellWidth/cellHeight, or rows/columns');
      }

      const cells: Feature<Polygon>[] = [];
      let id = 0;

      for (let x = minX; x < maxX; x += cellWidth) {
        for (let y = minY; y < maxY; y += cellHeight) {
          const cell = shapely.geometry.box(
            x,
            y,
            Math.min(x + cellWidth, maxX),
            Math.min(y + cellHeight, maxY)
          );

          cells.push({
            type: 'Feature',
            geometry: shapely.geometry.mapping(cell),
            properties: {
              id: id++,
              row: Math.floor((y - minY) / cellHeight),
              column: Math.floor((x - minX) / cellWidth),
            },
          });
        }
      }

      return cells as Feature<Polygon>[];
    } catch (error) {
      throw new GeometryError(`Grid creation failed: ${error}`);
    }
  }

  /**
   * Create hexagonal grid
   */
  async createHexGrid(extent: BBox | Feature[], hexSize: number): Promise<Feature<Polygon>[]> {
    try {
      let bounds: BBox;

      if (Array.isArray(extent) && typeof extent[0] === 'number') {
        bounds = extent as BBox;
      } else {
        const gdf = this.featuresToGeoDataFrame(extent as Feature[]);
        bounds = Array.from(gdf.total_bounds) as BBox;
      }

      const [minX, minY, maxX, maxY] = bounds;
      const hexagons: Feature<Polygon>[] = [];

      const width = hexSize * 2;
      const height = Math.sqrt(3) * hexSize;
      const vertDist = height;
      const horizDist = width * 0.75;

      let id = 0;
      let row = 0;

      for (let y = minY; y < maxY + height; y += vertDist) {
        const xOffset = row % 2 === 0 ? 0 : hexSize * 1.5;
        let col = 0;

        for (let x = minX + xOffset; x < maxX + width; x += horizDist) {
          const hex = this.createHexagon(x, y, hexSize);

          hexagons.push({
            type: 'Feature',
            geometry: shapely.geometry.mapping(hex),
            properties: { id: id++, row, column: col++ },
          });
        }
        row++;
      }

      return hexagons as Feature<Polygon>[];
    } catch (error) {
      throw new GeometryError(`Hex grid creation failed: ${error}`);
    }
  }

  /**
   * Spatial join with aggregation
   */
  async spatialJoin(
    left: Feature[],
    right: Feature[],
    options: {
      operation: 'count' | 'sum' | 'mean' | 'min' | 'max';
      targetField?: string;
      predicate?: string;
    }
  ): Promise<Feature[]> {
    try {
      const leftGdf = this.featuresToGeoDataFrame(left);
      const rightGdf = this.featuresToGeoDataFrame(right);

      const predicate = options.predicate || 'intersects';
      const joined = geopandas.sjoin(leftGdf, rightGdf, how='left', predicate=predicate);

      let result: any;

      switch (options.operation) {
        case 'count':
          result = joined.groupby(joined.index).size().to_frame('count');
          result = leftGdf.join(result);
          result['count'] = result['count'].fillna(0);
          break;
        case 'sum':
        case 'mean':
        case 'min':
        case 'max':
          if (!options.targetField) {
            throw new Error('targetField required for aggregation operations');
          }
          const agg = joined.groupby(joined.index)[options.targetField].agg(options.operation);
          result = leftGdf.join(agg.to_frame(`${options.targetField}_${options.operation}`));
          break;
        default:
          result = leftGdf;
      }

      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Spatial join failed: ${error}`);
    }
  }

  /**
   * Calculate compactness (shape complexity)
   */
  async calculateCompactness(features: Feature<Polygon | MultiPolygon>[]): Promise<number[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);

      // Compactness = (4 * π * area) / (perimeter²)
      const areas = gdf.geometry.area;
      const perimeters = gdf.geometry.length;
      const compactness = (4 * Math.PI * areas) / (perimeters * perimeters);

      return Array.from(compactness);
    } catch (error) {
      throw new GeometryError(`Compactness calculation failed: ${error}`);
    }
  }

  /**
   * Calculate elongation
   */
  async calculateElongation(features: Feature<Polygon | MultiPolygon>[]): Promise<number[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const elongations: number[] = [];

      for (let i = 0; i < gdf.length; i++) {
        const geom = gdf.geometry.iloc[i];
        const mbr = geom.minimum_rotated_rectangle;
        const coords = Array.from(mbr.exterior.coords);

        // Calculate length and width of MBR
        const side1 = this.distance(coords[0], coords[1]);
        const side2 = this.distance(coords[1], coords[2]);

        const length = Math.max(side1, side2);
        const width = Math.min(side1, side2);

        elongations.push(width / length);
      }

      return elongations;
    } catch (error) {
      throw new GeometryError(`Elongation calculation failed: ${error}`);
    }
  }

  /**
   * Minimum bounding rectangle
   */
  async minimumBoundingRectangle(features: Feature[]): Promise<Feature<Polygon>[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const mbrs = gdf.geometry.minimum_rotated_rectangle;

      const result = gdf.copy();
      result['geometry'] = mbrs;

      return this.convertToFeatures(result) as Feature<Polygon>[];
    } catch (error) {
      throw new GeometryError(`Minimum bounding rectangle calculation failed: ${error}`);
    }
  }

  /**
   * Minimum bounding circle
   */
  async minimumBoundingCircle(features: Feature[]): Promise<Feature<Polygon>[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const circles: any[] = [];

      for (let i = 0; i < gdf.length; i++) {
        const geom = gdf.geometry.iloc[i];
        const centroid = geom.centroid;
        const maxDist = numpy.max(
          Array.from(geom.exterior.coords).map((coord: any) =>
            centroid.distance(shapely.geometry.Point(coord))
          )
        );

        circles.push(centroid.buffer(maxDist));
      }

      const result = gdf.copy();
      result['geometry'] = geopandas.GeoSeries(circles);

      return this.convertToFeatures(result) as Feature<Polygon>[];
    } catch (error) {
      throw new GeometryError(`Minimum bounding circle calculation failed: ${error}`);
    }
  }

  /**
   * Calculate spatial autocorrelation (Moran's I)
   */
  async moransI(
    features: Feature<Polygon | MultiPolygon>[],
    field: string,
    options?: { weightType?: 'queen' | 'rook'; permutations?: number }
  ): Promise<{
    statistic: number;
    pValue: number;
    zScore: number;
  }> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const values = Array.from(gdf[field]);

      // Create spatial weights matrix
      const weightType = options?.weightType || 'queen';
      const weights = this.createSpatialWeights(gdf, weightType);

      // Calculate Moran's I
      const n = values.length;
      const mean = numpy.mean(values);
      const variance = numpy.var(values);

      let numerator = 0;
      let denominator = 0;
      let sumWeights = 0;

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (weights[i][j] > 0) {
            numerator += weights[i][j] * (values[i] - mean) * (values[j] - mean);
            sumWeights += weights[i][j];
          }
        }
        denominator += Math.pow(values[i] - mean, 2);
      }

      const moransI = (n / sumWeights) * (numerator / denominator);

      // Calculate expected value and variance for z-score
      const expectedI = -1 / (n - 1);
      const varianceI = this.calculateMoransIVariance(n, sumWeights);
      const zScore = (moransI - expectedI) / Math.sqrt(varianceI);
      const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

      return {
        statistic: moransI,
        pValue,
        zScore,
      };
    } catch (error) {
      throw new GeometryError(`Moran's I calculation failed: ${error}`);
    }
  }

  /**
   * Hot spot analysis (Getis-Ord Gi*)
   */
  async getisOrdGiStar(
    features: Feature<Point>[],
    field: string,
    distanceBand: number
  ): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const values = Array.from(gdf[field]);
      const n = values.length;

      // Calculate distance-based weights
      const coords = numpy.array(
        Array.from(gdf.geometry.apply((g: any) => [g.x, g.y]))
      );

      const giStars: number[] = [];
      const zScores: number[] = [];

      const globalMean = numpy.mean(values);
      const globalStd = numpy.std(values);

      for (let i = 0; i < n; i++) {
        let sumWeightedValues = 0;
        let sumWeights = 0;

        for (let j = 0; j < n; j++) {
          const dist = numpy.linalg.norm(coords[i] - coords[j]);
          if (dist <= distanceBand) {
            const weight = 1;
            sumWeightedValues += weight * values[j];
            sumWeights += weight;
          }
        }

        const giStar = sumWeightedValues / sumWeights;
        const zScore = (giStar - globalMean) / (globalStd / Math.sqrt(sumWeights));

        giStars.push(giStar);
        zScores.push(zScore);
      }

      gdf['gi_star'] = giStars;
      gdf['z_score'] = zScores;
      gdf['p_value'] = zScores.map((z) => 2 * (1 - this.normalCDF(Math.abs(z))));
      gdf['hotspot_type'] = zScores.map((z) => {
        if (z > 1.96) return 'hot';
        if (z < -1.96) return 'cold';
        return 'not-significant';
      });

      return this.convertToFeatures(gdf);
    } catch (error) {
      throw new GeometryError(`Getis-Ord Gi* calculation failed: ${error}`);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private featuresToGeoDataFrame(features: Feature[]): any {
    const geometries = features.map((f) => shapely.geometry.shape(f.geometry));
    const properties = features.map((f) => f.properties);
    return geopandas.GeoDataFrame(properties, geometry=geometries);
  }

  private convertToFeatures(gdf: any): Feature[] {
    const features: Feature[] = [];
    for (let i = 0; i < gdf.length; i++) {
      const row = gdf.iloc[i];
      const geometry = shapely.geometry.mapping(row.geometry);
      const properties: Record<string, any> = {};

      for (const col of gdf.columns) {
        if (col !== 'geometry') {
          properties[col] = row[col];
        }
      }

      features.push({ type: 'Feature', geometry, properties });
    }
    return features;
  }

  private getOverlayOperation(operation: SpatialOperation): string {
    const ops = {
      [SpatialOperation.Intersection]: 'intersection',
      [SpatialOperation.Union]: 'union',
      [SpatialOperation.Difference]: 'difference',
      [SpatialOperation.SymDifference]: 'symmetric_difference',
    };
    return ops[operation] || 'intersection';
  }

  private convertDistance(value: number, unit: DistanceUnit): number {
    const conversions = {
      [DistanceUnit.Meters]: 1,
      [DistanceUnit.Kilometers]: 0.001,
      [DistanceUnit.Miles]: 0.000621371,
      [DistanceUnit.Feet]: 3.28084,
      [DistanceUnit.NauticalMiles]: 0.000539957,
    };
    return value * conversions[unit];
  }

  private convertArea(value: number, unit: AreaUnit): number {
    const conversions = {
      [AreaUnit.SquareMeters]: 1,
      [AreaUnit.SquareKilometers]: 0.000001,
      [AreaUnit.SquareMiles]: 3.861e-7,
      [AreaUnit.SquareFeet]: 10.7639,
      [AreaUnit.Hectares]: 0.0001,
      [AreaUnit.Acres]: 0.000247105,
    };
    return value * conversions[unit];
  }

  private createHexagon(centerX: number, centerY: number, size: number): any {
    const angles = [0, 60, 120, 180, 240, 300, 360];
    const coords = angles.map((angle) => {
      const rad = (angle * Math.PI) / 180;
      return [centerX + size * Math.cos(rad), centerY + size * Math.sin(rad)];
    });
    return shapely.geometry.Polygon(coords);
  }

  private distance(p1: number[], p2: number[]): number {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
  }

  private createSpatialWeights(gdf: any, type: 'queen' | 'rook'): number[][] {
    const n = gdf.length;
    const weights: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const geom1 = gdf.geometry.iloc[i];
        const geom2 = gdf.geometry.iloc[j];

        if (type === 'queen' && geom1.touches(geom2)) {
          weights[i][j] = 1;
          weights[j][i] = 1;
        } else if (type === 'rook' && geom1.touches(geom2)) {
          const intersection = geom1.intersection(geom2);
          if (intersection.geom_type === 'LineString') {
            weights[i][j] = 1;
            weights[j][i] = 1;
          }
        }
      }
    }

    return weights;
  }

  private calculateMoransIVariance(n: number, sumWeights: number): number {
    const expectedI = -1 / (n - 1);
    return (n * ((n * n - 3 * n + 3) * sumWeights - n * sumWeights * sumWeights + 3) - expectedI * expectedI) /
      ((n - 1) * (n - 2) * (n - 3));
  }

  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const prob =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }
}

export default SpatialAnalyzer;
