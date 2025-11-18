"""
Log analytics and pattern detection
"""

import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer
import json
import sys
import re
from typing import List, Dict, Any
from collections import Counter, defaultdict
from datetime import datetime, timedelta


class LogAnalyzer:
    """Real-time log analysis and pattern detection"""

    def __init__(self):
        self.log_buffer: List[Dict] = []
        self.patterns: Dict[str, int] = Counter()
        self.error_patterns: Dict[str, List[Dict]] = defaultdict(list)

    def ingest_logs(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Ingest log entries"""
        self.log_buffer.extend(logs)

        # Keep last 100K logs
        if len(self.log_buffer) > 100000:
            self.log_buffer = self.log_buffer[-100000:]

        return {
            'ingested': len(logs),
            'total_buffered': len(self.log_buffer)
        }

    def analyze_patterns(self, time_window_minutes: int = 60) -> Dict[str, Any]:
        """Analyze log patterns in time window"""
        if not self.log_buffer:
            return {'patterns': []}

        df = pd.DataFrame(self.log_buffer)

        # Convert timestamps
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            cutoff = datetime.now() - timedelta(minutes=time_window_minutes)
            df = df[df['timestamp'] >= cutoff]

        # Count log levels
        level_counts = df['level'].value_counts().to_dict() if 'level' in df.columns else {}

        # Extract patterns from messages
        if 'message' in df.columns:
            # Tokenize and count patterns
            messages = df['message'].astype(str)
            patterns = Counter()

            for msg in messages:
                # Extract error codes, IPs, etc.
                error_codes = re.findall(r'\b[45]\d{2}\b', msg)
                ip_addresses = re.findall(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', msg)

                patterns.update(error_codes)
                patterns.update(ip_addresses)

            top_patterns = [
                {'pattern': k, 'count': v}
                for k, v in patterns.most_common(20)
            ]
        else:
            top_patterns = []

        return {
            'total_logs': len(df),
            'time_window_minutes': time_window_minutes,
            'level_distribution': level_counts,
            'top_patterns': top_patterns
        }

    def detect_anomalies(self, threshold: float = 3.0) -> Dict[str, Any]:
        """Detect anomalous log patterns"""
        if len(self.log_buffer) < 100:
            return {'anomalies': []}

        df = pd.DataFrame(self.log_buffer)

        # Group by time buckets
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df.set_index('timestamp', inplace=True)

            # Count logs per minute
            counts = df.resample('1min').size()

            # Detect anomalies using z-score
            mean = counts.mean()
            std = counts.std()

            if std > 0:
                z_scores = np.abs((counts - mean) / std)
                anomalies = counts[z_scores > threshold]

                return {
                    'anomalies': [
                        {
                            'timestamp': ts.isoformat(),
                            'count': int(count),
                            'z_score': float(z_scores[ts]),
                            'expected_mean': float(mean)
                        }
                        for ts, count in anomalies.items()
                    ],
                    'normal_rate': float(mean),
                    'threshold': threshold
                }

        return {'anomalies': []}

    def aggregate_metrics(self, group_by: str = 'level') -> Dict[str, Any]:
        """Aggregate log metrics"""
        if not self.log_buffer:
            return {'metrics': {}}

        df = pd.DataFrame(self.log_buffer)

        if group_by in df.columns:
            grouped = df.groupby(group_by).agg({
                group_by: 'count'
            }).rename(columns={group_by: 'count'})

            return {
                'metrics': grouped.to_dict()['count'],
                'total': len(df)
            }

        return {'metrics': {}, 'total': len(df)}

    def search_logs(self, query: str, limit: int = 100) -> Dict[str, Any]:
        """Search logs by pattern"""
        if not self.log_buffer:
            return {'results': []}

        df = pd.DataFrame(self.log_buffer)

        if 'message' in df.columns:
            # Case-insensitive search
            mask = df['message'].astype(str).str.contains(query, case=False, na=False)
            results = df[mask].head(limit)

            return {
                'results': results.to_dict(orient='records'),
                'total_matches': int(mask.sum()),
                'returned': len(results)
            }

        return {'results': [], 'total_matches': 0}


analyzer = LogAnalyzer()


def process_stdin():
    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get('command')

            if command == 'ingest':
                logs = request['logs']
                result = analyzer.ingest_logs(logs)
                response = {'status': 'success', 'result': result}

            elif command == 'analyze':
                window = request.get('time_window_minutes', 60)
                result = analyzer.analyze_patterns(window)
                response = {'status': 'success', 'result': result}

            elif command == 'anomalies':
                threshold = request.get('threshold', 3.0)
                result = analyzer.detect_anomalies(threshold)
                response = {'status': 'success', 'result': result}

            elif command == 'aggregate':
                group_by = request.get('group_by', 'level')
                result = analyzer.aggregate_metrics(group_by)
                response = {'status': 'success', 'result': result}

            elif command == 'search':
                query = request['query']
                limit = request.get('limit', 100)
                result = analyzer.search_logs(query, limit)
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
