/**
 * Climate Energy Balance Module
 *
 * Implements energy balance models (EBM) for climate projections
 * and equilibrium climate sensitivity calculations.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import type {
  ClimateForcings,
  EnergyBalanceResult,
  EmissionsScenario,
} from '../types.js';

/**
 * Energy Balance Model
 * Simple climate model based on global energy balance
 */
export class EnergyBalanceModel {
  private readonly STEFAN_BOLTZMANN = 5.670374419e-8; // W m⁻² K⁻⁴
  private readonly SOLAR_CONSTANT = 1361; // W m⁻²
  private readonly EARTH_ALBEDO = 0.3;
  private readonly OCEAN_HEAT_CAPACITY = 4.0e8; // J m⁻² K⁻¹ (100m mixed layer)
  private readonly LAND_HEAT_CAPACITY = 1.0e6; // J m⁻² K⁻¹

  /**
   * Compute equilibrium temperature for given forcings
   */
  async computeEquilibrium(
    forcings: ClimateForcings,
    initialTemperature: number = 288.15
  ): Promise<EnergyBalanceResult> {
    // Incoming solar radiation
    const incomingSolar = this.SOLAR_CONSTANT / 4; // Global average

    // Absorbed solar radiation
    const absorbedSolar = incomingSolar * (1 - this.EARTH_ALBEDO);

    // Greenhouse effect parameters
    const { greenhouseEffect, feedbacks } = await this.computeGreenhouseParameters(
      forcings
    );

    // Radiative forcing from GHGs
    const radiativeForcing = await this.computeRadiativeForcingGHG(forcings);

    // Outgoing longwave radiation (with greenhouse effect)
    const outgoingLW = this.STEFAN_BOLTZMANN * Math.pow(initialTemperature, 4);

    // Net radiation at equilibrium
    const netRadiation = absorbedSolar + radiativeForcing - outgoingLW;

    // Solve for equilibrium temperature
    const equilibriumTemp = await this.solveForEquilibrium(
      absorbedSolar,
      radiativeForcing,
      feedbacks
    );

    // Compute climate sensitivity
    const sensitivity = await this.computeClimateSensitivity(
      forcings,
      equilibriumTemp
    );

    return {
      global: {
        incomingSolar,
        reflectedSolar: incomingSolar - absorbedSolar,
        absorbedSolar,
        outgoingLongwave: this.STEFAN_BOLTZMANN * Math.pow(equilibriumTemp, 4),
        netRadiation: 0, // At equilibrium
        imbalance: netRadiation,
      },
      fluxes: {
        surfaceShortwave: absorbedSolar * 0.5,
        surfaceLongwave: absorbedSolar * 0.5,
        atmosphericWindow: 40, // W m⁻²
        latentHeat: 80,
        sensibleHeat: 20,
      },
      temperature: {
        surface: equilibriumTemp,
        atmosphere: equilibriumTemp - 20,
        stratosphere: 220,
        oceanMixedLayer: equilibriumTemp - 1,
        deepOcean: 277,
      },
      sensitivity,
      feedbacks,
    };
  }

  /**
   * Compute transient climate response
   * Time-evolving temperature response to forcings
   */
  async computeTransientResponse(
    scenario: EmissionsScenario,
    initialTemperature: number = 288.15,
    years: number = 100
  ): Promise<{
    years: number[];
    temperature: number[];
    forcing: number[];
    heatUptake: number[];
  }> {
    const dt = 1; // years
    const nSteps = Math.floor(years / dt);

    // Initialize arrays
    const timeArray = await numpy.linspace(0, years, nSteps);
    const temperature = await numpy.zeros(nSteps);
    const forcing = await numpy.zeros(nSteps);
    const heatUptake = await numpy.zeros(nSteps);

    // Initial condition
    temperature[0] = initialTemperature;

    // Time integration
    for (let i = 1; i < nSteps; i++) {
      const year = i * dt;

      // Get forcing for this year
      const yearIndex = scenario.years.findIndex(y => y >= year);
      const F = yearIndex >= 0
        ? scenario.radiativeForcingTimeseries[yearIndex]
        : scenario.radiativeForcingTimeseries[scenario.radiativeForcingTimeseries.length - 1];

      forcing[i] = F;

      // Climate feedback parameter (W m⁻² K⁻¹)
      const lambda = 1.3;

      // Ocean heat uptake efficiency
      const kappa = 0.7; // W m⁻² K⁻¹

      // Temperature tendency
      const C = this.OCEAN_HEAT_CAPACITY;
      const dTdt = (F - lambda * (temperature[i-1] - initialTemperature) -
                    kappa * (temperature[i-1] - initialTemperature)) / C;

      // Update temperature (forward Euler)
      temperature[i] = temperature[i-1] + dTdt * (dt * 365.25 * 86400);

      // Ocean heat uptake
      heatUptake[i] = kappa * (temperature[i] - initialTemperature);
    }

    return {
      years: await timeArray.tolist(),
      temperature: await temperature.tolist(),
      forcing: await forcing.tolist(),
      heatUptake: await heatUptake.tolist(),
    };
  }

  /**
   * Solve for equilibrium temperature
   * Uses Newton-Raphson iteration
   */
  private async solveForEquilibrium(
    absorbedSolar: number,
    forcing: number,
    feedbacks: any
  ): Promise<number> {
    const T0 = 288.15; // Initial guess (K)
    const epsilon = 0.01; // Convergence criterion
    const maxIterations = 100;

    let T = T0;

    for (let iter = 0; iter < maxIterations; iter++) {
      // Energy balance: S(1-α) + F = σT⁴(1 + f)
      const outgoingLW = this.STEFAN_BOLTZMANN * Math.pow(T, 4);

      // Net feedback factor
      const netFeedback = feedbacks.total;

      // Residual
      const residual = absorbedSolar + forcing - outgoingLW * (1 + netFeedback);

      // Convergence check
      if (Math.abs(residual) < epsilon) {
        break;
      }

      // Derivative: dF/dT = -4σT³(1 + f)
      const derivative = -4 * this.STEFAN_BOLTZMANN * Math.pow(T, 3) * (1 + netFeedback);

      // Newton-Raphson update
      T = T - residual / derivative;
    }

    return T;
  }

  /**
   * Compute radiative forcing from greenhouse gases
   * Using simplified formulae from IPCC
   */
  private async computeRadiativeForcingGHG(
    forcings: ClimateForcings
  ): Promise<number> {
    const co2 = forcings.greenhouseGases.co2;
    const ch4 = forcings.greenhouseGases.ch4;
    const n2o = forcings.greenhouseGases.n2o;

    // Reference values (pre-industrial)
    const co2Ref = 278; // ppm
    const ch4Ref = 700; // ppb
    const n2oRef = 270; // ppb

    // CO2 forcing: ΔF = 5.35 * ln(C/C0)
    const forcingCO2 = 5.35 * Math.log(co2 / co2Ref);

    // CH4 forcing (includes overlap with N2O)
    const M = ch4;
    const M0 = ch4Ref;
    const N = n2o;
    const N0 = n2oRef;

    const forcingCH4 = 0.036 * (Math.sqrt(M) - Math.sqrt(M0)) -
      (this.overlapFunction(M, N) - this.overlapFunction(M0, N0));

    // N2O forcing
    const forcingN2O = 0.12 * (Math.sqrt(N) - Math.sqrt(N0)) -
      (this.overlapFunction(M, N) - this.overlapFunction(M0, N0));

    // Other GHGs (CFCs, etc.) - simplified
    const forcingOther = 0.3;

    return forcingCO2 + forcingCH4 + forcingN2O + forcingOther;
  }

  /**
   * Overlap function for CH4 and N2O
   */
  private overlapFunction(M: number, N: number): number {
    return 0.47 * Math.log(1 + 2.01e-5 * Math.pow(M * N, 0.75) +
                           5.31e-15 * M * Math.pow(M * N, 1.52));
  }

  /**
   * Compute greenhouse parameters and feedbacks
   */
  private async computeGreenhouseParameters(
    forcings: ClimateForcings
  ): Promise<{
    greenhouseEffect: number;
    feedbacks: {
      planck: number;
      waterVapor: number;
      lapseRate: number;
      albedo: number;
      cloud: number;
      total: number;
    };
  }> {
    // Planck feedback (blackbody response)
    const T0 = 288;
    const planck = -4 * this.STEFAN_BOLTZMANN * Math.pow(T0, 3); // W m⁻² K⁻¹

    // Water vapor feedback (positive)
    const waterVapor = 1.8; // W m⁻² K⁻¹

    // Lapse rate feedback (negative)
    const lapseRate = -0.8;

    // Ice-albedo feedback (positive)
    const albedo = 0.4;

    // Cloud feedback (uncertain, slightly positive)
    const cloud = 0.5;

    // Total feedback parameter
    const total = waterVapor + lapseRate + albedo + cloud;

    // Greenhouse effect strength
    const greenhouseEffect = 150; // W m⁻²

    return {
      greenhouseEffect,
      feedbacks: {
        planck,
        waterVapor,
        lapseRate,
        albedo,
        cloud,
        total,
      },
    };
  }

  /**
   * Compute climate sensitivity
   * Temperature change per doubling of CO2
   */
  private async computeClimateSensitivity(
    forcings: ClimateForcings,
    currentTemp: number
  ): Promise<{
    equilibrium: number;
    transient: number;
    feedbackParameter: number;
  }> {
    // Forcing for 2×CO2
    const f2x = 3.7; // W m⁻²

    // Feedback parameter (W m⁻² K⁻¹)
    const lambda = 1.3;

    // Equilibrium climate sensitivity (ECS)
    const ecs = f2x / lambda;

    // Transient climate response (TCR) - typically 0.5-0.7 of ECS
    const tcr = ecs * 0.6;

    return {
      equilibrium: ecs,
      transient: tcr,
      feedbackParameter: lambda,
    };
  }

  /**
   * Compute temperature response to emissions scenario
   */
  async projectTemperature(
    scenario: EmissionsScenario,
    startYear: number = 2020,
    endYear: number = 2100
  ): Promise<{
    years: number[];
    temperature: number[];
    temperatureLower: number[];
    temperatureUpper: number[];
  }> {
    const years = scenario.years.filter(y => y >= startYear && y <= endYear);
    const nYears = years.length;

    // Get temperature anomaly from scenario
    const temperature = years.map(y => {
      const idx = scenario.years.indexOf(y);
      return idx >= 0 ? scenario.temperatureAnomaly[idx] : 0;
    });

    // Compute uncertainty bounds (±0.5°C)
    const temperatureLower = temperature.map(t => t - 0.5);
    const temperatureUpper = temperature.map(t => t + 0.5);

    return {
      years,
      temperature,
      temperatureLower,
      temperatureUpper,
    };
  }

  /**
   * Compute carbon budget for temperature target
   */
  async computeCarbonBudget(
    targetTemperature: number,
    currentCO2: number = 420
  ): Promise<{
    remainingBudget: number; // GtC
    yearsRemaining: number;
    netZeroYear: number;
  }> {
    // Transient Climate Response to Emissions (TCRE)
    const tcre = 0.45; // °C per 1000 GtC

    // Temperature increase allowed
    const allowedWarming = targetTemperature - 1.0; // Assuming 1°C already occurred

    // Remaining carbon budget
    const remainingBudget = (allowedWarming / tcre) * 1000; // GtC

    // Current emissions rate (GtC/year)
    const currentEmissions = 10;

    // Years remaining at current rate
    const yearsRemaining = remainingBudget / currentEmissions;

    // Net zero year
    const netZeroYear = new Date().getFullYear() + Math.floor(yearsRemaining);

    return {
      remainingBudget,
      yearsRemaining,
      netZeroYear,
    };
  }

  /**
   * Compute committed warming
   * Temperature increase already locked in from past emissions
   */
  async computeCommittedWarming(
    currentCO2: number,
    currentTemperature: number
  ): Promise<{
    equilibriumWarming: number;
    pipelineWarming: number;
    totalCommitted: number;
  }> {
    // Equilibrium warming for current CO2 level
    const co2Ref = 278;
    const ecs = 3.0; // °C per doubling
    const equilibriumWarming = ecs * Math.log2(currentCO2 / co2Ref);

    // Pipeline warming (not yet realized)
    const pipelineWarming = equilibriumWarming - currentTemperature;

    return {
      equilibriumWarming,
      pipelineWarming,
      totalCommitted: equilibriumWarming,
    };
  }

  /**
   * Compute zero-emissions commitment
   * Temperature change after emissions cease
   */
  async computeZeroEmissionsCommitment(
    currentTemperature: number,
    oceanHeatUptake: number
  ): Promise<{
    temperatureChange: number;
    timeScale: number; // years
  }> {
    // After emissions stop, temperature may continue to rise slightly
    // due to ocean heat uptake, or fall due to carbon uptake

    // These effects roughly cancel in most models
    const temperatureChange = 0.0; // °C (approximately zero)
    const timeScale = 50; // years to reach new equilibrium

    return {
      temperatureChange,
      timeScale,
    };
  }
}

/**
 * Two-Layer Energy Balance Model
 * Represents surface and deep ocean heat exchange
 */
export class TwoLayerEnergyBalanceModel extends EnergyBalanceModel {
  private readonly DEEP_OCEAN_HEAT_CAPACITY = 1.0e10; // J m⁻² K⁻¹
  private readonly HEAT_EXCHANGE_COEFF = 0.7; // W m⁻² K⁻¹

  /**
   * Solve two-layer model
   */
  async solveTwoLayer(
    forcing: number,
    years: number = 100
  ): Promise<{
    years: number[];
    surfaceTemp: number[];
    deepTemp: number[];
    heatContent: number[];
  }> {
    const dt = 0.1; // years
    const nSteps = Math.floor(years / dt);

    // Initialize
    const timeArray = await numpy.linspace(0, years, nSteps);
    const Ts = await numpy.zeros(nSteps); // Surface temperature
    const Td = await numpy.zeros(nSteps); // Deep ocean temperature
    const heatContent = await numpy.zeros(nSteps);

    // Initial conditions
    Ts[0] = 288.15;
    Td[0] = 277;

    // Climate feedback parameter
    const lambda = 1.3;

    // Heat capacities
    const Cs = this.OCEAN_HEAT_CAPACITY;
    const Cd = this.DEEP_OCEAN_HEAT_CAPACITY;

    // Heat exchange coefficient
    const gamma = this.HEAT_EXCHANGE_COEFF;

    // Time integration
    for (let i = 1; i < nSteps; i++) {
      // Surface layer
      const dTsdt = (forcing - lambda * (Ts[i-1] - 288.15) -
                     gamma * (Ts[i-1] - Td[i-1])) / Cs;

      // Deep ocean
      const dTddt = gamma * (Ts[i-1] - Td[i-1]) / Cd;

      // Update
      const dtSeconds = dt * 365.25 * 86400;
      Ts[i] = Ts[i-1] + dTsdt * dtSeconds;
      Td[i] = Td[i-1] + dTddt * dtSeconds;

      // Ocean heat content
      heatContent[i] = Cs * (Ts[i] - 288.15) + Cd * (Td[i] - 277);
    }

    return {
      years: await timeArray.tolist(),
      surfaceTemp: await Ts.tolist(),
      deepTemp: await Td.tolist(),
      heatContent: await heatContent.tolist(),
    };
  }
}

/**
 * Latitudinally-Resolved Energy Balance Model
 * 1D model with diffusion between latitude bands
 */
export class LatitudeEnergyBalanceModel extends EnergyBalanceModel {
  private numLatitudes: number;

  constructor(numLatitudes: number = 18) {
    super();
    this.numLatitudes = numLatitudes;
  }

  /**
   * Solve latitudinal energy balance
   */
  async solveLatitudinal(
    forcing: number,
    years: number = 50
  ): Promise<{
    latitudes: number[];
    temperature: number[][];
    iceEdge: number[];
  }> {
    const dt = 0.1; // years
    const nSteps = Math.floor(years / dt);
    const nLat = this.numLatitudes;

    // Latitude grid
    const latitudes = await numpy.linspace(-90, 90, nLat);

    // Initialize temperature
    const temperature: number[][] = [];
    for (let i = 0; i < nSteps; i++) {
      temperature[i] = [];
      for (let j = 0; j < nLat; j++) {
        // Initial condition: cooler at poles
        const lat = -90 + (180 * j) / (nLat - 1);
        temperature[i][j] = 288 - 30 * Math.pow(Math.abs(lat) / 90, 2);
      }
    }

    // Diffusion coefficient
    const D = 0.5; // W m⁻² K⁻¹

    // Time integration
    for (let i = 1; i < nSteps; i++) {
      for (let j = 0; j < nLat; j++) {
        const lat = -90 + (180 * j) / (nLat - 1);
        const latRad = lat * Math.PI / 180;

        // Insolation (latitude-dependent)
        const S = this.SOLAR_CONSTANT / 4 * (1 + 0.482 * (1 - 3 * Math.pow(Math.sin(latRad), 2)));

        // Albedo (ice-albedo feedback)
        const alpha = temperature[i-1][j] < 273 ? 0.6 : 0.3;

        // Outgoing LW
        const OLR = this.STEFAN_BOLTZMANN * Math.pow(temperature[i-1][j], 4);

        // Diffusion
        let diffusion = 0;
        if (j > 0 && j < nLat - 1) {
          diffusion = D * (temperature[i-1][j+1] - 2*temperature[i-1][j] +
                          temperature[i-1][j-1]);
        }

        // Temperature tendency
        const dTdt = (S * (1 - alpha) + forcing - OLR + diffusion) /
                     this.OCEAN_HEAT_CAPACITY;

        // Update
        temperature[i][j] = temperature[i-1][j] + dTdt * (dt * 365.25 * 86400);
      }
    }

    // Find ice edge (where T = 273 K)
    const iceEdge: number[] = [];
    for (let i = 0; i < nSteps; i++) {
      for (let j = 0; j < nLat; j++) {
        if (temperature[i][j] < 273) {
          const lat = -90 + (180 * j) / (nLat - 1);
          iceEdge[i] = Math.abs(lat);
          break;
        }
      }
      if (iceEdge[i] === undefined) {
        iceEdge[i] = 90; // No ice
      }
    }

    return {
      latitudes: await latitudes.tolist(),
      temperature,
      iceEdge,
    };
  }
}

/**
 * Export model factories
 */
export function createEnergyBalanceModel(): EnergyBalanceModel {
  return new EnergyBalanceModel();
}

export function createTwoLayerModel(): TwoLayerEnergyBalanceModel {
  return new TwoLayerEnergyBalanceModel();
}

export function createLatitudeModel(numLatitudes?: number): LatitudeEnergyBalanceModel {
  return new LatitudeEnergyBalanceModel(numLatitudes);
}
