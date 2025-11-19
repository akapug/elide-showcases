"""
SciPy Bridge for Advanced Scientific Algorithms

Comprehensive SciPy integration providing FFT, integration, interpolation, optimization,
and signal processing through Python-TypeScript bridge.

Features:
- Fast Fourier Transform (FFT) operations
- Numerical integration (quad, odeint, solve_ivp)
- Interpolation (1D, 2D, splines, RBF)
- Advanced signal processing
- Optimization algorithms
- Special functions
- Sparse matrices
- Spatial algorithms
"""

import numpy as np
import scipy
from scipy import fft, integrate, interpolate, optimize, signal, special, sparse, spatial
from scipy.integrate import ode, solve_ivp, odeint
from typing import Union, List, Tuple, Optional, Callable, Any
import json


class ScipyBridge:
    """
    Comprehensive SciPy bridge for advanced scientific computing.
    """

    def __init__(self):
        self.cache = {}

    # =========================================================================
    # FFT Operations
    # =========================================================================

    def fft_fft(self, x: np.ndarray, n: Optional[int] = None, axis: int = -1, norm: Optional[str] = None) -> np.ndarray:
        """Compute discrete Fourier Transform"""
        return fft.fft(x, n=n, axis=axis, norm=norm)

    def fft_ifft(self, x: np.ndarray, n: Optional[int] = None, axis: int = -1, norm: Optional[str] = None) -> np.ndarray:
        """Compute inverse discrete Fourier Transform"""
        return fft.ifft(x, n=n, axis=axis, norm=norm)

    def fft_rfft(self, x: np.ndarray, n: Optional[int] = None, axis: int = -1, norm: Optional[str] = None) -> np.ndarray:
        """Compute FFT for real input"""
        return fft.rfft(x, n=n, axis=axis, norm=norm)

    def fft_irfft(self, x: np.ndarray, n: Optional[int] = None, axis: int = -1, norm: Optional[str] = None) -> np.ndarray:
        """Compute inverse FFT for real input"""
        return fft.irfft(x, n=n, axis=axis, norm=norm)

    def fft_fft2(self, x: np.ndarray, s: Optional[Tuple] = None, axes: Tuple = (-2, -1), norm: Optional[str] = None) -> np.ndarray:
        """Compute 2D discrete Fourier Transform"""
        return fft.fft2(x, s=s, axes=axes, norm=norm)

    def fft_ifft2(self, x: np.ndarray, s: Optional[Tuple] = None, axes: Tuple = (-2, -1), norm: Optional[str] = None) -> np.ndarray:
        """Compute 2D inverse discrete Fourier Transform"""
        return fft.ifft2(x, s=s, axes=axes, norm=norm)

    def fft_fftn(self, x: np.ndarray, s: Optional[Tuple] = None, axes: Optional[Tuple] = None, norm: Optional[str] = None) -> np.ndarray:
        """Compute N-D discrete Fourier Transform"""
        return fft.fftn(x, s=s, axes=axes, norm=norm)

    def fft_ifftn(self, x: np.ndarray, s: Optional[Tuple] = None, axes: Optional[Tuple] = None, norm: Optional[str] = None) -> np.ndarray:
        """Compute N-D inverse discrete Fourier Transform"""
        return fft.ifftn(x, s=s, axes=axes, norm=norm)

    def fft_fftshift(self, x: np.ndarray, axes: Optional[Union[int, Tuple]] = None) -> np.ndarray:
        """Shift zero-frequency component to center"""
        return fft.fftshift(x, axes=axes)

    def fft_ifftshift(self, x: np.ndarray, axes: Optional[Union[int, Tuple]] = None) -> np.ndarray:
        """Inverse of fftshift"""
        return fft.ifftshift(x, axes=axes)

    def fft_fftfreq(self, n: int, d: float = 1.0) -> np.ndarray:
        """Return FFT sample frequencies"""
        return fft.fftfreq(n, d)

    def fft_rfftfreq(self, n: int, d: float = 1.0) -> np.ndarray:
        """Return FFT sample frequencies for rfft"""
        return fft.rfftfreq(n, d)

    def fft_dct(self, x: np.ndarray, type: int = 2, n: Optional[int] = None, axis: int = -1, norm: Optional[str] = None) -> np.ndarray:
        """Discrete Cosine Transform"""
        return fft.dct(x, type=type, n=n, axis=axis, norm=norm)

    def fft_idct(self, x: np.ndarray, type: int = 2, n: Optional[int] = None, axis: int = -1, norm: Optional[str] = None) -> np.ndarray:
        """Inverse Discrete Cosine Transform"""
        return fft.idct(x, type=type, n=n, axis=axis, norm=norm)

    def fft_dst(self, x: np.ndarray, type: int = 2, n: Optional[int] = None, axis: int = -1, norm: Optional[str] = None) -> np.ndarray:
        """Discrete Sine Transform"""
        return fft.dst(x, type=type, n=n, axis=axis, norm=norm)

    def fft_idst(self, x: np.ndarray, type: int = 2, n: Optional[int] = None, axis: int = -1, norm: Optional[str] = None) -> np.ndarray:
        """Inverse Discrete Sine Transform"""
        return fft.idst(x, type=type, n=n, axis=axis, norm=norm)

    # =========================================================================
    # Numerical Integration
    # =========================================================================

    def integrate_quad(self, func: Callable, a: float, b: float, args: Tuple = (), epsabs: float = 1.49e-8, epsrel: float = 1.49e-8) -> Tuple[float, float]:
        """Compute definite integral using adaptive quadrature"""
        result, error = integrate.quad(func, a, b, args=args, epsabs=epsabs, epsrel=epsrel)
        return result, error

    def integrate_dblquad(self, func: Callable, a: float, b: float, gfun: Callable, hfun: Callable) -> Tuple[float, float]:
        """Compute double integral"""
        result, error = integrate.dblquad(func, a, b, gfun, hfun)
        return result, error

    def integrate_tplquad(self, func: Callable, a: float, b: float, gfun: Callable, hfun: Callable, qfun: Callable, rfun: Callable) -> Tuple[float, float]:
        """Compute triple integral"""
        result, error = integrate.tplquad(func, a, b, gfun, hfun, qfun, rfun)
        return result, error

    def integrate_simps(self, y: np.ndarray, x: Optional[np.ndarray] = None, dx: float = 1.0, axis: int = -1) -> float:
        """Simpson's rule integration"""
        return integrate.simps(y, x=x, dx=dx, axis=axis)

    def integrate_trapz(self, y: np.ndarray, x: Optional[np.ndarray] = None, dx: float = 1.0, axis: int = -1) -> float:
        """Trapezoidal rule integration"""
        return integrate.trapz(y, x=x, dx=dx, axis=axis)

    def integrate_cumtrapz(self, y: np.ndarray, x: Optional[np.ndarray] = None, dx: float = 1.0, axis: int = -1, initial: Optional[float] = None) -> np.ndarray:
        """Cumulative trapezoidal integration"""
        return integrate.cumtrapz(y, x=x, dx=dx, axis=axis, initial=initial)

    def integrate_romb(self, y: np.ndarray, dx: float = 1.0, axis: int = -1) -> float:
        """Romberg integration"""
        return integrate.romb(y, dx=dx, axis=axis)

    def integrate_odeint(self, func: Callable, y0: np.ndarray, t: np.ndarray, args: Tuple = (), tfirst: bool = False) -> np.ndarray:
        """Integrate ODE using lsoda from FORTRAN library odepack"""
        return odeint(func, y0, t, args=args, tfirst=tfirst)

    def integrate_solve_ivp(self, func: Callable, t_span: Tuple[float, float], y0: np.ndarray, method: str = 'RK45', t_eval: Optional[np.ndarray] = None, dense_output: bool = False, events: Optional[Callable] = None, max_step: float = np.inf, rtol: float = 1e-3, atol: float = 1e-6) -> dict:
        """Solve initial value problem for ODE system"""
        result = solve_ivp(func, t_span, y0, method=method, t_eval=t_eval, dense_output=dense_output, events=events, max_step=max_step, rtol=rtol, atol=atol)

        return {
            't': result.t,
            'y': result.y,
            'success': result.success,
            'message': result.message,
            'nfev': result.nfev,
            'njev': result.njev,
            'nlu': result.nlu
        }

    # =========================================================================
    # Interpolation
    # =========================================================================

    def interpolate_interp1d(self, x: np.ndarray, y: np.ndarray, kind: str = 'linear', fill_value: Union[float, str] = np.nan, bounds_error: bool = False) -> Callable:
        """1D interpolation"""
        return interpolate.interp1d(x, y, kind=kind, fill_value=fill_value, bounds_error=bounds_error)

    def interpolate_interp2d(self, x: np.ndarray, y: np.ndarray, z: np.ndarray, kind: str = 'linear', fill_value: Optional[float] = None) -> Callable:
        """2D interpolation"""
        return interpolate.interp2d(x, y, z, kind=kind, fill_value=fill_value)

    def interpolate_griddata(self, points: np.ndarray, values: np.ndarray, xi: np.ndarray, method: str = 'linear', fill_value: float = np.nan) -> np.ndarray:
        """Interpolate unstructured data"""
        return interpolate.griddata(points, values, xi, method=method, fill_value=fill_value)

    def interpolate_splrep(self, x: np.ndarray, y: np.ndarray, w: Optional[np.ndarray] = None, k: int = 3, s: Optional[float] = None) -> Tuple:
        """Find B-spline representation of curve"""
        return interpolate.splrep(x, y, w=w, k=k, s=s)

    def interpolate_splev(self, x: np.ndarray, tck: Tuple, der: int = 0) -> np.ndarray:
        """Evaluate B-spline"""
        return interpolate.splev(x, tck, der=der)

    def interpolate_UnivariateSpline(self, x: np.ndarray, y: np.ndarray, w: Optional[np.ndarray] = None, k: int = 3, s: Optional[float] = None) -> Any:
        """Univariate spline"""
        return interpolate.UnivariateSpline(x, y, w=w, k=k, s=s)

    def interpolate_BSpline(self, t: np.ndarray, c: np.ndarray, k: int) -> Any:
        """B-spline object"""
        return interpolate.BSpline(t, c, k)

    def interpolate_CubicSpline(self, x: np.ndarray, y: np.ndarray, axis: int = 0, bc_type: str = 'not-a-knot', extrapolate: bool = True) -> Any:
        """Cubic spline interpolation"""
        return interpolate.CubicSpline(x, y, axis=axis, bc_type=bc_type, extrapolate=extrapolate)

    def interpolate_Rbf(self, *args, function: str = 'multiquadric', epsilon: Optional[float] = None, smooth: float = 0.0) -> Any:
        """Radial basis function interpolation"""
        return interpolate.Rbf(*args, function=function, epsilon=epsilon, smooth=smooth)

    def interpolate_pchip(self, x: np.ndarray, y: np.ndarray, axis: int = 0, extrapolate: bool = False) -> Any:
        """PCHIP 1-D monotonic cubic interpolation"""
        return interpolate.PchipInterpolator(x, y, axis=axis, extrapolate=extrapolate)

    def interpolate_akima(self, x: np.ndarray, y: np.ndarray, axis: int = 0) -> Any:
        """Akima interpolation"""
        return interpolate.Akima1DInterpolator(x, y, axis=axis)

    # =========================================================================
    # Signal Processing
    # =========================================================================

    def signal_convolve(self, in1: np.ndarray, in2: np.ndarray, mode: str = 'full', method: str = 'auto') -> np.ndarray:
        """Convolve two N-dimensional arrays"""
        return signal.convolve(in1, in2, mode=mode, method=method)

    def signal_correlate(self, in1: np.ndarray, in2: np.ndarray, mode: str = 'full', method: str = 'auto') -> np.ndarray:
        """Cross-correlate two N-dimensional arrays"""
        return signal.correlate(in1, in2, mode=mode, method=method)

    def signal_fftconvolve(self, in1: np.ndarray, in2: np.ndarray, mode: str = 'full', axes: Optional[Union[int, Tuple]] = None) -> np.ndarray:
        """Convolve using FFT"""
        return signal.fftconvolve(in1, in2, mode=mode, axes=axes)

    def signal_filtfilt(self, b: np.ndarray, a: np.ndarray, x: np.ndarray, axis: int = -1, padtype: str = 'odd', padlen: Optional[int] = None) -> np.ndarray:
        """Apply digital filter forward and backward"""
        return signal.filtfilt(b, a, x, axis=axis, padtype=padtype, padlen=padlen)

    def signal_butter(self, N: int, Wn: Union[float, Tuple], btype: str = 'low', analog: bool = False, output: str = 'ba', fs: Optional[float] = None) -> Union[Tuple, np.ndarray]:
        """Butterworth filter design"""
        return signal.butter(N, Wn, btype=btype, analog=analog, output=output, fs=fs)

    def signal_cheby1(self, N: int, rp: float, Wn: Union[float, Tuple], btype: str = 'low', analog: bool = False, output: str = 'ba', fs: Optional[float] = None) -> Union[Tuple, np.ndarray]:
        """Chebyshev Type I filter design"""
        return signal.cheby1(N, rp, Wn, btype=btype, analog=analog, output=output, fs=fs)

    def signal_cheby2(self, N: int, rs: float, Wn: Union[float, Tuple], btype: str = 'low', analog: bool = False, output: str = 'ba', fs: Optional[float] = None) -> Union[Tuple, np.ndarray]:
        """Chebyshev Type II filter design"""
        return signal.cheby2(N, rs, Wn, btype=btype, analog=analog, output=output, fs=fs)

    def signal_ellip(self, N: int, rp: float, rs: float, Wn: Union[float, Tuple], btype: str = 'low', analog: bool = False, output: str = 'ba', fs: Optional[float] = None) -> Union[Tuple, np.ndarray]:
        """Elliptic (Cauer) filter design"""
        return signal.ellip(N, rp, rs, Wn, btype=btype, analog=analog, output=output, fs=fs)

    def signal_bessel(self, N: int, Wn: Union[float, Tuple], btype: str = 'low', analog: bool = False, output: str = 'ba', norm: str = 'phase', fs: Optional[float] = None) -> Union[Tuple, np.ndarray]:
        """Bessel/Thomson filter design"""
        return signal.bessel(N, Wn, btype=btype, analog=analog, output=output, norm=norm, fs=fs)

    def signal_welch(self, x: np.ndarray, fs: float = 1.0, window: Union[str, Tuple] = 'hann', nperseg: Optional[int] = None, noverlap: Optional[int] = None, nfft: Optional[int] = None, detrend: str = 'constant', return_onesided: bool = True, scaling: str = 'density', axis: int = -1) -> Tuple[np.ndarray, np.ndarray]:
        """Welch's method for power spectral density"""
        return signal.welch(x, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap, nfft=nfft, detrend=detrend, return_onesided=return_onesided, scaling=scaling, axis=axis)

    def signal_periodogram(self, x: np.ndarray, fs: float = 1.0, window: Union[str, Tuple] = 'boxcar', nfft: Optional[int] = None, detrend: str = 'constant', return_onesided: bool = True, scaling: str = 'density', axis: int = -1) -> Tuple[np.ndarray, np.ndarray]:
        """Periodogram power spectral density"""
        return signal.periodogram(x, fs=fs, window=window, nfft=nfft, detrend=detrend, return_onesided=return_onesided, scaling=scaling, axis=axis)

    def signal_spectrogram(self, x: np.ndarray, fs: float = 1.0, window: Union[str, Tuple] = 'tukey', nperseg: Optional[int] = None, noverlap: Optional[int] = None, nfft: Optional[int] = None, detrend: str = 'constant', return_onesided: bool = True, scaling: str = 'density', axis: int = -1, mode: str = 'psd') -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Spectrogram"""
        return signal.spectrogram(x, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap, nfft=nfft, detrend=detrend, return_onesided=return_onesided, scaling=scaling, axis=axis, mode=mode)

    def signal_stft(self, x: np.ndarray, fs: float = 1.0, window: str = 'hann', nperseg: int = 256, noverlap: Optional[int] = None, nfft: Optional[int] = None, detrend: bool = False, return_onesided: bool = True, boundary: str = 'zeros', padded: bool = True, axis: int = -1) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Short Time Fourier Transform"""
        return signal.stft(x, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap, nfft=nfft, detrend=detrend, return_onesided=return_onesided, boundary=boundary, padded=padded, axis=axis)

    def signal_istft(self, Zxx: np.ndarray, fs: float = 1.0, window: str = 'hann', nperseg: Optional[int] = None, noverlap: Optional[int] = None, nfft: Optional[int] = None, input_onesided: bool = True, boundary: bool = True, time_axis: int = -1, freq_axis: int = -2) -> Tuple[np.ndarray, np.ndarray]:
        """Inverse Short Time Fourier Transform"""
        return signal.istft(Zxx, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap, nfft=nfft, input_onesided=input_onesided, boundary=boundary, time_axis=time_axis, freq_axis=freq_axis)

    def signal_coherence(self, x: np.ndarray, y: np.ndarray, fs: float = 1.0, window: str = 'hann', nperseg: Optional[int] = None, noverlap: Optional[int] = None, nfft: Optional[int] = None, detrend: str = 'constant', axis: int = -1) -> Tuple[np.ndarray, np.ndarray]:
        """Estimate coherence"""
        return signal.coherence(x, y, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap, nfft=nfft, detrend=detrend, axis=axis)

    def signal_csd(self, x: np.ndarray, y: np.ndarray, fs: float = 1.0, window: str = 'hann', nperseg: Optional[int] = None, noverlap: Optional[int] = None, nfft: Optional[int] = None, detrend: str = 'constant', return_onesided: bool = True, scaling: str = 'density', axis: int = -1) -> Tuple[np.ndarray, np.ndarray]:
        """Cross power spectral density"""
        return signal.csd(x, y, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap, nfft=nfft, detrend=detrend, return_onesided=return_onesided, scaling=scaling, axis=axis)

    def signal_find_peaks(self, x: np.ndarray, height: Optional[Union[float, Tuple]] = None, threshold: Optional[Union[float, Tuple]] = None, distance: Optional[float] = None, prominence: Optional[Union[float, Tuple]] = None, width: Optional[Union[float, Tuple]] = None, wlen: Optional[int] = None, rel_height: float = 0.5, plateau_size: Optional[Union[float, Tuple]] = None) -> Tuple[np.ndarray, dict]:
        """Find peaks in signal"""
        return signal.find_peaks(x, height=height, threshold=threshold, distance=distance, prominence=prominence, width=width, wlen=wlen, rel_height=rel_height, plateau_size=plateau_size)

    def signal_peak_widths(self, x: np.ndarray, peaks: np.ndarray, rel_height: float = 0.5, prominence_data: Optional[Tuple] = None, wlen: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Calculate peak widths"""
        return signal.peak_widths(x, peaks, rel_height=rel_height, prominence_data=prominence_data, wlen=wlen)

    def signal_peak_prominences(self, x: np.ndarray, peaks: np.ndarray, wlen: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Calculate peak prominences"""
        return signal.peak_prominences(x, peaks, wlen=wlen)

    def signal_resample(self, x: np.ndarray, num: int, t: Optional[np.ndarray] = None, axis: int = 0, window: Optional[Union[str, Tuple]] = None) -> Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]:
        """Resample signal"""
        return signal.resample(x, num, t=t, axis=axis, window=window)

    def signal_resample_poly(self, x: np.ndarray, up: int, down: int, axis: int = 0, window: Union[str, Tuple] = 'kaiser', padtype: str = 'constant', cval: Optional[float] = None) -> np.ndarray:
        """Resample using polyphase filtering"""
        return signal.resample_poly(x, up, down, axis=axis, window=window, padtype=padtype, cval=cval)

    def signal_decimate(self, x: np.ndarray, q: int, n: Optional[int] = None, ftype: str = 'iir', axis: int = -1, zero_phase: bool = True) -> np.ndarray:
        """Downsample signal"""
        return signal.decimate(x, q, n=n, ftype=ftype, axis=axis, zero_phase=zero_phase)

    def signal_hilbert(self, x: np.ndarray, N: Optional[int] = None, axis: int = -1) -> np.ndarray:
        """Compute Hilbert transform"""
        return signal.hilbert(x, N=N, axis=axis)

    def signal_savgol_filter(self, x: np.ndarray, window_length: int, polyorder: int, deriv: int = 0, delta: float = 1.0, axis: int = -1, mode: str = 'interp', cval: float = 0.0) -> np.ndarray:
        """Savitzky-Golay filter"""
        return signal.savgol_filter(x, window_length, polyorder, deriv=deriv, delta=delta, axis=axis, mode=mode, cval=cval)

    def signal_medfilt(self, volume: np.ndarray, kernel_size: Optional[Union[int, List]] = None) -> np.ndarray:
        """Median filter"""
        return signal.medfilt(volume, kernel_size=kernel_size)

    def signal_wiener(self, im: np.ndarray, mysize: Optional[Union[int, Tuple]] = None, noise: Optional[float] = None) -> np.ndarray:
        """Wiener filter"""
        return signal.wiener(im, mysize=mysize, noise=noise)

    # =========================================================================
    # Special Functions
    # =========================================================================

    def special_erf(self, x: np.ndarray) -> np.ndarray:
        """Error function"""
        return special.erf(x)

    def special_erfc(self, x: np.ndarray) -> np.ndarray:
        """Complementary error function"""
        return special.erfc(x)

    def special_gamma(self, x: np.ndarray) -> np.ndarray:
        """Gamma function"""
        return special.gamma(x)

    def special_loggamma(self, x: np.ndarray) -> np.ndarray:
        """Log of gamma function"""
        return special.loggamma(x)

    def special_beta(self, a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Beta function"""
        return special.beta(a, b)

    def special_bessel_j(self, v: float, x: np.ndarray) -> np.ndarray:
        """Bessel function of first kind"""
        return special.jv(v, x)

    def special_bessel_y(self, v: float, x: np.ndarray) -> np.ndarray:
        """Bessel function of second kind"""
        return special.yv(v, x)

    def special_bessel_i(self, v: float, x: np.ndarray) -> np.ndarray:
        """Modified Bessel function of first kind"""
        return special.iv(v, x)

    def special_bessel_k(self, v: float, x: np.ndarray) -> np.ndarray:
        """Modified Bessel function of second kind"""
        return special.kv(v, x)

    def special_legendre(self, n: int, x: np.ndarray) -> np.ndarray:
        """Legendre polynomial"""
        return special.eval_legendre(n, x)

    def special_hermite(self, n: int, x: np.ndarray) -> np.ndarray:
        """Hermite polynomial"""
        return special.eval_hermite(n, x)

    def special_laguerre(self, n: int, x: np.ndarray) -> np.ndarray:
        """Laguerre polynomial"""
        return special.eval_laguerre(n, x)

    def special_chebyshev_t(self, n: int, x: np.ndarray) -> np.ndarray:
        """Chebyshev polynomial of first kind"""
        return special.eval_chebyt(n, x)

    def special_chebyshev_u(self, n: int, x: np.ndarray) -> np.ndarray:
        """Chebyshev polynomial of second kind"""
        return special.eval_chebyu(n, x)

    # =========================================================================
    # Spatial Algorithms
    # =========================================================================

    def spatial_distance_euclidean(self, u: np.ndarray, v: np.ndarray) -> float:
        """Euclidean distance"""
        return spatial.distance.euclidean(u, v)

    def spatial_distance_cityblock(self, u: np.ndarray, v: np.ndarray) -> float:
        """City block (Manhattan) distance"""
        return spatial.distance.cityblock(u, v)

    def spatial_distance_cosine(self, u: np.ndarray, v: np.ndarray) -> float:
        """Cosine distance"""
        return spatial.distance.cosine(u, v)

    def spatial_distance_correlation(self, u: np.ndarray, v: np.ndarray) -> float:
        """Correlation distance"""
        return spatial.distance.correlation(u, v)

    def spatial_distance_pdist(self, X: np.ndarray, metric: str = 'euclidean') -> np.ndarray:
        """Pairwise distances"""
        return spatial.distance.pdist(X, metric=metric)

    def spatial_distance_cdist(self, XA: np.ndarray, XB: np.ndarray, metric: str = 'euclidean') -> np.ndarray:
        """Distance between two collections"""
        return spatial.distance.cdist(XA, XB, metric=metric)

    def spatial_distance_squareform(self, X: np.ndarray, force: str = 'no', checks: bool = True) -> np.ndarray:
        """Convert distance vector to matrix"""
        return spatial.distance.squareform(X, force=force, checks=checks)

    def spatial_KDTree(self, data: np.ndarray, leafsize: int = 10) -> Any:
        """k-d tree for fast nearest-neighbor lookup"""
        return spatial.KDTree(data, leafsize=leafsize)

    def spatial_ConvexHull(self, points: np.ndarray, incremental: bool = False, qhull_options: Optional[str] = None) -> Any:
        """Convex hull"""
        return spatial.ConvexHull(points, incremental=incremental, qhull_options=qhull_options)

    def spatial_Delaunay(self, points: np.ndarray, furthest_site: bool = False, incremental: bool = False, qhull_options: Optional[str] = None) -> Any:
        """Delaunay triangulation"""
        return spatial.Delaunay(points, furthest_site=furthest_site, incremental=incremental, qhull_options=qhull_options)

    def spatial_Voronoi(self, points: np.ndarray, furthest_site: bool = False, incremental: bool = False, qhull_options: Optional[str] = None) -> Any:
        """Voronoi diagram"""
        return spatial.Voronoi(points, furthest_site=furthest_site, incremental=incremental, qhull_options=qhull_options)

    # =========================================================================
    # Utility Functions
    # =========================================================================

    def get_version(self) -> str:
        """Get SciPy version"""
        return scipy.__version__

    def clear_cache(self) -> None:
        """Clear internal cache"""
        self.cache.clear()


# Create global instance
scipy_bridge = ScipyBridge()


# Export convenience functions
def fft(x, n=None, axis=-1):
    """Compute FFT"""
    return scipy_bridge.fft_fft(x, n, axis)


def ifft(x, n=None, axis=-1):
    """Compute inverse FFT"""
    return scipy_bridge.fft_ifft(x, n, axis)


def quad(func, a, b):
    """Integrate function"""
    return scipy_bridge.integrate_quad(func, a, b)


def odeint(func, y0, t):
    """Solve ODE"""
    return scipy_bridge.integrate_odeint(func, y0, t)
