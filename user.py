#!/usr/bin/python3
"""
This is a module-level docstring.
It describes the purpose of the entire script/module.
"""


from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from werkzeug.security import generate_password_hash, check_password_hash

Base = declarative_base()


class User(Base):
    '''
    Docstring for the class
    '''
    __tablename__ = 'states'
    id = Column(Integer, nullable=False, primary_key=True)
    name = Column(String(128), nullable=True)
    password = Column(Integer, nullable=True)
    coach = Column(Boolean, nullable=False)

    def __init__(self, name=None, pwd=None, coach = False):
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
        if name == None:
            raise Exception("name empty")
        if pwd == None:
            raise Exception("password empty")
        self.name = name
        self.password = generate_password_hash(pwd)

    def verify_pwd(self, pwd):
        return check_password_hash(self.password, pwd)