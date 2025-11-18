"""
Time-series analytics using NumPy, pandas, and statsmodels
"""

import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller
import json
import sys
from typing import Dict, List, Any


class TimeSeriesAnalyzer:
    """Real-time time-series analytics"""

    def __init__(self):
        self.data_buffer: Dict[str, pd.DataFrame] = {}

    def add_datapoints(self, sensor_id: str, timestamps: List[str], values: List[float]):
        """Add new datapoints to sensor buffer"""
        df = pd.DataFrame({
            'timestamp': pd.to_datetime(timestamps),
            'value': values
        })
        df.set_index('timestamp', inplace=True)

        if sensor_id in self.data_buffer:
            self.data_buffer[sensor_id] = pd.concat([self.data_buffer[sensor_id], df])
            # Keep last 10000 points
            self.data_buffer[sensor_id] = self.data_buffer[sensor_id].tail(10000)
        else:
            self.data_buffer[sensor_id] = df

    def calculate_statistics(self, sensor_id: str) -> Dict[str, Any]:
        """Calculate rolling statistics"""
        if sensor_id not in self.data_buffer:
            return {}

        df = self.data_buffer[sensor_id]
        values = df['value'].values

        return {
            'mean': float(np.mean(values)),
            'median': float(np.median(values)),
            'std': float(np.std(values)),
            'min': float(np.min(values)),
            'max': float(np.max(values)),
            'q25': float(np.percentile(values, 25)),
            'q75': float(np.percentile(values, 75)),
            'count': len(values),
            'skewness': float(stats.skew(values)),
            'kurtosis': float(stats.kurtosis(values)),
        }

    def detect_anomalies(self, sensor_id: str, threshold: float = 3.0) -> Dict[str, Any]:
        """Detect anomalies using z-score"""
        if sensor_id not in self.data_buffer:
            return {'anomalies': []}

        df = self.data_buffer[sensor_id]
        values = df['value'].values

        mean = np.mean(values)
        std = np.std(values)
        z_scores = np.abs((values - mean) / std)

        anomaly_indices = np.where(z_scores > threshold)[0]

        return {
            'anomalies': [
                {
                    'index': int(idx),
                    'timestamp': df.index[idx].isoformat(),
                    'value': float(values[idx]),
                    'z_score': float(z_scores[idx])
                }
                for idx in anomaly_indices[-100:]  # Last 100 anomalies
            ],
            'anomaly_count': len(anomaly_indices),
            'anomaly_rate': float(len(anomaly_indices) / len(values))
        }

    def calculate_trends(self, sensor_id: str, window: int = 20) -> Dict[str, Any]:
        """Calculate moving averages and trends"""
        if sensor_id not in self.data_buffer:
            return {}

        df = self.data_buffer[sensor_id]

        df['sma_20'] = df['value'].rolling(window=window).mean()
        df['ema_20'] = df['value'].ewm(span=window).mean()

        latest = df.iloc[-1]

        return {
            'current_value': float(latest['value']),
            'sma_20': float(latest['sma_20']) if not pd.isna(latest['sma_20']) else None,
            'ema_20': float(latest['ema_20']) if not pd.isna(latest['ema_20']) else None,
            'trend': 'up' if latest['value'] > latest['sma_20'] else 'down' if not pd.isna(latest['sma_20']) else 'neutral'
        }

    def resample_data(self, sensor_id: str, freq: str = '1H') -> Dict[str, Any]:
        """Resample time-series data"""
        if sensor_id not in self.data_buffer:
            return {}

        df = self.data_buffer[sensor_id]
        resampled = df.resample(freq).agg({
            'value': ['mean', 'min', 'max', 'std', 'count']
        })

        return {
            'frequency': freq,
            'data': resampled.tail(100).to_dict(orient='records')
        }


# Global analyzer instance
analyzer = TimeSeriesAnalyzer()


def process_stdin():
    """Process commands from stdin"""
    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get('command')

            if command == 'add_datapoints':
                sensor_id = request['sensor_id']
                timestamps = request['timestamps']
                values = request['values']
                analyzer.add_datapoints(sensor_id, timestamps, values)
                response = {'status': 'success', 'result': {'added': len(values)}}

            elif command == 'statistics':
                sensor_id = request['sensor_id']
                result = analyzer.calculate_statistics(sensor_id)
                response = {'status': 'success', 'result': result}

            elif command == 'detect_anomalies':
                sensor_id = request['sensor_id']
                threshold = request.get('threshold', 3.0)
                result = analyzer.detect_anomalies(sensor_id, threshold)
                response = {'status': 'success', 'result': result}

            elif command == 'trends':
                sensor_id = request['sensor_id']
                window = request.get('window', 20)
                result = analyzer.calculate_trends(sensor_id, window)
                response = {'status': 'success', 'result': result}

            elif command == 'resample':
                sensor_id = request['sensor_id']
                freq = request.get('freq', '1H')
                result = analyzer.resample_data(sensor_id, freq)
                response = {'status': 'success', 'result': result}

            else:
                response = {'status': 'error', 'error': f'Unknown command: {command}'}

            print(json.dumps(response), flush=True)

        except Exception as e:
            print(json.dumps({'status': 'error', 'error': str(e)}), flush=True)


if __name__ == "__main__":
    process_stdin()
