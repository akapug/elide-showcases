"""
Advanced Risk Prediction using Python ML Libraries
Demonstrates why Python is essential for sophisticated risk modeling
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from scipy.stats import norm
import json
from typing import Dict, List, Any
from dataclasses import dataclass
import sys


@dataclass
class RiskPrediction:
    """Risk prediction result"""
    risk_score: float  # 0-100
    anomaly_score: float  # -1 to 1
    var_95: float  # Value at Risk 95%
    expected_loss: float
    confidence: float
    features_used: List[str]


class AdvancedRiskPredictor:
    """
    ML-powered risk prediction using scikit-learn
    Combines multiple models for comprehensive risk assessment
    """

    def __init__(self):
        # Isolation Forest for anomaly detection
        self.anomaly_detector = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
            n_jobs=-1  # Use all CPU cores
        )

        # Random Forest for risk classification
        self.risk_classifier = RandomForestClassifier(
            n_estimators=50,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )

        self.scaler = StandardScaler()
        self.is_trained = False

    def train(self, historical_data: pd.DataFrame):
        """
        Train models on historical order and risk data

        Expected columns:
        - order_value, position_size, leverage, volatility,
        - concentration, velocity, price_deviation, portfolio_value
        - risk_materialized (0/1 for classifier)
        """
        features = self._extract_features(historical_data)

        # Scale features
        features_scaled = self.scaler.fit_transform(features)

        # Train anomaly detector
        self.anomaly_detector.fit(features_scaled)

        # Train risk classifier if labels available
        if 'risk_materialized' in historical_data.columns:
            labels = historical_data['risk_materialized'].values
            self.risk_classifier.fit(features_scaled, labels)

        self.is_trained = True

    def predict(self, order_data: Dict[str, Any]) -> RiskPrediction:
        """
        Predict risk for a single order

        Args:
            order_data: Dictionary containing order and account features

        Returns:
            RiskPrediction with comprehensive risk metrics
        """
        # Extract features
        features = self._extract_single_features(order_data)
        features_array = np.array([list(features.values())])

        # Scale features
        if self.is_trained:
            features_scaled = self.scaler.transform(features_array)
        else:
            features_scaled = features_array

        # Anomaly score (-1 to 1, lower is more anomalous)
        anomaly_score = self.anomaly_detector.score_samples(features_scaled)[0]

        # Risk classification probability
        if self.is_trained:
            risk_prob = self.risk_classifier.predict_proba(features_scaled)[0][1]
        else:
            # Fallback to rule-based
            risk_prob = self._calculate_rule_based_risk(order_data)

        # Calculate VaR using historical simulation approach
        var_95 = self._calculate_var(order_data, 0.95)

        # Expected loss calculation
        expected_loss = self._calculate_expected_loss(order_data, risk_prob)

        # Overall risk score (0-100)
        risk_score = self._calculate_risk_score(
            anomaly_score, risk_prob, var_95, expected_loss
        )

        return RiskPrediction(
            risk_score=float(risk_score),
            anomaly_score=float(anomaly_score),
            var_95=float(var_95),
            expected_loss=float(expected_loss),
            confidence=float(risk_prob),
            features_used=list(features.keys())
        )

    def predict_batch(self, orders_data: List[Dict[str, Any]]) -> List[RiskPrediction]:
        """Batch prediction for multiple orders (more efficient)"""
        return [self.predict(order) for order in orders_data]

    def _extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract relevant features for model training"""
        feature_cols = [
            'order_value', 'position_size', 'leverage', 'volatility',
            'concentration', 'velocity', 'price_deviation', 'portfolio_value'
        ]
        return df[feature_cols]

    def _extract_single_features(self, order_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract features from single order"""
        return {
            'order_value': order_data.get('order_value', 0),
            'position_size': order_data.get('position_size', 0),
            'leverage': order_data.get('leverage', 1),
            'volatility': order_data.get('volatility', 0.2),
            'concentration': order_data.get('concentration', 0),
            'velocity': order_data.get('velocity', 0),
            'price_deviation': order_data.get('price_deviation', 0),
            'portfolio_value': order_data.get('portfolio_value', 0),
        }

    def _calculate_var(self, order_data: Dict[str, Any], confidence: float) -> float:
        """
        Calculate Value at Risk using parametric method
        VaR = μ - σ * z_score
        """
        order_value = order_data.get('order_value', 0)
        volatility = order_data.get('volatility', 0.2)

        # Z-score for 95% confidence
        z_score = norm.ppf(1 - confidence)

        # VaR calculation (simplified)
        var = order_value * volatility * abs(z_score)

        return var

    def _calculate_expected_loss(
        self, order_data: Dict[str, Any], risk_prob: float
    ) -> float:
        """Calculate expected loss given default probability"""
        order_value = order_data.get('order_value', 0)
        loss_given_default = 0.4  # Assume 40% loss given default

        return order_value * risk_prob * loss_given_default

    def _calculate_rule_based_risk(self, order_data: Dict[str, Any]) -> float:
        """Fallback rule-based risk calculation"""
        risk = 0.0

        # Leverage risk
        leverage = order_data.get('leverage', 1)
        if leverage > 5:
            risk += 0.3
        elif leverage > 3:
            risk += 0.15

        # Volatility risk
        volatility = order_data.get('volatility', 0.2)
        if volatility > 0.5:
            risk += 0.25
        elif volatility > 0.3:
            risk += 0.1

        # Concentration risk
        concentration = order_data.get('concentration', 0)
        if concentration > 0.5:
            risk += 0.2
        elif concentration > 0.3:
            risk += 0.1

        return min(risk, 1.0)

    def _calculate_risk_score(
        self,
        anomaly_score: float,
        risk_prob: float,
        var_95: float,
        expected_loss: float
    ) -> float:
        """
        Combine multiple signals into overall risk score (0-100)
        """
        # Normalize anomaly score (-1 to 1) -> (0 to 1)
        anomaly_component = (1 - (anomaly_score + 1) / 2) * 30

        # Risk probability component
        risk_component = risk_prob * 40

        # VaR component (normalized)
        var_component = min(var_95 / 10000, 1.0) * 20

        # Expected loss component
        loss_component = min(expected_loss / 5000, 1.0) * 10

        total_score = (
            anomaly_component + risk_component + var_component + loss_component
        )

        return min(total_score, 100)


def main():
    """CLI interface for risk prediction"""
    if len(sys.argv) > 1:
        # Predict mode
        order_data = json.loads(sys.argv[1])
        predictor = AdvancedRiskPredictor()

        # In production, load pre-trained model
        # For demo, use untrained (rule-based fallback)

        prediction = predictor.predict(order_data)

        # Output as JSON
        result = {
            'risk_score': prediction.risk_score,
            'anomaly_score': prediction.anomaly_score,
            'var_95': prediction.var_95,
            'expected_loss': prediction.expected_loss,
            'confidence': prediction.confidence,
        }

        print(json.dumps(result))
    else:
        print("Usage: python risk_predictor.py '<order_json>'")
        sys.exit(1)


if __name__ == '__main__':
    main()
