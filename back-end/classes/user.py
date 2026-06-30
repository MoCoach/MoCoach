#!/usr/bin/python3
"""Defines the user profile to be stored in the database."""

import re

from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

from . import Base
from .coach import Coach


_UNSET = object()
_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
_USERNAME_RE = re.compile(r'^[a-zA-Z0-9_]+$')
_FORBIDDEN_USERNAMES = frozenset({
    "admin", "administrator", "root", "postmaster", "abuse",
})


class User(Base):
    """Represents a user of the app."""

    __tablename__ = 'users'
    id       = Column(Integer,     nullable=False, primary_key=True)
    username = Column(String(128), nullable=False, unique=True)
    name     = Column(String(128), nullable=True)
    email    = Column(String(128), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    phone    = Column(String(16),  nullable=True)
    is_coach = Column(Boolean,     nullable=False)
    is_admin = Column(Boolean,     nullable=False, default=False)

    coach = relationship("Coach", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __init__(self, username, email, pwd, is_coach=False, description=None,
                 tags=None, phone=None, is_admin=False, name=None,
                 price=None, photo_url=None):
        """Generates a new user profile.

        :param username: unique login identifier
        :param email: email address
        :param pwd: user's password
        :param is_coach: is the user a coach
        :param description: profile description (required for coaches)
        :param tags: list of Tag objects (0-5, for coaches only)
        :param is_admin: whether the user has admin privileges
        :param name: display name (required for coaches, optional otherwise)
        :param price: coaching price per hour (coaches only, optional)
        :param photo_url: URL to coach photo (coaches only, optional)
        """
        if not isinstance(username, str) or not username.strip():
            raise ValueError("username must be a non-empty string")
        if not _USERNAME_RE.match(username):
            raise ValueError(
                "username must only contain letters, digits or underscores (\"_\")"
            )
        if username.lower() in _FORBIDDEN_USERNAMES:
            raise ValueError(f"username '{username}' is not allowed")

        if not isinstance(email, str):
            raise TypeError("email must be a string")
        if not _EMAIL_RE.match(email):
            raise ValueError("email has an invalid format")

        if not isinstance(pwd, str):
            raise TypeError("password must be a string")
        if len(pwd) < 8:
            raise ValueError("password must be at least 8 characters")

        elif is_coach or name is not None:
            if is_coach and name is None:
                raise ValueError("name is mandatory for coaches")
            if not isinstance(name, str):
                raise TypeError("name must be a string")
            if len(name) < 3:
                raise ValueError("name must be at least 3 characters")

        self.password = generate_password_hash(pwd)
        self.username = username
        self.name     = name
        self.email    = email
        self.is_coach = is_coach
        self.phone    = phone
        self.is_admin = is_admin

        if is_coach:
            self.coach = Coach(description=description, price=price,
                               photo_url=photo_url)
            if tags:
                for tag in tags:
                    self.coach.add_tag(tag)

    def verify_pwd(self, pwd):
        """Verify the password.

        :param pwd: password to be checked
        :return: True if the hash matches the stored password
        """
        return check_password_hash(self.password, pwd)

    def update_profile(self, name=_UNSET, email=_UNSET, pwd=None,
                       description=None, tags=None, phone=_UNSET,
                       username=_UNSET, price=None, photo_url=None):
        """Update the user profile fields.

        :param name: new display name (_UNSET = no change, None = clear)
        :param email: new email (optional)
        :param pwd: new password (optional)
        :param description: new description (coach only, optional)
        :param tags: new list of Tag objects (coach only, 0-5)
        :param username: new unique username (optional)
        :param price: new coaching price (coach only, optional)
        :param photo_url: new photo URL (coach only, optional)
        """
        if username is not _UNSET:
            if not isinstance(username, str) or not username.strip():
                raise ValueError("username must be a non-empty string")
            if not _USERNAME_RE.match(username):
                raise ValueError(
                    "username must only contain letters, digits or underscores (\"_\")"
                )
            if username.lower() in _FORBIDDEN_USERNAMES:
                raise ValueError(f"username '{username}' is not allowed")
            self.username = username

        if name is not _UNSET:
            if name is not None:
                if not isinstance(name, str):
                    raise TypeError("name must be a string")
                if len(name) < 3:
                    raise ValueError("name must be at least 3 characters")
            elif self.is_coach:
                raise ValueError("name is required for coaches")
            self.name = name

        if email is not _UNSET:
            if not isinstance(email, str):
                raise TypeError("email must be a string")
            if not _EMAIL_RE.match(email):
                raise ValueError("email has an invalid format")
            self.email = email

        if pwd is not None:
            if not isinstance(pwd, str):
                raise TypeError("password must be a string")
            if len(pwd) < 8:
                raise ValueError("password must be at least 8 characters")
            self.password = generate_password_hash(pwd)

        if phone is not _UNSET:
            if phone is not None and not isinstance(phone, str):
                raise TypeError("phone must be a string")
            self.phone = phone

        if self.is_coach:
            if description is not None:
                if not isinstance(description, str):
                    raise TypeError("description must be a string")
                self.coach.description = description
            if tags is not None:
                self.coach.set_tags(tags)
            if price is not None:
                if not isinstance(price, int):
                    raise TypeError("price must be an integer")
                self.coach.price = price
            if photo_url is not None:
                if not isinstance(photo_url, str):
                    raise TypeError("photo_url must be a string")
                self.coach.photo_url = photo_url

    def to_dict(self):
        """Serialize user data to a dictionary."""
        d = {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "email": self.email,
            "is_coach": self.is_coach,
            "is_admin": self.is_admin,
            "phone": self.phone,
        }
        if self.coach:
            d["coach"] = self.coach.to_dict()
        return d

    def __repr__(self):
        return f"User(id={self.id!r}, name={self.name!r}, is_coach={self.is_coach!r})"

    def __str__(self):
        return f"User(name={self.name!r}, is_coach={self.is_coach!r})"
