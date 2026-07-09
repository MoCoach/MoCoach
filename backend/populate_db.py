#!/usr/bin/env python3
"""Populate the MoCoach database from temp_*.csv files."""

import csv
import os
import re
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from classes import Base
from classes.city import City
from classes.tag import Tag
from classes.user import User
from classes.coach import Coach
from classes.badge import Badge

_RAW_DB_URL = os.environ.get("MYSQL_URL", "mysql+mysqldb://emilien:1234@localhost/moCoach")
DB_URL = _RAW_DB_URL.replace("mysql://", "mysql+pymysql://", 1) if _RAW_DB_URL.startswith("mysql://") else _RAW_DB_URL
DIR = os.path.dirname(os.path.abspath(__file__))

_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
_USERNAME_RE = re.compile(r'^[a-zA-Z0-9_]+$')


def warn(csv_name, line_num, msg):
    print(f"  {csv_name} : line {line_num} : {msg}")


def process_cities(session, path):
    csv_name = os.path.basename(path)
    with open(path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    total = len(rows)
    ok = 0
    errors = 0
    for i, row in enumerate(rows, start=2):
        name = row.get("Name", "").strip()
        if not name:
            warn(csv_name, i, "missing city name")
            errors += 1
            continue
        existing = session.query(City).filter_by(name=name).first()
        if existing:
            continue
        try:
            city = City(name=name)
            session.add(city)
            session.flush()
            ok += 1
        except (TypeError, ValueError) as e:
            session.rollback()
            warn(csv_name, i, str(e))
            errors += 1
    print(f"{ok}/{total} successful inserts, {errors} errors.")


def process_tags(session, path):
    csv_name = os.path.basename(path)
    with open(path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    total = len(rows)
    ok = 0
    errors = 0
    for i, row in enumerate(rows, start=2):
        name = row.get("name", "").strip()
        desc = row.get("description", "").strip()
        if not name:
            warn(csv_name, i, "missing tag name")
            errors += 1
            continue
        if not desc:
            warn(csv_name, i, f"tag '{name}' has no description")
            errors += 1
            continue
        existing = session.query(Tag).filter_by(name=name).first()
        if existing:
            if existing.description == desc:
                continue
            else:
                warn(csv_name, i, f"tag '{name}' already exists")
                errors += 1
                continue
        try:
            tag = Tag(name=name, description=desc)
            session.add(tag)
            session.flush()
            ok += 1
        except (TypeError, ValueError) as e:
            session.rollback()
            warn(csv_name, i, str(e))
            errors += 1
    print(f"{ok}/{total} successful inserts, {errors} errors.")


def _make_username(first, last):
    base = f"{first}.{last}".lower()
    base = re.sub(r'[^a-zA-Z0-9_.]', '', base)
    return base.strip('.')


def _user_unchanged(user, row, cities):
    role = row.get("Role", "").strip().lower()
    first = row.get("First Name (opt)", "").strip()
    last = row.get("Last Name (opt)", "").strip()
    email = row.get("Email", "").strip()
    password = row.get("Password", "").strip()
    phone = row.get("Phone (opt)", "").strip()
    tags_str = row.get("Tags (opt, 5 max)", "").strip()
    city_name = row.get("City", "").strip()
    description = row.get("Description", "").strip()
    price_str = row.get("Price (opt)", "").strip()

    is_coach = role == "coach"
    is_admin = role == "admin"

    if user.email != email:
        return False
    if not user.verify_pwd(password):
        return False
    if user.is_coach != is_coach:
        return False
    if user.is_admin != is_admin:
        return False
    if user.first_name != (first or None):
        return False
    if user.last_name != (last or None):
        return False
    if user.phone != (phone or None):
        return False

    if is_coach:
        if not user.coach:
            return False
        if user.coach.description != description:
            return False
        expected_city = cities.get(city_name)
        if expected_city and user.coach.city_id != expected_city.id:
            return False
        if price_str:
            try:
                expected_price = int(price_str)
            except ValueError:
                return False
            if user.coach.price != expected_price:
                return False
        expected_tag_names = set(
            t.strip() for t in tags_str.split(",") if t.strip()
        ) if tags_str else set()
        actual_tag_names = set(t.name for t in user.coach.tags)
        if expected_tag_names != actual_tag_names:
            return False

    return True


def process_users(session, path):
    csv_name = os.path.basename(path)

    cities = {c.name: c for c in session.query(City).all()}
    tags_map = {t.name: t for t in session.query(Tag).all()}

    with open(path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    total = len(rows)
    ok = 0
    errors = 0

    for i, row in enumerate(rows, start=2):
        role = row.get("Role", "").strip().lower()
        first = row.get("First Name (opt)", "").strip()
        last = row.get("Last Name (opt)", "").strip()
        email = row.get("Email", "").strip()
        password = row.get("Password", "").strip()
        phone = row.get("Phone (opt)", "").strip()
        tags_str = row.get("Tags (opt, 5 max)", "").strip()
        city_name = row.get("City", "").strip()
        description = row.get("Description", "").strip()
        price_str = row.get("Price (opt)", "").strip()

        is_coach = role == "coach"
        is_admin = role == "admin"

        if role not in ("user", "coach", "admin"):
            warn(csv_name, i, f"unknown role '{role}'")
            errors += 1
            continue

        username = row.get("Username", "").strip()
        if not username:
            username = _make_username(first, last)
        if not username or not _USERNAME_RE.match(username):
            warn(csv_name, i, f"invalid username '{username}'")
            errors += 1
            continue

        if not email or not _EMAIL_RE.match(email):
            warn(csv_name, i, f"invalid or missing email '{email}'")
            errors += 1
            continue

        if not password:
            warn(csv_name, i, "missing password")
            errors += 1
            continue

        existing = session.query(User).filter_by(username=username).first()
        if existing:
            if _user_unchanged(existing, row, cities):
                continue
            else:
                warn(csv_name, i, f"username '{username}' already exists")
                errors += 1
                continue

        city_id = None
        tag_objects = []
        price = None

        if is_coach:
            if not city_name or city_name not in cities:
                if city_name and city_name not in cities:
                    warn(csv_name, i, f"city '{city_name}' not found")
                else:
                    warn(csv_name, i, "missing city")
                errors += 1
                continue

            city_id = cities[city_name].id

            if not description:
                warn(csv_name, i, "missing description")
                errors += 1
                continue

            if tags_str:
                for tn in (t.strip() for t in tags_str.split(",") if t.strip()):
                    if tn in tags_map:
                        tag_objects.append(tags_map[tn])
                    else:
                        warn(csv_name, i, f"tag '{tn}' not found in database")

            if price_str:
                try:
                    price = int(price_str)
                except ValueError:
                    warn(csv_name, i, f"invalid price '{price_str}'")
                    errors += 1
                    continue

        try:
            user = User(
                username=username,
                email=email,
                pwd=password,
                is_coach=is_coach,
                description=description if is_coach else None,
                first_name=first or None,
                last_name=last or None,
                phone=phone or None,
                is_admin=is_admin,
                city_id=city_id,
                price=price,
                ip_address=None,
            )
            if is_coach and tag_objects:
                for tag in tag_objects:
                    user.coach.add_tag(tag)
            session.add(user)
            session.flush()
            ok += 1
        except (TypeError, ValueError) as e:
            session.rollback()
            warn(csv_name, i, str(e))
            errors += 1
    print(f"{ok}/{total} successful inserts, {errors} errors.")


def process_badges(session, path):
    csv_name = os.path.basename(path)
    with open(path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    total = len(rows)
    ok = 0
    errors = 0
    for i, row in enumerate(rows, start=2):
        name = row.get("name", "").strip()
        desc = row.get("description", "").strip()
        for_coach = row.get("for_coach", "").strip().lower() == "true"
        if not name:
            warn(csv_name, i, "missing badge name")
            errors += 1
            continue
        existing = session.query(Badge).filter_by(name=name).first()
        if existing:
            continue
        try:
            badge = Badge(name=name, description=desc, for_coach=for_coach)
            session.add(badge)
            session.flush()
            ok += 1
        except (TypeError, ValueError) as e:
            warn(csv_name, i, str(e))
            errors += 1
    print(f"{ok}/{total} successful inserts, {errors} errors.")


def main():
    engine = create_engine(DB_URL)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        csv_order = ["temp_cities.csv", "temp_tags.csv", "temp_badges.csv", "temp_users.csv"]
        for filename in csv_order:
            path = os.path.join(DIR, filename)
            if not os.path.exists(path):
                continue
            print(f"Processing {filename} ...")
            if filename == "temp_cities.csv":
                process_cities(session, path)
            elif filename == "temp_tags.csv":
                process_tags(session, path)
            elif filename == "temp_badges.csv":
                process_badges(session, path)
            elif filename == "temp_users.csv":
                process_users(session, path)
        session.commit()
        print("Done.")
    except Exception as e:
        session.rollback()
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
