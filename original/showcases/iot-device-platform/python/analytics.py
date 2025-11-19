#!/usr/bin/env python3
"""
IoT Device Platform - Time-series Analytics

Comprehensive time-series analysis for IoT telemetry data:
- Statistical analysis
- Trend detection
- Correlation analysis
- Seasonality detection
- Pattern recognition
- Data quality assessment
- Performance metrics
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import warnings

import numpy as np
import pandas as pd
from scipy import stats, signal
from scipy.fft import fft, fftfreq
import matplotlib.pyplot as plt
import seaborn as sns
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import yaml
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller, acf, pacf
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Config:
    """Configuration management"""

    def __init__(self):
        self.influx_url = os.getenv('INFLUX_URL', 'http://localhost:8086')
        self.influx_token = os.getenv('INFLUX_TOKEN', 'admin')
        self.influx_org = os.getenv('INFLUX_ORG', 'myorg')
        self.influx_bucket = os.getenv('INFLUX_BUCKET', 'iot_telemetry')

        self.postgres_host = os.getenv('POSTGRES_HOST', 'localhost')
        self.postgres_port = int(os.getenv('POSTGRES_PORT', '5432'))
        self.postgres_db = os.getenv('POSTGRES_DB', 'iot_platform')
        self.postgres_user = os.getenv('POSTGRES_USER', 'postgres')
        self.postgres_password = os.getenv('POSTGRES_PASSWORD', 'postgres')

        self.redis_host = os.getenv('REDIS_HOST', 'localhost')
        self.redis_port = int(os.getenv('REDIS_PORT', '6379'))


class TelemetryAnalyzer:
    """Main telemetry analytics engine"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
        self.influx_client = None
        self.postgres_conn = None
        self.redis_client = None
        self.setup_connections()

    def setup_connections(self):
        """Setup database connections"""
        try:
            # InfluxDB
            self.influx_client = InfluxDBClient(
                url=self.config.influx_url,
                token=self.config.influx_token,
                org=self.config.influx_org
            )
            logger.info("Connected to InfluxDB")

            # PostgreSQL
            self.postgres_conn = psycopg2.connect(
                host=self.config.postgres_host,
                port=self.config.postgres_port,
                database=self.config.postgres_db,
                user=self.config.postgres_user,
                password=self.config.postgres_password
            )
            logger.info("Connected to PostgreSQL")

            # Redis
            self.redis_client = redis.Redis(
                host=self.config.redis_host,
                port=self.config.redis_port,
                decode_responses=True
            )
            logger.info("Connected to Redis")

        except Exception as e:
            logger.error(f"Failed to setup connections: {e}")
            raise

    def close_connections(self):
        """Close all database connections"""
        if self.influx_client:
            self.influx_client.close()
        if self.postgres_conn:
            self.postgres_conn.close()
        if self.redis_client:
            self.redis_client.close()

    def load_device_data(
        self,
        device_id: str,
        days: int = 7,
        metrics: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Load telemetry data for a device from InfluxDB

        Args:
            device_id: Device identifier
            days: Number of days to load
            metrics: Specific metrics to load (None for all)

        Returns:
            DataFrame with telemetry data
        """
        logger.info(f"Loading data for device {device_id} ({days} days)")

        query_api = self.influx_client.query_api()

        # Build Flux query
        metric_filter = ""
        if metrics:
            metric_filter = f'|> filter(fn: (r) => {" or ".join([f"r._field == \"{m}\"" for m in metrics])})'

        flux_query = f'''
            from(bucket: "{self.config.influx_bucket}")
                |> range(start: -{days}d)
                |> filter(fn: (r) => r.deviceId == "{device_id}")
                {metric_filter}
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''

        try:
            result = query_api.query_data_frame(flux_query)

            if isinstance(result, list):
                if len(result) == 0:
                    logger.warning(f"No data found for device {device_id}")
                    return pd.DataFrame()
                result = pd.concat(result, ignore_index=True)

            # Clean up the DataFrame
            result = result.rename(columns={'_time': 'timestamp'})
            result['timestamp'] = pd.to_datetime(result['timestamp'])
            result = result.set_index('timestamp')

            # Drop unnecessary columns
            cols_to_drop = ['result', 'table', '_start', '_stop', '_measurement']
            result = result.drop(columns=[c for c in cols_to_drop if c in result.columns])

            logger.info(f"Loaded {len(result)} records for device {device_id}")
            return result

        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            raise

    def calculate_statistics(
        self,
        data: pd.DataFrame,
        metric: str
    ) -> Dict[str, float]:
        """
        Calculate comprehensive statistics for a metric

        Args:
            data: DataFrame with telemetry data
            metric: Metric name

        Returns:
            Dictionary of statistics
        """
        if metric not in data.columns:
            raise ValueError(f"Metric {metric} not found in data")

        values = data[metric].dropna()

        if len(values) == 0:
            return {}

        stats_dict = {
            'count': len(values),
            'mean': float(values.mean()),
            'median': float(values.median()),
            'std': float(values.std()),
            'min': float(values.min()),
            'max': float(values.max()),
            'range': float(values.max() - values.min()),
            'q25': float(values.quantile(0.25)),
            'q75': float(values.quantile(0.75)),
            'iqr': float(values.quantile(0.75) - values.quantile(0.25)),
            'skewness': float(values.skew()),
            'kurtosis': float(values.kurtosis()),
        }

        # Coefficient of variation
        if stats_dict['mean'] != 0:
            stats_dict['cv'] = stats_dict['std'] / stats_dict['mean']

        # Outlier detection using IQR method
        q1, q3 = values.quantile(0.25), values.quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = values[(values < lower_bound) | (values > upper_bound)]
        stats_dict['outlier_count'] = len(outliers)
        stats_dict['outlier_percentage'] = (len(outliers) / len(values)) * 100

        return stats_dict

    def detect_trends(
        self,
        data: pd.DataFrame,
        metric: str,
        window: int = 24
    ) -> Dict[str, Any]:
        """
        Detect trends in time-series data

        Args:
            data: DataFrame with telemetry data
            metric: Metric name
            window: Rolling window size (hours)

        Returns:
            Dictionary with trend information
        """
        if metric not in data.columns:
            raise ValueError(f"Metric {metric} not found in data")

        values = data[metric].dropna()

        # Linear regression for trend
        x = np.arange(len(values))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)

        # Determine trend direction
        if p_value < 0.05:  # Statistically significant
            if slope > 0:
                trend = 'increasing'
            else:
                trend = 'decreasing'
        else:
            trend = 'stable'

        # Calculate rolling statistics
        rolling_mean = values.rolling(window=window).mean()
        rolling_std = values.rolling(window=window).std()

        # Detect change points using rolling statistics
        change_points = []
        for i in range(window, len(rolling_mean) - window):
            before = rolling_mean[i-window:i].mean()
            after = rolling_mean[i:i+window].mean()
            if abs(after - before) > 2 * rolling_std[i]:
                change_points.append(values.index[i])

        return {
            'trend': trend,
            'slope': float(slope),
            'r_squared': float(r_value ** 2),
            'p_value': float(p_value),
            'change_points': [str(cp) for cp in change_points],
            'change_point_count': len(change_points),
        }

    def detect_seasonality(
        self,
        data: pd.DataFrame,
        metric: str,
        period: int = 24
    ) -> Dict[str, Any]:
        """
        Detect seasonality in time-series data

        Args:
            data: DataFrame with telemetry data
            metric: Metric name
            period: Expected period (hours)

        Returns:
            Dictionary with seasonality information
        """
        if metric not in data.columns:
            raise ValueError(f"Metric {metric} not found in data")

        values = data[metric].dropna()

        if len(values) < 2 * period:
            return {'has_seasonality': False, 'reason': 'Insufficient data'}

        try:
            # Decompose time series
            decomposition = seasonal_decompose(
                values,
                model='additive',
                period=period,
                extrapolate_trend='freq'
            )

            # Calculate strength of seasonality
            seasonal_strength = 1 - (
                np.var(decomposition.resid.dropna()) /
                np.var((decomposition.seasonal + decomposition.resid).dropna())
            )

            # FFT for frequency analysis
            fft_values = fft(values.values)
            frequencies = fftfreq(len(values))
            power = np.abs(fft_values) ** 2

            # Find dominant frequencies
            top_freq_indices = np.argsort(power[1:len(power)//2])[-3:][::-1] + 1
            dominant_periods = [1 / frequencies[i] for i in top_freq_indices if frequencies[i] > 0]

            return {
                'has_seasonality': seasonal_strength > 0.6,
                'seasonal_strength': float(seasonal_strength),
                'dominant_periods': [float(p) for p in dominant_periods],
                'expected_period': period,
            }

        except Exception as e:
            logger.error(f"Seasonality detection failed: {e}")
            return {'has_seasonality': False, 'reason': str(e)}

    def correlation_analysis(
        self,
        data: pd.DataFrame,
        metrics: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Perform correlation analysis between metrics

        Args:
            data: DataFrame with telemetry data
            metrics: Metrics to analyze (None for all numeric columns)

        Returns:
            Correlation matrix
        """
        if metrics is None:
            # Select numeric columns
            metrics = data.select_dtypes(include=[np.number]).columns.tolist()

        if len(metrics) < 2:
            raise ValueError("Need at least 2 metrics for correlation analysis")

        correlation_matrix = data[metrics].corr()

        # Find strong correlations
        strong_correlations = []
        for i in range(len(metrics)):
            for j in range(i+1, len(metrics)):
                corr_value = correlation_matrix.iloc[i, j]
                if abs(corr_value) > 0.7:
                    strong_correlations.append({
                        'metric1': metrics[i],
                        'metric2': metrics[j],
                        'correlation': float(corr_value)
                    })

        logger.info(f"Found {len(strong_correlations)} strong correlations")

        return correlation_matrix

    def assess_data_quality(
        self,
        data: pd.DataFrame,
        device_id: str
    ) -> Dict[str, Any]:
        """
        Assess data quality for a device

        Args:
            data: DataFrame with telemetry data
            device_id: Device identifier

        Returns:
            Data quality report
        """
        report = {
            'device_id': device_id,
            'total_records': len(data),
            'time_range': {
                'start': str(data.index.min()),
                'end': str(data.index.max()),
                'duration_hours': (data.index.max() - data.index.min()).total_seconds() / 3600
            },
            'metrics': {}
        }

        # Analyze each metric
        numeric_cols = data.select_dtypes(include=[np.number]).columns

        for metric in numeric_cols:
            values = data[metric]

            # Missing data
            missing_count = values.isna().sum()
            missing_pct = (missing_count / len(values)) * 100

            # Duplicate consecutive values (potential sensor stuck)
            consecutive_duplicates = (values == values.shift()).sum()

            # Zero values
            zero_count = (values == 0).sum()
            zero_pct = (zero_count / len(values)) * 100

            # Outliers using Z-score
            z_scores = np.abs(stats.zscore(values.dropna()))
            outliers = len(z_scores[z_scores > 3])

            report['metrics'][metric] = {
                'missing_count': int(missing_count),
                'missing_percentage': float(missing_pct),
                'consecutive_duplicates': int(consecutive_duplicates),
                'zero_count': int(zero_count),
                'zero_percentage': float(zero_pct),
                'outlier_count': int(outliers),
                'data_quality_score': self._calculate_quality_score(
                    missing_pct, zero_pct, outliers, len(values)
                )
            }

        # Overall quality score
        quality_scores = [m['data_quality_score'] for m in report['metrics'].values()]
        report['overall_quality_score'] = float(np.mean(quality_scores))

        return report

    def _calculate_quality_score(
        self,
        missing_pct: float,
        zero_pct: float,
        outliers: int,
        total: int
    ) -> float:
        """Calculate data quality score (0-100)"""
        score = 100.0

        # Penalize missing data
        score -= missing_pct * 0.5

        # Penalize excessive zeros
        if zero_pct > 50:
            score -= (zero_pct - 50) * 0.3

        # Penalize outliers
        outlier_pct = (outliers / total) * 100
        if outlier_pct > 5:
            score -= (outlier_pct - 5) * 0.5

        return max(0.0, min(100.0, score))

    def perform_pca_analysis(
        self,
        data: pd.DataFrame,
        n_components: int = 3
    ) -> Dict[str, Any]:
        """
        Perform Principal Component Analysis

        Args:
            data: DataFrame with telemetry data
            n_components: Number of components

        Returns:
            PCA analysis results
        """
        # Select numeric columns
        numeric_data = data.select_dtypes(include=[np.number]).dropna()

        if len(numeric_data.columns) < 2:
            raise ValueError("Need at least 2 metrics for PCA")

        # Standardize data
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(numeric_data)

        # Perform PCA
        pca = PCA(n_components=min(n_components, len(numeric_data.columns)))
        pca_result = pca.fit_transform(scaled_data)

        # Create results
        results = {
            'explained_variance_ratio': pca.explained_variance_ratio_.tolist(),
            'cumulative_variance': np.cumsum(pca.explained_variance_ratio_).tolist(),
            'components': {},
            'n_components': pca.n_components_
        }

        # Component loadings
        for i in range(pca.n_components_):
            loadings = dict(zip(
                numeric_data.columns,
                pca.components_[i].tolist()
            ))
            results['components'][f'PC{i+1}'] = loadings

        return results

    def detect_drift(
        self,
        data: pd.DataFrame,
        metric: str,
        threshold: float = 0.05
    ) -> Dict[str, Any]:
        """
        Detect concept drift in data using statistical tests

        Args:
            data: DataFrame with telemetry data
            metric: Metric name
            threshold: Significance level

        Returns:
            Drift detection results
        """
        if metric not in data.columns:
            raise ValueError(f"Metric {metric} not found in data")

        values = data[metric].dropna()

        # Split into two halves
        mid_point = len(values) // 2
        first_half = values.iloc[:mid_point]
        second_half = values.iloc[mid_point:]

        # Kolmogorov-Smirnov test
        ks_statistic, ks_pvalue = stats.ks_2samp(first_half, second_half)

        # Mann-Whitney U test
        u_statistic, u_pvalue = stats.mannwhitneyu(first_half, second_half)

        # Augmented Dickey-Fuller test for stationarity
        adf_result = adfuller(values)

        drift_detected = ks_pvalue < threshold or u_pvalue < threshold

        return {
            'drift_detected': drift_detected,
            'ks_statistic': float(ks_statistic),
            'ks_pvalue': float(ks_pvalue),
            'u_statistic': float(u_statistic),
            'u_pvalue': float(u_pvalue),
            'adf_statistic': float(adf_result[0]),
            'adf_pvalue': float(adf_result[1]),
            'is_stationary': adf_result[1] < threshold,
            'first_half_mean': float(first_half.mean()),
            'second_half_mean': float(second_half.mean()),
            'mean_change_pct': float(
                ((second_half.mean() - first_half.mean()) / first_half.mean()) * 100
            )
        }

    def generate_report(
        self,
        device_id: str,
        days: int = 7,
        output_file: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive analytics report for a device

        Args:
            device_id: Device identifier
            days: Number of days to analyze
            output_file: Optional file path to save report

        Returns:
            Complete analytics report
        """
        logger.info(f"Generating analytics report for device {device_id}")

        # Load data
        data = self.load_device_data(device_id, days=days)

        if len(data) == 0:
            logger.warning(f"No data available for device {device_id}")
            return {'error': 'No data available'}

        # Get numeric metrics
        metrics = data.select_dtypes(include=[np.number]).columns.tolist()

        report = {
            'device_id': device_id,
            'generated_at': datetime.now().isoformat(),
            'analysis_period_days': days,
            'record_count': len(data),
            'data_quality': self.assess_data_quality(data, device_id),
            'metrics': {}
        }

        # Analyze each metric
        for metric in metrics:
            try:
                report['metrics'][metric] = {
                    'statistics': self.calculate_statistics(data, metric),
                    'trends': self.detect_trends(data, metric),
                    'seasonality': self.detect_seasonality(data, metric),
                    'drift': self.detect_drift(data, metric)
                }
            except Exception as e:
                logger.error(f"Failed to analyze metric {metric}: {e}")
                report['metrics'][metric] = {'error': str(e)}

        # Correlation analysis
        if len(metrics) > 1:
            try:
                corr_matrix = self.correlation_analysis(data, metrics)
                report['correlation_matrix'] = corr_matrix.to_dict()
            except Exception as e:
                logger.error(f"Correlation analysis failed: {e}")

        # PCA analysis
        if len(metrics) > 1:
            try:
                report['pca'] = self.perform_pca_analysis(data)
            except Exception as e:
                logger.error(f"PCA analysis failed: {e}")

        # Save to file if requested
        if output_file:
            with open(output_file, 'w') as f:
                yaml.dump(report, f, default_flow_style=False)
            logger.info(f"Report saved to {output_file}")

        # Cache report in Redis
        try:
            cache_key = f"analytics:report:{device_id}"
            self.redis_client.setex(
                cache_key,
                3600,  # 1 hour
                yaml.dump(report)
            )
        except Exception as e:
            logger.error(f"Failed to cache report: {e}")

        return report

    def visualize_metrics(
        self,
        data: pd.DataFrame,
        metrics: List[str],
        output_file: str = 'metrics_visualization.png'
    ):
        """
        Create visualization for metrics

        Args:
            data: DataFrame with telemetry data
            metrics: Metrics to visualize
            output_file: Output file path
        """
        n_metrics = len(metrics)
        fig, axes = plt.subplots(n_metrics, 1, figsize=(12, 4*n_metrics))

        if n_metrics == 1:
            axes = [axes]

        for idx, metric in enumerate(metrics):
            if metric in data.columns:
                data[metric].plot(ax=axes[idx], title=f'{metric} over time')
                axes[idx].set_ylabel(metric)
                axes[idx].grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"Visualization saved to {output_file}")


def main():
    """Main execution"""
    analyzer = TelemetryAnalyzer()

    try:
        # Example usage
        device_id = sys.argv[1] if len(sys.argv) > 1 else 'sensor-001'
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 7

        # Generate report
        report = analyzer.generate_report(
            device_id=device_id,
            days=days,
            output_file=f'analytics_report_{device_id}.yaml'
        )

        # Print summary
        print(f"\n{'='*60}")
        print(f"Analytics Report for Device: {device_id}")
        print(f"{'='*60}")
        print(f"Records analyzed: {report['record_count']}")
        print(f"Overall quality score: {report['data_quality']['overall_quality_score']:.2f}/100")
        print(f"\nMetrics analyzed: {len(report['metrics'])}")

        for metric, analysis in report['metrics'].items():
            if 'statistics' in analysis:
                stats = analysis['statistics']
                trends = analysis['trends']
                print(f"\n{metric}:")
                print(f"  Mean: {stats['mean']:.2f}")
                print(f"  Std: {stats['std']:.2f}")
                print(f"  Trend: {trends['trend']}")

        print(f"\n{'='*60}\n")

    finally:
        analyzer.close_connections()


if __name__ == '__main__':
    main()
