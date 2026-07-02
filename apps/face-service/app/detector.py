import cv2
import numpy as np
from insightface.app import FaceAnalysis
from .config import DETECTION_MODEL, DEVICE_ID, MODEL_DIR

_app = None


def get_app() -> FaceAnalysis:
    global _app
    if _app is None:
        _app = FaceAnalysis(
            name=DETECTION_MODEL,
            root=MODEL_DIR,
            providers=["CPUExecutionProvider"],
        )
        _app.prepare(ctx_id=DEVICE_ID, det_size=(640, 640))
        print(f"[Detector] InsightFace model '{DETECTION_MODEL}' loaded from {MODEL_DIR}")
    return _app


def detect_faces(image_bytes: bytes) -> list:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image")

    app = get_app()
    faces = app.get(img)
    return [
        {
            "bbox": f.bbox.tolist(),
            "embedding": f.embedding,
            "det_score": float(f.det_score),
            "kps": f.kps.tolist() if f.kps is not None else None,
        }
        for f in faces
    ]


def detect_faces_from_array(img: np.ndarray) -> list:
    app = get_app()
    faces = app.get(img)
    return [
        {
            "bbox": f.bbox.tolist(),
            "embedding": f.embedding,
            "det_score": float(f.det_score),
            "kps": f.kps.tolist() if f.kps is not None else None,
        }
        for f in faces
    ]
