/**
 * Elide IoT Platform - Sensor Processor
 *
 * Real-time sensor data processing with Python's scipy for signal filtering,
 * FFT analysis, and advanced signal processing techniques.
 *
 * Demonstrates Elide polyglot: TypeScript + python:scipy
 */

// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import numpy from 'python:numpy';

import {
  SensorReading,
  SensorId,
  DeviceId,
  FilterConfig,
  FilterType,
  FilterDesign,
  FilteredSignal,
  FrequencyAnalysis,
  DataQuality
} from '../types';

// ============================================================================
// Sensor Processor Configuration
// ============================================================================

export interface SensorProcessorConfig {
  sampleRate: number;
  filterType: FilterDesign;
  cutoffFrequency: number | [number, number];
  bufferSize: number;
  enableNoiseReduction: boolean;
  enableSpikeDetection: boolean;
  qualityThreshold: number;
}

export interface ProcessingOptions {
  filter?: boolean;
  detrend?: boolean;
  denoise?: boolean;
  detectSpikes?: boolean;
  fftAnalysis?: boolean;
}

export interface SpikeDetectionResult {
  spikes: number[];
  indices: number[];
  threshold: number;
  method: 'zscore' | 'mad' | 'iqr';
}

// ============================================================================
// Sensor Processor Implementation
// ============================================================================

export class SensorProcessor {
  private filterCache: Map<string, any> = new Map();
  private processingBuffer: Map<SensorId, number[]> = new Map();

  constructor(private config: SensorProcessorConfig) {}

  // ========================================================================
  // Signal Filtering
  // ========================================================================

  async applyFilter(
    data: number[],
    filterConfig?: Partial<FilterConfig>
  ): Promise<FilteredSignal> {
    const startTime = performance.now();

    // Convert to numpy array
    const npData = numpy.array(data);

    // Design filter
    const filter = await this.designFilter(filterConfig);

    // Apply filter using scipy
    let filtered: any;

    if (filter.sos) {
      // Second-order sections (recommended for stability)
      filtered = scipy.signal.sosfiltfilt(filter.sos, npData);
    } else {
      // Standard filter coefficients
      filtered = scipy.signal.filtfilt(filter.b, filter.a, npData);
    }

    // Convert back to JavaScript array
    const filteredArray = Array.from(filtered);

    const latency = performance.now() - startTime;

    return {
      signal: filteredArray,
      timestamps: Array.from({ length: filteredArray.length }, (_, i) => i),
      filter: {
        type: filterConfig?.type || FilterType.LOWPASS,
        order: filterConfig?.order || 4,
        cutoff: filterConfig?.cutoff || this.config.cutoffFrequency,
        sampleRate: filterConfig?.sampleRate || this.config.sampleRate
      },
      metadata: {
        latency,
        snr: await this.calculateSNR(data, filteredArray)
      }
    };
  }

  private async designFilter(filterConfig?: Partial<FilterConfig>): Promise<any> {
    const type = filterConfig?.type || FilterType.LOWPASS;
    const order = filterConfig?.order || 4;
    const cutoff = filterConfig?.cutoff || this.config.cutoffFrequency;
    const sampleRate = filterConfig?.sampleRate || this.config.sampleRate;

    // Create cache key
    const cacheKey = `${type}-${order}-${cutoff}-${sampleRate}`;

    // Check cache
    if (this.filterCache.has(cacheKey)) {
      return this.filterCache.get(cacheKey);
    }

    // Normalize cutoff frequency
    const nyquist = sampleRate / 2;
    const normalizedCutoff = Array.isArray(cutoff)
      ? [cutoff[0] / nyquist, cutoff[1] / nyquist]
      : cutoff / nyquist;

    // Design filter based on type
    let filter: any;

    switch (this.config.filterType) {
      case 'butterworth':
        filter = scipy.signal.butter(
          order,
          normalizedCutoff,
          type,
          { output: 'sos' }
        );
        break;

      case 'chebyshev':
        filter = scipy.signal.cheby1(
          order,
          filterConfig?.ripple || 0.5,
          normalizedCutoff,
          type,
          { output: 'sos' }
        );
        break;

      case 'bessel':
        filter = scipy.signal.bessel(
          order,
          normalizedCutoff,
          type,
          { output: 'sos' }
        );
        break;

      case 'elliptic':
        filter = scipy.signal.ellip(
          order,
          filterConfig?.ripple || 0.5,
          filterConfig?.attenuation || 40,
          normalizedCutoff,
          type,
          { output: 'sos' }
        );
        break;

      default:
        filter = scipy.signal.butter(order, normalizedCutoff, type, { output: 'sos' });
    }

    // Cache filter
    this.filterCache.set(cacheKey, filter);

    return filter;
  }

  async applyBandpassFilter(
    data: number[],
    lowCutoff: number,
    highCutoff: number,
    order: number = 4
  ): Promise<number[]> {
    const result = await this.applyFilter(data, {
      type: FilterType.BANDPASS,
      order,
      cutoff: [lowCutoff, highCutoff],
      sampleRate: this.config.sampleRate
    });

    return result.signal;
  }

  async applyLowpassFilter(
    data: number[],
    cutoff: number,
    order: number = 4
  ): Promise<number[]> {
    const result = await this.applyFilter(data, {
      type: FilterType.LOWPASS,
      order,
      cutoff,
      sampleRate: this.config.sampleRate
    });

    return result.signal;
  }

  async applyHighpassFilter(
    data: number[],
    cutoff: number,
    order: number = 4
  ): Promise<number[]> {
    const result = await this.applyFilter(data, {
      type: FilterType.HIGHPASS,
      order,
      cutoff,
      sampleRate: this.config.sampleRate
    });

    return result.signal;
  }

  async applyNotchFilter(
    data: number[],
    frequency: number,
    quality: number = 30
  ): Promise<number[]> {
    const npData = numpy.array(data);

    // Design notch filter
    const b, a = scipy.signal.iirnotch(
      frequency,
      quality,
      this.config.sampleRate
    );

    // Apply filter
    const filtered = scipy.signal.filtfilt(b, a, npData);

    return Array.from(filtered);
  }

  // ========================================================================
  // Frequency Analysis
  // ========================================================================

  async performFFT(data: number[]): Promise<FrequencyAnalysis> {
    const npData = numpy.array(data);
    const n = data.length;

    // Compute FFT
    const fft = numpy.fft.fft(npData);
    const freqs = numpy.fft.fftfreq(n, 1 / this.config.sampleRate);

    // Compute magnitude and phase
    const magnitude = numpy.abs(fft);
    const phase = numpy.angle(fft);

    // Power spectral density
    const psd = numpy.multiply(magnitude, magnitude) / n;

    // Find dominant frequencies (peaks)
    const peakIndices = scipy.signal.find_peaks(
      magnitude.slice(0, Math.floor(n / 2)),
      { height: numpy.max(magnitude) * 0.1 }
    );

    const dominantFreqs = peakIndices[0].map((idx: number) =>
      Math.abs(freqs[idx])
    );

    return {
      frequencies: Array.from(freqs.slice(0, Math.floor(n / 2))),
      magnitudes: Array.from(magnitude.slice(0, Math.floor(n / 2))),
      phases: Array.from(phase.slice(0, Math.floor(n / 2))),
      dominantFrequencies: Array.from(dominantFreqs),
      powerSpectrum: Array.from(psd.slice(0, Math.floor(n / 2)))
    };
  }

  async computeSpectrogram(
    data: number[],
    windowSize: number = 256,
    overlap: number = 128
  ): Promise<SpectrogramResult> {
    const npData = numpy.array(data);

    // Compute spectrogram using scipy
    const [f, t, Sxx] = scipy.signal.spectrogram(
      npData,
      this.config.sampleRate,
      { window: 'hann', nperseg: windowSize, noverlap: overlap }
    );

    return {
      frequencies: Array.from(f),
      times: Array.from(t),
      spectrogram: Array.from(Sxx.flatten()),
      shape: [Sxx.shape[0], Sxx.shape[1]]
    };
  }

  async computePowerSpectralDensity(data: number[]): Promise<PSDResult> {
    const npData = numpy.array(data);

    // Welch's method for PSD estimation
    const [f, psd] = scipy.signal.welch(
      npData,
      this.config.sampleRate,
      { nperseg: 256 }
    );

    return {
      frequencies: Array.from(f),
      psd: Array.from(psd),
      totalPower: numpy.sum(psd)
    };
  }

  // ========================================================================
  // Spike Detection & Anomaly Finding
  // ========================================================================

  async detectSpikes(
    data: number[],
    options: {
      threshold: number;
      method: 'zscore' | 'mad' | 'iqr';
    }
  ): Promise<SpikeDetectionResult> {
    const npData = numpy.array(data);

    let threshold: number;
    let spikes: number[];
    let indices: number[];

    switch (options.method) {
      case 'zscore':
        // Z-score method
        const mean = numpy.mean(npData);
        const std = numpy.std(npData);
        const zscores = numpy.abs(numpy.subtract(npData, mean)) / std;
        indices = Array.from(
          numpy.where(numpy.greater(zscores, options.threshold))[0]
        );
        spikes = indices.map(i => data[i]);
        threshold = options.threshold;
        break;

      case 'mad':
        // Median Absolute Deviation
        const median = numpy.median(npData);
        const mad = numpy.median(numpy.abs(numpy.subtract(npData, median)));
        const modifiedZScores = 0.6745 * numpy.abs(numpy.subtract(npData, median)) / mad;
        indices = Array.from(
          numpy.where(numpy.greater(modifiedZScores, options.threshold))[0]
        );
        spikes = indices.map(i => data[i]);
        threshold = options.threshold;
        break;

      case 'iqr':
        // Interquartile Range
        const q1 = numpy.percentile(npData, 25);
        const q3 = numpy.percentile(npData, 75);
        const iqr = q3 - q1;
        const lowerBound = q1 - options.threshold * iqr;
        const upperBound = q3 + options.threshold * iqr;
        indices = Array.from(
          numpy.where(
            numpy.logical_or(
              numpy.less(npData, lowerBound),
              numpy.greater(npData, upperBound)
            )
          )[0]
        );
        spikes = indices.map(i => data[i]);
        threshold = options.threshold * iqr;
        break;
    }

    return {
      spikes,
      indices,
      threshold,
      method: options.method
    };
  }

  async findPeaks(data: number[], options?: PeakFindingOptions): Promise<PeakResult> {
    const npData = numpy.array(data);

    const peakIndices = scipy.signal.find_peaks(npData, {
      height: options?.minHeight,
      threshold: options?.minThreshold,
      distance: options?.minDistance,
      prominence: options?.minProminence,
      width: options?.minWidth
    });

    const peaks = peakIndices[0].map((idx: number) => data[idx]);
    const properties = peakIndices[1];

    return {
      indices: Array.from(peakIndices[0]),
      values: Array.from(peaks),
      properties: {
        heights: properties.peak_heights ? Array.from(properties.peak_heights) : [],
        prominences: properties.prominences ? Array.from(properties.prominences) : [],
        widths: properties.widths ? Array.from(properties.widths) : []
      }
    };
  }

  // ========================================================================
  // Signal Detrending & Denoising
  // ========================================================================

  async detrend(data: number[], type: 'linear' | 'constant' = 'linear'): Promise<number[]> {
    const npData = numpy.array(data);
    const detrended = scipy.signal.detrend(npData, { type });
    return Array.from(detrended);
  }

  async denoise(data: number[], method: 'savgol' | 'median' = 'savgol'): Promise<number[]> {
    const npData = numpy.array(data);

    if (method === 'savgol') {
      // Savitzky-Golay filter
      const windowLength = Math.min(51, data.length - (data.length % 2 === 0 ? 1 : 0));
      const polyorder = 3;
      const filtered = scipy.signal.savgol_filter(npData, windowLength, polyorder);
      return Array.from(filtered);
    } else {
      // Median filter
      const kernelSize = 5;
      const filtered = scipy.signal.medfilt(npData, kernelSize);
      return Array.from(filtered);
    }
  }

  async removeOutliers(data: number[], threshold: number = 3): Promise<number[]> {
    const npData = numpy.array(data);

    // Use Z-score method
    const mean = numpy.mean(npData);
    const std = numpy.std(npData);
    const zscores = numpy.abs(numpy.subtract(npData, mean)) / std;

    // Replace outliers with median
    const median = numpy.median(npData);
    const cleaned = numpy.where(
      numpy.greater(zscores, threshold),
      median,
      npData
    );

    return Array.from(cleaned);
  }

  // ========================================================================
  // Resampling & Interpolation
  // ========================================================================

  async resample(data: number[], newLength: number): Promise<number[]> {
    const npData = numpy.array(data);
    const resampled = scipy.signal.resample(npData, newLength);
    return Array.from(resampled);
  }

  async downsample(data: number[], factor: number): Promise<number[]> {
    const npData = numpy.array(data);
    const downsampled = scipy.signal.decimate(npData, factor);
    return Array.from(downsampled);
  }

  async interpolate(
    data: number[],
    timestamps: number[],
    newTimestamps: number[],
    kind: 'linear' | 'cubic' | 'nearest' = 'linear'
  ): Promise<number[]> {
    const npData = numpy.array(data);
    const npTimestamps = numpy.array(timestamps);
    const npNewTimestamps = numpy.array(newTimestamps);

    const interp = scipy.interpolate.interp1d(
      npTimestamps,
      npData,
      { kind, fill_value: 'extrapolate' }
    );

    const interpolated = interp(npNewTimestamps);
    return Array.from(interpolated);
  }

  // ========================================================================
  // Signal Quality Assessment
  // ========================================================================

  async assessQuality(data: number[]): Promise<DataQuality> {
    const npData = numpy.array(data);

    // Calculate various quality metrics
    const snr = await this.calculateSNR(data, data);
    const outlierRatio = await this.calculateOutlierRatio(data);
    const completeness = await this.calculateCompleteness(data);

    // Combine metrics to determine quality
    let score = 1.0;

    if (snr < 10) score -= 0.3;
    else if (snr < 20) score -= 0.2;
    else if (snr < 30) score -= 0.1;

    if (outlierRatio > 0.1) score -= 0.3;
    else if (outlierRatio > 0.05) score -= 0.2;
    else if (outlierRatio > 0.02) score -= 0.1;

    if (completeness < 0.9) score -= 0.3;
    else if (completeness < 0.95) score -= 0.2;
    else if (completeness < 0.98) score -= 0.1;

    if (score >= 0.8) return DataQuality.EXCELLENT;
    if (score >= 0.6) return DataQuality.GOOD;
    if (score >= 0.4) return DataQuality.FAIR;
    if (score >= 0.2) return DataQuality.POOR;
    return DataQuality.INVALID;
  }

  private async calculateSNR(signal: number[], noise: number[]): Promise<number> {
    const npSignal = numpy.array(signal);
    const npNoise = numpy.array(noise);

    const signalPower = numpy.mean(numpy.square(npSignal));
    const noisePower = numpy.mean(numpy.square(npNoise));

    if (noisePower === 0) return Infinity;

    const snr = 10 * Math.log10(signalPower / noisePower);
    return snr;
  }

  private async calculateOutlierRatio(data: number[]): Promise<number> {
    const spikes = await this.detectSpikes(data, {
      threshold: 3,
      method: 'zscore'
    });

    return spikes.indices.length / data.length;
  }

  private async calculateCompleteness(data: number[]): Promise<number> {
    const npData = numpy.array(data);
    const validCount = numpy.sum(numpy.isfinite(npData));
    return validCount / data.length;
  }

  // ========================================================================
  // Batch Processing
  // ========================================================================

  async processSensorReading(
    reading: SensorReading,
    options: ProcessingOptions = {}
  ): Promise<ProcessedSensorReading> {
    const startTime = performance.now();

    let data = Array.isArray(reading.value) ? reading.value : [reading.value as number];
    const originalData = [...data];

    // Apply processing pipeline
    if (options.detrend) {
      data = await this.detrend(data);
    }

    if (options.denoise) {
      data = await this.denoise(data);
    }

    if (options.filter) {
      const filtered = await this.applyFilter(data);
      data = filtered.signal;
    }

    // Detect spikes if requested
    let spikes: SpikeDetectionResult | undefined;
    if (options.detectSpikes) {
      spikes = await this.detectSpikes(data, {
        threshold: 3.5,
        method: 'zscore'
      });
    }

    // FFT analysis if requested
    let fftAnalysis: FrequencyAnalysis | undefined;
    if (options.fftAnalysis && data.length >= 16) {
      fftAnalysis = await this.performFFT(data);
    }

    // Assess quality
    const quality = await this.assessQuality(data);

    const processingTime = performance.now() - startTime;

    return {
      reading,
      processed: data,
      original: originalData,
      quality,
      spikes,
      fftAnalysis,
      processingTime,
      options
    };
  }

  async processBatch(
    readings: SensorReading[],
    options: ProcessingOptions = {}
  ): Promise<ProcessedSensorReading[]> {
    // Process in parallel for better throughput
    const promises = readings.map(reading =>
      this.processSensorReading(reading, options)
    );

    return Promise.all(promises);
  }

  // ========================================================================
  // Buffer Management
  // ========================================================================

  addToBuffer(sensorId: SensorId, value: number): void {
    if (!this.processingBuffer.has(sensorId)) {
      this.processingBuffer.set(sensorId, []);
    }

    const buffer = this.processingBuffer.get(sensorId)!;
    buffer.push(value);

    // Limit buffer size
    if (buffer.length > this.config.bufferSize) {
      buffer.shift();
    }
  }

  getBuffer(sensorId: SensorId): number[] {
    return this.processingBuffer.get(sensorId) || [];
  }

  clearBuffer(sensorId: SensorId): void {
    this.processingBuffer.delete(sensorId);
  }

  async processBuffer(
    sensorId: SensorId,
    options: ProcessingOptions = {}
  ): Promise<number[]> {
    const buffer = this.getBuffer(sensorId);
    if (buffer.length === 0) return [];

    let data = [...buffer];

    if (options.filter) {
      const filtered = await this.applyFilter(data);
      data = filtered.signal;
    }

    if (options.denoise) {
      data = await this.denoise(data);
    }

    return data;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface ProcessedSensorReading {
  reading: SensorReading;
  processed: number[];
  original: number[];
  quality: DataQuality;
  spikes?: SpikeDetectionResult;
  fftAnalysis?: FrequencyAnalysis;
  processingTime: number;
  options: ProcessingOptions;
}

interface SpectrogramResult {
  frequencies: number[];
  times: number[];
  spectrogram: number[];
  shape: [number, number];
}

interface PSDResult {
  frequencies: number[];
  psd: number[];
  totalPower: number;
}

interface PeakFindingOptions {
  minHeight?: number;
  minThreshold?: number;
  minDistance?: number;
  minProminence?: number;
  minWidth?: number;
}

interface PeakResult {
  indices: number[];
  values: number[];
  properties: {
    heights: number[];
    prominences: number[];
    widths: number[];
  };
}
