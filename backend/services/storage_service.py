import uuid
from datetime import timedelta

import google.auth
from google.auth.transport.requests import Request
from google.cloud import storage

from config import GCS_BUCKET_NAME


def get_storage_client():
    return storage.Client()


def get_signing_credentials():
    credentials, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    credentials.refresh(Request())

    return credentials.service_account_email, credentials.token


def upload_file(file, filename):
    if not GCS_BUCKET_NAME:
        raise RuntimeError("GCS_BUCKET_NAME is not configured")

    client = get_storage_client()
    bucket = client.bucket(GCS_BUCKET_NAME)

    safe_filename = f"{uuid.uuid4()}-{filename}"
    blob_name = f"documents/{safe_filename}"

    blob = bucket.blob(blob_name)

    blob.upload_from_file(
        file,
        content_type=file.content_type or "application/octet-stream",
    )

    return {
        "storage_provider": "gcs",
        "storage_path": blob_name,
        "bucket_name": GCS_BUCKET_NAME,
    }


def generate_preview_url(storage_path):
    client = get_storage_client()
    bucket = client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(storage_path)

    service_account_email, access_token = get_signing_credentials()

    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="GET",
        service_account_email=service_account_email,
        access_token=access_token,
    )


def generate_download_url(storage_path):
    client = get_storage_client()
    bucket = client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(storage_path)

    service_account_email, access_token = get_signing_credentials()

    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=10),
        method="GET",
        response_disposition="attachment",
        service_account_email=service_account_email,
        access_token=access_token,
    )
