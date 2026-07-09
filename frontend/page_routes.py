"""Front-end HTML page routes."""

import os

from flask import jsonify, send_from_directory


FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")


def register_routes(app):
    @app.route("/")
    def home():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/all-coaches.html")
    def all_coaches():
        return send_from_directory(FRONTEND_DIR, "all-coaches.html")

    @app.route("/coach-register.html")
    def coach_register():
        return send_from_directory(FRONTEND_DIR, "coach-register.html")

    @app.route("/coach-landing.html")
    def coach_landing():
        return send_from_directory(FRONTEND_DIR, "coach-landing.html")

    @app.route("/admin.html")
    def admin_page():
        return send_from_directory(FRONTEND_DIR, "admin.html")

    @app.route("/js/<path:filename>")
    def serve_js(filename):
        return send_from_directory(os.path.join(FRONTEND_DIR, "js"), filename)

    @app.route("/css/<path:filename>")
    def serve_css(filename):
        return send_from_directory(os.path.join(FRONTEND_DIR, "css"), filename)

    @app.route("/assets/<path:filename>")
    def serve_assets(filename):
        return send_from_directory(os.path.join(FRONTEND_DIR, "assets"), filename)

    @app.route("/components/<path:filename>")
    def serve_components(filename):
        return send_from_directory(os.path.join(FRONTEND_DIR, "components"), filename)
