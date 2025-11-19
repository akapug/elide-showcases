"""
Inference Engine - Python Implementation

High-performance inference engine with batch processing, streaming, and model caching.
This module is imported directly by TypeScript with <1ms overhead.

Key Features:
- Real-time inference
- Batch inference with optimizations
- Streaming inference for large inputs
- Model caching and warmup
- GPU acceleration (simulated)
"""

import time
import random
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime
import numpy as np


@dataclass
class InferenceResult:
    """Single inference result"""
    prediction: Any
    confidence: float
    probabilities: Optional[Dict[str, float]]
    model_version: str
    inference_time_ms: float


@dataclass
class BatchInferenceResult:
    """Batch inference result"""
    predictions: List[Any]
    total_items: int
    successful: int
    failed: int
    avg_confidence: float
    total_time_ms: float
    throughput: float  # items/second


@dataclass
class ModelCache:
    """Cached model information"""
    model_name: str
    version: str
    framework: str
    loaded_at: str
    last_used: str
    num_inferences: int
    avg_latency_ms: float
    cached_in_memory: bool
    warmup_completed: bool


class InferenceEngine:
    """
    High-performance inference engine supporting multiple ML frameworks.

    Features:
    - Real-time and batch inference
    - Model caching for fast repeated inference
    - Automatic batching and optimization
    - GPU acceleration support
    """

    def __init__(self):
        self.model_cache: Dict[str, ModelCache] = {}
        self.inference_count = 0
        self.batch_count = 0

    def predict(
        self,
        model_name: str,
        input_data: Any,
        version: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run single inference.

        Args:
            model_name: Name of the model
            input_data: Input data for inference
            version: Optional model version

        Returns:
            Inference result
        """
        start_time = time.time()

        # Get or load model
        model_key = f"{model_name}:{version or 'latest'}"
        if model_key not in self.model_cache:
            self._load_model(model_name, version)

        # Update cache stats
        cache = self.model_cache[model_key]
        cache.last_used = datetime.utcnow().isoformat()
        cache.num_inferences += 1

        # Simulate inference (in real implementation, this calls the actual model)
        prediction, confidence, probabilities = self._run_inference(
            model_name,
            input_data
        )

        inference_time_ms = (time.time() - start_time) * 1000

        # Update average latency
        cache.avg_latency_ms = (
            (cache.avg_latency_ms * (cache.num_inferences - 1) + inference_time_ms)
            / cache.num_inferences
        )

        self.inference_count += 1

        return {
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "probabilities": probabilities,
            "model": model_name,
            "version": version or "latest",
            "inference_time_ms": round(inference_time_ms, 2),
            "cached": True
        }

    def batch_predict(
        self,
        model_name: str,
        inputs: List[Any],
        version: Optional[str] = None,
        batch_size: int = 32
    ) -> Dict[str, Any]:
        """
        Run batch inference with automatic batching.

        Args:
            model_name: Name of the model
            inputs: List of inputs
            version: Optional model version
            batch_size: Batch size for processing

        Returns:
            Batch inference results
        """
        start_time = time.time()

        # Get or load model
        model_key = f"{model_name}:{version or 'latest'}"
        if model_key not in self.model_cache:
            self._load_model(model_name, version)

        predictions = []
        confidences = []
        failed_count = 0

        # Process in batches for efficiency
        for i in range(0, len(inputs), batch_size):
            batch = inputs[i:i + batch_size]

            for input_data in batch:
                try:
                    prediction, confidence, probs = self._run_inference(
                        model_name,
                        input_data
                    )
                    predictions.append({
                        "prediction": prediction,
                        "confidence": round(confidence, 4),
                        "probabilities": probs
                    })
                    confidences.append(confidence)
                except Exception as e:
                    failed_count += 1
                    predictions.append({
                        "error": str(e)
                    })

        total_time_ms = (time.time() - start_time) * 1000
        throughput = len(inputs) / (total_time_ms / 1000) if total_time_ms > 0 else 0

        self.batch_count += 1
        self.inference_count += len(inputs)

        return {
            "predictions": predictions,
            "total_items": len(inputs),
            "successful": len(inputs) - failed_count,
            "failed": failed_count,
            "avg_confidence": round(sum(confidences) / len(confidences), 4) if confidences else 0,
            "total_time_ms": round(total_time_ms, 2),
            "avg_time_per_item_ms": round(total_time_ms / len(inputs), 2),
            "throughput_items_per_sec": round(throughput, 2),
            "model": model_name,
            "version": version or "latest"
        }

    def start_stream(
        self,
        model_name: str,
        version: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Start streaming inference session.

        Useful for:
        - Real-time video/audio processing
        - Interactive applications
        - Long-running inference tasks

        Args:
            model_name: Name of the model
            version: Optional model version

        Returns:
            Stream session info
        """
        stream_id = f"stream_{int(time.time())}_{random.randint(1000, 9999)}"

        # Load model if not cached
        model_key = f"{model_name}:{version or 'latest'}"
        if model_key not in self.model_cache:
            self._load_model(model_name, version)

        return {
            "stream_id": stream_id,
            "model": model_name,
            "version": version or "latest",
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "message": "Streaming session started. Send data to process."
        }

    def warmup_model(
        self,
        model_name: str,
        version: Optional[str] = None,
        num_samples: int = 10
    ) -> Dict[str, Any]:
        """
        Warm up model by running dummy inferences.

        This ensures the model is fully loaded and optimized,
        reducing latency for the first real inference.

        Args:
            model_name: Name of the model
            version: Optional model version
            num_samples: Number of warmup samples

        Returns:
            Warmup results
        """
        start_time = time.time()

        # Load model
        model_key = f"{model_name}:{version or 'latest'}"
        if model_key not in self.model_cache:
            self._load_model(model_name, version)

        # Run dummy inferences
        warmup_times = []
        for _ in range(num_samples):
            sample_start = time.time()
            self._run_inference(model_name, self._generate_dummy_input(model_name))
            warmup_times.append((time.time() - sample_start) * 1000)

        # Mark as warmed up
        cache = self.model_cache[model_key]
        cache.warmup_completed = True

        total_time_ms = (time.time() - start_time) * 1000

        return {
            "model": model_name,
            "version": version or "latest",
            "warmup_samples": num_samples,
            "total_time_ms": round(total_time_ms, 2),
            "avg_inference_ms": round(sum(warmup_times) / len(warmup_times), 2),
            "min_inference_ms": round(min(warmup_times), 2),
            "max_inference_ms": round(max(warmup_times), 2),
            "status": "completed"
        }

    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get model cache statistics.

        Returns:
            Cache statistics
        """
        return {
            "total_models_cached": len(self.model_cache),
            "total_inferences": self.inference_count,
            "total_batches": self.batch_count,
            "cached_models": [
                {
                    "model": cache.model_name,
                    "version": cache.version,
                    "framework": cache.framework,
                    "num_inferences": cache.num_inferences,
                    "avg_latency_ms": round(cache.avg_latency_ms, 2),
                    "last_used": cache.last_used,
                    "warmup_completed": cache.warmup_completed
                }
                for cache in self.model_cache.values()
            ]
        }

    def clear_cache(self, model_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Clear model cache.

        Args:
            model_name: Optional specific model to clear

        Returns:
            Clear operation result
        """
        if model_name:
            # Clear specific model
            keys_to_remove = [k for k in self.model_cache if k.startswith(model_name)]
            for key in keys_to_remove:
                del self.model_cache[key]
            return {
                "success": True,
                "cleared": len(keys_to_remove),
                "message": f"Cleared cache for {model_name}"
            }
        else:
            # Clear all
            count = len(self.model_cache)
            self.model_cache.clear()
            return {
                "success": True,
                "cleared": count,
                "message": "Cleared all model cache"
            }

    def optimize_model(
        self,
        model_name: str,
        version: Optional[str] = None,
        optimization: str = "quantization"
    ) -> Dict[str, Any]:
        """
        Optimize model for faster inference.

        Optimizations:
        - quantization: Reduce precision (INT8, FP16)
        - pruning: Remove unnecessary weights
        - distillation: Create smaller model
        - onnx: Convert to ONNX format
        - tensorrt: Optimize for NVIDIA GPUs

        Args:
            model_name: Name of the model
            version: Optional model version
            optimization: Optimization technique

        Returns:
            Optimization result
        """
        model_key = f"{model_name}:{version or 'latest'}"

        # In real implementation, this would apply actual optimizations
        speedup_map = {
            "quantization": 2.5,
            "pruning": 1.8,
            "distillation": 3.0,
            "onnx": 1.5,
            "tensorrt": 4.0
        }

        speedup = speedup_map.get(optimization, 1.5)

        return {
            "model": model_name,
            "version": version or "latest",
            "optimization": optimization,
            "original_size_mb": 500,
            "optimized_size_mb": 500 / speedup,
            "expected_speedup": f"{speedup}x",
            "status": "completed",
            "message": f"Model optimized with {optimization}"
        }

    def _load_model(self, model_name: str, version: Optional[str]) -> None:
        """Load model into cache"""
        model_key = f"{model_name}:{version or 'latest'}"

        # Simulate model loading
        framework = self._detect_framework(model_name)

        cache = ModelCache(
            model_name=model_name,
            version=version or "latest",
            framework=framework,
            loaded_at=datetime.utcnow().isoformat(),
            last_used=datetime.utcnow().isoformat(),
            num_inferences=0,
            avg_latency_ms=0.0,
            cached_in_memory=True,
            warmup_completed=False
        )

        self.model_cache[model_key] = cache

    def _run_inference(
        self,
        model_name: str,
        input_data: Any
    ) -> tuple[Any, float, Optional[Dict[str, float]]]:
        """
        Run actual inference (simulated for demo).

        In a real implementation, this would:
        1. Preprocess input
        2. Run model forward pass
        3. Post-process output
        4. Return prediction with confidence
        """
        # Simulate inference latency (1-5ms typical for cached models)
        time.sleep(random.uniform(0.001, 0.005))

        # Determine model type and generate appropriate output
        if "sentiment" in model_name.lower() or "text" in model_name.lower():
            # Text classification
            classes = ["positive", "negative", "neutral"]
            probs = [random.random() for _ in classes]
            total = sum(probs)
            probs = [p / total for p in probs]
            prediction = classes[probs.index(max(probs))]
            confidence = max(probs)
            probabilities = {cls: round(prob, 4) for cls, prob in zip(classes, probs)}
        elif "vision" in model_name.lower() or "image" in model_name.lower():
            # Image classification
            classes = ["cat", "dog", "bird", "car", "person"]
            probs = [random.random() for _ in classes]
            total = sum(probs)
            probs = [p / total for p in probs]
            prediction = classes[probs.index(max(probs))]
            confidence = max(probs)
            probabilities = {cls: round(prob, 4) for cls, prob in zip(classes, probs)}
        else:
            # Generic classification
            prediction = random.choice(["class_a", "class_b", "class_c"])
            confidence = random.uniform(0.7, 0.99)
            probabilities = {
                "class_a": round(random.random(), 4),
                "class_b": round(random.random(), 4),
                "class_c": round(random.random(), 4)
            }

        return prediction, confidence, probabilities

    def _detect_framework(self, model_name: str) -> str:
        """Detect ML framework from model name"""
        if "torch" in model_name.lower() or "bert" in model_name.lower():
            return "pytorch"
        elif "tf" in model_name.lower() or "keras" in model_name.lower():
            return "tensorflow"
        else:
            return "sklearn"

    def _generate_dummy_input(self, model_name: str) -> Any:
        """Generate dummy input for warmup"""
        if "text" in model_name.lower() or "sentiment" in model_name.lower():
            return "This is a sample text for warmup"
        elif "image" in model_name.lower() or "vision" in model_name.lower():
            return np.random.randn(224, 224, 3).tolist()  # Dummy image
        else:
            return [random.random() for _ in range(10)]  # Generic features


# Global inference engine instance
inferenceEngine = InferenceEngine()


# =============================================================================
# Example Usage (for testing)
# =============================================================================

if __name__ == "__main__":
    # Single inference
    result = inferenceEngine.predict(
        model_name="sentiment-classifier",
        input_data="This product is amazing!"
    )
    print("Inference result:", result)

    # Batch inference
    inputs = [
        "Great product!",
        "Terrible experience",
        "It's okay",
        "Highly recommended",
        "Not worth it"
    ]
    batch_result = inferenceEngine.batch_predict(
        model_name="sentiment-classifier",
        inputs=inputs,
        batch_size=2
    )
    print("\nBatch inference:", batch_result)

    # Warmup
    warmup = inferenceEngine.warmup_model(
        model_name="sentiment-classifier",
        num_samples=5
    )
    print("\nWarmup result:", warmup)

    # Cache stats
    stats = inferenceEngine.get_cache_stats()
    print("\nCache stats:", stats)
