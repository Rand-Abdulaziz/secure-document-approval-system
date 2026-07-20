from flask import Blueprint, jsonify, request, session

from services.firestore_service import (
    create_audit_log,
    create_document,
    create_notification,
    get_document_by_id,
    get_user_download_count,
    reserve_user_download,
    list_documents,
    update_document_access_settings,
    update_document_status,
)
from services.storage_service import (
    generate_download_url,
    generate_preview_url,
    upload_file,
)

documents_bp = Blueprint("documents", __name__)


@documents_bp.route("/api/documents", methods=["POST"])
def upload_document_metadata():
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    if "file" not in request.files:
        return jsonify({"message": "No file provided"}), 400

    file = request.files["file"]

    title = request.form.get("title")
    description = request.form.get("description")
    allow_download = request.form.get("allow_download") == "true"
    download_limit = int(request.form.get("download_limit", 0))

    storage_data = upload_file(file, file.filename)

    document = create_document(
        {
            "title": title,
            "description": description,
            "original_filename": file.filename,
            "uploaded_by": session["username"],
            "uploaded_by_role": session["role"],
            "allow_download": allow_download,
            "download_limit": download_limit,
            **storage_data,
        }
    )

    create_audit_log(
        username=session["username"],
        action="CREATE_DOCUMENT",
        document_id=document["id"],
        status="SUCCESS",
        details=f"Created document {document['original_filename']}",
        ip_address=request.remote_addr,
    )

    return jsonify(document), 201


@documents_bp.route("/api/documents", methods=["GET"])
def get_documents():
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    username = session["username"]
    documents = list_documents()

    for document in documents:
        document["user_download_count"] = get_user_download_count(
            document["id"],
            username,
        )

    return jsonify(documents)


@documents_bp.route("/api/documents/<document_id>/settings", methods=["PATCH"])
def update_document_settings(document_id):
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    if session["role"] != "admin":
        return jsonify({"message": "Forbidden"}), 403

    data = request.get_json() or {}

    document = update_document_access_settings(
        document_id=document_id,
        allow_download=data.get("allow_download", False),
        download_limit=data.get("download_limit", 0),
    )

    create_audit_log(
        username=session["username"],
        action="UPDATE_DOCUMENT_SETTINGS",
        document_id=document_id,
        status="SUCCESS",
        details=f"Updated access settings for {document['original_filename']}",
        ip_address=request.remote_addr,
    )

    return jsonify(document)


@documents_bp.route("/api/documents/<document_id>/preview", methods=["GET"])
def preview_document(document_id):
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    document = get_document_by_id(document_id)

    if not document:
        return jsonify({"message": "Document not found"}), 404

    if document.get("status") != "approved":
        return jsonify({"message": "Document is not approved"}), 403

    if not document.get("storage_path"):
        return jsonify({"message": "Document file is not available"}), 400

    preview_url = generate_preview_url(document["storage_path"])

    create_audit_log(
        username=session["username"],
        action="PREVIEW_DOCUMENT",
        document_id=document["id"],
        status="SUCCESS",
        details=f"Previewed document {document['original_filename']}",
        ip_address=request.remote_addr,
    )

    return jsonify({"preview_url": preview_url})


@documents_bp.route("/api/documents/<document_id>/approve", methods=["POST"])
def approve_document(document_id):
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    if session["role"] != "admin":
        return jsonify({"message": "Forbidden"}), 403

    document, error = update_document_status(document_id, "approved")

    if error:
        return jsonify({"message": error}), 400

    create_notification(
        user_id=document["uploaded_by"],
        document_id=document["id"],
        notification_type="approved",
        title="Document approved",
        message=f"Your document {document['original_filename']} has been approved.",
    )

    create_audit_log(
        username=session["username"],
        action="APPROVE_DOCUMENT",
        document_id=document["id"],
        status="SUCCESS",
        details=f"Approved document {document['original_filename']}",
        ip_address=request.remote_addr,
    )

    return jsonify(
        {
            "message": "Document approved",
            "document": document,
        }
    )


@documents_bp.route("/api/documents/<document_id>/reject", methods=["POST"])
def reject_document(document_id):
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    if session["role"] != "admin":
        return jsonify({"message": "Forbidden"}), 403

    data = request.get_json() or {}
    reason = data.get("reason", "No reason provided")

    document, error = update_document_status(
        document_id,
        "rejected",
        reason,
    )

    if error:
        return jsonify({"message": error}), 400

    create_notification(
        user_id=document["uploaded_by"],
        document_id=document["id"],
        notification_type="rejected",
        title="Document rejected",
        message=f"Your document {document['original_filename']} has been rejected.",
    )

    create_audit_log(
        username=session["username"],
        action="REJECT_DOCUMENT",
        document_id=document["id"],
        status="SUCCESS",
        details=f"Rejected document {document['original_filename']}",
        ip_address=request.remote_addr,
    )

    return jsonify(
        {
            "message": "Document rejected",
            "document": document,
        }
    )


@documents_bp.route("/api/documents/<document_id>/download", methods=["GET"])
def download_document(document_id):
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    document = get_document_by_id(document_id)

    if not document:
        return jsonify({"message": "Document not found"}), 404

    if document.get("status") != "approved":
        return jsonify({"message": "Document is not approved"}), 403

    if not document.get("allow_download"):
        return jsonify(
            {"message": "Download is not allowed for this document"}
        ), 403

    if not document.get("storage_path"):
        return jsonify({"message": "Document file is not available"}), 400

    username = session["username"]
    download_limit = document.get("download_limit", 0)

    download_reservation = reserve_user_download(
        document_id,
        username,
        download_limit,
    )

    if not download_reservation["allowed"]:
        return jsonify(
            {
                "message": "Download limit reached",
                "download_count": download_reservation["download_count"],
                "download_limit": download_limit,
            }
        ), 403

    download_url = generate_download_url(document["storage_path"])

    create_audit_log(
        username=username,
        action="DOWNLOAD_DOCUMENT",
        document_id=document["id"],
        status="SUCCESS",
        details=f"Downloaded document {document['original_filename']}",
        ip_address=request.remote_addr,
    )

    return jsonify(
        {
            "download_url": download_url,
            "download_count": download_reservation["download_count"],
            "download_limit": download_limit,
        }
    )
