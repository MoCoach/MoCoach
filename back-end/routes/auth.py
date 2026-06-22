from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from sqlalchemy.orm import Session

from classes.user import User
from classes.tag import Tag

auth_bp = Blueprint("auth", __name__, url_prefix="/api")


def _get_db():
    from routing import db_session
    return db_session


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")
    is_coach = data.get("is_coach", False)

    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not password or len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    session: Session = _get_db()
    existing = session.query(User).filter_by(email=email).first()
    if existing:
        return jsonify({"error": "Email already registered"}), 409

    nickname = data.get("nickname")
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    zip_code = data.get("zip_code")
    phone = data.get("phone")
    profile_photo = data.get("profile_photo")
    description = data.get("description")
    tags_data = data.get("tags")

    tags = []
    if tags_data:
        for t in tags_data:
            if isinstance(t, dict):
                tag = session.query(Tag).filter_by(name=t.get("name")).first()
                if tag:
                    tags.append(tag)
            elif isinstance(t, str):
                tag = session.query(Tag).filter_by(name=t).first()
                if tag:
                    tags.append(tag)

    name = data.get("name") or f"{first_name or ''} {last_name or ''}".strip() or email.split("@")[0]

    user = User(
        name=name, pwd=password, is_coach=is_coach,
        description=description, tags=tags if tags else None,
        nickname=nickname, first_name=first_name, last_name=last_name,
        email=email, zip_code=zip_code, phone=phone,
        profile_photo=profile_photo,
    )
    session.add(user)
    session.flush()

    if is_coach and data.get("price_per_hour"):
        user.coach.price_per_hour = float(data["price_per_hour"])

    if is_coach and data.get("photos"):
        user.coach.photos = ",".join(data["photos"])

    session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    session: Session = _get_db()
    user = session.query(User).filter_by(email=email).first()
    if not user or not user.verify_pwd(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200
