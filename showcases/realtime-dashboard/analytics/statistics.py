"""
Statistical Analysis Module

Provides comprehensive statistical analysis for metrics data.
Includes descriptive statistics, correlation analysis, and trend detection.
"""

import json
import sys
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from math import sqrt, log


@dataclass
class DescriptiveStats:
    """Descriptive statistics for a dataset."""
    count: int
    mean: float
    median: float
    mode: Optional[float]
    std_dev: float
    variance: float
    min_value: float
    max_value: float
    range: float
    q1: float
    q3: float
    iqr: float
    skewness: float
    kurtosis: float


class StatisticalAnalyzer:
    """Performs statistical analysis on metrics data."""

    @staticmethod
    def calculate_descriptive_stats(data: List[float]) -> Dict:
        """Calculate comprehensive descriptive statistics."""
        if not data:
            return {"error": "No data provided"}

        n = len(data)
        sorted_data = sorted(data)

        # Basic stats
        mean = sum(data) / n
        median = StatisticalAnalyzer._calculate_median(sorted_data)
        mode = StatisticalAnalyzer._calculate_mode(data)

        # Variance and standard deviation
        variance = sum((x - mean) ** 2 for x in data) / n
        std_dev = sqrt(variance)

        # Range
        min_val = min(data)
        max_val = max(data)
        range_val = max_val - min_val

        # Quartiles
        q1 = StatisticalAnalyzer._calculate_percentile(sorted_data, 25)
        q3 = StatisticalAnalyzer._calculate_percentile(sorted_data, 75)
        iqr = q3 - q1

        # Skewness and kurtosis
        skewness = StatisticalAnalyzer._calculate_skewness(data, mean, std_dev)
        kurtosis = StatisticalAnalyzer._calculate_kurtosis(data, mean, std_dev)

        return {
            "count": n,
            "mean": mean,
            "median": median,
            "mode": mode,
            "std_dev": std_dev,
            "variance": variance,
            "min": min_val,
            "max": max_val,
            "range": range_val,
            "q1": q1,
            "q3": q3,
            "iqr": iqr,
            "skewness": skewness,
            "kurtosis": kurtosis,
            "coefficient_of_variation": (std_dev / mean) * 100 if mean != 0 else 0
        }

    @staticmethod
    def calculate_percentiles(data: List[float], percentiles: List[int]) -> Dict[str, float]:
        """Calculate specified percentiles."""
        if not data:
            return {}

        sorted_data = sorted(data)
        result = {}

        for p in percentiles:
            value = StatisticalAnalyzer._calculate_percentile(sorted_data, p)
            result[f"p{p}"] = value

        return result

    @staticmethod
    def _calculate_percentile(sorted_data: List[float], percentile: int) -> float:
        """Calculate a specific percentile."""
        n = len(sorted_data)
        k = (n - 1) * percentile / 100
        f = int(k)
        c = k - f

        if f + 1 < n:
            return sorted_data[f] + c * (sorted_data[f + 1] - sorted_data[f])
        return sorted_data[f]

    @staticmethod
    def _calculate_median(sorted_data: List[float]) -> float:
        """Calculate median."""
        n = len(sorted_data)
        if n % 2 == 0:
            return (sorted_data[n // 2 - 1] + sorted_data[n // 2]) / 2
        return sorted_data[n // 2]

    @staticmethod
    def _calculate_mode(data: List[float]) -> Optional[float]:
        """Calculate mode (most frequent value)."""
        if not data:
            return None

        frequency = {}
        for value in data:
            # Round to avoid floating point issues
            rounded = round(value, 2)
            frequency[rounded] = frequency.get(rounded, 0) + 1

        max_freq = max(frequency.values())
        if max_freq == 1:
            return None  # No mode if all values appear once

        # Return the mode with highest frequency
        for value, freq in frequency.items():
            if freq == max_freq:
                return value

        return None

    @staticmethod
    def _calculate_skewness(data: List[float], mean: float, std_dev: float) -> float:
        """Calculate skewness (measure of asymmetry)."""
        if std_dev == 0:
            return 0

        n = len(data)
        m3 = sum((x - mean) ** 3 for x in data) / n
        return m3 / (std_dev ** 3)

    @staticmethod
    def _calculate_kurtosis(data: List[float], mean: float, std_dev: float) -> float:
        """Calculate kurtosis (measure of tailedness)."""
        if std_dev == 0:
            return 0

        n = len(data)
        m4 = sum((x - mean) ** 4 for x in data) / n
        return (m4 / (std_dev ** 4)) - 3  # Excess kurtosis

    @staticmethod
    def calculate_correlation(x: List[float], y: List[float]) -> float:
        """Calculate Pearson correlation coefficient."""
        if len(x) != len(y) or len(x) == 0:
            return 0

        n = len(x)
        mean_x = sum(x) / n
        mean_y = sum(y) / n

        numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
        denom_x = sqrt(sum((x[i] - mean_x) ** 2 for i in range(n)))
        denom_y = sqrt(sum((y[i] - mean_y) ** 2 for i in range(n)))

        if denom_x == 0 or denom_y == 0:
            return 0

        return numerator / (denom_x * denom_y)

    @staticmethod
    def detect_trend(data: List[float]) -> Dict:
        """Detect trend in time series data."""
        if len(data) < 2:
            return {"trend": "insufficient_data"}

        # Use simple linear regression to detect trend
        n = len(data)
        x = list(range(n))
        y = data

        x_mean = sum(x) / n
        y_mean = sum(y) / n

        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            slope = 0
        else:
            slope = numerator / denominator

        # Calculate R-squared
        y_pred = [slope * x[i] + (y_mean - slope * x_mean) for i in range(n)]
        ss_res = sum((y[i] - y_pred[i]) ** 2 for i in range(n))
        ss_tot = sum((y[i] - y_mean) ** 2 for i in range(n))
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0

        # Determine trend direction
        if abs(slope) < 0.01:
            trend_direction = "stable"
        elif slope > 0:
            trend_direction = "increasing"
        else:
            trend_direction = "decreasing"

        # Determine trend strength based on R-squared
        if r_squared > 0.7:
            trend_strength = "strong"
        elif r_squared > 0.4:
            trend_strength = "moderate"
        else:
            trend_strength = "weak"

        return {
            "trend": trend_direction,
            "strength": trend_strength,
            "slope": slope,
            "r_squared": r_squared,
            "interpretation": StatisticalAnalyzer._interpret_trend(
                trend_direction, trend_strength, slope
            )
        }

    @staticmethod
    def _interpret_trend(direction: str, strength: str, slope: float) -> str:
        """Generate human-readable trend interpretation."""
        if direction == "stable":
            return "The metric shows no significant trend over time."
        elif direction == "increasing":
            rate = abs(slope)
            return f"The metric is {strength}ly increasing at a rate of {rate:.4f} per time unit."
        else:
            rate = abs(slope)
            return f"The metric is {strength}ly decreasing at a rate of {rate:.4f} per time unit."

    @staticmethod
    def calculate_moving_stats(
        data: List[float],
        window_size: int
    ) -> List[Dict]:
        """Calculate moving statistics over a sliding window."""
        if len(data) < window_size:
            return []

        results = []
        for i in range(window_size, len(data) + 1):
            window = data[i - window_size:i]
            window_mean = sum(window) / len(window)
            window_std = sqrt(sum((x - window_mean) ** 2 for x in window) / len(window))

            results.append({
                "index": i - 1,
                "mean": window_mean,
                "std_dev": window_std,
                "min": min(window),
                "max": max(window)
            })

        return results

    @staticmethod
    def calculate_rate_of_change(data: List[float], period: int = 1) -> List[float]:
        """Calculate rate of change over specified period."""
        if len(data) <= period:
            return []

        rates = []
        for i in range(period, len(data)):
            if data[i - period] != 0:
                rate = ((data[i] - data[i - period]) / data[i - period]) * 100
            else:
                rate = 0
            rates.append(rate)

        return rates


def analyze_metrics(data: List[Dict], options: Optional[Dict] = None) -> Dict:
    """
    Perform comprehensive statistical analysis on metrics data.

    Args:
        data: List of metric data points with 'timestamp' and 'value' keys
        options: Analysis options (e.g., percentiles, window_size)

    Returns:
        Dictionary with complete analysis results
    """
    if not data:
        return {
            "status": "error",
            "message": "No data provided"
        }

    options = options or {}
    values = [d["value"] for d in data]

    # Descriptive statistics
    descriptive = StatisticalAnalyzer.calculate_descriptive_stats(values)

    # Percentiles
    percentiles_to_calc = options.get("percentiles", [10, 25, 50, 75, 90, 95, 99])
    percentiles = StatisticalAnalyzer.calculate_percentiles(values, percentiles_to_calc)

    # Trend analysis
    trend = StatisticalAnalyzer.detect_trend(values)

    # Moving statistics
    window_size = options.get("window_size", 10)
    moving_stats = StatisticalAnalyzer.calculate_moving_stats(values, window_size)

    # Rate of change
    rate_of_change = StatisticalAnalyzer.calculate_rate_of_change(values)
    avg_rate_of_change = sum(rate_of_change) / len(rate_of_change) if rate_of_change else 0

    return {
        "status": "success",
        "data_points": len(data),
        "time_range": {
            "start": data[0]["timestamp"],
            "end": data[-1]["timestamp"],
            "duration_ms": data[-1]["timestamp"] - data[0]["timestamp"]
        },
        "descriptive_statistics": descriptive,
        "percentiles": percentiles,
        "trend_analysis": trend,
        "rate_of_change": {
            "average": avg_rate_of_change,
            "values": rate_of_change[-10:] if len(rate_of_change) > 10 else rate_of_change
        },
        "moving_statistics": {
            "window_size": window_size,
            "count": len(moving_stats),
            "latest": moving_stats[-5:] if len(moving_stats) > 5 else moving_stats
        }
    }


def compare_metrics(data1: List[Dict], data2: List[Dict]) -> Dict:
    """
    Compare two metrics datasets.

    Args:
        data1: First dataset
        data2: Second dataset

    Returns:
        Comparison results including correlation
    """
    if not data1 or not data2:
        return {
            "status": "error",
            "message": "Both datasets required"
        }

    values1 = [d["value"] for d in data1]
    values2 = [d["value"] for d in data2]

    # Ensure same length for correlation
    min_len = min(len(values1), len(values2))
    values1 = values1[:min_len]
    values2 = values2[:min_len]

    correlation = StatisticalAnalyzer.calculate_correlation(values1, values2)

    # Calculate statistics for both
    stats1 = StatisticalAnalyzer.calculate_descriptive_stats(values1)
    stats2 = StatisticalAnalyzer.calculate_descriptive_stats(values2)

    return {
        "status": "success",
        "correlation": correlation,
        "correlation_strength": StatisticalAnalyzer._interpret_correlation(correlation),
        "dataset1_stats": stats1,
        "dataset2_stats": stats2,
        "mean_difference": stats1["mean"] - stats2["mean"],
        "std_dev_difference": stats1["std_dev"] - stats2["std_dev"]
    }


def _interpret_correlation(corr: float) -> str:
    """Interpret correlation coefficient."""
    abs_corr = abs(corr)
    if abs_corr > 0.9:
        strength = "very strong"
    elif abs_corr > 0.7:
        strength = "strong"
    elif abs_corr > 0.5:
        strength = "moderate"
    elif abs_corr > 0.3:
        strength = "weak"
    else:
        strength = "very weak"

    direction = "positive" if corr >= 0 else "negative"
    return f"{strength} {direction} correlation"


StatisticalAnalyzer._interpret_correlation = staticmethod(_interpret_correlation)


def main():
    """Main entry point for command-line usage."""
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r') as f:
            config = json.load(f)
    else:
        config = json.load(sys.stdin)

    data = config.get("data", [])
    options = config.get("options", {})

    result = analyze_metrics(data, options)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()


def demo():
    """Demonstrate statistical analysis capabilities."""
    import random

    print("=" * 60)
    print("Statistical Analysis Demo")
    print("=" * 60)

    # Generate sample data
    base_time = 1000000
    data = []

    for i in range(100):
        value = 50 + i * 0.3 + random.gauss(0, 5)
        data.append({"timestamp": base_time + i * 1000, "value": value})

    # Analyze
    result = analyze_metrics(data, {"window_size": 10})

    print(f"\nAnalysis Results:")
    print(f"  Data points: {result['data_points']}")
    print(f"  Duration: {result['time_range']['duration_ms'] / 1000:.2f} seconds")

    print(f"\nDescriptive Statistics:")
    stats = result['descriptive_statistics']
    print(f"  Mean: {stats['mean']:.2f}")
    print(f"  Median: {stats['median']:.2f}")
    print(f"  Std Dev: {stats['std_dev']:.2f}")
    print(f"  Min: {stats['min']:.2f}")
    print(f"  Max: {stats['max']:.2f}")
    print(f"  IQR: {stats['iqr']:.2f}")
    print(f"  Skewness: {stats['skewness']:.4f}")
    print(f"  Kurtosis: {stats['kurtosis']:.4f}")

    print(f"\nPercentiles:")
    for name, value in result['percentiles'].items():
        print(f"  {name}: {value:.2f}")

    print(f"\nTrend Analysis:")
    trend = result['trend_analysis']
    print(f"  {trend['interpretation']}")
    print(f"  R²: {trend['r_squared']:.4f}")

    print(f"\nRate of Change:")
    print(f"  Average: {result['rate_of_change']['average']:.2f}%")


# Uncomment to run demo
# if __name__ == "__main__":
#     demo()
