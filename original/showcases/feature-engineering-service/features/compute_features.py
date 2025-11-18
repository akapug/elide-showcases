#!/usr/bin/env python3
"""
Feature Computation Engine - Python pandas/NumPy backend

High-performance feature engineering using vectorized operations
Supports real-time and batch feature generation
"""

import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any
import hashlib


class FeatureComputer:
    """High-performance feature computation using pandas and NumPy"""

    def __init__(self):
        # Simulate historical data for time-series features
        self.historical_data = self._generate_historical_data()

    def _generate_historical_data(self) -> pd.DataFrame:
        """Generate synthetic historical data for feature computation"""
        np.random.seed(42)

        # 90 days of hourly data
        dates = pd.date_range(
            end=datetime.now(),
            periods=90 * 24,
            freq='H'
        )

        data = {
            'timestamp': dates,
            'value': np.random.normal(50, 15, len(dates)),
            'volume': np.random.exponential(1000, len(dates)),
            'category': np.random.choice(['A', 'B', 'C', 'D'], len(dates)),
        }

        df = pd.DataFrame(data)
        df['value'] = df['value'].clip(0, 100)  # Bound values
        return df

    def compute_single(self, entity_id: str) -> Dict[str, Any]:
        """Compute features for a single entity"""
        # Use entity_id to create deterministic but varied features
        seed = int(hashlib.md5(entity_id.encode()).hexdigest()[:8], 16)
        np.random.seed(seed % (2**32))

        # Get entity-specific data slice
        entity_data = self._get_entity_data(entity_id)

        features = {}

        # Statistical features (pandas vectorized operations)
        features.update(self._compute_statistical_features(entity_data))

        # Time-based features
        features.update(self._compute_time_features())

        # Trend features (NumPy operations)
        features.update(self._compute_trend_features(entity_data))

        # Categorical features
        features.update(self._compute_categorical_features(entity_data))

        # Engineered features
        features.update(self._compute_engineered_features(entity_data, features))

        # Hash features
        features.update(self._compute_hash_features(entity_id))

        return features

    def compute_batch(self, entity_ids: List[str]) -> List[Dict[str, Any]]:
        """Compute features for multiple entities in batch"""
        # Use vectorized operations for batch efficiency
        results = []

        for entity_id in entity_ids:
            features = self.compute_single(entity_id)
            results.append(features)

        return results

    def _get_entity_data(self, entity_id: str) -> pd.DataFrame:
        """Get historical data for an entity"""
        # In production, this would query from a database
        # For demo, we create entity-specific variations
        data = self.historical_data.copy()

        # Add entity-specific noise
        seed = int(hashlib.md5(entity_id.encode()).hexdigest()[:8], 16)
        np.random.seed(seed % (2**32))

        noise = np.random.normal(0, 5, len(data))
        data['value'] = (data['value'] + noise).clip(0, 100)

        return data

    def _compute_statistical_features(self, data: pd.DataFrame) -> Dict[str, float]:
        """Compute statistical features using pandas"""
        recent = data.tail(168)  # Last 7 days (hourly data)
        values = recent['value']

        return {
            'value_mean': float(values.mean()),
            'value_std': float(values.std()),
            'value_min': float(values.min()),
            'value_max': float(values.max()),
            'value_median': float(values.median()),
            'value_q25': float(values.quantile(0.25)),
            'value_q75': float(values.quantile(0.75)),
            'value_iqr': float(values.quantile(0.75) - values.quantile(0.25)),
        }

    def _compute_time_features(self) -> Dict[str, Any]:
        """Compute time-based features"""
        now = datetime.now()

        return {
            'day_of_week': now.weekday(),
            'hour_of_day': now.hour,
            'is_weekend': now.weekday() >= 5,
            'is_business_hours': 9 <= now.hour < 17,
        }

    def _compute_trend_features(self, data: pd.DataFrame) -> Dict[str, float]:
        """Compute trend features using NumPy"""
        # 7-day trend
        recent_7d = data.tail(7 * 24)['value'].values
        trend_7d = self._calculate_trend(recent_7d)

        # 30-day trend
        recent_30d = data.tail(30 * 24)['value'].values
        trend_30d = self._calculate_trend(recent_30d)

        # Momentum (acceleration of trend)
        momentum = trend_7d - trend_30d

        # Volatility (rolling standard deviation)
        volatility = float(np.std(recent_7d) / (np.mean(recent_7d) + 1e-10))

        return {
            'trend_7d': float(trend_7d),
            'trend_30d': float(trend_30d),
            'momentum': float(momentum),
            'volatility': float(volatility),
        }

    def _calculate_trend(self, values: np.ndarray) -> float:
        """Calculate linear trend using least squares"""
        if len(values) < 2:
            return 0.0

        x = np.arange(len(values))
        # Linear regression: y = mx + b
        coeffs = np.polyfit(x, values, 1)
        return coeffs[0]  # Return slope (trend)

    def _compute_categorical_features(self, data: pd.DataFrame) -> Dict[str, float]:
        """Compute categorical features"""
        recent = data.tail(168)

        # Most frequent category
        category_counts = recent['category'].value_counts()
        most_frequent_cat = category_counts.index[0] if len(category_counts) > 0 else 'A'

        # Label encode the category
        category_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
        category_encoded = category_map.get(most_frequent_cat, 0)

        # Frequency of most common category
        frequency = float(category_counts.iloc[0] / len(recent) if len(category_counts) > 0 else 0)

        # Recency (days since last occurrence)
        last_timestamp = recent['timestamp'].iloc[-1]
        recency_days = (datetime.now() - last_timestamp).total_seconds() / 86400

        return {
            'category_encoded': float(category_encoded),
            'frequency': frequency,
            'recency_days': float(recency_days),
        }

    def _compute_engineered_features(
        self,
        data: pd.DataFrame,
        base_features: Dict[str, float]
    ) -> Dict[str, float]:
        """Compute engineered features from base features"""
        recent = data.tail(168)
        current_value = recent['value'].iloc[-1]
        mean_value = base_features['value_mean']
        std_value = base_features['value_std']

        # Ratio to mean
        ratio_to_mean = float(current_value / (mean_value + 1e-10))

        # Z-score
        z_score = float((current_value - mean_value) / (std_value + 1e-10))

        # Percentile rank
        all_values = recent['value'].values
        percentile_rank = float(np.sum(all_values <= current_value) / len(all_values))

        return {
            'ratio_to_mean': ratio_to_mean,
            'z_score': z_score,
            'percentile_rank': percentile_rank,
        }

    def _compute_hash_features(self, entity_id: str) -> Dict[str, float]:
        """Compute hash-based features for dimensionality reduction"""
        # Entity hash (useful for categorical embedding)
        entity_hash = int(hashlib.md5(entity_id.encode()).hexdigest()[:8], 16)
        entity_hash_norm = float(entity_hash % 10000) / 10000.0

        # Interaction hash (simulated)
        interaction = f"{entity_id}_interaction"
        interaction_hash = int(hashlib.md5(interaction.encode()).hexdigest()[:8], 16)
        interaction_hash_norm = float(interaction_hash % 10000) / 10000.0

        return {
            'entity_hash': entity_hash_norm,
            'interaction_hash': interaction_hash_norm,
        }


def main():
    """Main entry point for feature computation"""
    if len(sys.argv) < 3:
        print(json.dumps({
            'error': 'Usage: compute_features.py [single|batch] <entity_id|entity_ids_json>'
        }))
        sys.exit(1)

    mode = sys.argv[1]
    computer = FeatureComputer()

    try:
        if mode == 'single':
            entity_id = sys.argv[2]
            features = computer.compute_single(entity_id)
            result = {
                'entity_id': entity_id,
                'features': features,
                'timestamp': datetime.now().isoformat(),
            }
            print(json.dumps(result))

        elif mode == 'batch':
            entity_ids = json.loads(sys.argv[2])
            features_list = computer.compute_batch(entity_ids)
            result = {
                'count': len(features_list),
                'features': features_list,
                'timestamp': datetime.now().isoformat(),
            }
            print(json.dumps(result))

        else:
            raise ValueError(f"Unknown mode: {mode}")

    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'type': type(e).__name__,
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
