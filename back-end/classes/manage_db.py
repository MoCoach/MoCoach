from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from classes import Base
from classes.user import User, _UNSET
from classes.coach import Coach
from classes.tag import Tag
from classes.chat import Chat
from classes.message import Message


class DbError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code


class Db_Management:
    def __init__(self, db_url=None):
        if db_url is None:
            db_url = "mysql+mysqldb://emilien:1234@localhost/moCoach"
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def _session(self):
        s = self.Session()
        return s

    # --- register ---

    def register_user(self, email, name, password, is_coach, description, tags_data, phone):
        session = self._session()
        try:
            if session.query(User).filter_by(email=email).first():
                raise DbError("Email already taken", 409)
            if session.query(User).filter_by(name=name).first():
                raise DbError("Name already taken", 409)

            tags = []
            if is_coach:
                for t in tags_data:
                    tag = session.query(Tag).filter_by(name=t["name"]).first()
                    if not tag:
                        tag = Tag(name=t["name"], description=t["description"])
                        session.add(tag)
                    tags.append(tag)

            user = User(name=name, email=email, pwd=password, is_coach=is_coach,
                        description=description, tags=tags if is_coach else None,
                        phone=phone)
            session.add(user)
            session.commit()
            return user.to_dict()
        except (TypeError, ValueError) as e:
            session.rollback()
            raise DbError(str(e), 400)
        finally:
            session.close()

    # --- login ---

    def authenticate(self, email, password):
        session = self._session()
        try:
            user = session.query(User).filter_by(email=email).first()
            if not user or not user.verify_pwd(password):
                raise DbError("Bad credentials", 401)
            return user
        finally:
            session.close()

    # --- profile update ---

    def update_profile(self, user_id, name, description, tags_data, email=_UNSET, phone=_UNSET):
        session = self._session()
        try:
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                raise DbError("User not found", 404)

            if email is not _UNSET:
                existing = session.query(User).filter(User.email == email, User.id != user_id).first()
                if existing:
                    raise DbError("Email already taken", 409)

            tags = None
            if tags_data is not None and user.is_coach:
                tags = []
                for t in tags_data:
                    tag = session.query(Tag).filter_by(name=t["name"]).first()
                    if not tag:
                        tag = Tag(name=t["name"], description=t["description"])
                        session.add(tag)
                    tags.append(tag)

            kwargs = dict(name=name, description=description, tags=tags)
            if email is not _UNSET:
                kwargs["email"] = email
            if phone is not _UNSET:
                kwargs["phone"] = phone
            user.update_profile(**kwargs)
            session.commit()
            return user.to_dict()
        except (TypeError, ValueError) as e:
            session.rollback()
            raise DbError(str(e), 400)
        finally:
            session.close()

    # --- password change ---

    def change_password(self, user_id, old_pwd, new_pwd):
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

    # --- coach queries ---

    def get_coach(self, coach_id):
        session = self._session()
        try:
            coach = session.query(Coach).filter_by(id=coach_id).first()
            if not coach:
                raise DbError("Coach not found", 404)
            return {
                "name": coach.user.name,
                "description": coach.description,
                "tags": [{"name": t.name, "description": t.description} for t in coach.tags]
            }
        finally:
            session.close()

    def list_coaches(self):
        session = self._session()
        try:
            coaches = session.query(Coach).all()
            return [{
                "name": c.user.name,
                "description": c.description,
                "tags": [{"name": t.name, "description": t.description} for t in c.tags]
            } for c in coaches]
        finally:
            session.close()

    def list_coaches_by_tag(self, tag_name):
        session = self._session()
        try:
            tag = session.query(Tag).filter_by(name=tag_name).first()
            if not tag:
                return []
            coaches = session.query(Coach).filter(Coach.tags.contains(tag)).all()
            return [{
                "name": c.user.name,
                "description": c.description,
                "tags": [{"name": t.name, "description": t.description} for t in c.tags]
            } for c in coaches]
        finally:
            session.close()

    # --- chat queries ---

    def list_user_chats(self, user_id):
        session = self._session()
        try:
            chats = session.query(Chat).filter(
                (Chat.id_coach == user_id) | (Chat.id_cust == user_id)
            ).all()
            result = []
            for chat in chats:
                coach = session.query(User).filter_by(id=chat.id_coach).first()
                customer = session.query(User).filter_by(id=chat.id_cust).first()
                result.append({
                    "id": chat.id,
                    "coach": {"id": coach.id, "name": coach.name},
                    "customer": {"id": customer.id, "name": customer.name},
                })
            return result
        finally:
            session.close()

    def get_chat_messages(self, chat_id, user_id):
        session = self._session()
        try:
            chat = session.query(Chat).filter_by(id=chat_id).first()
            if not chat:
                raise DbError("Chat not found", 404)

            if user_id != chat.id_coach and user_id != chat.id_cust:
                raise DbError("Access denied", 403)

            messages = session.query(Message).filter_by(chat_id=chat_id).order_by(Message.timestamp).all()
            result = []
            for msg in messages:
                sender = session.query(User).filter_by(id=msg.sender_id).first()
                result.append({
                    "sender": {"id": sender.id, "name": sender.name},
                    "timestamp": msg.timestamp,
                    "text": msg.text,
                })
            return result
        finally:
            session.close()

    # --- user profile (with auth check) ---

    def get_user_profile(self, profile_id, current_id):
        session = self._session()
        try:
            user = session.query(User).filter_by(id=profile_id).first()
            if not user:
                raise DbError("User not found", 404)

            if current_id != profile_id:
                current_user = session.query(User).filter_by(id=current_id).first()
                if not current_user or not current_user.is_coach:
                    raise DbError("Access denied", 403)

                chat = session.query(Chat).filter(
                    Chat.id_coach == current_id,
                    Chat.id_cust == profile_id
                ).first()
                if not chat:
                    raise DbError("Access denied", 403)

            return user.to_dict()
        finally:
            session.close()

    # --- send message ---

    def send_message(self, sender_id, recipient_id, text):
        session = self._session()
        try:
            sender = session.query(User).filter_by(id=sender_id).first()
            recipient = session.query(User).filter_by(id=recipient_id).first()

            if not sender or not recipient:
                raise DbError("User not found", 404)

            chat = session.query(Chat).filter(
                ((Chat.id_coach == sender_id) & (Chat.id_cust == recipient_id)) |
                ((Chat.id_coach == recipient_id) & (Chat.id_cust == sender_id))
            ).first()

            if not chat:
                if sender.is_coach:
                    raise DbError("Only customers can start a new chat", 403)
                chat = Chat(id_coach=recipient_id, id_cust=sender_id)
                session.add(chat)
                session.flush()

            msg = chat.new_msg(sender_id, text)
            session.add(msg)
            session.commit()

            return {
                "sender": {"id": sender.id, "name": sender.name},
                "timestamp": msg.timestamp,
                "text": msg.text,
            }
        except (TypeError, ValueError) as e:
            session.rollback()
            raise DbError(str(e), 400)
        finally:
            session.close()
