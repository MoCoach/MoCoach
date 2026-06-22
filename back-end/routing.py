from flask import Flask, render_template, send_from_directory
from flask_jwt_extended import JWTManager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

from config import DATABASE_URI, JWT_SECRET_KEY
from classes import Base
from classes.user import User
from classes.coach import Coach
from classes.tag import Tag
from classes.chat import Chat
from classes.message import Message
from classes.badge import Badge

from routes.auth import auth_bp
from routes.coaches import coaches_bp
from routes.profile import profile_bp
from routes.chat import chat_bp
from routes.badges import badges_bp

engine = create_engine(DATABASE_URI, echo=False)
SessionFactory = sessionmaker(bind=engine)
db_session = scoped_session(SessionFactory)

app = Flask(__name__, static_folder="../front-end", static_url_path="", template_folder="../front-end")
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
jwt = JWTManager(app)

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


@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    from classes.manage_db import seed_database
    seed_database(db_session)
    app.run(debug=True, port=5000)
