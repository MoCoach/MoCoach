from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session

from classes.user import User
from classes.tag import Tag

coaches_bp = Blueprint("coaches", __name__, url_prefix="/api")


def _get_db():
    from routing import db_session
    return db_session


@coaches_bp.route("/coaches", methods=["GET"])
def list_coaches():
    session: Session = _get_db()
    tag_name = request.args.get("tag")
    q = request.args.get("q")

    query = session.query(User).filter_by(is_coach=True)

    if tag_name:
        tag = session.query(Tag).filter_by(name=tag_name).first()
        if tag:
            query = query.join(User.coach).filter(
                User.coach.has(tags=[tag])
            )
        else:
            return jsonify([]), 200

    if q:
        like = f"%{q}%"
        query = query.join(User.coach).filter(
            User.name.ilike(like) | User.coach.has(description=like)
        )

    users = query.all()
    results = []
    for u in users:
        d = u.to_dict()
        d.pop("password", None)
        results.append(d)
    return jsonify(results), 200


@coaches_bp.route("/coaches/<int:coach_id>", methods=["GET"])
def get_coach(coach_id):
    session: Session = _get_db()
    user = session.query(User).filter_by(id=coach_id, is_coach=True).first()
    if not user:
        return jsonify({"error": "Coach not found"}), 404
    d = user.to_dict()
    d.pop("password", None)
    return jsonify(d), 200


@coaches_bp.route("/search", methods=["GET"])
def search_coaches():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([]), 200

    session: Session = _get_db()
    like = f"%{q}%"
    users = session.query(User).filter_by(is_coach=True).join(User.coach).filter(
        User.name.ilike(like) | User.coach.has(description=like)
    ).all()

    results = []
    for u in users:
        d = u.to_dict()
        d.pop("password", None)
        results.append(d)
    return jsonify(results), 200


@coaches_bp.route("/tags", methods=["GET"])
def list_tags():
    session: Session = _get_db()
    tags = session.query(Tag).all()
    return jsonify([t.to_dict() for t in tags]), 200
