"""Flask API entry point defining all REST endpoints."""

from flask import Flask, jsonify, request
from flask_httpauth import HTTPBasicAuth
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity,
)

from classes.manage_db import Db_Management, DbError

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "super-secret"
auth = HTTPBasicAuth()
jwt = JWTManager(app)

db = Db_Management()


# ------------------------------------------------------------------
# Availability checks
# ------------------------------------------------------------------

@app.route("/check-username/<username>", methods=["GET"])
def check_username(username):
    """Return whether a username is available."""
    return jsonify({"available": db.check_username_available(username)}), 200


@app.route("/check-email/<email>", methods=["GET"])
def check_email(email):
    """Return whether an email is available."""
    return jsonify({"available": db.check_email_available(email)}), 200


# ------------------------------------------------------------------
# Authentication
# ------------------------------------------------------------------

@app.route("/register", methods=["POST"])
def register():
    """Register a new user account."""
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    if not username or not email or not password:
        return jsonify({
            "msg": "Username, email and password are required"
        }), 400

    try:
        result = db.register_user(
            username    = username,
            email       = email,
            password    = password,
            name        = data.get("name"),
            is_coach    = data.get("is_coach", False),
            description = data.get("description"),
            tags_data   = data.get("tags", []),
            phone       = data.get("phone"),
            is_admin    = False,
        )
        return jsonify(result), 201
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/login", methods=["POST"])
def login():
    """Authenticate via email or username and return a JWT access token."""
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    login = data.get("login")
    password = data.get("password")
    if not login or not password:
        return jsonify({"msg": "Login and password are required"}), 400

    try:
        user = db.authenticate(login, password)
        token = create_access_token(identity=user.id)
        return jsonify(access_token=token), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


# ------------------------------------------------------------------
# Profile
# ------------------------------------------------------------------

@app.route("/profile", methods=["PUT"])
@jwt_required()
def edit_profile():
    """Update the authenticated user's profile."""
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    try:
        kwargs = dict(
            user_id     = get_jwt_identity(),
            description = data.get("description"),
            tags_data   = data.get("tags"),
        )
        if "name" in data:
            kwargs["name"] = data["name"]
        if "email" in data:
            kwargs["email"] = data["email"]
        if "phone" in data:
            kwargs["phone"] = data["phone"]
        if "username" in data:
            kwargs["username"] = data["username"]
        result = db.update_profile(**kwargs)
        return jsonify(result), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/password", methods=["PUT"])
@jwt_required()
def edit_password():
    """Change the authenticated user's password."""
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


@app.route("/profile/<int:profile_id>", methods=["GET"])
@jwt_required()
def get_profile(profile_id):
    """View a user's profile (visibility rules enforced)."""
    try:
        return jsonify(db.get_user_profile(profile_id, get_jwt_identity())), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/profile", methods=["DELETE"])
@jwt_required()
def delete_own_profile():
    """Delete the authenticated user's own account.

    The last remaining admin cannot delete their profile.
    Password confirmation is required.
    """
    data = request.get_json()
    if not data or not data.get("password"):
        return jsonify({"msg": "Password is required"}), 400

    try:
        result = db.delete_own_profile(get_jwt_identity(), data["password"])
        return jsonify(result), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


# ------------------------------------------------------------------
# Coach queries (public)
# ------------------------------------------------------------------

@app.route("/coach/<int:coach_id>", methods=["GET"])
def get_coach(coach_id):
    """Return public details for a specific coach."""
    try:
        return jsonify(db.get_coach(coach_id)), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/coaches", methods=["GET"])
def list_coaches():
    """Return all coaches."""
    return jsonify(db.list_coaches()), 200


@app.route("/coaches/tag/<tag_name>", methods=["GET"])
def list_coaches_by_tag(tag_name):
    """Return coaches filtered by tag name."""
    return jsonify(db.list_coaches_by_tag(tag_name)), 200


# ------------------------------------------------------------------
# Chat / Messages
# ------------------------------------------------------------------

@app.route("/chats", methods=["GET"])
@jwt_required()
def list_chats():
    """Return chats for the authenticated user.

    Users only see their own chats.  Admins may consult another
    user's chats via ``GET /user/<id>/chats``.
    """
    return jsonify(db.list_user_chats(get_jwt_identity())), 200


@app.route("/chat/<int:chat_id>", methods=["GET"])
@jwt_required()
def get_chat_messages(chat_id):
    """Return messages for a given chat.

    Admins see all messages including hidden ones.
    Non-admin users see only non-hidden messages they have access to.
    """
    try:
        return jsonify(db.get_chat_messages(chat_id, get_jwt_identity())), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/message", methods=["POST"])
@jwt_required()
def send_message():
    """Send a message to another user."""
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


@app.route("/message/<message_id>/hide", methods=["PUT"])
@jwt_required()
def hide_message(message_id):
    """Hide (soft-delete) one of your own messages.

    Only available to non-admin users.  The hidden message becomes
    invisible to all non-admin participants of the chat.
    """
    try:
        result = db.hide_message(get_jwt_identity(), message_id)
        return jsonify(result), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/message/<message_id>", methods=["DELETE"])
@jwt_required()
def delete_message(message_id):
    """Permanently delete any message (admin-only)."""
    try:
        result = db.delete_message(get_jwt_identity(), message_id)
        return jsonify(result), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


# ------------------------------------------------------------------
# Tag management
# ------------------------------------------------------------------

@app.route("/tag", methods=["POST"])
@jwt_required()
def create_tag():
    """Create a new tag (admin-only)."""
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    name = data.get("name")
    description = data.get("description")
    if not name or not description:
        return jsonify({"msg": "name and description are required"}), 400

    try:
        result = db.create_tag(get_jwt_identity(), name, description)
        return jsonify(result), 201
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


# ------------------------------------------------------------------
# Admin user management
# ------------------------------------------------------------------

@app.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    """List all non-admin users (admin-only)."""
    try:
        result = db.list_users(get_jwt_identity())
        return jsonify(result), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/user/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    """Delete a non-admin user (admin-only)."""
    try:
        result = db.delete_user(get_jwt_identity(), user_id)
        return jsonify(result), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/user/<int:user_id>/promote", methods=["PUT"])
@jwt_required()
def promote_user(user_id):
    """Promote a user to admin (admin-only, irreversible)."""
    try:
        result = db.promote_to_admin(get_jwt_identity(), user_id)
        return jsonify(result), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


@app.route("/user/<int:user_id>/chats", methods=["GET"])
@jwt_required()
def get_user_chats(user_id):
    """Return a specific user's chats (admin-only consultation)."""
    try:
        result = db.list_user_chats_as_admin(get_jwt_identity(), user_id)
        return jsonify(result), 200
    except DbError as e:
        return jsonify({"msg": e.message}), e.status_code


if __name__ == '__main__':
    app.run(debug=True, port=5000)
