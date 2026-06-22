from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import Session

from classes.user import User
from classes.chat import Chat
from classes.message import Message

chat_bp = Blueprint("chat", __name__, url_prefix="/api")


def _get_db():
    from routing import db_session
    return db_session


@chat_bp.route("/chats", methods=["GET"])
@jwt_required()
def list_chats():
    user_id = int(get_jwt_identity())
    session: Session = _get_db()
    chats = session.query(Chat).filter(
        (Chat.id_coach == user_id) | (Chat.id_cust == user_id)
    ).all()

    results = []
    for c in chats:
        coach = session.query(User).filter_by(id=c.id_coach).first()
        customer = session.query(User).filter_by(id=c.id_cust).first()
        last_msg = session.query(Message).filter_by(chat_id=c.id).order_by(
            Message.timestamp.desc()
        ).first()
        results.append({
            "id": c.id,
            "coach": {"id": coach.id, "name": coach.name} if coach else None,
            "customer": {"id": customer.id, "name": customer.name} if customer else None,
            "msg_num": c.msg_num,
            "last_message": last_msg.to_dict() if last_msg else None,
        })
    return jsonify(results), 200


@chat_bp.route("/chats/<int:chat_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(chat_id):
    user_id = int(get_jwt_identity())
    session: Session = _get_db()
    chat = session.query(Chat).filter_by(id=chat_id).first()
    if not chat:
        return jsonify({"error": "Chat not found"}), 404

    if user_id != chat.id_coach and user_id != chat.id_cust:
        return jsonify({"error": "Access denied"}), 403

    messages = session.query(Message).filter_by(chat_id=chat_id).order_by(
        Message.timestamp
    ).all()
    return jsonify([m.to_dict() for m in messages]), 200


@chat_bp.route("/chats/<int:chat_id>/messages", methods=["POST"])
@jwt_required()
def send_message(chat_id):
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "Message text required"}), 400

    session: Session = _get_db()
    chat = session.query(Chat).filter_by(id=chat_id).first()
    if not chat:
        return jsonify({"error": "Chat not found"}), 404

    if user_id != chat.id_coach and user_id != chat.id_cust:
        return jsonify({"error": "Access denied"}), 403

    msg = chat.new_msg(user_id, data["text"].strip())
    session.commit()
    return jsonify(msg.to_dict()), 201


@chat_bp.route("/chats", methods=["POST"])
@jwt_required()
def create_chat():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or not data.get("coach_id"):
        return jsonify({"error": "coach_id required"}), 400

    coach_id = data["coach_id"]
    session: Session = _get_db()

    coach = session.query(User).filter_by(id=coach_id, is_coach=True).first()
    if not coach:
        return jsonify({"error": "Coach not found"}), 404

    if user_id == coach_id:
        return jsonify({"error": "Cannot chat with yourself"}), 400

    customer_id = user_id

    existing = session.query(Chat).filter_by(
        id_coach=coach_id, id_cust=customer_id
    ).first()
    if existing:
        return jsonify({"id": existing.id}), 200

    chat = Chat(id_coach=coach_id, id_cust=customer_id)
    session.add(chat)
    session.commit()
    return jsonify({"id": chat.id}), 201
