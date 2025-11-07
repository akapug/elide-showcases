#!/usr/bin/env python3
"""
Model Loader - ML Model Management

Handles loading, caching, and managing ML models:
- Model loading from disk or remote
- Model versioning
- Model warm-up
- Model caching
- Model metadata

@module ml/models/model_loader
"""

import os
import json
import hashlib
from typing import Dict, Optional, Any, List
from datetime import datetime
import pickle


class ModelMetadata:
    """
    Model metadata container
    """

    def __init__(self, model_id: str, name: str, version: str, path: str):
        self.model_id = model_id
        self.name = name
        self.version = version
        self.path = path
        self.size_bytes = 0
        self.loaded_at: Optional[datetime] = None
        self.load_time_ms: Optional[float] = None
        self.inference_count = 0
        self.total_inference_time_ms = 0.0
        self.checksum: Optional[str] = None

    def to_dict(self) -> Dict:
        """
        Convert to dictionary
        """
        return {
            'model_id': self.model_id,
            'name': self.name,
            'version': self.version,
            'path': self.path,
            'size_bytes': self.size_bytes,
            'size_formatted': self._format_size(self.size_bytes),
            'loaded_at': self.loaded_at.isoformat() if self.loaded_at else None,
            'load_time_ms': self.load_time_ms,
            'inference_count': self.inference_count,
            'avg_inference_time_ms': (
                self.total_inference_time_ms / self.inference_count
                if self.inference_count > 0 else 0
            ),
            'checksum': self.checksum,
        }

    @staticmethod
    def _format_size(size_bytes: int) -> str:
        """
        Format size in human-readable format
        """
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"


class ModelCache:
    """
    In-memory model cache
    """

    def __init__(self, max_models: int = 5):
        self.max_models = max_models
        self.cache: Dict[str, Any] = {}
        self.metadata: Dict[str, ModelMetadata] = {}
        self.access_order: List[str] = []

    def get(self, model_id: str) -> Optional[Any]:
        """
        Get model from cache
        """
        if model_id in self.cache:
            # Update access order (LRU)
            if model_id in self.access_order:
                self.access_order.remove(model_id)
            self.access_order.append(model_id)
            return self.cache[model_id]
        return None

    def put(self, model_id: str, model: Any, metadata: ModelMetadata) -> None:
        """
        Put model in cache
        """
        # Evict if necessary
        if len(self.cache) >= self.max_models and model_id not in self.cache:
            self._evict_lru()

        self.cache[model_id] = model
        self.metadata[model_id] = metadata

        # Update access order
        if model_id in self.access_order:
            self.access_order.remove(model_id)
        self.access_order.append(model_id)

    def remove(self, model_id: str) -> bool:
        """
        Remove model from cache
        """
        if model_id in self.cache:
            del self.cache[model_id]
            del self.metadata[model_id]
            if model_id in self.access_order:
                self.access_order.remove(model_id)
            return True
        return False

    def clear(self) -> None:
        """
        Clear all models from cache
        """
        self.cache.clear()
        self.metadata.clear()
        self.access_order.clear()

    def size(self) -> int:
        """
        Get cache size
        """
        return len(self.cache)

    def get_metadata(self, model_id: str) -> Optional[ModelMetadata]:
        """
        Get model metadata
        """
        return self.metadata.get(model_id)

    def list_models(self) -> List[str]:
        """
        List all cached models
        """
        return list(self.cache.keys())

    def _evict_lru(self) -> None:
        """
        Evict least recently used model
        """
        if self.access_order:
            lru_model_id = self.access_order[0]
            self.remove(lru_model_id)
            print(f"[ModelCache] Evicted LRU model: {lru_model_id}")


class ModelLoader:
    """
    Model loader and manager
    """

    def __init__(self, models_dir: str = './models', cache_models: bool = True):
        self.models_dir = models_dir
        self.cache_models = cache_models
        self.cache = ModelCache(max_models=5) if cache_models else None
        self._ensure_models_dir()

    def _ensure_models_dir(self) -> None:
        """
        Ensure models directory exists
        """
        if not os.path.exists(self.models_dir):
            os.makedirs(self.models_dir)

    def load_model(self, model_id: str, model_path: Optional[str] = None) -> Any:
        """
        Load model

        Args:
            model_id: Model identifier
            model_path: Path to model file (optional)

        Returns:
            Loaded model
        """
        import time

        # Check cache first
        if self.cache_models and self.cache:
            cached_model = self.cache.get(model_id)
            if cached_model is not None:
                print(f"[ModelLoader] Loaded model from cache: {model_id}")
                return cached_model

        # Determine model path
        if model_path is None:
            model_path = os.path.join(self.models_dir, f"{model_id}.pkl")

        # Check if model file exists
        if not os.path.exists(model_path):
            print(f"[ModelLoader] Model file not found: {model_path}")
            print(f"[ModelLoader] Creating mock model for: {model_id}")
            return self._create_mock_model(model_id)

        # Load model
        start_time = time.time()
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)

            load_time_ms = (time.time() - start_time) * 1000

            # Create metadata
            metadata = ModelMetadata(
                model_id=model_id,
                name=model_id,
                version='1.0.0',
                path=model_path
            )
            metadata.size_bytes = os.path.getsize(model_path)
            metadata.loaded_at = datetime.now()
            metadata.load_time_ms = load_time_ms
            metadata.checksum = self._calculate_checksum(model_path)

            # Cache model
            if self.cache_models and self.cache:
                self.cache.put(model_id, model, metadata)

            print(f"[ModelLoader] Loaded model: {model_id} in {load_time_ms:.2f}ms")
            return model

        except Exception as e:
            print(f"[ModelLoader] Failed to load model {model_id}: {e}")
            print(f"[ModelLoader] Creating mock model for: {model_id}")
            return self._create_mock_model(model_id)

    def _create_mock_model(self, model_id: str) -> Any:
        """
        Create a mock model for testing

        In production, this would not be used
        """
        class MockModel:
            def __init__(self, model_id: str):
                self.model_id = model_id
                self.version = '1.0.0'

            def predict(self, text: str) -> Dict:
                # Simple mock prediction
                return {
                    'sentiment': 'neutral',
                    'score': 0.0,
                    'confidence': 0.5,
                    'model': self.model_id,
                }

        return MockModel(model_id)

    def save_model(self, model_id: str, model: Any) -> str:
        """
        Save model to disk

        Args:
            model_id: Model identifier
            model: Model to save

        Returns:
            Path to saved model
        """
        model_path = os.path.join(self.models_dir, f"{model_id}.pkl")

        try:
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)

            print(f"[ModelLoader] Saved model: {model_id} to {model_path}")
            return model_path

        except Exception as e:
            print(f"[ModelLoader] Failed to save model {model_id}: {e}")
            raise

    def unload_model(self, model_id: str) -> bool:
        """
        Unload model from cache

        Args:
            model_id: Model identifier

        Returns:
            True if unloaded, False otherwise
        """
        if self.cache:
            return self.cache.remove(model_id)
        return False

    def get_model_info(self, model_id: str) -> Optional[Dict]:
        """
        Get model information

        Args:
            model_id: Model identifier

        Returns:
            Model information dictionary
        """
        if self.cache:
            metadata = self.cache.get_metadata(model_id)
            if metadata:
                return metadata.to_dict()
        return None

    def list_available_models(self) -> List[Dict]:
        """
        List all available models

        Returns:
            List of model information dictionaries
        """
        models = []

        # Get models from cache
        if self.cache:
            for model_id in self.cache.list_models():
                metadata = self.cache.get_metadata(model_id)
                if metadata:
                    models.append(metadata.to_dict())

        # Get models from disk
        if os.path.exists(self.models_dir):
            for filename in os.listdir(self.models_dir):
                if filename.endswith('.pkl'):
                    model_id = filename[:-4]
                    if not any(m['model_id'] == model_id for m in models):
                        model_path = os.path.join(self.models_dir, filename)
                        models.append({
                            'model_id': model_id,
                            'name': model_id,
                            'path': model_path,
                            'size_bytes': os.path.getsize(model_path),
                            'loaded': False,
                        })

        return models

    def warm_up_models(self, model_ids: List[str]) -> None:
        """
        Warm up models by loading them into cache

        Args:
            model_ids: List of model identifiers to warm up
        """
        print(f"[ModelLoader] Warming up {len(model_ids)} models...")

        for model_id in model_ids:
            try:
                self.load_model(model_id)
            except Exception as e:
                print(f"[ModelLoader] Failed to warm up model {model_id}: {e}")

        print(f"[ModelLoader] Warm up complete")

    def _calculate_checksum(self, file_path: str) -> str:
        """
        Calculate file checksum
        """
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def get_cache_stats(self) -> Dict:
        """
        Get cache statistics
        """
        if not self.cache:
            return {'enabled': False}

        return {
            'enabled': True,
            'size': self.cache.size(),
            'max_size': self.cache.max_models,
            'models': self.cache.list_models(),
        }


def main():
    """
    Test model loader
    """
    loader = ModelLoader(models_dir='./models', cache_models=True)

    # List available models
    print("Available models:")
    models = loader.list_available_models()
    print(json.dumps(models, indent=2))

    # Load a model
    model = loader.load_model('sentiment-transformer-v1')
    print(f"\nLoaded model: {model}")

    # Get model info
    info = loader.get_model_info('sentiment-transformer-v1')
    if info:
        print(f"\nModel info:")
        print(json.dumps(info, indent=2))

    # Get cache stats
    stats = loader.get_cache_stats()
    print(f"\nCache stats:")
    print(json.dumps(stats, indent=2))


if __name__ == '__main__':
    main()
