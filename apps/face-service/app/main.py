from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from .recognizer import enroll_face, recognize_face, verify_face
from .liveness import verify_liveness_simple
from .detector import detect_faces, _app, is_recognition_available
import os
import base64

app = FastAPI(title="EduTech Face Service", version="1.0.0")


class EnrollRequest(BaseModel):
    person_id: str
    school_id: str
    image: str


class RecognizeRequest(BaseModel):
    image: str
    school_id: str


class VerifyRequest(BaseModel):
    person_id: str
    school_id: str
    image: str


class DetectRequest(BaseModel):
    image: str


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": _app is not None,
        "recognition_available": is_recognition_available(),
        "gpu": False,
    }


@app.post("/detect")
async def detect(req: DetectRequest):
    try:
        image_bytes = base64.b64decode(req.image)
        faces = detect_faces(image_bytes)
        if not faces:
            return {"face_detected": False, "bbox": None, "score": 0, "message": "No face detected"}
        best = max(faces, key=lambda f: f["det_score"])
        return {
            "face_detected": True,
            "bbox": best["bbox"],
            "score": round(best["det_score"], 4),
            "message": "Face detected",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/enroll")
async def enroll(req: EnrollRequest):
    try:
        result = enroll_face(req.person_id, req.school_id, req.image)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recognize")
async def recognize(req: RecognizeRequest):
    try:
        image_bytes = base64.b64decode(req.image)
        faces = detect_faces(image_bytes)
        if not faces:
            return {"personId": None, "confidence": 0, "liveness_score": 0, "message": "No face detected"}

        best = max(faces, key=lambda f: f["det_score"])
        liveness = verify_liveness_simple(image_bytes, kps=best.get("kps"))

        result = recognize_face(req.image, req.school_id)
        result["liveness_score"] = liveness["score"]
        result["liveness_methods"] = liveness["methods"]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/verify")
async def verify(req: VerifyRequest):
    try:
        result = verify_face(req.person_id, req.school_id, req.image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
