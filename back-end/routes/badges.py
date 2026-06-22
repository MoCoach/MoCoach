from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import Session

from classes.badge import Badge
from classes.user import User

badges_bp = Blueprint("badges", __name__, url_prefix="/api")


def _get_db():
    from routing import db_session
    return db_session


@badges_bp.route("/badges/award", methods=["POST"])
@jwt_required()
def award_badge():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    receiver_id = data.get("receiver_id")
    name = data.get("name", "").strip()
    icon = data.get("icon")
    description = data.get("description")

    if not receiver_id:
        return jsonify({"error": "receiver_id required"}), 400
    if not name:
        return jsonify({"error": "Badge name required"}), 400

    if user_id == receiver_id:
        return jsonify({"error": "Cannot award badge to yourself"}), 400

    session: Session = _get_db()
    receiver = session.query(User).filter_by(id=receiver_id).first()
    if not receiver:
        return jsonify({"error": "Receiver not found"}), 404

    try:
        badge = Badge(name=name, giver_id=user_id, receiver_id=receiver_id,
                      icon=icon, description=description)
    except (TypeError, ValueError) as e:
        return jsonify({"error": str(e)}), 400

    session.add(badge)
    session.commit()
    return jsonify(badge.to_dict()), 201


@badges_bp.route("/badges", methods=["GET"])
@jwt_required()
def list_badges():
    user_id = int(get_jwt_identity())
    session: Session = _get_db()
    received = session.query(Badge).filter_by(receiver_id=user_id).all()
    given = session.query(Badge).filter_by(giver_id=user_id).all()
    return jsonify({
        "received": [b.to_dict() for b in received],
        "given": [b.to_dict() for b in given],
    }), 200


@badges_bp.route("/badges/user/<int:target_id>", methods=["GET"])
def list_user_badges(target_id):
    session: Session = _get_db()
    received = session.query(Badge).filter_by(receiver_id=target_id).all()
    return jsonify([b.to_dict() for b in received]), 200
