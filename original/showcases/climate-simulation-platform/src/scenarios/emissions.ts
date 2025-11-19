/**
 * Emissions Scenarios Module
 *
 * Implements RCP and SSP emissions scenarios for climate projections.
 * Based on IPCC scenarios for future greenhouse gas concentrations.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import type { EmissionsScenario, ClimateForcings } from '../types.js';

/**
 * Emissions Scenario Generator
 * Creates and manages emissions pathways for climate simulations
 */
export class EmissionsScenarioGenerator {
  /**
   * Generate RCP 2.6 (Strong mitigation) scenario
   */
  static generateRCP26(): EmissionsScenario {
    const years = Array.from({ length: 181 }, (_, i) => 2000 + i);

    // CO2 concentration pathway (ppmv)
    const co2Concentration = years.map(y => {
      if (y <= 2020) {
        return 368 + (y - 2000) * 2.0; // Historical growth
      } else if (y <= 2050) {
        return 410 + (y - 2020) * 0.5; // Slow growth
      } else if (y <= 2100) {
        return 425 + (y - 2050) * 0.1; // Peak and decline
      } else {
        return 430 + (y - 2100) * -0.2; // Decline
      }
    });

    // CO2 emissions (GtC/year)
    const co2Emissions = years.map(y => {
      if (y <= 2020) {
        return 7.0 + (y - 2000) * 0.3;
      } else if (y <= 2050) {
        return 13.0 - (y - 2020) * 0.4; // Rapid decline
      } else {
        return 1.0 - (y - 2050) * 0.02; // Net negative
      }
    });

    // CH4 concentration (ppbv)
    const ch4Concentration = years.map(y => {
      if (y <= 2020) {
        return 1750 + (y - 2000) * 10;
      } else {
        return 1950 - (y - 2020) * 5; // Decline
      }
    });

    // Radiative forcing (W/m²)
    const radiativeForcingTimeseries = years.map(y => {
      const co2 = co2Concentration[years.indexOf(y)];
      const forcing = 5.35 * Math.log(co2 / 278); // Simplified
      return forcing + 0.5; // Add other GHGs
    });

    // Temperature projection (K above pre-industrial)
    const temperatureAnomaly = radiativeForcingTimeseries.map(f => f / 3.7 * 3.0 * 0.6);

    return {
      name: 'RCP 2.6',
      type: 'RCP',
      id: 'RCP2.6',
      description: 'Strong mitigation scenario - Peak and decline pathway',
      years,
      co2Emissions,
      co2Concentration,
      ch4Emissions: years.map(() => 150), // Simplified
      ch4Concentration,
      n2oEmissions: years.map(() => 5),
      n2oConcentration: years.map(y => 320 + (y - 2000) * 0.5),
      aerosolEmissions: {
        so2: years.map(y => Math.max(10, 50 - (y - 2000) * 0.5)),
        bc: years.map(() => 5),
        oc: years.map(() => 15),
        nh3: years.map(() => 40),
        nox: years.map(() => 80),
        co: years.map(() => 400),
        voc: years.map(() => 120),
      },
      radiativeForcingTimeseries,
      temperatureAnomaly,
      socioeconomic: {
        population: years.map(y => 6.0 + (y - 2000) * 0.05),
        gdp: years.map(y => 50 + (y - 2000) * 2),
        energyUse: years.map(y => 400 + (y - 2000) * 10),
      },
    };
  }

  /**
   * Generate RCP 4.5 (Moderate mitigation) scenario
   */
  static generateRCP45(): EmissionsScenario {
    const years = Array.from({ length: 181 }, (_, i) => 2000 + i);

    const co2Concentration = years.map(y => {
      if (y <= 2020) {
        return 368 + (y - 2000) * 2.0;
      } else if (y <= 2060) {
        return 410 + (y - 2020) * 1.5; // Moderate growth
      } else {
        return 470 + (y - 2060) * 0.5; // Stabilization
      }
    });

    const co2Emissions = years.map(y => {
      if (y <= 2020) {
        return 7.0 + (y - 2000) * 0.3;
      } else if (y <= 2080) {
        return 13.0 - (y - 2020) * 0.15; // Gradual decline
      } else {
        return 4.0 - (y - 2080) * 0.05;
      }
    });

    const ch4Concentration = years.map(y => {
      if (y <= 2020) {
        return 1750 + (y - 2000) * 10;
      } else {
        return 1950 + (y - 2020) * 2; // Slow growth
      }
    });

    const radiativeForcingTimeseries = years.map(y => {
      const co2 = co2Concentration[years.indexOf(y)];
      return 5.35 * Math.log(co2 / 278) + 0.7;
    });

    const temperatureAnomaly = radiativeForcingTimeseries.map(f => f / 3.7 * 3.0 * 0.6);

    return {
      name: 'RCP 4.5',
      type: 'RCP',
      id: 'RCP4.5',
      description: 'Moderate mitigation scenario - Stabilization pathway',
      years,
      co2Emissions,
      co2Concentration,
      ch4Emissions: years.map(() => 200),
      ch4Concentration,
      n2oEmissions: years.map(() => 8),
      n2oConcentration: years.map(y => 320 + (y - 2000) * 0.8),
      aerosolEmissions: {
        so2: years.map(y => Math.max(15, 50 - (y - 2000) * 0.3)),
        bc: years.map(() => 7),
        oc: years.map(() => 20),
        nh3: years.map(() => 50),
        nox: years.map(() => 100),
        co: years.map(() => 450),
        voc: years.map(() => 140),
      },
      radiativeForcingTimeseries,
      temperatureAnomaly,
      socioeconomic: {
        population: years.map(y => 6.0 + (y - 2000) * 0.06),
        gdp: years.map(y => 50 + (y - 2000) * 2.5),
        energyUse: years.map(y => 400 + (y - 2000) * 15),
      },
    };
  }

  /**
   * Generate RCP 6.0 (Moderate-high emissions) scenario
   */
  static generateRCP60(): EmissionsScenario {
    const years = Array.from({ length: 181 }, (_, i) => 2000 + i);

    const co2Concentration = years.map(y => {
      if (y <= 2020) {
        return 368 + (y - 2000) * 2.0;
      } else if (y <= 2080) {
        return 410 + (y - 2020) * 2.0; // Continued growth
      } else {
        return 530 + (y - 2080) * 0.8; // Slower growth
      }
    });

    const co2Emissions = years.map(y => {
      if (y <= 2020) {
        return 7.0 + (y - 2000) * 0.3;
      } else if (y <= 2070) {
        return 13.0 + (y - 2020) * 0.05; // Continued emissions
      } else {
        return 15.5 - (y - 2070) * 0.1; // Late decline
      }
    });

    const ch4Concentration = years.map(y => {
      if (y <= 2020) {
        return 1750 + (y - 2000) * 10;
      } else {
        return 1950 + (y - 2020) * 5; // Moderate growth
      }
    });

    const radiativeForcingTimeseries = years.map(y => {
      const co2 = co2Concentration[years.indexOf(y)];
      return 5.35 * Math.log(co2 / 278) + 1.0;
    });

    const temperatureAnomaly = radiativeForcingTimeseries.map(f => f / 3.7 * 3.0 * 0.6);

    return {
      name: 'RCP 6.0',
      type: 'RCP',
      id: 'RCP6.0',
      description: 'Moderate-high emissions - Late stabilization',
      years,
      co2Emissions,
      co2Concentration,
      ch4Emissions: years.map(() => 250),
      ch4Concentration,
      n2oEmissions: years.map(() => 10),
      n2oConcentration: years.map(y => 320 + (y - 2000) * 1.0),
      aerosolEmissions: {
        so2: years.map(() => 40),
        bc: years.map(() => 10),
        oc: years.map(() => 25),
        nh3: years.map(() => 60),
        nox: years.map(() => 120),
        co: years.map(() => 500),
        voc: years.map(() => 160),
      },
      radiativeForcingTimeseries,
      temperatureAnomaly,
      socioeconomic: {
        population: years.map(y => 6.0 + (y - 2000) * 0.07),
        gdp: years.map(y => 50 + (y - 2000) * 3),
        energyUse: years.map(y => 400 + (y - 2000) * 20),
      },
    };
  }

  /**
   * Generate RCP 8.5 (High emissions - Business as usual) scenario
   */
  static generateRCP85(): EmissionsScenario {
    const years = Array.from({ length: 181 }, (_, i) => 2000 + i);

    const co2Concentration = years.map(y => {
      if (y <= 2020) {
        return 368 + (y - 2000) * 2.0;
      } else {
        return 410 + (y - 2020) * 3.5; // Rapid growth
      }
    });

    const co2Emissions = years.map(y => {
      if (y <= 2020) {
        return 7.0 + (y - 2000) * 0.3;
      } else if (y <= 2100) {
        return 13.0 + (y - 2020) * 0.25; // Continued growth
      } else {
        return 33.0 + (y - 2100) * 0.15;
      }
    });

    const ch4Concentration = years.map(y => {
      if (y <= 2020) {
        return 1750 + (y - 2000) * 10;
      } else {
        return 1950 + (y - 2020) * 10; // Rapid growth
      }
    });

    const radiativeForcingTimeseries = years.map(y => {
      const co2 = co2Concentration[years.indexOf(y)];
      return 5.35 * Math.log(co2 / 278) + 1.5;
    });

    const temperatureAnomaly = radiativeForcingTimeseries.map(f => f / 3.7 * 3.0 * 0.6);

    return {
      name: 'RCP 8.5',
      type: 'RCP',
      id: 'RCP8.5',
      description: 'High emissions - Business as usual pathway',
      years,
      co2Emissions,
      co2Concentration,
      ch4Emissions: years.map(() => 400),
      ch4Concentration,
      n2oEmissions: years.map(() => 15),
      n2oConcentration: years.map(y => 320 + (y - 2000) * 1.5),
      aerosolEmissions: {
        so2: years.map(() => 80),
        bc: years.map(() => 15),
        oc: years.map(() => 35),
        nh3: years.map(() => 80),
        nox: years.map(() => 150),
        co: years.map(() => 600),
        voc: years.map(() => 200),
      },
      radiativeForcingTimeseries,
      temperatureAnomaly,
      socioeconomic: {
        population: years.map(y => 6.0 + (y - 2000) * 0.08),
        gdp: years.map(y => 50 + (y - 2000) * 4),
        energyUse: years.map(y => 400 + (y - 2000) * 30),
      },
    };
  }

  /**
   * Generate SSP1-2.6 (Sustainability - Low emissions)
   */
  static generateSSP1_26(): EmissionsScenario {
    const rcp26 = this.generateRCP26();

    return {
      ...rcp26,
      name: 'SSP1-2.6',
      type: 'SSP',
      id: 'SSP1-2.6',
      description: 'Sustainability pathway - Taking the green road',
      socioeconomic: {
        population: rcp26.years.map(y => 6.0 + (y - 2000) * 0.04), // Lower population
        gdp: rcp26.years.map(y => 50 + (y - 2000) * 2.5),
        energyUse: rcp26.years.map(y => 400 + (y - 2000) * 8), // Efficient
      },
    };
  }

  /**
   * Generate SSP2-4.5 (Middle of the road)
   */
  static generateSSP2_45(): EmissionsScenario {
    const rcp45 = this.generateRCP45();

    return {
      ...rcp45,
      name: 'SSP2-4.5',
      type: 'SSP',
      id: 'SSP2-4.5',
      description: 'Middle of the road - Moderate development',
      socioeconomic: {
        population: rcp45.years.map(y => 6.0 + (y - 2000) * 0.06),
        gdp: rcp45.years.map(y => 50 + (y - 2000) * 2.5),
        energyUse: rcp45.years.map(y => 400 + (y - 2000) * 15),
      },
    };
  }

  /**
   * Generate SSP5-8.5 (Fossil-fueled development)
   */
  static generateSSP5_85(): EmissionsScenario {
    const rcp85 = this.generateRCP85();

    return {
      ...rcp85,
      name: 'SSP5-8.5',
      type: 'SSP',
      id: 'SSP5-8.5',
      description: 'Fossil-fueled development - Taking the highway',
      socioeconomic: {
        population: rcp85.years.map(y => 6.0 + (y - 2000) * 0.05), // Lower due to development
        gdp: rcp85.years.map(y => 50 + (y - 2000) * 5), // High growth
        energyUse: rcp85.years.map(y => 400 + (y - 2000) * 40), // High energy use
      },
    };
  }

  /**
   * Create custom emissions scenario
   */
  static createCustomScenario(
    name: string,
    description: string,
    years: number[],
    co2Pathway: number[],
    ch4Pathway: number[],
    n2oPathway: number[]
  ): EmissionsScenario {
    // Compute emissions from concentrations (simplified)
    const co2Emissions = co2Pathway.map((c, i) => {
      if (i === 0) return 10;
      return (c - co2Pathway[i - 1]) * 2.12; // GtC/year
    });

    const ch4Emissions = ch4Pathway.map(() => 300); // Simplified
    const n2oEmissions = n2oPathway.map(() => 10);

    // Compute radiative forcing
    const radiativeForcingTimeseries = co2Pathway.map((co2, i) => {
      const ch4 = ch4Pathway[i];
      const n2o = n2oPathway[i];

      const co2Forcing = 5.35 * Math.log(co2 / 278);
      const ch4Forcing = 0.036 * (Math.sqrt(ch4) - Math.sqrt(700));
      const n2oForcing = 0.12 * (Math.sqrt(n2o) - Math.sqrt(270));

      return co2Forcing + ch4Forcing + n2oForcing;
    });

    // Compute temperature
    const temperatureAnomaly = radiativeForcingTimeseries.map(f => f / 3.7 * 3.0 * 0.6);

    return {
      name,
      type: 'Custom',
      id: `CUSTOM-${name.replace(/\s+/g, '-')}`,
      description,
      years,
      co2Emissions,
      co2Concentration: co2Pathway,
      ch4Emissions,
      ch4Concentration: ch4Pathway,
      n2oEmissions,
      n2oConcentration: n2oPathway,
      aerosolEmissions: {
        so2: years.map(() => 40),
        bc: years.map(() => 8),
        oc: years.map(() => 20),
        nh3: years.map(() => 50),
        nox: years.map(() => 100),
        co: years.map(() => 450),
        voc: years.map(() => 140),
      },
      radiativeForcingTimeseries,
      temperatureAnomaly,
      socioeconomic: {
        population: years.map(y => 6.0 + (y - years[0]) * 0.06),
        gdp: years.map(y => 50 + (y - years[0]) * 2.5),
        energyUse: years.map(y => 400 + (y - years[0]) * 15),
      },
    };
  }

  /**
   * Interpolate scenario to specific years
   */
  static interpolateScenario(
    scenario: EmissionsScenario,
    targetYears: number[]
  ): EmissionsScenario {
    const interpolate = (sourceYears: number[], sourceValues: number[], targetYears: number[]) => {
      return targetYears.map(year => {
        // Find surrounding years
        let lowerIdx = 0;
        let upperIdx = sourceYears.length - 1;

        for (let i = 0; i < sourceYears.length - 1; i++) {
          if (sourceYears[i] <= year && sourceYears[i + 1] > year) {
            lowerIdx = i;
            upperIdx = i + 1;
            break;
          }
        }

        // Linear interpolation
        const yearLower = sourceYears[lowerIdx];
        const yearUpper = sourceYears[upperIdx];
        const valueLower = sourceValues[lowerIdx];
        const valueUpper = sourceValues[upperIdx];

        const fraction = (year - yearLower) / (yearUpper - yearLower);
        return valueLower + fraction * (valueUpper - valueLower);
      });
    };

    return {
      ...scenario,
      years: targetYears,
      co2Emissions: interpolate(scenario.years, scenario.co2Emissions, targetYears),
      co2Concentration: interpolate(scenario.years, scenario.co2Concentration, targetYears),
      ch4Emissions: interpolate(scenario.years, scenario.ch4Emissions, targetYears),
      ch4Concentration: interpolate(scenario.years, scenario.ch4Concentration, targetYears),
      n2oEmissions: interpolate(scenario.years, scenario.n2oEmissions, targetYears),
      n2oConcentration: interpolate(scenario.years, scenario.n2oConcentration, targetYears),
      radiativeForcingTimeseries: interpolate(
        scenario.years,
        scenario.radiativeForcingTimeseries,
        targetYears
      ),
      temperatureAnomaly: interpolate(scenario.years, scenario.temperatureAnomaly, targetYears),
      aerosolEmissions: {
        so2: interpolate(scenario.years, scenario.aerosolEmissions.so2, targetYears),
        bc: interpolate(scenario.years, scenario.aerosolEmissions.bc, targetYears),
        oc: interpolate(scenario.years, scenario.aerosolEmissions.oc, targetYears),
        nh3: interpolate(scenario.years, scenario.aerosolEmissions.nh3, targetYears),
        nox: interpolate(scenario.years, scenario.aerosolEmissions.nox, targetYears),
        co: interpolate(scenario.years, scenario.aerosolEmissions.co, targetYears),
        voc: interpolate(scenario.years, scenario.aerosolEmissions.voc, targetYears),
      },
      socioeconomic: {
        population: interpolate(scenario.years, scenario.socioeconomic.population, targetYears),
        gdp: interpolate(scenario.years, scenario.socioeconomic.gdp, targetYears),
        energyUse: interpolate(scenario.years, scenario.socioeconomic.energyUse, targetYears),
      },
    };
  }

  /**
   * Convert scenario to climate forcings for a specific year
   */
  static scenarioToForcings(scenario: EmissionsScenario, year: number): ClimateForcings {
    const yearIdx = scenario.years.indexOf(year);

    if (yearIdx === -1) {
      throw new Error(`Year ${year} not found in scenario`);
    }

    return {
      greenhouseGases: {
        co2: scenario.co2Concentration[yearIdx],
        ch4: scenario.ch4Concentration[yearIdx],
        n2o: scenario.n2oConcentration[yearIdx],
        cfc11: 240, // Simplified
        cfc12: 530,
        hcfc22: 220,
      },
      aerosols: {
        sulfate: Array(100).fill(Array(100).fill(0.1)),
        blackCarbon: Array(100).fill(Array(100).fill(0.02)),
        organicCarbon: Array(100).fill(Array(100).fill(0.05)),
        dust: Array(100).fill(Array(100).fill(0.03)),
        seaSalt: Array(100).fill(Array(100).fill(0.04)),
        totalOpticalDepth: Array(100).fill(Array(100).fill(0.15)),
      },
      solar: {
        totalIrradiance: 1361,
        spectralVariation: [],
        cycles: false,
      },
      volcanic: {
        stratosphericAOD: 0.01,
        effectiveRadius: 0.5,
        altitude: 20000,
      },
      landUse: {
        forestCover: Array(100).fill(Array(100).fill(0.3)),
        cropland: Array(100).fill(Array(100).fill(0.2)),
        urban: Array(100).fill(Array(100).fill(0.05)),
        albedoChange: Array(100).fill(Array(100).fill(0.0)),
      },
      orbital: {
        eccentricity: 0.0167,
        obliquity: 23.44,
        precession: 102.95,
      },
    };
  }
}

/**
 * Export all standard scenarios
 */
export const STANDARD_SCENARIOS = {
  RCP26: EmissionsScenarioGenerator.generateRCP26(),
  RCP45: EmissionsScenarioGenerator.generateRCP45(),
  RCP60: EmissionsScenarioGenerator.generateRCP60(),
  RCP85: EmissionsScenarioGenerator.generateRCP85(),
  SSP1_26: EmissionsScenarioGenerator.generateSSP1_26(),
  SSP2_45: EmissionsScenarioGenerator.generateSSP2_45(),
  SSP5_85: EmissionsScenarioGenerator.generateSSP5_85(),
};

/**
 * Export scenario generator
 */
export { EmissionsScenarioGenerator };
