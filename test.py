"""Integration tests for the MoCoach backend API.

Usage:
    python test.py
"""

import io
import os
import subprocess
import sys
import time

import requests
from PIL import Image
from sqlalchemy import create_engine, text

BASE = "http://localhost:5678"
DB_URL = "mysql+mysqldb://emilien:1234@localhost/moCoach"

TABLES = ["users", "coaches", "tags", "coach_tags", "chats", "messages", "badges", "user_badges", "cities", "coach_ratings"]

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


SERVER_PROC = None


def start_server():
    global SERVER_PROC
    if SERVER_PROC is not None:
        SERVER_PROC.kill()
        SERVER_PROC.wait()
    log = open("/tmp/flask-test.log", "w")
    route_py = os.path.join(os.path.dirname(__file__) or ".", "back-end", "routing.py")
    SERVER_PROC = subprocess.Popen(
        [sys.executable, "-u", route_py],
        stdout=log, stderr=subprocess.STDOUT,
    )
    for _ in range(20):
        try:
            r = requests.get("http://localhost:5678/check-username/startupcheck", timeout=2)
            if r.status_code == 200:
                return
        except requests.ConnectionError:
            pass
        time.sleep(0.5)
    print("Failed to start server")
    sys.exit(1)


def check_db_state():
    if tables_are_empty():
        seed_admin_user()
        start_server()
        return

    invalid_count = 0
    while True:
        ans = input("The database tables are not empty. Delete all data? [y/N] ").strip().lower()
        if ans in ("y", "yes"):
            clear_tables()
            seed_admin_user()
            print("Tables cleared, admin seeded.")
            start_server()
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
# Cities (admin create/edit, public read)
# ===================================================================
def test_cities():
    print("\n=== Cities ===")

    # Log in as admin (seeded by seed_admin_user)
    r = requests.post(f"{BASE}/login", json={"login": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        print("  [FAIL] Cannot log in as admin for city setup")
        return
    h_admin = {"Authorization": f"Bearer {r.json()['access_token']}"}

    # Create a default city needed for coach registration
    r = requests.post(f"{BASE}/city", json={"name": "Paris"}, headers=h_admin)
    print(r.json())
    report("POST /city (create Paris)", r.status_code == 201 and r.json().get("name") == "Paris")
    DATA["city_id"] = r.json()["id"]
    paris_id = DATA["city_id"]

    # Get city by id
    r = requests.get(f"{BASE}/city/{paris_id}")
    print(r.json())
    report("GET /city/<id> (Paris)", r.status_code == 200 and r.json().get("name") == "Paris")

    # City not found
    r = requests.get(f"{BASE}/city/9999")
    print(r.json())
    report("GET /city/9999 (not found)", r.status_code == 404)

    # List cities
    r = requests.get(f"{BASE}/city")
    print(r.json())
    report("GET /city (lists Paris)", r.status_code == 200 and any(c["name"] == "Paris" for c in r.json()))

    # Admin creates additional cities for CRUD testing
    r = requests.post(f"{BASE}/city", json={"name": "Lyon"}, headers=h_admin)
    print(r.json())
    report("POST /city (admin creates Lyon)", r.status_code == 201 and r.json().get("name") == "Lyon")
    lyon_id = r.json()["id"]

    r = requests.post(f"{BASE}/city", json={"name": "Toulouse"}, headers=h_admin)
    print(r.json())
    report("POST /city (admin creates Toulouse)", r.status_code == 201 and r.json().get("name") == "Toulouse")
    toulouse_id = r.json()["id"]

    # Duplicate name
    r = requests.post(f"{BASE}/city", json={"name": "Lyon"}, headers=h_admin)
    print(r.text)
    report("POST /city (duplicate name)", r.status_code == 409)

    # Missing fields
    r = requests.post(f"{BASE}/city", json={}, headers=h_admin)
    print(r.json())
    report("POST /city (missing fields)", r.status_code == 400)

    # Create a temp non-admin user for permission tests
    r = requests.post(f"{BASE}/register", json={
        "username": "city_tester", "email": "city_tester@x.com", "password": "testpass8",
    })
    if r.status_code != 201:
        print("  [FAIL] Cannot create temp user for permission tests")
        return
    r = requests.post(f"{BASE}/login", json={"login": "city_tester", "password": "testpass8"})
    h_nonadmin = {"Authorization": f"Bearer {r.json()['access_token']}"}

    # Non-admin cannot create
    r = requests.post(f"{BASE}/city", json={"name": "Marseille"}, headers=h_nonadmin)
    print(r.json())
    report("POST /city (non-admin)", r.status_code == 403)

    # Edit Toulouse name
    r = requests.put(f"{BASE}/city/{toulouse_id}", json={"name": "Toulouse Updated"}, headers=h_admin)
    print(r.json())
    report("PUT /city/<id> (edit name)", r.status_code == 200 and r.json().get("name") == "Toulouse Updated")

    # Rename to existing name (should fail)
    r = requests.put(f"{BASE}/city/{toulouse_id}", json={"name": "Lyon"}, headers=h_admin)
    print(r.json())
    report("PUT /city/<id> (rename to existing name)", r.status_code == 409)

    # Non-admin cannot edit
    r = requests.put(f"{BASE}/city/{paris_id}", json={"name": "x"}, headers=h_nonadmin)
    print(r.json())
    report("PUT /city/<id> (non-admin)", r.status_code == 403)

    # City not found
    r = requests.put(f"{BASE}/city/9999", json={"name": "x"}, headers=h_admin)
    print(r.json())
    report("PUT /city/9999 (not found)", r.status_code == 404)

    # Verify list includes all cities
    r = requests.get(f"{BASE}/city")
    print(r.json())
    names = {c["name"] for c in r.json()}
    report("GET /city (lists all cities)", r.status_code == 200 and "Paris" in names and "Lyon" in names and "Toulouse Updated" in names)


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
        "first_name": "Alice", "phone": "111",
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
        "first_name": "Bob", "last_name": "Builder", "is_coach": True,
        "description": "I am Bob",
        "tags": [{"name": "fitness", "description": "Fitness coaching"}],
        "city_id": DATA["city_id"],
    })
    print(r.json())
    report("POST /register (coach)", r.status_code == 201 and r.json().get("is_coach") is True)
    DATA["bob_id"] = r.json()["id"]
    DATA["bob_coach_id"] = r.json()["coach"]["id"]
    DATA["bob_city"] = r.json()["coach"]["city"]

    r = requests.post(f"{BASE}/register", json={
        "username": "bob2", "email": "bob2@x.com", "password": "bobpass8",
        "first_name": "Bob2", "last_name": "Builder", "is_coach": True,
    })
    print(r.json())
    report("POST /register (coach missing description)", r.status_code == 400)

    r = requests.post(f"{BASE}/register", json={
        "username": "bob3", "email": "bob3@x.com", "password": "bobpass8",
        "first_name": "Bob3", "last_name": "Builder", "is_coach": True,
        "description": "I am Bob3",
        "tags": [{"name": "fitness", "description": "Fitness coaching"}],
    })
    print(r.json())
    report("POST /register (coach missing city_id)", r.status_code == 400)


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
    report("GET /coach (lists coaches)", r.status_code == 200 and any(c["first_name"] == "Bob" for c in coaches))

    bob_coach = next(c for c in coaches if c["first_name"] == "Bob")
    tag_names = {t["name"] for t in bob_coach["tags"]}
    report("GET /coach (bob has fitness tag)", r.status_code == 200 and "fitness" in tag_names)
    report("GET /coach (bob has city)", r.status_code == 200 and bob_coach.get("city") == "Paris")

    # Get bob by ID (coach id = user id in this schema)
    r = requests.get(f"{BASE}/coach/{DATA['bob_coach_id']}")
    print(r.json())
    report("GET /coach/<id> (bob by id)", r.status_code == 200 and r.json().get("first_name") == "Bob")
    report("GET /coach/<id> (bob city)", r.status_code == 200 and r.json().get("city") == "Paris")

    # Not found
    r = requests.get(f"{BASE}/coach/9999")
    print(r.json())
    report("GET /coach/9999 (not found)", r.status_code == 404)

    # Filter by tag
    r = requests.get(f"{BASE}/coach/tag/fitness")
    print(r.json())
    report("GET /coach/tag/fitness (lists bob)", r.status_code == 200 and any(c["first_name"] == "Bob" for c in r.json()))

    # Non-existent tag
    r = requests.get(f"{BASE}/coach/tag/nonexistent")
    print(r.json())
    report("GET /coach/tag/nonexistent (empty)", r.status_code == 200 and r.json() == [])


# ===================================================================
# Search coaches
# ===================================================================
def test_search_coaches():
    print("\n=== Search coaches ===")

    # Register a second coach with different attributes
    r = requests.post(f"{BASE}/register", json={
        "username": "carol", "email": "carol@x.com", "password": "carolpass8",
        "first_name": "Carol", "last_name": "Dancer", "is_coach": True,
        "description": "I teach yoga and nutrition",
        "tags": [{"name": "yoga", "description": "Yoga classes"}],
        "city_id": DATA["city_id"],
    })
    print(r.json())
    report("POST /register (coach carol)", r.status_code == 201 and r.json().get("is_coach") is True)

    # Search by first_name
    r = requests.get(f"{BASE}/coach/search", params={"q": "Bob"})
    print(r.json())
    report("GET /coach/search?q=Bob (by first_name)",
        r.status_code == 200
        and any(c["first_name"] == "Bob" for c in r.json())
        and all(c["first_name"] != "Carol" for c in r.json()))

    # Search by last_name
    r = requests.get(f"{BASE}/coach/search", params={"q": "Builder"})
    print(r.json())
    report("GET /coach/search?q=Builder (by last_name)",
        r.status_code == 200
        and any(c["first_name"] == "Bob" for c in r.json()))

    # Search by username
    r = requests.get(f"{BASE}/coach/search", params={"q": "bob"})
    print(r.json())
    report("GET /coach/search?q=bob (by username)",
        r.status_code == 200
        and any(c["first_name"] == "Bob" for c in r.json()))

    # Search by description
    r = requests.get(f"{BASE}/coach/search", params={"q": "yoga"})
    print(r.json())
    report("GET /coach/search?q=yoga (by description)",
        r.status_code == 200
        and any(c["first_name"] == "Carol" for c in r.json()))

    # Search by tag name
    r = requests.get(f"{BASE}/coach/search", params={"q": "fitness"})
    print(r.json())
    report("GET /coach/search?q=fitness (by tag)",
        r.status_code == 200
        and any(c["first_name"] == "Bob" for c in r.json()))

    # Multiple terms – both must match
    r = requests.get(f"{BASE}/coach/search", params={"q": "Bob yoga"})
    print(r.json())
    report("GET /coach/search?q=Bob+yoga (multi-term, no match)",
        r.status_code == 200 and r.json() == [])

    # Multiple terms – one coach matches all
    r = requests.get(f"{BASE}/coach/search", params={"q": "Carol yoga"})
    print(r.json())
    report("GET /coach/search?q=Carol+yoga (multi-term, match)",
        r.status_code == 200 and any(c["first_name"] == "Carol" for c in r.json()))

    # No match
    r = requests.get(f"{BASE}/coach/search", params={"q": "nonexistent"})
    print(r.json())
    report("GET /coach/search?q=nonexistent (no results)",
        r.status_code == 200 and r.json() == [])

    # Empty query
    r = requests.get(f"{BASE}/coach/search", params={"q": ""})
    print(r.json())
    report("GET /coach/search?q= (empty query)",
        r.status_code == 200 and r.json() == [])

    # No query param at all
    r = requests.get(f"{BASE}/coach/search")
    print(r.json())
    report("GET /coach/search (no param)",
        r.status_code == 200 and r.json() == [])


# ===================================================================
# Badges
# ===================================================================
def test_badges():
    print("\n=== Badges ===")

    h_admin = {"Authorization": f"Bearer {TOKENS['admin']}"}
    h_alice = {"Authorization": f"Bearer {TOKENS['alice']}"}
    h_bob = {"Authorization": f"Bearer {TOKENS['bob']}"}

    # Admin creates badges
    r = requests.post(f"{BASE}/badge", json={"name": "top coach", "description": "Awarded to top coaches", "for_coach": True}, headers=h_admin)
    print(r.json())
    report("POST /badge (create coach badge)", r.status_code == 201 and r.json().get("name") == "top coach")
    DATA["coach_badge_id"] = r.json()["id"]

    r = requests.post(f"{BASE}/badge", json={"name": "star client", "description": "Awarded to star clients", "for_coach": False}, headers=h_admin)
    print(r.json())
    report("POST /badge (create customer badge)", r.status_code == 201 and r.json().get("name") == "star client")
    DATA["cust_badge_id"] = r.json()["id"]

    # List all badges
    r = requests.get(f"{BASE}/badge/all")
    print(r.json())
    report("GET /badge/all (lists badges)", r.status_code == 200 and len(r.json()) == 2)

    # Non-admin cannot create
    r = requests.post(f"{BASE}/badge", json={"name": "x", "description": "test", "for_coach": True}, headers=h_alice)
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

    # Customer → Admin (admins cannot receive badges)
    r = requests.get(f"{BASE}/profile/1",
        headers={"Authorization": f"Bearer {TOKENS['admin']}"})
    print(r.json())
    admin_user_id = r.json()["id"]
    r = requests.post(f"{BASE}/badge/give", json={
        "user_id": admin_user_id, "badge_id": DATA["coach_badge_id"],
    }, headers=h_alice)
    print(r.json())
    report("POST /badge/give (customer→admin)", r.status_code == 400 and "Admins cannot give or receive badges" in r.json().get("msg", ""))

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
        json={"description": "Updated description"}, headers=h_admin)
    print(r.json())
    report("PUT /badge/<id> (edit description)", r.status_code == 200 and r.json().get("description") == "Updated description")

    # Reset description back
    requests.put(f"{BASE}/badge/{DATA['coach_badge_id']}",
        json={"description": "Awarded to top coaches"}, headers=h_admin)

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

    r = requests.put(f"{BASE}/profile", json={"first_name": "X"})
    print(r.json())
    report("PUT /profile (no token)", r.status_code == 401)

    r = requests.put(f"{BASE}/profile", json={"first_name": "Alice", "last_name": "Updated"}, headers=headers_alice)
    print(r.json())
    report("PUT /profile (update name)", r.status_code == 200 and r.json().get("first_name") == "Alice" and r.json().get("last_name") == "Updated")

    uid = r.json()["id"]
    r = requests.get(f"{BASE}/profile/{uid}", headers=headers_alice)
    print(r.json())
    report("GET /profile/<own>", r.status_code == 200 and r.json().get("first_name") == "Alice" and r.json().get("last_name") == "Updated")

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

    alice_id = DATA["alice_id"]
    bob_id = DATA["bob_id"]

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

    r = requests.put(f"{BASE}/message/{msg1['id']}/hide", headers=h_alice)
    print(r.json())
    report("PUT /message/<id>/hide", r.status_code == 200)

    r = requests.put(f"{BASE}/message/{msg1['id']}/hide", headers=h_alice)
    print(r.json())
    report("PUT /message/<id>/hide (again)", r.status_code == 400)

    r = requests.get(f"{BASE}/chat/99999", headers=h_alice)
    print(r.json())
    report("GET /chat/99999 (not found)", r.status_code == 404)


# ===================================================================
# Picture management
# ===================================================================
def test_pictures():
    print("\n=== Picture management ===")



    alice = TOKENS["alice"]
    bob = TOKENS["bob"]
    h_alice = {"Authorization": f"Bearer {alice}"}
    h_bob = {"Authorization": f"Bearer {bob}"}
    bob_id = DATA["bob_id"]

    # Helper to create a test image
    def make_image(w, h, fmt="JPEG"):
        img = Image.new("RGB", (w, h), color=(255, 0, 0))
        buf = io.BytesIO()
        img.save(buf, fmt)
        buf.seek(0)
        return buf

    # ------------------------------------------------------------------
    # Profile picture (customer)
    # ------------------------------------------------------------------

    # Profile picture not present yet
    r = requests.get(f"{BASE}/profile/picture/{DATA['alice_id']}")
    print(f"GET /profile/picture/<alice> (absent) -> {r.status_code}")
    report("GET /profile/picture/<alice> (absent serves default)", r.status_code == 200)

    # Non-existent user — default picture is served
    r = requests.get(f"{BASE}/profile/picture/99999")
    print(f"GET /profile/picture/99999 -> {r.status_code}")
    report("GET /profile/picture/99999 (non-existent uses default)", r.status_code == 200)

    # Upload profile picture
    buf = make_image(800, 600, "PNG")
    r = requests.post(f"{BASE}/profile/picture", files={"file": ("avatar.png", buf)}, headers=h_alice)
    print(r.json())
    report("POST /profile/picture (upload)", r.status_code == 200 and "profile_pic" in r.json())
    DATA["alice_pic_path"] = r.json()["profile_pic"]

    # Profile picture served
    r = requests.get(f"{BASE}/profile/picture/{DATA['alice_id']}")
    report("GET /profile/picture/<alice> (serves uploaded)", r.status_code == 200)

    # Replace profile picture
    buf2 = make_image(100, 400)
    r = requests.post(f"{BASE}/profile/picture", files={"file": ("new.png", buf2)}, headers=h_alice)
    print(r.json())
    report("POST /profile/picture (replace)", r.status_code == 200 and r.json().get("profile_pic") == DATA["alice_pic_path"])

    # Without auth
    r = requests.post(f"{BASE}/profile/picture", files={"file": ("x.jpg", make_image(10, 10))})
    report("POST /profile/picture (no auth)", r.status_code == 401)

    # Bad extension
    r = requests.post(f"{BASE}/profile/picture",
        files={"file": ("bad.txt", io.BytesIO(b"not-an-image"))}, headers=h_alice)
    print(r.json())
    report("POST /profile/picture (bad extension)", r.status_code == 400)

    # Missing file
    r = requests.post(f"{BASE}/profile/picture", data={}, headers=h_alice)
    print(r.json())
    report("POST /profile/picture (no file)", r.status_code == 400)

    # ------------------------------------------------------------------
    # Coach pictures
    # ------------------------------------------------------------------

    # Upload coach picture 1
    buf3 = make_image(800, 600, "PNG")
    r = requests.post(f"{BASE}/coach/picture/1", files={"file": ("pic1.png", buf3)}, headers=h_bob)
    print(r.json())
    report("POST /coach/picture/1 (upload)", r.status_code == 200 and "picture" in r.json())
    pic1_path = r.json()["picture"]

    # Upload coach picture 3 (skip 2)
    buf4 = make_image(200, 400)
    r = requests.post(f"{BASE}/coach/picture/3", files={"file": ("pic3.jpg", buf4)}, headers=h_bob)
    print(r.json())
    report("POST /coach/picture/3 (upload)", r.status_code == 200)
    pic3_path = r.json()["picture"]

    # Replace coach picture 1
    buf5 = make_image(300, 300)
    r = requests.post(f"{BASE}/coach/picture/1", files={"file": ("new1.jpg", buf5)}, headers=h_bob)
    print(r.json())
    report("POST /coach/picture/1 (replace)", r.status_code == 200 and r.json()["picture"] == pic1_path)

    # Serve coach picture 1
    r = requests.get(f"{BASE}/coach/picture/{bob_id}/1")
    report(f"GET /coach/picture/{bob_id}/1 -> {r.status_code}", r.status_code == 200)

    # Serve coach picture 2 (not uploaded)
    r = requests.get(f"{BASE}/coach/picture/{bob_id}/2")
    report(f"GET /coach/picture/{bob_id}/2 (absent) -> {r.status_code}", r.status_code == 204)

    # Serve coach picture 3
    r = requests.get(f"{BASE}/coach/picture/{bob_id}/3")
    report(f"GET /coach/picture/{bob_id}/3 -> {r.status_code}", r.status_code == 200)

    # Coach's public profile includes pictures list
    r = requests.get(f"{BASE}/coach/{DATA['bob_coach_id']}")
    print(r.json().get("pictures"))
    pics = r.json().get("pictures", [])
    report("GET /coach/<bob> includes pictures",
        r.status_code == 200
        and pic1_path in pics
        and pic3_path in pics
        and len(pics) == 2)

    # Invalid numero (0)
    r = requests.post(f"{BASE}/coach/picture/0",
        files={"file": ("x.jpg", make_image(10, 10))}, headers=h_bob)
    print(r.json())
    report("POST /coach/picture/0 (invalid numero)", r.status_code == 400)

    # Invalid numero (8)
    r = requests.post(f"{BASE}/coach/picture/8",
        files={"file": ("x.jpg", make_image(10, 10))}, headers=h_bob)
    print(r.json())
    report("POST /coach/picture/8 (invalid numero)", r.status_code == 400)

    # Without auth
    r = requests.post(f"{BASE}/coach/picture/1",
        files={"file": ("x.jpg", make_image(10, 10))})
    report("POST /coach/picture/1 (no auth)", r.status_code == 401)

    # Bad extension
    r = requests.post(f"{BASE}/coach/picture/2",
        files={"file": ("bad.txt", io.BytesIO(b"not-an-image"))}, headers=h_bob)
    print(r.json())
    report("POST /coach/picture/2 (bad extension)", r.status_code == 400)

    # Missing file
    r = requests.post(f"{BASE}/coach/picture/1", data={}, headers=h_bob)
    print(r.json())
    report("POST /coach/picture/1 (no file)", r.status_code == 400)

    # Not a coach can still upload (any authenticated user can use the endpoint)
    # but pictures only show in coach profile
    r = requests.post(f"{BASE}/coach/picture/1",
        files={"file": ("x.jpg", make_image(10, 10))}, headers=h_alice)
    print(r.json())
    report("POST /coach/picture/1 (non-coach can upload)", r.status_code == 200)


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
        r = fn(f"{BASE}{path}", data='', headers={"Content-Type": "application/json"})
        print(f"------------------------------------------------------------------\n{r.text}\n------------------------------------------------------------------")
        report(f"{method} {path} (no body)", r.status_code == 400)

    r = requests.get(f"{BASE}/nonexistent")
    print(f"------------------------------------------------------------------\n{r.text}\n------------------------------------------------------------------")
    report("GET /nonexistent", r.status_code == 404)


# ===================================================================
# Ratings
# ===================================================================
def test_ratings():
    print("\n=== Ratings ===")

    # Register a second customer for multi-voter tests
    r = requests.post(f"{BASE}/register", json={
        "username": "charlie", "email": "charlie@x.com", "password": "charliepass",
        "first_name": "Charlie",
    })
    if r.status_code != 201:
        report("Setup charlie customer", False)
        return
    charlie_id = r.json()["id"]
    r = requests.post(f"{BASE}/login", json={"login": "charlie", "password": "charliepass"})
    if r.status_code != 200:
        report("Login charlie", False)
        return
    TOKENS["charlie"] = r.json()["access_token"]

    h_alice = {"Authorization": f"Bearer {TOKENS['alice']}"}
    h_charlie = {"Authorization": f"Bearer {TOKENS['charlie']}"}
    h_bob = {"Authorization": f"Bearer {TOKENS['bob']}"}
    bob_coach_id = DATA["bob_coach_id"]

    # Customer gives thumbs up
    r = requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={"rating": True}, headers=h_alice)
    print(r.json())
    report("POST /coach/<id>/rate (thumbs up)", r.status_code == 200)

    r = requests.get(f"{BASE}/coach/{bob_coach_id}")
    print(r.json())
    report("GET /coach/<id> (thumbs_up=1 after up)",
        r.status_code == 200 and r.json().get("thumbs_up") == 1 and r.json().get("thumbs_down") == 0)

    # Customer switches to thumbs down
    r = requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={"rating": False}, headers=h_alice)
    print(r.json())
    report("POST /coach/<id>/rate (switch to down)", r.status_code == 200)

    r = requests.get(f"{BASE}/coach/{bob_coach_id}")
    print(r.json())
    report("GET /coach/<id> (thumbs_down=1 after switch)",
        r.status_code == 200 and r.json().get("thumbs_up") == 0 and r.json().get("thumbs_down") == 1)

    # Customer removes rating
    r = requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={"rating": None}, headers=h_alice)
    print(r.json())
    report("POST /coach/<id>/rate (remove rating)", r.status_code == 200)

    r = requests.get(f"{BASE}/coach/{bob_coach_id}")
    print(r.json())
    report("GET /coach/<id> (both 0 after remove)",
        r.status_code == 200 and r.json().get("thumbs_up") == 0 and r.json().get("thumbs_down") == 0)

    # Two customers vote: alice up, charlie down
    requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={"rating": True}, headers=h_alice)

    r = requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={"rating": False}, headers=h_charlie)
    print(r.json())
    report("POST /coach/<id>/rate (charlie thumbs down)", r.status_code == 200)

    r = requests.get(f"{BASE}/coach/{bob_coach_id}")
    print(r.json())
    report("GET /coach/<id> (up=1, down=1)",
        r.status_code == 200 and r.json().get("thumbs_up") == 1 and r.json().get("thumbs_down") == 1)

    # Coach cannot rate
    r = requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={"rating": True}, headers=h_bob)
    print(r.json())
    report("POST /coach/<id>/rate (coach cannot rate)", r.status_code == 403)

    # Unauthenticated
    r = requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={"rating": True})
    print(r.json())
    report("POST /coach/<id>/rate (no auth)", r.status_code == 401)

    # Missing rating field
    r = requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={}, headers=h_alice)
    print(r.json())
    report("POST /coach/<id>/rate (missing rating)", r.status_code == 400)

    # Non-boolean rating
    r = requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={"rating": "up"}, headers=h_alice)
    print(r.json())
    report("POST /coach/<id>/rate (string rating)", r.status_code == 400)

    # Non-existent coach
    r = requests.post(f"{BASE}/coach/9999/rate",
        json={"rating": True}, headers=h_alice)
    print(r.json())
    report("POST /coach/9999/rate (not found)", r.status_code == 404)

    # Cleanup: remove votes
    requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={"rating": None}, headers=h_alice)
    requests.post(f"{BASE}/coach/{bob_coach_id}/rate",
        json={"rating": None}, headers=h_charlie)


# ===================================================================
# Main
# ===================================================================
if __name__ == "__main__":
    TOKENS = {}

    check_db_state()

    test_availability()
    test_cities()
    test_register()
    test_login()
    test_tags()
    test_coaches()
    test_search_coaches()
    test_pictures()
    test_badges()
    test_admin_tag()
    test_profile()
    test_messages()
    test_ratings()
    test_admin()
    test_delete_own()
    test_validation()

    if SERVER_PROC:
        SERVER_PROC.kill()
        SERVER_PROC.wait()
    print("Done.")
