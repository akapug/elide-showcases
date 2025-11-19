"""Time Series Analysis - Python statsmodels"""
from typing import List, Dict, Any
from datetime import datetime, timedelta

class TimeSeriesAnalyzer:
    def detect_trend(self, values: List[float]) -> Dict[str, Any]:
        if len(values) < 2:
            return {"trend": "insufficient_data"}

        diffs = [values[i+1] - values[i] for i in range(len(values)-1)]
        avg_diff = sum(diffs) / len(diffs)

        if avg_diff > 0.1:
            return {"trend": "increasing", "slope": avg_diff}
        elif avg_diff < -0.1:
            return {"trend": "decreasing", "slope": avg_diff}
        return {"trend": "stable", "slope": avg_diff}

    def forecast(self, values: List[float], periods: int) -> List[float]:
        if not values:
            return []
        last_value = values[-1]
        trend = (values[-1] - values[0]) / len(values) if len(values) > 1 else 0
        return [last_value + trend * (i+1) for i in range(periods)]

ts = TimeSeriesAnalyzer()
