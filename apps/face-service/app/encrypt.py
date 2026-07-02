import base64
import os
from cryptography.fernet import Fernet
from .config import FACE_ENCRYPTION_KEY

_key = FACE_ENCRYPTION_KEY
if not _key:
    _key = Fernet.generate_key().decode()
    print(f"[WARN] No FACE_ENCRYPTION_KEY set. Using generated key (NOT for production): {_key[:8]}...")

_fernet = Fernet(_key.encode() if isinstance(_key, str) else _key)


def encrypt_embedding(embedding) -> str:
    raw = embedding.tobytes()
    encrypted = _fernet.encrypt(raw)
    return base64.b64encode(encrypted).decode("utf-8")


def decrypt_embedding(encrypted_b64: str):
    import numpy as np
    encrypted = base64.b64decode(encrypted_b64)
    raw = _fernet.decrypt(encrypted)
    return numpy.frombuffer(raw, dtype=numpy.float32)
