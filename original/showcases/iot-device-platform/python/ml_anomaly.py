#!/usr/bin/env python3
"""
IoT Device Platform - ML-based Anomaly Detection

Advanced anomaly detection for IoT sensor data:
- Isolation Forest
- Autoencoder (Neural Network)
- Local Outlier Factor (LOF)
- One-Class SVM
- Statistical methods (Z-score, IQR)
- Ensemble methods
- Real-time anomaly scoring
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import warnings
import pickle

import numpy as np
import pandas as pd
from scipy import stats
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model

from pyod.models.knn import KNN
from pyod.models.lof import LOF as PyodLOF
from pyod.models.iforest import IForest

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
    """Configuration for anomaly detection"""

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

        self.model_dir = os.getenv('MODEL_DIR', './models')
        self.anomaly_threshold = float(os.getenv('ANOMALY_THRESHOLD', '0.1'))


class AutoEncoder:
    """Autoencoder for anomaly detection"""

    def __init__(self, input_dim: int, encoding_dim: int = 8):
        self.input_dim = input_dim
        self.encoding_dim = encoding_dim
        self.model = None
        self.scaler = StandardScaler()

    def build_model(self):
        """Build autoencoder model"""
        # Encoder
        input_layer = layers.Input(shape=(self.input_dim,))
        encoded = layers.Dense(64, activation='relu')(input_layer)
        encoded = layers.Dropout(0.2)(encoded)
        encoded = layers.Dense(32, activation='relu')(encoded)
        encoded = layers.Dense(self.encoding_dim, activation='relu')(encoded)

        # Decoder
        decoded = layers.Dense(32, activation='relu')(encoded)
        decoded = layers.Dropout(0.2)(decoded)
        decoded = layers.Dense(64, activation='relu')(decoded)
        output_layer = layers.Dense(self.input_dim, activation='linear')(decoded)

        # Autoencoder model
        self.model = Model(inputs=input_layer, outputs=output_layer)
        self.model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )

        logger.info(f"Autoencoder built: {self.input_dim} -> {self.encoding_dim} -> {self.input_dim}")

    def train(
        self,
        X: np.ndarray,
        epochs: int = 50,
        batch_size: int = 32,
        validation_split: float = 0.2
    ):
        """Train the autoencoder"""
        if self.model is None:
            self.build_model()

        # Scale data
        X_scaled = self.scaler.fit_transform(X)

        # Train
        history = self.model.fit(
            X_scaled, X_scaled,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            shuffle=True,
            verbose=0
        )

        logger.info(f"Autoencoder trained for {epochs} epochs")
        return history

    def predict_anomaly_scores(self, X: np.ndarray) -> np.ndarray:
        """Calculate anomaly scores (reconstruction error)"""
        X_scaled = self.scaler.transform(X)
        reconstructed = self.model.predict(X_scaled, verbose=0)
        mse = np.mean(np.power(X_scaled - reconstructed, 2), axis=1)
        return mse

    def save(self, filepath: str):
        """Save model and scaler"""
        self.model.save(f"{filepath}_model.h5")
        joblib.dump(self.scaler, f"{filepath}_scaler.pkl")
        logger.info(f"Autoencoder saved to {filepath}")

    def load(self, filepath: str):
        """Load model and scaler"""
        self.model = keras.models.load_model(f"{filepath}_model.h5")
        self.scaler = joblib.load(f"{filepath}_scaler.pkl")
        logger.info(f"Autoencoder loaded from {filepath}")


class AnomalyDetector:
    """Main anomaly detection engine"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
        self.influx_client = None
        self.postgres_conn = None
        self.redis_client = None

        # Models
        self.isolation_forest = None
        self.lof = None
        self.one_class_svm = None
        self.autoencoder = None
        self.scaler = RobustScaler()

        # Model storage
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
                decode_responses=False
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

    def load_training_data(
        self,
        device_id: str,
        days: int = 30
    ) -> pd.DataFrame:
        """Load training data from InfluxDB"""
        logger.info(f"Loading training data for {device_id} ({days} days)")

        query_api = self.influx_client.query_api()

        flux_query = f'''
            from(bucket: "{self.config.influx_bucket}")
                |> range(start: -{days}d)
                |> filter(fn: (r) => r.deviceId == "{device_id}")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''

        try:
            result = query_api.query_data_frame(flux_query)

            if isinstance(result, list):
                if len(result) == 0:
                    return pd.DataFrame()
                result = pd.concat(result, ignore_index=True)

            result = result.rename(columns={'_time': 'timestamp'})
            result['timestamp'] = pd.to_datetime(result['timestamp'])
            result = result.set_index('timestamp')

            # Clean columns
            cols_to_drop = ['result', 'table', '_start', '_stop', '_measurement', 'deviceId']
            result = result.drop(columns=[c for c in cols_to_drop if c in result.columns])

            # Keep only numeric columns
            result = result.select_dtypes(include=[np.number])

            logger.info(f"Loaded {len(result)} records with {len(result.columns)} metrics")
            return result

        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            raise

    def train_isolation_forest(
        self,
        X: np.ndarray,
        contamination: float = 0.1
    ):
        """Train Isolation Forest model"""
        logger.info("Training Isolation Forest...")

        self.isolation_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100,
            max_samples='auto',
            n_jobs=-1
        )

        self.isolation_forest.fit(X)
        logger.info("Isolation Forest trained")

    def train_lof(
        self,
        X: np.ndarray,
        n_neighbors: int = 20,
        contamination: float = 0.1
    ):
        """Train Local Outlier Factor"""
        logger.info("Training Local Outlier Factor...")

        self.lof = LocalOutlierFactor(
            n_neighbors=n_neighbors,
            contamination=contamination,
            novelty=True,
            n_jobs=-1
        )

        self.lof.fit(X)
        logger.info("LOF trained")

    def train_one_class_svm(
        self,
        X: np.ndarray,
        nu: float = 0.1
    ):
        """Train One-Class SVM"""
        logger.info("Training One-Class SVM...")

        self.one_class_svm = OneClassSVM(
            nu=nu,
            kernel='rbf',
            gamma='auto'
        )

        self.one_class_svm.fit(X)
        logger.info("One-Class SVM trained")

    def train_autoencoder(
        self,
        X: np.ndarray,
        encoding_dim: int = 8,
        epochs: int = 50
    ):
        """Train autoencoder"""
        logger.info("Training Autoencoder...")

        self.autoencoder = AutoEncoder(
            input_dim=X.shape[1],
            encoding_dim=encoding_dim
        )

        self.autoencoder.train(X, epochs=epochs)
        logger.info("Autoencoder trained")

    def train_all_models(
        self,
        device_id: str,
        days: int = 30,
        contamination: float = 0.1
    ):
        """Train all anomaly detection models"""
        logger.info(f"Training all models for device {device_id}")

        # Load data
        data = self.load_training_data(device_id, days)

        if len(data) == 0:
            raise ValueError("No training data available")

        # Prepare features
        X = data.values
        X = self.scaler.fit_transform(X)

        # Train models
        self.train_isolation_forest(X, contamination)
        self.train_lof(X, contamination=contamination)
        self.train_one_class_svm(X, nu=contamination)
        self.train_autoencoder(X)

        # Save models
        self.save_models(device_id)

        logger.info("All models trained successfully")

    def detect_anomalies(
        self,
        X: np.ndarray,
        ensemble: bool = True
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Detect anomalies using trained models

        Args:
            X: Input data
            ensemble: Use ensemble of models

        Returns:
            (predictions, scores) where -1 = anomaly, 1 = normal
        """
        X_scaled = self.scaler.transform(X)

        if ensemble:
            # Ensemble prediction
            predictions = []
            scores = []

            if self.isolation_forest:
                pred = self.isolation_forest.predict(X_scaled)
                score = -self.isolation_forest.score_samples(X_scaled)
                predictions.append(pred)
                scores.append(score)

            if self.lof:
                pred = self.lof.predict(X_scaled)
                score = -self.lof.score_samples(X_scaled)
                predictions.append(pred)
                scores.append(score)

            if self.one_class_svm:
                pred = self.one_class_svm.predict(X_scaled)
                score = -self.one_class_svm.score_samples(X_scaled)
                predictions.append(pred)
                scores.append(score)

            if self.autoencoder:
                ae_scores = self.autoencoder.predict_anomaly_scores(X)
                threshold = np.percentile(ae_scores, 90)
                pred = np.where(ae_scores > threshold, -1, 1)
                predictions.append(pred)
                scores.append(ae_scores)

            # Majority voting
            predictions = np.array(predictions)
            final_predictions = np.where(
                np.sum(predictions == -1, axis=0) >= len(predictions) / 2,
                -1,
                1
            )

            # Average scores
            final_scores = np.mean(scores, axis=0)

            return final_predictions, final_scores

        else:
            # Use only Isolation Forest
            if self.isolation_forest is None:
                raise ValueError("No model trained")

            predictions = self.isolation_forest.predict(X_scaled)
            scores = -self.isolation_forest.score_samples(X_scaled)

            return predictions, scores

    def detect_statistical_anomalies(
        self,
        data: pd.DataFrame,
        threshold: float = 3.0
    ) -> pd.DataFrame:
        """
        Detect anomalies using statistical methods

        Args:
            data: DataFrame with metrics
            threshold: Z-score threshold

        Returns:
            DataFrame with anomaly flags
        """
        result = data.copy()

        for col in data.select_dtypes(include=[np.number]).columns:
            # Z-score method
            z_scores = np.abs(stats.zscore(data[col].dropna()))
            result[f'{col}_zscore_anomaly'] = z_scores > threshold

            # IQR method
            Q1 = data[col].quantile(0.25)
            Q3 = data[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            result[f'{col}_iqr_anomaly'] = (
                (data[col] < lower_bound) | (data[col] > upper_bound)
            )

        return result

    def real_time_anomaly_score(
        self,
        device_id: str,
        metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Calculate real-time anomaly score for current metrics

        Args:
            device_id: Device identifier
            metrics: Current metric values

        Returns:
            Anomaly detection results
        """
        # Load models if not in memory
        if self.isolation_forest is None:
            self.load_models(device_id)

        # Prepare input
        feature_names = list(metrics.keys())
        X = np.array([list(metrics.values())])

        # Detect anomalies
        predictions, scores = self.detect_anomalies(X, ensemble=True)

        is_anomaly = predictions[0] == -1
        anomaly_score = float(scores[0])

        result = {
            'device_id': device_id,
            'timestamp': datetime.now().isoformat(),
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': anomaly_score,
            'metrics': metrics,
            'threshold': self.config.anomaly_threshold
        }

        # Store in Redis for real-time access
        try:
            key = f"anomaly:{device_id}:latest"
            self.redis_client.setex(
                key,
                3600,
                pickle.dumps(result)
            )
        except Exception as e:
            logger.error(f"Failed to cache anomaly result: {e}")

        # Store anomaly in database if detected
        if is_anomaly:
            self.store_anomaly(result)

        return result

    def store_anomaly(self, anomaly: Dict[str, Any]):
        """Store detected anomaly in database"""
        try:
            cursor = self.postgres_conn.cursor()
            cursor.execute("""
                INSERT INTO anomalies (device_id, timestamp, score, metrics, detected_at)
                VALUES (%s, %s, %s, %s, NOW())
            """, (
                anomaly['device_id'],
                anomaly['timestamp'],
                anomaly['anomaly_score'],
                str(anomaly['metrics'])
            ))
            self.postgres_conn.commit()
            cursor.close()

            logger.info(f"Anomaly stored for device {anomaly['device_id']}")

        except Exception as e:
            logger.error(f"Failed to store anomaly: {e}")

    def save_models(self, device_id: str):
        """Save all trained models"""
        base_path = os.path.join(self.config.model_dir, device_id)

        # Save sklearn models
        if self.isolation_forest:
            joblib.dump(
                self.isolation_forest,
                f"{base_path}_isolation_forest.pkl"
            )

        if self.lof:
            joblib.dump(self.lof, f"{base_path}_lof.pkl")

        if self.one_class_svm:
            joblib.dump(self.one_class_svm, f"{base_path}_svm.pkl")

        # Save autoencoder
        if self.autoencoder:
            self.autoencoder.save(f"{base_path}_autoencoder")

        # Save scaler
        joblib.dump(self.scaler, f"{base_path}_scaler.pkl")

        logger.info(f"Models saved for device {device_id}")

    def load_models(self, device_id: str):
        """Load trained models"""
        base_path = os.path.join(self.config.model_dir, device_id)

        try:
            # Load sklearn models
            if os.path.exists(f"{base_path}_isolation_forest.pkl"):
                self.isolation_forest = joblib.load(
                    f"{base_path}_isolation_forest.pkl"
                )

            if os.path.exists(f"{base_path}_lof.pkl"):
                self.lof = joblib.load(f"{base_path}_lof.pkl")

            if os.path.exists(f"{base_path}_svm.pkl"):
                self.one_class_svm = joblib.load(f"{base_path}_svm.pkl")

            # Load autoencoder
            if os.path.exists(f"{base_path}_autoencoder_model.h5"):
                self.autoencoder = AutoEncoder(input_dim=1)  # Will be overwritten
                self.autoencoder.load(f"{base_path}_autoencoder")

            # Load scaler
            if os.path.exists(f"{base_path}_scaler.pkl"):
                self.scaler = joblib.load(f"{base_path}_scaler.pkl")

            logger.info(f"Models loaded for device {device_id}")

        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            raise

    def evaluate_models(
        self,
        device_id: str,
        test_days: int = 7
    ) -> Dict[str, Any]:
        """
        Evaluate model performance

        Args:
            device_id: Device identifier
            test_days: Days of test data

        Returns:
            Evaluation metrics
        """
        logger.info(f"Evaluating models for device {device_id}")

        # Load test data
        data = self.load_training_data(device_id, test_days)

        if len(data) == 0:
            raise ValueError("No test data available")

        X = data.values

        # Detect anomalies
        predictions, scores = self.detect_anomalies(X, ensemble=True)

        anomaly_count = np.sum(predictions == -1)
        anomaly_percentage = (anomaly_count / len(predictions)) * 100

        results = {
            'device_id': device_id,
            'total_samples': len(predictions),
            'anomalies_detected': int(anomaly_count),
            'anomaly_percentage': float(anomaly_percentage),
            'avg_anomaly_score': float(np.mean(scores[predictions == -1])) if anomaly_count > 0 else 0,
            'avg_normal_score': float(np.mean(scores[predictions == 1])),
            'score_threshold': float(np.percentile(scores, 90))
        }

        logger.info(f"Evaluation complete: {anomaly_count} anomalies detected")

        return results

    def generate_anomaly_report(
        self,
        device_id: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """Generate comprehensive anomaly detection report"""
        logger.info(f"Generating anomaly report for device {device_id}")

        # Load data
        data = self.load_training_data(device_id, days)

        if len(data) == 0:
            return {'error': 'No data available'}

        # Statistical anomalies
        statistical_anomalies = self.detect_statistical_anomalies(data)

        # ML-based anomalies
        X = data.values
        predictions, scores = self.detect_anomalies(X, ensemble=True)

        # Combine results
        data['ml_anomaly'] = predictions == -1
        data['ml_score'] = scores

        report = {
            'device_id': device_id,
            'period_days': days,
            'total_records': len(data),
            'ml_anomalies': {
                'count': int(np.sum(predictions == -1)),
                'percentage': float((np.sum(predictions == -1) / len(predictions)) * 100)
            },
            'statistical_anomalies': {},
            'top_anomalies': []
        }

        # Statistical summary
        for col in data.select_dtypes(include=[np.number]).columns:
            if f'{col}_zscore_anomaly' in statistical_anomalies.columns:
                count = statistical_anomalies[f'{col}_zscore_anomaly'].sum()
                report['statistical_anomalies'][col] = {
                    'zscore_count': int(count),
                    'iqr_count': int(statistical_anomalies[f'{col}_iqr_anomaly'].sum())
                }

        # Top anomalies
        anomaly_indices = np.where(predictions == -1)[0]
        top_indices = anomaly_indices[np.argsort(scores[anomaly_indices])[-10:]]

        for idx in reversed(top_indices):
            report['top_anomalies'].append({
                'timestamp': str(data.index[idx]),
                'score': float(scores[idx]),
                'metrics': data.iloc[idx].to_dict()
            })

        return report


def main():
    """Main execution"""
    detector = AnomalyDetector()

    try:
        device_id = sys.argv[1] if len(sys.argv) > 1 else 'sensor-001'
        mode = sys.argv[2] if len(sys.argv) > 2 else 'train'

        if mode == 'train':
            # Train models
            logger.info(f"Training models for device {device_id}")
            detector.train_all_models(device_id, days=30)
            logger.info("Training complete")

        elif mode == 'evaluate':
            # Evaluate models
            results = detector.evaluate_models(device_id)
            print("\nEvaluation Results:")
            print(f"Anomalies detected: {results['anomalies_detected']}/{results['total_samples']}")
            print(f"Anomaly percentage: {results['anomaly_percentage']:.2f}%")

        elif mode == 'report':
            # Generate report
            report = detector.generate_anomaly_report(device_id)
            print(f"\nAnomaly Report for {device_id}")
            print(f"ML Anomalies: {report['ml_anomalies']['count']} ({report['ml_anomalies']['percentage']:.2f}%)")
            print(f"\nTop Anomalies:")
            for anomaly in report['top_anomalies'][:5]:
                print(f"  {anomaly['timestamp']}: score={anomaly['score']:.4f}")

    finally:
        detector.close_connections()


if __name__ == '__main__':
    main()
