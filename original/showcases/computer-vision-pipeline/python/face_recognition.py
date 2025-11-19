"""
Face Recognition with Deep Learning

This module provides comprehensive face recognition capabilities using
state-of-the-art deep learning models including FaceNet, ArcFace, and dlib.

Features:
- Face detection (MTCNN, RetinaFace, Dlib)
- Face alignment and preprocessing
- Face embedding extraction
- Face verification and identification
- Anti-spoofing detection
- Age and gender estimation
- Expression recognition
- Face database management
"""

import numpy as np
import cv2
from typing import List, Tuple, Dict, Optional, Union
from dataclasses import dataclass
from pathlib import Path
import pickle
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class FaceLandmarks:
    """Face landmarks (5-point or 68-point)"""
    left_eye: Tuple[float, float]
    right_eye: Tuple[float, float]
    nose: Tuple[float, float]
    left_mouth: Tuple[float, float]
    right_mouth: Tuple[float, float]


@dataclass
class FaceDetection:
    """Face detection result"""
    bbox: Tuple[int, int, int, int]  # (x, y, width, height)
    confidence: float
    landmarks: FaceLandmarks

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'bbox': {
                'x': int(self.bbox[0]),
                'y': int(self.bbox[1]),
                'width': int(self.bbox[2]),
                'height': int(self.bbox[3])
            },
            'confidence': float(self.confidence),
            'landmarks': {
                'left_eye': self.landmarks.left_eye,
                'right_eye': self.landmarks.right_eye,
                'nose': self.landmarks.nose,
                'left_mouth': self.landmarks.left_mouth,
                'right_mouth': self.landmarks.right_mouth
            }
        }


@dataclass
class FaceEmbedding:
    """Face embedding vector"""
    vector: np.ndarray
    model: str

    def __post_init__(self):
        """Normalize embedding vector"""
        norm = np.linalg.norm(self.vector)
        if norm > 0:
            self.vector = self.vector / norm


@dataclass
class FaceAttributes:
    """Face attributes (age, gender, expression, etc.)"""
    age: int
    gender: str
    gender_confidence: float
    expression: str
    expression_confidence: float
    is_live: bool
    liveness_confidence: float


class FaceDetectorConfig:
    """Face detector configuration"""
    def __init__(
        self,
        model: str = 'retinaface',
        min_face_size: int = 40,
        confidence_threshold: float = 0.9,
        use_gpu: bool = True
    ):
        self.model = model
        self.min_face_size = min_face_size
        self.confidence_threshold = confidence_threshold
        self.use_gpu = use_gpu


class FaceDetector:
    """Face detector with multiple backend support"""

    def __init__(self, config: FaceDetectorConfig):
        """Initialize face detector

        Args:
            config: Detector configuration
        """
        self.config = config
        self.detector = None

        logger.info(f"Initializing {config.model} face detector")

    def load_model(self) -> None:
        """Load face detection model"""
        try:
            if self.config.model == 'mtcnn':
                self._load_mtcnn()
            elif self.config.model == 'retinaface':
                self._load_retinaface()
            elif self.config.model == 'dlib':
                self._load_dlib()
            else:
                raise ValueError(f"Unsupported detector: {self.config.model}")

            logger.info("Face detector loaded successfully")

        except Exception as e:
            logger.error(f"Failed to load face detector: {e}")
            raise

    def _load_mtcnn(self) -> None:
        """Load MTCNN detector"""
        try:
            from mtcnn import MTCNN
            self.detector = MTCNN(
                min_face_size=self.config.min_face_size,
                device='cuda:0' if self.config.use_gpu else 'cpu'
            )
        except ImportError:
            logger.error("MTCNN not installed")
            logger.info("Install with: pip install mtcnn-pytorch")
            raise

    def _load_retinaface(self) -> None:
        """Load RetinaFace detector"""
        try:
            from retinaface import RetinaFace
            self.detector = RetinaFace(
                gpu_id=0 if self.config.use_gpu else -1
            )
        except ImportError:
            logger.error("RetinaFace not installed")
            logger.info("Install with: pip install retinaface-pytorch")
            raise

    def _load_dlib(self) -> None:
        """Load Dlib detector"""
        try:
            import dlib
            self.detector = dlib.get_frontal_face_detector()
            self.predictor = dlib.shape_predictor('shape_predictor_68_face_landmarks.dat')
        except ImportError:
            logger.error("Dlib not installed")
            logger.info("Install with: pip install dlib")
            raise

    def detect_faces(self, image: np.ndarray) -> List[FaceDetection]:
        """Detect faces in image

        Args:
            image: Input image (RGB)

        Returns:
            List of face detections
        """
        if self.detector is None:
            raise RuntimeError("Detector not loaded. Call load_model() first.")

        if self.config.model == 'mtcnn':
            return self._detect_mtcnn(image)
        elif self.config.model == 'retinaface':
            return self._detect_retinaface(image)
        elif self.config.model == 'dlib':
            return self._detect_dlib(image)

        return []

    def _detect_mtcnn(self, image: np.ndarray) -> List[FaceDetection]:
        """Detect faces using MTCNN"""
        detections = self.detector.detect_faces(image)

        results = []
        for det in detections:
            if det['confidence'] < self.config.confidence_threshold:
                continue

            bbox = det['box']
            keypoints = det['keypoints']

            landmarks = FaceLandmarks(
                left_eye=tuple(keypoints['left_eye']),
                right_eye=tuple(keypoints['right_eye']),
                nose=tuple(keypoints['nose']),
                left_mouth=tuple(keypoints['mouth_left']),
                right_mouth=tuple(keypoints['mouth_right'])
            )

            results.append(FaceDetection(
                bbox=(bbox[0], bbox[1], bbox[2], bbox[3]),
                confidence=det['confidence'],
                landmarks=landmarks
            ))

        return results

    def _detect_retinaface(self, image: np.ndarray) -> List[FaceDetection]:
        """Detect faces using RetinaFace"""
        detections = self.detector.detect_faces(image)

        results = []
        for face_id, det in detections.items():
            if det['score'] < self.config.confidence_threshold:
                continue

            bbox = det['facial_area']
            landmarks_dict = det['landmarks']

            landmarks = FaceLandmarks(
                left_eye=tuple(landmarks_dict['left_eye']),
                right_eye=tuple(landmarks_dict['right_eye']),
                nose=tuple(landmarks_dict['nose']),
                left_mouth=tuple(landmarks_dict['mouth_left']),
                right_mouth=tuple(landmarks_dict['mouth_right'])
            )

            results.append(FaceDetection(
                bbox=(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]),
                confidence=det['score'],
                landmarks=landmarks
            ))

        return results

    def _detect_dlib(self, image: np.ndarray) -> List[FaceDetection]:
        """Detect faces using Dlib"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        faces = self.detector(gray, 1)

        results = []
        for face in faces:
            # Get landmarks
            shape = self.predictor(gray, face)

            # Extract 5-point landmarks from 68-point
            landmarks = FaceLandmarks(
                left_eye=(shape.part(36).x, shape.part(36).y),
                right_eye=(shape.part(45).x, shape.part(45).y),
                nose=(shape.part(30).x, shape.part(30).y),
                left_mouth=(shape.part(48).x, shape.part(48).y),
                right_mouth=(shape.part(54).x, shape.part(54).y)
            )

            results.append(FaceDetection(
                bbox=(face.left(), face.top(), face.width(), face.height()),
                confidence=1.0,  # Dlib doesn't provide confidence
                landmarks=landmarks
            ))

        return results

    def release(self) -> None:
        """Release detector resources"""
        self.detector = None
        logger.info("Face detector released")


class FaceRecognizerConfig:
    """Face recognizer configuration"""
    def __init__(
        self,
        model: str = 'arcface',
        embedding_size: int = 512,
        use_gpu: bool = True
    ):
        self.model = model
        self.embedding_size = embedding_size
        self.use_gpu = use_gpu


class FaceRecognizer:
    """Face recognizer with multiple model support"""

    def __init__(self, config: FaceRecognizerConfig):
        """Initialize face recognizer

        Args:
            config: Recognizer configuration
        """
        self.config = config
        self.model = None

        logger.info(f"Initializing {config.model} face recognizer")

    def load_model(self) -> None:
        """Load face recognition model"""
        try:
            if self.config.model == 'facenet':
                self._load_facenet()
            elif self.config.model == 'arcface':
                self._load_arcface()
            elif self.config.model == 'dlib':
                self._load_dlib_recognizer()
            else:
                raise ValueError(f"Unsupported model: {self.config.model}")

            logger.info("Face recognizer loaded successfully")

        except Exception as e:
            logger.error(f"Failed to load face recognizer: {e}")
            raise

    def _load_facenet(self) -> None:
        """Load FaceNet model"""
        try:
            from facenet_pytorch import InceptionResnetV1
            import torch

            self.model = InceptionResnetV1(pretrained='vggface2')
            self.model.eval()

            if self.config.use_gpu and torch.cuda.is_available():
                self.model = self.model.cuda()

        except ImportError:
            logger.error("FaceNet not installed")
            logger.info("Install with: pip install facenet-pytorch")
            raise

    def _load_arcface(self) -> None:
        """Load ArcFace model"""
        try:
            import insightface
            self.model = insightface.app.FaceAnalysis()
            self.model.prepare(ctx_id=0 if self.config.use_gpu else -1)

        except ImportError:
            logger.error("InsightFace not installed")
            logger.info("Install with: pip install insightface")
            raise

    def _load_dlib_recognizer(self) -> None:
        """Load Dlib face recognizer"""
        try:
            import dlib
            self.model = dlib.face_recognition_model_v1('dlib_face_recognition_resnet_model_v1.dat')

        except ImportError:
            logger.error("Dlib not installed")
            raise

    def extract_embedding(
        self,
        image: np.ndarray,
        face: FaceDetection
    ) -> FaceEmbedding:
        """Extract face embedding

        Args:
            image: Input image
            face: Face detection

        Returns:
            Face embedding
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        # Align face
        aligned_face = self._align_face(image, face)

        # Extract embedding
        if self.config.model == 'facenet':
            embedding = self._extract_facenet(aligned_face)
        elif self.config.model == 'arcface':
            embedding = self._extract_arcface(aligned_face)
        elif self.config.model == 'dlib':
            embedding = self._extract_dlib(aligned_face)
        else:
            raise ValueError(f"Unsupported model: {self.config.model}")

        return FaceEmbedding(vector=embedding, model=self.config.model)

    def _align_face(
        self,
        image: np.ndarray,
        face: FaceDetection,
        output_size: Tuple[int, int] = (112, 112)
    ) -> np.ndarray:
        """Align face using landmarks

        Args:
            image: Input image
            face: Face detection
            output_size: Output image size

        Returns:
            Aligned face image
        """
        # Reference points for alignment (eyes and nose)
        src_pts = np.array([
            list(face.landmarks.left_eye),
            list(face.landmarks.right_eye),
            list(face.landmarks.nose)
        ], dtype=np.float32)

        # Destination points (standard positions)
        dst_pts = np.array([
            [38, 48],  # left eye
            [74, 48],  # right eye
            [56, 70]   # nose
        ], dtype=np.float32)

        # Calculate affine transformation
        transform_matrix = cv2.getAffineTransform(src_pts, dst_pts)

        # Warp image
        aligned = cv2.warpAffine(
            image,
            transform_matrix,
            output_size,
            flags=cv2.INTER_LINEAR
        )

        return aligned

    def _extract_facenet(self, face_image: np.ndarray) -> np.ndarray:
        """Extract embedding using FaceNet"""
        import torch
        from torchvision import transforms

        # Preprocess
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
        ])

        face_tensor = transform(face_image).unsqueeze(0)

        if self.config.use_gpu:
            face_tensor = face_tensor.cuda()

        # Extract embedding
        with torch.no_grad():
            embedding = self.model(face_tensor)

        return embedding.cpu().numpy().flatten()

    def _extract_arcface(self, face_image: np.ndarray) -> np.ndarray:
        """Extract embedding using ArcFace"""
        embedding = self.model.get(face_image)[0].embedding
        return embedding

    def _extract_dlib(self, face_image: np.ndarray) -> np.ndarray:
        """Extract embedding using Dlib"""
        import dlib

        # Convert to RGB
        face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)

        # Get face descriptor
        face_descriptor = self.model.compute_face_descriptor(face_rgb)

        return np.array(face_descriptor)

    def compare_faces(
        self,
        embedding1: FaceEmbedding,
        embedding2: FaceEmbedding
    ) -> Tuple[float, bool]:
        """Compare two face embeddings

        Args:
            embedding1: First face embedding
            embedding2: Second face embedding

        Returns:
            (distance, is_match) tuple
        """
        # Calculate cosine distance
        distance = self._cosine_distance(embedding1.vector, embedding2.vector)

        # Determine if match (threshold depends on model)
        threshold = 0.6 if self.config.model == 'arcface' else 0.7
        is_match = distance < threshold

        return distance, is_match

    def _cosine_distance(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine distance between vectors"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        cosine_similarity = dot_product / (norm1 * norm2)
        cosine_distance = 1 - cosine_similarity

        return float(cosine_distance)

    def release(self) -> None:
        """Release model resources"""
        self.model = None
        logger.info("Face recognizer released")


class FaceDatabase:
    """Face database for storing and searching embeddings"""

    def __init__(self, database_path: str):
        """Initialize face database

        Args:
            database_path: Path to database file
        """
        self.database_path = Path(database_path)
        self.faces: Dict[str, List[FaceEmbedding]] = {}

    def load(self) -> None:
        """Load database from file"""
        if self.database_path.exists():
            with open(self.database_path, 'rb') as f:
                data = pickle.load(f)
                self.faces = data
                logger.info(f"Loaded {len(self.faces)} identities from database")
        else:
            logger.info("Database file not found, starting with empty database")

    def save(self) -> None:
        """Save database to file"""
        self.database_path.parent.mkdir(parents=True, exist_ok=True)

        with open(self.database_path, 'wb') as f:
            pickle.dump(self.faces, f)

        logger.info(f"Saved database with {len(self.faces)} identities")

    def add_face(self, identity: str, embedding: FaceEmbedding) -> None:
        """Add face to database

        Args:
            identity: Person identity
            embedding: Face embedding
        """
        if identity not in self.faces:
            self.faces[identity] = []

        self.faces[identity].append(embedding)
        logger.info(f"Added face for {identity} (total: {len(self.faces[identity])})")

    def find_match(
        self,
        query_embedding: FaceEmbedding,
        threshold: float = 0.6
    ) -> Optional[Tuple[str, float]]:
        """Find matching face in database

        Args:
            query_embedding: Query face embedding
            threshold: Distance threshold for matching

        Returns:
            (identity, distance) tuple or None if no match
        """
        best_match = None
        best_distance = float('inf')

        for identity, embeddings in self.faces.items():
            for embedding in embeddings:
                # Calculate distance
                distance = self._cosine_distance(
                    query_embedding.vector,
                    embedding.vector
                )

                if distance < best_distance:
                    best_distance = distance
                    best_match = identity

        if best_match and best_distance < threshold:
            return best_match, best_distance

        return None

    def _cosine_distance(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine distance"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        cosine_similarity = dot_product / (norm1 * norm2)
        return 1 - cosine_similarity

    def get_identities(self) -> List[str]:
        """Get all identities in database"""
        return list(self.faces.keys())

    def remove_identity(self, identity: str) -> bool:
        """Remove identity from database

        Args:
            identity: Identity to remove

        Returns:
            True if removed, False if not found
        """
        if identity in self.faces:
            del self.faces[identity]
            logger.info(f"Removed {identity} from database")
            return True

        return False

    def clear(self) -> None:
        """Clear all faces from database"""
        self.faces.clear()
        logger.info("Database cleared")


class FaceAttributeAnalyzer:
    """Analyze face attributes (age, gender, expression, liveness)"""

    def __init__(self, use_gpu: bool = True):
        """Initialize attribute analyzer

        Args:
            use_gpu: Use GPU acceleration
        """
        self.use_gpu = use_gpu
        self.models = {}

    def load_models(self) -> None:
        """Load all attribute models"""
        try:
            # Load DeepFace models for attributes
            from deepface import DeepFace
            self.models['deepface'] = DeepFace

            logger.info("Attribute analyzer loaded successfully")

        except ImportError:
            logger.error("DeepFace not installed")
            logger.info("Install with: pip install deepface")
            raise

    def analyze(
        self,
        image: np.ndarray,
        face: FaceDetection
    ) -> FaceAttributes:
        """Analyze face attributes

        Args:
            image: Input image
            face: Face detection

        Returns:
            Face attributes
        """
        # Crop face region
        x, y, w, h = face.bbox
        face_img = image[y:y+h, x:x+w]

        # Analyze using DeepFace
        analysis = self.models['deepface'].analyze(
            face_img,
            actions=['age', 'gender', 'emotion'],
            enforce_detection=False
        )

        # Extract attributes
        age = analysis[0]['age']
        gender = analysis[0]['dominant_gender']
        gender_conf = analysis[0]['gender'][gender]
        emotion = analysis[0]['dominant_emotion']
        emotion_conf = analysis[0]['emotion'][emotion]

        # Liveness detection (simplified)
        is_live, liveness_conf = self._detect_liveness(face_img)

        return FaceAttributes(
            age=int(age),
            gender=gender,
            gender_confidence=gender_conf / 100.0,
            expression=emotion,
            expression_confidence=emotion_conf / 100.0,
            is_live=is_live,
            liveness_confidence=liveness_conf
        )

    def _detect_liveness(self, face_image: np.ndarray) -> Tuple[bool, float]:
        """Simple liveness detection

        Args:
            face_image: Face image

        Returns:
            (is_live, confidence) tuple
        """
        # Simplified liveness detection based on image quality
        # Real implementation would use specialized models

        # Check image sharpness
        gray = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Check color variation
        color_std = np.std(face_image)

        # Simple heuristic
        is_live = laplacian_var > 50 and color_std > 20
        confidence = min(1.0, (laplacian_var + color_std) / 200)

        return is_live, confidence


def main():
    """Example usage"""
    # Configure detector
    detector_config = FaceDetectorConfig(
        model='retinaface',
        confidence_threshold=0.9,
        use_gpu=True
    )

    # Configure recognizer
    recognizer_config = FaceRecognizerConfig(
        model='arcface',
        embedding_size=512,
        use_gpu=True
    )

    # Create detector and recognizer
    detector = FaceDetector(detector_config)
    recognizer = FaceRecognizer(recognizer_config)

    detector.load_model()
    recognizer.load_model()

    # Load test image
    image = cv2.imread('test_face.jpg')
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    try:
        # Detect faces
        faces = detector.detect_faces(image_rgb)
        print(f"Detected {len(faces)} face(s)")

        # Extract embeddings
        for i, face in enumerate(faces):
            embedding = recognizer.extract_embedding(image_rgb, face)
            print(f"Face {i+1}: embedding shape {embedding.vector.shape}")

    finally:
        detector.release()
        recognizer.release()


if __name__ == '__main__':
    main()
