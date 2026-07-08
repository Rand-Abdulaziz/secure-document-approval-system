resource "google_storage_bucket" "documents" {
  name                        = var.bucket_name
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true
}
resource "google_storage_bucket" "frontend" {
  name                        = "securedoc-frontend-${var.project_id}"
  location                    = var.region
  uniform_bucket_level_access = true

  website {
    main_page_suffix = "login.html"
    not_found_page   = "login.html"
  }
}
resource "google_storage_bucket_iam_member" "frontend_public" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}