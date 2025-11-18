"""
Advanced Fraud Detection using ML
XGBoost + LightGBM for high-accuracy fraud prediction
"""

import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import VotingClassifier
import json
import sys
from typing import Dict, Any


class FraudMLModel:
    """
    Ensemble ML model for fraud detection
    Combines XGBoost and LightGBM for high accuracy
    """

    def __init__(self):
        # XGBoost - excellent for fraud detection
        self.xgb = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            scale_pos_weight=10,  # Handle class imbalance
            random_state=42,
            n_jobs=-1,
        )

        # LightGBM - fast and accurate
        self.lgbm = LGBMClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1,
        )

        # Ensemble
        self.ensemble = VotingClassifier(
            estimators=[('xgb', self.xgb), ('lgbm', self.lgbm)],
            voting='soft',
        )

        self.scaler = StandardScaler()
        self.is_trained = False

    def train(self, X: pd.DataFrame, y: pd.Series):
        """Train the ensemble model"""
        X_scaled = self.scaler.fit_transform(X)
        self.ensemble.fit(X_scaled, y)
        self.is_trained = True

    def predict(self, transaction: Dict[str, Any]) -> Dict[str, float]:
        """
        Predict fraud probability for a transaction

        Returns:
            {
                'fraud_probability': float,
                'fraud_score': float (0-100),
                'confidence': float
            }
        """
        features = self._extract_features(transaction)
        X = np.array([list(features.values())])

        if self.is_trained:
            X_scaled = self.scaler.transform(X)
            fraud_prob = self.ensemble.predict_proba(X_scaled)[0][1]

            # Get individual model predictions for confidence
            xgb_prob = self.xgb.predict_proba(X_scaled)[0][1]
            lgbm_prob = self.lgbm.predict_proba(X_scaled)[0][1]

            # Confidence based on model agreement
            confidence = 1.0 - abs(xgb_prob - lgbm_prob)
        else:
            # Fallback to rule-based
            fraud_prob = self._rule_based_score(transaction)
            confidence = 0.5

        return {
            'fraud_probability': float(fraud_prob),
            'fraud_score': float(fraud_prob * 100),
            'confidence': float(confidence),
        }

    def _extract_features(self, transaction: Dict[str, Any]) -> Dict[str, float]:
        """Extract numerical features from transaction"""
        return {
            'amount': transaction.get('amount', 0),
            'hour': pd.Timestamp(transaction.get('timestamp', 0), unit='ms').hour,
            'is_weekend': float(pd.Timestamp(transaction.get('timestamp', 0), unit='ms').dayofweek >= 5),
            'merchant_risk': self._merchant_risk_score(transaction.get('merchantCategory', '')),
            'amount_log': np.log1p(transaction.get('amount', 0)),
            'has_device_fp': float(transaction.get('deviceFingerprint') is not None),
            'has_location': float(transaction.get('location') is not None),
        }

    def _merchant_risk_score(self, category: str) -> float:
        """Assign risk score to merchant categories"""
        high_risk = ['gambling', 'crypto', 'wire_transfer', 'cash_advance']
        medium_risk = ['electronics', 'jewelry', 'travel']

        if any(r in category.lower() for r in high_risk):
            return 1.0
        elif any(r in category.lower() for r in medium_risk):
            return 0.5
        return 0.0

    def _rule_based_score(self, transaction: Dict[str, Any]) -> float:
        """Fallback rule-based scoring"""
        score = 0.0

        # High amount
        if transaction.get('amount', 0) > 5000:
            score += 0.3

        # Unusual time
        hour = pd.Timestamp(transaction.get('timestamp', 0), unit='ms').hour
        if hour >= 2 and hour < 5:
            score += 0.2

        # High-risk merchant
        category = transaction.get('merchantCategory', '')
        if 'gambling' in category.lower() or 'crypto' in category.lower():
            score += 0.3

        return min(score, 1.0)


def main():
    """CLI interface for fraud prediction"""
    if len(sys.argv) > 1:
        transaction = json.loads(sys.argv[1])
        model = FraudMLModel()

        # In production, load pre-trained model
        # model = joblib.load('fraud_model.pkl')

        result = model.predict(transaction)
        print(json.dumps(result))
    else:
        print("Usage: python fraud_model.py '<transaction_json>'")
        sys.exit(1)


if __name__ == '__main__':
    main()
