"""
Pandas-based analytics module for real-time event processing.
Provides high-performance data transformations and aggregations.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta


class PandasAnalytics:
    """Real-time analytics using pandas DataFrames."""

    def __init__(self):
        self.event_buffer: List[Dict[str, Any]] = []
        self.df: Optional[pd.DataFrame] = None

    def ingest_events(self, events: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Ingest events into pandas DataFrame.
        Zero-copy operation when possible.
        """
        if not events:
            return pd.DataFrame()

        df = pd.DataFrame(events)

        # Convert timestamp to datetime if present
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')

        self.df = df
        return df

    def compute_aggregations(self, df: pd.DataFrame, group_by: List[str],
                            metrics: List[str]) -> pd.DataFrame:
        """
        Compute real-time aggregations on event data.

        Args:
            df: Input DataFrame
            group_by: Columns to group by
            metrics: Columns to aggregate

        Returns:
            Aggregated DataFrame
        """
        if df.empty:
            return pd.DataFrame()

        agg_dict = {}
        for metric in metrics:
            if metric in df.columns:
                agg_dict[metric] = ['sum', 'mean', 'min', 'max', 'count']

        result = df.groupby(group_by).agg(agg_dict)
        result.columns = ['_'.join(col).strip() for col in result.columns.values]

        return result.reset_index()

    def windowed_aggregation(self, df: pd.DataFrame, window_size: str,
                            group_by: str, metric: str,
                            agg_func: str = 'sum') -> pd.DataFrame:
        """
        Perform time-windowed aggregations.

        Args:
            df: Input DataFrame with timestamp column
            window_size: Window size (e.g., '1min', '5min', '1H')
            group_by: Column to group by
            metric: Metric column to aggregate
            agg_func: Aggregation function ('sum', 'mean', 'count', etc.)

        Returns:
            Time-windowed aggregated DataFrame
        """
        if df.empty or 'timestamp' not in df.columns:
            return pd.DataFrame()

        df = df.set_index('timestamp')

        result = (df.groupby([pd.Grouper(freq=window_size), group_by])[metric]
                  .agg(agg_func)
                  .reset_index())

        return result

    def calculate_percentiles(self, df: pd.DataFrame, column: str,
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
        if df.empty or column not in df.columns:
            return {}

        result = {}
        for p in percentiles:
            result[f'p{int(p*100)}'] = df[column].quantile(p)

        return result

    def sliding_window_stats(self, df: pd.DataFrame, column: str,
                            window_size: int = 100) -> pd.DataFrame:
        """
        Calculate sliding window statistics.

        Args:
            df: Input DataFrame
            column: Column to calculate stats for
            window_size: Size of sliding window

        Returns:
            DataFrame with rolling statistics
        """
        if df.empty or column not in df.columns:
            return pd.DataFrame()

        result = pd.DataFrame()
        result['rolling_mean'] = df[column].rolling(window=window_size).mean()
        result['rolling_std'] = df[column].rolling(window=window_size).std()
        result['rolling_min'] = df[column].rolling(window=window_size).min()
        result['rolling_max'] = df[column].rolling(window=window_size).max()

        return result

    def detect_anomalies(self, df: pd.DataFrame, column: str,
                        threshold: float = 3.0) -> pd.DataFrame:
        """
        Detect anomalies using z-score method.

        Args:
            df: Input DataFrame
            column: Column to analyze
            threshold: Z-score threshold for anomaly detection

        Returns:
            DataFrame with anomaly flags
        """
        if df.empty or column not in df.columns:
            return pd.DataFrame()

        mean = df[column].mean()
        std = df[column].std()

        df = df.copy()
        df['z_score'] = (df[column] - mean) / std
        df['is_anomaly'] = np.abs(df['z_score']) > threshold

        return df[df['is_anomaly']]

    def join_enrichment_data(self, events_df: pd.DataFrame,
                            enrichment_df: pd.DataFrame,
                            join_key: str) -> pd.DataFrame:
        """
        Join event data with enrichment data.

        Args:
            events_df: Events DataFrame
            enrichment_df: Enrichment data DataFrame
            join_key: Key to join on

        Returns:
            Joined DataFrame
        """
        if events_df.empty or enrichment_df.empty:
            return events_df

        return pd.merge(events_df, enrichment_df, on=join_key, how='left')

    def top_n_by_metric(self, df: pd.DataFrame, group_by: str,
                       metric: str, n: int = 10) -> pd.DataFrame:
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
        if df.empty:
            return pd.DataFrame()

        result = (df.groupby(group_by)[metric]
                  .sum()
                  .sort_values(ascending=False)
                  .head(n)
                  .reset_index())

        return result

    def conversion_funnel(self, df: pd.DataFrame,
                         event_sequence: List[str],
                         user_col: str = 'user_id') -> Dict[str, Any]:
        """
        Calculate conversion funnel metrics.

        Args:
            df: Events DataFrame
            event_sequence: Ordered list of events in funnel
            user_col: Column representing user identifier

        Returns:
            Funnel metrics dictionary
        """
        if df.empty or 'event_type' not in df.columns:
            return {}

        funnel = {}
        users_at_stage = None

        for i, event in enumerate(event_sequence):
            users = set(df[df['event_type'] == event][user_col].unique())

            if users_at_stage is not None:
                users = users & users_at_stage

            funnel[event] = {
                'count': len(users),
                'percentage': 100.0 if i == 0 else (len(users) / funnel[event_sequence[0]]['count'] * 100)
            }

            users_at_stage = users

        return funnel

    def export_to_dict(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Export DataFrame to list of dictionaries (for TypeScript consumption).

        Args:
            df: DataFrame to export

        Returns:
            List of dictionaries
        """
        return df.to_dict('records')

    def get_summary_stats(self, df: pd.DataFrame, columns: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Get summary statistics for DataFrame.

        Args:
            df: Input DataFrame
            columns: Specific columns to summarize (None = all numeric)

        Returns:
            Summary statistics dictionary
        """
        if df.empty:
            return {}

        if columns:
            df = df[columns]

        stats = df.describe().to_dict()

        return {
            'summary': stats,
            'row_count': len(df),
            'column_count': len(df.columns),
            'memory_usage': df.memory_usage(deep=True).sum()
        }
