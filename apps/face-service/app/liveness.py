import cv2
import numpy as np


def calculate_ear(landmarks, eye_indices):
    if landmarks is None or len(landmarks) < max(eye_indices) + 1:
        return 1.0
    pts = landmarks[eye_indices]
    vertical1 = np.linalg.norm(pts[1] - pts[5])
    vertical2 = np.linalg.norm(pts[2] - pts[4])
    horizontal = np.linalg.norm(pts[0] - pts[3])
    if horizontal == 0:
        return 1.0
    return (vertical1 + vertical2) / (2.0 * horizontal)


def check_blink(kps):
    if kps is None or len(kps) < 68:
        return False

    left_eye = [36, 37, 38, 39, 40, 41]
    right_eye = [42, 43, 44, 45, 46, 47]

    left_ear = calculate_ear(kps, left_eye)
    right_ear = calculate_ear(kps, right_eye)
    avg_ear = (left_ear + right_ear) / 2.0

    return avg_ear < 0.2


def verify_liveness_simple(image_bytes: bytes, kps=None) -> dict:
    score = 0.0
    methods = []

    if kps is not None and check_blink(kps):
        score += 0.5
        methods.append("blink")

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is not None:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        if blur_score > 100:
            score += 0.3
            methods.append("sharpness")

        h, w = img.shape[:2]
        if h > 0 and w > 0:
            score += 0.2
            methods.append("format")

    return {
        "passed": score >= 0.5,
        "score": min(score, 1.0),
        "methods": methods,
    }
