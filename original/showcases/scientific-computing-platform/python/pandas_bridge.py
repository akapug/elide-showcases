"""
Pandas Bridge for DataFrame Operations

Comprehensive pandas integration providing DataFrame manipulation, time series analysis,
data aggregation, and statistical operations through Python-TypeScript bridge.

Features:
- DataFrame creation and manipulation
- Data loading (CSV, JSON, Excel, SQL)
- Groupby and aggregation
- Time series operations
- Merging and joining
- Pivot tables
- Statistical analysis
- Data cleaning and preprocessing
"""

import pandas as pd
import numpy as np
from typing import Union, List, Dict, Optional, Any, Tuple
import json


class PandasBridge:
    """
    Comprehensive Pandas bridge for data manipulation from TypeScript.
    """

    def __init__(self):
        self.dataframes = {}

    # =========================================================================
    # DataFrame Creation
    # =========================================================================

    def create_dataframe(self, data: Union[Dict, List, np.ndarray], columns: Optional[List[str]] = None,
                        index: Optional[Union[List, np.ndarray]] = None) -> pd.DataFrame:
        """Create DataFrame from various data structures"""
        if columns:
            df = pd.DataFrame(data, columns=columns, index=index)
        elif index:
            df = pd.DataFrame(data, index=index)
        else:
            df = pd.DataFrame(data)
        return df

    def create_series(self, data: Union[List, np.ndarray, Dict], index: Optional[Union[List, np.ndarray]] = None,
                     name: Optional[str] = None) -> pd.Series:
        """Create Series"""
        return pd.Series(data, index=index, name=name)

    def from_dict(self, data: Dict, orient: str = 'columns', dtype: Optional[str] = None) -> pd.DataFrame:
        """Create DataFrame from dictionary"""
        return pd.DataFrame.from_dict(data, orient=orient, dtype=dtype)

    def from_records(self, data: List[Dict], columns: Optional[List[str]] = None) -> pd.DataFrame:
        """Create DataFrame from list of dictionaries"""
        return pd.DataFrame.from_records(data, columns=columns)

    # =========================================================================
    # I/O Operations
    # =========================================================================

    def read_csv(self, filepath: str, sep: str = ',', header: Union[int, List[int], str] = 'infer',
                index_col: Optional[Union[int, str, List]] = None, usecols: Optional[List] = None,
                dtype: Optional[Dict] = None, parse_dates: Union[bool, List] = False,
                **kwargs) -> pd.DataFrame:
        """Read CSV file"""
        return pd.read_csv(filepath, sep=sep, header=header, index_col=index_col, usecols=usecols,
                          dtype=dtype, parse_dates=parse_dates, **kwargs)

    def to_csv(self, df: pd.DataFrame, filepath: str, sep: str = ',', index: bool = True,
              header: bool = True, **kwargs) -> None:
        """Write DataFrame to CSV"""
        df.to_csv(filepath, sep=sep, index=index, header=header, **kwargs)

    def read_json(self, filepath: str, orient: str = 'columns', **kwargs) -> pd.DataFrame:
        """Read JSON file"""
        return pd.read_json(filepath, orient=orient, **kwargs)

    def to_json(self, df: pd.DataFrame, filepath: Optional[str] = None, orient: str = 'columns',
               **kwargs) -> Optional[str]:
        """Write DataFrame to JSON"""
        if filepath:
            df.to_json(filepath, orient=orient, **kwargs)
            return None
        return df.to_json(orient=orient, **kwargs)

    def read_excel(self, filepath: str, sheet_name: Union[str, int, List] = 0, **kwargs) -> pd.DataFrame:
        """Read Excel file"""
        return pd.read_excel(filepath, sheet_name=sheet_name, **kwargs)

    def to_excel(self, df: pd.DataFrame, filepath: str, sheet_name: str = 'Sheet1',
                index: bool = True, **kwargs) -> None:
        """Write DataFrame to Excel"""
        df.to_excel(filepath, sheet_name=sheet_name, index=index, **kwargs)

    def read_sql(self, query: str, con: Any, index_col: Optional[str] = None, **kwargs) -> pd.DataFrame:
        """Read SQL query into DataFrame"""
        return pd.read_sql(query, con, index_col=index_col, **kwargs)

    def to_sql(self, df: pd.DataFrame, name: str, con: Any, if_exists: str = 'fail',
              index: bool = True, **kwargs) -> None:
        """Write DataFrame to SQL database"""
        df.to_sql(name, con, if_exists=if_exists, index=index, **kwargs)

    # =========================================================================
    # Data Inspection
    # =========================================================================

    def head(self, df: pd.DataFrame, n: int = 5) -> pd.DataFrame:
        """Get first n rows"""
        return df.head(n)

    def tail(self, df: pd.DataFrame, n: int = 5) -> pd.DataFrame:
        """Get last n rows"""
        return df.tail(n)

    def info(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get DataFrame info"""
        return {
            'columns': list(df.columns),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'shape': df.shape,
            'size': df.size,
            'memory_usage': df.memory_usage(deep=True).to_dict()
        }

    def describe(self, df: pd.DataFrame, include: Optional[Union[str, List]] = None,
                exclude: Optional[Union[str, List]] = None) -> pd.DataFrame:
        """Generate descriptive statistics"""
        return df.describe(include=include, exclude=exclude)

    def value_counts(self, series: pd.Series, normalize: bool = False, sort: bool = True,
                    ascending: bool = False) -> pd.Series:
        """Count unique values"""
        return series.value_counts(normalize=normalize, sort=sort, ascending=ascending)

    def unique(self, series: pd.Series) -> np.ndarray:
        """Get unique values"""
        return series.unique()

    def nunique(self, series: pd.Series) -> int:
        """Count unique values"""
        return series.nunique()

    # =========================================================================
    # Selection and Indexing
    # =========================================================================

    def loc(self, df: pd.DataFrame, rows: Any, cols: Optional[Any] = None) -> Union[pd.DataFrame, pd.Series, Any]:
        """Label-based indexing"""
        if cols is not None:
            return df.loc[rows, cols]
        return df.loc[rows]

    def iloc(self, df: pd.DataFrame, rows: Any, cols: Optional[Any] = None) -> Union[pd.DataFrame, pd.Series, Any]:
        """Integer-based indexing"""
        if cols is not None:
            return df.iloc[rows, cols]
        return df.iloc[rows]

    def at(self, df: pd.DataFrame, row: Any, col: Any) -> Any:
        """Access single value (label)"""
        return df.at[row, col]

    def iat(self, df: pd.DataFrame, row: int, col: int) -> Any:
        """Access single value (integer)"""
        return df.iat[row, col]

    def query(self, df: pd.DataFrame, expr: str, **kwargs) -> pd.DataFrame:
        """Query DataFrame with expression"""
        return df.query(expr, **kwargs)

    def filter(self, df: pd.DataFrame, items: Optional[List] = None, like: Optional[str] = None,
              regex: Optional[str] = None, axis: int = 0) -> pd.DataFrame:
        """Filter DataFrame"""
        return df.filter(items=items, like=like, regex=regex, axis=axis)

    # =========================================================================
    # Data Manipulation
    # =========================================================================

    def drop(self, df: pd.DataFrame, labels: Union[Any, List], axis: int = 0, **kwargs) -> pd.DataFrame:
        """Drop rows or columns"""
        return df.drop(labels, axis=axis, **kwargs)

    def drop_duplicates(self, df: pd.DataFrame, subset: Optional[List] = None, keep: str = 'first',
                       inplace: bool = False) -> Optional[pd.DataFrame]:
        """Drop duplicate rows"""
        return df.drop_duplicates(subset=subset, keep=keep, inplace=inplace)

    def dropna(self, df: pd.DataFrame, axis: int = 0, how: str = 'any', thresh: Optional[int] = None,
              subset: Optional[List] = None, inplace: bool = False) -> Optional[pd.DataFrame]:
        """Drop missing values"""
        return df.dropna(axis=axis, how=how, thresh=thresh, subset=subset, inplace=inplace)

    def fillna(self, df: pd.DataFrame, value: Optional[Any] = None, method: Optional[str] = None,
              axis: Optional[int] = None, limit: Optional[int] = None, inplace: bool = False) -> Optional[pd.DataFrame]:
        """Fill missing values"""
        return df.fillna(value=value, method=method, axis=axis, limit=limit, inplace=inplace)

    def replace(self, df: pd.DataFrame, to_replace: Any, value: Any, inplace: bool = False,
               **kwargs) -> Optional[pd.DataFrame]:
        """Replace values"""
        return df.replace(to_replace, value, inplace=inplace, **kwargs)

    def rename(self, df: pd.DataFrame, mapper: Optional[Dict] = None, index: Optional[Dict] = None,
              columns: Optional[Dict] = None, axis: Optional[int] = None, inplace: bool = False) -> Optional[pd.DataFrame]:
        """Rename labels"""
        return df.rename(mapper=mapper, index=index, columns=columns, axis=axis, inplace=inplace)

    def sort_values(self, df: pd.DataFrame, by: Union[str, List[str]], axis: int = 0,
                   ascending: Union[bool, List[bool]] = True, inplace: bool = False,
                   kind: str = 'quicksort', **kwargs) -> Optional[pd.DataFrame]:
        """Sort by values"""
        return df.sort_values(by=by, axis=axis, ascending=ascending, inplace=inplace, kind=kind, **kwargs)

    def sort_index(self, df: pd.DataFrame, axis: int = 0, ascending: bool = True,
                  inplace: bool = False, kind: str = 'quicksort') -> Optional[pd.DataFrame]:
        """Sort by index"""
        return df.sort_index(axis=axis, ascending=ascending, inplace=inplace, kind=kind)

    # =========================================================================
    # Groupby and Aggregation
    # =========================================================================

    def groupby(self, df: pd.DataFrame, by: Union[str, List[str]], axis: int = 0,
               as_index: bool = True, **kwargs) -> pd.core.groupby.DataFrameGroupBy:
        """Group DataFrame"""
        return df.groupby(by=by, axis=axis, as_index=as_index, **kwargs)

    def agg(self, grouped: pd.core.groupby.DataFrameGroupBy, func: Union[str, List, Dict],
           **kwargs) -> pd.DataFrame:
        """Aggregate grouped data"""
        return grouped.agg(func, **kwargs)

    def sum(self, df: pd.DataFrame, axis: int = 0, skipna: bool = True, numeric_only: bool = False) -> Union[pd.Series, pd.DataFrame]:
        """Sum values"""
        return df.sum(axis=axis, skipna=skipna, numeric_only=numeric_only)

    def mean(self, df: pd.DataFrame, axis: int = 0, skipna: bool = True, numeric_only: bool = False) -> Union[pd.Series, pd.DataFrame]:
        """Mean of values"""
        return df.mean(axis=axis, skipna=skipna, numeric_only=numeric_only)

    def median(self, df: pd.DataFrame, axis: int = 0, skipna: bool = True, numeric_only: bool = False) -> Union[pd.Series, pd.DataFrame]:
        """Median of values"""
        return df.median(axis=axis, skipna=skipna, numeric_only=numeric_only)

    def std(self, df: pd.DataFrame, axis: int = 0, skipna: bool = True, ddof: int = 1,
           numeric_only: bool = False) -> Union[pd.Series, pd.DataFrame]:
        """Standard deviation"""
        return df.std(axis=axis, skipna=skipna, ddof=ddof, numeric_only=numeric_only)

    def var(self, df: pd.DataFrame, axis: int = 0, skipna: bool = True, ddof: int = 1,
           numeric_only: bool = False) -> Union[pd.Series, pd.DataFrame]:
        """Variance"""
        return df.var(axis=axis, skipna=skipna, ddof=ddof, numeric_only=numeric_only)

    def min(self, df: pd.DataFrame, axis: int = 0, skipna: bool = True, numeric_only: bool = False) -> Union[pd.Series, pd.DataFrame]:
        """Minimum value"""
        return df.min(axis=axis, skipna=skipna, numeric_only=numeric_only)

    def max(self, df: pd.DataFrame, axis: int = 0, skipna: bool = True, numeric_only: bool = False) -> Union[pd.Series, pd.DataFrame]:
        """Maximum value"""
        return df.max(axis=axis, skipna=skipna, numeric_only=numeric_only)

    def count(self, df: pd.DataFrame, axis: int = 0, numeric_only: bool = False) -> Union[pd.Series, pd.DataFrame]:
        """Count non-NA values"""
        return df.count(axis=axis, numeric_only=numeric_only)

    # =========================================================================
    # Merging and Joining
    # =========================================================================

    def merge(self, left: pd.DataFrame, right: pd.DataFrame, how: str = 'inner',
             on: Optional[Union[str, List]] = None, left_on: Optional[Union[str, List]] = None,
             right_on: Optional[Union[str, List]] = None, left_index: bool = False,
             right_index: bool = False, suffixes: Tuple[str, str] = ('_x', '_y'),
             **kwargs) -> pd.DataFrame:
        """Merge DataFrames"""
        return pd.merge(left, right, how=how, on=on, left_on=left_on, right_on=right_on,
                       left_index=left_index, right_index=right_index, suffixes=suffixes, **kwargs)

    def join(self, left: pd.DataFrame, right: pd.DataFrame, on: Optional[str] = None,
            how: str = 'left', lsuffix: str = '', rsuffix: str = '', **kwargs) -> pd.DataFrame:
        """Join DataFrames"""
        return left.join(right, on=on, how=how, lsuffix=lsuffix, rsuffix=rsuffix, **kwargs)

    def concat(self, objs: List[pd.DataFrame], axis: int = 0, join: str = 'outer',
              ignore_index: bool = False, keys: Optional[List] = None, **kwargs) -> pd.DataFrame:
        """Concatenate DataFrames"""
        return pd.concat(objs, axis=axis, join=join, ignore_index=ignore_index, keys=keys, **kwargs)

    # =========================================================================
    # Pivot and Reshape
    # =========================================================================

    def pivot(self, df: pd.DataFrame, index: Optional[str] = None, columns: Optional[str] = None,
             values: Optional[str] = None) -> pd.DataFrame:
        """Pivot DataFrame"""
        return df.pivot(index=index, columns=columns, values=values)

    def pivot_table(self, df: pd.DataFrame, values: Optional[Union[str, List]] = None,
                   index: Optional[Union[str, List]] = None, columns: Optional[Union[str, List]] = None,
                   aggfunc: Union[str, List, Dict] = 'mean', fill_value: Optional[Any] = None,
                   margins: bool = False, **kwargs) -> pd.DataFrame:
        """Create pivot table"""
        return df.pivot_table(values=values, index=index, columns=columns, aggfunc=aggfunc,
                             fill_value=fill_value, margins=margins, **kwargs)

    def melt(self, df: pd.DataFrame, id_vars: Optional[Union[str, List]] = None,
            value_vars: Optional[Union[str, List]] = None, var_name: Optional[str] = None,
            value_name: str = 'value', **kwargs) -> pd.DataFrame:
        """Unpivot DataFrame"""
        return df.melt(id_vars=id_vars, value_vars=value_vars, var_name=var_name,
                      value_name=value_name, **kwargs)

    def stack(self, df: pd.DataFrame, level: int = -1, dropna: bool = True) -> pd.Series:
        """Stack DataFrame"""
        return df.stack(level=level, dropna=dropna)

    def unstack(self, df: pd.DataFrame, level: int = -1, fill_value: Optional[Any] = None) -> pd.DataFrame:
        """Unstack DataFrame"""
        return df.unstack(level=level, fill_value=fill_value)

    # =========================================================================
    # Time Series Operations
    # =========================================================================

    def to_datetime(self, arg: Union[str, List, pd.Series], format: Optional[str] = None,
                   **kwargs) -> Union[pd.Timestamp, pd.DatetimeIndex, pd.Series]:
        """Convert to datetime"""
        return pd.to_datetime(arg, format=format, **kwargs)

    def date_range(self, start: Optional[str] = None, end: Optional[str] = None,
                  periods: Optional[int] = None, freq: str = 'D', **kwargs) -> pd.DatetimeIndex:
        """Generate date range"""
        return pd.date_range(start=start, end=end, periods=periods, freq=freq, **kwargs)

    def resample(self, df: pd.DataFrame, rule: str, **kwargs) -> pd.core.resample.Resampler:
        """Resample time series"""
        return df.resample(rule, **kwargs)

    def rolling(self, df: pd.DataFrame, window: int, min_periods: Optional[int] = None,
               center: bool = False, **kwargs) -> pd.core.window.rolling.Rolling:
        """Rolling window calculations"""
        return df.rolling(window=window, min_periods=min_periods, center=center, **kwargs)

    def expanding(self, df: pd.DataFrame, min_periods: int = 1, **kwargs) -> pd.core.window.expanding.Expanding:
        """Expanding window calculations"""
        return df.expanding(min_periods=min_periods, **kwargs)

    def ewm(self, df: pd.DataFrame, com: Optional[float] = None, span: Optional[float] = None,
           halflife: Optional[float] = None, alpha: Optional[float] = None,
           min_periods: int = 0, **kwargs) -> pd.core.window.ewm.ExponentialMovingWindow:
        """Exponential weighted moving window"""
        return df.ewm(com=com, span=span, halflife=halflife, alpha=alpha, min_periods=min_periods, **kwargs)

    def shift(self, df: pd.DataFrame, periods: int = 1, freq: Optional[str] = None,
             axis: int = 0, fill_value: Optional[Any] = None) -> pd.DataFrame:
        """Shift data"""
        return df.shift(periods=periods, freq=freq, axis=axis, fill_value=fill_value)

    def diff(self, df: pd.DataFrame, periods: int = 1, axis: int = 0) -> pd.DataFrame:
        """Calculate difference"""
        return df.diff(periods=periods, axis=axis)

    def pct_change(self, df: pd.DataFrame, periods: int = 1, fill_method: str = 'pad',
                  limit: Optional[int] = None) -> pd.DataFrame:
        """Percent change"""
        return df.pct_change(periods=periods, fill_method=fill_method, limit=limit)

    # =========================================================================
    # Utility Functions
    # =========================================================================

    def apply(self, df: pd.DataFrame, func: callable, axis: int = 0, **kwargs) -> Union[pd.Series, pd.DataFrame]:
        """Apply function"""
        return df.apply(func, axis=axis, **kwargs)

    def applymap(self, df: pd.DataFrame, func: callable) -> pd.DataFrame:
        """Apply function element-wise"""
        return df.applymap(func)

    def corr(self, df: pd.DataFrame, method: str = 'pearson', min_periods: int = 1) -> pd.DataFrame:
        """Compute correlation"""
        return df.corr(method=method, min_periods=min_periods)

    def cov(self, df: pd.DataFrame, min_periods: Optional[int] = None, ddof: int = 1) -> pd.DataFrame:
        """Compute covariance"""
        return df.cov(min_periods=min_periods, ddof=ddof)

    def rank(self, df: pd.DataFrame, axis: int = 0, method: str = 'average',
            numeric_only: bool = False, na_option: str = 'keep',
            ascending: bool = True, pct: bool = False) -> pd.DataFrame:
        """Compute rank"""
        return df.rank(axis=axis, method=method, numeric_only=numeric_only,
                      na_option=na_option, ascending=ascending, pct=pct)


# Create global instance
pandas_bridge = PandasBridge()


# Export convenience functions
def read_csv(filepath, **kwargs):
    """Read CSV file"""
    return pandas_bridge.read_csv(filepath, **kwargs)


def DataFrame(data, **kwargs):
    """Create DataFrame"""
    return pandas_bridge.create_dataframe(data, **kwargs)
