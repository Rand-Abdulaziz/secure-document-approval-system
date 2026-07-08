output "bucket_name" {
  value = google_storage_bucket.documents.name
}

output "artifact_registry_repository" {
  value = google_artifact_registry_repository.docker_repo.name
}

output "cloud_run_service_account" {
  value = google_service_account.cloud_run_sa.email
}