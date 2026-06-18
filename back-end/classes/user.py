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
    id       = Column(Integer,     nullable=False, primary_key=True)
    name     = Column(String(128), nullable=True)
    password = Column(String(255), nullable=True)
    coach    = Column(Boolean,     nullable=False)

    def __init__(self, name=None, pwd=None, coach = False):
        '''
        generates a new profile

        :param name: name of the user (None for guests)
        :param pwd: user's password (None for guests)
        :param coach: is the user a coach (false for customers and guests)
        '''

        # Generate a guest profile
        if name == None:
            self.name     = None
            self.password = None
            self.coach    = False
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
        
        # set name, password and status
        self.password = generate_password_hash(pwd)
        self.name     = name
        self.coach    = coach
    

    def register(self, name, pwd):
        '''
        register the profile of a guest

        :param name: name of the user
        :param pwd: user's password
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
        
        # set the name and password
        self.name = name
        self.password = generate_password_hash(pwd)


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
            "coach": self.coach,
        }

    def __repr__(self):
        return f"User(id={self.id!r}, name={self.name!r}, coach={self.coach!r})"

    def __str__(self):
        return f"User(name={self.name!r}, coach={self.coach!r})"