from flask import Blueprint, request, jsonify, session
from services.firestore_service import get_user_by_username, create_audit_log

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    user = get_user_by_username(username)

    if not user or user["password"] != password:
        create_audit_log(
            username=username,
            action="LOGIN_FAILED",
            document_id=None,
            status="FAILED",
            details="Invalid credentials",
            ip_address=request.remote_addr
        )

        return jsonify({"message": "Invalid credentials"}), 401

    session["username"] = username
    session["role"] = user["role"]

    create_audit_log(
        username=username,
        action="LOGIN_SUCCESS",
        document_id=None,
        status="SUCCESS",
        details="User logged in",
        ip_address=request.remote_addr
    )

    return jsonify({
        "message": "Login successful",
        "role": user["role"]
    })


@auth_bp.route("/api/session", methods=["GET"])
def get_session():
    if "username" not in session:
        return jsonify({"authenticated": False}), 401

    return jsonify({
        "authenticated": True,
        "username": session["username"],
        "role": session["role"]
    })


@auth_bp.route("/api/logout", methods=["POST"])
def logout():

    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    create_audit_log(
        username=session["username"],
        action="LOGOUT",
        document_id=None,
        status="SUCCESS",
        details="User logged out",
        ip_address=request.remote_addr
    )

    session.clear()

    return jsonify({
        "message": "Logged out successfully"
    })