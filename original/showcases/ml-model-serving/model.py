"""
ML Model Serving - Python TensorFlow Component

Demonstrates real polyglot integration with TensorFlow model serving.
This module is directly imported by TypeScript via Elide's polyglot runtime.
"""

import numpy as np
from typing import List, Dict, Any
import json


class TensorFlowModel:
    """
    Simulated TensorFlow model for demonstration.
    In production, this would load actual TensorFlow models.
    """

    def __init__(self, model_name: str = "sentiment-classifier"):
        self.model_name = model_name
        self.version = "1.0.0"
        self.input_shape = (None, 128)
        self.output_classes = ["negative", "neutral", "positive"]
        self.warm = False

    def warmup(self) -> Dict[str, Any]:
        """Warm up the model by running dummy inference"""
        dummy_input = np.random.randn(1, 128).tolist()
        self.predict(dummy_input)
        self.warm = True
        return {
            "status": "warmed",
            "model": self.model_name,
            "input_shape": list(self.input_shape),
            "output_classes": self.output_classes
        }

    def predict(self, input_data: List[float]) -> Dict[str, Any]:
        """
        Run inference on input data.

        Args:
            input_data: Input features as list of floats

        Returns:
            Prediction results with class probabilities
        """
        # Convert to numpy array
        input_array = np.array(input_data)

        # Simulate model inference
        # In production, this would be: model.predict(input_array)
        logits = np.random.randn(len(self.output_classes))
        probabilities = self._softmax(logits)

        predicted_class = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_class])

        return {
            "class": self.output_classes[predicted_class],
            "confidence": round(confidence, 4),
            "probabilities": {
                class_name: round(float(prob), 4)
                for class_name, prob in zip(self.output_classes, probabilities)
            },
            "model": self.model_name,
            "version": self.version
        }

    def predict_batch(self, batch_data: List[List[float]]) -> List[Dict[str, Any]]:
        """
        Run batch inference on multiple inputs.

        Args:
            batch_data: List of input feature vectors

        Returns:
            List of prediction results
        """
        return [self.predict(input_data) for input_data in batch_data]

    def _softmax(self, x: np.ndarray) -> np.ndarray:
        """Apply softmax to convert logits to probabilities"""
        exp_x = np.exp(x - np.max(x))
        return exp_x / exp_x.sum()

    def get_model_info(self) -> Dict[str, Any]:
        """Get model metadata"""
        return {
            "name": self.model_name,
            "version": self.version,
            "input_shape": list(self.input_shape),
            "output_classes": self.output_classes,
            "framework": "tensorflow",
            "warm": self.warm
        }


class ModelRegistry:
    """Registry for managing multiple models"""

    def __init__(self):
        self.models = {}

    def register_model(self, model_id: str, model: TensorFlowModel) -> Dict[str, str]:
        """Register a model in the registry"""
        self.models[model_id] = model
        return {
            "status": "registered",
            "model_id": model_id,
            "model_name": model.model_name
        }

    def get_model(self, model_id: str) -> TensorFlowModel:
        """Get a model from the registry"""
        if model_id not in self.models:
            raise ValueError(f"Model {model_id} not found in registry")
        return self.models[model_id]

    def list_models(self) -> List[Dict[str, Any]]:
        """List all registered models"""
        return [
            {
                "model_id": model_id,
                **model.get_model_info()
            }
            for model_id, model in self.models.items()
        ]


# Global model instances (accessible from TypeScript)
default_model = TensorFlowModel("sentiment-classifier")
registry = ModelRegistry()

# Register default model
registry.register_model("default", default_model)


def create_model(model_name: str) -> TensorFlowModel:
    """
    Factory function to create new model instances.
    Can be called directly from TypeScript.
    """
    return TensorFlowModel(model_name)


def quick_predict(text_features: List[float]) -> Dict[str, Any]:
    """
    Quick prediction using default model.
    Convenience function for TypeScript integration.
    """
    return default_model.predict(text_features)
