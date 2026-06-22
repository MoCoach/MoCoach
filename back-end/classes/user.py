from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

from . import Base
from .coach import Coach


class User(Base):
    __tablename__ = 'users'
    id            = Column(Integer,     nullable=False, primary_key=True)
    name          = Column(String(128), nullable=False)
    password      = Column(String(255), nullable=False)
    is_coach      = Column(Boolean,     nullable=False)
    nickname      = Column(String(64),  nullable=True)
    first_name    = Column(String(64),  nullable=True)
    last_name     = Column(String(64),  nullable=True)
    email         = Column(String(128), nullable=False, unique=True)
    zip_code      = Column(String(20),  nullable=True)
    phone         = Column(String(32),  nullable=True)
    profile_photo = Column(String(512), nullable=True)

    coach = relationship("Coach", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __init__(self, name, pwd, is_coach=False, description=None, tags=None,
                 nickname=None, first_name=None, last_name=None, email=None,
                 zip_code=None, phone=None, profile_photo=None):
        if not isinstance(pwd, str):
            raise TypeError("password must be a string")
        if len(pwd) < 8:
            raise ValueError("password must be at least 8 characters")
        if not isinstance(email, str) or not email.strip():
            raise ValueError("email is required")

        self.password = generate_password_hash(pwd)
        self.name     = name or f"{first_name or ''} {last_name or ''}".strip() or email.split("@")[0]
        self.is_coach = is_coach
        self.nickname = nickname
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.zip_code = zip_code
        self.phone = phone
        self.profile_photo = profile_photo

        if is_coach:
            self.coach = Coach(description=description)
            if tags:
                for tag in tags:
                    self.coach.add_tag(tag)

    def verify_pwd(self, pwd):
        return check_password_hash(self.password, pwd)

    def update_profile(self, name=None, pwd=None, description=None, tags=None,
                       nickname=None, first_name=None, last_name=None, email=None,
                       zip_code=None, phone=None, profile_photo=None):
        if name is not None:
            self.name = name
        if pwd is not None:
            if not isinstance(pwd, str):
                raise TypeError("password must be a string")
            if len(pwd) < 8:
                raise ValueError("password must be at least 8 characters")
            self.password = generate_password_hash(pwd)
        if nickname is not None:
            self.nickname = nickname
        if first_name is not None:
            self.first_name = first_name
        if last_name is not None:
            self.last_name = last_name
        if email is not None:
            self.email = email
        if zip_code is not None:
            self.zip_code = zip_code
        if phone is not None:
            self.phone = phone
        if profile_photo is not None:
            self.profile_photo = profile_photo
        if self.is_coach:
            if description is not None:
                if not isinstance(description, str):
                    raise TypeError("description must be a string")
                self.coach.description = description
            if tags is not None:
                self.coach.set_tags(tags)

    def to_dict(self):
        d = {
            "id": self.id,
            "name": self.name,
            "is_coach": self.is_coach,
            "nickname": self.nickname,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "zip_code": self.zip_code,
            "phone": self.phone,
            "profile_photo": self.profile_photo,
        }
        if self.coach:
            d["coach"] = self.coach.to_dict()
        return d

    def __repr__(self):
        return f"User(id={self.id!r}, name={self.name!r}, is_coach={self.is_coach!r})"

    def __str__(self):
        return f"User(name={self.name!r}, is_coach={self.is_coach!r})"
