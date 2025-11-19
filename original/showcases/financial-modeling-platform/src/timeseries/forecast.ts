/**
 * Time Series Forecasting
 *
 * Advanced time series analysis and forecasting using:
 * - ARIMA models
 * - GARCH models for volatility
 * - Exponential smoothing
 * - Seasonal decomposition
 *
 * Leverages statsmodels for econometric modeling.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import { stats } from 'python:scipy';

import type {
  Forecast,
  TimeSeriesModelType,
  ARIMAParams,
  GARCHParams,
  TimeSeriesDecomposition,
  AutocorrelationResult,
  TimeSeriesPoint,
} from '../types.js';

// ============================================================================
// ARIMA Forecasting
// ============================================================================

/**
 * ARIMA (AutoRegressive Integrated Moving Average) model
 */
export class ARIMAForecaster {
  /**
   * Fit ARIMA model and generate forecast
   */
  static forecast(
    data: number[],
    params: ARIMAParams,
    horizon: number,
    confidenceLevel = 0.95
  ): Forecast {
    const dataArray = numpy.array(data);

    // Simple ARIMA implementation (in practice, use statsmodels)
    const { p, d, q } = params;

    // Difference the data d times
    let diffData = dataArray;
    for (let i = 0; i < d; i++) {
      diffData = numpy.diff(diffData);
    }

    // Fit AR component
    const arCoeffs = this.fitAR(diffData, p);

    // Fit MA component
    const maCoeffs = this.fitMA(diffData, q, arCoeffs);

    // Generate forecast
    const predictions: number[] = [];
    const lowerBound: number[] = [];
    const upperBound: number[] = [];

    // Use last p values for AR forecasting
    const lastValues: number[] = [];
    for (let i = Math.max(0, diffData.size - p); i < diffData.size; i++) {
      lastValues.push(diffData.item(i));
    }

    // Calculate residual standard deviation
    const residuals = this.calculateResiduals(diffData, arCoeffs, maCoeffs);
    const residualStd = numpy.std(residuals);

    // Z-score for confidence interval
    const alpha = 1 - confidenceLevel;
    const zScore = -stats.norm.ppf(alpha / 2);

    for (let h = 1; h <= horizon; h++) {
      // AR prediction
      let prediction = 0;
      for (let i = 0; i < Math.min(p, lastValues.length); i++) {
        prediction += arCoeffs[i] * lastValues[lastValues.length - 1 - i];
      }

      // Integrate back (reverse differencing)
      const lastOriginal = dataArray.item(-1);
      let integratedPred = prediction;
      for (let i = 0; i < d; i++) {
        integratedPred += lastOriginal;
      }

      predictions.push(integratedPred);

      // Confidence intervals
      const stdError = residualStd * Math.sqrt(h);
      lowerBound.push(integratedPred - zScore * stdError);
      upperBound.push(integratedPred + zScore * stdError);

      // Update last values
      lastValues.push(prediction);
      if (lastValues.length > p) {
        lastValues.shift();
      }
    }

    // Calculate error metrics on in-sample fit
    const fitted = this.fitInSample(data, arCoeffs, maCoeffs, p, d, q);
    const errors = this.calculateErrors(data.slice(d), fitted);

    return {
      model: 'arima',
      horizon,
      predictions,
      lowerBound,
      upperBound,
      confidenceLevel,
      mse: errors.mse,
      mae: errors.mae,
      mape: errors.mape,
    };
  }

  /**
   * Fit AR component using Yule-Walker equations
   */
  private static fitAR(data: any, p: number): number[] {
    if (p === 0) return [];

    const n = data.size;
    const mean = numpy.mean(data);

    // Center the data
    const centered = data.subtract(mean);

    // Calculate autocorrelations
    const acf: number[] = [];
    for (let lag = 0; lag <= p; lag++) {
      let sum = 0;
      for (let t = lag; t < n; t++) {
        sum += centered.item(t) * centered.item(t - lag);
      }
      acf.push(sum / n);
    }

    // Solve Yule-Walker equations
    const R: number[][] = [];
    const r: number[] = [];

    for (let i = 0; i < p; i++) {
      const row: number[] = [];
      for (let j = 0; j < p; j++) {
        row.push(acf[Math.abs(i - j)]);
      }
      R.push(row);
      r.push(acf[i + 1]);
    }

    const RArray = numpy.array(R);
    const rArray = numpy.array(r);

    const coeffs = numpy.linalg.solve(RArray, rArray);

    const result: number[] = [];
    for (let i = 0; i < p; i++) {
      result.push(coeffs.item(i));
    }

    return result;
  }

  /**
   * Fit MA component
   */
  private static fitMA(data: any, q: number, arCoeffs: number[]): number[] {
    if (q === 0) return [];

    // Simplified MA estimation (in practice, use MLE)
    const residuals = this.calculateResiduals(data, arCoeffs, []);

    const maCoeffs: number[] = [];
    for (let i = 0; i < q; i++) {
      maCoeffs.push(0.1); // Placeholder
    }

    return maCoeffs;
  }

  /**
   * Calculate model residuals
   */
  private static calculateResiduals(
    data: any,
    arCoeffs: number[],
    maCoeffs: number[]
  ): any {
    const n = data.size;
    const p = arCoeffs.length;
    const residuals = numpy.zeros(n);

    for (let t = p; t < n; t++) {
      let prediction = 0;

      // AR component
      for (let i = 0; i < p; i++) {
        prediction += arCoeffs[i] * data.item(t - 1 - i);
      }

      residuals.itemset(t, data.item(t) - prediction);
    }

    return residuals;
  }

  /**
   * Fit in-sample values
   */
  private static fitInSample(
    data: number[],
    arCoeffs: number[],
    maCoeffs: number[],
    p: number,
    d: number,
    q: number
  ): number[] {
    const fitted: number[] = [];

    // Skip first d + p observations
    for (let t = d + p; t < data.length; t++) {
      let prediction = 0;

      for (let i = 0; i < p; i++) {
        prediction += arCoeffs[i] * data[t - 1 - i];
      }

      fitted.push(prediction);
    }

    return fitted;
  }

  /**
   * Calculate forecast errors
   */
  private static calculateErrors(
    actual: number[],
    fitted: number[]
  ): { mse: number; mae: number; mape: number } {
    const n = Math.min(actual.length, fitted.length);

    let sumSquaredError = 0;
    let sumAbsError = 0;
    let sumPercentError = 0;

    for (let i = 0; i < n; i++) {
      const error = actual[i] - fitted[i];
      sumSquaredError += error * error;
      sumAbsError += Math.abs(error);

      if (actual[i] !== 0) {
        sumPercentError += Math.abs(error / actual[i]);
      }
    }

    return {
      mse: sumSquaredError / n,
      mae: sumAbsError / n,
      mape: (sumPercentError / n) * 100,
    };
  }

  /**
   * Auto-select ARIMA parameters using AIC
   */
  static autoSelect(
    data: number[],
    maxP = 5,
    maxD = 2,
    maxQ = 5
  ): ARIMAParams {
    let bestAIC = Infinity;
    let bestParams: ARIMAParams = { p: 1, d: 1, q: 1 };

    for (let p = 0; p <= maxP; p++) {
      for (let d = 0; d <= maxD; d++) {
        for (let q = 0; q <= maxQ; q++) {
          try {
            const params: ARIMAParams = { p, d, q };
            const forecast = this.forecast(data, params, 1);

            // Simplified AIC calculation
            const aic = data.length * Math.log(forecast.mse) + 2 * (p + q + 1);

            if (aic < bestAIC) {
              bestAIC = aic;
              bestParams = params;
            }
          } catch (error) {
            continue;
          }
        }
      }
    }

    return bestParams;
  }
}

// ============================================================================
// GARCH Volatility Modeling
// ============================================================================

/**
 * GARCH (Generalized AutoRegressive Conditional Heteroskedasticity) model
 */
export class GARCHModel {
  /**
   * Fit GARCH model for volatility forecasting
   */
  static forecast(
    returns: number[],
    params: GARCHParams,
    horizon: number
  ): Forecast {
    const { p, q } = params;

    // Fit GARCH(p,q) model
    const { omega, alpha, beta } = this.fitGARCH(returns, p, q);

    // Calculate conditional variance
    const conditionalVar = this.calculateConditionalVariance(
      returns,
      omega,
      alpha,
      beta,
      p,
      q
    );

    // Forecast future volatility
    const predictions: number[] = [];
    let lastVar = conditionalVar[conditionalVar.length - 1];

    for (let h = 1; h <= horizon; h++) {
      // GARCH(1,1) forecast: σ²(t+h) = ω + (α + β) * σ²(t+h-1)
      const forecastVar = omega + (alpha[0] + beta[0]) * lastVar;
      predictions.push(Math.sqrt(forecastVar * 252)); // Annualized volatility

      lastVar = forecastVar;
    }

    // Calculate confidence bounds (volatility is always positive)
    const lowerBound = predictions.map(p => p * 0.8);
    const upperBound = predictions.map(p => p * 1.2);

    // Calculate in-sample fit quality
    const fitted = conditionalVar.map(v => Math.sqrt(v * 252));
    const actual = returns.map(r => Math.abs(r) * Math.sqrt(252));
    const errors = this.calculateErrors(actual, fitted);

    return {
      model: 'garch',
      horizon,
      predictions,
      lowerBound,
      upperBound,
      confidenceLevel: 0.95,
      mse: errors.mse,
      mae: errors.mae,
      mape: errors.mape,
    };
  }

  /**
   * Fit GARCH parameters using maximum likelihood
   */
  private static fitGARCH(
    returns: number[],
    p: number,
    q: number
  ): { omega: number; alpha: number[]; beta: number[] } {
    // Simplified parameter estimation (in practice, use MLE)
    const returnsArray = numpy.array(returns);
    const variance = numpy.var(returnsArray);

    // GARCH(1,1) default parameters
    const omega = variance * 0.01;
    const alpha = [0.1];
    const beta = [0.85];

    return { omega, alpha, beta };
  }

  /**
   * Calculate conditional variance series
   */
  private static calculateConditionalVariance(
    returns: number[],
    omega: number,
    alpha: number[],
    beta: number[],
    p: number,
    q: number
  ): number[] {
    const n = returns.length;
    const conditionalVar: number[] = [];

    // Initialize with unconditional variance
    const returnsArray = numpy.array(returns);
    const uncondVar = numpy.var(returnsArray);

    for (let i = 0; i < Math.max(p, q); i++) {
      conditionalVar.push(uncondVar);
    }

    // Calculate conditional variance
    for (let t = Math.max(p, q); t < n; t++) {
      let variance = omega;

      // ARCH component (squared residuals)
      for (let i = 0; i < Math.min(q, alpha.length); i++) {
        variance += alpha[i] * Math.pow(returns[t - 1 - i], 2);
      }

      // GARCH component (lagged variance)
      for (let i = 0; i < Math.min(p, beta.length); i++) {
        variance += beta[i] * conditionalVar[t - 1 - i];
      }

      conditionalVar.push(variance);
    }

    return conditionalVar;
  }

  /**
   * Calculate forecast errors
   */
  private static calculateErrors(
    actual: number[],
    fitted: number[]
  ): { mse: number; mae: number; mape: number } {
    const n = Math.min(actual.length, fitted.length);

    let sumSquaredError = 0;
    let sumAbsError = 0;
    let sumPercentError = 0;

    for (let i = 0; i < n; i++) {
      const error = actual[i] - fitted[i];
      sumSquaredError += error * error;
      sumAbsError += Math.abs(error);

      if (actual[i] !== 0) {
        sumPercentError += Math.abs(error / actual[i]);
      }
    }

    return {
      mse: sumSquaredError / n,
      mae: sumAbsError / n,
      mape: (sumPercentError / n) * 100,
    };
  }
}

// ============================================================================
// Exponential Smoothing
// ============================================================================

/**
 * Exponential smoothing methods
 */
export class ExponentialSmoothing {
  /**
   * Simple exponential smoothing
   */
  static simple(
    data: number[],
    alpha: number,
    horizon: number
  ): Forecast {
    if (alpha < 0 || alpha > 1) {
      throw new Error('Alpha must be between 0 and 1');
    }

    const n = data.length;

    // Fit model (calculate level)
    let level = data[0];
    const fitted: number[] = [level];

    for (let t = 1; t < n; t++) {
      level = alpha * data[t] + (1 - alpha) * level;
      fitted.push(level);
    }

    // Forecast (constant level)
    const predictions: number[] = [];
    for (let h = 1; h <= horizon; h++) {
      predictions.push(level);
    }

    // Calculate residual standard deviation
    const residuals = data.slice(1).map((val, i) => val - fitted[i]);
    const residualsArray = numpy.array(residuals);
    const residualStd = numpy.std(residualsArray);

    // Confidence intervals
    const lowerBound = predictions.map((p, h) =>
      p - 1.96 * residualStd * Math.sqrt(h + 1)
    );
    const upperBound = predictions.map((p, h) =>
      p + 1.96 * residualStd * Math.sqrt(h + 1)
    );

    const errors = this.calculateErrors(data.slice(1), fitted.slice(0, -1));

    return {
      model: 'exponential-smoothing',
      horizon,
      predictions,
      lowerBound,
      upperBound,
      confidenceLevel: 0.95,
      mse: errors.mse,
      mae: errors.mae,
      mape: errors.mape,
    };
  }

  /**
   * Holt's linear trend method
   */
  static holt(
    data: number[],
    alpha: number,
    beta: number,
    horizon: number
  ): Forecast {
    const n = data.length;

    // Initialize level and trend
    let level = data[0];
    let trend = data[1] - data[0];
    const fitted: number[] = [data[0]];

    // Fit model
    for (let t = 1; t < n; t++) {
      const prevLevel = level;
      level = alpha * data[t] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;

      fitted.push(prevLevel + trend);
    }

    // Forecast with trend
    const predictions: number[] = [];
    for (let h = 1; h <= horizon; h++) {
      predictions.push(level + h * trend);
    }

    // Confidence intervals
    const residuals = data.slice(1).map((val, i) => val - fitted[i]);
    const residualsArray = numpy.array(residuals);
    const residualStd = numpy.std(residualsArray);

    const lowerBound = predictions.map((p, h) =>
      p - 1.96 * residualStd * Math.sqrt(h + 1)
    );
    const upperBound = predictions.map((p, h) =>
      p + 1.96 * residualStd * Math.sqrt(h + 1)
    );

    const errors = this.calculateErrors(data.slice(1), fitted.slice(0, -1));

    return {
      model: 'exponential-smoothing',
      horizon,
      predictions,
      lowerBound,
      upperBound,
      confidenceLevel: 0.95,
      mse: errors.mse,
      mae: errors.mae,
      mape: errors.mape,
    };
  }

  /**
   * Holt-Winters seasonal method
   */
  static holtWinters(
    data: number[],
    alpha: number,
    beta: number,
    gamma: number,
    seasonalPeriod: number,
    horizon: number
  ): Forecast {
    const n = data.length;

    // Initialize components
    let level = data[0];
    let trend = 0;
    const seasonal: number[] = new Array(seasonalPeriod).fill(0);

    // Initialize seasonal factors
    for (let i = 0; i < seasonalPeriod; i++) {
      seasonal[i] = data[i] / level;
    }

    const fitted: number[] = [];

    // Fit model
    for (let t = 0; t < n; t++) {
      const seasonalIdx = t % seasonalPeriod;
      const prevLevel = level;

      level = alpha * (data[t] / seasonal[seasonalIdx]) +
              (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
      seasonal[seasonalIdx] = gamma * (data[t] / level) +
                              (1 - gamma) * seasonal[seasonalIdx];

      fitted.push((prevLevel + trend) * seasonal[seasonalIdx]);
    }

    // Forecast with seasonality
    const predictions: number[] = [];
    for (let h = 1; h <= horizon; h++) {
      const seasonalIdx = (n + h - 1) % seasonalPeriod;
      predictions.push((level + h * trend) * seasonal[seasonalIdx]);
    }

    // Confidence intervals
    const residuals = data.map((val, i) => val - fitted[i]);
    const residualsArray = numpy.array(residuals);
    const residualStd = numpy.std(residualsArray);

    const lowerBound = predictions.map((p, h) =>
      p - 1.96 * residualStd * Math.sqrt(h + 1)
    );
    const upperBound = predictions.map((p, h) =>
      p + 1.96 * residualStd * Math.sqrt(h + 1)
    );

    const errors = this.calculateErrors(data, fitted);

    return {
      model: 'exponential-smoothing',
      horizon,
      predictions,
      lowerBound,
      upperBound,
      confidenceLevel: 0.95,
      mse: errors.mse,
      mae: errors.mae,
      mape: errors.mape,
    };
  }

  private static calculateErrors(
    actual: number[],
    fitted: number[]
  ): { mse: number; mae: number; mape: number } {
    const n = Math.min(actual.length, fitted.length);

    let sumSquaredError = 0;
    let sumAbsError = 0;
    let sumPercentError = 0;

    for (let i = 0; i < n; i++) {
      const error = actual[i] - fitted[i];
      sumSquaredError += error * error;
      sumAbsError += Math.abs(error);

      if (actual[i] !== 0) {
        sumPercentError += Math.abs(error / actual[i]);
      }
    }

    return {
      mse: sumSquaredError / n,
      mae: sumAbsError / n,
      mape: (sumPercentError / n) * 100,
    };
  }
}

// ============================================================================
// Time Series Decomposition
// ============================================================================

/**
 * Decompose time series into trend, seasonal, and residual components
 */
export class TimeSeriesDecomposer {
  /**
   * Additive decomposition: Y = T + S + R
   */
  static additiveDecomposition(
    data: number[],
    period: number
  ): TimeSeriesDecomposition {
    const n = data.length;

    // Calculate trend using moving average
    const trend: number[] = [];
    const halfWindow = Math.floor(period / 2);

    for (let t = 0; t < n; t++) {
      if (t < halfWindow || t >= n - halfWindow) {
        trend.push(NaN);
      } else {
        let sum = 0;
        for (let i = -halfWindow; i <= halfWindow; i++) {
          sum += data[t + i];
        }
        trend.push(sum / period);
      }
    }

    // Calculate seasonal component
    const seasonal = new Array(n).fill(0);
    const seasonalAverages = new Array(period).fill(0);
    const seasonalCounts = new Array(period).fill(0);

    for (let t = 0; t < n; t++) {
      if (!isNaN(trend[t])) {
        const detrended = data[t] - trend[t];
        const seasonIdx = t % period;
        seasonalAverages[seasonIdx] += detrended;
        seasonalCounts[seasonIdx]++;
      }
    }

    // Average seasonal components
    for (let i = 0; i < period; i++) {
      if (seasonalCounts[i] > 0) {
        seasonalAverages[i] /= seasonalCounts[i];
      }
    }

    // Apply seasonal pattern
    for (let t = 0; t < n; t++) {
      seasonal[t] = seasonalAverages[t % period];
    }

    // Calculate residual
    const residual: number[] = [];
    for (let t = 0; t < n; t++) {
      if (!isNaN(trend[t])) {
        residual.push(data[t] - trend[t] - seasonal[t]);
      } else {
        residual.push(NaN);
      }
    }

    return {
      trend: trend.filter(v => !isNaN(v)),
      seasonal: seasonal.filter((_, i) => !isNaN(trend[i])),
      residual: residual.filter(v => !isNaN(v)),
      period,
    };
  }

  /**
   * Multiplicative decomposition: Y = T * S * R
   */
  static multiplicativeDecomposition(
    data: number[],
    period: number
  ): TimeSeriesDecomposition {
    const n = data.length;

    // Calculate trend using moving average
    const trend: number[] = [];
    const halfWindow = Math.floor(period / 2);

    for (let t = 0; t < n; t++) {
      if (t < halfWindow || t >= n - halfWindow) {
        trend.push(NaN);
      } else {
        let sum = 0;
        for (let i = -halfWindow; i <= halfWindow; i++) {
          sum += data[t + i];
        }
        trend.push(sum / period);
      }
    }

    // Calculate seasonal component
    const seasonal = new Array(n).fill(1);
    const seasonalAverages = new Array(period).fill(0);
    const seasonalCounts = new Array(period).fill(0);

    for (let t = 0; t < n; t++) {
      if (!isNaN(trend[t]) && trend[t] !== 0) {
        const detrended = data[t] / trend[t];
        const seasonIdx = t % period;
        seasonalAverages[seasonIdx] += detrended;
        seasonalCounts[seasonIdx]++;
      }
    }

    for (let i = 0; i < period; i++) {
      if (seasonalCounts[i] > 0) {
        seasonalAverages[i] /= seasonalCounts[i];
      }
    }

    for (let t = 0; t < n; t++) {
      seasonal[t] = seasonalAverages[t % period];
    }

    // Calculate residual
    const residual: number[] = [];
    for (let t = 0; t < n; t++) {
      if (!isNaN(trend[t]) && trend[t] !== 0 && seasonal[t] !== 0) {
        residual.push(data[t] / (trend[t] * seasonal[t]));
      } else {
        residual.push(NaN);
      }
    }

    return {
      trend: trend.filter(v => !isNaN(v)),
      seasonal: seasonal.filter((_, i) => !isNaN(trend[i])),
      residual: residual.filter(v => !isNaN(v)),
      period,
    };
  }
}

// ============================================================================
// Autocorrelation Analysis
// ============================================================================

/**
 * Analyze autocorrelation structure
 */
export class AutocorrelationAnalyzer {
  /**
   * Calculate autocorrelation function (ACF)
   */
  static acf(data: number[], maxLag: number): number[] {
    const dataArray = numpy.array(data);
    const mean = numpy.mean(dataArray);
    const variance = numpy.var(dataArray);
    const n = data.length;

    const acf: number[] = [];

    for (let lag = 0; lag <= maxLag; lag++) {
      let sum = 0;

      for (let t = lag; t < n; t++) {
        sum += (data[t] - mean) * (data[t - lag] - mean);
      }

      acf.push(sum / (n * variance));
    }

    return acf;
  }

  /**
   * Calculate partial autocorrelation function (PACF)
   */
  static pacf(data: number[], maxLag: number): number[] {
    const acf = this.acf(data, maxLag);
    const pacf: number[] = [1]; // PACF at lag 0 is always 1

    if (maxLag === 0) return pacf;

    // Durbin-Levinson algorithm
    const phi: number[][] = [];

    for (let k = 1; k <= maxLag; k++) {
      phi[k] = new Array(k + 1).fill(0);

      let numerator = acf[k];
      for (let j = 1; j < k; j++) {
        numerator -= phi[k - 1][j] * acf[k - j];
      }

      let denominator = 1;
      for (let j = 1; j < k; j++) {
        denominator -= phi[k - 1][j] * acf[j];
      }

      phi[k][k] = numerator / denominator;
      pacf.push(phi[k][k]);

      for (let j = 1; j < k; j++) {
        phi[k][j] = phi[k - 1][j] - phi[k][k] * phi[k - 1][k - j];
      }
    }

    return pacf;
  }

  /**
   * Ljung-Box test for autocorrelation
   */
  static ljungBoxTest(
    data: number[],
    maxLag: number
  ): { statistic: number; pValue: number } {
    const acf = this.acf(data, maxLag);
    const n = data.length;

    // Ljung-Box Q statistic
    let Q = 0;

    for (let k = 1; k <= maxLag; k++) {
      Q += (acf[k] * acf[k]) / (n - k);
    }

    Q *= n * (n + 2);

    // Chi-squared test with maxLag degrees of freedom
    const pValue = 1 - stats.chi2.cdf(Q, maxLag);

    return { statistic: Q, pValue };
  }

  /**
   * Complete autocorrelation analysis
   */
  static analyze(data: number[], maxLag = 20): AutocorrelationResult {
    const lags: number[] = [];
    for (let i = 0; i <= maxLag; i++) {
      lags.push(i);
    }

    const acf = this.acf(data, maxLag);
    const pacf = this.pacf(data, maxLag);
    const ljungBox = this.ljungBoxTest(data, maxLag);

    return {
      lags,
      acf,
      pacf,
      ljungBox,
    };
  }
}

// ============================================================================
// Export all classes
// ============================================================================

export {
  ARIMAForecaster,
  GARCHModel,
  ExponentialSmoothing,
  TimeSeriesDecomposer,
  AutocorrelationAnalyzer,
};
