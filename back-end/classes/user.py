#!/usr/bin/python3
"""
Defines the user profile to be stored in the database
"""


from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

from . import Base
from .coach import Coach


class User(Base):
    '''
    Class representing a user of the app
    '''
    __tablename__ = 'users'
    id            = Column(Integer,     nullable=False, primary_key=True)
    name          = Column(String(128), nullable=False)
    password      = Column(String(255), nullable=False)
    is_coach      = Column(Boolean,     nullable=False)
    nickname      = Column(String(64),  nullable=True)
    first_name    = Column(String(64),  nullable=True)
    last_name     = Column(String(64),  nullable=True)
    email         = Column(String(128), nullable=True, unique=True)
    zip_code      = Column(String(20),  nullable=True)
    phone         = Column(String(32),  nullable=True)
    profile_photo = Column(String(512), nullable=True)

    coach = relationship("Coach", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __init__(self, name, pwd, is_coach=False, description=None, tags=None,
                 nickname=None, first_name=None, last_name=None, email=None,
                 zip_code=None, phone=None, profile_photo=None):
        '''
        generates a new profile

        :param name: name of the user
        :param pwd: user's password
        :param is_coach: is the user a coach
        :param description: profile description (required for coaches)
        :param tags: list of Tag objects (0-5, for coaches only)
        :param nickname: display nickname
        :param first_name: first name
        :param last_name: last name
        :param email: email address
        :param zip_code: zip code
        :param phone: phone number
        :param profile_photo: URL to profile photo
        '''

        if not isinstance(name, str):
            raise TypeError("name must be a string")
        if len(name) < 5:
            raise ValueError("name must be at least 5 characters")

        if not isinstance(pwd, str):
            raise TypeError("password must be a string")
        if len(pwd) < 8:
            raise ValueError("password must be at least 8 characters")

        self.password = generate_password_hash(pwd)
        self.name     = name
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
        '''
        verify the password

        :param pwd: password to be checked
        :return: True if the hash of the password is the same as the profile
        '''
        return check_password_hash(self.password, pwd)

    def update_profile(self, name=None, pwd=None, description=None, tags=None,
                       nickname=None, first_name=None, last_name=None, email=None,
                       zip_code=None, phone=None, profile_photo=None):
        '''
        Update the user profile

        :param name: new name (optional)
        :param pwd: new password (optional)
        :param description: new description (coach only, optional)
        :param tags: new list of Tag objects (coach only, optional, 0-5)
        :param nickname: new nickname (optional)
        :param first_name: new first name (optional)
        :param last_name: new last name (optional)
        :param email: new email (optional)
        :param zip_code: new zip code (optional)
        :param phone: new phone (optional)
        :param profile_photo: new profile photo URL (optional)
        '''
        if name is not None:
            if not isinstance(name, str):
                raise TypeError("name must be a string")
            if len(name) < 5:
                raise ValueError("name must be at least 5 characters")
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
