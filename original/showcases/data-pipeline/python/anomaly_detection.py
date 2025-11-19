"""
Stream Anomaly Detection

Real-time anomaly detection for streaming data:
- Statistical methods (z-score, IQR, moving average)
- Machine learning models (isolation forest, autoencoders)
- Pattern-based detection
- Contextual anomalies
- Collective anomalies
- Adaptive thresholds
"""

import time
import json
import numpy as np
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from collections import deque, defaultdict
from enum import Enum


# ============================================================================
# Types and Configuration
# ============================================================================

class AnomalyType(Enum):
    """Types of anomalies"""
    POINT = "point"  # Single data point is anomalous
    CONTEXTUAL = "contextual"  # Anomalous in specific context
    COLLECTIVE = "collective"  # Sequence of points is anomalous
    PATTERN = "pattern"  # Deviation from expected pattern


@dataclass
class AnomalyScore:
    """Anomaly score result"""
    is_anomaly: bool
    score: float  # 0-1, higher = more anomalous
    anomaly_type: AnomalyType
    method: str
    details: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


@dataclass
class DetectorConfig:
    """Configuration for anomaly detector"""
    method: str  # 'zscore', 'iqr', 'isolation_forest', 'autoencoder', 'pattern'
    threshold: float = 0.95  # Anomaly threshold
    window_size: int = 100  # Historical window size
    min_samples: int = 30  # Minimum samples before detection
    adaptive: bool = True  # Use adaptive thresholds
    sensitivity: float = 1.0  # Detection sensitivity multiplier


# ============================================================================
# Statistical Detectors
# ============================================================================

class ZScoreDetector:
    """Z-score based anomaly detection"""

    def __init__(self, config: DetectorConfig):
        self.config = config
        self.history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=config.window_size))
        self.stats: Dict[str, Dict[str, float]] = defaultdict(dict)

    def detect(self, data: Dict[str, Any], field: str) -> AnomalyScore:
        """Detect anomalies using z-score"""
        value = data.get(field)

        if value is None or not isinstance(value, (int, float)):
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="zscore",
                details={"error": "Invalid value"}
            )

        # Add to history
        self.history[field].append(value)

        # Need minimum samples
        if len(self.history[field]) < self.config.min_samples:
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="zscore",
                details={"message": "Insufficient samples"}
            )

        # Calculate statistics
        values = list(self.history[field])
        mean = np.mean(values)
        std = np.std(values)

        self.stats[field] = {"mean": mean, "std": std}

        # Calculate z-score
        if std == 0:
            z_score = 0
        else:
            z_score = abs(value - mean) / std

        # Apply sensitivity
        z_score *= self.config.sensitivity

        # Adaptive threshold
        if self.config.adaptive:
            threshold = 3.0 + (std / mean if mean != 0 else 0)
        else:
            threshold = 3.0

        is_anomaly = z_score > threshold
        score = min(z_score / (threshold * 2), 1.0)

        return AnomalyScore(
            is_anomaly=is_anomaly,
            score=score,
            anomaly_type=AnomalyType.POINT,
            method="zscore",
            details={
                "value": value,
                "mean": mean,
                "std": std,
                "z_score": z_score,
                "threshold": threshold
            }
        )


class IQRDetector:
    """Interquartile Range based anomaly detection"""

    def __init__(self, config: DetectorConfig):
        self.config = config
        self.history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=config.window_size))

    def detect(self, data: Dict[str, Any], field: str) -> AnomalyScore:
        """Detect anomalies using IQR method"""
        value = data.get(field)

        if value is None or not isinstance(value, (int, float)):
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="iqr"
            )

        # Add to history
        self.history[field].append(value)

        # Need minimum samples
        if len(self.history[field]) < self.config.min_samples:
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="iqr"
            )

        # Calculate IQR
        values = list(self.history[field])
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1

        # Calculate bounds
        multiplier = 1.5 * self.config.sensitivity
        lower_bound = q1 - multiplier * iqr
        upper_bound = q3 + multiplier * iqr

        # Check if anomaly
        is_anomaly = value < lower_bound or value > upper_bound

        # Calculate score based on distance from bounds
        if value < lower_bound:
            distance = lower_bound - value
            score = min(distance / (iqr * multiplier), 1.0)
        elif value > upper_bound:
            distance = value - upper_bound
            score = min(distance / (iqr * multiplier), 1.0)
        else:
            score = 0.0

        return AnomalyScore(
            is_anomaly=is_anomaly,
            score=score,
            anomaly_type=AnomalyType.POINT,
            method="iqr",
            details={
                "value": value,
                "q1": q1,
                "q3": q3,
                "iqr": iqr,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound
            }
        )


class MovingAverageDetector:
    """Moving average based anomaly detection"""

    def __init__(self, config: DetectorConfig, ma_window: int = 10):
        self.config = config
        self.ma_window = ma_window
        self.history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=config.window_size))
        self.ma_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=config.window_size))

    def detect(self, data: Dict[str, Any], field: str) -> AnomalyScore:
        """Detect anomalies using moving average"""
        value = data.get(field)

        if value is None or not isinstance(value, (int, float)):
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="moving_average"
            )

        # Add to history
        self.history[field].append(value)

        # Need minimum samples
        if len(self.history[field]) < self.ma_window:
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="moving_average"
            )

        # Calculate moving average
        recent_values = list(self.history[field])[-self.ma_window:]
        ma = np.mean(recent_values)
        ma_std = np.std(recent_values)

        self.ma_history[field].append(ma)

        # Calculate deviation
        deviation = abs(value - ma)
        threshold = ma_std * 3 * self.config.sensitivity

        is_anomaly = deviation > threshold

        score = min(deviation / (threshold * 2) if threshold > 0 else 0, 1.0)

        return AnomalyScore(
            is_anomaly=is_anomaly,
            score=score,
            anomaly_type=AnomalyType.POINT,
            method="moving_average",
            details={
                "value": value,
                "ma": ma,
                "ma_std": ma_std,
                "deviation": deviation,
                "threshold": threshold
            }
        )


# ============================================================================
# Machine Learning Detectors
# ============================================================================

class IsolationForestDetector:
    """Isolation Forest based anomaly detection"""

    def __init__(self, config: DetectorConfig, n_trees: int = 100):
        self.config = config
        self.n_trees = n_trees
        self.history: deque = deque(maxlen=config.window_size)
        self.trees: List[Dict] = []
        self.trained = False

    def detect(self, data: Dict[str, Any]) -> AnomalyScore:
        """Detect anomalies using isolation forest"""
        # Extract numeric features
        features = self._extract_features(data)

        if not features:
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="isolation_forest"
            )

        # Add to history
        self.history.append(features)

        # Train if we have enough samples
        if len(self.history) >= self.config.min_samples and not self.trained:
            self._train()

        if not self.trained:
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="isolation_forest",
                details={"message": "Model not trained yet"}
            )

        # Calculate anomaly score
        score = self._calculate_score(features)

        is_anomaly = score > self.config.threshold

        return AnomalyScore(
            is_anomaly=is_anomaly,
            score=score,
            anomaly_type=AnomalyType.POINT,
            method="isolation_forest",
            details={
                "features": features,
                "n_trees": len(self.trees)
            }
        )

    def _extract_features(self, data: Dict[str, Any]) -> List[float]:
        """Extract numeric features from data"""
        features = []

        for key, value in data.items():
            if isinstance(value, (int, float)):
                features.append(float(value))

        return features

    def _train(self):
        """Train isolation forest (simplified simulation)"""
        # In practice, this would build actual isolation trees
        # For simulation, we'll use random thresholds
        self.trees = []

        for _ in range(self.n_trees):
            tree = {
                "feature_idx": np.random.randint(0, len(self.history[0])),
                "threshold": np.random.uniform(-1, 1)
            }
            self.trees.append(tree)

        self.trained = True

    def _calculate_score(self, features: List[float]) -> float:
        """Calculate anomaly score (simplified)"""
        if not self.trees or not features:
            return 0.0

        # Simulate isolation score calculation
        # In practice, this would be path length in trees
        scores = []

        for tree in self.trees:
            idx = tree["feature_idx"] % len(features)
            if features[idx] > tree["threshold"]:
                scores.append(1.0)
            else:
                scores.append(0.0)

        return np.mean(scores)


class AutoencoderDetector:
    """Autoencoder based anomaly detection"""

    def __init__(self, config: DetectorConfig, encoding_dim: int = 8):
        self.config = config
        self.encoding_dim = encoding_dim
        self.history: deque = deque(maxlen=config.window_size)
        self.encoder_weights: Optional[np.ndarray] = None
        self.decoder_weights: Optional[np.ndarray] = None
        self.trained = False
        self.reconstruction_errors: deque = deque(maxlen=100)

    def detect(self, data: Dict[str, Any]) -> AnomalyScore:
        """Detect anomalies using autoencoder"""
        features = self._extract_features(data)

        if not features:
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="autoencoder"
            )

        # Add to history
        self.history.append(features)

        # Train if we have enough samples
        if len(self.history) >= self.config.min_samples and not self.trained:
            self._train()

        if not self.trained:
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="autoencoder"
            )

        # Calculate reconstruction error
        reconstruction_error = self._calculate_reconstruction_error(features)
        self.reconstruction_errors.append(reconstruction_error)

        # Calculate threshold
        if len(self.reconstruction_errors) >= 10:
            threshold = np.percentile(list(self.reconstruction_errors), 95)
            threshold *= self.config.sensitivity
        else:
            threshold = 1.0

        is_anomaly = reconstruction_error > threshold
        score = min(reconstruction_error / (threshold * 2), 1.0)

        return AnomalyScore(
            is_anomaly=is_anomaly,
            score=score,
            anomaly_type=AnomalyType.POINT,
            method="autoencoder",
            details={
                "reconstruction_error": reconstruction_error,
                "threshold": threshold,
                "encoding_dim": self.encoding_dim
            }
        )

    def _extract_features(self, data: Dict[str, Any]) -> List[float]:
        """Extract numeric features"""
        features = []

        for key, value in data.items():
            if isinstance(value, (int, float)):
                features.append(float(value))

        return features

    def _train(self):
        """Train autoencoder (simplified simulation)"""
        if len(self.history) == 0:
            return

        feature_dim = len(self.history[0])

        # Simulate training by creating random weights
        np.random.seed(42)
        self.encoder_weights = np.random.randn(feature_dim, self.encoding_dim) * 0.1
        self.decoder_weights = np.random.randn(self.encoding_dim, feature_dim) * 0.1

        self.trained = True

    def _calculate_reconstruction_error(self, features: List[float]) -> float:
        """Calculate reconstruction error"""
        if not self.trained or self.encoder_weights is None:
            return 0.0

        # Simulate autoencoder forward pass
        x = np.array(features).reshape(-1, 1)

        # Encode
        encoded = np.dot(self.encoder_weights.T, x)

        # Decode
        decoded = np.dot(self.decoder_weights.T, encoded)

        # Calculate MSE
        error = np.mean((x - decoded) ** 2)

        return float(error)


# ============================================================================
# Pattern-Based Detectors
# ============================================================================

class PatternDetector:
    """Pattern-based anomaly detection"""

    def __init__(self, config: DetectorConfig, pattern_length: int = 10):
        self.config = config
        self.pattern_length = pattern_length
        self.history: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=config.window_size)
        )
        self.patterns: Dict[str, List[List[float]]] = defaultdict(list)

    def detect(self, data: Dict[str, Any], field: str) -> AnomalyScore:
        """Detect pattern anomalies"""
        value = data.get(field)

        if value is None or not isinstance(value, (int, float)):
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.PATTERN,
                method="pattern"
            )

        # Add to history
        self.history[field].append(value)

        # Need enough samples
        if len(self.history[field]) < self.pattern_length:
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.PATTERN,
                method="pattern"
            )

        # Extract current pattern
        current_pattern = list(self.history[field])[-self.pattern_length:]

        # Learn patterns
        if len(self.history[field]) >= self.config.min_samples:
            self._learn_patterns(field)

        # Compare with learned patterns
        if not self.patterns[field]:
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.PATTERN,
                method="pattern"
            )

        # Calculate similarity to known patterns
        similarities = [
            self._calculate_similarity(current_pattern, pattern)
            for pattern in self.patterns[field]
        ]

        max_similarity = max(similarities)
        score = 1.0 - max_similarity  # Higher dissimilarity = higher anomaly score

        is_anomaly = score > self.config.threshold

        return AnomalyScore(
            is_anomaly=is_anomaly,
            score=score,
            anomaly_type=AnomalyType.PATTERN,
            method="pattern",
            details={
                "max_similarity": max_similarity,
                "pattern_count": len(self.patterns[field])
            }
        )

    def _learn_patterns(self, field: str):
        """Learn patterns from history"""
        values = list(self.history[field])

        # Extract patterns
        for i in range(len(values) - self.pattern_length):
            pattern = values[i:i + self.pattern_length]

            # Normalize pattern
            normalized = self._normalize_pattern(pattern)

            # Add if unique enough
            if not self.patterns[field] or self._is_unique_pattern(normalized, field):
                self.patterns[field].append(normalized)

                # Keep only recent patterns
                if len(self.patterns[field]) > 20:
                    self.patterns[field].pop(0)

    def _normalize_pattern(self, pattern: List[float]) -> List[float]:
        """Normalize pattern to 0-1 range"""
        min_val = min(pattern)
        max_val = max(pattern)

        if max_val - min_val == 0:
            return [0.5] * len(pattern)

        return [(x - min_val) / (max_val - min_val) for x in pattern]

    def _is_unique_pattern(self, pattern: List[float], field: str) -> bool:
        """Check if pattern is unique"""
        for existing in self.patterns[field]:
            similarity = self._calculate_similarity(pattern, existing)
            if similarity > 0.9:
                return False

        return True

    def _calculate_similarity(self, pattern1: List[float], pattern2: List[float]) -> float:
        """Calculate similarity between two patterns"""
        if len(pattern1) != len(pattern2):
            return 0.0

        # Normalize both patterns
        p1 = self._normalize_pattern(pattern1)
        p2 = self._normalize_pattern(pattern2)

        # Calculate Euclidean distance
        distance = np.sqrt(sum((a - b) ** 2 for a, b in zip(p1, p2)))

        # Convert to similarity (0-1)
        max_distance = np.sqrt(len(p1))
        similarity = 1.0 - (distance / max_distance)

        return max(0.0, min(1.0, similarity))


# ============================================================================
# Ensemble Detector
# ============================================================================

class EnsembleAnomalyDetector:
    """Ensemble of multiple anomaly detectors"""

    def __init__(self, detectors: List[Tuple[str, Any]], voting: str = "majority"):
        self.detectors = detectors
        self.voting = voting  # 'majority', 'unanimous', 'average'

    def detect(self, data: Dict[str, Any], field: Optional[str] = None) -> AnomalyScore:
        """Detect anomalies using ensemble"""
        results = []

        for name, detector in self.detectors:
            if hasattr(detector, 'detect'):
                if field:
                    result = detector.detect(data, field)
                else:
                    result = detector.detect(data)
                results.append(result)

        if not results:
            return AnomalyScore(
                is_anomaly=False,
                score=0.0,
                anomaly_type=AnomalyType.POINT,
                method="ensemble"
            )

        # Aggregate results
        if self.voting == "majority":
            is_anomaly = sum(r.is_anomaly for r in results) > len(results) / 2
            score = np.mean([r.score for r in results])
        elif self.voting == "unanimous":
            is_anomaly = all(r.is_anomaly for r in results)
            score = np.min([r.score for r in results])
        else:  # average
            scores = [r.score for r in results]
            score = np.mean(scores)
            is_anomaly = score > 0.7

        return AnomalyScore(
            is_anomaly=is_anomaly,
            score=score,
            anomaly_type=AnomalyType.POINT,
            method="ensemble",
            details={
                "individual_results": [
                    {"method": r.method, "is_anomaly": r.is_anomaly, "score": r.score}
                    for r in results
                ],
                "voting": self.voting
            }
        )


# ============================================================================
# Example Usage
# ============================================================================

if __name__ == "__main__":
    # Create detectors
    config = DetectorConfig(
        method="zscore",
        threshold=0.95,
        window_size=100,
        sensitivity=1.0
    )

    zscore_detector = ZScoreDetector(config)
    iqr_detector = IQRDetector(config)
    ma_detector = MovingAverageDetector(config)

    # Create ensemble
    ensemble = EnsembleAnomalyDetector([
        ("zscore", zscore_detector),
        ("iqr", iqr_detector),
        ("moving_average", ma_detector)
    ], voting="majority")

    # Generate sample data with anomaly
    for i in range(150):
        if i == 100:
            value = 1000  # Anomaly
        else:
            value = 50 + np.random.randn() * 5

        data = {"value": value, "timestamp": time.time()}

        result = ensemble.detect(data, "value")

        if result.is_anomaly:
            print(f"Anomaly detected at point {i}:")
            print(f"  Score: {result.score:.3f}")
            print(f"  Details: {result.details}")
