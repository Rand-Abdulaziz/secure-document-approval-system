resource "google_secret_manager_secret" "flask_secret_key" {
  project   = var.project_id
  secret_id = "securedoc-flask-secret-key"

  replication {
    auto {}
  }

  depends_on = [
    google_project_service.secret_manager_api
  ]
}


resource "google_secret_manager_secret" "admin_default_password" {
  project   = var.project_id
  secret_id = "securedoc-admin-default-password"

  replication {
    auto {}
  }

  depends_on = [
    google_project_service.secret_manager_api
  ]
}


resource "google_secret_manager_secret" "employee_default_password" {
  project   = var.project_id
  secret_id = "securedoc-employee-default-password"

  replication {
    auto {}
  }

  depends_on = [
    google_project_service.secret_manager_api
  ]
}


resource "google_secret_manager_secret_iam_member" "flask_secret_accessor" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.flask_secret_key.secret_id
  role      = "roles/secretmanager.secretAccessor"

  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}


resource "google_secret_manager_secret_iam_member" "admin_password_accessor" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.admin_default_password.secret_id
  role      = "roles/secretmanager.secretAccessor"

  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}


resource "google_secret_manager_secret_iam_member" "employee_password_accessor" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.employee_default_password.secret_id
  role      = "roles/secretmanager.secretAccessor"

  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}
