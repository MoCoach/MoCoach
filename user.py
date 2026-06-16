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
    id = Column(Integer, nullable=False, primary_key=True)
    name = Column(String(128), nullable=True)
    password = Column(Integer, nullable=True)
    coach = Column(Boolean, nullable=False)

    def __init__(self, name=None, pwd=None, coach = False):
        '''
        generates a new profile

        :param name: name of the user (None for guests)
        :param pwd: user's password (None for guests)
        :param coach: is the user a coach (false for clients and guests)
        '''
        if name == None:
            self.name = None
            self.password = None
            self.coach = False
            return
        if pwd != None:
            self.password = generate_password_hash(pwd)
        # TODO
        else:
            raise Exception("no password given")
        self.name = name
        self.coach = coach
    
    def register(self, name, pwd):
        '''
        register the profile of a guest

        :param name: name of the user
        :param pwd: user's password
        :return:
        '''
        if name == None:
            raise Exception("name empty")
        if pwd == None:
            raise Exception("password empty")
        self.name = name
        self.password = generate_password_hash(pwd)

    def verify_pwd(self, pwd):
        '''
        verify the password

        :param pwd: password to be checked
        :return: True if the hash of the password is the same as the profile
        '''
        return check_password_hash(self.password, pwd)