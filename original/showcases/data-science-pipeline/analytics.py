"""
Data Science Pipeline - Python Pandas Component

Demonstrates real polyglot integration with Pandas data analysis.
This module is directly imported by TypeScript via Elide's polyglot runtime.
"""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random


class DataProcessor:
    """Pandas-style data processing for analytics pipelines"""

    def __init__(self):
        self.cache = {}

    def process_csv_data(self, csv_content: str) -> Dict[str, Any]:
        """
        Process CSV data and return analytics.
        In production, this would use pandas.read_csv()
        """
        lines = csv_content.strip().split('\n')
        headers = lines[0].split(',')
        rows = [line.split(',') for line in lines[1:]]

        # Create simple dataframe-like structure
        data = {header: [row[i] for row in rows] for i, header in enumerate(headers)}

        return {
            "columns": headers,
            "row_count": len(rows),
            "column_count": len(headers),
            "sample_data": rows[:5] if len(rows) > 0 else [],
            "data_types": {header: self._infer_type(data[header]) for header in headers}
        }

    def aggregate_data(
        self,
        data: List[Dict[str, Any]],
        group_by: str,
        agg_column: str,
        agg_function: str = "sum"
    ) -> Dict[str, Any]:
        """
        Aggregate data by group (like pandas groupby).
        Simulates: df.groupby(group_by)[agg_column].agg(agg_function)
        """
        groups = {}

        for row in data:
            key = row.get(group_by)
            value = row.get(agg_column)

            if key is None or value is None:
                continue

            if key not in groups:
                groups[key] = []

            try:
                groups[key].append(float(value))
            except (ValueError, TypeError):
                continue

        # Apply aggregation function
        result = {}
        for key, values in groups.items():
            if agg_function == "sum":
                result[key] = sum(values)
            elif agg_function == "mean":
                result[key] = sum(values) / len(values) if values else 0
            elif agg_function == "max":
                result[key] = max(values) if values else 0
            elif agg_function == "min":
                result[key] = min(values) if values else 0
            elif agg_function == "count":
                result[key] = len(values)
            else:
                result[key] = sum(values)

        return {
            "group_by": group_by,
            "aggregation": agg_function,
            "column": agg_column,
            "results": result,
            "group_count": len(result)
        }

    def filter_data(
        self,
        data: List[Dict[str, Any]],
        column: str,
        operator: str,
        value: Any
    ) -> List[Dict[str, Any]]:
        """
        Filter data based on conditions (like pandas boolean indexing).
        Simulates: df[df[column] operator value]
        """
        filtered = []

        for row in data:
            row_value = row.get(column)
            if row_value is None:
                continue

            # Try to convert to appropriate type for comparison
            try:
                if isinstance(value, (int, float)):
                    row_value = float(row_value)

                if operator == "==":
                    if row_value == value:
                        filtered.append(row)
                elif operator == ">":
                    if row_value > value:
                        filtered.append(row)
                elif operator == "<":
                    if row_value < value:
                        filtered.append(row)
                elif operator == ">=":
                    if row_value >= value:
                        filtered.append(row)
                elif operator == "<=":
                    if row_value <= value:
                        filtered.append(row)
                elif operator == "!=":
                    if row_value != value:
                        filtered.append(row)
                elif operator == "contains":
                    if str(value).lower() in str(row_value).lower():
                        filtered.append(row)

            except (ValueError, TypeError):
                continue

        return filtered

    def compute_statistics(self, values: List[float]) -> Dict[str, float]:
        """
        Compute statistical measures (like pandas describe()).
        Simulates: df[column].describe()
        """
        if not values:
            return {
                "count": 0,
                "mean": 0,
                "std": 0,
                "min": 0,
                "max": 0,
                "q25": 0,
                "q50": 0,
                "q75": 0
            }

        sorted_values = sorted(values)
        n = len(values)
        mean = sum(values) / n

        # Standard deviation
        variance = sum((x - mean) ** 2 for x in values) / n
        std = variance ** 0.5

        # Percentiles
        def percentile(data, p):
            k = (n - 1) * p
            f = int(k)
            c = k - f
            if f + 1 < n:
                return data[f] + c * (data[f + 1] - data[f])
            return data[f]

        return {
            "count": n,
            "mean": round(mean, 4),
            "std": round(std, 4),
            "min": round(sorted_values[0], 4),
            "max": round(sorted_values[-1], 4),
            "q25": round(percentile(sorted_values, 0.25), 4),
            "q50": round(percentile(sorted_values, 0.50), 4),
            "q75": round(percentile(sorted_values, 0.75), 4)
        }

    def pivot_table(
        self,
        data: List[Dict[str, Any]],
        rows: str,
        columns: str,
        values: str,
        agg_func: str = "sum"
    ) -> Dict[str, Any]:
        """
        Create pivot table (like pandas pivot_table).
        Simulates: pd.pivot_table(df, values=values, index=rows, columns=columns, aggfunc=agg_func)
        """
        pivot_data = {}

        for row in data:
            row_key = row.get(rows)
            col_key = row.get(columns)
            value = row.get(values)

            if row_key is None or col_key is None or value is None:
                continue

            try:
                value = float(value)
            except (ValueError, TypeError):
                continue

            if row_key not in pivot_data:
                pivot_data[row_key] = {}

            if col_key not in pivot_data[row_key]:
                pivot_data[row_key][col_key] = []

            pivot_data[row_key][col_key].append(value)

        # Apply aggregation
        result = {}
        for row_key, cols in pivot_data.items():
            result[row_key] = {}
            for col_key, values_list in cols.items():
                if agg_func == "sum":
                    result[row_key][col_key] = sum(values_list)
                elif agg_func == "mean":
                    result[row_key][col_key] = sum(values_list) / len(values_list)
                elif agg_func == "count":
                    result[row_key][col_key] = len(values_list)
                else:
                    result[row_key][col_key] = sum(values_list)

        return {
            "rows": rows,
            "columns": columns,
            "values": values,
            "aggregation": agg_func,
            "pivot_data": result
        }

    def merge_datasets(
        self,
        left: List[Dict[str, Any]],
        right: List[Dict[str, Any]],
        on: str,
        how: str = "inner"
    ) -> List[Dict[str, Any]]:
        """
        Merge two datasets (like pandas merge).
        Simulates: pd.merge(left, right, on=on, how=how)
        """
        # Create index for right dataset
        right_index = {}
        for row in right:
            key = row.get(on)
            if key is not None:
                if key not in right_index:
                    right_index[key] = []
                right_index[key].append(row)

        merged = []

        for left_row in left:
            key = left_row.get(on)
            if key is None:
                if how == "left":
                    merged.append(left_row)
                continue

            if key in right_index:
                for right_row in right_index[key]:
                    merged_row = {**left_row, **right_row}
                    merged.append(merged_row)
            elif how == "left":
                merged.append(left_row)

        return merged

    def _infer_type(self, column_data: List[str]) -> str:
        """Infer data type of a column"""
        if not column_data:
            return "unknown"

        sample = column_data[0] if column_data else ""

        try:
            float(sample)
            return "numeric"
        except ValueError:
            pass

        try:
            datetime.fromisoformat(sample)
            return "datetime"
        except (ValueError, TypeError):
            pass

        return "string"


class TimeSeriesAnalyzer:
    """Time series analysis utilities"""

    def __init__(self):
        pass

    def resample_data(
        self,
        timestamps: List[str],
        values: List[float],
        frequency: str = "1h"
    ) -> Dict[str, Any]:
        """
        Resample time series data (like pandas resample).
        Simulates: df.resample(frequency).mean()
        """
        # Parse frequency
        freq_map = {"1h": 3600, "1d": 86400, "1w": 604800}
        seconds = freq_map.get(frequency, 3600)

        # Group by time buckets
        buckets = {}
        for timestamp, value in zip(timestamps, values):
            try:
                dt = datetime.fromisoformat(timestamp)
                bucket = int(dt.timestamp() // seconds) * seconds
                if bucket not in buckets:
                    buckets[bucket] = []
                buckets[bucket].append(value)
            except (ValueError, TypeError):
                continue

        # Compute means
        resampled = {
            datetime.fromtimestamp(bucket).isoformat(): sum(vals) / len(vals)
            for bucket, vals in sorted(buckets.items())
        }

        return {
            "frequency": frequency,
            "original_points": len(values),
            "resampled_points": len(resampled),
            "data": resampled
        }

    def rolling_window(
        self,
        values: List[float],
        window_size: int = 5,
        operation: str = "mean"
    ) -> List[float]:
        """
        Apply rolling window operation (like pandas rolling).
        Simulates: df.rolling(window_size).mean()
        """
        if len(values) < window_size:
            return values

        result = []
        for i in range(len(values)):
            if i < window_size - 1:
                result.append(values[i])
            else:
                window = values[i - window_size + 1:i + 1]
                if operation == "mean":
                    result.append(sum(window) / len(window))
                elif operation == "sum":
                    result.append(sum(window))
                elif operation == "max":
                    result.append(max(window))
                elif operation == "min":
                    result.append(min(window))
                else:
                    result.append(sum(window) / len(window))

        return result


# Global instances
processor = DataProcessor()
timeseries = TimeSeriesAnalyzer()


def quick_aggregate(data: List[Dict[str, Any]], group_by: str, agg_column: str) -> Dict[str, Any]:
    """Quick aggregation helper"""
    return processor.aggregate_data(data, group_by, agg_column, "sum")


def quick_stats(values: List[float]) -> Dict[str, float]:
    """Quick statistics helper"""
    return processor.compute_statistics(values)
