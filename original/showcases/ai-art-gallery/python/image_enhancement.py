"""
Image Enhancement Module

AI-powered image enhancement including super-resolution, colorization, denoising,
and HDR enhancement. Integrates multiple models for comprehensive enhancement.

Called directly from TypeScript via Elide's polyglot runtime!

Features:
- Super-resolution (ESRGAN, Real-ESRGAN)
- Image colorization (DeOldify-style)
- Denoising
- Sharpening
- HDR enhancement
- Face restoration
- Artifact removal
- Batch processing

Author: AI Art Gallery Team
License: MIT
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, List, Optional, Tuple, Union
from PIL import Image
import io
import cv2
import time


class ResidualBlock(nn.Module):
    """Residual block for ESRGAN"""

    def __init__(self, channels: int):
        super().__init__()

        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1)
        self.bn1 = nn.BatchNorm2d(channels)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x

        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)

        out = self.conv2(out)
        out = self.bn2(out)

        out += residual

        return out


class UpscaleBlock(nn.Module):
    """Upscaling block"""

    def __init__(self, in_channels: int, scale_factor: int = 2):
        super().__init__()

        self.conv = nn.Conv2d(in_channels, in_channels * (scale_factor ** 2), 3, padding=1)
        self.pixel_shuffle = nn.PixelShuffle(scale_factor)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.conv(x)
        x = self.pixel_shuffle(x)
        x = self.relu(x)
        return x


class SimpleESRGAN(nn.Module):
    """Simplified ESRGAN model"""

    def __init__(self, scale_factor: int = 4, num_blocks: int = 16):
        super().__init__()

        self.scale_factor = scale_factor

        # Initial feature extraction
        self.conv_first = nn.Conv2d(3, 64, 3, padding=1)

        # Residual blocks
        self.residual_blocks = nn.Sequential(
            *[ResidualBlock(64) for _ in range(num_blocks)]
        )

        # Upsampling
        num_upsamples = int(np.log2(scale_factor))
        upscale_blocks = []
        for _ in range(num_upsamples):
            upscale_blocks.append(UpscaleBlock(64, 2))

        self.upscale = nn.Sequential(*upscale_blocks)

        # Final output
        self.conv_last = nn.Conv2d(64, 3, 3, padding=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feat = self.conv_first(x)
        residual = feat

        feat = self.residual_blocks(feat)
        feat = feat + residual

        feat = self.upscale(feat)
        out = self.conv_last(feat)

        return out


class ColorizationModel(nn.Module):
    """Simplified colorization model"""

    def __init__(self):
        super().__init__()

        # Encoder
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 64, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 128, 3, stride=2, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 256, 3, stride=2, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 512, 3, stride=2, padding=1),
            nn.ReLU(inplace=True)
        )

        # Decoder
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(512, 256, 4, stride=2, padding=1),
            nn.ReLU(inplace=True),
            nn.ConvTranspose2d(256, 128, 4, stride=2, padding=1),
            nn.ReLU(inplace=True),
            nn.ConvTranspose2d(128, 64, 4, stride=2, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 2, 3, padding=1),  # Output ab channels
            nn.Tanh()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feat = self.encoder(x)
        ab = self.decoder(feat)
        return ab


class ImageEnhancement:
    """
    Comprehensive image enhancement system
    """

    def __init__(self, config: Dict):
        """
        Initialize enhancement models

        Args:
            config: Configuration dict with:
                - device: Device to use (default: 'cuda:0')
                - models: List of models to load
        """
        self.device = config.get('device', 'cuda:0' if torch.cuda.is_available() else 'cpu')
        self.models_to_load = config.get('models', ['esrgan', 'deoldify'])

        self.esrgan = None
        self.colorization = None

        print(f"Initializing Image Enhancement")
        print(f"Device: {self.device}")

    def load(self):
        """Load enhancement models"""
        if 'esrgan' in self.models_to_load:
            print("Loading ESRGAN...")
            self.esrgan = SimpleESRGAN(scale_factor=4)
            self.esrgan = self.esrgan.to(self.device)
            self.esrgan.eval()
            print("✓ ESRGAN loaded")

        if 'deoldify' in self.models_to_load:
            print("Loading Colorization model...")
            self.colorization = ColorizationModel()
            self.colorization = self.colorization.to(self.device)
            self.colorization.eval()
            print("✓ Colorization model loaded")

        print("✓ Enhancement models loaded")

    def upscale(
        self,
        image: Union[bytes, Image.Image, np.ndarray],
        config: Dict
    ) -> bytes:
        """
        Upscale image using AI super-resolution

        Args:
            image: Input image
            config: Upscale configuration
                - method: 'esrgan', 'real-esrgan', 'lanczos'
                - factor: Upscale factor (2, 4)
                - preset: 'fast', 'balanced', 'quality'

        Returns:
            Upscaled image as bytes
        """
        method = config.get('method', 'esrgan')
        factor = config.get('factor', 4)

        pil_image = self._prepare_image(image)

        if method == 'esrgan' and self.esrgan:
            result = self._upscale_esrgan(pil_image, factor)
        elif method == 'lanczos':
            result = self._upscale_lanczos(pil_image, factor)
        else:
            result = self._upscale_esrgan(pil_image, factor)

        return self._image_to_bytes(result)

    def colorize(self, image: Union[bytes, Image.Image, np.ndarray]) -> bytes:
        """
        Colorize grayscale image

        Args:
            image: Grayscale input image

        Returns:
            Colorized image as bytes
        """
        if not self.colorization:
            raise ValueError("Colorization model not loaded")

        print("Colorizing image...")
        start_time = time.time()

        pil_image = self._prepare_image(image)

        # Convert to grayscale if needed
        if pil_image.mode != 'L':
            gray = pil_image.convert('L')
        else:
            gray = pil_image

        # Prepare tensor
        gray_array = np.array(gray).astype(np.float32) / 255.0
        gray_tensor = torch.from_numpy(gray_array).unsqueeze(0).unsqueeze(0).to(self.device)

        # Colorize
        with torch.no_grad():
            ab_channels = self.colorization(gray_tensor)

        # Combine L and ab channels
        l_channel = gray_tensor.squeeze(0)
        ab = ab_channels.squeeze(0)

        # Convert to RGB
        lab = torch.cat([l_channel, ab], dim=0)
        rgb = self._lab_to_rgb(lab)

        elapsed = time.time() - start_time
        print(f"✓ Colorization completed in {elapsed:.2f}s")

        return self._tensor_to_bytes(rgb)

    def denoise(
        self,
        image: Union[bytes, Image.Image, np.ndarray],
        strength: float = 0.5
    ) -> bytes:
        """
        Remove noise from image

        Args:
            image: Noisy input image
            strength: Denoising strength (0-1)

        Returns:
            Denoised image
        """
        pil_image = self._prepare_image(image)
        array = np.array(pil_image)

        # Use OpenCV denoising
        h = int(strength * 20) + 1
        denoised = cv2.fastNlMeansDenoisingColored(array, None, h, h, 7, 21)

        result = Image.fromarray(denoised)
        return self._image_to_bytes(result)

    def sharpen(
        self,
        image: Union[bytes, Image.Image, np.ndarray],
        amount: float = 0.5
    ) -> bytes:
        """
        Sharpen image

        Args:
            image: Input image
            amount: Sharpening amount (0-1)

        Returns:
            Sharpened image
        """
        pil_image = self._prepare_image(image)
        array = np.array(pil_image).astype(np.float32)

        # Unsharp mask
        blurred = cv2.GaussianBlur(array, (0, 0), 3)
        sharpened = array + amount * (array - blurred)
        sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)

        result = Image.fromarray(sharpened)
        return self._image_to_bytes(result)

    def enhance_hdr(
        self,
        image: Union[bytes, Image.Image, np.ndarray]
    ) -> bytes:
        """
        Apply HDR enhancement

        Args:
            image: Input image

        Returns:
            HDR enhanced image
        """
        pil_image = self._prepare_image(image)
        array = np.array(pil_image).astype(np.float32) / 255.0

        # Apply tone mapping
        hdr = cv2.createTonemap(gamma=2.2)
        enhanced = hdr.process(array)

        # Enhance local contrast
        lab = cv2.cvtColor((enhanced * 255).astype(np.uint8), cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)

        # CLAHE on L channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l)

        # Merge back
        enhanced_lab = cv2.merge([l_enhanced, a, b])
        enhanced_rgb = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)

        result = Image.fromarray(enhanced_rgb)
        return self._image_to_bytes(result)

    def restore_face(
        self,
        image: Union[bytes, Image.Image, np.ndarray]
    ) -> bytes:
        """
        Restore/enhance faces in image

        Args:
            image: Input image with faces

        Returns:
            Face-restored image
        """
        # In production, would use face restoration models like GFPGAN
        # For now, apply general enhancement
        enhanced = self.denoise(image, 0.3)
        sharpened = self.sharpen(enhanced, 0.5)

        return sharpened

    def remove_artifacts(
        self,
        image: Union[bytes, Image.Image, np.ndarray]
    ) -> bytes:
        """
        Remove compression artifacts

        Args:
            image: Image with artifacts

        Returns:
            Cleaned image
        """
        pil_image = self._prepare_image(image)
        array = np.array(pil_image)

        # Bilateral filter to remove artifacts while preserving edges
        cleaned = cv2.bilateralFilter(array, 9, 75, 75)

        result = Image.fromarray(cleaned)
        return self._image_to_bytes(result)

    def enhance_batch(
        self,
        images: List[Union[bytes, Image.Image]],
        operations: List[str]
    ) -> List[bytes]:
        """
        Batch enhance multiple images

        Args:
            images: List of input images
            operations: List of operations to apply

        Returns:
            List of enhanced images
        """
        results = []

        for i, image in enumerate(images):
            print(f"Enhancing image {i+1}/{len(images)}...")

            enhanced = image
            for operation in operations:
                if operation == 'denoise':
                    enhanced = self.denoise(enhanced)
                elif operation == 'sharpen':
                    enhanced = self.sharpen(enhanced)
                elif operation == 'hdr':
                    enhanced = self.enhance_hdr(enhanced)
                elif operation == 'colorize':
                    enhanced = self.colorize(enhanced)

            results.append(enhanced)

        return results

    def crop(
        self,
        image: Union[bytes, Image.Image],
        box: Dict[str, int]
    ) -> bytes:
        """Crop image to box"""
        pil_image = self._prepare_image(image)
        cropped = pil_image.crop((box['x'], box['y'], box['x'] + box['width'], box['y'] + box['height']))
        return self._image_to_bytes(cropped)

    def merge_tiles(
        self,
        tiles: List[Dict],
        width: int,
        height: int,
        overlap: int
    ) -> bytes:
        """Merge image tiles with overlap blending"""
        result = Image.new('RGB', (width, height))

        for tile_info in tiles:
            tile_img = Image.open(io.BytesIO(tile_info['data']))
            x, y = tile_info['x'], tile_info['y']

            # Simple paste (in production, would blend overlaps)
            result.paste(tile_img, (x, y))

        return self._image_to_bytes(result)

    def convert_format(self, image: Union[bytes, Image.Image], config: Dict) -> bytes:
        """Convert image format"""
        pil_image = self._prepare_image(image)
        format_type = config.get('format', 'PNG').upper()
        quality = config.get('quality', 95)

        buffer = io.BytesIO()
        if format_type == 'JPEG':
            pil_image.save(buffer, format='JPEG', quality=quality)
        elif format_type == 'WEBP':
            pil_image.save(buffer, format='WEBP', quality=quality)
        else:
            pil_image.save(buffer, format='PNG')

        return buffer.getvalue()

    def get_dimensions(self, image: Union[bytes, Image.Image]) -> Dict[str, int]:
        """Get image dimensions"""
        pil_image = self._prepare_image(image)
        return {'width': pil_image.width, 'height': pil_image.height}

    def resize(
        self,
        image: Union[bytes, Image.Image],
        width: int,
        height: int,
        method: str = 'lanczos'
    ) -> bytes:
        """Resize image"""
        pil_image = self._prepare_image(image)

        resample_methods = {
            'nearest': Image.NEAREST,
            'bilinear': Image.BILINEAR,
            'bicubic': Image.BICUBIC,
            'lanczos': Image.LANCZOS
        }

        resample = resample_methods.get(method, Image.LANCZOS)
        resized = pil_image.resize((width, height), resample)

        return self._image_to_bytes(resized)

    def create_comparison_grid(self, config: Dict) -> bytes:
        """Create comparison grid of original and enhanced versions"""
        original = self._prepare_image(config['original'])
        results = [self._prepare_image(r['image']) for r in config['results']]

        # Create grid
        count = len(results) + 1
        cols = min(3, count)
        rows = (count + cols - 1) // cols

        img_width, img_height = original.size
        grid = Image.new('RGB', (cols * img_width, rows * img_height))

        # Paste images
        grid.paste(original, (0, 0))

        for i, img in enumerate(results):
            row = (i + 1) // cols
            col = (i + 1) % cols
            grid.paste(img, (col * img_width, row * img_height))

        return self._image_to_bytes(grid)

    def _upscale_esrgan(self, image: Image.Image, factor: int) -> Image.Image:
        """Upscale using ESRGAN"""
        if not self.esrgan:
            raise ValueError("ESRGAN model not loaded")

        print(f"Upscaling {factor}x with ESRGAN...")
        start_time = time.time()

        # Prepare tensor
        array = np.array(image).astype(np.float32) / 255.0
        tensor = torch.from_numpy(array).permute(2, 0, 1).unsqueeze(0).to(self.device)

        # Upscale
        with torch.no_grad():
            if factor == 4:
                upscaled = self.esrgan(tensor)
            elif factor == 2:
                # Use 4x model and downscale
                upscaled = self.esrgan(tensor)
                upscaled = F.interpolate(upscaled, scale_factor=0.5, mode='bicubic')
            else:
                # Fallback to interpolation
                upscaled = F.interpolate(tensor, scale_factor=factor, mode='bicubic')

        elapsed = time.time() - start_time
        print(f"✓ Upscaling completed in {elapsed:.2f}s")

        return self._tensor_to_image(upscaled.squeeze(0))

    def _upscale_lanczos(self, image: Image.Image, factor: int) -> Image.Image:
        """Upscale using Lanczos interpolation"""
        new_size = (image.width * factor, image.height * factor)
        return image.resize(new_size, Image.LANCZOS)

    def _prepare_image(self, image: Union[bytes, np.ndarray, Image.Image]) -> Image.Image:
        """Prepare image for processing"""
        if isinstance(image, bytes):
            return Image.open(io.BytesIO(image)).convert('RGB')
        elif isinstance(image, np.ndarray):
            return Image.fromarray(image).convert('RGB')
        else:
            return image.convert('RGB')

    def _tensor_to_image(self, tensor: torch.Tensor) -> Image.Image:
        """Convert tensor to PIL Image"""
        array = tensor.cpu().detach().numpy()
        array = np.transpose(array, (1, 2, 0))
        array = np.clip(array * 255, 0, 255).astype(np.uint8)
        return Image.fromarray(array)

    def _tensor_to_bytes(self, tensor: torch.Tensor) -> bytes:
        """Convert tensor to bytes"""
        image = self._tensor_to_image(tensor)
        return self._image_to_bytes(image)

    def _image_to_bytes(self, image: Image.Image, format: str = 'PNG') -> bytes:
        """Convert PIL Image to bytes"""
        buffer = io.BytesIO()
        image.save(buffer, format=format)
        return buffer.getvalue()

    def _lab_to_rgb(self, lab: torch.Tensor) -> torch.Tensor:
        """Convert LAB to RGB tensor (simplified)"""
        # Simplified conversion - in production would use proper color space conversion
        return lab  # Placeholder

    def get_model_info(self) -> Dict:
        """Get model information"""
        return {
            'device': self.device,
            'models': {
                'esrgan': self.esrgan is not None,
                'colorization': self.colorization is not None
            }
        }

    def cleanup(self):
        """Clean up resources"""
        print("Cleaning up Enhancement resources...")

        del self.esrgan
        del self.colorization

        if self.device.startswith('cuda'):
            torch.cuda.empty_cache()

        print("✓ Cleanup complete")


# Export for Elide polyglot runtime
__all__ = ['ImageEnhancement', 'SimpleESRGAN', 'ColorizationModel']
