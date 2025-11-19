/**
 * Raster Processor
 *
 * High-performance raster data processing using python:rasterio
 * for GeoTIFF operations, resampling, and reprojection.
 */

// @ts-ignore
import rasterio from 'python:rasterio';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import {
  Raster,
  RasterMetadata,
  RasterBand,
  RasterStatistics,
  RasterDataType,
  ResamplingMethod,
  ResampleOptions,
  ReprojectOptions,
  GeoTransform,
  BBox,
  GeometryError,
} from '../types';

/**
 * RasterProcessor class for raster data operations
 */
export class RasterProcessor {
  private dataset: any = null;

  constructor() {}

  /**
   * Load raster from file
   */
  async loadRaster(path: string): Promise<Raster> {
    try {
      this.dataset = rasterio.open(path);

      const metadata = this.extractMetadata(this.dataset);
      const bands = this.extractBands(this.dataset);

      return {
        metadata,
        bands,
        path,
      };
    } catch (error) {
      throw new GeometryError(`Failed to load raster: ${error}`);
    }
  }

  /**
   * Save raster to file
   */
  async saveRaster(raster: Raster, path: string, driver: string = 'GTiff'): Promise<void> {
    try {
      const { metadata, bands } = raster;

      const profile = {
        driver,
        height: metadata.height,
        width: metadata.width,
        count: metadata.bands,
        dtype: this.getRasterioDataType(metadata.dataType),
        crs: metadata.crs,
        transform: rasterio.Affine.from_gdal(...metadata.transform),
        nodata: metadata.noDataValue,
        compress: metadata.compression || 'deflate',
      };

      const dst = rasterio.open(path, 'w', **profile);

      for (let i = 0; i < bands.length; i++) {
        const band = bands[i];
        if (raster.data) {
          const bandData = this.extractBandData(raster.data, i, metadata);
          dst.write(bandData, band.index);
        }
      }

      dst.close();
    } catch (error) {
      throw new GeometryError(`Failed to save raster: ${error}`);
    }
  }

  /**
   * Read raster data
   */
  async readData(raster: Raster, bandIndex?: number): Promise<Float32Array> {
    try {
      if (raster.path) {
        const dataset = rasterio.open(raster.path);
        if (bandIndex !== undefined) {
          const data = dataset.read(bandIndex);
          return new Float32Array(Array.from(data.flatten()));
        } else {
          const data = dataset.read();
          return new Float32Array(Array.from(data.flatten()));
        }
      } else if (raster.data) {
        return new Float32Array(raster.data);
      } else {
        throw new Error('No raster data available');
      }
    } catch (error) {
      throw new GeometryError(`Failed to read raster data: ${error}`);
    }
  }

  /**
   * Resample raster to new resolution
   */
  async resample(raster: Raster, options: ResampleOptions): Promise<Raster> {
    try {
      const dataset = this.dataset || rasterio.open(raster.path!);

      const method = this.getResamplingMethod(options.method || ResamplingMethod.Bilinear);

      let newWidth: number;
      let newHeight: number;

      if (options.resolution) {
        const [xRes, yRes] = options.resolution;
        const bounds = raster.metadata.bounds;
        newWidth = Math.ceil((bounds[2] - bounds[0]) / xRes);
        newHeight = Math.ceil((bounds[3] - bounds[1]) / yRes);
      } else if (options.width && options.height) {
        newWidth = options.width;
        newHeight = options.height;
      } else {
        throw new Error('Must specify resolution or width/height');
      }

      // Calculate new transform
      const oldTransform = rasterio.Affine.from_gdal(...raster.metadata.transform);
      const scaleX = raster.metadata.width / newWidth;
      const scaleY = raster.metadata.height / newHeight;
      const newTransform = oldTransform * rasterio.Affine.scale(scaleX, scaleY);

      // Read and resample data
      const resampled = numpy.empty([raster.metadata.bands, newHeight, newWidth], dtype='float32');

      for (let i = 1; i <= raster.metadata.bands; i++) {
        const data = dataset.read(
          i,
          out_shape=(newHeight, newWidth),
          resampling=method
        );
        resampled[i - 1] = data;
      }

      const newMetadata: RasterMetadata = {
        ...raster.metadata,
        width: newWidth,
        height: newHeight,
        resolution: options.resolution || [
          (raster.metadata.bounds[2] - raster.metadata.bounds[0]) / newWidth,
          (raster.metadata.bounds[3] - raster.metadata.bounds[1]) / newHeight,
        ],
        transform: Array.from(newTransform.to_gdal()) as GeoTransform,
      };

      return {
        metadata: newMetadata,
        bands: raster.bands,
        data: new Float32Array(Array.from(resampled.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Resample operation failed: ${error}`);
    }
  }

  /**
   * Reproject raster to different CRS
   */
  async reproject(raster: Raster, options: ReprojectOptions): Promise<Raster> {
    try {
      const dataset = this.dataset || rasterio.open(raster.path!);
      const method = this.getResamplingMethod(options.method || ResamplingMethod.Bilinear);

      // Calculate destination transform and dimensions
      const transform, width, height = rasterio.warp.calculate_default_transform(
        dataset.crs,
        options.targetCRS,
        dataset.width,
        dataset.height,
        *dataset.bounds
      );

      // Create output array
      const reprojected = numpy.empty([raster.metadata.bands, height, width], dtype='float32');

      for (let i = 1; i <= raster.metadata.bands; i++) {
        const source = dataset.read(i);

        rasterio.warp.reproject(
          source=source,
          destination=reprojected[i - 1],
          src_transform=dataset.transform,
          src_crs=dataset.crs,
          dst_transform=transform,
          dst_crs=options.targetCRS,
          resampling=method
        );
      }

      const newBounds = rasterio.warp.transform_bounds(
        dataset.crs,
        options.targetCRS,
        *dataset.bounds
      );

      const newMetadata: RasterMetadata = {
        ...raster.metadata,
        width,
        height,
        crs: options.targetCRS,
        transform: Array.from(transform.to_gdal()) as GeoTransform,
        bounds: Array.from(newBounds) as BBox,
        resolution: [
          (newBounds[2] - newBounds[0]) / width,
          (newBounds[3] - newBounds[1]) / height,
        ],
      };

      return {
        metadata: newMetadata,
        bands: raster.bands,
        data: new Float32Array(Array.from(reprojected.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Reproject operation failed: ${error}`);
    }
  }

  /**
   * Calculate raster statistics
   */
  async calculateStatistics(raster: Raster, bandIndex?: number): Promise<RasterStatistics> {
    try {
      const data = await this.readData(raster, bandIndex);
      const array = numpy.array(Array.from(data));

      // Filter out nodata values
      let filtered = array;
      if (raster.metadata.noDataValue !== undefined) {
        const mask = array != raster.metadata.noDataValue;
        filtered = array[mask];
      }

      const stats: RasterStatistics = {
        min: numpy.min(filtered),
        max: numpy.max(filtered),
        mean: numpy.mean(filtered),
        stddev: numpy.std(filtered),
        median: numpy.median(filtered),
        count: filtered.size,
        sum: numpy.sum(filtered),
      };

      // Calculate percentiles
      stats.percentiles = {
        5: numpy.percentile(filtered, 5),
        25: numpy.percentile(filtered, 25),
        50: numpy.percentile(filtered, 50),
        75: numpy.percentile(filtered, 75),
        95: numpy.percentile(filtered, 95),
      };

      return stats;
    } catch (error) {
      throw new GeometryError(`Statistics calculation failed: ${error}`);
    }
  }

  /**
   * Reclassify raster values
   */
  async reclassify(
    raster: Raster,
    ranges: Array<{ min: number; max: number; value: number; label?: string }>
  ): Promise<Raster> {
    try {
      const data = await this.readData(raster);
      const array = numpy.array(Array.from(data));
      const result = numpy.zeros_like(array);

      for (const range of ranges) {
        const mask = (array >= range.min) & (array < range.max);
        result[mask] = range.value;
      }

      return {
        metadata: { ...raster.metadata, dataType: RasterDataType.Int16 },
        bands: raster.bands,
        data: new Float32Array(Array.from(result.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Reclassify operation failed: ${error}`);
    }
  }

  /**
   * Clip raster by bounding box
   */
  async clip(raster: Raster, bbox: BBox): Promise<Raster> {
    try {
      const dataset = this.dataset || rasterio.open(raster.path!);

      const window = rasterio.windows.from_bounds(
        *bbox,
        dataset.transform
      );

      const clipped = dataset.read(window=window);
      const newTransform = dataset.window_transform(window);

      const newMetadata: RasterMetadata = {
        ...raster.metadata,
        width: window.width,
        height: window.height,
        transform: Array.from(newTransform.to_gdal()) as GeoTransform,
        bounds: bbox,
      };

      return {
        metadata: newMetadata,
        bands: raster.bands,
        data: new Float32Array(Array.from(clipped.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Clip operation failed: ${error}`);
    }
  }

  /**
   * Create tiles from raster
   */
  async createTiles(
    raster: Raster,
    options: { tileSize: number; overlap?: number }
  ): Promise<Raster[]> {
    try {
      const dataset = this.dataset || rasterio.open(raster.path!);
      const tileSize = options.tileSize;
      const overlap = options.overlap || 0;

      const tiles: Raster[] = [];
      const stride = tileSize - overlap;

      for (let row = 0; row < raster.metadata.height; row += stride) {
        for (let col = 0; col < raster.metadata.width; col += stride) {
          const window = rasterio.windows.Window(
            col,
            row,
            Math.min(tileSize, raster.metadata.width - col),
            Math.min(tileSize, raster.metadata.height - row)
          );

          const tileData = dataset.read(window=window);
          const tileTransform = dataset.window_transform(window);

          const tileBounds = rasterio.windows.bounds(window, dataset.transform);

          const tileMetadata: RasterMetadata = {
            ...raster.metadata,
            width: window.width,
            height: window.height,
            transform: Array.from(tileTransform.to_gdal()) as GeoTransform,
            bounds: Array.from(tileBounds) as BBox,
          };

          tiles.push({
            metadata: tileMetadata,
            bands: raster.bands,
            data: new Float32Array(Array.from(tileData.flatten())),
          });
        }
      }

      return tiles;
    } catch (error) {
      throw new GeometryError(`Tile creation failed: ${error}`);
    }
  }

  /**
   * Mosaic multiple rasters
   */
  async mosaic(rasters: Raster[]): Promise<Raster> {
    try {
      const datasets = rasters.map((r) => rasterio.open(r.path!));

      const mosaic, transform = rasterio.merge.merge(datasets);

      // Calculate bounds
      const allBounds = rasters.map((r) => r.metadata.bounds);
      const minX = Math.min(...allBounds.map((b) => b[0]));
      const minY = Math.min(...allBounds.map((b) => b[1]));
      const maxX = Math.max(...allBounds.map((b) => b[2]));
      const maxY = Math.max(...allBounds.map((b) => b[3]));

      const newMetadata: RasterMetadata = {
        ...rasters[0].metadata,
        width: mosaic.shape[2],
        height: mosaic.shape[1],
        bounds: [minX, minY, maxX, maxY],
        transform: Array.from(transform.to_gdal()) as GeoTransform,
      };

      return {
        metadata: newMetadata,
        bands: rasters[0].bands,
        data: new Float32Array(Array.from(mosaic.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Mosaic operation failed: ${error}`);
    }
  }

  /**
   * Calculate NDVI (Normalized Difference Vegetation Index)
   */
  async calculateNDVI(
    raster: Raster,
    options: { redBand: number; nirBand: number }
  ): Promise<Raster> {
    try {
      const dataset = this.dataset || rasterio.open(raster.path!);

      const red = dataset.read(options.redBand).astype('float32');
      const nir = dataset.read(options.nirBand).astype('float32');

      // NDVI = (NIR - Red) / (NIR + Red)
      const ndvi = (nir - red) / (nir + red);

      // Handle division by zero
      ndvi[numpy.isnan(ndvi)] = 0;
      ndvi[numpy.isinf(ndvi)] = 0;

      const newMetadata: RasterMetadata = {
        ...raster.metadata,
        bands: 1,
        dataType: RasterDataType.Float32,
      };

      return {
        metadata: newMetadata,
        bands: [
          {
            index: 1,
            dataType: RasterDataType.Float32,
            description: 'NDVI',
          },
        ],
        data: new Float32Array(Array.from(ndvi.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`NDVI calculation failed: ${error}`);
    }
  }

  /**
   * Apply focal/neighborhood operation
   */
  async focalStatistics(
    raster: Raster,
    operation: 'mean' | 'median' | 'min' | 'max' | 'stddev',
    kernelSize: number = 3
  ): Promise<Raster> {
    try {
      const data = await this.readData(raster);
      const array = numpy.array(Array.from(data)).reshape(
        raster.metadata.height,
        raster.metadata.width
      );

      let result: any;

      switch (operation) {
        case 'mean':
          result = scipy.ndimage.uniform_filter(array, size=kernelSize);
          break;
        case 'median':
          result = scipy.ndimage.median_filter(array, size=kernelSize);
          break;
        case 'min':
          result = scipy.ndimage.minimum_filter(array, size=kernelSize);
          break;
        case 'max':
          result = scipy.ndimage.maximum_filter(array, size=kernelSize);
          break;
        case 'stddev':
          result = scipy.ndimage.generic_filter(array, numpy.std, size=kernelSize);
          break;
        default:
          result = scipy.ndimage.uniform_filter(array, size=kernelSize);
      }

      return {
        metadata: raster.metadata,
        bands: raster.bands,
        data: new Float32Array(Array.from(result.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Focal statistics failed: ${error}`);
    }
  }

  /**
   * Raster algebra (map calculator)
   */
  async rasterAlgebra(
    rasters: Record<string, Raster>,
    expression: string
  ): Promise<Raster> {
    try {
      // Load all raster data
      const arrays: Record<string, any> = {};
      for (const [name, raster] of Object.entries(rasters)) {
        const data = await this.readData(raster);
        arrays[name] = numpy.array(Array.from(data)).reshape(
          raster.metadata.height,
          raster.metadata.width
        );
      }

      // Evaluate expression
      const result = eval(`numpy.${expression.replace(/([A-Z])/g, 'arrays.$1')}`);

      const refRaster = Object.values(rasters)[0];

      return {
        metadata: refRaster.metadata,
        bands: refRaster.bands,
        data: new Float32Array(Array.from(result.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Raster algebra failed: ${error}`);
    }
  }

  /**
   * Extract values at points
   */
  async extractValuesAtPoints(
    raster: Raster,
    points: Array<[number, number]>
  ): Promise<number[]> {
    try {
      const dataset = this.dataset || rasterio.open(raster.path!);
      const values: number[] = [];

      for (const [x, y] of points) {
        const row, col = rasterio.transform.rowcol(dataset.transform, x, y);
        const value = dataset.read(1)[row, col];
        values.push(value);
      }

      return values;
    } catch (error) {
      throw new GeometryError(`Value extraction failed: ${error}`);
    }
  }

  /**
   * Interpolate nodata values
   */
  async fillNoData(raster: Raster, maxDistance: number = 100): Promise<Raster> {
    try {
      const data = await this.readData(raster);
      const array = numpy.array(Array.from(data)).reshape(
        raster.metadata.height,
        raster.metadata.width
      );

      // Create mask of valid data
      const mask = array != raster.metadata.noDataValue;

      // Use scipy interpolation to fill gaps
      const filled = scipy.ndimage.distance_transform_edt(
        ~mask,
        return_distances=false,
        return_indices=true
      );

      const result = array.copy();
      const indices = numpy.where(~mask & (filled <= maxDistance));
      result[indices] = array[filled[indices]];

      return {
        metadata: raster.metadata,
        bands: raster.bands,
        data: new Float32Array(Array.from(result.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Fill nodata failed: ${error}`);
    }
  }

  /**
   * Create overview (pyramid) levels
   */
  async buildOverviews(
    raster: Raster,
    levels: number[] = [2, 4, 8, 16]
  ): Promise<void> {
    try {
      const dataset = this.dataset || rasterio.open(raster.path!, 'r+');
      const method = rasterio.enums.Resampling.average;

      dataset.build_overviews(levels, method);
    } catch (error) {
      throw new GeometryError(`Build overviews failed: ${error}`);
    }
  }

  /**
   * Apply color map to single-band raster
   */
  async applyColorMap(
    raster: Raster,
    colorMap: Record<number, [number, number, number, number]>
  ): Promise<Raster> {
    try {
      const data = await this.readData(raster);
      const array = numpy.array(Array.from(data));

      const rgba = numpy.zeros([4, raster.metadata.height, raster.metadata.width], dtype='uint8');

      for (const [value, color] of Object.entries(colorMap)) {
        const mask = array == Number(value);
        rgba[0][mask] = color[0]; // R
        rgba[1][mask] = color[1]; // G
        rgba[2][mask] = color[2]; // B
        rgba[3][mask] = color[3]; // A
      }

      const newMetadata: RasterMetadata = {
        ...raster.metadata,
        bands: 4,
        dataType: RasterDataType.UInt8,
      };

      return {
        metadata: newMetadata,
        bands: [
          { index: 1, dataType: RasterDataType.UInt8, description: 'Red' },
          { index: 2, dataType: RasterDataType.UInt8, description: 'Green' },
          { index: 3, dataType: RasterDataType.UInt8, description: 'Blue' },
          { index: 4, dataType: RasterDataType.UInt8, description: 'Alpha' },
        ],
        data: new Float32Array(Array.from(rgba.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Apply color map failed: ${error}`);
    }
  }

  /**
   * Convolve raster with kernel
   */
  async convolve(raster: Raster, kernel: number[][]): Promise<Raster> {
    try {
      const data = await this.readData(raster);
      const array = numpy.array(Array.from(data)).reshape(
        raster.metadata.height,
        raster.metadata.width
      );

      const kernelArray = numpy.array(kernel);
      const convolved = scipy.ndimage.convolve(array, kernelArray);

      return {
        metadata: raster.metadata,
        bands: raster.bands,
        data: new Float32Array(Array.from(convolved.flatten())),
      };
    } catch (error) {
      throw new GeometryError(`Convolution failed: ${error}`);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Extract metadata from rasterio dataset
   */
  private extractMetadata(dataset: any): RasterMetadata {
    const bounds = Array.from(dataset.bounds) as BBox;
    const transform = Array.from(dataset.transform.to_gdal()) as GeoTransform;

    return {
      width: dataset.width,
      height: dataset.height,
      bands: dataset.count,
      dataType: this.getDataType(dataset.dtypes[0]),
      crs: dataset.crs.to_string(),
      transform,
      bounds,
      resolution: [dataset.res[0], dataset.res[1]],
      noDataValue: dataset.nodata,
      compression: dataset.compression?.value,
    };
  }

  /**
   * Extract band information
   */
  private extractBands(dataset: any): RasterBand[] {
    const bands: RasterBand[] = [];

    for (let i = 1; i <= dataset.count; i++) {
      bands.push({
        index: i,
        dataType: this.getDataType(dataset.dtypes[i - 1]),
        noDataValue: dataset.nodatavals[i - 1],
        colorInterpretation: dataset.colorinterp[i - 1]?.name,
      });
    }

    return bands;
  }

  /**
   * Convert rasterio dtype to RasterDataType
   */
  private getDataType(dtype: string): RasterDataType {
    switch (dtype) {
      case 'uint8':
        return RasterDataType.UInt8;
      case 'uint16':
        return RasterDataType.UInt16;
      case 'uint32':
        return RasterDataType.UInt32;
      case 'int16':
        return RasterDataType.Int16;
      case 'int32':
        return RasterDataType.Int32;
      case 'float32':
        return RasterDataType.Float32;
      case 'float64':
        return RasterDataType.Float64;
      default:
        return RasterDataType.Float32;
    }
  }

  /**
   * Convert RasterDataType to rasterio dtype
   */
  private getRasterioDataType(dataType: RasterDataType): string {
    return dataType;
  }

  /**
   * Get rasterio resampling method
   */
  private getResamplingMethod(method: ResamplingMethod): any {
    switch (method) {
      case ResamplingMethod.Nearest:
        return rasterio.enums.Resampling.nearest;
      case ResamplingMethod.Bilinear:
        return rasterio.enums.Resampling.bilinear;
      case ResamplingMethod.Cubic:
        return rasterio.enums.Resampling.cubic;
      case ResamplingMethod.CubicSpline:
        return rasterio.enums.Resampling.cubic_spline;
      case ResamplingMethod.Lanczos:
        return rasterio.enums.Resampling.lanczos;
      case ResamplingMethod.Average:
        return rasterio.enums.Resampling.average;
      case ResamplingMethod.Mode:
        return rasterio.enums.Resampling.mode;
      default:
        return rasterio.enums.Resampling.bilinear;
    }
  }

  /**
   * Extract band data from multi-band array
   */
  private extractBandData(data: ArrayBuffer | Float32Array, bandIndex: number, metadata: RasterMetadata): any {
    const array = numpy.array(Array.from(new Float32Array(data)));
    const shaped = array.reshape(metadata.bands, metadata.height, metadata.width);
    return shaped[bandIndex];
  }

  /**
   * Close dataset
   */
  close(): void {
    if (this.dataset) {
      this.dataset.close();
      this.dataset = null;
    }
  }
}

export default RasterProcessor;
