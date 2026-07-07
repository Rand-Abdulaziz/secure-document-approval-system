import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
REGION = os.getenv("REGION", "me-central2")