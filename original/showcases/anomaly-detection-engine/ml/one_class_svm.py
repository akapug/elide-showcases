#!/usr/bin/env python3
"""
One-Class SVM anomaly detector.
Learns a decision boundary around normal data.
"""

import sys
import json
import numpy as np
from sklearn.svm import OneClassSVM
from typing import Dict, List, Any
import joblib
import os


class OneClassSVMDetector:
    """
    One-Class SVM detector.

    Ideal for:
    - High-dimensional feature spaces
    - Non-linear decision boundaries
    - Small training sets with clean normal data
    """

    def __init__(
        self,
        kernel: str = 'rbf',
        gamma: str | float = 'scale',
        nu: float = 0.1,
        max_iter: int = -1
    ):
        self.kernel = kernel
        self.gamma = gamma
        self.nu = nu
        self.max_iter = max_iter
        self.model = None

    def train(self, data: np.ndarray) -> Dict[str, Any]:
        """Train the One-Class SVM model."""
        start_time = self._time_ms()

        self.model = OneClassSVM(
            kernel=self.kernel,
            gamma=self.gamma,
            nu=self.nu,
            max_iter=self.max_iter
        )

        self.model.fit(data)
        training_time = self._time_ms() - start_time

        # Calculate scores and predictions on training data
        predictions = self.model.predict(data)
        scores = self.model.decision_function(data)

        return {
            'status': 'success',
            'algorithm': 'one_class_svm',
            'n_samples': len(data),
            'n_features': data.shape[1],
            'training_time_ms': training_time,
            'kernel': self.kernel,
            'nu': self.nu,
            'gamma': str(self.gamma),
            'n_support_vectors': int(self.model.n_support_[0]),
            'support_vector_ratio': float(self.model.n_support_[0] / len(data)),
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
            'algorithm': 'one_class_svm',
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
            'kernel': self.kernel,
            'gamma': self.gamma,
            'nu': self.nu
        }, path)
        return True

    def load(self, path: str) -> bool:
        """Load model from disk."""
        if not os.path.exists(path):
            return False

        data = joblib.load(path)
        self.model = data['model']
        self.kernel = data['kernel']
        self.gamma = data['gamma']
        self.nu = data['nu']
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
    detector = OneClassSVMDetector()

    try:
        if command == 'train':
            input_data = json.loads(sys.stdin.read())
            data = np.array(input_data['data'])

            if 'kernel' in input_data:
                detector.kernel = input_data['kernel']
            if 'nu' in input_data:
                detector.nu = input_data['nu']
            if 'gamma' in input_data:
                detector.gamma = input_data['gamma']

            result = detector.train(data)

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
