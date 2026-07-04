from flask import Blueprint, jsonify, session
from services.firestore_service import list_notifications_for_user, mark_notification_as_read

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/api/notifications", methods=["GET"])
def get_notifications():
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    notifications = list_notifications_for_user(session["username"])

    return jsonify(notifications)


@notifications_bp.route("/api/notifications/<notification_id>/read", methods=["POST"])
def read_notification(notification_id):
    if "username" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    notification = mark_notification_as_read(notification_id)

    return jsonify({
        "message": "Notification marked as read",
        "notification": notification
    })