/**
 * Climate Simulation Platform - Type Definitions
 *
 * Comprehensive type system for climate modeling, atmospheric dynamics,
 * ocean circulation, and climate data analysis.
 *
 * Demonstrates Elide's polyglot capabilities with Python scientific libraries.
 */

// @ts-ignore
import type numpy from 'python:numpy';

/**
 * 3D Grid Configuration
 * Defines the spatial and temporal discretization of the climate model
 */
export interface GridConfiguration {
  // Longitude grid (degrees)
  longitude: {
    start: number;
    end: number;
    resolution: number;
    points: number;
  };

  // Latitude grid (degrees)
  latitude: {
    start: number;
    end: number;
    resolution: number;
    points: number;
  };

  // Vertical levels (pressure or height)
  vertical: {
    levels: number[];
    units: 'hPa' | 'meters' | 'sigma';
    count: number;
  };

  // Time configuration
  time: {
    start: Date;
    end: Date;
    step: number;
    units: 'seconds' | 'minutes' | 'hours' | 'days';
    totalSteps: number;
  };
}

/**
 * Atmospheric State Variables
 * Represents the complete state of the atmosphere at a given time
 */
export interface AtmosphereState {
  // Temperature field (K)
  temperature: number[][][]; // [lon][lat][level]

  // Pressure field (hPa)
  pressure: number[][][];

  // Wind components (m/s)
  uWind: number[][][]; // Zonal (east-west)
  vWind: number[][][]; // Meridional (north-south)
  wWind: number[][][]; // Vertical

  // Humidity (kg/kg)
  specificHumidity: number[][][];
  relativeHumidity: number[][][];

  // Cloud properties
  cloudFraction: number[][][];
  cloudWaterContent: number[][][];
  cloudIceContent: number[][][];

  // Geopotential height (m)
  geopotentialHeight: number[][][];

  // Density (kg/m³)
  airDensity: number[][][];

  // Time stamp
  timestamp: Date;
}

/**
 * Ocean State Variables
 * Complete state of ocean circulation and thermodynamics
 */
export interface OceanState {
  // Temperature (°C or K)
  temperature: number[][][]; // [lon][lat][depth]

  // Salinity (PSU - Practical Salinity Units)
  salinity: number[][][];

  // Current velocities (m/s)
  uCurrent: number[][][]; // Zonal
  vCurrent: number[][][]; // Meridional
  wCurrent: number[][][]; // Vertical

  // Density (kg/m³)
  density: number[][][];

  // Sea surface height (m)
  sealevel: number[][];

  // Mixed layer depth (m)
  mixedLayerDepth: number[][];

  // Ice coverage (fraction 0-1)
  seaIceFraction: number[][];
  seaIceThickness: number[][];

  // Timestamp
  timestamp: Date;
}

/**
 * Surface Boundary Conditions
 * Interface between atmosphere, ocean, and land
 */
export interface SurfaceConditions {
  // Surface temperature (K)
  surfaceTemperature: number[][];

  // Surface pressure (hPa)
  surfacePressure: number[][];

  // Surface fluxes (W/m²)
  sensibleHeatFlux: number[][];
  latentHeatFlux: number[][];

  // Radiation fluxes (W/m²)
  shortwareDownward: number[][];
  shortwaveUpward: number[][];
  longwaveDownward: number[][];
  longwaveUpward: number[][];
  netRadiation: number[][];

  // Precipitation (mm/day or kg/m²/s)
  precipitation: number[][];
  evaporation: number[][];

  // Surface properties
  albedo: number[][];
  emissivity: number[][];
  roughnessLength: number[][];

  // Land surface
  soilMoisture: number[][][]; // [lon][lat][layer]
  soilTemperature: number[][][];
  snowDepth: number[][];
  vegetationFraction: number[][];

  // Topography
  elevation: number[][];
  landSeaMask: number[][]; // 0=ocean, 1=land
}

/**
 * Radiative Transfer Parameters
 * Configuration for atmospheric radiation calculations
 */
export interface RadiativeTransferConfig {
  // Solar parameters
  solar: {
    constant: number; // W/m² (typically 1361)
    zenithAngle: number[][]; // [lon][lat]
    dayOfYear: number;
    eccentricity: number;
  };

  // Atmospheric composition (ppmv or mixing ratios)
  composition: {
    co2: number;
    ch4: number;
    n2o: number;
    o3Profile: number[]; // By vertical level
    h2oProfile: number[]; // By vertical level
    aerosolOpticalDepth: number[][];
  };

  // Cloud radiative properties
  cloud: {
    opticalDepth: number[][][];
    effectiveRadius: number[][][]; // microns
    liquidWaterPath: number[][];
    iceWaterPath: number[][];
  };

  // Spectral bands for radiation calculation
  spectralBands: {
    shortwave: number[]; // Band centers (wavelength in microns)
    longwave: number[];
  };

  // Numerical parameters
  numStreams: number; // For discrete ordinates method
  quadraturePoints: number;
}

/**
 * Climate Forcing Agents
 * External and internal forcings that drive climate change
 */
export interface ClimateForcings {
  // Greenhouse gas concentrations
  greenhouseGases: {
    co2: number; // ppmv
    ch4: number; // ppbv
    n2o: number; // ppbv
    cfc11: number;
    cfc12: number;
    hcfc22: number;
  };

  // Aerosol forcing (W/m²)
  aerosols: {
    sulfate: number[][];
    blackCarbon: number[][];
    organicCarbon: number[][];
    dust: number[][];
    seaSalt: number[][];
    totalOpticalDepth: number[][];
  };

  // Solar forcing
  solar: {
    totalIrradiance: number; // W/m²
    spectralVariation: number[];
    cycles: boolean;
  };

  // Volcanic forcing
  volcanic: {
    stratosphericAOD: number; // Aerosol Optical Depth
    effectiveRadius: number;
    altitude: number;
  };

  // Land use changes
  landUse: {
    forestCover: number[][];
    cropland: number[][];
    urban: number[][];
    albedoChange: number[][];
  };

  // Orbital parameters (Milankovitch cycles)
  orbital: {
    eccentricity: number;
    obliquity: number; // degrees
    precession: number; // degrees
  };
}

/**
 * Emissions Scenario
 * Future greenhouse gas and aerosol emissions pathways
 */
export interface EmissionsScenario {
  // Scenario metadata
  name: string;
  type: 'RCP' | 'SSP' | 'Custom';
  id: string; // e.g., 'RCP4.5', 'SSP2-4.5'
  description: string;

  // Time series data
  years: number[];

  // CO2 emissions (GtC/year)
  co2Emissions: number[];
  co2Concentration: number[]; // ppmv

  // CH4 emissions (MtCH4/year)
  ch4Emissions: number[];
  ch4Concentration: number[]; // ppbv

  // N2O emissions (MtN2O-N/year)
  n2oEmissions: number[];
  n2oConcentration: number[]; // ppbv

  // Aerosol emissions by type (Tg/year)
  aerosolEmissions: {
    so2: number[];
    bc: number[];
    oc: number[];
    nh3: number[];
    nox: number[];
    co: number[];
    voc: number[];
  };

  // Radiative forcing (W/m²)
  radiativeForcingTimeseries: number[];

  // Temperature projection
  temperatureAnomaly: number[]; // K relative to baseline

  // Socioeconomic assumptions
  socioeconomic: {
    population: number[]; // billions
    gdp: number[]; // trillion USD
    energyUse: number[]; // EJ/year
  };
}

/**
 * Climate Model Configuration
 * Top-level configuration for the climate simulation
 */
export interface ClimateModelConfig {
  // Model identification
  name: string;
  version: string;
  resolution: 'coarse' | 'medium' | 'high' | 'ultra-high';

  // Grid configuration
  grid: GridConfiguration;

  // Component models
  components: {
    atmosphere: boolean;
    ocean: boolean;
    seaIce: boolean;
    landSurface: boolean;
    vegetation: boolean;
    carbonCycle: boolean;
    chemistry: boolean;
  };

  // Physics options
  physics: {
    // Dynamics
    dynamicalCore: 'spectral' | 'finite-volume' | 'finite-difference';
    advectionScheme: string;
    diffusionScheme: string;

    // Radiation
    radiationScheme: 'RRTMG' | 'RRTM' | 'CAM' | 'Custom';
    radiationTimeStep: number; // seconds

    // Convection
    convectionScheme: 'Tiedtke' | 'KainFritsch' | 'Betts-Miller' | 'Zhang-McFarlane';

    // Clouds
    cloudScheme: string;
    microphysics: string;

    // Boundary layer
    pblScheme: string;

    // Ocean
    oceanMixing: string;
    eddyParameterization: string;
  };

  // Numerical parameters
  numerics: {
    timeStep: number; // seconds
    cflCriterion: number;
    diffusionCoefficient: number;
    viscosity: number;
  };

  // Initial conditions
  initialization: {
    type: 'idealized' | 'reanalysis' | 'spinup';
    dataSource?: string;
    spinupYears?: number;
  };
}

/**
 * Climate Data Array
 * Wrapper for multi-dimensional climate data with metadata
 */
export interface ClimateDataArray {
  // Data
  values: number[] | number[][] | number[][][] | number[][][][];

  // Dimensions
  dimensions: string[]; // e.g., ['time', 'lat', 'lon', 'level']
  shape: number[];

  // Coordinates
  coordinates: {
    [key: string]: number[] | Date[];
  };

  // Metadata
  metadata: {
    name: string;
    longName: string;
    units: string;
    standardName?: string; // CF conventions
    description?: string;
  };

  // Attributes
  attributes: {
    [key: string]: string | number | boolean;
  };
}

/**
 * NetCDF Dataset
 * Complete NetCDF climate dataset structure
 */
export interface NetCDFDataset {
  // Global attributes
  globalAttributes: {
    title: string;
    institution: string;
    source: string;
    history: string;
    references: string;
    comment: string;
    conventions: string; // e.g., 'CF-1.8'
    creationDate: Date;
  };

  // Dimensions
  dimensions: {
    [name: string]: number;
  };

  // Variables
  variables: {
    [name: string]: ClimateDataArray;
  };

  // Coordinate variables
  coordinates: {
    time?: Date[];
    lat?: number[];
    lon?: number[];
    level?: number[];
    depth?: number[];
  };
}

/**
 * Climate Trend Analysis Result
 * Statistical analysis of climate trends
 */
export interface TrendAnalysisResult {
  // Linear trend
  trend: {
    slope: number;
    slopeError: number;
    intercept: number;
    interceptError: number;
    units: string;
  };

  // Statistical significance
  statistics: {
    rSquared: number;
    pValue: number;
    tStatistic: number;
    degreesOfFreedom: number;
    confidence95: [number, number];
    confidence99: [number, number];
  };

  // Time series properties
  timeSeries: {
    mean: number;
    median: number;
    standardDeviation: number;
    variance: number;
    minimum: number;
    maximum: number;
    range: number;
  };

  // Autocorrelation
  autocorrelation: {
    lag1: number;
    effectiveSampleSize: number;
    decorrelationTime: number;
  };

  // Anomalies
  anomalies: {
    values: number[];
    baseline: number;
    baselinePeriod: [number, number];
  };

  // Change metrics
  change: {
    totalChange: number;
    percentChange: number;
    decadalChange: number;
    accelerationRate: number;
  };
}

/**
 * Energy Balance Model Result
 * Output from energy balance calculations
 */
export interface EnergyBalanceResult {
  // Global energy budget (W/m²)
  global: {
    incomingSolar: number;
    reflectedSolar: number;
    absorbedSolar: number;
    outgoingLongwave: number;
    netRadiation: number;
    imbalance: number;
  };

  // Component fluxes
  fluxes: {
    surfaceShortwave: number;
    surfaceLongwave: number;
    atmosphericWindow: number;
    latentHeat: number;
    sensibleHeat: number;
  };

  // Temperature response
  temperature: {
    surface: number;
    atmosphere: number;
    stratosphere: number;
    oceanMixedLayer: number;
    deepOcean: number;
  };

  // Climate sensitivity
  sensitivity: {
    equilibrium: number; // K per doubling CO2
    transient: number; // K per doubling CO2
    feedbackParameter: number; // W/m²/K
  };

  // Feedbacks (W/m²/K)
  feedbacks: {
    planck: number; // Blackbody radiation
    waterVapor: number;
    lapseRate: number;
    albedo: number;
    cloud: number;
    total: number;
  };
}

/**
 * Ocean Circulation Diagnostics
 * Analysis of ocean circulation patterns
 */
export interface OceanCirculationDiagnostics {
  // Meridional Overturning Circulation
  moc: {
    streamfunction: number[][]; // [lat][depth] in Sv
    maximumAtlantic: number;
    maximumPacific: number;
    maximumIndian: number;
  };

  // Heat transport (PW = Petawatts)
  heatTransport: {
    meridional: number[]; // By latitude
    zonal: number[]; // By longitude
    global: number;
    atlantic: number;
    pacific: number;
    indian: number;
  };

  // Gyre circulation
  gyres: {
    northAtlantic: number; // Sv
    northPacific: number;
    southAtlantic: number;
    southPacific: number;
    antarcticCircumpolar: number;
  };

  // Mixed layer
  mixedLayer: {
    meanDepth: number;
    maxDepth: number;
    minDepth: number;
    seasonalVariation: number;
  };

  // Upwelling/downwelling (m/day)
  verticalVelocity: {
    tropicalUpwelling: number;
    polarDownwelling: number;
    coastalUpwelling: number;
  };
}

/**
 * Atmospheric Dynamics Diagnostics
 * Analysis of atmospheric circulation and dynamics
 */
export interface AtmosphereDynamicsDiagnostics {
  // Large-scale circulation
  circulation: {
    hadleyCell: {
      strength: number; // kg/s
      northernEdge: number; // degrees latitude
      southernEdge: number;
    };
    ferrelCell: {
      strength: number;
    };
    polarCell: {
      strength: number;
    };
  };

  // Jets
  jets: {
    subtropical: {
      latitude: number[];
      speed: number[];
      altitude: number[];
    };
    polar: {
      latitude: number[];
      speed: number[];
      altitude: number[];
    };
  };

  // Waves
  waves: {
    rossby: {
      amplitude: number;
      wavelength: number;
      phaseSpeed: number;
    };
    gravity: {
      amplitude: number;
      frequency: number;
    };
  };

  // Vorticity (s⁻¹)
  vorticity: {
    relative: number[][][];
    absolute: number[][][];
    potential: number[][][];
  };

  // Energy
  energy: {
    kineticEnergy: number; // J/m²
    potentialEnergy: number;
    availablePotentialEnergy: number;
    enstrophy: number;
  };
}

/**
 * Simulation Performance Metrics
 * Performance and computational efficiency tracking
 */
export interface SimulationPerformance {
  // Timing
  timing: {
    totalWallTime: number; // seconds
    cpuTime: number;
    simulatedTime: number; // simulated years/days
    speedupFactor: number; // simulated/wall time ratio
  };

  // Component timings (seconds)
  componentTiming: {
    dynamics: number;
    physics: number;
    radiation: number;
    ocean: number;
    coupling: number;
    io: number;
  };

  // Computational resources
  resources: {
    cpuCores: number;
    memoryUsed: number; // GB
    memoryPeak: number;
    diskIO: number; // GB
  };

  // Efficiency metrics
  efficiency: {
    parallelEfficiency: number; // 0-1
    scalingFactor: number;
    throughput: number; // simulated years per day
    costPerSimulatedYear: number; // CPU-hours
  };

  // Numerical stability
  stability: {
    maxCFL: number;
    minTimestep: number;
    maxTimestep: number;
    convergenceIterations: number;
  };
}

/**
 * Model Validation Metrics
 * Comparison with observations and reanalysis
 */
export interface ValidationMetrics {
  // Bias
  bias: {
    global: number;
    tropics: number;
    midlatitudes: number;
    polar: number;
    ocean: number;
    land: number;
  };

  // Root Mean Square Error
  rmse: {
    global: number;
    regional: { [region: string]: number };
    seasonal: number[];
  };

  // Correlation
  correlation: {
    spatial: number;
    temporal: number;
    patternCorrelation: number;
  };

  // Skill scores
  skillScores: {
    nashSutcliffe: number;
    taylorSkillScore: number;
    meanAbsoluteError: number;
  };

  // Climate indices
  climateIndices: {
    nino34: number;
    nao: number;
    amo: number;
    pdo: number;
    iod: number;
  };
}

/**
 * Constants and Physical Parameters
 */
export const PHYSICAL_CONSTANTS = {
  // Universal constants
  STEFAN_BOLTZMANN: 5.670374419e-8, // W m⁻² K⁻⁴
  BOLTZMANN: 1.380649e-23, // J K⁻¹
  PLANCK: 6.62607015e-34, // J s
  SPEED_OF_LIGHT: 299792458, // m s⁻¹

  // Earth parameters
  EARTH_RADIUS: 6371000, // m
  EARTH_MASS: 5.972e24, // kg
  EARTH_ROTATION_RATE: 7.2921e-5, // rad s⁻¹
  EARTH_GRAVITY: 9.80665, // m s⁻²

  // Atmospheric parameters
  GAS_CONSTANT_DRY_AIR: 287.05, // J kg⁻¹ K⁻¹
  GAS_CONSTANT_WATER_VAPOR: 461.5, // J kg⁻¹ K⁻¹
  SPECIFIC_HEAT_DRY_AIR_CP: 1005, // J kg⁻¹ K⁻¹
  SPECIFIC_HEAT_DRY_AIR_CV: 718, // J kg⁻¹ K⁻¹
  LATENT_HEAT_VAPORIZATION: 2.5e6, // J kg⁻¹
  LATENT_HEAT_FUSION: 3.34e5, // J kg⁻¹

  // Ocean parameters
  OCEAN_DENSITY: 1025, // kg m⁻³
  OCEAN_SPECIFIC_HEAT: 3985, // J kg⁻¹ K⁻¹
  SEAWATER_FREEZING_POINT: 271.35, // K

  // Solar parameters
  SOLAR_CONSTANT: 1361, // W m⁻²
  ASTRONOMICAL_UNIT: 1.496e11, // m

  // Reference values
  REFERENCE_PRESSURE: 101325, // Pa
  REFERENCE_TEMPERATURE: 288.15, // K
  STANDARD_ATMOSPHERE: 101325, // Pa
} as const;

export type PhysicalConstant = keyof typeof PHYSICAL_CONSTANTS;
