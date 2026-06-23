from flask import Flask, jsonify, request
from flask_httpauth import HTTPBasicAuth
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

from classes.manage_db import Db_Management, DbError

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "super-secret"
auth = HTTPBasicAuth()
jwt = JWTManager(app)

db = Db_Management()


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    email = data.get("email")
    name = data.get("name")
    password = data.get("password")
    if not email or not name or not password:
        return jsonify({"msg": "Email, name and password are required"}), 400

    try:
        result = db.register_user(
            email       = email,
            name        = name,
            password    = password,
            is_coach    = data.get("is_coach", False),
            description = data.get("description"),
            tags_data   = data.get("tags", []),
            phone       = data.get("phone"),
        )
        return jsonify(result), 201
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"msg": "Email and password are required"}), 400

    try:
        user = db.authenticate(email, password)
        token = create_access_token(identity=user.id)
        return jsonify(access_token=token), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/profile", methods=["PUT"])
@jwt_required()
def edit_profile():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    try:
        kwargs = dict(
            user_id     = get_jwt_identity(),
            name        = data.get("name"),
            description = data.get("description"),
            tags_data   = data.get("tags"),
        )
        if "email" in data:
            kwargs["email"] = data["email"]
        if "phone" in data:
            kwargs["phone"] = data["phone"]
        result = db.update_profile(**kwargs)
        return jsonify(result), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/password", methods=["PUT"])
@jwt_required()
def edit_password():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    old_pwd = data.get("old_password")
    new_pwd = data.get("new_password")
    if not old_pwd or not new_pwd:
        return jsonify({"msg": "Old password and new password are required"}), 400

    try:
        db.change_password(get_jwt_identity(), old_pwd, new_pwd)
        return jsonify({"msg": "Password updated"}), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/coach/<int:coach_id>", methods=["GET"])
def get_coach(coach_id):
    try:
        return jsonify(db.get_coach(coach_id)), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/coaches", methods=["GET"])
def list_coaches():
    return jsonify(db.list_coaches()), 200


@app.route("/coaches/tag/<tag_name>", methods=["GET"])
def list_coaches_by_tag(tag_name):
    return jsonify(db.list_coaches_by_tag(tag_name)), 200


@app.route("/chats", methods=["GET"])
@jwt_required()
def list_chats():
    return jsonify(db.list_user_chats(get_jwt_identity())), 200


@app.route("/chat/<int:chat_id>", methods=["GET"])
@jwt_required()
def get_chat_messages(chat_id):
    try:
        return jsonify(db.get_chat_messages(chat_id, get_jwt_identity())), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/profile/<int:profile_id>", methods=["GET"])
@jwt_required()
def get_profile(profile_id):
    try:
        return jsonify(db.get_user_profile(profile_id, get_jwt_identity())), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/message", methods=["POST"])
@jwt_required()
def send_message():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    recipient_id = data.get("recipient_id")
    text = data.get("text")
    if recipient_id is None or not text:
        return jsonify({"msg": "recipient_id and text are required"}), 400

    try:
        result = db.send_message(get_jwt_identity(), recipient_id, text)
        return jsonify(result), 201
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


if __name__ == '__main__':
    app.run(debug=True, port=5000)
