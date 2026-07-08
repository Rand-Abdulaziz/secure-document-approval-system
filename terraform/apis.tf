resource "google_project_service" "run_api" {
  project = var.project_id
  service = "run.googleapis.com"
}


resource "google_project_service" "artifact_registry_api" {
  project = var.project_id
  service = "artifactregistry.googleapis.com"
}


resource "google_project_service" "firestore_api" {
  project = var.project_id
  service = "firestore.googleapis.com"
}


resource "google_project_service" "storage_api" {
  project = var.project_id
  service = "storage.googleapis.com"
}


resource "google_project_service" "iam_api" {
  project = var.project_id
  service = "iam.googleapis.com"
}


resource "google_project_service" "cloudbuild_api" {
  project = var.project_id
  service = "cloudbuild.googleapis.com"
}