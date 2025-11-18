"""
Text embeddings using sentence-transformers
Optimized for high-throughput batch processing
"""

import sys
import json
import time
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import numpy as np
import torch


class TextEmbeddingService:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """Initialize text embedding model"""
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer(model_name, device=self.device)

        # Enable optimizations
        if self.device == "cuda":
            self.model.half()  # Use FP16 for faster inference

        print(f"Text embedding model loaded: {model_name} on {self.device}", file=sys.stderr)

    def encode_single(self, text: str, normalize: bool = True) -> List[float]:
        """Encode a single text into embedding"""
        start_time = time.perf_counter()

        embedding = self.model.encode(
            text,
            normalize_embeddings=normalize,
            convert_to_numpy=True,
            show_progress_bar=False
        )

        elapsed = (time.perf_counter() - start_time) * 1000

        return {
            "embedding": embedding.tolist(),
            "dimensions": len(embedding),
            "processing_time": elapsed
        }

    def encode_batch(
        self,
        texts: List[str],
        batch_size: int = 32,
        normalize: bool = True
    ) -> Dict[str, Any]:
        """Encode multiple texts with batch processing"""
        start_time = time.perf_counter()

        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=normalize,
            convert_to_numpy=True,
            show_progress_bar=False
        )

        total_time = (time.perf_counter() - start_time) * 1000

        return {
            "embeddings": embeddings.tolist(),
            "dimensions": embeddings.shape[1],
            "count": len(embeddings),
            "total_time": total_time,
            "avg_time": total_time / len(texts)
        }

    def similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts"""
        embeddings = self.model.encode(
            [text1, text2],
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False
        )

        # Cosine similarity (already normalized)
        similarity = np.dot(embeddings[0], embeddings[1])
        return float(similarity)

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            "model_name": self.model_name,
            "device": self.device,
            "max_seq_length": self.model.max_seq_length,
            "embedding_dimension": self.model.get_sentence_embedding_dimension()
        }


def main():
    """CLI interface for text embeddings"""
    if len(sys.argv) < 2:
        print("Usage: python text_embeddings.py <command> [args...]", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "sentence-transformers/all-MiniLM-L6-v2"

    service = TextEmbeddingService(model_name)

    if command == "encode":
        # Read texts from stdin (one per line or JSON array)
        input_data = sys.stdin.read()
        try:
            texts = json.loads(input_data)
        except json.JSONDecodeError:
            texts = [line.strip() for line in input_data.split('\n') if line.strip()]

        if len(texts) == 1:
            result = service.encode_single(texts[0])
        else:
            result = service.encode_batch(texts)

        print(json.dumps(result))

    elif command == "info":
        info = service.get_model_info()
        print(json.dumps(info))

    elif command == "similarity":
        if len(sys.argv) < 5:
            print("Usage: python text_embeddings.py similarity <model> <text1> <text2>", file=sys.stderr)
            sys.exit(1)

        text1 = sys.argv[3]
        text2 = sys.argv[4]
        similarity = service.similarity(text1, text2)
        print(json.dumps({"similarity": similarity}))

    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
