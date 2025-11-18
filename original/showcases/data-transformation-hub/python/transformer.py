"""
Multi-format data transformation engine
"""

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import json
import sys
import io
from typing import Dict, List, Any, Optional


class DataTransformer:
    """Transform data between multiple formats"""

    def json_to_dataframe(self, data: List[Dict]) -> pd.DataFrame:
        """Convert JSON to DataFrame"""
        return pd.DataFrame(data)

    def dataframe_to_json(self, df: pd.DataFrame) -> List[Dict]:
        """Convert DataFrame to JSON"""
        return df.to_dict(orient='records')

    def csv_to_dataframe(self, csv_string: str) -> pd.DataFrame:
        """Convert CSV string to DataFrame"""
        return pd.read_csv(io.StringIO(csv_string))

    def dataframe_to_csv(self, df: pd.DataFrame) -> str:
        """Convert DataFrame to CSV string"""
        return df.to_csv(index=False)

    def dataframe_to_parquet_bytes(self, df: pd.DataFrame) -> bytes:
        """Convert DataFrame to Parquet bytes"""
        table = pa.Table.from_pandas(df)
        sink = pa.BufferOutputStream()
        pq.write_table(table, sink, compression='snappy')
        return sink.getvalue().to_pybytes()

    def parquet_bytes_to_dataframe(self, parquet_bytes: bytes) -> pd.DataFrame:
        """Convert Parquet bytes to DataFrame"""
        buffer = pa.py_buffer(parquet_bytes)
        reader = pa.ipc.open_file(buffer)
        table = reader.read_all()
        return table.to_pandas()

    def transform(
        self,
        data: Any,
        source_format: str,
        target_format: str,
        options: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Transform data from source format to target format"""
        options = options or {}

        # Step 1: Convert to DataFrame
        if source_format == 'json':
            df = self.json_to_dataframe(data)
        elif source_format == 'csv':
            df = self.csv_to_dataframe(data)
        elif source_format == 'dataframe':
            df = pd.DataFrame(data)
        else:
            return {'error': f'Unsupported source format: {source_format}'}

        # Step 2: Apply transformations if specified
        if 'select_columns' in options:
            df = df[options['select_columns']]

        if 'filter' in options:
            # Simple filter support
            filter_expr = options['filter']
            df = df.query(filter_expr)

        if 'sort_by' in options:
            df = df.sort_values(by=options['sort_by'])

        if 'rename_columns' in options:
            df = df.rename(columns=options['rename_columns'])

        # Step 3: Convert to target format
        if target_format == 'json':
            result = self.dataframe_to_json(df)
            return {
                'format': 'json',
                'data': result,
                'row_count': len(result)
            }
        elif target_format == 'csv':
            result = self.dataframe_to_csv(df)
            return {
                'format': 'csv',
                'data': result,
                'row_count': len(df)
            }
        elif target_format == 'parquet':
            result_bytes = self.dataframe_to_parquet_bytes(df)
            # Return base64 encoded for JSON transport
            import base64
            result_b64 = base64.b64encode(result_bytes).decode('utf-8')
            return {
                'format': 'parquet',
                'data': result_b64,
                'row_count': len(df),
                'size_bytes': len(result_bytes)
            }
        elif target_format == 'dict':
            return {
                'format': 'dict',
                'data': df.to_dict(orient='list'),
                'row_count': len(df)
            }
        else:
            return {'error': f'Unsupported target format: {target_format}'}

    def batch_transform(
        self,
        transformations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Execute multiple transformations"""
        results = []

        for t in transformations:
            data = t['data']
            source = t['source_format']
            target = t['target_format']
            options = t.get('options', {})

            result = self.transform(data, source, target, options)
            results.append(result)

        return results

    def merge_datasets(
        self,
        datasets: List[Dict],
        merge_key: str,
        how: str = 'inner'
    ) -> Dict[str, Any]:
        """Merge multiple datasets"""
        dfs = [pd.DataFrame(ds['data']) for ds in datasets]

        # Merge all DataFrames
        result_df = dfs[0]
        for df in dfs[1:]:
            result_df = pd.merge(result_df, df, on=merge_key, how=how)

        return {
            'data': result_df.to_dict(orient='records'),
            'row_count': len(result_df),
            'columns': list(result_df.columns)
        }


transformer = DataTransformer()


def process_stdin():
    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get('command')

            if command == 'transform':
                data = request['data']
                source = request['source_format']
                target = request['target_format']
                options = request.get('options', {})
                result = transformer.transform(data, source, target, options)
                response = {'status': 'success', 'result': result}

            elif command == 'batch_transform':
                transformations = request['transformations']
                result = transformer.batch_transform(transformations)
                response = {'status': 'success', 'result': result}

            elif command == 'merge':
                datasets = request['datasets']
                merge_key = request['merge_key']
                how = request.get('how', 'inner')
                result = transformer.merge_datasets(datasets, merge_key, how)
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
