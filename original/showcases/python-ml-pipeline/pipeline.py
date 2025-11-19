"""
Python ML Pipeline
Full ML pipeline: train models in Python, serve them via TypeScript
"""

import json
import time
from datetime import datetime
from typing import Dict, List, Any
import random

class MLModel:
    """Simulated ML model for demonstration"""

    def __init__(self, model_name: str):
        self.model_name = model_name
        self.version = "1.0.0"
        self.trained_at = None
        self.accuracy = 0.0
        self.parameters = {}

    def train(self, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Train the model"""
        start_time = time.time()

        # Simulate training
        time.sleep(0.1)

        self.trained_at = datetime.now().isoformat()
        self.accuracy = 0.85 + random.random() * 0.14  # 0.85-0.99

        training_time = time.time() - start_time

        return {
            'model_name': self.model_name,
            'samples_trained': len(training_data),
            'accuracy': round(self.accuracy, 4),
            'training_time_seconds': round(training_time, 3),
            'trained_at': self.trained_at,
            'status': 'success'
        }

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Make prediction"""
        if not self.trained_at:
            raise ValueError("Model must be trained before prediction")

        # Simulate prediction logic
        confidence = random.random()
        prediction = "positive" if confidence > 0.5 else "negative"

        return {
            'prediction': prediction,
            'confidence': round(confidence, 4),
            'features': features,
            'model': self.model_name,
            'version': self.version
        }

    def batch_predict(self, batch: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch predictions for efficiency"""
        return [self.predict(features) for features in batch]

    def get_model_info(self) -> Dict[str, Any]:
        """Get model metadata"""
        return {
            'name': self.model_name,
            'version': self.version,
            'trained_at': self.trained_at,
            'accuracy': round(self.accuracy, 4) if self.accuracy else None,
            'status': 'trained' if self.trained_at else 'untrained'
        }


class DataProcessor:
    """Data preprocessing and feature engineering"""

    @staticmethod
    def preprocess(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Preprocess raw data into features"""
        # Simulate feature engineering
        features = {
            'feature_1': len(str(raw_data.get('text', ''))),
            'feature_2': raw_data.get('numeric_value', 0) * 1.5,
            'feature_3': hash(str(raw_data)) % 100,
            'processed_at': datetime.now().isoformat()
        }
        return features

    @staticmethod
    def normalize(features: Dict[str, float]) -> Dict[str, float]:
        """Normalize features"""
        max_val = max(features.values()) if features else 1
        return {k: v / max_val for k, v in features.items()}

    @staticmethod
    def validate_data(data: Dict[str, Any]) -> bool:
        """Validate input data"""
        required_fields = ['text', 'numeric_value']
        return all(field in data for field in required_fields)


class MLPipeline:
    """Complete ML Pipeline orchestrator"""

    def __init__(self):
        self.models = {}
        self.processor = DataProcessor()

    def create_model(self, model_name: str) -> Dict[str, Any]:
        """Create a new model"""
        if model_name in self.models:
            return {'error': 'Model already exists', 'model_name': model_name}

        self.models[model_name] = MLModel(model_name)
        return {
            'success': True,
            'model_name': model_name,
            'message': 'Model created successfully'
        }

    def train_model(self, model_name: str, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Train a specific model"""
        if model_name not in self.models:
            return {'error': 'Model not found', 'model_name': model_name}

        model = self.models[model_name]
        return model.train(training_data)

    def predict(self, model_name: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Full pipeline: preprocess + predict"""
        if model_name not in self.models:
            return {'error': 'Model not found', 'model_name': model_name}

        # Preprocess
        features = self.processor.preprocess(raw_data)

        # Predict
        model = self.models[model_name]
        result = model.predict(features)

        result['raw_data'] = raw_data
        return result

    def batch_predict(self, model_name: str, batch_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Batch prediction pipeline"""
        if model_name not in self.models:
            return {'error': 'Model not found', 'model_name': model_name}

        start_time = time.time()

        # Preprocess all
        features_batch = [self.processor.preprocess(data) for data in batch_data]

        # Batch predict
        model = self.models[model_name]
        predictions = model.batch_predict(features_batch)

        processing_time = time.time() - start_time

        return {
            'predictions': predictions,
            'count': len(predictions),
            'processing_time_seconds': round(processing_time, 3),
            'throughput': round(len(predictions) / processing_time, 2)
        }

    def list_models(self) -> List[Dict[str, Any]]:
        """List all models"""
        return [model.get_model_info() for model in self.models.values()]

    def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get specific model info"""
        if model_name not in self.models:
            return {'error': 'Model not found'}

        return self.models[model_name].get_model_info()


# Export pipeline instance
pipeline = MLPipeline()

# Create and train a default model
pipeline.create_model('default')
pipeline.train_model('default', [
    {'text': 'sample data', 'numeric_value': 42},
    {'text': 'training example', 'numeric_value': 100}
])
