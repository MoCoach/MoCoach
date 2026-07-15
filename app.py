"""Single Flask application serving both the API and front-end."""

import os
from datetime import timedelta

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from backend.classes.manage_db import Db_Management
from backend.api_routes import register_routes as register_api
from frontend.page_routes import register_routes as register_pages


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
