/**
 * Atmospheric Radiation Module
 *
 * Implements radiative transfer calculations for solar (shortwave) and
 * terrestrial (longwave) radiation using Python NumPy and SciPy.
 *
 * Demonstrates Elide's polyglot capabilities for scientific computing.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import type {
  AtmosphereState,
  RadiativeTransferConfig,
  SurfaceConditions,
  PHYSICAL_CONSTANTS,
} from '../types.js';

/**
 * Radiative Transfer Calculator
 * Computes solar and longwave radiation fluxes through the atmosphere
 */
export class RadiativeTransfer {
  private config: RadiativeTransferConfig;
  private readonly STEFAN_BOLTZMANN = 5.670374419e-8; // W m⁻² K⁻⁴

  constructor(config: RadiativeTransferConfig) {
    this.config = config;
  }

  /**
   * Compute solar (shortwave) radiation fluxes
   * Uses two-stream approximation with delta-Eddington scaling
   */
  async computeSolarRadiation(
    atmosphere: AtmosphereState,
    surface: SurfaceConditions
  ): Promise<{
    downwardFlux: number[][][];
    upwardFlux: number[][][];
    heatingRate: number[][][];
    surfaceFlux: number[][];
  }> {
    const { longitude, latitude, vertical } = this.getGridDimensions(atmosphere);

    // Initialize flux arrays using NumPy
    const downwardFlux = await numpy.zeros([longitude, latitude, vertical]);
    const upwardFlux = await numpy.zeros([longitude, latitude, vertical]);
    const heatingRate = await numpy.zeros([longitude, latitude, vertical]);
    const surfaceFlux = await numpy.zeros([longitude, latitude]);

    // Solar zenith angle for each grid point
    const zenithAngles = this.config.solar.zenithAngle;

    for (let i = 0; i < longitude; i++) {
      for (let j = 0; j < latitude; j++) {
        const zenith = zenithAngles[i][j];
        const cosZenith = Math.cos(zenith);

        // Skip nighttime points
        if (cosZenith <= 0) {
          continue;
        }

        // Incident solar flux at top of atmosphere
        const solarFlux = this.config.solar.constant * cosZenith;

        // Compute optical properties for each layer
        const opticalDepths = await this.computeOpticalDepths(
          atmosphere,
          surface,
          i,
          j,
          'shortwave'
        );

        // Two-stream radiative transfer
        const { down, up, heating } = await this.twoStreamSolver(
          solarFlux,
          opticalDepths,
          surface.albedo[i][j],
          atmosphere.temperature[i][j],
          'shortwave'
        );

        // Store results
        for (let k = 0; k < vertical; k++) {
          downwardFlux[i][j][k] = down[k];
          upwardFlux[i][j][k] = up[k];
          heatingRate[i][j][k] = heating[k];
        }

        surfaceFlux[i][j] = down[vertical - 1] * (1 - surface.albedo[i][j]);
      }
    }

    return {
      downwardFlux,
      upwardFlux,
      heatingRate,
      surfaceFlux,
    };
  }

  /**
   * Compute longwave (terrestrial) radiation fluxes
   * Uses rapid radiative transfer model approach
   */
  async computeLongwaveRadiation(
    atmosphere: AtmosphereState,
    surface: SurfaceConditions
  ): Promise<{
    downwardFlux: number[][][];
    upwardFlux: number[][][];
    heatingRate: number[][][];
    surfaceFlux: number[][];
    olr: number[][]; // Outgoing Longwave Radiation
  }> {
    const { longitude, latitude, vertical } = this.getGridDimensions(atmosphere);

    // Initialize arrays
    const downwardFlux = await numpy.zeros([longitude, latitude, vertical]);
    const upwardFlux = await numpy.zeros([longitude, latitude, vertical]);
    const heatingRate = await numpy.zeros([longitude, latitude, vertical]);
    const surfaceFlux = await numpy.zeros([longitude, latitude]);
    const olr = await numpy.zeros([longitude, latitude]);

    for (let i = 0; i < longitude; i++) {
      for (let j = 0; j < latitude; j++) {
        // Surface emission (Planck function)
        const surfaceTemp = surface.surfaceTemperature[i][j];
        const surfaceEmission =
          surface.emissivity[i][j] *
          this.STEFAN_BOLTZMANN *
          Math.pow(surfaceTemp, 4);

        // Compute optical depths for longwave
        const opticalDepths = await this.computeOpticalDepths(
          atmosphere,
          surface,
          i,
          j,
          'longwave'
        );

        // RRTMG-style band calculations
        const { down, up, heating } = await this.longwaveTransfer(
          atmosphere.temperature[i][j],
          atmosphere.pressure[i][j],
          atmosphere.specificHumidity[i][j],
          opticalDepths,
          surfaceEmission,
          this.config.composition.co2
        );

        // Store results
        for (let k = 0; k < vertical; k++) {
          downwardFlux[i][j][k] = down[k];
          upwardFlux[i][j][k] = up[k];
          heatingRate[i][j][k] = heating[k];
        }

        surfaceFlux[i][j] = down[vertical - 1];
        olr[i][j] = up[0]; // Top of atmosphere
      }
    }

    return {
      downwardFlux,
      upwardFlux,
      heatingRate,
      surfaceFlux,
      olr,
    };
  }

  /**
   * Compute optical depths for atmospheric layers
   * Includes gases, aerosols, and clouds
   */
  private async computeOpticalDepths(
    atmosphere: AtmosphereState,
    surface: SurfaceConditions,
    i: number,
    j: number,
    spectrum: 'shortwave' | 'longwave'
  ): Promise<{
    gas: number[];
    aerosol: number[];
    cloud: number[];
    total: number[];
  }> {
    const vertical = atmosphere.temperature[i][j].length;

    // Gas optical depth using NumPy arrays
    const gasOpticalDepth = await numpy.zeros(vertical);
    const aerosolOpticalDepth = await numpy.zeros(vertical);
    const cloudOpticalDepth = await numpy.zeros(vertical);

    for (let k = 0; k < vertical; k++) {
      const pressure = atmosphere.pressure[i][j][k];
      const temperature = atmosphere.temperature[i][j][k];
      const humidity = atmosphere.specificHumidity[i][j][k];

      // Gas absorption
      if (spectrum === 'shortwave') {
        // O3, H2O absorption in solar bands
        gasOpticalDepth[k] = await this.computeGasAbsorptionSW(
          pressure,
          temperature,
          humidity,
          this.config.composition.o3Profile[k]
        );
      } else {
        // CO2, H2O, CH4, N2O absorption in IR bands
        gasOpticalDepth[k] = await this.computeGasAbsorptionLW(
          pressure,
          temperature,
          humidity,
          this.config.composition.co2,
          this.config.composition.ch4,
          this.config.composition.n2o
        );
      }

      // Aerosol extinction
      aerosolOpticalDepth[k] = this.computeAerosolExtinction(
        pressure,
        surface.elevation[i][j],
        k,
        spectrum
      );

      // Cloud optical properties
      const cloudFraction = atmosphere.cloudFraction[i][j][k];
      const lwc = atmosphere.cloudWaterContent[i][j][k];
      const iwc = atmosphere.cloudIceContent[i][j][k];

      cloudOpticalDepth[k] = cloudFraction * (
        await this.computeCloudOpticalDepth(lwc, iwc, temperature, spectrum)
      );
    }

    // Total optical depth
    const totalOpticalDepth = await numpy.add(
      await numpy.add(gasOpticalDepth, aerosolOpticalDepth),
      cloudOpticalDepth
    );

    return {
      gas: await gasOpticalDepth.tolist(),
      aerosol: await aerosolOpticalDepth.tolist(),
      cloud: await cloudOpticalDepth.tolist(),
      total: await totalOpticalDepth.tolist(),
    };
  }

  /**
   * Gas absorption for shortwave radiation
   * Parameterization for O3 and H2O
   */
  private async computeGasAbsorptionSW(
    pressure: number,
    temperature: number,
    humidity: number,
    ozone: number
  ): Promise<number> {
    // Ozone absorption (Hartley-Huggins bands)
    const o3Absorption = 0.00035 * ozone * (pressure / 1013.25);

    // Water vapor absorption (near-IR bands)
    const h2oAbsorption = 0.002 * humidity * (pressure / 1013.25) *
      Math.exp(-1800 / temperature);

    return o3Absorption + h2oAbsorption;
  }

  /**
   * Gas absorption for longwave radiation
   * Line-by-line integration approximation
   */
  private async computeGasAbsorptionLW(
    pressure: number,
    temperature: number,
    humidity: number,
    co2: number,
    ch4: number,
    n2o: number
  ): Promise<number> {
    // Pressure and temperature scaling
    const pressureScale = pressure / 1013.25;
    const tempScale = 296.0 / temperature;

    // CO2 absorption (15 μm band)
    const co2Abs = 0.0015 * (co2 / 400) * pressureScale * Math.sqrt(tempScale);

    // H2O absorption (rotation and vibration-rotation bands)
    const h2oAbs = 0.1 * humidity * pressureScale *
      Math.pow(tempScale, 2.5);

    // CH4 absorption (7.6 μm band)
    const ch4Abs = 0.0003 * (ch4 / 1800) * pressureScale * tempScale;

    // N2O absorption (7.8 μm band)
    const n2oAbs = 0.0002 * (n2o / 320) * pressureScale * tempScale;

    return co2Abs + h2oAbs + ch4Abs + n2oAbs;
  }

  /**
   * Cloud optical depth calculation
   * Based on liquid/ice water path and effective radius
   */
  private async computeCloudOpticalDepth(
    lwc: number,
    iwc: number,
    temperature: number,
    spectrum: 'shortwave' | 'longwave'
  ): Promise<number> {
    // Effective radius (microns)
    const liquidRadius = 10.0;
    const iceRadius = 30.0;

    if (spectrum === 'shortwave') {
      // Visible optical depth
      const tauLiquid = lwc > 0 ? (3 * lwc) / (2 * 1000 * liquidRadius * 1e-6) : 0;
      const tauIce = iwc > 0 ? (3 * iwc) / (2 * 917 * iceRadius * 1e-6) : 0;
      return tauLiquid + tauIce;
    } else {
      // Infrared optical depth (smaller than visible)
      const tauLiquid = lwc > 0 ? (lwc * 0.1) / liquidRadius : 0;
      const tauIce = iwc > 0 ? (iwc * 0.05) / iceRadius : 0;
      return tauLiquid + tauIce;
    }
  }

  /**
   * Aerosol extinction coefficient
   */
  private computeAerosolExtinction(
    pressure: number,
    elevation: number,
    level: number,
    spectrum: 'shortwave' | 'longwave'
  ): number {
    // Aerosol scale height (km)
    const scaleHeight = 2.0;

    // Background aerosol optical depth
    const aodSurface = 0.1;

    // Vertical distribution
    const height = elevation + level * 1000; // Simplified
    const aod = aodSurface * Math.exp(-height / (scaleHeight * 1000));

    // Longwave aerosol effect is much smaller
    return spectrum === 'shortwave' ? aod : aod * 0.1;
  }

  /**
   * Two-stream radiative transfer solver
   * Delta-Eddington approximation for shortwave
   */
  private async twoStreamSolver(
    incidentFlux: number,
    opticalDepths: { total: number[] },
    surfaceAlbedo: number,
    temperatures: number[],
    spectrum: 'shortwave' | 'longwave'
  ): Promise<{
    down: number[];
    up: number[];
    heating: number[];
  }> {
    const nLevels = opticalDepths.total.length;

    // Create NumPy arrays for calculations
    const tau = await numpy.array(opticalDepths.total);
    const down = await numpy.zeros(nLevels);
    const up = await numpy.zeros(nLevels);
    const heating = await numpy.zeros(nLevels);

    // Single scattering albedo and asymmetry parameter
    const omega = 0.9; // Single scattering albedo
    const g = 0.85; // Asymmetry parameter

    // Delta-Eddington scaling
    const f = g * g;
    const tauScaled = await numpy.multiply(tau, 1 - omega * f);
    const omegaScaled = omega * (1 - f) / (1 - omega * f);
    const gScaled = (g - f) / (1 - f);

    // Two-stream coefficients
    const gamma1 = (7 - omegaScaled * (4 + 3 * gScaled)) / 4;
    const gamma2 = -(1 - omegaScaled * (4 - 3 * gScaled)) / 4;

    // Transmission and reflection for each layer
    down[0] = incidentFlux;

    for (let k = 0; k < nLevels - 1; k++) {
      const dtau = tauScaled[k];
      const expTerm = Math.exp(-dtau / 0.5); // Diffusivity factor

      // Layer transmission
      const trans = expTerm;
      const refl = 0.1 * (1 - expTerm); // Simplified reflection

      // Fluxes
      down[k + 1] = down[k] * trans;
      up[k] = down[k] * refl;

      // Heating rate (K/day)
      const absorbed = down[k] - down[k + 1] - up[k];
      heating[k] = absorbed * 86400 / (1005 * 100); // Simplified
    }

    // Surface reflection
    up[nLevels - 1] = down[nLevels - 1] * surfaceAlbedo;

    // Upward propagation
    for (let k = nLevels - 2; k >= 0; k--) {
      up[k] += up[k + 1] * Math.exp(-tauScaled[k] / 0.5);
    }

    return {
      down: await down.tolist(),
      up: await up.tolist(),
      heating: await heating.tolist(),
    };
  }

  /**
   * Longwave radiative transfer using band model
   * Approximates RRTMG approach
   */
  private async longwaveTransfer(
    temperature: number[],
    pressure: number[],
    humidity: number[],
    opticalDepths: { total: number[] },
    surfaceEmission: number,
    co2Concentration: number
  ): Promise<{
    down: number[];
    up: number[];
    heating: number[];
  }> {
    const nLevels = temperature.length;

    const down = await numpy.zeros(nLevels);
    const up = await numpy.zeros(nLevels);
    const heating = await numpy.zeros(nLevels);

    // Planck function for each layer
    const planckFlux = await numpy.zeros(nLevels);
    for (let k = 0; k < nLevels; k++) {
      planckFlux[k] = this.STEFAN_BOLTZMANN * Math.pow(temperature[k], 4);
    }

    // Surface upward flux
    up[nLevels - 1] = surfaceEmission;

    // Upward integration
    for (let k = nLevels - 2; k >= 0; k--) {
      const tau = opticalDepths.total[k];
      const transmittance = Math.exp(-tau);

      // Layer emission
      const emission = (1 - transmittance) * planckFlux[k];

      // Flux from below
      up[k] = up[k + 1] * transmittance + emission;
    }

    // Downward integration from top of atmosphere
    down[0] = 0; // No downward flux at TOA

    for (let k = 1; k < nLevels; k++) {
      const tau = opticalDepths.total[k - 1];
      const transmittance = Math.exp(-tau);

      // Layer emission
      const emission = (1 - transmittance) * planckFlux[k - 1];

      // Flux from above
      down[k] = down[k - 1] * transmittance + emission;
    }

    // Heating rates
    for (let k = 0; k < nLevels; k++) {
      const netFlux = k < nLevels - 1
        ? (up[k] - up[k + 1]) + (down[k] - down[k + 1])
        : (up[k] - surfaceEmission) + down[k];

      // Convert to K/day
      const dp = k < nLevels - 1
        ? pressure[k + 1] - pressure[k]
        : pressure[k] * 0.1;

      heating[k] = (netFlux * 86400 * 9.81) / (1005 * Math.abs(dp) * 100);
    }

    return {
      down: await down.tolist(),
      up: await up.tolist(),
      heating: await heating.tolist(),
    };
  }

  /**
   * Compute net radiation balance
   */
  async computeRadiationBalance(
    atmosphere: AtmosphereState,
    surface: SurfaceConditions
  ): Promise<{
    netShortwave: number[][];
    netLongwave: number[][];
    netRadiation: number[][];
    toa: {
      incomingSolar: number;
      outgoingSolar: number;
      outgoingLongwave: number;
      netImbalance: number;
    };
  }> {
    // Compute both SW and LW radiation
    const sw = await this.computeSolarRadiation(atmosphere, surface);
    const lw = await this.computeLongwaveRadiation(atmosphere, surface);

    const { longitude, latitude } = this.getGridDimensions(atmosphere);

    const netShortwave = await numpy.zeros([longitude, latitude]);
    const netLongwave = await numpy.zeros([longitude, latitude]);
    const netRadiation = await numpy.zeros([longitude, latitude]);

    // Compute net fluxes
    for (let i = 0; i < longitude; i++) {
      for (let j = 0; j < latitude; j++) {
        // Net shortwave = absorbed solar
        netShortwave[i][j] = sw.surfaceFlux[i][j];

        // Net longwave = up - down at surface
        const nLevels = atmosphere.temperature[i][j].length;
        netLongwave[i][j] = lw.upwardFlux[i][j][nLevels - 1] -
          lw.downwardFlux[i][j][nLevels - 1];

        // Total net radiation
        netRadiation[i][j] = netShortwave[i][j] - netLongwave[i][j];
      }
    }

    // Top of atmosphere balance
    const toaIncoming = await this.computeGlobalMean(
      sw.downwardFlux.map((lon) =>
        lon.map((lat) => lat[0])
      )
    );

    const toaOutgoingSolar = await this.computeGlobalMean(
      sw.upwardFlux.map((lon) =>
        lon.map((lat) => lat[0])
      )
    );

    const toaOutgoingLW = await this.computeGlobalMean(lw.olr);

    return {
      netShortwave: await netShortwave.tolist(),
      netLongwave: await netLongwave.tolist(),
      netRadiation: await netRadiation.tolist(),
      toa: {
        incomingSolar: toaIncoming,
        outgoingSolar: toaOutgoingSolar,
        outgoingLongwave: toaOutgoingLW,
        netImbalance: toaIncoming - toaOutgoingSolar - toaOutgoingLW,
      },
    };
  }

  /**
   * Update solar zenith angles for time of day and season
   */
  updateSolarGeometry(
    longitude: number[],
    latitude: number[],
    dayOfYear: number,
    hourOfDay: number
  ): number[][] {
    const zenithAngles: number[][] = [];

    // Solar declination (degrees)
    const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
    const declinationRad = (declination * Math.PI) / 180;

    for (let i = 0; i < longitude.length; i++) {
      zenithAngles[i] = [];
      for (let j = 0; j < latitude.length; j++) {
        const lat = (latitude[j] * Math.PI) / 180;
        const lon = (longitude[i] * Math.PI) / 180;

        // Hour angle
        const hourAngle = ((hourOfDay - 12) * 15 * Math.PI) / 180;

        // Zenith angle
        const cosZenith =
          Math.sin(lat) * Math.sin(declinationRad) +
          Math.cos(lat) * Math.cos(declinationRad) * Math.cos(hourAngle);

        zenithAngles[i][j] = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
      }
    }

    return zenithAngles;
  }

  /**
   * Compute greenhouse effect
   * Difference between surface and OLR temperatures
   */
  computeGreenhouseEffect(
    surfaceTemperature: number[][],
    olr: number[][]
  ): {
    effectiveTemperature: number;
    surfaceMeanTemperature: number;
    greenhouseEffect: number;
  } {
    // Compute global mean surface temperature
    const surfaceMean = this.computeGlobalMean(surfaceTemperature);

    // Compute effective emission temperature from OLR
    const olrMean = this.computeGlobalMean(olr);
    const effectiveTemp = Math.pow(
      olrMean / this.STEFAN_BOLTZMANN,
      0.25
    );

    return {
      effectiveTemperature: effectiveTemp,
      surfaceMeanTemperature: surfaceMean,
      greenhouseEffect: surfaceMean - effectiveTemp,
    };
  }

  /**
   * Helper: Get grid dimensions
   */
  private getGridDimensions(atmosphere: AtmosphereState) {
    return {
      longitude: atmosphere.temperature.length,
      latitude: atmosphere.temperature[0].length,
      vertical: atmosphere.temperature[0][0].length,
    };
  }

  /**
   * Helper: Compute area-weighted global mean
   */
  private computeGlobalMean(field: number[][]): number {
    let sum = 0;
    let weightSum = 0;

    const nLon = field.length;
    const nLat = field[0].length;

    for (let j = 0; j < nLat; j++) {
      // Latitude in radians (approximation)
      const lat = ((j / nLat) * 180 - 90) * (Math.PI / 180);
      const weight = Math.cos(lat);

      for (let i = 0; i < nLon; i++) {
        sum += field[i][j] * weight;
        weightSum += weight;
      }
    }

    return sum / weightSum;
  }
}

/**
 * Cloud Radiative Effects
 * Compute cloud radiative forcing
 */
export class CloudRadiativeEffects {
  /**
   * Compute cloud radiative effect
   * Difference between all-sky and clear-sky fluxes
   */
  static async computeCloudRadiativeForcing(
    allSkyFluxes: { shortwave: number[][], longwave: number[][] },
    clearSkyFluxes: { shortwave: number[][], longwave: number[][] }
  ): Promise<{
    shortwaveCRE: number[][];
    longwaveCRE: number[][];
    netCRE: number[][];
    globalMean: {
      sw: number;
      lw: number;
      net: number;
    };
  }> {
    const nLon = allSkyFluxes.shortwave.length;
    const nLat = allSkyFluxes.shortwave[0].length;

    const swCRE = await numpy.zeros([nLon, nLat]);
    const lwCRE = await numpy.zeros([nLon, nLat]);
    const netCRE = await numpy.zeros([nLon, nLat]);

    // CRE = all-sky - clear-sky
    for (let i = 0; i < nLon; i++) {
      for (let j = 0; j < nLat; j++) {
        swCRE[i][j] = allSkyFluxes.shortwave[i][j] - clearSkyFluxes.shortwave[i][j];
        lwCRE[i][j] = allSkyFluxes.longwave[i][j] - clearSkyFluxes.longwave[i][j];
        netCRE[i][j] = swCRE[i][j] + lwCRE[i][j];
      }
    }

    // Global means (simplified, should be area-weighted)
    const swMean = await numpy.mean(swCRE);
    const lwMean = await numpy.mean(lwCRE);
    const netMean = await numpy.mean(netCRE);

    return {
      shortwaveCRE: await swCRE.tolist(),
      longwaveCRE: await lwCRE.tolist(),
      netCRE: await netCRE.tolist(),
      globalMean: {
        sw: swMean,
        lw: lwMean,
        net: netMean,
      },
    };
  }
}

/**
 * Export main radiation calculator
 */
export function createRadiationCalculator(
  config: RadiativeTransferConfig
): RadiativeTransfer {
  return new RadiativeTransfer(config);
}
