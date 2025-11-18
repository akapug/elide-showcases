#!/usr/bin/env python3
"""
Isolation Forest anomaly detector.
Fast, scalable anomaly detection using isolation trees.
"""

import sys
import json
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, List, Any, Tuple
import joblib
import os


class IsolationForestDetector:
    """
    Isolation Forest-based anomaly detector.

    Ideal for:
    - High-dimensional data
    - Fast training and scoring
    - No assumptions about data distribution
    """

    def __init__(
        self,
        contamination: float = 0.1,
        n_estimators: int = 100,
        max_samples: int | str = 'auto',
        random_state: int = 42
    ):
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.random_state = random_state
        self.model = None

    def train(self, data: np.ndarray) -> Dict[str, Any]:
        """Train the Isolation Forest model."""
        start_time = self._time_ms()

        self.model = IsolationForest(
            contamination=self.contamination,
            n_estimators=self.n_estimators,
            max_samples=self.max_samples,
            random_state=self.random_state,
            n_jobs=-1  # Use all CPU cores
        )

        self.model.fit(data)
        training_time = self._time_ms() - start_time

        # Calculate anomaly scores on training data
        scores = self.model.decision_function(data)
        predictions = self.model.predict(data)

        return {
            'status': 'success',
            'algorithm': 'isolation_forest',
            'n_samples': len(data),
            'n_features': data.shape[1],
            'training_time_ms': training_time,
            'contamination': self.contamination,
            'n_estimators': self.n_estimators,
            'anomalies_detected': int(np.sum(predictions == -1)),
            'score_stats': {
                'mean': float(np.mean(scores)),
                'std': float(np.std(scores)),
                'min': float(np.min(scores)),
                'max': float(np.max(scores))
            }
        }

    def predict(self, data: np.ndarray) -> Dict[str, Any]:
        """Predict anomalies in new data."""
        if self.model is None:
            return {'status': 'error', 'message': 'Model not trained'}

        start_time = self._time_ms()

        # Reshape if single sample
        if data.ndim == 1:
            data = data.reshape(1, -1)

        # Get predictions and scores
        predictions = self.model.predict(data)
        scores = self.model.decision_function(data)

        scoring_time = self._time_ms() - start_time

        results = []
        for i, (pred, score) in enumerate(zip(predictions, scores)):
            results.append({
                'index': i,
                'is_anomaly': bool(pred == -1),
                'anomaly_score': float(score),
                'confidence': float(abs(score))
            })

        return {
            'status': 'success',
            'algorithm': 'isolation_forest',
            'n_samples': len(data),
            'scoring_time_ms': scoring_time,
            'avg_time_per_sample_ms': scoring_time / len(data),
            'results': results,
            'summary': {
                'total_anomalies': int(np.sum(predictions == -1)),
                'anomaly_rate': float(np.mean(predictions == -1)),
                'mean_score': float(np.mean(scores)),
                'min_score': float(np.min(scores)),
                'max_score': float(np.max(scores))
            }
        }

    def save(self, path: str) -> bool:
        """Save model to disk."""
        if self.model is None:
            return False

        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'contamination': self.contamination,
            'n_estimators': self.n_estimators,
            'max_samples': self.max_samples
        }, path)
        return True

    def load(self, path: str) -> bool:
        """Load model from disk."""
        if not os.path.exists(path):
            return False

        data = joblib.load(path)
        self.model = data['model']
        self.contamination = data['contamination']
        self.n_estimators = data['n_estimators']
        self.max_samples = data['max_samples']
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
    detector = IsolationForestDetector()

    try:
        if command == 'train':
            # Read training data from stdin
            input_data = json.loads(sys.stdin.read())
            data = np.array(input_data['data'])

            # Override defaults if provided
            if 'contamination' in input_data:
                detector.contamination = input_data['contamination']
            if 'n_estimators' in input_data:
                detector.n_estimators = input_data['n_estimators']

            result = detector.train(data)

            # Save model if path provided
            if 'model_path' in input_data:
                detector.save(input_data['model_path'])
                result['model_saved'] = True

            print(json.dumps(result))

        elif command == 'predict':
            # Read prediction data from stdin
            input_data = json.loads(sys.stdin.read())

            # Load model
            if 'model_path' in input_data:
                if not detector.load(input_data['model_path']):
                    print(json.dumps({
                        'status': 'error',
                        'message': 'Failed to load model'
                    }))
                    sys.exit(1)

            data = np.array(input_data['data'])
            result = detector.predict(data)
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
