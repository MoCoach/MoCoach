"""Database management layer providing CRUD operations and business logic."""

import base64
import io
import os
import re

from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from classes import Base
from classes.user import User, _UNSET, _FORBIDDEN_USERNAMES
from classes.coach import Coach
from classes.tag import Tag
from classes.city import City
from classes.chat import Chat
from classes.message import Message
from classes.badge import Badge
from classes.user_badge import UserBadge
from classes.coach_rating import CoachRating


DEFAULT_PIC = "back-end/static/uploads/profile_pics/default/profile.jpg"


class DbError(Exception):
    """Custom exception carrying a user-facing message and HTTP status code."""

    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code


class Db_Management:
    """Data-access object that wraps all database operations."""

    def __init__(self, db_url=None):
        if db_url is None:
            db_url = "mysql+mysqldb://emilien:1234@localhost/moCoach"
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def _session(self):
        """Open a new database session."""
        return self.Session()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _is_admin(self, user_id):
        """Return True if *user_id* belongs to an admin."""
        session = self._session()
        try:
            user = session.query(User).filter_by(id=user_id).first()
            return user is not None and user.is_admin
        finally:
            session.close()

    def _is_last_admin(self, user_id):
        """Return True if *user_id* is the only admin left in the system."""
        session = self._session()
        try:
            admin_count = session.query(User).filter_by(is_admin=True).count()
            user = session.query(User).filter_by(id=user_id).first()
            return user is not None and user.is_admin and admin_count <= 1
        finally:
            session.close()

    def get_user_by_id(self, user_id):
        """Return a user dict with is_admin and is_coach, or None."""
        session = self._session()
        try:
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                return None
            return {"is_admin": user.is_admin, "is_coach": user.is_coach}
        finally:
            session.close()

    UPLOAD_BASE = os.path.join(
        os.path.dirname(__file__), '..', 'static', 'uploads', 'profile_pics'
    )

    @staticmethod
    def save_profile_picture(user_id, image_bytes):
        """Validate, resize and save a profile picture.

        Verifies the bytes represent a valid image, resizes to a maximum
        of 400×400 pixels while preserving the original aspect ratio,
        converts to JPEG, and writes the result to
        ``static/uploads/profile_pics/<user_id>/profile.jpg``.

        :param user_id: user identifier
        :param image_bytes: raw file bytes of the uploaded image
        :return: the relative URL path to the saved file
        :raises DbError: if the bytes do not represent a valid image
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
        except Exception:
            raise DbError("Invalid or unreadable image file", 400)

        img = img.convert("RGB")
        img.thumbnail((400, 400), Image.LANCZOS)

        dest_dir = os.path.join(Db_Management.UPLOAD_BASE, str(user_id))
        os.makedirs(dest_dir, exist_ok=True)

        dest_path = os.path.join(dest_dir, "profile.jpg")
        img.save(dest_path, "JPEG", quality=85)

        return f"static/uploads/profile_pics/{user_id}/profile.jpg"

    @staticmethod
    def remove_profile_picture(user_id):
        """Delete the profile picture directory for *user_id*."""
        dest_dir = os.path.join(Db_Management.UPLOAD_BASE, str(user_id))
        if os.path.isdir(dest_dir):
            import shutil
            shutil.rmtree(dest_dir)

    @staticmethod
    def get_profile_pic_path(user_id):
        """Return the relative URL to the user's profile picture, or ``None``."""
        candidate = f"static/uploads/profile_pics/{user_id}/profile.jpg"
        full = os.path.join(Db_Management.UPLOAD_BASE, str(user_id), "profile.jpg")
        return candidate if os.path.isfile(full) else None

    COACH_PICS_BASE = os.path.join(
        os.path.dirname(__file__), '..', 'static', 'uploads', 'coach_pics'
    )

    @staticmethod
    def _save_image(image_bytes, dest_dir, filename):
        """Validate, resize (max 400×400, keep aspect ratio) and save a JPEG.

        :raises DbError: if the bytes do not represent a valid image
        :return: the relative URL path
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
        except Exception:
            raise DbError("Invalid or unreadable image file", 400)

        img = img.convert("RGB")
        img.thumbnail((400, 400), Image.LANCZOS)

        os.makedirs(dest_dir, exist_ok=True)
        dest_path = os.path.join(dest_dir, filename)
        img.save(dest_path, "JPEG", quality=85)
        return f"static/uploads/coach_pics/{os.path.basename(dest_dir)}/{filename}"

    @staticmethod
    def save_coach_picture(user_id, numero, image_bytes):
        """Save (or replace) one of a coach's up‑to‑7 pictures.

        *numero* must be between 1 and 7 (inclusive).
        """
        if not 1 <= numero <= 7:
            raise DbError("Picture number must be between 1 and 7", 400)
        dest_dir = os.path.join(Db_Management.COACH_PICS_BASE, str(user_id))
        return Db_Management._save_image(image_bytes, dest_dir, f"{numero}.jpg")

    @staticmethod
    def remove_coach_picture(user_id, numero):
        """Remove a single coach picture (1‑7)."""
        path = os.path.join(Db_Management.COACH_PICS_BASE, str(user_id), f"{numero}.jpg")
        if os.path.isfile(path):
            os.remove(path)

    @staticmethod
    def remove_all_coach_pictures(user_id):
        """Remove the entire coach pictures directory for *user_id*."""
        dest_dir = os.path.join(Db_Management.COACH_PICS_BASE, str(user_id))
        if os.path.isdir(dest_dir):
            import shutil
            shutil.rmtree(dest_dir)

    @staticmethod
    def get_coach_picture_paths(user_id):
        """Return a list of up to 7 relative URLs, one per existing picture."""
        paths = []
        for i in range(1, 8):
            full = os.path.join(Db_Management.COACH_PICS_BASE, str(user_id), f"{i}.jpg")
            if os.path.isfile(full):
                paths.append(f"static/uploads/coach_pics/{user_id}/{i}.jpg")
        return paths

    # ------------------------------------------------------------------
    # Availability checks
    # ------------------------------------------------------------------

    def check_username_available(self, username):
        """Return True if *username* is not taken and respects format rules."""
        session = self._session()
        try:
            if not isinstance(username, str) or not username.strip():
                return False
            if not re.match(r'^[a-zA-Z0-9_]+$', username):
                return False
            if username.lower() in _FORBIDDEN_USERNAMES:
                return False
            return session.query(User).filter_by(username=username).first() is None
        finally:
            session.close()

    def check_email_available(self, email):
        """Return True if *email* is not already registered."""
        session = self._session()
        try:
            return session.query(User).filter_by(email=email).first() is None
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Registration / Authentication
    # ------------------------------------------------------------------

    def register_user(self, username, email, password, is_coach, description,
                      tags_data, phone, is_admin=False, first_name=None,
                      last_name=None, city_id=None, price=None):
        """Create a new user account.

        :param username: unique login identifier (required)
        :param first_name: first name (required for coaches, optional otherwise)
        :param last_name: last name (required for coaches, optional otherwise)
        :param is_admin: grant admin privileges (default False)
        :param city_id: city id (required for coaches)
        :param price: coaching price per hour (coaches only, optional)
        """
        session = self._session()
        try:
            if session.query(User).filter_by(username=username).first():
                raise DbError("Username already taken", 409)
            if session.query(User).filter_by(email=email).first():
                raise DbError("Email already taken", 409)

            tags = []
            if is_coach:
                for t in tags_data:
                    tag = session.query(Tag).filter_by(name=t["name"]).first()
                    if not tag:
                        tag = Tag(name=t["name"], description=t["description"])
                        session.add(tag)
                    tags.append(tag)

            user = User(username=username, email=email, pwd=password,
                        is_coach=is_coach, description=description,
                        tags=tags if is_coach else None,
                        phone=phone, is_admin=is_admin, first_name=first_name,
                        last_name=last_name, city_id=city_id, price=price)
            session.add(user)
            session.commit()
            return user.to_dict()
        except (TypeError, ValueError) as e:
            session.rollback()
            raise DbError(str(e), 400)
        finally:
            session.close()

    def authenticate(self, login, password):
        """Authenticate a user by email or username and return the User object."""
        session = self._session()
        try:
            user = session.query(User).filter_by(email=login).first()
            if not user:
                user = session.query(User).filter_by(username=login).first()
            if not user or not user.verify_pwd(password):
                raise DbError("Bad credentials", 401)
            return user
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Profile management
    # ------------------------------------------------------------------

    def update_profile(self, user_id, first_name=_UNSET, last_name=_UNSET,
                       description=None, tags_data=None, email=_UNSET,
                       phone=_UNSET, username=_UNSET, city_id=None,
                       price=None):
        """Update profile fields for the user identified by *user_id*."""
        session = self._session()
        try:
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                raise DbError("User not found", 404)

            if email is not _UNSET:
                existing = session.query(User).filter(
                    User.email == email, User.id != user_id
                ).first()
                if existing:
                    raise DbError("Email already taken", 409)

            if username is not _UNSET:
                existing = session.query(User).filter(
                    User.username == username, User.id != user_id
                ).first()
                if existing:
                    raise DbError("Username already taken", 409)

            tags = None
            if tags_data is not None and user.is_coach:
                tags = []
                for t in tags_data:
                    tag = session.query(Tag).filter_by(name=t["name"]).first()
                    if not tag:
                        tag = Tag(name=t["name"], description=t["description"])
                        session.add(tag)
                    tags.append(tag)

            kwargs = dict(description=description, tags=tags)
            if first_name is not _UNSET:
                kwargs["first_name"] = first_name
            if last_name is not _UNSET:
                kwargs["last_name"] = last_name
            if email is not _UNSET:
                kwargs["email"] = email
            if phone is not _UNSET:
                kwargs["phone"] = phone
            if username is not _UNSET:
                kwargs["username"] = username
            if city_id is not None:
                kwargs["city_id"] = city_id
            if price is not None:
                kwargs["price"] = price
            user.update_profile(**kwargs)
            session.commit()
            return user.to_dict()
        except (TypeError, ValueError) as e:
            session.rollback()
            raise DbError(str(e), 400)
        finally:
            session.close()

    def change_password(self, user_id, old_pwd, new_pwd):
        """Change the password for *user_id* after verifying the old one."""
        session = self._session()
        try:
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                raise DbError("User not found", 404)
            if not user.verify_pwd(old_pwd):
                raise DbError("Old password is incorrect", 401)
            user.update_profile(pwd=new_pwd)
            session.commit()
        except (TypeError, ValueError) as e:
            session.rollback()
            raise DbError(str(e), 400)
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Coach queries
    # ------------------------------------------------------------------

    def _coach_to_dict(self, coach):
        """Serialize a coach record to a public-facing dictionary."""
        pic_url = Db_Management.get_profile_pic_path(coach.id)
        thumbs_up = 0
        thumbs_down = 0
        session = self._session()
        try:
            ratings = session.query(CoachRating).filter_by(coach_id=coach.id).all()
            for r in ratings:
                if r.rating is True:
                    thumbs_up += 1
                elif r.rating is False:
                    thumbs_down += 1
        finally:
            session.close()
        d = {
            "id": coach.id,
            "username": coach.user.username,
            "first_name": coach.user.first_name,
            "last_name": coach.user.last_name,
            "description": coach.description,
            "price": coach.price,
            "city": coach.city.name if coach.city else None,
            "phone": coach.user.phone,
            "tags": [{"name": t.name, "description": t.description}
                     for t in coach.tags],
            "profile_pic": pic_url or DEFAULT_PIC,
            "pictures": Db_Management.get_coach_picture_paths(coach.id),
            "thumbs_up": thumbs_up,
            "thumbs_down": thumbs_down,
        }
        return d

    def get_coach(self, coach_id):
        """Return public coach details by coach id."""
        session = self._session()
        try:
            coach = session.query(Coach).filter_by(id=coach_id).first()
            if not coach:
                raise DbError("Coach not found", 404)
            return self._coach_to_dict(coach)
        finally:
            session.close()

    def list_coaches(self):
        """Return a list of all coaches."""
        session = self._session()
        try:
            coaches = session.query(Coach).all()
            return [self._coach_to_dict(c) for c in coaches]
        finally:
            session.close()

    def list_coaches_by_tag(self, tag_name):
        """Return coaches associated with the given tag name."""
        session = self._session()
        try:
            tag = session.query(Tag).filter_by(name=tag_name).first()
            if not tag:
                return []
            coaches = session.query(Coach).filter(
                Coach.tags.contains(tag)
            ).all()
            return [self._coach_to_dict(c) for c in coaches]
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Ratings (thumbs up / down)
    # ------------------------------------------------------------------

    def rate_coach(self, customer_id, coach_id, rating):
        """Set or remove a customer's rating for a coach.

        *rating* can be:
          - ``True``  → thumbs up
          - ``False`` → thumbs down
          - ``None``  → remove any existing rating
        """
        session = self._session()
        try:
            customer = session.query(User).filter_by(id=customer_id).first()
            if not customer or customer.is_coach:
                raise DbError("Only customers can rate coaches", 403)

            coach = session.query(Coach).filter_by(id=coach_id).first()
            if not coach:
                raise DbError("Coach not found", 404)

            if rating is not None and not isinstance(rating, bool):
                raise DbError("rating must be a boolean or null", 400)

            existing = session.query(CoachRating).filter_by(
                coach_id=coach_id, customer_id=customer_id,
            ).first()

            if existing:
                if rating is None:
                    session.delete(existing)
                else:
                    existing.rating = rating
            elif rating is not None:
                cr = CoachRating(coach_id=coach_id, customer_id=customer_id, rating=rating)
                session.add(cr)

            session.commit()
            return {"msg": "Rating updated"}
        except DbError:
            session.rollback()
            raise
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Profile lookup (with visibility rules)
    # ------------------------------------------------------------------

    def get_user_profile(self, profile_id, current_id):
        """Return a user's profile enforcing visibility rules.

        Admins are invisible to non-admin users.
        Admins can see any non-admin profile without restrictions.
        Non-admin users may only view profiles they have a chat with
        (coach side) or their own.
        """
        session = self._session()
        try:
            user = session.query(User).filter_by(id=profile_id).first()
            if not user:
                raise DbError("User not found", 404)

            current_user = session.query(User).filter_by(
                id=current_id
            ).first()
            if not current_user:
                raise DbError("Current user not found", 404)

            # Admin profiles are invisible to non-admins (except self).
            if user.is_admin and current_id != profile_id:
                if not current_user.is_admin:
                    raise DbError("Access denied", 403)

            # Admins can view any non-admin profile.
            if current_user.is_admin:
                return user.to_dict()

            # Users can always view their own profile.
            if current_id == profile_id:
                return user.to_dict()

            # Otherwise a coach may view a customer they have a chat with.
            if not current_user.is_coach:
                raise DbError("Access denied", 403)
            chat = session.query(Chat).filter(
                Chat.id_coach == current_id,
                Chat.id_cust == profile_id,
            ).first()
            if not chat:
                raise DbError("Access denied", 403)
            return user.to_dict()
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Chat / Messages
    # ------------------------------------------------------------------

    def list_user_chats(self, user_id):
        """Return chats for a user.

        Users (including admins) only see their own chats.
        Admins may consult another user's chats via
        *list_user_chats_as_admin*.
        """
        session = self._session()
        try:
            chats = session.query(Chat).filter(
                (Chat.id_coach == user_id) | (Chat.id_cust == user_id)
            ).all()

            result = []
            for chat in chats:
                coach = session.query(User).filter_by(
                    id=chat.id_coach
                ).first()
                customer = session.query(User).filter_by(
                    id=chat.id_cust
                ).first()
                result.append({
                    "id": chat.id,
                    "coach": {"id": coach.id, "username": coach.username, "first_name": coach.first_name, "last_name": coach.last_name},
                    "customer": {"id": customer.id, "username": customer.username, "first_name": customer.first_name, "last_name": customer.last_name},
                })
            return result
        finally:
            session.close()

    def list_user_chats_as_admin(self, admin_id, target_user_id):
        """Return chats belonging to *target_user_id* (admin-only)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            target = session.query(User).filter_by(id=target_user_id).first()
            if not target:
                raise DbError("User not found", 404)

            chats = session.query(Chat).filter(
                (Chat.id_coach == target_user_id) |
                (Chat.id_cust == target_user_id)
            ).all()

            result = []
            for chat in chats:
                coach = session.query(User).filter_by(
                    id=chat.id_coach
                ).first()
                customer = session.query(User).filter_by(
                    id=chat.id_cust
                ).first()
                result.append({
                    "id": chat.id,
                    "coach": {"id": coach.id, "username": coach.username, "first_name": coach.first_name, "last_name": coach.last_name},
                    "customer": {"id": customer.id, "username": customer.username, "first_name": customer.first_name, "last_name": customer.last_name},
                })
            return result
        finally:
            session.close()

    def get_chat_messages(self, chat_id, user_id):
        """Return messages for *chat_id* with access control.

        Admins can access any chat and see hidden messages.
        Non-admin users can only access chats they participate in;
        hidden messages are excluded from the result.
        """
        session = self._session()
        try:
            current_user = session.query(User).filter_by(id=user_id).first()
            if not current_user:
                raise DbError("User not found", 404)

            chat = session.query(Chat).filter_by(id=chat_id).first()
            if not chat:
                raise DbError("Chat not found", 404)

            # Only admins or participants may view a chat.
            if not current_user.is_admin:
                if (user_id != chat.id_coach and
                        user_id != chat.id_cust):
                    raise DbError("Access denied", 403)

            # Only two possible senders in any chat: the coach and the
            # customer.  Pre-fetch both to avoid N+1 queries.
            coach = session.query(User).filter_by(id=chat.id_coach).first()
            customer = session.query(User).filter_by(id=chat.id_cust).first()
            senders = {
                coach.id: {"first_name": coach.first_name, "last_name": coach.last_name, "username": coach.username},
                customer.id: {"first_name": customer.first_name, "last_name": customer.last_name, "username": customer.username},
            }

            messages = session.query(Message).filter_by(
                chat_id=chat_id
            ).order_by(Message.timestamp).all()

            result = []
            for msg in messages:
                # Non-admin users do not see hidden messages.
                if not current_user.is_admin and msg.hidden:
                    continue

                entry = {
                    "sender": {
                        "id": msg.sender_id,
                        **senders.get(msg.sender_id, {"first_name": None, "last_name": None, "username": None}),
                    },
                    "timestamp": msg.timestamp,
                    "text": msg.text,
                }
                # Only admins are told whether a message is hidden.
                if current_user.is_admin:
                    entry["hidden"] = msg.hidden
                result.append(entry)
            return result
        finally:
            session.close()


    def send_message(self, sender_id, recipient_id, text):
        """Send a message from *sender_id* to *recipient_id*.

        Creates a new chat if none exists between the pair.
        Only a non-coach (customer) can start a new chat.
        """
        session = self._session()
        try:
            sender = session.query(User).filter_by(id=sender_id).first()
            recipient = session.query(User).filter_by(
                id=recipient_id
            ).first()

            if not sender or not recipient:
                raise DbError("User not found", 404)

            chat = session.query(Chat).filter(
                ((Chat.id_coach == sender_id) & (Chat.id_cust == recipient_id)) |
                ((Chat.id_coach == recipient_id) & (Chat.id_cust == sender_id))
            ).first()

            if not chat:
                if sender.is_coach:
                    raise DbError(
                        "Only customers can start a new chat", 403
                    )
                chat = Chat(id_coach=recipient_id, id_cust=sender_id)
                session.add(chat)
                session.flush()

            msg = chat.new_msg(sender_id, text)
            session.add(msg)
            session.commit()

            return {
                "id": msg.id,
                "sender": {"id": sender.id, "first_name": sender.first_name, "last_name": sender.last_name, "username": sender.username},
                "timestamp": msg.timestamp,
                "text": msg.text,
            }
        except (TypeError, ValueError) as e:
            session.rollback()
            raise DbError(str(e), 400)
        finally:
            session.close()

    def hide_message(self, user_id, message_id):
        """Mark a message as hidden (soft-delete).

        Only the sender may hide their own message, and only if they are
        not an admin.  Hidden messages are invisible to all non-admin
        users but remain visible to admins.
        """
        session = self._session()
        try:
            current_user = session.query(User).filter_by(
                id=user_id
            ).first()
            if not current_user:
                raise DbError("User not found", 404)
            if current_user.is_admin:
                raise DbError(
                    "Admins cannot hide messages; use DELETE instead", 403
                )

            msg = session.query(Message).filter_by(id=message_id).first()
            if not msg:
                raise DbError("Message not found", 404)
            if msg.sender_id != user_id:
                raise DbError(
                    "You can only hide your own messages", 403
                )
            if msg.hidden:
                raise DbError("Message is already hidden", 400)

            msg.hidden = True
            session.commit()
            return {"msg": "Message hidden"}
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Tag management (admin only)
    # ------------------------------------------------------------------

    def create_tag(self, admin_id, name, description):
        """Create a new tag (admin-only)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            tag = Tag(name=name, description=description)
            session.add(tag)
            session.commit()
            return tag.to_dict()
        except (TypeError, ValueError) as e:
            session.rollback()
            raise DbError(str(e), 400)
        except IntegrityError as e:
            session.rollback()
            raise DbError("A tag with this name already exists", 409)
        finally:
            session.close()

    def list_tags(self):
        """Return all tags."""
        session = self._session()
        try:
            tags = session.query(Tag).all()
            return [t.to_dict() for t in tags]
        finally:
            session.close()

    def edit_tag(self, admin_id, tag_id, name=None, description=None):
        """Update a tag's name and/or description (admin-only)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            tag = session.query(Tag).filter_by(id=tag_id).first()
            if not tag:
                raise DbError("Tag not found", 404)

            if name is not None:
                if not isinstance(name, str) or not name.strip():
                    raise DbError("name must be a non-empty string", 400)
                if len(name) > 25:
                    raise DbError("name must be at most 25 characters", 400)
                existing = session.query(Tag).filter_by(name=name).first()
                if existing and existing.id != tag_id:
                    raise DbError("A tag with this name already exists", 409)
                tag.name = name
            if description is not None:
                if not isinstance(description, str):
                    raise DbError("description must be a string", 400)
                if len(description) > 100:
                    raise DbError("description must be at most 100 characters", 400)
                tag.description = description

            session.commit()
            return tag.to_dict()
        finally:
            session.close()

    def delete_tag(self, admin_id, tag_id):
        """Delete a tag (admin-only)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            tag = session.query(Tag).filter_by(id=tag_id).first()
            if not tag:
                raise DbError("Tag not found", 404)

            session.delete(tag)
            session.commit()
            return {"msg": "Tag deleted"}
        finally:
            session.close()

    # ------------------------------------------------------------------
    # City management (admin only)
    # ------------------------------------------------------------------

    def add_city(self, admin_id, name):
        """Create a new city (admin-only)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            existing = session.query(City).filter_by(name=name).first()
            if existing:
                raise DbError("A city with this name already exists", 409)

            city = City(name=name)
            session.add(city)
            session.commit()
            return city.to_dict()
        except (TypeError, ValueError) as e:
            session.rollback()
            raise DbError(str(e), 400)
        finally:
            session.close()

    def edit_city(self, admin_id, city_id, name):
        """Update a city's name (admin-only)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            city = session.query(City).filter_by(id=city_id).first()
            if not city:
                raise DbError("City not found", 404)

            if not isinstance(name, str) or not name.strip():
                raise DbError("name must be a non-empty string", 400)
            if len(name) > 25:
                raise DbError("name must be at most 25 characters", 400)

            existing = session.query(City).filter_by(name=name).first()
            if existing and existing.id != city_id:
                raise DbError("A city with this name already exists", 409)

            city.name = name
            session.commit()
            return city.to_dict()
        finally:
            session.close()

    def list_cities(self):
        """Return all cities (public)."""
        session = self._session()
        try:
            cities = session.query(City).all()
            return [c.to_dict() for c in cities]
        finally:
            session.close()

    def get_city(self, city_id):
        """Return a city by id (public)."""
        session = self._session()
        try:
            city = session.query(City).filter_by(id=city_id).first()
            if not city:
                raise DbError("City not found", 404)
            return city.to_dict()
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Badge management
    # ------------------------------------------------------------------

    def create_badge(self, admin_id, name, description, for_coach):
        """Create a new badge (admin-only)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            badge = Badge(name=name, description=description, for_coach=for_coach)
            session.add(badge)
            session.commit()
            return badge.to_dict()
        except (TypeError, ValueError) as e:
            session.rollback()
            raise DbError(str(e), 400)
        except IntegrityError as e:
            session.rollback()
            raise DbError("A badge with this name already exists", 409)
        finally:
            session.close()

    def list_all_badges(self):
        """Return all badges (public)."""
        session = self._session()
        try:
            badges = session.query(Badge).all()
            return [b.to_dict() for b in badges]
        finally:
            session.close()

    def list_badges_by_role(self, for_coach):
        """Return badges filtered by role (public).

        Args:
            for_coach: True to return coach badges, False for customer badges.
        """
        session = self._session()
        try:
            badges = session.query(Badge).filter_by(for_coach=for_coach).all()
            return [b.to_dict() for b in badges]
        finally:
            session.close()

    def edit_badge(self, admin_id, badge_id, name=None, description=None):
        """Update a badge's name and/or description (admin-only). for_coach is immutable after creation."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            badge = session.query(Badge).filter_by(id=badge_id).first()
            if not badge:
                raise DbError("Badge not found", 404)

            if name is not None:
                if not isinstance(name, str) or not name.strip():
                    raise DbError("name must be a non-empty string", 400)
                if len(name) > 25:
                    raise DbError("name must be at most 25 characters", 400)
                existing = session.query(Badge).filter_by(name=name).first()
                if existing and existing.id != badge_id:
                    raise DbError("A badge with this name already exists", 409)
                badge.name = name
            if description is not None:
                if not isinstance(description, str) or not description.strip():
                    raise DbError("description must be a non-empty string", 400)
                if len(description) > 100:
                    raise DbError("description must be at most 100 characters", 400)
                badge.description = description

            session.commit()
            return badge.to_dict()
        finally:
            session.close()

    def delete_badge(self, admin_id, badge_id):
        """Delete a badge (admin-only)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            badge = session.query(Badge).filter_by(id=badge_id).first()
            if not badge:
                raise DbError("Badge not found", 404)

            session.delete(badge)
            session.commit()
            return {"msg": "Badge deleted"}
        finally:
            session.close()

    def give_badge(self, giver_id, user_id, badge_id):
        """Give a badge from *giver* to *user*.

        Validates that:
        - Both users exist.
        - Giver is not the recipient.
        - Giver and recipient have different roles (coach ↔ customer).
        - This specific triplet (user, giver, badge) has not been used before.
        """
        session = self._session()
        try:
            giver = session.query(User).filter_by(id=giver_id).first()
            if not giver:
                raise DbError("Giver not found", 404)

            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                raise DbError("User not found", 404)

            if giver_id == user_id:
                raise DbError("Cannot give badge to yourself", 400)

            if giver.is_admin or user.is_admin:
                raise DbError("Admins cannot give or receive badges", 400)

            if user.is_coach == giver.is_coach:
                raise DbError("Cannot give badge to someone with the same role", 400)

            badge = session.query(Badge).filter_by(id=badge_id).first()
            if not badge:
                raise DbError("Badge not found", 404)

            existing = session.query(UserBadge).filter_by(
                user_id=user_id, giver_id=giver_id, badge_id=badge_id,
            ).first()
            if existing:
                raise DbError("You already gave this badge to this user", 409)

            ub = UserBadge(user_id=user_id, giver_id=giver_id, badge_id=badge_id)
            session.add(ub)
            session.commit()
            return {"msg": "Badge given"}
        except DbError:
            session.rollback()
            raise
        except Exception as e:
            session.rollback()
            raise DbError(str(e), 400)
        finally:
            session.close()

    def get_user_badges(self, user_id):
        """Return badges received by *user*, grouped by badge id.

        Returns:
            {badge_id: [{"giver_id": int, "name": str}, ...], ...}
        """
        session = self._session()
        try:
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                raise DbError("User not found", 404)

            rows = session.query(UserBadge).filter_by(user_id=user_id).all()
            result = {}
            for ub in rows:
                badge = session.query(Badge).filter_by(id=ub.badge_id).first()
                badge_name = badge.name if badge else "Unknown"
                bid = ub.badge_id
                if bid not in result:
                    result[bid] = []
                result[bid].append({
                    "giver_id": ub.giver_id,
                    "name": badge_name,
                })
            return result
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Admin user listing
    # ------------------------------------------------------------------

    def list_users(self, admin_id):
        """Return every non-admin user (admin-only)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            users = session.query(User).filter_by(is_admin=False).all()
            return [u.to_dict() for u in users]
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Deletion
    # ------------------------------------------------------------------

    def delete_user(self, admin_id, user_id):
        """Delete a non-admin user (admin-only).

        The user's chats and messages are also removed via cascade.
        """
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            target = session.query(User).filter_by(id=user_id).first()
            if not target:
                raise DbError("User not found", 404)
            if target.is_admin:
                raise DbError("Cannot delete another admin", 403)

            # Remove all chats the target participates in.
            chats = session.query(Chat).filter(
                (Chat.id_coach == user_id) | (Chat.id_cust == user_id)
            ).all()
            for chat in chats:
                session.delete(chat)

            self.remove_profile_picture(user_id)
            self.remove_all_coach_pictures(user_id)
            session.delete(target)
            session.commit()
            return {"msg": "User deleted"}
        finally:
            session.close()

    def delete_own_profile(self, user_id, password):
        """Delete the current user's own profile.

        The last remaining admin in the system cannot delete their
        profile.
        """
        session = self._session()
        try:
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                raise DbError("User not found", 404)
            if not user.verify_pwd(password):
                raise DbError("Incorrect password", 401)
            if self._is_last_admin(user_id):
                raise DbError(
                    "Cannot delete the last admin account", 403
                )

            # Remove all chats the user participates in.
            chats = session.query(Chat).filter(
                (Chat.id_coach == user_id) | (Chat.id_cust == user_id)
            ).all()
            for chat in chats:
                session.delete(chat)

            self.remove_profile_picture(user_id)
            self.remove_all_coach_pictures(user_id)
            session.delete(user)
            session.commit()
            return {"msg": "Profile deleted"}
        finally:
            session.close()

    def delete_message(self, admin_id, message_id):
        """Permanently delete any message (admin-only)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            msg = session.query(Message).filter_by(id=message_id).first()
            if not msg:
                raise DbError("Message not found", 404)

            session.delete(msg)
            session.commit()
            return {"msg": "Message deleted"}
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Admin promotion
    # ------------------------------------------------------------------

    def promote_to_admin(self, admin_id, target_user_id):
        """Promote a user to admin (admin-only, irreversible)."""
        session = self._session()
        try:
            admin = session.query(User).filter_by(id=admin_id).first()
            if not admin or not admin.is_admin:
                raise DbError("Admins only", 403)

            target = session.query(User).filter_by(id=target_user_id).first()
            if not target:
                raise DbError("User not found", 404)
            if target.is_admin:
                raise DbError("User is already an admin", 400)

            target.is_admin = True
            session.commit()
            return target.to_dict()
        finally:
            session.close()
