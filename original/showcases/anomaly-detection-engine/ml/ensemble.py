#!/usr/bin/env python3
"""
Ensemble anomaly detection combining multiple algorithms.
"""

import sys
import json
import numpy as np
from typing import Dict, List, Any, Optional
import joblib
import os


class EnsembleDetector:
    """
    Ensemble detector combining multiple algorithms.

    Strategies:
    - Voting: Anomaly if majority of detectors agree
    - Average: Average anomaly scores across detectors
    - Max: Use maximum anomaly score
    """

    def __init__(
        self,
        detectors: Optional[List] = None,
        strategy: str = 'voting',
        threshold: float = 0.5
    ):
        self.detectors = detectors or []
        self.strategy = strategy
        self.threshold = threshold
        self.detector_weights = None

    def add_detector(self, detector: Any, weight: float = 1.0):
        """Add a detector to the ensemble."""
        self.detectors.append(detector)
        if self.detector_weights is None:
            self.detector_weights = [weight]
        else:
            self.detector_weights.append(weight)

    def train(self, data: np.ndarray) -> Dict[str, Any]:
        """Train all detectors in the ensemble."""
        if not self.detectors:
            return {'status': 'error', 'message': 'No detectors in ensemble'}

        start_time = self._time_ms()
        results = []

        for i, detector in enumerate(self.detectors):
            detector_result = detector.train(data)
            results.append({
                'detector_index': i,
                'algorithm': detector_result.get('algorithm', 'unknown'),
                'training_time_ms': detector_result.get('training_time_ms', 0),
                'anomalies_detected': detector_result.get('anomalies_detected', 0)
            })

        training_time = self._time_ms() - start_time

        # Normalize weights
        if self.detector_weights:
            total_weight = sum(self.detector_weights)
            self.detector_weights = [w / total_weight for w in self.detector_weights]

        return {
            'status': 'success',
            'algorithm': 'ensemble',
            'n_detectors': len(self.detectors),
            'strategy': self.strategy,
            'n_samples': len(data),
            'n_features': data.shape[1] if data.ndim > 1 else 1,
            'training_time_ms': training_time,
            'detector_results': results,
            'weights': self.detector_weights
        }

    def predict(self, data: np.ndarray) -> Dict[str, Any]:
        """Predict anomalies using ensemble."""
        if not self.detectors:
            return {'status': 'error', 'message': 'No detectors in ensemble'}

        start_time = self._time_ms()

        # Reshape if single sample
        if data.ndim == 1:
            data = data.reshape(1, -1)

        # Get predictions from all detectors
        all_predictions = []
        all_scores = []

        for detector in self.detectors:
            result = detector.predict(data)
            if result['status'] != 'success':
                continue

            predictions = [r['is_anomaly'] for r in result['results']]
            scores = [r['anomaly_score'] for r in result['results']]

            all_predictions.append(predictions)
            all_scores.append(scores)

        # Combine predictions based on strategy
        combined_results = self._combine_predictions(all_predictions, all_scores)

        scoring_time = self._time_ms() - start_time

        return {
            'status': 'success',
            'algorithm': 'ensemble',
            'strategy': self.strategy,
            'n_samples': len(data),
            'n_detectors': len(self.detectors),
            'scoring_time_ms': scoring_time,
            'avg_time_per_sample_ms': scoring_time / len(data),
            'results': combined_results,
            'summary': {
                'total_anomalies': int(np.sum([r['is_anomaly'] for r in combined_results])),
                'anomaly_rate': float(np.mean([r['is_anomaly'] for r in combined_results])),
                'mean_confidence': float(np.mean([r['confidence'] for r in combined_results]))
            }
        }

    def _combine_predictions(
        self,
        all_predictions: List[List[bool]],
        all_scores: List[List[float]]
    ) -> List[Dict[str, Any]]:
        """Combine predictions from multiple detectors."""
        n_samples = len(all_predictions[0])
        n_detectors = len(all_predictions)

        results = []

        for i in range(n_samples):
            sample_predictions = [preds[i] for preds in all_predictions]
            sample_scores = [scores[i] for scores in all_scores]

            if self.strategy == 'voting':
                # Weighted voting
                weighted_votes = sum(
                    pred * weight
                    for pred, weight in zip(sample_predictions, self.detector_weights)
                )
                is_anomaly = weighted_votes > self.threshold
                confidence = weighted_votes

            elif self.strategy == 'average':
                # Weighted average of scores
                weighted_score = sum(
                    score * weight
                    for score, weight in zip(sample_scores, self.detector_weights)
                )
                is_anomaly = abs(weighted_score) > self.threshold
                confidence = abs(weighted_score)

            elif self.strategy == 'max':
                # Maximum score
                max_score = max(sample_scores)
                is_anomaly = abs(max_score) > self.threshold
                confidence = abs(max_score)

            else:
                # Default to voting
                is_anomaly = sum(sample_predictions) > len(sample_predictions) / 2
                confidence = sum(sample_predictions) / len(sample_predictions)

            results.append({
                'index': i,
                'is_anomaly': bool(is_anomaly),
                'confidence': float(confidence),
                'detector_votes': sample_predictions,
                'detector_scores': sample_scores,
                'agreement': float(sum(sample_predictions) / n_detectors)
            })

        return results

    def save(self, path: str) -> bool:
        """Save ensemble to disk."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({
            'detectors': self.detectors,
            'strategy': self.strategy,
            'threshold': self.threshold,
            'detector_weights': self.detector_weights
        }, path)
        return True

    def load(self, path: str) -> bool:
        """Load ensemble from disk."""
        if not os.path.exists(path):
            return False

        data = joblib.load(path)
        self.detectors = data['detectors']
        self.strategy = data['strategy']
        self.threshold = data['threshold']
        self.detector_weights = data['detector_weights']
        return True

    @staticmethod
    def _time_ms() -> float:
        """Get current time in milliseconds."""
        import time
        return time.time() * 1000


def main():
    """Main entry point for CLI usage."""
    print(json.dumps({
        'status': 'info',
        'message': 'Ensemble detector is used programmatically, not via CLI'
    }))


if __name__ == '__main__':
    main()
