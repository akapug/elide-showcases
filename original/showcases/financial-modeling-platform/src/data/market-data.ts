/**
 * Market Data Processing
 *
 * Comprehensive market data processing and analysis using pandas:
 * - OHLCV data manipulation
 * - Technical indicators
 * - Data cleaning and resampling
 * - Correlation and covariance analysis
 *
 * Leverages pandas for efficient time series operations.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';

import type {
  TimeSeriesPoint,
  OHLCVBar,
  MarketData,
  CovarianceMatrix,
  CorrelationMatrix,
  StatisticalSummary,
} from '../types.js';

// ============================================================================
// Market Data Handler
// ============================================================================

/**
 * Handle and process market data
 */
export class MarketDataHandler {
  /**
   * Convert OHLCV data to pandas DataFrame
   */
  static toDataFrame(data: OHLCVBar[]): any {
    const timestamps: Date[] = [];
    const opens: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];
    const closes: number[] = [];
    const volumes: number[] = [];

    for (const bar of data) {
      timestamps.push(bar.timestamp);
      opens.push(bar.open);
      highs.push(bar.high);
      lows.push(bar.low);
      closes.push(bar.close);
      volumes.push(bar.volume);
    }

    const df = pandas.DataFrame({
      timestamp: pandas.to_datetime(timestamps),
      open: opens,
      high: highs,
      low: lows,
      close: closes,
      volume: volumes,
    });

    df.set_index('timestamp', { inplace: true });

    return df;
  }

  /**
   * Calculate returns from price data
   */
  static calculateReturns(
    prices: number[],
    method: 'simple' | 'log' = 'simple'
  ): number[] {
    const pricesArray = numpy.array(prices);
    let returns: any;

    if (method === 'simple') {
      returns = numpy.diff(pricesArray).divide(pricesArray['__getitem__'](numpy.s_[':(-1)']));
    } else {
      // Log returns
      returns = numpy.diff(numpy.log(pricesArray));
    }

    const result: number[] = [];
    for (let i = 0; i < returns.size; i++) {
      result.push(returns.item(i));
    }

    return result;
  }

  /**
   * Resample OHLCV data to different timeframe
   */
  static resample(
    df: any,
    frequency: 'D' | 'W' | 'M' | 'Q' | 'Y'
  ): any {
    const resampled = df.resample(frequency).agg({
      open: 'first',
      high: 'max',
      low: 'min',
      close: 'last',
      volume: 'sum',
    });

    return resampled;
  }

  /**
   * Fill missing data
   */
  static fillMissing(
    data: number[],
    method: 'forward' | 'backward' | 'linear' = 'forward'
  ): number[] {
    const series = pandas.Series(data);

    let filled: any;
    if (method === 'forward') {
      filled = series.fillna({ method: 'ffill' });
    } else if (method === 'backward') {
      filled = series.fillna({ method: 'bfill' });
    } else {
      filled = series.interpolate({ method: 'linear' });
    }

    const result: number[] = [];
    for (let i = 0; i < filled.size; i++) {
      result.push(filled.iloc[i]);
    }

    return result;
  }

  /**
   * Align multiple time series
   */
  static alignTimeSeries(
    series: Map<string, Array<{ timestamp: Date; value: number }>>
  ): Map<string, number[]> {
    const aligned = new Map<string, number[]>();

    // Find common timestamps
    const allTimestamps = new Set<number>();
    for (const data of series.values()) {
      for (const point of data) {
        allTimestamps.add(point.timestamp.getTime());
      }
    }

    const timestamps = Array.from(allTimestamps).sort();

    // Align each series
    for (const [symbol, data] of series) {
      const valueMap = new Map<number, number>();
      for (const point of data) {
        valueMap.set(point.timestamp.getTime(), point.value);
      }

      const alignedValues: number[] = [];
      for (const ts of timestamps) {
        alignedValues.push(valueMap.get(ts) || NaN);
      }

      // Forward fill NaNs
      for (let i = 1; i < alignedValues.length; i++) {
        if (isNaN(alignedValues[i])) {
          alignedValues[i] = alignedValues[i - 1];
        }
      }

      aligned.set(symbol, alignedValues);
    }

    return aligned;
  }

  /**
   * Calculate rolling statistics
   */
  static rollingStatistics(
    data: number[],
    window: number
  ): {
    mean: number[];
    std: number[];
    min: number[];
    max: number[];
  } {
    const series = pandas.Series(data);

    const rollingMean = series.rolling(window).mean();
    const rollingStd = series.rolling(window).std();
    const rollingMin = series.rolling(window).min();
    const rollingMax = series.rolling(window).max();

    const mean: number[] = [];
    const std: number[] = [];
    const min: number[] = [];
    const max: number[] = [];

    for (let i = 0; i < data.length; i++) {
      mean.push(rollingMean.iloc[i]);
      std.push(rollingStd.iloc[i]);
      min.push(rollingMin.iloc[i]);
      max.push(rollingMax.iloc[i]);
    }

    return { mean, std, min, max };
  }
}

// ============================================================================
// Technical Indicators
// ============================================================================

/**
 * Calculate technical indicators
 */
export class TechnicalIndicators {
  /**
   * Simple Moving Average
   */
  static sma(prices: number[], period: number): number[] {
    const pricesArray = numpy.array(prices);
    const sma: number[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const window = pricesArray['__getitem__'](numpy.s_[(i - period + 1):(i + 1)]);
        sma.push(numpy.mean(window));
      }
    }

    return sma;
  }

  /**
   * Exponential Moving Average
   */
  static ema(prices: number[], period: number): number[] {
    const alpha = 2 / (period + 1);
    const ema: number[] = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
      const value = alpha * prices[i] + (1 - alpha) * ema[i - 1];
      ema.push(value);
    }

    return ema;
  }

  /**
   * Bollinger Bands
   */
  static bollingerBands(
    prices: number[],
    period: number,
    numStd: number
  ): {
    middle: number[];
    upper: number[];
    lower: number[];
  } {
    const sma = this.sma(prices, period);
    const pricesArray = numpy.array(prices);

    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
      } else {
        const window = pricesArray['__getitem__'](numpy.s_[(i - period + 1):(i + 1)]);
        const std = numpy.std(window);

        upper.push(sma[i] + numStd * std);
        lower.push(sma[i] - numStd * std);
      }
    }

    return {
      middle: sma,
      upper,
      lower,
    };
  }

  /**
   * Relative Strength Index (RSI)
   */
  static rsi(prices: number[], period: number): number[] {
    const changes: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains: number[] = changes.map(c => c > 0 ? c : 0);
    const losses: number[] = changes.map(c => c < 0 ? -c : 0);

    const avgGain = this.sma(gains, period);
    const avgLoss = this.sma(losses, period);

    const rsi: number[] = [NaN]; // First value is NaN

    for (let i = 0; i < avgGain.length; i++) {
      if (isNaN(avgGain[i]) || isNaN(avgLoss[i])) {
        rsi.push(NaN);
      } else if (avgLoss[i] === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain[i] / avgLoss[i];
        rsi.push(100 - 100 / (1 + rs));
      }
    }

    return rsi;
  }

  /**
   * Moving Average Convergence Divergence (MACD)
   */
  static macd(
    prices: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
  ): {
    macd: number[];
    signal: number[];
    histogram: number[];
  } {
    const fastEma = this.ema(prices, fastPeriod);
    const slowEma = this.ema(prices, slowPeriod);

    const macd: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      macd.push(fastEma[i] - slowEma[i]);
    }

    const signal = this.ema(macd, signalPeriod);

    const histogram: number[] = [];
    for (let i = 0; i < macd.length; i++) {
      histogram.push(macd[i] - signal[i]);
    }

    return { macd, signal, histogram };
  }

  /**
   * Average True Range (ATR)
   */
  static atr(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number
  ): number[] {
    const trueRanges: number[] = [];

    for (let i = 1; i < highs.length; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trueRanges.push(tr);
    }

    return this.sma([0, ...trueRanges], period);
  }

  /**
   * Stochastic Oscillator
   */
  static stochastic(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number,
    smoothK = 3,
    smoothD = 3
  ): {
    k: number[];
    d: number[];
  } {
    const rawK: number[] = [];

    for (let i = period - 1; i < closes.length; i++) {
      const windowHighs = highs.slice(i - period + 1, i + 1);
      const windowLows = lows.slice(i - period + 1, i + 1);

      const highestHigh = Math.max(...windowHighs);
      const lowestLow = Math.min(...windowLows);

      const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      rawK.push(k);
    }

    // Smooth %K
    const k = this.sma(rawK, smoothK);

    // %D is SMA of %K
    const d = this.sma(k, smoothD);

    // Pad with NaNs
    const paddedK = new Array(period - 1).fill(NaN).concat(k);
    const paddedD = new Array(period + smoothK - 2).fill(NaN).concat(d);

    return { k: paddedK, d: paddedD };
  }

  /**
   * On-Balance Volume (OBV)
   */
  static obv(closes: number[], volumes: number[]): number[] {
    const obv: number[] = [volumes[0]];

    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv.push(obv[i - 1] + volumes[i]);
      } else if (closes[i] < closes[i - 1]) {
        obv.push(obv[i - 1] - volumes[i]);
      } else {
        obv.push(obv[i - 1]);
      }
    }

    return obv;
  }
}

// ============================================================================
// Statistical Analysis
// ============================================================================

/**
 * Statistical analysis of market data
 */
export class MarketStatistics {
  /**
   * Calculate comprehensive statistical summary
   */
  static summary(data: number[]): StatisticalSummary {
    const dataArray = numpy.array(data);

    const mean = numpy.mean(dataArray);
    const median = numpy.median(dataArray);
    const std = numpy.std(dataArray);
    const variance = numpy.var(dataArray);
    const min = numpy.min(dataArray);
    const max = numpy.max(dataArray);

    // Calculate skewness
    const demeaned = dataArray.subtract(mean);
    const skewness = numpy.mean(numpy.power(demeaned, 3)) / Math.pow(std, 3);

    // Calculate kurtosis (excess kurtosis)
    const kurtosis = numpy.mean(numpy.power(demeaned, 4)) / Math.pow(std, 4) - 3;

    // Calculate percentiles
    const percentiles = new Map<number, number>();
    for (const p of [1, 5, 10, 25, 50, 75, 90, 95, 99]) {
      percentiles.set(p, numpy.percentile(dataArray, p));
    }

    return {
      count: data.length,
      mean,
      median,
      mode: undefined, // Simplified
      std,
      variance,
      skewness,
      kurtosis,
      min,
      max,
      percentiles,
    };
  }

  /**
   * Calculate correlation matrix
   */
  static correlationMatrix(
    data: Map<string, number[]>,
    timestamp = new Date()
  ): CorrelationMatrix {
    const assets = Array.from(data.keys());
    const n = assets.length;

    // Build data matrix
    const dataMatrix: number[][] = [];
    for (const asset of assets) {
      dataMatrix.push(data.get(asset) || []);
    }

    const dataArray = numpy.array(dataMatrix);
    const corrMatrix = numpy.corrcoef(dataArray);

    // Extract correlation matrix
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(corrMatrix.item([i, j]));
      }
      matrix.push(row);
    }

    return {
      assets,
      matrix,
      timestamp,
    };
  }

  /**
   * Calculate covariance matrix
   */
  static covarianceMatrix(
    data: Map<string, number[]>,
    timestamp = new Date()
  ): CovarianceMatrix {
    const assets = Array.from(data.keys());
    const n = assets.length;

    const dataMatrix: number[][] = [];
    for (const asset of assets) {
      dataMatrix.push(data.get(asset) || []);
    }

    const dataArray = numpy.array(dataMatrix);
    const covMatrix = numpy.cov(dataArray);

    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(covMatrix.item([i, j]));
      }
      matrix.push(row);
    }

    return {
      assets,
      matrix,
      timestamp,
    };
  }

  /**
   * Calculate rolling correlation
   */
  static rollingCorrelation(
    series1: number[],
    series2: number[],
    window: number
  ): number[] {
    const correlations: number[] = [];

    for (let i = window; i <= series1.length; i++) {
      const window1 = series1.slice(i - window, i);
      const window2 = series2.slice(i - window, i);

      const array1 = numpy.array(window1);
      const array2 = numpy.array(window2);

      const corr = numpy.corrcoef(array1, array2).item([0, 1]);
      correlations.push(corr);
    }

    return correlations;
  }

  /**
   * Test for normality (Jarque-Bera test)
   */
  static jarqueBeraTest(data: number[]): {
    statistic: number;
    pValue: number;
    isNormal: boolean;
  } {
    const dataArray = numpy.array(data);
    const n = data.length;

    const mean = numpy.mean(dataArray);
    const std = numpy.std(dataArray);

    const demeaned = dataArray.subtract(mean);
    const skewness = numpy.mean(numpy.power(demeaned, 3)) / Math.pow(std, 3);
    const kurtosis = numpy.mean(numpy.power(demeaned, 4)) / Math.pow(std, 4) - 3;

    // Jarque-Bera statistic
    const jb = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosis, 2) / 4);

    // Chi-squared distribution with 2 degrees of freedom
    // Simplified p-value approximation
    const pValue = jb > 5.99 ? 0.01 : 0.1; // Rough approximation

    return {
      statistic: jb,
      pValue,
      isNormal: pValue > 0.05,
    };
  }

  /**
   * Calculate beta coefficient
   */
  static beta(
    assetReturns: number[],
    marketReturns: number[]
  ): number {
    const assetArray = numpy.array(assetReturns);
    const marketArray = numpy.array(marketReturns);

    const covariance = numpy.cov(assetArray, marketArray).item([0, 1]);
    const marketVariance = numpy.var(marketArray);

    return covariance / marketVariance;
  }

  /**
   * Calculate Information Coefficient (IC)
   */
  static informationCoefficient(
    forecasts: number[],
    realized: number[]
  ): number {
    const forecastArray = numpy.array(forecasts);
    const realizedArray = numpy.array(realized);

    const corrMatrix = numpy.corrcoef(forecastArray, realizedArray);
    return corrMatrix.item([0, 1]);
  }
}

// ============================================================================
// Data Quality Checks
// ============================================================================

/**
 * Check data quality and integrity
 */
export class DataQualityChecker {
  /**
   * Check for missing data
   */
  static checkMissing(data: number[]): {
    hasMissing: boolean;
    missingCount: number;
    missingPercentage: number;
  } {
    let missingCount = 0;

    for (const value of data) {
      if (isNaN(value) || value === null || value === undefined) {
        missingCount++;
      }
    }

    return {
      hasMissing: missingCount > 0,
      missingCount,
      missingPercentage: (missingCount / data.length) * 100,
    };
  }

  /**
   * Check for outliers using IQR method
   */
  static detectOutliers(data: number[]): {
    outliers: number[];
    outlierIndices: number[];
    lowerBound: number;
    upperBound: number;
  } {
    const dataArray = numpy.array(data);

    const q1 = numpy.percentile(dataArray, 25);
    const q3 = numpy.percentile(dataArray, 75);
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers: number[] = [];
    const outlierIndices: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i] < lowerBound || data[i] > upperBound) {
        outliers.push(data[i]);
        outlierIndices.push(i);
      }
    }

    return {
      outliers,
      outlierIndices,
      lowerBound,
      upperBound,
    };
  }

  /**
   * Check data consistency
   */
  static checkConsistency(
    ohlcvData: OHLCVBar[]
  ): Array<{ index: number; issue: string }> {
    const issues: Array<{ index: number; issue: string }> = [];

    for (let i = 0; i < ohlcvData.length; i++) {
      const bar = ohlcvData[i];

      // High should be >= all other prices
      if (bar.high < bar.low || bar.high < bar.open || bar.high < bar.close) {
        issues.push({ index: i, issue: 'High price is not the highest' });
      }

      // Low should be <= all other prices
      if (bar.low > bar.high || bar.low > bar.open || bar.low > bar.close) {
        issues.push({ index: i, issue: 'Low price is not the lowest' });
      }

      // Volume should be non-negative
      if (bar.volume < 0) {
        issues.push({ index: i, issue: 'Negative volume' });
      }

      // All prices should be positive
      if (bar.open <= 0 || bar.high <= 0 || bar.low <= 0 || bar.close <= 0) {
        issues.push({ index: i, issue: 'Non-positive price' });
      }
    }

    return issues;
  }

  /**
   * Check for duplicate timestamps
   */
  static checkDuplicates(
    timestamps: Date[]
  ): Array<{ index: number; timestamp: Date }> {
    const seen = new Set<number>();
    const duplicates: Array<{ index: number; timestamp: Date }> = [];

    for (let i = 0; i < timestamps.length; i++) {
      const time = timestamps[i].getTime();

      if (seen.has(time)) {
        duplicates.push({ index: i, timestamp: timestamps[i] });
      } else {
        seen.add(time);
      }
    }

    return duplicates;
  }
}

// ============================================================================
// Export all classes
// ============================================================================

export {
  MarketDataHandler,
  TechnicalIndicators,
  MarketStatistics,
  DataQualityChecker,
};
