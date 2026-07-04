from flask import Blueprint, request, jsonify, session
from services.firestore_service import create_document, list_documents, update_document_status, create_notification, create_audit_log

documents_bp = Blueprint("documents", __name__)


@documents_bp.route("/api/documents", methods=["POST"])
def upload_document_metadata():
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.get_json()

    document = create_document({
        "original_filename": data.get("original_filename"),
        "uploaded_by": session["username"],
        "uploaded_by_role": session["role"],
        "allow_download": False,
        "download_limit": 0,
        "download_count": 0,
    })

    create_audit_log(
        username=session["username"],
        action="CREATE_DOCUMENT",
        document_id=document["id"],
        status="SUCCESS",
        details=f"Created document {document['original_filename']}",
        ip_address=request.remote_addr
    )
    

    return jsonify(document), 201


@documents_bp.route("/api/documents", methods=["GET"])
def get_documents():
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    documents = list_documents()
    return jsonify(documents)

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
        message=f"Your document {document['original_filename']} has been approved."
    )

    create_audit_log(
        username=session["username"],
        action="APPROVE_DOCUMENT",
        document_id=document["id"],
        status="SUCCESS",
        details=f"Approved document {document['original_filename']}",
        ip_address=request.remote_addr
    )

    return jsonify({
        "message": "Document approved",
        "document": document
    })


@documents_bp.route("/api/documents/<document_id>/reject", methods=["POST"])
def reject_document(document_id):
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    if session["role"] != "admin":
        return jsonify({"message": "Forbidden"}), 403

    data = request.get_json() or {}
    reason = data.get("reason", "No reason provided")

    document, error = update_document_status(document_id, "rejected", reason)

    if error:
        return jsonify({"message": error}), 400

    create_notification(
        user_id=document["uploaded_by"],
        document_id=document["id"],
        notification_type="rejected",
        title="Document rejected",
        message=f"Your document {document['original_filename']} has been rejected."
    )

    create_audit_log(
        username=session["username"],
        action="REJECT_DOCUMENT",
        document_id=document["id"],
        status="SUCCESS",
        details=f"Rejected document {document['original_filename']}",
        ip_address=request.remote_addr
    )

    return jsonify({
        "message": "Document rejected",
        "document": document
    })