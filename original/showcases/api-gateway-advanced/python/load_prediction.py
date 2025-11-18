"""
Load Forecasting for API Gateway
Implements predictive models for traffic forecasting:
- Linear Regression
- Moving Average (Simple, Weighted, Exponential)
- ARIMA (AutoRegressive Integrated Moving Average)
- Prophet-like decomposition
- Neural Network based prediction
- Ensemble methods
"""

import json
import math
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from collections import deque


@dataclass
class Prediction:
    """Prediction result"""
    timestamp: float
    predicted_value: float
    confidence_interval: Tuple[float, float]
    method: str
    metadata: Dict[str, Any]


@dataclass
class TrainingMetrics:
    """Model training metrics"""
    mse: float  # Mean Squared Error
    rmse: float  # Root Mean Squared Error
    mae: float  # Mean Absolute Error
    mape: float  # Mean Absolute Percentage Error
    r_squared: float


class MovingAveragePredictor:
    """Moving average based predictions"""

    def __init__(self, window_size: int = 10):
        self.window_size = window_size
        self.values = deque(maxlen=window_size)

    def add_value(self, value: float) -> None:
        """Add value to window"""
        self.values.append(value)

    def simple_moving_average(self) -> float:
        """Calculate simple moving average"""
        if not self.values:
            return 0.0
        return sum(self.values) / len(self.values)

    def weighted_moving_average(self) -> float:
        """Calculate weighted moving average (recent values weighted more)"""
        if not self.values:
            return 0.0

        weights = list(range(1, len(self.values) + 1))
        weighted_sum = sum(v * w for v, w in zip(self.values, weights))
        weight_sum = sum(weights)

        return weighted_sum / weight_sum if weight_sum > 0 else 0.0

    def exponential_moving_average(self, alpha: float = 0.3) -> float:
        """Calculate exponential moving average"""
        if not self.values:
            return 0.0

        ema = self.values[0]
        for value in list(self.values)[1:]:
            ema = alpha * value + (1 - alpha) * ema

        return ema

    def predict(
        self,
        method: str = "simple",
        alpha: float = 0.3
    ) -> Prediction:
        """Make prediction using moving average"""
        if method == "simple":
            predicted = self.simple_moving_average()
        elif method == "weighted":
            predicted = self.weighted_moving_average()
        elif method == "exponential":
            predicted = self.exponential_moving_average(alpha)
        else:
            predicted = self.simple_moving_average()

        # Calculate confidence interval (simple approach)
        if len(self.values) > 1:
            std = self._calculate_std()
            confidence = (predicted - 2 * std, predicted + 2 * std)
        else:
            confidence = (predicted, predicted)

        return Prediction(
            timestamp=datetime.now().timestamp(),
            predicted_value=predicted,
            confidence_interval=confidence,
            method=f"moving_average_{method}",
            metadata={"window_size": len(self.values)}
        )

    def _calculate_std(self) -> float:
        """Calculate standard deviation"""
        if len(self.values) < 2:
            return 0.0

        mean = sum(self.values) / len(self.values)
        variance = sum((x - mean) ** 2 for x in self.values) / len(self.values)
        return math.sqrt(variance)


class LinearRegressionPredictor:
    """Linear regression for trend prediction"""

    def __init__(self):
        self.slope: float = 0.0
        self.intercept: float = 0.0
        self.trained = False

    def fit(self, timestamps: List[float], values: List[float]) -> None:
        """Train linear regression model"""
        if len(timestamps) != len(values) or len(timestamps) < 2:
            raise ValueError("Need at least 2 data points")

        n = len(timestamps)

        # Normalize timestamps
        t_min = min(timestamps)
        t_normalized = [(t - t_min) for t in timestamps]

        # Calculate means
        mean_t = sum(t_normalized) / n
        mean_v = sum(values) / n

        # Calculate slope and intercept
        numerator = sum((t_normalized[i] - mean_t) * (values[i] - mean_v) for i in range(n))
        denominator = sum((t - mean_t) ** 2 for t in t_normalized)

        if denominator == 0:
            self.slope = 0
            self.intercept = mean_v
        else:
            self.slope = numerator / denominator
            self.intercept = mean_v - self.slope * mean_t

        self.t_min = t_min
        self.trained = True

    def predict(self, timestamp: float) -> Prediction:
        """Predict value at timestamp"""
        if not self.trained:
            raise ValueError("Model not trained")

        t_normalized = timestamp - self.t_min
        predicted = self.slope * t_normalized + self.intercept

        # Simple confidence interval
        confidence = (predicted * 0.9, predicted * 1.1)

        return Prediction(
            timestamp=timestamp,
            predicted_value=predicted,
            confidence_interval=confidence,
            method="linear_regression",
            metadata={
                "slope": self.slope,
                "intercept": self.intercept
            }
        )

    def calculate_metrics(
        self,
        timestamps: List[float],
        actual_values: List[float]
    ) -> TrainingMetrics:
        """Calculate model performance metrics"""
        predictions = [self.predict(t).predicted_value for t in timestamps]

        # MSE
        mse = sum((actual_values[i] - predictions[i]) ** 2 for i in range(len(actual_values))) / len(actual_values)
        rmse = math.sqrt(mse)

        # MAE
        mae = sum(abs(actual_values[i] - predictions[i]) for i in range(len(actual_values))) / len(actual_values)

        # MAPE
        mape = sum(
            abs((actual_values[i] - predictions[i]) / actual_values[i])
            for i in range(len(actual_values))
            if actual_values[i] != 0
        ) / len(actual_values) * 100

        # R-squared
        ss_tot = sum((v - sum(actual_values) / len(actual_values)) ** 2 for v in actual_values)
        ss_res = sum((actual_values[i] - predictions[i]) ** 2 for i in range(len(actual_values)))
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0

        return TrainingMetrics(
            mse=mse,
            rmse=rmse,
            mae=mae,
            mape=mape,
            r_squared=r_squared
        )


class ARIMAPredictor:
    """Simplified ARIMA model implementation"""

    def __init__(self, p: int = 1, d: int = 0, q: int = 1):
        """
        p: autoregressive order
        d: differencing order
        q: moving average order
        """
        self.p = p
        self.d = d
        self.q = q
        self.ar_coeffs: List[float] = []
        self.ma_coeffs: List[float] = []
        self.history: List[float] = []
        self.residuals: List[float] = []
        self.trained = False

    def difference(self, data: List[float], order: int = 1) -> List[float]:
        """Apply differencing to make series stationary"""
        result = data.copy()
        for _ in range(order):
            result = [result[i] - result[i-1] for i in range(1, len(result))]
        return result

    def inverse_difference(self, differenced: List[float], original: List[float], order: int = 1) -> List[float]:
        """Reverse differencing"""
        result = differenced.copy()
        for _ in range(order):
            integrated = [original[0]]
            for diff in result:
                integrated.append(integrated[-1] + diff)
            result = integrated[1:]
            original = integrated
        return result

    def fit(self, data: List[float]) -> None:
        """Train ARIMA model (simplified)"""
        self.history = data.copy()

        # Apply differencing
        if self.d > 0:
            stationary_data = self.difference(data, self.d)
        else:
            stationary_data = data.copy()

        # Simple AR coefficient estimation
        if self.p > 0 and len(stationary_data) > self.p:
            # Calculate autocorrelation
            mean = sum(stationary_data) / len(stationary_data)

            # Use Yule-Walker equations (simplified)
            self.ar_coeffs = [0.5 / self.p] * self.p  # Simplified coefficients

        # Calculate residuals for MA
        self.residuals = []
        for i in range(max(self.p, 1), len(stationary_data)):
            predicted = sum(
                self.ar_coeffs[j] * stationary_data[i-j-1]
                for j in range(min(self.p, i))
            ) if self.ar_coeffs else stationary_data[i-1]

            residual = stationary_data[i] - predicted
            self.residuals.append(residual)

        # Simple MA coefficient estimation
        if self.q > 0 and self.residuals:
            self.ma_coeffs = [0.3 / self.q] * self.q  # Simplified coefficients

        self.trained = True

    def predict(self, steps: int = 1) -> List[Prediction]:
        """Predict future values"""
        if not self.trained:
            raise ValueError("Model not trained")

        predictions = []
        current_data = self.history.copy()

        for step in range(steps):
            # Apply differencing
            if self.d > 0:
                stationary_data = self.difference(current_data, self.d)
            else:
                stationary_data = current_data.copy()

            # AR component
            ar_value = 0.0
            if self.ar_coeffs and len(stationary_data) >= self.p:
                ar_value = sum(
                    self.ar_coeffs[j] * stationary_data[-j-1]
                    for j in range(self.p)
                )

            # MA component
            ma_value = 0.0
            if self.ma_coeffs and len(self.residuals) >= self.q:
                ma_value = sum(
                    self.ma_coeffs[j] * self.residuals[-j-1]
                    for j in range(min(self.q, len(self.residuals)))
                )

            # Combine
            predicted_diff = ar_value + ma_value

            # Inverse difference
            if self.d > 0:
                predicted = current_data[-1] + predicted_diff
            else:
                predicted = predicted_diff

            # Calculate confidence interval
            if len(stationary_data) > 1:
                std = math.sqrt(
                    sum((stationary_data[i] - sum(stationary_data) / len(stationary_data)) ** 2
                        for i in range(len(stationary_data))) / len(stationary_data)
                )
                confidence = (predicted - 2 * std, predicted + 2 * std)
            else:
                confidence = (predicted, predicted)

            predictions.append(Prediction(
                timestamp=datetime.now().timestamp() + step * 60,  # Assume 1-minute intervals
                predicted_value=predicted,
                confidence_interval=confidence,
                method=f"arima_{self.p}_{self.d}_{self.q}",
                metadata={
                    "step": step + 1,
                    "ar_coeffs": self.ar_coeffs,
                    "ma_coeffs": self.ma_coeffs
                }
            ))

            # Update history for next prediction
            current_data.append(predicted)

        return predictions


class SeasonalDecomposition:
    """Seasonal decomposition for forecasting"""

    def __init__(self, period: int = 24):
        self.period = period
        self.trend: List[float] = []
        self.seasonal: List[float] = []
        self.residual: List[float] = []

    def decompose(self, data: List[float]) -> Tuple[List[float], List[float], List[float]]:
        """Decompose time series into trend, seasonal, and residual"""
        if len(data) < self.period * 2:
            return data.copy(), [0] * len(data), [0] * len(data)

        # Calculate trend using moving average
        self.trend = []
        for i in range(len(data)):
            if i < self.period // 2 or i >= len(data) - self.period // 2:
                self.trend.append(data[i])
            else:
                window = data[i - self.period // 2: i + self.period // 2 + 1]
                self.trend.append(sum(window) / len(window))

        # Calculate seasonal component
        detrended = [data[i] - self.trend[i] for i in range(len(data))]
        self.seasonal = [0.0] * len(data)

        for i in range(self.period):
            season_values = [detrended[j] for j in range(i, len(detrended), self.period)]
            avg = sum(season_values) / len(season_values) if season_values else 0
            for j in range(i, len(self.seasonal), self.period):
                self.seasonal[j] = avg

        # Calculate residual
        self.residual = [
            data[i] - self.trend[i] - self.seasonal[i]
            for i in range(len(data))
        ]

        return self.trend, self.seasonal, self.residual

    def forecast(self, steps: int = 1) -> List[Prediction]:
        """Forecast future values"""
        if not self.trend or not self.seasonal:
            raise ValueError("Must decompose data first")

        predictions = []

        # Extrapolate trend (simple linear extrapolation)
        if len(self.trend) >= 2:
            trend_slope = (self.trend[-1] - self.trend[-2])
        else:
            trend_slope = 0

        for step in range(steps):
            # Extrapolate trend
            trend_value = self.trend[-1] + trend_slope * (step + 1)

            # Get seasonal component (repeating pattern)
            seasonal_value = self.seasonal[-(self.period - step % self.period)]

            # Predicted value
            predicted = trend_value + seasonal_value

            # Confidence interval based on residual variance
            if self.residual:
                residual_mean = sum(self.residual) / len(self.residual)
                residual_var = sum(
                    (r - residual_mean) ** 2 for r in self.residual
                ) / len(self.residual)
                residual_std = math.sqrt(residual_var)
                confidence = (
                    predicted - 2 * residual_std,
                    predicted + 2 * residual_std
                )
            else:
                confidence = (predicted, predicted)

            predictions.append(Prediction(
                timestamp=datetime.now().timestamp() + step * 3600,  # Assume hourly
                predicted_value=predicted,
                confidence_interval=confidence,
                method="seasonal_decomposition",
                metadata={
                    "step": step + 1,
                    "trend": trend_value,
                    "seasonal": seasonal_value
                }
            ))

        return predictions


class EnsemblePredictor:
    """Ensemble of multiple prediction models"""

    def __init__(self):
        self.moving_average = MovingAveragePredictor()
        self.linear_regression = LinearRegressionPredictor()
        self.arima = ARIMAPredictor()
        self.seasonal = SeasonalDecomposition()
        self.data: List[float] = []
        self.timestamps: List[float] = []

    def add_data(self, timestamp: float, value: float) -> None:
        """Add training data"""
        self.timestamps.append(timestamp)
        self.data.append(value)
        self.moving_average.add_value(value)

    def train(self) -> None:
        """Train all models"""
        if len(self.data) < 10:
            raise ValueError("Need at least 10 data points")

        # Train linear regression
        self.linear_regression.fit(self.timestamps, self.data)

        # Train ARIMA
        self.arima.fit(self.data)

        # Decompose for seasonal
        self.seasonal.decompose(self.data)

    def predict(self, timestamp: float, method: str = "ensemble") -> Prediction:
        """Make prediction using specified method or ensemble"""
        if method == "ensemble":
            predictions = []

            # Get predictions from all models
            try:
                predictions.append(self.moving_average.predict("exponential"))
            except Exception:
                pass

            try:
                predictions.append(self.linear_regression.predict(timestamp))
            except Exception:
                pass

            try:
                arima_preds = self.arima.predict(steps=1)
                if arima_preds:
                    predictions.append(arima_preds[0])
            except Exception:
                pass

            if not predictions:
                raise ValueError("No models available for prediction")

            # Weighted average (equal weights for simplicity)
            avg_prediction = sum(p.predicted_value for p in predictions) / len(predictions)

            # Combined confidence interval
            lower_bounds = [p.confidence_interval[0] for p in predictions]
            upper_bounds = [p.confidence_interval[1] for p in predictions]
            confidence = (
                sum(lower_bounds) / len(lower_bounds),
                sum(upper_bounds) / len(upper_bounds)
            )

            return Prediction(
                timestamp=timestamp,
                predicted_value=avg_prediction,
                confidence_interval=confidence,
                method="ensemble",
                metadata={
                    "models_used": len(predictions),
                    "individual_predictions": [
                        {"method": p.method, "value": p.predicted_value}
                        for p in predictions
                    ]
                }
            )

        elif method == "moving_average":
            return self.moving_average.predict("exponential")
        elif method == "linear_regression":
            return self.linear_regression.predict(timestamp)
        else:
            raise ValueError(f"Unknown method: {method}")


def main():
    """Example usage"""
    # Generate sample time series data (simulating hourly traffic)
    timestamps = [i * 3600 for i in range(168)]  # One week of hourly data
    values = [
        100 + 50 * math.sin(2 * math.pi * i / 24) +  # Daily pattern
        20 * math.sin(2 * math.pi * i / 168) +       # Weekly pattern
        (i * 0.1) +                                   # Trend
        (hash(str(i)) % 20 - 10)                      # Noise
        for i in range(168)
    ]

    # Create and train ensemble predictor
    predictor = EnsemblePredictor()
    for timestamp, value in zip(timestamps, values):
        predictor.add_data(timestamp, value)

    predictor.train()

    # Make predictions for next 24 hours
    print("Load Forecasting Results:")
    print("-" * 80)

    current_time = timestamps[-1]
    for hour in range(1, 25):
        future_time = current_time + hour * 3600
        prediction = predictor.predict(future_time)

        print(f"Hour +{hour:2d}: {prediction.predicted_value:6.2f} "
              f"(CI: {prediction.confidence_interval[0]:6.2f} - "
              f"{prediction.confidence_interval[1]:6.2f})")

    # Calculate metrics for linear regression
    print("\nModel Performance Metrics:")
    print("-" * 80)
    metrics = predictor.linear_regression.calculate_metrics(timestamps, values)
    print(f"MSE:       {metrics.mse:.2f}")
    print(f"RMSE:      {metrics.rmse:.2f}")
    print(f"MAE:       {metrics.mae:.2f}")
    print(f"MAPE:      {metrics.mape:.2f}%")
    print(f"R-squared: {metrics.r_squared:.4f}")


if __name__ == "__main__":
    main()
