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

DB_URL = "mysql+mysqldb://emilien:1234@localhost/moCoach"
DIR = os.path.dirname(os.path.abspath(__file__))

_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
_USERNAME_RE = re.compile(r'^[a-zA-Z0-9_]+$')


def warn(csv_name, line_num, msg):
    print(f"  {csv_name} : line {line_num} : {msg}")


def process_cities(session, path):
    csv_name = os.path.basename(path)
    with open(path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    for i, row in enumerate(rows, start=2):
        name = row.get("Name", "").strip()
        if not name:
            warn(csv_name, i, "missing city name")
            continue
        existing = session.query(City).filter_by(name=name).first()
        if existing:
            warn(csv_name, i, f"city '{name}' already exists")
            continue
        try:
            city = City(name=name)
            session.add(city)
            session.flush()
        except (TypeError, ValueError) as e:
            session.rollback()
            warn(csv_name, i, str(e))


def process_tags(session, path):
    csv_name = os.path.basename(path)
    with open(path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    for i, row in enumerate(rows, start=2):
        name = row.get("name", "").strip()
        desc = row.get("description", "").strip()
        if not name:
            warn(csv_name, i, "missing tag name")
            continue
        if not desc:
            warn(csv_name, i, f"tag '{name}' has no description")
            continue
        existing = session.query(Tag).filter_by(name=name).first()
        if existing:
            warn(csv_name, i, f"tag '{name}' already exists")
            continue
        try:
            tag = Tag(name=name, description=desc)
            session.add(tag)
            session.flush()
        except (TypeError, ValueError) as e:
            session.rollback()
            warn(csv_name, i, str(e))


def _make_username(first, last):
    base = f"{first}.{last}".lower()
    base = re.sub(r'[^a-zA-Z0-9_.]', '', base)
    return base.strip('.')


def process_users(session, path):
    csv_name = os.path.basename(path)

    cities = {c.name: c for c in session.query(City).all()}
    tags_map = {t.name: t for t in session.query(Tag).all()}

    with open(path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))

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
            continue

        username = row.get("Username", "").strip()
        if not username:
            username = _make_username(first, last)
        if not username or not _USERNAME_RE.match(username):
            warn(csv_name, i, f"invalid username '{username}'")
            continue

        if not email or not _EMAIL_RE.match(email):
            warn(csv_name, i, f"invalid or missing email '{email}'")
            continue

        if not password:
            warn(csv_name, i, "missing password")
            continue

        if session.query(User).filter_by(username=username).first():
            warn(csv_name, i, f"username '{username}' already exists")
            continue

        if session.query(User).filter_by(email=email).first():
            warn(csv_name, i, f"email '{email}' already exists")
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
                continue

            city_id = cities[city_name].id

            if not description:
                warn(csv_name, i, "missing description")
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
                    continue

        try:
            user = User(
                username=username,
                email=email,
                pwd=password,
                is_coach=is_coach,
                description=description if is_coach else None,
                name=" ".join(filter(None, [first, last])) or None,
                phone=phone or None,
                is_admin=is_admin,
                city_id=city_id,
                price=price,
            )
            if is_coach and tag_objects:
                for tag in tag_objects:
                    user.coach.add_tag(tag)
            session.add(user)
            session.flush()
        except (TypeError, ValueError) as e:
            session.rollback()
            warn(csv_name, i, str(e))


def main():
    engine = create_engine(DB_URL)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        csv_order = ["temp_cities.csv", "temp_tags.csv", "temp_users.csv"]
        for filename in csv_order:
            path = os.path.join(DIR, filename)
            if not os.path.exists(path):
                continue
            print(f"Processing {filename} ...")
            if filename == "temp_cities.csv":
                process_cities(session, path)
            elif filename == "temp_tags.csv":
                process_tags(session, path)
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
