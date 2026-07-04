from flask import Flask
from routes.health import health_bp
from routes.auth import auth_bp

def create_app():
    app = Flask(__name__)
    
    app.secret_key = "dev-secret-key"
    
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
