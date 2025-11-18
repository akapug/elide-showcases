"""
High-performance metrics aggregation using NumPy and pandas
"""

import pandas as pd
import numpy as np
from scipy import stats
import json
import sys
from typing import Dict, List, Any
from collections import defaultdict


class MetricsAggregator:
    """Real-time metrics aggregation and statistics"""

    def __init__(self):
        self.metrics: Dict[str, List[float]] = defaultdict(list)
        self.timestamps: Dict[str, List[str]] = defaultdict(list)

    def record_metrics(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Record metric data points"""
        for record in data:
            metric_name = record['name']
            value = record['value']
            timestamp = record.get('timestamp', '')

            self.metrics[metric_name].append(value)
            if timestamp:
                self.timestamps[metric_name].append(timestamp)

            # Keep last 100K datapoints per metric
            if len(self.metrics[metric_name]) > 100000:
                self.metrics[metric_name] = self.metrics[metric_name][-100000:]
                if metric_name in self.timestamps:
                    self.timestamps[metric_name] = self.timestamps[metric_name][-100000:]

        return {
            'recorded': len(data),
            'total_metrics': len(self.metrics)
        }

    def compute_statistics(self, metric_name: str) -> Dict[str, Any]:
        """Compute comprehensive statistics for a metric"""
        if metric_name not in self.metrics:
            return {'error': 'Metric not found'}

        values = np.array(self.metrics[metric_name])

        if len(values) == 0:
            return {'error': 'No data'}

        return {
            'count': len(values),
            'sum': float(np.sum(values)),
            'mean': float(np.mean(values)),
            'median': float(np.median(values)),
            'std': float(np.std(values)),
            'var': float(np.var(values)),
            'min': float(np.min(values)),
            'max': float(np.max(values)),
            'p50': float(np.percentile(values, 50)),
            'p90': float(np.percentile(values, 90)),
            'p95': float(np.percentile(values, 95)),
            'p99': float(np.percentile(values, 99)),
            'skewness': float(stats.skew(values)),
            'kurtosis': float(stats.kurtosis(values))
        }

    def aggregate_by_time(
        self,
        metric_name: str,
        interval: str = '1min',
        aggregation: str = 'mean'
    ) -> Dict[str, Any]:
        """Aggregate metrics by time interval"""
        if metric_name not in self.metrics or metric_name not in self.timestamps:
            return {'error': 'Metric not found or no timestamps'}

        df = pd.DataFrame({
            'timestamp': pd.to_datetime(self.timestamps[metric_name]),
            'value': self.metrics[metric_name]
        })

        df.set_index('timestamp', inplace=True)

        # Resample
        if aggregation == 'mean':
            resampled = df.resample(interval).mean()
        elif aggregation == 'sum':
            resampled = df.resample(interval).sum()
        elif aggregation == 'min':
            resampled = df.resample(interval).min()
        elif aggregation == 'max':
            resampled = df.resample(interval).max()
        elif aggregation == 'count':
            resampled = df.resample(interval).count()
        else:
            return {'error': f'Unknown aggregation: {aggregation}'}

        result = resampled.dropna()

        return {
            'interval': interval,
            'aggregation': aggregation,
            'data': [
                {
                    'timestamp': ts.isoformat(),
                    'value': float(row['value'])
                }
                for ts, row in result.iterrows()
            ],
            'count': len(result)
        }

    def compute_percentiles(
        self,
        metric_name: str,
        percentiles: List[float]
    ) -> Dict[str, Any]:
        """Compute custom percentiles"""
        if metric_name not in self.metrics:
            return {'error': 'Metric not found'}

        values = np.array(self.metrics[metric_name])

        if len(values) == 0:
            return {'error': 'No data'}

        result = {
            f'p{int(p)}': float(np.percentile(values, p))
            for p in percentiles
        }

        return result

    def rolling_statistics(
        self,
        metric_name: str,
        window: int = 100
    ) -> Dict[str, Any]:
        """Compute rolling statistics"""
        if metric_name not in self.metrics:
            return {'error': 'Metric not found'}

        values = self.metrics[metric_name]
        df = pd.DataFrame({'value': values})

        rolling = df.rolling(window=window)

        return {
            'window': window,
            'rolling_mean': float(rolling.mean().iloc[-1]['value']) if len(values) >= window else None,
            'rolling_std': float(rolling.std().iloc[-1]['value']) if len(values) >= window else None,
            'rolling_min': float(rolling.min().iloc[-1]['value']) if len(values) >= window else None,
            'rolling_max': float(rolling.max().iloc[-1]['value']) if len(values) >= window else None
        }


aggregator = MetricsAggregator()


def process_stdin():
    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get('command')

            if command == 'record':
                data = request['data']
                result = aggregator.record_metrics(data)
                response = {'status': 'success', 'result': result}

            elif command == 'statistics':
                metric_name = request['metric_name']
                result = aggregator.compute_statistics(metric_name)
                response = {'status': 'success', 'result': result}

            elif command == 'aggregate':
                metric_name = request['metric_name']
                interval = request.get('interval', '1min')
                agg = request.get('aggregation', 'mean')
                result = aggregator.aggregate_by_time(metric_name, interval, agg)
                response = {'status': 'success', 'result': result}

            elif command == 'percentiles':
                metric_name = request['metric_name']
                percentiles = request.get('percentiles', [50, 90, 95, 99])
                result = aggregator.compute_percentiles(metric_name, percentiles)
                response = {'status': 'success', 'result': result}

            elif command == 'rolling':
                metric_name = request['metric_name']
                window = request.get('window', 100)
                result = aggregator.rolling_statistics(metric_name, window)
                response = {'status': 'success', 'result': result}

            else:
                response = {'status': 'error', 'error': f'Unknown command: {command}'}

            print(json.dumps(response), flush=True)

        except Exception as e:
            import traceback
            print(json.dumps({
                'status': 'error',
                'error': str(e),
                'traceback': traceback.format_exc()
            }), flush=True)


if __name__ == "__main__":
    process_stdin()
