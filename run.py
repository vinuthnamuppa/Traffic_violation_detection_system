"""
Entry point for running the Flask backend.

Usage (from the `traffic_violation_system` folder):
    python run.py
"""

from backend.app import create_app


app = create_app()


if __name__ == "__main__":
    # Debug server for development
    app.run(host="0.0.0.0", port=5000, debug=True)


