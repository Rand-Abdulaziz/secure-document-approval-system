resource "google_cloud_run_v2_service" "backend" {

  name     = var.service_name
  location = var.region

  deletion_protection = false


  depends_on = [
    google_project_service.run_api,
    google_artifact_registry_repository.docker_repo
  ]


  template {

    service_account = google_service_account.cloud_run_sa.email


    containers {

      image = var.container_image


      ports {
        container_port = 8080
      }


      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }


      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.documents.name
      }


      env {
        name  = "REGION"
        value = var.region
      }


      env {
        name  = "FLASK_SECRET_KEY"
        value = var.flask_secret_key
      }

    }

  }

}



resource "google_cloud_run_v2_service_iam_member" "public_access" {

  name     = google_cloud_run_v2_service.backend.name
  location = google_cloud_run_v2_service.backend.location

  role = "roles/run.invoker"

  member = "allUsers"

}
