"""
Data processing functions using pandas for high-performance operations
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
import json
import sys


class DataProcessor:
    """High-performance data processor with zero-copy operations"""

    def __init__(self, enable_zero_copy: bool = True):
        self.enable_zero_copy = enable_zero_copy

    def normalize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize numeric columns using min-max scaling"""
        df_copy = df.copy() if not self.enable_zero_copy else df

        numeric_cols = df_copy.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            col_min = df_copy[col].min()
            col_max = df_copy[col].max()
            if col_max > col_min:
                df_copy[col] = (df_copy[col] - col_min) / (col_max - col_min)

        return df_copy

    def deduplicate(self, df: pd.DataFrame, subset: Optional[List[str]] = None) -> pd.DataFrame:
        """Remove duplicate rows"""
        return df.drop_duplicates(subset=subset, keep='first')

    def enrich_data(self, df: pd.DataFrame, enrichment_data: Dict[str, Any]) -> pd.DataFrame:
        """Enrich DataFrame with additional data"""
        df_copy = df.copy()

        for key, value in enrichment_data.items():
            if key not in df_copy.columns:
                df_copy[key] = value

        return df_copy

    def aggregate_data(
        self,
        df: pd.DataFrame,
        group_by: List[str],
        aggregations: Dict[str, str]
    ) -> pd.DataFrame:
        """Aggregate data by grouping columns"""
        return df.groupby(group_by).agg(aggregations).reset_index()

    def filter_data(self, df: pd.DataFrame, condition: str) -> pd.DataFrame:
        """Filter DataFrame using query string"""
        return df.query(condition)

    def transform_batch(
        self,
        data: List[Dict[str, Any]],
        transformations: List[str]
    ) -> List[Dict[str, Any]]:
        """Apply transformations to a batch of records"""
        df = pd.DataFrame(data)

        for transform in transformations:
            if transform == 'normalize':
                df = self.normalize_dataframe(df)
            elif transform == 'deduplicate':
                df = self.deduplicate(df)
            elif transform == 'lowercase_strings':
                string_cols = df.select_dtypes(include=['object']).columns
                for col in string_cols:
                    df[col] = df[col].str.lower()

        return df.to_dict(orient='records')


def process_stdin():
    """Process data from stdin in streaming fashion"""
    processor = DataProcessor()

    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get('command')

            if command == 'transform_batch':
                data = request.get('data', [])
                transformations = request.get('transformations', [])
                result = processor.transform_batch(data, transformations)

                response = {
                    'status': 'success',
                    'result': result,
                    'count': len(result)
                }
            elif command == 'normalize':
                df = pd.DataFrame(request.get('data', []))
                result_df = processor.normalize_dataframe(df)
                response = {
                    'status': 'success',
                    'result': result_df.to_dict(orient='records')
                }
            else:
                response = {
                    'status': 'error',
                    'error': f'Unknown command: {command}'
                }

            print(json.dumps(response), flush=True)

        except Exception as e:
            error_response = {
                'status': 'error',
                'error': str(e)
            }
            print(json.dumps(error_response), flush=True)


if __name__ == "__main__":
    process_stdin()
