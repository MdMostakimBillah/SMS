from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from .recognizer import enroll_face, recognize_face, verify_face
from .liveness import verify_liveness_simple
from .detector import detect_faces
import os

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


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": True,
        "gpu": False,
    }


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
        image_bytes = __import__("base64").b64decode(req.image)
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
