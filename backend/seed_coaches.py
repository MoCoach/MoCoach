#!/usr/bin/env python3
"""Seed the database with 27 coaches (3 per category) with auto-generated data and stock photos."""

import io
import json
import os
import random
import sys
import time
import urllib.request
import urllib.error

from PIL import Image

API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:5678")
PASSWORD = "password123"
DELAY = 13

FIRST_NAMES = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph",
    "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Steven",
    "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia",
    "Harper", "Evelyn", "Abigail", "Emily", "Ella", "Scarlett", "Grace",
    "Liam", "Noah", "Oliver", "Elijah", "Lucas", "Mason", "Logan", "Alexander",
    "Ethan", "Jacob", "Henry", "Sebastian", "Jack", "Aiden", "Owen",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
]

CATEGORIES = [
    {
        "name": "Strength",
        "tags": ["Strength Training"],
        "keywords": ["dumbbell", "gym", "weightlifting"],
        "bios": [
            "Certified strength coach with 8 years of experience helping clients build muscle and confidence.",
            "Passionate about functional strength training and helping you reach your fitness goals.",
            "Specializing in powerlifting and strength conditioning for all fitness levels.",
        ],
    },
    {
        "name": "Court Games",
        "tags": ["Tennis", "Badminton"],
        "keywords": ["tennis", "badminton", "court"],
        "bios": [
            "Former competitive tennis player turned coach. Let me help you master your serve and footwork.",
            "Badminton enthusiast with a knack for teaching beginners and intermediate players alike.",
            "Court sports specialist focusing on technique, agility, and competitive strategy.",
        ],
    },
    {
        "name": "Yoga",
        "tags": ["Yoga"],
        "keywords": ["yoga", "meditation", "stretch"],
        "bios": [
            "Certified yoga instructor blending traditional practices with modern mindfulness techniques.",
            "Helping clients find balance and inner peace through personalized yoga sessions.",
            "Vinyasa and Hatha yoga specialist with a focus on breath work and flexibility.",
        ],
    },
    {
        "name": "Hiking",
        "tags": ["Hiking"],
        "keywords": ["hiking", "mountain", "trail"],
        "bios": [
            "Outdoor enthusiast and certified hiking guide. Explore Mauritius trails with confidence.",
            "Passionate about nature and fitness. Let's conquer mountains together.",
            "Experienced trail guide specializing in beginner-friendly and advanced hiking routes.",
        ],
    },
    {
        "name": "Prenatal",
        "tags": ["Yoga", "Hiking"],
        "keywords": ["fitness", "wellness", "stretch"],
        "bios": [
            "Specialized in prenatal and postnatal fitness, helping new moms stay strong and healthy.",
            "Certified pregnancy fitness instructor focusing on safe and effective workouts.",
            "Supporting women through every stage of pregnancy with tailored fitness programs.",
        ],
    },
    {
        "name": "Island Water",
        "tags": ["Swimming", "Water Sports", "Surfing"],
        "keywords": ["swimming", "ocean", "surf"],
        "bios": [
            "Water sports enthusiast and certified swimming instructor. Make waves with confidence.",
            "From surfing to snorkeling, I'll help you master the ocean and its wonders.",
            "Passionate about aquatic fitness and water safety. Dive into a healthier lifestyle.",
        ],
    },
    {
        "name": "Cardio & HIIT",
        "tags": ["Zumba", "Strength Training"],
        "keywords": ["running", "cardio", "fitness"],
        "bios": [
            "High-energy cardio and HIIT specialist. Get ready to sweat and smile.",
            "Former athlete turned fitness coach. Push your limits with dynamic interval training.",
            "Certified in cardio conditioning and HIIT. Let's crush your fitness goals together.",
        ],
    },
    {
        "name": "Martial Arts",
        "tags": ["Boxing", "Taekwondo"],
        "keywords": ["boxing", "martial arts", "karate"],
        "bios": [
            "Black belt in Taekwondo with 10+ years of teaching experience.",
            "Boxing coach focused on technique, discipline, and building confidence.",
            "Martial arts practitioner blending traditional techniques with modern fitness.",
        ],
    },
    {
        "name": "Ball Games",
        "tags": ["Football", "Basketball", "Rugby"],
        "keywords": ["football", "basketball", "soccer"],
        "bios": [
            "Former professional football player turned youth coach. Pass, kick, and score!",
            "Basketball specialist with a passion for developing young talent.",
            "Rugby coach focused on teamwork, strength, and on-field strategy.",
        ],
    },
]


def download_image(keyword, size=400):
    """Download a stock photo and return JPEG bytes."""
    urls = [
        f"https://loremflickr.com/{size}/{size}/{keyword}",
        f"https://picsum.photos/{size}/{size}?random={random.randint(1, 99999)}",
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw = resp.read()
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            img.thumbnail((size, size), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, "JPEG", quality=85)
            return buf.getvalue()
        except Exception:
            continue
    img = Image.new("RGB", (size, size), (120, 120, 120))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=85)
    return buf.getvalue()


def api_get(path):
    req = urllib.request.Request(f"{API_BASE}{path}")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def api_post_json(path, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{API_BASE}{path}", data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read())
        except Exception:
            return {"msg": f"HTTP {e.code}"}


def api_upload(path, image_bytes, filename, token):
    boundary = "----BoundarySeed"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode() + image_bytes + f"\r\n--{boundary}--\r\n".encode()
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Authorization": f"Bearer {token}",
    }
    req = urllib.request.Request(f"{API_BASE}{path}", data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read())
        except Exception:
            return {"msg": f"HTTP {e.code}"}


def main():
    try:
        cities = api_get("/api/v1/city")
    except Exception:
        print("ERROR: Cannot reach the API. Is the app running?")
        sys.exit(1)

    if not cities:
        print("ERROR: No cities found in the database.")
        sys.exit(1)

    print(f"Found {len(cities)} cities. Creating 27 coaches (3 per category)...\n")

    used_names = set()
    total = 0

    for cat in CATEGORIES:
        print(f"--- {cat['name']} ---")
        for i in range(3):
            total += 1

            while True:
                first = random.choice(FIRST_NAMES)
                last = random.choice(LAST_NAMES)
                username = f"{first.lower()}_{last.lower()}"
                if username not in used_names:
                    used_names.add(username)
                    break

            email = f"{username}@example.com"
            city = random.choice(cities)
            bio = random.choice(cat["bios"])
            price = random.randint(30, 100)

            result = api_post_json("/api/v1/register", {
                "username": username,
                "email": email,
                "password": PASSWORD,
                "is_coach": True,
                "first_name": first,
                "last_name": last,
                "description": bio,
                "tags": cat["tags"],
                "city_id": city["id"],
                "price": price,
            })

            if "id" not in result:
                msg = result.get("msg", "unknown error")
                print(f"  [{total}/27] SKIP {username} - {msg}")
                time.sleep(DELAY)
                continue

            print(f"  [{total}/27] {username} | {email} | Pass: {PASSWORD} | {city['name']} | {', '.join(cat['tags'])}")

            login = api_post_json("/api/v1/login", {"login": username, "password": PASSWORD})
            token = login.get("access_token")
            if not token:
                print(f"    Login failed")
                time.sleep(DELAY)
                continue

            pic = download_image(cat["keywords"][0])
            api_upload("/api/v1/profile/picture", pic, "profile.jpg", token)
            print(f"    + profile pic")

            for j in range(3):
                kw = cat["keywords"][j % len(cat["keywords"])]
                gp = download_image(kw)
                api_upload(f"/api/v1/coach/picture/{j + 1}", gp, f"{j + 1}.jpg", token)
            print(f"    + 3 gallery pics")

            time.sleep(DELAY)

    print(f"\nDone! Created {total} coaches. All passwords: {PASSWORD}")


if __name__ == "__main__":
    main()
