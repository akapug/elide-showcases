"""
Anomaly Detection Module

Implements multiple anomaly detection algorithms for real-time metrics analysis.
Uses statistical methods and machine learning techniques (conceptual).
"""

import json
import sys
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from math import sqrt


@dataclass
class DataPoint:
    """Represents a single data point with timestamp and value."""
    timestamp: int
    value: float


@dataclass
class Anomaly:
    """Represents a detected anomaly."""
    timestamp: int
    value: float
    expected_value: float
    deviation: float
    severity: str
    method: str
    confidence: float


class AnomalyDetector:
    """Base class for anomaly detection algorithms."""

    def __init__(self, name: str):
        self.name = name

    def detect(self, data: List[DataPoint]) -> List[Anomaly]:
        """Detect anomalies in the data."""
        raise NotImplementedError


class ZScoreDetector(AnomalyDetector):
    """
    Z-Score based anomaly detection.
    Detects points that deviate significantly from the mean.
    """

    def __init__(self, threshold: float = 3.0):
        super().__init__("Z-Score")
        self.threshold = threshold

    def detect(self, data: List[DataPoint]) -> List[Anomaly]:
        if len(data) < 3:
            return []

        values = [dp.value for dp in data]
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std_dev = sqrt(variance)

        if std_dev == 0:
            return []

        anomalies = []
        for dp in data:
            z_score = abs((dp.value - mean) / std_dev)
            if z_score > self.threshold:
                severity = self._calculate_severity(z_score)
                confidence = min(0.99, (z_score - self.threshold) / self.threshold)

                anomalies.append(Anomaly(
                    timestamp=dp.timestamp,
                    value=dp.value,
                    expected_value=mean,
                    deviation=dp.value - mean,
                    severity=severity,
                    method="Z-Score",
                    confidence=confidence
                ))

        return anomalies

    def _calculate_severity(self, z_score: float) -> str:
        if z_score > self.threshold * 1.5:
            return "high"
        elif z_score > self.threshold:
            return "medium"
        return "low"


class IQRDetector(AnomalyDetector):
    """
    Interquartile Range (IQR) based anomaly detection.
    Detects outliers using the IQR method.
    """

    def __init__(self, multiplier: float = 1.5):
        super().__init__("IQR")
        self.multiplier = multiplier

    def detect(self, data: List[DataPoint]) -> List[Anomaly]:
        if len(data) < 4:
            return []

        values = sorted([dp.value for dp in data])
        n = len(values)

        # Calculate Q1, Q2, Q3
        q1 = values[n // 4]
        q2 = values[n // 2]
        q3 = values[(3 * n) // 4]
        iqr = q3 - q1

        # Calculate bounds
        lower_bound = q1 - self.multiplier * iqr
        upper_bound = q3 + self.multiplier * iqr

        anomalies = []
        for dp in data:
            if dp.value < lower_bound or dp.value > upper_bound:
                expected = q2  # Use median as expected value
                deviation = dp.value - expected
                severity = self._calculate_severity(dp.value, lower_bound, upper_bound, iqr)
                confidence = self._calculate_confidence(dp.value, lower_bound, upper_bound, iqr)

                anomalies.append(Anomaly(
                    timestamp=dp.timestamp,
                    value=dp.value,
                    expected_value=expected,
                    deviation=deviation,
                    severity=severity,
                    method="IQR",
                    confidence=confidence
                ))

        return anomalies

    def _calculate_severity(self, value: float, lower: float, upper: float, iqr: float) -> str:
        if value < lower - iqr or value > upper + iqr:
            return "high"
        elif value < lower or value > upper:
            return "medium"
        return "low"

    def _calculate_confidence(self, value: float, lower: float, upper: float, iqr: float) -> float:
        if value < lower:
            return min(0.99, (lower - value) / iqr)
        elif value > upper:
            return min(0.99, (value - upper) / iqr)
        return 0.5


class MovingAverageDetector(AnomalyDetector):
    """
    Moving Average based anomaly detection.
    Detects points that deviate from the moving average.
    """

    def __init__(self, window_size: int = 10, threshold: float = 2.0):
        super().__init__("Moving Average")
        self.window_size = window_size
        self.threshold = threshold

    def detect(self, data: List[DataPoint]) -> List[Anomaly]:
        if len(data) < self.window_size:
            return []

        anomalies = []

        for i in range(self.window_size, len(data)):
            # Calculate moving average
            window = data[i - self.window_size:i]
            window_values = [dp.value for dp in window]
            ma = sum(window_values) / len(window_values)

            # Calculate standard deviation of window
            variance = sum((x - ma) ** 2 for x in window_values) / len(window_values)
            std_dev = sqrt(variance)

            if std_dev == 0:
                continue

            # Check if current point is anomalous
            current = data[i]
            deviation = current.value - ma
            z_score = abs(deviation / std_dev)

            if z_score > self.threshold:
                severity = self._calculate_severity(z_score)
                confidence = min(0.99, (z_score - self.threshold) / self.threshold)

                anomalies.append(Anomaly(
                    timestamp=current.timestamp,
                    value=current.value,
                    expected_value=ma,
                    deviation=deviation,
                    severity=severity,
                    method="Moving Average",
                    confidence=confidence
                ))

        return anomalies

    def _calculate_severity(self, z_score: float) -> str:
        if z_score > self.threshold * 1.5:
            return "high"
        elif z_score > self.threshold:
            return "medium"
        return "low"


class EnsembleDetector:
    """
    Ensemble anomaly detector that combines multiple detection methods.
    """

    def __init__(self, detectors: Optional[List[AnomalyDetector]] = None):
        if detectors is None:
            self.detectors = [
                ZScoreDetector(threshold=2.5),
                IQRDetector(multiplier=1.5),
                MovingAverageDetector(window_size=10, threshold=2.0)
            ]
        else:
            self.detectors = detectors

    def detect(self, data: List[DataPoint]) -> List[Dict]:
        """
        Detect anomalies using all detectors and combine results.
        Returns consolidated list of anomalies.
        """
        all_anomalies: Dict[int, List[Anomaly]] = {}

        # Run each detector
        for detector in self.detectors:
            anomalies = detector.detect(data)
            for anomaly in anomalies:
                if anomaly.timestamp not in all_anomalies:
                    all_anomalies[anomaly.timestamp] = []
                all_anomalies[anomaly.timestamp].append(anomaly)

        # Consolidate anomalies detected by multiple methods
        consolidated = []
        for timestamp, anomalies in all_anomalies.items():
            if len(anomalies) >= 2:  # Detected by at least 2 methods
                # Take the most severe
                most_severe = max(anomalies, key=lambda a: (
                    2 if a.severity == "high" else 1 if a.severity == "medium" else 0
                ))

                consolidated.append({
                    "timestamp": timestamp,
                    "value": most_severe.value,
                    "expected_value": most_severe.expected_value,
                    "deviation": most_severe.deviation,
                    "severity": most_severe.severity,
                    "methods": [a.method for a in anomalies],
                    "confidence": sum(a.confidence for a in anomalies) / len(anomalies)
                })

        return sorted(consolidated, key=lambda x: x["timestamp"])


def analyze_metrics(data: List[Dict]) -> Dict:
    """
    Analyze metrics data and detect anomalies.

    Args:
        data: List of metric data points with 'timestamp' and 'value' keys

    Returns:
        Dictionary with analysis results and detected anomalies
    """
    if not data:
        return {
            "status": "error",
            "message": "No data provided",
            "anomalies": []
        }

    # Convert to DataPoint objects
    data_points = [DataPoint(timestamp=d["timestamp"], value=d["value"]) for d in data]

    # Run ensemble detector
    detector = EnsembleDetector()
    anomalies = detector.detect(data_points)

    # Calculate statistics
    values = [dp.value for dp in data_points]
    mean = sum(values) / len(values)
    variance = sum((x - mean) ** 2 for x in values) / len(values)
    std_dev = sqrt(variance)

    return {
        "status": "success",
        "data_points": len(data_points),
        "anomalies_detected": len(anomalies),
        "statistics": {
            "mean": mean,
            "std_dev": std_dev,
            "min": min(values),
            "max": max(values)
        },
        "anomalies": anomalies
    }


def main():
    """Main entry point for command-line usage."""
    if len(sys.argv) > 1:
        # Read from file
        with open(sys.argv[1], 'r') as f:
            data = json.load(f)
    else:
        # Read from stdin
        data = json.load(sys.stdin)

    result = analyze_metrics(data)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()


# Example usage
def demo():
    """Demonstrate anomaly detection capabilities."""
    import random

    print("=" * 60)
    print("Anomaly Detection Demo")
    print("=" * 60)

    # Generate sample data with some anomalies
    base_time = 1000000
    data = []

    # Normal data
    for i in range(100):
        value = 50 + random.gauss(0, 5)  # Normal distribution around 50
        data.append({"timestamp": base_time + i * 1000, "value": value})

    # Inject anomalies
    data[20]["value"] = 100  # Spike
    data[50]["value"] = 10   # Dip
    data[80]["value"] = 95   # Another spike

    # Analyze
    result = analyze_metrics(data)

    print(f"\nAnalysis Results:")
    print(f"  Total data points: {result['data_points']}")
    print(f"  Anomalies detected: {result['anomalies_detected']}")
    print(f"\nStatistics:")
    print(f"  Mean: {result['statistics']['mean']:.2f}")
    print(f"  Std Dev: {result['statistics']['std_dev']:.2f}")
    print(f"  Min: {result['statistics']['min']:.2f}")
    print(f"  Max: {result['statistics']['max']:.2f}")

    if result['anomalies']:
        print(f"\nDetected Anomalies:")
        for anomaly in result['anomalies']:
            print(f"  - Timestamp: {anomaly['timestamp']}")
            print(f"    Value: {anomaly['value']:.2f} (expected: {anomaly['expected_value']:.2f})")
            print(f"    Severity: {anomaly['severity']}")
            print(f"    Methods: {', '.join(anomaly['methods'])}")
            print(f"    Confidence: {anomaly['confidence']:.2%}")
            print()


# Uncomment to run demo
# if __name__ == "__main__":
#     demo()
