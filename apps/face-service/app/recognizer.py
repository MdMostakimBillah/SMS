import base64
import cv2
import numpy as np
from .detector import detect_faces
from .encrypt import encrypt_embedding, decrypt_embedding
from .database import get_school_embeddings, store_embedding
from .config import MATCH_THRESHOLD


def enroll_face(person_id: str, school_id: str, image_b64: str) -> dict:
    image_bytes = base64.b64decode(image_b64)
    faces = detect_faces(image_bytes)
    if not faces:
        raise ValueError("No face detected in image")

    best = max(faces, key=lambda f: f["det_score"])
    if best["det_score"] < 0.5:
        raise ValueError(f"Face detection confidence too low: {best['det_score']:.2f}")

    embedding = best["embedding"]
    encrypted = encrypt_embedding(embedding)

    embedding_id = store_embedding(person_id, school_id, encrypted)

    return {
        "embedding_id": embedding_id,
        "encrypted_embedding": encrypted,
        "det_score": best["det_score"],
    }


def recognize_face(image_b64: str, school_id: str) -> dict:
    image_bytes = base64.b64decode(image_b64)
    faces = detect_faces(image_bytes)
    if not faces:
        return {"personId": None, "confidence": 0, "liveness_score": 0, "message": "No face detected"}

    best = max(faces, key=lambda f: f["det_score"])
    if best["det_score"] < 0.3:
        return {"personId": None, "confidence": 0, "liveness_score": 0, "message": "Face quality too low"}

    query_embedding = best["embedding"]
    stored = get_school_embeddings(school_id)

    if not stored:
        return {"personId": None, "confidence": 0, "liveness_score": 0, "message": "No enrolled faces"}

    best_match = None
    best_distance = float("inf")

    for record in stored:
        try:
            stored_embedding = decrypt_embedding(record["embedding"])
            distance = float(np.linalg.norm(query_embedding - stored_embedding))
            if distance < best_distance:
                best_distance = distance
                best_match = record
        except Exception:
            continue

    if best_match and best_distance < MATCH_THRESHOLD:
        confidence = max(0.0, 1.0 - best_distance)
        return {
            "personId": best_match["person_id"],
            "personType": best_match["person_type"],
            "confidence": round(confidence, 4),
            "distance": round(best_distance, 4),
            "liveness_score": 1.0,
            "message": "Match found",
        }

    return {
        "personId": None,
        "confidence": 0,
        "liveness_score": 0,
        "message": f"No match (best distance: {best_distance:.4f})",
    }


def verify_face(person_id: str, school_id: str, image_b64: str) -> dict:
    image_bytes = base64.b64decode(image_b64)
    faces = detect_faces(image_bytes)
    if not faces:
        return {"match": False, "confidence": 0, "message": "No face detected"}

    best = max(faces, key=lambda f: f["det_score"])
    query_embedding = best["embedding"]

    stored = get_school_embeddings(school_id)
    for record in stored:
        if record["person_id"] != person_id:
            continue
        try:
            stored_embedding = decrypt_embedding(record["embedding"])
            distance = float(np.linalg.norm(query_embedding - stored_embedding))
            confidence = max(0.0, 1.0 - distance)
            return {
                "match": distance < MATCH_THRESHOLD,
                "confidence": round(confidence, 4),
                "distance": round(distance, 4),
            }
        except Exception:
            continue

    return {"match": False, "confidence": 0, "message": "No embedding found for person"}
