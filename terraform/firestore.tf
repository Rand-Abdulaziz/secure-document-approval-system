resource "google_firestore_database" "default" {

  project = var.project_id

  name = "(default)"

  location_id = "eur3"

  type = "FIRESTORE_NATIVE"


  depends_on = [
    google_project_service.firestore_api
  ]
}