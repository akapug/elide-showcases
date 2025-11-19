/**
 * Optimization Algorithms
 *
 * Comprehensive optimization methods using SciPy's optimize module through Elide's
 * Python bridge. Provides unconstrained and constrained optimization, curve fitting,
 * root finding, and linear programming.
 *
 * Features:
 * - Unconstrained optimization (BFGS, Nelder-Mead, CG, etc.)
 * - Constrained optimization (SLSQP, trust-constr)
 * - Global optimization (basin-hopping, differential evolution)
 * - Curve fitting and parameter estimation
 * - Root finding (Newton, Brent, fsolve)
 * - Linear and quadratic programming
 * - Least squares optimization
 */

import Python from 'python';

// Type definitions
export interface OptimizeResult {
  x: number[];
  success: boolean;
  status: number;
  message: string;
  fun: number;
  jac?: number[];
  hess?: number[][];
  hess_inv?: number[][];
  nfev: number;
  njev?: number;
  nit: number;
}

export interface OptimizeOptions {
  maxiter?: number;
  disp?: boolean;
  gtol?: number;
  ftol?: number;
  xtol?: number;
  eps?: number;
}

export interface Constraint {
  type: 'eq' | 'ineq';
  fun: (x: number[]) => number | number[];
  jac?: (x: number[]) => number[];
  args?: any[];
}

export interface Bounds {
  lb: number[];
  ub: number[];
}

export interface CurveFitResult {
  params: number[];
  covariance: number[][];
  infodict?: any;
  mesg?: string;
  ier?: number;
}

export interface RootResult {
  x: number[];
  success: boolean;
  message: string;
  nfev: number;
  fun?: number[];
}

export interface LinearProgramResult {
  x: number[];
  fun: number;
  success: boolean;
  status: number;
  message: string;
  nit: number;
}

export interface LeastSquaresResult {
  x: number[];
  cost: number;
  fun: number[];
  jac: number[][];
  grad: number[];
  optimality: number;
  active_mask: number[];
  nfev: number;
  njev: number;
  status: number;
  message: string;
  success: boolean;
}

/**
 * Optimization Class
 */
export class Optimization {
  private numpy: any;
  private scipy: any;
  private optimize: any;

  constructor() {
    this.numpy = Python.import('numpy');
    this.scipy = Python.import('scipy');
    this.optimize = this.scipy.optimize;
  }

  // ============================================================================
  // Unconstrained Optimization
  // ============================================================================

  /**
   * Minimize a scalar function of one or more variables
   */
  minimize(
    func: (x: number[]) => number,
    x0: number[],
    method: 'BFGS' | 'Nelder-Mead' | 'CG' | 'Powell' | 'L-BFGS-B' | 'TNC' | 'SLSQP' | 'trust-constr' = 'BFGS',
    options?: OptimizeOptions,
    jac?: (x: number[]) => number[],
    hess?: (x: number[]) => number[][],
    bounds?: [number, number][]
  ): OptimizeResult {
    // Create Python function wrapper
    const pyFunc = this.createPyFunction(func);
    const npX0 = this.numpy.array(x0);

    const kwargs: any = { method };

    if (options) {
      kwargs.options = options;
    }

    if (jac) {
      kwargs.jac = this.createPyFunction(jac);
    }

    if (hess) {
      kwargs.hess = this.createPyFunction(hess);
    }

    if (bounds) {
      kwargs.bounds = bounds;
    }

    const result = this.optimize.minimize(pyFunc, npX0, kwargs);

    return this.parseOptimizeResult(result);
  }

  /**
   * Minimize a scalar function of one variable
   */
  minimizeScalar(
    func: (x: number) => number,
    bounds?: [number, number],
    method: 'brent' | 'golden' | 'bounded' = 'brent',
    options?: OptimizeOptions
  ): { x: number; fun: number; nfev: number; success: boolean } {
    const pyFunc = this.createPyFunction(func);

    const kwargs: any = { method };

    if (bounds) {
      kwargs.bounds = bounds;
    }

    if (options) {
      kwargs.options = options;
    }

    const result = this.optimize.minimize_scalar(pyFunc, kwargs);

    return {
      x: this.toJs(result.x),
      fun: this.toJs(result.fun),
      nfev: this.toJs(result.nfev),
      success: this.toJs(result.success)
    };
  }

  /**
   * BFGS optimization
   */
  bfgs(
    func: (x: number[]) => number,
    x0: number[],
    fprime?: (x: number[]) => number[],
    options?: OptimizeOptions
  ): OptimizeResult {
    return this.minimize(func, x0, 'BFGS', options, fprime);
  }

  /**
   * Conjugate gradient optimization
   */
  cg(
    func: (x: number[]) => number,
    x0: number[],
    fprime?: (x: number[]) => number[],
    options?: OptimizeOptions
  ): OptimizeResult {
    return this.minimize(func, x0, 'CG', options, fprime);
  }

  /**
   * Nelder-Mead simplex algorithm
   */
  nelderMead(
    func: (x: number[]) => number,
    x0: number[],
    options?: OptimizeOptions
  ): OptimizeResult {
    return this.minimize(func, x0, 'Nelder-Mead', options);
  }

  /**
   * Powell's method
   */
  powell(
    func: (x: number[]) => number,
    x0: number[],
    options?: OptimizeOptions
  ): OptimizeResult {
    return this.minimize(func, x0, 'Powell', options);
  }

  // ============================================================================
  // Constrained Optimization
  // ============================================================================

  /**
   * Minimize with constraints
   */
  minimizeConstrained(problem: {
    objective: (x: number[]) => number;
    x0: number[];
    constraints?: Constraint[];
    bounds?: [number, number][];
    method?: 'SLSQP' | 'trust-constr' | 'COBYLA';
    jac?: (x: number[]) => number[];
    options?: OptimizeOptions;
  }): OptimizeResult {
    const {
      objective,
      x0,
      constraints = [],
      bounds,
      method = 'SLSQP',
      jac,
      options
    } = problem;

    const pyFunc = this.createPyFunction(objective);
    const npX0 = this.numpy.array(x0);

    const kwargs: any = { method };

    if (constraints.length > 0) {
      kwargs.constraints = constraints.map(c => ({
        type: c.type,
        fun: this.createPyFunction(c.fun),
        jac: c.jac ? this.createPyFunction(c.jac) : undefined
      }));
    }

    if (bounds) {
      kwargs.bounds = bounds;
    }

    if (jac) {
      kwargs.jac = this.createPyFunction(jac);
    }

    if (options) {
      kwargs.options = options;
    }

    const result = this.optimize.minimize(pyFunc, npX0, kwargs);

    return this.parseOptimizeResult(result);
  }

  /**
   * Linear programming
   */
  linprog(
    c: number[],
    A_ub?: number[][],
    b_ub?: number[],
    A_eq?: number[][],
    b_eq?: number[],
    bounds?: [number, number][],
    method: 'highs' | 'highs-ds' | 'highs-ipm' | 'interior-point' | 'revised simplex' = 'highs'
  ): LinearProgramResult {
    const npC = this.numpy.array(c);

    const kwargs: any = { method };

    if (A_ub && b_ub) {
      kwargs.A_ub = this.numpy.array(A_ub);
      kwargs.b_ub = this.numpy.array(b_ub);
    }

    if (A_eq && b_eq) {
      kwargs.A_eq = this.numpy.array(A_eq);
      kwargs.b_eq = this.numpy.array(b_eq);
    }

    if (bounds) {
      kwargs.bounds = bounds;
    }

    const result = this.optimize.linprog(npC, kwargs);

    return {
      x: this.toJs(result.x),
      fun: this.toJs(result.fun),
      success: this.toJs(result.success),
      status: this.toJs(result.status),
      message: this.toJs(result.message),
      nit: this.toJs(result.nit)
    };
  }

  /**
   * Quadratic programming (using cvxopt if available)
   */
  quadprog(
    H: number[][],
    c: number[],
    A?: number[][],
    b?: number[],
    Aeq?: number[][],
    beq?: number[]
  ): { x: number[]; fun: number } {
    // Convert to standard QP form: minimize (1/2)x'Hx + c'x
    // subject to Ax <= b, Aeqx = beq

    // For now, use minimize with method='SLSQP'
    const objective = (x: number[]) => {
      const npX = this.numpy.array(x);
      const npH = this.numpy.array(H);
      const npC = this.numpy.array(c);

      const quadTerm = 0.5 * this.numpy.dot(this.numpy.dot(npX, npH), npX);
      const linTerm = this.numpy.dot(npC, npX);

      return quadTerm + linTerm;
    };

    const constraints: Constraint[] = [];

    if (A && b) {
      for (let i = 0; i < A.length; i++) {
        const row = A[i];
        const bound = b[i];
        constraints.push({
          type: 'ineq',
          fun: (x: number[]) => bound - this.numpy.dot(this.numpy.array(row), this.numpy.array(x))
        });
      }
    }

    if (Aeq && beq) {
      for (let i = 0; i < Aeq.length; i++) {
        const row = Aeq[i];
        const bound = beq[i];
        constraints.push({
          type: 'eq',
          fun: (x: number[]) => this.numpy.dot(this.numpy.array(row), this.numpy.array(x)) - bound
        });
      }
    }

    const x0 = new Array(H.length).fill(0);
    const result = this.minimizeConstrained({
      objective,
      x0,
      constraints
    });

    return {
      x: result.x,
      fun: result.fun
    };
  }

  // ============================================================================
  // Global Optimization
  // ============================================================================

  /**
   * Basin-hopping global optimization
   */
  basinhopping(
    func: (x: number[]) => number,
    x0: number[],
    niter: number = 100,
    T: number = 1.0,
    stepsize: number = 0.5,
    minimizer_kwargs?: any
  ): OptimizeResult {
    const pyFunc = this.createPyFunction(func);
    const npX0 = this.numpy.array(x0);

    const kwargs: any = { niter, T, stepsize };

    if (minimizer_kwargs) {
      kwargs.minimizer_kwargs = minimizer_kwargs;
    }

    const result = this.optimize.basinhopping(pyFunc, npX0, kwargs);

    return this.parseOptimizeResult(result);
  }

  /**
   * Differential evolution
   */
  differentialEvolution(
    func: (x: number[]) => number,
    bounds: [number, number][],
    strategy: 'best1bin' | 'best1exp' | 'rand1exp' | 'randtobest1exp' | 'currenttobest1exp' | 'best2exp' | 'rand2exp' | 'randtobest1bin' | 'currenttobest1bin' | 'best2bin' | 'rand2bin' | 'rand1bin' = 'best1bin',
    maxiter: number = 1000,
    popsize: number = 15,
    tol: number = 0.01,
    mutation: number | [number, number] = 0.5,
    recombination: number = 0.7
  ): OptimizeResult {
    const pyFunc = this.createPyFunction(func);

    const kwargs: any = {
      bounds,
      strategy,
      maxiter,
      popsize,
      tol,
      mutation,
      recombination
    };

    const result = this.optimize.differential_evolution(pyFunc, kwargs);

    return this.parseOptimizeResult(result);
  }

  /**
   * Dual annealing
   */
  dualAnnealing(
    func: (x: number[]) => number,
    bounds: [number, number][],
    maxiter: number = 1000,
    initial_temp: number = 5230.0,
    restart_temp_ratio: number = 2e-5,
    visit: number = 2.62,
    accept: number = -5.0
  ): OptimizeResult {
    const pyFunc = this.createPyFunction(func);

    const kwargs: any = {
      bounds,
      maxiter,
      initial_temp,
      restart_temp_ratio,
      visit,
      accept
    };

    const result = this.optimize.dual_annealing(pyFunc, kwargs);

    return this.parseOptimizeResult(result);
  }

  // ============================================================================
  // Curve Fitting
  // ============================================================================

  /**
   * Non-linear least squares curve fitting
   */
  curveFit(
    func: (x: number, ...params: number[]) => number,
    xdata: number[],
    ydata: number[],
    p0?: number[],
    bounds?: { lower: number[]; upper: number[] },
    method: 'lm' | 'trf' | 'dogbox' = 'lm'
  ): CurveFitResult {
    const pyFunc = this.createPyFunction(func);
    const npXdata = this.numpy.array(xdata);
    const npYdata = this.numpy.array(ydata);

    const kwargs: any = { method };

    if (p0) {
      kwargs.p0 = this.numpy.array(p0);
    }

    if (bounds) {
      kwargs.bounds = [
        this.numpy.array(bounds.lower),
        this.numpy.array(bounds.upper)
      ];
    }

    const result = this.optimize.curve_fit(pyFunc, npXdata, npYdata, kwargs);

    return {
      params: this.toJs(result[0]),
      covariance: this.toJs(result[1])
    };
  }

  /**
   * Least squares minimization
   */
  leastSquares(
    func: (x: number[]) => number[],
    x0: number[],
    jac?: (x: number[]) => number[][] | string,
    bounds?: [number, number][],
    method: 'trf' | 'dogbox' | 'lm' = 'trf',
    ftol: number = 1e-8,
    xtol: number = 1e-8,
    gtol: number = 1e-8,
    max_nfev?: number
  ): LeastSquaresResult {
    const pyFunc = this.createPyFunction(func);
    const npX0 = this.numpy.array(x0);

    const kwargs: any = { method, ftol, xtol, gtol };

    if (jac) {
      if (typeof jac === 'string') {
        kwargs.jac = jac;
      } else {
        kwargs.jac = this.createPyFunction(jac);
      }
    }

    if (bounds) {
      kwargs.bounds = [
        bounds.map(b => b[0]),
        bounds.map(b => b[1])
      ];
    }

    if (max_nfev) {
      kwargs.max_nfev = max_nfev;
    }

    const result = this.optimize.least_squares(pyFunc, npX0, kwargs);

    return {
      x: this.toJs(result.x),
      cost: this.toJs(result.cost),
      fun: this.toJs(result.fun),
      jac: this.toJs(result.jac),
      grad: this.toJs(result.grad),
      optimality: this.toJs(result.optimality),
      active_mask: this.toJs(result.active_mask),
      nfev: this.toJs(result.nfev),
      njev: this.toJs(result.njev),
      status: this.toJs(result.status),
      message: this.toJs(result.message),
      success: this.toJs(result.success)
    };
  }

  // ============================================================================
  // Root Finding
  // ============================================================================

  /**
   * Find root of a function
   */
  root(
    func: (x: number[]) => number[],
    x0: number[],
    method: 'hybr' | 'lm' | 'broyden1' | 'broyden2' | 'anderson' | 'linearmixing' | 'diagbroyden' | 'excitingmixing' | 'krylov' | 'df-sane' = 'hybr',
    jac?: (x: number[]) => number[][],
    options?: OptimizeOptions
  ): RootResult {
    const pyFunc = this.createPyFunction(func);
    const npX0 = this.numpy.array(x0);

    const kwargs: any = { method };

    if (jac) {
      kwargs.jac = this.createPyFunction(jac);
    }

    if (options) {
      kwargs.options = options;
    }

    const result = this.optimize.root(pyFunc, npX0, kwargs);

    return {
      x: this.toJs(result.x),
      success: this.toJs(result.success),
      message: this.toJs(result.message),
      nfev: this.toJs(result.nfev),
      fun: this.toJs(result.fun)
    };
  }

  /**
   * Find root using fsolve
   */
  fsolve(
    func: (x: number[]) => number[],
    x0: number[],
    fprime?: (x: number[]) => number[][],
    full_output: boolean = false
  ): RootResult {
    const pyFunc = this.createPyFunction(func);
    const npX0 = this.numpy.array(x0);

    const kwargs: any = { full_output };

    if (fprime) {
      kwargs.fprime = this.createPyFunction(fprime);
    }

    const result = this.optimize.fsolve(pyFunc, npX0, kwargs);

    if (full_output) {
      return {
        x: this.toJs(result[0]),
        success: this.toJs(result[1].ier) === 1,
        message: this.toJs(result[1].msg),
        nfev: this.toJs(result[1].nfev),
        fun: this.toJs(result[1].fvec)
      };
    }

    return {
      x: this.toJs(result),
      success: true,
      message: 'Solution found',
      nfev: 0
    };
  }

  /**
   * Brent's method for scalar root finding
   */
  brentq(
    func: (x: number) => number,
    a: number,
    b: number,
    xtol: number = 2e-12,
    rtol: number = 8.881784197001252e-16,
    maxiter: number = 100
  ): { root: number; iterations: number; function_calls: number } {
    const pyFunc = this.createPyFunction(func);

    const result = this.optimize.brentq(
      pyFunc,
      a,
      b,
      { xtol, rtol, maxiter, full_output: true }
    );

    return {
      root: this.toJs(result[0]),
      iterations: this.toJs(result[1].iterations),
      function_calls: this.toJs(result[1].function_calls)
    };
  }

  /**
   * Newton-Raphson method
   */
  newton(
    func: (x: number) => number,
    x0: number,
    fprime?: (x: number) => number,
    tol: number = 1.48e-8,
    maxiter: number = 50
  ): { root: number; converged: boolean; iterations: number } {
    const pyFunc = this.createPyFunction(func);

    const kwargs: any = { x0, tol, maxiter, full_output: true };

    if (fprime) {
      kwargs.fprime = this.createPyFunction(fprime);
    }

    const result = this.optimize.newton(pyFunc, kwargs);

    return {
      root: this.toJs(result[0]),
      converged: this.toJs(result[1].converged),
      iterations: this.toJs(result[1].iterations)
    };
  }

  /**
   * Fixed point iteration
   */
  fixedPoint(
    func: (x: number | number[]) => number | number[],
    x0: number | number[],
    xtol: number = 1e-8,
    maxiter: number = 500
  ): number | number[] {
    const pyFunc = this.createPyFunction(func);
    const npX0 = Array.isArray(x0) ? this.numpy.array(x0) : x0;

    const result = this.optimize.fixed_point(pyFunc, npX0, { xtol, maxiter });

    return this.toJs(result);
  }

  // ============================================================================
  // Linear Sum Assignment
  // ============================================================================

  /**
   * Solve the linear sum assignment problem
   */
  linearSumAssignment(costMatrix: number[][]): {
    rowIndices: number[];
    colIndices: number[];
    cost: number;
  } {
    const npCost = this.numpy.array(costMatrix);
    const [rowInd, colInd] = this.optimize.linear_sum_assignment(npCost);

    const rowIndices = this.toJs(rowInd);
    const colIndices = this.toJs(colInd);

    // Calculate total cost
    let totalCost = 0;
    for (let i = 0; i < rowIndices.length; i++) {
      totalCost += costMatrix[rowIndices[i]][colIndices[i]];
    }

    return {
      rowIndices,
      colIndices,
      cost: totalCost
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Create Python function from JavaScript function
   */
  private createPyFunction(jsFunc: Function): any {
    // Wrapper to convert between JS and Python
    return (...args: any[]) => {
      const jsArgs = args.map((arg: any) => this.toJs(arg));
      const result = jsFunc(...jsArgs);

      if (Array.isArray(result)) {
        return this.numpy.array(result);
      }
      return result;
    };
  }

  /**
   * Parse optimization result
   */
  private parseOptimizeResult(result: any): OptimizeResult {
    return {
      x: this.toJs(result.x),
      success: this.toJs(result.success),
      status: this.toJs(result.status),
      message: this.toJs(result.message),
      fun: this.toJs(result.fun),
      jac: result.jac ? this.toJs(result.jac) : undefined,
      hess: result.hess ? this.toJs(result.hess) : undefined,
      hess_inv: result.hess_inv ? this.toJs(result.hess_inv) : undefined,
      nfev: this.toJs(result.nfev),
      njev: result.njev ? this.toJs(result.njev) : undefined,
      nit: this.toJs(result.nit)
    };
  }

  /**
   * Convert Python object to JavaScript
   */
  private toJs(pyObj: any): any {
    if (pyObj === null || pyObj === undefined) {
      return pyObj;
    }

    if (typeof pyObj === 'number' || typeof pyObj === 'string' || typeof pyObj === 'boolean') {
      return pyObj;
    }

    if (pyObj.tolist) {
      return pyObj.tolist();
    }

    if (pyObj.item) {
      return pyObj.item();
    }

    return pyObj;
  }

  /**
   * Numerical gradient approximation
   */
  numericalGradient(
    func: (x: number[]) => number,
    x: number[],
    epsilon: number = 1e-8
  ): number[] {
    const grad: number[] = [];
    const f0 = func(x);

    for (let i = 0; i < x.length; i++) {
      const xPlus = [...x];
      xPlus[i] += epsilon;
      const fPlus = func(xPlus);
      grad.push((fPlus - f0) / epsilon);
    }

    return grad;
  }

  /**
   * Numerical Hessian approximation
   */
  numericalHessian(
    func: (x: number[]) => number,
    x: number[],
    epsilon: number = 1e-5
  ): number[][] {
    const n = x.length;
    const hess: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    const f0 = func(x);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const xPlusI = [...x];
        xPlusI[i] += epsilon;

        const xPlusJ = [...x];
        xPlusJ[j] += epsilon;

        const xPlusBoth = [...x];
        xPlusBoth[i] += epsilon;
        xPlusBoth[j] += epsilon;

        const fPlusI = func(xPlusI);
        const fPlusJ = func(xPlusJ);
        const fPlusBoth = func(xPlusBoth);

        hess[i][j] = (fPlusBoth - fPlusI - fPlusJ + f0) / (epsilon * epsilon);
      }
    }

    return hess;
  }
}

export default Optimization;
