"""
OpenCV Video Processor

High-performance video processing using OpenCV with support for
real-time filters, transformations, and computer vision operations.
"""

import sys
import json
import base64
import argparse
import numpy as np
import cv2
from typing import Dict, Any, Tuple, Optional, List
import time
from dataclasses import dataclass


@dataclass
class ProcessorConfig:
    """Configuration for video processor"""
    width: int = 1920
    height: int = 1080
    fps: int = 30
    backend: str = 'cpu'
    threads: int = 4
    quality: str = 'high'


class CVProcessor:
    """OpenCV-based video processor"""

    def __init__(self, config: ProcessorConfig):
        self.config = config
        self.setup_opencv()
        self.filters = self.initialize_filters()
        self.frame_count = 0
        self.processing_times = []

    def setup_opencv(self):
        """Configure OpenCV for optimal performance"""
        # Set number of threads
        cv2.setNumThreads(self.config.threads)

        # Enable optimizations
        cv2.setUseOptimized(True)

        # Configure backend
        if self.config.backend == 'cuda':
            try:
                cv2.cuda.setDevice(0)
                self.use_cuda = True
                print("CUDA acceleration enabled", file=sys.stderr)
            except Exception as e:
                print(f"CUDA not available: {e}", file=sys.stderr)
                self.use_cuda = False
        else:
            self.use_cuda = False

    def initialize_filters(self) -> Dict[str, Any]:
        """Initialize filter kernels and parameters"""
        filters = {
            'gaussian_blur': {
                'kernel_sizes': {
                    'low': (5, 5),
                    'medium': (9, 9),
                    'high': (15, 15)
                }
            },
            'bilateral': {
                'd': 9,
                'sigmaColor': 75,
                'sigmaSpace': 75
            },
            'median_blur': {
                'kernel_size': 5
            },
            'sharpen': {
                'kernel': np.array([
                    [0, -1, 0],
                    [-1, 5, -1],
                    [0, -1, 0]
                ], dtype=np.float32)
            },
            'edge_detection': {
                'sobel': {
                    'ksize': 3
                },
                'canny': {
                    'threshold1': 50,
                    'threshold2': 150
                },
                'laplacian': {
                    'ksize': 3
                }
            },
            'morphology': {
                'kernel': cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            }
        }

        return filters

    def process_frame(self, frame_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single frame"""
        start_time = time.time()

        try:
            # Decode frame
            frame = self.decode_frame(frame_data)

            # Apply effects
            effects = frame_data.get('effects', [])
            for effect in effects:
                if effect.get('enabled', True):
                    frame = self.apply_effect(frame, effect)

            # Encode result
            result = self.encode_frame(frame)

            # Update statistics
            processing_time = time.time() - start_time
            self.processing_times.append(processing_time)
            self.frame_count += 1

            return {
                'type': 'frame-processed',
                'frame': result,
                'width': frame.shape[1],
                'height': frame.shape[0],
                'timestamp': frame_data.get('timestamp', 0),
                'format': 'rgb24',
                'metadata': {
                    'processing_time': processing_time,
                    'frame_count': self.frame_count
                }
            }

        except Exception as e:
            return {
                'type': 'error',
                'message': str(e)
            }

    def decode_frame(self, frame_data: Dict[str, Any]) -> np.ndarray:
        """Decode frame from base64"""
        data = base64.b64decode(frame_data['data'])
        width = frame_data['width']
        height = frame_data['height']

        # Convert to numpy array
        frame = np.frombuffer(data, dtype=np.uint8)
        frame = frame.reshape((height, width, 4))  # RGBA

        # Convert to BGR for OpenCV
        frame = cv2.cvtColor(frame, cv2.COLOR_RGBA2BGR)

        return frame

    def encode_frame(self, frame: np.ndarray) -> str:
        """Encode frame to base64"""
        # Convert to RGBA
        if len(frame.shape) == 2:
            frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2RGBA)
        elif frame.shape[2] == 3:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGBA)

        # Convert to bytes
        data = frame.tobytes()

        # Encode to base64
        return base64.b64encode(data).decode('utf-8')

    def apply_effect(self, frame: np.ndarray, effect: Dict[str, Any]) -> np.ndarray:
        """Apply effect to frame"""
        effect_name = effect.get('name', '')
        params = effect.get('params', {})

        effect_map = {
            'gaussian_blur': self.gaussian_blur,
            'bilateral_filter': self.bilateral_filter,
            'median_blur': self.median_blur,
            'sharpen': self.sharpen,
            'edge_detection': self.edge_detection,
            'canny': self.canny_edge,
            'sobel': self.sobel_edge,
            'laplacian': self.laplacian_edge,
            'dilate': self.dilate,
            'erode': self.erode,
            'morphology_open': self.morphology_open,
            'morphology_close': self.morphology_close,
            'perspective_transform': self.perspective_transform,
            'affine_transform': self.affine_transform,
            'rotate': self.rotate,
            'resize': self.resize_frame,
            'crop': self.crop,
            'flip': self.flip,
            'threshold': self.threshold,
            'adaptive_threshold': self.adaptive_threshold,
            'color_space': self.color_space_conversion,
            'histogram_equalization': self.histogram_equalization,
            'clahe': self.clahe,
            'denoise': self.denoise,
            'inpaint': self.inpaint
        }

        if effect_name in effect_map:
            return effect_map[effect_name](frame, params)
        else:
            print(f"Unknown effect: {effect_name}", file=sys.stderr)
            return frame

    # Filter implementations

    def gaussian_blur(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply Gaussian blur"""
        kernel_size = params.get('kernel_size', 15)
        sigma = params.get('sigma', 0)

        # Ensure odd kernel size
        if kernel_size % 2 == 0:
            kernel_size += 1

        return cv2.GaussianBlur(frame, (kernel_size, kernel_size), sigma)

    def bilateral_filter(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply bilateral filter (edge-preserving smoothing)"""
        d = params.get('d', 9)
        sigma_color = params.get('sigma_color', 75)
        sigma_space = params.get('sigma_space', 75)

        return cv2.bilateralFilter(frame, d, sigma_color, sigma_space)

    def median_blur(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply median blur"""
        kernel_size = params.get('kernel_size', 5)

        # Ensure odd kernel size
        if kernel_size % 2 == 0:
            kernel_size += 1

        return cv2.medianBlur(frame, kernel_size)

    def sharpen(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply sharpening filter"""
        amount = params.get('amount', 1.0)

        kernel = np.array([
            [0, -amount, 0],
            [-amount, 1 + 4 * amount, -amount],
            [0, -amount, 0]
        ], dtype=np.float32)

        return cv2.filter2D(frame, -1, kernel)

    def edge_detection(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply edge detection"""
        method = params.get('method', 'canny')

        if method == 'canny':
            return self.canny_edge(frame, params)
        elif method == 'sobel':
            return self.sobel_edge(frame, params)
        elif method == 'laplacian':
            return self.laplacian_edge(frame, params)
        else:
            return self.canny_edge(frame, params)

    def canny_edge(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Canny edge detection"""
        threshold1 = params.get('threshold1', 50)
        threshold2 = params.get('threshold2', 150)

        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Apply Canny
        edges = cv2.Canny(gray, threshold1, threshold2)

        # Convert back to BGR
        return cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

    def sobel_edge(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Sobel edge detection"""
        ksize = params.get('ksize', 3)

        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Apply Sobel in X and Y directions
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=ksize)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=ksize)

        # Calculate magnitude
        magnitude = np.sqrt(sobelx**2 + sobely**2)
        magnitude = np.uint8(magnitude * 255 / magnitude.max())

        # Convert back to BGR
        return cv2.cvtColor(magnitude, cv2.COLOR_GRAY2BGR)

    def laplacian_edge(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Laplacian edge detection"""
        ksize = params.get('ksize', 3)

        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Apply Laplacian
        laplacian = cv2.Laplacian(gray, cv2.CV_64F, ksize=ksize)
        laplacian = np.uint8(np.absolute(laplacian))

        # Convert back to BGR
        return cv2.cvtColor(laplacian, cv2.COLOR_GRAY2BGR)

    def dilate(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply dilation"""
        kernel_size = params.get('kernel_size', 5)
        iterations = params.get('iterations', 1)

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (kernel_size, kernel_size)
        )

        return cv2.dilate(frame, kernel, iterations=iterations)

    def erode(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply erosion"""
        kernel_size = params.get('kernel_size', 5)
        iterations = params.get('iterations', 1)

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (kernel_size, kernel_size)
        )

        return cv2.erode(frame, kernel, iterations=iterations)

    def morphology_open(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply morphological opening"""
        kernel_size = params.get('kernel_size', 5)

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (kernel_size, kernel_size)
        )

        return cv2.morphologyEx(frame, cv2.MORPH_OPEN, kernel)

    def morphology_close(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply morphological closing"""
        kernel_size = params.get('kernel_size', 5)

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (kernel_size, kernel_size)
        )

        return cv2.morphologyEx(frame, cv2.MORPH_CLOSE, kernel)

    def perspective_transform(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply perspective transformation"""
        src_points = np.array(params.get('src_points', [
            [0, 0],
            [frame.shape[1], 0],
            [frame.shape[1], frame.shape[0]],
            [0, frame.shape[0]]
        ]), dtype=np.float32)

        dst_points = np.array(params.get('dst_points', [
            [0, 0],
            [frame.shape[1], 0],
            [frame.shape[1], frame.shape[0]],
            [0, frame.shape[0]]
        ]), dtype=np.float32)

        matrix = cv2.getPerspectiveTransform(src_points, dst_points)

        return cv2.warpPerspective(
            frame,
            matrix,
            (frame.shape[1], frame.shape[0])
        )

    def affine_transform(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply affine transformation"""
        src_points = np.array(params.get('src_points', [
            [0, 0],
            [frame.shape[1], 0],
            [0, frame.shape[0]]
        ]), dtype=np.float32)

        dst_points = np.array(params.get('dst_points', [
            [0, 0],
            [frame.shape[1], 0],
            [0, frame.shape[0]]
        ]), dtype=np.float32)

        matrix = cv2.getAffineTransform(src_points, dst_points)

        return cv2.warpAffine(
            frame,
            matrix,
            (frame.shape[1], frame.shape[0])
        )

    def rotate(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Rotate frame"""
        angle = params.get('angle', 0)
        center = params.get('center', None)
        scale = params.get('scale', 1.0)

        if center is None:
            center = (frame.shape[1] // 2, frame.shape[0] // 2)

        matrix = cv2.getRotationMatrix2D(center, angle, scale)

        return cv2.warpAffine(
            frame,
            matrix,
            (frame.shape[1], frame.shape[0])
        )

    def resize_frame(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Resize frame"""
        width = params.get('width', frame.shape[1])
        height = params.get('height', frame.shape[0])
        interpolation = params.get('interpolation', 'linear')

        interp_map = {
            'nearest': cv2.INTER_NEAREST,
            'linear': cv2.INTER_LINEAR,
            'cubic': cv2.INTER_CUBIC,
            'lanczos': cv2.INTER_LANCZOS4
        }

        return cv2.resize(
            frame,
            (width, height),
            interpolation=interp_map.get(interpolation, cv2.INTER_LINEAR)
        )

    def crop(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Crop frame"""
        x = params.get('x', 0)
        y = params.get('y', 0)
        width = params.get('width', frame.shape[1])
        height = params.get('height', frame.shape[0])

        return frame[y:y+height, x:x+width]

    def flip(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Flip frame"""
        direction = params.get('direction', 'horizontal')

        if direction == 'horizontal':
            return cv2.flip(frame, 1)
        elif direction == 'vertical':
            return cv2.flip(frame, 0)
        elif direction == 'both':
            return cv2.flip(frame, -1)
        else:
            return frame

    def threshold(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply thresholding"""
        threshold = params.get('threshold', 127)
        max_value = params.get('max_value', 255)
        threshold_type = params.get('type', 'binary')

        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        type_map = {
            'binary': cv2.THRESH_BINARY,
            'binary_inv': cv2.THRESH_BINARY_INV,
            'trunc': cv2.THRESH_TRUNC,
            'tozero': cv2.THRESH_TOZERO,
            'tozero_inv': cv2.THRESH_TOZERO_INV
        }

        _, result = cv2.threshold(
            gray,
            threshold,
            max_value,
            type_map.get(threshold_type, cv2.THRESH_BINARY)
        )

        # Convert back to BGR
        return cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)

    def adaptive_threshold(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply adaptive thresholding"""
        max_value = params.get('max_value', 255)
        method = params.get('method', 'gaussian')
        threshold_type = params.get('type', 'binary')
        block_size = params.get('block_size', 11)
        c = params.get('c', 2)

        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        method_map = {
            'mean': cv2.ADAPTIVE_THRESH_MEAN_C,
            'gaussian': cv2.ADAPTIVE_THRESH_GAUSSIAN_C
        }

        type_map = {
            'binary': cv2.THRESH_BINARY,
            'binary_inv': cv2.THRESH_BINARY_INV
        }

        result = cv2.adaptiveThreshold(
            gray,
            max_value,
            method_map.get(method, cv2.ADAPTIVE_THRESH_GAUSSIAN_C),
            type_map.get(threshold_type, cv2.THRESH_BINARY),
            block_size,
            c
        )

        # Convert back to BGR
        return cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)

    def color_space_conversion(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Convert color space"""
        target = params.get('target', 'rgb')

        conversion_map = {
            'gray': cv2.COLOR_BGR2GRAY,
            'hsv': cv2.COLOR_BGR2HSV,
            'lab': cv2.COLOR_BGR2LAB,
            'xyz': cv2.COLOR_BGR2XYZ,
            'ycrcb': cv2.COLOR_BGR2YCrCb,
            'hls': cv2.COLOR_BGR2HLS
        }

        if target in conversion_map:
            converted = cv2.cvtColor(frame, conversion_map[target])

            # Convert back to BGR for consistency
            if target == 'gray':
                return cv2.cvtColor(converted, cv2.COLOR_GRAY2BGR)
            elif target == 'hsv':
                return cv2.cvtColor(converted, cv2.COLOR_HSV2BGR)
            elif target == 'lab':
                return cv2.cvtColor(converted, cv2.COLOR_LAB2BGR)
            elif target == 'xyz':
                return cv2.cvtColor(converted, cv2.COLOR_XYZ2BGR)
            elif target == 'ycrcb':
                return cv2.cvtColor(converted, cv2.COLOR_YCrCb2BGR)
            elif target == 'hls':
                return cv2.cvtColor(converted, cv2.COLOR_HLS2BGR)

        return frame

    def histogram_equalization(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply histogram equalization"""
        # Convert to YCrCb
        ycrcb = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)

        # Equalize Y channel
        ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])

        # Convert back to BGR
        return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)

    def clahe(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)"""
        clip_limit = params.get('clip_limit', 2.0)
        tile_grid_size = params.get('tile_grid_size', (8, 8))

        # Convert to LAB
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)

        # Apply CLAHE to L channel
        clahe = cv2.createCLAHE(
            clipLimit=clip_limit,
            tileGridSize=tile_grid_size
        )
        lab[:, :, 0] = clahe.apply(lab[:, :, 0])

        # Convert back to BGR
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    def denoise(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply denoising"""
        h = params.get('h', 10)
        template_window_size = params.get('template_window_size', 7)
        search_window_size = params.get('search_window_size', 21)

        return cv2.fastNlMeansDenoisingColored(
            frame,
            None,
            h,
            h,
            template_window_size,
            search_window_size
        )

    def inpaint(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply inpainting"""
        # This is a placeholder - requires mask input
        mask = params.get('mask', np.zeros(frame.shape[:2], dtype=np.uint8))
        inpaint_radius = params.get('inpaint_radius', 3)
        method = params.get('method', 'telea')

        method_map = {
            'telea': cv2.INPAINT_TELEA,
            'ns': cv2.INPAINT_NS
        }

        return cv2.inpaint(
            frame,
            mask,
            inpaint_radius,
            method_map.get(method, cv2.INPAINT_TELEA)
        )

    def get_stats(self) -> Dict[str, Any]:
        """Get processing statistics"""
        avg_time = (
            sum(self.processing_times) / len(self.processing_times)
            if self.processing_times
            else 0
        )

        return {
            'type': 'stats',
            'stats': {
                'frames_processed': self.frame_count,
                'average_processing_time': avg_time,
                'average_fps': 1.0 / avg_time if avg_time > 0 else 0
            }
        }


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='OpenCV Video Processor')
    parser.add_argument('--width', type=int, default=1920)
    parser.add_argument('--height', type=int, default=1080)
    parser.add_argument('--fps', type=int, default=30)
    parser.add_argument('--backend', default='cpu')
    parser.add_argument('--threads', type=int, default=4)
    parser.add_argument('--quality', default='high')

    args = parser.parse_args()

    # Create processor
    config = ProcessorConfig(
        width=args.width,
        height=args.height,
        fps=args.fps,
        backend=args.backend,
        threads=args.threads,
        quality=args.quality
    )

    processor = CVProcessor(config)

    # Signal ready
    print("READY", flush=True)

    # Process frames from stdin
    try:
        for line in sys.stdin:
            try:
                request = json.loads(line.strip())

                if request['type'] == 'process-frame':
                    result = processor.process_frame(request)
                    print(json.dumps(result), flush=True)
                elif request['type'] == 'get-stats':
                    stats = processor.get_stats()
                    print(json.dumps(stats), flush=True)
                elif request['type'] == 'set-backend':
                    processor.config.backend = request['backend']
                    processor.setup_opencv()
                elif request['type'] == 'configure-gpu':
                    # Configure GPU settings
                    pass

            except json.JSONDecodeError:
                print(json.dumps({
                    'type': 'error',
                    'message': 'Invalid JSON'
                }), flush=True)
            except Exception as e:
                print(json.dumps({
                    'type': 'error',
                    'message': str(e)
                }), flush=True, file=sys.stderr)

    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
