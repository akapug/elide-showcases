/**
 * PID Controller Implementation
 *
 * Implements PID (Proportional-Integral-Derivative) control with:
 * - Auto-tuning using Python control systems library
 * - Anti-windup
 * - Derivative filtering
 * - Gain scheduling
 */

// @ts-ignore
import control from 'python:control';
// @ts-ignore
import numpy from 'python:numpy';

import {
  PIDConfig,
  PIDState,
  ControllerMetrics,
  DEFAULT_PID_CONFIG
} from '../types';

/**
 * PID Controller with auto-tuning capabilities
 */
export class PIDController {
  private config: PIDConfig;
  private state: PIDState;
  private enabled: boolean;
  private lastUpdateTime: number;

  constructor(config?: Partial<PIDConfig>) {
    this.config = { ...DEFAULT_PID_CONFIG, ...config };
    this.state = this.resetState();
    this.enabled = true;
    this.lastUpdateTime = Date.now();
  }

  /**
   * Compute control output
   */
  public compute(setpoint: number, measured: number, dt?: number): number {
    if (!this.enabled) {
      return 0;
    }

    const currentTime = Date.now();
    const deltaTime = dt || (currentTime - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = currentTime;

    // Compute error
    const error = setpoint - measured;

    // Apply deadband
    const effectiveError = Math.abs(error) < (this.config.deadband || 0) ? 0 : error;

    // Proportional term
    const pTerm = this.config.kp * effectiveError;

    // Integral term with anti-windup
    this.state.integral += effectiveError * deltaTime;

    if (this.config.integralLimit) {
      this.state.integral = Math.max(
        -this.config.integralLimit,
        Math.min(this.config.integralLimit, this.state.integral)
      );
    }

    const iTerm = this.config.ki * this.state.integral;

    // Derivative term with filtering
    const derivative = (effectiveError - this.state.lastError) / deltaTime;

    // Low-pass filter on derivative (alpha = 0.1)
    const alpha = 0.1;
    this.state.derivative = alpha * derivative + (1 - alpha) * this.state.derivative;

    const dTerm = this.config.kd * this.state.derivative;

    // Compute output
    let output = pTerm + iTerm + dTerm;

    // Apply output limits
    if (this.config.outputLimit) {
      output = Math.max(
        -this.config.outputLimit,
        Math.min(this.config.outputLimit, output)
      );
    }

    // Update state
    this.state.error = effectiveError;
    this.state.lastError = effectiveError;
    this.state.output = output;

    return output;
  }

  /**
   * Auto-tune PID gains using Ziegler-Nichols method
   */
  public autoTuneZieglerNichols(plantModel: {
    numerator: number[];
    denominator: number[];
  }): { kp: number; ki: number; kd: number } {
    // Create transfer function from plant model
    const num = numpy.array(plantModel.numerator);
    const den = numpy.array(plantModel.denominator);
    const sys = control.TransferFunction(num, den);

    // Find critical gain and period
    // Increase gain until system oscillates
    let ku = 1.0; // Ultimate gain
    let tu = 1.0; // Ultimate period

    try {
      // Compute stability margins
      const margins = control.stability_margins(sys);
      const { gm, pm, wgc, wpc } = margins;

      if (gm && wpc) {
        ku = gm;
        tu = 2 * Math.PI / wpc;
      } else {
        // Use alternative method
        const [poles, zeros] = control.pzmap(sys);

        // Find dominant pole
        let maxRealPart = -Infinity;
        for (const pole of poles) {
          const realPart = typeof pole === 'number' ? pole : pole.real;
          if (realPart > maxRealPart) {
            maxRealPart = realPart;
          }
        }

        // Estimate parameters
        ku = Math.abs(1.0 / maxRealPart);
        tu = 2 * Math.PI / Math.abs(maxRealPart);
      }
    } catch (error) {
      console.warn('Auto-tuning failed, using default values');
      ku = 2.0;
      tu = 1.0;
    }

    // Ziegler-Nichols PID tuning rules
    const kp = 0.6 * ku;
    const ki = 1.2 * ku / tu;
    const kd = 0.075 * ku * tu;

    this.setGains(kp, ki, kd);

    return { kp, ki, kd };
  }

  /**
   * Auto-tune using Cohen-Coon method
   */
  public autoTuneCohenCoon(stepResponse: {
    time: number[];
    output: number[];
  }): { kp: number; ki: number; kd: number } {
    // Identify first-order plus dead time (FOPDT) model parameters
    const { K, tau, theta } = this.identifyFOPDT(stepResponse);

    // Cohen-Coon tuning rules
    const kp = (1.35 / K) * (tau / theta) * (1 + theta / (4 * tau));
    const ti = theta * (2.5 - 2 * theta / tau) / (1 - 0.39 * theta / tau);
    const td = 0.37 * theta / (1 - 0.39 * theta / tau);

    const ki = kp / ti;
    const kd = kp * td;

    this.setGains(kp, ki, kd);

    return { kp, ki, kd };
  }

  /**
   * Identify First-Order Plus Dead Time (FOPDT) model
   */
  private identifyFOPDT(stepResponse: {
    time: number[];
    output: number[];
  }): { K: number; tau: number; theta: number } {
    const output = numpy.array(stepResponse.output);
    const time = numpy.array(stepResponse.time);

    // Steady-state gain
    const K = output[output.length - 1] - output[0];

    // Find time to 63.2% of final value (tau)
    const finalValue = output[output.length - 1];
    const initialValue = output[0];
    const target63 = initialValue + 0.632 * (finalValue - initialValue);

    let tau = 1.0;
    for (let i = 0; i < output.length; i++) {
      if (output[i] >= target63) {
        tau = time[i];
        break;
      }
    }

    // Estimate dead time (theta) - time to 5% of final value
    const target5 = initialValue + 0.05 * (finalValue - initialValue);
    let theta = 0;
    for (let i = 0; i < output.length; i++) {
      if (output[i] >= target5) {
        theta = time[i];
        break;
      }
    }

    return { K, tau, theta };
  }

  /**
   * Analyze closed-loop performance
   */
  public analyzeClosedLoop(): ControllerMetrics {
    // Create PID transfer function
    const pidNum = numpy.array([this.config.kd, this.config.kp, this.config.ki]);
    const pidDen = numpy.array([1, 0]);
    const pidTF = control.TransferFunction(pidNum, pidDen);

    // Assume simple plant model for analysis
    const plantNum = numpy.array([1.0]);
    const plantDen = numpy.array([1.0, 1.0, 0.0]);
    const plantTF = control.TransferFunction(plantNum, plantDen);

    // Create closed-loop system
    const openLoop = control.series(pidTF, plantTF);
    const closedLoop = control.feedback(openLoop, 1);

    // Get step response info
    const stepInfo = control.step_info(closedLoop);

    return {
      riseTime: stepInfo.RiseTime || 0,
      settlingTime: stepInfo.SettlingTime || 0,
      overshoot: stepInfo.Overshoot || 0,
      steadyStateError: 0,
      peakTime: stepInfo.PeakTime || 0
    };
  }

  /**
   * Compute optimal PID gains using pole placement
   */
  public computePolePlacementGains(
    desiredPoles: number[]
  ): { kp: number; ki: number; kd: number } {
    // For a third-order system (PID + second-order plant)
    if (desiredPoles.length !== 3) {
      throw new Error('Pole placement requires 3 desired poles');
    }

    // Compute characteristic polynomial from desired poles
    const poly = numpy.poly(desiredPoles);

    // Extract coefficients
    const a2 = poly[1];
    const a1 = poly[2];
    const a0 = poly[3];

    // Map to PID gains (simplified)
    const kp = a1;
    const ki = a0;
    const kd = a2;

    this.setGains(kp, ki, kd);

    return { kp, ki, kd };
  }

  /**
   * Adaptive PID with gain scheduling
   */
  public computeAdaptive(
    setpoint: number,
    measured: number,
    operatingPoint: number,
    dt?: number
  ): number {
    // Adjust gains based on operating point
    const baseKp = this.config.kp;
    const baseKi = this.config.ki;
    const baseKd = this.config.kd;

    // Gain scheduling based on error magnitude
    const error = Math.abs(setpoint - measured);
    let gainMultiplier = 1.0;

    if (error > 1.0) {
      // Large error: increase proportional gain
      gainMultiplier = 1.5;
    } else if (error < 0.1) {
      // Small error: increase integral gain
      this.config.ki = baseKi * 1.5;
    }

    this.config.kp = baseKp * gainMultiplier;

    // Compute control
    const output = this.compute(setpoint, measured, dt);

    // Restore original gains
    this.config.kp = baseKp;
    this.config.ki = baseKi;
    this.config.kd = baseKd;

    return output;
  }

  /**
   * Set PID gains
   */
  public setGains(kp: number, ki: number, kd: number): void {
    this.config.kp = kp;
    this.config.ki = ki;
    this.config.kd = kd;
  }

  /**
   * Get current gains
   */
  public getGains(): { kp: number; ki: number; kd: number } {
    return {
      kp: this.config.kp,
      ki: this.config.ki,
      kd: this.config.kd
    };
  }

  /**
   * Reset controller state
   */
  public reset(): void {
    this.state = this.resetState();
    this.lastUpdateTime = Date.now();
  }

  /**
   * Enable/disable controller
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  /**
   * Get current state
   */
  public getState(): PIDState {
    return { ...this.state };
  }

  /**
   * Set output limits
   */
  public setOutputLimits(min: number, max: number): void {
    this.config.outputLimit = Math.max(Math.abs(min), Math.abs(max));
  }

  /**
   * Set integral limits (anti-windup)
   */
  public setIntegralLimits(limit: number): void {
    this.config.integralLimit = limit;
  }

  /**
   * Create initial state
   */
  private resetState(): PIDState {
    return {
      error: 0,
      integral: 0,
      derivative: 0,
      output: 0,
      lastError: 0,
      lastTime: Date.now()
    };
  }

  /**
   * Simulate step response
   */
  public simulateStepResponse(
    duration: number,
    dt: number = 0.01
  ): { time: number[]; output: number[]; error: number[] } {
    this.reset();

    const time: number[] = [];
    const output: number[] = [];
    const error: number[] = [];

    // Simple second-order plant model
    let plantState = 0;
    let plantVelocity = 0;
    const setpoint = 1.0;

    for (let t = 0; t <= duration; t += dt) {
      const controlOutput = this.compute(setpoint, plantState, dt);

      // Update plant (second-order system)
      const plantAcceleration = controlOutput - 2 * plantVelocity - plantState;
      plantVelocity += plantAcceleration * dt;
      plantState += plantVelocity * dt;

      time.push(t);
      output.push(plantState);
      error.push(setpoint - plantState);
    }

    return { time, output, error };
  }

  /**
   * Compute ISE (Integral Square Error) metric
   */
  public computeISE(
    setpoint: number,
    measured: number[],
    dt: number
  ): number {
    let ise = 0;
    for (const value of measured) {
      const error = setpoint - value;
      ise += error * error * dt;
    }
    return ise;
  }

  /**
   * Compute IAE (Integral Absolute Error) metric
   */
  public computeIAE(
    setpoint: number,
    measured: number[],
    dt: number
  ): number {
    let iae = 0;
    for (const value of measured) {
      const error = Math.abs(setpoint - value);
      iae += error * dt;
    }
    return iae;
  }

  /**
   * Compute ITAE (Integral Time Absolute Error) metric
   */
  public computeITAE(
    setpoint: number,
    measured: number[],
    dt: number
  ): number {
    let itae = 0;
    let time = 0;
    for (const value of measured) {
      const error = Math.abs(setpoint - value);
      itae += time * error * dt;
      time += dt;
    }
    return itae;
  }
}

/**
 * Cascade PID Controller (inner and outer loop)
 */
export class CascadePIDController {
  private outerController: PIDController;
  private innerController: PIDController;

  constructor(
    outerConfig: Partial<PIDConfig>,
    innerConfig: Partial<PIDConfig>
  ) {
    this.outerController = new PIDController(outerConfig);
    this.innerController = new PIDController(innerConfig);
  }

  /**
   * Compute cascade control
   */
  public compute(
    outerSetpoint: number,
    outerMeasured: number,
    innerMeasured: number,
    dt?: number
  ): number {
    // Outer loop computes setpoint for inner loop
    const innerSetpoint = this.outerController.compute(
      outerSetpoint,
      outerMeasured,
      dt
    );

    // Inner loop computes actual control output
    const output = this.innerController.compute(
      innerSetpoint,
      innerMeasured,
      dt
    );

    return output;
  }

  /**
   * Reset both controllers
   */
  public reset(): void {
    this.outerController.reset();
    this.innerController.reset();
  }

  /**
   * Get outer controller
   */
  public getOuterController(): PIDController {
    return this.outerController;
  }

  /**
   * Get inner controller
   */
  public getInnerController(): PIDController {
    return this.innerController;
  }
}

/**
 * Multi-variable PID controller (for MIMO systems)
 */
export class MultiPIDController {
  private controllers: PIDController[];

  constructor(configs: Partial<PIDConfig>[]) {
    this.controllers = configs.map(config => new PIDController(config));
  }

  /**
   * Compute control for all channels
   */
  public compute(
    setpoints: number[],
    measured: number[],
    dt?: number
  ): number[] {
    if (setpoints.length !== this.controllers.length) {
      throw new Error('Setpoint count must match controller count');
    }

    return this.controllers.map((controller, i) =>
      controller.compute(setpoints[i], measured[i], dt)
    );
  }

  /**
   * Reset all controllers
   */
  public reset(): void {
    this.controllers.forEach(controller => controller.reset());
  }

  /**
   * Get individual controller
   */
  public getController(index: number): PIDController {
    return this.controllers[index];
  }

  /**
   * Set gains for all controllers
   */
  public setAllGains(gains: { kp: number; ki: number; kd: number }[]): void {
    if (gains.length !== this.controllers.length) {
      throw new Error('Gains count must match controller count');
    }

    this.controllers.forEach((controller, i) => {
      const { kp, ki, kd } = gains[i];
      controller.setGains(kp, ki, kd);
    });
  }
}

export default PIDController;
