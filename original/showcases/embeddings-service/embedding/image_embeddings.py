"""
Image embeddings using CLIP
Supports both image and text encoding for multimodal search
"""

import sys
import json
import time
import base64
from io import BytesIO
from typing import List, Dict, Any, Union
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import numpy as np


class ImageEmbeddingService:
    def __init__(self, model_name: str = "openai/clip-vit-base-patch32"):
        """Initialize CLIP model for image and text embeddings"""
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.model = CLIPModel.from_pretrained(model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(model_name)

        # Enable optimizations
        if self.device == "cuda":
            self.model.half()  # Use FP16 for faster inference

        self.model.eval()

        print(f"CLIP model loaded: {model_name} on {self.device}", file=sys.stderr)

    def _load_image(self, image_data: str) -> Image.Image:
        """Load image from base64 string or file path"""
        if image_data.startswith('data:image'):
            # Base64 encoded image
            base64_data = image_data.split(',')[1]
            image_bytes = base64.b64decode(base64_data)
            return Image.open(BytesIO(image_bytes)).convert('RGB')
        elif image_data.startswith('http'):
            # URL (not implemented for security)
            raise ValueError("URL loading not supported in this version")
        else:
            # File path
            return Image.open(image_data).convert('RGB')

    def encode_image(self, image_data: str, normalize: bool = True) -> Dict[str, Any]:
        """Encode single image into embedding"""
        start_time = time.perf_counter()

        image = self._load_image(image_data)
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)

        with torch.no_grad():
            image_features = self.model.get_image_features(**inputs)

            if normalize:
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)

        embedding = image_features.cpu().numpy()[0]
        elapsed = (time.perf_counter() - start_time) * 1000

        return {
            "embedding": embedding.tolist(),
            "dimensions": len(embedding),
            "processing_time": elapsed
        }

    def encode_images_batch(
        self,
        image_data_list: List[str],
        normalize: bool = True
    ) -> Dict[str, Any]:
        """Encode multiple images with batch processing"""
        start_time = time.perf_counter()

        images = [self._load_image(img_data) for img_data in image_data_list]
        inputs = self.processor(images=images, return_tensors="pt", padding=True).to(self.device)

        with torch.no_grad():
            image_features = self.model.get_image_features(**inputs)

            if normalize:
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)

        embeddings = image_features.cpu().numpy()
        total_time = (time.perf_counter() - start_time) * 1000

        return {
            "embeddings": embeddings.tolist(),
            "dimensions": embeddings.shape[1],
            "count": len(embeddings),
            "total_time": total_time,
            "avg_time": total_time / len(embeddings)
        }

    def encode_text(self, text: str, normalize: bool = True) -> Dict[str, Any]:
        """Encode text into CLIP embedding (for image-text similarity)"""
        start_time = time.perf_counter()

        inputs = self.processor(text=[text], return_tensors="pt", padding=True).to(self.device)

        with torch.no_grad():
            text_features = self.model.get_text_features(**inputs)

            if normalize:
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)

        embedding = text_features.cpu().numpy()[0]
        elapsed = (time.perf_counter() - start_time) * 1000

        return {
            "embedding": embedding.tolist(),
            "dimensions": len(embedding),
            "processing_time": elapsed
        }

    def encode_text_batch(
        self,
        texts: List[str],
        normalize: bool = True
    ) -> Dict[str, Any]:
        """Encode multiple texts with batch processing"""
        start_time = time.perf_counter()

        inputs = self.processor(text=texts, return_tensors="pt", padding=True).to(self.device)

        with torch.no_grad():
            text_features = self.model.get_text_features(**inputs)

            if normalize:
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)

        embeddings = text_features.cpu().numpy()
        total_time = (time.perf_counter() - start_time) * 1000

        return {
            "embeddings": embeddings.tolist(),
            "dimensions": embeddings.shape[1],
            "count": len(embeddings),
            "total_time": total_time,
            "avg_time": total_time / len(embeddings)
        }

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            "model_name": self.model_name,
            "device": self.device,
            "embedding_dimension": self.model.config.projection_dim
        }


def main():
    """CLI interface for image embeddings"""
    if len(sys.argv) < 2:
        print("Usage: python image_embeddings.py <command> [args...]", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "openai/clip-vit-base-patch32"

    service = ImageEmbeddingService(model_name)

    if command == "encode_image":
        # Read image paths from stdin
        input_data = sys.stdin.read()
        try:
            images = json.loads(input_data)
        except json.JSONDecodeError:
            images = [line.strip() for line in input_data.split('\n') if line.strip()]

        if len(images) == 1:
            result = service.encode_image(images[0])
        else:
            result = service.encode_images_batch(images)

        print(json.dumps(result))

    elif command == "encode_text":
        # Read texts from stdin
        input_data = sys.stdin.read()
        try:
            texts = json.loads(input_data)
        except json.JSONDecodeError:
            texts = [line.strip() for line in input_data.split('\n') if line.strip()]

        if len(texts) == 1:
            result = service.encode_text(texts[0])
        else:
            result = service.encode_text_batch(texts)

        print(json.dumps(result))

    elif command == "info":
        info = service.get_model_info()
        print(json.dumps(info))

    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
