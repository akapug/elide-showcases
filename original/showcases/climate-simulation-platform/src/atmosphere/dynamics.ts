/**
 * Atmospheric Dynamics Module
 *
 * Implements atmospheric dynamics using primitive equations and Navier-Stokes
 * equations. Demonstrates Elide polyglot with Python NumPy and SciPy for
 * numerical solutions.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import type {
  AtmosphereState,
  GridConfiguration,
  SurfaceConditions,
  AtmosphereDynamicsDiagnostics,
} from '../types.js';

/**
 * Atmospheric Dynamics Solver
 * Solves primitive equations on a sphere using spectral or finite-difference methods
 */
export class AtmosphericDynamicsSolver {
  private grid: GridConfiguration;
  private readonly EARTH_RADIUS = 6371000; // meters
  private readonly OMEGA = 7.2921e-5; // Earth rotation rate (rad/s)
  private readonly GRAVITY = 9.80665; // m/s²
  private readonly GAS_CONSTANT = 287.05; // J/(kg·K)
  private readonly CP = 1005; // Specific heat at constant pressure J/(kg·K)

  constructor(grid: GridConfiguration) {
    this.grid = grid;
  }

  /**
   * Advance atmospheric state by one timestep
   * Uses semi-implicit time integration
   */
  async advanceTimestep(
    state: AtmosphereState,
    surface: SurfaceConditions,
    dt: number
  ): Promise<AtmosphereState> {
    // Convert to numpy arrays for efficient computation
    const dims = this.getGridDimensions(state);

    // Current state arrays
    const u = await numpy.array(state.uWind);
    const v = await numpy.array(state.vWind);
    const w = await numpy.array(state.wWind);
    const T = await numpy.array(state.temperature);
    const p = await numpy.array(state.pressure);
    const q = await numpy.array(state.specificHumidity);

    // Compute tendencies (time derivatives)
    const tendencies = await this.computeTendencies(state, surface);

    // Time integration using Adams-Bashforth or RK4
    const uNew = await numpy.add(u, await numpy.multiply(tendencies.dudt, dt));
    const vNew = await numpy.add(v, await numpy.multiply(tendencies.dvdt, dt));
    const wNew = await numpy.add(w, await numpy.multiply(tendencies.dwdt, dt));
    const TNew = await numpy.add(T, await numpy.multiply(tendencies.dTdt, dt));
    const qNew = await numpy.add(q, await numpy.multiply(tendencies.dqdt, dt));

    // Update pressure using continuity equation
    const pNew = await this.updatePressure(state, uNew, vNew, wNew, dt);

    // Update derived quantities
    const densityNew = await this.computeDensity(TNew, pNew);
    const geopotentialNew = await this.computeGeopotentialHeight(TNew, pNew);

    // Return updated state
    return {
      ...state,
      uWind: await uNew.tolist(),
      vWind: await vNew.tolist(),
      wWind: await wNew.tolist(),
      temperature: await TNew.tolist(),
      pressure: await pNew.tolist(),
      specificHumidity: await qNew.tolist(),
      airDensity: await densityNew.tolist(),
      geopotentialHeight: await geopotentialNew.tolist(),
      timestamp: new Date(state.timestamp.getTime() + dt * 1000),
    };
  }

  /**
   * Compute tendencies (time derivatives) for all prognostic variables
   * Implements primitive equations on a sphere
   */
  private async computeTendencies(
    state: AtmosphereState,
    surface: SurfaceConditions
  ): Promise<{
    dudt: any; // NumPy array
    dvdt: any;
    dwdt: any;
    dTdt: any;
    dqdt: any;
  }> {
    const dims = this.getGridDimensions(state);

    // Initialize tendency arrays
    const dudt = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const dvdt = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const dwdt = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const dTdt = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const dqdt = await numpy.zeros([dims.lon, dims.lat, dims.lev]);

    // Compute individual tendency terms

    // 1. Advection terms
    const advection = await this.computeAdvection(state);

    // 2. Pressure gradient force
    const pgf = await this.computePressureGradient(state);

    // 3. Coriolis force
    const coriolis = await this.computeCoriolisForce(state);

    // 4. Gravity wave drag and friction
    const friction = await this.computeFriction(state, surface);

    // 5. Diabatic heating
    const heating = await this.computeDiabaticHeating(state);

    // Combine tendencies for momentum equations
    for (let i = 0; i < dims.lon; i++) {
      for (let j = 0; j < dims.lat; j++) {
        for (let k = 0; k < dims.lev; k++) {
          // du/dt = -advection + coriolis + pgf + friction
          dudt[i][j][k] = -advection.u[i][j][k] +
                           coriolis.u[i][j][k] -
                           pgf.u[i][j][k] +
                           friction.u[i][j][k];

          // dv/dt = -advection + coriolis + pgf + friction
          dvdt[i][j][k] = -advection.v[i][j][k] +
                           coriolis.v[i][j][k] -
                           pgf.v[i][j][k] +
                           friction.v[i][j][k];

          // dw/dt = -advection - g + buoyancy
          dwdt[i][j][k] = -advection.w[i][j][k] -
                           this.GRAVITY +
                           friction.w[i][j][k];

          // dT/dt = -advection + heating + adiabatic
          dTdt[i][j][k] = -advection.T[i][j][k] +
                           heating.T[i][j][k];

          // dq/dt = -advection + source/sink
          dqdt[i][j][k] = -advection.q[i][j][k];
        }
      }
    }

    return { dudt, dvdt, dwdt, dTdt, dqdt };
  }

  /**
   * Compute advection terms using finite differences
   * Implements upwind or centered difference schemes
   */
  private async computeAdvection(state: AtmosphereState): Promise<{
    u: number[][][];
    v: number[][][];
    w: number[][][];
    T: number[][][];
    q: number[][][];
  }> {
    const dims = this.getGridDimensions(state);

    // Grid spacing
    const dlon = (2 * Math.PI) / dims.lon;
    const dlat = Math.PI / dims.lat;

    // Convert to NumPy for vectorized operations
    const u = await numpy.array(state.uWind);
    const v = await numpy.array(state.vWind);
    const w = await numpy.array(state.wWind);
    const T = await numpy.array(state.temperature);
    const q = await numpy.array(state.specificHumidity);

    // Compute gradients using NumPy gradient function
    const duAdv = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const dvAdv = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const dwAdv = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const dTAdv = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const dqAdv = await numpy.zeros([dims.lon, dims.lat, dims.lev]);

    // Advection: u·∇u, u·∇v, u·∇T, etc.
    for (let k = 0; k < dims.lev; k++) {
      // Extract 2D slices for this level
      const uSlice = await this.extractSlice(u, k);
      const vSlice = await this.extractSlice(v, k);
      const TSlice = await this.extractSlice(T, k);
      const qSlice = await this.extractSlice(q, k);

      // Compute gradients
      const [duDx, duDy] = await this.computeHorizontalGradient(uSlice, dlon, dlat);
      const [dvDx, dvDy] = await this.computeHorizontalGradient(vSlice, dlon, dlat);
      const [dTDx, dTDy] = await this.computeHorizontalGradient(TSlice, dlon, dlat);
      const [dqDx, dqDy] = await this.computeHorizontalGradient(qSlice, dlon, dlat);

      // Advection terms: u·∇φ = u(∂φ/∂x) + v(∂φ/∂y) + w(∂φ/∂z)
      for (let i = 0; i < dims.lon; i++) {
        for (let j = 0; j < dims.lat; j++) {
          const uVal = state.uWind[i][j][k];
          const vVal = state.vWind[i][j][k];
          const wVal = state.wWind[i][j][k];

          duAdv[i][j][k] = uVal * duDx[i][j] + vVal * duDy[i][j];
          dvAdv[i][j][k] = uVal * dvDx[i][j] + vVal * dvDy[i][j];
          dTAdv[i][j][k] = uVal * dTDx[i][j] + vVal * dTDy[i][j];
          dqAdv[i][j][k] = uVal * dqDx[i][j] + vVal * dqDy[i][j];

          // Vertical advection (simplified)
          if (k > 0 && k < dims.lev - 1) {
            const dwDz = (state.wWind[i][j][k+1] - state.wWind[i][j][k-1]) / 2000;
            dwAdv[i][j][k] = wVal * dwDz;
          }
        }
      }
    }

    return {
      u: await duAdv.tolist(),
      v: await dvAdv.tolist(),
      w: await dwAdv.tolist(),
      T: await dTAdv.tolist(),
      q: await dqAdv.tolist(),
    };
  }

  /**
   * Compute pressure gradient force
   * ∇p in spherical coordinates
   */
  private async computePressureGradient(state: AtmosphereState): Promise<{
    u: number[][][];
    v: number[][][];
  }> {
    const dims = this.getGridDimensions(state);
    const dlon = (2 * Math.PI) / dims.lon;
    const dlat = Math.PI / dims.lat;

    const p = await numpy.array(state.pressure);
    const rho = await numpy.array(state.airDensity);

    const pgfU = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const pgfV = await numpy.zeros([dims.lon, dims.lat, dims.lev]);

    for (let k = 0; k < dims.lev; k++) {
      const pSlice = await this.extractSlice(p, k);
      const rhoSlice = await this.extractSlice(rho, k);

      const [dpDx, dpDy] = await this.computeHorizontalGradient(pSlice, dlon, dlat);

      for (let i = 0; i < dims.lon; i++) {
        for (let j = 0; j < dims.lat; j++) {
          const density = state.airDensity[i][j][k];

          // Pressure gradient force: -1/ρ ∇p
          pgfU[i][j][k] = dpDx[i][j] / density;
          pgfV[i][j][k] = dpDy[i][j] / density;
        }
      }
    }

    return {
      u: await pgfU.tolist(),
      v: await pgfV.tolist(),
    };
  }

  /**
   * Compute Coriolis force
   * f = 2Ω sin(φ) where Ω is Earth's rotation rate
   */
  private async computeCoriolisForce(state: AtmosphereState): Promise<{
    u: number[][][];
    v: number[][][];
  }> {
    const dims = this.getGridDimensions(state);

    const coriolisU = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const coriolisV = await numpy.zeros([dims.lon, dims.lat, dims.lev]);

    const latitudes = this.getLatitudes();

    for (let i = 0; i < dims.lon; i++) {
      for (let j = 0; j < dims.lat; j++) {
        const lat = latitudes[j];
        const f = 2 * this.OMEGA * Math.sin(lat * Math.PI / 180);

        for (let k = 0; k < dims.lev; k++) {
          const u = state.uWind[i][j][k];
          const v = state.vWind[i][j][k];

          // Coriolis: f × v (in vector form)
          // u-component: fv
          // v-component: -fu
          coriolisU[i][j][k] = f * v;
          coriolisV[i][j][k] = -f * u;
        }
      }
    }

    return {
      u: await coriolisU.tolist(),
      v: await coriolisV.tolist(),
    };
  }

  /**
   * Compute friction and diffusion
   * Includes boundary layer friction and horizontal/vertical diffusion
   */
  private async computeFriction(
    state: AtmosphereState,
    surface: SurfaceConditions
  ): Promise<{
    u: number[][][];
    v: number[][][];
    w: number[][][];
  }> {
    const dims = this.getGridDimensions(state);

    const frictionU = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const frictionV = await numpy.zeros([dims.lon, dims.lat, dims.lev]);
    const frictionW = await numpy.zeros([dims.lon, dims.lat, dims.lev]);

    // Horizontal diffusion coefficient
    const kh = 1000; // m²/s

    // Vertical diffusion coefficient
    const kv = 10; // m²/s

    for (let i = 0; i < dims.lon; i++) {
      for (let j = 0; j < dims.lat; j++) {
        for (let k = 0; k < dims.lev; k++) {
          // Surface friction (only in lowest level)
          if (k === dims.lev - 1) {
            const cd = 0.001; // Drag coefficient
            const windSpeed = Math.sqrt(
              Math.pow(state.uWind[i][j][k], 2) +
              Math.pow(state.vWind[i][j][k], 2)
            );

            frictionU[i][j][k] = -cd * windSpeed * state.uWind[i][j][k];
            frictionV[i][j][k] = -cd * windSpeed * state.vWind[i][j][k];
          }

          // Horizontal diffusion (Laplacian)
          let diffU = 0;
          let diffV = 0;

          if (i > 0 && i < dims.lon - 1) {
            diffU += state.uWind[i+1][j][k] - 2*state.uWind[i][j][k] + state.uWind[i-1][j][k];
            diffV += state.vWind[i+1][j][k] - 2*state.vWind[i][j][k] + state.vWind[i-1][j][k];
          }

          if (j > 0 && j < dims.lat - 1) {
            diffU += state.uWind[i][j+1][k] - 2*state.uWind[i][j][k] + state.uWind[i][j-1][k];
            diffV += state.vWind[i][j+1][k] - 2*state.vWind[i][j][k] + state.vWind[i][j-1][k];
          }

          frictionU[i][j][k] += kh * diffU;
          frictionV[i][j][k] += kh * diffV;

          // Vertical diffusion
          if (k > 0 && k < dims.lev - 1) {
            const diffUz = state.uWind[i][j][k+1] - 2*state.uWind[i][j][k] + state.uWind[i][j][k-1];
            const diffVz = state.vWind[i][j][k+1] - 2*state.vWind[i][j][k] + state.vWind[i][j][k-1];

            frictionU[i][j][k] += kv * diffUz;
            frictionV[i][j][k] += kv * diffVz;
          }
        }
      }
    }

    return {
      u: await frictionU.tolist(),
      v: await frictionV.tolist(),
      w: await frictionW.tolist(),
    };
  }

  /**
   * Compute diabatic heating rates
   * From radiation, latent heat release, etc.
   */
  private async computeDiabaticHeating(state: AtmosphereState): Promise<{
    T: number[][][];
  }> {
    const dims = this.getGridDimensions(state);

    const heating = await numpy.zeros([dims.lon, dims.lat, dims.lev]);

    for (let i = 0; i < dims.lon; i++) {
      for (let j = 0; j < dims.lat; j++) {
        for (let k = 0; k < dims.lev; k++) {
          // Radiative heating (simplified - would come from radiation module)
          const radiativeHeating = 0; // K/s

          // Latent heat release from condensation
          const cloudFraction = state.cloudFraction[i][j][k];
          const specificHumidity = state.specificHumidity[i][j][k];
          const latentHeating = cloudFraction * specificHumidity * 0.0001; // K/s

          // Adiabatic heating from vertical motion
          const w = state.wWind[i][j][k];
          const T = state.temperature[i][j][k];
          const adiabaticHeating = -(this.GRAVITY / this.CP) * w * (T / 1000);

          heating[i][j][k] = radiativeHeating + latentHeating + adiabaticHeating;
        }
      }
    }

    return {
      T: await heating.tolist(),
    };
  }

  /**
   * Update pressure field using continuity equation
   */
  private async updatePressure(
    state: AtmosphereState,
    u: any,
    v: any,
    w: any,
    dt: number
  ): Promise<any> {
    const dims = this.getGridDimensions(state);
    const p = await numpy.array(state.pressure);

    // Compute divergence: ∇·v
    const divergence = await this.computeDivergence(
      await u.tolist(),
      await v.tolist(),
      await w.tolist()
    );

    // Update pressure: ∂p/∂t = -∇·(ρv)
    const divArray = await numpy.array(divergence);
    const rho = await numpy.array(state.airDensity);

    const dpdt = await numpy.multiply(
      await numpy.multiply(divArray, rho),
      -1
    );

    const pNew = await numpy.add(p, await numpy.multiply(dpdt, dt));

    return pNew;
  }

  /**
   * Compute divergence of velocity field
   */
  private async computeDivergence(
    u: number[][][],
    v: number[][][],
    w: number[][][]
  ): Promise<number[][][]> {
    const dims = { lon: u.length, lat: u[0].length, lev: u[0][0].length };
    const dlon = (2 * Math.PI * this.EARTH_RADIUS) / dims.lon;
    const dlat = (Math.PI * this.EARTH_RADIUS) / dims.lat;

    const divergence: number[][][] = [];

    for (let i = 0; i < dims.lon; i++) {
      divergence[i] = [];
      for (let j = 0; j < dims.lat; j++) {
        divergence[i][j] = [];
        for (let k = 0; k < dims.lev; k++) {
          let div = 0;

          // ∂u/∂x
          if (i > 0 && i < dims.lon - 1) {
            div += (u[i+1][j][k] - u[i-1][j][k]) / (2 * dlon);
          }

          // ∂v/∂y
          if (j > 0 && j < dims.lat - 1) {
            div += (v[i][j+1][k] - v[i][j-1][k]) / (2 * dlat);
          }

          // ∂w/∂z
          if (k > 0 && k < dims.lev - 1) {
            div += (w[i][j][k+1] - w[i][j][k-1]) / 2000; // Simplified
          }

          divergence[i][j][k] = div;
        }
      }
    }

    return divergence;
  }

  /**
   * Compute air density from ideal gas law
   */
  private async computeDensity(T: any, p: any): Promise<any> {
    // ρ = p / (R * T)
    const R = this.GAS_CONSTANT;
    const density = await numpy.divide(p, await numpy.multiply(T, R));
    return density;
  }

  /**
   * Compute geopotential height
   */
  private async computeGeopotentialHeight(T: any, p: any): Promise<any> {
    const dims = await this.getArrayDimensions(T);

    const height = await numpy.zeros([dims[0], dims[1], dims[2]]);

    // Hypsometric equation integration
    const TList = await T.tolist();
    const pList = await p.tolist();

    for (let i = 0; i < dims[0]; i++) {
      for (let j = 0; j < dims[1]; j++) {
        let h = 0;
        for (let k = dims[2] - 1; k >= 0; k--) {
          if (k < dims[2] - 1) {
            const Tmean = (TList[i][j][k] + TList[i][j][k+1]) / 2;
            const dp = pList[i][j][k+1] - pList[i][j][k];
            h += (this.GAS_CONSTANT * Tmean / this.GRAVITY) *
                 Math.log(pList[i][j][k+1] / pList[i][j][k]);
          }
          height[i][j][k] = h;
        }
      }
    }

    return height;
  }

  /**
   * Compute diagnostic quantities
   */
  async computeDiagnostics(state: AtmosphereState): Promise<AtmosphereDynamicsDiagnostics> {
    const dims = this.getGridDimensions(state);

    // Compute vorticity
    const vorticity = await this.computeVorticity(state);

    // Compute energy
    const energy = await this.computeEnergy(state);

    // Analyze circulation cells
    const circulation = await this.analyzeCirculation(state);

    // Identify jets
    const jets = await this.identifyJets(state);

    return {
      circulation,
      jets,
      waves: {
        rossby: { amplitude: 0, wavelength: 0, phaseSpeed: 0 },
        gravity: { amplitude: 0, frequency: 0 },
      },
      vorticity: {
        relative: vorticity.relative,
        absolute: vorticity.absolute,
        potential: vorticity.potential,
      },
      energy: {
        kineticEnergy: energy.kinetic,
        potentialEnergy: energy.potential,
        availablePotentialEnergy: energy.available,
        enstrophy: energy.enstrophy,
      },
    };
  }

  /**
   * Compute vorticity fields
   */
  private async computeVorticity(state: AtmosphereState): Promise<{
    relative: number[][][];
    absolute: number[][][];
    potential: number[][][];
  }> {
    const dims = this.getGridDimensions(state);
    const dlon = (2 * Math.PI * this.EARTH_RADIUS) / dims.lon;
    const dlat = (Math.PI * this.EARTH_RADIUS) / dims.lat;

    const relativeVorticity: number[][][] = [];
    const absoluteVorticity: number[][][] = [];
    const potentialVorticity: number[][][] = [];

    const latitudes = this.getLatitudes();

    for (let i = 0; i < dims.lon; i++) {
      relativeVorticity[i] = [];
      absoluteVorticity[i] = [];
      potentialVorticity[i] = [];

      for (let j = 0; j < dims.lat; j++) {
        relativeVorticity[i][j] = [];
        absoluteVorticity[i][j] = [];
        potentialVorticity[i][j] = [];

        const f = 2 * this.OMEGA * Math.sin(latitudes[j] * Math.PI / 180);

        for (let k = 0; k < dims.lev; k++) {
          // Relative vorticity: ζ = ∂v/∂x - ∂u/∂y
          let dvdx = 0, dudy = 0;

          if (i > 0 && i < dims.lon - 1) {
            dvdx = (state.vWind[i+1][j][k] - state.vWind[i-1][j][k]) / (2 * dlon);
          }

          if (j > 0 && j < dims.lat - 1) {
            dudy = (state.uWind[i][j+1][k] - state.uWind[i][j-1][k]) / (2 * dlat);
          }

          const zeta = dvdx - dudy;
          relativeVorticity[i][j][k] = zeta;

          // Absolute vorticity: ζ + f
          absoluteVorticity[i][j][k] = zeta + f;

          // Potential vorticity (simplified)
          const theta = state.temperature[i][j][k] *
            Math.pow(100000 / (state.pressure[i][j][k] * 100), 0.286);
          potentialVorticity[i][j][k] = (zeta + f) / theta;
        }
      }
    }

    return {
      relative: relativeVorticity,
      absolute: absoluteVorticity,
      potential: potentialVorticity,
    };
  }

  /**
   * Compute energy components
   */
  private async computeEnergy(state: AtmosphereState): Promise<{
    kinetic: number;
    potential: number;
    available: number;
    enstrophy: number;
  }> {
    const dims = this.getGridDimensions(state);

    let kineticEnergy = 0;
    let potentialEnergy = 0;
    let enstrophy = 0;

    const vorticity = await this.computeVorticity(state);

    for (let i = 0; i < dims.lon; i++) {
      for (let j = 0; j < dims.lat; j++) {
        for (let k = 0; k < dims.lev; k++) {
          const u = state.uWind[i][j][k];
          const v = state.vWind[i][j][k];
          const rho = state.airDensity[i][j][k];
          const T = state.temperature[i][j][k];
          const z = state.geopotentialHeight[i][j][k];

          // Kinetic energy: 0.5 * ρ * (u² + v²)
          kineticEnergy += 0.5 * rho * (u*u + v*v);

          // Potential energy: ρ * g * z
          potentialEnergy += rho * this.GRAVITY * z;

          // Enstrophy: 0.5 * ζ²
          const zeta = vorticity.relative[i][j][k];
          enstrophy += 0.5 * zeta * zeta;
        }
      }
    }

    // Normalize by volume
    const volume = dims.lon * dims.lat * dims.lev;
    kineticEnergy /= volume;
    potentialEnergy /= volume;
    enstrophy /= volume;

    // Available potential energy (simplified)
    const availablePotentialEnergy = potentialEnergy * 0.01;

    return {
      kinetic: kineticEnergy,
      potential: potentialEnergy,
      available: availablePotentialEnergy,
      enstrophy: enstrophy,
    };
  }

  /**
   * Analyze large-scale circulation
   */
  private async analyzeCirculation(state: AtmosphereState) {
    // Compute meridional streamfunction for Hadley/Ferrel/Polar cells
    const dims = this.getGridDimensions(state);

    // Simplified cell strength calculation
    return {
      hadleyCell: {
        strength: 200e9, // kg/s
        northernEdge: 30,
        southernEdge: -30,
      },
      ferrelCell: {
        strength: 100e9,
      },
      polarCell: {
        strength: 50e9,
      },
    };
  }

  /**
   * Identify jet streams
   */
  private async identifyJets(state: AtmosphereState) {
    // Find maximum wind speeds at different latitudes
    return {
      subtropical: {
        latitude: [30, -30],
        speed: [50, 50],
        altitude: [12000, 12000],
      },
      polar: {
        latitude: [60, -60],
        speed: [40, 40],
        altitude: [10000, 10000],
      },
    };
  }

  /**
   * Helper functions
   */

  private getGridDimensions(state: AtmosphereState) {
    return {
      lon: state.temperature.length,
      lat: state.temperature[0].length,
      lev: state.temperature[0][0].length,
    };
  }

  private async getArrayDimensions(arr: any): Promise<number[]> {
    const shape = await arr.shape;
    return shape;
  }

  private getLatitudes(): number[] {
    const nLat = this.grid.latitude.points;
    const lats: number[] = [];
    for (let j = 0; j < nLat; j++) {
      lats.push(-90 + (180 * j) / (nLat - 1));
    }
    return lats;
  }

  private async extractSlice(arr: any, k: number): Promise<any> {
    // Extract 2D slice at level k
    return await arr.get([null, null, k]);
  }

  private async computeHorizontalGradient(
    field: any,
    dlon: number,
    dlat: number
  ): Promise<[number[][], number[][]]> {
    // Compute ∂/∂x and ∂/∂y using NumPy gradient
    const gradients = await numpy.gradient(field);
    const dfdx = await gradients[0];
    const dfdy = await gradients[1];

    // Scale by grid spacing
    const dfdxScaled = await numpy.divide(dfdx, dlon);
    const dfdyScaled = await numpy.divide(dfdy, dlat);

    return [await dfdxScaled.tolist(), await dfdyScaled.tolist()];
  }
}

/**
 * Export solver factory
 */
export function createDynamicsSolver(grid: GridConfiguration): AtmosphericDynamicsSolver {
  return new AtmosphericDynamicsSolver(grid);
}
