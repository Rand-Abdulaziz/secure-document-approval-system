output "bucket_name" {
  value = google_storage_bucket.documents.name
}

output "cloud_run_url" {
  value = google_cloud_run_v2_service.backend.uri
}

output "cloud_run_service_account" {
  value = google_service_account.cloud_run_sa.email
}