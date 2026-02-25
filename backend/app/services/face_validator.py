"""
Face Validator
Validates that an uploaded photo contains exactly one human face
Uses OpenCV Haar Cascade classifier (no external API needed)
"""
import cv2
import numpy as np
import logging
import os

logger = logging.getLogger(__name__)

# Path to the Haar cascade XML file shipped with OpenCV
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"


def validate_face_photo(image_bytes: bytes) -> bool:
    """
    Check if the image contains exactly one face.
    
    Args:
        image_bytes: Raw image file bytes
        
    Returns:
        True if exactly one face is detected
        
    Raises:
        ValueError: If no face or multiple faces detected, or image is invalid
    """
    try:
        # Decode image from bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Invalid image file. Please upload a valid JPEG or PNG image.")

        # Convert to grayscale for face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Load the face detector
        face_cascade = cv2.CascadeClassifier(CASCADE_PATH)
        if face_cascade.empty():
            logger.error(f"Could not load Haar cascade from {CASCADE_PATH}")
            # If cascade fails to load, skip face validation rather than blocking
            logger.warning("Face validation skipped — cascade not available")
            return True

        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(60, 60),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        num_faces = len(faces)

        if num_faces == 0:
            raise ValueError(
                "No face detected in the photo. Please upload a clear face photo with good lighting."
            )
        
        if num_faces > 1:
            raise ValueError(
                f"Multiple faces ({num_faces}) detected. Please upload a photo with only your face."
            )

        logger.info("Face validation passed — exactly 1 face detected")
        return True

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Face validation error: {e}")
        raise ValueError(f"Could not process the image: {str(e)}")
