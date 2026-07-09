"""Single Flask application serving both the API and front-end."""

import os

from flask import Flask
from flask_jwt_extended import JWTManager

from alembic.config import Config as AlembicConfig
from alembic.command import upgrade as alembic_upgrade

from backend.classes.manage_db import Db_Management
from backend.api_routes import register_routes as register_api
from frontend.page_routes import register_routes as register_pages


app = Flask(__name__,
    static_folder="backend/static",
    static_url_path="/static")

app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret")
JWTManager(app)

db_url = os.environ.get("MYSQL_URL")
if db_url:
    if db_url.startswith("mysql://"):
        db_url = "mysql+pymysql://" + db_url[len("mysql://"):]
db = Db_Management(db_url)

alembic_cfg = AlembicConfig(os.path.join(os.path.dirname(__file__), "alembic.ini"))
alembic_cfg.set_main_option("sqlalchemy.url", db.db_url)
alembic_upgrade(alembic_cfg, "head")

register_api(app, db)
register_pages(app)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5678))
    app.run(debug=True, port=port)
