#!/usr/bin/python3
"""
Defines the user profile to be stored in the database
"""


import re

from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

from . import Base
from .coach import Coach


_UNSET = object()
_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


class User(Base):
    '''
    Class representing a user of the app
    '''
    __tablename__ = 'users'
    id       = Column(Integer,     nullable=False, primary_key=True)
    name     = Column(String(128), nullable=False)
    email    = Column(String(128), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    phone    = Column(String(16),  nullable=True)
    is_coach = Column(Boolean,     nullable=False)

    coach = relationship("Coach", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __init__(self, name, email, pwd, is_coach=False, description=None, tags=None, phone=None):
        '''
        generates a new profile

        :param name: name of the user
        :param email: email address
        :param pwd: user's password
        :param is_coach: is the user a coach
        :param description: profile description (required for coaches)
        :param tags: list of Tag objects (0-5, for coaches only)
        '''

        if not isinstance(name, str):
            raise TypeError("name must be a string")
        if len(name) < 5:
            raise ValueError("name must be at least 5 characters")

        if not isinstance(email, str):
            raise TypeError("email must be a string")
        if not _EMAIL_RE.match(email):
            raise ValueError("email has an invalid format")

        if not isinstance(pwd, str):
            raise TypeError("password must be a string")
        if len(pwd) < 8:
            raise ValueError("password must be at least 8 characters")

        self.password = generate_password_hash(pwd)
        self.name     = name
        self.email    = email
        self.is_coach = is_coach
        self.phone    = phone

        if is_coach:
            self.coach = Coach(description=description)
            if tags:
                for tag in tags:
                    self.coach.add_tag(tag)

    def verify_pwd(self, pwd):
        '''
        verify the password

        :param pwd: password to be checked
        :return: True if the hash of the password is the same as the profile
        '''
        return check_password_hash(self.password, pwd)

    def update_profile(self, name=None, email=_UNSET, pwd=None, description=None, tags=None, phone=_UNSET):
        '''
        Update the user profile

        :param name: new name (optional)
        :param email: new email (optional)
        :param pwd: new password (optional)
        :param description: new description (coach only, optional)
        :param tags: new list of Tag objects (coach only, optional, 0-5)
        '''
        if name is not None:
            if not isinstance(name, str):
                raise TypeError("name must be a string")
            if len(name) < 5:
                raise ValueError("name must be at least 5 characters")
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

    def to_dict(self):
        d = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "is_coach": self.is_coach,
            "phone": self.phone,
        }
        if self.coach:
            d["coach"] = self.coach.to_dict()
        return d

    def __repr__(self):
        return f"User(id={self.id!r}, name={self.name!r}, is_coach={self.is_coach!r})"

    def __str__(self):
        return f"User(name={self.name!r}, is_coach={self.is_coach!r})"
