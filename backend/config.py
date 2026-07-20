import os

from dotenv import load_dotenv

load_dotenv()


SECRET_KEY = os.getenv("FLASK_SECRET_KEY")

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")

GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")

REGION = os.getenv("REGION", "us-central1")

ADMIN_DEFAULT_PASSWORD = os.getenv("ADMIN_DEFAULT_PASSWORD")

EMPLOYEE_DEFAULT_PASSWORD = os.getenv("EMPLOYEE_DEFAULT_PASSWORD")
