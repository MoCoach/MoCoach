"""Flask API routes for all REST endpoints."""

import os

from typing import Any

from flask import Flask, jsonify, request, send_from_directory
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity,
)

from backend.classes.manage_db import DbError, Db_Management


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def register_routes(app: Flask, db: Db_Management, limiter) -> None:
    # ------------------------------------------------------------------
    # Availability checks
    # ------------------------------------------------------------------

    @app.get("/api/v1/check-username/<username>")
    def check_username(username: str) -> tuple:
        """Return whether a username is available."""
        return jsonify({"available": db.check_username_available(username)}), 200

    @app.get("/api/v1/check-email/<email>")
    def check_email(email: str) -> tuple:
        """Return whether an email is available."""
        return jsonify({"available": db.check_email_available(email)}), 200

    # ------------------------------------------------------------------
    # Authentication
    # ------------------------------------------------------------------

    @app.post("/api/v1/register")
    @limiter.limit("5/minute")
    def register() -> tuple:
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
                first_name  = data.get("first_name"),
                last_name   = data.get("last_name"),
                is_coach    = data.get("is_coach", False),
                description = data.get("description"),
                tags_data   = data.get("tags", []),
                phone       = data.get("phone"),
                is_admin    = False,
                city_id     = data.get("city_id"),
                price       = data.get("price"),
            )
            result["profile_pic"] = db.get_profile_pic_path(result["id"])
            return jsonify(result), 201
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.post("/api/v1/login")
    @limiter.limit("10/minute")
    def login() -> tuple:
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
            return jsonify(access_token=token, user=user.to_dict()), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.get("/api/v1/me")
    @jwt_required()
    def current_user():
        """Return the authenticated user's profile data."""
        user_id = get_jwt_identity()
        try:
            return jsonify(db.get_user_profile(user_id, user_id)), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    # ------------------------------------------------------------------
    # Profile
    # ------------------------------------------------------------------

    @app.put("/api/v1/profile")
    @jwt_required()
    def edit_profile() -> tuple:
        """Update the authenticated user's profile."""
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON body"}), 400

        user_id = get_jwt_identity()

        try:
            kwargs = dict(
                user_id     = user_id,
                description = data.get("description"),
                tags_data   = data.get("tags"),
            )
            if "first_name" in data:
                kwargs["first_name"] = data["first_name"]
            if "last_name" in data:
                kwargs["last_name"] = data["last_name"]
            if "email" in data:
                kwargs["email"] = data["email"]
            if "phone" in data:
                kwargs["phone"] = data["phone"]
            if "username" in data:
                kwargs["username"] = data["username"]
            if "city_id" in data:
                kwargs["city_id"] = data["city_id"]
            if "price" in data:
                kwargs["price"] = data["price"]
            result = db.update_profile(**kwargs)
            result["profile_pic"] = db.get_profile_pic_path(user_id)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.get("/api/v1/profile/picture/<int:user_id>")
    def serve_profile_picture(user_id: int) -> tuple:
        """Serve a user's profile picture, falling back to the default."""
        pic_url = db.get_profile_pic_path(user_id)
        if pic_url:
            if pic_url.startswith("http"):
                return "", 302, {"Location": pic_url}
            full_dir = os.path.join(db.UPLOAD_BASE, str(user_id))
            return send_from_directory(full_dir, "profile.jpg")

        default_dir = os.path.join(db.UPLOAD_BASE, "default")
        if os.path.isfile(os.path.join(default_dir, "profile.jpg")):
            return send_from_directory(default_dir, "profile.jpg")
        return "", 204

    @app.get("/api/v1/coach/picture/<int:user_id>/<int:numero>")
    def serve_coach_picture(user_id: int, numero: int) -> tuple:
        """Serve one of a coach's pictures (numero 1‑7), or 204 if absent."""
        pics = db.get_coach_picture_paths(user_id)
        idx = numero - 1
        if idx < len(pics) and pics[idx]:
            pic_url = pics[idx]
            if pic_url.startswith("http"):
                return "", 302, {"Location": pic_url}
            full_dir = os.path.join(db.COACH_PICS_BASE, str(user_id))
            return send_from_directory(full_dir, f"{numero}.jpg")
        return "", 204

    @app.post("/api/v1/profile/picture")
    @jwt_required()
    def upload_profile_picture() -> tuple:
        """Upload or replace the authenticated user's profile picture.

        Expects a multipart form‑data field named ``file`` containing the
        image.  Valid extensions: png, jpg, jpeg, gif, webp.
        """
        if "file" not in request.files:
            return jsonify({"msg": "No file provided"}), 400

        file = request.files["file"]
        if not file.filename:
            return jsonify({"msg": "No file selected"}), 400

        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({"msg": f"File type '.{ext}' is not allowed"}), 400

        try:
            pic_path = db.save_profile_picture(get_jwt_identity(), file.read())
            return jsonify({"profile_pic": pic_path}), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.post("/api/v1/coach/picture/<int:numero>")
    @jwt_required()
    def upload_coach_picture(numero: int) -> tuple:
        """Upload or replace one of a coach's up‑to‑7 pictures (numero 1‑7).

        Expects a multipart form‑data field named ``file`` containing the
        image.  Valid extensions: png, jpg, jpeg, gif, webp.
        """
        if "file" not in request.files:
            return jsonify({"msg": "No file provided"}), 400

        file = request.files["file"]
        if not file.filename:
            return jsonify({"msg": "No file selected"}), 400

        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({"msg": f"File type '.{ext}' is not allowed"}), 400

        try:
            pic_path = db.save_coach_picture(get_jwt_identity(), numero, file.read())
            return jsonify({"picture": pic_path}), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.put("/api/v1/password")
    @jwt_required()
    def edit_password() -> tuple:
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

    @app.get("/api/v1/profile/<int:profile_id>")
    @jwt_required()
    def get_profile(profile_id: int) -> tuple:
        """View a user's profile (visibility rules enforced)."""
        try:
            return jsonify(db.get_user_profile(profile_id, get_jwt_identity())), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.delete("/api/v1/profile")
    @jwt_required()
    def delete_own_profile() -> tuple:
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
    # Ratings
    # ------------------------------------------------------------------

    @app.post("/api/v1/coach/<int:coach_id>/rate")
    @jwt_required()
    def rate_coach(coach_id: int) -> tuple:
        """Set a thumbs-up (1), thumbs-down (0), or remove (null) rating."""
        data = request.get_json()
        if not data or "rating" not in data:
            return jsonify({"msg": "rating is required (true, false, or null)"}), 400

        rating = data["rating"]
        if rating is not None and not isinstance(rating, bool):
            return jsonify({"msg": "rating must be a boolean or null"}), 400

        try:
            result = db.rate_coach(get_jwt_identity(), coach_id, rating)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    # ------------------------------------------------------------------
    # Coach queries (public)
    # ------------------------------------------------------------------

    @app.get("/api/v1/coach/<int:coach_id>")
    @jwt_required(optional=True)
    def get_coach(coach_id: int) -> tuple:
        """Return public details for a specific coach."""
        try:
            current_id = get_jwt_identity()
            return jsonify(db.get_coach(coach_id, current_id)), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.get("/api/v1/coach")
    def list_coaches() -> tuple:
        """Return all coaches."""
        return jsonify(db.list_coaches()), 200

    @app.get("/api/v1/coach/tag/<tag_name>")
    def list_coaches_by_tag(tag_name: str) -> tuple:
        """Return coaches filtered by tag name."""
        return jsonify(db.list_coaches_by_tag(tag_name)), 200

    @app.get("/api/v1/coach/search")
    def search_coaches() -> tuple:
        """Search coaches by description, name, username, or tag name.

        Accepts a ``q`` query parameter with one or more space-separated
        terms.  Only coaches matching ALL terms are returned.
        """
        q = request.args.get("q", "").strip()
        if not q:
            return jsonify([]), 200
        return jsonify(db.search_coaches(q)), 200

    # ------------------------------------------------------------------
    # Chat / Messages
    # ------------------------------------------------------------------

    @app.get("/api/v1/chat")
    @limiter.exempt
    @jwt_required()
    def list_chats() -> tuple:
        """Return chats for the authenticated user.

        Users only see their own chats.  Admins may consult another
        user's chats via ``GET /api/v1/user/<id>/chats``.
        """
        return jsonify(db.list_user_chats(get_jwt_identity())), 200

    @app.get("/api/v1/chat/<int:chat_id>")
    @jwt_required()
    def get_chat_messages(chat_id: int) -> tuple:
        """Return messages for a given chat.

        Admins see all messages including hidden ones.
        Non-admin users see only non-hidden messages they have access to.
        """
        try:
            return jsonify(db.get_chat_messages(chat_id, get_jwt_identity())), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.post("/api/v1/message")
    @jwt_required()
    def send_message() -> tuple:
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

    @app.put("/api/v1/message/<message_id>/hide")
    @jwt_required()
    def hide_message(message_id: str) -> tuple:
        """Hide (soft-delete) one of your own messages.

        Only available to non-admin users.  The hidden message becomes
        invisible to all non-admin participants of the chat.
        """
        try:
            result = db.hide_message(get_jwt_identity(), message_id)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.delete("/api/v1/message/<message_id>")
    @jwt_required()
    def delete_message(message_id: str) -> tuple:
        """Permanently delete any message (admin-only)."""
        try:
            result = db.delete_message(get_jwt_identity(), message_id)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    # ------------------------------------------------------------------
    # Tag management
    # ------------------------------------------------------------------

    @app.get("/api/v1/tag")
    def list_tags() -> tuple:
        """Return all tags (public)."""
        return jsonify(db.list_tags()), 200

    @app.post("/api/v1/tag")
    @jwt_required()
    def create_tag() -> tuple:
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

    @app.put("/api/v1/tag/<int:tag_id>")
    @jwt_required()
    def edit_tag(tag_id: int) -> tuple:
        """Update a tag (admin-only)."""
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON body"}), 400

        try:
            result = db.edit_tag(
                get_jwt_identity(), tag_id,
                name=data.get("name"), description=data.get("description"),
            )
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.delete("/api/v1/tag/<int:tag_id>")
    @jwt_required()
    def delete_tag(tag_id: int) -> tuple:
        """Delete a tag (admin-only)."""
        try:
            result = db.delete_tag(get_jwt_identity(), tag_id)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    # ------------------------------------------------------------------
    # City management (admin only)
    # ------------------------------------------------------------------

    @app.post("/api/v1/city")
    @jwt_required()
    def create_city() -> tuple:
        """Create a new city (admin-only)."""
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON body"}), 400

        name = data.get("name")
        if not name:
            return jsonify({"msg": "name is required"}), 400

        try:
            result = db.add_city(get_jwt_identity(), name)
            return jsonify(result), 201
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.put("/api/v1/city/<int:city_id>")
    @jwt_required()
    def edit_city(city_id: int) -> tuple:
        """Update a city's name (admin-only)."""
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON body"}), 400

        name = data.get("name")
        if not name:
            return jsonify({"msg": "name is required"}), 400

        try:
            result = db.edit_city(get_jwt_identity(), city_id, name)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.get("/api/v1/city")
    def list_cities() -> tuple:
        """Return all cities (public)."""
        return jsonify(db.list_cities()), 200

    @app.get("/api/v1/city/<int:city_id>")
    def get_city(city_id: int) -> tuple:
        """Return a city by id (public)."""
        try:
            return jsonify(db.get_city(city_id)), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    # ------------------------------------------------------------------
    # Badge management
    # ------------------------------------------------------------------

    @app.get("/api/v1/badge")
    @jwt_required()
    def list_badges() -> tuple:
        """Return the authenticated user's received badges, grouped by badge."""
        try:
            result = db.get_user_badges(get_jwt_identity())
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.post("/api/v1/badge/give")
    @jwt_required()
    def give_badge() -> tuple:
        """Give a badge to another user."""
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON body"}), 400

        user_id = data.get("user_id")
        badge_id = data.get("badge_id")
        if not user_id or not badge_id:
            return jsonify({"msg": "user_id and badge_id are required"}), 400

        try:
            result = db.give_badge(get_jwt_identity(), user_id, badge_id)
            return jsonify(result), 201
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.post("/api/v1/badge/<int:badge_id>/toggle")
    @jwt_required()
    def toggle_badge(badge_id):
        """Give or remove a badge toggle-style."""
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON body"}), 400
        user_id = data.get("user_id")
        if not user_id:
            return jsonify({"msg": "user_id is required"}), 400
        try:
            result = db.toggle_badge(get_jwt_identity(), user_id, badge_id)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.get("/api/v1/user/<int:user_id>/badges")
    def public_user_badges(user_id):
        """Return badge summary for a user (public)."""
        try:
            return jsonify(db.get_user_badges(user_id)), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.get("/api/v1/badge/all")
    def list_all_badges() -> tuple:
        """Return all available badges (public)."""
        return jsonify(db.list_all_badges()), 200

    @app.get("/api/v1/badge/for/<string:role>")
    def list_badges_by_role(role: str) -> tuple:
        """Return badges for a specific role (public).

        Role must be 'coach' or 'customer'.
        """
        if role == "coach":
            for_coach = True
        elif role == "customer":
            for_coach = False
        else:
            return jsonify({"msg": "Role must be 'coach' or 'customer'"}), 400
        return jsonify(db.list_badges_by_role(for_coach)), 200

    @app.post("/api/v1/badge")
    @jwt_required()
    def create_badge() -> tuple:
        """Create a new badge (admin-only)."""
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON body"}), 400

        name = data.get("name")
        description = data.get("description")
        for_coach = data.get("for_coach")
        if not name or not description or for_coach is None:
            return jsonify({"msg": "name, description and for_coach are required"}), 400

        try:
            result = db.create_badge(get_jwt_identity(), name, description, for_coach)
            return jsonify(result), 201
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.put("/api/v1/badge/<int:badge_id>")
    @jwt_required()
    def edit_badge(badge_id: int) -> tuple:
        """Update a badge (admin-only)."""
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON body"}), 400

        try:
            result = db.edit_badge(
                get_jwt_identity(), badge_id,
                name=data.get("name"),
                description=data.get("description"),
            )
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.delete("/api/v1/badge/<int:badge_id>")
    @jwt_required()
    def delete_badge(badge_id: int) -> tuple:
        """Delete a badge (admin-only)."""
        try:
            result = db.delete_badge(get_jwt_identity(), badge_id)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    # ------------------------------------------------------------------
    # Admin user management
    # ------------------------------------------------------------------

    @app.get("/api/v1/users")
    @jwt_required()
    def list_users() -> tuple:
        """List all non-admin users (admin-only)."""
        try:
            result = db.list_users(get_jwt_identity())
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.delete("/api/v1/user/<int:user_id>")
    @jwt_required()
    def delete_user(user_id: int) -> tuple:
        """Delete a non-admin user (admin-only)."""
        try:
            result = db.delete_user(get_jwt_identity(), user_id)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.put("/api/v1/user/<int:user_id>/promote")
    @jwt_required()
    def promote_user(user_id: int) -> tuple:
        """Promote a user to admin (admin-only, irreversible)."""
        try:
            result = db.promote_to_admin(get_jwt_identity(), user_id)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.get("/api/v1/user/<int:user_id>/chats")
    @jwt_required()
    def get_user_chats(user_id: int) -> tuple:
        """Return a specific user's chats (admin-only consultation)."""
        try:
            result = db.list_user_chats_as_admin(get_jwt_identity(), user_id)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.put("/api/v1/user/<int:user_id>/block")
    @jwt_required()
    def toggle_block_user(user_id):
        """Toggle a user's blocked status (admin-only)."""
        data = request.get_json() or {}
        try:
            result = db.toggle_user_block(get_jwt_identity(), user_id, data)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.put("/api/v1/user/<int:user_id>/flag")
    @jwt_required()
    def flag_user(user_id):
        """Set vetted/certified flags on a user (admin-only)."""
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON body"}), 400
        try:
            result = db.flag_user(get_jwt_identity(), user_id, data)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code

    @app.delete("/api/v1/user/<int:user_id>/pictures")
    @jwt_required()
    def remove_user_pictures(user_id):
        """Remove all coach pictures for a user (admin-only)."""
        try:
            result = db.remove_all_coach_pictures_admin(get_jwt_identity(), user_id)
            return jsonify(result), 200
        except DbError as e:
            return jsonify({"msg": e.message}), e.status_code
