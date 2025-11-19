/**
 * Elevation Analyzer
 *
 * Terrain analysis using python:rasterio for DEM processing,
 * calculating slope, aspect, hillshade, and other terrain metrics.
 */

// @ts-ignore
import rasterio from 'python:rasterio';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import skimage from 'python:skimage';

import {
  Raster,
  SlopeOptions,
  AspectOptions,
  HillshadeOptions,
  ContourOptions,
  ViewshedOptions,
  SlopeUnit,
  SlopeAlgorithm,
  FlowDirectionAlgorithm,
  Point,
  LineString,
  Feature,
  GeometryError,
} from '../types';

/**
 * ElevationAnalyzer class for terrain analysis
 */
export class ElevationAnalyzer {
  constructor() {}

  /**
   * Load DEM (Digital Elevation Model)
   */
  async loadDEM(path: string): Promise<Raster> {
    try {
      const dataset = rasterio.open(path);
      const data = dataset.read(1);

      const metadata = {
        width: dataset.width,
        height: dataset.height,
        bands: dataset.count,
        dataType: 'float32' as any,
        crs: dataset.crs.to_string(),
        transform: Array.from(dataset.transform.to_gdal()) as any,
        bounds: Array.from(dataset.bounds) as any,
        resolution: [dataset.res[0], dataset.res[1]] as [number, number],
        noDataValue: dataset.nodata,
      };

      return {
        metadata,
        bands: [{ index: 1, dataType: 'float32' as any }],
        data: new Float32Array(Array.from(data.flatten())),
        path,
      };
    } catch (error) {
      throw new GeometryError(`Failed to load DEM: ${error}`);
    }
  }

  /**
   * Calculate slope
   */
  async calculateSlope(dem: Raster, options?: SlopeOptions): Promise<Raster> {
    try {
      const data = numpy.array(Array.from(dem.data!)).reshape(dem.metadata.height, dem.metadata.width);

      const [xRes, yRes] = dem.metadata.resolution;
      const zFactor = options?.zFactor || 1;

      const algorithm = options?.algorithm || SlopeAlgorithm.Horn;

      let slope: any;

      if (algorithm === SlopeAlgorithm.Horn) {
        // Horn's method (3x3 moving window)
        const kernel_x = numpy.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]);
        const kernel_y = numpy.array([[1, 2, 1], [0, 0, 0], [-1, -2, -1]]);

        const dzdx = scipy.ndimage.convolve(data, kernel_x) / (8 * xRes);
        const dzdy = scipy.ndimage.convolve(data, kernel_y) / (8 * yRes);

        slope = numpy.arctan(numpy.sqrt(dzdx ** 2 + dzdy ** 2) * zFactor);
      } else {
        // Simple finite difference
        const gy, gx = numpy.gradient(data);
        slope = numpy.arctan(numpy.sqrt((gx / xRes) ** 2 + (gy / yRes) ** 2) * zFactor);
      }

      // Convert to desired unit
      const unit = options?.unit || SlopeUnit.Degrees;
      if (unit === SlopeUnit.Degrees) {
        slope = numpy.degrees(slope);
      } else if (unit === SlopeUnit.Percent) {
        slope = numpy.tan(slope) * 100;
      }

      return {
        metadata: { ...dem.metadata, bands: 1 },
        bands: [{ index: 1, dataType: 'float32' as any, description: 'Slope' }],
        data: new Float32Array(Array.from(slope.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Slope calculation failed: ${error}`);
    }
  }

  /**
   * Calculate aspect
   */
  async calculateAspect(dem: Raster, options?: AspectOptions): Promise<Raster> {
    try {
      const data = numpy.array(Array.from(dem.data!)).reshape(dem.metadata.height, dem.metadata.width);

      const [xRes, yRes] = dem.metadata.resolution;

      const kernel_x = numpy.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]);
      const kernel_y = numpy.array([[1, 2, 1], [0, 0, 0], [-1, -2, -1]]);

      const dzdx = scipy.ndimage.convolve(data, kernel_x) / (8 * xRes);
      const dzdy = scipy.ndimage.convolve(data, kernel_y) / (8 * yRes);

      let aspect = numpy.arctan2(dzdy, -dzdx);

      // Convert to 0-360 degrees
      aspect = numpy.degrees(aspect);
      aspect = numpy.where(aspect < 0, 360 + aspect, aspect);

      // Adjust for north direction
      const northDirection = options?.northDirection || 0;
      aspect = (aspect + northDirection) % 360;

      return {
        metadata: { ...dem.metadata, bands: 1 },
        bands: [{ index: 1, dataType: 'float32' as any, description: 'Aspect' }],
        data: new Float32Array(Array.from(aspect.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Aspect calculation failed: ${error}`);
    }
  }

  /**
   * Calculate hillshade
   */
  async calculateHillshade(dem: Raster, options?: HillshadeOptions): Promise<Raster> {
    try {
      const data = numpy.array(Array.from(dem.data!)).reshape(dem.metadata.height, dem.metadata.width);

      const azimuth = options?.azimuth || 315;
      const altitude = options?.altitude || 45;
      const zFactor = options?.zFactor || 1;

      const [xRes, yRes] = dem.metadata.resolution;

      // Calculate slope and aspect
      const kernel_x = numpy.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]);
      const kernel_y = numpy.array([[1, 2, 1], [0, 0, 0], [-1, -2, -1]]);

      const dzdx = scipy.ndimage.convolve(data, kernel_x) / (8 * xRes);
      const dzdy = scipy.ndimage.convolve(data, kernel_y) / (8 * yRes);

      const slope = numpy.arctan(numpy.sqrt(dzdx ** 2 + dzdy ** 2) * zFactor);
      const aspect = numpy.arctan2(dzdy, -dzdx);

      // Convert angles to radians
      const azimuthRad = (azimuth * Math.PI) / 180;
      const altitudeRad = (altitude * Math.PI) / 180;

      // Calculate hillshade
      const hillshade = (
        numpy.sin(altitudeRad) * numpy.cos(slope) +
        numpy.cos(altitudeRad) * numpy.sin(slope) * numpy.cos(azimuthRad - aspect)
      );

      // Scale to 0-255
      const hillshadeScaled = ((hillshade + 1) / 2) * 255;

      return {
        metadata: { ...dem.metadata, bands: 1 },
        bands: [{ index: 1, dataType: 'uint8' as any, description: 'Hillshade' }],
        data: new Float32Array(Array.from(hillshadeScaled.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Hillshade calculation failed: ${error}`);
    }
  }

  /**
   * Generate contours
   */
  async generateContours(dem: Raster, options: ContourOptions): Promise<Feature<LineString>[]> {
    try {
      const data = numpy.array(Array.from(dem.data!)).reshape(dem.metadata.height, dem.metadata.width);

      const minElev = options.minElevation || numpy.min(data);
      const maxElev = options.maxElevation || numpy.max(data);
      const interval = options.interval;
      const baseElev = options.baseElevation || minElev;

      const levels = [];
      for (let elev = baseElev; elev <= maxElev; elev += interval) {
        if (elev >= minElev) {
          levels.push(elev);
        }
      }

      const contours: Feature<LineString>[] = [];

      for (const level of levels) {
        const contourLines = skimage.measure.find_contours(data, level);

        for (const contour of Array.from(contourLines)) {
          // Convert pixel coordinates to geographic coordinates
          const coords: number[][] = [];

          for (const [row, col] of Array.from(contour)) {
            const [originX, xRes, , originY, , yRes] = dem.metadata.transform;
            const x = originX + col * xRes;
            const y = originY + row * yRes;
            coords.push([x, y]);
          }

          if (options.simplify && coords.length > 2) {
            // Simplify contour line
            const simplified = this.douglasPeucker(coords, options.tolerance || 0.001);
            coords.length = 0;
            coords.push(...simplified);
          }

          contours.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
            properties: {
              elevation: level,
            },
          });
        }
      }

      return contours;
    } catch (error) {
      throw new GeometryError(`Contour generation failed: ${error}`);
    }
  }

  /**
   * Calculate viewshed
   */
  async calculateViewshed(dem: Raster, observer: Point, options?: ViewshedOptions): Promise<Raster> {
    try {
      const data = numpy.array(Array.from(dem.data!)).reshape(dem.metadata.height, dem.metadata.width);

      const observerHeight = options?.observerHeight || 2;
      const targetHeight = options?.targetHeight || 0;
      const radius = options?.radius || 10000;

      // Convert observer coordinates to raster indices
      const [observerX, observerY] = observer.coordinates;
      const [originX, xRes, , originY, , yRes] = dem.metadata.transform;

      const observerCol = Math.floor((observerX - originX) / xRes);
      const observerRow = Math.floor((observerY - originY) / yRes);

      const observerElev = data[observerRow, observerCol] + observerHeight;

      // Create viewshed raster
      const viewshed = numpy.zeros_like(data);

      const radiusInPixels = Math.floor(radius / Math.abs(xRes));

      for (let row = Math.max(0, observerRow - radiusInPixels);
           row < Math.min(data.shape[0], observerRow + radiusInPixels);
           row++) {
        for (let col = Math.max(0, observerCol - radiusInPixels);
             col < Math.min(data.shape[1], observerCol + radiusInPixels);
             col++) {

          const distance = Math.sqrt(
            Math.pow((row - observerRow) * Math.abs(yRes), 2) +
            Math.pow((col - observerCol) * Math.abs(xRes), 2)
          );

          if (distance <= radius && distance > 0) {
            const targetElev = data[row, col] + targetHeight;
            const lineOfSight = this.checkLineOfSight(
              data,
              observerRow,
              observerCol,
              observerElev,
              row,
              col,
              targetElev
            );

            viewshed[row, col] = lineOfSight ? 1 : 0;
          }
        }
      }

      return {
        metadata: { ...dem.metadata, bands: 1 },
        bands: [{ index: 1, dataType: 'uint8' as any, description: 'Viewshed' }],
        data: new Float32Array(Array.from(viewshed.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Viewshed calculation failed: ${error}`);
    }
  }

  /**
   * Calculate Terrain Ruggedness Index (TRI)
   */
  async terrainRuggednessIndex(dem: Raster): Promise<Raster> {
    try {
      const data = numpy.array(Array.from(dem.data!)).reshape(dem.metadata.height, dem.metadata.width);

      // Calculate TRI using 3x3 window
      const kernel = numpy.ones((3, 3));
      kernel[1, 1] = 0;

      const neighbors = scipy.ndimage.generic_filter(data, numpy.mean, footprint=kernel);
      const tri = numpy.abs(data - neighbors);

      return {
        metadata: { ...dem.metadata, bands: 1 },
        bands: [{ index: 1, dataType: 'float32' as any, description: 'TRI' }],
        data: new Float32Array(Array.from(tri.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`TRI calculation failed: ${error}`);
    }
  }

  /**
   * Calculate Topographic Position Index (TPI)
   */
  async topographicPositionIndex(dem: Raster, radius: number = 300): Promise<Raster> {
    try {
      const data = numpy.array(Array.from(dem.data!)).reshape(dem.metadata.height, dem.metadata.width);

      const [xRes] = dem.metadata.resolution;
      const radiusInPixels = Math.ceil(radius / Math.abs(xRes));

      // Create circular footprint
      const y, x = numpy.ogrid[-radiusInPixels : radiusInPixels + 1, -radiusInPixels : radiusInPixels + 1];
      const footprint = x ** 2 + y ** 2 <= radiusInPixels ** 2;

      // Calculate mean elevation in neighborhood
      const meanElev = scipy.ndimage.generic_filter(data, numpy.mean, footprint=footprint);

      // TPI = elevation - mean neighborhood elevation
      const tpi = data - meanElev;

      return {
        metadata: { ...dem.metadata, bands: 1 },
        bands: [{ index: 1, dataType: 'float32' as any, description: 'TPI' }],
        data: new Float32Array(Array.from(tpi.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`TPI calculation failed: ${error}`);
    }
  }

  /**
   * Calculate flow direction
   */
  async flowDirection(dem: Raster, options?: { algorithm?: FlowDirectionAlgorithm }): Promise<Raster> {
    try {
      const data = numpy.array(Array.from(dem.data!)).reshape(dem.metadata.height, dem.metadata.width);

      const algorithm = options?.algorithm || FlowDirectionAlgorithm.D8;

      let flowDir: any;

      if (algorithm === FlowDirectionAlgorithm.D8) {
        // D8 flow direction algorithm
        flowDir = this.calculateD8FlowDirection(data);
      } else {
        // Simplified - use D8
        flowDir = this.calculateD8FlowDirection(data);
      }

      return {
        metadata: { ...dem.metadata, bands: 1 },
        bands: [{ index: 1, dataType: 'uint8' as any, description: 'Flow Direction' }],
        data: new Float32Array(Array.from(flowDir.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Flow direction calculation failed: ${error}`);
    }
  }

  /**
   * Calculate flow accumulation
   */
  async flowAccumulation(flowDir: Raster): Promise<Raster> {
    try {
      const data = numpy.array(Array.from(flowDir.data!)).reshape(
        flowDir.metadata.height,
        flowDir.metadata.width
      );

      // Initialize accumulation grid
      const accumulation = numpy.ones_like(data);

      // Process cells from highest to lowest elevation
      // Simplified version
      for (let row = 0; row < data.shape[0]; row++) {
        for (let col = 0; col < data.shape[1]; col++) {
          const direction = data[row, col];

          // Map direction to row/col offsets
          const [drow, dcol] = this.getFlowOffset(direction);
          const targetRow = row + drow;
          const targetCol = col + dcol;

          if (
            targetRow >= 0 &&
            targetRow < data.shape[0] &&
            targetCol >= 0 &&
            targetCol < data.shape[1]
          ) {
            accumulation[targetRow, targetCol] += accumulation[row, col];
          }
        }
      }

      return {
        metadata: { ...flowDir.metadata, bands: 1 },
        bands: [{ index: 1, dataType: 'float32' as any, description: 'Flow Accumulation' }],
        data: new Float32Array(Array.from(accumulation.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Flow accumulation calculation failed: ${error}`);
    }
  }

  /**
   * Fill sinks in DEM
   */
  async fillSinks(dem: Raster): Promise<Raster> {
    try {
      const data = numpy.array(Array.from(dem.data!)).reshape(dem.metadata.height, dem.metadata.width);

      // Simple depression filling algorithm
      const filled = data.copy();
      const maxIterations = 1000;

      for (let iter = 0; iter < maxIterations; iter++) {
        let changed = false;

        for (let row = 1; row < data.shape[0] - 1; row++) {
          for (let col = 1; col < data.shape[1] - 1; col++) {
            const neighbors = [
              filled[row - 1, col - 1],
              filled[row - 1, col],
              filled[row - 1, col + 1],
              filled[row, col - 1],
              filled[row, col + 1],
              filled[row + 1, col - 1],
              filled[row + 1, col],
              filled[row + 1, col + 1],
            ];

            const minNeighbor = numpy.min(neighbors);

            if (filled[row, col] < minNeighbor) {
              filled[row, col] = minNeighbor;
              changed = true;
            }
          }
        }

        if (!changed) break;
      }

      return {
        metadata: dem.metadata,
        bands: dem.bands,
        data: new Float32Array(Array.from(filled.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Sink filling failed: ${error}`);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private checkLineOfSight(
    dem: any,
    observerRow: number,
    observerCol: number,
    observerElev: number,
    targetRow: number,
    targetCol: number,
    targetElev: number
  ): boolean {
    // Bresenham's line algorithm to check line of sight
    const steps = Math.max(Math.abs(targetRow - observerRow), Math.abs(targetCol - observerCol));

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const row = Math.floor(observerRow + t * (targetRow - observerRow));
      const col = Math.floor(observerCol + t * (targetCol - observerCol));
      const requiredElev = observerElev + t * (targetElev - observerElev);

      if (dem[row, col] > requiredElev) {
        return false;
      }
    }

    return true;
  }

  private douglasPeucker(points: number[][], tolerance: number): number[][] {
    if (points.length <= 2) return points;

    // Find point with maximum distance
    let maxDist = 0;
    let maxIndex = 0;

    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.perpendicularDistance(points[i], points[0], points[points.length - 1]);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }

    if (maxDist > tolerance) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
      return [...left.slice(0, -1), ...right];
    } else {
      return [points[0], points[points.length - 1]];
    }
  }

  private perpendicularDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
    const dx = lineEnd[0] - lineStart[0];
    const dy = lineEnd[1] - lineStart[1];
    const mag = Math.sqrt(dx * dx + dy * dy);

    if (mag === 0) {
      return Math.sqrt(
        Math.pow(point[0] - lineStart[0], 2) + Math.pow(point[1] - lineStart[1], 2)
      );
    }

    const u = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (mag * mag);
    const projX = lineStart[0] + u * dx;
    const projY = lineStart[1] + u * dy;

    return Math.sqrt(Math.pow(point[0] - projX, 2) + Math.pow(point[1] - projY, 2));
  }

  private calculateD8FlowDirection(data: any): any {
    const flowDir = numpy.zeros_like(data, dtype='uint8');

    // D8 directions: 1=E, 2=SE, 4=S, 8=SW, 16=W, 32=NW, 64=N, 128=NE
    const directions = [
      [0, 1, 1],
      [1, 1, 2],
      [1, 0, 4],
      [1, -1, 8],
      [0, -1, 16],
      [-1, -1, 32],
      [-1, 0, 64],
      [-1, 1, 128],
    ];

    for (let row = 1; row < data.shape[0] - 1; row++) {
      for (let col = 1; col < data.shape[1] - 1; col++) {
        const cellElev = data[row, col];
        let maxSlope = -Infinity;
        let maxDir = 0;

        for (const [drow, dcol, dir] of directions) {
          const neighborElev = data[row + drow, col + dcol];
          const slope = cellElev - neighborElev;

          if (slope > maxSlope) {
            maxSlope = slope;
            maxDir = dir;
          }
        }

        flowDir[row, col] = maxDir;
      }
    }

    return flowDir;
  }

  private getFlowOffset(direction: number): [number, number] {
    const offsets: Record<number, [number, number]> = {
      1: [0, 1],
      2: [1, 1],
      4: [1, 0],
      8: [1, -1],
      16: [0, -1],
      32: [-1, -1],
      64: [-1, 0],
      128: [-1, 1],
    };

    return offsets[direction] || [0, 0];
  }
}

export default ElevationAnalyzer;
