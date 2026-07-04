from flask import Blueprint, jsonify, session
from services.firestore_service import list_audit_logs

audit_logs_bp = Blueprint("audit_logs", __name__)


@audit_logs_bp.route("/api/audit-logs", methods=["GET"])
def get_audit_logs():
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    if session["role"] != "admin":
        return jsonify({"message": "Forbidden"}), 403

    logs = list_audit_logs()

    return jsonify(logs)