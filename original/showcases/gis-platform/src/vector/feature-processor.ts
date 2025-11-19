/**
 * Vector Feature Processor
 *
 * High-performance vector geospatial data processing using python:geopandas
 * and python:shapely for geometric operations.
 */

// @ts-ignore
import geopandas from 'python:geopandas';
// @ts-ignore
import shapely from 'python:shapely';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import rtree from 'python:rtree';

import {
  Feature,
  FeatureCollection,
  Geometry,
  Point,
  Polygon,
  LineString,
  MultiPolygon,
  BBox,
  SpatialPredicate,
  SpatialOperation,
  BufferOptions,
  SimplificationOptions,
  SpatialJoinOptions,
  OverlayOptions,
  SpatialIndex,
  SpatialIndexConfig,
  SpatialIndexType,
  GeometryError,
} from '../types';

/**
 * FeatureProcessor class for vector data operations
 */
export class FeatureProcessor {
  private gdf: any = null;
  private spatialIndex: any = null;

  constructor() {}

  /**
   * Load GeoJSON file into GeoDataFrame
   */
  async loadGeoJSON(path: string): Promise<Feature[]> {
    try {
      this.gdf = geopandas.read_file(path);
      return this.convertToFeatures(this.gdf);
    } catch (error) {
      throw new GeometryError(`Failed to load GeoJSON: ${error}`);
    }
  }

  /**
   * Load Shapefile
   */
  async loadShapefile(path: string): Promise<Feature[]> {
    try {
      this.gdf = geopandas.read_file(path);
      return this.convertToFeatures(this.gdf);
    } catch (error) {
      throw new GeometryError(`Failed to load Shapefile: ${error}`);
    }
  }

  /**
   * Load GeoPackage
   */
  async loadGeoPackage(path: string, layer?: string): Promise<Feature[]> {
    try {
      const options = layer ? { layer } : {};
      this.gdf = geopandas.read_file(path, options);
      return this.convertToFeatures(this.gdf);
    } catch (error) {
      throw new GeometryError(`Failed to load GeoPackage: ${error}`);
    }
  }

  /**
   * Save features to GeoJSON
   */
  async saveGeoJSON(features: Feature[], path: string): Promise<void> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      gdf.to_file(path, driver='GeoJSON');
    } catch (error) {
      throw new GeometryError(`Failed to save GeoJSON: ${error}`);
    }
  }

  /**
   * Save features to Shapefile
   */
  async saveShapefile(features: Feature[], path: string): Promise<void> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      gdf.to_file(path, driver='ESRI Shapefile');
    } catch (error) {
      throw new GeometryError(`Failed to save Shapefile: ${error}`);
    }
  }

  /**
   * Save features to GeoPackage
   */
  async saveGeoPackage(features: Feature[], path: string, layer: string = 'features'): Promise<void> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      gdf.to_file(path, layer, driver='GPKG');
    } catch (error) {
      throw new GeometryError(`Failed to save GeoPackage: ${error}`);
    }
  }

  /**
   * Buffer features by specified distance
   */
  async buffer(features: Feature[], distance: number, options?: BufferOptions): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);

      const resolution = options?.resolution || 16;
      const capStyle = this.getCapStyleCode(options?.capStyle);
      const joinStyle = this.getJoinStyleCode(options?.joinStyle);

      let buffered;
      if (options?.singleSided) {
        buffered = gdf.geometry.buffer(
          distance,
          resolution,
          cap_style=capStyle,
          join_style=joinStyle,
          single_sided=true
        );
      } else {
        buffered = gdf.geometry.buffer(
          distance,
          resolution,
          cap_style=capStyle,
          join_style=joinStyle
        );
      }

      const result = gdf.copy();
      result['geometry'] = buffered;
      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Buffer operation failed: ${error}`);
    }
  }

  /**
   * Intersection of two feature sets
   */
  async intersect(features1: Feature[], features2: Feature[]): Promise<Feature[]> {
    try {
      const gdf1 = this.featuresToGeoDataFrame(features1);
      const gdf2 = this.featuresToGeoDataFrame(features2);

      const result = geopandas.overlay(gdf1, gdf2, how='intersection');
      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Intersection operation failed: ${error}`);
    }
  }

  /**
   * Union of features
   */
  async union(features: Feature[]): Promise<Feature> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const unionGeom = gdf.geometry.unary_union;

      return {
        type: 'Feature',
        geometry: this.shapelyToGeoJSON(unionGeom),
        properties: {},
      };
    } catch (error) {
      throw new GeometryError(`Union operation failed: ${error}`);
    }
  }

  /**
   * Difference operation
   */
  async difference(features1: Feature[], features2: Feature[]): Promise<Feature[]> {
    try {
      const gdf1 = this.featuresToGeoDataFrame(features1);
      const gdf2 = this.featuresToGeoDataFrame(features2);

      const result = geopandas.overlay(gdf1, gdf2, how='difference');
      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Difference operation failed: ${error}`);
    }
  }

  /**
   * Symmetric difference operation
   */
  async symmetricDifference(features1: Feature[], features2: Feature[]): Promise<Feature[]> {
    try {
      const gdf1 = this.featuresToGeoDataFrame(features1);
      const gdf2 = this.featuresToGeoDataFrame(features2);

      const result = geopandas.overlay(gdf1, gdf2, how='symmetric_difference');
      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Symmetric difference operation failed: ${error}`);
    }
  }

  /**
   * Spatial overlay with custom operation
   */
  async overlay(
    features1: Feature[],
    features2: Feature[],
    options: OverlayOptions
  ): Promise<Feature[]> {
    try {
      const gdf1 = this.featuresToGeoDataFrame(features1);
      const gdf2 = this.featuresToGeoDataFrame(features2);

      const operation = this.getOverlayOperation(options.operation);
      const result = geopandas.overlay(gdf1, gdf2, how=operation, keep_geom_type=true);

      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Overlay operation failed: ${error}`);
    }
  }

  /**
   * Spatial join between two feature sets
   */
  async spatialJoin(
    left: Feature[],
    right: Feature[],
    options?: SpatialJoinOptions
  ): Promise<Feature[]> {
    try {
      const leftGdf = this.featuresToGeoDataFrame(left);
      const rightGdf = this.featuresToGeoDataFrame(right);

      const predicate = options?.predicate || SpatialPredicate.Intersects;
      const how = options?.how || 'inner';
      const lsuffix = options?.lsuffix || 'left';
      const rsuffix = options?.rsuffix || 'right';

      const result = geopandas.sjoin(
        leftGdf,
        rightGdf,
        how,
        predicate.toLowerCase(),
        lsuffix,
        rsuffix
      );

      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Spatial join failed: ${error}`);
    }
  }

  /**
   * Filter features by spatial predicate
   */
  async filterBySpatialPredicate(
    features: Feature[],
    reference: Geometry,
    predicate: SpatialPredicate
  ): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const refGeom = this.geoJSONToShapely(reference);

      const predicateFunc = this.getSpatialPredicate(predicate);
      const mask = gdf.geometry.apply((geom: any) => predicateFunc(geom, refGeom));

      const filtered = gdf[mask];
      return this.convertToFeatures(filtered);
    } catch (error) {
      throw new GeometryError(`Spatial filter failed: ${error}`);
    }
  }

  /**
   * Simplify geometries using Douglas-Peucker algorithm
   */
  async simplify(features: Feature[], options: SimplificationOptions): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const simplified = gdf.geometry.simplify(
        options.tolerance,
        preserve_topology=options.preserveTopology !== false
      );

      const result = gdf.copy();
      result['geometry'] = simplified;
      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Simplification failed: ${error}`);
    }
  }

  /**
   * Calculate centroids
   */
  async centroids(features: Feature[]): Promise<Feature<Point>[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const centroids = gdf.geometry.centroid;

      const result = gdf.copy();
      result['geometry'] = centroids;
      return this.convertToFeatures(result) as Feature<Point>[];
    } catch (error) {
      throw new GeometryError(`Centroid calculation failed: ${error}`);
    }
  }

  /**
   * Calculate representative points
   */
  async representativePoints(features: Feature[]): Promise<Feature<Point>[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const points = gdf.geometry.representative_point();

      const result = gdf.copy();
      result['geometry'] = points;
      return this.convertToFeatures(result) as Feature<Point>[];
    } catch (error) {
      throw new GeometryError(`Representative point calculation failed: ${error}`);
    }
  }

  /**
   * Calculate convex hull
   */
  async convexHull(features: Feature[]): Promise<Feature<Polygon>[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const hulls = gdf.geometry.convex_hull;

      const result = gdf.copy();
      result['geometry'] = hulls;
      return this.convertToFeatures(result) as Feature<Polygon>[];
    } catch (error) {
      throw new GeometryError(`Convex hull calculation failed: ${error}`);
    }
  }

  /**
   * Calculate envelope (bounding box)
   */
  async envelope(features: Feature[]): Promise<Feature<Polygon>[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const envelopes = gdf.geometry.envelope;

      const result = gdf.copy();
      result['geometry'] = envelopes;
      return this.convertToFeatures(result) as Feature<Polygon>[];
    } catch (error) {
      throw new GeometryError(`Envelope calculation failed: ${error}`);
    }
  }

  /**
   * Get boundary of geometries
   */
  async boundary(features: Feature[]): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const boundaries = gdf.geometry.boundary;

      const result = gdf.copy();
      result['geometry'] = boundaries;
      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Boundary extraction failed: ${error}`);
    }
  }

  /**
   * Validate geometries
   */
  async validate(features: Feature[]): Promise<{ valid: boolean; errors: string[] }[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const results: { valid: boolean; errors: string[] }[] = [];

      for (let i = 0; i < gdf.length; i++) {
        const geom = gdf.geometry.iloc[i];
        const isValid = geom.is_valid;
        const errors: string[] = [];

        if (!isValid) {
          const reason = shapely.validation.explain_validity(geom);
          errors.push(reason);
        }

        results.push({ valid: isValid, errors });
      }

      return results;
    } catch (error) {
      throw new GeometryError(`Validation failed: ${error}`);
    }
  }

  /**
   * Fix invalid geometries
   */
  async makeValid(features: Feature[]): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const fixed = gdf.geometry.make_valid();

      const result = gdf.copy();
      result['geometry'] = fixed;
      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Make valid operation failed: ${error}`);
    }
  }

  /**
   * Calculate area of geometries
   */
  async calculateAreas(features: Feature[]): Promise<number[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const areas = gdf.geometry.area;
      return Array.from(areas);
    } catch (error) {
      throw new GeometryError(`Area calculation failed: ${error}`);
    }
  }

  /**
   * Calculate length of geometries
   */
  async calculateLengths(features: Feature[]): Promise<number[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const lengths = gdf.geometry.length;
      return Array.from(lengths);
    } catch (error) {
      throw new GeometryError(`Length calculation failed: ${error}`);
    }
  }

  /**
   * Calculate distances between features and a reference point
   */
  async calculateDistances(features: Feature[], reference: Point): Promise<number[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const refGeom = this.geoJSONToShapely(reference);
      const distances = gdf.geometry.distance(refGeom);
      return Array.from(distances);
    } catch (error) {
      throw new GeometryError(`Distance calculation failed: ${error}`);
    }
  }

  /**
   * Create spatial index for fast queries
   */
  async createSpatialIndex(features: Feature[], config?: SpatialIndexConfig): Promise<SpatialIndex> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      this.spatialIndex = gdf.sindex;

      return {
        insert: (id: string | number, bbox: BBox) => {
          // R-tree insertion
          this.spatialIndex.insert(id, bbox);
        },
        remove: (id: string | number, bbox: BBox) => {
          // R-tree removal
          this.spatialIndex.delete(id, bbox);
        },
        search: (bbox: BBox) => {
          // R-tree search
          const results = this.spatialIndex.intersection(bbox);
          return Array.from(results);
        },
        clear: () => {
          this.spatialIndex = null;
        },
      };
    } catch (error) {
      throw new GeometryError(`Spatial index creation failed: ${error}`);
    }
  }

  /**
   * Query features within bounding box
   */
  async queryBounds(features: Feature[], bbox: BBox): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const [minx, miny, maxx, maxy] = bbox;

      if (!this.spatialIndex) {
        this.spatialIndex = gdf.sindex;
      }

      const possibleMatches = this.spatialIndex.intersection(bbox);
      const filtered = gdf.iloc[Array.from(possibleMatches)];

      return this.convertToFeatures(filtered);
    } catch (error) {
      throw new GeometryError(`Bounds query failed: ${error}`);
    }
  }

  /**
   * Query features within radius of a point
   */
  async queryRadius(features: Feature[], center: Point, radius: number): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const centerGeom = this.geoJSONToShapely(center);

      // Create buffer around center point
      const buffer = centerGeom.buffer(radius);

      // Use spatial index for initial filtering
      const bounds = Array.from(buffer.bounds);
      const possibleMatches = gdf.sindex.intersection(bounds);

      // Precise filtering with buffer intersection
      const candidates = gdf.iloc[Array.from(possibleMatches)];
      const mask = candidates.geometry.intersects(buffer);
      const result = candidates[mask];

      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Radius query failed: ${error}`);
    }
  }

  /**
   * Query features that intersect with a geometry
   */
  async queryGeometry(features: Feature[], geometry: Geometry): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const queryGeom = this.geoJSONToShapely(geometry);

      const bounds = Array.from(queryGeom.bounds);
      const possibleMatches = gdf.sindex.intersection(bounds);

      const candidates = gdf.iloc[Array.from(possibleMatches)];
      const mask = candidates.geometry.intersects(queryGeom);
      const result = candidates[mask];

      return this.convertToFeatures(result);
    } catch (error) {
      throw new GeometryError(`Geometry query failed: ${error}`);
    }
  }

  /**
   * Reproject features to different CRS
   */
  async reproject(features: Feature[], targetCRS: string): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const reprojected = gdf.to_crs(targetCRS);
      return this.convertToFeatures(reprojected);
    } catch (error) {
      throw new GeometryError(`Reprojection failed: ${error}`);
    }
  }

  /**
   * Clip features by boundary
   */
  async clip(features: Feature[], boundary: Polygon | MultiPolygon): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const boundaryGdf = this.featuresToGeoDataFrame([
        { type: 'Feature', geometry: boundary, properties: {} },
      ]);

      const clipped = geopandas.clip(gdf, boundaryGdf);
      return this.convertToFeatures(clipped);
    } catch (error) {
      throw new GeometryError(`Clip operation failed: ${error}`);
    }
  }

  /**
   * Dissolve features by attribute
   */
  async dissolve(features: Feature[], attribute: string): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const dissolved = gdf.dissolve(by=attribute);
      return this.convertToFeatures(dissolved);
    } catch (error) {
      throw new GeometryError(`Dissolve operation failed: ${error}`);
    }
  }

  /**
   * Explode multi-part geometries to single-part
   */
  async explode(features: Feature[]): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const exploded = gdf.explode(index_parts=false);
      return this.convertToFeatures(exploded);
    } catch (error) {
      throw new GeometryError(`Explode operation failed: ${error}`);
    }
  }

  /**
   * Filter features by attribute
   */
  async filter(features: Feature[], predicate: (feature: Feature) => boolean): Promise<Feature[]> {
    return features.filter(predicate);
  }

  /**
   * Sort features by attribute
   */
  async sort(features: Feature[], attribute: string, ascending: boolean = true): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const sorted = gdf.sort_values(by=attribute, ascending=ascending);
      return this.convertToFeatures(sorted);
    } catch (error) {
      throw new GeometryError(`Sort operation failed: ${error}`);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Convert GeoDataFrame to Feature array
   */
  private convertToFeatures(gdf: any): Feature[] {
    const features: Feature[] = [];

    for (let i = 0; i < gdf.length; i++) {
      const row = gdf.iloc[i];
      const geometry = this.shapelyToGeoJSON(row.geometry);
      const properties: Record<string, any> = {};

      // Extract properties (excluding geometry)
      for (const col of gdf.columns) {
        if (col !== 'geometry') {
          properties[col] = row[col];
        }
      }

      features.push({
        type: 'Feature',
        geometry,
        properties,
      });
    }

    return features;
  }

  /**
   * Convert Feature array to GeoDataFrame
   */
  private featuresToGeoDataFrame(features: Feature[]): any {
    const geometries = features.map((f) => this.geoJSONToShapely(f.geometry));
    const properties = features.map((f) => f.properties);

    const gdf = geopandas.GeoDataFrame(properties, geometry=geometries);
    return gdf;
  }

  /**
   * Convert Shapely geometry to GeoJSON
   */
  private shapelyToGeoJSON(geometry: any): Geometry {
    const geojson = shapely.geometry.mapping(geometry);
    return geojson;
  }

  /**
   * Convert GeoJSON geometry to Shapely
   */
  private geoJSONToShapely(geometry: Geometry): any {
    return shapely.geometry.shape(geometry);
  }

  /**
   * Get cap style code for buffer
   */
  private getCapStyleCode(style?: string): number {
    switch (style) {
      case 'round':
        return 1;
      case 'flat':
        return 2;
      case 'square':
        return 3;
      default:
        return 1; // round
    }
  }

  /**
   * Get join style code for buffer
   */
  private getJoinStyleCode(style?: string): number {
    switch (style) {
      case 'round':
        return 1;
      case 'mitre':
        return 2;
      case 'bevel':
        return 3;
      default:
        return 1; // round
    }
  }

  /**
   * Get overlay operation string
   */
  private getOverlayOperation(operation: SpatialOperation): string {
    switch (operation) {
      case SpatialOperation.Intersection:
        return 'intersection';
      case SpatialOperation.Union:
        return 'union';
      case SpatialOperation.Difference:
        return 'difference';
      case SpatialOperation.SymDifference:
        return 'symmetric_difference';
      default:
        return 'intersection';
    }
  }

  /**
   * Get spatial predicate function
   */
  private getSpatialPredicate(predicate: SpatialPredicate): (geom1: any, geom2: any) => boolean {
    switch (predicate) {
      case SpatialPredicate.Intersects:
        return (g1, g2) => g1.intersects(g2);
      case SpatialPredicate.Contains:
        return (g1, g2) => g1.contains(g2);
      case SpatialPredicate.Within:
        return (g1, g2) => g1.within(g2);
      case SpatialPredicate.Touches:
        return (g1, g2) => g1.touches(g2);
      case SpatialPredicate.Crosses:
        return (g1, g2) => g1.crosses(g2);
      case SpatialPredicate.Overlaps:
        return (g1, g2) => g1.overlaps(g2);
      case SpatialPredicate.Disjoint:
        return (g1, g2) => g1.disjoint(g2);
      case SpatialPredicate.Equals:
        return (g1, g2) => g1.equals(g2);
      default:
        return (g1, g2) => g1.intersects(g2);
    }
  }

  /**
   * Get total bounds of features
   */
  async getBounds(features: Feature[]): Promise<BBox> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const bounds = gdf.total_bounds;
      return Array.from(bounds) as BBox;
    } catch (error) {
      throw new GeometryError(`Get bounds failed: ${error}`);
    }
  }

  /**
   * Get CRS of features
   */
  async getCRS(features: Feature[]): Promise<string> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      return gdf.crs.to_string();
    } catch (error) {
      return 'EPSG:4326'; // Default to WGS84
    }
  }

  /**
   * Set CRS of features
   */
  async setCRS(features: Feature[], crs: string): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      gdf.crs = crs;
      return this.convertToFeatures(gdf);
    } catch (error) {
      throw new GeometryError(`Set CRS failed: ${error}`);
    }
  }

  /**
   * Get feature count
   */
  getCount(features: Feature[]): number {
    return features.length;
  }

  /**
   * Get geometry types distribution
   */
  getGeometryTypes(features: Feature[]): Record<string, number> {
    const types: Record<string, number> = {};

    for (const feature of features) {
      const type = feature.geometry.type;
      types[type] = (types[type] || 0) + 1;
    }

    return types;
  }

  /**
   * Sample random features
   */
  async sample(features: Feature[], count: number, withReplacement: boolean = false): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const sampled = gdf.sample(n=count, replace=withReplacement);
      return this.convertToFeatures(sampled);
    } catch (error) {
      throw new GeometryError(`Sample operation failed: ${error}`);
    }
  }

  /**
   * Get unique values for attribute
   */
  async unique(features: Feature[], attribute: string): Promise<any[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const unique = gdf[attribute].unique();
      return Array.from(unique);
    } catch (error) {
      throw new GeometryError(`Unique operation failed: ${error}`);
    }
  }

  /**
   * Aggregate features by attribute
   */
  async aggregate(
    features: Feature[],
    groupBy: string,
    aggregations: Record<string, string>
  ): Promise<Feature[]> {
    try {
      const gdf = this.featuresToGeoDataFrame(features);
      const grouped = gdf.groupby(groupBy).agg(aggregations);
      return this.convertToFeatures(grouped);
    } catch (error) {
      throw new GeometryError(`Aggregate operation failed: ${error}`);
    }
  }
}

export default FeatureProcessor;
