"""Single Flask application serving both the API and front-end."""

import os
from datetime import timedelta

from flask import Flask
from flask_jwt_extended import JWTManager

from backend.classes.manage_db import Db_Management
from backend.api_routes import register_routes as register_api
from frontend.page_routes import register_routes as register_pages


app = Flask(__name__,
    static_folder="backend/static",
    static_url_path="/static")

app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
JWTManager(app)

db_url = os.environ.get("MYSQL_URL")
if db_url:
    db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)
db = Db_Management(db_url)

register_api(app, db)
register_pages(app)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5678))
    app.run(debug=True, port=port)
