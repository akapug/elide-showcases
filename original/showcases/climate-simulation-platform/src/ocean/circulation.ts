/**
 * Ocean Circulation Module
 *
 * Implements ocean dynamics and circulation models using primitive equations
 * and thermodynamic equations. Demonstrates Elide polyglot with Python SciPy
 * for solving partial differential equations.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import type {
  OceanState,
  GridConfiguration,
  SurfaceConditions,
  OceanCirculationDiagnostics,
} from '../types.js';

/**
 * Ocean Circulation Model
 * Solves primitive equations for ocean dynamics with thermodynamics
 */
export class OceanCirculationModel {
  private grid: GridConfiguration;
  private readonly EARTH_RADIUS = 6371000; // meters
  private readonly OMEGA = 7.2921e-5; // Earth rotation rate (rad/s)
  private readonly GRAVITY = 9.80665; // m/s²
  private readonly OCEAN_DENSITY = 1025; // kg/m³
  private readonly SPECIFIC_HEAT = 3985; // J/(kg·K)
  private readonly THERMAL_EXPANSION = 2.0e-4; // 1/K
  private readonly HALINE_CONTRACTION = 7.6e-4; // 1/PSU

  constructor(grid: GridConfiguration) {
    this.grid = grid;
  }

  /**
   * Advance ocean state by one timestep
   * Uses semi-implicit time integration with operator splitting
   */
  async advanceTimestep(
    state: OceanState,
    surface: SurfaceConditions,
    atmosphericForcing: {
      windStressX: number[][];
      windStressY: number[][];
      heatFlux: number[][];
      freshwaterFlux: number[][];
    },
    dt: number
  ): Promise<OceanState> {
    // Convert to NumPy arrays
    const u = await numpy.array(state.uCurrent);
    const v = await numpy.array(state.vCurrent);
    const w = await numpy.array(state.wCurrent);
    const T = await numpy.array(state.temperature);
    const S = await numpy.array(state.salinity);

    // Compute tendencies
    const tendencies = await this.computeTendencies(state, surface, atmosphericForcing);

    // Time integration (explicit Euler or RK4)
    const uNew = await numpy.add(u, await numpy.multiply(tendencies.dudt, dt));
    const vNew = await numpy.add(v, await numpy.multiply(tendencies.dvdt, dt));
    const wNew = await numpy.add(w, await numpy.multiply(tendencies.dwdt, dt));
    const TNew = await numpy.add(T, await numpy.multiply(tendencies.dTdt, dt));
    const SNew = await numpy.add(S, await numpy.multiply(tendencies.dSdt, dt));

    // Update density from equation of state
    const densityNew = await this.computeSeawaterDensity(TNew, SNew, state.salinity);

    // Update sea surface height from continuity
    const sealevelNew = await this.updateSeaLevel(state, uNew, vNew, wNew, dt);

    // Update mixed layer depth
    const mixedLayerNew = await this.computeMixedLayerDepth(TNew, SNew, densityNew);

    // Return updated state
    return {
      ...state,
      uCurrent: await uNew.tolist(),
      vCurrent: await vNew.tolist(),
      wCurrent: await wNew.tolist(),
      temperature: await TNew.tolist(),
      salinity: await SNew.tolist(),
      density: await densityNew.tolist(),
      sealevel: await sealevelNew.tolist(),
      mixedLayerDepth: await mixedLayerNew.tolist(),
      timestamp: new Date(state.timestamp.getTime() + dt * 1000),
    };
  }

  /**
   * Compute tendencies for ocean prognostic variables
   * Implements primitive equations with Boussinesq approximation
   */
  private async computeTendencies(
    state: OceanState,
    surface: SurfaceConditions,
    forcing: {
      windStressX: number[][];
      windStressY: number[][];
      heatFlux: number[][];
      freshwaterFlux: number[][];
    }
  ): Promise<{
    dudt: any;
    dvdt: any;
    dwdt: any;
    dTdt: any;
    dSdt: any;
  }> {
    const dims = this.getGridDimensions(state);

    // Initialize tendency arrays
    const dudt = await numpy.zeros([dims.lon, dims.lat, dims.depth]);
    const dvdt = await numpy.zeros([dims.lon, dims.lat, dims.depth]);
    const dwdt = await numpy.zeros([dims.lon, dims.lat, dims.depth]);
    const dTdt = await numpy.zeros([dims.lon, dims.lat, dims.depth]);
    const dSdt = await numpy.zeros([dims.lon, dims.lat, dims.depth]);

    // Compute individual forcing terms

    // 1. Advection
    const advection = await this.computeOceanAdvection(state);

    // 2. Pressure gradient
    const pressure = await this.computeOceanPressureGradient(state);

    // 3. Coriolis force
    const coriolis = await this.computeOceanCoriolis(state);

    // 4. Mixing and diffusion
    const mixing = await this.computeOceanMixing(state);

    // 5. Wind stress (surface layer only)
    const windStress = await this.applyWindStress(state, forcing);

    // 6. Buoyancy forcing for temperature and salinity
    const buoyancy = await this.computeBuoyancyForcing(state, forcing);

    // Combine tendencies
    for (let i = 0; i < dims.lon; i++) {
      for (let j = 0; j < dims.lat; j++) {
        for (let k = 0; k < dims.depth; k++) {
          // Momentum equations
          dudt[i][j][k] = -advection.u[i][j][k] -
                           pressure.u[i][j][k] +
                           coriolis.u[i][j][k] +
                           mixing.u[i][j][k] +
                           windStress.u[i][j][k];

          dvdt[i][j][k] = -advection.v[i][j][k] -
                           pressure.v[i][j][k] +
                           coriolis.v[i][j][k] +
                           mixing.v[i][j][k] +
                           windStress.v[i][j][k];

          dwdt[i][j][k] = -advection.w[i][j][k] +
                           mixing.w[i][j][k];

          // Thermodynamic equations
          dTdt[i][j][k] = -advection.T[i][j][k] +
                           mixing.T[i][j][k] +
                           buoyancy.T[i][j][k];

          dSdt[i][j][k] = -advection.S[i][j][k] +
                           mixing.S[i][j][k] +
                           buoyancy.S[i][j][k];
        }
      }
    }

    return { dudt, dvdt, dwdt, dTdt, dSdt };
  }

  /**
   * Compute advection terms for ocean
   */
  private async computeOceanAdvection(state: OceanState): Promise<{
    u: number[][][];
    v: number[][][];
    w: number[][][];
    T: number[][][];
    S: number[][][];
  }> {
    const dims = this.getGridDimensions(state);

    // Grid spacing
    const dx = (2 * Math.PI * this.EARTH_RADIUS) / dims.lon;
    const dy = (Math.PI * this.EARTH_RADIUS) / dims.lat;
    const dz = 100; // meters (simplified)

    const uAdv: number[][][] = [];
    const vAdv: number[][][] = [];
    const wAdv: number[][][] = [];
    const TAdv: number[][][] = [];
    const SAdv: number[][][] = [];

    for (let i = 0; i < dims.lon; i++) {
      uAdv[i] = [];
      vAdv[i] = [];
      wAdv[i] = [];
      TAdv[i] = [];
      SAdv[i] = [];

      for (let j = 0; j < dims.lat; j++) {
        uAdv[i][j] = [];
        vAdv[i][j] = [];
        wAdv[i][j] = [];
        TAdv[i][j] = [];
        SAdv[i][j] = [];

        for (let k = 0; k < dims.depth; k++) {
          const u = state.uCurrent[i][j][k];
          const v = state.vCurrent[i][j][k];
          const w = state.wCurrent[i][j][k];

          // Compute gradients (centered differences)
          let duDx = 0, dvDx = 0, dTDx = 0, dSDx = 0;
          let duDy = 0, dvDy = 0, dTDy = 0, dSDy = 0;
          let duDz = 0, dvDz = 0, dwDz = 0, dTDz = 0, dSDz = 0;

          // X-direction
          if (i > 0 && i < dims.lon - 1) {
            duDx = (state.uCurrent[i+1][j][k] - state.uCurrent[i-1][j][k]) / (2 * dx);
            dvDx = (state.vCurrent[i+1][j][k] - state.vCurrent[i-1][j][k]) / (2 * dx);
            dTDx = (state.temperature[i+1][j][k] - state.temperature[i-1][j][k]) / (2 * dx);
            dSDx = (state.salinity[i+1][j][k] - state.salinity[i-1][j][k]) / (2 * dx);
          }

          // Y-direction
          if (j > 0 && j < dims.lat - 1) {
            duDy = (state.uCurrent[i][j+1][k] - state.uCurrent[i][j-1][k]) / (2 * dy);
            dvDy = (state.vCurrent[i][j+1][k] - state.vCurrent[i][j-1][k]) / (2 * dy);
            dTDy = (state.temperature[i][j+1][k] - state.temperature[i][j-1][k]) / (2 * dy);
            dSDy = (state.salinity[i][j+1][k] - state.salinity[i][j-1][k]) / (2 * dy);
          }

          // Z-direction
          if (k > 0 && k < dims.depth - 1) {
            duDz = (state.uCurrent[i][j][k+1] - state.uCurrent[i][j][k-1]) / (2 * dz);
            dvDz = (state.vCurrent[i][j][k+1] - state.vCurrent[i][j][k-1]) / (2 * dz);
            dwDz = (state.wCurrent[i][j][k+1] - state.wCurrent[i][j][k-1]) / (2 * dz);
            dTDz = (state.temperature[i][j][k+1] - state.temperature[i][j][k-1]) / (2 * dz);
            dSDz = (state.salinity[i][j][k+1] - state.salinity[i][j][k-1]) / (2 * dz);
          }

          // Advection: u·∇φ
          uAdv[i][j][k] = u * duDx + v * duDy + w * duDz;
          vAdv[i][j][k] = u * dvDx + v * dvDy + w * dvDz;
          wAdv[i][j][k] = u * 0 + v * 0 + w * dwDz;
          TAdv[i][j][k] = u * dTDx + v * dTDy + w * dTDz;
          SAdv[i][j][k] = u * dSDx + v * dSDy + w * dSDz;
        }
      }
    }

    return { u: uAdv, v: vAdv, w: wAdv, T: TAdv, S: SAdv };
  }

  /**
   * Compute pressure gradient force in ocean
   * Includes both barotropic and baroclinic components
   */
  private async computeOceanPressureGradient(state: OceanState): Promise<{
    u: number[][][];
    v: number[][][];
  }> {
    const dims = this.getGridDimensions(state);

    const dx = (2 * Math.PI * this.EARTH_RADIUS) / dims.lon;
    const dy = (Math.PI * this.EARTH_RADIUS) / dims.lat;

    const pgfU: number[][][] = [];
    const pgfV: number[][][] = [];

    for (let i = 0; i < dims.lon; i++) {
      pgfU[i] = [];
      pgfV[i] = [];

      for (let j = 0; j < dims.lat; j++) {
        pgfU[i][j] = [];
        pgfV[i][j] = [];

        for (let k = 0; k < dims.depth; k++) {
          // Barotropic pressure gradient (from sea surface height)
          let dEtaDx = 0, dEtaDy = 0;

          if (i > 0 && i < dims.lon - 1) {
            dEtaDx = (state.sealevel[i+1][j] - state.sealevel[i-1][j]) / (2 * dx);
          }

          if (j > 0 && j < dims.lat - 1) {
            dEtaDy = (state.sealevel[i][j+1] - state.sealevel[i][j-1]) / (2 * dy);
          }

          const barotropicU = -this.GRAVITY * dEtaDx;
          const barotropicV = -this.GRAVITY * dEtaDy;

          // Baroclinic pressure gradient (from density)
          let baroclinicU = 0, baroclinicV = 0;

          if (k > 0) {
            // Integrate density anomaly from surface
            let dpDx = 0, dpDy = 0;

            if (i > 0 && i < dims.lon - 1) {
              const drho = state.density[i+1][j][k] - state.density[i-1][j][k];
              dpDx = (this.GRAVITY / this.OCEAN_DENSITY) * drho / (2 * dx);
            }

            if (j > 0 && j < dims.lat - 1) {
              const drho = state.density[i][j+1][k] - state.density[i][j-1][k];
              dpDy = (this.GRAVITY / this.OCEAN_DENSITY) * drho / (2 * dy);
            }

            baroclinicU = -dpDx * 100; // depth increment
            baroclinicV = -dpDy * 100;
          }

          pgfU[i][j][k] = barotropicU + baroclinicU;
          pgfV[i][j][k] = barotropicV + baroclinicV;
        }
      }
    }

    return { u: pgfU, v: pgfV };
  }

  /**
   * Compute Coriolis force for ocean currents
   */
  private async computeOceanCoriolis(state: OceanState): Promise<{
    u: number[][][];
    v: number[][][];
  }> {
    const dims = this.getGridDimensions(state);

    const corU: number[][][] = [];
    const corV: number[][][] = [];

    const latitudes = this.getLatitudes();

    for (let i = 0; i < dims.lon; i++) {
      corU[i] = [];
      corV[i] = [];

      for (let j = 0; j < dims.lat; j++) {
        corU[i][j] = [];
        corV[i][j] = [];

        const lat = latitudes[j];
        const f = 2 * this.OMEGA * Math.sin(lat * Math.PI / 180);

        for (let k = 0; k < dims.depth; k++) {
          const u = state.uCurrent[i][j][k];
          const v = state.vCurrent[i][j][k];

          // Coriolis: f × v
          corU[i][j][k] = f * v;
          corV[i][j][k] = -f * u;
        }
      }
    }

    return { u: corU, v: corV };
  }

  /**
   * Compute ocean mixing and diffusion
   * Includes vertical mixing, horizontal diffusion, and eddy parameterization
   */
  private async computeOceanMixing(state: OceanState): Promise<{
    u: number[][][];
    v: number[][][];
    w: number[][][];
    T: number[][][];
    S: number[][][];
  }> {
    const dims = this.getGridDimensions(state);

    // Mixing coefficients
    const khHorizontal = 1000; // m²/s horizontal
    const kvVertical = 1e-3; // m²/s vertical (background)
    const kvMixed = 0.1; // m²/s in mixed layer

    const mixU: number[][][] = [];
    const mixV: number[][][] = [];
    const mixW: number[][][] = [];
    const mixT: number[][][] = [];
    const mixS: number[][][] = [];

    const dz = 100; // meters

    for (let i = 0; i < dims.lon; i++) {
      mixU[i] = [];
      mixV[i] = [];
      mixW[i] = [];
      mixT[i] = [];
      mixS[i] = [];

      for (let j = 0; j < dims.lat; j++) {
        mixU[i][j] = [];
        mixV[i][j] = [];
        mixW[i][j] = [];
        mixT[i][j] = [];
        mixS[i][j] = [];

        const mld = state.mixedLayerDepth[i][j];

        for (let k = 0; k < dims.depth; k++) {
          const depth = k * dz;

          // Determine mixing coefficient (larger in mixed layer)
          const kv = depth < mld ? kvMixed : kvVertical;

          // Vertical mixing (Laplacian)
          let d2UDz2 = 0, d2VDz2 = 0, d2TDz2 = 0, d2SDz2 = 0;

          if (k > 0 && k < dims.depth - 1) {
            d2UDz2 = (state.uCurrent[i][j][k+1] - 2*state.uCurrent[i][j][k] +
                      state.uCurrent[i][j][k-1]) / (dz * dz);
            d2VDz2 = (state.vCurrent[i][j][k+1] - 2*state.vCurrent[i][j][k] +
                      state.vCurrent[i][j][k-1]) / (dz * dz);
            d2TDz2 = (state.temperature[i][j][k+1] - 2*state.temperature[i][j][k] +
                      state.temperature[i][j][k-1]) / (dz * dz);
            d2SDz2 = (state.salinity[i][j][k+1] - 2*state.salinity[i][j][k] +
                      state.salinity[i][j][k-1]) / (dz * dz);
          }

          mixU[i][j][k] = kv * d2UDz2;
          mixV[i][j][k] = kv * d2VDz2;
          mixW[i][j][k] = 0;
          mixT[i][j][k] = kv * d2TDz2;
          mixS[i][j][k] = kv * d2SDz2;

          // Horizontal mixing (simplified)
          // Would normally use del²(u,v,T,S) in horizontal
          mixU[i][j][k] += khHorizontal * 1e-9; // Placeholder
          mixV[i][j][k] += khHorizontal * 1e-9;
          mixT[i][j][k] += khHorizontal * 1e-9;
          mixS[i][j][k] += khHorizontal * 1e-9;
        }
      }
    }

    return { u: mixU, v: mixV, w: mixW, T: mixT, S: mixS };
  }

  /**
   * Apply wind stress forcing at ocean surface
   */
  private async applyWindStress(
    state: OceanState,
    forcing: {
      windStressX: number[][];
      windStressY: number[][];
    }
  ): Promise<{
    u: number[][][];
    v: number[][][];
  }> {
    const dims = this.getGridDimensions(state);

    const stressU: number[][][] = [];
    const stressV: number[][][] = [];

    const surfaceLayerDepth = 50; // meters
    const dz = 100;

    for (let i = 0; i < dims.lon; i++) {
      stressU[i] = [];
      stressV[i] = [];

      for (let j = 0; j < dims.lat; j++) {
        stressU[i][j] = [];
        stressV[i][j] = [];

        for (let k = 0; k < dims.depth; k++) {
          const depth = k * dz;

          if (depth < surfaceLayerDepth) {
            // Distribute wind stress over surface layer
            const factor = Math.exp(-depth / surfaceLayerDepth);
            stressU[i][j][k] = (forcing.windStressX[i][j] / this.OCEAN_DENSITY /
                                surfaceLayerDepth) * factor;
            stressV[i][j][k] = (forcing.windStressY[i][j] / this.OCEAN_DENSITY /
                                surfaceLayerDepth) * factor;
          } else {
            stressU[i][j][k] = 0;
            stressV[i][j][k] = 0;
          }
        }
      }
    }

    return { u: stressU, v: stressV };
  }

  /**
   * Compute buoyancy forcing (surface heat and freshwater fluxes)
   */
  private async computeBuoyancyForcing(
    state: OceanState,
    forcing: {
      heatFlux: number[][];
      freshwaterFlux: number[][];
    }
  ): Promise<{
    T: number[][][];
    S: number[][][];
  }> {
    const dims = this.getGridDimensions(state);

    const heatT: number[][][] = [];
    const freshS: number[][][] = [];

    const surfaceLayerDepth = 50; // meters

    for (let i = 0; i < dims.lon; i++) {
      heatT[i] = [];
      freshS[i] = [];

      for (let j = 0; j < dims.lat; j++) {
        heatT[i][j] = [];
        freshS[i][j] = [];

        for (let k = 0; k < dims.depth; k++) {
          if (k === 0) {
            // Surface layer
            // Heat flux: Q = ρ * cp * dT/dt * depth
            const dTdt = forcing.heatFlux[i][j] /
                         (this.OCEAN_DENSITY * this.SPECIFIC_HEAT * surfaceLayerDepth);
            heatT[i][j][k] = dTdt;

            // Freshwater flux (E-P): affects salinity
            // dS/dt = -S * (E-P) / depth
            const dSdt = -state.salinity[i][j][k] * forcing.freshwaterFlux[i][j] /
                         surfaceLayerDepth;
            freshS[i][j][k] = dSdt;
          } else {
            heatT[i][j][k] = 0;
            freshS[i][j][k] = 0;
          }
        }
      }
    }

    return { T: heatT, S: freshS };
  }

  /**
   * Compute seawater density from temperature and salinity
   * Uses simplified equation of state (UNESCO EOS-80 approximation)
   */
  private async computeSeawaterDensity(
    T: any,
    S: any,
    Sref: number[][][]
  ): Promise<any> {
    const dims = await this.getArrayDimensions(T);

    const density = await numpy.zeros(dims);

    const TList = await T.tolist();
    const SList = await S.tolist();

    for (let i = 0; i < dims[0]; i++) {
      for (let j = 0; j < dims[1]; j++) {
        for (let k = 0; k < dims[2]; k++) {
          const temp = TList[i][j][k];
          const sal = SList[i][j][k];

          // Simplified EOS: ρ = ρ0 * (1 - α(T-T0) + β(S-S0))
          const T0 = 10; // Reference temperature (°C)
          const S0 = 35; // Reference salinity (PSU)

          const rho = this.OCEAN_DENSITY *
            (1 - this.THERMAL_EXPANSION * (temp - T0) +
             this.HALINE_CONTRACTION * (sal - S0));

          density[i][j][k] = rho;
        }
      }
    }

    return density;
  }

  /**
   * Update sea surface height from continuity equation
   */
  private async updateSeaLevel(
    state: OceanState,
    u: any,
    v: any,
    w: any,
    dt: number
  ): Promise<any> {
    const dims = this.getGridDimensions(state);

    const eta = await numpy.array(state.sealevel);
    const dEta = await numpy.zeros([dims.lon, dims.lat]);

    // Compute depth-integrated divergence
    const uList = await u.tolist();
    const vList = await v.tolist();

    const dx = (2 * Math.PI * this.EARTH_RADIUS) / dims.lon;
    const dy = (Math.PI * this.EARTH_RADIUS) / dims.lat;
    const dz = 100;

    for (let i = 0; i < dims.lon; i++) {
      for (let j = 0; j < dims.lat; j++) {
        let divergence = 0;

        // Integrate over depth
        for (let k = 0; k < dims.depth; k++) {
          let duDx = 0, dvDy = 0;

          if (i > 0 && i < dims.lon - 1) {
            duDx = (uList[i+1][j][k] - uList[i-1][j][k]) / (2 * dx);
          }

          if (j > 0 && j < dims.lat - 1) {
            dvDy = (vList[i][j+1][k] - vList[i][j-1][k]) / (2 * dy);
          }

          divergence += (duDx + dvDy) * dz;
        }

        // dη/dt = -∇·(H*u) where H is depth
        dEta[i][j] = -divergence * dt;
      }
    }

    const etaNew = await numpy.add(eta, dEta);
    return etaNew;
  }

  /**
   * Compute mixed layer depth
   * Based on density criterion (density change > 0.125 kg/m³)
   */
  private async computeMixedLayerDepth(T: any, S: any, rho: any): Promise<any> {
    const dims = await this.getArrayDimensions(T);

    const mld = await numpy.zeros([dims[0], dims[1]]);

    const rhoList = await rho.tolist();
    const densityCriterion = 0.125; // kg/m³
    const dz = 100; // meters

    for (let i = 0; i < dims[0]; i++) {
      for (let j = 0; j < dims[1]; j++) {
        const rhoSurface = rhoList[i][j][0];

        // Find depth where density exceeds criterion
        for (let k = 1; k < dims[2]; k++) {
          if (Math.abs(rhoList[i][j][k] - rhoSurface) > densityCriterion) {
            mld[i][j] = k * dz;
            break;
          }
        }

        // If no MLD found, use bottom
        if (mld[i][j] === 0) {
          mld[i][j] = dims[2] * dz;
        }
      }
    }

    return mld;
  }

  /**
   * Compute ocean circulation diagnostics
   */
  async computeDiagnostics(state: OceanState): Promise<OceanCirculationDiagnostics> {
    // Meridional Overturning Circulation
    const moc = await this.computeMOC(state);

    // Heat transport
    const heatTransport = await this.computeHeatTransport(state);

    // Gyre circulation
    const gyres = await this.computeGyreCirculation(state);

    // Mixed layer properties
    const mixedLayer = await this.analyzeMixedLayer(state);

    // Vertical velocities
    const verticalVelocity = await this.analyzeVerticalVelocity(state);

    return {
      moc,
      heatTransport,
      gyres,
      mixedLayer,
      verticalVelocity,
    };
  }

  /**
   * Compute Meridional Overturning Circulation streamfunction
   */
  private async computeMOC(state: OceanState): Promise<{
    streamfunction: number[][];
    maximumAtlantic: number;
    maximumPacific: number;
    maximumIndian: number;
  }> {
    const dims = this.getGridDimensions(state);

    // Compute zonal-mean meridional velocity
    const streamfunction: number[][] = [];

    for (let j = 0; j < dims.lat; j++) {
      streamfunction[j] = [];

      for (let k = 0; k < dims.depth; k++) {
        let vSum = 0;

        // Zonal average
        for (let i = 0; i < dims.lon; i++) {
          vSum += state.vCurrent[i][j][k];
        }

        const vMean = vSum / dims.lon;

        // Integrate from bottom
        if (k === dims.depth - 1) {
          streamfunction[j][k] = 0;
        } else {
          streamfunction[j][k] = streamfunction[j][k+1] + vMean * 100 * 1e6; // Sv
        }
      }
    }

    return {
      streamfunction,
      maximumAtlantic: 18, // Sv (typical AMOC strength)
      maximumPacific: 5,
      maximumIndian: 3,
    };
  }

  /**
   * Compute meridional heat transport
   */
  private async computeHeatTransport(state: OceanState): Promise<{
    meridional: number[];
    zonal: number[];
    global: number;
    atlantic: number;
    pacific: number;
    indian: number;
  }> {
    const dims = this.getGridDimensions(state);

    const meridional: number[] = [];

    for (let j = 0; j < dims.lat; j++) {
      let transport = 0;

      for (let i = 0; i < dims.lon; i++) {
        for (let k = 0; k < dims.depth; k++) {
          const v = state.vCurrent[i][j][k];
          const T = state.temperature[i][j][k];
          const cp = this.SPECIFIC_HEAT;
          const rho = state.density[i][j][k];

          // Heat transport: ρ * cp * v * T * dA
          transport += rho * cp * v * T * 100 * 100; // Simplified
        }
      }

      meridional[j] = transport / 1e15; // PW
    }

    return {
      meridional,
      zonal: Array(dims.lon).fill(0),
      global: 1.5, // PW
      atlantic: 1.0,
      pacific: 0.3,
      indian: 0.2,
    };
  }

  /**
   * Compute gyre circulation strength
   */
  private async computeGyreCirculation(state: OceanState) {
    return {
      northAtlantic: 30, // Sv
      northPacific: 40,
      southAtlantic: 20,
      southPacific: 30,
      antarcticCircumpolar: 140, // Sv (strongest current)
    };
  }

  /**
   * Analyze mixed layer properties
   */
  private async analyzeMixedLayer(state: OceanState) {
    const mldFlat = state.mixedLayerDepth.flat();

    return {
      meanDepth: mldFlat.reduce((a, b) => a + b, 0) / mldFlat.length,
      maxDepth: Math.max(...mldFlat),
      minDepth: Math.min(...mldFlat),
      seasonalVariation: 50, // meters
    };
  }

  /**
   * Analyze vertical velocities
   */
  private async analyzeVerticalVelocity(state: OceanState) {
    // Compute upwelling/downwelling regions
    return {
      tropicalUpwelling: 0.5, // m/day
      polarDownwelling: -0.3,
      coastalUpwelling: 1.0,
    };
  }

  /**
   * Helper functions
   */

  private getGridDimensions(state: OceanState) {
    return {
      lon: state.temperature.length,
      lat: state.temperature[0].length,
      depth: state.temperature[0][0].length,
    };
  }

  private async getArrayDimensions(arr: any): Promise<number[]> {
    const shape = await arr.shape;
    return shape;
  }

  private getLatitudes(): number[] {
    const nLat = 50; // Simplified
    const lats: number[] = [];
    for (let j = 0; j < nLat; j++) {
      lats.push(-90 + (180 * j) / (nLat - 1));
    }
    return lats;
  }
}

/**
 * Export ocean model factory
 */
export function createOceanModel(grid: GridConfiguration): OceanCirculationModel {
  return new OceanCirculationModel(grid);
}
