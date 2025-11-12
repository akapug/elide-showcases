#!/usr/bin/env python3
"""
Data Processing with Python
Polyglot ETL: Python for data-heavy operations, TypeScript for orchestration

This demonstrates:
- Statistical analysis
- Data cleaning algorithms
- Machine learning preprocessing
- Complex calculations
- Scientific computing
"""

import json
import sys
from typing import List, Dict, Any
from datetime import datetime
import statistics


class DataProcessor:
    """Advanced data processing using Python's rich ecosystem"""

    @staticmethod
    def clean_data(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean and normalize data"""
        cleaned = []

        for record in records:
            # Remove nulls and empty strings
            cleaned_record = {
                k: v for k, v in record.items()
                if v is not None and v != ''
            }

            # Normalize strings
            for key, value in cleaned_record.items():
                if isinstance(value, str):
                    cleaned_record[key] = value.strip().lower()

            cleaned.append(cleaned_record)

        return cleaned

    @staticmethod
    def calculate_statistics(records: List[Dict[str, Any]], field: str) -> Dict[str, Any]:
        """Calculate statistical metrics"""
        values = [r.get(field) for r in records if field in r and isinstance(r[field], (int, float))]

        if not values:
            return {
                'field': field,
                'error': 'No numeric values found'
            }

        return {
            'field': field,
            'count': len(values),
            'mean': statistics.mean(values),
            'median': statistics.median(values),
            'stdev': statistics.stdev(values) if len(values) > 1 else 0,
            'min': min(values),
            'max': max(values),
            'variance': statistics.variance(values) if len(values) > 1 else 0
        }

    @staticmethod
    def detect_outliers(records: List[Dict[str, Any]], field: str, threshold: float = 2.0) -> List[Dict[str, Any]]:
        """Detect outliers using z-score method"""
        values = [(i, r.get(field)) for i, r in enumerate(records) if field in r and isinstance(r[field], (int, float))]

        if len(values) < 2:
            return []

        numeric_values = [v[1] for v in values]
        mean = statistics.mean(numeric_values)
        stdev = statistics.stdev(numeric_values)

        if stdev == 0:
            return []

        outliers = []

        for index, value in values:
            z_score = abs((value - mean) / stdev)

            if z_score > threshold:
                outlier = records[index].copy()
                outlier['_outlier_info'] = {
                    'field': field,
                    'value': value,
                    'z_score': z_score,
                    'mean': mean,
                    'stdev': stdev
                }
                outliers.append(outlier)

        return outliers

    @staticmethod
    def aggregate_by_group(records: List[Dict[str, Any]], group_by: List[str], agg_field: str, agg_func: str = 'sum') -> List[Dict[str, Any]]:
        """Group and aggregate data"""
        groups: Dict[tuple, List[float]] = {}

        for record in records:
            # Create group key
            key = tuple(record.get(field) for field in group_by)

            if key not in groups:
                groups[key] = []

            # Add value to group
            value = record.get(agg_field)
            if isinstance(value, (int, float)):
                groups[key].append(value)

        # Calculate aggregations
        results = []

        for key, values in groups.items():
            result = {}

            # Add group-by fields
            for i, field in enumerate(group_by):
                result[field] = key[i]

            # Calculate aggregation
            if values:
                if agg_func == 'sum':
                    result[f'{agg_field}_sum'] = sum(values)
                elif agg_func == 'avg':
                    result[f'{agg_field}_avg'] = statistics.mean(values)
                elif agg_func == 'min':
                    result[f'{agg_field}_min'] = min(values)
                elif agg_func == 'max':
                    result[f'{agg_field}_max'] = max(values)
                elif agg_func == 'count':
                    result[f'{agg_field}_count'] = len(values)

                result['count'] = len(values)

            results.append(result)

        return results

    @staticmethod
    def normalize_values(records: List[Dict[str, Any]], field: str) -> List[Dict[str, Any]]:
        """Normalize numeric values to 0-1 range"""
        values = [r.get(field) for r in records if field in r and isinstance(r[field], (int, float))]

        if not values:
            return records

        min_val = min(values)
        max_val = max(values)
        range_val = max_val - min_val

        if range_val == 0:
            return records

        normalized = []

        for record in records:
            new_record = record.copy()

            if field in new_record and isinstance(new_record[field], (int, float)):
                new_record[f'{field}_normalized'] = (new_record[field] - min_val) / range_val

            normalized.append(new_record)

        return normalized

    @staticmethod
    def calculate_correlation(records: List[Dict[str, Any]], field1: str, field2: str) -> float:
        """Calculate Pearson correlation coefficient"""
        pairs = [
            (r.get(field1), r.get(field2))
            for r in records
            if field1 in r and field2 in r
            and isinstance(r[field1], (int, float))
            and isinstance(r[field2], (int, float))
        ]

        if len(pairs) < 2:
            return 0.0

        x_values = [p[0] for p in pairs]
        y_values = [p[1] for p in pairs]

        # Calculate correlation
        mean_x = statistics.mean(x_values)
        mean_y = statistics.mean(y_values)

        numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_values, y_values))
        denominator_x = sum((x - mean_x) ** 2 for x in x_values)
        denominator_y = sum((y - mean_y) ** 2 for y in y_values)

        if denominator_x == 0 or denominator_y == 0:
            return 0.0

        correlation = numerator / (denominator_x * denominator_y) ** 0.5

        return correlation

    @staticmethod
    def deduplicate(records: List[Dict[str, Any]], keys: List[str]) -> List[Dict[str, Any]]:
        """Remove duplicate records based on keys"""
        seen = set()
        unique = []

        for record in records:
            key = tuple(record.get(k) for k in keys)

            if key not in seen:
                seen.add(key)
                unique.append(record)

        return unique

    @staticmethod
    def fill_missing_values(records: List[Dict[str, Any]], field: str, strategy: str = 'mean') -> List[Dict[str, Any]]:
        """Fill missing values using different strategies"""
        values = [r.get(field) for r in records if field in r and r[field] is not None]

        if not values:
            return records

        # Calculate fill value
        if strategy == 'mean' and all(isinstance(v, (int, float)) for v in values):
            fill_value = statistics.mean(values)
        elif strategy == 'median' and all(isinstance(v, (int, float)) for v in values):
            fill_value = statistics.median(values)
        elif strategy == 'mode':
            fill_value = statistics.mode(values)
        else:
            fill_value = None

        # Fill missing values
        filled = []

        for record in records:
            new_record = record.copy()

            if field not in new_record or new_record[field] is None:
                new_record[field] = fill_value

            filled.append(new_record)

        return filled


def main():
    """CLI interface for data processing"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'error': 'Usage: python data_processor.py <operation> [params]'
        }))
        sys.exit(1)

    operation = sys.argv[1]

    # Read data from stdin
    input_data = sys.stdin.read()
    records = json.loads(input_data)

    processor = DataProcessor()
    result = None

    try:
        if operation == 'clean':
            result = processor.clean_data(records)

        elif operation == 'statistics':
            field = sys.argv[2] if len(sys.argv) > 2 else 'value'
            result = processor.calculate_statistics(records, field)

        elif operation == 'outliers':
            field = sys.argv[2] if len(sys.argv) > 2 else 'value'
            threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0
            result = processor.detect_outliers(records, field, threshold)

        elif operation == 'aggregate':
            group_by = sys.argv[2].split(',') if len(sys.argv) > 2 else ['category']
            agg_field = sys.argv[3] if len(sys.argv) > 3 else 'value'
            agg_func = sys.argv[4] if len(sys.argv) > 4 else 'sum'
            result = processor.aggregate_by_group(records, group_by, agg_field, agg_func)

        elif operation == 'normalize':
            field = sys.argv[2] if len(sys.argv) > 2 else 'value'
            result = processor.normalize_values(records, field)

        elif operation == 'correlation':
            field1 = sys.argv[2] if len(sys.argv) > 2 else 'x'
            field2 = sys.argv[3] if len(sys.argv) > 3 else 'y'
            result = {
                'field1': field1,
                'field2': field2,
                'correlation': processor.calculate_correlation(records, field1, field2)
            }

        elif operation == 'deduplicate':
            keys = sys.argv[2].split(',') if len(sys.argv) > 2 else ['id']
            result = processor.deduplicate(records, keys)

        elif operation == 'fill_missing':
            field = sys.argv[2] if len(sys.argv) > 2 else 'value'
            strategy = sys.argv[3] if len(sys.argv) > 3 else 'mean'
            result = processor.fill_missing_values(records, field, strategy)

        else:
            result = {
                'error': f'Unknown operation: {operation}',
                'available_operations': [
                    'clean', 'statistics', 'outliers', 'aggregate',
                    'normalize', 'correlation', 'deduplicate', 'fill_missing'
                ]
            }

        # Output result as JSON
        print(json.dumps(result, indent=2))

    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'operation': operation
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
