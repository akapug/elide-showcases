"""
Traffic Forecasting for Edge Computing

Advanced traffic prediction using time series analysis and ML:
- Request volume forecasting
- Seasonal pattern detection
- Anomaly detection
- Capacity planning
- Auto-scaling recommendations
"""

import json
import time
import math
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from collections import deque
from datetime import datetime, timedelta


@dataclass
class TrafficSample:
    """Traffic measurement sample"""
    timestamp: float
    requests_per_second: float
    latency_p50: float
    latency_p95: float
    error_rate: float
    active_connections: int


@dataclass
class Forecast:
    """Traffic forecast"""
    timestamp: float
    predicted_rps: float
    confidence_lower: float
    confidence_upper: float
    confidence_level: float


@dataclass
class Anomaly:
    """Detected anomaly"""
    timestamp: float
    metric: str
    value: float
    expected_value: float
    severity: float  # 0-1


class TimeSeriesAnalyzer:
    """Analyze time series data for patterns"""

    @staticmethod
    def moving_average(data: List[float], window: int) -> List[float]:
        """Calculate moving average"""
        if len(data) < window:
            return data

        result = []
        for i in range(len(data)):
            if i < window - 1:
                result.append(sum(data[:i+1]) / (i + 1))
            else:
                result.append(sum(data[i-window+1:i+1]) / window)

        return result

    @staticmethod
    def exponential_smoothing(data: List[float], alpha: float = 0.3) -> List[float]:
        """Apply exponential smoothing"""
        if not data:
            return []

        result = [data[0]]
        for i in range(1, len(data)):
            smoothed = alpha * data[i] + (1 - alpha) * result[-1]
            result.append(smoothed)

        return result

    @staticmethod
    def detect_seasonality(data: List[float], period: int) -> float:
        """
        Detect seasonality strength
        Returns: correlation coefficient (0-1)
        """
        if len(data) < period * 2:
            return 0.0

        # Calculate autocorrelation at period lag
        n = len(data)
        mean = sum(data) / n

        # Covariance at lag
        cov = sum((data[i] - mean) * (data[i - period] - mean)
                  for i in range(period, n))

        # Variance
        var = sum((x - mean) ** 2 for x in data)

        if var == 0:
            return 0.0

        correlation = cov / var
        return max(0.0, min(1.0, correlation))

    @staticmethod
    def calculate_trend(data: List[float]) -> float:
        """
        Calculate linear trend
        Returns: slope (positive = increasing, negative = decreasing)
        """
        n = len(data)
        if n < 2:
            return 0.0

        x_mean = (n - 1) / 2
        y_mean = sum(data) / n

        numerator = sum((i - x_mean) * (data[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return 0.0

        return numerator / denominator


class TrafficPredictor:
    """Predict future traffic patterns"""

    def __init__(self, history_size: int = 1000):
        self.history: deque = deque(maxlen=history_size)
        self.hourly_patterns: Dict[int, List[float]] = {h: [] for h in range(24)}
        self.daily_patterns: Dict[int, List[float]] = {d: [] for d in range(7)}

    def add_sample(self, sample: TrafficSample):
        """Add traffic sample to history"""
        self.history.append(sample)

        # Update patterns
        dt = datetime.fromtimestamp(sample.timestamp)
        hour = dt.hour
        day = dt.weekday()

        self.hourly_patterns[hour].append(sample.requests_per_second)
        self.daily_patterns[day].append(sample.requests_per_second)

        # Keep only recent 100 samples per pattern
        if len(self.hourly_patterns[hour]) > 100:
            self.hourly_patterns[hour] = self.hourly_patterns[hour][-100:]
        if len(self.daily_patterns[day]) > 100:
            self.daily_patterns[day] = self.daily_patterns[day][-100:]

    def predict_next_hour(self) -> Forecast:
        """Predict traffic for next hour"""
        if len(self.history) < 10:
            # Not enough data, return current rate
            current = self.history[-1] if self.history else TrafficSample(
                time.time(), 0, 0, 0, 0, 0
            )
            return Forecast(
                timestamp=time.time() + 3600,
                predicted_rps=current.requests_per_second,
                confidence_lower=current.requests_per_second * 0.5,
                confidence_upper=current.requests_per_second * 1.5,
                confidence_level=0.5
            )

        # Get recent data
        recent_rps = [s.requests_per_second for s in list(self.history)[-60:]]

        # Calculate trend
        trend = TimeSeriesAnalyzer.calculate_trend(recent_rps)

        # Get seasonal pattern
        next_hour = (datetime.now() + timedelta(hours=1)).hour
        hour_pattern = self.hourly_patterns.get(next_hour, [])

        if hour_pattern:
            seasonal_base = sum(hour_pattern) / len(hour_pattern)
        else:
            seasonal_base = recent_rps[-1]

        # Combine trend and seasonal
        predicted = seasonal_base + (trend * 60)  # Trend for 60 time steps

        # Calculate confidence interval
        if len(recent_rps) > 1:
            variance = sum((x - sum(recent_rps) / len(recent_rps)) ** 2
                          for x in recent_rps) / len(recent_rps)
            stddev = math.sqrt(variance)
            confidence_range = stddev * 1.96  # 95% confidence
        else:
            confidence_range = predicted * 0.3

        return Forecast(
            timestamp=time.time() + 3600,
            predicted_rps=max(0, predicted),
            confidence_lower=max(0, predicted - confidence_range),
            confidence_upper=predicted + confidence_range,
            confidence_level=0.95
        )

    def predict_next_day(self) -> List[Forecast]:
        """Predict traffic for next 24 hours"""
        forecasts = []
        current_time = time.time()

        for hour_offset in range(24):
            forecast_time = current_time + (hour_offset * 3600)
            dt = datetime.fromtimestamp(forecast_time)
            hour = dt.hour

            # Get hourly pattern
            hour_pattern = self.hourly_patterns.get(hour, [])

            if hour_pattern:
                predicted = sum(hour_pattern) / len(hour_pattern)
                variance = sum((x - predicted) ** 2 for x in hour_pattern) / len(hour_pattern)
                stddev = math.sqrt(variance)
                confidence_range = stddev * 1.96
            else:
                predicted = self.history[-1].requests_per_second if self.history else 0
                confidence_range = predicted * 0.5

            forecasts.append(Forecast(
                timestamp=forecast_time,
                predicted_rps=max(0, predicted),
                confidence_lower=max(0, predicted - confidence_range),
                confidence_upper=predicted + confidence_range,
                confidence_level=0.95
            ))

        return forecasts

    def detect_pattern_type(self) -> Dict[str, float]:
        """Detect dominant pattern types"""
        if len(self.history) < 100:
            return {'hourly': 0, 'daily': 0, 'trend': 0}

        recent_rps = [s.requests_per_second for s in list(self.history)[-100:]]

        # Detect seasonality at different periods
        hourly_strength = TimeSeriesAnalyzer.detect_seasonality(recent_rps, 12)  # 12 * 5min = 1 hour
        daily_strength = TimeSeriesAnalyzer.detect_seasonality(recent_rps, 24 * 12)  # Daily

        # Detect trend
        trend = abs(TimeSeriesAnalyzer.calculate_trend(recent_rps))
        trend_strength = min(1.0, trend / 10)  # Normalize

        return {
            'hourly': hourly_strength,
            'daily': daily_strength,
            'trend': trend_strength
        }


class AnomalyDetector:
    """Detect traffic anomalies"""

    def __init__(self, sensitivity: float = 2.0):
        self.sensitivity = sensitivity  # Standard deviations for anomaly
        self.baseline_window = 100

    def detect(self, samples: List[TrafficSample]) -> List[Anomaly]:
        """Detect anomalies in traffic samples"""
        if len(samples) < self.baseline_window:
            return []

        anomalies = []

        # Use recent history as baseline
        baseline = samples[-self.baseline_window:-1]
        current = samples[-1]

        # Check RPS anomalies
        rps_values = [s.requests_per_second for s in baseline]
        rps_mean = sum(rps_values) / len(rps_values)
        rps_variance = sum((x - rps_mean) ** 2 for x in rps_values) / len(rps_values)
        rps_stddev = math.sqrt(rps_variance)

        if abs(current.requests_per_second - rps_mean) > (self.sensitivity * rps_stddev):
            severity = min(1.0, abs(current.requests_per_second - rps_mean) / (3 * rps_stddev))
            anomalies.append(Anomaly(
                timestamp=current.timestamp,
                metric='requests_per_second',
                value=current.requests_per_second,
                expected_value=rps_mean,
                severity=severity
            ))

        # Check latency anomalies
        latency_values = [s.latency_p95 for s in baseline]
        latency_mean = sum(latency_values) / len(latency_values)
        latency_variance = sum((x - latency_mean) ** 2 for x in latency_values) / len(latency_values)
        latency_stddev = math.sqrt(latency_variance)

        if abs(current.latency_p95 - latency_mean) > (self.sensitivity * latency_stddev):
            severity = min(1.0, abs(current.latency_p95 - latency_mean) / (3 * latency_stddev))
            anomalies.append(Anomaly(
                timestamp=current.timestamp,
                metric='latency_p95',
                value=current.latency_p95,
                expected_value=latency_mean,
                severity=severity
            ))

        # Check error rate anomalies
        error_values = [s.error_rate for s in baseline]
        error_mean = sum(error_values) / len(error_values)

        if current.error_rate > error_mean * 2:  # 2x increase in errors
            severity = min(1.0, current.error_rate / (error_mean * 5))
            anomalies.append(Anomaly(
                timestamp=current.timestamp,
                metric='error_rate',
                value=current.error_rate,
                expected_value=error_mean,
                severity=severity
            ))

        return anomalies


class CapacityPlanner:
    """Plan capacity based on traffic predictions"""

    def __init__(self, predictor: TrafficPredictor):
        self.predictor = predictor
        self.target_utilization = 0.7  # Target 70% utilization
        self.instance_capacity = 1000  # RPS per instance

    def recommend_scaling(self, current_instances: int) -> Dict:
        """Recommend scaling actions"""
        forecast = self.predictor.predict_next_hour()

        # Calculate required capacity
        required_capacity = forecast.predicted_rps / self.target_utilization
        required_instances = math.ceil(required_capacity / self.instance_capacity)

        # Consider peak (upper confidence bound)
        peak_capacity = forecast.confidence_upper / self.target_utilization
        peak_instances = math.ceil(peak_capacity / self.instance_capacity)

        # Recommend
        if required_instances > current_instances:
            action = 'scale_up'
            target = required_instances
            urgency = 'high' if required_instances > current_instances * 1.5 else 'medium'
        elif peak_instances < current_instances * 0.5:
            action = 'scale_down'
            target = max(1, peak_instances)
            urgency = 'low'
        else:
            action = 'maintain'
            target = current_instances
            urgency = 'none'

        return {
            'action': action,
            'current_instances': current_instances,
            'target_instances': target,
            'urgency': urgency,
            'predicted_rps': forecast.predicted_rps,
            'predicted_utilization': forecast.predicted_rps / (target * self.instance_capacity),
        }


def generate_sample_traffic(hours: int = 24) -> List[TrafficSample]:
    """Generate sample traffic data with patterns"""
    import random
    samples = []
    current_time = time.time() - (hours * 3600)

    for i in range(hours * 12):  # 12 samples per hour (5 min intervals)
        timestamp = current_time + (i * 300)  # 5 minutes
        dt = datetime.fromtimestamp(timestamp)
        hour = dt.hour

        # Base load with hourly pattern
        base_load = 100
        if 8 <= hour < 12:  # Morning peak
            base_load = 300
        elif 12 <= hour < 14:  # Lunch dip
            base_load = 200
        elif 14 <= hour < 18:  # Afternoon peak
            base_load = 350
        elif 18 <= hour < 22:  # Evening
            base_load = 250
        elif 22 <= hour or hour < 6:  # Night
            base_load = 50

        # Add randomness
        rps = base_load + random.uniform(-20, 20)

        # Occasionally add anomalies
        if random.random() < 0.02:  # 2% chance of anomaly
            rps *= random.uniform(2, 4)

        sample = TrafficSample(
            timestamp=timestamp,
            requests_per_second=max(0, rps),
            latency_p50=random.uniform(10, 30),
            latency_p95=random.uniform(50, 150),
            error_rate=random.uniform(0, 0.02),
            active_connections=int(rps * random.uniform(0.5, 1.5))
        )
        samples.append(sample)

    return samples


def demonstrate_traffic_prediction():
    """Demonstrate traffic prediction"""
    print("=== Traffic Forecasting ===\n")

    # Generate sample data
    samples = generate_sample_traffic(hours=48)

    # Initialize predictor
    predictor = TrafficPredictor()

    # Feed historical data
    for sample in samples:
        predictor.add_sample(sample)

    # Predict next hour
    print("1. Next Hour Forecast:")
    forecast = predictor.predict_next_hour()
    print(f"   Predicted RPS: {forecast.predicted_rps:.1f}")
    print(f"   Confidence: {forecast.confidence_level:.0%}")
    print(f"   Range: {forecast.confidence_lower:.1f} - {forecast.confidence_upper:.1f}")
    print()

    # Predict next day
    print("2. Next 24 Hours Forecast:")
    daily_forecasts = predictor.predict_next_day()
    print(f"   Generated {len(daily_forecasts)} hourly forecasts")
    print(f"   Peak predicted RPS: {max(f.predicted_rps for f in daily_forecasts):.1f}")
    print(f"   Valley predicted RPS: {min(f.predicted_rps for f in daily_forecasts):.1f}")
    print()

    # Detect patterns
    print("3. Pattern Detection:")
    patterns = predictor.detect_pattern_type()
    for pattern_type, strength in patterns.items():
        print(f"   {pattern_type.capitalize()}: {strength:.2%}")
    print()

    # Anomaly detection
    print("4. Anomaly Detection:")
    detector = AnomalyDetector(sensitivity=2.0)
    anomalies = detector.detect(list(predictor.history))
    print(f"   Detected {len(anomalies)} anomalies")
    for anomaly in anomalies[:5]:  # Show first 5
        print(f"   - {anomaly.metric}: {anomaly.value:.1f} (expected {anomaly.expected_value:.1f})")
        print(f"     Severity: {anomaly.severity:.2%}")
    print()

    # Capacity planning
    print("5. Capacity Planning:")
    planner = CapacityPlanner(predictor)
    recommendation = planner.recommend_scaling(current_instances=5)
    print(f"   Current instances: {recommendation['current_instances']}")
    print(f"   Recommended action: {recommendation['action']}")
    print(f"   Target instances: {recommendation['target_instances']}")
    print(f"   Urgency: {recommendation['urgency']}")
    print(f"   Predicted utilization: {recommendation['predicted_utilization']:.1%}")
    print()


def benchmark_prediction():
    """Benchmark prediction performance"""
    print("=== Prediction Performance ===\n")

    samples = generate_sample_traffic(hours=24)
    predictor = TrafficPredictor()

    # Benchmark adding samples
    start_time = time.time()
    for sample in samples:
        predictor.add_sample(sample)
    add_duration = time.time() - start_time

    # Benchmark predictions
    start_time = time.time()
    for _ in range(100):
        predictor.predict_next_hour()
    predict_duration = time.time() - start_time

    print(f"Add samples: {add_duration:.3f}s for {len(samples)} samples")
    print(f"Predict: {predict_duration:.3f}s for 100 predictions")
    print(f"Prediction rate: {100 / predict_duration:.0f} predictions/second")


if __name__ == '__main__':
    demonstrate_traffic_prediction()
    print()
    benchmark_prediction()
