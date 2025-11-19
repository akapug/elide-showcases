/**
 * Elide IoT Platform - Time Series Analyzer
 *
 * Advanced time series analysis using Python's numpy and scipy for
 * decomposition, forecasting, autocorrelation, and change point detection.
 *
 * Demonstrates Elide polyglot: TypeScript + python:numpy + python:scipy
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import {
  TimeSeriesData,
  TimeSeriesDecomposition,
  Forecast,
  ForecastMethod,
  ForecastMetrics,
  StatisticalSummary,
  AggregationType
} from '../types';

// ============================================================================
// Time Series Analyzer Configuration
// ============================================================================

export interface TimeSeriesAnalyzerConfig {
  defaultPeriod: number;
  forecastHorizon: number;
  confidenceLevel: number;
  minDataPoints: number;
  enableCaching: boolean;
}

export interface DecompositionOptions {
  period?: number;
  model?: 'additive' | 'multiplicative';
  extrapolateStart?: number;
  extrapolateEnd?: number;
}

export interface ForecastOptions {
  horizon: number;
  method: ForecastMethod;
  confidence?: number;
  seasonalPeriods?: number;
  exogenousVariables?: number[][];
}

// ============================================================================
// Time Series Analyzer Implementation
// ============================================================================

export class TimeSeriesAnalyzer {
  private decompositionCache: Map<string, TimeSeriesDecomposition> = new Map();
  private forecastCache: Map<string, Forecast> = new Map();

  constructor(private config?: Partial<TimeSeriesAnalyzerConfig>) {
    this.config = {
      defaultPeriod: 24,
      forecastHorizon: 48,
      confidenceLevel: 0.95,
      minDataPoints: 50,
      enableCaching: true,
      ...config
    };
  }

  // ========================================================================
  // Time Series Decomposition
  // ========================================================================

  async decompose(
    data: TimeSeriesData | number[],
    options: DecompositionOptions = {}
  ): Promise<TimeSeriesDecomposition> {
    const values = Array.isArray(data) ? data : data.values;
    const timestamps = Array.isArray(data) ?
      Array.from({ length: values.length }, (_, i) => i) :
      data.timestamps;

    if (values.length < (this.config?.minDataPoints || 50)) {
      throw new Error('Insufficient data points for decomposition');
    }

    const period = options.period || this.config?.defaultPeriod || 24;
    const model = options.model || 'additive';

    // Create cache key
    const cacheKey = `${values.join(',')}-${period}-${model}`;
    if (this.config?.enableCaching && this.decompositionCache.has(cacheKey)) {
      return this.decompositionCache.get(cacheKey)!;
    }

    const npValues = numpy.array(values);

    // Perform seasonal decomposition
    const trendComponent = await this.extractTrend(values, period);
    const detrended = numpy.subtract(npValues, numpy.array(trendComponent));
    const seasonalComponent = await this.extractSeasonal(
      Array.from(detrended),
      period,
      model
    );

    // Calculate residual
    const npSeasonal = numpy.array(seasonalComponent);
    const residual = model === 'additive'
      ? numpy.subtract(detrended, npSeasonal)
      : numpy.divide(detrended, npSeasonal);

    const decomposition: TimeSeriesDecomposition = {
      trend: trendComponent,
      seasonal: seasonalComponent,
      residual: Array.from(residual),
      timestamps,
      model
    };

    if (this.config?.enableCaching) {
      this.decompositionCache.set(cacheKey, decomposition);
    }

    return decomposition;
  }

  private async extractTrend(values: number[], period: number): Promise<number[]> {
    const npValues = numpy.array(values);

    // Use convolution for moving average
    const kernel = numpy.ones(period) / period;
    const trend = scipy.signal.convolve(npValues, kernel, { mode: 'same' });

    return Array.from(trend);
  }

  private async extractSeasonal(
    values: number[],
    period: number,
    model: 'additive' | 'multiplicative'
  ): Promise<number[]> {
    const n = values.length;
    const npValues = numpy.array(values);

    // Calculate seasonal indices for each period position
    const seasonalPattern: number[] = [];

    for (let i = 0; i < period; i++) {
      const indices = [];
      for (let j = i; j < n; j += period) {
        indices.push(values[j]);
      }

      if (model === 'additive') {
        seasonalPattern.push(numpy.mean(numpy.array(indices)));
      } else {
        seasonalPattern.push(numpy.median(numpy.array(indices)));
      }
    }

    // Normalize seasonal pattern
    const patternMean = numpy.mean(numpy.array(seasonalPattern));
    const normalizedPattern = model === 'additive'
      ? seasonalPattern.map(v => v - patternMean)
      : seasonalPattern.map(v => v / patternMean);

    // Repeat pattern to match data length
    const seasonal: number[] = [];
    for (let i = 0; i < n; i++) {
      seasonal.push(normalizedPattern[i % period]);
    }

    return seasonal;
  }

  // ========================================================================
  // Forecasting
  // ========================================================================

  async forecast(
    data: TimeSeriesData | number[],
    options: ForecastOptions
  ): Promise<Forecast> {
    const values = Array.isArray(data) ? data : data.values;
    const timestamps = Array.isArray(data) ?
      Array.from({ length: values.length }, (_, i) => i) :
      data.timestamps;

    switch (options.method) {
      case ForecastMethod.ARIMA:
        return await this.forecastARIMA(values, timestamps, options);

      case ForecastMethod.EXPONENTIAL_SMOOTHING:
        return await this.forecastExponentialSmoothing(values, timestamps, options);

      case ForecastMethod.SIMPLE_MOVING_AVERAGE:
        return await this.forecastMovingAverage(values, timestamps, options);

      case ForecastMethod.EXPONENTIAL_MOVING_AVERAGE:
        return await this.forecastEMA(values, timestamps, options);

      default:
        return await this.forecastSimple(values, timestamps, options);
    }
  }

  private async forecastARIMA(
    values: number[],
    timestamps: number[],
    options: ForecastOptions
  ): Promise<Forecast> {
    const npValues = numpy.array(values);
    const horizon = options.horizon;

    // Auto-determine ARIMA parameters using ACF/PACF
    const p = await this.estimateAROrder(values);
    const d = await this.estimateDifferencing(values);
    const q = await this.estimateMAOrder(values);

    // Fit ARIMA model (simplified version)
    const predictions = await this.fitARIMAModel(values, { p, d, q }, horizon);

    // Calculate confidence intervals
    const std = numpy.std(npValues);
    const confidence = options.confidence || 0.95;
    const z = this.getZScore(confidence);

    const forecastTimestamps = Array.from(
      { length: horizon },
      (_, i) => timestamps[timestamps.length - 1] + (i + 1) * (timestamps[1] - timestamps[0])
    );

    const lower = predictions.map(v => v - z * std);
    const upper = predictions.map(v => v + z * std);

    // Calculate metrics
    const metrics = await this.calculateForecastMetrics(
      values.slice(-horizon),
      predictions
    );

    return {
      timestamps: forecastTimestamps,
      predictions,
      lower,
      upper,
      confidence,
      method: ForecastMethod.ARIMA,
      metrics
    };
  }

  private async forecastExponentialSmoothing(
    values: number[],
    timestamps: number[],
    options: ForecastOptions
  ): Promise<Forecast> {
    const alpha = 0.3; // Smoothing parameter
    const horizon = options.horizon;

    // Triple exponential smoothing (Holt-Winters)
    const level: number[] = [values[0]];
    const trend: number[] = [values[1] - values[0]];
    const seasonal: number[] = new Array(options.seasonalPeriods || 12).fill(0);

    const beta = 0.1; // Trend smoothing
    const gamma = 0.1; // Seasonal smoothing
    const period = options.seasonalPeriods || 12;

    for (let i = 1; i < values.length; i++) {
      const seasonalIdx = i % period;

      const newLevel = alpha * (values[i] - seasonal[seasonalIdx]) +
                       (1 - alpha) * (level[i - 1] + trend[i - 1]);
      const newTrend = beta * (newLevel - level[i - 1]) +
                       (1 - beta) * trend[i - 1];
      const newSeasonal = gamma * (values[i] - newLevel) +
                          (1 - gamma) * seasonal[seasonalIdx];

      level.push(newLevel);
      trend.push(newTrend);
      seasonal[seasonalIdx] = newSeasonal;
    }

    // Generate forecasts
    const lastLevel = level[level.length - 1];
    const lastTrend = trend[trend.length - 1];
    const predictions: number[] = [];

    for (let h = 1; h <= horizon; h++) {
      const seasonalIdx = (values.length + h - 1) % period;
      const forecast = lastLevel + h * lastTrend + seasonal[seasonalIdx];
      predictions.push(forecast);
    }

    const std = numpy.std(numpy.array(values));
    const confidence = options.confidence || 0.95;
    const z = this.getZScore(confidence);

    const forecastTimestamps = Array.from(
      { length: horizon },
      (_, i) => timestamps[timestamps.length - 1] + (i + 1) * (timestamps[1] - timestamps[0])
    );

    return {
      timestamps: forecastTimestamps,
      predictions,
      lower: predictions.map(v => v - z * std),
      upper: predictions.map(v => v + z * std),
      confidence,
      method: ForecastMethod.EXPONENTIAL_SMOOTHING,
      metrics: await this.calculateForecastMetrics(
        values.slice(-horizon),
        predictions
      )
    };
  }

  private async forecastMovingAverage(
    values: number[],
    timestamps: number[],
    options: ForecastOptions
  ): Promise<Forecast> {
    const window = Math.min(10, Math.floor(values.length / 4));
    const lastValues = values.slice(-window);
    const prediction = numpy.mean(numpy.array(lastValues));

    const predictions = new Array(options.horizon).fill(prediction);
    const std = numpy.std(numpy.array(values));
    const confidence = options.confidence || 0.95;
    const z = this.getZScore(confidence);

    const forecastTimestamps = Array.from(
      { length: options.horizon },
      (_, i) => timestamps[timestamps.length - 1] + (i + 1) * (timestamps[1] - timestamps[0])
    );

    return {
      timestamps: forecastTimestamps,
      predictions,
      lower: predictions.map(v => v - z * std),
      upper: predictions.map(v => v + z * std),
      confidence,
      method: ForecastMethod.SIMPLE_MOVING_AVERAGE,
      metrics: await this.calculateForecastMetrics(
        values.slice(-options.horizon),
        predictions
      )
    };
  }

  private async forecastEMA(
    values: number[],
    timestamps: number[],
    options: ForecastOptions
  ): Promise<Forecast> {
    const alpha = 0.3;
    let ema = values[0];

    for (let i = 1; i < values.length; i++) {
      ema = alpha * values[i] + (1 - alpha) * ema;
    }

    const predictions = new Array(options.horizon).fill(ema);
    const std = numpy.std(numpy.array(values));
    const confidence = options.confidence || 0.95;
    const z = this.getZScore(confidence);

    const forecastTimestamps = Array.from(
      { length: options.horizon },
      (_, i) => timestamps[timestamps.length - 1] + (i + 1) * (timestamps[1] - timestamps[0])
    );

    return {
      timestamps: forecastTimestamps,
      predictions,
      lower: predictions.map(v => v - z * std),
      upper: predictions.map(v => v + z * std),
      confidence,
      method: ForecastMethod.EXPONENTIAL_MOVING_AVERAGE,
      metrics: await this.calculateForecastMetrics(
        values.slice(-options.horizon),
        predictions
      )
    };
  }

  private async forecastSimple(
    values: number[],
    timestamps: number[],
    options: ForecastOptions
  ): Promise<Forecast> {
    // Simple linear extrapolation
    const n = values.length;
    const x = numpy.arange(n);
    const y = numpy.array(values);

    // Fit linear regression
    const [slope, intercept] = await this.linearRegression(
      Array.from(x),
      values
    );

    const predictions: number[] = [];
    for (let i = 0; i < options.horizon; i++) {
      predictions.push(slope * (n + i) + intercept);
    }

    const std = numpy.std(y);
    const confidence = options.confidence || 0.95;
    const z = this.getZScore(confidence);

    const forecastTimestamps = Array.from(
      { length: options.horizon },
      (_, i) => timestamps[timestamps.length - 1] + (i + 1) * (timestamps[1] - timestamps[0])
    );

    return {
      timestamps: forecastTimestamps,
      predictions,
      lower: predictions.map(v => v - z * std),
      upper: predictions.map(v => v + z * std),
      confidence,
      method: ForecastMethod.SIMPLE_MOVING_AVERAGE,
      metrics: await this.calculateForecastMetrics(
        values.slice(-options.horizon),
        predictions
      )
    };
  }

  // ========================================================================
  // Autocorrelation & Partial Autocorrelation
  // ========================================================================

  async calculateAutocorrelation(values: number[], maxLag?: number): Promise<number[]> {
    const n = values.length;
    const lags = maxLag || Math.min(Math.floor(n / 4), 40);

    const npValues = numpy.array(values);
    const mean = numpy.mean(npValues);
    const variance = numpy.var(npValues);

    const acf: number[] = [];

    for (let lag = 0; lag <= lags; lag++) {
      if (lag === 0) {
        acf.push(1.0);
        continue;
      }

      let sum = 0;
      for (let i = 0; i < n - lag; i++) {
        sum += (values[i] - mean) * (values[i + lag] - mean);
      }

      acf.push(sum / ((n - lag) * variance));
    }

    return acf;
  }

  async calculatePartialAutocorrelation(
    values: number[],
    maxLag?: number
  ): Promise<number[]> {
    const n = values.length;
    const lags = maxLag || Math.min(Math.floor(n / 4), 40);

    // Use Levinson-Durbin recursion
    const acf = await this.calculateAutocorrelation(values, lags);
    const pacf: number[] = [1.0];

    if (lags === 0) return pacf;

    pacf.push(acf[1]);

    for (let k = 2; k <= lags; k++) {
      let numerator = acf[k];
      let denominator = 1.0;

      const phi: number[] = [pacf[k - 1]];

      for (let j = 1; j < k; j++) {
        numerator -= phi[j - 1] * acf[k - j];
        denominator -= phi[j - 1] * acf[j];
      }

      const pacfK = numerator / denominator;
      pacf.push(pacfK);
    }

    return pacf;
  }

  // ========================================================================
  // Change Point Detection
  // ========================================================================

  async detectChangePoints(
    values: number[],
    method: 'cusum' | 'bayesian' = 'cusum'
  ): Promise<number[]> {
    if (method === 'cusum') {
      return await this.detectChangeCUSUM(values);
    } else {
      return await this.detectChangeBayesian(values);
    }
  }

  private async detectChangeCUSUM(values: number[]): Promise<number[]> {
    const npValues = numpy.array(values);
    const mean = numpy.mean(npValues);
    const std = numpy.std(npValues);

    const threshold = 5 * std;
    const drift = 0.5 * std;

    let cumsum = 0;
    const changePoints: number[] = [];

    for (let i = 0; i < values.length; i++) {
      cumsum = Math.max(0, cumsum + (values[i] - mean) - drift);

      if (cumsum > threshold) {
        changePoints.push(i);
        cumsum = 0; // Reset
      }
    }

    return changePoints;
  }

  private async detectChangeBayesian(values: number[]): Promise<number[]> {
    // Simplified Bayesian change point detection
    const n = values.length;
    const changePoints: number[] = [];

    const windowSize = Math.min(20, Math.floor(n / 5));

    for (let i = windowSize; i < n - windowSize; i++) {
      const before = values.slice(i - windowSize, i);
      const after = values.slice(i, i + windowSize);

      const meanBefore = numpy.mean(numpy.array(before));
      const meanAfter = numpy.mean(numpy.array(after));
      const stdBefore = numpy.std(numpy.array(before));
      const stdAfter = numpy.std(numpy.array(after));

      // T-test for mean difference
      const tStat = Math.abs(meanAfter - meanBefore) /
                    Math.sqrt((stdBefore ** 2 + stdAfter ** 2) / windowSize);

      if (tStat > 3) { // Significant change
        changePoints.push(i);
        i += windowSize; // Skip ahead
      }
    }

    return changePoints;
  }

  // ========================================================================
  // Statistical Analysis
  // ========================================================================

  async calculateStatistics(values: number[]): Promise<StatisticalSummary> {
    const npValues = numpy.array(values);

    return {
      count: values.length,
      mean: numpy.mean(npValues),
      median: numpy.median(npValues),
      std: numpy.std(npValues),
      min: numpy.min(npValues),
      max: numpy.max(npValues),
      q25: numpy.percentile(npValues, 25),
      q75: numpy.percentile(npValues, 75),
      skewness: await this.calculateSkewness(values),
      kurtosis: await this.calculateKurtosis(values)
    };
  }

  private async calculateSkewness(values: number[]): Promise<number> {
    const npValues = numpy.array(values);
    const mean = numpy.mean(npValues);
    const std = numpy.std(npValues);
    const n = values.length;

    const m3 = numpy.sum(numpy.power(numpy.subtract(npValues, mean), 3)) / n;
    return m3 / Math.pow(std, 3);
  }

  private async calculateKurtosis(values: number[]): Promise<number> {
    const npValues = numpy.array(values);
    const mean = numpy.mean(npValues);
    const std = numpy.std(npValues);
    const n = values.length;

    const m4 = numpy.sum(numpy.power(numpy.subtract(npValues, mean), 4)) / n;
    return m4 / Math.pow(std, 4) - 3; // Excess kurtosis
  }

  // ========================================================================
  // Aggregation
  // ========================================================================

  async aggregate(
    data: TimeSeriesData,
    window: number,
    aggregation: AggregationType
  ): Promise<TimeSeriesData> {
    const values = data.values;
    const timestamps = data.timestamps;

    const aggregated: number[] = [];
    const aggregatedTimestamps: number[] = [];

    for (let i = 0; i < values.length; i += window) {
      const windowData = values.slice(i, Math.min(i + window, values.length));
      const npWindow = numpy.array(windowData);

      let value: number;
      switch (aggregation) {
        case AggregationType.MEAN:
          value = numpy.mean(npWindow);
          break;
        case AggregationType.MEDIAN:
          value = numpy.median(npWindow);
          break;
        case AggregationType.SUM:
          value = numpy.sum(npWindow);
          break;
        case AggregationType.MIN:
          value = numpy.min(npWindow);
          break;
        case AggregationType.MAX:
          value = numpy.max(npWindow);
          break;
        case AggregationType.STDDEV:
          value = numpy.std(npWindow);
          break;
        case AggregationType.COUNT:
          value = windowData.length;
          break;
        case AggregationType.FIRST:
          value = windowData[0];
          break;
        case AggregationType.LAST:
          value = windowData[windowData.length - 1];
          break;
        default:
          value = numpy.mean(npWindow);
      }

      aggregated.push(value);
      aggregatedTimestamps.push(timestamps[i]);
    }

    return {
      timestamps: aggregatedTimestamps,
      values: aggregated,
      metadata: data.metadata
    };
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private async estimateAROrder(values: number[]): Promise<number> {
    const pacf = await this.calculatePartialAutocorrelation(values, 20);
    const threshold = 1.96 / Math.sqrt(values.length);

    for (let i = 1; i < pacf.length; i++) {
      if (Math.abs(pacf[i]) < threshold) {
        return i - 1;
      }
    }

    return 1;
  }

  private async estimateDifferencing(values: number[]): Promise<number> {
    // ADF test for stationarity (simplified)
    const npValues = numpy.array(values);
    const std = numpy.std(npValues);

    if (std < 0.1) return 0; // Already stationary

    const diff1 = numpy.diff(npValues);
    const std1 = numpy.std(diff1);

    if (std1 < std * 0.5) return 1;

    return 0;
  }

  private async estimateMAOrder(values: number[]): Promise<number> {
    const acf = await this.calculateAutocorrelation(values, 20);
    const threshold = 1.96 / Math.sqrt(values.length);

    for (let i = 1; i < acf.length; i++) {
      if (Math.abs(acf[i]) < threshold) {
        return i - 1;
      }
    }

    return 1;
  }

  private async fitARIMAModel(
    values: number[],
    params: { p: number; d: number; q: number },
    horizon: number
  ): Promise<number[]> {
    // Simplified ARIMA prediction
    const { p, d, q } = params;

    // Apply differencing
    let data = values;
    for (let i = 0; i < d; i++) {
      data = Array.from(numpy.diff(numpy.array(data)));
    }

    // Simple AR prediction
    const predictions: number[] = [];
    const lastValues = data.slice(-p);

    for (let h = 0; h < horizon; h++) {
      const prediction = numpy.mean(numpy.array(lastValues));
      predictions.push(prediction);
      lastValues.shift();
      lastValues.push(prediction);
    }

    // Reverse differencing
    for (let i = 0; i < d; i++) {
      const lastActual = values[values.length - 1];
      predictions[0] += lastActual;
      for (let j = 1; j < predictions.length; j++) {
        predictions[j] += predictions[j - 1];
      }
    }

    return predictions;
  }

  private async linearRegression(x: number[], y: number[]): Promise<[number, number]> {
    const n = x.length;
    const npX = numpy.array(x);
    const npY = numpy.array(y);

    const meanX = numpy.mean(npX);
    const meanY = numpy.mean(npY);

    const numerator = numpy.sum(
      numpy.multiply(
        numpy.subtract(npX, meanX),
        numpy.subtract(npY, meanY)
      )
    );

    const denominator = numpy.sum(
      numpy.power(numpy.subtract(npX, meanX), 2)
    );

    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;

    return [slope, intercept];
  }

  private async calculateForecastMetrics(
    actual: number[],
    predicted: number[]
  ): Promise<ForecastMetrics> {
    const n = Math.min(actual.length, predicted.length);
    if (n === 0) {
      return { mae: 0, mse: 0, rmse: 0, mape: 0 };
    }

    const npActual = numpy.array(actual.slice(0, n));
    const npPredicted = numpy.array(predicted.slice(0, n));

    const errors = numpy.subtract(npActual, npPredicted);
    const absErrors = numpy.abs(errors);
    const squaredErrors = numpy.square(errors);

    const mae = numpy.mean(absErrors);
    const mse = numpy.mean(squaredErrors);
    const rmse = Math.sqrt(mse);

    // MAPE (avoiding division by zero)
    const percentErrors = numpy.divide(
      absErrors,
      numpy.where(numpy.equal(npActual, 0), 1, npActual)
    );
    const mape = numpy.mean(percentErrors) * 100;

    return { mae, mse, rmse, mape };
  }

  private getZScore(confidence: number): number {
    // Standard normal distribution z-scores
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.960,
      0.99: 2.576
    };

    return zScores[confidence] || 1.960;
  }
}
