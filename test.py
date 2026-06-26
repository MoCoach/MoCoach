"""Integration tests for the MoCoach backend API.

Usage:
    python test.py
"""

import sys
import requests
from sqlalchemy import create_engine, text

BASE = "http://localhost:5678"
DB_URL = "mysql+mysqldb://emilien:1234@localhost/moCoach"

TABLES = ["users", "coaches", "tags", "coach_tags", "chats", "messages"]

ADMIN_USERNAME = "__admin__"
ADMIN_EMAIL = "__admin__@mo coach.local"
ADMIN_PASSWORD = "adminpass"

DATA = {}


def report(label, status, detail=""):
    ok = "OK"
    fail = "FAIL"
    icon = ok if status else fail
    print(f"  [{icon}] {label}" + (f"  --  {detail}" if detail else ""))


def tables_are_empty():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        for table in TABLES:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            if result.scalar() > 0:
                engine.dispose()
                return False
    engine.dispose()
    return True


def clear_tables():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        for table in TABLES:
            conn.execute(text(f"TRUNCATE TABLE {table}"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        conn.commit()
    engine.dispose()


def seed_admin_user():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT id FROM users WHERE username = :u"),
            {"u": ADMIN_USERNAME},
        )
        if result.first() is None:
            from werkzeug.security import generate_password_hash
            pwd = generate_password_hash(ADMIN_PASSWORD)
            conn.execute(
                text(
                    "INSERT INTO users (username, email, password, is_coach, is_admin) "
                    "VALUES (:u, :e, :p, 0, 1)"
                ),
                {"u": ADMIN_USERNAME, "e": ADMIN_EMAIL, "p": pwd},
            )
            conn.commit()
    engine.dispose()


def check_db_state():
    if tables_are_empty():
        seed_admin_user()
        return

    invalid_count = 0
    while True:
        ans = input("The database tables are not empty. Delete all data? [y/N] ").strip().lower()
        if ans in ("y", "yes"):
            clear_tables()
            seed_admin_user()
            print("Tables cleared, admin seeded.")
            return
        elif ans in ("n", "no", ""):
            print("Test cancelled.")
            sys.exit(0)
        else:
            invalid_count += 1
            if invalid_count >= 3:
                print("Too many invalid answers. Test cancelled.")
                sys.exit(0)
            print("Invalid answer. Enter 'y' or 'n'.")


# ===================================================================
# Availability checks  (public)
# ===================================================================
def test_availability():
    print("\n=== Availability (public) ===")

    r = requests.get(f"{BASE}/check-username/newuser")
    print(r.json())
    report("GET /check-username/<available>", r.status_code == 200 and r.json().get("available") is True)

    r = requests.get(f"{BASE}/check-email/new@example.com")
    print(r.json())
    report("GET /check-email/<available>", r.status_code == 200 and r.json().get("available") is True)


# ===================================================================
# Registration
# ===================================================================
def test_register():
    print("\n=== Register ===")

    r = requests.post(f"{BASE}/register", json={})
    print(r.json())
    report("POST /register (no body)", r.status_code == 400)

    r = requests.post(f"{BASE}/register", json={"username": "u", "password": "12345678"})
    print(r.json())
    report("POST /register (missing email)", r.status_code == 400)

    r = requests.post(f"{BASE}/register", json={"username": "u1", "email": "u1@x.com", "password": "short"})
    print(r.json())
    report("POST /register (password too short)", r.status_code == 400)

    r = requests.post(f"{BASE}/register", json={
        "username": "alice", "email": "alice@x.com", "password": "alicepass",
        "name": "Alice", "phone": "111",
    })
    print(r.json())
    report("POST /register (customer)", r.status_code == 201 and r.json().get("username") == "alice")
    DATA["alice_id"] = r.json()["id"]

    r = requests.post(f"{BASE}/register", json={
        "username": "alice", "email": "alice2@x.com", "password": "alicepass",
    })
    print(r.json())
    report("POST /register (duplicate username)", r.status_code == 409)

    r = requests.post(f"{BASE}/register", json={
        "username": "alice2", "email": "alice@x.com", "password": "alicepass",
    })
    print(r.json())
    report("POST /register (duplicate email)", r.status_code == 409)

    r = requests.post(f"{BASE}/register", json={
        "username": "bob", "email": "bob@x.com", "password": "bobpass8",
        "name": "Bob", "is_coach": True, "description": "I am Bob",
        "tags": [{"name": "fitness", "description": "Fitness coaching"}],
    })
    print(r.json())
    report("POST /register (coach)", r.status_code == 201 and r.json().get("is_coach") is True)
    DATA["bob_id"] = r.json()["id"]
    DATA["bob_coach_id"] = r.json()["coach"]["id"]

    r = requests.post(f"{BASE}/register", json={
        "username": "bob2", "email": "bob2@x.com", "password": "bobpass8",
        "is_coach": True,
    })
    print(r.json())
    report("POST /register (coach missing description)", r.status_code == 400)


# ===================================================================
# Login
# ===================================================================
def test_login():
    print("\n=== Login ===")

    r = requests.post(f"{BASE}/login", json={})
    print(r.json())
    report("POST /login (no body)", r.status_code == 400)

    r = requests.post(f"{BASE}/login", json={"login": "alice"})
    print(r.json())
    report("POST /login (missing password)", r.status_code == 400)

    r = requests.post(f"{BASE}/login", json={"login": "alice", "password": "wrongpass"})
    print(r.json())
    report("POST /login (bad password)", r.status_code == 401)

    r = requests.post(f"{BASE}/login", json={"login": "alice", "password": "alicepass"})
    print(r.json())
    report("POST /login (by username)", r.status_code == 200 and "access_token" in r.json())
    TOKENS["alice"] = r.json()["access_token"]

    r = requests.post(f"{BASE}/login", json={"login": "bob@x.com", "password": "bobpass8"})
    print(r.json())
    report("POST /login (by email)", r.status_code == 200 and "access_token" in r.json())
    TOKENS["bob"] = r.json()["access_token"]

    r = requests.post(f"{BASE}/login", json={"login": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    print(r.json())
    report("POST /login (admin)", r.status_code == 200 and "access_token" in r.json())
    TOKENS["admin"] = r.json()["access_token"]


# ===================================================================
# Tags  (public read + admin create)
# ===================================================================
def test_tags():
    print("\n=== Tags ===")

    # Creating a tag requires admin
    h_admin = {"Authorization": f"Bearer {TOKENS['admin']}"}
    r = requests.post(f"{BASE}/tag", json={"name": "nutrition", "description": "Nutrition advice"}, headers=h_admin)
    print(r.json())
    report("POST /tag (admin creates tag)", r.status_code == 201 and r.json().get("name") == "nutrition")

    r = requests.post(f"{BASE}/tag", json={"name": "nutrition", "description": "dup"}, headers=h_admin)
    print(r.text)
    report("POST /tag (duplicate name)", r.status_code in (400, 409, 500))

    r = requests.post(f"{BASE}/tag", json={"name": "yoga", "description": "Yoga classes"}, headers=h_admin)
    print(r.json())
    report("POST /tag (admin creates second tag)", r.status_code == 201)

    r = requests.post(f"{BASE}/tag", json={}, headers=h_admin)
    print(r.json())
    report("POST /tag (missing fields)", r.status_code == 400)

    # List all tags – should include "fitness" (created implicitly during coach reg)
    # and "nutrition" / "yoga" (created by admin above)
    r = requests.get(f"{BASE}/tag")
    print(r.json())
    tag_names = {t["name"] for t in r.json()}
    report("GET /tag (lists created tags)", r.status_code == 200 and "fitness" in tag_names and "nutrition" in tag_names and "yoga" in tag_names)


# ===================================================================
# Coaches (public read)
# ===================================================================
def test_coaches():
    print("\n=== Coaches (public) ===")

    # List all coaches – bob was registered earlier
    r = requests.get(f"{BASE}/coach")
    print(r.json())
    coaches = r.json()
    report("GET /coach (lists coaches)", r.status_code == 200 and any(c["name"] == "Bob" for c in coaches))

    bob_coach = next(c for c in coaches if c["name"] == "Bob")
    tag_names = {t["name"] for t in bob_coach["tags"]}
    report("GET /coach (bob has fitness tag)", r.status_code == 200 and "fitness" in tag_names)

    # Get bob by ID (coach id = user id in this schema)
    r = requests.get(f"{BASE}/coach/{DATA['bob_coach_id']}")
    print(r.json())
    report("GET /coach/<id> (bob by id)", r.status_code == 200 and r.json().get("name") == "Bob")

    # Not found
    r = requests.get(f"{BASE}/coach/9999")
    print(r.json())
    report("GET /coach/9999 (not found)", r.status_code == 404)

    # Filter by tag
    r = requests.get(f"{BASE}/coach/tag/fitness")
    print(r.json())
    report("GET /coach/tag/fitness (lists bob)", r.status_code == 200 and any(c["name"] == "Bob" for c in r.json()))

    # Non-existent tag
    r = requests.get(f"{BASE}/coach/tag/nonexistent")
    print(r.json())
    report("GET /coach/tag/nonexistent (empty)", r.status_code == 200 and r.json() == [])


# ===================================================================
# Badges
# ===================================================================
def test_badges():
    print("\n=== Badges ===")

    h_admin = {"Authorization": f"Bearer {TOKENS['admin']}"}
    h_alice = {"Authorization": f"Bearer {TOKENS['alice']}"}
    h_bob = {"Authorization": f"Bearer {TOKENS['bob']}"}

    # Admin creates badges
    r = requests.post(f"{BASE}/badge", json={"name": "top coach", "for_coach": True}, headers=h_admin)
    print(r.json())
    report("POST /badge (create coach badge)", r.status_code == 201 and r.json().get("name") == "top coach")
    DATA["coach_badge_id"] = r.json()["id"]

    r = requests.post(f"{BASE}/badge", json={"name": "star client", "for_coach": False}, headers=h_admin)
    print(r.json())
    report("POST /badge (create customer badge)", r.status_code == 201 and r.json().get("name") == "star client")
    DATA["cust_badge_id"] = r.json()["id"]

    # List all badges
    r = requests.get(f"{BASE}/badge/all")
    print(r.json())
    report("GET /badge/all (lists badges)", r.status_code == 200 and len(r.json()) == 2)

    # Non-admin cannot create
    r = requests.post(f"{BASE}/badge", json={"name": "x", "for_coach": True}, headers=h_alice)
    print(r.json())
    report("POST /badge (non-admin)", r.status_code == 403)

    # Customer → Coach (different roles → should succeed)
    r = requests.post(f"{BASE}/badge/give", json={
        "user_id": DATA["bob_id"], "badge_id": DATA["coach_badge_id"],
    }, headers=h_alice)
    print(r.json())
    report("POST /badge/give (customer→coach)", r.status_code == 201)

    # Coach → Customer (recipient is a customer → should succeed)
    r = requests.post(f"{BASE}/badge/give", json={
        "user_id": DATA["alice_id"], "badge_id": DATA["cust_badge_id"],
    }, headers=h_bob)
    print(r.json())
    report("POST /badge/give (coach→customer)", r.status_code == 201)

    # Customer → Customer (same role → should fail)
    r = requests.put(f"{BASE}/profile", json={},
        headers={"Authorization": f"Bearer {TOKENS['admin']}"})
    admin_user_id = r.json()["id"]
    r = requests.post(f"{BASE}/badge/give", json={
        "user_id": admin_user_id, "badge_id": DATA["coach_badge_id"],
    }, headers=h_alice)
    print(r.json())
    report("POST /badge/give (customer→customer, same role)", r.status_code == 400)

    # Same badge again (duplicate triplet → should fail)
    r = requests.post(f"{BASE}/badge/give", json={
        "user_id": DATA["bob_id"], "badge_id": DATA["coach_badge_id"],
    }, headers=h_alice)
    print(r.json())
    report("POST /badge/give (duplicate)", r.status_code == 409)

    # Give to self (should fail)
    r = requests.post(f"{BASE}/badge/give", json={
        "user_id": DATA["bob_id"], "badge_id": DATA["coach_badge_id"],
    }, headers=h_bob)
    print(r.json())
    report("POST /badge/give (to self)", r.status_code == 400)

    # Check alice's badges (should have 1: star client from bob)
    r = requests.get(f"{BASE}/badge", headers=h_alice)
    print(r.json())
    badges = r.json()
    report("GET /badge (alice's badges)", r.status_code == 200 and len(badges) == 1)

    # Check bob's badges (should have 1: top coach from alice)
    r = requests.get(f"{BASE}/badge", headers=h_bob)
    print(r.json())
    badges = r.json()
    report("GET /badge (bob's badges)", r.status_code == 200 and len(badges) == 1)

    # Missing fields
    r = requests.post(f"{BASE}/badge/give", json={}, headers=h_alice)
    print(r.json())
    report("POST /badge/give (missing fields)", r.status_code == 400)

    # Non-existent user
    r = requests.post(f"{BASE}/badge/give", json={
        "user_id": 9999, "badge_id": DATA["coach_badge_id"],
    }, headers=h_alice)
    print(r.json())
    report("POST /badge/give (bad user)", r.status_code == 404)

    # Non-existent badge
    r = requests.post(f"{BASE}/badge/give", json={
        "user_id": DATA["bob_id"], "badge_id": 9999,
    }, headers=h_alice)
    print(r.json())
    report("POST /badge/give (bad badge)", r.status_code == 404)

    # Edit badge (admin)
    r = requests.put(f"{BASE}/badge/{DATA['coach_badge_id']}",
        json={"name": "top coach updated"}, headers=h_admin)
    print(r.json())
    report("PUT /badge/<id> (edit name)", r.status_code == 200 and r.json().get("name") == "top coach updated")

    r = requests.put(f"{BASE}/badge/{DATA['coach_badge_id']}",
        json={"for_coach": False}, headers=h_admin)
    print(r.json())
    report("PUT /badge/<id> (edit for_coach)", r.status_code == 200 and r.json().get("for_coach") is False)

    # Reset for_coach back
    requests.put(f"{BASE}/badge/{DATA['coach_badge_id']}",
        json={"for_coach": True}, headers=h_admin)

    # Rename badge to existing name (should fail)
    r = requests.put(f"{BASE}/badge/{DATA['coach_badge_id']}",
        json={"name": "star client"}, headers=h_admin)
    print(r.json())
    report("PUT /badge/<id> (rename to existing name)", r.status_code == 409)

    # Non-admin cannot edit
    r = requests.put(f"{BASE}/badge/{DATA['coach_badge_id']}",
        json={"name": "x"}, headers=h_alice)
    print(r.json())
    report("PUT /badge/<id> (non-admin)", r.status_code == 403)

    # Badge not found
    r = requests.put(f"{BASE}/badge/9999", json={"name": "x"}, headers=h_admin)
    print(r.json())
    report("PUT /badge/9999 (not found)", r.status_code == 404)

    # Delete badge (admin)
    r = requests.delete(f"{BASE}/badge/{DATA['cust_badge_id']}", headers=h_admin)
    print(r.json())
    report("DELETE /badge/<id> (delete badge)", r.status_code == 200)

    # Verify deleted badge is gone
    r = requests.get(f"{BASE}/badge/all")
    print(r.json())
    report("GET /badge/all (verify deleted)", r.status_code == 200 and len(r.json()) == 1)

    # Non-admin cannot delete
    r = requests.delete(f"{BASE}/badge/{DATA['coach_badge_id']}", headers=h_alice)
    print(r.json())
    report("DELETE /badge/<id> (non-admin)", r.status_code == 403)


# ===================================================================
# Admin tag edit/delete
# ===================================================================
def test_admin_tag():
    print("\n=== Admin Tag management ===")

    h_admin = {"Authorization": f"Bearer {TOKENS['admin']}"}
    h_alice = {"Authorization": f"Bearer {TOKENS['alice']}"}

    # Create a tag as admin
    r = requests.post(f"{BASE}/tag", json={"name": "test-tag", "description": "test"}, headers=h_admin)
    print(r.json())
    report("POST /tag (admin creates tag)", r.status_code == 201)
    tag_id = r.json()["id"]

    # Edit tag
    r = requests.put(f"{BASE}/tag/{tag_id}", json={"name": "test-tag-updated"}, headers=h_admin)
    print(r.json())
    report("PUT /tag/<id> (edit name)", r.status_code == 200 and r.json().get("name") == "test-tag-updated")

    r = requests.put(f"{BASE}/tag/{tag_id}", json={"description": "updated desc"}, headers=h_admin)
    print(r.json())
    report("PUT /tag/<id> (edit description)", r.status_code == 200 and r.json().get("description") == "updated desc")

    # Create a second tag to test rename uniqueness
    r = requests.post(f"{BASE}/tag", json={"name": "existing-tag", "description": "desc"}, headers=h_admin)
    print(r.json())
    existing_tag_id = r.json()["id"]

    # Rename first tag to second tag's name (should fail)
    r = requests.put(f"{BASE}/tag/{tag_id}", json={"name": "existing-tag"}, headers=h_admin)
    print(r.json())
    report("PUT /tag/<id> (rename to existing name)", r.status_code == 409)

    # Non-admin cannot edit
    r = requests.put(f"{BASE}/tag/{tag_id}", json={"name": "x"}, headers=h_alice)
    print(r.json())
    report("PUT /tag/<id> (non-admin)", r.status_code == 403)

    # Tag not found
    r = requests.put(f"{BASE}/tag/9999", json={"name": "x"}, headers=h_admin)
    print(r.json())
    report("PUT /tag/9999 (not found)", r.status_code == 404)

    # Delete both tags
    r = requests.delete(f"{BASE}/tag/{tag_id}", headers=h_admin)
    print(r.json())
    report("DELETE /tag/<id> (delete tag)", r.status_code == 200)
    requests.delete(f"{BASE}/tag/{existing_tag_id}", headers=h_admin)

    # Verify deleted tag is gone
    all_tags = requests.get(f"{BASE}/tag").json()
    report("GET /tag (verify deleted)", all(status != 404 for status in [200]) and tag_id not in [t["id"] for t in all_tags])

    # Non-admin cannot delete
    r = requests.post(f"{BASE}/tag", json={"name": "another-tag", "description": "desc"}, headers=h_admin)
    another_id = r.json()["id"]
    r = requests.delete(f"{BASE}/tag/{another_id}", headers=h_alice)
    print(r.json())
    report("DELETE /tag/<id> (non-admin)", r.status_code == 403)


# ===================================================================
# Authenticated profile operations
# ===================================================================
def test_profile():
    print("\n=== Profile ===")

    alice = TOKENS["alice"]
    bob = TOKENS["bob"]
    headers_alice = {"Authorization": f"Bearer {alice}"}
    headers_bob = {"Authorization": f"Bearer {bob}"}

    r = requests.put(f"{BASE}/profile", json={"name": "X"})
    print(r.json())
    report("PUT /profile (no token)", r.status_code == 401)

    r = requests.put(f"{BASE}/profile", json={"name": "Alice Updated"}, headers=headers_alice)
    print(r.json())
    report("PUT /profile (update name)", r.status_code == 200 and r.json().get("name") == "Alice Updated")

    uid = r.json()["id"]
    r = requests.get(f"{BASE}/profile/{uid}", headers=headers_alice)
    print(r.json())
    report("GET /profile/<own>", r.status_code == 200 and r.json().get("name") == "Alice Updated")

    r = requests.get(f"{BASE}/profile/{uid}", headers=headers_bob)
    print(r.json())
    report("GET /profile/<other> (no chat)", r.status_code == 403)

    r = requests.put(f"{BASE}/password", json={"old_password": "alicepass", "new_password": "newalice123"}, headers=headers_alice)
    print(r.json())
    report("PUT /password", r.status_code == 200)

    r = requests.put(f"{BASE}/password", json={"old_password": "wrong", "new_password": "newalice123"}, headers=headers_alice)
    print(r.json())
    report("PUT /password (wrong old)", r.status_code == 401)

    requests.put(f"{BASE}/password", json={"old_password": "newalice123", "new_password": "alicepass"}, headers=headers_alice)


# ===================================================================
# Messages & Chats
# ===================================================================
def test_messages():
    print("\n=== Messages & Chats ===")

    alice = TOKENS["alice"]
    bob = TOKENS["bob"]
    h_alice = {"Authorization": f"Bearer {alice}"}
    h_bob = {"Authorization": f"Bearer {bob}"}

    r = requests.put(f"{BASE}/profile", json={}, headers=h_alice)
    print(r.json())
    alice_id = r.json()["id"]
    r = requests.put(f"{BASE}/profile", json={}, headers=h_bob)
    print(r.json())
    bob_id = r.json()["id"]

    r = requests.post(f"{BASE}/message", json={"recipient_id": alice_id, "text": "hi"}, headers=h_bob)
    print(r.json())
    report("POST /message (coach starts chat)", r.status_code == 403)

    r = requests.post(f"{BASE}/message", json={"recipient_id": bob_id, "text": "Hello Bob!"}, headers=h_alice)
    print(r.json())
    report("POST /message (customer starts chat)", r.status_code == 201)
    msg1 = r.json()

    r = requests.post(f"{BASE}/message", json={"recipient_id": bob_id, "text": "How are you?"}, headers=h_alice)
    print(r.json())
    report("POST /message (second msg)", r.status_code == 201)

    r = requests.get(f"{BASE}/chat", headers=h_alice)
    print(r.json())
    report("GET /chat (alice)", r.status_code == 200 and len(r.json()) > 0)
    chat_id = r.json()[0]["id"]

    r = requests.get(f"{BASE}/chat", headers=h_bob)
    print(r.json())
    report("GET /chat (bob)", r.status_code == 200 and len(r.json()) > 0)

    r = requests.get(f"{BASE}/chat/{chat_id}", headers=h_alice)
    print(r.json())
    report("GET /chat/<id> (alice)", r.status_code == 200 and len(r.json()) > 0)

    r = requests.post(f"{BASE}/message", json={"recipient_id": alice_id, "text": "Hey Alice!"}, headers=h_bob)
    print(r.json())
    report("POST /message (coach replies)", r.status_code == 201)

    r = requests.put(f"{BASE}/message/{msg1['timestamp']}/hide", headers=h_alice)
    print(r.json())
    report("PUT /message/<id>/hide", r.status_code == 200)

    r = requests.put(f"{BASE}/message/{msg1['timestamp']}/hide", headers=h_alice)
    print(r.json())
    report("PUT /message/<id>/hide (again)", r.status_code == 400)

    r = requests.get(f"{BASE}/chat/99999", headers=h_alice)
    print(r.json())
    report("GET /chat/99999 (not found)", r.status_code == 404)


# ===================================================================
# Admin operations
# ===================================================================
def test_admin():
    print("\n=== Admin ===")

    alice = TOKENS["alice"]
    h_admin = {"Authorization": f"Bearer {TOKENS['admin']}"}

    r = requests.get(f"{BASE}/users", headers=h_admin)
    users = r.json()
    print(r.json())
    report("GET /users (admin lists non-admin users)", r.status_code == 200 and any(u["username"] == "alice" for u in users))

    # Find alice's id from the user list
    alice_user = next(u for u in users if u["username"] == "alice")
    alice_id = alice_user["id"]

    r = requests.get(f"{BASE}/user/{alice_id}/chats", headers=h_admin)
    print(r.json())
    report("GET /user/<id>/chats (admin sees chats)", r.status_code == 200)

    r = requests.put(f"{BASE}/user/{alice_id}/promote", headers=h_admin)
    print(r.json())
    report("PUT /user/<id>/promote (promote alice)", r.status_code == 200 and r.json().get("is_admin") is True)


# ===================================================================
# Delete self
# ===================================================================
def test_delete_own():
    print("\n=== Delete own profile ===")

    r = requests.post(f"{BASE}/register", json={
        "username": "delete_me", "email": "delete@x.com", "password": "deleteme",
    })
    print(r.json())
    if r.status_code != 201:
        report("Setup temp user", False)
        return
    r = requests.post(f"{BASE}/login", json={"login": "delete_me", "password": "deleteme"})
    print(r.json())
    tok = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {tok}"}

    r = requests.delete(f"{BASE}/profile", json={}, headers=headers)
    print(r.json())
    report("DELETE /profile (missing password)", r.status_code == 400)

    r = requests.delete(f"{BASE}/profile", json={"password": "wrong"}, headers=headers)
    print(r.json())
    report("DELETE /profile (wrong password)", r.status_code == 401)

    r = requests.delete(f"{BASE}/profile", json={"password": "deleteme"}, headers=headers)
    print(r.json())
    report("DELETE /profile (valid)", r.status_code == 200)

    r = requests.get(f"{BASE}/check-username/delete_me")
    print(r.json())
    report("Verify username available again", r.status_code == 200 and r.json().get("available") is True)


# ===================================================================
# Edge / validation
# ===================================================================
def test_validation():
    print("\n=== Validation edge cases ===")

    for path, method in [("/register", "POST"), ("/login", "POST")]:
        fn = getattr(requests, method.lower())
        r = fn(f"{BASE}{path}", json=None)
        print(r.json())
        report(f"{method} {path} (no body)", r.status_code == 400)

    r = requests.get(f"{BASE}/nonexistent")
    print(r.json())
    report("GET /nonexistent", r.status_code == 404)


# ===================================================================
# Main
# ===================================================================
if __name__ == "__main__":
    TOKENS = {}

    check_db_state()

    test_availability()
    test_register()
    test_login()
    test_tags()
    test_coaches()
    test_badges()
    test_admin_tag()
    test_profile()
    test_messages()
    test_admin()
    test_delete_own()
    test_validation()

    print("Done.")
