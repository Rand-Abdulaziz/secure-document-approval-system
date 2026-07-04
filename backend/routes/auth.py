from flask import Blueprint, request, jsonify, session

auth_bp = Blueprint("auth", __name__)

USERS = {
    "admin": {
        "password": "123456",
        "role": "admin"
    },
    "employee": {
        "password": "123456",
        "role": "employee"
    }
}


@auth_bp.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    user = USERS.get(username)

    if not user or user["password"] != password:
        return jsonify({"message": "Invalid credentials"}), 401

    session["username"] = username
    session["role"] = user["role"]

    return jsonify(
        {
            "message": "Login successful",
            "role": user["role"]
        }
    )


@auth_bp.route("/api/session", methods=["GET"])
def get_session():

    if "username" not in session:
        return jsonify({
            "authenticated": False
        }), 401

    return jsonify({
        "authenticated": True,
        "username": session["username"],
        "role": session["role"]
    })


@auth_bp.route("/api/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "message": "Logged out successfully"
    })    