resource "google_cloud_run_v2_service" "backend" {
  name     = var.service_name
  location = var.region

  deletion_protection = false

  depends_on = [
    google_project_service.run_api,
    google_artifact_registry_repository.docker_repo,
    google_secret_manager_secret_iam_member.flask_secret_accessor,
    google_secret_manager_secret_iam_member.admin_password_accessor,
    google_secret_manager_secret_iam_member.employee_password_accessor,
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
        name = "FLASK_SECRET_KEY"

        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.flask_secret_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "ADMIN_DEFAULT_PASSWORD"

        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.admin_default_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "EMPLOYEE_DEFAULT_PASSWORD"

        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.employee_default_password.secret_id
            version = "latest"
          }
        }
      }
    }
  }
}


resource "google_cloud_run_v2_service_iam_member" "public_access" {
  name     = google_cloud_run_v2_service.backend.name
  location = google_cloud_run_v2_service.backend.location

  role   = "roles/run.invoker"
  member = "allUsers"
}
