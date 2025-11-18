"""
Streaming data processor for ETL pipelines
"""

import pandas as pd
import numpy as np
import json
import sys
from typing import Dict, List, Any, Callable
from collections import deque


class StreamProcessor:
    """Process streaming data with windowing and aggregation"""

    def __init__(self):
        self.windows: Dict[str, deque] = {}
        self.aggregators: Dict[str, Callable] = {
            'sum': np.sum,
            'mean': np.mean,
            'min': np.min,
            'max': np.max,
            'count': len,
            'std': np.std
        }

    def process_batch(
        self,
        records: List[Dict[str, Any]],
        transformations: List[str]
    ) -> List[Dict[str, Any]]:
        """Process a batch of records"""
        df = pd.DataFrame(records)

        for transform in transformations:
            if transform == 'deduplicate':
                df = df.drop_duplicates()
            elif transform == 'fill_nulls':
                df = df.fillna(method='ffill')
            elif transform == 'normalize':
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                for col in numeric_cols:
                    col_min = df[col].min()
                    col_max = df[col].max()
                    if col_max > col_min:
                        df[col] = (df[col] - col_min) / (col_max - col_min)

        return df.to_dict(orient='records')

    def window_aggregate(
        self,
        window_id: str,
        record: Dict[str, Any],
        window_size: int,
        aggregation: str,
        value_key: str
    ) -> Dict[str, Any]:
        """Aggregate records in a sliding window"""
        if window_id not in self.windows:
            self.windows[window_id] = deque(maxlen=window_size)

        self.windows[window_id].append(record)

        values = [r[value_key] for r in self.windows[window_id] if value_key in r]

        if not values:
            return {'error': 'No values to aggregate'}

        agg_func = self.aggregators.get(aggregation)
        if not agg_func:
            return {'error': f'Unknown aggregation: {aggregation}'}

        result = agg_func(values)

        return {
            'window_id': window_id,
            'window_size': len(self.windows[window_id]),
            'aggregation': aggregation,
            'value': float(result) if isinstance(result, (int, float, np.number)) else result
        }

    def detect_patterns(
        self,
        records: List[Dict[str, Any]],
        pattern_key: str
    ) -> Dict[str, Any]:
        """Detect patterns in streaming data"""
        df = pd.DataFrame(records)

        if pattern_key not in df.columns:
            return {'error': f'Key {pattern_key} not found'}

        # Count occurrences
        value_counts = df[pattern_key].value_counts().to_dict()

        # Find trends
        if len(df) > 1:
            df['index'] = range(len(df))
            numeric_cols = df.select_dtypes(include=[np.number]).columns

            trends = {}
            for col in numeric_cols:
                if col != 'index':
                    correlation = df['index'].corr(df[col])
                    trends[col] = 'increasing' if correlation > 0.5 else 'decreasing' if correlation < -0.5 else 'stable'
        else:
            trends = {}

        return {
            'patterns': value_counts,
            'trends': trends,
            'record_count': len(df)
        }

    def enrich_stream(
        self,
        records: List[Dict[str, Any]],
        lookup_data: Dict[str, Any],
        join_key: str
    ) -> List[Dict[str, Any]]:
        """Enrich streaming records with lookup data"""
        enriched = []

        for record in records:
            enriched_record = record.copy()

            if join_key in record:
                lookup_value = record[join_key]
                if str(lookup_value) in lookup_data:
                    enriched_record.update(lookup_data[str(lookup_value)])

            enriched.append(enriched_record)

        return enriched


processor = StreamProcessor()


def process_stdin():
    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get('command')

            if command == 'process_batch':
                records = request['records']
                transformations = request.get('transformations', [])
                result = processor.process_batch(records, transformations)
                response = {'status': 'success', 'result': result}

            elif command == 'window_aggregate':
                window_id = request['window_id']
                record = request['record']
                window_size = request.get('window_size', 100)
                aggregation = request.get('aggregation', 'mean')
                value_key = request['value_key']
                result = processor.window_aggregate(
                    window_id, record, window_size, aggregation, value_key
                )
                response = {'status': 'success', 'result': result}

            elif command == 'detect_patterns':
                records = request['records']
                pattern_key = request['pattern_key']
                result = processor.detect_patterns(records, pattern_key)
                response = {'status': 'success', 'result': result}

            elif command == 'enrich':
                records = request['records']
                lookup_data = request['lookup_data']
                join_key = request['join_key']
                result = processor.enrich_stream(records, lookup_data, join_key)
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
