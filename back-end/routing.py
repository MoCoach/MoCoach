from flask import Flask, jsonify, request
from flask_httpauth import HTTPBasicAuth
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "super-secret"
auth = HTTPBasicAuth()
jwt = JWTManager(app)

# note: "customer" means "non-coach"
# TODO login
# TODO register a new user
# TODO editing a profile (requires login, only for the user's own profile)
# TODO edit a password (requires login, only for the user's own profile, requires the old password for confirmation)
# TODO check a coach (no registration/login needed, can only look at a coach): {"name":..., "description":..., tags:[{"name":..., "description":...},...]}
# TODO get the list of coaches (no registration/login needed): [{"name":..., "description":..., tags:[{"name":..., "description":...},...]},...]
# TODO get a list of coaches with a give tag (no registration/login needed): [{"name":..., "description":..., tags:[{"name":..., "description":...},...]},...]
# TODO list the chats the user is in (requires login): [{id:..., coach:{id:..., name:...}, customer:{id:..., name:...}},...]
# TODO list the messages in a chat (requires login, only if the user is the coach or customer of the requested chat): [{sender:{id:..., name:...}, timestamp:..., text:...},...]
# TODO check the user's profile (requires login, only by the user himself or a coach that share a chat with the user)
# TODO send message from one user to another (requires login, the chats are always between a coach and a customer)(if a chat exists between sender and recipient, use the existing chat, otherwise only customers are allowed to start a chat)

if __name__ == '__main__': 
    app.run(debug=True, port=5000)
