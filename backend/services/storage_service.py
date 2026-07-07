import os
from datetime import timedelta
from google.cloud import storage
from config import GCS_BUCKET_NAME


def get_storage_client():
    return storage.Client()


def upload_file(file, filename):
    if not GCS_BUCKET_NAME:
        raise RuntimeError("GCS_BUCKET_NAME is not configured")

    client = get_storage_client()
    bucket = client.bucket(GCS_BUCKET_NAME)

    blob_name = f"documents/{filename}"
    blob = bucket.blob(blob_name)

    blob.upload_from_file(file, content_type=file.content_type)

    return {
        "storage_provider": "gcs",
        "storage_path": blob_name,
        "bucket_name": GCS_BUCKET_NAME,
    }


def generate_preview_url(storage_path):
    client = get_storage_client()
    bucket = client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(storage_path)

    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="GET",
    )


def generate_download_url(storage_path):
    client = get_storage_client()
    bucket = client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(storage_path)

    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=10),
        method="GET",
        response_disposition="attachment",
    )