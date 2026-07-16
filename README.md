# MoCoach

***MoCoach** is Mauritius’ first centralized sports and wellness marketplace. It connects local users and tourists with verified coaches through a trusted digital platform, solving the problem of fragmented booking via WhatsApp and Facebook.*

## Getting started

```bash
pip install -r requirements.txt
python app.py
```

The API and front-end are served on `http://localhost:5678`.

## Running tests

```bash
python test.py
```

## Deployment (Railway)

1. Push the repo to GitHub.
2. Create a Railway project from the repo — `requirements.txt` auto-detects Python.
3. Add a **MySQL plugin** (provides `MYSQL_URL` env var).
4. Set `JWT_SECRET_KEY` environment variable to a random secret.
5. Deploy — the `Procfile` starts the app with `gunicorn`.

## Changelog

### July 16, 2026

**Cloudinary Integration — Persistent Image Storage**
- Added `cloudinary` to `requirements.txt`
- Added `profile_pic_url` column to User model (`user.py`)
- Added `gallery_urls` column to Coach model (`coach.py`)
- Configured Cloudinary in `app.py` via `CLOUDINARY_URL` env var
- Rewrote all 7 image functions in `manage_db.py`:
  - `save_profile_picture()` → uploads to Cloudinary, stores URL in DB
  - `get_profile_pic_path()` → reads URL from DB
  - `remove_profile_picture()` → deletes from Cloudinary + DB
  - `save_coach_picture()` → uploads to Cloudinary, stores URL in DB
  - `get_coach_picture_paths()` → reads URLs from DB
  - `remove_coach_picture()` → deletes from Cloudinary + DB
  - `remove_all_coach_pictures()` → clears all from Cloudinary + DB
- Updated serve endpoints in `api_routes.py` to redirect to Cloudinary URLs
- Flow: Coach uploads → Cloudinary stores image → URL saved in MySQL → frontend loads from Cloudinary CDN

**Bug Fixes**
- Fixed gallery picture URL inconsistency (missing leading `/` in `manage_db.py`)
- Fixed broken gallery picture serving endpoint (`api_routes.py` — `in` check always failed due to cache-busting `?t=` suffix)
- Fixed favicon filename mismatch (`favicon-logo_121.png` → `favicon-logo121.png`)

**Deployment**
- Set `CLOUDINARY_URL` environment variable in Railway
- DB migration runs automatically on startup (`ALTER TABLE` for new columns)

### Setup (Post-Deploy)
1. Set `CLOUDINARY_URL` in Railway variables
2. Coaches re-upload profile pictures and gallery photos
