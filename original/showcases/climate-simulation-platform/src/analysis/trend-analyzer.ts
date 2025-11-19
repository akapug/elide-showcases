/**
 * Climate Trend Analysis Module
 *
 * Statistical analysis of climate trends using Python SciPy.
 * Demonstrates Elide polyglot for scientific data analysis.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import type {
  TrendAnalysisResult,
  ClimateDataArray,
} from '../types.js';

/**
 * Climate Trend Analyzer
 * Performs statistical analysis on climate time series
 */
export class ClimateTrendAnalyzer {
  /**
   * Compute linear trend using least squares regression
   */
  async computeLinearTrend(
    time: number[],
    values: number[],
    units: string = ''
  ): Promise<TrendAnalysisResult> {
    // Convert to NumPy arrays
    const timeArray = await numpy.array(time);
    const valueArray = await numpy.array(values);

    // Remove NaN values
    const mask = await numpy.isfinite(valueArray);
    const timeClean = await numpy.compress(mask, timeArray);
    const valueClean = await numpy.compress(mask, valueArray);

    // Perform linear regression using SciPy
    const regression = await scipy.stats.linregress(timeClean, valueClean);

    // Extract results
    const slope = await regression.slope;
    const intercept = await regression.intercept;
    const rValue = await regression.rvalue;
    const pValue = await regression.pvalue;
    const stdErr = await regression.stderr;

    // Compute statistics
    const mean = await numpy.mean(valueClean);
    const median = await numpy.median(valueClean);
    const std = await numpy.std(valueClean);
    const variance = await numpy.var(valueClean);
    const minimum = await numpy.min(valueClean);
    const maximum = await numpy.max(valueClean);

    // Compute autocorrelation
    const lag1Autocorr = await this.computeAutocorrelation(valueClean, 1);

    // Effective sample size accounting for autocorrelation
    const n = await valueClean.size;
    const effectiveSampleSize = n * (1 - lag1Autocorr) / (1 + lag1Autocorr);

    // Decorrelation time
    const decorrelationTime = n / effectiveSampleSize;

    // Confidence intervals (95% and 99%)
    const tCritical95 = 1.96; // Approximate for large samples
    const tCritical99 = 2.576;

    const slopeSE = stdErr;
    const confidence95: [number, number] = [
      slope - tCritical95 * slopeSE,
      slope + tCritical95 * slopeSE,
    ];
    const confidence99: [number, number] = [
      slope - tCritical99 * slopeSE,
      slope + tCritical99 * slopeSE,
    ];

    // Compute anomalies
    const baseline = await this.computeBaseline(valueClean, time.length > 30 ? 30 : time.length);
    const anomalies = await numpy.subtract(valueClean, baseline);

    // Compute change metrics
    const totalChange = slope * (time[time.length - 1] - time[0]);
    const percentChange = (totalChange / mean) * 100;
    const decadalChange = slope * 10; // Per decade

    // Compute acceleration (second derivative)
    const acceleration = await this.computeAcceleration(timeClean, valueClean);

    return {
      trend: {
        slope,
        slopeError: stdErr,
        intercept,
        interceptError: stdErr * Math.sqrt(await numpy.mean(await numpy.square(timeClean))),
        units: `${units}/year`,
      },
      statistics: {
        rSquared: rValue * rValue,
        pValue,
        tStatistic: slope / stdErr,
        degreesOfFreedom: n - 2,
        confidence95,
        confidence99,
      },
      timeSeries: {
        mean,
        median,
        standardDeviation: std,
        variance,
        minimum,
        maximum,
        range: maximum - minimum,
      },
      autocorrelation: {
        lag1: lag1Autocorr,
        effectiveSampleSize,
        decorrelationTime,
      },
      anomalies: {
        values: await anomalies.tolist(),
        baseline,
        baselinePeriod: [time[0], time[Math.min(30, time.length - 1)]],
      },
      change: {
        totalChange,
        percentChange,
        decadalChange,
        accelerationRate: acceleration,
      },
    };
  }

  /**
   * Compute autocorrelation at given lag
   */
  private async computeAutocorrelation(data: any, lag: number): Promise<number> {
    const n = await data.size;
    const mean = await numpy.mean(data);

    const dataArray = await data.tolist();

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(dataArray[i] - mean, 2);

      if (i + lag < n) {
        numerator += (dataArray[i] - mean) * (dataArray[i + lag] - mean);
      }
    }

    return numerator / denominator;
  }

  /**
   * Compute baseline (climatology reference period)
   */
  private async computeBaseline(data: any, years: number): Promise<number> {
    const subset = await data.get(
      await numpy.s_[`:${years}`]
    );
    return await numpy.mean(subset);
  }

  /**
   * Compute acceleration (rate of change of trend)
   */
  private async computeAcceleration(time: any, values: any): Promise<number> {
    // Fit quadratic polynomial: y = a + bt + ct²
    const coeffs = await numpy.polyfit(time, values, 2);
    const coeffsList = await coeffs.tolist();

    // Acceleration is 2c
    return 2 * coeffsList[0];
  }

  /**
   * Detect change points in time series
   */
  async detectChangePoints(
    time: number[],
    values: number[],
    minSegmentLength: number = 10
  ): Promise<{
    changePoints: number[];
    segments: Array<{ start: number; end: number; trend: number }>;
  }> {
    const timeArray = await numpy.array(time);
    const valueArray = await numpy.array(values);

    // Simple change point detection using cumulative sum
    const mean = await numpy.mean(valueArray);
    const deviations = await numpy.subtract(valueArray, mean);
    const cumSum = await numpy.cumsum(deviations);

    // Find local maxima and minima in cumulative sum
    const cumSumList = await cumSum.tolist();
    const changePoints: number[] = [];

    for (let i = minSegmentLength; i < cumSumList.length - minSegmentLength; i++) {
      const left = cumSumList.slice(i - minSegmentLength, i);
      const right = cumSumList.slice(i + 1, i + minSegmentLength + 1);

      const isMaximum = cumSumList[i] > Math.max(...left) &&
                        cumSumList[i] > Math.max(...right);
      const isMinimum = cumSumList[i] < Math.min(...left) &&
                        cumSumList[i] < Math.min(...right);

      if (isMaximum || isMinimum) {
        changePoints.push(time[i]);
      }
    }

    // Compute trends for each segment
    const segments: Array<{ start: number; end: number; trend: number }> = [];

    const segmentStarts = [time[0], ...changePoints];
    const segmentEnds = [...changePoints, time[time.length - 1]];

    for (let i = 0; i < segmentStarts.length; i++) {
      const startIdx = time.indexOf(segmentStarts[i]);
      const endIdx = time.indexOf(segmentEnds[i]);

      const segmentTime = time.slice(startIdx, endIdx + 1);
      const segmentValues = values.slice(startIdx, endIdx + 1);

      if (segmentTime.length >= 2) {
        const regression = await scipy.stats.linregress(
          await numpy.array(segmentTime),
          await numpy.array(segmentValues)
        );

        segments.push({
          start: segmentStarts[i],
          end: segmentEnds[i],
          trend: await regression.slope,
        });
      }
    }

    return {
      changePoints,
      segments,
    };
  }

  /**
   * Perform Mann-Kendall trend test
   * Non-parametric test for monotonic trend
   */
  async mannKendallTest(
    values: number[]
  ): Promise<{
    statistic: number;
    pValue: number;
    trend: 'increasing' | 'decreasing' | 'no trend';
    tau: number;
  }> {
    const valueArray = await numpy.array(values);
    const n = values.length;

    // Compute Mann-Kendall statistic S
    let S = 0;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        if (values[j] > values[i]) {
          S += 1;
        } else if (values[j] < values[i]) {
          S -= 1;
        }
      }
    }

    // Variance of S
    const varS = (n * (n - 1) * (2 * n + 5)) / 18;

    // Z-statistic
    let Z: number;
    if (S > 0) {
      Z = (S - 1) / Math.sqrt(varS);
    } else if (S < 0) {
      Z = (S + 1) / Math.sqrt(varS);
    } else {
      Z = 0;
    }

    // P-value (two-tailed test)
    const pValue = 2 * (1 - await this.normalCDF(Math.abs(Z)));

    // Kendall's tau
    const tau = (2 * S) / (n * (n - 1));

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'no trend';
    if (pValue < 0.05) {
      trend = S > 0 ? 'increasing' : 'decreasing';
    } else {
      trend = 'no trend';
    }

    return {
      statistic: S,
      pValue,
      trend,
      tau,
    };
  }

  /**
   * Compute normal CDF (cumulative distribution function)
   */
  private async normalCDF(z: number): Promise<number> {
    const normDist = await scipy.stats.norm;
    return await normDist.cdf(z);
  }

  /**
   * Perform spectral analysis (power spectrum)
   */
  async computePowerSpectrum(
    time: number[],
    values: number[]
  ): Promise<{
    frequencies: number[];
    power: number[];
    significantPeaks: Array<{ frequency: number; period: number; power: number }>;
  }> {
    const valueArray = await numpy.array(values);

    // Detrend the data
    const detrended = await scipy.signal.detrend(valueArray);

    // Apply window function (Hanning)
    const window = await scipy.signal.windows.hann(values.length);
    const windowed = await numpy.multiply(detrended, window);

    // Compute FFT
    const fft = await numpy.fft.fft(windowed);
    const powerSpectrum = await numpy.abs(fft);

    // Frequencies
    const dt = time.length > 1 ? time[1] - time[0] : 1;
    const frequencies = await numpy.fft.fftfreq(values.length, dt);

    // Use only positive frequencies
    const nPositive = Math.floor(values.length / 2);
    const freqPositive = await frequencies.get(
      await numpy.s_[`:${nPositive}`]
    );
    const powerPositive = await powerSpectrum.get(
      await numpy.s_[`:${nPositive}`]
    );

    // Find significant peaks (simplified)
    const powerList = await powerPositive.tolist();
    const freqList = await freqPositive.tolist();

    const threshold = (await numpy.mean(powerPositive)) + 2 * (await numpy.std(powerPositive));
    const significantPeaks: Array<{ frequency: number; period: number; power: number }> = [];

    for (let i = 1; i < powerList.length - 1; i++) {
      if (powerList[i] > threshold &&
          powerList[i] > powerList[i - 1] &&
          powerList[i] > powerList[i + 1]) {
        const freq = freqList[i];
        if (freq > 0) {
          significantPeaks.push({
            frequency: freq,
            period: 1 / freq,
            power: powerList[i],
          });
        }
      }
    }

    return {
      frequencies: freqList,
      power: powerList,
      significantPeaks,
    };
  }

  /**
   * Compute running mean (moving average)
   */
  async computeRunningMean(
    values: number[],
    windowSize: number
  ): Promise<number[]> {
    const valueArray = await numpy.array(values);

    // Convolve with uniform window
    const window = await numpy.ones(windowSize);
    const windowNorm = await numpy.divide(window, windowSize);

    const smoothed = await numpy.convolve(valueArray, windowNorm, { mode: 'same' });

    return await smoothed.tolist();
  }

  /**
   * Perform EOF analysis (Empirical Orthogonal Functions)
   */
  async computeEOF(
    data: number[][],
    numModes: number = 3
  ): Promise<{
    eofs: number[][];
    pcs: number[][];
    variance: number[];
    varianceExplained: number[];
  }> {
    // Data should be [time, space]
    const dataArray = await numpy.array(data);

    // Center the data
    const mean = await numpy.mean(dataArray, { axis: 0 });
    const centered = await numpy.subtract(dataArray, mean);

    // Compute SVD
    const svd = await numpy.linalg.svd(centered, { full_matrices: false });
    const U = await svd[0]; // Principal components (time series)
    const S = await svd[1]; // Singular values
    const Vt = await svd[2]; // EOFs (spatial patterns)

    // Convert singular values to variance
    const variance = await numpy.square(S);
    const totalVariance = await numpy.sum(variance);
    const varianceExplained = await numpy.divide(variance, totalVariance);

    // Extract first numModes
    const eofs = await Vt.get(await numpy.s_[`:${numModes}`]);
    const pcs = await U.get(await numpy.s_[`:${numModes}`]);
    const varExplained = await varianceExplained.get(await numpy.s_[`:${numModes}`]);

    return {
      eofs: await eofs.tolist(),
      pcs: await pcs.tolist(),
      variance: await variance.tolist(),
      varianceExplained: await varExplained.tolist(),
    };
  }

  /**
   * Compute composite analysis
   */
  async computeComposite(
    data: number[][],
    indices: number[],
    threshold: number
  ): Promise<{
    positive: number[];
    negative: number[];
    difference: number[];
  }> {
    const dataArray = await numpy.array(data);
    const indicesArray = await numpy.array(indices);

    // Find time steps where index exceeds threshold
    const positiveIndices = await numpy.where(
      await numpy.greater(indicesArray, threshold)
    );
    const negativeIndices = await numpy.where(
      await numpy.less(indicesArray, -threshold)
    );

    // Compute composites
    const positiveComposite = await numpy.mean(
      await dataArray.get(positiveIndices),
      { axis: 0 }
    );

    const negativeComposite = await numpy.mean(
      await dataArray.get(negativeIndices),
      { axis: 0 }
    );

    const difference = await numpy.subtract(positiveComposite, negativeComposite);

    return {
      positive: await positiveComposite.tolist(),
      negative: await negativeComposite.tolist(),
      difference: await difference.tolist(),
    };
  }

  /**
   * Compute correlation coefficient
   */
  async computeCorrelation(
    x: number[],
    y: number[]
  ): Promise<{
    pearson: number;
    spearman: number;
    pValuePearson: number;
    pValueSpearman: number;
  }> {
    const xArray = await numpy.array(x);
    const yArray = await numpy.array(y);

    // Pearson correlation
    const pearsonResult = await scipy.stats.pearsonr(xArray, yArray);
    const pearson = await pearsonResult[0];
    const pValuePearson = await pearsonResult[1];

    // Spearman correlation
    const spearmanResult = await scipy.stats.spearmanr(xArray, yArray);
    const spearman = await spearmanResult.correlation;
    const pValueSpearman = await spearmanResult.pvalue;

    return {
      pearson,
      spearman,
      pValuePearson,
      pValueSpearman,
    };
  }

  /**
   * Perform lag correlation analysis
   */
  async computeLagCorrelation(
    x: number[],
    y: number[],
    maxLag: number = 12
  ): Promise<{
    lags: number[];
    correlation: number[];
    maxCorrelation: { lag: number; value: number };
  }> {
    const lags: number[] = [];
    const correlation: number[] = [];

    for (let lag = -maxLag; lag <= maxLag; lag++) {
      lags.push(lag);

      let xLagged: number[];
      let yLagged: number[];

      if (lag >= 0) {
        xLagged = x.slice(0, x.length - lag || x.length);
        yLagged = y.slice(lag);
      } else {
        xLagged = x.slice(-lag);
        yLagged = y.slice(0, y.length + lag || y.length);
      }

      const minLength = Math.min(xLagged.length, yLagged.length);
      xLagged = xLagged.slice(0, minLength);
      yLagged = yLagged.slice(0, minLength);

      const corr = await this.computeCorrelation(xLagged, yLagged);
      correlation.push(corr.pearson);
    }

    // Find maximum correlation
    const maxIdx = correlation.indexOf(Math.max(...correlation.map(Math.abs)));

    return {
      lags,
      correlation,
      maxCorrelation: {
        lag: lags[maxIdx],
        value: correlation[maxIdx],
      },
    };
  }
}

/**
 * Climate Index Calculator
 * Compute common climate indices (ENSO, NAO, etc.)
 */
export class ClimateIndexCalculator {
  /**
   * Compute El Niño 3.4 Index
   */
  static async computeNino34(
    sst: number[][],
    lon: number[],
    lat: number[]
  ): Promise<number[]> {
    // Niño 3.4 region: 5°S-5°N, 170°W-120°W
    const bounds = {
      lonMin: 190,
      lonMax: 240,
      latMin: -5,
      latMax: 5,
    };

    // Extract region and compute average
    const nino34: number[] = [];

    for (const sstTime of sst) {
      let sum = 0;
      let count = 0;

      for (let i = 0; i < lon.length; i++) {
        for (let j = 0; j < lat.length; j++) {
          if (lon[i] >= bounds.lonMin && lon[i] <= bounds.lonMax &&
              lat[j] >= bounds.latMin && lat[j] <= bounds.latMax) {
            sum += sstTime[i * lat.length + j];
            count++;
          }
        }
      }

      nino34.push(sum / count);
    }

    return nino34;
  }

  /**
   * Compute North Atlantic Oscillation Index
   */
  static async computeNAO(
    slp: number[][],
    lon: number[],
    lat: number[]
  ): Promise<number[]> {
    // NAO: Difference between Iceland and Azores SLP
    const icelandLat = 65;
    const icelandLon = 340;
    const azoresLat = 38;
    const azoresLon = 335;

    const nao: number[] = [];

    for (const slpTime of slp) {
      // Find nearest grid points
      const icelandIdx = this.findNearest(lat, icelandLat) * lon.length +
                         this.findNearest(lon, icelandLon);
      const azoresIdx = this.findNearest(lat, azoresLat) * lon.length +
                        this.findNearest(lon, azoresLon);

      const icelandSLP = slpTime[icelandIdx];
      const azoresSLP = slpTime[azoresIdx];

      nao.push(azoresSLP - icelandSLP);
    }

    return nao;
  }

  private static findNearest(array: number[], value: number): number {
    let minDist = Infinity;
    let minIdx = 0;

    for (let i = 0; i < array.length; i++) {
      const dist = Math.abs(array[i] - value);
      if (dist < minDist) {
        minDist = dist;
        minIdx = i;
      }
    }

    return minIdx;
  }
}

/**
 * Export analyzer factory
 */
export function createTrendAnalyzer(): ClimateTrendAnalyzer {
  return new ClimateTrendAnalyzer();
}
