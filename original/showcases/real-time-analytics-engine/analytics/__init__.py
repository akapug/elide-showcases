"""
Real-time analytics module.
Provides pandas and polars-based analytics for high-performance event processing.
"""

from .pandas_analytics import PandasAnalytics
from .polars_analytics import PolarsAnalytics

__all__ = ['PandasAnalytics', 'PolarsAnalytics']
