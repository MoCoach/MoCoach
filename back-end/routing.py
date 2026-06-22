import os
from uuid import uuid4
from werkzeug.utils import secure_filename

from flask import Flask, render_template, send_from_directory, request, jsonify
from flask_jwt_extended import JWTManager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

from config import DATABASE_URI, JWT_SECRET_KEY
from classes import Base

from routes.auth import auth_bp
from routes.coaches import coaches_bp
from routes.profile import profile_bp
from routes.chat import chat_bp
from routes.badges import badges_bp

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

engine = create_engine(DATABASE_URI, echo=False)
SessionFactory = sessionmaker(bind=engine)
db_session = scoped_session(SessionFactory)

app = Flask(__name__, static_folder="../front-end", static_url_path="", template_folder="../front-end")
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
jwt = JWTManager(app)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.register_blueprint(auth_bp)
app.register_blueprint(coaches_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(badges_bp)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/components/<path:filename>")
def serve_component(filename):
    return send_from_directory("../front-end/components", filename)


@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if file.filename == "" or not _allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400
    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid4().hex}.{ext}"
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    return jsonify({"url": f"/uploads/{filename}"}), 201


@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    from classes.manage_db import seed_database
    seed_database(db_session)
    app.run(debug=True, port=5000)
