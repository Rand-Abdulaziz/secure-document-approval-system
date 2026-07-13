resource "google_artifact_registry_repository" "docker_repo" {

  location = var.region

  repository_id = "securedoc-repo"

  description = "Docker images for SecureDoc"

  format = "DOCKER"

}