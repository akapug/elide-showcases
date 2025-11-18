#!/usr/bin/env python3
"""
Model training pipeline for anomaly detection.
Supports batch training, validation, and model persistence.
"""

import sys
import json
import numpy as np
import argparse
from pathlib import Path
from typing import Dict, Any, List, Tuple
import joblib

# Import detectors
from isolation_forest import IsolationForestDetector
from lof import LOFDetector
from one_class_svm import OneClassSVMDetector
from timeseries import TimeSeriesDetector


class TrainingPipeline:
    """
    Training pipeline for anomaly detection models.
    """

    def __init__(self, output_dir: str = './models'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def train_all_algorithms(
        self,
        data: np.ndarray,
        contamination: float = 0.1,
        validation_split: float = 0.2
    ) -> Dict[str, Any]:
        """Train all available algorithms."""

        # Split data into train and validation
        split_idx = int(len(data) * (1 - validation_split))
        train_data = data[:split_idx]
        val_data = data[split_idx:]

        print(f"Training on {len(train_data)} samples, validating on {len(val_data)} samples")

        results = {}

        # Train Isolation Forest
        print("\nTraining Isolation Forest...")
        if_detector = IsolationForestDetector(contamination=contamination)
        if_result = if_detector.train(train_data)
        if_detector.save(str(self.output_dir / 'isolation_forest.joblib'))

        # Validate
        if_val = if_detector.predict(val_data)
        if_result['validation'] = {
            'anomaly_rate': if_val['summary']['anomaly_rate'],
            'mean_score': if_val['summary']['mean_score']
        }
        results['isolation_forest'] = if_result

        # Train LOF
        print("\nTraining Local Outlier Factor...")
        lof_detector = LOFDetector(contamination=contamination, novelty=True)
        lof_result = lof_detector.train(train_data)
        lof_detector.save(str(self.output_dir / 'lof.joblib'))

        lof_val = lof_detector.predict(val_data)
        lof_result['validation'] = {
            'anomaly_rate': lof_val['summary']['anomaly_rate'],
            'mean_score': lof_val['summary']['mean_score']
        }
        results['lof'] = lof_result

        # Train One-Class SVM
        print("\nTraining One-Class SVM...")
        svm_detector = OneClassSVMDetector(nu=contamination)
        svm_result = svm_detector.train(train_data)
        svm_detector.save(str(self.output_dir / 'one_class_svm.joblib'))

        svm_val = svm_detector.predict(val_data)
        svm_result['validation'] = {
            'anomaly_rate': svm_val['summary']['anomaly_rate'],
            'mean_score': svm_val['summary']['mean_score']
        }
        results['one_class_svm'] = svm_result

        # Train Time-Series (if 1D data)
        if train_data.ndim == 1 or train_data.shape[1] == 1:
            print("\nTraining Time-Series Detector...")
            ts_data = train_data.flatten()
            ts_detector = TimeSeriesDetector(contamination=contamination)
            ts_result = ts_detector.train(ts_data)
            ts_detector.save(str(self.output_dir / 'timeseries.joblib'))

            ts_val = ts_detector.predict(val_data.flatten())
            ts_result['validation'] = {
                'anomaly_rate': ts_val['summary']['anomaly_rate']
            }
            results['timeseries'] = ts_result

        return {
            'status': 'success',
            'output_dir': str(self.output_dir),
            'n_train_samples': len(train_data),
            'n_val_samples': len(val_data),
            'contamination': contamination,
            'results': results
        }

    def train_single(
        self,
        algorithm: str,
        data: np.ndarray,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Train a single algorithm."""

        if algorithm == 'isolation_forest':
            detector = IsolationForestDetector(**config)
        elif algorithm == 'lof':
            detector = LOFDetector(**config)
        elif algorithm == 'one_class_svm':
            detector = OneClassSVMDetector(**config)
        elif algorithm == 'timeseries':
            detector = TimeSeriesDetector(**config)
        else:
            return {'status': 'error', 'message': f'Unknown algorithm: {algorithm}'}

        result = detector.train(data)

        # Save model
        model_path = self.output_dir / f'{algorithm}.joblib'
        detector.save(str(model_path))
        result['model_path'] = str(model_path)

        return result

    def generate_synthetic_data(
        self,
        n_samples: int = 1000,
        n_features: int = 10,
        contamination: float = 0.1
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic data with anomalies."""

        # Normal data from multivariate normal distribution
        n_normal = int(n_samples * (1 - contamination))
        n_anomalies = n_samples - n_normal

        normal_data = np.random.randn(n_normal, n_features)

        # Anomalies from different distribution
        anomaly_data = np.random.randn(n_anomalies, n_features) * 3 + 5

        # Combine and shuffle
        data = np.vstack([normal_data, anomaly_data])
        labels = np.array([0] * n_normal + [1] * n_anomalies)

        # Shuffle
        indices = np.random.permutation(n_samples)
        data = data[indices]
        labels = labels[indices]

        return data, labels


def main():
    parser = argparse.ArgumentParser(description='Train anomaly detection models')
    parser.add_argument('--algorithm', type=str, default='all',
                      choices=['all', 'isolation_forest', 'lof', 'one_class_svm', 'timeseries'],
                      help='Algorithm to train')
    parser.add_argument('--data', type=str, help='Path to training data (numpy array)')
    parser.add_argument('--synthetic', action='store_true', help='Generate synthetic data')
    parser.add_argument('--n-samples', type=int, default=1000, help='Number of synthetic samples')
    parser.add_argument('--n-features', type=int, default=10, help='Number of features')
    parser.add_argument('--contamination', type=float, default=0.1, help='Contamination rate')
    parser.add_argument('--output-dir', type=str, default='./models', help='Output directory')

    args = parser.parse_args()

    pipeline = TrainingPipeline(output_dir=args.output_dir)

    # Load or generate data
    if args.synthetic:
        print(f"Generating synthetic data: {args.n_samples} samples, {args.n_features} features")
        data, labels = pipeline.generate_synthetic_data(
            n_samples=args.n_samples,
            n_features=args.n_features,
            contamination=args.contamination
        )
    elif args.data:
        print(f"Loading data from {args.data}")
        data = np.load(args.data)
        labels = None
    else:
        print("Error: Either --synthetic or --data must be specified")
        sys.exit(1)

    # Train
    if args.algorithm == 'all':
        results = pipeline.train_all_algorithms(data, contamination=args.contamination)
    else:
        config = {'contamination': args.contamination}
        if args.algorithm == 'lof':
            config['novelty'] = True
        if args.algorithm == 'one_class_svm':
            config['nu'] = args.contamination

        results = pipeline.train_single(args.algorithm, data, config)

    # Print results
    print("\n" + "="*80)
    print("TRAINING RESULTS")
    print("="*80)
    print(json.dumps(results, indent=2))
    print("="*80)


if __name__ == '__main__':
    main()
