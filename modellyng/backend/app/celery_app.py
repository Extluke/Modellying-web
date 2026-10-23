import os
from pathlib import Path
from dotenv import load_dotenv
from celery import Celery

# Load .env file from modellyng/backend/.env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6381/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://127.0.0.1:6381/1")

celery_app = Celery(
    "modellyng_pipeline",
    broker=REDIS_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["app.pipeline.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Jakarta",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,                 # Idempotency requirement: ack only after task completes
    worker_prefetch_multiplier=1,        # Fair distribution among workers
    task_reject_on_worker_lost=True,     # Re-queue if worker crashes
    task_time_limit=900,                 # 15 minutes max per paper
    task_soft_time_limit=840,
)
