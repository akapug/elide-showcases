"""
Polars-based analytics module for ultra-high-performance event processing.
Polars provides faster execution than pandas for many operations.
"""

import polars as pl
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta


class PolarsAnalytics:
    """Real-time analytics using Polars DataFrames (faster than pandas)."""

    def __init__(self):
        self.df: Optional[pl.DataFrame] = None

    def ingest_events(self, events: List[Dict[str, Any]]) -> pl.DataFrame:
        """
        Ingest events into Polars DataFrame.
        Polars uses Arrow format internally for zero-copy operations.
        """
        if not events:
            return pl.DataFrame()

        df = pl.DataFrame(events)

        # Convert timestamp to datetime if present
        if 'timestamp' in df.columns:
            df = df.with_columns([
                pl.col('timestamp').cast(pl.Datetime)
            ])

        self.df = df
        return df

    def compute_aggregations(self, df: pl.DataFrame, group_by: List[str],
                            metrics: List[str]) -> pl.DataFrame:
        """
        Compute real-time aggregations on event data.
        Polars uses parallel execution for faster aggregations.

        Args:
            df: Input DataFrame
            group_by: Columns to group by
            metrics: Columns to aggregate

        Returns:
            Aggregated DataFrame
        """
        if df.is_empty():
            return pl.DataFrame()

        agg_exprs = []
        for metric in metrics:
            if metric in df.columns:
                agg_exprs.extend([
                    pl.col(metric).sum().alias(f'{metric}_sum'),
                    pl.col(metric).mean().alias(f'{metric}_mean'),
                    pl.col(metric).min().alias(f'{metric}_min'),
                    pl.col(metric).max().alias(f'{metric}_max'),
                    pl.col(metric).count().alias(f'{metric}_count')
                ])

        result = df.group_by(group_by).agg(agg_exprs)

        return result

    def windowed_aggregation(self, df: pl.DataFrame, window_size: str,
                            group_by: str, metric: str,
                            agg_func: str = 'sum') -> pl.DataFrame:
        """
        Perform time-windowed aggregations using Polars' fast groupby_dynamic.

        Args:
            df: Input DataFrame with timestamp column
            window_size: Window size (e.g., '1m', '5m', '1h')
            group_by: Column to group by
            metric: Metric column to aggregate
            agg_func: Aggregation function ('sum', 'mean', 'count', etc.)

        Returns:
            Time-windowed aggregated DataFrame
        """
        if df.is_empty() or 'timestamp' not in df.columns:
            return pl.DataFrame()

        # Map aggregation function
        agg_map = {
            'sum': pl.col(metric).sum(),
            'mean': pl.col(metric).mean(),
            'count': pl.col(metric).count(),
            'min': pl.col(metric).min(),
            'max': pl.col(metric).max()
        }

        agg_expr = agg_map.get(agg_func, pl.col(metric).sum())

        result = (df.sort('timestamp')
                  .group_by_dynamic('timestamp', every=window_size, by=group_by)
                  .agg(agg_expr.alias(f'{metric}_{agg_func}')))

        return result

    def calculate_percentiles(self, df: pl.DataFrame, column: str,
                             percentiles: List[float] = [0.5, 0.95, 0.99]) -> Dict[str, float]:
        """
        Calculate percentiles for a given column.

        Args:
            df: Input DataFrame
            column: Column to calculate percentiles for
            percentiles: List of percentile values (0.0 to 1.0)

        Returns:
            Dictionary of percentile values
        """
        if df.is_empty() or column not in df.columns:
            return {}

        result = {}
        for p in percentiles:
            result[f'p{int(p*100)}'] = df[column].quantile(p)

        return result

    def sliding_window_stats(self, df: pl.DataFrame, column: str,
                            window_size: int = 100) -> pl.DataFrame:
        """
        Calculate sliding window statistics using Polars' efficient rolling operations.

        Args:
            df: Input DataFrame
            column: Column to calculate stats for
            window_size: Size of sliding window

        Returns:
            DataFrame with rolling statistics
        """
        if df.is_empty() or column not in df.columns:
            return pl.DataFrame()

        result = df.select([
            pl.col(column).rolling_mean(window_size=window_size).alias('rolling_mean'),
            pl.col(column).rolling_std(window_size=window_size).alias('rolling_std'),
            pl.col(column).rolling_min(window_size=window_size).alias('rolling_min'),
            pl.col(column).rolling_max(window_size=window_size).alias('rolling_max')
        ])

        return result

    def detect_anomalies(self, df: pl.DataFrame, column: str,
                        threshold: float = 3.0) -> pl.DataFrame:
        """
        Detect anomalies using z-score method with Polars' fast operations.

        Args:
            df: Input DataFrame
            column: Column to analyze
            threshold: Z-score threshold for anomaly detection

        Returns:
            DataFrame with anomaly flags
        """
        if df.is_empty() or column not in df.columns:
            return pl.DataFrame()

        result = df.with_columns([
            ((pl.col(column) - pl.col(column).mean()) / pl.col(column).std()).alias('z_score')
        ]).with_columns([
            (pl.col('z_score').abs() > threshold).alias('is_anomaly')
        ]).filter(pl.col('is_anomaly'))

        return result

    def join_enrichment_data(self, events_df: pl.DataFrame,
                            enrichment_df: pl.DataFrame,
                            join_key: str) -> pl.DataFrame:
        """
        Join event data with enrichment data using Polars' fast joins.

        Args:
            events_df: Events DataFrame
            enrichment_df: Enrichment data DataFrame
            join_key: Key to join on

        Returns:
            Joined DataFrame
        """
        if events_df.is_empty() or enrichment_df.is_empty():
            return events_df

        return events_df.join(enrichment_df, on=join_key, how='left')

    def top_n_by_metric(self, df: pl.DataFrame, group_by: str,
                       metric: str, n: int = 10) -> pl.DataFrame:
        """
        Get top N entries by metric value.

        Args:
            df: Input DataFrame
            group_by: Column to group by
            metric: Metric column to rank by
            n: Number of top entries to return

        Returns:
            Top N DataFrame
        """
        if df.is_empty():
            return pl.DataFrame()

        result = (df.group_by(group_by)
                  .agg(pl.col(metric).sum().alias(f'{metric}_sum'))
                  .sort(f'{metric}_sum', descending=True)
                  .head(n))

        return result

    def conversion_funnel(self, df: pl.DataFrame,
                         event_sequence: List[str],
                         user_col: str = 'user_id') -> Dict[str, Any]:
        """
        Calculate conversion funnel metrics using Polars.

        Args:
            df: Events DataFrame
            event_sequence: Ordered list of events in funnel
            user_col: Column representing user identifier

        Returns:
            Funnel metrics dictionary
        """
        if df.is_empty() or 'event_type' not in df.columns:
            return {}

        funnel = {}
        total_users = None

        for i, event in enumerate(event_sequence):
            users = df.filter(pl.col('event_type') == event)[user_col].unique()
            count = len(users)

            if i == 0:
                total_users = count

            funnel[event] = {
                'count': count,
                'percentage': 100.0 if i == 0 else (count / total_users * 100) if total_users > 0 else 0
            }

        return funnel

    def export_to_dict(self, df: pl.DataFrame) -> List[Dict[str, Any]]:
        """
        Export DataFrame to list of dictionaries (for TypeScript consumption).

        Args:
            df: DataFrame to export

        Returns:
            List of dictionaries
        """
        return df.to_dicts()

    def get_summary_stats(self, df: pl.DataFrame, columns: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Get summary statistics for DataFrame using Polars' fast describe.

        Args:
            df: Input DataFrame
            columns: Specific columns to summarize (None = all numeric)

        Returns:
            Summary statistics dictionary
        """
        if df.is_empty():
            return {}

        if columns:
            df = df.select(columns)

        stats = df.describe().to_dict(as_series=False)

        return {
            'summary': stats,
            'row_count': df.height,
            'column_count': df.width,
            'estimated_size': df.estimated_size()
        }

    def stream_processing(self, df: pl.DataFrame, batch_size: int = 1000) -> List[pl.DataFrame]:
        """
        Process data in streaming batches for memory efficiency.

        Args:
            df: Input DataFrame
            batch_size: Size of each batch

        Returns:
            List of batch DataFrames
        """
        if df.is_empty():
            return []

        batches = []
        for i in range(0, df.height, batch_size):
            batch = df.slice(i, min(batch_size, df.height - i))
            batches.append(batch)

        return batches
