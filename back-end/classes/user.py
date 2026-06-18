#!/usr/bin/python3
"""
Defines the user profile to be stored in the database
"""


from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from werkzeug.security import generate_password_hash, check_password_hash

Base = declarative_base()


class User(Base):
    '''
    Class representing a user of the app
    '''
    __tablename__ = 'users'
    id          = Column(Integer,     nullable=False, primary_key=True)
    name        = Column(String(128), nullable=True)
    password    = Column(String(255), nullable=True)
    description = Column(String(500), nullable=True)
    is_coach    = Column(Boolean,     nullable=False)

    def __init__(self, name=None, pwd=None, is_coach=False, description=None):
        '''
        generates a new profile

        :param name: name of the user (None for guests)
        :param pwd: user's password (None for guests)
        :param is_coach: is the user a coach (false for customers and guests)
        :param description: profile description (required for coaches)
        '''

        # Generate a guest profile
        if name is None:
            self.name     = None
            self.password = None
            self.is_coach = False
            self.description = None
            return

        # verify the name
        if not isinstance(name, str):
            raise TypeError("name must be a string")
        if len(name) < 5:
            raise ValueError("name must be at least 5 characters")

        # verify the password
        if pwd is None:
            raise TypeError("password is required")
        if not isinstance(pwd, str):
            raise TypeError("password must be a string")
        if len(pwd) < 8:
            raise ValueError("password must be at least 8 characters")

        # verify the description for coaches
        if is_coach:
            if not isinstance(description, str):
                raise TypeError("description must be a string")
            self.description = description
        else:
            self.description = None

        # set name, password and status
        self.password = generate_password_hash(pwd)
        self.name     = name
        self.is_coach = is_coach
    

    def register(self, name, pwd, is_coach=False, description=None):
        '''
        register the profile of a guest

        :param name: name of the user
        :param pwd: user's password
        :param is_coach: is the user a coach
        :param description: profile description (required for coaches)
        :return:
        '''
        # verify the name
        if name is None:
            raise TypeError("name is required")
        if not isinstance(name, str):
            raise TypeError("name must be a string")
        if len(name) < 5:
            raise ValueError("name must be at least 5 characters")

        # verify the password
        if pwd is None:
            raise TypeError("password is required")
        if not isinstance(pwd, str):
            raise TypeError("password must be a string")
        if len(pwd) < 8:
            raise ValueError("password must be at least 8 characters")

        # verify the description for coaches
        if is_coach:
            if not isinstance(description, str):
                raise TypeError("description must be a string")
            self.description = description
        else:
            self.description = None

        # set the name, password and status
        self.name     = name
        self.password = generate_password_hash(pwd)
        self.is_coach = is_coach


    def verify_pwd(self, pwd):
        '''
        verify the password

        :param pwd: password to be checked
        :return: True if the hash of the password is the same as the profile
        '''
        return check_password_hash(self.password, pwd)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "is_coach": self.is_coach,
        }

    def __repr__(self):
        return f"User(id={self.id!r}, name={self.name!r}, is_coach={self.is_coach!r})"

    def __str__(self):
        return f"User(name={self.name!r}, is_coach={self.is_coach!r})"