#!/usr/bin/env python3
"""
IoT Device Platform - Predictive Maintenance and Forecasting

Time-series forecasting for predictive maintenance:
- Prophet forecasting
- ARIMA models
- Exponential smoothing
- RUL (Remaining Useful Life) prediction
- Maintenance scheduling
- Failure probability estimation
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from prophet import Prophet
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.stattools import adfuller
from scipy import stats

from influxdb_client import InfluxDBClient
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import joblib

warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Config:
    """Configuration for forecasting"""

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

        self.forecast_days = int(os.getenv('FORECAST_DAYS', '7'))
        self.model_dir = os.getenv('MODEL_DIR', './models')


class PredictiveMaintenance:
    """Predictive maintenance forecasting engine"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
        self.influx_client = None
        self.postgres_conn = None
        self.redis_client = None

        os.makedirs(self.config.model_dir, exist_ok=True)
        self.setup_connections()

    def setup_connections(self):
        """Setup database connections"""
        try:
            self.influx_client = InfluxDBClient(
                url=self.config.influx_url,
                token=self.config.influx_token,
                org=self.config.influx_org
            )

            self.postgres_conn = psycopg2.connect(
                host=self.config.postgres_host,
                port=self.config.postgres_port,
                database=self.config.postgres_db,
                user=self.config.postgres_user,
                password=self.config.postgres_password
            )

            self.redis_client = redis.Redis(
                host=self.config.redis_host,
                port=self.config.redis_port,
                decode_responses=True
            )

            logger.info("Database connections established")

        except Exception as e:
            logger.error(f"Failed to setup connections: {e}")
            raise

    def close_connections(self):
        """Close all connections"""
        if self.influx_client:
            self.influx_client.close()
        if self.postgres_conn:
            self.postgres_conn.close()
        if self.redis_client:
            self.redis_client.close()

    def load_historical_data(
        self,
        device_id: str,
        metric: str,
        days: int = 30
    ) -> pd.DataFrame:
        """Load historical data for forecasting"""
        logger.info(f"Loading historical data for {device_id}/{metric}")

        query_api = self.influx_client.query_api()

        flux_query = f'''
            from(bucket: "{self.config.influx_bucket}")
                |> range(start: -{days}d)
                |> filter(fn: (r) => r.deviceId == "{device_id}")
                |> filter(fn: (r) => r._field == "{metric}")
                |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
        '''

        try:
            result = query_api.query_data_frame(flux_query)

            if isinstance(result, list):
                if len(result) == 0:
                    return pd.DataFrame()
                result = pd.concat(result, ignore_index=True)

            result = result.rename(columns={'_time': 'ds', '_value': 'y'})
            result['ds'] = pd.to_datetime(result['ds'])
            result = result[['ds', 'y']].sort_values('ds')

            logger.info(f"Loaded {len(result)} records")
            return result

        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            raise

    def forecast_prophet(
        self,
        data: pd.DataFrame,
        periods: int = 168  # 7 days hourly
    ) -> Tuple[pd.DataFrame, Prophet]:
        """
        Forecast using Facebook Prophet

        Args:
            data: DataFrame with 'ds' and 'y' columns
            periods: Number of periods to forecast

        Returns:
            (forecast, model)
        """
        logger.info(f"Training Prophet model for {periods} periods")

        # Initialize model with seasonality
        model = Prophet(
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=False,
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0,
            interval_width=0.95
        )

        # Fit model
        model.fit(data)

        # Make future dataframe
        future = model.make_future_dataframe(periods=periods, freq='H')

        # Predict
        forecast = model.predict(future)

        logger.info("Prophet forecast complete")
        return forecast, model

    def forecast_arima(
        self,
        data: pd.DataFrame,
        order: Tuple[int, int, int] = (5, 1, 0),
        periods: int = 168
    ) -> pd.DataFrame:
        """
        Forecast using ARIMA

        Args:
            data: DataFrame with time series data
            order: ARIMA order (p, d, q)
            periods: Number of periods to forecast

        Returns:
            Forecast DataFrame
        """
        logger.info(f"Training ARIMA{order} model")

        # Fit ARIMA model
        model = ARIMA(data['y'].values, order=order)
        fitted_model = model.fit()

        # Forecast
        forecast_values = fitted_model.forecast(steps=periods)

        # Create forecast dataframe
        last_date = data['ds'].max()
        future_dates = pd.date_range(
            start=last_date + timedelta(hours=1),
            periods=periods,
            freq='H'
        )

        forecast_df = pd.DataFrame({
            'ds': future_dates,
            'yhat': forecast_values
        })

        logger.info("ARIMA forecast complete")
        return forecast_df

    def forecast_exponential_smoothing(
        self,
        data: pd.DataFrame,
        periods: int = 168,
        seasonal_periods: int = 24
    ) -> pd.DataFrame:
        """
        Forecast using Exponential Smoothing

        Args:
            data: DataFrame with time series data
            periods: Number of periods to forecast
            seasonal_periods: Seasonal period length

        Returns:
            Forecast DataFrame
        """
        logger.info("Training Exponential Smoothing model")

        # Fit model
        model = ExponentialSmoothing(
            data['y'].values,
            seasonal_periods=seasonal_periods,
            trend='add',
            seasonal='add'
        )
        fitted_model = model.fit()

        # Forecast
        forecast_values = fitted_model.forecast(steps=periods)

        # Create forecast dataframe
        last_date = data['ds'].max()
        future_dates = pd.date_range(
            start=last_date + timedelta(hours=1),
            periods=periods,
            freq='H'
        )

        forecast_df = pd.DataFrame({
            'ds': future_dates,
            'yhat': forecast_values
        })

        logger.info("Exponential Smoothing forecast complete")
        return forecast_df

    def calculate_rul(
        self,
        data: pd.DataFrame,
        threshold: float,
        forecast: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Calculate Remaining Useful Life (RUL)

        Args:
            data: Historical data
            threshold: Failure threshold
            forecast: Forecast data

        Returns:
            RUL estimation
        """
        # Find when forecast crosses threshold
        crossing_points = forecast[forecast['yhat'] >= threshold]

        if len(crossing_points) == 0:
            return {
                'rul_hours': None,
                'rul_days': None,
                'failure_date': None,
                'confidence': 'low',
                'status': 'healthy'
            }

        # First crossing point
        failure_date = crossing_points.iloc[0]['ds']
        now = data['ds'].max()
        rul_hours = (failure_date - now).total_seconds() / 3600

        # Calculate confidence based on trend strength
        recent_values = data['y'].tail(24).values
        trend_slope = np.polyfit(range(len(recent_values)), recent_values, 1)[0]

        if abs(trend_slope) > 0.1:
            confidence = 'high'
        elif abs(trend_slope) > 0.05:
            confidence = 'medium'
        else:
            confidence = 'low'

        return {
            'rul_hours': float(rul_hours),
            'rul_days': float(rul_hours / 24),
            'failure_date': str(failure_date),
            'confidence': confidence,
            'status': 'degrading' if rul_hours < 168 else 'warning',  # < 7 days
            'threshold': threshold,
            'trend_slope': float(trend_slope)
        }

    def estimate_failure_probability(
        self,
        data: pd.DataFrame,
        forecast: pd.DataFrame,
        threshold: float
    ) -> Dict[str, float]:
        """
        Estimate probability of failure at different time horizons

        Args:
            data: Historical data
            forecast: Forecast data
            threshold: Failure threshold

        Returns:
            Failure probabilities
        """
        probabilities = {}

        # Calculate prediction intervals if available
        if 'yhat_upper' in forecast.columns:
            for days in [1, 3, 7, 14, 30]:
                hours = days * 24
                if hours <= len(forecast):
                    future_point = forecast.iloc[hours - 1]

                    # Probability based on upper bound crossing threshold
                    if future_point['yhat_upper'] >= threshold:
                        # Calculate probability using normal distribution
                        mean = future_point['yhat']
                        std = (future_point['yhat_upper'] - mean) / 1.96
                        prob = 1 - stats.norm.cdf(threshold, mean, std)
                    else:
                        prob = 0.0

                    probabilities[f'{days}d'] = float(min(max(prob, 0.0), 1.0))

        else:
            # Simple threshold crossing probability
            for days in [1, 3, 7, 14, 30]:
                hours = days * 24
                if hours <= len(forecast):
                    value = forecast.iloc[hours - 1]['yhat']
                    prob = 1.0 if value >= threshold else 0.0
                    probabilities[f'{days}d'] = prob

        return probabilities

    def generate_maintenance_schedule(
        self,
        rul: Dict[str, Any],
        device_id: str,
        metric: str
    ) -> Dict[str, Any]:
        """
        Generate maintenance schedule recommendations

        Args:
            rul: RUL estimation
            device_id: Device identifier
            metric: Metric name

        Returns:
            Maintenance schedule
        """
        schedule = {
            'device_id': device_id,
            'metric': metric,
            'generated_at': datetime.now().isoformat(),
            'recommendations': []
        }

        if rul['rul_hours'] is None:
            schedule['recommendations'].append({
                'priority': 'low',
                'action': 'routine_inspection',
                'scheduled_date': (datetime.now() + timedelta(days=30)).isoformat(),
                'reason': 'No immediate degradation detected'
            })
            return schedule

        rul_days = rul['rul_days']

        if rul_days < 1:
            # Critical - immediate action
            schedule['recommendations'].append({
                'priority': 'critical',
                'action': 'emergency_maintenance',
                'scheduled_date': datetime.now().isoformat(),
                'reason': 'Imminent failure predicted within 24 hours'
            })

        elif rul_days < 3:
            # High priority
            schedule['recommendations'].append({
                'priority': 'high',
                'action': 'urgent_maintenance',
                'scheduled_date': (datetime.now() + timedelta(days=1)).isoformat(),
                'reason': f'Failure predicted in {rul_days:.1f} days'
            })

        elif rul_days < 7:
            # Medium priority
            schedule['recommendations'].append({
                'priority': 'medium',
                'action': 'scheduled_maintenance',
                'scheduled_date': (datetime.now() + timedelta(days=3)).isoformat(),
                'reason': f'Preventive maintenance recommended (RUL: {rul_days:.1f} days)'
            })

        else:
            # Low priority
            schedule['recommendations'].append({
                'priority': 'low',
                'action': 'routine_inspection',
                'scheduled_date': (datetime.now() + timedelta(days=7)).isoformat(),
                'reason': f'Normal operation (RUL: {rul_days:.1f} days)'
            })

        return schedule

    def analyze_device(
        self,
        device_id: str,
        metric: str,
        threshold: float,
        historical_days: int = 30,
        forecast_days: int = 7
    ) -> Dict[str, Any]:
        """
        Complete predictive maintenance analysis for a device

        Args:
            device_id: Device identifier
            metric: Metric to analyze
            threshold: Failure threshold
            historical_days: Days of historical data
            forecast_days: Days to forecast

        Returns:
            Complete analysis results
        """
        logger.info(f"Analyzing device {device_id} for metric {metric}")

        # Load historical data
        data = self.load_historical_data(device_id, metric, historical_days)

        if len(data) < 24:
            return {'error': 'Insufficient historical data'}

        # Generate forecasts
        forecast_periods = forecast_days * 24

        # Prophet forecast
        prophet_forecast, prophet_model = self.forecast_prophet(data, forecast_periods)

        # ARIMA forecast
        try:
            arima_forecast = self.forecast_arima(data, periods=forecast_periods)
        except Exception as e:
            logger.warning(f"ARIMA forecast failed: {e}")
            arima_forecast = None

        # Calculate RUL
        rul = self.calculate_rul(data, threshold, prophet_forecast)

        # Estimate failure probability
        failure_prob = self.estimate_failure_probability(
            data, prophet_forecast, threshold
        )

        # Generate maintenance schedule
        maintenance_schedule = self.generate_maintenance_schedule(
            rul, device_id, metric
        )

        # Compile results
        results = {
            'device_id': device_id,
            'metric': metric,
            'threshold': threshold,
            'analyzed_at': datetime.now().isoformat(),
            'historical_period_days': historical_days,
            'forecast_period_days': forecast_days,
            'current_value': float(data['y'].iloc[-1]),
            'rul': rul,
            'failure_probability': failure_prob,
            'maintenance_schedule': maintenance_schedule,
            'prophet_forecast': {
                'values': prophet_forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(
                    forecast_periods
                ).to_dict('records')
            }
        }

        if arima_forecast is not None:
            results['arima_forecast'] = {
                'values': arima_forecast.to_dict('records')
            }

        # Cache results in Redis
        try:
            cache_key = f"forecast:{device_id}:{metric}"
            self.redis_client.setex(
                cache_key,
                3600,
                str(results)
            )
        except Exception as e:
            logger.error(f"Failed to cache results: {e}")

        logger.info(f"Analysis complete for {device_id}")
        return results

    def visualize_forecast(
        self,
        data: pd.DataFrame,
        forecast: pd.DataFrame,
        threshold: float,
        output_file: str = 'forecast.png'
    ):
        """
        Visualize forecast results

        Args:
            data: Historical data
            forecast: Forecast data
            threshold: Failure threshold
            output_file: Output file path
        """
        plt.figure(figsize=(14, 7))

        # Plot historical data
        plt.plot(data['ds'], data['y'], 'b-', label='Historical', linewidth=2)

        # Plot forecast
        if 'yhat' in forecast.columns:
            plt.plot(
                forecast['ds'],
                forecast['yhat'],
                'r--',
                label='Forecast',
                linewidth=2
            )

        # Plot confidence interval if available
        if 'yhat_upper' in forecast.columns and 'yhat_lower' in forecast.columns:
            plt.fill_between(
                forecast['ds'],
                forecast['yhat_lower'],
                forecast['yhat_upper'],
                alpha=0.3,
                color='red'
            )

        # Plot threshold
        plt.axhline(y=threshold, color='orange', linestyle=':', label='Threshold', linewidth=2)

        plt.xlabel('Date')
        plt.ylabel('Value')
        plt.title('Predictive Maintenance Forecast')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"Forecast visualization saved to {output_file}")


def main():
    """Main execution"""
    pm = PredictiveMaintenance()

    try:
        device_id = sys.argv[1] if len(sys.argv) > 1 else 'sensor-001'
        metric = sys.argv[2] if len(sys.argv) > 2 else 'temperature'
        threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 80.0

        # Perform analysis
        results = pm.analyze_device(
            device_id=device_id,
            metric=metric,
            threshold=threshold,
            historical_days=30,
            forecast_days=7
        )

        # Print results
        print(f"\n{'='*60}")
        print(f"Predictive Maintenance Analysis")
        print(f"{'='*60}")
        print(f"Device: {device_id}")
        print(f"Metric: {metric}")
        print(f"Current Value: {results['current_value']:.2f}")
        print(f"Threshold: {threshold}")
        print(f"\nRemaining Useful Life:")
        print(f"  Days: {results['rul']['rul_days']}")
        print(f"  Status: {results['rul']['status']}")
        print(f"  Confidence: {results['rul']['confidence']}")
        print(f"\nFailure Probability:")
        for period, prob in results['failure_probability'].items():
            print(f"  {period}: {prob*100:.1f}%")
        print(f"\nMaintenance Schedule:")
        for rec in results['maintenance_schedule']['recommendations']:
            print(f"  Priority: {rec['priority'].upper()}")
            print(f"  Action: {rec['action']}")
            print(f"  Scheduled: {rec['scheduled_date']}")
            print(f"  Reason: {rec['reason']}")
        print(f"\n{'='*60}\n")

    finally:
        pm.close_connections()


if __name__ == '__main__':
    main()
