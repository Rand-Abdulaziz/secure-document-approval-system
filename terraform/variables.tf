variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "me-central2"
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "securedoc-backend"
}

variable "bucket_name" {
  description = "Cloud Storage bucket name"
  type        = string
}

variable "container_image" {
  description = "Docker image URL for Cloud Run"
  type        = string
}

variable "flask_secret_key" {
  description = "Flask secret key"
  type        = string
  sensitive   = true
}