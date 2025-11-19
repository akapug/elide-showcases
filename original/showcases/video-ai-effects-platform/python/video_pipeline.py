"""
Video Processing Pipeline

Comprehensive video processing pipeline with multi-stage effects,
real-time optimization, and flexible input/output handling.
"""

import sys
import json
import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum
import time
import threading
from queue import Queue, Empty
import argparse


class StageType(Enum):
    """Types of pipeline stages"""
    FILTER = "filter"
    EFFECT = "effect"
    TRANSFORM = "transform"
    DETECTION = "detection"
    CUSTOM = "custom"


@dataclass
class PipelineStage:
    """Definition of a pipeline stage"""
    name: str
    stage_type: StageType
    processor: Callable
    params: Dict[str, Any]
    enabled: bool = True
    priority: int = 0


@dataclass
class PipelineConfig:
    """Configuration for video pipeline"""
    input_source: str = 'camera'
    input_device: int = 0
    input_file: Optional[str] = None
    output_format: str = 'h264'
    output_file: Optional[str] = None
    width: int = 1920
    height: int = 1080
    fps: int = 30
    buffer_size: int = 30
    threads: int = 4
    enable_threading: bool = True


class VideoCapture:
    """Video capture with buffering"""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.capture: Optional[cv2.VideoCapture] = None
        self.frame_buffer: Queue = Queue(maxsize=config.buffer_size)
        self.running = False
        self.capture_thread: Optional[threading.Thread] = None

    def open(self):
        """Open video source"""
        if self.config.input_source == 'camera':
            self.capture = cv2.VideoCapture(self.config.input_device)
            self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.width)
            self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.height)
            self.capture.set(cv2.CAP_PROP_FPS, self.config.fps)
        elif self.config.input_source == 'file' and self.config.input_file:
            self.capture = cv2.VideoCapture(self.config.input_file)
        else:
            raise ValueError(f"Invalid input source: {self.config.input_source}")

        if not self.capture.isOpened():
            raise RuntimeError("Failed to open video source")

        print(f"Video source opened: {self.config.input_source}", file=sys.stderr)

    def start(self):
        """Start capture thread"""
        if self.config.enable_threading:
            self.running = True
            self.capture_thread = threading.Thread(target=self._capture_loop)
            self.capture_thread.daemon = True
            self.capture_thread.start()
            print("Capture thread started", file=sys.stderr)

    def _capture_loop(self):
        """Continuous frame capture loop"""
        while self.running:
            ret, frame = self.capture.read()

            if ret:
                try:
                    # Add to buffer (non-blocking)
                    if not self.frame_buffer.full():
                        self.frame_buffer.put(frame, block=False)
                except:
                    pass  # Drop frame if buffer is full
            else:
                # End of stream or error
                time.sleep(0.1)

    def read(self) -> Optional[np.ndarray]:
        """Read next frame"""
        if self.config.enable_threading:
            try:
                return self.frame_buffer.get(timeout=1.0)
            except Empty:
                return None
        else:
            ret, frame = self.capture.read()
            return frame if ret else None

    def stop(self):
        """Stop capture"""
        self.running = False

        if self.capture_thread:
            self.capture_thread.join(timeout=2.0)

        if self.capture:
            self.capture.release()

        print("Video capture stopped", file=sys.stderr)


class VideoWriter:
    """Video writer with encoding"""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.writer: Optional[cv2.VideoWriter] = None

    def open(self):
        """Open video writer"""
        if not self.config.output_file:
            return

        # Determine codec
        codec_map = {
            'h264': cv2.VideoWriter_fourcc(*'H264'),
            'h265': cv2.VideoWriter_fourcc(*'HEVC'),
            'xvid': cv2.VideoWriter_fourcc(*'XVID'),
            'mjpeg': cv2.VideoWriter_fourcc(*'MJPG'),
            'vp9': cv2.VideoWriter_fourcc(*'VP90')
        }

        fourcc = codec_map.get(self.config.output_format, cv2.VideoWriter_fourcc(*'H264'))

        self.writer = cv2.VideoWriter(
            self.config.output_file,
            fourcc,
            self.config.fps,
            (self.config.width, self.config.height)
        )

        if not self.writer.isOpened():
            raise RuntimeError("Failed to open video writer")

        print(f"Video writer opened: {self.config.output_file}", file=sys.stderr)

    def write(self, frame: np.ndarray):
        """Write frame to output"""
        if self.writer:
            # Ensure frame is correct size
            if frame.shape[:2] != (self.config.height, self.config.width):
                frame = cv2.resize(frame, (self.config.width, self.config.height))

            self.writer.write(frame)

    def close(self):
        """Close video writer"""
        if self.writer:
            self.writer.release()
            print("Video writer closed", file=sys.stderr)


class VideoPipeline:
    """Main video processing pipeline"""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.stages: List[PipelineStage] = []
        self.capture = VideoCapture(config)
        self.writer = VideoWriter(config)
        self.running = False
        self.stats = {
            'frames_processed': 0,
            'frames_dropped': 0,
            'average_fps': 0.0,
            'average_latency': 0.0
        }
        self.processing_times: List[float] = []

    def add_stage(
        self,
        name: str,
        stage_type: StageType = StageType.FILTER,
        processor: Optional[Callable] = None,
        **params
    ):
        """Add processing stage to pipeline"""
        if processor is None:
            # Use built-in processor
            processor = self._get_builtin_processor(name)

        stage = PipelineStage(
            name=name,
            stage_type=stage_type,
            processor=processor,
            params=params,
            enabled=True,
            priority=params.get('priority', len(self.stages))
        )

        self.stages.append(stage)

        # Sort by priority
        self.stages.sort(key=lambda s: s.priority)

        print(f"Added pipeline stage: {name}", file=sys.stderr)

    def _get_builtin_processor(self, name: str) -> Callable:
        """Get built-in processor by name"""
        processors = {
            'face_detection': self._face_detection,
            'background_removal': self._background_removal,
            'color_grading': self._color_grading,
            'gaussian_blur': self._gaussian_blur,
            'edge_detection': self._edge_detection,
            'sharpen': self._sharpen,
            'denoise': self._denoise,
            'stabilization': self._stabilization,
            'resize': self._resize,
            'crop': self._crop,
            'rotate': self._rotate,
            'flip': self._flip
        }

        if name not in processors:
            raise ValueError(f"Unknown processor: {name}")

        return processors[name]

    def remove_stage(self, name: str):
        """Remove stage from pipeline"""
        self.stages = [s for s in self.stages if s.name != name]
        print(f"Removed pipeline stage: {name}", file=sys.stderr)

    def enable_stage(self, name: str):
        """Enable a stage"""
        for stage in self.stages:
            if stage.name == name:
                stage.enabled = True
                break

    def disable_stage(self, name: str):
        """Disable a stage"""
        for stage in self.stages:
            if stage.name == name:
                stage.enabled = False
                break

    def start(self):
        """Start pipeline"""
        print("Starting video pipeline...", file=sys.stderr)

        # Open capture
        self.capture.open()
        self.capture.start()

        # Open writer
        self.writer.open()

        self.running = True

        # Main processing loop
        self._processing_loop()

    def _processing_loop(self):
        """Main processing loop"""
        frame_count = 0

        try:
            while self.running:
                start_time = time.time()

                # Read frame
                frame = self.capture.read()

                if frame is None:
                    continue

                # Process through pipeline
                processed = self._process_frame(frame)

                # Write output
                self.writer.write(processed)

                # Update statistics
                processing_time = time.time() - start_time
                self.processing_times.append(processing_time)

                if len(self.processing_times) > 100:
                    self.processing_times.pop(0)

                self.stats['frames_processed'] += 1
                self.stats['average_latency'] = sum(self.processing_times) / len(self.processing_times)
                self.stats['average_fps'] = 1.0 / self.stats['average_latency'] if self.stats['average_latency'] > 0 else 0

                frame_count += 1

                # Print stats periodically
                if frame_count % 30 == 0:
                    print(f"Stats: {self.stats}", file=sys.stderr)

                # Maintain frame rate
                target_time = 1.0 / self.config.fps
                elapsed = time.time() - start_time
                if elapsed < target_time:
                    time.sleep(target_time - elapsed)

        except KeyboardInterrupt:
            print("Pipeline interrupted", file=sys.stderr)

        finally:
            self.stop()

    def _process_frame(self, frame: np.ndarray) -> np.ndarray:
        """Process frame through all stages"""
        result = frame.copy()

        for stage in self.stages:
            if not stage.enabled:
                continue

            try:
                stage_start = time.time()
                result = stage.processor(result, stage.params)
                stage_time = time.time() - stage_start

                if stage_time > 0.1:  # Log slow stages
                    print(f"Stage '{stage.name}' took {stage_time:.3f}s", file=sys.stderr)

            except Exception as e:
                print(f"Error in stage '{stage.name}': {e}", file=sys.stderr)

        return result

    def stop(self):
        """Stop pipeline"""
        self.running = False
        self.capture.stop()
        self.writer.close()
        print("Pipeline stopped", file=sys.stderr)

    # Built-in processors

    def _face_detection(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Face detection processor"""
        # Load Haar cascade
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5)

        # Draw rectangles
        if params.get('draw', True):
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

        return frame

    def _background_removal(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Background removal processor"""
        blur_amount = params.get('blur_amount', 25)

        # Simple implementation - blur background
        # In production, use actual segmentation
        mask = np.ones(frame.shape[:2], dtype=np.uint8) * 255

        # Blur background
        blurred = cv2.GaussianBlur(frame, (blur_amount, blur_amount), 0)

        # Composite (simplified)
        result = cv2.addWeighted(frame, 0.7, blurred, 0.3, 0)

        return result

    def _color_grading(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Color grading processor"""
        preset = params.get('preset', 'neutral')

        if preset == 'warm':
            # Add warmth
            frame = frame.astype(np.float32)
            frame[:, :, 2] = np.clip(frame[:, :, 2] * 1.1, 0, 255)
            frame[:, :, 0] = np.clip(frame[:, :, 0] * 0.9, 0, 255)
            frame = frame.astype(np.uint8)

        elif preset == 'cool':
            # Add coolness
            frame = frame.astype(np.float32)
            frame[:, :, 0] = np.clip(frame[:, :, 0] * 1.1, 0, 255)
            frame[:, :, 2] = np.clip(frame[:, :, 2] * 0.9, 0, 255)
            frame = frame.astype(np.uint8)

        elif preset == 'cinematic':
            # Cinematic look
            # Increase contrast
            alpha = 1.3  # Contrast
            beta = -20   # Brightness
            frame = cv2.convertScaleAbs(frame, alpha=alpha, beta=beta)

        return frame

    def _gaussian_blur(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Gaussian blur processor"""
        kernel_size = params.get('kernel_size', 15)

        if kernel_size % 2 == 0:
            kernel_size += 1

        return cv2.GaussianBlur(frame, (kernel_size, kernel_size), 0)

    def _edge_detection(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Edge detection processor"""
        method = params.get('method', 'canny')

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        if method == 'canny':
            edges = cv2.Canny(gray, 50, 150)
            return cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        elif method == 'sobel':
            sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            sobel = np.sqrt(sobelx**2 + sobely**2)
            sobel = np.uint8(sobel * 255 / sobel.max())
            return cv2.cvtColor(sobel, cv2.COLOR_GRAY2BGR)

        return frame

    def _sharpen(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Sharpen processor"""
        amount = params.get('amount', 1.0)

        kernel = np.array([
            [0, -amount, 0],
            [-amount, 1 + 4*amount, -amount],
            [0, -amount, 0]
        ], dtype=np.float32)

        return cv2.filter2D(frame, -1, kernel)

    def _denoise(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Denoise processor"""
        h = params.get('h', 10)

        return cv2.fastNlMeansDenoisingColored(frame, None, h, h, 7, 21)

    def _stabilization(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Video stabilization processor (simplified)"""
        # Full stabilization requires tracking across frames
        # This is a placeholder
        return frame

    def _resize(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Resize processor"""
        width = params.get('width', frame.shape[1])
        height = params.get('height', frame.shape[0])

        return cv2.resize(frame, (width, height))

    def _crop(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Crop processor"""
        x = params.get('x', 0)
        y = params.get('y', 0)
        width = params.get('width', frame.shape[1])
        height = params.get('height', frame.shape[0])

        return frame[y:y+height, x:x+width]

    def _rotate(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Rotate processor"""
        angle = params.get('angle', 0)

        center = (frame.shape[1] // 2, frame.shape[0] // 2)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)

        return cv2.warpAffine(frame, matrix, (frame.shape[1], frame.shape[0]))

    def _flip(self, frame: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Flip processor"""
        direction = params.get('direction', 'horizontal')

        if direction == 'horizontal':
            return cv2.flip(frame, 1)
        elif direction == 'vertical':
            return cv2.flip(frame, 0)
        elif direction == 'both':
            return cv2.flip(frame, -1)

        return frame

    def get_stats(self) -> Dict[str, Any]:
        """Get pipeline statistics"""
        return self.stats.copy()


class PipelineBuilder:
    """Helper class for building pipelines"""

    @staticmethod
    def create_realtime_pipeline(config: PipelineConfig) -> VideoPipeline:
        """Create pipeline optimized for real-time processing"""
        pipeline = VideoPipeline(config)

        # Add lightweight stages
        pipeline.add_stage('denoise', h=5)
        pipeline.add_stage('sharpen', amount=0.5)
        pipeline.add_stage('color_grading', preset='cinematic')

        return pipeline

    @staticmethod
    def create_quality_pipeline(config: PipelineConfig) -> VideoPipeline:
        """Create pipeline optimized for quality"""
        pipeline = VideoPipeline(config)

        # Add high-quality stages
        pipeline.add_stage('denoise', h=10)
        pipeline.add_stage('sharpen', amount=1.0)
        pipeline.add_stage('color_grading', preset='cinematic')
        pipeline.add_stage('face_detection', draw=True)

        return pipeline

    @staticmethod
    def create_effects_pipeline(config: PipelineConfig) -> VideoPipeline:
        """Create pipeline with artistic effects"""
        pipeline = VideoPipeline(config)

        pipeline.add_stage('background_removal', blur_amount=25)
        pipeline.add_stage('edge_detection', method='canny')
        pipeline.add_stage('color_grading', preset='warm')

        return pipeline


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Video Processing Pipeline')
    parser.add_argument('--input', default='camera', choices=['camera', 'file'])
    parser.add_argument('--input-file', type=str)
    parser.add_argument('--input-device', type=int, default=0)
    parser.add_argument('--output-file', type=str)
    parser.add_argument('--output-format', default='h264')
    parser.add_argument('--width', type=int, default=1920)
    parser.add_argument('--height', type=int, default=1080)
    parser.add_argument('--fps', type=int, default=30)
    parser.add_argument('--preset', default='realtime', choices=['realtime', 'quality', 'effects'])

    args = parser.parse_args()

    # Create configuration
    config = PipelineConfig(
        input_source=args.input,
        input_file=args.input_file,
        input_device=args.input_device,
        output_file=args.output_file,
        output_format=args.output_format,
        width=args.width,
        height=args.height,
        fps=args.fps
    )

    # Create pipeline based on preset
    if args.preset == 'realtime':
        pipeline = PipelineBuilder.create_realtime_pipeline(config)
    elif args.preset == 'quality':
        pipeline = PipelineBuilder.create_quality_pipeline(config)
    else:
        pipeline = PipelineBuilder.create_effects_pipeline(config)

    # Start processing
    print("Starting pipeline...", file=sys.stderr)
    pipeline.start()


if __name__ == '__main__':
    main()
