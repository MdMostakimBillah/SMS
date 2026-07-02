import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://edutech:password@localhost:5432/edutech")


def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def get_school_embeddings(school_id: str) -> list:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, person_id, person_type, embedding, model_version FROM face_embeddings WHERE school_id = %s",
                (school_id,),
            )
            return cur.fetchall()
    finally:
        conn.close()


def store_embedding(person_id: str, school_id: str, encrypted_embedding: str) -> str:
    import uuid
    embedding_id = str(uuid.uuid4())
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO face_embeddings (id, person_id, person_type, school_id, embedding, model_version)
                   VALUES (%s, %s, 'teacher', %s, decode(%s, 'base64'), 'arcface_r100_v1')
                   ON CONFLICT (person_id, school_id)
                   DO UPDATE SET embedding = decode(%s, 'base64'), updated_at = NOW()""",
                (embedding_id, person_id, school_id, encrypted_embedding, encrypted_embedding),
            )
            conn.commit()
            return embedding_id
    finally:
        conn.close()


def log_attendance(school_id: str, person_id: str, person_type: str, punch_type: str,
                   confidence: float, liveness_score: float = 0.0, ip_address: str = None) -> str:
    import uuid
    log_id = str(uuid.uuid4())
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO face_attendance_log (id, school_id, person_id, person_type, punch_type, confidence, liveness_score, ip_address)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (log_id, school_id, person_id, person_type, punch_type, confidence, liveness_score, ip_address),
            )
            conn.commit()
            return log_id
    finally:
        conn.close()
