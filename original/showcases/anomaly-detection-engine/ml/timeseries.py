#!/usr/bin/env python3
"""
Time-series specific anomaly detection.
Statistical and ML-based methods for temporal data.
"""

import sys
import json
import numpy as np
from scipy import stats
from sklearn.ensemble import IsolationForest
from typing import Dict, List, Any, Optional, Tuple
import joblib
import os


class TimeSeriesDetector:
    """
    Time-series anomaly detector combining multiple methods.

    Methods:
    - Statistical (Z-score, Modified Z-score)
    - Exponential Moving Average (EMA) deviation
    - Seasonal decomposition
    - Isolation Forest on features
    """

    def __init__(
        self,
        window_size: int = 50,
        z_threshold: float = 3.0,
        ema_alpha: float = 0.2,
        contamination: float = 0.1
    ):
        self.window_size = window_size
        self.z_threshold = z_threshold
        self.ema_alpha = ema_alpha
        self.contamination = contamination
        self.model = None
        self.statistics = {}

    def train(self, data: np.ndarray, timestamps: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Train the time-series model."""
        start_time = self._time_ms()

        # Calculate baseline statistics
        self.statistics = {
            'mean': float(np.mean(data)),
            'std': float(np.std(data)),
            'median': float(np.median(data)),
            'mad': float(np.median(np.abs(data - np.median(data)))),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'q25': float(np.percentile(data, 25)),
            'q75': float(np.percentile(data, 75))
        }

        # Extract time-series features
        features = self._extract_features(data)

        # Train Isolation Forest on features
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(features)

        training_time = self._time_ms() - start_time

        # Detect anomalies in training data
        predictions = self._detect_combined(data)

        return {
            'status': 'success',
            'algorithm': 'timeseries',
            'n_samples': len(data),
            'training_time_ms': training_time,
            'window_size': self.window_size,
            'statistics': self.statistics,
            'anomalies_detected': int(np.sum([p['is_anomaly'] for p in predictions])),
            'methods': ['z_score', 'modified_z_score', 'ema_deviation', 'isolation_forest']
        }

    def predict(self, data: np.ndarray, timestamps: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Predict anomalies in time-series data."""
        if not self.statistics:
            return {'status': 'error', 'message': 'Model not trained'}

        start_time = self._time_ms()

        # Reshape if single value
        if np.isscalar(data):
            data = np.array([data])

        predictions = self._detect_combined(data)
        scoring_time = self._time_ms() - start_time

        return {
            'status': 'success',
            'algorithm': 'timeseries',
            'n_samples': len(data),
            'scoring_time_ms': scoring_time,
            'avg_time_per_sample_ms': scoring_time / len(data),
            'results': predictions,
            'summary': {
                'total_anomalies': int(np.sum([p['is_anomaly'] for p in predictions])),
                'anomaly_rate': float(np.mean([p['is_anomaly'] for p in predictions])),
                'methods_triggered': self._count_method_triggers(predictions)
            }
        }

    def _detect_combined(self, data: np.ndarray) -> List[Dict[str, Any]]:
        """Detect anomalies using multiple methods."""
        results = []

        # Z-score detection
        z_scores = self._z_score(data)

        # Modified Z-score detection
        modified_z_scores = self._modified_z_score(data)

        # EMA deviation detection
        ema_deviations = self._ema_deviation(data)

        # Isolation Forest (if enough samples)
        if len(data) >= self.window_size and self.model is not None:
            features = self._extract_features(data)
            if_scores = self.model.decision_function(features)
            if_predictions = self.model.predict(features)
        else:
            if_scores = np.zeros(len(data))
            if_predictions = np.ones(len(data))

        # Combine methods
        for i in range(len(data)):
            methods = {
                'z_score': abs(z_scores[i]) > self.z_threshold,
                'modified_z_score': abs(modified_z_scores[i]) > self.z_threshold,
                'ema_deviation': ema_deviations[i],
                'isolation_forest': if_predictions[i] == -1
            }

            # Anomaly if any method triggers
            is_anomaly = any(methods.values())

            # Calculate confidence based on number of methods that agree
            confidence = sum(methods.values()) / len(methods)

            results.append({
                'index': i,
                'value': float(data[i]),
                'is_anomaly': is_anomaly,
                'confidence': confidence,
                'methods': methods,
                'scores': {
                    'z_score': float(z_scores[i]),
                    'modified_z_score': float(modified_z_scores[i]),
                    'ema_deviation': float(abs(data[i] - self._calculate_ema(data[:i+1])[-1]) if i > 0 else 0),
                    'isolation_forest': float(if_scores[i])
                }
            })

        return results

    def _extract_features(self, data: np.ndarray) -> np.ndarray:
        """Extract time-series features."""
        features = []

        for i in range(len(data)):
            # Use available history up to window_size
            window_start = max(0, i - self.window_size + 1)
            window = data[window_start:i+1]

            feature_vec = [
                data[i],  # Current value
                np.mean(window),  # Window mean
                np.std(window) if len(window) > 1 else 0,  # Window std
                np.max(window) - np.min(window),  # Range
                data[i] - np.mean(window),  # Deviation from mean
            ]

            # Add rate of change if we have history
            if i > 0:
                feature_vec.append(data[i] - data[i-1])
            else:
                feature_vec.append(0)

            features.append(feature_vec)

        return np.array(features)

    def _z_score(self, data: np.ndarray) -> np.ndarray:
        """Calculate Z-scores."""
        mean = self.statistics['mean']
        std = self.statistics['std']
        return (data - mean) / (std if std > 0 else 1)

    def _modified_z_score(self, data: np.ndarray) -> np.ndarray:
        """Calculate modified Z-scores using MAD."""
        median = self.statistics['median']
        mad = self.statistics['mad']
        return 0.6745 * (data - median) / (mad if mad > 0 else 1)

    def _ema_deviation(self, data: np.ndarray) -> np.ndarray:
        """Detect deviations from EMA."""
        ema = self._calculate_ema(data)
        deviations = np.abs(data - ema)
        threshold = self.statistics['std'] * self.z_threshold
        return deviations > threshold

    def _calculate_ema(self, data: np.ndarray) -> np.ndarray:
        """Calculate Exponential Moving Average."""
        ema = np.zeros(len(data))
        ema[0] = data[0]

        for i in range(1, len(data)):
            ema[i] = self.ema_alpha * data[i] + (1 - self.ema_alpha) * ema[i-1]

        return ema

    def _count_method_triggers(self, predictions: List[Dict[str, Any]]) -> Dict[str, int]:
        """Count how many times each method triggered."""
        counts = {'z_score': 0, 'modified_z_score': 0, 'ema_deviation': 0, 'isolation_forest': 0}

        for pred in predictions:
            for method, triggered in pred['methods'].items():
                if triggered:
                    counts[method] += 1

        return counts

    def save(self, path: str) -> bool:
        """Save model to disk."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'statistics': self.statistics,
            'window_size': self.window_size,
            'z_threshold': self.z_threshold,
            'ema_alpha': self.ema_alpha,
            'contamination': self.contamination
        }, path)
        return True

    def load(self, path: str) -> bool:
        """Load model from disk."""
        if not os.path.exists(path):
            return False

        data = joblib.load(path)
        self.model = data['model']
        self.statistics = data['statistics']
        self.window_size = data['window_size']
        self.z_threshold = data['z_threshold']
        self.ema_alpha = data['ema_alpha']
        self.contamination = data['contamination']
        return True

    @staticmethod
    def _time_ms() -> float:
        """Get current time in milliseconds."""
        import time
        return time.time() * 1000


def main():
    """Main entry point for CLI usage."""
    if len(sys.argv) < 2:
        print(json.dumps({'status': 'error', 'message': 'Missing command'}))
        sys.exit(1)

    command = sys.argv[1]
    detector = TimeSeriesDetector()

    try:
        if command == 'train':
            input_data = json.loads(sys.stdin.read())
            data = np.array(input_data['data'])

            if 'window_size' in input_data:
                detector.window_size = input_data['window_size']
            if 'z_threshold' in input_data:
                detector.z_threshold = input_data['z_threshold']
            if 'contamination' in input_data:
                detector.contamination = input_data['contamination']

            timestamps = np.array(input_data['timestamps']) if 'timestamps' in input_data else None
            result = detector.train(data, timestamps)

            if 'model_path' in input_data:
                detector.save(input_data['model_path'])
                result['model_saved'] = True

            print(json.dumps(result))

        elif command == 'predict':
            input_data = json.loads(sys.stdin.read())

            if 'model_path' in input_data:
                if not detector.load(input_data['model_path']):
                    print(json.dumps({
                        'status': 'error',
                        'message': 'Failed to load model'
                    }))
                    sys.exit(1)

            data = np.array(input_data['data'])
            timestamps = np.array(input_data['timestamps']) if 'timestamps' in input_data else None
            result = detector.predict(data, timestamps)
            print(json.dumps(result))

        else:
            print(json.dumps({
                'status': 'error',
                'message': f'Unknown command: {command}'
            }))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({
            'status': 'error',
            'message': str(e),
            'type': type(e).__name__
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
