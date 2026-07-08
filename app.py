"""Single Flask application serving both the API and front-end."""

import os
import sys

from flask import Flask
from flask_jwt_extended import JWTManager


# Add back-end and front-end directories to the module search path so that
# both can be imported without requiring a package rename.
_BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_BASE, "back-end"))
sys.path.insert(0, os.path.join(_BASE, "front-end"))

from classes.manage_db import Db_Management


app = Flask(__name__,
    static_folder="back-end/static",
    static_url_path="/static")

app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret")
JWTManager(app)

# Database connection from environment or default
db_url = os.environ.get("MYSQL_URL")
if db_url:
    db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)
db = Db_Management(db_url)

# Register routes from both modules
import api_routes
import page_routes
api_routes.register_routes(app, db)
page_routes.register_routes(app)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5678))
    app.run(debug=True, port=port)
