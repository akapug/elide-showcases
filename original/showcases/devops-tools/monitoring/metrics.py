#!/usr/bin/env python3
"""
Metrics Analytics - Python Component

Advanced metrics analysis and anomaly detection using Python.
Receives metrics from the TypeScript monitoring agent and performs:
- Statistical analysis
- Trend detection
- Anomaly detection
- Predictive analytics
"""

import sys
import json
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict, deque
import statistics


# ============================================================================
# Data Classes
# ============================================================================

class MetricValue:
    """Represents a single metric value"""

    def __init__(self, data: Dict[str, Any]):
        self.timestamp = datetime.fromisoformat(
            data['timestamp'].replace('Z', '+00:00')
        )
        self.value = float(data['value'])
        self.unit = data.get('unit', '')
        self.labels = data.get('labels', {})

    def __repr__(self):
        return f"MetricValue({self.value} {self.unit} @ {self.timestamp})"


class Metric:
    """Represents a metric with its values"""

    def __init__(self, data: Dict[str, Any]):
        self.name = data['name']
        self.type = data['type']
        self.values = [MetricValue(v) for v in data.get('values', [])]

    def get_latest(self) -> Optional[MetricValue]:
        """Get the latest value"""
        return self.values[-1] if self.values else None

    def get_values_in_range(
        self, start: datetime, end: datetime
    ) -> List[MetricValue]:
        """Get values within a time range"""
        return [
            v for v in self.values
            if start <= v.timestamp <= end
        ]

    def __repr__(self):
        return f"Metric({self.name}, {len(self.values)} values)"


# ============================================================================
# Statistical Analyzer
# ============================================================================

class StatisticalAnalyzer:
    """Performs statistical analysis on metrics"""

    def __init__(self):
        pass

    def analyze_metric(self, metric: Metric) -> Dict[str, Any]:
        """Perform comprehensive statistical analysis on a metric"""
        if not metric.values:
            return {'error': 'No values to analyze'}

        values = [v.value for v in metric.values]

        return {
            'count': len(values),
            'mean': statistics.mean(values),
            'median': statistics.median(values),
            'stdev': statistics.stdev(values) if len(values) > 1 else 0,
            'min': min(values),
            'max': max(values),
            'range': max(values) - min(values),
            'variance': statistics.variance(values) if len(values) > 1 else 0,
            'quartiles': self.calculate_quartiles(values),
            'outliers': self.detect_outliers(values),
        }

    def calculate_quartiles(self, values: List[float]) -> Dict[str, float]:
        """Calculate quartiles"""
        sorted_values = sorted(values)
        n = len(sorted_values)

        return {
            'q1': self.percentile(sorted_values, 25),
            'q2': self.percentile(sorted_values, 50),
            'q3': self.percentile(sorted_values, 75),
        }

    def percentile(self, sorted_values: List[float], p: float) -> float:
        """Calculate percentile"""
        if not sorted_values:
            return 0.0

        index = (p / 100) * (len(sorted_values) - 1)
        lower = int(math.floor(index))
        upper = int(math.ceil(index))

        if lower == upper:
            return sorted_values[lower]

        # Linear interpolation
        fraction = index - lower
        return sorted_values[lower] * (1 - fraction) + sorted_values[upper] * fraction

    def detect_outliers(
        self, values: List[float], threshold: float = 1.5
    ) -> List[int]:
        """Detect outliers using IQR method"""
        if len(values) < 4:
            return []

        sorted_values = sorted(values)
        q1 = self.percentile(sorted_values, 25)
        q3 = self.percentile(sorted_values, 75)
        iqr = q3 - q1

        lower_bound = q1 - threshold * iqr
        upper_bound = q3 + threshold * iqr

        outlier_indices = [
            i for i, v in enumerate(values)
            if v < lower_bound or v > upper_bound
        ]

        return outlier_indices


# ============================================================================
# Trend Detector
# ============================================================================

class TrendDetector:
    """Detects trends in time series data"""

    def __init__(self):
        pass

    def detect_trend(self, metric: Metric) -> Dict[str, Any]:
        """Detect trend in metric values"""
        if len(metric.values) < 3:
            return {
                'trend': 'insufficient_data',
                'direction': 'unknown',
                'strength': 0.0,
            }

        values = [v.value for v in metric.values]
        timestamps = [v.timestamp.timestamp() for v in metric.values]

        # Calculate linear regression
        slope, intercept, r_squared = self.linear_regression(timestamps, values)

        # Determine trend direction
        if abs(slope) < 0.01:
            direction = 'stable'
        elif slope > 0:
            direction = 'increasing'
        else:
            direction = 'decreasing'

        # Calculate trend strength based on R²
        if r_squared > 0.8:
            strength = 'strong'
        elif r_squared > 0.5:
            strength = 'moderate'
        else:
            strength = 'weak'

        return {
            'trend': direction,
            'direction': direction,
            'strength': strength,
            'slope': slope,
            'r_squared': r_squared,
            'confidence': r_squared,
        }

    def linear_regression(
        self, x: List[float], y: List[float]
    ) -> Tuple[float, float, float]:
        """Calculate linear regression"""
        n = len(x)

        if n == 0:
            return 0.0, 0.0, 0.0

        x_mean = sum(x) / n
        y_mean = sum(y) / n

        # Calculate slope
        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return 0.0, y_mean, 0.0

        slope = numerator / denominator
        intercept = y_mean - slope * x_mean

        # Calculate R²
        ss_tot = sum((y[i] - y_mean) ** 2 for i in range(n))
        ss_res = sum((y[i] - (slope * x[i] + intercept)) ** 2 for i in range(n))

        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0.0

        return slope, intercept, r_squared

    def predict_next(
        self, metric: Metric, periods: int = 1
    ) -> List[float]:
        """Predict future values using linear regression"""
        if len(metric.values) < 2:
            return []

        values = [v.value for v in metric.values]
        timestamps = [v.timestamp.timestamp() for v in metric.values]

        slope, intercept, _ = self.linear_regression(timestamps, values)

        # Calculate time delta
        time_delta = (timestamps[-1] - timestamps[0]) / (len(timestamps) - 1)

        # Predict future values
        predictions = []
        last_timestamp = timestamps[-1]

        for i in range(1, periods + 1):
            future_timestamp = last_timestamp + (i * time_delta)
            prediction = slope * future_timestamp + intercept
            predictions.append(prediction)

        return predictions


# ============================================================================
# Anomaly Detector
# ============================================================================

class AnomalyDetector:
    """Detects anomalies in metrics"""

    def __init__(self, sensitivity: float = 2.0):
        self.sensitivity = sensitivity
        self.baseline_window = 50  # Number of points for baseline

    def detect_anomalies(self, metric: Metric) -> Dict[str, Any]:
        """Detect anomalies in metric values"""
        if len(metric.values) < 10:
            return {
                'anomalies_detected': 0,
                'anomaly_indices': [],
                'anomaly_scores': [],
            }

        values = [v.value for v in metric.values]

        # Use different methods based on metric type
        if metric.type == 'counter':
            anomalies = self.detect_rate_anomalies(values)
        else:
            anomalies = self.detect_statistical_anomalies(values)

        return anomalies

    def detect_statistical_anomalies(
        self, values: List[float]
    ) -> Dict[str, Any]:
        """Detect anomalies using statistical methods"""
        anomaly_indices = []
        anomaly_scores = []

        # Use sliding window for baseline
        window_size = min(self.baseline_window, len(values) // 2)

        for i in range(window_size, len(values)):
            # Calculate baseline statistics
            baseline = values[i - window_size:i]
            mean = statistics.mean(baseline)
            stdev = statistics.stdev(baseline) if len(baseline) > 1 else 0

            if stdev == 0:
                continue

            # Calculate z-score
            current_value = values[i]
            z_score = abs((current_value - mean) / stdev)

            # Check if anomaly
            if z_score > self.sensitivity:
                anomaly_indices.append(i)
                anomaly_scores.append(z_score)

        return {
            'anomalies_detected': len(anomaly_indices),
            'anomaly_indices': anomaly_indices,
            'anomaly_scores': anomaly_scores,
            'method': 'statistical',
        }

    def detect_rate_anomalies(self, values: List[float]) -> Dict[str, Any]:
        """Detect anomalies in counter metrics (by rate of change)"""
        if len(values) < 2:
            return {
                'anomalies_detected': 0,
                'anomaly_indices': [],
                'anomaly_scores': [],
            }

        # Calculate rates of change
        rates = [
            values[i] - values[i - 1]
            for i in range(1, len(values))
        ]

        # Detect anomalies in rates
        anomaly_indices = []
        anomaly_scores = []

        if len(rates) > 10:
            mean_rate = statistics.mean(rates)
            stdev_rate = statistics.stdev(rates)

            if stdev_rate > 0:
                for i, rate in enumerate(rates):
                    z_score = abs((rate - mean_rate) / stdev_rate)
                    if z_score > self.sensitivity:
                        anomaly_indices.append(i + 1)  # +1 because rates start at index 1
                        anomaly_scores.append(z_score)

        return {
            'anomalies_detected': len(anomaly_indices),
            'anomaly_indices': anomaly_indices,
            'anomaly_scores': anomaly_scores,
            'method': 'rate',
        }


# ============================================================================
# Threshold Monitor
# ============================================================================

class ThresholdMonitor:
    """Monitors metrics against thresholds"""

    def __init__(self):
        # Common thresholds for system metrics
        self.thresholds = {
            'system.cpu.usage': {'warning': 70, 'critical': 90},
            'system.memory.usage': {'warning': 75, 'critical': 90},
            'system.disk.usage': {'warning': 80, 'critical': 95},
        }

    def check_thresholds(self, metric: Metric) -> Dict[str, Any]:
        """Check if metric exceeds thresholds"""
        latest = metric.get_latest()
        if not latest:
            return {'status': 'unknown', 'alerts': []}

        thresholds = self.thresholds.get(metric.name)
        if not thresholds:
            return {'status': 'ok', 'alerts': []}

        alerts = []
        status = 'ok'

        if latest.value >= thresholds['critical']:
            status = 'critical'
            alerts.append({
                'severity': 'critical',
                'message': f'{metric.name} is at {latest.value:.2f} (threshold: {thresholds["critical"]})',
                'value': latest.value,
                'threshold': thresholds['critical'],
            })
        elif latest.value >= thresholds['warning']:
            status = 'warning'
            alerts.append({
                'severity': 'warning',
                'message': f'{metric.name} is at {latest.value:.2f} (threshold: {thresholds["warning"]})',
                'value': latest.value,
                'threshold': thresholds['warning'],
            })

        return {
            'status': status,
            'alerts': alerts,
            'current_value': latest.value,
            'thresholds': thresholds,
        }


# ============================================================================
# Metrics Analyzer
# ============================================================================

class MetricsAnalyzer:
    """Main metrics analysis coordinator"""

    def __init__(self):
        self.statistical_analyzer = StatisticalAnalyzer()
        self.trend_detector = TrendDetector()
        self.anomaly_detector = AnomalyDetector()
        self.threshold_monitor = ThresholdMonitor()

    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive analysis on metrics"""
        agent_id = data.get('agentId', 'unknown')
        hostname = data.get('hostname', 'unknown')
        metrics = [Metric(m) for m in data.get('metrics', [])]

        print(f"[MetricsAnalyzer] Analyzing {len(metrics)} metrics from {hostname}", file=sys.stderr)

        results = {
            'agent_id': agent_id,
            'hostname': hostname,
            'timestamp': datetime.now().isoformat(),
            'metrics_analyzed': len(metrics),
            'analyses': {},
            'alerts': [],
            'summary': {},
        }

        # Analyze each metric
        for metric in metrics:
            if not metric.values:
                continue

            analysis = {
                'metric': metric.name,
                'type': metric.type,
                'statistics': self.statistical_analyzer.analyze_metric(metric),
                'trend': self.trend_detector.detect_trend(metric),
                'anomalies': self.anomaly_detector.detect_anomalies(metric),
                'thresholds': self.threshold_monitor.check_thresholds(metric),
            }

            results['analyses'][metric.name] = analysis

            # Collect alerts
            if analysis['thresholds']['alerts']:
                results['alerts'].extend(analysis['thresholds']['alerts'])

            # Add anomaly alerts
            if analysis['anomalies']['anomalies_detected'] > 0:
                results['alerts'].append({
                    'severity': 'warning',
                    'message': f"Detected {analysis['anomalies']['anomalies_detected']} anomalies in {metric.name}",
                    'metric': metric.name,
                })

        # Generate summary
        results['summary'] = self.generate_summary(results)

        return results

    def generate_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate analysis summary"""
        total_anomalies = sum(
            a['anomalies']['anomalies_detected']
            for a in results['analyses'].values()
        )

        critical_alerts = [a for a in results['alerts'] if a['severity'] == 'critical']
        warning_alerts = [a for a in results['alerts'] if a['severity'] == 'warning']

        # Determine health status
        if critical_alerts:
            health_status = 'critical'
        elif warning_alerts:
            health_status = 'warning'
        elif total_anomalies > 0:
            health_status = 'degraded'
        else:
            health_status = 'healthy'

        return {
            'health_status': health_status,
            'total_alerts': len(results['alerts']),
            'critical_alerts': len(critical_alerts),
            'warning_alerts': len(warning_alerts),
            'total_anomalies': total_anomalies,
            'metrics_with_trends': sum(
                1 for a in results['analyses'].values()
                if a['trend']['direction'] != 'stable'
            ),
        }


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Main entry point for metrics analytics"""
    try:
        # Read metrics data from stdin
        input_data = sys.stdin.read()

        if not input_data:
            print(json.dumps({'error': 'No input data'}))
            return

        # Parse JSON input
        data = json.loads(input_data)

        # Analyze metrics
        analyzer = MetricsAnalyzer()
        results = analyzer.analyze(data)

        # Output results as JSON
        print(json.dumps(results, indent=2))

    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON: {str(e)}'}), file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(json.dumps({'error': f'Analysis failed: {str(e)}'}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
