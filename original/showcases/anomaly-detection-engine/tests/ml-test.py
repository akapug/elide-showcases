#!/usr/bin/env python3
"""
Unit tests for ML algorithms.
"""

import sys
import os
import pytest
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml'))

from isolation_forest import IsolationForestDetector
from lof import LOFDetector
from one_class_svm import OneClassSVMDetector
from timeseries import TimeSeriesDetector


class TestIsolationForest:
    """Test Isolation Forest detector."""

    def test_train(self):
        """Test training."""
        data = np.random.randn(1000, 10)
        detector = IsolationForestDetector(contamination=0.1)

        result = detector.train(data)

        assert result['status'] == 'success'
        assert result['algorithm'] == 'isolation_forest'
        assert result['n_samples'] == 1000
        assert result['n_features'] == 10
        assert 'training_time_ms' in result
        assert 'anomalies_detected' in result

    def test_predict(self):
        """Test prediction."""
        # Train on normal data
        normal_data = np.random.randn(1000, 10)
        detector = IsolationForestDetector(contamination=0.1)
        detector.train(normal_data)

        # Predict on new data
        test_data = np.random.randn(100, 10)
        result = detector.predict(test_data)

        assert result['status'] == 'success'
        assert result['n_samples'] == 100
        assert len(result['results']) == 100
        assert 'scoring_time_ms' in result

    def test_predict_anomalies(self):
        """Test that clear anomalies are detected."""
        # Train on normal data
        normal_data = np.random.randn(1000, 10)
        detector = IsolationForestDetector(contamination=0.1)
        detector.train(normal_data)

        # Test with clear anomalies
        anomaly_data = np.random.randn(10, 10) * 10 + 20  # Far from normal
        result = detector.predict(anomaly_data)

        # Should detect most as anomalies
        anomaly_count = sum(1 for r in result['results'] if r['is_anomaly'])
        assert anomaly_count > 5  # At least 50%


class TestLOF:
    """Test Local Outlier Factor detector."""

    def test_train(self):
        """Test training."""
        data = np.random.randn(1000, 10)
        detector = LOFDetector(contamination=0.1, novelty=True)

        result = detector.train(data)

        assert result['status'] == 'success'
        assert result['algorithm'] == 'local_outlier_factor'
        assert result['n_samples'] == 1000

    def test_predict(self):
        """Test prediction."""
        normal_data = np.random.randn(1000, 10)
        detector = LOFDetector(contamination=0.1, novelty=True)
        detector.train(normal_data)

        test_data = np.random.randn(100, 10)
        result = detector.predict(test_data)

        assert result['status'] == 'success'
        assert len(result['results']) == 100


class TestOneClassSVM:
    """Test One-Class SVM detector."""

    def test_train(self):
        """Test training."""
        data = np.random.randn(1000, 10)
        detector = OneClassSVMDetector(nu=0.1)

        result = detector.train(data)

        assert result['status'] == 'success'
        assert result['algorithm'] == 'one_class_svm'
        assert 'n_support_vectors' in result

    def test_predict(self):
        """Test prediction."""
        normal_data = np.random.randn(1000, 10)
        detector = OneClassSVMDetector(nu=0.1)
        detector.train(normal_data)

        test_data = np.random.randn(100, 10)
        result = detector.predict(test_data)

        assert result['status'] == 'success'
        assert len(result['results']) == 100


class TestTimeSeries:
    """Test time-series detector."""

    def test_train(self):
        """Test training."""
        # Generate time-series data
        t = np.linspace(0, 10, 1000)
        data = np.sin(t) + np.random.randn(1000) * 0.1

        detector = TimeSeriesDetector(window_size=50)
        result = detector.train(data)

        assert result['status'] == 'success'
        assert result['algorithm'] == 'timeseries'
        assert 'statistics' in result

    def test_predict(self):
        """Test prediction."""
        # Train on normal data
        t = np.linspace(0, 10, 1000)
        train_data = np.sin(t) + np.random.randn(1000) * 0.1

        detector = TimeSeriesDetector(window_size=50)
        detector.train(train_data)

        # Test data with some anomalies
        test_data = np.sin(t[:100]) + np.random.randn(100) * 0.1
        test_data[50] = 10  # Clear anomaly

        result = detector.predict(test_data)

        assert result['status'] == 'success'
        assert len(result['results']) == 100

        # Check that anomaly at index 50 was detected
        assert result['results'][50]['is_anomaly'] == True


class TestPerformance:
    """Test performance requirements."""

    def test_scoring_latency(self):
        """Test that scoring meets <100ms requirement."""
        # Train model
        normal_data = np.random.randn(1000, 10)
        detector = IsolationForestDetector(contamination=0.1)
        detector.train(normal_data)

        # Test single prediction latency
        test_data = np.random.randn(1, 10)
        result = detector.predict(test_data)

        # Should be well under 100ms
        assert result['avg_time_per_sample_ms'] < 100

    def test_batch_efficiency(self):
        """Test batch processing efficiency."""
        normal_data = np.random.randn(1000, 10)
        detector = IsolationForestDetector(contamination=0.1)
        detector.train(normal_data)

        # Batch prediction
        test_data = np.random.randn(100, 10)
        result = detector.predict(test_data)

        # Average time per sample should be low in batch
        assert result['avg_time_per_sample_ms'] < 10


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--color=yes'])
