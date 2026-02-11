import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from .routes.violations import violations_bp
from .routes.auth import auth_bp
from .routes.challans import challans_bp


def create_app():
    """
    Flask application factory.

    Responsibilities:
    - Configure static files pointing to `frontend/static`.
    - Register API blueprints (currently: /api/violations).
    - Expose simple health check and dashboard route.
    """
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    frontend_dir = os.path.join(base_dir, "frontend")
    static_dir = os.path.join(frontend_dir, "static")
    snapshots_dir = os.path.join(base_dir, "data", "snapshots")

    app = Flask(__name__, static_folder=static_dir)
    CORS(app)  # Allow JS frontend to call APIs if needed from other origins

    # -------------------------- Health & Home --------------------------
    @app.route("/health")
    def health_check():
        return {"status": "ok", "message": "Traffic Violation Backend running"}

    @app.route("/")
    def home():
        # Redirect users to the dashboard page description
        return jsonify(
            {
                "message": "Traffic Violation System Backend is running.",
                "dashboard_url": "/dashboard",
                "api_violations": "/api/violations",
            }
        )

    # -------------------------- Dashboard ------------------------------
    @app.route("/dashboard")
    def dashboard():
        """
        Serve the main HTML dashboard.
        """
        return send_from_directory(frontend_dir, "dashboard.html")

    # -------------------------- Snapshots -------------------------------
    @app.route("/snapshots/<path:filename>")
    def snapshots(filename: str):
        """
        Serve saved violation snapshot images from `data/snapshots`.
        """
        return send_from_directory(snapshots_dir, filename)

    # -------------------------- Blueprints -----------------------------
    app.register_blueprint(violations_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(challans_bp)

    return app


if __name__ == "__main__":
    # For local development only; in production use a proper WSGI server.
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
