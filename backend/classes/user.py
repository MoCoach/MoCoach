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
    id                   = Column(Integer,     nullable=False, primary_key=True)
    username             = Column(String(128), nullable=False, unique=True)
    first_name           = Column(String(128), nullable=True)
    last_name            = Column(String(128), nullable=True)
    email                = Column(String(128), nullable=False, unique=True)
    password             = Column(String(255), nullable=False)
    phone                = Column(String(16),  nullable=True)
    is_coach             = Column(Boolean,     nullable=False)
    is_admin             = Column(Boolean,     nullable=False, default=False)
    is_blocked           = Column(Boolean,     nullable=False, default=False)
    is_messaging_blocked = Column(Boolean,     nullable=False, default=False)
    is_vetted            = Column(Boolean,     nullable=False, default=False)
    is_certified         = Column(Boolean,     nullable=False, default=False)
    email_blocked        = Column(Boolean,     nullable=False, default=False)
    ip_blocked           = Column(Boolean,     nullable=False, default=False)
    ip_address           = Column(String(45),  nullable=True)

    coach = relationship("Coach", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __init__(self, username: str, email: str, pwd: str, is_coach: bool = False, description: str | None = None,
                 tags: list | None = None, phone: str | None = None, is_admin: bool = False, first_name: str | None = None,
                 last_name: str | None = None, city_id: int | None = None, price: int | None = None, ip_address: str | None = None) -> None:
        """Generates a new user profile.

        :param username: unique login identifier
        :param email: email address
        :param pwd: user's password
        :param is_coach: is the user a coach
        :param description: profile description (required for coaches)
        :param tags: list of Tag objects (0-5, for coaches only)
        :param is_admin: whether the user has admin privileges
        :param first_name: first name (required for coaches, optional otherwise)
        :param last_name: last name (required for coaches, optional otherwise)
        :param city_id: id of the city (required for coaches)
        :param price: coaching price per hour (coaches only, optional)
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

        def _validate_name(val: str | None, label: str) -> None:
            if val is not None:
                if not isinstance(val, str):
                    raise TypeError(f"{label} must be a string")
                if len(val) < 1:
                    raise ValueError(f"{label} must be at least 1 character")

        if is_coach:
            if not first_name:
                raise ValueError("first_name is mandatory for coaches")
            if not last_name:
                raise ValueError("last_name is mandatory for coaches")

        _validate_name(first_name, "first_name")
        _validate_name(last_name, "last_name")

        self.password   = generate_password_hash(pwd, method='pbkdf2:sha256')
        self.username   = username
        self.first_name = first_name
        self.last_name  = last_name
        self.email      = email
        self.is_coach   = is_coach
        self.phone      = phone
        self.is_admin   = is_admin
        self.ip_address = ip_address

        if is_coach:
            if city_id is None:
                raise ValueError("city_id is mandatory for coaches")
            self.coach = Coach(description=description, city_id=city_id,
                               price=price)
            if tags:
                for tag in tags:
                    self.coach.add_tag(tag)

    def verify_pwd(self, pwd: str) -> bool:
        """Verify the password.

        :param pwd: password to be checked
        :return: True if the hash matches the stored password
        """
        return check_password_hash(self.password, pwd)

    def update_profile(self, first_name: object = _UNSET, last_name: object = _UNSET, email: object = _UNSET,
                       pwd: str | None = None, description: str | None = None, tags: list | None = None, phone: object = _UNSET,
                       username: object = _UNSET, city_id: int | None = None, price: int | None = None) -> None:
        """Update the user profile fields.

        :param first_name: new first name (_UNSET = no change, None = clear)
        :param last_name: new last name (_UNSET = no change, None = clear)
        :param email: new email (optional)
        :param pwd: new password (optional)
        :param description: new description (coach only, optional)
        :param tags: new list of Tag objects (coach only, 0-5)
        :param username: new unique username (optional)
        :param price: new coaching price (coach only, optional)
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

        def _validate_name(val: str | None, label: str) -> None:
            if val is not None:
                if not isinstance(val, str):
                    raise TypeError(f"{label} must be a string")
                if len(val) < 1:
                    raise ValueError(f"{label} must be at least 1 character")

        if first_name is not _UNSET:
            _validate_name(first_name, "first_name")
            if first_name is None and self.is_coach:
                raise ValueError("first_name is required for coaches")
            self.first_name = first_name

        if last_name is not _UNSET:
            _validate_name(last_name, "last_name")
            if last_name is None and self.is_coach:
                raise ValueError("last_name is required for coaches")
            self.last_name = last_name

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
            self.password = generate_password_hash(pwd, method='pbkdf2:sha256')

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
            if city_id is not None:
                if not isinstance(city_id, int):
                    raise TypeError("city_id must be an int")
                self.coach.city_id = city_id
            if price is not None:
                if not isinstance(price, int):
                    raise TypeError("price must be an integer")
                self.coach.price = price

    def _profile_pic_path(self) -> str | None:
        """Return the relative URL to the profile picture, or ``None``."""
        import os
        path = os.path.join(
            os.path.dirname(__file__), '..', 'static', 'uploads',
            'profile_pics', str(self.id), 'profile.jpg'
        )
        if os.path.isfile(path):
            mtime = int(os.path.getmtime(path))
            return f"static/uploads/profile_pics/{self.id}/profile.jpg?t={mtime}"
        return None

    def to_dict(self) -> dict:
        """Serialize user data to a dictionary."""
        d = {
            "id": self.id,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "is_coach": self.is_coach,
            "is_admin": self.is_admin,
            "phone": self.phone,
            "is_blocked": self.is_blocked,
            "is_messaging_blocked": self.is_messaging_blocked,
            "is_vetted": self.is_vetted,
            "is_certified": self.is_certified,
            "email_blocked": self.email_blocked,
            "ip_blocked": self.ip_blocked,
            "ip_address": self.ip_address,
        }
        if self.coach:
            d["coach"] = self.coach.to_dict()
        pic = self._profile_pic_path()
        if pic:
            d["profile_pic"] = pic
        return d

    def __repr__(self):
        return f"User(id={self.id!r}, first_name={self.first_name!r}, last_name={self.last_name!r}, is_coach={self.is_coach!r})"

    def __str__(self):
        return f"User(first_name={self.first_name!r}, last_name={self.last_name!r}, is_coach={self.is_coach!r})"
