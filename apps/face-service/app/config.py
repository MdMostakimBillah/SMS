import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://edutech:password@localhost:5432/edutech")
FACE_ENCRYPTION_KEY = os.environ.get("FACE_ENCRYPTION_KEY", "")
MODEL_DIR = os.environ.get("MODEL_DIR", os.path.join(os.path.dirname(__file__), "models"))
DETECTION_MODEL = os.environ.get("DETECTION_MODEL", "buffalo_l")
RECOGNITION_MODEL = os.environ.get("RECOGNITION_MODEL", "arcface_r100_v1")
MATCH_THRESHOLD = float(os.environ.get("MATCH_THRESHOLD", "0.4"))
DEVICE_ID = int(os.environ.get("DEVICE_ID", "0"))
