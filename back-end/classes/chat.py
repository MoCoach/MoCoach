from time import time

from sqlalchemy import Column, Integer
from message import Message

class Chat:
    '''
    Class representing a chat
    '''
    __tablename__ = 'chats'
    id       = Column(Integer, nullable=False, primary_key=True)
    id_coach = Column(Integer, nullable=False)
    id_cust  = Column(Integer, nullable=False)
    msg_num  = Column(Integer, nullable=False)

    def __init__(self, id_coach, id_cust):
        self.id_coach = id_coach
        self.id_cust  = id_cust
        self.msg_num  = 0

    def new_msg(self, sender, text):
        '''
        insert new message
        :return:
        '''
        msg_id = f"{self.id}_{self.msg_num}"
        msg = Message(msg_id, self.id, sender, text)
        # TODO verify the write/send is successful before increment
        self.msg_num += 1
        return msg
