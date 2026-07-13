resource "google_service_account" "cloud_run_sa" {
  account_id   = "securedoc-cloud-run-sa"
  display_name = "SecureDoc Cloud Run Service Account"
}


resource "google_project_iam_member" "firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"

  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}


resource "google_storage_bucket_iam_member" "storage_object_admin" {

  bucket = google_storage_bucket.documents.name

  role = "roles/storage.objectAdmin"

  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}


resource "google_project_iam_member" "artifact_registry_reader" {

  project = var.project_id

  role = "roles/artifactregistry.reader"

  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"

}
resource "google_service_account_iam_member" "cloud_run_signer" {
  service_account_id = google_service_account.cloud_run_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}
