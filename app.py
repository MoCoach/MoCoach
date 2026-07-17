"""Single Flask application serving both the API and front-end."""

import os
import shutil
import logging
from datetime import timedelta

import cloudinary
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy import text

from backend.classes.manage_db import Db_Management
from backend.api_routes import register_routes as register_api
from frontend.page_routes import register_routes as register_pages

log = logging.getLogger(__name__)

app = Flask(__name__,
    static_folder="backend/static",
    static_url_path="/static")

jwt_secret = os.environ.get("JWT_SECRET_KEY")
if not jwt_secret:
    raise RuntimeError("JWT_SECRET_KEY environment variable is required")
app.config["JWT_SECRET_KEY"] = jwt_secret
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
JWTManager(app)

db_url = os.environ.get("MYSQL_URL")
if db_url:
    db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)
db = Db_Management(db_url)

# Configure Cloudinary
cloudinary_url = os.environ.get("CLOUDINARY_URL")
if cloudinary_url:
    cloudinary.config(secure=True)
    log.info("Cloudinary configured from CLOUDINARY_URL")
else:
    log.warning("CLOUDINARY_URL not set — images will use local filesystem only")

# Run DB migrations for new columns (safe to run repeatedly)
try:
    engine = db.engine
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_pic_url VARCHAR(500) NULL"))
            conn.commit()
            log.info("Added profile_pic_url column to users table")
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE coaches ADD COLUMN gallery_urls TEXT NULL"))
            conn.commit()
            log.info("Added gallery_urls column to coaches table")
        except Exception:
            pass
except Exception as e:
    log.warning(f"DB migration check failed (may already exist): {e}")

db.seed_admin()
db.seed_mock_conversations()

# Ensure upload directories exist (local fallback)
upload_base = db.UPLOAD_BASE
coach_pics_base = db.COACH_PICS_BASE
os.makedirs(os.path.join(upload_base, 'default'), exist_ok=True)
os.makedirs(coach_pics_base, exist_ok=True)

# Copy default profile picture to volume if missing
default_pic = os.path.join(upload_base, 'default', 'profile.jpg')
if not os.path.isfile(default_pic):
    bundled_default = os.path.join(
        os.path.dirname(__file__), 'backend', 'static', 'uploads',
        'profile_pics', 'default', 'profile.jpg'
    )
    if os.path.isfile(bundled_default):
        shutil.copy2(bundled_default, default_pic)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["300 per day", "75 per hour"],
    app=app,
)

register_api(app, db, limiter)
register_pages(app)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5678))
    app.run(debug=os.environ.get("FLASK_DEBUG", "0") == "1", port=port)
