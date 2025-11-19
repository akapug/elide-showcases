/**
 * Signal Processing Operations
 *
 * Comprehensive signal processing using SciPy's signal module through Elide's
 * Python bridge. Provides FFT, filtering, spectral analysis, wavelet transforms,
 * and advanced signal processing methods.
 *
 * Features:
 * - Fourier transforms (FFT, STFT, spectrograms)
 * - Digital filters (Butterworth, Chebyshev, Bessel, FIR, IIR)
 * - Spectral analysis (Welch, periodogram, coherence)
 * - Wavelet transforms
 * - Convolution and correlation
 * - Window functions
 * - Signal generation
 */

import Python from 'python';

// Type definitions
export interface FilterParams {
  order: number;
  cutoff: number | number[];
  filterType: 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';
  btype?: 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';
  analog?: boolean;
}

export interface WelchResult {
  frequencies: number[];
  psd: number[];
}

export interface SpectrogramResult {
  frequencies: number[];
  times: number[];
  Sxx: number[][];
}

export interface STFTResult {
  frequencies: number[];
  times: number[];
  Zxx: number[][];
}

export interface CoherenceResult {
  frequencies: number[];
  coherence: number[];
}

export interface WaveletCoeffs {
  approximation: number[];
  details: number[][];
}

export interface FilterResponse {
  b: number[];
  a: number[];
}

export interface FrequencyResponse {
  frequencies: number[];
  response: number[];
  phase: number[];
}

/**
 * Signal Processing Class
 */
export class SignalProcessing {
  private numpy: any;
  private scipy: any;
  private signal: any;
  private fft: any;

  constructor() {
    this.numpy = Python.import('numpy');
    this.scipy = Python.import('scipy');
    this.signal = this.scipy.signal;
    this.fft = this.scipy.fft;
  }

  // ============================================================================
  // Fourier Transforms
  // ============================================================================

  /**
   * Fast Fourier Transform
   */
  fft(signal: number[]): number[] {
    const npSignal = this.numpy.array(signal);
    const result = this.fft.fft(npSignal);
    return this.toJs(result);
  }

  /**
   * Inverse FFT
   */
  ifft(spectrum: number[]): number[] {
    const npSpectrum = this.numpy.array(spectrum);
    const result = this.fft.ifft(npSpectrum);
    return this.toJs(result);
  }

  /**
   * Real FFT (for real-valued signals)
   */
  rfft(signal: number[]): number[] {
    const npSignal = this.numpy.array(signal);
    const result = this.fft.rfft(npSignal);
    return this.toJs(result);
  }

  /**
   * Inverse real FFT
   */
  irfft(spectrum: number[], n?: number): number[] {
    const npSpectrum = this.numpy.array(spectrum);
    const result = n !== undefined
      ? this.fft.irfft(npSpectrum, n)
      : this.fft.irfft(npSpectrum);
    return this.toJs(result);
  }

  /**
   * 2D FFT
   */
  fft2(image: number[][]): number[][] {
    const npImage = this.numpy.array(image);
    const result = this.fft.fft2(npImage);
    return this.toJs(result);
  }

  /**
   * Inverse 2D FFT
   */
  ifft2(spectrum: number[][]): number[][] {
    const npSpectrum = this.numpy.array(spectrum);
    const result = this.fft.ifft2(npSpectrum);
    return this.toJs(result);
  }

  /**
   * FFT shift (move zero-frequency component to center)
   */
  fftshift(spectrum: number[]): number[] {
    const npSpectrum = this.numpy.array(spectrum);
    const result = this.fft.fftshift(npSpectrum);
    return this.toJs(result);
  }

  /**
   * Inverse FFT shift
   */
  ifftshift(spectrum: number[]): number[] {
    const npSpectrum = this.numpy.array(spectrum);
    const result = this.fft.ifftshift(npSpectrum);
    return this.toJs(result);
  }

  /**
   * FFT frequency bins
   */
  fftfreq(n: number, d: number = 1.0): number[] {
    const result = this.fft.fftfreq(n, d);
    return this.toJs(result);
  }

  /**
   * Real FFT frequency bins
   */
  rfftfreq(n: number, d: number = 1.0): number[] {
    const result = this.fft.rfftfreq(n, d);
    return this.toJs(result);
  }

  /**
   * Short-Time Fourier Transform
   */
  stft(signal: number[], fs: number = 1.0, params: {
    window?: string;
    nperseg?: number;
    noverlap?: number;
  } = {}): STFTResult {
    const npSignal = this.numpy.array(signal);
    const [f, t, Zxx] = this.signal.stft(npSignal, fs, params);

    return {
      frequencies: this.toJs(f),
      times: this.toJs(t),
      Zxx: this.toJs(Zxx)
    };
  }

  /**
   * Inverse Short-Time Fourier Transform
   */
  istft(Zxx: number[][], fs: number = 1.0, params: {
    window?: string;
    nperseg?: number;
    noverlap?: number;
  } = {}): { times: number[]; signal: number[] } {
    const npZxx = this.numpy.array(Zxx);
    const [t, x] = this.signal.istft(npZxx, fs, params);

    return {
      times: this.toJs(t),
      signal: this.toJs(x)
    };
  }

  // ============================================================================
  // Digital Filters
  // ============================================================================

  /**
   * Butterworth filter
   */
  butterFilter(signal: number[], params: FilterParams, fs: number = 1.0): number[] {
    const npSignal = this.numpy.array(signal);

    // Design filter
    const sos = this.signal.butter(
      params.order,
      params.cutoff,
      params.filterType,
      false,
      'sos',
      fs
    );

    // Apply filter
    const result = this.signal.sosfilt(sos, npSignal);
    return this.toJs(result);
  }

  /**
   * Chebyshev Type I filter
   */
  chebyFilter(signal: number[], params: FilterParams & { rp: number }, fs: number = 1.0): number[] {
    const npSignal = this.numpy.array(signal);

    // Design filter
    const sos = this.signal.cheby1(
      params.order,
      params.rp,
      params.cutoff,
      params.filterType,
      false,
      'sos',
      fs
    );

    // Apply filter
    const result = this.signal.sosfilt(sos, npSignal);
    return this.toJs(result);
  }

  /**
   * Bessel filter
   */
  besselFilter(signal: number[], params: FilterParams, fs: number = 1.0): number[] {
    const npSignal = this.numpy.array(signal);

    // Design filter
    const sos = this.signal.bessel(
      params.order,
      params.cutoff,
      params.filterType,
      false,
      'sos',
      fs
    );

    // Apply filter
    const result = this.signal.sosfilt(sos, npSignal);
    return this.toJs(result);
  }

  /**
   * Elliptic (Cauer) filter
   */
  ellipticFilter(signal: number[], params: FilterParams & { rp: number; rs: number }, fs: number = 1.0): number[] {
    const npSignal = this.numpy.array(signal);

    // Design filter
    const sos = this.signal.ellip(
      params.order,
      params.rp,
      params.rs,
      params.cutoff,
      params.filterType,
      false,
      'sos',
      fs
    );

    // Apply filter
    const result = this.signal.sosfilt(sos, npSignal);
    return this.toJs(result);
  }

  /**
   * FIR filter using window method
   */
  firwin(numtaps: number, cutoff: number | number[], params: {
    window?: string;
    pass_zero?: boolean;
    fs?: number;
  } = {}): number[] {
    const result = this.signal.firwin(numtaps, cutoff, params);
    return this.toJs(result);
  }

  /**
   * Apply FIR filter
   */
  lfilter(b: number[], a: number[], signal: number[]): number[] {
    const npB = this.numpy.array(b);
    const npA = this.numpy.array(a);
    const npSignal = this.numpy.array(signal);
    const result = this.signal.lfilter(npB, npA, npSignal);
    return this.toJs(result);
  }

  /**
   * Median filter
   */
  medianFilter(signal: number[], kernelSize: number = 3): number[] {
    const npSignal = this.numpy.array(signal);
    const result = this.signal.medfilt(npSignal, kernelSize);
    return this.toJs(result);
  }

  /**
   * Wiener filter
   */
  wienerFilter(signal: number[], mysize?: number, noise?: number): number[] {
    const npSignal = this.numpy.array(signal);
    const result = mysize !== undefined
      ? this.signal.wiener(npSignal, mysize, noise)
      : this.signal.wiener(npSignal);
    return this.toJs(result);
  }

  /**
   * Savitzky-Golay filter
   */
  savgolFilter(signal: number[], windowLength: number, polyorder: number, deriv: number = 0): number[] {
    const npSignal = this.numpy.array(signal);
    const result = this.signal.savgol_filter(npSignal, windowLength, polyorder, deriv);
    return this.toJs(result);
  }

  /**
   * Hilbert transform
   */
  hilbert(signal: number[]): number[] {
    const npSignal = this.numpy.array(signal);
    const result = this.signal.hilbert(npSignal);
    return this.toJs(result);
  }

  // ============================================================================
  // Spectral Analysis
  // ============================================================================

  /**
   * Welch's method for power spectral density
   */
  welch(signal: number[], fs: number = 1.0, params: {
    window?: string;
    nperseg?: number;
    noverlap?: number;
    nfft?: number;
    scaling?: 'density' | 'spectrum';
  } = {}): WelchResult {
    const npSignal = this.numpy.array(signal);
    const [f, Pxx] = this.signal.welch(npSignal, fs, params);

    return {
      frequencies: this.toJs(f),
      psd: this.toJs(Pxx)
    };
  }

  /**
   * Periodogram
   */
  periodogram(signal: number[], fs: number = 1.0, params: {
    window?: string;
    nfft?: number;
    scaling?: 'density' | 'spectrum';
  } = {}): WelchResult {
    const npSignal = this.numpy.array(signal);
    const [f, Pxx] = this.signal.periodogram(npSignal, fs, params);

    return {
      frequencies: this.toJs(f),
      psd: this.toJs(Pxx)
    };
  }

  /**
   * Spectrogram
   */
  spectrogram(signal: number[], fs: number = 1.0, params: {
    window?: string;
    nperseg?: number;
    noverlap?: number;
    nfft?: number;
  } = {}): SpectrogramResult {
    const npSignal = this.numpy.array(signal);
    const [f, t, Sxx] = this.signal.spectrogram(npSignal, fs, params);

    return {
      frequencies: this.toJs(f),
      times: this.toJs(t),
      Sxx: this.toJs(Sxx)
    };
  }

  /**
   * Coherence between two signals
   */
  coherence(x: number[], y: number[], fs: number = 1.0, params: {
    window?: string;
    nperseg?: number;
    noverlap?: number;
  } = {}): CoherenceResult {
    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);
    const [f, Cxy] = this.signal.coherence(npX, npY, fs, params);

    return {
      frequencies: this.toJs(f),
      coherence: this.toJs(Cxy)
    };
  }

  /**
   * Cross-spectral density
   */
  csd(x: number[], y: number[], fs: number = 1.0, params: {
    window?: string;
    nperseg?: number;
    noverlap?: number;
  } = {}): { frequencies: number[]; csd: number[] } {
    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);
    const [f, Pxy] = this.signal.csd(npX, npY, fs, params);

    return {
      frequencies: this.toJs(f),
      csd: this.toJs(Pxy)
    };
  }

  // ============================================================================
  // Wavelets (using PyWavelets if available)
  // ============================================================================

  /**
   * Discrete Wavelet Transform
   */
  waveletTransform(signal: number[], wavelet: string = 'db4', level?: number): WaveletCoeffs {
    try {
      const pywt = Python.import('pywt');
      const npSignal = this.numpy.array(signal);

      const coeffs = level !== undefined
        ? pywt.wavedec(npSignal, wavelet, level)
        : pywt.wavedec(npSignal, wavelet);

      const approx = this.toJs(coeffs[0]);
      const details = coeffs.slice(1).map((c: any) => this.toJs(c));

      return {
        approximation: approx,
        details: details
      };
    } catch (error) {
      throw new Error('PyWavelets not available. Install with: pip install PyWavelets');
    }
  }

  /**
   * Inverse Discrete Wavelet Transform
   */
  iWaveletTransform(coeffs: WaveletCoeffs, wavelet: string = 'db4'): number[] {
    try {
      const pywt = Python.import('pywt');
      const allCoeffs = [
        this.numpy.array(coeffs.approximation),
        ...coeffs.details.map(d => this.numpy.array(d))
      ];

      const result = pywt.waverec(allCoeffs, wavelet);
      return this.toJs(result);
    } catch (error) {
      throw new Error('PyWavelets not available. Install with: pip install PyWavelets');
    }
  }

  /**
   * Continuous Wavelet Transform
   */
  cwt(signal: number[], scales: number[], wavelet: string = 'morl'): {
    coefficients: number[][];
    frequencies: number[];
  } {
    try {
      const pywt = Python.import('pywt');
      const npSignal = this.numpy.array(signal);
      const npScales = this.numpy.array(scales);

      const [coefficients, frequencies] = pywt.cwt(npSignal, npScales, wavelet);

      return {
        coefficients: this.toJs(coefficients),
        frequencies: this.toJs(frequencies)
      };
    } catch (error) {
      throw new Error('PyWavelets not available. Install with: pip install PyWavelets');
    }
  }

  // ============================================================================
  // Convolution and Correlation
  // ============================================================================

  /**
   * Convolution
   */
  convolve(signal: number[], kernel: number[], mode: 'full' | 'valid' | 'same' = 'full'): number[] {
    const npSignal = this.numpy.array(signal);
    const npKernel = this.numpy.array(kernel);
    const result = this.numpy.convolve(npSignal, npKernel, mode);
    return this.toJs(result);
  }

  /**
   * 2D Convolution
   */
  convolve2d(signal: number[][], kernel: number[][], mode: 'full' | 'valid' | 'same' = 'full'): number[][] {
    const npSignal = this.numpy.array(signal);
    const npKernel = this.numpy.array(kernel);
    const result = this.signal.convolve2d(npSignal, npKernel, mode);
    return this.toJs(result);
  }

  /**
   * Cross-correlation
   */
  correlate(a: number[], v: number[], mode: 'full' | 'valid' | 'same' = 'full'): number[] {
    const npA = this.numpy.array(a);
    const npV = this.numpy.array(v);
    const result = this.numpy.correlate(npA, npV, mode);
    return this.toJs(result);
  }

  /**
   * Auto-correlation
   */
  autocorrelate(signal: number[], maxlag?: number): number[] {
    const result = this.correlate(signal, signal, 'full');
    const mid = Math.floor(result.length / 2);

    if (maxlag !== undefined) {
      return result.slice(mid, mid + maxlag + 1);
    }
    return result.slice(mid);
  }

  // ============================================================================
  // Window Functions
  // ============================================================================

  /**
   * Hamming window
   */
  hamming(M: number): number[] {
    const result = this.numpy.hamming(M);
    return this.toJs(result);
  }

  /**
   * Hanning window
   */
  hanning(M: number): number[] {
    const result = this.numpy.hanning(M);
    return this.toJs(result);
  }

  /**
   * Blackman window
   */
  blackman(M: number): number[] {
    const result = this.numpy.blackman(M);
    return this.toJs(result);
  }

  /**
   * Kaiser window
   */
  kaiser(M: number, beta: number): number[] {
    const result = this.numpy.kaiser(M, beta);
    return this.toJs(result);
  }

  /**
   * Tukey window
   */
  tukey(M: number, alpha: number = 0.5): number[] {
    const result = this.signal.windows.tukey(M, alpha);
    return this.toJs(result);
  }

  /**
   * Gaussian window
   */
  gaussian(M: number, std: number): number[] {
    const result = this.signal.windows.gaussian(M, std);
    return this.toJs(result);
  }

  // ============================================================================
  // Signal Generation
  // ============================================================================

  /**
   * Chirp signal
   */
  chirp(t: number[], f0: number, t1: number, f1: number, method: 'linear' | 'quadratic' | 'logarithmic' | 'hyperbolic' = 'linear'): number[] {
    const npT = this.numpy.array(t);
    const result = this.signal.chirp(npT, f0, t1, f1, method);
    return this.toJs(result);
  }

  /**
   * Sawtooth wave
   */
  sawtooth(t: number[], width: number = 1): number[] {
    const npT = this.numpy.array(t);
    const result = this.signal.sawtooth(npT, width);
    return this.toJs(result);
  }

  /**
   * Square wave
   */
  square(t: number[], duty: number = 0.5): number[] {
    const npT = this.numpy.array(t);
    const result = this.signal.square(npT, duty);
    return this.toJs(result);
  }

  /**
   * Gaussian pulse
   */
  gausspulse(t: number[], fc: number = 1000, bw: number = 0.5): number[] {
    const npT = this.numpy.array(t);
    const result = this.signal.gausspulse(npT, fc, bw);
    return this.toJs(result);
  }

  /**
   * White noise
   */
  whiteNoise(length: number, amplitude: number = 1.0): number[] {
    const noise = this.numpy.random.randn(length);
    const result = this.numpy.multiply(noise, amplitude);
    return this.toJs(result);
  }

  // ============================================================================
  // Peak Detection and Analysis
  // ============================================================================

  /**
   * Find peaks in signal
   */
  findPeaks(signal: number[], params: {
    height?: number | [number, number];
    threshold?: number;
    distance?: number;
    prominence?: number;
    width?: number;
  } = {}): {
    peaks: number[];
    properties: any;
  } {
    const npSignal = this.numpy.array(signal);
    const [peaks, properties] = this.signal.find_peaks(npSignal, params);

    return {
      peaks: this.toJs(peaks),
      properties: this.toJs(properties)
    };
  }

  /**
   * Peak widths
   */
  peakWidths(signal: number[], peaks: number[], relHeight: number = 0.5): {
    widths: number[];
    widthHeights: number[];
    leftIps: number[];
    rightIps: number[];
  } {
    const npSignal = this.numpy.array(signal);
    const npPeaks = this.numpy.array(peaks);
    const [widths, widthHeights, leftIps, rightIps] = this.signal.peak_widths(
      npSignal,
      npPeaks,
      relHeight
    );

    return {
      widths: this.toJs(widths),
      widthHeights: this.toJs(widthHeights),
      leftIps: this.toJs(leftIps),
      rightIps: this.toJs(rightIps)
    };
  }

  /**
   * Peak prominences
   */
  peakProminences(signal: number[], peaks: number[]): {
    prominences: number[];
    leftBases: number[];
    rightBases: number[];
  } {
    const npSignal = this.numpy.array(signal);
    const npPeaks = this.numpy.array(peaks);
    const [prominences, leftBases, rightBases] = this.signal.peak_prominences(
      npSignal,
      npPeaks
    );

    return {
      prominences: this.toJs(prominences),
      leftBases: this.toJs(leftBases),
      rightBases: this.toJs(rightBases)
    };
  }

  // ============================================================================
  // Resampling
  // ============================================================================

  /**
   * Resample signal
   */
  resample(signal: number[], num: number, t?: number[]): { signal: number[]; times?: number[] } {
    const npSignal = this.numpy.array(signal);

    if (t) {
      const npT = this.numpy.array(t);
      const [resampledSignal, resampledT] = this.signal.resample(npSignal, num, npT);
      return {
        signal: this.toJs(resampledSignal),
        times: this.toJs(resampledT)
      };
    }

    const resampledSignal = this.signal.resample(npSignal, num);
    return { signal: this.toJs(resampledSignal) };
  }

  /**
   * Resample using polyphase filtering
   */
  resamplePoly(signal: number[], up: number, down: number): number[] {
    const npSignal = this.numpy.array(signal);
    const result = this.signal.resample_poly(npSignal, up, down);
    return this.toJs(result);
  }

  /**
   * Decimate signal
   */
  decimate(signal: number[], q: number, ftype: 'iir' | 'fir' = 'iir'): number[] {
    const npSignal = this.numpy.array(signal);
    const result = this.signal.decimate(npSignal, q, null, ftype);
    return this.toJs(result);
  }

  // ============================================================================
  // Spectral Features
  // ============================================================================

  /**
   * Spectral centroid
   */
  spectralCentroid(spectrum: number[], frequencies: number[]): number {
    const npSpectrum = this.numpy.array(spectrum);
    const npFreq = this.numpy.array(frequencies);

    const magnitude = this.numpy.abs(npSpectrum);
    const centroid = this.numpy.sum(this.numpy.multiply(magnitude, npFreq)) /
                     this.numpy.sum(magnitude);

    return this.toJs(centroid);
  }

  /**
   * Spectral rolloff
   */
  spectralRolloff(spectrum: number[], frequencies: number[], rolloffPercent: number = 0.85): number {
    const npSpectrum = this.numpy.array(spectrum);
    const npFreq = this.numpy.array(frequencies);

    const magnitude = this.numpy.abs(npSpectrum);
    const cumsum = this.numpy.cumsum(magnitude);
    const total = cumsum[cumsum.length - 1];
    const threshold = total * rolloffPercent;

    const rolloffIdx = this.numpy.searchsorted(cumsum, threshold);
    return this.toJs(npFreq[rolloffIdx]);
  }

  /**
   * Zero-crossing rate
   */
  zeroCrossingRate(signal: number[]): number {
    const npSignal = this.numpy.array(signal);
    const signs = this.numpy.sign(npSignal);
    const signChanges = this.numpy.diff(signs);
    const zeroCrossings = this.numpy.count_nonzero(signChanges);

    return this.toJs(zeroCrossings / signal.length);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

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
}

export default SignalProcessing;
