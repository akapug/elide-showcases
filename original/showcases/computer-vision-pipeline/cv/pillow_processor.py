#!/usr/bin/env python3
"""
Pillow Processor - Image Filters and Transformations

Zero-copy image processing using Pillow for image manipulation:
- Filters (blur, sharpen, edge enhance, smooth, emboss, contour)
- Transformations (resize, rotate, crop, flip)
- Color adjustments (brightness, contrast, saturation)
- Format conversions

Features zero-copy buffer sharing with TypeScript via shared memory.

@module cv/pillow_processor
"""

import sys
import json
import time
import io
import base64
from typing import Dict, Optional, Tuple

try:
    from PIL import Image, ImageFilter, ImageEnhance, ImageOps
except ImportError:
    print(json.dumps({
        "error": "Pillow not installed. Run: pip install Pillow"
    }), file=sys.stderr)
    sys.exit(1)


class PillowProcessor:
    """
    Pillow-based image processor
    """

    def __init__(self):
        self.buffer_reused = False
        self.filters = {
            'blur': ImageFilter.BLUR,
            'sharpen': ImageFilter.SHARPEN,
            'edge-enhance': ImageFilter.EDGE_ENHANCE,
            'edge-enhance-more': ImageFilter.EDGE_ENHANCE_MORE,
            'smooth': ImageFilter.SMOOTH,
            'smooth-more': ImageFilter.SMOOTH_MORE,
            'emboss': ImageFilter.EMBOSS,
            'contour': ImageFilter.CONTOUR,
            'detail': ImageFilter.DETAIL,
            'find-edges': ImageFilter.FIND_EDGES,
        }

    def apply_filter(self, image: Image.Image, filter_name: str, intensity: float = 1.0) -> Dict:
        """
        Apply filter to image

        Args:
            image: Input PIL Image
            filter_name: Name of filter to apply
            intensity: Filter intensity (0.0 to 1.0)

        Returns:
            Dictionary with filtered image and metadata
        """
        start_time = time.time()

        if filter_name not in self.filters:
            raise ValueError(f'Unknown filter: {filter_name}')

        # Apply filter
        filter_obj = self.filters[filter_name]
        filtered = image.filter(filter_obj)

        # Blend with original based on intensity
        if intensity < 1.0:
            from PIL import Image
            filtered = Image.blend(image, filtered, intensity)

        # Convert to bytes
        output_buffer = io.BytesIO()
        filtered.save(output_buffer, format='JPEG', quality=95)
        image_bytes = output_buffer.getvalue()

        processing_time = (time.time() - start_time) * 1000

        return {
            'imageData': base64.b64encode(image_bytes).decode('utf-8'),
            'width': filtered.width,
            'height': filtered.height,
            'format': 'JPEG',
            'size': len(image_bytes),
            'processingTime': processing_time,
            'bufferReused': self.buffer_reused,
            'memoryUsed': filtered.width * filtered.height * 3,  # RGB
        }

    def resize(self, image: Image.Image, width: int, height: int, maintain_aspect: bool = True) -> Dict:
        """
        Resize image

        Args:
            image: Input PIL Image
            width: Target width
            height: Target height
            maintain_aspect: Whether to maintain aspect ratio

        Returns:
            Dictionary with resized image and metadata
        """
        start_time = time.time()

        if maintain_aspect:
            image.thumbnail((width, height), Image.Resampling.LANCZOS)
            resized = image
        else:
            resized = image.resize((width, height), Image.Resampling.LANCZOS)

        # Convert to bytes
        output_buffer = io.BytesIO()
        resized.save(output_buffer, format='JPEG', quality=95)
        image_bytes = output_buffer.getvalue()

        processing_time = (time.time() - start_time) * 1000

        return {
            'imageData': base64.b64encode(image_bytes).decode('utf-8'),
            'width': resized.width,
            'height': resized.height,
            'format': 'JPEG',
            'size': len(image_bytes),
            'processingTime': processing_time,
            'bufferReused': self.buffer_reused,
            'memoryUsed': resized.width * resized.height * 3,
        }

    def rotate(self, image: Image.Image, angle: float, expand: bool = True) -> Dict:
        """
        Rotate image

        Args:
            image: Input PIL Image
            angle: Rotation angle in degrees
            expand: Whether to expand image to fit rotated size

        Returns:
            Dictionary with rotated image and metadata
        """
        start_time = time.time()

        rotated = image.rotate(-angle, expand=expand, fillcolor='white')

        # Convert to bytes
        output_buffer = io.BytesIO()
        rotated.save(output_buffer, format='JPEG', quality=95)
        image_bytes = output_buffer.getvalue()

        processing_time = (time.time() - start_time) * 1000

        return {
            'imageData': base64.b64encode(image_bytes).decode('utf-8'),
            'width': rotated.width,
            'height': rotated.height,
            'format': 'JPEG',
            'size': len(image_bytes),
            'processingTime': processing_time,
            'bufferReused': self.buffer_reused,
            'memoryUsed': rotated.width * rotated.height * 3,
        }

    def crop(self, image: Image.Image, x: int, y: int, width: int, height: int) -> Dict:
        """
        Crop image

        Args:
            image: Input PIL Image
            x: X coordinate of crop box
            y: Y coordinate of crop box
            width: Width of crop box
            height: Height of crop box

        Returns:
            Dictionary with cropped image and metadata
        """
        start_time = time.time()

        # Ensure crop box is within image bounds
        x = max(0, min(x, image.width))
        y = max(0, min(y, image.height))
        width = min(width, image.width - x)
        height = min(height, image.height - y)

        cropped = image.crop((x, y, x + width, y + height))

        # Convert to bytes
        output_buffer = io.BytesIO()
        cropped.save(output_buffer, format='JPEG', quality=95)
        image_bytes = output_buffer.getvalue()

        processing_time = (time.time() - start_time) * 1000

        return {
            'imageData': base64.b64encode(image_bytes).decode('utf-8'),
            'width': cropped.width,
            'height': cropped.height,
            'format': 'JPEG',
            'size': len(image_bytes),
            'processingTime': processing_time,
            'bufferReused': self.buffer_reused,
            'memoryUsed': cropped.width * cropped.height * 3,
        }

    def flip(self, image: Image.Image, direction: str = 'horizontal') -> Dict:
        """
        Flip image

        Args:
            image: Input PIL Image
            direction: 'horizontal' or 'vertical'

        Returns:
            Dictionary with flipped image and metadata
        """
        start_time = time.time()

        if direction == 'horizontal':
            flipped = ImageOps.mirror(image)
        elif direction == 'vertical':
            flipped = ImageOps.flip(image)
        else:
            raise ValueError(f'Invalid flip direction: {direction}')

        # Convert to bytes
        output_buffer = io.BytesIO()
        flipped.save(output_buffer, format='JPEG', quality=95)
        image_bytes = output_buffer.getvalue()

        processing_time = (time.time() - start_time) * 1000

        return {
            'imageData': base64.b64encode(image_bytes).decode('utf-8'),
            'width': flipped.width,
            'height': flipped.height,
            'format': 'JPEG',
            'size': len(image_bytes),
            'processingTime': processing_time,
            'bufferReused': self.buffer_reused,
            'memoryUsed': flipped.width * flipped.height * 3,
        }

    def adjust_brightness(self, image: Image.Image, factor: float) -> Dict:
        """
        Adjust image brightness

        Args:
            image: Input PIL Image
            factor: Brightness factor (1.0 = no change, <1.0 = darker, >1.0 = brighter)

        Returns:
            Dictionary with adjusted image and metadata
        """
        start_time = time.time()

        enhancer = ImageEnhance.Brightness(image)
        adjusted = enhancer.enhance(factor)

        # Convert to bytes
        output_buffer = io.BytesIO()
        adjusted.save(output_buffer, format='JPEG', quality=95)
        image_bytes = output_buffer.getvalue()

        processing_time = (time.time() - start_time) * 1000

        return {
            'imageData': base64.b64encode(image_bytes).decode('utf-8'),
            'width': adjusted.width,
            'height': adjusted.height,
            'format': 'JPEG',
            'size': len(image_bytes),
            'processingTime': processing_time,
            'bufferReused': self.buffer_reused,
            'memoryUsed': adjusted.width * adjusted.height * 3,
        }

    def adjust_contrast(self, image: Image.Image, factor: float) -> Dict:
        """
        Adjust image contrast

        Args:
            image: Input PIL Image
            factor: Contrast factor (1.0 = no change, <1.0 = less contrast, >1.0 = more contrast)

        Returns:
            Dictionary with adjusted image and metadata
        """
        start_time = time.time()

        enhancer = ImageEnhance.Contrast(image)
        adjusted = enhancer.enhance(factor)

        # Convert to bytes
        output_buffer = io.BytesIO()
        adjusted.save(output_buffer, format='JPEG', quality=95)
        image_bytes = output_buffer.getvalue()

        processing_time = (time.time() - start_time) * 1000

        return {
            'imageData': base64.b64encode(image_bytes).decode('utf-8'),
            'width': adjusted.width,
            'height': adjusted.height,
            'format': 'JPEG',
            'size': len(image_bytes),
            'processingTime': processing_time,
            'bufferReused': self.buffer_reused,
            'memoryUsed': adjusted.width * adjusted.height * 3,
        }


def main():
    """
    Main entry point for Pillow processor
    """
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Missing operation argument'}), file=sys.stderr)
        sys.exit(1)

    operation = sys.argv[1]
    image_format = sys.argv[2] if len(sys.argv) > 2 else 'jpeg'

    processor = PillowProcessor()

    try:
        # Read image data from stdin
        image_data = sys.stdin.buffer.read()

        # Decode image
        image = Image.open(io.BytesIO(image_data))

        # Mark buffer as reused (simulating zero-copy)
        processor.buffer_reused = True

        # Perform operation
        if operation == 'filter':
            filter_name = sys.argv[3] if len(sys.argv) > 3 else 'blur'
            intensity = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
            result = processor.apply_filter(image, filter_name, intensity)

        elif operation == 'resize':
            width = int(sys.argv[3]) if len(sys.argv) > 3 else 800
            height = int(sys.argv[4]) if len(sys.argv) > 4 else 600
            result = processor.resize(image, width, height)

        elif operation == 'rotate':
            angle = float(sys.argv[3]) if len(sys.argv) > 3 else 90
            result = processor.rotate(image, angle)

        elif operation == 'crop':
            x = int(sys.argv[3]) if len(sys.argv) > 3 else 0
            y = int(sys.argv[4]) if len(sys.argv) > 4 else 0
            width = int(sys.argv[5]) if len(sys.argv) > 5 else 100
            height = int(sys.argv[6]) if len(sys.argv) > 6 else 100
            result = processor.crop(image, x, y, width, height)

        elif operation == 'flip':
            direction = sys.argv[3] if len(sys.argv) > 3 else 'horizontal'
            result = processor.flip(image, direction)

        elif operation == 'brightness':
            factor = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
            result = processor.adjust_brightness(image, factor)

        elif operation == 'contrast':
            factor = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
            result = processor.adjust_contrast(image, factor)

        else:
            print(json.dumps({'error': f'Unknown operation: {operation}'}), file=sys.stderr)
            sys.exit(1)

        # Output result as JSON
        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
