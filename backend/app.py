from flask import Flask
from flask_cors import CORS

from config import (
    ADMIN_DEFAULT_PASSWORD,
    EMPLOYEE_DEFAULT_PASSWORD,
    SECRET_KEY,
)
from routes.audit_logs import audit_logs_bp
from routes.auth import auth_bp
from routes.documents import documents_bp
from routes.health import health_bp
from routes.notifications import notifications_bp
from services.firestore_service import seed_default_users


def create_app():
    if not SECRET_KEY:
        raise RuntimeError(
            "FLASK_SECRET_KEY is not configured"
        )

    app = Flask(__name__)

    app.secret_key = SECRET_KEY

    seed_default_users(
        admin_password=ADMIN_DEFAULT_PASSWORD,
        employee_password=EMPLOYEE_DEFAULT_PASSWORD,
    )

    app.config.update(
        SESSION_COOKIE_SAMESITE="None",
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_HTTPONLY=True,
    )

    CORS(
        app,
        supports_credentials=True,
        origins=[
            "https://storage.googleapis.com",
        ],
    )

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(audit_logs_bp)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8080,
    )
