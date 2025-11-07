"""
Time-Series Forecasting Module

Implements forecasting algorithms for predicting future metric values.
Uses statistical methods like moving average, exponential smoothing, and linear regression.
"""

import json
import sys
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from math import sqrt


@dataclass
class ForecastPoint:
    """Represents a forecasted data point."""
    timestamp: int
    predicted_value: float
    confidence_lower: float
    confidence_upper: float
    method: str


class Forecaster:
    """Base class for forecasting algorithms."""

    def __init__(self, name: str):
        self.name = name

    def forecast(self, data: List[float], steps: int) -> List[float]:
        """Generate forecast for the specified number of steps."""
        raise NotImplementedError


class MovingAverageForecaster(Forecaster):
    """
    Simple Moving Average forecasting.
    Predicts future values based on the average of recent values.
    """

    def __init__(self, window_size: int = 10):
        super().__init__("Moving Average")
        self.window_size = window_size

    def forecast(self, data: List[float], steps: int) -> List[float]:
        if len(data) < self.window_size:
            # Not enough data, return last value
            return [data[-1]] * steps if data else [0] * steps

        # Calculate moving average of last window
        window = data[-self.window_size:]
        ma = sum(window) / len(window)

        # Simple forecast: repeat the moving average
        return [ma] * steps


class ExponentialSmoothingForecaster(Forecaster):
    """
    Exponential Smoothing forecasting.
    Gives more weight to recent observations.
    """

    def __init__(self, alpha: float = 0.3):
        super().__init__("Exponential Smoothing")
        self.alpha = alpha  # Smoothing parameter (0-1)

    def forecast(self, data: List[float], steps: int) -> List[float]:
        if not data:
            return [0] * steps

        # Calculate smoothed values
        smoothed = [data[0]]
        for i in range(1, len(data)):
            s = self.alpha * data[i] + (1 - self.alpha) * smoothed[-1]
            smoothed.append(s)

        # Forecast is the last smoothed value
        last_smoothed = smoothed[-1]
        return [last_smoothed] * steps


class LinearRegressionForecaster(Forecaster):
    """
    Linear Regression forecasting.
    Fits a line to the data and extrapolates.
    """

    def __init__(self):
        super().__init__("Linear Regression")

    def forecast(self, data: List[float], steps: int) -> List[float]:
        if len(data) < 2:
            return [data[-1]] * steps if data else [0] * steps

        n = len(data)
        x = list(range(n))
        y = data

        # Calculate coefficients
        x_mean = sum(x) / n
        y_mean = sum(y) / n

        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return [y_mean] * steps

        slope = numerator / denominator
        intercept = y_mean - slope * x_mean

        # Generate forecasts
        forecasts = []
        for i in range(steps):
            x_future = n + i
            y_future = slope * x_future + intercept
            forecasts.append(y_future)

        return forecasts


class HoltLinearForecaster(Forecaster):
    """
    Holt's Linear Trend forecasting.
    Extends exponential smoothing to capture trends.
    """

    def __init__(self, alpha: float = 0.3, beta: float = 0.1):
        super().__init__("Holt Linear Trend")
        self.alpha = alpha  # Level smoothing
        self.beta = beta    # Trend smoothing

    def forecast(self, data: List[float], steps: int) -> List[float]:
        if len(data) < 2:
            return [data[-1]] * steps if data else [0] * steps

        # Initialize level and trend
        level = data[0]
        trend = data[1] - data[0]

        # Update level and trend
        for value in data[1:]:
            prev_level = level
            level = self.alpha * value + (1 - self.alpha) * (level + trend)
            trend = self.beta * (level - prev_level) + (1 - self.beta) * trend

        # Generate forecasts
        forecasts = []
        for i in range(1, steps + 1):
            forecast = level + i * trend
            forecasts.append(forecast)

        return forecasts


class EnsembleForecaster:
    """
    Ensemble forecaster that combines multiple forecasting methods.
    """

    def __init__(self, forecasters: Optional[List[Forecaster]] = None):
        if forecasters is None:
            self.forecasters = [
                MovingAverageForecaster(window_size=10),
                ExponentialSmoothingForecaster(alpha=0.3),
                LinearRegressionForecaster(),
                HoltLinearForecaster(alpha=0.3, beta=0.1)
            ]
        else:
            self.forecasters = forecasters

    def forecast(self, data: List[float], steps: int) -> Tuple[List[float], List[float], List[float]]:
        """
        Generate ensemble forecast.

        Returns:
            Tuple of (predictions, lower_bounds, upper_bounds)
        """
        if not data:
            return [0] * steps, [0] * steps, [0] * steps

        # Get forecasts from all methods
        all_forecasts = []
        for forecaster in self.forecasters:
            try:
                forecast = forecaster.forecast(data, steps)
                all_forecasts.append(forecast)
            except Exception as e:
                print(f"Warning: {forecaster.name} failed: {e}", file=sys.stderr)

        if not all_forecasts:
            # Fallback to last value
            last_value = data[-1]
            return [last_value] * steps, [last_value] * steps, [last_value] * steps

        # Combine forecasts (average)
        predictions = []
        lower_bounds = []
        upper_bounds = []

        for i in range(steps):
            values = [forecast[i] for forecast in all_forecasts]
            mean_pred = sum(values) / len(values)
            predictions.append(mean_pred)

            # Calculate confidence intervals (simple approach using std dev)
            if len(values) > 1:
                variance = sum((v - mean_pred) ** 2 for v in values) / len(values)
                std_dev = sqrt(variance)
                lower_bounds.append(mean_pred - 2 * std_dev)
                upper_bounds.append(mean_pred + 2 * std_dev)
            else:
                # Single forecast, use historical variance
                hist_mean = sum(data) / len(data)
                hist_variance = sum((x - hist_mean) ** 2 for x in data) / len(data)
                hist_std = sqrt(hist_variance)
                lower_bounds.append(mean_pred - 2 * hist_std)
                upper_bounds.append(mean_pred + 2 * hist_std)

        return predictions, lower_bounds, upper_bounds


def forecast_metrics(data: List[Dict], steps: int = 10, method: str = "ensemble") -> Dict:
    """
    Forecast future metric values.

    Args:
        data: List of metric data points with 'timestamp' and 'value' keys
        steps: Number of steps to forecast ahead
        method: Forecasting method ('ensemble', 'ma', 'es', 'lr', 'holt')

    Returns:
        Dictionary with forecast results
    """
    if not data:
        return {
            "status": "error",
            "message": "No data provided",
            "forecasts": []
        }

    # Extract values
    values = [d["value"] for d in data]
    timestamps = [d["timestamp"] for d in data]

    # Determine time delta (assuming regular intervals)
    if len(timestamps) > 1:
        time_delta = timestamps[-1] - timestamps[-2]
    else:
        time_delta = 1000  # Default to 1 second

    # Choose forecaster
    if method == "ensemble":
        forecaster = EnsembleForecaster()
        predictions, lower, upper = forecaster.forecast(values, steps)
    elif method == "ma":
        forecaster = MovingAverageForecaster()
        predictions = forecaster.forecast(values, steps)
        lower = predictions  # No confidence intervals for single method
        upper = predictions
    elif method == "es":
        forecaster = ExponentialSmoothingForecaster()
        predictions = forecaster.forecast(values, steps)
        lower = predictions
        upper = predictions
    elif method == "lr":
        forecaster = LinearRegressionForecaster()
        predictions = forecaster.forecast(values, steps)
        lower = predictions
        upper = predictions
    elif method == "holt":
        forecaster = HoltLinearForecaster()
        predictions = forecaster.forecast(values, steps)
        lower = predictions
        upper = predictions
    else:
        return {
            "status": "error",
            "message": f"Unknown method: {method}",
            "forecasts": []
        }

    # Generate forecast points
    forecasts = []
    last_timestamp = timestamps[-1]

    for i in range(steps):
        forecast_timestamp = last_timestamp + (i + 1) * time_delta
        forecasts.append({
            "timestamp": forecast_timestamp,
            "predicted_value": predictions[i],
            "confidence_lower": lower[i],
            "confidence_upper": upper[i],
            "method": method
        })

    return {
        "status": "success",
        "method": method,
        "steps": steps,
        "historical_points": len(data),
        "forecasts": forecasts
    }


def main():
    """Main entry point for command-line usage."""
    if len(sys.argv) > 1:
        # Read from file
        with open(sys.argv[1], 'r') as f:
            config = json.load(f)
    else:
        # Read from stdin
        config = json.load(sys.stdin)

    data = config.get("data", [])
    steps = config.get("steps", 10)
    method = config.get("method", "ensemble")

    result = forecast_metrics(data, steps, method)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()


def demo():
    """Demonstrate forecasting capabilities."""
    import random

    print("=" * 60)
    print("Time-Series Forecasting Demo")
    print("=" * 60)

    # Generate sample data with trend
    base_time = 1000000
    data = []

    for i in range(50):
        # Upward trend with noise
        value = 50 + i * 0.5 + random.gauss(0, 2)
        data.append({"timestamp": base_time + i * 1000, "value": value})

    # Forecast next 10 points
    result = forecast_metrics(data, steps=10, method="ensemble")

    print(f"\nForecast Results:")
    print(f"  Method: {result['method']}")
    print(f"  Historical points: {result['historical_points']}")
    print(f"  Forecast steps: {result['steps']}")

    print(f"\nLast 5 historical values:")
    for d in data[-5:]:
        print(f"  {d['timestamp']}: {d['value']:.2f}")

    print(f"\nForecasted values:")
    for forecast in result['forecasts']:
        print(f"  {forecast['timestamp']}: {forecast['predicted_value']:.2f}")
        print(f"    Confidence: [{forecast['confidence_lower']:.2f}, {forecast['confidence_upper']:.2f}]")

    # Compare different methods
    print("\n" + "=" * 60)
    print("Method Comparison")
    print("=" * 60)

    methods = ["ma", "es", "lr", "holt", "ensemble"]
    for method in methods:
        result = forecast_metrics(data, steps=5, method=method)
        forecasts = result['forecasts']
        print(f"\n{method.upper()}: {[f['predicted_value'] for f in forecasts[:3]]}")


# Uncomment to run demo
# if __name__ == "__main__":
#     demo()
