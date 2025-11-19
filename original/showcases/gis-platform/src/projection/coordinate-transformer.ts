/**
 * Coordinate Transformer
 *
 * Coordinate reference system transformations using python:pyproj
 * for converting between different projections and datums.
 */

// @ts-ignore
import pyproj from 'python:pyproj';
// @ts-ignore
import numpy from 'python:numpy';

import {
  Position,
  EPSGCode,
  CoordinateReferenceSystem,
  ProjectionError,
} from '../types';

/**
 * CoordinateTransformer class for CRS operations
 */
export class CoordinateTransformer {
  private transformers: Map<string, any> = new Map();
  private crsCache: Map<string, any> = new Map();

  constructor() {}

  /**
   * Transform coordinates from source CRS to target CRS
   */
  async transform(
    coordinates: Position,
    sourceCRS: string,
    targetCRS: string
  ): Promise<Position> {
    try {
      const transformer = this.getTransformer(sourceCRS, targetCRS);
      const [x, y] = coordinates;
      const result = transformer.transform(x, y);

      if (coordinates.length === 3) {
        const z = coordinates[2];
        return [result[0], result[1], z];
      }

      return [result[0], result[1]];
    } catch (error) {
      throw new ProjectionError(`Transformation failed: ${error}`);
    }
  }

  /**
   * Transform batch of coordinates
   */
  async transformBatch(
    coordinates: Position[],
    options: {
      sourceCRS: string;
      targetCRS: string;
    }
  ): Promise<Position[]> {
    try {
      const transformer = this.getTransformer(options.sourceCRS, options.targetCRS);

      const x = coordinates.map((c) => c[0]);
      const y = coordinates.map((c) => c[1]);

      const xx, yy = transformer.transform(x, y);

      const results: Position[] = [];
      for (let i = 0; i < coordinates.length; i++) {
        if (coordinates[i].length === 3) {
          results.push([xx[i], yy[i], coordinates[i][2]]);
        } else {
          results.push([xx[i], yy[i]]);
        }
      }

      return results;
    } catch (error) {
      throw new ProjectionError(`Batch transformation failed: ${error}`);
    }
  }

  /**
   * Transform from WGS84 (lat/lon) to Web Mercator
   */
  async toWebMercator(latLon: [number, number]): Promise<[number, number]> {
    return this.transform(latLon, 'EPSG:4326', 'EPSG:3857') as Promise<[number, number]>;
  }

  /**
   * Transform from Web Mercator to WGS84 (lat/lon)
   */
  async fromWebMercator(xy: [number, number]): Promise<[number, number]> {
    return this.transform(xy, 'EPSG:3857', 'EPSG:4326') as Promise<[number, number]>;
  }

  /**
   * Transform to UTM zone based on longitude
   */
  async toUTM(latLon: [number, number]): Promise<{ coordinates: [number, number]; zone: number; epsg: string }> {
    try {
      const [lon, lat] = latLon;

      // Calculate UTM zone
      const zone = Math.floor((lon + 180) / 6) + 1;
      const hemisphere = lat >= 0 ? 'north' : 'south';

      // EPSG code for UTM
      const epsg = `EPSG:${hemisphere === 'north' ? 32600 + zone : 32700 + zone}`;

      const coords = await this.transform(latLon, 'EPSG:4326', epsg);

      return {
        coordinates: coords as [number, number],
        zone,
        epsg,
      };
    } catch (error) {
      throw new ProjectionError(`UTM transformation failed: ${error}`);
    }
  }

  /**
   * Auto-detect CRS from coordinates
   */
  async detectCRS(coordinates: Position[]): Promise<string> {
    // Simple heuristics for CRS detection
    const firstCoord = coordinates[0];

    // Check if values are in typical lat/lon range
    if (firstCoord[0] >= -180 && firstCoord[0] <= 180 && firstCoord[1] >= -90 && firstCoord[1] <= 90) {
      return 'EPSG:4326'; // WGS84
    }

    // Check if values are in Web Mercator range
    if (Math.abs(firstCoord[0]) <= 20037508.34 && Math.abs(firstCoord[1]) <= 20037508.34) {
      return 'EPSG:3857'; // Web Mercator
    }

    // Check if values are in typical UTM range
    if (firstCoord[0] >= 0 && firstCoord[0] <= 834000 && Math.abs(firstCoord[1]) <= 10000000) {
      // Likely UTM, but need more info for exact zone
      return 'EPSG:32633'; // Default to UTM Zone 33N
    }

    // Default to WGS84
    return 'EPSG:4326';
  }

  /**
   * Define custom CRS from Proj4 string or WKT
   */
  async defineCustomCRS(definition: {
    proj4?: string;
    wkt?: string;
    name?: string;
    authority?: string;
    code?: number;
  }): Promise<string> {
    try {
      let crs: any;

      if (definition.proj4) {
        crs = pyproj.CRS.from_proj4(definition.proj4);
      } else if (definition.wkt) {
        crs = pyproj.CRS.from_wkt(definition.wkt);
      } else {
        throw new Error('Must provide proj4 or wkt definition');
      }

      const authority = definition.authority || 'CUSTOM';
      const code = definition.code || Date.now();
      const crsKey = `${authority}:${code}`;

      this.crsCache.set(crsKey, crs);

      return crsKey;
    } catch (error) {
      throw new ProjectionError(`Custom CRS definition failed: ${error}`);
    }
  }

  /**
   * Get CRS information
   */
  async getCRSInfo(crsCode: string): Promise<{
    name: string;
    type: string;
    authority: string;
    code: string;
    proj4: string;
    wkt: string;
    areaOfUse?: {
      west: number;
      south: number;
      east: number;
      north: number;
      name: string;
    };
  }> {
    try {
      const crs = this.getCRS(crsCode);

      const info = {
        name: crs.name,
        type: crs.type_name,
        authority: crs.to_authority()[0] || 'UNKNOWN',
        code: crs.to_authority()[1] || crsCode,
        proj4: crs.to_proj4(),
        wkt: crs.to_wkt(),
      };

      // Get area of use
      if (crs.area_of_use) {
        info.areaOfUse = {
          west: crs.area_of_use.west,
          south: crs.area_of_use.south,
          east: crs.area_of_use.east,
          north: crs.area_of_use.north,
          name: crs.area_of_use.name,
        };
      }

      return info;
    } catch (error) {
      throw new ProjectionError(`Failed to get CRS info: ${error}`);
    }
  }

  /**
   * Check if transformation is needed
   */
  needsTransformation(sourceCRS: string, targetCRS: string): boolean {
    return sourceCRS !== targetCRS;
  }

  /**
   * Get transformation accuracy
   */
  async getTransformationAccuracy(sourceCRS: string, targetCRS: string): Promise<number> {
    try {
      const transformer = this.getTransformer(sourceCRS, targetCRS);

      // Get accuracy information if available
      if (transformer.accuracy) {
        return transformer.accuracy;
      }

      // Default accuracy estimate
      return 1.0; // meters
    } catch (error) {
      throw new ProjectionError(`Failed to get transformation accuracy: ${error}`);
    }
  }

  /**
   * Transform datum
   */
  async transformDatum(
    coordinates: Position,
    options: {
      sourceDatum: string;
      targetDatum: string;
      method?: 'grid' | '3param' | '7param';
    }
  ): Promise<Position> {
    try {
      // This is a simplified version
      // In practice, datum transformations can be complex
      const sourceCRS = `+proj=longlat +datum=${options.sourceDatum}`;
      const targetCRS = `+proj=longlat +datum=${options.targetDatum}`;

      return await this.transform(coordinates, sourceCRS, targetCRS);
    } catch (error) {
      throw new ProjectionError(`Datum transformation failed: ${error}`);
    }
  }

  /**
   * Calculate scale factor at point
   */
  async calculateScaleFactor(latLon: [number, number], crs: string): Promise<number> {
    try {
      const projCRS = this.getCRS(crs);

      // For UTM and similar projections
      if (projCRS.name.includes('UTM')) {
        const [lon, lat] = latLon;
        const centralMeridian = this.getUTMCentralMeridian(crs);
        const deltaLon = Math.abs(lon - centralMeridian);

        // Simplified scale factor calculation for UTM
        const k0 = 0.9996; // UTM scale factor at central meridian
        const scale = k0 * (1 + Math.pow(deltaLon * Math.PI / 180, 2) / 2);

        return scale;
      }

      return 1.0; // Default scale factor
    } catch (error) {
      throw new ProjectionError(`Scale factor calculation failed: ${error}`);
    }
  }

  /**
   * Calculate convergence angle
   */
  async calculateConvergence(latLon: [number, number], crs: string): Promise<number> {
    try {
      // Simplified convergence calculation
      // In practice, this depends on the projection type

      const [lon, lat] = latLon;

      if (crs.includes('UTM')) {
        const centralMeridian = this.getUTMCentralMeridian(crs);
        const deltaLon = lon - centralMeridian;

        // Grid convergence for UTM (simplified)
        const convergence = deltaLon * Math.sin((lat * Math.PI) / 180);

        return convergence;
      }

      return 0.0; // Default convergence
    } catch (error) {
      throw new ProjectionError(`Convergence calculation failed: ${error}`);
    }
  }

  /**
   * Get list of available CRS codes
   */
  getAvailableCRS(): string[] {
    // Common EPSG codes
    return [
      'EPSG:4326', // WGS84
      'EPSG:3857', // Web Mercator
      'EPSG:4269', // NAD83
      'EPSG:4267', // NAD27
      'EPSG:32601', // WGS 84 / UTM zone 1N
      'EPSG:32633', // WGS 84 / UTM zone 33N
      'EPSG:32660', // WGS 84 / UTM zone 60N
      'EPSG:32701', // WGS 84 / UTM zone 1S
      'EPSG:3395', // World Mercator
      'EPSG:3031', // Antarctic Polar Stereographic
      'EPSG:3413', // Arctic Polar Stereographic
    ];
  }

  /**
   * Clear transformer cache
   */
  clearCache(): void {
    this.transformers.clear();
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getTransformer(sourceCRS: string, targetCRS: string): any {
    const key = `${sourceCRS}->${targetCRS}`;

    if (this.transformers.has(key)) {
      return this.transformers.get(key);
    }

    const source = this.getCRS(sourceCRS);
    const target = this.getCRS(targetCRS);

    const transformer = pyproj.Transformer.from_crs(source, target, always_xy=true);

    this.transformers.set(key, transformer);

    return transformer;
  }

  private getCRS(crsCode: string): any {
    if (this.crsCache.has(crsCode)) {
      return this.crsCache.get(crsCode);
    }

    let crs: any;

    if (crsCode.startsWith('EPSG:')) {
      crs = pyproj.CRS.from_epsg(parseInt(crsCode.split(':')[1]));
    } else if (crsCode.startsWith('+proj=')) {
      crs = pyproj.CRS.from_proj4(crsCode);
    } else {
      crs = pyproj.CRS.from_string(crsCode);
    }

    this.crsCache.set(crsCode, crs);

    return crs;
  }

  private getUTMCentralMeridian(crs: string): number {
    // Extract zone number from CRS
    const match = crs.match(/UTM zone (\d+)/i) || crs.match(/326(\d{2})|327(\d{2})/);

    if (match) {
      const zone = parseInt(match[1] || match[2] || match[3]);
      return (zone - 1) * 6 - 180 + 3;
    }

    return 0;
  }
}

export default CoordinateTransformer;
