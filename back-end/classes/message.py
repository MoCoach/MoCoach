from time import time

from sqlalchemy import Column, Integer, String

# TODO save the message
class Message:
    '''
    Class representing a single message of a chat
    '''
    __tablename__ = 'messages'
    id        = Column(String(128), nullable=False, primary_key=True)
    chat_id   = Column(Integer,     nullable=False)
    sender_id = Column(Integer,     nullable=False)
    text      = Column(String(250), nullable=False)
    timestamp = Column(Integer,     nullable=False)

    def __init__(self, msg_id, chat_id, sender_id, text):
        '''
        Creates a new instance of message

        :param msg_id: id of the message
        :param chat_id: id of the chat
        :param sender_id: id of the sender
        :param text: text of the message
        '''
        self.id        = msg_id
        self.chat_id    = chat_id
        self.sender_id  = sender_id
        self.text       = text
        self.timestamp  = time()