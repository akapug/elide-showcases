"""
Data Quality Engine - Zero-copy validation for large datasets
"""

import pandas as pd
import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq
from typing import Dict, List, Any, Optional
import json
import sys


class DataQualityEngine:
    """Zero-copy data quality validation"""

    def __init__(self):
        self.rules: Dict[str, List[Dict]] = {}

    def validate_batch_zero_copy(
        self,
        df: pd.DataFrame,
        rules: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Validate using zero-copy operations where possible"""
        results = {
            'total_records': len(df),
            'valid_records': len(df),
            'violations': [],
            'metrics': {}
        }

        for rule in rules:
            rule_type = rule['type']

            if rule_type == 'not_null':
                column = rule['column']
                null_mask = df[column].isna()
                null_count = null_mask.sum()

                if null_count > 0:
                    results['violations'].append({
                        'rule': 'not_null',
                        'column': column,
                        'violations': int(null_count),
                        'percentage': float(null_count / len(df))
                    })
                    results['valid_records'] -= null_count

            elif rule_type == 'unique':
                column = rule['column']
                duplicates = df[column].duplicated().sum()

                if duplicates > 0:
                    results['violations'].append({
                        'rule': 'unique',
                        'column': column,
                        'violations': int(duplicates)
                    })

            elif rule_type == 'range':
                column = rule['column']
                min_val = rule.get('min')
                max_val = rule.get('max')

                if min_val is not None:
                    below_min = (df[column] < min_val).sum()
                    if below_min > 0:
                        results['violations'].append({
                            'rule': 'range_min',
                            'column': column,
                            'violations': int(below_min),
                            'threshold': min_val
                        })

                if max_val is not None:
                    above_max = (df[column] > max_val).sum()
                    if above_max > 0:
                        results['violations'].append({
                            'rule': 'range_max',
                            'column': column,
                            'violations': int(above_max),
                            'threshold': max_val
                        })

            elif rule_type == 'pattern':
                column = rule['column']
                pattern = rule['pattern']
                matches = df[column].astype(str).str.match(pattern)
                non_matches = (~matches).sum()

                if non_matches > 0:
                    results['violations'].append({
                        'rule': 'pattern',
                        'column': column,
                        'violations': int(non_matches),
                        'pattern': pattern
                    })

            elif rule_type == 'completeness':
                column = rule['column']
                threshold = rule.get('threshold', 0.95)
                null_rate = df[column].isna().sum() / len(df)

                if (1 - null_rate) < threshold:
                    results['violations'].append({
                        'rule': 'completeness',
                        'column': column,
                        'completeness': float(1 - null_rate),
                        'threshold': threshold
                    })

        # Calculate data quality score
        total_violations = sum(v['violations'] if 'violations' in v else 1 for v in results['violations'])
        results['quality_score'] = float(1 - (total_violations / len(df))) if len(df) > 0 else 1.0

        return results

    def profile_dataset(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate data profile using vectorized operations"""
        profile = {
            'rows': len(df),
            'columns': len(df.columns),
            'memory_mb': df.memory_usage(deep=True).sum() / 1024 / 1024,
            'columns_info': {}
        }

        for col in df.columns:
            col_info = {
                'dtype': str(df[col].dtype),
                'null_count': int(df[col].isna().sum()),
                'null_percentage': float(df[col].isna().sum() / len(df)),
                'unique_count': int(df[col].nunique())
            }

            if pd.api.types.is_numeric_dtype(df[col]):
                col_info.update({
                    'min': float(df[col].min()),
                    'max': float(df[col].max()),
                    'mean': float(df[col].mean()),
                    'median': float(df[col].median()),
                    'std': float(df[col].std())
                })

            profile['columns_info'][col] = col_info

        return profile

    def detect_data_drift(
        self,
        reference_df: pd.DataFrame,
        current_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """Detect data drift between datasets"""
        drift_results = {
            'columns': {}
        }

        for col in reference_df.columns:
            if col not in current_df.columns:
                continue

            if pd.api.types.is_numeric_dtype(reference_df[col]):
                ref_mean = reference_df[col].mean()
                cur_mean = current_df[col].mean()
                ref_std = reference_df[col].std()

                # Calculate z-score of mean difference
                if ref_std > 0:
                    z_score = abs((cur_mean - ref_mean) / ref_std)
                    drifted = z_score > 2.0

                    drift_results['columns'][col] = {
                        'drifted': bool(drifted),
                        'z_score': float(z_score),
                        'reference_mean': float(ref_mean),
                        'current_mean': float(cur_mean)
                    }

        return drift_results


engine = DataQualityEngine()


def process_stdin():
    """Process commands from stdin"""
    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get('command')

            if command == 'validate':
                data = request['data']
                rules = request.get('rules', [])
                df = pd.DataFrame(data)
                result = engine.validate_batch_zero_copy(df, rules)
                response = {'status': 'success', 'result': result}

            elif command == 'profile':
                data = request['data']
                df = pd.DataFrame(data)
                result = engine.profile_dataset(df)
                response = {'status': 'success', 'result': result}

            else:
                response = {'status': 'error', 'error': f'Unknown command: {command}'}

            print(json.dumps(response), flush=True)

        except Exception as e:
            print(json.dumps({'status': 'error', 'error': str(e)}), flush=True)


if __name__ == "__main__":
    process_stdin()
