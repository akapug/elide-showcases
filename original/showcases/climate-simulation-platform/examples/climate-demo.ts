/**
 * Climate Simulation Platform - Comprehensive Demo
 *
 * Demonstrates all major features of the climate simulation platform
 * including atmospheric dynamics, ocean circulation, radiative transfer,
 * and climate projections using Elide polyglot capabilities.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import xarray from 'python:xarray';

import { createRadiationCalculator } from '../src/atmosphere/radiation.js';
import { createDynamicsSolver } from '../src/atmosphere/dynamics.js';
import { createOceanModel } from '../src/ocean/circulation.js';
import {
  createEnergyBalanceModel,
  createTwoLayerModel,
  createLatitudeModel,
} from '../src/climate/energy-balance.js';
import { createNetCDFProcessor } from '../src/data/netcdf-processor.js';
import { createTrendAnalyzer, ClimateIndexCalculator } from '../src/analysis/trend-analyzer.js';
import {
  EmissionsScenarioGenerator,
  STANDARD_SCENARIOS,
} from '../src/scenarios/emissions.js';

import type {
  GridConfiguration,
  AtmosphereState,
  OceanState,
  SurfaceConditions,
  RadiativeTransferConfig,
} from '../src/types.js';

/**
 * Main climate simulation demo
 */
async function runClimateSimulationDemo() {
  console.log('='.repeat(80));
  console.log('Climate Simulation Platform - Comprehensive Demo');
  console.log('Powered by Elide Polyglot (TypeScript + Python)');
  console.log('='.repeat(80));
  console.log();

  // Demo 1: Atmospheric Radiation
  await demonstrateRadiativeTransfer();

  // Demo 2: Atmospheric Dynamics
  await demonstrateAtmosphericDynamics();

  // Demo 3: Ocean Circulation
  await demonstrateOceanCirculation();

  // Demo 4: Energy Balance Models
  await demonstrateEnergyBalance();

  // Demo 5: Climate Projections
  await demonstrateClimateProjections();

  // Demo 6: Data Analysis
  await demonstrateDataAnalysis();

  // Demo 7: NetCDF I/O
  await demonstrateNetCDFProcessing();

  console.log();
  console.log('='.repeat(80));
  console.log('Demo Complete!');
  console.log('='.repeat(80));
}

/**
 * Demo 1: Radiative Transfer Calculations
 */
async function demonstrateRadiativeTransfer() {
  console.log('\n📡 Demo 1: Radiative Transfer');
  console.log('-'.repeat(80));

  // Create radiation configuration
  const radConfig: RadiativeTransferConfig = {
    solar: {
      constant: 1361,
      zenithAngle: Array(36).fill(null).map(() =>
        Array(18).fill(null).map(() => Math.random() * Math.PI / 2)
      ),
      dayOfYear: 172, // Summer solstice
      eccentricity: 0.0167,
    },
    composition: {
      co2: 420, // ppmv
      ch4: 1900, // ppbv
      n2o: 330, // ppbv
      o3Profile: Array(20).fill(null).map((_, i) => 0.00001 * Math.exp(-i / 5)),
      h2oProfile: Array(20).fill(null).map((_, i) => 0.01 * Math.exp(-i / 3)),
      aerosolOpticalDepth: Array(36).fill(null).map(() =>
        Array(18).fill(0.1)
      ),
    },
    cloud: {
      opticalDepth: Array(36).fill(null).map(() =>
        Array(18).fill(null).map(() => Array(20).fill(2.0))
      ),
      effectiveRadius: Array(36).fill(null).map(() =>
        Array(18).fill(null).map(() => Array(20).fill(10))
      ),
      liquidWaterPath: Array(36).fill(null).map(() => Array(18).fill(100)),
      iceWaterPath: Array(36).fill(null).map(() => Array(18).fill(50)),
    },
    spectralBands: {
      shortwave: [0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0],
      longwave: [5.0, 7.0, 9.0, 11.0, 13.0, 15.0],
    },
    numStreams: 4,
    quadraturePoints: 16,
  };

  const radiation = createRadiationCalculator(radConfig);

  // Create simplified atmosphere state
  const atmosphere = createSimplifiedAtmosphere();
  const surface = createSimplifiedSurface();

  console.log('Computing solar radiation...');
  const solar = await radiation.computeSolarRadiation(atmosphere, surface);
  console.log(`  ✓ Solar surface flux: ${solar.surfaceFlux[0][0].toFixed(2)} W/m²`);

  console.log('Computing longwave radiation...');
  const longwave = await radiation.computeLongwaveRadiation(atmosphere, surface);
  console.log(`  ✓ Outgoing LW radiation: ${longwave.olr[0][0].toFixed(2)} W/m²`);

  console.log('Computing radiation balance...');
  const balance = await radiation.computeRadiationBalance(atmosphere, surface);
  console.log(`  ✓ TOA net imbalance: ${balance.toa.netImbalance.toFixed(2)} W/m²`);

  const greenhouse = radiation.computeGreenhouseEffect(
    surface.surfaceTemperature,
    longwave.olr
  );
  console.log(`  ✓ Greenhouse effect: ${greenhouse.greenhouseEffect.toFixed(2)} K`);
}

/**
 * Demo 2: Atmospheric Dynamics
 */
async function demonstrateAtmosphericDynamics() {
  console.log('\n🌪️  Demo 2: Atmospheric Dynamics');
  console.log('-'.repeat(80));

  const grid: GridConfiguration = createStandardGrid();
  const dynamics = createDynamicsSolver(grid);

  const atmosphere = createSimplifiedAtmosphere();
  const surface = createSimplifiedSurface();

  console.log('Advancing atmospheric state (timestep: 1800s)...');
  const newState = await dynamics.advanceTimestep(atmosphere, surface, 1800);

  console.log('  ✓ Temperature range: ' +
    `${Math.min(...newState.temperature.flat(3)).toFixed(2)} - ` +
    `${Math.max(...newState.temperature.flat(3)).toFixed(2)} K`);

  console.log('  ✓ Wind speed max: ' +
    `${Math.max(...newState.uWind.flat(3).map((u, i) =>
      Math.sqrt(u * u + newState.vWind.flat(3)[i] * newState.vWind.flat(3)[i])
    )).toFixed(2)} m/s`);

  console.log('Computing diagnostics...');
  const diagnostics = await dynamics.computeDiagnostics(newState);

  console.log(`  ✓ Hadley cell strength: ${diagnostics.circulation.hadleyCell.strength.toExponential(2)} kg/s`);
  console.log(`  ✓ Kinetic energy: ${diagnostics.energy.kineticEnergy.toExponential(2)} J/m²`);
  console.log(`  ✓ Polar jet latitude: ${diagnostics.jets.polar.latitude[0]}° N`);
}

/**
 * Demo 3: Ocean Circulation
 */
async function demonstrateOceanCirculation() {
  console.log('\n🌊 Demo 3: Ocean Circulation');
  console.log('-'.repeat(80));

  const grid = createStandardGrid();
  const ocean = createOceanModel(grid);

  const oceanState = createSimplifiedOcean();
  const surface = createSimplifiedSurface();

  // Wind stress forcing
  const forcing = {
    windStressX: Array(36).fill(null).map((_, i) =>
      Array(18).fill(null).map((_, j) =>
        0.1 * Math.cos(2 * Math.PI * j / 18)
      )
    ),
    windStressY: Array(36).fill(null).map(() => Array(18).fill(0)),
    heatFlux: Array(36).fill(null).map(() => Array(18).fill(100)),
    freshwaterFlux: Array(36).fill(null).map(() => Array(18).fill(0.0001)),
  };

  console.log('Advancing ocean state (timestep: 3600s)...');
  const newOceanState = await ocean.advanceTimestep(oceanState, surface, forcing, 3600);

  console.log('  ✓ SST range: ' +
    `${Math.min(...newOceanState.temperature.map(lon => lon[0][0])).toFixed(2)} - ` +
    `${Math.max(...newOceanState.temperature.map(lon => lon[0][0])).toFixed(2)} °C`);

  console.log('  ✓ Mixed layer depth: ' +
    `${(newOceanState.mixedLayerDepth.flat().reduce((a, b) => a + b, 0) /
      newOceanState.mixedLayerDepth.flat().length).toFixed(1)} m`);

  console.log('Computing ocean diagnostics...');
  const oceanDiag = await ocean.computeDiagnostics(newOceanState);

  console.log(`  ✓ AMOC strength: ${oceanDiag.moc.maximumAtlantic} Sv`);
  console.log(`  ✓ Global heat transport: ${oceanDiag.heatTransport.global} PW`);
  console.log(`  ✓ ACC strength: ${oceanDiag.gyres.antarcticCircumpolar} Sv`);
}

/**
 * Demo 4: Energy Balance Models
 */
async function demonstrateEnergyBalance() {
  console.log('\n⚖️  Demo 4: Energy Balance Models');
  console.log('-'.repeat(80));

  // Simple EBM
  const ebm = createEnergyBalanceModel();

  console.log('Computing equilibrium climate...');
  const forcings = STANDARD_SCENARIOS.RCP45;
  const climateForcings = EmissionsScenarioGenerator.scenarioToForcings(forcings, 2050);

  const equilibrium = await ebm.computeEquilibrium(climateForcings);

  console.log(`  ✓ Equilibrium temperature: ${equilibrium.temperature.surface.toFixed(2)} K`);
  console.log(`  ✓ Climate sensitivity: ${equilibrium.sensitivity.equilibrium.toFixed(2)} K per 2×CO₂`);
  console.log(`  ✓ Water vapor feedback: ${equilibrium.feedbacks.waterVapor.toFixed(2)} W/m²/K`);

  // Two-layer model
  console.log('\nRunning two-layer transient model...');
  const twoLayer = createTwoLayerModel();
  const transient = await twoLayer.solveTwoLayer(3.7, 100);

  console.log(`  ✓ Surface warming after 100 years: ${(transient.surfaceTemp[transient.surfaceTemp.length - 1] - 288.15).toFixed(2)} K`);
  console.log(`  ✓ Deep ocean warming: ${(transient.deepTemp[transient.deepTemp.length - 1] - 277).toFixed(2)} K`);

  // Latitudinal model
  console.log('\nRunning latitudinal energy balance model...');
  const latModel = createLatitudeModel(18);
  const latResult = await latModel.solveLatitudinal(3.7, 50);

  console.log(`  ✓ Tropical temperature: ${latResult.temperature[latResult.temperature.length - 1][9].toFixed(2)} K`);
  console.log(`  ✓ Polar temperature: ${latResult.temperature[latResult.temperature.length - 1][0].toFixed(2)} K`);
  console.log(`  ✓ Ice edge latitude: ${latResult.iceEdge[latResult.iceEdge.length - 1].toFixed(1)}°`);
}

/**
 * Demo 5: Climate Projections
 */
async function demonstrateClimateProjections() {
  console.log('\n📈 Demo 5: Climate Projections');
  console.log('-'.repeat(80));

  const ebm = createEnergyBalanceModel();

  console.log('Comparing emission scenarios...');

  for (const [name, scenario] of Object.entries({
    'RCP 2.6': STANDARD_SCENARIOS.RCP26,
    'RCP 4.5': STANDARD_SCENARIOS.RCP45,
    'RCP 8.5': STANDARD_SCENARIOS.RCP85,
  })) {
    const projection = await ebm.projectTemperature(scenario, 2020, 2100);
    const warming2100 = projection.temperature[projection.temperature.length - 1];

    console.log(`  ${name}: ${warming2100.toFixed(2)} K warming by 2100`);
  }

  console.log('\nComputing carbon budgets...');
  const budget15 = await ebm.computeCarbonBudget(1.5, 420);
  const budget20 = await ebm.computeCarbonBudget(2.0, 420);

  console.log(`  1.5°C target: ${budget15.remainingBudget.toFixed(0)} GtC remaining`);
  console.log(`    → Net zero by ${budget15.netZeroYear}`);
  console.log(`  2.0°C target: ${budget20.remainingBudget.toFixed(0)} GtC remaining`);
  console.log(`    → Net zero by ${budget20.netZeroYear}`);

  console.log('\nComputing committed warming...');
  const committed = await ebm.computeCommittedWarming(420, 1.2);
  console.log(`  ✓ Equilibrium warming: ${committed.equilibriumWarming.toFixed(2)} K`);
  console.log(`  ✓ Pipeline warming: ${committed.pipelineWarming.toFixed(2)} K`);
}

/**
 * Demo 6: Climate Data Analysis
 */
async function demonstrateDataAnalysis() {
  console.log('\n📊 Demo 6: Climate Data Analysis');
  console.log('-'.repeat(80));

  const analyzer = createTrendAnalyzer();

  // Generate synthetic temperature data
  const years = Array.from({ length: 100 }, (_, i) => 1920 + i);
  const temperature = years.map((y, i) => {
    const trend = 0.01 * i; // Linear warming
    const noise = (Math.random() - 0.5) * 0.3;
    const cycle = 0.2 * Math.sin(2 * Math.PI * i / 10); // Decadal variability
    return 14.5 + trend + noise + cycle;
  });

  console.log('Computing linear trend...');
  const trend = await analyzer.computeLinearTrend(years, temperature, '°C');

  console.log(`  ✓ Trend: ${(trend.trend.slope * 100).toFixed(3)} °C/century`);
  console.log(`  ✓ R²: ${trend.statistics.rSquared.toFixed(3)}`);
  console.log(`  ✓ P-value: ${trend.statistics.pValue.toExponential(2)}`);
  console.log(`  ✓ Decadal change: ${trend.change.decadalChange.toFixed(3)} °C/decade`);

  console.log('\nPerforming Mann-Kendall test...');
  const mkTest = await analyzer.mannKendallTest(temperature);
  console.log(`  ✓ Trend: ${mkTest.trend}`);
  console.log(`  ✓ Tau: ${mkTest.tau.toFixed(3)}`);
  console.log(`  ✓ P-value: ${mkTest.pValue.toFixed(4)}`);

  console.log('\nComputing power spectrum...');
  const spectrum = await analyzer.computePowerSpectrum(years, temperature);
  console.log(`  ✓ Found ${spectrum.significantPeaks.length} significant peaks`);

  if (spectrum.significantPeaks.length > 0) {
    const peak = spectrum.significantPeaks[0];
    console.log(`  ✓ Dominant period: ${peak.period.toFixed(1)} years`);
  }

  console.log('\nDetecting change points...');
  const changePoints = await analyzer.detectChangePoints(years, temperature, 10);
  console.log(`  ✓ Detected ${changePoints.changePoints.length} change points`);
  console.log(`  ✓ Number of segments: ${changePoints.segments.length}`);
}

/**
 * Demo 7: NetCDF Data Processing
 */
async function demonstrateNetCDFProcessing() {
  console.log('\n💾 Demo 7: NetCDF Data Processing');
  console.log('-'.repeat(80));

  const processor = createNetCDFProcessor();

  // Create sample dataset
  const grid = {
    lon: Array.from({ length: 36 }, (_, i) => i * 10),
    lat: Array.from({ length: 18 }, (_, i) => -90 + i * 10),
    lev: [1000, 850, 700, 500, 300, 200, 100],
  };

  const atmosphereStates = [
    createSimplifiedAtmosphere(),
    createSimplifiedAtmosphere(),
  ];

  console.log('Converting atmosphere to NetCDF dataset...');
  const dataset = await processor.atmosphereToNetCDF(atmosphereStates, grid);

  console.log(`  ✓ Dimensions: ${Object.keys(dataset.dimensions).join(', ')}`);
  console.log(`  ✓ Variables: ${Object.keys(dataset.variables).length}`);
  console.log(`  ✓ Time steps: ${dataset.dimensions.time}`);

  console.log('\nComputing spatial averages...');
  const globalMean = await processor.computeWeightedMean(dataset, 'temperature');
  console.log(`  ✓ Global mean temperature: ${globalMean[0].toFixed(2)} K`);

  console.log('\nComputing climatology...');
  const climatology = await processor.computeClimatology(dataset, 'temperature');
  console.log(`  ✓ Climatology computed for ${climatology.metadata.name}`);

  console.log('\nExtracting time series...');
  const timeSeries = await processor.extractTimeSeries(dataset, 'temperature', 180, 0, 1000);
  console.log(`  ✓ Extracted ${timeSeries.values.length} time steps`);
}

/**
 * Helper: Create simplified atmosphere state
 */
function createSimplifiedAtmosphere(): AtmosphereState {
  const nLon = 36;
  const nLat = 18;
  const nLev = 20;

  return {
    temperature: Array(nLon).fill(null).map((_, i) =>
      Array(nLat).fill(null).map((_, j) =>
        Array(nLev).fill(null).map((_, k) =>
          288 - 30 * Math.pow(Math.abs(j - 9) / 9, 2) - k * 6.5 / nLev
        )
      )
    ),
    pressure: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nLev).fill(null).map((_, k) =>
          1000 - k * 900 / nLev
        )
      )
    ),
    uWind: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map((_, j) =>
        Array(nLev).fill(null).map(() =>
          20 * Math.sin(2 * Math.PI * j / nLat)
        )
      )
    ),
    vWind: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nLev).fill(0)
      )
    ),
    wWind: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nLev).fill(0)
      )
    ),
    specificHumidity: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nLev).fill(null).map((_, k) =>
          0.01 * Math.exp(-k / 5)
        )
      )
    ),
    relativeHumidity: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nLev).fill(0.6)
      )
    ),
    cloudFraction: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nLev).fill(0.3)
      )
    ),
    cloudWaterContent: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nLev).fill(0.0001)
      )
    ),
    cloudIceContent: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nLev).fill(0.00005)
      )
    ),
    geopotentialHeight: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nLev).fill(null).map((_, k) =>
          k * 1000
        )
      )
    ),
    airDensity: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nLev).fill(null).map((_, k) =>
          1.225 * Math.exp(-k / 8)
        )
      )
    ),
    timestamp: new Date(),
  };
}

/**
 * Helper: Create simplified surface conditions
 */
function createSimplifiedSurface(): SurfaceConditions {
  const nLon = 36;
  const nLat = 18;

  return {
    surfaceTemperature: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map((_, j) =>
        288 - 30 * Math.pow(Math.abs(j - 9) / 9, 2)
      )
    ),
    surfacePressure: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(1013)
    ),
    sensibleHeatFlux: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(20)
    ),
    latentHeatFlux: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(80)
    ),
    shortwareDownward: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(200)
    ),
    shortwaveUpward: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(60)
    ),
    longwaveDownward: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(300)
    ),
    longwaveUpward: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(400)
    ),
    netRadiation: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(100)
    ),
    precipitation: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(2.5)
    ),
    evaporation: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(2.0)
    ),
    albedo: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(0.3)
    ),
    emissivity: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(0.95)
    ),
    roughnessLength: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(0.1)
    ),
    soilMoisture: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(3).fill(0.3)
      )
    ),
    soilTemperature: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(3).fill(285)
      )
    ),
    snowDepth: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(0)
    ),
    vegetationFraction: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(0.5)
    ),
    elevation: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(0)
    ),
    landSeaMask: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(0.5)
    ),
  };
}

/**
 * Helper: Create simplified ocean state
 */
function createSimplifiedOcean(): OceanState {
  const nLon = 36;
  const nLat = 18;
  const nDepth = 30;

  return {
    temperature: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map((_, j) =>
        Array(nDepth).fill(null).map((_, k) =>
          20 - 15 * Math.pow(Math.abs(j - 9) / 9, 2) - k * 0.5
        )
      )
    ),
    salinity: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nDepth).fill(35)
      )
    ),
    uCurrent: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nDepth).fill(0.1)
      )
    ),
    vCurrent: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nDepth).fill(0.05)
      )
    ),
    wCurrent: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nDepth).fill(0.001)
      )
    ),
    density: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(null).map(() =>
        Array(nDepth).fill(1025)
      )
    ),
    sealevel: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(0)
    ),
    mixedLayerDepth: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(50)
    ),
    seaIceFraction: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(0)
    ),
    seaIceThickness: Array(nLon).fill(null).map(() =>
      Array(nLat).fill(0)
    ),
    timestamp: new Date(),
  };
}

/**
 * Helper: Create standard grid configuration
 */
function createStandardGrid(): GridConfiguration {
  return {
    longitude: {
      start: 0,
      end: 360,
      resolution: 10,
      points: 36,
    },
    latitude: {
      start: -90,
      end: 90,
      resolution: 10,
      points: 18,
    },
    vertical: {
      levels: [1000, 925, 850, 700, 500, 400, 300, 200, 100, 50, 30, 10],
      units: 'hPa',
      count: 12,
    },
    time: {
      start: new Date('2020-01-01'),
      end: new Date('2021-01-01'),
      step: 3600,
      units: 'seconds',
      totalSteps: 8760,
    },
  };
}

// Run the demo
runClimateSimulationDemo().catch(console.error);
