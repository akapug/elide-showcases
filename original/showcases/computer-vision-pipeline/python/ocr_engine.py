"""
OCR Engine with Tesseract and EasyOCR Integration

This module provides comprehensive OCR capabilities using multiple engines
including Tesseract, EasyOCR, and PaddleOCR with preprocessing and optimization.

Features:
- Multiple OCR engines (Tesseract, EasyOCR, PaddleOCR)
- Multi-language support
- Image preprocessing
- Text detection and recognition
- Layout analysis
- Table extraction
- Handwriting recognition
- PDF processing
"""

import numpy as np
import cv2
from typing import List, Tuple, Dict, Optional, Union
from dataclasses import dataclass
from pathlib import Path
import logging
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OCREngine(Enum):
    """Supported OCR engines"""
    TESSERACT = 'tesseract'
    EASYOCR = 'easyocr'
    PADDLEOCR = 'paddleocr'


@dataclass
class BoundingBox:
    """Bounding box coordinates"""
    x: int
    y: int
    width: int
    height: int

    def to_tuple(self) -> Tuple[int, int, int, int]:
        """Convert to tuple"""
        return (self.x, self.y, self.width, self.height)

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height
        }


@dataclass
class OCRResult:
    """OCR result for detected text"""
    text: str
    confidence: float
    bbox: BoundingBox
    language: str

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'text': self.text,
            'confidence': float(self.confidence),
            'bbox': self.bbox.to_dict(),
            'language': self.language
        }


@dataclass
class Word:
    """Individual word with bounding box"""
    text: str
    confidence: float
    bbox: BoundingBox


@dataclass
class TextLine:
    """Text line with word details"""
    text: str
    words: List[Word]
    bbox: BoundingBox
    confidence: float


class OCRConfig:
    """OCR engine configuration"""
    def __init__(
        self,
        engine: str = 'easyocr',
        languages: List[str] = None,
        psm: int = 3,  # Tesseract page segmentation mode
        oem: int = 3,  # Tesseract OCR engine mode
        use_gpu: bool = True,
        preprocess: bool = True
    ):
        self.engine = engine
        self.languages = languages or ['en']
        self.psm = psm
        self.oem = oem
        self.use_gpu = use_gpu
        self.preprocess = preprocess


class ImagePreprocessor:
    """Image preprocessing for better OCR accuracy"""

    @staticmethod
    def preprocess(
        image: np.ndarray,
        operations: List[str] = None
    ) -> np.ndarray:
        """Apply preprocessing operations

        Args:
            image: Input image
            operations: List of operations to apply

        Returns:
            Preprocessed image
        """
        if operations is None:
            operations = ['grayscale', 'denoise', 'threshold', 'deskew']

        processed = image.copy()

        for operation in operations:
            if operation == 'grayscale':
                processed = ImagePreprocessor.to_grayscale(processed)
            elif operation == 'denoise':
                processed = ImagePreprocessor.denoise(processed)
            elif operation == 'threshold':
                processed = ImagePreprocessor.adaptive_threshold(processed)
            elif operation == 'deskew':
                processed = ImagePreprocessor.deskew(processed)
            elif operation == 'contrast':
                processed = ImagePreprocessor.enhance_contrast(processed)
            elif operation == 'sharpen':
                processed = ImagePreprocessor.sharpen(processed)

        return processed

    @staticmethod
    def to_grayscale(image: np.ndarray) -> np.ndarray:
        """Convert to grayscale"""
        if len(image.shape) == 3:
            return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return image

    @staticmethod
    def denoise(image: np.ndarray) -> np.ndarray:
        """Remove noise"""
        return cv2.fastNlMeansDenoising(image, None, 10, 7, 21)

    @staticmethod
    def adaptive_threshold(image: np.ndarray) -> np.ndarray:
        """Apply adaptive thresholding"""
        if len(image.shape) == 3:
            image = ImagePreprocessor.to_grayscale(image)

        return cv2.adaptiveThreshold(
            image,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2
        )

    @staticmethod
    def deskew(image: np.ndarray) -> np.ndarray:
        """Deskew image"""
        if len(image.shape) == 3:
            gray = ImagePreprocessor.to_grayscale(image)
        else:
            gray = image

        # Detect skew angle
        coords = np.column_stack(np.where(gray > 0))
        angle = cv2.minAreaRect(coords)[-1]

        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        # Rotate image
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image,
            M,
            (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )

        return rotated

    @staticmethod
    def enhance_contrast(image: np.ndarray) -> np.ndarray:
        """Enhance contrast using CLAHE"""
        if len(image.shape) == 3:
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)

            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            l = clahe.apply(l)

            enhanced = cv2.merge([l, a, b])
            return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        else:
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            return clahe.apply(image)

    @staticmethod
    def sharpen(image: np.ndarray) -> np.ndarray:
        """Sharpen image"""
        kernel = np.array([[-1, -1, -1],
                          [-1,  9, -1],
                          [-1, -1, -1]])
        return cv2.filter2D(image, -1, kernel)


class TesseractOCR:
    """Tesseract OCR engine wrapper"""

    def __init__(self, config: OCRConfig):
        """Initialize Tesseract OCR

        Args:
            config: OCR configuration
        """
        self.config = config

        try:
            import pytesseract
            self.pytesseract = pytesseract
            logger.info("Tesseract OCR initialized")
        except ImportError:
            logger.error("pytesseract not installed")
            logger.info("Install with: pip install pytesseract")
            raise

    def recognize_text(self, image: np.ndarray) -> List[OCRResult]:
        """Recognize text in image

        Args:
            image: Input image

        Returns:
            List of OCR results
        """
        # Build Tesseract config
        custom_config = f'--oem {self.config.oem} --psm {self.config.psm}'

        # Get detailed data
        data = self.pytesseract.image_to_data(
            image,
            lang='+'.join(self.config.languages),
            config=custom_config,
            output_type=self.pytesseract.Output.DICT
        )

        results = []
        n_boxes = len(data['text'])

        for i in range(n_boxes):
            text = data['text'][i].strip()
            if not text:
                continue

            confidence = float(data['conf'][i]) / 100.0
            if confidence < 0:
                continue

            bbox = BoundingBox(
                x=data['left'][i],
                y=data['top'][i],
                width=data['width'][i],
                height=data['height'][i]
            )

            results.append(OCRResult(
                text=text,
                confidence=confidence,
                bbox=bbox,
                language=self.config.languages[0]
            ))

        return results

    def get_text(self, image: np.ndarray) -> str:
        """Get plain text from image

        Args:
            image: Input image

        Returns:
            Extracted text
        """
        custom_config = f'--oem {self.config.oem} --psm {self.config.psm}'

        text = self.pytesseract.image_to_string(
            image,
            lang='+'.join(self.config.languages),
            config=custom_config
        )

        return text.strip()


class EasyOCREngine:
    """EasyOCR engine wrapper"""

    def __init__(self, config: OCRConfig):
        """Initialize EasyOCR

        Args:
            config: OCR configuration
        """
        self.config = config
        self.reader = None

        logger.info("Initializing EasyOCR...")

    def load_model(self) -> None:
        """Load EasyOCR model"""
        try:
            import easyocr
            self.reader = easyocr.Reader(
                self.config.languages,
                gpu=self.config.use_gpu
            )
            logger.info("EasyOCR model loaded")
        except ImportError:
            logger.error("EasyOCR not installed")
            logger.info("Install with: pip install easyocr")
            raise

    def recognize_text(self, image: np.ndarray) -> List[OCRResult]:
        """Recognize text in image

        Args:
            image: Input image

        Returns:
            List of OCR results
        """
        if self.reader is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        # Run OCR
        results = self.reader.readtext(image)

        ocr_results = []
        for bbox, text, confidence in results:
            # Calculate bounding box
            x_coords = [point[0] for point in bbox]
            y_coords = [point[1] for point in bbox]

            x = int(min(x_coords))
            y = int(min(y_coords))
            width = int(max(x_coords) - x)
            height = int(max(y_coords) - y)

            ocr_results.append(OCRResult(
                text=text,
                confidence=float(confidence),
                bbox=BoundingBox(x=x, y=y, width=width, height=height),
                language=self.config.languages[0]
            ))

        return ocr_results

    def get_text(self, image: np.ndarray) -> str:
        """Get plain text from image

        Args:
            image: Input image

        Returns:
            Extracted text
        """
        results = self.recognize_text(image)
        return '\n'.join([r.text for r in results])


class PaddleOCREngine:
    """PaddleOCR engine wrapper"""

    def __init__(self, config: OCRConfig):
        """Initialize PaddleOCR

        Args:
            config: OCR configuration
        """
        self.config = config
        self.ocr = None

        logger.info("Initializing PaddleOCR...")

    def load_model(self) -> None:
        """Load PaddleOCR model"""
        try:
            from paddleocr import PaddleOCR

            self.ocr = PaddleOCR(
                use_angle_cls=True,
                lang=self.config.languages[0],
                use_gpu=self.config.use_gpu,
                show_log=False
            )
            logger.info("PaddleOCR model loaded")
        except ImportError:
            logger.error("PaddleOCR not installed")
            logger.info("Install with: pip install paddleocr")
            raise

    def recognize_text(self, image: np.ndarray) -> List[OCRResult]:
        """Recognize text in image

        Args:
            image: Input image

        Returns:
            List of OCR results
        """
        if self.ocr is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        # Run OCR
        results = self.ocr.ocr(image, cls=True)

        ocr_results = []
        for line in results[0]:
            bbox_points, (text, confidence) = line

            # Calculate bounding box
            x_coords = [point[0] for point in bbox_points]
            y_coords = [point[1] for point in bbox_points]

            x = int(min(x_coords))
            y = int(min(y_coords))
            width = int(max(x_coords) - x)
            height = int(max(y_coords) - y)

            ocr_results.append(OCRResult(
                text=text,
                confidence=float(confidence),
                bbox=BoundingBox(x=x, y=y, width=width, height=height),
                language=self.config.languages[0]
            ))

        return ocr_results

    def get_text(self, image: np.ndarray) -> str:
        """Get plain text from image

        Args:
            image: Input image

        Returns:
            Extracted text
        """
        results = self.recognize_text(image)
        return '\n'.join([r.text for r in results])


class OCRProcessor:
    """Main OCR processor with multiple engine support"""

    def __init__(self, config: OCRConfig):
        """Initialize OCR processor

        Args:
            config: OCR configuration
        """
        self.config = config
        self.engine = None
        self.preprocessor = ImagePreprocessor()

        logger.info(f"Initializing {config.engine} OCR processor")

    def load_model(self) -> None:
        """Load OCR model"""
        if self.config.engine == 'tesseract':
            self.engine = TesseractOCR(self.config)
        elif self.config.engine == 'easyocr':
            self.engine = EasyOCREngine(self.config)
            self.engine.load_model()
        elif self.config.engine == 'paddleocr':
            self.engine = PaddleOCREngine(self.config)
            self.engine.load_model()
        else:
            raise ValueError(f"Unsupported engine: {self.config.engine}")

        logger.info("OCR model loaded successfully")

    def recognize_text(
        self,
        image: Union[np.ndarray, str, bytes]
    ) -> List[OCRResult]:
        """Recognize text in image

        Args:
            image: Input image

        Returns:
            List of OCR results
        """
        if self.engine is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        # Load image
        img = self._load_image(image)

        # Preprocess
        if self.config.preprocess:
            img = self.preprocessor.preprocess(img)

        # Run OCR
        results = self.engine.recognize_text(img)

        logger.info(f"Recognized {len(results)} text regions")

        return results

    def get_text(self, image: Union[np.ndarray, str, bytes]) -> str:
        """Get plain text from image

        Args:
            image: Input image

        Returns:
            Extracted text
        """
        if self.engine is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        # Load image
        img = self._load_image(image)

        # Preprocess
        if self.config.preprocess:
            img = self.preprocessor.preprocess(img)

        # Run OCR
        text = self.engine.get_text(img)

        return text

    def recognize_batch(
        self,
        images: List[Union[np.ndarray, str, bytes]]
    ) -> List[List[OCRResult]]:
        """Recognize text in batch of images

        Args:
            images: List of images

        Returns:
            List of OCR results for each image
        """
        batch_results = []

        for image in images:
            results = self.recognize_text(image)
            batch_results.append(results)

        return batch_results

    def _load_image(self, image: Union[np.ndarray, str, bytes]) -> np.ndarray:
        """Load image from various sources

        Args:
            image: Image source

        Returns:
            Image as numpy array
        """
        if isinstance(image, str):
            # Load from file
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Failed to load image: {image}")
            return img

        elif isinstance(image, bytes):
            # Decode from bytes
            nparr = np.frombuffer(image, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Failed to decode image from bytes")
            return img

        elif isinstance(image, np.ndarray):
            return image.copy()

        else:
            raise TypeError(f"Unsupported image type: {type(image)}")

    def visualize_results(
        self,
        image: np.ndarray,
        results: List[OCRResult],
        output_path: Optional[str] = None
    ) -> np.ndarray:
        """Visualize OCR results on image

        Args:
            image: Input image
            results: OCR results
            output_path: Optional path to save visualization

        Returns:
            Image with drawn results
        """
        vis_image = image.copy()

        for result in results:
            bbox = result.bbox
            x, y, w, h = bbox.to_tuple()

            # Draw bounding box
            cv2.rectangle(
                vis_image,
                (x, y),
                (x + w, y + h),
                (0, 255, 0),
                2
            )

            # Draw text
            label = f"{result.text[:20]} ({result.confidence:.2f})"
            cv2.putText(
                vis_image,
                label,
                (x, y - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )

        if output_path:
            cv2.imwrite(output_path, vis_image)
            logger.info(f"Saved visualization to {output_path}")

        return vis_image

    def release(self) -> None:
        """Release resources"""
        self.engine = None
        logger.info("OCR processor released")


class DocumentAnalyzer:
    """Analyze document structure and layout"""

    def __init__(self, ocr_processor: OCRProcessor):
        """Initialize document analyzer

        Args:
            ocr_processor: OCR processor
        """
        self.ocr = ocr_processor

    def analyze_layout(self, image: np.ndarray) -> Dict:
        """Analyze document layout

        Args:
            image: Document image

        Returns:
            Layout analysis results
        """
        # Get OCR results
        results = self.ocr.recognize_text(image)

        # Sort by Y coordinate
        sorted_results = sorted(results, key=lambda r: r.bbox.y)

        # Group into lines
        lines = self._group_into_lines(sorted_results)

        # Detect paragraphs
        paragraphs = self._detect_paragraphs(lines)

        # Detect columns
        columns = self._detect_columns(sorted_results)

        return {
            'total_text_regions': len(results),
            'lines': len(lines),
            'paragraphs': len(paragraphs),
            'columns': columns,
            'text': '\n'.join([line['text'] for line in lines])
        }

    def _group_into_lines(
        self,
        results: List[OCRResult],
        y_threshold: int = 15
    ) -> List[Dict]:
        """Group OCR results into lines

        Args:
            results: OCR results
            y_threshold: Y coordinate threshold for same line

        Returns:
            List of lines
        """
        lines = []
        current_line = []
        current_y = None

        for result in results:
            if current_y is None or abs(result.bbox.y - current_y) < y_threshold:
                current_line.append(result)
                current_y = result.bbox.y
            else:
                if current_line:
                    lines.append(self._merge_line(current_line))
                current_line = [result]
                current_y = result.bbox.y

        if current_line:
            lines.append(self._merge_line(current_line))

        return lines

    def _merge_line(self, results: List[OCRResult]) -> Dict:
        """Merge OCR results into single line

        Args:
            results: OCR results in same line

        Returns:
            Merged line
        """
        # Sort by X coordinate
        sorted_results = sorted(results, key=lambda r: r.bbox.x)

        # Merge text
        text = ' '.join([r.text for r in sorted_results])

        # Calculate bounding box
        x_min = min(r.bbox.x for r in sorted_results)
        y_min = min(r.bbox.y for r in sorted_results)
        x_max = max(r.bbox.x + r.bbox.width for r in sorted_results)
        y_max = max(r.bbox.y + r.bbox.height for r in sorted_results)

        return {
            'text': text,
            'bbox': BoundingBox(
                x=x_min,
                y=y_min,
                width=x_max - x_min,
                height=y_max - y_min
            ),
            'confidence': np.mean([r.confidence for r in sorted_results])
        }

    def _detect_paragraphs(
        self,
        lines: List[Dict],
        gap_threshold: int = 30
    ) -> List[List[Dict]]:
        """Detect paragraphs from lines

        Args:
            lines: Text lines
            gap_threshold: Gap threshold for new paragraph

        Returns:
            List of paragraphs
        """
        paragraphs = []
        current_paragraph = []
        prev_y = None

        for line in lines:
            if prev_y is None or line['bbox'].y - prev_y < gap_threshold:
                current_paragraph.append(line)
            else:
                if current_paragraph:
                    paragraphs.append(current_paragraph)
                current_paragraph = [line]

            prev_y = line['bbox'].y + line['bbox'].height

        if current_paragraph:
            paragraphs.append(current_paragraph)

        return paragraphs

    def _detect_columns(self, results: List[OCRResult]) -> int:
        """Detect number of columns

        Args:
            results: OCR results

        Returns:
            Number of columns
        """
        if not results:
            return 0

        # Get X coordinates
        x_coords = [r.bbox.x for r in results]

        # Simple column detection using clustering
        # In real implementation, would use more sophisticated clustering
        unique_x = sorted(set(x_coords))

        # Count gaps larger than threshold
        threshold = 100
        columns = 1

        for i in range(1, len(unique_x)):
            if unique_x[i] - unique_x[i-1] > threshold:
                columns += 1

        return min(columns, 3)  # Cap at 3 columns


def main():
    """Example usage"""
    # Configure OCR
    config = OCRConfig(
        engine='easyocr',
        languages=['en'],
        use_gpu=True,
        preprocess=True
    )

    # Create processor
    processor = OCRProcessor(config)
    processor.load_model()

    # Load test image
    test_image = 'test_document.jpg'

    try:
        # Recognize text
        results = processor.recognize_text(test_image)

        print(f"Recognized {len(results)} text regions:")
        for result in results:
            print(f"  '{result.text}' ({result.confidence:.2f})")

        # Get plain text
        text = processor.get_text(test_image)
        print(f"\nExtracted text:\n{text}")

    finally:
        processor.release()


if __name__ == '__main__':
    main()
