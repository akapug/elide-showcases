/**
 * NetCDF Data Processor
 *
 * Handles climate data I/O using Python xarray and netCDF4.
 * Demonstrates Elide polyglot for climate data analysis.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import xarray from 'python:xarray';
// @ts-ignore
import netCDF4 from 'python:netCDF4';

import type {
  NetCDFDataset,
  ClimateDataArray,
  AtmosphereState,
  OceanState,
} from '../types.js';

/**
 * NetCDF File Handler
 * Read and write climate data in NetCDF format
 */
export class NetCDFProcessor {
  /**
   * Read NetCDF file using xarray
   */
  async readNetCDF(filePath: string): Promise<NetCDFDataset> {
    // Open dataset with xarray
    const ds = await xarray.open_dataset(filePath);

    // Extract global attributes
    const globalAttributes = {
      title: await ds.attrs.title || 'Climate Dataset',
      institution: await ds.attrs.institution || '',
      source: await ds.attrs.source || '',
      history: await ds.attrs.history || '',
      references: await ds.attrs.references || '',
      comment: await ds.attrs.comment || '',
      conventions: await ds.attrs.Conventions || 'CF-1.8',
      creationDate: new Date(),
    };

    // Extract dimensions
    const dimensions: { [name: string]: number } = {};
    const dimNames = await ds.dims.keys();
    for (const dimName of dimNames) {
      dimensions[dimName] = await ds.dims.get(dimName);
    }

    // Extract variables
    const variables: { [name: string]: ClimateDataArray } = {};
    const varNames = await ds.data_vars.keys();

    for (const varName of varNames) {
      const variable = await ds.get(varName);

      variables[varName] = {
        values: await variable.values.tolist(),
        dimensions: await variable.dims.tolist(),
        shape: await variable.shape.tolist(),
        coordinates: {},
        metadata: {
          name: varName,
          longName: await variable.attrs.long_name || varName,
          units: await variable.attrs.units || '',
          standardName: await variable.attrs.standard_name,
          description: await variable.attrs.description,
        },
        attributes: await variable.attrs || {},
      };
    }

    // Extract coordinates
    const coordinates: any = {};
    const coordNames = ['time', 'lat', 'lon', 'level', 'depth'];

    for (const coordName of coordNames) {
      if (await ds.coords.has(coordName)) {
        const coord = await ds.coords.get(coordName);
        coordinates[coordName] = await coord.values.tolist();
      }
    }

    // Close dataset
    await ds.close();

    return {
      globalAttributes,
      dimensions,
      variables,
      coordinates,
    };
  }

  /**
   * Write NetCDF file using xarray
   */
  async writeNetCDF(
    data: NetCDFDataset,
    filePath: string,
    compressionLevel: number = 4
  ): Promise<void> {
    // Create xarray Dataset
    const dataVars: any = {};

    for (const [varName, varData] of Object.entries(data.variables)) {
      // Convert data to numpy array
      const npArray = await numpy.array(varData.values);

      // Create data array
      dataVars[varName] = await xarray.DataArray(
        npArray,
        {
          dims: varData.dimensions,
          coords: varData.coordinates,
          attrs: {
            long_name: varData.metadata.longName,
            units: varData.metadata.units,
            standard_name: varData.metadata.standardName,
            ...varData.attributes,
          },
        }
      );
    }

    // Create dataset
    const ds = await xarray.Dataset(dataVars, { attrs: data.globalAttributes });

    // Write to file with compression
    await ds.to_netcdf(filePath, {
      format: 'NETCDF4',
      engine: 'netcdf4',
      encoding: this.createCompressionEncoding(data.variables, compressionLevel),
    });

    console.log(`NetCDF file written: ${filePath}`);
  }

  /**
   * Create compression encoding for variables
   */
  private createCompressionEncoding(
    variables: { [name: string]: ClimateDataArray },
    level: number
  ): any {
    const encoding: any = {};

    for (const varName of Object.keys(variables)) {
      encoding[varName] = {
        zlib: true,
        complevel: level,
        shuffle: true,
        _FillValue: -9999,
      };
    }

    return encoding;
  }

  /**
   * Convert atmosphere state to NetCDF dataset
   */
  async atmosphereToNetCDF(
    states: AtmosphereState[],
    grid: { lon: number[]; lat: number[]; lev: number[] }
  ): Promise<NetCDFDataset> {
    const nTime = states.length;
    const nLon = grid.lon.length;
    const nLat = grid.lat.length;
    const nLev = grid.lev.length;

    // Create time coordinate (days since reference)
    const refDate = states[0].timestamp;
    const timeCoord = states.map(s =>
      (s.timestamp.getTime() - refDate.getTime()) / (1000 * 86400)
    );

    // Initialize data arrays
    const temperature: number[][][][] = [];
    const pressure: number[][][][] = [];
    const uWind: number[][][][] = [];
    const vWind: number[][][][] = [];
    const humidity: number[][][][] = [];

    for (let t = 0; t < nTime; t++) {
      temperature[t] = states[t].temperature;
      pressure[t] = states[t].pressure;
      uWind[t] = states[t].uWind;
      vWind[t] = states[t].vWind;
      humidity[t] = states[t].specificHumidity;
    }

    // Create dataset structure
    return {
      globalAttributes: {
        title: 'Atmospheric Model Output',
        institution: 'Elide Climate Simulation Platform',
        source: 'Elide polyglot climate model',
        history: `Created on ${new Date().toISOString()}`,
        references: 'https://elide.dev',
        comment: 'Climate simulation output demonstrating Elide polyglot capabilities',
        conventions: 'CF-1.8',
        creationDate: new Date(),
      },
      dimensions: {
        time: nTime,
        lon: nLon,
        lat: nLat,
        lev: nLev,
      },
      variables: {
        temperature: {
          values: temperature,
          dimensions: ['time', 'lon', 'lat', 'lev'],
          shape: [nTime, nLon, nLat, nLev],
          coordinates: {
            time: timeCoord,
            lon: grid.lon,
            lat: grid.lat,
            lev: grid.lev,
          },
          metadata: {
            name: 'temperature',
            longName: 'Air Temperature',
            units: 'K',
            standardName: 'air_temperature',
            description: 'Atmospheric temperature on pressure levels',
          },
          attributes: {
            valid_min: 150,
            valid_max: 350,
          },
        },
        pressure: {
          values: pressure,
          dimensions: ['time', 'lon', 'lat', 'lev'],
          shape: [nTime, nLon, nLat, nLev],
          coordinates: {
            time: timeCoord,
            lon: grid.lon,
            lat: grid.lat,
            lev: grid.lev,
          },
          metadata: {
            name: 'pressure',
            longName: 'Atmospheric Pressure',
            units: 'hPa',
            standardName: 'air_pressure',
          },
          attributes: {},
        },
        uWind: {
          values: uWind,
          dimensions: ['time', 'lon', 'lat', 'lev'],
          shape: [nTime, nLon, nLat, nLev],
          coordinates: {
            time: timeCoord,
            lon: grid.lon,
            lat: grid.lat,
            lev: grid.lev,
          },
          metadata: {
            name: 'u',
            longName: 'Zonal Wind Component',
            units: 'm s-1',
            standardName: 'eastward_wind',
          },
          attributes: {},
        },
        vWind: {
          values: vWind,
          dimensions: ['time', 'lon', 'lat', 'lev'],
          shape: [nTime, nLon, nLat, nLev],
          coordinates: {
            time: timeCoord,
            lon: grid.lon,
            lat: grid.lat,
            lev: grid.lev,
          },
          metadata: {
            name: 'v',
            longName: 'Meridional Wind Component',
            units: 'm s-1',
            standardName: 'northward_wind',
          },
          attributes: {},
        },
        specificHumidity: {
          values: humidity,
          dimensions: ['time', 'lon', 'lat', 'lev'],
          shape: [nTime, nLon, nLat, nLev],
          coordinates: {
            time: timeCoord,
            lon: grid.lon,
            lat: grid.lat,
            lev: grid.lev,
          },
          metadata: {
            name: 'q',
            longName: 'Specific Humidity',
            units: 'kg kg-1',
            standardName: 'specific_humidity',
          },
          attributes: {},
        },
      },
      coordinates: {
        time: timeCoord,
        lon: grid.lon,
        lat: grid.lat,
        level: grid.lev,
      },
    };
  }

  /**
   * Extract time series from NetCDF dataset
   */
  async extractTimeSeries(
    dataset: NetCDFDataset,
    variableName: string,
    lon: number,
    lat: number,
    level?: number
  ): Promise<{
    time: number[] | Date[];
    values: number[];
  }> {
    const variable = dataset.variables[variableName];

    if (!variable) {
      throw new Error(`Variable ${variableName} not found in dataset`);
    }

    const values = variable.values as number[][][][];
    const timeCoord = dataset.coordinates.time || [];

    // Find nearest grid point
    const lonIdx = this.findNearestIndex(dataset.coordinates.lon || [], lon);
    const latIdx = this.findNearestIndex(dataset.coordinates.lat || [], lat);
    const levIdx = level !== undefined
      ? this.findNearestIndex(dataset.coordinates.level || [], level)
      : 0;

    // Extract time series
    const timeSeries: number[] = [];
    for (let t = 0; t < values.length; t++) {
      timeSeries.push(values[t][lonIdx][latIdx][levIdx]);
    }

    return {
      time: timeCoord,
      values: timeSeries,
    };
  }

  /**
   * Compute spatial average over region
   */
  async computeSpatialAverage(
    dataset: NetCDFDataset,
    variableName: string,
    bounds: { lonMin: number; lonMax: number; latMin: number; latMax: number }
  ): Promise<{
    time: number[] | Date[];
    values: number[];
  }> {
    const variable = dataset.variables[variableName];
    const values = variable.values as number[][][][];

    const lons = dataset.coordinates.lon || [];
    const lats = dataset.coordinates.lat || [];
    const time = dataset.coordinates.time || [];

    // Find grid points within bounds
    const lonIndices = lons
      .map((lon, idx) => ({ lon, idx }))
      .filter(x => x.lon >= bounds.lonMin && x.lon <= bounds.lonMax)
      .map(x => x.idx);

    const latIndices = lats
      .map((lat, idx) => ({ lat, idx }))
      .filter(x => x.lat >= bounds.latMin && x.lat <= bounds.latMax)
      .map(x => x.idx);

    // Compute averages
    const averages: number[] = [];

    for (let t = 0; t < values.length; t++) {
      let sum = 0;
      let count = 0;

      for (const i of lonIndices) {
        for (const j of latIndices) {
          for (let k = 0; k < values[t][i][j].length; k++) {
            sum += values[t][i][j][k];
            count++;
          }
        }
      }

      averages.push(sum / count);
    }

    return {
      time,
      values: averages,
    };
  }

  /**
   * Regrid data to different resolution
   */
  async regridData(
    dataset: NetCDFDataset,
    targetGrid: { lon: number[]; lat: number[] }
  ): Promise<NetCDFDataset> {
    // Simple bilinear interpolation regridding
    const regridded: NetCDFDataset = {
      ...dataset,
      dimensions: {
        ...dataset.dimensions,
        lon: targetGrid.lon.length,
        lat: targetGrid.lat.length,
      },
      coordinates: {
        ...dataset.coordinates,
        lon: targetGrid.lon,
        lat: targetGrid.lat,
      },
      variables: {},
    };

    // Regrid each variable
    for (const [varName, variable] of Object.entries(dataset.variables)) {
      const dims = variable.dimensions;

      if (dims.includes('lon') && dims.includes('lat')) {
        // Regrid this variable
        const regridded Values = await this.bilinearInterpolation(
          variable.values,
          dataset.coordinates.lon || [],
          dataset.coordinates.lat || [],
          targetGrid.lon,
          targetGrid.lat
        );

        regridded.variables[varName] = {
          ...variable,
          values: regriddedValues,
          shape: [
            targetGrid.lon.length,
            targetGrid.lat.length,
            ...(variable.shape.slice(2) || []),
          ],
        };
      } else {
        // Keep as is
        regridded.variables[varName] = variable;
      }
    }

    return regridded;
  }

  /**
   * Bilinear interpolation for regridding
   */
  private async bilinearInterpolation(
    data: any,
    srcLon: number[],
    srcLat: number[],
    dstLon: number[],
    dstLat: number[]
  ): Promise<any> {
    // Use scipy for interpolation
    const interpFunc = await scipy.interpolate.RegularGridInterpolator(
      [srcLon, srcLat],
      data,
      { method: 'linear' }
    );

    // Create target grid
    const targetPoints: number[][] = [];
    for (const lon of dstLon) {
      for (const lat of dstLat) {
        targetPoints.push([lon, lat]);
      }
    }

    // Interpolate
    const interpolated = await interpFunc(targetPoints);

    // Reshape to grid
    const result: number[][] = [];
    let idx = 0;
    for (let i = 0; i < dstLon.length; i++) {
      result[i] = [];
      for (let j = 0; j < dstLat.length; j++) {
        result[i][j] = interpolated[idx++];
      }
    }

    return result;
  }

  /**
   * Compute climatology (time average)
   */
  async computeClimatology(
    dataset: NetCDFDataset,
    variableName: string,
    startYear?: number,
    endYear?: number
  ): Promise<ClimateDataArray> {
    const variable = dataset.variables[variableName];
    const values = variable.values as number[][][][];

    // Use NumPy for efficient averaging
    const npArray = await numpy.array(values);
    const climatology = await numpy.mean(npArray, { axis: 0 });

    return {
      ...variable,
      values: await climatology.tolist(),
      dimensions: variable.dimensions.filter(d => d !== 'time'),
      shape: variable.shape.slice(1),
      metadata: {
        ...variable.metadata,
        longName: `${variable.metadata.longName} Climatology`,
        description: `Time-averaged ${variable.metadata.name}`,
      },
    };
  }

  /**
   * Compute anomalies from climatology
   */
  async computeAnomalies(
    dataset: NetCDFDataset,
    variableName: string,
    climatology: ClimateDataArray
  ): Promise<ClimateDataArray> {
    const variable = dataset.variables[variableName];
    const values = await numpy.array(variable.values);
    const climValues = await numpy.array(climatology.values);

    // Compute anomalies: data - climatology
    const anomalies = await numpy.subtract(values, climValues);

    return {
      ...variable,
      values: await anomalies.tolist(),
      metadata: {
        ...variable.metadata,
        longName: `${variable.metadata.longName} Anomaly`,
        description: `Anomaly from climatological mean`,
      },
    };
  }

  /**
   * Compute weighted spatial mean
   */
  async computeWeightedMean(
    dataset: NetCDFDataset,
    variableName: string
  ): Promise<number[]> {
    const variable = dataset.variables[variableName];
    const values = variable.values as number[][][][];
    const lats = dataset.coordinates.lat || [];

    // Compute latitude weights (cosine of latitude)
    const weights = await numpy.cos(
      await numpy.multiply(
        await numpy.array(lats),
        Math.PI / 180
      )
    );

    // Compute weighted mean for each time step
    const means: number[] = [];

    for (let t = 0; t < values.length; t++) {
      const slice = values[t];
      let weightedSum = 0;
      let weightSum = 0;

      for (let i = 0; i < slice.length; i++) {
        for (let j = 0; j < slice[i].length; j++) {
          const weight = weights[j];
          for (let k = 0; k < slice[i][j].length; k++) {
            weightedSum += slice[i][j][k] * weight;
            weightSum += weight;
          }
        }
      }

      means.push(weightedSum / weightSum);
    }

    return means;
  }

  /**
   * Helper: Find nearest grid index
   */
  private findNearestIndex(array: number[], value: number): number {
    let minDist = Infinity;
    let minIdx = 0;

    for (let i = 0; i < array.length; i++) {
      const dist = Math.abs(array[i] - value);
      if (dist < minDist) {
        minDist = dist;
        minIdx = i;
      }
    }

    return minIdx;
  }
}

/**
 * Climate Data Utilities
 */
export class ClimateDataUtils {
  /**
   * Convert temperature units
   */
  static convertTemperature(
    value: number,
    from: 'K' | 'C' | 'F',
    to: 'K' | 'C' | 'F'
  ): number {
    // Convert to Kelvin first
    let kelvin: number;
    switch (from) {
      case 'K':
        kelvin = value;
        break;
      case 'C':
        kelvin = value + 273.15;
        break;
      case 'F':
        kelvin = (value - 32) * 5/9 + 273.15;
        break;
    }

    // Convert from Kelvin to target
    switch (to) {
      case 'K':
        return kelvin;
      case 'C':
        return kelvin - 273.15;
      case 'F':
        return (kelvin - 273.15) * 9/5 + 32;
    }
  }

  /**
   * Convert pressure units
   */
  static convertPressure(
    value: number,
    from: 'Pa' | 'hPa' | 'mb' | 'atm',
    to: 'Pa' | 'hPa' | 'mb' | 'atm'
  ): number {
    // Convert to Pa first
    let pa: number;
    switch (from) {
      case 'Pa':
        pa = value;
        break;
      case 'hPa':
      case 'mb':
        pa = value * 100;
        break;
      case 'atm':
        pa = value * 101325;
        break;
    }

    // Convert from Pa to target
    switch (to) {
      case 'Pa':
        return pa;
      case 'hPa':
      case 'mb':
        return pa / 100;
      case 'atm':
        return pa / 101325;
    }
  }

  /**
   * Compute potential temperature
   */
  static computePotentialTemperature(
    temperature: number,
    pressure: number,
    referencePressure: number = 1000
  ): number {
    const kappa = 0.286; // R/cp for dry air
    return temperature * Math.pow(referencePressure / pressure, kappa);
  }

  /**
   * Compute saturation vapor pressure
   */
  static computeSaturationVaporPressure(temperature: number): number {
    // Bolton's formula (temperature in K, result in hPa)
    const T = temperature - 273.15; // Convert to Celsius
    return 6.112 * Math.exp((17.67 * T) / (T + 243.5));
  }
}

/**
 * Export processor factory
 */
export function createNetCDFProcessor(): NetCDFProcessor {
  return new NetCDFProcessor();
}
