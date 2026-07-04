from flask import Flask
from routes.health import health_bp
from routes.auth import auth_bp
from routes.documents import documents_bp
from routes.notifications import notifications_bp
from routes.audit_logs import audit_logs_bp

def create_app():
    app = Flask(__name__)
    
    app.secret_key = "dev-secret-key"
    
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(audit_logs_bp)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
