"""
ML-Powered Trading Strategies
Uses deep learning and advanced ML for signal generation
"""

import numpy as np
import pandas as pd
from tensorflow import keras
from sklearn.ensemble import RandomForestClassifier
import json
import sys


class LSTMPredictor:
    """
    LSTM model for price prediction
    """
    def __init__(self, lookback=60):
        self.lookback = lookback
        self.model = self._build_model()

    def _build_model(self):
        model = keras.Sequential([
            keras.layers.LSTM(50, return_sequences=True, input_shape=(self.lookback, 5)),
            keras.layers.Dropout(0.2),
            keras.layers.LSTM(50, return_sequences=False),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(25),
            keras.layers.Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')
        return model

    def predict(self, historical_data: pd.DataFrame) -> dict:
        """Predict next price movement"""
        # Prepare features
        features = historical_data[['open', 'high', 'low', 'close', 'volume']].values

        if len(features) < self.lookback:
            return {'signal': 'HOLD', 'confidence': 0.5}

        # Normalize
        mean = features.mean(axis=0)
        std = features.std(axis=0)
        features_norm = (features - mean) / (std + 1e-8)

        # Predict
        X = features_norm[-self.lookback:].reshape(1, self.lookback, 5)
        prediction = self.model.predict(X, verbose=0)[0][0]

        current_price = features[-1, 3]  # close price
        predicted_change = (prediction - current_price) / current_price

        if predicted_change > 0.01:
            return {'signal': 'BUY', 'confidence': min(abs(predicted_change) * 10, 1.0)}
        elif predicted_change < -0.01:
            return {'signal': 'SELL', 'confidence': min(abs(predicted_change) * 10, 1.0)}
        else:
            return {'signal': 'HOLD', 'confidence': 0.5}


class MLSignalGenerator:
    """
    Generate trading signals using ML models
    """
    def __init__(self):
        self.lstm = LSTMPredictor()
        self.rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)

    def generate_signal(self, market_data: dict) -> dict:
        """
        Generate trading signal from market data

        Returns:
            {
                'action': 'BUY'/'SELL'/'HOLD',
                'confidence': float,
                'features': dict
            }
        """
        # Extract features
        features = self._extract_features(market_data)

        # Simple momentum-based signal for demo
        if features['rsi'] < 30 and features['macd'] > 0:
            return {
                'action': 'BUY',
                'confidence': 0.75,
                'features': features
            }
        elif features['rsi'] > 70 and features['macd'] < 0:
            return {
                'action': 'SELL',
                'confidence': 0.75,
                'features': features
            }
        else:
            return {
                'action': 'HOLD',
                'confidence': 0.5,
                'features': features
            }

    def _extract_features(self, data: dict) -> dict:
        """Extract technical indicators"""
        price = data.get('price', 100)

        # Simplified indicators (would use TA-Lib in production)
        return {
            'rsi': self._calculate_rsi([price] * 14),  # Simplified
            'macd': (price - data.get('sma_12', price)),
            'bb_position': 0.5,
            'volume_ratio': 1.0,
        }

    def _calculate_rsi(self, prices: list, period: int = 14) -> float:
        """Calculate RSI"""
        if len(prices) < period:
            return 50.0

        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)

        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])

        if avg_loss == 0:
            return 100.0

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

        return rsi


def main():
    """CLI interface"""
    if len(sys.argv) > 1:
        market_data = json.loads(sys.argv[1])
        generator = MLSignalGenerator()
        signal = generator.generate_signal(market_data)
        print(json.dumps(signal))
    else:
        print("Usage: python ml_strategies.py '<market_data_json>'")
        sys.exit(1)


if __name__ == '__main__':
    main()
