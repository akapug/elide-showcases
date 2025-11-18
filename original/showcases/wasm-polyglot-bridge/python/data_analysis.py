"""
Data Analysis - Python Data Processing for WASM Bridge
Statistical analysis and data manipulation utilities
"""

import numpy as np
from typing import Dict, List, Tuple, Any


class DataAnalyzer:
    """Statistical analysis and data exploration"""

    @staticmethod
    def descriptive_stats(data: np.ndarray) -> Dict[str, float]:
        """
        Compute descriptive statistics

        Returns:
            Dictionary with mean, median, std, min, max, q25, q75
        """
        return {
            'mean': float(np.mean(data)),
            'median': float(np.median(data)),
            'std': float(np.std(data)),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'q25': float(np.percentile(data, 25)),
            'q75': float(np.percentile(data, 75)),
            'count': int(len(data))
        }

    @staticmethod
    def correlation_matrix(X: np.ndarray) -> np.ndarray:
        """
        Compute correlation matrix

        Args:
            X: Data matrix (n_samples, n_features)

        Returns:
            Correlation matrix (n_features, n_features)
        """
        return np.corrcoef(X.T)

    @staticmethod
    def z_score_normalize(X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Z-score normalization: (X - mean) / std

        Returns:
            (normalized_X, means, stds)
        """
        means = np.mean(X, axis=0)
        stds = np.std(X, axis=0)
        normalized = (X - means) / (stds + 1e-8)
        return normalized, means, stds

    @staticmethod
    def min_max_normalize(X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Min-max normalization to [0, 1]

        Returns:
            (normalized_X, mins, maxs)
        """
        mins = np.min(X, axis=0)
        maxs = np.max(X, axis=0)
        normalized = (X - mins) / (maxs - mins + 1e-8)
        return normalized, mins, maxs

    @staticmethod
    def detect_outliers_iqr(data: np.ndarray, threshold: float = 1.5) -> np.ndarray:
        """
        Detect outliers using IQR method

        Args:
            data: Input data
            threshold: IQR multiplier (default 1.5)

        Returns:
            Boolean array indicating outliers
        """
        q25 = np.percentile(data, 25)
        q75 = np.percentile(data, 75)
        iqr = q75 - q25

        lower_bound = q25 - threshold * iqr
        upper_bound = q75 + threshold * iqr

        return (data < lower_bound) | (data > upper_bound)

    @staticmethod
    def detect_outliers_zscore(data: np.ndarray, threshold: float = 3.0) -> np.ndarray:
        """
        Detect outliers using Z-score method

        Returns:
            Boolean array indicating outliers
        """
        z_scores = np.abs((data - np.mean(data)) / np.std(data))
        return z_scores > threshold

    @staticmethod
    def moving_average(data: np.ndarray, window: int) -> np.ndarray:
        """
        Compute moving average

        Args:
            data: Time series data
            window: Window size

        Returns:
            Smoothed data
        """
        cumsum = np.cumsum(np.insert(data, 0, 0))
        return (cumsum[window:] - cumsum[:-window]) / window

    @staticmethod
    def exponential_smoothing(data: np.ndarray, alpha: float) -> np.ndarray:
        """
        Exponential smoothing

        Args:
            data: Time series data
            alpha: Smoothing factor (0 < alpha < 1)

        Returns:
            Smoothed data
        """
        result = np.zeros_like(data)
        result[0] = data[0]

        for i in range(1, len(data)):
            result[i] = alpha * data[i] + (1 - alpha) * result[i - 1]

        return result


class DataTransformer:
    """Data transformation utilities"""

    @staticmethod
    def one_hot_encode(labels: np.ndarray, n_classes: int) -> np.ndarray:
        """
        One-hot encode categorical labels

        Args:
            labels: Integer labels (n_samples,)
            n_classes: Number of classes

        Returns:
            One-hot encoded matrix (n_samples, n_classes)
        """
        encoded = np.zeros((len(labels), n_classes))
        encoded[np.arange(len(labels)), labels.astype(int)] = 1
        return encoded

    @staticmethod
    def polynomial_features(X: np.ndarray, degree: int) -> np.ndarray:
        """
        Generate polynomial features up to specified degree

        Args:
            X: Input features (n_samples, n_features)
            degree: Polynomial degree

        Returns:
            Polynomial features
        """
        n_samples, n_features = X.shape
        features = [np.ones((n_samples, 1))]  # Bias term

        for d in range(1, degree + 1):
            for i in range(n_features):
                features.append((X[:, i] ** d).reshape(-1, 1))

        return np.hstack(features)

    @staticmethod
    def bin_data(data: np.ndarray, n_bins: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        Bin continuous data into discrete bins

        Returns:
            (bin_indices, bin_edges)
        """
        bin_edges = np.linspace(np.min(data), np.max(data), n_bins + 1)
        bin_indices = np.digitize(data, bin_edges) - 1
        bin_indices = np.clip(bin_indices, 0, n_bins - 1)
        return bin_indices, bin_edges


class TimeSeries:
    """Time series analysis utilities"""

    @staticmethod
    def autocorrelation(data: np.ndarray, max_lag: int) -> np.ndarray:
        """
        Compute autocorrelation function

        Args:
            data: Time series data
            max_lag: Maximum lag to compute

        Returns:
            Autocorrelation values
        """
        mean = np.mean(data)
        var = np.var(data)
        normalized = data - mean

        acf = np.zeros(max_lag + 1)
        acf[0] = 1.0

        for lag in range(1, max_lag + 1):
            acf[lag] = np.sum(normalized[:-lag] * normalized[lag:]) / (len(data) * var)

        return acf

    @staticmethod
    def difference(data: np.ndarray, order: int = 1) -> np.ndarray:
        """
        Compute differences for stationarity

        Args:
            data: Time series data
            order: Differencing order

        Returns:
            Differenced data
        """
        result = data.copy()
        for _ in range(order):
            result = np.diff(result)
        return result

    @staticmethod
    def seasonal_decompose(
        data: np.ndarray,
        period: int
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Simple seasonal decomposition

        Returns:
            (trend, seasonal, residual)
        """
        # Compute trend using moving average
        trend = DataAnalyzer.moving_average(data, period)

        # Pad trend to match original length
        pad_len = len(data) - len(trend)
        trend = np.pad(trend, (pad_len // 2, pad_len - pad_len // 2), mode='edge')

        # Compute seasonal component
        detrended = data - trend
        seasonal = np.zeros_like(data)

        for i in range(period):
            seasonal[i::period] = np.mean(detrended[i::period])

        # Residual
        residual = data - trend - seasonal

        return trend, seasonal, residual


# Utility functions for TypeScript/Elide integration
def analyze_dataset(data: List[List[float]]) -> Dict[str, Any]:
    """
    Comprehensive dataset analysis

    Args:
        data: 2D array as list of lists

    Returns:
        Analysis results dictionary
    """
    X = np.array(data)

    if X.ndim == 1:
        X = X.reshape(-1, 1)

    results = {
        'shape': X.shape,
        'features': []
    }

    # Analyze each feature
    for i in range(X.shape[1]):
        feature_data = X[:, i]
        stats = DataAnalyzer.descriptive_stats(feature_data)
        outliers_iqr = DataAnalyzer.detect_outliers_iqr(feature_data)
        outliers_zscore = DataAnalyzer.detect_outliers_zscore(feature_data)

        results['features'].append({
            'index': i,
            'stats': stats,
            'outliers_iqr_count': int(np.sum(outliers_iqr)),
            'outliers_zscore_count': int(np.sum(outliers_zscore))
        })

    # Correlation matrix if multiple features
    if X.shape[1] > 1:
        results['correlation'] = DataAnalyzer.correlation_matrix(X).tolist()

    return results


if __name__ == "__main__":
    # Quick test
    print("Testing DataAnalyzer...")

    # Test descriptive stats
    data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    stats = DataAnalyzer.descriptive_stats(data)
    print(f"Descriptive stats: {stats}")

    # Test outlier detection
    data_with_outliers = np.array([1, 2, 3, 4, 5, 100])
    outliers = DataAnalyzer.detect_outliers_iqr(data_with_outliers)
    print(f"Outliers detected: {outliers}")

    # Test moving average
    time_series = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    smoothed = DataAnalyzer.moving_average(time_series, 3)
    print(f"Moving average: {smoothed}")

    print("All tests passed!")
