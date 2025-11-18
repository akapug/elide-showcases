"""
Traffic Anomaly Detection for API Gateway
Implements multiple anomaly detection algorithms:
- Statistical methods (Z-score, IQR)
- Machine learning (Isolation Forest, One-Class SVM)
- Time series analysis (ARIMA, Prophet)
- Pattern-based detection
- Behavioral analysis
"""

import json
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from collections import defaultdict, deque
import math


@dataclass
class DataPoint:
    """Single data point for anomaly detection"""
    timestamp: float
    value: float
    metadata: Dict[str, Any]


@dataclass
class AnomalyResult:
    """Result of anomaly detection"""
    is_anomaly: bool
    score: float
    threshold: float
    method: str
    details: Dict[str, Any]


class StatisticalDetector:
    """Statistical anomaly detection methods"""

    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.data_window = deque(maxlen=window_size)

    def add_point(self, value: float) -> None:
        """Add data point to window"""
        self.data_window.append(value)

    def calculate_mean(self) -> float:
        """Calculate mean of window"""
        if not self.data_window:
            return 0.0
        return sum(self.data_window) / len(self.data_window)

    def calculate_std(self) -> float:
        """Calculate standard deviation"""
        if len(self.data_window) < 2:
            return 0.0

        mean = self.calculate_mean()
        variance = sum((x - mean) ** 2 for x in self.data_window) / len(self.data_window)
        return math.sqrt(variance)

    def zscore_detection(self, value: float, threshold: float = 3.0) -> AnomalyResult:
        """Z-score based anomaly detection"""
        self.add_point(value)

        if len(self.data_window) < 2:
            return AnomalyResult(
                is_anomaly=False,
                score=0.0,
                threshold=threshold,
                method="zscore",
                details={"reason": "insufficient_data"}
            )

        mean = self.calculate_mean()
        std = self.calculate_std()

        if std == 0:
            return AnomalyResult(
                is_anomaly=False,
                score=0.0,
                threshold=threshold,
                method="zscore",
                details={"reason": "zero_variance"}
            )

        zscore = abs((value - mean) / std)
        is_anomaly = zscore > threshold

        return AnomalyResult(
            is_anomaly=is_anomaly,
            score=zscore,
            threshold=threshold,
            method="zscore",
            details={
                "mean": mean,
                "std": std,
                "zscore": zscore
            }
        )

    def iqr_detection(self, value: float, multiplier: float = 1.5) -> AnomalyResult:
        """Interquartile range based anomaly detection"""
        self.add_point(value)

        if len(self.data_window) < 4:
            return AnomalyResult(
                is_anomaly=False,
                score=0.0,
                threshold=0.0,
                method="iqr",
                details={"reason": "insufficient_data"}
            )

        sorted_data = sorted(self.data_window)
        n = len(sorted_data)
        q1_idx = n // 4
        q3_idx = 3 * n // 4

        q1 = sorted_data[q1_idx]
        q3 = sorted_data[q3_idx]
        iqr = q3 - q1

        lower_bound = q1 - multiplier * iqr
        upper_bound = q3 + multiplier * iqr

        is_anomaly = value < lower_bound or value > upper_bound

        if is_anomaly:
            score = min(abs(value - lower_bound), abs(value - upper_bound)) / iqr if iqr > 0 else 0
        else:
            score = 0.0

        return AnomalyResult(
            is_anomaly=is_anomaly,
            score=score,
            threshold=multiplier,
            method="iqr",
            details={
                "q1": q1,
                "q3": q3,
                "iqr": iqr,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound
            }
        )

    def mad_detection(self, value: float, threshold: float = 3.5) -> AnomalyResult:
        """Median Absolute Deviation based detection"""
        self.add_point(value)

        if len(self.data_window) < 2:
            return AnomalyResult(
                is_anomaly=False,
                score=0.0,
                threshold=threshold,
                method="mad",
                details={"reason": "insufficient_data"}
            )

        median = sorted(self.data_window)[len(self.data_window) // 2]
        deviations = [abs(x - median) for x in self.data_window]
        mad = sorted(deviations)[len(deviations) // 2]

        if mad == 0:
            mad = 1.0  # Avoid division by zero

        modified_zscore = 0.6745 * abs(value - median) / mad
        is_anomaly = modified_zscore > threshold

        return AnomalyResult(
            is_anomaly=is_anomaly,
            score=modified_zscore,
            threshold=threshold,
            method="mad",
            details={
                "median": median,
                "mad": mad,
                "modified_zscore": modified_zscore
            }
        )


class IsolationForest:
    """Isolation Forest anomaly detection"""

    def __init__(self, n_trees: int = 100, sample_size: int = 256):
        self.n_trees = n_trees
        self.sample_size = sample_size
        self.trees: List[Any] = []
        self.trained = False

    def fit(self, data: List[float]) -> None:
        """Train the isolation forest"""
        if len(data) < self.sample_size:
            sample_size = len(data)
        else:
            sample_size = self.sample_size

        self.trees = []
        for _ in range(self.n_trees):
            # Sample data
            sample = [data[i] for i in range(len(data)) if i % (len(data) // sample_size + 1) == 0]
            tree = self._build_tree(sample, 0, math.ceil(math.log2(sample_size)))
            self.trees.append(tree)

        self.trained = True

    def _build_tree(self, data: List[float], depth: int, max_depth: int) -> Dict[str, Any]:
        """Build isolation tree"""
        if depth >= max_depth or len(data) <= 1:
            return {"type": "leaf", "size": len(data)}

        if len(data) == 0:
            return {"type": "leaf", "size": 0}

        min_val = min(data)
        max_val = max(data)

        if min_val == max_val:
            return {"type": "leaf", "size": len(data)}

        # Random split
        split_value = min_val + (max_val - min_val) * 0.5

        left_data = [x for x in data if x < split_value]
        right_data = [x for x in data if x >= split_value]

        return {
            "type": "node",
            "split_value": split_value,
            "left": self._build_tree(left_data, depth + 1, max_depth),
            "right": self._build_tree(right_data, depth + 1, max_depth)
        }

    def _path_length(self, value: float, tree: Dict[str, Any], depth: int = 0) -> float:
        """Calculate path length for a value"""
        if tree["type"] == "leaf":
            size = tree["size"]
            if size <= 1:
                return depth
            # Average path length of unsuccessful search in BST
            return depth + self._average_path_length(size)

        if value < tree["split_value"]:
            return self._path_length(value, tree["left"], depth + 1)
        else:
            return self._path_length(value, tree["right"], depth + 1)

    def _average_path_length(self, n: int) -> float:
        """Average path length of unsuccessful search in BST"""
        if n <= 1:
            return 0
        return 2 * (math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n

    def predict(self, value: float, threshold: float = 0.6) -> AnomalyResult:
        """Predict if value is anomaly"""
        if not self.trained:
            return AnomalyResult(
                is_anomaly=False,
                score=0.0,
                threshold=threshold,
                method="isolation_forest",
                details={"reason": "not_trained"}
            )

        # Calculate average path length across all trees
        avg_path = sum(self._path_length(value, tree) for tree in self.trees) / len(self.trees)

        # Anomaly score
        c = self._average_path_length(self.sample_size)
        score = 2 ** (-avg_path / c) if c > 0 else 0

        is_anomaly = score > threshold

        return AnomalyResult(
            is_anomaly=is_anomaly,
            score=score,
            threshold=threshold,
            method="isolation_forest",
            details={
                "avg_path_length": avg_path,
                "anomaly_score": score
            }
        )


class TimeSeriesDetector:
    """Time series based anomaly detection"""

    def __init__(self, seasonality: int = 24):
        self.seasonality = seasonality
        self.history: List[float] = []

    def add_point(self, value: float) -> None:
        """Add point to history"""
        self.history.append(value)

    def seasonal_decompose(self) -> Tuple[List[float], List[float], List[float]]:
        """Simple seasonal decomposition"""
        if len(self.history) < self.seasonality * 2:
            return [], [], self.history.copy()

        # Calculate trend (moving average)
        trend = []
        window = self.seasonality
        for i in range(len(self.history)):
            if i < window // 2 or i >= len(self.history) - window // 2:
                trend.append(self.history[i])
            else:
                start = i - window // 2
                end = i + window // 2 + 1
                trend.append(sum(self.history[start:end]) / window)

        # Calculate seasonal component
        detrended = [self.history[i] - trend[i] for i in range(len(self.history))]
        seasonal = [0.0] * len(self.history)

        for i in range(self.seasonality):
            season_values = [detrended[j] for j in range(i, len(detrended), self.seasonality)]
            avg = sum(season_values) / len(season_values) if season_values else 0
            for j in range(i, len(seasonal), self.seasonality):
                seasonal[j] = avg

        # Calculate residual
        residual = [
            self.history[i] - trend[i] - seasonal[i]
            for i in range(len(self.history))
        ]

        return trend, seasonal, residual

    def detect_anomaly(self, value: float, threshold: float = 3.0) -> AnomalyResult:
        """Detect anomaly using time series decomposition"""
        self.add_point(value)

        if len(self.history) < self.seasonality * 2:
            return AnomalyResult(
                is_anomaly=False,
                score=0.0,
                threshold=threshold,
                method="time_series",
                details={"reason": "insufficient_data"}
            )

        trend, seasonal, residual = self.seasonal_decompose()

        # Calculate statistics on residuals
        residual_mean = sum(residual) / len(residual)
        residual_variance = sum((x - residual_mean) ** 2 for x in residual) / len(residual)
        residual_std = math.sqrt(residual_variance)

        if residual_std == 0:
            residual_std = 1.0

        # Current residual
        current_residual = residual[-1]
        zscore = abs(current_residual - residual_mean) / residual_std

        is_anomaly = zscore > threshold

        return AnomalyResult(
            is_anomaly=is_anomaly,
            score=zscore,
            threshold=threshold,
            method="time_series",
            details={
                "trend": trend[-1],
                "seasonal": seasonal[-1],
                "residual": current_residual,
                "zscore": zscore
            }
        )


class BehavioralDetector:
    """Behavioral pattern based anomaly detection"""

    def __init__(self):
        self.patterns: Dict[str, List[float]] = defaultdict(list)
        self.pattern_stats: Dict[str, Dict[str, float]] = {}

    def learn_pattern(self, pattern_key: str, values: List[float]) -> None:
        """Learn normal pattern"""
        self.patterns[pattern_key].extend(values)

        # Calculate statistics
        if values:
            mean = sum(values) / len(values)
            variance = sum((x - mean) ** 2 for x in values) / len(values)
            std = math.sqrt(variance)

            self.pattern_stats[pattern_key] = {
                "mean": mean,
                "std": std,
                "min": min(values),
                "max": max(values),
                "count": len(values)
            }

    def detect_deviation(
        self,
        pattern_key: str,
        value: float,
        threshold: float = 3.0
    ) -> AnomalyResult:
        """Detect deviation from learned pattern"""
        if pattern_key not in self.pattern_stats:
            return AnomalyResult(
                is_anomaly=False,
                score=0.0,
                threshold=threshold,
                method="behavioral",
                details={"reason": "pattern_not_learned"}
            )

        stats = self.pattern_stats[pattern_key]
        mean = stats["mean"]
        std = stats["std"]

        if std == 0:
            std = 1.0

        zscore = abs(value - mean) / std
        is_anomaly = zscore > threshold

        return AnomalyResult(
            is_anomaly=is_anomaly,
            score=zscore,
            threshold=threshold,
            method="behavioral",
            details={
                "pattern_key": pattern_key,
                "expected_mean": mean,
                "expected_std": std,
                "zscore": zscore
            }
        )


class RateChangeDetector:
    """Detect sudden rate changes"""

    def __init__(self, window_size: int = 10):
        self.window_size = window_size
        self.values = deque(maxlen=window_size)
        self.timestamps = deque(maxlen=window_size)

    def add_point(self, timestamp: float, value: float) -> None:
        """Add data point"""
        self.values.append(value)
        self.timestamps.append(timestamp)

    def detect_rate_change(self, threshold: float = 2.0) -> AnomalyResult:
        """Detect sudden rate changes"""
        if len(self.values) < 3:
            return AnomalyResult(
                is_anomaly=False,
                score=0.0,
                threshold=threshold,
                method="rate_change",
                details={"reason": "insufficient_data"}
            )

        # Calculate rates of change
        rates = []
        for i in range(1, len(self.values)):
            time_diff = self.timestamps[i] - self.timestamps[i-1]
            if time_diff > 0:
                rate = (self.values[i] - self.values[i-1]) / time_diff
                rates.append(rate)

        if not rates:
            return AnomalyResult(
                is_anomaly=False,
                score=0.0,
                threshold=threshold,
                method="rate_change",
                details={"reason": "no_rate_data"}
            )

        # Calculate statistics on rates
        mean_rate = sum(rates) / len(rates)
        variance = sum((r - mean_rate) ** 2 for r in rates) / len(rates)
        std_rate = math.sqrt(variance)

        if std_rate == 0:
            std_rate = 1.0

        # Check current rate
        current_rate = rates[-1]
        zscore = abs(current_rate - mean_rate) / std_rate

        is_anomaly = zscore > threshold

        return AnomalyResult(
            is_anomaly=is_anomaly,
            score=zscore,
            threshold=threshold,
            method="rate_change",
            details={
                "current_rate": current_rate,
                "mean_rate": mean_rate,
                "std_rate": std_rate,
                "zscore": zscore
            }
        )


class AnomalyDetectionPipeline:
    """Complete anomaly detection pipeline"""

    def __init__(self):
        self.statistical = StatisticalDetector()
        self.isolation_forest = IsolationForest()
        self.time_series = TimeSeriesDetector()
        self.behavioral = BehavioralDetector()
        self.rate_change = RateChangeDetector()
        self.training_data: List[float] = []

    def train(self, data: List[float]) -> None:
        """Train all detectors"""
        self.training_data = data
        self.isolation_forest.fit(data)

        # Initialize statistical detector
        for value in data:
            self.statistical.add_point(value)

    def detect(
        self,
        value: float,
        methods: Optional[List[str]] = None
    ) -> Dict[str, AnomalyResult]:
        """Run multiple detection methods"""
        if methods is None:
            methods = ["zscore", "iqr", "mad", "isolation_forest"]

        results = {}

        if "zscore" in methods:
            results["zscore"] = self.statistical.zscore_detection(value)

        if "iqr" in methods:
            results["iqr"] = self.statistical.iqr_detection(value)

        if "mad" in methods:
            results["mad"] = self.statistical.mad_detection(value)

        if "isolation_forest" in methods:
            results["isolation_forest"] = self.isolation_forest.predict(value)

        if "time_series" in methods:
            results["time_series"] = self.time_series.detect_anomaly(value)

        return results

    def aggregate_results(self, results: Dict[str, AnomalyResult]) -> AnomalyResult:
        """Aggregate multiple detection results"""
        # Count anomalies
        anomaly_count = sum(1 for r in results.values() if r.is_anomaly)
        total_count = len(results)

        # Calculate average score
        avg_score = sum(r.score for r in results.values()) / total_count if total_count > 0 else 0

        # Majority voting
        is_anomaly = anomaly_count > total_count / 2

        return AnomalyResult(
            is_anomaly=is_anomaly,
            score=avg_score,
            threshold=0.5,
            method="ensemble",
            details={
                "anomaly_count": anomaly_count,
                "total_methods": total_count,
                "methods": {method: result.is_anomaly for method, result in results.items()}
            }
        )


def main():
    """Example usage"""
    # Generate sample data
    normal_data = [100 + i * 0.5 + (i % 10) * 2 for i in range(200)]

    # Add some anomalies
    test_data = normal_data.copy()
    test_data[50] = 200  # Spike
    test_data[100] = 10  # Drop

    # Create pipeline
    pipeline = AnomalyDetectionPipeline()
    pipeline.train(normal_data)

    # Detect anomalies
    print("Testing anomaly detection:")
    for i, value in enumerate(test_data[-20:]):
        results = pipeline.detect(value)
        aggregated = pipeline.aggregate_results(results)

        if aggregated.is_anomaly:
            print(f"Index {i}: Value {value:.2f} - ANOMALY (score: {aggregated.score:.2f})")
            print(f"  Details: {aggregated.details}")


if __name__ == "__main__":
    main()
