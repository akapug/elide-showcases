#!/usr/bin/env python3
"""
Local Outlier Factor (LOF) anomaly detector.
Density-based outlier detection for local anomalies.
"""

import sys
import json
import numpy as np
from sklearn.neighbors import LocalOutlierFactor
from typing import Dict, List, Any
import joblib
import os


class LOFDetector:
    """
    Local Outlier Factor detector.

    Ideal for:
    - Detecting local anomalies
    - Density-based detection
    - Clusters with varying densities
    """

    def __init__(
        self,
        n_neighbors: int = 20,
        contamination: float = 0.1,
        metric: str = 'minkowski',
        novelty: bool = True
    ):
        self.n_neighbors = n_neighbors
        self.contamination = contamination
        self.metric = metric
        self.novelty = novelty
        self.model = None

    def train(self, data: np.ndarray) -> Dict[str, Any]:
        """Train the LOF model."""
        start_time = self._time_ms()

        self.model = LocalOutlierFactor(
            n_neighbors=self.n_neighbors,
            contamination=self.contamination,
            metric=self.metric,
            novelty=self.novelty,
            n_jobs=-1
        )

        if self.novelty:
            # Novelty detection mode - fit only
            self.model.fit(data)
            predictions = None
            scores = None
        else:
            # Outlier detection mode - fit and predict
            predictions = self.model.fit_predict(data)
            scores = self.model.negative_outlier_factor_

        training_time = self._time_ms() - start_time

        result = {
            'status': 'success',
            'algorithm': 'local_outlier_factor',
            'n_samples': len(data),
            'n_features': data.shape[1],
            'training_time_ms': training_time,
            'contamination': self.contamination,
            'n_neighbors': self.n_neighbors,
            'mode': 'novelty' if self.novelty else 'outlier'
        }

        if not self.novelty:
            result['anomalies_detected'] = int(np.sum(predictions == -1))
            result['score_stats'] = {
                'mean': float(np.mean(scores)),
                'std': float(np.std(scores)),
                'min': float(np.min(scores)),
                'max': float(np.max(scores))
            }

        return result

    def predict(self, data: np.ndarray) -> Dict[str, Any]:
        """Predict anomalies in new data."""
        if self.model is None:
            return {'status': 'error', 'message': 'Model not trained'}

        if not self.novelty:
            return {
                'status': 'error',
                'message': 'LOF in outlier mode cannot predict on new data'
            }

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
            'algorithm': 'local_outlier_factor',
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
            'n_neighbors': self.n_neighbors,
            'contamination': self.contamination,
            'metric': self.metric,
            'novelty': self.novelty
        }, path)
        return True

    def load(self, path: str) -> bool:
        """Load model from disk."""
        if not os.path.exists(path):
            return False

        data = joblib.load(path)
        self.model = data['model']
        self.n_neighbors = data['n_neighbors']
        self.contamination = data['contamination']
        self.metric = data['metric']
        self.novelty = data['novelty']
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
    detector = LOFDetector()

    try:
        if command == 'train':
            input_data = json.loads(sys.stdin.read())
            data = np.array(input_data['data'])

            if 'n_neighbors' in input_data:
                detector.n_neighbors = input_data['n_neighbors']
            if 'contamination' in input_data:
                detector.contamination = input_data['contamination']
            if 'novelty' in input_data:
                detector.novelty = input_data['novelty']

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
