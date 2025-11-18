"""
Image Classification Model

Image classification using PyTorch with pre-trained models.
This demonstrates real ML inference with computer vision.

Features:
- PyTorch-based image classification
- Pre-trained ResNet models
- Support for URL and base64 images
- Top-K predictions
- Confidence scores

Usage from TypeScript:
    const result = await bridge.callPython('image_classifier', 'classify', {
        image_url: 'https://example.com/cat.jpg',
        top_k: 5
    });
"""

try:
    import torch
    import torchvision.models as models
    import torchvision.transforms as transforms
    from PIL import Image
    import requests
    from io import BytesIO
    import base64
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("Warning: PyTorch not available. Using mock classifier.")

import json

# ImageNet class labels (top 100 for demo purposes)
IMAGENET_CLASSES = {
    0: "tench", 1: "goldfish", 2: "great white shark", 3: "tiger shark",
    4: "hammerhead", 5: "electric ray", 6: "stingray", 7: "cock",
    8: "hen", 9: "ostrich", 10: "brambling", 11: "goldfinch",
    12: "house finch", 13: "junco", 14: "indigo bunting", 15: "robin",
    16: "bulbul", 17: "jay", 18: "magpie", 19: "chickadee",
    20: "water ouzel", 21: "kite", 22: "bald eagle", 23: "vulture",
    24: "great grey owl", 25: "fire salamander", 26: "smooth newt",
    27: "newt", 28: "spotted salamander", 29: "axolotl",
    281: "tabby cat", 282: "tiger cat", 283: "Persian cat", 284: "Siamese cat",
    285: "Egyptian cat", 286: "mountain lion", 287: "lynx", 288: "leopard",
    289: "snow leopard", 290: "jaguar", 291: "lion", 292: "tiger",
    293: "cheetah", 294: "brown bear", 295: "American black bear",
    151: "Chihuahua", 152: "Japanese spaniel", 153: "Maltese dog",
    154: "Pekinese", 155: "Shih-Tzu", 156: "Blenheim spaniel",
    157: "papillon", 158: "toy terrier", 159: "Rhodesian ridgeback",
    207: "golden retriever", 208: "Labrador retriever", 209: "cocker spaniel",
    210: "springer spaniel", 211: "Welsh springer spaniel",
}


class ImageClassifier:
    """
    Image classification model using PyTorch
    """

    def __init__(self):
        """Initialize the model"""
        self.model = None
        self.transform = None
        self.device = None
        self._initialize_model()

    def _initialize_model(self):
        """
        Initialize PyTorch model
        """
        if not TORCH_AVAILABLE:
            # Mock model for when PyTorch is not available
            self.model = None
            return

        try:
            # Set device
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

            # Load pre-trained ResNet model
            self.model = models.resnet50(pretrained=True)
            self.model.eval()
            self.model.to(self.device)

            # Define image transformations
            self.transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])

            print(f"Image classifier initialized on {self.device}")

        except Exception as e:
            print(f"Failed to initialize PyTorch model: {e}")
            self.model = None

    def _get_label(self, class_id):
        """
        Get human-readable label for class ID
        """
        return IMAGENET_CLASSES.get(class_id, f"class_{class_id}")

    def _load_image_from_url(self, url):
        """
        Load image from URL
        """
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content))
        return image.convert('RGB')

    def _load_image_from_base64(self, data):
        """
        Load image from base64 string
        """
        # Remove header if present (e.g., "data:image/png;base64,")
        if ',' in data:
            data = data.split(',')[1]

        image_bytes = base64.b64decode(data)
        image = Image.open(BytesIO(image_bytes))
        return image.convert('RGB')

    def _mock_classify(self, top_k):
        """
        Mock classification when PyTorch is not available
        Returns realistic-looking random results for demo purposes
        """
        import random

        mock_classes = [
            ("tabby cat", 0.89),
            ("tiger cat", 0.06),
            ("Egyptian cat", 0.03),
            ("lynx", 0.01),
            ("Persian cat", 0.005),
        ]

        results = []
        for i, (label, conf) in enumerate(mock_classes[:top_k]):
            results.append({
                'label': label,
                'confidence': conf,
                'class_id': 281 + i
            })

        return results

    def classify(self, params):
        """
        Classify an image

        Args:
            params: dict with keys:
                - image_url (str, optional): URL to image
                - image_data (str, optional): Base64 encoded image
                - top_k (int, optional): Number of top predictions (default: 5)

        Returns:
            dict with predictions
        """
        image_url = params.get('image_url')
        image_data = params.get('image_data')
        top_k = params.get('top_k', 5)

        if not image_url and not image_data:
            raise ValueError('Must provide either image_url or image_data')

        # Use mock classifier if PyTorch not available
        if not TORCH_AVAILABLE or self.model is None:
            return {
                'predictions': self._mock_classify(top_k),
                'note': 'Using mock classifier (PyTorch not available)'
            }

        try:
            # Load image
            if image_url:
                image = self._load_image_from_url(image_url)
            else:
                image = self._load_image_from_base64(image_data)

            # Preprocess
            input_tensor = self.transform(image).unsqueeze(0)
            input_tensor = input_tensor.to(self.device)

            # Inference
            with torch.no_grad():
                output = self.model(input_tensor)
                probabilities = torch.nn.functional.softmax(output[0], dim=0)

            # Get top k predictions
            top_probs, top_idxs = torch.topk(probabilities, top_k)

            predictions = []
            for prob, idx in zip(top_probs, top_idxs):
                class_id = int(idx)
                predictions.append({
                    'class_id': class_id,
                    'label': self._get_label(class_id),
                    'confidence': float(prob)
                })

            return {
                'predictions': predictions
            }

        except Exception as e:
            raise RuntimeError(f"Image classification failed: {str(e)}")

    def classify_batch(self, params):
        """
        Classify multiple images

        Args:
            params: dict with keys:
                - images (list): List of dicts with image_url or image_data
                - top_k (int, optional): Number of top predictions (default: 5)

        Returns:
            list of classification results
        """
        images = params.get('images', [])
        top_k = params.get('top_k', 5)

        if not images:
            raise ValueError('Images list cannot be empty')

        results = []
        for img_params in images:
            img_params['top_k'] = top_k
            result = self.classify(img_params)
            results.append(result)

        return results

    def warmup(self, params=None):
        """
        Warm up the model by running dummy predictions
        """
        if not TORCH_AVAILABLE or self.model is None:
            return {'status': 'warmup skipped (mock mode)'}

        # Create a dummy image
        dummy_image = Image.new('RGB', (224, 224), color='red')

        # Run a few dummy predictions
        for _ in range(3):
            input_tensor = self.transform(dummy_image).unsqueeze(0)
            input_tensor = input_tensor.to(self.device)

            with torch.no_grad():
                self.model(input_tensor)

        return {'status': 'warmup completed'}

    def get_info(self):
        """
        Get model information
        """
        return {
            'name': 'image-classifier',
            'version': '1.0.0',
            'type': 'image-classification',
            'model': 'ResNet-50' if TORCH_AVAILABLE else 'Mock Classifier',
            'device': str(self.device) if self.device else 'N/A',
            'available': TORCH_AVAILABLE and self.model is not None,
            'input_size': '224x224',
            'classes': len(IMAGENET_CLASSES)
        }


# Create a global instance
_model = ImageClassifier()


# Export functions for polyglot access
def classify(params):
    """Classify image (polyglot entry point)"""
    return _model.classify(params)


def classify_batch(params):
    """Classify images in batch (polyglot entry point)"""
    return _model.classify_batch(params)


def warmup(params=None):
    """Warm up model (polyglot entry point)"""
    return _model.warmup(params)


def get_info():
    """Get model info (polyglot entry point)"""
    return _model.get_info()


# For direct Python execution (testing)
if __name__ == '__main__':
    print("Testing Image Classifier...")

    # Get info
    info = get_info()
    print(f"\nModel info: {json.dumps(info, indent=2)}")

    # Test classification (with mock data if PyTorch not available)
    if TORCH_AVAILABLE:
        print("\nPyTorch is available. Testing with real model...")
        # In a real test, you would use an actual image URL
        print("Note: Skipping real image test in demo")
    else:
        print("\nPyTorch not available. Testing with mock classifier...")
        result = classify({
            'image_url': 'https://example.com/cat.jpg',
            'top_k': 5
        })
        print(f"Mock classification result: {json.dumps(result, indent=2)}")

    # Test warmup
    warmup_result = warmup()
    print(f"\nWarmup: {warmup_result}")
