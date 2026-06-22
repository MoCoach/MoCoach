from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import Session

from classes.user import User
from classes.tag import Tag
from classes.badge import Badge
from classes.chat import Chat

profile_bp = Blueprint("profile", __name__, url_prefix="/api")


def _get_db():
    from routing import db_session
    return db_session


@profile_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    session: Session = _get_db()
    user = session.query(User).filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    d = user.to_dict()
    d.pop("password", None)

    badges_received = session.query(Badge).filter_by(receiver_id=user_id).all()
    badges_given = session.query(Badge).filter_by(giver_id=user_id).all()
    d["badges_received"] = [b.to_dict() for b in badges_received]
    d["badges_given"] = [b.to_dict() for b in badges_given]

    return jsonify(d), 200


@profile_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    session: Session = _get_db()
    user = session.query(User).filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    tags_data = data.get("tags")
    tags = None
    if tags_data is not None and user.is_coach:
        tags = []
        for t in tags_data:
            if isinstance(t, dict):
                tag = session.query(Tag).filter_by(name=t.get("name")).first()
                if tag:
                    tags.append(tag)
            elif isinstance(t, str):
                tag = session.query(Tag).filter_by(name=t).first()
                if tag:
                    tags.append(tag)

    try:
        user.update_profile(
            name=data.get("name"),
            nickname=data.get("nickname"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            email=data.get("email"),
            zip_code=data.get("zip_code"),
            phone=data.get("phone"),
            profile_photo=data.get("profile_photo"),
            description=data.get("description"),
            tags=tags,
        )
    except (TypeError, ValueError) as e:
        return jsonify({"error": str(e)}), 400

    session.commit()
    d = user.to_dict()
    d.pop("password", None)
    return jsonify(d), 200
